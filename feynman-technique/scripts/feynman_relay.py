#!/usr/bin/env python3
"""盲测接力器（仅标准库）。

真盲测的关键路径：本脚本在【主 agent 上下文之外】读取 prep 评分表和会话状态，
内部构建听众 prompt、调用听众 CLI 进程，只把听众的台词返回给主 agent。
评分表全程不进入主对话——用户看不到答案，才是真盲测。

每轮用法（主 agent 只执行并转述输出）：
  python3 feynman_relay.py turn "用户刚说的话" [--process "claude -p"]

流程：读 active_session.json（轮数历史）+ prep 文件 → 构建听众 prompt
→ 调听众进程 → 清洗输出（去 resume 行/圆点/旁白前缀）→ 打印听众台词。
听众台词含「本轮通过/本轮未通过」时，主 agent 据此走 close 流程。

进程兜底兼容任何 CLI：claude -p / kimi -p / codex exec（--skip-git-repo-check）。
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
6. 输出纪律（违反即失败）：只输出听众本人的台词（中文，1-4 句）。禁止旁白、禁止解释你在做什么、禁止讨论角色扮演、禁止任何英文。"""

OPENING = "准备好当你的费曼听众了。请从最基础的地方开始讲。"

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
    parts.append(f"你：{user_msg}")
    return "\n\n".join(parts)


def build_prompt(state, prep_text, user_msg):
    transcript = build_transcript(state, user_msg)
    return (f"{LISTENER_RULES.format(max_rounds=feynman_session.MAX_ROUNDS)}\n\n"
            f"【概念】{state['concept']}\n\n"
            f"【评分表（绝不可泄露给用户）】\n{prep_text}\n\n"
            f"【对话到目前为止】\n{transcript}\n\n"
            f"现在轮到你（听众）回应。直接输出你说的话：")


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


def cmd_turn(args):
    state = feynman_session.load_state()
    if not state:
        print("没有进行中的会话。先 feynman_session.py start。", file=sys.stderr)
        sys.exit(2)

    prep_file = state.get("prep", "")
    prep_text = ""
    if prep_file and os.path.isfile(prep_file):
        with open(prep_file, encoding="utf-8") as f:
            prep_text = f.read()

    if not state["rounds"] and not args.user_msg.strip():
        # 第一轮：听众固定开场白，不调进程
        print(OPENING)
        return

    prompt = build_prompt(state, prep_text, args.user_msg)
    raw = run_listener(args.process.split(), prompt, args.timeout)
    reply = clean_reply(raw)
    if not reply:
        print("听众无有效回复。", file=sys.stderr)
        sys.exit(1)
    print(reply)


def main():
    parser = argparse.ArgumentParser(description="盲测接力器")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("turn", help="一轮接力：用户说完，取听众回应")
    p.add_argument("user_msg", help="用户刚说的话（首轮可传空串取开场白）")
    p.add_argument("--process", default="claude -p",
                   help="听众 CLI（默认 'claude -p'；可换 'kimi -p' 或 'codex exec'）")
    p.add_argument("--timeout", type=int, default=180)
    p.set_defaults(func=cmd_turn)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
