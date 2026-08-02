#!/usr/bin/env python3
"""费曼会话状态机（仅标准库）。

把会话流程的机械部分固化为程序步骤，对抗长对话中的流程漂移：
  start  开场：建立状态，输出准备清单与历史联动报告
  round  每轮打卡：校验盲区分类码，强制轮数上限，记录引用/追问/脚手架
  status 重新锚定：随时查看当前轮数、盲区命中、要点覆盖
  close  收尾：自动落账（含历史对比报告），清除状态
  abort  放弃本场（不落账）

AI 负责程序固化不了的部分：提问的质量、对回答的判断。
程序负责：流程不漂移、分类码合法、轮数不超限、记录不遗漏。
"""
import argparse
import json
import os
import shutil
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import feynman_log  # noqa: E402

STATE_FILE = os.path.join(feynman_log.LOG_DIR, "active_session.json")

GAP_CODES = [
    "factual-error", "jargon-dodge", "causal-gap", "mechanism-blackbox",
    "boundary-blur", "broken-analogy", "edge-case-blind",
]
MAX_ROUNDS = 10
WARN_ROUNDS = 8
MAX_HINT_CHARS = 120  # 脚手架提示上限（≈60-100 汉字，去空白计）


def load_state():
    if not os.path.exists(STATE_FILE):
        return None
    with open(STATE_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_state(state):
    os.makedirs(feynman_log.LOG_DIR, exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def require_state():
    state = load_state()
    if not state:
        print("没有进行中的会话。先运行：feynman_session.py start --concept \"概念\"", file=sys.stderr)
        sys.exit(2)
    return state


def print_status(state):
    n = len(state["rounds"])
    hits = [r["gap"] for r in state["rounds"] if r["gap"] != "none"]
    print(f"== 会话状态 == {state['concept']} | 第 {n}/{MAX_ROUNDS} 轮 | "
          f"脚手架 {state['scaffolds']} 次")
    print(f"盲区命中：{'、'.join(hits) if hits else '无'}")
    print(f"要点覆盖：{'、'.join(state['covered']) if state['covered'] else '尚无记录'}")
    if n >= WARN_ROUNDS:
        print(f"⚠️ 已到第 {n} 轮，剩余 {MAX_ROUNDS - n} 轮："
              f"请准备收尾（通过则 close --passed true，否则 close --passed false）")


def cmd_start(args):
    if load_state() and not args.force:
        print("已有一场进行中的会话。先 status 查看、close 收尾或 abort 放弃；"
              "或用 --force 覆盖。", file=sys.stderr)
        sys.exit(2)
    # 硬门槛：没有准备文件（含验收要点）不允许开场
    if not args.prep:
        print("缺少准备文件。先完成准备（搜索查证 → 第一性拆解 → 写下 5-8 条验收要点），"
              "存入 sessions/prep/<概念>.md，然后：\n"
              "  feynman_session.py start --concept \"概念\" --prep sessions/prep/<概念>.md",
              file=sys.stderr)
        sys.exit(2)
    if not os.path.isfile(args.prep):
        print(f"准备文件不存在：{args.prep}", file=sys.stderr)
        sys.exit(2)
    with open(args.prep, encoding="utf-8") as f:
        prep_lines = [ln for ln in f.read().splitlines() if ln.strip()]
    if len(prep_lines) < 3:
        print(f"准备文件内容过少（{len(prep_lines)} 行）：至少要有几条验收要点。",
              file=sys.stderr)
        sys.exit(2)

    state = {
        "concept": args.concept,
        "started": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "prep": args.prep,
        "rounds": [],
        "covered": [],
        "scaffolds": 0,
    }
    save_state(state)

    print(f"会话已开场：{args.concept}（准备文件 {len(prep_lines)} 行已验收）")
    print("\n== 准备清单（逐项完成后再开始当听众）==")
    print("1. 研究：搜索查证概念（新名词/新论文/不确定的机制，1-3 个来源）")
    print("2. 拆解：前置知识阶梯 + 核心机制 + 关键因果链 → sessions/prep/")
    print("3. 定标：5-8 条机制性验收要点 + 预判 2-3 个盲区")

    history = [r for r in feynman_log.load_records()]
    related = [r for r in history if r["concept"] == args.concept]
    print("\n== 历史联动 ==")
    if related:
        scores = [r.get("score") for r in related]
        gaps = sorted({g for r in related for g in r.get("gaps", [])})
        print(f"本概念历史 {len(related)} 次：评分 {' → '.join(map(str, scores))}")
        print(f"旧盲区（优先验证是否已回填）：{'、'.join(gaps) or '无'}")
    else:
        print("本概念无历史记录。")
    gap_count = {}
    for r in history:
        for g in r.get("gaps", []):
            gap_count[g] = gap_count.get(g, 0) + 1
    recurring = sorted(((g, c) for g, c in gap_count.items() if c > 1), key=lambda x: -x[1])
    if recurring:
        print("跨概念反复盲区（系统性弱点，相关时重点追问）："
              + "、".join(f"{g}({c}次)" for g, c in recurring[:5]))
    mastered = [c for c in {r["concept"] for r in history if r.get("passed")}]
    if mastered:
        print(f"已掌握概念（可出迁移题）：{'、'.join(sorted(mastered))}")


def cmd_round(args):
    state = require_state()
    n = len(state["rounds"])
    if n >= MAX_ROUNDS:
        print(f"已达 {MAX_ROUNDS} 轮上限，请立即 close 收尾（通过或总结盲区暂停）。",
              file=sys.stderr)
        sys.exit(2)
    if args.gap != "none" and args.gap not in GAP_CODES:
        print(f"非法盲区分类码：{args.gap}\n合法值：{'、'.join(GAP_CODES)} 或 none",
              file=sys.stderr)
        sys.exit(2)
    if args.scaffold:
        if not args.hint:
            print("--scaffold 需要 --hint 传入提示文本（60-100 字白话讲解 + 一个例子）。",
                  file=sys.stderr)
            sys.exit(2)
        hint_len = len("".join(args.hint.split()))
        if hint_len > MAX_HINT_CHARS:
            print(f"提示超长：{hint_len} 字符（上限 {MAX_HINT_CHARS}）。"
                  f"脚手架只给一小段引导，不整课。", file=sys.stderr)
            sys.exit(2)
    state["rounds"].append({
        "n": n + 1,
        "quote": args.quote or "",
        "gap": args.gap,
        "probe": args.probe or "",
        "scaffold": bool(args.scaffold),
        "hint": args.hint if args.scaffold else "",
    })
    if args.scaffold:
        state["scaffolds"] += 1
    for point in (args.covered or "").split(";"):
        point = point.strip()
        if point and point not in state["covered"]:
            state["covered"].append(point)
    save_state(state)
    print_status(state)


def cmd_status(args):
    print_status(require_state())


def cmd_close(args):
    state = require_state()
    if not state["rounds"]:
        print("一轮都没进行，不能收尾。用 abort 放弃本场。", file=sys.stderr)
        sys.exit(2)

    gaps = []
    for r in state["rounds"]:
        if r["gap"] != "none" and r["gap"] not in gaps:
            gaps.append(r["gap"])

    # 归档转写稿（复用 feynman_log 的规则）
    transcript_name = ""
    if args.transcript:
        if not os.path.isfile(args.transcript):
            print(f"转写稿不存在：{args.transcript}", file=sys.stderr)
            sys.exit(2)
        os.makedirs(feynman_log.TRANSCRIPTS_DIR, exist_ok=True)
        transcript_name = "{}-{}.md".format(
            datetime.now().strftime("%Y%m%d-%H%M"), feynman_log.safe_name(state["concept"]))
        shutil.copy2(args.transcript, os.path.join(feynman_log.TRANSCRIPTS_DIR, transcript_name))

    record = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "concept": state["concept"],
        "rounds": len(state["rounds"]),
        "passed": args.passed,
        "score": args.score,
        "gaps": gaps,
        "notes": args.notes or "",
    }
    if transcript_name:
        record["transcript"] = transcript_name
    with open(feynman_log.LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    os.remove(STATE_FILE)

    # 收尾报告
    status = "通过 ✅" if args.passed else "未通过"
    print("== 本场报告 ==")
    print(f"{state['concept']} | {status} | {len(state['rounds'])} 轮 | "
          f"评分 {args.score}/5 | 脚手架 {state['scaffolds']} 次")
    print(f"盲区分类：{'、'.join(gaps) if gaps else '无'}")
    print(f"要点覆盖：{'、'.join(state['covered']) if state['covered'] else '无记录'}")
    history = [r for r in feynman_log.load_records()
               if r["concept"] == state["concept"]]
    if len(history) > 1:
        scores = [r.get("score") for r in history]
        print(f"本概念评分走势：{' → '.join(map(str, scores))}")
    print("已落账。别忘了：生成复习卡（精炼解释+类比及边界+迁移小测）并给用户确认。")


def cmd_abort(args):
    if load_state():
        os.remove(STATE_FILE)
        print("已放弃本场会话（未落账）。")
    else:
        print("没有进行中的会话。")


def main():
    parser = argparse.ArgumentParser(description="费曼会话状态机")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("start", help="开场")
    p.add_argument("--concept", required=True)
    p.add_argument("--prep", help="准备文件路径")
    p.add_argument("--force", action="store_true", help="覆盖进行中的会话")
    p.set_defaults(func=cmd_start)

    p = sub.add_parser("round", help="每轮打卡")
    p.add_argument("--gap", required=True,
                   help=f"盲区分类码（{'/'.join(GAP_CODES)}）或 none（本轮答得好）")
    p.add_argument("--quote", help="用户原话")
    p.add_argument("--probe", help="你发出的追问")
    p.add_argument("--scaffold", action="store_true", help="本轮给了提示")
    p.add_argument("--hint", help="提示文本（--scaffold 时必填，≤120 字符）")
    p.add_argument("--covered", default="", help="本轮覆盖的验收要点，分号分隔")
    p.set_defaults(func=cmd_round)

    p = sub.add_parser("status", help="查看当前状态（重新锚定）")
    p.set_defaults(func=cmd_status)

    p = sub.add_parser("close", help="收尾并落账")
    p.add_argument("--passed", type=feynman_log.str2bool, required=True)
    p.add_argument("--score", type=int, choices=range(1, 6), required=True)
    p.add_argument("--notes", default="")
    p.add_argument("--transcript", help="转写稿路径")
    p.set_defaults(func=cmd_close)

    p = sub.add_parser("abort", help="放弃本场（不落账）")
    p.set_defaults(func=cmd_abort)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
