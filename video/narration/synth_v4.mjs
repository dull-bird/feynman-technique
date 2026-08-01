import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 用法: node synth_v4.mjs <zh|en>
// zh → stanley -60；en → harry -50。缺文件才合成，可重入。
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const locale = process.argv[2] === "en" ? "en" : "zh";
const voice = locale === "en" ? "harry" : "stanley";
const rate = locale === "en" ? "-50" : "-60";
const segments = JSON.parse(
  fs.readFileSync(path.join(__dirname, `segments_v4_${locale}.json`), "utf8"),
);
const outDir = path.join(__dirname, `segments_v4_${locale}`);
fs.mkdirSync(outDir, { recursive: true });

for (const seg of segments) {
  const out = path.join(outDir, `${seg.id}.mp3`);
  if (fs.existsSync(out)) {
    console.log(`skip ${seg.id}`);
    continue;
  }
  execSync(
    `python3 "${path.join(__dirname, "scripts", "aliyun_tts.py")}" ${voice} '${seg.text.replace(/'/g, "'\\''")}' "${out}" ${rate}`,
    { stdio: "inherit" },
  );
}

console.log(`--- durations (${locale}) ---`);
for (const seg of segments) {
  const out = path.join(outDir, `${seg.id}.mp3`);
  const dur = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${out}"`,
  )
    .toString()
    .trim();
  console.log(`${seg.id}: ${dur}s`);
}
