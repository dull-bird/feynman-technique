#!/usr/bin/env python3
"""双 agent 真实费曼会话（pexpect 驱动，仅标准库 + pexpect）。

两个互不知情的独立 agent 进程：
  听众   = claude -p（加载 method.md 真实听众规则 + 准备定标）
  讲解者 = codex exec（只拿到人设和"自己的知识缺口"，看不到听众规则）

逐轮交替，全程落 transcript，结束后由听众独立评定，
经 feynman_log.py log 落账。这才是「真实对话」——不是单 AI 唱双簧。

用法：
  python3 real_session.py --concept "复利" --gaps "以为利息按本金计算;说不清银行为什么付息" \
      [--max-rounds 10] [--learner-cmd "codex exec"] [--listener-cmd "claude -p"]
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time

import pexpect

HERE = os.path.dirname(os.path.abspath(__file__))
METHOD_MD = os.path.join(HERE, "..", "references", "method.md")

LISTENER_OPENING = "准备好当你的费曼听众了。请从最基础的地方开始讲。"

LISTENER_PERSONA = """你是一场费曼学习法对话的听众。规则（必须严格遵守）：
1. 你是零基础但逻辑严谨的听众。用户负责讲，你只负责复述和追问，绝不替用户讲完。
2. 每轮只问一个最关键的问题，必须引用对方原话。
3. 盲区分类（选一个）：factual-error 事实错误 / jargon-dodge 术语循环 / causal-gap 因果缺口 / mechanism-blackbox 机制黑盒 / boundary-blur 边界模糊 / broken-analogy 类比失灵 / edge-case-blind 边界盲。事实错误优先。
4. 对方说"不知道"或打太极时：指出盲区，可给一段 60-100 字提示，但提示后的复述不算掌握，必须换角度重讲。
5. 通过标准（五条齐备）：术语独立、因果链、机制透明（含具体例子）、边界区分、压力测试。达标后输出一行"本轮通过"，并简述讲清了什么；未达标最多 {max_rounds} 轮，届时输出一行"本轮未通过"并总结关键盲区。
6. 输出纪律（违反即失败）：只输出听众本人的台词（中文，1-4 句）。禁止旁白、禁止解释你在做什么、禁止讨论角色扮演、禁止评价这场对话本身、禁止任何英文。"""

LEARNER_PERSONA = """你在一场费曼学习法对话里扮演讲解者。你要讲解的概念是：{concept}。
你的人设：一个聪明但理解有真实缺口的人。你的知识状态分三层（严格遵守，这是你的能力边界）：
- 【确定知道】{knows}——这些你可以答得流利、自信。
- 【模糊】{fuzzy}——这些你只能答个大概，可能半对半错，语气犹豫。
- 【不知道】{gaps}——被追问到这些点时你会卡壳、改口或老实说不知道。重要：即使得到提示，一轮也只能回填一部分，要保留残余的生涩感，不许一次提示就痊愈。
禁止超出这个边界：不要答出【不知道】清单里的内容（除非对话中已经被引导着推导出），不要展现超出人设的心算/推理能力。
输出纪律（违反即失败）：只输出讲解者本人的台词——第一人称、口语化中文、每次 1-4 句。禁止旁白、禁止描述自己的人设、禁止说"作为讲解者"之类的话、禁止讨论这场对话的性质、禁止任何英文。被问住了就老实说不知道；得到提示后用自己的话慢慢讲。"""

AUDIT_PROMPT = """你是独立的对话审计员。给你一份双 agent 费曼对话的 transcript，以及讲解者的三层知识态声明。
请检查讲解者是否守住了知识边界：
1. 越界作答：有没有在被引导之前，就答出了【不知道】清单里的内容？
2. 盲区速崩：每个盲区被回填用了几轮？一次提示就痊愈（无残余生涩）算速崩。
3. 出戏：有没有非角色台词（旁白、元描述、英文解说）残留？
4. 听众表现：听众的追问是否遵守了规则（一次一问、引用原话、不替对方讲完）？（简评一句即可）
只输出一个 JSON 对象：
{{"boundary_score": 1-5的整数, "violations": ["越界点1"], "collapse": ["盲区X 一轮即回填"], "ooc_left": true/false, "listener_note": "一句", "verdict": "一句总评"}}
5=边界完全守住且无出戏 4=轻微速崩或一次小越界 3=多处速崩 2=明显越界 1=边界形同虚设。

【讲解者知识态】
确定知道：{knows}
模糊：{fuzzy}
不知道：{gaps}

