# 费曼学习法陪练（feynman-technique）

一个住在你终端里的费曼学习法 AI 陪练 skill：你讲，它问。AI 扮演零基础但逻辑严谨的听众，连续追问、暴露知识盲区，并把每次对话记录到本地日志追踪进步。

**主页与 45 秒介绍短片：<https://dull-bird.github.io/feynman-technique/>**

## 使用

```bash
git clone https://github.com/dull-bird/feynman-technique.git
cp -r feynman-technique ~/.agents/skills/feynman-technique
```

然后对你的 agent 说：「用费曼学习法，概念是 XX」。

## 结构

- `SKILL.md` — 会话流程：启动 → 追问 → 盲区处理 → 通过判定 → 记录 → 查进度
- `references/method.md` — 听众规则、五岁小孩测试、1–5 分评分标准、常见错误
- `scripts/feynman_log.py` — 对话日志与进度报告（`log` / `report` 子命令，仅标准库）
- `sessions/` — 本地对话记录（不入库）
- `docs/` — GitHub Pages 网站
- `video/` — Remotion 短片源码（产物在 `docs/assets/feynman-intro.mp4`）

## 方法

四步闭环：写下概念 → 讲给外行 → 识别盲区 → 简化类比，循环到顺畅为止。真懂的标准：能解释「为什么」，而不只是描述「是什么」。
