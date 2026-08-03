#!/usr/bin/env python3
"""feynman_log.py 的 pexpect 端到端测试。

测试前备份 sessions/log.jsonl，结束后恢复，不污染真实学习记录。
遵循 pexpect 可靠性规则：显式 encoding/timeout、每个 expect 都处理
EOF 与 TIMEOUT、类型化异常携带 child.before 与退出状态、三段式关闭。
"""
import json
import os
import shutil
import signal
import sys

import pexpect

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "feynman_log.py")
SESSION_SCRIPT = os.path.join(HERE, "feynman_session.py")
HOOK_SCRIPT = os.path.join(HERE, "feynman_hook.py")
GALLERY_SCRIPT = os.path.join(HERE, "build_gallery.py")
INSTALL_HOOKS_SCRIPT = os.path.join(HERE, "install_hooks.py")
RELAY_SCRIPT = os.path.join(HERE, "feynman_relay.py")
DOCS_DIR = os.path.join(HERE, "..", "..", "docs")
GALLERY_ZH = os.path.join(DOCS_DIR, "gallery-data.js")
GALLERY_EN = os.path.join(DOCS_DIR, "gallery-data-en.js")
FAKE_HOME = "/tmp/feynman-fake-home"
LOG_FILE = os.path.join(HERE, "..", "sessions", "log.jsonl")
STATE_FILE = os.path.join(HERE, "..", "sessions", "active_session.json")
STATE_BACKUP = STATE_FILE + ".test-backup"
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


def test_session_flow():
    """状态机完整流程：start → 重复 start 拒绝 → 非法分类码拒绝 → round → status → close。"""
    write_prep()
    run_cli(["start", "--concept", "状态机概念", "--prep", PREP_FILE],
            [("开场确认", r"会话已开场：状态机概念"),
             ("准备清单", r"准备清单"),
             ("历史联动", r"历史联动")],
            script=SESSION_SCRIPT)
    run_cli(["start", "--concept", "另一个", "--prep", PREP_FILE],
            [("重复开场拒绝", r"已有一场进行中的会话")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "瞎编的码"],
            [("非法分类码拒绝", r"非法盲区分类码")],
            expected_exit=2, script=SESSION_SCRIPT)
    run_cli(["round", "--gap", "causal-gap", "--quote", "GC 负责清理内存",
             "--probe", "为什么需要 GC？"],
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
    if os.path.exists(STATE_FILE):
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
    if os.path.exists(STATE_FILE):
        raise CLIError("abort 后状态文件未清除")


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
    """盲测接力：开场白 → stub 听众台词 → 无会话时拒绝。"""
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
    run_cli(["abort"], [("清理", r"已放弃")], script=SESSION_SCRIPT)
    run_cli(["turn", "随便说点什么", "--process", stub],
            [("无会话拒绝", r"没有进行中的会话")],
            expected_exit=2, script=RELAY_SCRIPT)
    os.remove(stub)


TESTS = [
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
    test_session_gates,
    test_relay,
    test_build_gallery,
    test_install_hooks,
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
    had_state = os.path.exists(STATE_FILE)
    if had_state:
        shutil.copy2(STATE_FILE, STATE_BACKUP)
        os.remove(STATE_FILE)
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
        if os.path.exists(STATE_FILE):
            os.remove(STATE_FILE)
        if had_state:
            shutil.move(STATE_BACKUP, STATE_FILE)
        shutil.rmtree(EXPORT_TEST_DIR, ignore_errors=True)
        if os.path.exists("/tmp/feynman-test-transcript.md"):
            os.remove("/tmp/feynman-test-transcript.md")
        if os.path.exists("/tmp/feynman-test-en-transcript.md"):
            os.remove("/tmp/feynman-test-en-transcript.md")
        shutil.rmtree(FAKE_HOME, ignore_errors=True)
        for path, backup in gallery_backups.items():
            shutil.move(backup, path)

    print(f"\n{passed} 通过，{failed} 失败")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
