// 투자자산운용사 작업 파일(work/invest/concept-<id>.json · exam-<id>.json)을 data/invest/concept|exam/<id>.js 로 만든다.
//   node tools/invest-merge.js            처음 한 번 — 이미 있는 data 파일은 건너뛴다
//   node tools/invest-merge.js --force    다시 만든다 (⚠ 오답 노트 id 는 줄 번호라, 공개 뒤에는 줄 순서를 바꾸지 말 것)
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const force = process.argv.includes("--force");
global.window = {};
require(path.join(ROOT, "data/invest/eras.js"));

let total = { concept: 0, exam: 0 };
for (const e of window.ERAS) {
  for (const kind of ["concept", "exam"]) {
    const src = path.join(ROOT, "work/invest", `${kind}-${e.id}.json`);
    const out = path.join(ROOT, "data/invest", kind, `${e.id}.js`);
    if (!fs.existsSync(src)) { console.log(`${kind}/${e.id}: 작업 파일 없음`); continue; }
    if (fs.existsSync(out) && !force) { console.log(`${kind}/${e.id}: 이미 있음 — 건너뜀`); continue; }
    const rows = JSON.parse(fs.readFileSync(src, "utf8"));
    const g = kind === "concept" ? "BANK" : "EXAM";
    const head =
      kind === "concept"
        ? `// 투자자산운용사 개념 — ${e.label}. 한 줄 = [문제, 정답, 오답×3, 해설, 오답 풀이×3]. 새 문제는 맨 아래에 (줄 번호가 오답 노트 id)\n`
        : `// 투자자산운용사 실전 — ${e.label}. 한 줄 = {era, stem, source?, choices[4], answer, notes[4], fixed?}. 새 문제는 맨 아래에\n`;
    fs.writeFileSync(
      out,
      head + `window.${g} = window.${g} || {};\nwindow.${g}.${e.id} = [\n` + rows.map((r) => "  " + JSON.stringify(r)).join(",\n") + "\n];\n",
    );
    total[kind] += rows.length;
    console.log(`${kind}/${e.id}: ${rows.length}문항`);
  }
}
console.log(`합계 개념 ${total.concept} · 실전 ${total.exam}`);
