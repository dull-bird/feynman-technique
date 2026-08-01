# AGENTS.md

费曼技巧（feynman-technique）skill：用户向 AI 讲解概念，AI 扮演零基础听众连续追问、暴露盲区、记录进步。仓库同时包含 skill 本体、GitHub Pages 网站和 Remotion 介绍视频。

## 结构

- `feynman-technique/` — skill 本体（npx skills 只安装这个目录，勿把网站/视频文件放进来）
  - `SKILL.md` — 会话流程（准备→追问→盲区→判定→记录→查进度→导出）
  - `references/method.md` — 听众规则、准备义务、评分标准
  - `scripts/feynman_log.py` — 日志与报告（`log` / `report` / `export`，仅标准库）
  - `scripts/feynman_session.py` — 会话状态机（`start` / `round` / `status` / `close` / `abort`，仅标准库）
  - `scripts/feynman_hook.py` — UserPromptSubmit 自动触发钩子（仅标准库）
  - `scripts/install_hooks.py` — 三 agent 钩子安装器（Claude Code / Codex / Kimi）
  - `scripts/test_feynman_log.py` — pexpect 端到端测试（需 `.venv` 里的 pexpect）
  - `scripts/build_gallery.py` — 从 `sessions/` 生成 `docs/gallery-data.js`
- `sessions/` — 本地学习记录（**不入库**，gitignored）
- `docs/` — GitHub Pages 网站（`index.html` 中文版 / `en/index.html` 英文版 / `styles.css` / `main.js`（按 `html lang` 切换 UI 文案）/ `gallery-data.js` / `assets/`）
- `video/` — Remotion 视频源码（产物渲染到 `docs/assets/feynman-intro.mp4`）

## 铁律：每次修改都要检查三处联动

**做任何改动后，必须自问：README、GitHub Page（docs/）、视频（video/）是否需要同步更新？**

- 改了 skill 行为（流程、命令、参数）→ 检查 `README.md` 用法章节、`docs/index.html` 对应板块文案、视频旁白是否还准确
- 改了安装方式 → 三处全查（README 安装段、网页安装板块与 Hero 复制按钮、视频 InstallScene 旁白）
- 改了 `feynman_log.py` 的命令或输出 → 检查 README、网页「进步追踪/导出」板块、`scripts/test_feynman_log.py`
- 改了设计令牌（颜色/字体）→ 网页 `styles.css` 与视频 `video/src/theme.ts` 必须一致
- 不需要同步时，在回复里用一句话说明"已检查，三处无需联动"

## 开发规则

- **提交前**：pre-commit 钩子自动跑 `test_feynman_log.py` 并重建 `docs/gallery-data.js`（`git config core.hooksPath .githooks` 启用）。测试失败不许提交
- **测试**：`.venv/bin/python feynman-technique/scripts/test_feynman_log.py`，全绿才算完
- **测试隔离**：测试会备份恢复 `sessions/log.jsonl` 与 `sessions/transcripts/`，不得污染真实学习记录
- **依赖**：Python 脚本只用标准库（pexpect 测试除外，装在 `.venv/`）；不引入新依赖
- **设计令牌**：ink `#1A2E26` / paper `#F7F3E9` / chalk `#F2EFE4` / yellow `#E9C46A` / red `#D64533` / sage `#7FA08C`；标题 Noto Serif SC，正文 Noto Sans SC，短批注 Zhi Mang Xing（长句禁用手写体），代码 JetBrains Mono
- **部署**：push 到 `main` 后 GitHub Pages 自动从 `/docs` 发布；线上验证用产物字节数做指纹比对，不要只看 HTTP 200
- **git 提交**：遵循用户确认后再 commit/push 的默认规则

## 视频工作流

- 旁白文案改 → 先跑 TTS（`video/narration/`，凭证 `source ~/Documents/work/repos/diamond-sutra-skill/promo-video/.env`，不读不打印）→ 实测音长反推时间轴（先配音、后定轴）→ 渲染覆盖 `docs/assets/feynman-intro.mp4`
- 渲染后必须抽帧验收（ReadMediaFile）：中文不缺字形、无溢出、长句不用潦草手写体
- 配音中间产物（segments*/ 下的 mp3/wav）不入库
