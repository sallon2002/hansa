// claude.ai 아티팩트로 올릴 사본 만들기: node tools/build-artifact.js <출력 폴더>
// 아티팩트는 <html>·<head>·<body> 틀을 스스로 씌우고, 글꼴 CSS 는 구글 폰트에서만 받는다.
// 그래서 index.html 에서 틀과 Pretendard(jsDelivr) 링크만 걷어 내고 나머지 파일은 그대로 복사한다.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const out = process.argv[2];
if (!out) {
  console.log("출력 폴더를 지정하세요: node tools/build-artifact.js <폴더>");
  process.exit(1);
}

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const head = html.slice(html.indexOf("<head>") + 6, html.indexOf("</head>"));
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));

const keep = head
  .split("\n")
  .filter((l) => /<title>|fonts\.googleapis\.com|fonts\.gstatic\.com|styles\.css/.test(l))
  .map((l) => l.trim())
  .join("\n");

fs.mkdirSync(path.join(out, "data"), { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), keep + "\n" + body.trim() + "\n");
for (const f of ["styles.css", "app.js", ...fs.readdirSync(path.join(ROOT, "data")).map((d) => "data/" + d)]) {
  fs.copyFileSync(path.join(ROOT, f), path.join(out, f));
}
console.log("만듦: " + out);
