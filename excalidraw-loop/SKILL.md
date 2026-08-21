---
name: excalidraw-loop
description: Excalidraw 协作闭环——AI 生成半成品画布（搭积木、留空位），用户在浏览器里拖拽补全，AI 读回结构差异继续对话。Use when 一张图比口述清楚（流程图、架构图、因果网络），需要用户画图给 AI 看、或 AI 先画草稿让用户改、或要对比用户改前改后的图面差异。零依赖（仅 Python 标准库），不需要 node/docker/MCP。
---

# Excalidraw 协作闭环

让「图」成为 AI 和用户之间的双向通道，零外部依赖（不用 node、docker、MCP server）：

- **AI → 用户**：`seed` 把简化元素 JSON 变成合法 `.excalidraw` 画布底稿——AI 搭好积木、故意留空位（`？` 占位），用户打开就能拖着补；
- **用户 → AI**：`wait` 阻塞监听导出目录，用户保存 PNG + `.excalidraw` 后自动返回路径；
- **评估**：`diff` 对比底稿与用户改后的场景，输出结构化中文差异（改字/新增/删除/移动/连接变化），AI 据此继续对话。

## 用法

```bash
cd <工作目录>   # figures/ 默认建在这里，--dir 可改

# 1. AI 搭积木（可选——也可以让用户从零画，跳到第 2 步）
echo '{"elements": [
  {"type": "box", "id": "cam", "text": "相机"},
  {"type": "box", "id": "gap1", "text": "？", "note": "留给你填"},
  {"type": "arrow", "from": "cam", "to": "gap1", "label": "输出"}
]}' | python3 scripts/excalidraw_loop.py seed

# 2. 打开画布并自动载入底稿（本地起服务 + #url= 上屏，用户不用拖文件）
python3 scripts/excalidraw_loop.py open --load figures/seed-XXX.excalidraw
#    只是让用户从零画时：python3 scripts/excalidraw_loop.py open
#    测试环境加 BROWSER=true 防真开浏览器

# 3. 阻塞等用户导出（PNG 视觉 + .excalidraw 结构，两份都要）
python3 scripts/excalidraw_loop.py wait          # 返回新文件路径

# 4. AI 读回：先读 .excalidraw（JSON 结构），再看 PNG 核对视觉；
#    有 seed 底稿时 diff 出差异
python3 scripts/excalidraw_loop.py diff figures/seed-XXX.excalidraw figures/<用户改的>.excalidraw
```

## 实时画布（live，编辑即同步）

文件乒乓的升级版：本地起一份官方组件打包的画布，用户每一笔防抖 1 秒内落盘，AI 随时可读、随时 diff——不用等导出。

```bash
# 一次性构建（需要 node；产物 canvas/dist 已随 skill 分发，通常不用自己构建）
cd canvas && npm install && npm run build

# 启动（可用 seed 底稿初始化）
python3 scripts/excalidraw_loop.py live --seed figures/seed-XXX.excalidraw --dir figures
# 浏览器打开本地画布；场景实时写入 figures/live-scene.excalidraw
# AI 随时读该文件看进度；wait 等用户"停笔"（安静 3 秒判定）
```

服务只绑 127.0.0.1，空闲 1 小时自动退出。`wait` 同时识别覆盖写入（mtime 变化），live 落盘和手动导出都能捕获。

## seed 简化格式

- `box`：矩形+居中文字，`id` 必填（arrow 引用用），`text` 显示内容，`note` 是给 AI 自己看的备注（不上画布）；
- `arrow`：`from`/`to` 引用 box 的 `id`，`label` 可选；箭头锚定在盒子边缘，用户拖盒子时箭头跟随；
- 布局是简单的三列网格——本来就是要用户拖的，不追求自动排版。

## 两条原则

- **读图先读 JSON，再看 PNG**：`.excalidraw` 里元素、文字、连接都是明确字段，比读像素准；PNG 用于核对手绘部分和整体布局。
- **留空比画全更有用**：AI 搭积木的价值在于故意留空——用户填什么、怎么连，暴露的是理解程度（这正是费曼场景把它当追问用）。
