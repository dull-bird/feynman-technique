#!/usr/bin/env python3
"""费曼会话状态机（仅标准库）。

把会话流程的机械部分固化为程序步骤，对抗长对话中的流程漂移：
  start  开场：建立状态（分配会话 ID），输出准备清单与历史联动报告
  round  每轮打卡：校验盲区分类码，强制轮数上限，记录引用/追问/脚手架
  status 重新锚定：随时查看当前轮数、盲区命中、要点覆盖
  close  收尾：自动落账（含历史对比报告），清除状态
  abort  放弃本场（不落账）
  schema 输出完整 CLI 契约（JSON）：子命令、参数、合法值、上限

多场并行：每场会话一个 ID，状态存 sessions/active/<ID>.json。
不同概念可同时开场（如多个 agent 各玩一个主题）；
多场同时进行时，round/status/close/abort 需用 --session 指定目标。

AI 负责程序固化不了的部分：提问的质量、对回答的判断。
程序负责：流程不漂移、分类码合法、轮数不超限、记录不遗漏。
"""
import argparse
import json
import os
import shutil
import sys
import uuid
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import feynman_log  # noqa: E402

ACTIVE_DIR = os.path.join(feynman_log.LOG_DIR, "active")
LEGACY_STATE_FILE = os.path.join(feynman_log.LOG_DIR, "active_session.json")

GAP_CODES = [
    "factual-error", "jargon-dodge", "causal-gap", "mechanism-blackbox",
    "boundary-blur", "broken-analogy", "edge-case-blind",
]
MAX_ROUNDS = 10
WARN_ROUNDS = 8
MAX_HINT_CHARS = 120  # 脚手架提示上限（≈60-100 汉字，去空白计）

# 听众 CLI 推断：先按环境变量识别宿主 agent，再探测 PATH，最后兜底默认
DEFAULT_LISTENER = "claude -p"
LISTENER_ENV = [("CLAUDECODE", "claude -p"), ("KIMI_CODE_API_KEY", "kimi -p")]
LISTENER_PROBE = [("claude", "claude -p"), ("kimi", "kimi -p"),
                  ("codex", "codex exec")]


def detect_listener():
    """推断听众 CLI，与宿主 agent 保持一致。"""
    for var, cmd in LISTENER_ENV:
        if os.environ.get(var):
            return cmd
    for exe, cmd in LISTENER_PROBE:
        if shutil.which(exe):
            return cmd
    return DEFAULT_LISTENER


def new_session_id(concept):
    return f"{feynman_log.safe_name(concept)}-{uuid.uuid4().hex[:6]}"


def state_path(sid):
    return os.path.join(ACTIVE_DIR, f"{sid}.json")


