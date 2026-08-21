#!/usr/bin/env python3
"""盲测接力器（仅标准库）。

真盲测的关键路径：本脚本在【主 agent 上下文之外】读取 prep 评分表和会话状态，
内部构建听众 prompt、调用听众 CLI 进程，只把听众的台词返回给主 agent。
评分表全程不进入主对话——用户看不到答案，才是真盲测。

每轮用法（主 agent 只执行并转述输出）：
  python3 feynman_relay.py turn "用户刚说的话" [--session 会话ID] [--process "kimi -p" 临时覆盖]

临场查证（听众不确定时不臆断）：
  听众台词带【存疑】标记 → 主 agent 开 subagent 查证公开事实
  → python3 feynman_relay.py answer "查证结果" [--session 会话ID] → 把新台词转给用户

角色反转（用户中途不想被追问了）：
  python3 feynman_relay.py teach [--session 会话ID]
  听众进程基于评分表和已暴露盲区做针对性讲解；此后本场不能判通过。

流程：读会话状态（轮数历史 + start 时记录的听众 CLI）+ prep 文件
→ 构建听众 prompt → 调听众进程 → 清洗输出（去 resume 行/圆点/旁白前缀）→ 打印听众台词。
听众台词含「本轮通过/本轮未通过」时，主 agent 据此走 close 流程。

听众 CLI 与宿主 agent 保持一致：start 时自动检测（claude / kimi / codex）并记入
会话状态；可用 feynman_session.py start --listener "kimi -p" 显式指定。
多场并行时各场有独立会话 ID，turn/answer/teach 用 --session 指定目标。
"""
import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import feynman_log  # noqa: E402
import feynman_session  # noqa: E402

LISTENER_RULES = """你是一场费曼学习法对话的听众。规则（必须严格遵守）：
1. 你是零基础但逻辑严谨的听众。用户负责讲，你只负责复述和追问，绝不替用户讲完。
2. 每轮只问一个最关键的问题，必须引用对方原话。
3. 盲区分类（选一个）：factual-error 事实错误 / jargon-dodge 术语循环 / causal-gap 因果缺口 / mechanism-blackbox 机制黑盒 / boundary-blur 边界模糊 / broken-analogy 类比失灵 / edge-case-blind 边界盲。事实错误优先。
4. 对方说"不知道"或打太极时：指出盲区，可给一段 60-100 字提示，但提示后的复述不算掌握，必须换角度重讲。
5. 通过标准（五条齐备）：术语独立、因果链、机制透明（含具体例子）、边界区分、压力测试。达标后输出一行"本轮通过"并简述讲清了什么；未达标最多 {max_rounds} 轮，届时输出一行"本轮未通过"并总结关键盲区。
6. 你对对方陈述的事实不确定时：不当它对来放行，也不臆断判错——在台词末尾单独一行输出"【存疑】要查证的具体问题"，之后会有人把查证结果告诉你。
7. 当一张图比口述更清楚（流程、架构、因果网络）时，可以要求对方画图："这个用嘴讲容易乱，你画一张 xx 的流程/结构图给我，画好告诉我"。主流程会读图并把内容转述给你，你再针对图追问。
8. 输出纪律（违反即失败）：只输出听众本人的台词（中文，1-4 句）。禁止旁白、禁止解释你在做什么、禁止讨论角色扮演、禁止任何英文。"""

TEACH_RULES = """你现在不是听众，而是老师。用户中场暂停追问，请你直接讲解。根据评分表和对话记录做针对性教学：
1. 逐个盲区讲：用户原话错在哪/卡在哪 → 正确机制（白话）→ 一个具体例子 → 一道自查小题（不出答案）。
2. 只讲对话里已暴露的盲区，外加一个最关键但尚未触及的点，不全课铺开。
3. 结尾一句：回填之后改日重新开场检验（本场已揭晓答案，不再判掌握）。
4. 输出纪律：中文，直接输出讲解正文。禁止旁白、禁止讨论角色扮演。"""

OPENING = "费曼教学法练习开始：把我当初学者，从最基础的地方讲你的概念。我手上有答案，随时会向你提问。"

VERIFY_FLAG = "【存疑】"

OOC_PREFIX = re.compile(
    r"^(just output|output only|continue as|i'm playing|i need to|speaker|"
    r"answer:|role.?play|本次对话是|角色扮演)", re.IGNORECASE)


def build_transcript(state, user_msg):
    parts = []
    for r in state["rounds"]:
        if r.get("quote"):
            parts.append(f"你：{r['quote']}")
        if r.get("probe"):
            parts.append(f"听众：{r['probe']}")
    if user_msg.strip():
        parts.append(f"你：{user_msg}")
    return "\n\n".join(parts)


def build_prompt(state, prep_text, user_msg):
    transcript = build_transcript(state, user_msg)
    return (f"{LISTENER_RULES.format(max_rounds=feynman_session.MAX_ROUNDS)}\n\n"
            f"【概念】{state['concept']}\n\n"
            f"【评分表（绝不可泄露给用户）】\n{prep_text}\n\n"
            f"【对话到目前为止】\n{transcript}\n\n"
            f"现在轮到你（听众）回应。直接输出你说的话：")


