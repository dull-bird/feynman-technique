#!/usr/bin/env python3
"""excalidraw_loop.py 的测试（仅标准库 unittest，无 pexpect 依赖）。

运行：python3 excalidraw-loop/scripts/test_excalidraw_loop.py
"""
import json
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import excalidraw_loop as loop  # noqa: E402

SCRIPT = os.path.join(HERE, "excalidraw_loop.py")
DIST = os.path.join(HERE, "..", "canvas", "dist")

SPEC = {"elements": [
    {"type": "box", "id": "cam", "text": "相机"},
    {"type": "box", "id": "depth", "text": "深度图"},
    {"type": "box", "id": "gap1", "text": "？", "note": "留给用户"},
    {"type": "arrow", "from": "cam", "to": "gap1", "label": "输出"},
]}

REQUIRED_KEYS = {"id", "type", "x", "y", "width", "height", "angle",
                 "strokeColor", "backgroundColor", "fillStyle", "strokeWidth",
                 "strokeStyle", "roughness", "opacity", "groupIds", "seed",
                 "version", "versionNonce", "isDeleted", "updated",
                 "link", "locked"}


class TestSeed(unittest.TestCase):
    def setUp(self):
        self.scene = loop.build_scene(SPEC)
        self.elements = self.scene["elements"]

    def test_scene_envelope(self):
        self.assertEqual(self.scene["type"], "excalidraw")
        self.assertEqual(self.scene["version"], 2)
        self.assertIn("appState", self.scene)

    def test_element_counts_and_fields(self):
        # 3 box → 3 矩形 + 3 文字；1 arrow + 1 箭头标签 = 8 个元素
        self.assertEqual(len(self.elements), 8)
        for el in self.elements:
            missing = REQUIRED_KEYS - set(el)
            self.assertFalse(missing, f"{el['id']} 缺字段 {missing}")

    def test_ids_unique(self):
        ids = [el["id"] for el in self.elements]
        self.assertEqual(len(ids), len(set(ids)))

    def test_box_text_binding(self):
        cam = next(e for e in self.elements if e["id"] == "cam")
        label = next(e for e in self.elements if e["id"] == "cam-label")
        self.assertEqual(label["containerId"], "cam")
        self.assertEqual(label["text"], "相机")
        self.assertIn({"type": "text", "id": "cam-label"},
                      cam["boundElements"])

    def test_arrow_binding_and_anchors(self):
        arrow = next(e for e in self.elements if e["type"] == "arrow")
        self.assertEqual(arrow["startBinding"]["elementId"], "cam")
        self.assertEqual(arrow["endBinding"]["elementId"], "gap1")
        self.assertEqual(arrow["endArrowhead"], "arrow")
        self.assertEqual(len(arrow["points"]), 2)
        # 两端 box 都登记了绑定（拖动跟随）
        for bid in ("cam", "gap1"):
            box = next(e for e in self.elements if e["id"] == bid)
            self.assertIn({"type": "arrow", "id": arrow["id"]},
                          box["boundElements"])

    def test_duplicate_box_id_rejected(self):
        bad = {"elements": [{"type": "box", "id": "a", "text": "1"},
                            {"type": "box", "id": "a", "text": "2"}]}
        with self.assertRaises(ValueError):
            loop.build_scene(bad)

    def test_arrow_unknown_endpoint_rejected(self):
        bad = {"elements": [{"type": "box", "id": "a", "text": "1"},
                            {"type": "arrow", "from": "a", "to": "幽灵"}]}
        with self.assertRaises(ValueError):
            loop.build_scene(bad)

    def test_chain_serpentine_layout(self):
        """单链结构走蛇形布局：行末折返不掉头，第二行右→左。"""
        spec = {"elements": [
            *[{"type": "box", "id": f"b{i}", "text": str(i)} for i in range(5)],
            *[{"type": "arrow", "from": f"b{i}", "to": f"b{i + 1}"}
              for i in range(4)],
        ]}
        scene = loop.build_scene(spec)
        pos = {e["id"]: (e["x"], e["y"]) for e in scene["elements"]
               if e["type"] == "rectangle"}
        self.assertLess(pos["b0"][0], pos["b1"][0])   # 第一行左→右
        self.assertLess(pos["b1"][0], pos["b2"][0])
        self.assertGreater(pos["b3"][1], pos["b2"][1])  # 折到第二行
        self.assertGreater(pos["b3"][0], pos["b4"][0])  # 第二行右→左
        # 折返箭头 b2→b3 垂直锚定（底→顶），不横穿画布
        arrow = next(e for e in scene["elements"] if e["type"] == "arrow"
                     and e["startBinding"]["elementId"] == "b2")
        self.assertEqual(arrow["x"], pos["b2"][0] + loop.BOX_W / 2)

    def test_branching_falls_back_to_grid(self):
        """有分支/汇合就不是单链，退回网格布局（声明顺序）。"""
        spec = {"elements": [
            {"type": "box", "id": "a", "text": "a"},
            {"type": "box", "id": "b", "text": "b"},
            {"type": "box", "id": "c", "text": "c"},
            {"type": "arrow", "from": "a", "to": "b"},
            {"type": "arrow", "from": "a", "to": "c"},
        ]}
        scene = loop.build_scene(spec)
        pos = {e["id"]: e["x"] for e in scene["elements"]
               if e["type"] == "rectangle"}
        self.assertLess(pos["a"], pos["b"])
        self.assertLess(pos["b"], pos["c"])


