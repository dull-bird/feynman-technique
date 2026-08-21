#!/usr/bin/env python3
"""Excalidraw 协作闭环（仅标准库）：AI 搭积木 → 用户拖拽补全 → AI 读回评估。

子命令：
  seed   AI 生成半成品画布：简化元素 JSON → 合法 .excalidraw 场景文件
  open   打开 excalidraw.com（免登录），提示把 seed 文件拖进画布
  wait   阻塞监听导出目录，用户保存后自动返回文件路径
  diff   对比 seed 与用户改后的场景，输出结构化中文差异

seed 输入（简化格式，从 stdin 或 --file 读）：
  {"elements": [
    {"type": "box", "id": "cam", "text": "相机"},
    {"type": "box", "id": "gap1", "text": "？", "note": "留给用户填的空积木"},
    {"type": "arrow", "from": "cam", "to": "gap1", "label": "输出"}
  ]}

目录约定：默认 ./figures/（--dir 覆盖）。搭配 feynman-technique 时指向
feynman-technique/sessions/figures/。
"""
import argparse
import http.server
import json
import mimetypes
import os
import random
import shutil
import socket
import subprocess
import sys
import time
import urllib.parse
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
CANVAS_URL = "https://excalidraw.com"
FIGURE_EXTS = (".png", ".svg", ".excalidraw")
BOX_W, BOX_H = 240, 100
GRID_COLS = 3

_rng = random.SystemRandom()


def _nonce():
    return _rng.randint(1, 2**31 - 1)


def _base(el_id, el_type, x, y, w, h):
    return {
        "id": el_id, "type": el_type, "x": x, "y": y,
        "width": w, "height": h, "angle": 0,
        "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
        "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid",
        "roughness": 1, "opacity": 100, "groupIds": [], "frameId": None,
        "roundness": {"type": 3} if el_type == "rectangle" else None,
        "seed": _nonce(), "version": 1, "versionNonce": _nonce(),
        "isDeleted": False, "boundElements": None,
        "updated": 1, "link": None, "locked": False,
    }


def _text_el(el_id, text, x, y, w, h, container_id=None):
    el = _base(el_id, "text", x, y, w, h)
    el.update({
        "text": text, "originalText": text, "fontSize": 20, "fontFamily": 5,
        "textAlign": "center", "verticalAlign": "middle",
        "containerId": container_id, "lineHeight": 1.25, "baseline": 18,
    })
    return el


def _box(el_id, text, x, y):
    rect = _base(el_id, "rectangle", x, y, BOX_W, BOX_H)
    rect["backgroundColor"] = "#fff9db"
    tid = f"{el_id}-label"
    label = _text_el(tid, text, x + 8, y + 8, BOX_W - 16, BOX_H - 16,
                     container_id=el_id)
    rect["boundElements"] = [{"type": "text", "id": tid}]
    return rect, label


def _anchor(box_pos, el_id, side):
    x, y = box_pos[el_id]
    if side == "right":
        return x + BOX_W, y + BOX_H / 2
    if side == "left":
        return x, y + BOX_H / 2
    if side == "bottom":
        return x + BOX_W / 2, y + BOX_H
    return x + BOX_W / 2, y  # top


def _arrow(el_id, from_id, to_id, box_pos, label=None):
    fx, fy = box_pos[from_id]
    tx, ty = box_pos[to_id]
    dx, dy = tx - fx, ty - fy
    if abs(dx) >= abs(dy):
        s_side, e_side = ("right", "left") if dx >= 0 else ("left", "right")
    else:
        s_side, e_side = ("bottom", "top") if dy >= 0 else ("top", "bottom")
    x1, y1 = _anchor(box_pos, from_id, s_side)
    x2, y2 = _anchor(box_pos, to_id, e_side)
    el = _base(el_id, "arrow", x1, y1, abs(x2 - x1), abs(y2 - y1))
    el.update({
        "points": [[0, 0], [x2 - x1, y2 - y1]],
        "lastCommittedPoint": None,
        "startBinding": {"elementId": from_id, "focus": 0, "gap": 8},
        "endBinding": {"elementId": to_id, "focus": 0, "gap": 8},
        "startArrowhead": None, "endArrowhead": "arrow",
        "roundness": {"type": 2},
    })
    out = [el]
    if label:
        mid_x, mid_y = (x1 + x2) / 2 - 40, (y1 + y2) / 2 - 14
        out.append(_text_el(f"{el_id}-label", label, mid_x, mid_y, 80, 28))
    return out


