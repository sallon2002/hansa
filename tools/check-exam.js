// 실전 문제 형식 검사
//   node tools/check-exam.js                       data/exam/*.js 전부
//   node tools/check-exam.js work/exam/goryeo-1.json  작업 파일 하나
//
// 실전 문제 한 개의 모양 (JSON):
// {
//   "era": "goryeo",            시대 id (data/eras.js)
//   "points": 2,                배점 1·2·3
//   "source": {                 자료 상자
//     "kind": "사료",           사료 · 대화 · 안내문 · 신문 · 일기 · 연표 · 검색 · 묶음
//     "title": "",              안내문·신문 제목, 검색은 검색어, 일기는 날짜 (없으면 생략)
//     "text": "...",            본문. 줄바꿈은 \n. 대화는 "이름: 말" 한 줄씩, 연표는 사건 6개 한 줄씩,
//                               묶음은 "(가) ..." "(나) ..." 한 줄씩. (가)·(나)는 그대로, 밑줄은 __이렇게__
//     "cite": "『고려사』",     출처 (없으면 생략)
//     "lead": "..."             연표 위에 보이는 '다음 사실' 상자 (연표에서만)
//   },
//   "stem": "(가) 왕의 재위 기간에 있었던 사실로 옳은 것은?",
//   "choices": ["...", "...", "...", "...", "..."],   5개. 번호(①) 붙이지 않음
//   "answer": 2,                정답 번호 0~4 (choices 순서 기준)
//   "notes": ["...", "...", "...", "...", "..."],     보기마다 풀이 (정답 칸은 왜 정답인지)
//   "fixed": true               보기 순서를 섞지 말 것 (연표 (가)~(마) 는 자동)
// }
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
global.window = {};
require(path.join(ROOT, "data/eras.js"));
const ERA_IDS = window.ERAS.map((e) => e.id);
const KINDS = ["사료", "대화", "안내문", "신문", "일기", "연표", "검색", "묶음"];

function load(file) {
  if (file.endsWith(".json")) {
    const d = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(d) ? d : d.questions || [];
  }
  global.window.EXAM = {};
  require(path.resolve(file));
  const k = Object.keys(window.EXAM);
  return k.length ? window.EXAM[k[0]] : [];
}

