// 개념 문제를 번호와 함께 보기: node tools/dump.js 시대id [시작] [끝]
global.window = {};
require("../data/" + process.argv[2] + ".js");
const rows = window.BANK[process.argv[2]];
const from = Number(process.argv[3] || 0);
const to = Number(process.argv[4] || rows.length - 1);
for (let i = from; i <= to && i < rows.length; i++) {
  const r = rows[i];
  console.log(`\n#${i} ${r[0]}\n  정답 ${r[1]} — ${r[5]}`);
  [2, 3, 4].forEach((c, k) => console.log(`  오답 ${r[c]}${r[6 + k] ? "  ← " + r[6 + k] : ""}`));
}