def _chain_order(boxes, arrows):
    """若箭头把所有 box 串成单链，返回链序 id 列表（蛇形布局用）；否则 None。"""
    nxt, prev = {}, {}
    for a in arrows:
        if a["from"] in nxt or a["to"] in prev:  # 有分支/汇合就不是单链
            return None
        nxt[a["from"]] = a["to"]
        prev[a["to"]] = a["from"]
    starts = [b for b in boxes if b not in prev]
    if len(starts) != 1:
        return None
    order, cur = [], starts[0]
    while cur:
        order.append(cur)
        cur = nxt.get(cur)
    return order if len(order) == len(boxes) else None


def build_scene(spec):
    """简化元素 JSON → Excalidraw 场景 dict。
    布局：箭头构成单链时蛇形排布（行末折返不掉头），否则三列网格。"""
    items = spec.get("elements", [])
    boxes = [i for i in items if i.get("type") == "box"]
    arrows = [i for i in items if i.get("type") == "arrow"]
    chain = _chain_order([b.get("id") or "" for b in boxes], arrows)
    box_pos, box_ids = {}, set()
    elements = []
    for n, item in enumerate(boxes):
        bid = item.get("id") or f"box{n + 1}"
        if bid in box_ids:
            raise ValueError(f"box id 重复：{bid}")
        box_ids.add(bid)
        if chain:
            k = chain.index(bid)
            row, col = k // GRID_COLS, k % GRID_COLS
            if row % 2 == 1:
                col = GRID_COLS - 1 - col  # 蛇形：奇数行右→左
        else:
            row, col = n // GRID_COLS, n % GRID_COLS
        x = 100 + col * (BOX_W + 80)
        y = 100 + row * (BOX_H + 100)
        box_pos[bid] = (x, y)
        rect, label = _box(bid, item.get("text", ""), x, y)
        elements += [rect, label]
    for n, item in enumerate(arrows):
        src, dst = item.get("from"), item.get("to")
        if src not in box_pos or dst not in box_pos:
            raise ValueError(f"arrow 端点未知：{src} → {dst}（box 不存在）")
        aid = item.get("id") or f"arrow{n + 1}"
        elements += _arrow(aid, src, dst, box_pos, item.get("label"))
        # 在两端 box 上登记绑定，拖动时箭头跟随
        for el in elements:
            if el["id"] in (src, dst):
                bound = el["boundElements"] or []
                bound.append({"type": "arrow", "id": aid})
                el["boundElements"] = bound
    return {
        "type": "excalidraw", "version": 2,
        "source": "excalidraw-loop",
        "elements": elements,
        "appState": {"gridSize": None, "viewBackgroundColor": "#ffffff"},
    }


# ---------- diff ----------

