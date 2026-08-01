#!/usr/bin/env python3
"""feynman_log.py 的 pexpect 端到端测试。

测试前备份 sessions/log.jsonl，结束后恢复，不污染真实学习记录。
遵循 pexpect 可靠性规则：显式 encoding/timeout、每个 expect 都处理
EOF 与 TIMEOUT、类型化异常携带 child.before 与退出状态、三段式关闭。
"""
import os
import shutil
import signal
import sys

import pexpect

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "feynman_log.py")
LOG_FILE = os.path.join(HERE, "..", "sessions", "log.jsonl")
BACKUP = LOG_FILE + ".test-backup"


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


def run_cli(args, expect_patterns, expected_exit=0):
    """以 PTY 运行 feynman_log.py，依次匹配 expect_patterns，校验退出码。

    expect_patterns: 列表，每项为 (描述, 正则)。每个 expect 都附带
    EOF/TIMEOUT 哨兵，EOF 提前到来或超时都会抛出类型化异常。
    """
    child = pexpect.spawn(
        sys.executable,
        [SCRIPT] + args,
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


TESTS = [
    test_log_success,
    test_log_history_trend,
    test_log_invalid_bool,
    test_log_invalid_score,
    test_report_empty,
    test_report_full,
    test_missing_required_arg,
]


def main():
    # 备份真实日志，测试从空白状态开始
    had_log = os.path.exists(LOG_FILE)
    if had_log:
        shutil.copy2(LOG_FILE, BACKUP)
        os.remove(LOG_FILE)

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
        # 恢复真实日志
        if os.path.exists(LOG_FILE):
            os.remove(LOG_FILE)
        if had_log:
            shutil.move(BACKUP, LOG_FILE)

    print(f"\n{passed} 通过，{failed} 失败")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
