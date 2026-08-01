#!/usr/bin/env python3
"""费曼学习法对话记录与进度追踪（仅标准库）。

用法：
  python3 feynman_log.py log --concept "复利" --rounds 6 --passed true --score 4 \
      --gaps "讲不清利率为何复利累积;缺例子" --notes "第二轮后顺畅" \
      [--transcript 对话转写稿.md]
  python3 feynman_log.py report [--concept "复利"]
  python3 feynman_log.py export --vault /path/to/obsidian/vault/费曼学习

export 生成 Obsidian 兼容笔记：每个概念一篇（frontmatter + 历史表格 + wikilink），
每次会话一篇（含完整转写稿），外加一篇总索引。可指向 Obsidian vault 内的任意目录，
长期回顾、被 Dataview/搜索索引。
"""
import argparse
import json
import os
import re
import shutil
import sys
from collections import defaultdict
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sessions")
LOG_FILE = os.path.join(LOG_DIR, "log.jsonl")
TRANSCRIPTS_DIR = os.path.join(LOG_DIR, "transcripts")


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


def safe_name(text):
    """文件名安全化：保留中英文，替换路径不安全字符。"""
    return re.sub(r'[\\/:*?"<>|]', "-", text).strip()


def cmd_log(args):
    os.makedirs(LOG_DIR, exist_ok=True)
    record = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "concept": args.concept,
        "rounds": args.rounds,
        "passed": args.passed,
        "score": args.score,
        "gaps": [g.strip() for g in (args.gaps or "").split(";") if g.strip()],
        "notes": args.notes or "",
    }
    if args.transcript:
        if not os.path.isfile(args.transcript):
            raise SystemExit(f"转写稿不存在：{args.transcript}")
        os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)
        fname = "{}-{}.md".format(
            datetime.now().strftime("%Y%m%d-%H%M"), safe_name(args.concept))
        shutil.copy2(args.transcript, os.path.join(TRANSCRIPTS_DIR, fname))
        record["transcript"] = fname
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


def session_note_name(record):
    date_part = record["date"].replace(":", "").replace(" ", "-")
    return f"{date_part} {safe_name(record['concept'])}"


def cmd_export(args):
    records = load_records()
    if not records:
        print("还没有任何记录，先 log 再 export。")
        return
    vault = os.path.abspath(args.vault)
    sessions_dir = os.path.join(vault, "会话")
    concepts_dir = os.path.join(vault, "概念")
    os.makedirs(sessions_dir, exist_ok=True)
    os.makedirs(concepts_dir, exist_ok=True)

    # 会话笔记名去重：同一概念同一分钟可能有多场（旧记录精度只到分钟）
    used_names = defaultdict(int)
    note_names = []
    for r in records:
        base = session_note_name(r)
        used_names[base] += 1
        note_names.append(base if used_names[base] == 1
                         else f"{base}-{used_names[base]}")

    # 每次会话一篇笔记（含转写稿全文）
    for r, name in zip(records, note_names):
        frontmatter = [
            "---",
            "type: feynman/session",
            f"concept: \"{r['concept']}\"",
            f"date: {r['date']}",
            f"rounds: {r.get('rounds', 0)}",
            f"score: {r.get('score', 0)}",
            f"passed: {str(bool(r.get('passed'))).lower()}",
            "tags: [费曼学习法]",
            "---",
            "",
        ]
        status = "通过 ✅" if r.get("passed") else "未通过"
        body = [
            f"# {r['date']} {r['concept']}",
            "",
            f"- 概念：[[{safe_name(r['concept'])}]]",
            f"- 结果：{status} · {r.get('rounds', '?')} 轮 · 评分 {r.get('score', '?')}/5",
        ]
        if r.get("gaps"):
            body.append("- 盲区：" + "、".join(r["gaps"]))
        if r.get("notes"):
            body.append(f"- 备注：{r['notes']}")
        body.append("")
        transcript_path = os.path.join(TRANSCRIPTS_DIR, r.get("transcript", ""))
        if r.get("transcript") and os.path.isfile(transcript_path):
            with open(transcript_path, encoding="utf-8") as f:
                body += ["## 对话实录", "", f.read().strip(), ""]
        with open(os.path.join(sessions_dir, name + ".md"), "w", encoding="utf-8") as f:
            f.write("\n".join(frontmatter + body))

    # 每个概念一篇笔记（历史汇总）
    by_concept = defaultdict(list)
    for i, r in enumerate(records):
        by_concept[r["concept"]].append((i, r))
    for concept, rs in by_concept.items():
        scores = [x["score"] for _, x in rs if x.get("score") is not None]
        mastered = bool(rs[-1][1].get("passed"))
        frontmatter = [
            "---",
            "type: feynman/concept",
            f"concept: \"{concept}\"",
            f"sessions: {len(rs)}",
            f"latest_score: {scores[-1] if scores else 0}",
            f"mastered: {str(mastered).lower()}",
            "tags: [费曼学习法]",
            "---",
            "",
        ]
        body = [
            f"# {concept}",
            "",
            f"对话 {len(rs)} 次 · 评分 {' → '.join(map(str, scores)) or '—'} · "
            + ("已掌握 ✅" if mastered else "尚未通过"),
            "",
            "| 日期 | 轮数 | 结果 | 评分 | 盲区 |",
            "|---|---|---|---|---|",
        ]
        for i, x in rs:
            status = "通过" if x.get("passed") else "未通过"
            gaps = "、".join(x.get("gaps", [])) or "—"
            body.append(
                f"| [[{note_names[i]}|{x['date']}]] | {x.get('rounds', '?')} "
                f"| {status} | {x.get('score', '?')} | {gaps} |")
        body.append("")
        with open(os.path.join(concepts_dir, safe_name(concept) + ".md"),
                  "w", encoding="utf-8") as f:
            f.write("\n".join(frontmatter + body))

    # 总索引
    index = [
        "---",
        "type: feynman/index",
        "tags: [费曼学习法]",
        "---",
        "",
        "# 费曼学习记录",
        "",
        f"共 {len(records)} 次对话，{len(by_concept)} 个概念。",
        "",
        "## 概念",
        "",
    ]
    for concept, rs in sorted(by_concept.items(), key=lambda kv: -len(kv[1])):
        mark = "✅" if rs[-1][1].get("passed") else "🔄"
        index.append(f"- {mark} [[{safe_name(concept)}]]（{len(rs)} 次）")
    index += ["", "## 最近会话", ""]
    recent = list(enumerate(records))[-10:][::-1]
    for i, r in recent:
        index.append(f"- [[{note_names[i]}|{r['date']} {r['concept']}]]"
                     f" — {r.get('score', '?')}/5")
    index.append("")
    with open(os.path.join(vault, "费曼学习记录.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(index))

    print(f"已导出到 {vault}：{len(by_concept)} 篇概念笔记、"
          f"{len(records)} 篇会话笔记、1 篇索引")


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
    p_log.add_argument("--transcript", help="对话转写稿路径（.md），归档到 sessions/transcripts/")
    p_log.set_defaults(func=cmd_log)

    p_report = sub.add_parser("report", help="查看进度报告")
    p_report.add_argument("--concept", help="只看某个概念")
    p_report.set_defaults(func=cmd_report)

    p_export = sub.add_parser("export", help="导出为 Obsidian 兼容笔记")
    p_export.add_argument("--vault", required=True, help="导出目录（可指向 Obsidian vault 内）")
    p_export.set_defaults(func=cmd_export)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