def load_scene(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("elements", [])


def label_map(elements):
    """element id → 显示文字（text 元素取其 text；box 取其绑定文字的 text）。"""
    by_id = {e["id"]: e for e in elements
             if e.get("id") and not e.get("isDeleted")}
    labels = {}
    for e in by_id.values():
        if e["type"] == "text" and e.get("text", "").strip():
            labels[e["id"]] = e["text"].strip()
    for e in by_id.values():
        for b in e.get("boundElements") or []:
            if b.get("type") == "text" and b["id"] in labels:
                labels[e["id"]] = labels[b["id"]]
    return by_id, labels


def _disp(eid, by_id, labels):
    if eid in labels:
        return f"「{labels[eid]}」"
    return f"（{by_id.get(eid, {}).get('type', '?')} 元素）"


def _connections(by_id):
    conns = set()
    for e in by_id.values():
        if e["type"] != "arrow":
            continue
        sb, eb = e.get("startBinding"), e.get("endBinding")
        if sb and eb:
            conns.add((sb["elementId"], eb["elementId"]))
    return conns


def diff_scenes(seed_elements, edit_elements):
    """结构化差异（中文，供 AI 读回评估）。"""
    s_by, s_lab = label_map(seed_elements)
    e_by, e_lab = label_map(edit_elements)
    out = []
    # 容器（矩形等）的文字来自其绑定的 text 元素，文字变化只报 text 那一笔
    container_ids = set()
    for e in s_by.values():
        for b in e.get("boundElements") or []:
            if b.get("type") == "text" and b["id"] in s_lab:
                container_ids.add(e["id"])
    for eid, txt in s_lab.items():
        if eid in container_ids:
            continue
        if eid in e_lab and e_lab[eid] != txt:
            out.append(f"改字：「{txt}」→「{e_lab[eid]}」")
        elif eid not in e_by:
            out.append(f"删除：「{txt}」")
    new_texts = [e["text"].strip() for e in e_by.values()
                 if e["type"] == "text" and e["id"] not in s_by
                 and e.get("text", "").strip()]
    for t in new_texts:
        out.append(f"新增文字：「{t}」")
    n_shapes = sum(1 for e in e_by.values()
                   if e["id"] not in s_by and e["type"] != "text")
    if n_shapes:
        out.append(f"新增 {n_shapes} 个图形/手绘元素（无文字，需看 PNG）")
    for eid, el in s_by.items():
        if eid in e_by and el["type"] in ("rectangle", "ellipse", "diamond"):
            d = abs(el["x"] - e_by[eid]["x"]) + abs(el["y"] - e_by[eid]["y"])
            if d > 40:
                out.append(f"移动了 {_disp(eid, s_by, s_lab)}")
    for a, b in sorted(_connections(e_by) - _connections(s_by)):
        out.append(f"新增连接：{_disp(a, e_by, e_lab)} → {_disp(b, e_by, e_lab)}")
    for a, b in sorted(_connections(s_by) - _connections(e_by)):
        out.append(f"断开连接：{_disp(a, s_by, s_lab)} → {_disp(b, s_by, s_lab)}")
    return out


# ---------- 子命令 ----------

def cmd_seed(args):
    raw = args.file.read() if args.file else sys.stdin.read()
    try:
        spec = json.loads(raw)
        scene = build_scene(spec)
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"seed 输入无效：{exc}", file=sys.stderr)
        sys.exit(2)
    os.makedirs(args.dir, exist_ok=True)
    path = os.path.join(args.dir,
                        f"seed-{time.strftime('%Y%m%d-%H%M%S')}.excalidraw")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(scene, f, ensure_ascii=False, indent=1)
    print(path)
    print(f"[seed] 已生成画布底稿（{len(scene['elements'])} 个元素）。"
          f"请用户把它拖进 excalidraw.com 画布（或菜单 → 打开），"
          f"补全/拖动后导出 PNG + .excalidraw 到同目录，"
          f"然后 wait 收取、diff 对比。")


# ---------- 本地服务 ----------

def _make_handler(live=False, scene_path=None, dist_dir=None):
    """静态服务：普通模式带 CORS（供 excalidraw.com #url= 跨域拉取）；
    live 模式服务画布 dist + GET/POST /api/scene（同源，实时落盘）。"""
    dist_root = os.path.abspath(dist_dir) if dist_dir else ""

    class Handler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            super().end_headers()

        def do_OPTIONS(self):  # PNA 预检
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.end_headers()

        def log_message(self, *args):  # 静默
            pass

        def do_GET(self):
            if not live:
                super().do_GET()
                return
            if self.path.startswith("/api/scene"):
                body = b'{"type":"excalidraw","version":2,"elements":[],"appState":{}}'
                if scene_path and os.path.isfile(scene_path):
                    with open(scene_path, "rb") as f:
                        body = f.read()
                self._send(200, body, "application/json")
                return
            rel = self.path.split("?")[0].lstrip("/") or "index.html"
            full = os.path.normpath(os.path.join(dist_root, rel))
            if not full.startswith(dist_root):
                self.send_error(403)
                return
            if not os.path.isfile(full):
                # SPA 回退：无扩展名的路径回 index.html，资源缺失则 404
                if "." not in os.path.basename(rel):
                    full = os.path.join(dist_root, "index.html")
                else:
                    self.send_error(404)
                    return
            self._send(200, open(full, "rb").read(),
                       mimetypes.guess_type(full)[0] or "application/octet-stream")

        def do_POST(self):
            if live and self.path.startswith("/api/scene"):
                length = int(self.headers.get("Content-Length") or 0)
                if length > 10 * 1024 * 1024:
                    self.send_error(413)
                    return
                try:
                    data = json.loads(self.rfile.read(length).decode("utf-8"))
                    if not isinstance(data.get("elements"), list):
                        raise ValueError("no elements")
                except (ValueError, UnicodeDecodeError):
                    self.send_error(400, "invalid scene")
                    return
                tmp = scene_path + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                os.replace(tmp, scene_path)  # 原子写，读者不会拿到半截
                self.send_response(204)
                self.end_headers()
                return
            self.send_error(404)

        def _send(self, code, body, ctype):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return Handler


