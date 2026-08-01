import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const segmentsDir = path.join(__dirname, "segments");
const publicDir = path.join(__dirname, "..", "public");
fs.mkdirSync(publicDir, { recursive: true });

// id, 场景窗口起点(s), 窗口终点(s)（含 0.3s 尾部余量后的硬上限 = end - 0.3）
const PLAN = [
  { id: "title", sceneStart: 0, hardEnd: 4.2 },
  { id: "pain", sceneStart: 4.5, hardEnd: 7.7 },
  { id: "step1", sceneStart: 8, hardEnd: 12.7 },
  { id: "step2", sceneStart: 13, hardEnd: 16.7 },
  { id: "step3", sceneStart: 17, hardEnd: 20.7 },
  { id: "step4", sceneStart: 21, hardEnd: 24.7 },
  { id: "loop", sceneStart: 25, hardEnd: 29.7 },
  { id: "install", sceneStart: 30, hardEnd: 36.7 },
  { id: "usage", sceneStart: 37, hardEnd: 44.5 },
];
const LEAD_IN = 0.2;

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
const rows = [];
let cursor = 0;

for (const seg of PLAN) {
  const startSec = seg.sceneStart + LEAD_IN;
  const src = path.join(segmentsDir, `${seg.id}.mp3`);
  const wav = path.join(resampledDir, `${seg.id}.wav`);
  execSync(`ffmpeg -y -i "${src}" -ar 44100 -ac 1 "${wav}"`);
  const dur = durationOf(src);
  const endSec = startSec + dur;
  if (endSec > seg.hardEnd + 1e-6) {
    throw new Error(
      `${seg.id} overflows window: end=${endSec.toFixed(3)} > ${seg.hardEnd}`,
    );
  }
  if (startSec > cursor) {
    const gap = silenceFileFor(startSec - cursor);
    concatEntries.push(`file '${path.basename(gap)}'`);
  }
  concatEntries.push(`file '${path.relative(segmentsDir, wav)}'`);
  rows.push({ id: seg.id, startSec, dur, endSec });
  cursor = endSec;
}

fs.writeFileSync(
  path.join(segmentsDir, "concat.txt"),
  `${concatEntries.join("\n")}\n`,
);

const outWav = path.join(segmentsDir, "narration_full.wav");
const outMp3 = path.join(publicDir, "narration.mp3");
execSync(
  `ffmpeg -y -f concat -safe 0 -i "${path.join(segmentsDir, "concat.txt")}" -ar 44100 -ac 2 "${outWav}"`,
);
execSync(`ffmpeg -y -i "${outWav}" -codec:a libmp3lame -qscale:a 2 "${outMp3}"`);

console.log("id        start(s)  dur(s)  end(s)");
for (const r of rows) {
  console.log(
    `${r.id.padEnd(9)} ${r.startSec.toFixed(2).padStart(7)}  ${r.dur.toFixed(2).padStart(6)}  ${r.endSec.toFixed(2).padStart(6)}`,
  );
}
console.log(`total=${cursor.toFixed(2)}s -> ${outMp3}`);
