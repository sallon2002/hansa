// 선지 선별 문제: work/seonji/<단원>.json → data/seonji/<시대>.js
//   node tools/seonji-merge.js check [파일 ...]   형식 검사 (파일을 안 주면 work/seonji/*.json 전부)
//   node tools/seonji-merge.js build [--force]   data/seonji/*.js 만들기 (이미 있으면 --force 필요 — 올린 뒤엔 오답 노트가 줄 번호를 기억한다)
// 쓰는 법은 tools/SEONJI-WRITING.md
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
// --set gichul 이면 기출 선지(work/gichul → data/gichul, window.GICHUL)
const SET = process.argv.includes("--set") ? process.argv[process.argv.indexOf("--set") + 1] : "seonji";
const WORK = path.join(ROOT, "work", SET);
const OUT = path.join(ROOT, "data", SET);
const GLOBAL = SET === "gichul" ? "GICHUL" : "SEONJI";
const MIN_TIMES = 3; // 기출 선지: 이 횟수 이상 나온 선지만 (tools/gichul-count.js 와 같게)
global.window = {};
require(path.join(ROOT, "data", "eras.js"));
const ERAS = window.ERAS;
const ERA_IDS = ERAS.map((e) => e.id);

function load(file) {
  const d = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
  return (d.items || []).map((it, i) => ({ ...it, tag: `${path.basename(file)} #${i} (${it.src || "?"})` }));
}

function checkItem(it, errs, warns) {
  const t = it.tag;
  if (!ERA_IDS.includes(it.era)) errs.push(`${t}: era '${it.era}'`);
  const r = it.row;
  if (!Array.isArray(r) || r.length !== 9) return errs.push(`${t}: row 는 9칸 (지금 ${r && r.length})`);
  if (r.some((x) => typeof x !== "string" || !x.trim())) return errs.push(`${t}: 빈 칸`);
  const choices = r.slice(1, 5).map((x) => x.trim());
  if (new Set(choices).size !== 4) errs.push(`${t}: 보기 중복`);
  const lines = r[0].split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) errs.push(`${t}: 문제는 「설명\\n묻는 말」 두 줄 이상`);
  if (/\([가-힣]\)/.test(r[0])) errs.push(`${t}: 문제에 (가) 꼴 괄호 한 글자를 쓰지 말 것`);
  for (let k = 0; k < 3; k++) {
    const note = r[6 + k], wrong = r[2 + k];
    if (!note.startsWith(wrong + " — ")) errs.push(`${t}: 오답${k + 1} 풀이는 「${wrong} — …」 로 시작`);
  }
  // 정답 이름이 설명에 드러나는지 (뒤에 붙는 말을 떼고 본다)
  const core = r[1].replace(/\s*(시대|정부|왕|대왕|왕조|국가)$/, "").trim();
  if (core.length >= 2 && !/[→·]/.test(core) && lines.slice(0, -1).join(" ").includes(core)) warns.push(`${t}: 설명에 정답 「${core}」 이(가) 보임`);
}

function checkFiles(files) {
  let items = [];
  for (const f of files) items = items.concat(load(f));
  const errs = [], warns = [];
  const seenQ = new Map();
  for (const it of items) {
    checkItem(it, errs, warns);
    const key = String((it.row || [])[0]).replace(/\s+/g, "");
    if (seenQ.has(key)) errs.push(`${it.tag}: 같은 문제가 이미 있음 (${seenQ.get(key)})`);
    else seenQ.set(key, it.tag);
  }
  const byEra = {};
  for (const it of items) byEra[it.era] = (byEra[it.era] || 0) + 1;
  console.log(`${files.map((f) => path.basename(f)).join(", ")}: ${items.length}문항 — ` + ERA_IDS.filter((e) => byEra[e]).map((e) => `${e} ${byEra[e]}`).join(" · "));
  warns.forEach((w) => console.log("  ! " + w));
  errs.forEach((e) => console.log("  ✗ " + e));
  if (!errs.length) console.log("  ✓ 형식 이상 없음");
  return { items, bad: errs.length };
}

const [cmd, ...rest] = process.argv.slice(2).filter((a, i, all) => a !== "--set" && all[i - 1] !== "--set");
const allWork = () => (fs.existsSync(WORK) ? fs.readdirSync(WORK).filter((f) => /\.json$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b)).map((f) => path.join(WORK, f)) : []);

if (cmd === "check") {
  const files = rest.length ? rest : allWork();
  process.exit(checkFiles(files).bad ? 1 : 0);
} else if (cmd === "build") {
  if (fs.existsSync(OUT) && !rest.includes("--force")) {
    console.log("data/seonji 가 이미 있다. 사이트에 올린 뒤라면 줄을 빼거나 순서를 바꾸지 말 것 — 정말 다시 만들려면 --force");
    process.exit(1);
  }
  const checked = checkFiles(allWork());
  const bad = checked.bad;
  let items = checked.items;
  // 기출 선지는 76~80회에 MIN_TIMES 번 이상 나온 사실만 싣는다 (work/gichul/repeats.json — tools/gichul-count.js 와 같은 기준)
  const rep = path.join(WORK, "repeats.json");
  if (SET === "gichul" && fs.existsSync(rep)) {
    const many = new Set();
    for (const g of JSON.parse(fs.readFileSync(rep, "utf8"))) if (g.count >= MIN_TIMES) g.srcs.forEach((s) => many.add(s));
    items = items.filter((it) => many.has(it.src));
    console.log(`  ${MIN_TIMES}회 이상 나온 선지만: ${items.length}문항`);
  }
  if (bad) { console.log("형식 오류가 있어 만들지 않음"); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  for (const e of ERAS) {
    const rows = items.filter((it) => it.era === e.id).map((it) => it.row);
    fs.writeFileSync(
      path.join(OUT, `${e.id}.js`),
      `// ${SET === "gichul" ? "기출 선지" : "선지 선별"} · ${e.label} (${e.range})\n// 한 줄 = [문제, 정답, 오답1, 오답2, 오답3, 해설, 오답1 풀이, 오답2 풀이, 오답3 풀이]. 새 문제는 맨 아래에 덧붙인다.\n` +
        `window.${GLOBAL} = window.${GLOBAL} || {};\nwindow.${GLOBAL}.${e.id} = [\n` + rows.map((r) => "  " + JSON.stringify(r)).join(",\n") + "\n];\n",
    );
    console.log(`  data/${SET}/${e.id}.js ${rows.length}문항`);
  }
} else {
  console.log("node tools/seonji-merge.js check [파일...] | build [--force]");
  process.exit(1);
}
