#!/bin/bash
# 合成 9 段配音（voice stanley，默认 speech_rate -60），打印每段时长与窗口上限
set -e
cd "$(dirname "$0")/.."

declare -a IDS=(title pain step1 step2 step3 step4 loop install usage)
declare -a TEXTS=(
  "费曼学习法：把「我以为我懂」，变成「我知道我懂」。"
  "划重点、反复阅读，带来的只是熟悉感，不是理解。"
  "第一步，写下概念，一次只攻一个。"
  "第二步，把它讲给一个完全不懂的人。"
  "第三步，卡住别怕——卡壳的地方，就是你的盲区。"
  "第四步，删掉术语，简化到别人能复述。"
  "填上盲区，再讲一遍，循环到顺畅为止。"
  "安装只要两步：克隆仓库，复制到 agent 的 skills 目录。"
  "然后报出一个你自以为懂的概念。你讲，它问。每次对话都被记下，进步看得见。"
)
# 窗口长度（秒）：title 4.5 / pain 3.5 / step1-4 各 5,4,4,4... 见下（场景窗口 = end-start）
declare -a WINDOW=(4.5 3.5 5 4 4 4 5 7 8)
# 可用上限 = 窗口 - 0.2 lead-in - 0.3 尾部余量

for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"
  out="narration/segments/${id}.mp3"
  if [ ! -f "$out" ]; then
    python3 narration/scripts/aliyun_tts.py stanley "${TEXTS[$i]}" "$out" -60
  fi
done

echo "--- durations vs limits ---"
for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"
  dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "narration/segments/${id}.mp3")
  limit=$(echo "${WINDOW[$i]} - 0.5" | bc)
  ok=$(echo "$dur <= $limit" | bc)
  echo "$id: dur=${dur}s limit=${limit}s fits=${ok}"
done
