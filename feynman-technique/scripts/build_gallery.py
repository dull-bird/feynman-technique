#!/usr/bin/env python3
"""从 sessions/ 的真实记录生成网站 gallery 数据文件（仅标准库）。

读取 sessions/log.jsonl 与 sessions/transcripts/*.md，
输出 docs/gallery-data.js（window.FEYNMAN_GALLERY）。

用法：
  python3 feynman-technique/scripts/build_gallery.py
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.join(HERE, "..")
REPO_ROOT = os.path.join(SKILL_DIR, "..")
LOG_FILE = os.path.join(SKILL_DIR, "sessions", "log.jsonl")
TRANSCRIPTS_DIR = os.path.join(SKILL_DIR, "sessions", "transcripts")
OUT_FILE = os.path.join(REPO_ROOT, "docs", "gallery-data.js")

CONCEPT_DOMAINS = {
    "指数基金": "金融",
    "注意力机制（Transformer）": "AI",
    "注意力机制": "AI",
    "贝叶斯定理": "数学",
    "熵": "物理",
    "认知失调": "心理学",
}

MSG_RE = re.compile(r"^\*\*(你|听众)\*\*：(.*)$")


def parse_transcript(path):
    """解析 **你**/**听众** 段落为消息数组，段内多行合并。"""
    messages = []
    current = None
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            m = MSG_RE.match(line)
            if m:
                if current:
                    messages.append(current)
                current = {"who": m.group(1), "text": m.group(2).strip()}
            elif current and line.strip() and not line.startswith("#"):
                current["text"] += "\n" + line.strip()
    if current:
        messages.append(current)
    return messages


def main():
    records = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, encoding="utf-8") as f:
            records = [json.loads(line) for line in f if line.strip()]

    sessions = []
    for r in records:
        messages = []
        if r.get("transcript"):
            tpath = os.path.join(TRANSCRIPTS_DIR, r["transcript"])
            if os.path.isfile(tpath):
                messages = parse_transcript(tpath)
        sessions.append({
            "domain": CONCEPT_DOMAINS.get(r["concept"], "其他"),
            "concept": r["concept"],
            "date": r["date"],
            "rounds": r.get("rounds"),
            "score": r.get("score"),
            "passed": bool(r.get("passed")),
            "gaps": r.get("gaps", []),
            "notes": r.get("notes", ""),
            "messages": messages,
        })

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write("// 由 build_gallery.py 从 sessions/ 真实记录生成，请勿手改\n")
        f.write("window.FEYNMAN_GALLERY = ")
        json.dump(sessions, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    total_msgs = sum(len(s["messages"]) for s in sessions)
    print(f"已生成 {OUT_FILE}：{len(sessions)} 场对话，共 {total_msgs} 条消息")


if __name__ == "__main__":
    main()