def build_answer_prompt(state, prep_text, finding):
    transcript = build_transcript(state, "")
    return (f"{LISTENER_RULES.format(max_rounds=feynman_session.MAX_ROUNDS)}\n\n"
            f"【概念】{state['concept']}\n\n"
            f"【评分表（绝不可泄露给用户）】\n{prep_text}\n\n"
            f"【对话到目前为止】\n{transcript}\n\n"
            f"【查证结果（对你存疑点的核实，来自公开资料）】\n{finding}\n\n"
            f"现在轮到你（听众）回应：若查证证实对方之前说错了，指出并按事实错误追问；"
            f"若存疑解除，回到原计划继续追问。直接输出你说的话：")


def build_teach_prompt(state, prep_text):
    transcript = build_transcript(state, "")
    return (f"{TEACH_RULES}\n\n"
            f"【概念】{state['concept']}\n\n"
            f"【评分表】\n{prep_text}\n\n"
            f"【对话到目前为止】\n{transcript}\n\n"
            f"现在输出你的讲解：")


def clean_reply(raw):
    lines = []
    for ln in raw.splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("To resume this session"):
            continue
        ln = re.sub(r"^[•·]\s*", "", ln)
        if ln and not OOC_PREFIX.match(ln):
            lines.append(ln)
    return "\n".join(lines).strip()


def run_listener(cmd, prompt, timeout):
    result = subprocess.run(cmd + [prompt], capture_output=True, text=True,
                            timeout=timeout)
    if result.returncode != 0:
        print(f"听众进程失败：{result.stderr[:300]}", file=sys.stderr)
        sys.exit(1)
    return result.stdout


def resolve_process(args, state):
    return (args.process or state.get("listener")
            or feynman_session.DEFAULT_LISTENER)


def load_prep(state):
    prep_file = state.get("prep", "")
    if prep_file and os.path.isfile(prep_file):
        with open(prep_file, encoding="utf-8") as f:
            return f.read()
    return ""


def cmd_turn(args):
    state = feynman_session.require_state(args.session)
    prep_text = load_prep(state)

    if not state["rounds"] and not args.user_msg.strip():
        # 第一轮：听众固定开场白，不调进程
        print(OPENING)
        return

    prompt = build_prompt(state, prep_text, args.user_msg)
    raw = run_listener(resolve_process(args, state).split(), prompt, args.timeout)
    reply = clean_reply(raw)
    if not reply:
        print("听众无有效回复。", file=sys.stderr)
        sys.exit(1)
    print(reply)
    if VERIFY_FLAG in reply:
        print("\n[relay 系统提示，勿转给用户] 听众存疑待查证：请开 subagent 查证"
              "（公开事实即可，勿涉及评分表），然后运行：\n"
              f"  python3 feynman_relay.py answer \"查证结果\""
              + (f" --session {state['id']}" if state.get("id") else ""))


def cmd_answer(args):
    state = feynman_session.require_state(args.session)
    prompt = build_answer_prompt(state, load_prep(state), args.finding)
    raw = run_listener(resolve_process(args, state).split(), prompt, args.timeout)
    reply = clean_reply(raw)
    if not reply:
        print("听众无有效回复。", file=sys.stderr)
        sys.exit(1)
    print(reply)


def cmd_teach(args):
    state = feynman_session.require_state(args.session)
    prompt = build_teach_prompt(state, load_prep(state))
    raw = run_listener(resolve_process(args, state).split(), prompt, args.timeout)
    reply = clean_reply(raw)
    if not reply:
        print("听众无有效回复。", file=sys.stderr)
        sys.exit(1)
    state["taught"] = True
    feynman_session.save_state(state)
    print(reply)
    print("\n[relay 系统提示，勿转给用户] 已标记 taught：本场只能 "
          "close --passed false，掌握检验请改日重新开场。")


def main():
    parser = argparse.ArgumentParser(description="盲测接力器")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("turn", help="一轮接力：用户说完，取听众回应")
    p.add_argument("user_msg", help="用户刚说的话（首轮可传空串取开场白）")
    p.add_argument("--process", default=None,
                   help="听众 CLI 临时覆盖；缺省用 start 时记录的 listener"
                        "（自动检测宿主 agent，如 'kimi -p'）")
    p.add_argument("--session", help="目标会话 ID（多场并行时必填）")
    p.add_argument("--timeout", type=int, default=180)
    p.set_defaults(func=cmd_turn)

    p = sub.add_parser("answer", help="临场查证回路：把查证结果喂回听众")
    p.add_argument("finding", help="查证结果（公开事实，勿含评分表内容）")
    p.add_argument("--process", default=None, help="听众 CLI 临时覆盖")
    p.add_argument("--session", help="目标会话 ID（多场并行时必填）")
    p.add_argument("--timeout", type=int, default=180)
    p.set_defaults(func=cmd_answer)

    p = sub.add_parser("teach", help="角色反转：听众基于盲区做针对性讲解")
    p.add_argument("--process", default=None, help="听众 CLI 临时覆盖")
    p.add_argument("--session", help="目标会话 ID（多场并行时必填）")
    p.add_argument("--timeout", type=int, default=300)
    p.set_defaults(func=cmd_teach)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