class TestDiff(unittest.TestCase):
    def setUp(self):
        self.seed = loop.build_scene(SPEC)["elements"]

    def test_no_change(self):
        self.assertEqual(loop.diff_scenes(self.seed, self.seed), [])

    def _edited(self):
        # 模拟用户：深拷贝后改动
        return json.loads(json.dumps(self.seed))

    def test_text_edited(self):
        edited = self._edited()
        gap_label = next(e for e in edited if e["id"] == "gap1-label")
        gap_label["text"] = "点图"
        gap_label["originalText"] = "点图"
        out = loop.diff_scenes(self.seed, edited)
        self.assertIn("改字：「？」→「点图」", out)

    def test_user_adds_box_and_arrow(self):
        edited = self._edited()
        rect, label = loop._box("new1", "位姿", 500, 300)
        edited += [rect, label]
        edited += loop._arrow("new-arrow", "depth", "new1",
                              {"depth": (100, 300), "new1": (500, 300)})
        out = loop.diff_scenes(self.seed, edited)
        self.assertIn("新增文字：「位姿」", out)
        self.assertTrue(any("新增连接" in line and "深度图" in line
                            and "位姿" in line for line in out),
                        f"缺新增连接：{out}")

    def test_user_deletes_and_moves(self):
        edited = self._edited()
        edited = [e for e in edited if not e["id"].startswith("depth")]
        cam = next(e for e in edited if e["id"] == "cam")
        cam["x"] += 200  # 移动超过阈值
        out = loop.diff_scenes(self.seed, edited)
        self.assertIn("删除：「深度图」", out)
        self.assertIn("移动了 「相机」".replace(" ", ""), [line.replace(" ", "") for line in out])