【transcript】
{transcript}"""

VERDICT_PROMPT = """对话到此结束。你是刚才那位听众。请只输出一个 JSON 对象（不要输出其他内容）：
{"passed": true/false, "score": 1-5的整数, "gaps": ["盲区1","盲区2"], "notes": "一句话点评"}
评分标准：1=术语堆砌即卡壳 2=只讲是什么 3=基本讲清但有未回填盲区 4=五条标准达成四条以上 5=全部达成且接住连续追问。"""

# 出戏检测：元描述/导演旁白/讨论剧情本身
OOC_PATTERNS = re.compile(
    r"role.?play|as the (explainer|listener|speaker)|I need to (continue|respond)|"
    r"^output only|^just output|^continue as|speaker (should|answers)|^answer:|"
    r"^i'm playing|^i am playing|"
    r"本次对话是|角色扮演|Teach Me|扮演讲解者|扮演听众|"
    r"用户扮演|我扮演|继续扮演|这是一个.*测试|这不是真实",
    re.IGNORECASE | re.MULTILINE,
)

ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[()><=][0-9;]?|\x1b[78]|\x1b\[[0-9;?]*[hlm]")

OOC_RETRY_HINT = "\n\n【系统警告】你刚才的回复包含了旁白或元描述。只允许输出角色本人的台词，任何关于角色、扮演、对话性质的讨论都禁止。请重新输出，只说台词："


def run_role_turn(cmd, prompt, role, timeout=180):
    """驱动一个角色回合：先剥掉开头出戏行，整体出戏则带警告重试一次。"""
    reply = extract_reply(run_cli(cmd, prompt, timeout))
    lines = reply.splitlines()
    while lines and OOC_PATTERNS.search(lines[0]):
        print(f"  [{role}开头出戏行已剥除] {lines[0][:60]}…")
        lines = lines[1:]
    reply = "\n".join(lines).strip()
    if reply and not OOC_PATTERNS.search(reply):
        return reply
    print(f"  [{role}整体出戏，重试] {reply[:60] or '(空)'}…")
    reply2 = extract_reply(run_cli(cmd, prompt + OOC_RETRY_HINT, timeout))
    lines2 = [ln for ln in reply2.splitlines() if not OOC_PATTERNS.search(ln)]
    return "\n".join(lines2).strip() or reply


def run_cli(cmd, prompt, timeout=180):
    """pexpect 驱动一次 CLI 调用，返回 stdout。加宽终端避免输出折行。"""
    child = pexpect.spawn(cmd[0], cmd[1:] + [prompt], encoding="utf-8", timeout=timeout)
    child.setwinsize(50, 220)
    try:
        child.expect([pexpect.EOF, pexpect.TIMEOUT])
        out = child.before or ""
        child.close()
        return out.strip()
    finally:
        if child.isalive():
            child.close(force=True)


def extract_reply(raw):
    """清理 CLI 输出：去 ANSI 控制序列、空行、resume 提示行、列表圆点。"""
    raw = ANSI_RE.sub("", raw)
    lines = []
    for ln in raw.splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("To resume this session"):
            continue
        ln = re.sub(r"^[•·]\s*", "", ln)
        if ln:
            lines.append(ln)
    return "\n".join(lines).strip()


def main():
    parser = argparse.ArgumentParser(description="双 agent 真实费曼会话")
    parser.add_argument("--concept", required=True)
    parser.add_argument("--knows", required=True, help="确定知道的，分号分隔")
    parser.add_argument("--fuzzy", required=True, help="模糊的，分号分隔")
    parser.add_argument("--gaps", required=True, help="不知道的（盲区），分号分隔")
    parser.add_argument("--max-rounds", type=int, default=10)
    parser.add_argument("--listener-cmd", default="claude -p")
    parser.add_argument("--learner-cmd", default="kimi -p")
    parser.add_argument("--auditor-cmd", default="claude -p")
    parser.add_argument("--out", help="转写稿输出路径")
    args = parser.parse_args()

    listener_cmd = args.listener_cmd.split()
    learner_cmd = args.learner_cmd.split()
    auditor_cmd = args.auditor_cmd.split()

    learner_persona = LEARNER_PERSONA.format(
        concept=args.concept, knows=args.knows, fuzzy=args.fuzzy, gaps=args.gaps)
    listener_rules = LISTENER_PERSONA.format(max_rounds=args.max_rounds)

    dialogue = [{"who": "听众", "text": LISTENER_OPENING}]
    print(f"[听众] {LISTENER_OPENING}")

    verdict = None
    for round_no in range(1, args.max_rounds + 1):
        transcript_so_far = "\n\n".join(f"{m['who']}：{m['text']}" for m in dialogue)

        # 讲解者回合
        learner_prompt = (f"{learner_persona}\n\n对话到目前为止：\n{transcript_so_far}\n\n"
                          f"现在轮到你（讲解者）回答听众。直接输出你的回答：")
        t0 = time.time()
        learner_reply = run_role_turn(learner_cmd, learner_prompt, "讲解者")
        print(f"[讲解者·第{round_no}轮·{time.time()-t0:.0f}s] {learner_reply[:80]}…")
        if not learner_reply:
            print("讲解者无响应，中止。", file=sys.stderr)
            sys.exit(1)
        dialogue.append({"who": "你", "text": learner_reply})

        transcript_so_far += f"\n\n你：{learner_reply}"

        # 听众回合
        listener_prompt = (f"{listener_rules}\n\n概念：{args.concept}\n\n"
                           f"对话到目前为止：\n{transcript_so_far}\n\n"
                           f"现在轮到你（听众）回应。直接输出你说的话：")
        t0 = time.time()
        listener_reply = run_role_turn(listener_cmd, listener_prompt, "听众")
        print(f"[听众·第{round_no}轮·{time.time()-t0:.0f}s] {listener_reply[:80]}…")
        if not listener_reply:
            print("听众无响应，中止。", file=sys.stderr)
            sys.exit(1)
        dialogue.append({"who": "听众", "text": listener_reply})

        if "本轮通过" in listener_reply or "本轮未通过" in listener_reply:
            verdict = "passed" if "本轮通过" in listener_reply else "failed"
            break

    # 独立评定
    full_transcript = "\n\n".join(f"{m['who']}：{m['text']}" for m in dialogue)
    verdict_raw = run_cli(listener_cmd, f"{VERDICT_PROMPT}\n\n对话全文：\n{full_transcript}")
    m = re.search(r"\{[^{}]*\}", verdict_raw, re.S)
    try:
        verdict_json = json.loads(m.group(0)) if m else {}
    except json.JSONDecodeError:
        verdict_json = {}

    passed = bool(verdict_json.get("passed", verdict == "passed"))
    score = int(verdict_json.get("score", 3))
    gaps = verdict_json.get("gaps", []) or []
    notes = verdict_json.get("notes", "")

    # 审计员：独立核验讲解者的边界纪律与听众的规则纪律
    audit_prompt = AUDIT_PROMPT.format(
        knows=args.knows, fuzzy=args.fuzzy, gaps=args.gaps, transcript=full_transcript)
    audit_raw = run_cli(auditor_cmd, audit_prompt)
    am = re.search(r"\{[^{}]*\}", audit_raw, re.S)
    try:
        audit = json.loads(am.group(0)) if am else {}
    except json.JSONDecodeError:
        audit = {}
    boundary_score = audit.get("boundary_score", "?")
    print(f"[审计] 边界符合度 {boundary_score}/5 | 越界 {len(audit.get('violations', []))} 处"
          f" | 速崩 {len(audit.get('collapse', []))} 处 | {audit.get('verdict', '')}")

    # 写转写稿
    out_path = args.out or f"/tmp/feynman-dual-{re.sub(r'[^\\w一-鿿]+', '-', args.concept)}.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"# {args.concept} · 费曼对话实录（双 agent 实测）\n\n")
        f.write(f"> 听众：{' '.join(listener_cmd)} ｜ 讲解者：{' '.join(learner_cmd)} ｜ 审计：{' '.join(auditor_cmd)}\n")
        f.write(f"> 讲解者知识态 — 知道：{args.knows} ｜ 模糊：{args.fuzzy} ｜ 盲区：{args.gaps}\n\n")
        for msg in dialogue:
            f.write(f"**{msg['who']}**：{msg['text']}\n\n")
        f.write("---\n\n## 审计报告\n\n```json\n")
        f.write(json.dumps(audit, ensure_ascii=False, indent=2))
        f.write("\n```\n")

    # 落账
    log_cmd = [
        sys.executable, os.path.join(HERE, "feynman_log.py"), "log",
        "--concept", args.concept,
        "--rounds", str(len([m for m in dialogue if m["who"] == "你"])),
        "--passed", "true" if passed else "false",
        "--score", str(max(1, min(5, score))),
        "--gaps", ";".join(gaps),
        "--notes", f"[双agent实测·边界{boundary_score}/5] {notes}",
        "--transcript", out_path,
    ]
    result = subprocess.run(log_cmd, capture_output=True, text=True)
    print(result.stdout)
    print(f"转写稿：{out_path}")
    print(f"判定：{'通过' if passed else '未通过'} | 评分 {score}/5 | 边界 {boundary_score}/5")


if __name__ == "__main__":
    main()
