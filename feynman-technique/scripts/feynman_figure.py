#!/usr/bin/env python3
"""画图闭环助手（仅标准库）。

让「听众要求用户画图」闭环自动化：
  open  打开 excalidraw.com 画布（免登录），并提示导出位置
  wait  阻塞监听 sessions/figures/，用户导出 PNG/.excalidraw 后自动返回路径

典型流程（主 agent 执行）：
  python3 feynman_figure.py open            # 开画布 + 打印保存指引
  python3 feynman_figure.py wait            # 阻塞等待新文件，输出路径
  # 然后读 .excalidraw（JSON 结构）+ PNG（视觉核对），转述进 relay turn
"""
import argparse
import os
import sys
import time
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import feynman_log  # noqa: E402

FIGURES_DIR = os.path.join(feynman_log.LOG_DIR, "figures")
CANVAS_URL = "https://excalidraw.com"
FIGURE_EXTS = (".png", ".svg", ".excalidraw")


def cmd_open(args):
    os.makedirs(FIGURES_DIR, exist_ok=True)
    try:
        webbrowser.open(CANVAS_URL)
        print(f"已在浏览器打开 {CANVAS_URL}（免登录，直接画）")
    except Exception:
        print(f"请手动打开 {CANVAS_URL}")
    print(f"画完后导出两份到 {FIGURES_DIR} ：")
    print("  1. 菜单 → 导出图片 → PNG（视觉呈现）")
    print("  2. 菜单 → 保存到磁盘 → .excalidraw（JSON 结构，AI 读这个更准）")
    print("保存后无需告诉我路径——运行 feynman_figure.py wait 我会自动收到。")


def cmd_wait(args):
    os.makedirs(FIGURES_DIR, exist_ok=True)
    seen = set(os.listdir(FIGURES_DIR))
    deadline = time.time() + args.timeout
    found = []
    last_change = None
    while time.time() < deadline:
        current = [n for n in sorted(os.listdir(FIGURES_DIR))
                   if n.lower().endswith(FIGURE_EXTS)]
        new = [n for n in current if n not in seen]
        if new:
            found.extend(new)
            seen.update(new)
            last_change = time.time()
        elif found and last_change and time.time() - last_change >= args.quiet:
            break
        time.sleep(0.5)
    if not found:
        print(f"等待超时（{args.timeout} 秒）：{FIGURES_DIR} 没有新图文件。\n"
              f"请确认导出到了这个目录，然后重试 wait。",
              file=sys.stderr)
        sys.exit(1)
    for name in found:
        print(os.path.join(FIGURES_DIR, name))
    print("[figure] 请读取上述文件：.excalidraw 拿结构（JSON），PNG 核对视觉；"
          "然后转述进 feynman_relay.py turn。")


def main():
    parser = argparse.ArgumentParser(description="画图闭环助手")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("open", help="打开 excalidraw 画布并提示导出位置")
    p.set_defaults(func=cmd_open)

    p = sub.add_parser("wait", help="阻塞等待 sessions/figures/ 里的新图文件")
    p.add_argument("--timeout", type=int, default=600, help="最长等待秒数（默认 600）")
    p.add_argument("--quiet", type=float, default=3.0,
                   help="最后一份文件落地后安静多少秒判定导出完成（默认 3）")
    p.set_defaults(func=cmd_wait)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
