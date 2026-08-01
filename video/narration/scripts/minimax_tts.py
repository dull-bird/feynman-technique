#!/usr/bin/env python3
"""MiniMax T2A v2 语音合成（仅标准库）。

用法: minimax_tts.py <voice_id> <text> <out.mp3> [speed] [--pron "词/(pin1)(yin1);词2/(a1)(b2)"]
环境变量: MINIMAX_API_KEY（或先 source 同目录 .env）

特性：
- <#x#> 停顿标记直接写在 text 里（x 秒，0.01-99.99）
- 多音字用 pronunciation_dict 根治，如 "重读/(chong2)(du2)"
- speech-2.8-hd 支持语气词标签 (laughs)/(sighs)/(breath) 等
"""
import json
import os
import sys
import urllib.request

API_URL = "https://api.minimaxi.com/v1/t2a_v2"
DEFAULT_MODEL = "speech-2.8-hd"


def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    if os.path.isfile(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip())


def synth(voice, text, out_path, speed=1.0, pron=None, model=DEFAULT_MODEL):
    load_env_file()
    api_key = os.environ.get("MINIMAX_API_KEY")
    if not api_key:
        sys.stderr.write("ERROR: MINIMAX_API_KEY 未设置\n")
        sys.exit(1)

    body = {
        "model": model,
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice,
            "speed": speed,
            "vol": 1,
            "pitch": 0,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
            "channel": 1,
        },
        "subtitle_enable": False,
    }
    if pron:
        body["pronunciation_dict"] = {"tone": [p.strip() for p in pron.split(";") if p.strip()]}

    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    base = payload.get("base_resp", {})
    if base.get("status_code") != 0:
        sys.stderr.write(f"ERROR: {base.get('status_code')} {base.get('status_msg')}\n")
        sys.exit(1)

    audio_hex = (payload.get("data") or {}).get("audio")
    if not audio_hex:
        sys.stderr.write("ERROR: 响应中没有音频数据\n")
        sys.exit(1)
    audio = bytes.fromhex(audio_hex)
    with open(out_path, "wb") as f:
        f.write(audio)
    info = payload.get("extra_info", {})
    print(f"OK {out_path} ({len(audio)} bytes, {info.get('audio_length', '?')}ms)")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    pron = None
    if "--pron" in sys.argv:
        pron = sys.argv[sys.argv.index("--pron") + 1]
    voice, text, out_path = args[0], args[1], args[2]
    speed = float(args[3]) if len(args) > 3 else 1.0
    synth(voice, text, out_path, speed, pron)