def _free_port(preferred):
    for port in (preferred, 0):
        try:
            with socket.socket() as s:
                s.bind(("127.0.0.1", port))
                return s.getsockname()[1]
        except OSError:
            continue
    return 8797


def cmd_serve(args):
    if not args.live:
        os.chdir(args.dir)
    handler = _make_handler(
        live=args.live,
        scene_path=os.path.join(args.dir, args.scene) if args.live else None,
        dist_dir=os.path.join(HERE, "..", "canvas", "dist") if args.live else None,
    )
    server = http.server.HTTPServer(("127.0.0.1", args.port), handler)
    server.timeout = 1
    deadline = time.time() + args.ttl
    while time.time() < deadline:
        server.handle_request()
        deadline = time.time() + args.ttl  # ttl = 无请求的空闲上限


def cmd_live(args):
    """实时画布：本地服务 + 官方组件打包页，编辑即落盘，随时可读可 diff。"""
    dist = os.path.join(HERE, "..", "canvas", "dist")
    if not os.path.isdir(dist):
        print("画布前端未构建。先运行：\n"
              "  cd excalidraw-loop/canvas && npm install && npm run build",
              file=sys.stderr)
        sys.exit(2)
    os.makedirs(args.dir, exist_ok=True)
    scene_path = os.path.join(args.dir, "live-scene.excalidraw")
    if args.seed:
        if not os.path.isfile(args.seed):
            print(f"seed 文件不存在：{args.seed}", file=sys.stderr)
            sys.exit(2)
        shutil.copy2(args.seed, scene_path)
    elif not os.path.isfile(scene_path):
        with open(scene_path, "w", encoding="utf-8") as f:
            json.dump({"type": "excalidraw", "version": 2,
                       "source": "excalidraw-loop",
                       "elements": [], "appState": {}}, f)
    port = _free_port(8798)
    proc = subprocess.Popen(
        [sys.executable, os.path.abspath(__file__), "serve", "--live",
         "--dir", args.dir, "--port", str(port), "--scene",
         os.path.basename(scene_path)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        start_new_session=True)
    for _ in range(30):  # 等服务就绪
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                break
        except OSError:
            time.sleep(0.1)
    url = f"http://127.0.0.1:{port}"
    try:
        webbrowser.open(url)
        print(f"已在浏览器打开 {url}")
    except Exception:
        print(f"请手动打开 {url}")
    print(f"实时画布服务：PID {proc.pid}，空闲 {3600 // 60} 分钟自动退出")
    print(f"场景实时落盘：{scene_path}")
    print("[live] 用户的每一笔约 1 秒内写入该文件——随时读取/diff；"
          "等用户停笔用 wait。")


def cmd_open(args):
    os.makedirs(args.dir, exist_ok=True)
    if args.load:
        # 自动上屏：起本地服务 + 用 #url= 让 excalidraw.com 直接拉取场景
        path = os.path.abspath(args.load)
        if not os.path.isfile(path):
            print(f"文件不存在：{path}", file=sys.stderr)
            sys.exit(2)
        port = _free_port(8797)
        proc = subprocess.Popen(
            [sys.executable, os.path.abspath(__file__), "serve",
             "--dir", os.path.dirname(path), "--port", str(port)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True)
        for _ in range(30):  # 等服务就绪
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                    break
            except OSError:
                time.sleep(0.1)
        raw = f"http://127.0.0.1:{port}/{urllib.parse.quote(os.path.basename(path))}"
        url = f"{CANVAS_URL}/#url={urllib.parse.quote(raw)}"
        print(f"本地服务已启动（PID {proc.pid}，1 小时后自动退出）")
        print(f"画布链接：{url}")
    else:
        url = CANVAS_URL
    try:
        webbrowser.open(url)
        print(f"已在浏览器打开 {url}")
    except Exception:
        print(f"请手动打开 {url}")
    if not args.load:
        print(f"画完导出两份到 {args.dir} ：PNG（导出图片）+ .excalidraw（保存到磁盘）。")


def cmd_wait(args):
    os.makedirs(args.dir, exist_ok=True)

    def snapshot():
        out = {}
        for name in os.listdir(args.dir):
            if name.lower().endswith(FIGURE_EXTS):
                try:
                    out[name] = os.path.getmtime(os.path.join(args.dir, name))
                except OSError:
                    pass
        return out

    seen = snapshot()
    deadline = time.time() + args.timeout
    found, last_change = [], None
    while time.time() < deadline:
        current = snapshot()
        # 新文件或已有文件被重新写入（mtime 变化，覆盖导出/实时落盘）都算活动
        changed = [n for n, m in current.items()
                   if n not in seen or seen[n] != m]
        if changed:
            for n in changed:
                if n not in found:
                    found.append(n)
            seen.update({n: current[n] for n in changed})
            last_change = time.time()
        elif found and last_change and time.time() - last_change >= args.quiet:
            break
        time.sleep(0.5)
    if not found:
        print(f"等待超时（{args.timeout} 秒）：{args.dir} 没有新图文件。",
              file=sys.stderr)
        sys.exit(1)
    for name in found:
        print(os.path.join(args.dir, name))


def cmd_diff(args):
    changes = diff_scenes(load_scene(args.seed), load_scene(args.edited))
    if not changes:
        print("无结构变化（用户未改动图面）。")
    else:
        print("\n".join(changes))


def main():
    parser = argparse.ArgumentParser(
        description="Excalidraw 协作闭环：AI 搭积木 → 用户补全 → AI 读回")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("seed", help="简化元素 JSON → .excalidraw 场景底稿")
    p.add_argument("--file", type=argparse.FileType(encoding="utf-8"),
                   help="简化元素 JSON 文件（缺省读 stdin）")
    p.add_argument("--dir", default="figures", help="输出目录（默认 ./figures/）")
    p.set_defaults(func=cmd_seed)

    p = sub.add_parser("open", help="打开 excalidraw.com 画布（--load 自动载入场景文件）")
    p.add_argument("--dir", default="figures")
    p.add_argument("--load", help="场景文件路径：起本地服务 + #url= 自动上屏，免拖拽")
    p.set_defaults(func=cmd_open)

    p = sub.add_parser("serve", help="（内部用）本地服务；--live 为实时画布模式")
    p.add_argument("--dir", default="figures")
    p.add_argument("--port", type=int, default=8797)
    p.add_argument("--ttl", type=int, default=3600, help="无请求空闲多少秒后退出（默认 3600）")
    p.add_argument("--live", action="store_true", help="实时画布模式（dist 静态 + /api/scene）")
    p.add_argument("--scene", default="live-scene.excalidraw", help="live 模式落盘文件名")
    p.set_defaults(func=cmd_serve)

    p = sub.add_parser("live", help="实时画布：编辑即落盘，AI 随时读/diff（需先构建 canvas）")
    p.add_argument("--dir", default="figures")
    p.add_argument("--seed", help="用 seed 底稿初始化画布")
    p.set_defaults(func=cmd_live)

    p = sub.add_parser("wait", help="阻塞等待目录里的新图文件")
    p.add_argument("--dir", default="figures")
    p.add_argument("--timeout", type=int, default=600)
    p.add_argument("--quiet", type=float, default=3.0)
    p.set_defaults(func=cmd_wait)

    p = sub.add_parser("diff", help="对比 seed 与用户改后的场景")
    p.add_argument("seed", help="seed 场景文件路径")
    p.add_argument("edited", help="用户改后的 .excalidraw 文件路径")
    p.set_defaults(func=cmd_diff)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
