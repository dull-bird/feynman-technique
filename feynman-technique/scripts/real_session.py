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

LISTENER_RULES = """你是一场费曼学习法对话的听众。规则（必须严格遵守）：
1. 你是零基础但逻辑严谨的听众。用户负责讲，你只负责复述和追问，绝不替用户讲完。
2. 每轮只问一个最关键的问题，必须引用对方原话。
3. 盲区分类（选一个）：factual-error 事实错误 / jargon-dodge 术语循环 / causal-gap 因果缺口 / mechanism-blackbox 机制黑盒 / boundary-blur 边界模糊 / broken-analogy 类比失灵 / edge-case-blind 边界盲。事实错误优先。
4. 对方说"不知道"或打太极时：指出盲区，可给一段 60-100 字提示，但提示后的复述不算掌握，必须换角度重讲。
5. 通过标准（五条齐备）：术语独立、因果链、机制透明（含具体例子）、边界区分、压力测试。达标后输出一行"本轮通过"，并简述讲清了什么；未达标最多 {max_rounds} 轮，届时输出一行"本轮未通过"并总结关键盲区。
6. 你的输出格式：直接输出你要对讲解者说的话（中文，1-4 句），不要输出任何旁白、标签或分析。"""

LEARNER_PERSONA = """你在一场费曼学习法对话里扮演讲解者。你要讲解的概念是：{concept}。
你的人设：一个聪明但理解有真实缺口的人。你真实的知识状态如下（自然地表现，不要主动暴露你在演戏）：
- 你大体知道这个概念，能讲个皮毛。
- 你的真实盲区：{gaps}。被追问到这些点时，你会卡壳、改口、或者说"不知道"——就像真人一样。
- 除此之外的点你可以答得不错。
要求：用第一人称、口语化中文回答，每次 1-4 句。不要加任何旁白或标签。被问住了就老实说不知道；得到提示后用自己的话重新讲。"""

VERDICT_PROMPT = """对话到此结束。你是刚才那位听众。请只输出一个 JSON 对象（不要输出其他内容）：
{"passed": true/false, "score": 1-5的整数, "gaps": ["盲区1","盲区2"], "notes": "一句话点评"}
评分标准：1=术语堆砌即卡壳 2=只讲是什么 3=基本讲清但有未回填盲区 4=五条标准达成四条以上 5=全部达成且接住连续追问。"""


def run_cli(cmd, prompt, timeout=180):
    """pexpect 驱动一次 CLI 调用，返回 stdout。"""
    child = pexpect.spawn(cmd[0], cmd[1:] + [prompt], encoding="utf-8", timeout=timeout)
    try:
        child.expect([pexpect.EOF, pexpect.TIMEOUT])
        out = child.before or ""
        child.close()
        return out.strip()
    finally:
        if child.isalive():
            child.close(force=True)


def extract_reply(raw):
    """清理 CLI 输出：去掉空行、resume 提示行、列表圆点。"""
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
    parser.add_argument("--gaps", required=True, help="讲解者的隐藏盲区，分号分隔")
    parser.add_argument("--max-rounds", type=int, default=10)
    parser.add_argument("--listener-cmd", default="claude -p")
    parser.add_argument("--learner-cmd", default="kimi -p")
    parser.add_argument("--out", help="转写稿输出路径")
    args = parser.parse_args()

    listener_cmd = args.listener_cmd.split()
    learner_cmd = args.learner_cmd.split()

    learner_persona = LEARNER_PERSONA.format(concept=args.concept, gaps=args.gaps)
    listener_rules = LISTENER_RULES.format(max_rounds=args.max_rounds)

    dialogue = [{"who": "听众", "text": LISTENER_OPENING}]
    print(f"[听众] {LISTENER_OPENING}")

    verdict = None
    for round_no in range(1, args.max_rounds + 1):
        transcript_so_far = "\n\n".join(f"{m['who']}：{m['text']}" for m in dialogue)

        # 讲解者回合
        learner_prompt = (f"{learner_persona}\n\n对话到目前为止：\n{transcript_so_far}\n\n"
                          f"现在轮到你（讲解者）回答听众。直接输出你的回答：")
        t0 = time.time()
        learner_reply = extract_reply(run_cli(learner_cmd, learner_prompt))
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
        listener_reply = extract_reply(run_cli(listener_cmd, listener_prompt))
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

    # 写转写稿
    out_path = args.out or f"/tmp/feynman-dual-{re.sub(r'[^\\w一-鿿]+', '-', args.concept)}.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"# {args.concept} · 费曼对话实录（双 agent 实测）\n\n")
        f.write(f"> 听众：{' '.join(listener_cmd)} ｜ 讲解者：{' '.join(learner_cmd)}\n")
        f.write(f"> 讲解者持有隐藏盲区：{args.gaps}\n\n")
        for msg in dialogue:
            f.write(f"**{msg['who']}**：{msg['text']}\n\n")

    # 落账
    log_cmd = [
        sys.executable, os.path.join(HERE, "feynman_log.py"), "log",
        "--concept", args.concept,
        "--rounds", str(len([m for m in dialogue if m["who"] == "你"])),
        "--passed", "true" if passed else "false",
        "--score", str(max(1, min(5, score))),
        "--gaps", ";".join(gaps),
        "--notes", f"[双agent实测] {notes}",
        "--transcript", out_path,
    ]
    result = subprocess.run(log_cmd, capture_output=True, text=True)
    print(result.stdout)
    print(f"转写稿：{out_path}")
    print(f"判定：{'通过' if passed else '未通过'} | 评分 {score}/5")


if __name__ == "__main__":
    main()
