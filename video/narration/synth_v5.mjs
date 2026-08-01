import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 用法: node synth_v5.mjs <zh|en>
// zh → presenter_male @1.0 + 多音字表；en → English_Trustworthy_Man @1.0
// 缺文件才合成，可重入。
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const locale = process.argv[2] === "en" ? "en" : "zh";
const voice = locale === "en" ? "English_Trustworthy_Man" : "presenter_male";
// 多音字根治：词/(pin1)(yin1)，分号分隔
const PRON_ZH =
  "重读/(chong2)(du2);教学/(jiao4)(xue2);落账/(luo4)(zhang4);成长/(cheng2)(zhang3);回填/(hui2)(tian2);复利/(fu4)(li4);追问/(zhui1)(wen4);角色/(jue2)(se4)";

const segments = JSON.parse(
  fs.readFileSync(path.join(__dirname, `segments_v5_${locale}.json`), "utf8"),
);
const outDir = path.join(__dirname, `segments_v5_${locale}`);
fs.mkdirSync(outDir, { recursive: true });

for (const seg of segments) {
  const out = path.join(outDir, `${seg.id}.mp3`);
  if (fs.existsSync(out)) {
    console.log(`skip ${seg.id}`);
    continue;
  }
  const pronArgs =
    locale === "zh" ? ["--pron", PRON_ZH] : [];
  execSync(
    `python3 "${path.join(__dirname, "scripts", "minimax_tts.py")}" ${voice} '${seg.text.replace(/'/g, "'\\''")}' "${out}" 1.0 ${pronArgs.map((a) => `'${a}'`).join(" ")}`,
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
