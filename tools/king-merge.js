// 왕 맞추기: work/king/*.json → data/king.js
//   node tools/king-merge.js check [파일 ...]   형식 검사
//   node tools/king-merge.js build              data/king.js 만들기 (왕·업적 순서는 오답 노트 id — 올린 뒤엔 덧붙이기만)
// 쓰는 법은 tools/KING-WRITING.md
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WORK = path.join(ROOT, "work", "king");
const ERAS = ["three", "nambuk", "goryeo", "joseon1", "joseon2"];
const NATIONS = ["고구려", "백제", "신라", "가야", "통일 신라", "발해", "고려", "조선"];

function load(files) {
  let kings = [];
  for (const f of files) kings = kings.concat(JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, "")).kings.map((k) => ({ ...k, _f: path.basename(f) })));
  return kings;
}
function check(kings) {
  const errs = [], warns = [];
  const ids = new Set(), deedSeen = new Map();
  for (const k of kings) {
    const t = `${k._f} ${k.id || "?"}`;
    if (!/^[a-z0-9-]+$/.test(k.id || "")) errs.push(`${t}: id 형식`);
    if (ids.has(k.id)) errs.push(`${t}: id 중복`);
    ids.add(k.id);
    if (!NATIONS.includes(k.nation)) errs.push(`${t}: nation '${k.nation}'`);
    if (!ERAS.includes(k.era)) errs.push(`${t}: era '${k.era}'`);
    if (!k.name) errs.push(`${t}: name 없음`);
    if (!Array.isArray(k.deeds) || !k.deeds.length) { errs.push(`${t}: deeds 없음`); continue; }
    if (k.deeds.length < 3) warns.push(`${t}: 업적 ${k.deeds.length}개 (「아닌 것」 문제는 안 나옴)`);
    const core = k.name.replace(/\s*(대왕|왕|마립간)$/, "");
    k.deeds.forEach((d, i) => {
      if (typeof d !== "string" || !d.trim()) return errs.push(`${t} #${i}: 빈 문장`);
      if (core.length >= 2 && d.includes(core)) warns.push(`${t} #${i}: 문장에 왕 이름 「${core}」`);
      const key = d.replace(/\s+/g, "");
      if (deedSeen.has(key)) errs.push(`${t} #${i}: 같은 문장이 ${deedSeen.get(key)} 에도 있음`);
      else deedSeen.set(key, t);
    });
  }
  const n = kings.reduce((s, k) => s + (k.deeds || []).length, 0);
  console.log(`왕 ${kings.length}명 · 업적 ${n}개`);
  warns.forEach((w) => console.log("  ! " + w));
  errs.forEach((e) => console.log("  ✗ " + e));
  if (!errs.length) console.log("  ✓ 형식 이상 없음");
  return errs.length;
}

const [cmd, ...rest] = process.argv.slice(2);
const all = () => fs.readdirSync(WORK).filter((f) => /\.json$/.test(f)).sort().map((f) => path.join(WORK, f));
if (cmd === "check") process.exit(check(load(rest.length ? rest : all())) ? 1 : 0);
else if (cmd === "build") {
  const kings = load(all());
  if (check(kings)) process.exit(1);
  const order = { three: 0, nambuk: 1, goryeo: 2, joseon1: 3, joseon2: 4 };
  const out = kings.map(({ _f, ...k }) => k);
  fs.writeFileSync(
    path.join(ROOT, "data", "king.js"),
    "// 왕 맞추기 — 왕마다 업적 문장. 보기는 화면이 고른다(tools/KING-WRITING.md). 왕·업적은 맨 뒤에 덧붙이기만 할 것(오답 노트 id)\n" +
      "window.KINGS = [\n" + out.map((k) => "  " + JSON.stringify(k)).join(",\n") + "\n];\n",
  );
  console.log("data/king.js 만듦");
} else {
  console.log("node tools/king-merge.js check [파일...] | build");
  process.exit(1);
}