/** 문제 하나를 검사해 오류(막음)와 경고(참고) 목록을 돌려준다 */
function checkOne(q, i) {
  const errs = [];
  const warns = [];
  const tag = `#${i}`;
  if (!q || typeof q !== "object") return { errs: [`${tag}: 객체가 아님`], warns };
  if (!ERA_IDS.includes(q.era)) errs.push(`${tag}: era '${q.era}' 는 없는 시대`);
  if (![1, 2, 3].includes(q.points)) errs.push(`${tag}: points 는 1·2·3 중 하나`);
  const s = q.source;
  if (!s || typeof s !== "object") errs.push(`${tag}: source 없음`);
  else {
    if (!KINDS.includes(s.kind)) errs.push(`${tag}: source.kind '${s.kind}' 는 ${KINDS.join("·")} 중 하나`);
    const text = typeof s.text === "string" ? s.text.trim() : "";
    if (!text) errs.push(`${tag}: source.text 비어 있음`);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (s.kind === "연표") {
      if (lines.length < 5 || lines.length > 6) errs.push(`${tag}: 연표는 사건 5~6개를 한 줄씩 (지금 ${lines.length}줄)`);
      if (!s.lead) warns.push(`${tag}: 연표에 lead(다음 사실 상자)가 없음`);
    }
    if (s.kind === "대화" && (lines.length < 2 || lines.some((l) => !/^[^:：]{1,12}[:：]/.test(l))))
      errs.push(`${tag}: 대화는 "이름: 말" 꼴 줄이 2개 이상`);
    if (s.kind === "묶음" && (lines.length < 2 || lines.some((l) => !/^\([가-힣]\)/.test(l))))
      errs.push(`${tag}: 묶음은 "(가) ..." 꼴 줄이 2개 이상`);
    if ((s.kind === "안내문" || s.kind === "신문") && !s.title) warns.push(`${tag}: ${s.kind}에 title 없음`);
    if (s.kind === "검색" && !s.title) warns.push(`${tag}: 검색에 title(검색어) 없음`);
    if (text.length > 700) warns.push(`${tag}: 자료가 김 (${text.length}자)`);
  }
  if (typeof q.stem !== "string" || !q.stem.trim()) errs.push(`${tag}: stem 비어 있음`);
  else if (!/\?$/.test(q.stem.trim())) warns.push(`${tag}: stem 이 ? 로 끝나지 않음`);
  if (!Array.isArray(q.choices) || q.choices.length !== 5) errs.push(`${tag}: choices 는 5개`);
  else {
    if (q.choices.some((c) => typeof c !== "string" || !c.trim())) errs.push(`${tag}: 빈 보기`);
    if (new Set(q.choices.map((c) => String(c).trim())).size !== 5) errs.push(`${tag}: 보기 중복`);
    if (q.choices.some((c) => /^[①-⑤]/.test(String(c).trim()))) errs.push(`${tag}: 보기에 번호(①)를 붙이지 말 것`);
    const isLabel = q.choices.every((c) => /^\([가-힣]\)$/.test(String(c).trim()));
    const isOrder = q.choices.every((c) => /\([가-힣]\)\s*-\s*\([가-힣]\)/.test(String(c)));
    if (!isLabel && !isOrder && q.choices.some((c) => !/다\.$/.test(String(c).trim())))
      warns.push(`${tag}: 보기 문장이 '~다.' 로 끝나지 않음`);
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 4) errs.push(`${tag}: answer 는 0~4`);
  if (!Array.isArray(q.notes) || q.notes.length !== 5 || q.notes.some((n) => typeof n !== "string" || !n.trim()))
    errs.push(`${tag}: notes 는 빈칸 없는 5개`);
  const everywhere = [q.stem, s && s.text, s && s.title, s && s.lead].filter(Boolean).join(" ");
  if (/\(가\)/.test(q.stem || "") && !/\(가\)/.test([s && s.text, s && s.title, s && s.lead].filter(Boolean).join(" ")))
    warns.push(`${tag}: stem 은 (가)를 묻는데 자료에 (가)가 없음`);
  if (/밑줄/.test(q.stem || "") && !/__[^_]+__/.test((s && s.text) || "")) warns.push(`${tag}: '밑줄 그은' 문제인데 자료에 __밑줄__ 이 없음`);
  void everywhere;
  return { errs, warns };
}

function checkAll(qs, label) {
  let errs = [];
  let warns = [];
  const seen = new Map();
  qs.forEach((q, i) => {
    const r = checkOne(q, i);
    errs = errs.concat(r.errs);
    warns = warns.concat(r.warns);
    const key = ((q && q.stem) || "") + "|" + ((q && q.source && q.source.text) || "");
    if (seen.has(key)) errs.push(`#${i}: #${seen.get(key)} 과 같은 문제`);
    else seen.set(key, i);
  });
  const neg = qs.filter((q) => /옳지 않은|아닌 것/.test((q && q.stem) || "")).length;
  if (qs.length >= 5 && neg > qs.length * 0.25) warns.push(`'옳지 않은' 문제가 ${neg}/${qs.length} — 너무 많음`);
  const pts = { 1: 0, 2: 0, 3: 0 };
  const kinds = {};
  qs.forEach((q) => { if (q) { pts[q.points] = (pts[q.points] || 0) + 1; if (q.source) kinds[q.source.kind] = (kinds[q.source.kind] || 0) + 1; } });
  console.log(`${label}: ${qs.length}문항 · 배점 1점 ${pts[1]} / 2점 ${pts[2]} / 3점 ${pts[3]} · 자료 ${Object.entries(kinds).map(([k, v]) => k + " " + v).join(", ")}`);
  warns.forEach((w) => console.log("  경고 " + w));
  errs.forEach((e) => console.log("  오류 " + e));
  return errs.length;
}

const args = process.argv.slice(2);
let bad = 0;
let total = 0;
if (args.length) {
  for (const f of args) {
    const qs = load(f);
    total += qs.length;
    bad += checkAll(qs, f);
  }
} else {
  for (const id of ERA_IDS) {
    const f = path.join(ROOT, "data/exam", id + ".js");
    if (!fs.existsSync(f)) { console.log(`${id}: 파일 없음`); continue; }
    const qs = load(f);
    total += qs.length;
    bad += checkAll(qs, id);
  }
}
console.log(`합계 ${total}문항, 오류 ${bad}건`);
process.exit(bad ? 1 : 0);
