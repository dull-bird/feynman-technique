#!/usr/bin/env python3
"""feynman-technique 全部 Python 脚本的测试（纯函数单测 + pexpect 端到端）。

覆盖 feynman_log / feynman_session / feynman_relay / feynman_hook /
install_hooks / build_gallery。测试前备份 sessions/log.jsonl 等真实数据，
结束后恢复，不污染真实学习记录。
遵循 pexpect 可靠性规则：显式 encoding/timeout、每个 expect 都处理
EOF 与 TIMEOUT、类型化异常携带 child.before 与退出状态、三段式关闭。
"""
import argparse
import json
import os
import shutil
import signal
import subprocess
import sys

import pexpect

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # 保证能 import 同目录被测脚本（纯函数单测用）
import build_gallery  # noqa: E402
import feynman_log  # noqa: E402
import feynman_relay  # noqa: E402
import feynman_session  # noqa: E402
SCRIPT = os.path.join(HERE, "feynman_log.py")
SESSION_SCRIPT = os.path.join(HERE, "feynman_session.py")
HOOK_SCRIPT = os.path.join(HERE, "feynman_hook.py")
GALLERY_SCRIPT = os.path.join(HERE, "build_gallery.py")
INSTALL_HOOKS_SCRIPT = os.path.join(HERE, "install_hooks.py")
RELAY_SCRIPT = os.path.join(HERE, "feynman_relay.py")
FIGURE_SCRIPT = os.path.join(HERE, "feynman_figure.py")
DOCS_DIR = os.path.join(HERE, "..", "..", "docs")
GALLERY_ZH = os.path.join(DOCS_DIR, "gallery-data.js")
GALLERY_EN = os.path.join(DOCS_DIR, "gallery-data-en.js")
FAKE_HOME = "/tmp/feynman-fake-home"
LOG_FILE = os.path.join(HERE, "..", "sessions", "log.jsonl")
ACTIVE_DIR = os.path.join(HERE, "..", "sessions", "active")
ACTIVE_BACKUP = ACTIVE_DIR + ".test-backup"
LEGACY_STATE_FILE = os.path.join(HERE, "..", "sessions", "active_session.json")
LEGACY_STATE_BACKUP = LEGACY_STATE_FILE + ".test-backup"
BACKUP = LOG_FILE + ".test-backup"
TRANSCRIPTS_DIR = os.path.join(HERE, "..", "sessions", "transcripts")
TRANSCRIPTS_BACKUP = TRANSCRIPTS_DIR + ".test-backup"
EXPORT_TEST_DIR = "/tmp/feynman-export-test"


class CLIError(Exception):
    def __init__(self, message, child=None):
        super().__init__(message)
        self.before = child.before if child else None
        self.exitstatus = child.exitstatus if child else None
        self.signalstatus = child.signalstatus if child else None


class CLITimeoutError(CLIError):
    pass


class CLIEOFError(CLIError):
    pass


def shutdown(child):
    """三段式关闭：EOF → SIGTERM → SIGKILL。"""
    try:
        child.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=5)
    except Exception:
        pass
    if child.isalive():
        child.kill(signal.SIGTERM)
        try:
            child.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=5)
        except Exception:
            pass
    if child.isalive():
        child.kill(signal.SIGKILL)
    child.close()


def check(cond, msg):
    """纯函数单测断言助手：失败抛 CLIError，与主流程的异常处理对齐。"""
    if not cond:
        raise CLIError(msg)


def run_cli(args, expect_patterns, expected_exit=0, script=None):
    """以 PTY 运行脚本，依次匹配 expect_patterns，校验退出码。

    expect_patterns: 列表，每项为 (描述, 正则)。每个 expect 都附带
    EOF/TIMEOUT 哨兵，EOF 提前到来或超时都会抛出类型化异常。
    script 默认为 feynman_log.py。
    """
    if script is None:
        script = SCRIPT
    child = pexpect.spawn(
        sys.executable,
        [script] + args,
        encoding="utf-8",
        timeout=30,
    )
    try:
        for desc, pattern in expect_patterns:
            index = child.expect([pattern, pexpect.EOF, pexpect.TIMEOUT])
            if index == 1:
                raise CLIEOFError(
                    f"[{desc}] 程序提前退出，未看到 {pattern!r}: {child.before!r}",
                    child=child,
                )
            if index == 2:
                raise CLITimeoutError(
                    f"[{desc}] 超时，未看到 {pattern!r}: {child.before!r}",
                    child=child,
                )
        # 输出匹配完毕，等待进程退出并校验退出码
        child.expect([pexpect.EOF, pexpect.TIMEOUT])
        child.close()
        if child.exitstatus != expected_exit:
            raise CLIError(
                f"退出码 {child.exitstatus}，期望 {expected_exit}: {child.before!r}",
                child=child,
            )
        return child.before
    finally:
        shutdown(child)


def test_log_success():
    run_cli(
        ["log", "--concept", "测试概念", "--rounds", "6", "--passed", "true",
         "--score", "4", "--gaps", "术语没解释;缺例子", "--notes", "第二轮后顺畅"],
        [("记录确认", r"已记录：.*测试概念.*通过.*6 轮.*评分 4/5")],
    )


def test_log_history_trend():
    # 第二条同概念记录应输出评分走势
    run_cli(
        ["log", "--concept", "测试概念", "--rounds", "4", "--passed", "true",
         "--score", "5"],
        [("评分走势", r"第 2 次对话，评分走势：4 → 5")],
    )


def test_log_invalid_bool():
    run_cli(
        ["log", "--concept", "x", "--rounds", "1", "--passed", "maybe", "--score", "3"],
        [("参数错误", r"无效的布尔值")],
        expected_exit=2,
    )


def test_log_invalid_score():
    run_cli(
        ["log", "--concept", "x", "--rounds", "1", "--passed", "true", "--score", "9"],
        [("评分越界", r"invalid choice")],
        expected_exit=2,
    )


def test_report_empty():
    run_cli(
        ["report", "--concept", "不存在的概念"],
        [("空记录提示", r"还没有任何记录")],
    )


def test_report_full():
    run_cli(
        ["report"],
        [
            ("总体统计", r"对话次数：2 \| 通过：2 \| 通过率：100%"),
            ("平均评分", r"平均评分：4\.5/5"),
            ("概念明细", r"测试概念：2 次，评分 4 → 5"),
            ("盲区列表", r"盲区：术语没解释、缺例子"),
        ],
    )


def test_missing_required_arg():
    run_cli(
        ["log", "--concept", "x"],
        [("缺少必填参数", r"the following arguments are required")],
        expected_exit=2,
    )


def test_log_with_transcript():
    transcript = "/tmp/feynman-test-transcript.md"
    with open(transcript, "w", encoding="utf-8") as f:
        f.write("# 测试对话\n\n**你**：贝叶斯定理就是条件概率公式。\n\n**听众**：条件是什么意思？\n")
    run_cli(
        ["log", "--concept", "测试概念", "--rounds", "5", "--passed", "true",
         "--score", "4", "--transcript", transcript],
        [("带转写稿记录", r"已记录：.*测试概念.*通过.*5 轮.*评分 4/5")],
    )
    # 转写稿应被归档
    archived = [f for f in os.listdir(TRANSCRIPTS_DIR) if f.endswith("测试概念.md")]
    if not archived:
        raise CLIError("转写稿未归档到 sessions/transcripts/")


