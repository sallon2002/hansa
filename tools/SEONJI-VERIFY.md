# 선지 선별 전수 검증 (2026-11-17)

사이트에 이미 올라간 문제다. 오답 노트가 줄 번호를 기억하므로 **문항을 빼거나 순서를 바꾸지 않는다** — 그 자리에서 고칠 것만 제안한다.
원본: `work/seonji/<단원>.json` 의 `items[i].row` = `[문제, 정답, 오답1, 오답2, 오답3, 해설, 오답1 풀이, 오답2 풀이, 오답3 풀이]`, 문제는 「설명\n묻는 말」. 형식 규칙은 tools/SEONJI-WRITING.md.

## 문항마다 확인
1. 설명·정답·해설이 사실인가 (연도, 왕, 기구 이름, 인물).
2. **정답이 하나뿐인가** — 오답 셋이 설명에도 맞을 여지가 없는가(같은 일을 한 다른 왕·정부·나라, 이어진 제도, 시작/완성 시기 차이 등).
3. 오답 풀이가 그 오답을 정확히 설명하는가(틀린 사실이 없는가).
4. 설명 문장에 정답이 드러나지 않는가(이름·별칭·뻔한 힌트).
5. 묻는 말이 정답 종류와 맞는가(정답이 단체인데 「인물은?」 등), 순서 문항은 ㉠~ 표시와 보기가 맞고 정답 순서가 사실인가.
6. `era` 가 내용 시기에 맞는가 (prehistory·gojoseon·three·nambuk·goryeo·joseon1(~선조)·joseon2(광해군~철종)·modern(~1910)·colonial·contemporary). era 를 바꾸면 줄 번호가 바뀌므로 **era 는 제안만**(reason 에 「era 제안: …」) 하고 fix 에는 넣지 않는다.
7. 한능검 심화 수준에서 너무 지엽적이거나 표현이 어색한 문장.

## 결과
`work/seonji-fix/<단원>.json`:
```json
{ "fixes": [ { "i": 12, "level": "오류" | "개선", "row": [고친 9칸 전체], "reason": "무엇이 왜 틀렸나 / 무엇을 고쳤나" } ] }
```
- `오류` = 사실이 틀렸거나 정답이 둘 이상이거나 정답이 드러남. `개선` = 맞지만 더 낫게(어색한 문장, 약한 오답 등).
- 고칠 게 없으면 넣지 않는다. 정답(row[1])은 원칙적으로 바꾸지 않는다(책 정답과 같아야 한다) — 바꿔야 하면 reason 에 근거를 자세히.
- 다 쓰면 형식만 확인: `"/c/Program Files/nodejs/node.exe" -e "const f=require('./work/seonji-fix/<단원>.json');for(const x of f.fixes){if(x.row.length!==9||new Set(x.row.slice(1,5)).size!==4||x.row.slice(6).some((n,k)=>!n.startsWith(x.row[2+k]+' — ')))console.log('형식',x.i)}"`
- work/seonji/*.json 과 data 파일은 직접 고치지 않는다.
