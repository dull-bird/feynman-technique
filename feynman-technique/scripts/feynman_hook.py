#!/usr/bin/env python3
"""费曼学习法 skill 的 UserPromptSubmit 钩子（仅标准库）。

用户消息命中费曼相关关键词时，向上下文注入一条【紧凑指针】，
指向本 skill 的 SKILL.md，要求 agent 阅读文件后按流程执行。
钩子里不内联方法细节——细节以文件为准，SKILL.md 更新即生效。

支持 Claude Code / Codex / Kimi Code 的 UserPromptSubmit 事件：
三者都通过 stdin 传 JSON、stdout 文本追加进上下文、exit 0 放行。
本钩子永不阻塞（fail-open），匹配失败时静默退出。
"""
import json
import os
import re
import sys

# 触发词：费曼中文/英文、以及用户表达「检验是否真懂」的常见说法
PATTERN = re.compile(
    r"费曼|feynman|费曼学习|费曼一下|"
    r"是否真懂|是不是真的懂|检验(一下)?(我的)?理解|讲给.{0,4}听",
    re.IGNORECASE,
)

SKILL_MD = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "SKILL.md"))
METHOD_MD = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "references", "method.md"))

CONTEXT_TEMPLATE = """\
[费曼学习法] 用户的消息触发了费曼学习法陪练 skill。
在回应之前，请先阅读 {skill} 并按其中的「会话流程」执行
（准备阶段：搜索查证→第一性拆解→定标→历史联动；然后扮演听众逐轮追问；结束后记录）。
听众规则细则见 {method}。
若用户本意并非启动费曼学习（只是顺带提到该词），忽略本提示正常回答即可。"""


def extract_prompt(payload):
    """兼容各家 payload 的提示词字段。"""
    for key in ("prompt", "text", "user_prompt", "user_input", "message"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return ""


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except (json.JSONDecodeError, ValueError):
        return 0  # 解析失败：静默放行

    prompt = extract_prompt(payload)
    if not prompt or not PATTERN.search(prompt):
        return 0  # 未命中：静默放行

    print(CONTEXT_TEMPLATE.format(skill=SKILL_MD, method=METHOD_MD))
    return 0


if __name__ == "__main__":
    sys.exit(main())
