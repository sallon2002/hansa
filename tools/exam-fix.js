// 실전 문제 검증 결과를 data/exam/<시대>.js 에 반영한다.
//
// 검증 파일: work/exam-fix/<시대id>.json
//   {
//     "fixes":  [ { "i": 3, "q": { ...고친 문제 전체... }, "reason": "무엇이 틀렸고 어떻게 고쳤는지" } ],
//     "remove": [ { "i": 7, "reason": "왜 빼는지 (고칠 수 없는 문제·중복)" } ]
//   }
//
//   node tools/exam-fix.js show    고친·뺀 문제를 전부 보여 준다 (검토용)
//   node tools/exam-fix.js apply   data/exam/*.js 에 반영하고 다시 쓴다
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "work/exam-fix");
global.window = {};
require(path.join(ROOT, "data/eras.js"));

function loadEra(id) {
  global.window.EXAM = {};
  delete require.cache[require.resolve(path.join(ROOT, "data/exam", id + ".js"))];
  require(path.join(ROOT, "data/exam", id + ".js"));
  return window.EXAM[id] || [];
}
function loadFix(id) {
  const f = path.join(WORK, id + ".json");
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf8"));
}
function brief(q) {
  return `${q.stem} → ${CIRCLED[q.answer]} ${q.choices[q.answer]}`;
}
const CIRCLED = ["①", "②", "③", "④", "⑤"];

const cmd = process.argv[2];
if (cmd === "show") {
  for (const e of window.ERAS) {
    const fix = loadFix(e.id);
    if (!fix) continue;
    const qs = loadEra(e.id);
    for (const f of fix.fixes || []) {
      const old = qs[f.i];
      console.log(`\n[${e.id} #${f.i}] 고침: ${f.reason}`);
      console.log(`  전: ${old ? brief(old) : "(없는 줄)"}`);
      console.log(`  후: ${brief(f.q)}`);
    }
    for (const r of fix.remove || []) {
      const old = qs[r.i];
      console.log(`\n[${e.id} #${r.i}] 뺌: ${r.reason}`);
      console.log(`  ${old ? brief(old) : "(없는 줄)"}`);
    }
  }
}

if (cmd === "apply") {
  let fixed = 0;
  let removed = 0;
  for (const e of window.ERAS) {
    const fix = loadFix(e.id);
    if (!fix) continue;
    const qs = loadEra(e.id);
    for (const f of fix.fixes || []) {
      if (!qs[f.i]) { console.log(`${e.id} #${f.i}: 없는 줄`); process.exit(1); }
      qs[f.i] = f.q;
      fixed++;
    }
    const drop = new Set((fix.remove || []).map((r) => r.i));
    const kept = qs.filter((_, i) => !drop.has(i));
    removed += qs.length - kept.length;
    fs.writeFileSync(
      path.join(ROOT, "data/exam", e.id + ".js"),
      `// 실전 문제 — ${e.label} (${e.range})\n` +
        `// 한 줄 = 문제 하나 {era, points, source{kind,title,text,cite,lead}, stem, choices[5], answer, notes[5]}.\n` +
        `// 새 문제는 맨 아래에 덧붙인다 (줄 순서가 오답 노트 id).\n` +
        `window.EXAM = window.EXAM || {};\nwindow.EXAM.${e.id} = [\n` +
        kept.map((q) => "  " + JSON.stringify(q)).join(",\n") +
        (kept.length ? ",\n" : "") +
        "];\n",
    );
    console.log(`${e.id.padEnd(13)} 고침 ${(fix.fixes || []).length}개, 뺌 ${qs.length - kept.length}개 → ${kept.length}문항`);
  }
  console.log(`합계 고침 ${fixed}개, 뺌 ${removed}개`);
}
if (!cmd) console.log("사용법: node tools/exam-fix.js show | apply");