def save_state(state):
    os.makedirs(ACTIVE_DIR, exist_ok=True)
    with open(state_path(state["id"]), "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def migrate_legacy():
    """旧版单会话状态文件（active_session.json）迁移进 active/ 目录。"""
    if not os.path.exists(LEGACY_STATE_FILE):
        return
    with open(LEGACY_STATE_FILE, encoding="utf-8") as f:
        state = json.load(f)
    if not state.get("id"):
        state["id"] = new_session_id(state.get("concept", "会话"))
    save_state(state)
    os.remove(LEGACY_STATE_FILE)


def list_sessions():
    migrate_legacy()
    if not os.path.isdir(ACTIVE_DIR):
        return []
    sessions = []
    for name in sorted(os.listdir(ACTIVE_DIR)):
        if not name.endswith(".json"):
            continue
        with open(os.path.join(ACTIVE_DIR, name), encoding="utf-8") as f:
            sessions.append(json.load(f))
    return sessions


def load_state(sid=None):
    """供 relay 等内部调用：唯一一场时 sid 可省略。"""
    sessions = list_sessions()
    if sid:
        return next((s for s in sessions if s.get("id") == sid), None)
    return sessions[0] if len(sessions) == 1 else None


def active_summary(sessions):
    if not sessions:
        return "当前没有进行中的会话。"
    return "进行中的会话：" + "、".join(
        f"{s.get('id')}（{s['concept']}，第 {len(s['rounds'])} 轮）"
        for s in sessions)


def require_state(sid=None):
    sessions = list_sessions()
    if sid:
        state = next((s for s in sessions if s.get("id") == sid), None)
        if state:
            return state
        print(f"没有 ID 为 {sid} 的会话。{active_summary(sessions)}",
              file=sys.stderr)
        sys.exit(2)
    if not sessions:
        print("没有进行中的会话。先运行：feynman_session.py start --concept \"概念\"",
              file=sys.stderr)
        sys.exit(2)
    if len(sessions) > 1:
        print(f"有 {len(sessions)} 场进行中的会话，请用 --session 指定：\n"
              + active_summary(sessions), file=sys.stderr)
        sys.exit(2)
    return sessions[0]


def print_status(state):
    n = len(state["rounds"])
    hits = [r["gap"] for r in state["rounds"] if r["gap"] != "none"]
    print(f"== 会话状态 == {state['concept']}（ID：{state.get('id')}）| "
          f"第 {n}/{MAX_ROUNDS} 轮 | 脚手架 {state['scaffolds']} 次")
    print(f"听众进程：{state.get('listener') or DEFAULT_LISTENER}")
    print(f"盲区命中：{'、'.join(hits) if hits else '无'}")
    print(f"要点覆盖：{'、'.join(state['covered']) if state['covered'] else '尚无记录'}")
    if n >= WARN_ROUNDS:
        print(f"⚠️ 已到第 {n} 轮，剩余 {MAX_ROUNDS - n} 轮："
              f"请准备收尾（通过则 close --passed true，否则 close --passed false）")


def cmd_start(args):
    same = [s for s in list_sessions() if s["concept"] == args.concept]
    if same and not args.force:
        old = same[0]
        print(f"概念「{args.concept}」已有进行中的会话（ID：{old.get('id')}）。\n"
              f"接着旧场玩：后续命令带 --session {old.get('id')}；"
              f"放弃旧场：abort --session {old.get('id')}；\n"
              f"确要同概念并行：加 --force。", file=sys.stderr)
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
        "id": new_session_id(args.concept),
        "concept": args.concept,
        "started": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "prep": args.prep,
        "listener": args.listener or detect_listener(),
        "rounds": [],
        "covered": [],
        "scaffolds": 0,
    }
    save_state(state)

    print(f"会话已开场：{args.concept}（准备文件 {len(prep_lines)} 行已验收）")
    print(f"会话 ID：{state['id']}（多场并行时，后续 round/status/close/abort "
          f"与 relay turn 都带 --session {state['id']}）")
    print(f"听众进程：{state['listener']}（要换：start --listener \"kimi -p\" 重新开场）")
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
    state = require_state(args.session)
    n = len(state["rounds"])
    if n >= MAX_ROUNDS:
        print(f"已达 {MAX_ROUNDS} 轮上限，请立即 close 收尾（通过或总结盲区暂停）。",
              file=sys.stderr)
        sys.exit(2)
    if args.gap != "none" and args.gap not in GAP_CODES:
        print(f"非法盲区分类码：{args.gap}\n合法值：{'、'.join(GAP_CODES)} 或 none\n"
              f"完整参数契约：feynman_session.py schema",
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
    print_status(require_state(args.session))


def cmd_close(args):
    state = require_state(args.session)
    if state.get("taught") and args.passed:
        print("本场已进行过教学（teach），答案已揭晓，不能判通过。\n"
              "用 close --passed false 落账，掌握检验请改日重新开场。",
              file=sys.stderr)
        sys.exit(2)
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
    os.remove(state_path(state["id"]))

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
    if not list_sessions():
        print("没有进行中的会话。")
        return
    state = require_state(args.session)
    os.remove(state_path(state["id"]))
    print(f"已放弃本场会话（{state['concept']}，未落账）。")


def cmd_schema(args):
    """输出完整 CLI 契约（JSON），供 agent 在调用前查询合法值。"""
    session_arg = {"type": "str",
                   "note": "目标会话 ID；多场并行时必填，唯一一场时可省略"}
    schema = {
        "script": "feynman_session.py",
        "flow": "start → round（每轮一次）→ close / abort；status 随时锚定；"
                "多场并行时各命令带 --session 指定目标",
        "multi_session": "每场会话一个 ID（start 输出），状态存 sessions/active/<ID>.json",
        "taught_guard": "relay teach 后本场答案已揭晓，close --passed 只能为 false",
        "gap_codes": GAP_CODES,
        "gap_special": {"none": "本轮答得好、无盲区"},
        "limits": {
            "max_rounds": MAX_ROUNDS,
            "warn_rounds": WARN_ROUNDS,
            "max_hint_chars": MAX_HINT_CHARS,
        },
        "commands": {
            "start": {
                "--concept": {"required": True, "type": "str"},
                "--prep": {"required": True, "type": "path",
                           "note": "准备文件（≥3 行验收要点），缺失拒绝开场"},
                "--listener": {"type": "str",
                               "note": "听众 CLI（如 'kimi -p'）；缺省自动检测宿主 agent，"
                                       "随会话记录，relay 每轮使用"},
                "--force": {"type": "flag", "note": "允许同概念并行开场"},
            },
            "round": {
                "--gap": {"required": True, "choices": GAP_CODES + ["none"]},
                "--quote": {"type": "str", "note": "用户原话"},
                "--probe": {"type": "str", "note": "发出的追问"},
                "--scaffold": {"type": "flag", "requires": "--hint"},
                "--hint": {"required_if": "--scaffold",
                           "max_chars": MAX_HINT_CHARS},
                "--covered": {"type": "str", "note": "分号分隔的验收要点"},
                "--session": session_arg,
            },
            "status": {"--session": session_arg},
            "close": {
                "--passed": {"required": True,
                             "choices": ["true", "false", "1", "0", "yes", "no",
                                         "通过", "未通过"]},
                "--score": {"required": True, "choices": [1, 2, 3, 4, 5]},
                "--notes": {"type": "str"},
                "--transcript": {"type": "path", "note": "转写稿，归档到 sessions/transcripts/"},
                "--session": session_arg,
            },
            "abort": {"--session": session_arg},
            "schema": {},
        },
    }
    print(json.dumps(schema, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description="费曼会话状态机")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("start", help="开场（分配会话 ID，可多场并行）")
    p.add_argument("--concept", required=True)
    p.add_argument("--prep", help="准备文件路径")
    p.add_argument("--listener",
                   help="听众 CLI（如 'kimi -p'）；缺省自动检测宿主 agent")
    p.add_argument("--force", action="store_true", help="允许同概念并行开场")
    p.set_defaults(func=cmd_start)

    p = sub.add_parser("round", help="每轮打卡")
    p.add_argument("--gap", required=True,
                   help=f"盲区分类码（{'/'.join(GAP_CODES)}）或 none（本轮答得好）")
    p.add_argument("--quote", help="用户原话")
    p.add_argument("--probe", help="你发出的追问")
    p.add_argument("--scaffold", action="store_true", help="本轮给了提示")
    p.add_argument("--hint", help="提示文本（--scaffold 时必填，≤120 字符）")
    p.add_argument("--covered", default="", help="本轮覆盖的验收要点，分号分隔")
    p.add_argument("--session", help="目标会话 ID（多场并行时必填）")
    p.set_defaults(func=cmd_round)

    p = sub.add_parser("status", help="查看当前状态（重新锚定）")
    p.add_argument("--session", help="目标会话 ID（多场并行时必填）")
    p.set_defaults(func=cmd_status)

    p = sub.add_parser("close", help="收尾并落账")
    p.add_argument("--passed", type=feynman_log.str2bool, required=True)
    p.add_argument("--score", type=int, choices=range(1, 6), required=True)
    p.add_argument("--notes", default="")
    p.add_argument("--transcript", help="转写稿路径")
    p.add_argument("--session", help="目标会话 ID（多场并行时必填）")
    p.set_defaults(func=cmd_close)

    p = sub.add_parser("abort", help="放弃本场（不落账）")
    p.add_argument("--session", help="目标会话 ID（多场并行时必填）")
    p.set_defaults(func=cmd_abort)

    p = sub.add_parser("schema", help="输出完整 CLI 契约（JSON）：参数、合法值、上限")
    p.set_defaults(func=cmd_schema)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
