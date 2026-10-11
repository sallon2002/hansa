// 개념 문제 검증 결과를 data/<시대>.js 에 반영한다.
//
// 검증 파일: work/concept-fix/<시대id>.json
//   { "fixes": [ { "i": 12, "row": [문제, 정답, 오답1, 오답2, 오답3, 해설, 오답1 풀이, 오답2 풀이, 오답3 풀이], "reason": "..." } ] }
//
//   node tools/concept-fix.js show    고친 줄을 전부 보여 준다 (검토용)
//   node tools/concept-fix.js apply   data/*.js 에 반영한다
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "work/concept-fix");
global.window = {};
require(path.join(ROOT, "data/eras.js"));
for (const e of window.ERAS) require(path.join(ROOT, `data/${e.id}.js`));

function fixesOf(id) {
  const f = path.join(WORK, id + ".json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).fixes || [] : [];
}
function bad(row) {
  if (!Array.isArray(row) || row.length !== 9 || row.some((x) => typeof x !== "string" || !x.trim())) return "9칸이 아니거나 빈칸";
  if (new Set(row.slice(1, 5).map((x) => x.trim())).size !== 4) return "보기 중복";
  return null;
}
const line = (r) => `${r[0]} → ${r[1]} | ✗ ${r.slice(2, 5).join(" / ")}`;

const cmd = process.argv[2];
let problems = 0;
for (const e of window.ERAS) {
  const rows = window.BANK[e.id];
  const fixes = fixesOf(e.id);
  for (const f of fixes) {
    const why = !rows[f.i] ? "없는 줄" : bad(f.row);
    if (why) { problems++; console.log(`[${e.id} #${f.i}] 형식 오류: ${why}`); continue; }
    if (cmd === "show") {
      console.log(`\n[${e.id} #${f.i}] ${f.reason}`);
      console.log(`  전: ${line(rows[f.i])}\n      ${rows[f.i][5]}`);
      console.log(`  후: ${line(f.row)}\n      ${f.row[5]}`);
    }
  }
  if (cmd === "apply" && fixes.length) {
    fixes.forEach((f) => { if (rows[f.i] && !bad(f.row)) rows[f.i] = f.row; });
    fs.writeFileSync(
      path.join(ROOT, `data/${e.id}.js`),
      `// ${e.label} (${e.range})\n` +
        `// 한 줄 = [문제, 정답, 오답1, 오답2, 오답3, 해설, 오답1 풀이, 오답2 풀이, 오답3 풀이]. 새 문제는 맨 아래에 덧붙인다.\n` +
        `window.BANK = window.BANK || {};\nwindow.BANK.${e.id} = [\n` +
        rows.map((r) => "  " + JSON.stringify(r)).join(",\n") +
        ",\n];\n",
    );
    console.log(`${e.id}: ${fixes.length}줄 고침`);
  }
}
if (!cmd) console.log("사용법: node tools/concept-fix.js show | apply");
process.exit(problems ? 1 : 0);
