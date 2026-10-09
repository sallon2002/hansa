// 실전 문제를 번호와 함께 읽기 쉽게 보여 준다: node tools/exam-dump.js <시대id> [시작] [끝]
const path = require("path");
const era = process.argv[2];
global.window = {};
require(path.join(__dirname, "../data/exam", era + ".js"));
const qs = window.EXAM[era] || [];
const from = Number(process.argv[3] || 0);
const to = Number(process.argv[4] || qs.length - 1);
const C = ["①", "②", "③", "④", "⑤"];
for (let i = from; i <= to && i < qs.length; i++) {
  const q = qs[i];
  const s = q.source;
  console.log(`\n#${i} [${s.kind} · ${q.points}점]${s.title ? " 《" + s.title + "》" : ""}${s.lead ? " [다음 사실: " + s.lead + "]" : ""}`);
  console.log("  자료: " + s.text.replace(/\n/g, " / ") + (s.cite ? " — " + s.cite : ""));
  console.log("  문제: " + q.stem);
  q.choices.forEach((c, k) => console.log(`  ${C[k]}${k === q.answer ? "★" : " "} ${c}\n       └ ${q.notes[k]}`));
}
