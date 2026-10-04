// 새로 추가된 줄만 보기: node tools/dump.js 시대id 시작번호
global.window = {};
require("../data/" + process.argv[2] + ".js");
const rows = window.BANK[process.argv[2]];
rows.slice(Number(process.argv[3] || 0)).forEach((r, i) => console.log(`${Number(process.argv[3] || 0) + i}. ${r[0]} → ${r[1]} | ✗ ${r[2]} / ${r[3]} / ${r[4]} | ${r[5]}`));