class TestCli(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="excalidraw-loop-test-")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_cli(self, args, stdin=None):
        return subprocess.run([sys.executable, SCRIPT] + args,
                              capture_output=True, text=True, input=stdin)

    def test_seed_cli_roundtrip(self):
        result = self.run_cli(["seed", "--dir", self.tmp],
                              stdin=json.dumps(SPEC))
        self.assertEqual(result.returncode, 0, result.stderr)
        seed_path = result.stdout.splitlines()[0]
        with open(seed_path, encoding="utf-8") as f:
            scene = json.load(f)
        self.assertEqual(scene["type"], "excalidraw")

    def test_seed_cli_bad_input(self):
        result = self.run_cli(["seed", "--dir", self.tmp], stdin="不是 JSON")
        self.assertEqual(result.returncode, 2)
        self.assertIn("seed 输入无效", result.stderr)

    def test_open_guidance(self):
        env = {**os.environ, "BROWSER": "true"}  # 不真开浏览器
        result = subprocess.run([sys.executable, SCRIPT, "open",
                                 "--dir", self.tmp],
                                capture_output=True, text=True, env=env)
        self.assertEqual(result.returncode, 0)
        self.assertIn("excalidraw.com", result.stdout)

    def test_wait_detects_and_timeout(self):
        proc = subprocess.Popen([sys.executable, SCRIPT, "wait",
                                 "--dir", self.tmp, "--timeout", "30",
                                 "--quiet", "1"],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True)
        time.sleep(1.5)  # 等 wait 完成目录快照
        png = os.path.join(self.tmp, "fig.png")
        with open(png, "w", encoding="utf-8") as f:
            f.write("fake")
        out, _ = proc.communicate(timeout=40)
        self.assertEqual(proc.returncode, 0)
        self.assertIn(png, out)
        # 超时分支
        result = self.run_cli(["wait", "--dir", self.tmp,
                               "--timeout", "2", "--quiet", "1"])
        self.assertEqual(result.returncode, 1)
        self.assertIn("等待超时", result.stderr)

    def test_diff_cli(self):
        seed_path = os.path.join(self.tmp, "seed.excalidraw")
        edit_path = os.path.join(self.tmp, "edit.excalidraw")
        scene = loop.build_scene(SPEC)
        with open(seed_path, "w", encoding="utf-8") as f:
            json.dump(scene, f, ensure_ascii=False)
        result = self.run_cli(["diff", seed_path, seed_path])
        self.assertIn("无结构变化", result.stdout)
        edited = json.loads(json.dumps(scene))
        label = next(e for e in edited["elements"] if e["id"] == "gap1-label")
        label["text"] = "点图"
        with open(edit_path, "w", encoding="utf-8") as f:
            json.dump(edited, f, ensure_ascii=False)
        result = self.run_cli(["diff", seed_path, edit_path])
        self.assertIn("改字：「？」→「点图」", result.stdout)

    def test_wait_detects_overwrite(self):
        """wait 也捕获已有文件的覆盖写入（mtime 变化，live 落盘场景）。"""
        path = os.path.join(self.tmp, "live-scene.excalidraw")
        with open(path, "w", encoding="utf-8") as f:
            f.write("{}")
        time.sleep(1.1)  # 保证 mtime 粒度可区分
        proc = subprocess.Popen([sys.executable, SCRIPT, "wait",
                                 "--dir", self.tmp, "--timeout", "30",
                                 "--quiet", "1"],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True)
        time.sleep(1.5)  # 让 wait 先完成快照
        with open(path, "w", encoding="utf-8") as f:
            f.write('{"elements": []}')
        out, _ = proc.communicate(timeout=40)
        self.assertEqual(proc.returncode, 0)
        self.assertIn(path, out)

    @unittest.skipUnless(os.path.isdir(DIST), "画布前端未构建（npm run build）")
    def test_live_serve_api(self):
        """serve --live：POST /api/scene 原子落盘、GET 回读、/ 返回画布页。"""
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        proc = subprocess.Popen([sys.executable, SCRIPT, "serve", "--live",
                                 "--dir", self.tmp, "--port", str(port)],
                                stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL,
                                start_new_session=True)
        try:
            for _ in range(30):
                try:
                    with socket.create_connection(("127.0.0.1", port), 0.2):
                        break
                except OSError:
                    time.sleep(0.1)
            scene = {"type": "excalidraw", "version": 2,
                     "elements": [{"id": "t1", "type": "rectangle"}],
                     "appState": {}}
            req = urllib.request.Request(
                f"http://127.0.0.1:{port}/api/scene",
                data=json.dumps(scene).encode("utf-8"),
                headers={"Content-Type": "application/json"}, method="POST")
            self.assertEqual(urllib.request.urlopen(req, timeout=5).status, 204)
            scene_file = os.path.join(self.tmp, "live-scene.excalidraw")
            with open(scene_file, encoding="utf-8") as f:
                self.assertEqual(json.load(f)["elements"][0]["id"], "t1")
            got = json.loads(urllib.request.urlopen(
                f"http://127.0.0.1:{port}/api/scene", timeout=5).read())
            self.assertEqual(got["elements"][0]["id"], "t1")
            html = urllib.request.urlopen(
                f"http://127.0.0.1:{port}/", timeout=5).read().decode("utf-8")
            self.assertIn('id="root"', html)
        finally:
            proc.kill()

    def test_open_load_autoserve(self):
        """open --load：起本地服务（CORS + PNA 头）并拼出 #url= 自动上屏链接。"""
        scene_path = os.path.join(self.tmp, "底稿.excalidraw")
        with open(scene_path, "w", encoding="utf-8") as f:
            json.dump(loop.build_scene(SPEC), f, ensure_ascii=False)
        env = {**os.environ, "BROWSER": "true"}
        result = subprocess.run([sys.executable, SCRIPT, "open",
                                 "--dir", self.tmp, "--load", scene_path],
                                capture_output=True, text=True, env=env)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("#url=http%3A//127.0.0.1", result.stdout)
        port = int(re.search(r"127\.0\.0\.1%3A(\d+)", result.stdout).group(1))
        pid = int(re.search(r"PID (\d+)", result.stdout).group(1))
        try:
            quoted = urllib.parse.quote("底稿.excalidraw")
            resp = urllib.request.urlopen(
                f"http://127.0.0.1:{port}/{quoted}", timeout=5)
            self.assertEqual(resp.headers.get("Access-Control-Allow-Origin"), "*")
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data["type"], "excalidraw")
            req = urllib.request.Request(f"http://127.0.0.1:{port}/x",
                                         method="OPTIONS")
            resp = urllib.request.urlopen(req, timeout=5)
            self.assertEqual(
                resp.headers.get("Access-Control-Allow-Private-Network"), "true")
        finally:
            os.kill(pid, signal.SIGTERM)


if __name__ == "__main__":
    unittest.main(verbosity=2)
