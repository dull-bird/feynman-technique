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

CONCEPT_DOMAINS = {
    "指数基金": ("金融", "Finance"),
    "注意力机制（Transformer）": ("AI", "AI"),
    "注意力机制": ("AI", "AI"),
    "贝叶斯定理": ("数学", "Math"),
    "熵": ("物理", "Physics"),
    "认知失调": ("心理学", "Psychology"),
    "Index Funds": ("金融", "Finance"),
    "Attention Mechanism": ("AI", "AI"),
    "Bayes' Theorem": ("数学", "Math"),
    "Entropy": ("物理", "Physics"),
    "Cognitive Dissonance": ("心理学", "Psychology"),
}

MSG_RE = re.compile(r"^\*\*(你|听众|You|Listener)\*\*[:：](.*)$")
ROLE_MAP = {"你": "you", "听众": "listener", "You": "you", "Listener": "listener"}
CJK_RE = re.compile(r"[一-鿿]")


def is_chinese(text):
    return bool(CJK_RE.search(text))


def parse_transcript(path):
    """解析 **你**/**听众**（或 **You**/**Listener**）段落为消息数组。"""
    messages = []
    current = None
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            m = MSG_RE.match(line)
            if m:
                if current:
                    messages.append(current)
                current = {"who": ROLE_MAP.get(m.group(1), m.group(1)),
                           "text": m.group(2).strip()}
            elif current and line.strip() and not line.startswith("#"):
                current["text"] += "\n" + line.strip()
    if current:
        messages.append(current)
    return messages


OUT_FILE_ZH = os.path.join(REPO_ROOT, "docs", "gallery-data.js")
OUT_FILE_EN = os.path.join(REPO_ROOT, "docs", "gallery-data-en.js")


def main():
    records = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, encoding="utf-8") as f:
            records = [json.loads(line) for line in f if line.strip()]

    all_sessions = []
    for r in records:
        messages = []
        if r.get("transcript"):
            tpath = os.path.join(TRANSCRIPTS_DIR, r["transcript"])
            if os.path.isfile(tpath):
                messages = parse_transcript(tpath)
        domains = CONCEPT_DOMAINS.get(r["concept"], ("其他", "Other"))
        all_sessions.append({
            "domain_zh": domains[0],
            "domain_en": domains[1],
            "concept": r["concept"],
            "date": r["date"],
            "rounds": r.get("rounds"),
            "score": r.get("score"),
            "passed": bool(r.get("passed")),
            "gaps": r.get("gaps", []),
            "notes": r.get("notes", ""),
            "dual": "双agent实测" in r.get("notes", ""),
            "messages": messages,
            "lang": "zh" if is_chinese(r["concept"]) else "en",
        })

    for out_file, lang, domain_key in (
        (OUT_FILE_ZH, "zh", "domain_zh"),
        (OUT_FILE_EN, "en", "domain_en"),
    ):
        sessions = []
        for s in all_sessions:
            if s["lang"] != lang:
                continue
            entry = dict(s)
            entry["domain"] = s[domain_key]
            sessions.append(entry)
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            f.write("// 由 build_gallery.py 从 sessions/ 真实记录生成，请勿手改\n")
            f.write("window.FEYNMAN_GALLERY = ")
            json.dump(sessions, f, ensure_ascii=False, indent=2)
            f.write(";\n")
        total_msgs = sum(len(s["messages"]) for s in sessions)
        print(f"已生成 {out_file}：{len(sessions)} 场对话，共 {total_msgs} 条消息")


if __name__ == "__main__":
    main()
