#!/usr/bin/env python3
"""把费曼学习法 UserPromptSubmit 钩子注册到 Claude Code / Codex / Kimi Code。

用法：
  python3 install_hooks.py                 # 安装到全部三个 agent
  python3 install_hooks.py --agent kimi    # 只装某一个
  python3 install_hooks.py --uninstall     # 从全部卸载

幂等：重复运行不会产生重复条目；卸载只移除含本钩子路径的条目。
命令路径取本脚本的绝对路径——从安装位置（如 ~/.agents/skills/feynman-technique）
运行，钩子就指向安装位置。
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

HOOK_SCRIPT = os.path.abspath(os.path.join(os.path.dirname(__file__), "feynman_hook.py"))
HOOK_COMMAND = f"python3 {HOOK_SCRIPT}"
MARKER = "feynman_hook.py"
MATCHER = "费曼|feynman|是否真懂|检验.{0,4}理解"

CLAUDE_SETTINGS = Path(os.path.expanduser("~/.claude/settings.json"))
CODEX_CONFIG = Path(os.path.expanduser("~/.codex/config.toml"))
KIMI_CONFIG = Path(os.path.expanduser("~/.kimi-code/config.toml"))


# ---------- Claude Code（settings.json） ----------

def claude_install(uninstall: bool) -> str:
    data = {}
    if CLAUDE_SETTINGS.exists():
        data = json.loads(CLAUDE_SETTINGS.read_text(encoding="utf-8"))
    hooks = data.setdefault("hooks", {})
    entries = hooks.get("UserPromptSubmit", [])
    # 先移除旧条目（含 MARKER 的 command）
    kept = []
    for entry in entries:
        cmds = [h.get("command", "") for h in entry.get("hooks", [])]
        if not any(MARKER in c for c in cmds):
            kept.append(entry)
    if not uninstall:
        kept.append({
            "matcher": "",
            "hooks": [{"type": "command", "command": HOOK_COMMAND}],
        })
    if kept:
        hooks["UserPromptSubmit"] = kept
    else:
        hooks.pop("UserPromptSubmit", None)
    CLAUDE_SETTINGS.parent.mkdir(parents=True, exist_ok=True)
    CLAUDE_SETTINGS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                               encoding="utf-8")
    return str(CLAUDE_SETTINGS)


# ---------- Codex（config.toml，[[hooks.UserPromptSubmit]] 表） ----------

def codex_install(uninstall: bool) -> str:
    text = CODEX_CONFIG.read_text(encoding="utf-8") if CODEX_CONFIG.exists() else ""
    # 移除旧的 [[hooks.UserPromptSubmit]] 块（含 MARKER）
    pattern = re.compile(
        r"\n*\[\[hooks\.UserPromptSubmit]]\n(?:\[\[hooks\.UserPromptSubmit\.hooks]]\n)?"
        r"(?:(?!\n\[\[|\n\[[^\[]).*\n?)*",
        re.MULTILINE,
    )
    for match in reversed(list(pattern.finditer(text))):
        if MARKER in match.group(0):
            text = text[: match.start()] + text[match.end():]
    if not uninstall:
        # 确保 [features] 里 hooks = true
        if re.search(r"^\[features]", text, re.MULTILINE):
            if not re.search(r"^\[features]\n(?:[^[]*\n)*?hooks\s*=", text, re.MULTILINE):
                text = re.sub(r"^\[features]\n", "[features]\nhooks = true\n",
                              text, count=1, flags=re.MULTILINE)
        else:
            text = text.rstrip("\n") + "\n\n[features]\nhooks = true\n"
        if text and not text.endswith("\n"):
            text += "\n"
        text += (
            "\n[[hooks.UserPromptSubmit]]\n"
            "[[hooks.UserPromptSubmit.hooks]]\n"
            'type = "command"\n'
            f'command = "{HOOK_COMMAND}"\n'
        )
    CODEX_CONFIG.parent.mkdir(parents=True, exist_ok=True)
    CODEX_CONFIG.write_text(text.lstrip("\n"), encoding="utf-8")
    return str(CODEX_CONFIG)


# ---------- Kimi Code（config.toml，[[hooks]] 表） ----------

def kimi_install(uninstall: bool) -> str:
    text = KIMI_CONFIG.read_text(encoding="utf-8") if KIMI_CONFIG.exists() else ""
    pattern = re.compile(r"\n*\[\[hooks]]\n(?:(?!\n\[\[|\n\[[^\[]).*\n?)*", re.MULTILINE)
    for match in reversed(list(pattern.finditer(text))):
        if MARKER in match.group(0):
            text = text[: match.start()] + text[match.end():]
    if not uninstall:
        if text and not text.endswith("\n"):
            text += "\n"
        text += (
            "\n[[hooks]]\n"
            'event = "UserPromptSubmit"\n'
            f'matcher = "{MATCHER}"\n'
            f'command = "{HOOK_COMMAND}"\n'
        )
    KIMI_CONFIG.parent.mkdir(parents=True, exist_ok=True)
    KIMI_CONFIG.write_text(text.lstrip("\n"), encoding="utf-8")
    return str(KIMI_CONFIG)


INSTALLERS = {"claude": claude_install, "codex": codex_install, "kimi": kimi_install}


def main() -> int:
    parser = argparse.ArgumentParser(description="注册费曼学习法 UserPromptSubmit 钩子")
    parser.add_argument("--agent", choices=[*INSTALLERS, "all"], default="all")
    parser.add_argument("--uninstall", action="store_true")
    args = parser.parse_args()

    if not os.path.isfile(HOOK_SCRIPT):
        print(f"错误：找不到钩子脚本 {HOOK_SCRIPT}", file=sys.stderr)
        return 1

    agents = list(INSTALLERS) if args.agent == "all" else [args.agent]
    action = "卸载" if args.uninstall else "安装"
    for name in agents:
        path = INSTALLERS[name](args.uninstall)
        print(f"[{name}] {action}完成：{path}")
    if not args.uninstall:
        print(f"\n钩子命令：{HOOK_COMMAND}")
        print("触发词：费曼 / feynman / 是否真懂 / 检验理解 / 讲给…听")
        print("重启各 agent 会话后生效。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
