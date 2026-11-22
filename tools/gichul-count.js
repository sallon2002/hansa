// 기출 선지 문항마다 「몇 회 나왔나」: work/gichul/repeats.json(같은 사실 묶음) → data/gichul-count.js
//   node tools/gichul-count.js      (seonji-merge build --set gichul 뒤에 돌린다 — 줄 번호를 같은 순서로 센다)
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "work", "gichul");
const files = fs.readdirSync(WORK).filter((f) => /^r\d+\.json$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));
const groups = JSON.parse(fs.readFileSync(path.join(WORK, "repeats.json"), "utf8"));
const countBySrc = {};
for (const g of groups) for (const s of g.srcs) countBySrc[s] = Math.max(countBySrc[s] || 1, g.count);
const idx = {}, out = {};
for (const f of files) {
  for (const it of JSON.parse(fs.readFileSync(path.join(WORK, f), "utf8")).items) {
    const i = (idx[it.era] = (idx[it.era] === undefined ? 0 : idx[it.era] + 1));
    if (countBySrc[it.src] > 1) out[it.era + ":" + i] = countBySrc[it.src];
  }
}
fs.writeFileSync(path.join(ROOT, "data", "gichul-count.js"),
  "// 기출 선지: 같은 사실이 76~80회에 몇 번 나왔나 (없으면 1번). tools/gichul-count.js 가 만든다\nwindow.GICHUL_COUNT = " + JSON.stringify(out) + ";\n");
console.log("2회 이상 문항 " + Object.keys(out).length + "개 → data/gichul-count.js");
