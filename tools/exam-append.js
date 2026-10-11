// 새 실전 문제를 data/exam/<시대>.js 맨 아래에 덧붙인다 (기존 줄과 순서는 그대로 — 오답 노트 id 가 줄 번호라서).
//   node tools/exam-append.js work/exam/photo-1.json [더 많은 파일...]
// 처음 한 번 전체를 만들 때만 exam-merge.js 를 쓰고, 그 뒤로는 이것을 쓴다 (exam-merge 는 검증 수정을 덮어쓴다).
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
global.window = {};
require(path.join(ROOT, "data/eras.js"));

const add = {};
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const q of Array.isArray(d) ? d : d.questions || []) (add[q.era] = add[q.era] || []).push(q);
}
for (const e of window.ERAS) {
  if (!add[e.id]) continue;
  global.window.EXAM = {};
  const file = path.join(ROOT, "data/exam", e.id + ".js");
  delete require.cache[require.resolve(file)];
  require(file);
  const qs = (window.EXAM[e.id] || []).concat(add[e.id]);
  fs.writeFileSync(
    file,
    `// 실전 문제 — ${e.label} (${e.range})\n` +
      `// 한 줄 = 문제 하나 {era, points, source{kind,title,text,cite,lead,image}, stem, choices[5], answer, notes[5]}.\n` +
      `// 새 문제는 맨 아래에 덧붙인다 (줄 순서가 오답 노트 id).\n` +
      `window.EXAM = window.EXAM || {};\nwindow.EXAM.${e.id} = [\n` +
      qs.map((q) => "  " + JSON.stringify(q)).join(",\n") +
      ",\n];\n",
  );
  console.log(`${e.id.padEnd(13)} +${add[e.id].length} → ${qs.length}문항`);
}