def test_export():
    shutil.rmtree(EXPORT_TEST_DIR, ignore_errors=True)
    run_cli(
        ["export", "--vault", EXPORT_TEST_DIR],
        [("导出确认", r"已导出.*1 篇概念笔记、3 篇会话笔记、1 篇索引")],
    )
    # 验证 Obsidian 笔记真实生成且含 frontmatter 与转写稿
    concept_note = os.path.join(EXPORT_TEST_DIR, "概念", "测试概念.md")
    index_note = os.path.join(EXPORT_TEST_DIR, "费曼学习记录.md")
    for path in (concept_note, index_note):
        if not os.path.isfile(path):
            raise CLIError(f"导出缺少文件：{path}")
    with open(concept_note, encoding="utf-8") as f:
        content = f.read()
    for expected in ("type: feynman/concept", "mastered: true", "tags: [费曼学习法]"):
        if expected not in content:
            raise CLIError(f"概念笔记缺少 {expected!r}")
    sessions_dir = os.path.join(EXPORT_TEST_DIR, "会话")
    session_notes = os.listdir(sessions_dir) if os.path.isdir(sessions_dir) else []
    if len(session_notes) != 3:
        raise CLIError(f"会话笔记数量 {len(session_notes)}，期望 3")
    with open(os.path.join(sessions_dir, sorted(session_notes)[-1]), encoding="utf-8") as f:
        session_content = f.read()
    if "type: feynman/session" not in session_content or "对话实录" not in session_content:
        raise CLIError("会话笔记缺少 frontmatter 或对话实录")
    shutil.rmtree(EXPORT_TEST_DIR, ignore_errors=True)


def test_report_json():
    out = run_cli(
        ["report", "--json"],
        [("JSON 输出", r"\"total_sessions\": 2")],
    )
    # run_cli 返回 before（JSON 之后的残余输出），完整校验直接再跑一次解析
    import subprocess
    result = subprocess.run(
        [sys.executable, SCRIPT, "report", "--json"],
        capture_output=True, text=True, check=True,
    )
    payload = json.loads(result.stdout)
    if payload["total_sessions"] != 2 or payload["concepts"]["测试概念"]["scores"] != [4, 5]:
        raise CLIError(f"JSON 内容不符：{result.stdout[:200]}")
    if payload["concepts"]["测试概念"]["mastered"] is not True:
        raise CLIError("JSON mastered 字段不符")


def run_hook(stdin_text):
    """通过 PTY 以管道喂给 feynman_hook.py，返回 (stdout, exitstatus)。"""
    child = pexpect.spawn(
        "/bin/bash",
        ["-c", f"printf '%s' {json.dumps(stdin_text)} | {sys.executable} {HOOK_SCRIPT}"],
        encoding="utf-8",
        timeout=30,
    )
    try:
        child.expect([pexpect.EOF, pexpect.TIMEOUT])
        output = child.before
        child.close()
        return output, child.exitstatus
    finally:
        shutdown(child)


def test_hook_trigger():
    out, code = run_hook('{"prompt":"用费曼学习法，概念是复利"}')
    if code != 0 or "SKILL.md" not in out or "会话流程" not in out:
        raise CLIError(f"钩子命中时未注入指针：exit={code} out={out[:200]!r}")


def test_hook_trigger_english():
    out, code = run_hook('{"prompt":"feynman technique on entropy"}')
    if code != 0 or "SKILL.md" not in out:
        raise CLIError(f"英文触发词未命中：exit={code} out={out[:200]!r}")


def test_hook_no_trigger():
    out, code = run_hook('{"prompt":"今天天气怎么样"}')
    if code != 0 or out.strip():
        raise CLIError(f"未命中时应静默：exit={code} out={out[:200]!r}")


def test_hook_malformed():
    out, code = run_hook("not json at all")
    if code != 0 or out.strip():
        raise CLIError(f"坏输入应静默放行：exit={code} out={out[:200]!r}")


PREP_FILE = "/tmp/feynman-test-prep.md"


def write_prep():
    with open(PREP_FILE, "w", encoding="utf-8") as f:
        f.write("# 状态机概念 准备\n"
                "- 要点1：能不用术语定义概念\n"
                "- 要点2：能讲清核心机制\n"
                "- 要点3：能给出具体例子\n"
                "- 预判盲区：术语循环、因果缺口\n")


