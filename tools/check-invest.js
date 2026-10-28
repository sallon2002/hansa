// 투자자산운용사 문제 형식 검사 (작성법: tools/INVEST-WRITING.md)
//   node tools/check-invest.js work/invest/concept-bond.json   작업 파일 하나
//   node tools/check-invest.js                                 data/invest/concept·exam 전부
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
global.window = {};
require(path.join(ROOT, "data/invest/eras.js"));
const IDS = window.ERAS.map((e) => e.id);
const KINDS = ["지문", "사례", "표", "계산"];

function checkConcept(rows, tag) {
  const errs = [];
  const seen = new Set();
  rows.forEach((r, i) => {
    const t = `${tag}#${i}`;
    if (!Array.isArray(r) || r.length !== 9) return errs.push(`${t}: 9칸 배열이어야 함`);
    if (r.some((c) => typeof c !== "string" || !c.trim())) errs.push(`${t}: 빈 칸`);
    if (new Set(r.slice(1, 5)).size !== 4) errs.push(`${t}: 보기 중복`);
    if (seen.has(r[0])) errs.push(`${t}: 같은 문제 중복`);
    seen.add(r[0]);
  });
  return errs;
}
function checkExam(qs, tag, era) {
  const errs = [];
  qs.forEach((q, i) => {
    const t = `${tag}#${i}`;
    if (!IDS.includes(q.era)) errs.push(`${t}: era '${q.era}'`);
    if (era && q.era !== era) errs.push(`${t}: era 가 파일 이름(${era})과 다름`);
    if (!q.stem) errs.push(`${t}: stem 없음`);
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || q.choices.some((c) => !String(c).trim())) errs.push(`${t}: choices 4개`);
    else if (new Set(q.choices).size !== 4) errs.push(`${t}: 보기 중복`);
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)) errs.push(`${t}: answer 0~3`);
    if (!Array.isArray(q.notes) || q.notes.length !== 4 || q.notes.some((c) => !String(c).trim())) errs.push(`${t}: notes 4개`);
    if (q.source) {
      if (!KINDS.includes(q.source.kind)) errs.push(`${t}: source.kind 는 ${KINDS.join("·")}`);
      if (!String(q.source.text || "").trim()) errs.push(`${t}: source.text 비어 있음`);
      if (q.source.kind === "표") {
        const rows = String(q.source.text).split("\n").filter(Boolean).map((l) => l.split("|").length);
        if (rows.length < 2 || rows.some((n) => n !== rows[0])) errs.push(`${t}: 표는 2줄 이상, 줄마다 칸 수가 같아야 함`);
      }
    }
    if (q.choices && q.choices.some((c) => /^[①②③④]/.test(c))) errs.push(`${t}: 보기에 번호 붙이지 말 것`);
  });
  const ans = [0, 0, 0, 0];
  qs.forEach((q) => ans[q.answer]++);
  return { errs, ans };
}

function load(f) {
  if (f.endsWith(".json")) return JSON.parse(fs.readFileSync(f, "utf8"));
  global.window.BANK = {};
  global.window.EXAM = {};
  delete require.cache[require.resolve(path.resolve(f))];
  require(path.resolve(f));
  const v = Object.values(window.BANK)[0] || Object.values(window.EXAM)[0];
  return v || [];
}

let bad = 0;
function report(f) {
  const d = load(f);
  const base = path.basename(f).replace(/\.(json|js)$/, "");
  const isExam = /exam/.test(f);
  const era = base.replace(/^(concept|exam)-/, "");
  let errs;
  let extra = "";
  if (isExam) {
    const r = checkExam(d, base, IDS.includes(era) ? era : null);
    errs = r.errs;
    extra = ` · 정답 ①~④ ${r.ans.join("/")} · 지문 ${d.filter((q) => q.source).length}`;
  } else errs = checkConcept(d, base);
  console.log(`${path.relative(ROOT, f)}: ${d.length}문항${extra}`);
  errs.forEach((e) => console.log("  ✗ " + e));
  if (!errs.length) console.log("  ✓ 이상 없음");
  bad += errs.length;
}

const arg = process.argv[2];
if (arg) report(arg);
else
  for (const kind of ["concept", "exam"]) {
    const dir = path.join(ROOT, "data/invest", kind);
    if (fs.existsSync(dir)) fs.readdirSync(dir).filter((f) => f.endsWith(".js")).forEach((f) => report(path.join(dir, f)));
  }
process.exit(bad ? 1 : 0);
