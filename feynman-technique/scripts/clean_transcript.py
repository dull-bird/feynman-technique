#!/usr/bin/env python3
"""双 agent 转写稿清洗器（仅标准库）。

清洗四层污染：ANSI 控制序列、hook 注入噪声块、OOC 元描述行（含跨行碎片）、
说话人前缀重建。幂等：已干净的文件不受影响。

用法: clean_transcript.py <file.md> [file2.md ...]
"""
import re
import sys

ANSI_RE = re.compile(
    r"\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[()><=][0-9;]?|\x1b[78]"
    r"|\[[?>][0-9;]*[a-zA-Z]|\[\d+[;]?\d*[mu]")
HOOK_NOISE = re.compile(
    r"Fact-Forcing|GateGuard|ECC_|user_rec_choice|下次开场白|盲区命中|最近命令")
OOC_LINE = re.compile(
    r"^(just output|output only|continue as|continue persona|the persona|"
    r"i'm playing|i am playing|i need to|i should|speaker should|speaker answers|"
    r"answer:|the speaker|role.?play|thinking|本次对话是|角色扮演|Teach Me)", re.I)
CJK_RE = re.compile(r"[一-鿿]")
SPEAKER_RE = re.compile(r"^\*\*(你|听众)\*\*：")


def clean_text(text):
    text = ANSI_RE.sub("", text)
    blocks = [b for b in text.split("\n\n") if not HOOK_NOISE.search(b)]

    # 判断主语言：CJK 行占比过低（英文稿）时不启用无-CJK丢弃规则
    content_lines = [ln for ln in text.splitlines() if ln.strip()]
    cjk_ratio = (sum(1 for ln in content_lines if CJK_RE.search(ln))
                 / max(1, len(content_lines)))
    drop_non_cjk = cjk_ratio > 0.5

    cleaned = []
    for block in blocks:
        lines = []
        for ln in block.splitlines():
            m = SPEAKER_RE.match(ln)
            rest = ln[m.end():] if m else ln
            if OOC_LINE.match(rest.strip()):
                continue  # 整行出戏
            if drop_non_cjk and not CJK_RE.search(ln) \
                    and not ln.startswith(("#", ">", "-", "```")):
                continue
            lines.append(ln)
        block = "\n".join(lines).strip()
        if block:
            cleaned.append(block)

    # 重建说话人前缀：无前缀块接在听众后是讲解者，接在讲解者后是续段
    out = []
    speaker = None
    for b in cleaned:
        if SPEAKER_RE.match(b):
            speaker = SPEAKER_RE.match(b).group(1)
            out.append(b)
        elif b.startswith(("#", ">")):
            out.append(b)
        elif speaker == "听众":
            out.append("**你**：" + b)
            speaker = "你"
        elif speaker == "你":
            out[-1] += "\n\n" + b
        else:
            out.append(b)
    return "\n\n".join(out) + "\n"


def main():
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as f:
            original = f.read()
        cleaned = clean_text(original)
        if cleaned != original:
            with open(path, "w", encoding="utf-8") as f:
                f.write(cleaned)
            print(f"已清洗 {path}")
        else:
            print(f"无需清洗 {path}")


if __name__ == "__main__":
    main()