def test_session_gates():
    """硬门槛：无 prep 拒绝开场；prep 不存在拒绝；内容过少拒绝；scaffold 缺 hint 拒绝；hint 超长拒绝。"""
    run_cli(["start", "--concept", "裸奔概念"],
            [("无 prep 拒绝", r"缺少准备文件")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["start", "--concept", "裸奔概念", "--prep", "/tmp/不存在的文件.md"],
            [("prep 不存在拒绝", r"准备文件不存在")],
            expected_exit=2, script=SESSION_SCRIPT)
    with open(PREP_FILE, "w", encoding="utf-8") as f:
        f.write("太少了\n")
    run_cli(["start", "--concept", "裸奔概念", "--prep", PREP_FILE],
            [("prep 过少拒绝", r"内容过少")],
            expected_exit=2, script=SESSION_SCRIPT)
    write_prep()
    run_cli(["start", "--concept", "门槛概念", "--prep", PREP_FILE],
            [("有 prep 放行", r"会话已开场：门槛概念")],
            script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--scaffold"],
            [("scaffold 缺 hint 拒绝", r"需要 --hint")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--scaffold", "--hint", "长" * 130],
            [("hint 超长拒绝", r"提示超长")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def find_session_id(concept=None):
    """读 active/ 目录，返回（某概念的）会话 ID。"""
    if not os.path.isdir(ACTIVE_DIR):
        raise CLIError("active/ 目录不存在")
    for name in sorted(os.listdir(ACTIVE_DIR)):
        if not name.endswith(".json"):
            continue
        with open(os.path.join(ACTIVE_DIR, name), encoding="utf-8") as f:
            s = json.load(f)
        if concept is None or s.get("concept") == concept:
            return s.get("id")
    raise CLIError(f"active/ 里找不到会话：{concept}")


def test_session_flow():
    """状态机完整流程：start → 同概念拒绝 → 并行第二场 → round → status → close。"""
    write_prep()
    run_cli(["start", "--concept", "状态机概念", "--prep", PREP_FILE],
            [("开场确认", r"会话已开场：状态机概念"),
             ("分配会话 ID", r"会话 ID："),
             ("准备清单", r"准备清单"),
             ("历史联动", r"历史联动")],
            script=SESSION_SCRIPT)
    run_cli(["start", "--concept", "状态机概念", "--prep", PREP_FILE],
            [("同概念重复拒绝", r"已有进行中的会话")],
            expected_exit=2, script=SESSION_SCRIPT)
    # 并行第二场（模拟另一个 agent 同时玩别的主题）
    run_cli(["start", "--concept", "并行概念", "--prep", PREP_FILE],
            [("并行开场放行", r"会话已开场：并行概念")],
            script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none"],
            [("多场需指定 session", r"请用 --session 指定")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["abort", "--session", find_session_id("并行概念")],
            [("撤掉并行场", r"已放弃")], script=SESSION_SCRIPT)
    sid = find_session_id("状态机概念")
    run_cli(["round", "--gap", "瞎编的码"],
            [("非法分类码拒绝", r"非法盲区分类码")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "causal-gap", "--quote", "GC 负责清理内存",
             "--probe", "为什么需要 GC？", "--session", sid],
            [("第 1 轮打卡", r"第 1/10 轮"), ("盲区记录", r"causal-gap")],
            script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--scaffold",
             "--hint", "把条件概率想成：只看满足条件的那批人，再在里面数。",
             "--covered", "定义讲清;机制讲清"],
            [("第 2 轮打卡", r"第 2/10 轮"), ("脚手架计数", r"脚手架 1 次"),
             ("要点覆盖", r"定义讲清")],
            script=SESSION_SCRIPT)
    run_cli(["status"], [("状态锚定", r"第 2/10 轮")], script=SESSION_SCRIPT)
    run_cli(["close", "--passed", "true", "--score", "4", "--notes", "流程测试"],
            [("本场报告", r"== 本场报告 =="),
             ("评分走势", r"评分 4/5"),
             ("落账提示", r"已落账")],
            script=SESSION_SCRIPT)
    if os.path.isdir(ACTIVE_DIR) and os.listdir(ACTIVE_DIR):
        raise CLIError("close 后状态文件未清除")
    # 落账内容校验
    with open(LOG_FILE, encoding="utf-8") as f:
        last = json.loads(f.readlines()[-1])
    if last["concept"] != "状态机概念" or last["gaps"] != ["causal-gap"] or last["rounds"] != 2:
        raise CLIError(f"落账内容不符：{last}")


def test_session_abort():
    write_prep()
    run_cli(["start", "--concept", "要放弃的概念", "--prep", PREP_FILE], [("开场", r"会话已开场")],
            script=SESSION_SCRIPT)
    run_cli(["abort"], [("放弃确认", r"已放弃本场会话")], script=SESSION_SCRIPT)
    if os.path.isdir(ACTIVE_DIR) and os.listdir(ACTIVE_DIR):
        raise CLIError("abort 后状态文件未清除")


def test_session_schema():
    """schema 子命令：输出 JSON 契约，含全部 gap 码与上限，agent 可先查再调。"""
    run_cli(["schema"],
            [("gap 码列表", r'"gap_codes"'),
             ("含 factual-error", r'factual-error'),
             ("轮数上限", r'"max_rounds": 10'),
             ("提示字符上限", r'"max_hint_chars": 120'),
             ("start 的 listener", r'"--listener"'),
             ("round 的 choices", r'"choices"')],
            script=SESSION_SCRIPT)


def test_session_listener():
    """start --listener 显式指定听众 CLI：记入状态并随 status 展示。"""
    write_prep()
    run_cli(["start", "--concept", "听众概念", "--prep", PREP_FILE,
             "--listener", "kimi -p"],
            [("开场确认", r"会话已开场：听众概念"),
             ("听众进程记录", r"听众进程：kimi -p")],
            script=SESSION_SCRIPT)
    run_cli(["status"], [("status 显示听众", r"听众进程：kimi -p")],
            script=SESSION_SCRIPT)
    sid = find_session_id("听众概念")
    with open(os.path.join(ACTIVE_DIR, sid + ".json"), encoding="utf-8") as f:
        state = json.load(f)
    if state.get("listener") != "kimi -p":
        raise CLIError(f"listener 未落状态：{state.get('listener')}")
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def run_cli_env(args, expect_patterns, env_extra, script, expected_exit=0):
    """带环境变量覆盖的 run_cli 变体。"""
    child = pexpect.spawn(
        sys.executable,
        [script] + args,
        encoding="utf-8",
        timeout=30,
        env={**os.environ, **env_extra},
    )
    try:
        for desc, pattern in expect_patterns:
            index = child.expect([pattern, pexpect.EOF, pexpect.TIMEOUT])
            if index == 1:
                raise CLIEOFError(f"[{desc}] 提前退出: {child.before!r}", child=child)
            if index == 2:
                raise CLITimeoutError(f"[{desc}] 超时: {child.before!r}", child=child)
        child.expect([pexpect.EOF, pexpect.TIMEOUT])
        child.close()
        if child.exitstatus != expected_exit:
            raise CLIError(f"退出码 {child.exitstatus}，期望 {expected_exit}", child=child)
        return child.before
    finally:
        shutdown(child)


def test_build_gallery():
    """gallery 构建：中英文拆分 + 英文转写稿（半角冒号）解析回归。"""
    # 英文会话：半角冒号格式转写稿（回归全角/半角 bug）
    transcript = "/tmp/feynman-test-en-transcript.md"
    with open(transcript, "w", encoding="utf-8") as f:
        f.write("# Entropy · Feynman Session\n\n"
                "**You**: Entropy is disorder.\n\n"
                "**Listener**: What does 'disorder' mean exactly?\n")
    run_cli(["log", "--concept", "TestEntropy", "--rounds", "5", "--passed", "false",
             "--score", "2", "--transcript", transcript],
            [("英文记录", r"已记录：.*TestEntropy")])
    run_cli([], [("中文输出", r"gallery-data\.js.*场对话"),
                 ("英文输出", r"gallery-data-en\.js.*场对话")],
            script=GALLERY_SCRIPT)
    for path in (GALLERY_ZH, GALLERY_EN):
        if not os.path.isfile(path):
            raise CLIError(f"gallery 数据未生成：{path}")
    zh = open(GALLERY_ZH, encoding="utf-8").read()
    en = open(GALLERY_EN, encoding="utf-8").read()
    if "测试概念" not in zh:
        raise CLIError("中文 gallery 缺少中文会话")
    if "测试概念" in en:
        raise CLIError("英文 gallery 混入了中文会话")
    if "TestEntropy" not in en or '"who": "you"' not in en or '"who": "listener"' not in en:
        raise CLIError("英文转写稿（半角冒号）未解析出消息")
    if "TestEntropy" in zh:
        raise CLIError("中文 gallery 混入了英文会话")
    os.remove(transcript)


def test_install_hooks():
    """钩子安装器：HOME 隔离下安装/幂等/卸载，TOML 合法。"""
    shutil.rmtree(FAKE_HOME, ignore_errors=True)
    os.makedirs(FAKE_HOME, exist_ok=True)
    env = {"HOME": FAKE_HOME}
    run_cli_env([], [("三 agent 安装", r"claude.*安装完成[\s\S]*codex.*安装完成[\s\S]*kimi.*安装完成")],
                env, INSTALL_HOOKS_SCRIPT)
    configs = {
        "claude": os.path.join(FAKE_HOME, ".claude", "settings.json"),
        "codex": os.path.join(FAKE_HOME, ".codex", "config.toml"),
        "kimi": os.path.join(FAKE_HOME, ".kimi-code", "config.toml"),
    }
    for name, path in configs.items():
        if not os.path.isfile(path) or "feynman_hook" not in open(path, encoding="utf-8").read():
            raise CLIError(f"{name} 配置未写入钩子")
    # TOML 合法性
    import tomllib
    for name in ("codex", "kimi"):
        with open(configs[name], "rb") as f:
            tomllib.load(f)
    # 幂等：重复安装无重复条目
    run_cli_env([], [("重复安装", r"安装完成")], env, INSTALL_HOOKS_SCRIPT)
    for name, path in configs.items():
        if open(path, encoding="utf-8").read().count("feynman_hook.py") != 1:
            raise CLIError(f"{name} 重复安装产生了重复条目")
    # 卸载
    run_cli_env(["--uninstall"], [("卸载", r"卸载完成")], env, INSTALL_HOOKS_SCRIPT)
    for name, path in configs.items():
        if os.path.isfile(path) and "feynman_hook" in open(path, encoding="utf-8").read():
            raise CLIError(f"{name} 卸载后仍残留钩子")
    shutil.rmtree(FAKE_HOME, ignore_errors=True)


def test_relay():
    """盲测接力：开场白 → stub 听众台词 → 多场时需 --session → 无会话时拒绝。"""
    stub = "/tmp/feynman-fake-listener.sh"
    with open(stub, "w", encoding="utf-8") as f:
        f.write("#!/bin/bash\necho '你说的「钱生钱」里，「生」具体是什么意思？'\n")
    os.chmod(stub, 0o755)
    write_prep()
    run_cli(["start", "--concept", "接力概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场：接力概念")], script=SESSION_SCRIPT)
    run_cli(["turn", ""],
            [("首轮开场白", r"费曼教学法练习开始")],
            script=RELAY_SCRIPT)
    run_cli(["turn", "复利就是钱生钱", "--process", stub],
            [("接力回复", r"「生」具体是什么意思")],
            script=RELAY_SCRIPT)
    # 并行第二场后，turn 必须带 --session 指定目标
    run_cli(["start", "--concept", "接力概念B", "--prep", PREP_FILE],
            [("并行开场", r"会话已开场：接力概念B")], script=SESSION_SCRIPT)
    run_cli(["turn", "复利就是钱生钱", "--process", stub],
            [("多场需指定 session", r"请用 --session 指定")],
            expected_exit=2, script=RELAY_SCRIPT)
    run_cli(["turn", "复利就是钱生钱", "--process", stub,
             "--session", find_session_id("接力概念")],
            [("指定场接力", r"「生」具体是什么意思")],
            script=RELAY_SCRIPT)
    run_cli(["abort", "--session", find_session_id("接力概念B")],
            [("清理并行场", r"已放弃")], script=SESSION_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)
    run_cli(["turn", "随便说点什么", "--process", stub],
            [("无会话拒绝", r"没有进行中的会话")],
            expected_exit=2, script=RELAY_SCRIPT)
    os.remove(stub)


def test_teach_and_verify():
    """临场查证回路（【存疑】→ answer）+ 角色反转 teach + taught 后禁判通过。"""
    stub = "/tmp/feynman-fake-listener2.sh"
    with open(stub, "w", encoding="utf-8") as f:
        f.write("#!/bin/bash\necho '这里有个存疑点'\necho '【存疑】BA 到底优化哪些变量'\n")
    os.chmod(stub, 0o755)
    write_prep()
    run_cli(["start", "--concept", "教学概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场：教学概念")], script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "causal-gap", "--quote", "大概是这样",
             "--probe", "为什么"],
            [("第 1 轮打卡", r"第 1/10 轮")], script=SESSION_SCRIPT)
    # 听众输出【存疑】→ relay 附查证指引
    run_cli(["turn", "我觉得 BA 就是优化深度", "--process", stub],
            [("存疑标记", r"【存疑】"), ("查证指引", r"answer")],
            script=RELAY_SCRIPT)
    # 查证结果喂回听众
    run_cli(["answer", "BA 联合优化相机位姿和 3D 点，代价是重投影误差",
             "--process", stub],
            [("查证后续问", r"存疑点")], script=RELAY_SCRIPT)
    # 角色反转：teach 输出讲解并落 taught 标记
    run_cli(["teach", "--process", stub],
            [("教学输出", r"存疑点"), ("taught 提示", r"taught")],
            script=RELAY_SCRIPT)
    sid = find_session_id("教学概念")
    with open(os.path.join(ACTIVE_DIR, sid + ".json"), encoding="utf-8") as f:
        if not json.load(f).get("taught"):
            raise CLIError("teach 后 taught 标记未落状态")
    # taught 后不能判通过
    run_cli(["close", "--passed", "true", "--score", "4"],
            [("已教学禁判通过", r"不能判通过")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["close", "--passed", "false", "--score", "3", "--notes", "教学后落账"],
            [("未通过落账", r"已落账")], script=SESSION_SCRIPT)
    os.remove(stub)


# ---------- 纯函数单测（直接 import，不走 pexpect） ----------


def test_unit_str2bool():
    """str2bool：中英文/数字真值全接受，非法值抛 ArgumentTypeError。"""
    for v in ("true", "TRUE", "1", "yes", "Y", "通过", True):
        check(feynman_log.str2bool(v) is True, f"str2bool({v!r}) 应为 True")
    for v in ("false", "FALSE", "0", "no", "n", "未通过", False):
        check(feynman_log.str2bool(v) is False, f"str2bool({v!r}) 应为 False")
    for bad in ("maybe", "2", "", "通过了"):
        try:
            feynman_log.str2bool(bad)
        except argparse.ArgumentTypeError:
            continue
        raise CLIError(f"str2bool({bad!r}) 应抛 ArgumentTypeError")


def test_unit_safe_name():
    """safe_name：ASCII 路径不安全字符替换为 -，全角标点/中文/空格保留。"""
    cases = {
        "贝叶斯:定理?": "贝叶斯-定理-",
        'a/b\\c*d': "a-b-c-d",
        "  带空格 概念  ": "带空格 概念",
        '引号"书名号<>管道|': "引号-书名号--管道-",
        "全角：标点？保留": "全角：标点？保留",
        "纯中文概念": "纯中文概念",
    }
    for raw, expected in cases.items():
        got = feynman_log.safe_name(raw)
        check(got == expected, f"safe_name({raw!r}) = {got!r}，期望 {expected!r}")


def test_unit_detect_listener():
    """detect_listener：CLAUDECODE 优先于 KIMI_CODE_API_KEY → PATH 探测 → 兜底默认。"""
    saved_env = {k: os.environ.get(k) for k in ("CLAUDECODE", "KIMI_CODE_API_KEY")}
    saved_which = shutil.which
    try:
        os.environ["CLAUDECODE"] = "1"
        os.environ["KIMI_CODE_API_KEY"] = "1"
        check(feynman_session.detect_listener() == "claude -p",
              "CLAUDECODE 应优先于 KIMI_CODE_API_KEY")
        del os.environ["CLAUDECODE"]
        check(feynman_session.detect_listener() == "kimi -p",
              "仅 KIMI_CODE_API_KEY 时应选 kimi -p")
        del os.environ["KIMI_CODE_API_KEY"]
        shutil.which = lambda exe: "/usr/bin/codex" if exe == "codex" else None
        check(feynman_session.detect_listener() == "codex exec",
              "无环境变量时应探测 PATH 中的 codex")
        shutil.which = lambda exe: None
        check(feynman_session.detect_listener() == feynman_session.DEFAULT_LISTENER,
              "全部探测失败应兜底默认")
    finally:
        shutil.which = saved_which
        for k, v in saved_env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def test_unit_relay_clean_reply():
    """clean_reply：去 resume 行、•/· 前缀、OOC 前缀行（大小写不敏感）、全脏输出归零。"""
    raw = ("To resume this session, use --continue\n"
           "• 这句保留\n"
           "·这句也保留\n"
           "Speaker: hello\n"
           "JUST OUTPUT the line\n"
           "本次对话是角色扮演测试\n"
           "正常的一句台词")
    out = feynman_relay.clean_reply(raw)
    check(out == "这句保留\n这句也保留\n正常的一句台词",
          f"clean_reply 清洗结果不符：{out!r}")
    check(feynman_relay.clean_reply("") == "", "空输入应得空串")
    check(feynman_relay.clean_reply("To resume this session x\n• \n·\n") == "",
          "全是噪音时应得空串")


def test_unit_relay_build_transcript():
    """build_transcript：quote/probe 交替成文，空 probe 不出听众行，空 user_msg 不追加尾巴。"""
    state = {"rounds": [
        {"quote": "定义在这", "probe": "什么是条件？", "gap": "none"},
        {"quote": "第二句原话", "probe": "", "gap": "none"},
    ]}
    got = feynman_relay.build_transcript(state, "我的新话")
    expected = "你：定义在这\n\n听众：什么是条件？\n\n你：第二句原话\n\n你：我的新话"
    check(got == expected, f"build_transcript 不符：{got!r}")
    got_blank = feynman_relay.build_transcript(state, "   ")
    check(not got_blank.endswith("你："), "空白 user_msg 不应追加尾巴")
    check(feynman_relay.build_transcript({"rounds": []}, "") == "",
          "空历史空消息应得空串")


def test_unit_clean_messages():
    """clean_messages：429/verdict 噪音整段丢弃、英文思考前缀剥落、无中文正文丢弃、幂等。"""
    msgs = [
        {"who": "you", "text": "熵是混乱度的度量。"},
        {"who": "listener", "text": "Error 429: rate_limit exceeded"},
        {"who": "listener", "text": '{"verdict": "pass", "listener_note": "ok"}'},
        {"who": "listener",
         "text": "I'm the listener. Stay in persona.\n这个问题的关键是什么？"},
        {"who": "listener", "text": "I'm the listener only, no Chinese body."},
    ]
    out = build_gallery.clean_messages(msgs)
    texts = [m["text"] for m in out]
    check(texts == ["熵是混乱度的度量。", "这个问题的关键是什么？"],
          f"clean_messages 结果不符：{texts!r}")
    check(out[1]["who"] == "listener", "剥落后 who 字段应保留")
    check(build_gallery.clean_messages(out) == out, "clean_messages 应幂等")


# ---------- 空状态下的只读分支（必须排在任何写 log 的测试之前） ----------


def test_gallery_skip_no_log():
    """build_gallery：无 log.jsonl 时跳过生成，绝不清空已提交的 gallery 数据。"""
    before = {}
    for path in (GALLERY_ZH, GALLERY_EN):
        if os.path.exists(path):
            with open(path, "rb") as f:
                before[path] = f.read()
    run_cli([], [("跳过提示", r"跳过生成（保留现有 gallery 数据）")],
            script=GALLERY_SCRIPT)
    for path, content in before.items():
        with open(path, "rb") as f:
            check(f.read() == content, f"{path} 在无源数据时被改动了")


def test_export_empty():
    """export：没有任何记录时提示先 log，不创建导出目录。"""
    shutil.rmtree(EXPORT_TEST_DIR, ignore_errors=True)
    run_cli(["export", "--vault", EXPORT_TEST_DIR],
            [("空导出提示", r"还没有任何记录")])
    check(not os.path.isdir(EXPORT_TEST_DIR), "空记录时不应创建导出目录")


# ---------- feynman_session 端到端补充 ----------


def test_session_force_parallel():
    """start --force：允许同概念并行开场，两场各有独立 ID。"""
    write_prep()
    run_cli(["start", "--concept", "并行强制概念", "--prep", PREP_FILE],
            [("第一场", r"会话已开场：并行强制概念")], script=SESSION_SCRIPT)
    run_cli(["start", "--concept", "并行强制概念", "--prep", PREP_FILE, "--force"],
            [("force 放行", r"会话已开场：并行强制概念")], script=SESSION_SCRIPT)
    ids = []
    for name in os.listdir(ACTIVE_DIR):
        if not name.endswith(".json"):
            continue
        with open(os.path.join(ACTIVE_DIR, name), encoding="utf-8") as f:
            s = json.load(f)
        if s.get("concept") == "并行强制概念":
            ids.append(s["id"])
    check(len(ids) == 2 and ids[0] != ids[1],
          f"--force 后应有两场独立会话：{ids}")
    for sid in ids:
        run_cli(["abort", "--session", sid], [("清理", r"已放弃")],
                script=SESSION_SCRIPT)


def test_session_round_cap_and_warn():
    """round 轮数上限：第 8 轮出 ⚠️ 警告，打满 10 轮后第 11 轮被拒。"""
    write_prep()
    run_cli(["start", "--concept", "轮数上限概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    for n in range(1, 11):
        patterns = [(f"第 {n} 轮打卡", rf"第 {n}/10 轮")]
        if n == 8:
            patterns.append(("第 8 轮警告", r"⚠️ 已到第 8 轮，剩余 2 轮"))
        run_cli(["round", "--gap", "none"], patterns, script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none"],
            [("第 11 轮拒绝", r"已达 10 轮上限")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def test_session_hint_boundary():
    """hint 长度边界：去空白后恰好 120 字符放行，121 字符拒绝。"""
    write_prep()
    run_cli(["start", "--concept", "提示边界概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--scaffold", "--hint", "引" * 120],
            [("120 字符放行", r"第 1/10 轮"), ("脚手架计数", r"脚手架 1 次")],
            script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--scaffold", "--hint", "引" * 121],
            [("121 字符拒绝", r"提示超长：121 字符（上限 120）")],
            expected_exit=2, script=SESSION_SCRIPT)
    sid = find_session_id("提示边界概念")
    with open(os.path.join(ACTIVE_DIR, sid + ".json"), encoding="utf-8") as f:
        state = json.load(f)
    check(len(state["rounds"]) == 1, "被拒绝的轮次不应落状态")
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def test_session_covered_dedup():
    """round --covered：重复的验收要点不重复记录，按首次出现顺序保留。"""
    write_prep()
    run_cli(["start", "--concept", "去重概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--covered", "要点甲;要点乙"],
            [("第 1 轮", r"第 1/10 轮"), ("覆盖两点", r"要点覆盖：要点甲、要点乙")],
            script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--covered", "要点甲;要点丙"],
            [("第 2 轮", r"第 2/10 轮"),
             ("去重后覆盖", r"要点覆盖：要点甲、要点乙、要点丙")],
            script=SESSION_SCRIPT)
    sid = find_session_id("去重概念")
    with open(os.path.join(ACTIVE_DIR, sid + ".json"), encoding="utf-8") as f:
        state = json.load(f)
    check(state["covered"] == ["要点甲", "要点乙", "要点丙"],
          f"covered 去重不符：{state['covered']}")
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def test_session_bad_session_id():
    """round --session 指向不存在 ID：报错并列出进行中的会话。"""
    write_prep()
    run_cli(["start", "--concept", "锚定概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none", "--session", "不存在的ID"],
            [("无此会话", r"没有 ID 为 不存在的ID 的会话"),
             ("列出进行中", r"进行中的会话：.*锚定概念")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def test_session_close_zero_rounds():
    """close：一轮未进行不能收尾，拒绝后会话仍在。"""
    write_prep()
    run_cli(["start", "--concept", "零轮概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["close", "--passed", "false", "--score", "2"],
            [("零轮拒绝", r"一轮都没进行，不能收尾")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["status"], [("会话仍在", r"零轮概念")], script=SESSION_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def test_session_close_transcript():
    """close --transcript：不存在文件拒绝且会话保留；真实文件归档并在落账记录里留名。"""
    write_prep()
    run_cli(["start", "--concept", "归档概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none"],
            [("第 1 轮", r"第 1/10 轮")], script=SESSION_SCRIPT)
    run_cli(["close", "--passed", "true", "--score", "4",
             "--transcript", "/tmp/不存在的转写稿.md"],
            [("转写稿不存在拒绝", r"转写稿不存在")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["status"], [("拒绝后会话仍在", r"归档概念")], script=SESSION_SCRIPT)
    transcript = "/tmp/feynman-close-transcript.md"
    with open(transcript, "w", encoding="utf-8") as f:
        f.write("# 归档概念\n\n**你**：定义。\n\n**听众**：追问。\n")
    run_cli(["close", "--passed", "true", "--score", "4",
             "--transcript", transcript],
            [("落账", r"已落账")], script=SESSION_SCRIPT)
    archived = [f for f in os.listdir(TRANSCRIPTS_DIR) if f.endswith("归档概念.md")]
    check(archived, "close --transcript 未归档到 sessions/transcripts/")
    with open(LOG_FILE, encoding="utf-8") as f:
        last = json.loads(f.readlines()[-1])
    check(last.get("transcript", "").endswith("归档概念.md"),
          f"落账记录缺少 transcript 字段：{last}")
    os.remove(transcript)


def test_session_legacy_migration():
    """旧版 active_session.json：任何命令触发自动迁移进 active/ 并分配 ID。"""
    legacy = {
        "concept": "旧版概念",
        "started": "2026-01-01 00:00:00",
        "prep": "x.md",
        "listener": "kimi -p",
        "rounds": [{"n": 1, "quote": "q", "gap": "none", "probe": "p",
                    "scaffold": False, "hint": ""}],
        "covered": [],
        "scaffolds": 0,
    }
    with open(LEGACY_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(legacy, f, ensure_ascii=False)
    run_cli(["status"], [("迁移后状态", r"旧版概念"), ("轮数保留", r"第 1/10 轮")],
            script=SESSION_SCRIPT)
    check(not os.path.exists(LEGACY_STATE_FILE), "迁移后旧版状态文件应删除")
    sid = find_session_id("旧版概念")
    check(sid, "迁移后应分配会话 ID")
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


def test_session_schema_full():
    """schema：六个命令齐全、7 个 gap 码、taught_guard 字段、limits 三项上限。"""
    result = subprocess.run(
        [sys.executable, SESSION_SCRIPT, "schema"],
        capture_output=True, text=True, check=True)
    schema = json.loads(result.stdout)
    check(set(schema["commands"]) ==
          {"start", "round", "status", "close", "abort", "schema"},
          f"schema 命令集不符：{sorted(schema['commands'])}")
    check(len(schema["gap_codes"]) == 7,
          f"gap_codes 应为 7 个：{schema['gap_codes']}")
    check("taught_guard" in schema, "schema 缺少 taught_guard 字段")
    check(schema["limits"] == {"max_rounds": 10, "warn_rounds": 8,
                               "max_hint_chars": 120},
          f"limits 不符：{schema['limits']}")


def test_session_abort_edge():
    """abort/status/round 边界：无会话时 abort 静默 exit 0；有会话时 --session 指向坏 ID 拒绝。"""
    run_cli(["abort"], [("无会话静默", r"没有进行中的会话")],
            script=SESSION_SCRIPT)
    run_cli(["status"], [("status 无会话", r"没有进行中的会话")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "none"], [("round 无会话", r"没有进行中的会话")],
            expected_exit=2, script=SESSION_SCRIPT)
    # 有会话时 abort --session 坏 ID 才走到「没有 ID 为…」分支（无会话时 abort 提前返回）
    write_prep()
    run_cli(["start", "--concept", "放弃边界概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["abort", "--session", "不存在"],
            [("无此 ID", r"没有 ID 为 不存在 的会话"),
             ("列出进行中", r"进行中的会话：.*放弃边界概念")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)


# ---------- feynman_relay 端到端补充 ----------


def test_relay_no_session():
    """answer/teach：无进行中会话时拒绝（exit 2）。"""
    run_cli(["answer", "查证结果"], [("answer 拒绝", r"没有进行中的会话")],
            expected_exit=2, script=RELAY_SCRIPT)
    run_cli(["teach"], [("teach 拒绝", r"没有进行中的会话")],
            expected_exit=2, script=RELAY_SCRIPT)


def test_relay_listener_failure():
    """turn：听众进程返回非零 → exit 1 且报「听众进程失败」。"""
    stub = "/tmp/feynman-fake-listener3.sh"
    with open(stub, "w", encoding="utf-8") as f:
        f.write("#!/bin/bash\necho 'boom' >&2\nexit 1\n")
    os.chmod(stub, 0o755)
    write_prep()
    run_cli(["start", "--concept", "失败概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["turn", "用户说了点什么", "--process", stub],
            [("进程失败", r"听众进程失败")],
            expected_exit=1, script=RELAY_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)
    os.remove(stub)


def test_relay_empty_reply():
    """turn：听众输出全被清洗掉（resume 行/圆点）→ exit 1「听众无有效回复」。"""
    stub = "/tmp/feynman-fake-listener4.sh"
    with open(stub, "w", encoding="utf-8") as f:
        f.write("#!/bin/bash\n"
                "echo 'To resume this session, use --continue'\n"
                "echo '• '\necho '·'\n")
    os.chmod(stub, 0o755)
    write_prep()
    run_cli(["start", "--concept", "空回复概念", "--prep", PREP_FILE],
            [("开场", r"会话已开场")], script=SESSION_SCRIPT)
    run_cli(["turn", "用户说了点什么", "--process", stub],
            [("无有效回复", r"听众无有效回复")],
            expected_exit=1, script=RELAY_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)
    os.remove(stub)


def test_relay_process_override():
    """--process 覆盖优先于 state 里记录的 listener（state 里故意填坏命令）。"""
    stub = "/tmp/feynman-fake-listener5.sh"
    with open(stub, "w", encoding="utf-8") as f:
        f.write("#!/bin/bash\necho '覆盖生效的台词'\n")
    os.chmod(stub, 0o755)
    write_prep()
    run_cli(["start", "--concept", "覆盖概念", "--prep", PREP_FILE,
             "--listener", "nonexistent-cli-xyz -p"],
            [("开场", r"会话已开场"),
             ("坏 listener 落状态", r"听众进程：nonexistent-cli-xyz -p")],
            script=SESSION_SCRIPT)
    sid = find_session_id("覆盖概念")
    with open(os.path.join(ACTIVE_DIR, sid + ".json"), encoding="utf-8") as f:
        check(json.load(f)["listener"] == "nonexistent-cli-xyz -p",
              "state 里的 listener 应是指定的坏命令")
    # 若 --process 不优先，会去跑 nonexistent-cli-xyz 而失败
    run_cli(["turn", "用户说了点什么", "--process", stub],
            [("覆盖生效", r"覆盖生效的台词")], script=RELAY_SCRIPT)
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)
    os.remove(stub)


# ---------- feynman_hook 触发词与 payload 兼容 ----------


def test_figure():
    """figure open/wait：open 建目录给指引；wait 检测到新导出文件返回路径；超时分支报错。"""
    import time
    figures = os.path.join(HERE, "..", "sessions", "figures")
    # open：建目录 + 画布指引（BROWSER=true 避免真的拉起浏览器）
    result = subprocess.run([sys.executable, FIGURE_SCRIPT, "open"],
                            capture_output=True, text=True,
                            env={**os.environ, "BROWSER": "true"})
    check(result.returncode == 0, f"figure open 失败：{result.stderr[:200]}")
    check(os.path.isdir(figures), "open 未创建 figures 目录")
    check("excalidraw.com" in result.stdout, "open 缺画布指引")
    try:
        # wait：先后落地 PNG 与 .excalidraw，应一次性返回两个路径
        proc = subprocess.Popen([sys.executable, FIGURE_SCRIPT, "wait",
                                 "--timeout", "30", "--quiet", "1"],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True)
        time.sleep(1.5)  # 让 wait 先完成目录快照
        png = os.path.join(figures, "test-figure.png")
        src = os.path.join(figures, "test-figure.excalidraw")
        with open(png, "w", encoding="utf-8") as f:
            f.write("fake png")
        time.sleep(0.3)
        with open(src, "w", encoding="utf-8") as f:
            f.write("{}")
        out, err = proc.communicate(timeout=40)
        check(proc.returncode == 0, f"wait 未正常退出：{err[:200]}")
        check(png in out and src in out, f"wait 未返回两个文件路径：{out!r}")
        # 超时分支：无新文件 → exit 1 + 提示
        result = subprocess.run([sys.executable, FIGURE_SCRIPT, "wait",
                                 "--timeout", "2", "--quiet", "1"],
                                capture_output=True, text=True)
        check(result.returncode == 1, "wait 超时应退出码 1")
        check("等待超时" in result.stderr, "wait 超时缺提示")
    finally:
        shutil.rmtree(figures, ignore_errors=True)


def test_hook_trigger_words():
    """触发词表逐个命中：费曼系/是否真懂/检验理解/讲给…听，英文大小写不敏感。"""
    triggers = [
        "用费曼学习法练一下",
        "FEYNMAN technique please",
        "费曼一下这个概念",
        "我想知道自己是否真懂递归",
        "是不是真的懂熵增",
        "检验一下我的理解",
        "检验理解",
        "把熵讲给小学生听",
    ]
    for prompt in triggers:
        out, code = run_hook(json.dumps({"prompt": prompt}, ensure_ascii=False))
        check(code == 0 and "SKILL.md" in out,
              f"触发词未命中：{prompt!r} exit={code} out={out[:120]!r}")


def test_hook_payload_fields():
    """payload 兼容：text/message 备选字段可命中；缺 prompt/非字符串/空白均静默。"""
    out, code = run_hook('{"text":"用费曼学习法"}')
    check(code == 0 and "SKILL.md" in out, "text 备选字段未命中")
    out, code = run_hook('{"message":"feynman"}')
    check(code == 0 and "SKILL.md" in out, "message 备选字段未命中")
    for raw in ("{}", '{"prompt":123}', '{"prompt":"   "}',
                json.dumps({"prompt": "我今天理解了递归"}, ensure_ascii=False)):
        out, code = run_hook(raw)
        check(code == 0 and not out.strip(),
              f"应静默放行：{raw!r} exit={code} out={out[:120]!r}")


# ---------- install_hooks 单 agent 模式 ----------


def test_install_hooks_single_agent():
    """--agent kimi：只写 kimi 配置，不碰其他两家；单 agent 幂等与卸载。"""
    shutil.rmtree(FAKE_HOME, ignore_errors=True)
    os.makedirs(FAKE_HOME, exist_ok=True)
    env = {"HOME": FAKE_HOME}
    run_cli_env(["--agent", "kimi"], [("仅装 kimi", r"\[kimi\] 安装完成")],
                env, INSTALL_HOOKS_SCRIPT)
    kimi_cfg = os.path.join(FAKE_HOME, ".kimi-code", "config.toml")
    check(os.path.isfile(kimi_cfg), "kimi 配置未写入")
    check("feynman_hook" in open(kimi_cfg, encoding="utf-8").read(),
          "kimi 配置缺少钩子")
    check(not os.path.exists(os.path.join(FAKE_HOME, ".claude", "settings.json")),
          "单 agent 模式不应写 claude 配置")
    check(not os.path.exists(os.path.join(FAKE_HOME, ".codex", "config.toml")),
          "单 agent 模式不应写 codex 配置")
    run_cli_env(["--agent", "kimi"], [("重复安装", r"安装完成")],
                env, INSTALL_HOOKS_SCRIPT)
    check(open(kimi_cfg, encoding="utf-8").read().count("feynman_hook.py") == 1,
          "单 agent 重复安装产生了重复条目")
    run_cli_env(["--agent", "kimi", "--uninstall"], [("卸载", r"卸载完成")],
                env, INSTALL_HOOKS_SCRIPT)
    if os.path.isfile(kimi_cfg):
        check("feynman_hook" not in open(kimi_cfg, encoding="utf-8").read(),
              "单 agent 卸载后仍残留钩子")
    shutil.rmtree(FAKE_HOME, ignore_errors=True)


# ---------- feynman_log 报告分支与健壮性 ----------


def test_report_score_trend():
    """report：≥4 次记录时输出评分趋势（前半 vs 后半平均值）。"""
    for score in (2, 2, 4, 4):
        run_cli(["log", "--concept", "趋势概念", "--rounds", "5",
                 "--passed", "true", "--score", str(score)],
                [("记录", r"已记录")])
    run_cli(["report", "--concept", "趋势概念"],
            [("评分趋势", r"评分趋势：前 2 次平均 2\.0 → 后 2 次平均 4\.0"),
             ("掌握标记", r"已掌握 ✅")])


def test_build_gallery_noise_filter():
    """gallery 重建应用 clean_messages：429/verdict 消息被丢弃，思考泄露被剥落。"""
    transcript = "/tmp/feynman-noise-transcript.md"
    with open(transcript, "w", encoding="utf-8") as f:
        f.write("# 噪音过滤概念 · Feynman Session\n\n"
                "**你**：熵是混乱度的度量。\n\n"
                "**听众**：Error 429: rate_limit exceeded, please retry\n\n"
                "**听众**：{\"verdict\": \"pass\", \"listener_note\": \"ok\"}\n\n"
                "**听众**：I'm the listener. Stay in persona.\n"
                "这个问题的关键是什么？\n")
    run_cli(["log", "--concept", "噪音过滤概念", "--rounds", "4",
             "--passed", "false", "--score", "2", "--transcript", transcript],
            [("记录", r"已记录")])
    run_cli([], [("重新生成", r"gallery-data\.js")], script=GALLERY_SCRIPT)
    raw = open(GALLERY_ZH, encoding="utf-8").read()
    check("window.FEYNMAN_GALLERY = " in raw, "中文 gallery 缺少全局变量头")
    check("window.FEYNMAN_GALLERY = " in open(GALLERY_EN, encoding="utf-8").read(),
          "英文 gallery 缺少全局变量头")
    for noise in ("rate_limit", "verdict", "I'm the listener"):
        check(noise not in raw, f"gallery 仍含噪音 {noise!r}")
    payload = json.loads(raw.split("=", 1)[1].strip().rstrip(";"))
    sess = [s for s in payload if s["concept"] == "噪音过滤概念"]
    check(len(sess) == 1, "gallery 缺少噪音过滤概念会话")
    texts = [(m["who"], m["text"]) for m in sess[0]["messages"]]
    check(texts == [("you", "熵是混乱度的度量。"),
                    ("listener", "这个问题的关键是什么？")],
          f"清洗后的消息不符：{texts!r}")
    os.remove(transcript)


def test_log_malformed_line():
    """log.jsonl 混入坏行：report 警告跳过但仍正常输出；build_gallery 同样容错。"""
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write("这不是 JSON\n")
    result = subprocess.run(
        [sys.executable, SCRIPT, "report", "--json"],
        capture_output=True, text=True)
    check(result.returncode == 0, f"坏行导致 report 崩溃：{result.stderr[:200]}")
    check("警告：跳过无法解析的行" in result.stderr,
          f"缺坏行警告：{result.stderr[:200]}")
    json.loads(result.stdout)  # stdout 仍是合法 JSON
    result = subprocess.run(
        [sys.executable, GALLERY_SCRIPT],
        capture_output=True, text=True)
    check(result.returncode == 0, f"坏行导致 build_gallery 崩溃：{result.stderr[:200]}")
    check("警告：跳过无法解析的行" in result.stderr,
          f"build_gallery 缺坏行警告：{result.stderr[:200]}")


TESTS = [
    # 纯函数单测：不碰 sessions/ 状态，放最前
    test_unit_str2bool,
    test_unit_safe_name,
    test_unit_detect_listener,
    test_unit_relay_clean_reply,
    test_unit_relay_build_transcript,
    test_unit_clean_messages,
    # 空记录分支：必须在任何写 log 的测试之前
    test_gallery_skip_no_log,
    test_export_empty,
    # 原有 23 个：report/export 断言依赖精确的记录数，顺序不可动
    test_log_success,
    test_log_history_trend,
    test_log_invalid_bool,
    test_log_invalid_score,
    test_report_empty,
    test_report_full,
    test_report_json,
    test_missing_required_arg,
    test_log_with_transcript,
    test_export,
    test_hook_trigger,
    test_hook_trigger_english,
    test_hook_no_trigger,
    test_hook_malformed,
    test_session_flow,
    test_session_abort,
    test_session_schema,
    test_session_listener,
    test_session_gates,
    test_relay,
    test_teach_and_verify,
    test_build_gallery,
    test_install_hooks,
    # 新增 e2e：各自开场各自清理，保持「唯一一场/零场」假设
    test_session_force_parallel,
    test_session_round_cap_and_warn,
    test_session_hint_boundary,
    test_session_covered_dedup,
    test_session_bad_session_id,
    test_session_close_zero_rounds,
    test_session_close_transcript,
    test_session_legacy_migration,
    test_session_schema_full,
    test_session_abort_edge,
    test_relay_no_session,
    test_relay_listener_failure,
    test_relay_empty_reply,
    test_relay_process_override,
    test_figure,
    test_hook_trigger_words,
    test_hook_payload_fields,
    test_install_hooks_single_agent,
    test_report_score_trend,
    test_build_gallery_noise_filter,
    # 坏行容错：report 与 build_gallery 都应警告跳过而非崩溃
    test_log_malformed_line,
]


def main():
    # 备份真实日志与转写稿，测试从空白状态开始
    had_log = os.path.exists(LOG_FILE)
    if had_log:
        shutil.copy2(LOG_FILE, BACKUP)
        os.remove(LOG_FILE)
    had_transcripts = os.path.isdir(TRANSCRIPTS_DIR)
    if had_transcripts:
        shutil.rmtree(TRANSCRIPTS_BACKUP, ignore_errors=True)
        os.rename(TRANSCRIPTS_DIR, TRANSCRIPTS_BACKUP)
    had_state = os.path.exists(LEGACY_STATE_FILE)
    if had_state:
        shutil.copy2(LEGACY_STATE_FILE, LEGACY_STATE_BACKUP)
        os.remove(LEGACY_STATE_FILE)
    had_active = os.path.isdir(ACTIVE_DIR)
    if had_active:
        shutil.rmtree(ACTIVE_BACKUP, ignore_errors=True)
        os.rename(ACTIVE_DIR, ACTIVE_BACKUP)
    # gallery 数据文件也备份（build_gallery 测试会重建它们）
    gallery_backups = {}
    for path in (GALLERY_ZH, GALLERY_EN):
        if os.path.exists(path):
            gallery_backups[path] = path + ".test-backup"
            shutil.copy2(path, gallery_backups[path])

    passed, failed = 0, 0
    try:
        for test in TESTS:
            try:
                test()
                passed += 1
                print(f"PASS {test.__name__}")
            except CLIError as e:
                failed += 1
                print(f"FAIL {test.__name__}: {e}")
                if e.before:
                    print(f"     child.before: {e.before[:200]!r}")
    finally:
        # 恢复真实日志与转写稿
        if os.path.exists(LOG_FILE):
            os.remove(LOG_FILE)
        if had_log:
            shutil.move(BACKUP, LOG_FILE)
        shutil.rmtree(TRANSCRIPTS_DIR, ignore_errors=True)
        if had_transcripts:
            os.rename(TRANSCRIPTS_BACKUP, TRANSCRIPTS_DIR)
        shutil.rmtree(ACTIVE_DIR, ignore_errors=True)
        if had_active:
            os.rename(ACTIVE_BACKUP, ACTIVE_DIR)
        if os.path.exists(LEGACY_STATE_FILE):
            os.remove(LEGACY_STATE_FILE)
        if had_state:
            shutil.move(LEGACY_STATE_BACKUP, LEGACY_STATE_FILE)
        shutil.rmtree(EXPORT_TEST_DIR, ignore_errors=True)
        for tmp in ("/tmp/feynman-test-transcript.md",
                    "/tmp/feynman-test-en-transcript.md",
                    "/tmp/feynman-close-transcript.md",
                    "/tmp/feynman-noise-transcript.md",
                    PREP_FILE,
                    "/tmp/feynman-fake-listener.sh",
                    "/tmp/feynman-fake-listener2.sh",
                    "/tmp/feynman-fake-listener3.sh",
                    "/tmp/feynman-fake-listener4.sh",
                    "/tmp/feynman-fake-listener5.sh"):
            if os.path.exists(tmp):
                os.remove(tmp)
        shutil.rmtree(FAKE_HOME, ignore_errors=True)
        for path, backup in gallery_backups.items():
            shutil.move(backup, path)

    print(f"\n{passed} 通过，{failed} 失败")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
