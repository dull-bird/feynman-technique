#!/usr/bin/env python3
"""费曼学习法对话记录与进度追踪（仅标准库）。

用法：
  python3 feynman_log.py log --concept "复利" --rounds 6 --passed true --score 4 \
      --gaps "讲不清利率为何复利累积;缺例子" --notes "第二轮后顺畅"
  python3 feynman_log.py report [--concept "复利"]
"""
import argparse
import json
import os
import sys
from collections import defaultdict
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sessions")
LOG_FILE = os.path.join(LOG_DIR, "log.jsonl")


def load_records():
    if not os.path.exists(LOG_FILE):
        return []
    records = []
    with open(LOG_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"警告：跳过无法解析的行：{line[:60]}", file=sys.stderr)
    return records


def str2bool(v):
    if isinstance(v, bool):
        return v
    if v.lower() in ("true", "1", "yes", "y", "通过"):
        return True
    if v.lower() in ("false", "0", "no", "n", "未通过"):
        return False
    raise argparse.ArgumentTypeError(f"无效的布尔值：{v}")


def cmd_log(args):
    os.makedirs(LOG_DIR, exist_ok=True)
    record = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "concept": args.concept,
        "rounds": args.rounds,
        "passed": args.passed,
        "score": args.score,
        "gaps": [g.strip() for g in (args.gaps or "").split(";") if g.strip()],
        "notes": args.notes or "",
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    status = "通过" if record["passed"] else "未通过"
    print(f"已记录：{record['date']} | {record['concept']} | {status} | "
          f"{record['rounds']} 轮 | 评分 {record['score']}/5")

    # 顺便输出该概念的历史，方便对比进步
    history = [r for r in load_records() if r["concept"] == record["concept"]]
    if len(history) > 1:
        scores = [r["score"] for r in history]
        print(f"该概念第 {len(history)} 次对话，评分走势：{' → '.join(map(str, scores))}")


def cmd_report(args):
    records = load_records()
    if args.concept:
        records = [r for r in records if r["concept"] == args.concept]
    if not records:
        print("还没有任何记录。先用 log 命令记录一次对话吧。")
        return

    total = len(records)
    passed = sum(1 for r in records if r.get("passed"))
    scores = [r["score"] for r in records if r.get("score") is not None]
    print("== 总体 ==")
    line = f"对话次数：{total} | 通过：{passed} | 通过率：{passed / total:.0%}"
    if scores:
        line += f" | 平均评分：{sum(scores) / len(scores):.1f}/5"
    print(line)
    if len(scores) >= 4:
        half = len(scores) // 2
        early = sum(scores[:half]) / half
        late = sum(scores[half:]) / (len(scores) - half)
        print(f"评分趋势：前 {half} 次平均 {early:.1f} → 后 {len(scores) - half} 次平均 {late:.1f}")

    by_concept = defaultdict(list)
    for r in records:
        by_concept[r["concept"]].append(r)
    print("\n== 各概念 ==")
    for concept, rs in sorted(by_concept.items(), key=lambda kv: -len(kv[1])):
        sc = [r["score"] for r in rs if r.get("score") is not None]
        head = f"- {concept}：{len(rs)} 次"
        if sc:
            head += f"，评分 {' → '.join(map(str, sc))}"
        head += "，已掌握 ✅" if rs[-1].get("passed") else "，尚未通过"
        print(head)
        for r in rs:
            status = "通过" if r.get("passed") else "未通过"
            gaps = "、".join(r.get("gaps", [])) or "无"
            print(f"    {r['date']} | {r.get('rounds', '?')} 轮 | {status} | "
                  f"{r.get('score', '?')}/5 | 盲区：{gaps}")
            if r.get("notes"):
                print(f"      备注：{r['notes']}")

    gap_count = defaultdict(int)
    for r in records:
        for g in r.get("gaps", []):
            gap_count[g] += 1
    recurring = sorted(((g, c) for g, c in gap_count.items() if c > 1),
                       key=lambda x: -x[1])
    if recurring:
        print("\n== 反复出现的盲区 ==")
        for g, c in recurring:
            print(f"- {g}（{c} 次）")


def main():
    parser = argparse.ArgumentParser(description="费曼学习法对话记录与进度追踪")
    sub = parser.add_subparsers(dest="command", required=True)

    p_log = sub.add_parser("log", help="记录一次对话")
    p_log.add_argument("--concept", required=True, help="概念名称")
    p_log.add_argument("--rounds", type=int, required=True, help="追问轮数")
    p_log.add_argument("--passed", type=str2bool, required=True, help="是否通过 true/false")
    p_log.add_argument("--score", type=int, choices=range(1, 6), required=True,
                       help="评分 1-5")
    p_log.add_argument("--gaps", default="", help="盲区，用分号分隔")
    p_log.add_argument("--notes", default="", help="一句话点评")
    p_log.set_defaults(func=cmd_log)

    p_report = sub.add_parser("report", help="查看进度报告")
    p_report.add_argument("--concept", help="只看某个概念")
    p_report.set_defaults(func=cmd_report)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
