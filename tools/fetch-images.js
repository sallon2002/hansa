// 실전 문제 사진을 사이트에 함께 올린다: 위키미디어 주소로 된 image.src 를 images/ 로 내려받고 src 를 바꿔 쓴다.
//   node tools/fetch-images.js
// 외부 주소를 그대로 쓰면 휴대폰(콘텐츠 차단·저전력 모드·위키미디어 요청 제한)에서 사진이 안 뜰 때가 있어서.
// 파일 이름은 <시대>-<줄번호>[-<순번>].jpg — 위키미디어 파일 이름엔 정답이 들어 있는 경우가 많아 쓰지 않는다.
// 출처(credit · page)는 그대로 둔다. 이미 images/ 인 사진은 건너뛴다.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "images");
const UA = "hansa-quiz/1.0 (https://sallon2002.github.io/hansa/; study site)";
global.window = {};
require(path.join(ROOT, "data/eras.js"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url, file) {
  for (let tryNo = 1; tryNo <= 5; tryNo++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) {
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return;
    }
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(5000 * tryNo);
  }
  throw new Error(`계속 실패 ${url}`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let got = 0;
  for (const e of window.ERAS) {
    global.window.EXAM = {};
    const file = path.join(ROOT, "data/exam", e.id + ".js");
    delete require.cache[require.resolve(file)];
    require(file);
    const qs = window.EXAM[e.id] || [];
    let changed = false;
    for (let i = 0; i < qs.length; i++) {
      const s = qs[i].source;
      const imgs = (s.image ? [s.image] : []).concat(s.images || []);
      for (let k = 0; k < imgs.length; k++) {
        const im = imgs[k];
        if (!/^https?:/.test(im.src)) continue;
        const ext = (path.extname(new URL(im.src).pathname).toLowerCase().match(/^\.(jpe?g|png|webp)$/) || [".jpg"])[0];
        const rel = "images/" + e.id + "-" + i + (imgs.length > 1 ? "-" + (k + 1) : "") + ext.replace(".jpeg", ".jpg");
        await download(im.src, path.join(ROOT, rel));
        console.log(`${rel}  ← ${decodeURIComponent(im.src).slice(-60)}`);
        im.src = rel;
        changed = true;
        got++;
        await sleep(1200);
      }
    }
    if (!changed) continue;
    fs.writeFileSync(
      file,
      `// 실전 문제 — ${e.label} (${e.range})\n` +
        `// 한 줄 = 문제 하나 {era, points, source{kind,title,text,cite,lead,image,images}, stem, choices[5], answer, notes[5]}.\n` +
        `// 새 문제는 맨 아래에 덧붙인다 (줄 순서가 오답 노트 id).\n` +
        `window.EXAM = window.EXAM || {};\nwindow.EXAM.${e.id} = [\n` +
        qs.map((q) => "  " + JSON.stringify(q)).join(",\n") +
        ",\n];\n",
    );
  }
  console.log(`내려받음 ${got}장`);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
