// 미리보기용 아주 작은 정적 서버: node tools/serve.js [포트]
// 사이트 자체는 index.html 을 더블클릭해도 열린다. 이건 브라우저 도구로 확인할 때만 쓴다.
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const port = Number(process.argv[2]) || 4173;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(root, url === "/" ? "index.html" : url);
    if (!file.startsWith(root)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end("not found");
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`http://localhost:${port}`));
