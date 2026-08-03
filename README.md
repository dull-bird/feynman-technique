# 费曼技巧 Feynman Technique（feynman-technique）

[English README](README.en.md)

一个住在你终端里的费曼学习法 AI 陪练 skill：你讲，它问。AI 扮演零基础但逻辑严谨的听众，连续追问、暴露知识盲区，并把每次对话记录到本地日志追踪进步。

**主页与 3 分钟完整版介绍短片：<https://dull-bird.github.io/feynman-technique/>**

## 安装

```bash
npx skills add dull-bird/feynman-technique -g
```

或者手动安装：

```bash
git clone https://github.com/dull-bird/feynman-technique.git
cp -r feynman-technique/feynman-technique ~/.agents/skills/feynman-technique
```

然后对你的 agent 说：「用费曼学习法，概念是 XX」。

### 自动触发（可选）

装一个 UserPromptSubmit 钩子，说「费曼」「是否真懂」等词时自动唤起 skill（支持 Claude Code / Codex / Kimi Code）：

```bash
python3 ~/.agents/skills/feynman-technique/scripts/install_hooks.py            # 全部安装
python3 ~/.agents/skills/feynman-technique/scripts/install_hooks.py --agent kimi
python3 ~/.agents/skills/feynman-technique/scripts/install_hooks.py --uninstall
```

钩子只注入一条指向 SKILL.md 的紧凑指针（方法细节以文件为准），幂等、可卸载、不影响其他钩子。

## 结构

- `feynman-technique/` — skill 本体（npx skills 只安装这个目录）
  - `SKILL.md` — 会话流程：启动 → 追问 → 盲区处理 → 通过判定 → 记录 → 查进度
  - `references/method.md` — 听众规则、五岁小孩测试、1–5 分评分标准、常见错误
  - `scripts/feynman_log.py` — 对话日志与进度报告（`log` / `report` / `export` 子命令，仅标准库）
  - `scripts/feynman_session.py` — 会话状态机（`start` / `round` / `status` / `close` / `abort`，流程纪律兜底）
  - `scripts/feynman_relay.py` — 盲测接力器（prep 不进主对话，进程兜底调听众 CLI）
  - `scripts/test_feynman_log.py` — pexpect 端到端测试
  - `scripts/build_gallery.py` — 从真实记录生成网站 gallery 数据
- `sessions/` — 本地对话记录（不入库）
- `docs/` — GitHub Pages 网站（含真实对话 gallery）
- `video/` — Remotion 短片源码（产物在 `docs/assets/feynman-intro.mp4`）

## 导出到 Obsidian

```bash
python3 feynman-technique/scripts/feynman_log.py export --vault ~/Documents/MyVault/费曼学习
```

生成 Obsidian 兼容笔记：每个概念一篇（frontmatter + 评分走势 + 会话链接）、每次会话一篇（含完整转写稿）、一篇总索引，可被 Dataview 查询，适合长期回顾。

## 开发

```bash
# 启用提交前检查（每次 commit 自动跑端到端测试并重建 gallery 数据）
git config core.hooksPath .githooks

# 手动运行测试（需要 pexpect：python3 -m venv .venv && .venv/bin/pip install pexpect）
.venv/bin/python feynman-technique/scripts/test_feynman_log.py

# 手动重建网站 gallery 数据（sessions/ 有新对话后）
python3 feynman-technique/scripts/build_gallery.py
```

学习记录（`sessions/`）不入库；gallery 展示数据由构建脚本从真实记录生成，随每次提交自动更新。

## 方法

四步闭环：写下概念 → 讲给外行 → 识别盲区 → 简化类比，循环到顺畅为止。真懂的标准：能解释「为什么」，而不只是描述「是什么」。
