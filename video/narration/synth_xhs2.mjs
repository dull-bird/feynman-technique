import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 小红书竖屏版：presenter_male @1.25（快节奏），多音字表沿用
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const voice = "presenter_male";
const speed = process.argv[2] || "1.0";
const PRON_ZH =
  "重读/(chong2)(du2);教学/(jiao4)(xue2);落账/(luo4)(zhang4);成长/(cheng2)(zhang3);回填/(hui2)(tian2);复利/(fu4)(li4);追问/(zhui1)(wen4);角色/(jue2)(se4);外行/(wai4)(hang2);银行/(yin2)(hang2);重点/(zhong4)(dian3)";

const segments = JSON.parse(
  fs.readFileSync(path.join(__dirname, "segments_xhs2.json"), "utf8"),
);
const outDir = path.join(__dirname, "segments_xhs2");
fs.mkdirSync(outDir, { recursive: true });

for (const seg of segments) {
  const out = path.join(outDir, `${seg.id}.mp3`);
  if (fs.existsSync(out)) {
    console.log(`skip ${seg.id}`);
    continue;
  }
  execSync(
    `python3 "${path.join(__dirname, "scripts", "minimax_tts.py")}" ${voice} '${seg.text.replace(/'/g, "'\\''")}' "${out}" ${speed} --pron '${PRON_ZH}'`,
    { stdio: "inherit" },
  );
}

console.log("--- durations (xhs2) ---");
let sum = 0;
for (const seg of segments) {
  const out = path.join(outDir, `${seg.id}.mp3`);
  const dur = Number.parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${out}"`,
    )
      .toString()
      .trim(),
  );
  sum += dur;
  console.log(`${seg.id}: ${dur}s`);
}
console.log(`sum: ${sum.toFixed(2)}s`);
