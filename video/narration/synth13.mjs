import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 逐段合成（缺文件才合成，可重入），voice stanley，speech_rate -60
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const segments = JSON.parse(
  fs.readFileSync(path.join(__dirname, "segments13.json"), "utf8"),
);
const outDir = path.join(__dirname, "segments13");
fs.mkdirSync(outDir, { recursive: true });

for (const seg of segments) {
  const out = path.join(outDir, `${seg.id}.mp3`);
  if (fs.existsSync(out)) {
    console.log(`skip ${seg.id}`);
    continue;
  }
  execSync(
    `python3 "${path.join(__dirname, "scripts", "aliyun_tts.py")}" stanley '${seg.text.replace(/'/g, "'\\''")}' "${out}" -60`,
    { stdio: "inherit" },
  );
}

console.log("--- durations ---");
for (const seg of segments) {
  const out = path.join(outDir, `${seg.id}.mp3`);
  const dur = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${out}"`,
  )
    .toString()
    .trim();
  console.log(`${seg.id}: ${dur}s`);
}
