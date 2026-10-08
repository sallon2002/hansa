// 실전 문제 작업 파일(work/exam/*.json)을 시대별 data/exam/<시대>.js 로 합친다.
//   node tools/exam-merge.js
// 파일 이름 순서대로 읽어 각 문제의 era 에 따라 나눠 담는다. 시대 파일은 열 개 모두 다시 쓴다.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "work/exam");
const OUT = path.join(ROOT, "data/exam");
global.window = {};
require(path.join(ROOT, "data/eras.js"));

const byEra = {};
window.ERAS.forEach((e) => (byEra[e.id] = []));
const files = fs.existsSync(WORK) ? fs.readdirSync(WORK).filter((f) => f.endsWith(".json")).sort() : [];
for (const f of files) {
  let d;
  try {
    d = JSON.parse(fs.readFileSync(path.join(WORK, f), "utf8"));
  } catch (err) {
    console.log(`[${f}] JSON 오류: ${err.message}`);
    process.exit(1);
  }
  const qs = Array.isArray(d) ? d : d.questions || [];
  for (const q of qs) {
    if (!byEra[q.era]) { console.log(`[${f}] 없는 시대: ${q.era}`); process.exit(1); }
    byEra[q.era].push(q);
  }
}

fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const e of window.ERAS) {
  const qs = byEra[e.id];
  total += qs.length;
  fs.writeFileSync(
    path.join(OUT, e.id + ".js"),
    `// 실전 문제 — ${e.label} (${e.range})\n` +
      `// 한 줄 = 문제 하나 {era, points, source{kind,title,text,cite,lead}, stem, choices[5], answer, notes[5]}.\n` +
      `// 새 문제는 맨 아래에 덧붙인다 (줄 순서가 오답 노트 id).\n` +
      `window.EXAM = window.EXAM || {};\nwindow.EXAM.${e.id} = [\n` +
      qs.map((q) => "  " + JSON.stringify(q)).join(",\n") +
      (qs.length ? ",\n" : "") +
      "];\n",
  );
  console.log(`${e.id.padEnd(13)} ${String(qs.length).padStart(4)}문항`);
}
console.log(`합계 ${total}문항 (작업 파일 ${files.length}개)`);
