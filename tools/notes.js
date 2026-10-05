// 검증 결과(고친 문제)와 오답 풀이를 문제 은행에 합친다.
//
// 작업 파일: work/<시대id>-<시작>-<끝>.json
//   {
//     "fixes": [ { "i": 12, "row": [문제, 정답, 오답1, 오답2, 오답3, 해설], "reason": "무엇이 틀렸고 어떻게 고쳤는지" } ],
//     "notes": { "12": ["오답1 풀이", "오답2 풀이", "오답3 풀이"], ... }
//   }
//   notes 의 세 칸은 (고친 뒤의) 오답1·오답2·오답3 순서와 같아야 한다.
//
// 사용법
//   node tools/notes.js check <시대id> <시작> <끝>   작업 파일이 그 범위를 빠짐없이 채웠는지 검사
//   node tools/notes.js fixes                        고친 문제를 전부 보여 준다(검토용)
//   node tools/notes.js apply                        data/*.js 에 합쳐 9칸 줄로 다시 쓴다
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "work");
global.window = {};
require(path.join(ROOT, "data/eras.js"));
for (const e of window.ERAS) require(path.join(ROOT, `data/${e.id}.js`));

function parts(era) {
  if (!fs.existsSync(WORK)) return [];
  return fs
    .readdirSync(WORK)
    .filter((f) => f.startsWith(era + "-") && f.endsWith(".json"))
    .map((f) => {
      try {
        return { file: f, data: JSON.parse(fs.readFileSync(path.join(WORK, f), "utf8")) };
      } catch (err) {
        console.log(`[${f}] JSON 형식 오류: ${err.message}`);
        process.exitCode = 1;
        return { file: f, data: { fixes: [], notes: {} } };
      }
    });
}

/** 한 시대의 고친 줄과 풀이를 모은다 */
function collect(era) {
  const fixes = {};
  const notes = {};
  for (const { file, data } of parts(era)) {
    for (const f of data.fixes || []) fixes[f.i] = { ...f, file };
    for (const [i, n] of Object.entries(data.notes || {})) notes[i] = n;
  }
  return { fixes, notes };
}

function problems(era, from, to) {
  const rows = window.BANK[era];
  const { fixes, notes } = collect(era);
  const out = [];
  for (let i = from; i <= to; i++) {
    const row = fixes[i] ? fixes[i].row : rows[i];
    if (!row) { out.push(`#${i}: 없는 줄`); continue; }
    if (fixes[i]) {
      const r = fixes[i].row;
      if (!Array.isArray(r) || r.length !== 6 || r.some((x) => typeof x !== "string" || !x.trim()))
        out.push(`#${i}: fixes.row 는 빈칸 없는 6칸이어야 함`);
      else if (new Set(r.slice(1, 5).map((x) => x.trim())).size !== 4) out.push(`#${i}: fixes.row 보기 중복`);
      if (!fixes[i].reason) out.push(`#${i}: fixes.reason 없음`);
    }
    const n = notes[i];
    if (!Array.isArray(n) || n.length !== 3 || n.some((x) => typeof x !== "string" || !x.trim()))
      out.push(`#${i}: 오답 풀이 3칸이 없거나 비어 있음`);
  }
  return out;
}

const [cmd, era, a, b] = process.argv.slice(2);

if (cmd === "check") {
  const rows = window.BANK[era];
  if (!rows) { console.log("없는 시대: " + era); process.exit(1); }
  const from = a === undefined ? 0 : Number(a);
  const to = b === undefined ? rows.length - 1 : Number(b);
  const out = problems(era, from, to);
  out.forEach((l) => console.log(l));
  const { fixes } = collect(era);
  const nFix = Object.keys(fixes).filter((i) => i >= from && i <= to).length;
  console.log(`${era} #${from}~#${to}: 문제 ${out.length}건, 고친 문제 ${nFix}개`);
  process.exit(out.length || process.exitCode ? 1 : 0);
}

if (cmd === "fixes") {
  for (const e of window.ERAS) {
    const { fixes } = collect(e.id);
    for (const f of Object.values(fixes).sort((x, y) => x.i - y.i)) {
      const old = window.BANK[e.id][f.i];
      console.log(`\n[${e.id} #${f.i}] ${f.reason}`);
      console.log(`  전: ${old[0]} → ${old[1]} | ✗ ${old.slice(2, 5).join(" / ")} | ${old[5]}`);
      console.log(`  후: ${f.row[0]} → ${f.row[1]} | ✗ ${f.row.slice(2, 5).join(" / ")} | ${f.row[5]}`);
    }
  }
}

if (cmd === "apply") {
  let bad = 0;
  for (const e of window.ERAS) {
    const rows = window.BANK[e.id];
    const out = problems(e.id, 0, rows.length - 1);
    if (out.length) { bad += out.length; console.log(`${e.id}: ${out.length}건 — ${out.slice(0, 3).join(" / ")}`); }
  }
  if (bad) { console.log("빈 곳이 있어 합치지 않았습니다."); process.exit(1); }
  for (const e of window.ERAS) {
    const { fixes, notes } = collect(e.id);
    const rows = window.BANK[e.id].map((r, i) => [...(fixes[i] ? fixes[i].row : r.slice(0, 6)), ...notes[i]]);
    fs.writeFileSync(
      path.join(ROOT, `data/${e.id}.js`),
      `// ${e.label} (${e.range})\n` +
        `// 한 줄 = [문제, 정답, 오답1, 오답2, 오답3, 해설, 오답1 풀이, 오답2 풀이, 오답3 풀이]. 새 문제는 맨 아래에 덧붙인다.\n` +
        `window.BANK = window.BANK || {};\nwindow.BANK.${e.id} = [\n` +
        rows.map((r) => "  " + JSON.stringify(r)).join(",\n") +
        ",\n];\n",
    );
    console.log(`${e.id}: ${rows.length}문항 합침 (고친 문제 ${Object.keys(fixes).length}개)`);
  }
}
