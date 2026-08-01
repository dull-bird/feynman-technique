import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 用法: node build_v5.mjs <zh|en>
// 与 build_v4 同架构：实测音长 → 场景窗口 = 0.3s lead-in + 旁白 + 1.2s 尾部留白
// 差异：读取 segments_v5_*（MiniMax 合成），输出仍覆盖 timeline.{locale}.json 与 narration[-en].mp3
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const locale = process.argv[2] === "en" ? "en" : "zh";
const fps = 30;
const LEAD_IN_SEC = 0.3;
const TAIL_SEC = 1.2;

const segments = JSON.parse(
  fs.readFileSync(path.join(__dirname, `segments_v5_${locale}.json`), "utf8"),
);
const segmentsDir = path.join(__dirname, `segments_v5_${locale}`);
const publicDir = path.join(__dirname, "..", "public");
const srcDir = path.join(__dirname, "..", "src");
fs.mkdirSync(publicDir, { recursive: true });

const durationOf = (file) =>
  Number.parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`,
    ).toString().trim(),
  );

const resampledDir = path.join(segmentsDir, "resampled");
fs.mkdirSync(resampledDir, { recursive: true });

const silenceFileFor = (seconds) => {
  const d = Math.max(0.001, seconds);
  const file = path.join(segmentsDir, `_silence_${d.toFixed(3)}.wav`);
  if (!fs.existsSync(file)) {
    execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${d} "${file}"`);
  }
  return file;
};

const concatEntries = [];
const scenes = [];
let cursorSec = 0;
let cursorFrame = 0;

for (const seg of segments) {
  const src = path.join(segmentsDir, `${seg.id}.mp3`);
  const wav = path.join(resampledDir, `${seg.id}.wav`);
  execSync(`ffmpeg -y -i "${src}" -ar 44100 -ac 1 "${wav}"`, {
    stdio: "pipe",
  });
  const audioDurSec = durationOf(src);

  const sceneDurationFrames = Math.ceil(
    (LEAD_IN_SEC + audioDurSec + TAIL_SEC) * fps,
  );
  // 音频必须对齐「视觉场景起点 + lead-in」，视觉场景起点以帧时间轴为准
  const sceneStartSec = cursorFrame / fps;
  const audioStartSec = sceneStartSec + LEAD_IN_SEC;

  scenes.push({
    id: seg.id,
    startFrame: cursorFrame,
    durationFrames: sceneDurationFrames,
    audioStartSec,
    audioDurSec,
  });

  if (audioStartSec > cursorSec) {
    const gap = silenceFileFor(audioStartSec - cursorSec);
    concatEntries.push(`file '${path.basename(gap)}'`);
  }
  concatEntries.push(`file '${path.relative(segmentsDir, wav)}'`);

  cursorSec = audioStartSec + audioDurSec;
  cursorFrame += sceneDurationFrames;
}

fs.writeFileSync(
  path.join(segmentsDir, `concat_${locale}.txt`),
  `${concatEntries.join("\n")}\n`,
);

const outWav = path.join(segmentsDir, `narration_v5_${locale}.wav`);
const outMp3 = path.join(
  publicDir,
  locale === "en" ? "narration-en.mp3" : "narration.mp3",
);
execSync(
  `ffmpeg -y -f concat -safe 0 -i "${path.join(segmentsDir, `concat_${locale}.txt`)}" -ar 44100 -ac 2 "${outWav}"`,
  { stdio: "pipe" },
);
execSync(`ffmpeg -y -i "${outWav}" -codec:a libmp3lame -qscale:a 2 "${outMp3}"`, {
  stdio: "pipe",
});

const timeline = {
  fps,
  totalFrames: cursorFrame,
  totalDurationSec: cursorFrame / fps,
  scenes,
};
fs.writeFileSync(
  path.join(srcDir, `timeline.${locale}.json`),
  JSON.stringify(timeline, null, 2),
);

console.log(`[${locale}] scene      start(f)  dur(f)  audioStart(s)  audioDur(s)`);
for (const s of scenes) {
  console.log(
    `${s.id.padEnd(10)} ${String(s.startFrame).padStart(8)}  ${String(s.durationFrames).padStart(6)}  ${s.audioStartSec.toFixed(2).padStart(12)}  ${s.audioDurSec.toFixed(2).padStart(11)}`,
  );
}
console.log(
  `total: ${cursorFrame} frames = ${(cursorFrame / fps).toFixed(2)}s -> ${outMp3}`,
);
