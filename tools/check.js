// 문제 은행 형식 검사: node tools/check.js [시대id ...]
// 한 줄이 [문제, 정답, 오답, 오답, 오답, 해설] 6칸(+ 오답 풀이 3칸)인지, 보기가 겹치지 않는지, 문제가 중복되지 않는지 본다.
const path = require("path");
global.window = {};
require(path.join(__dirname, "../data/eras.js"));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : window.ERAS.map((e) => e.id);
let bad = 0;
let total = 0;
const allQ = new Map();
for (const e of window.ERAS) require(path.join(__dirname, `../data/${e.id}.js`));
for (const e of window.ERAS) {
  const rows = window.BANK[e.id] || [];
  rows.forEach((r, i) => {
    const key = String(r[0]).replace(/\s+/g, "");
    if (allQ.has(key)) {
      if (ids.includes(e.id)) { bad++; console.log(`[${e.id} #${i}] 다른 문제와 같은 질문 (${allQ.get(key)}): ${r[0]}`); }
    } else allQ.set(key, `${e.id} #${i}`);
  });
}
for (const id of ids) {
  const rows = window.BANK[id];
  if (!rows) { console.log(`없는 시대: ${id}`); bad++; continue; }
  rows.forEach((r, i) => {
    const errs = [];
    // 6칸 = 문제·보기·해설, 9칸 = 거기에 오답 1~3의 풀이까지
    if (!Array.isArray(r) || (r.length !== 6 && r.length !== 9)) errs.push(`칸 수 ${r && r.length}`);
    else {
      if (r.some((x) => typeof x !== "string" || !x.trim())) errs.push("빈 칸");
      if (new Set(r.slice(1, 5).map((x) => x.trim())).size !== 4) errs.push("보기 중복");
    }
    if (errs.length) { bad++; console.log(`[${id} #${i}] ${errs.join(", ")}: ${r && r[0]}`); }
  });
  total += rows.length;
  console.log(`${id.padEnd(13)} ${String(rows.length).padStart(4)}문항`);
}
console.log(`합계 ${total}문항, 문제 ${bad}건`);
process.exit(bad ? 1 : 0);
