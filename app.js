// 한국사 1급 문제 풀이 — 화면 동작 전부.
// 개념 문제는 data/*.js 가 window.BANK 에, 실전 문제는 data/exam/*.js 가 window.EXAM 에,
// 선지 선별(한국사)은 data/seonji/*.js 가 window.SEONJI 에, 왕 맞추기(한국사)는 data/king.js 가 window.KINGS 에 올려 둔다.
(function () {
  "use strict";

  var ERAS = window.ERAS;
  var BANK = window.BANK || {};
  var EXAM = window.EXAM || {};
  var SEONJI = window.SEONJI || {};
  var KINGS = window.KINGS || [];
  var GICHUL = window.GICHUL || {};
  // 과목: index.html 이 주소(?s=invest)를 보고 정해 둔다. 과목마다 문제·기록·기록 옮기기 코드가 따로다
  var SUBJECT = window.SUBJECT === "invest" ? "invest" : "hansa";
  var IS_INVEST = SUBJECT === "invest";
  var STORE_KEY = IS_INVEST ? "invest1-v1" : "hansa1-v2";
  var OLD_KEY = IS_INVEST ? "" : "hansa1-v1";
  var CIRCLED = ["①", "②", "③", "④", "⑤"];
  var TOTAL_WEIGHT = ERAS.reduce(function (s, e) { return s + e.weight; }, 0);
  var ERA_BY_ID = {};
  ERAS.forEach(function (e) { ERA_BY_ID[e.id] = e; });

  /** 시대마다 색 하나 — 고려는 청자, 조선 전기는 청화백자, 일제 강점기는 진홍 */
  var ERA_COLOR = IS_INVEST ? {
    // 1과목 금빛 · 2과목 청록 · 3과목 보라 계열
    tax: "#d6a44f", products: "#e0b866", realestate: "#c8924e",
    alt: "#55b9cf", global: "#62acf0", analysis: "#74bda8", risk: "#4fa3a0",
    ethics: "#ae92e6", law: "#9b7fe0", kofia: "#c3a6f0", equity: "#d4705f", bond: "#7a9ce0",
    deriv: "#d0626f", perf: "#a2afc2", macro: "#d1aa4f", portfolio: "#e08a6a",
  } : {
    prehistory: "#a2afc2",
    gojoseon: "#c8924e",
    three: "#d4705f",
    nambuk: "#ae92e6",
    goryeo: "#74bda8",
    joseon1: "#7a9ce0",
    joseon2: "#d1aa4f",
    modern: "#55b9cf",
    colonial: "#d0626f",
    contemporary: "#62acf0",
  };

  /** 탭마다 다른 머리글·안내 */
  var TAB_TEXT = IS_INVEST ? {
    concept: {
      eyebrow: "투자자산운용사 · 개념",
      headline: "핵심 개념을 한 문제씩",
      leadKey: "세부과목 출제 비중대로 섞어 냅니다. 번호를 누르거나 클릭해서 고르면 보기마다 바로 밑에 설명이 붙어요. Enter 로 다음 문제.",
      leadTouch: "세부과목 출제 비중대로 섞어 냅니다. 보기를 누르면 바로 밑에 설명이 붙어요. 아래 다음 문제 버튼으로 넘어가세요.",
      stats: "개념 문제",
    },
    exam: {
      eyebrow: "투자자산운용사 · 실전",
      headline: "시험장처럼, 계산까지 끝까지",
      leadKey: "실제 시험처럼 4지선다. 지문·표를 읽고 고르면 보기마다 풀이(계산 과정 포함)가 붙습니다. 1~4 로 고르고 Enter 로 다음 문제.",
      leadTouch: "실제 시험처럼 4지선다. 지문·표를 읽고 고르면 보기마다 풀이(계산 과정 포함)가 붙습니다.",
      stats: "실전 문제",
    },
  } : {
    concept: {
      eyebrow: "Korean History · 1급 · 개념",
      headline: "한 문제씩, 개념부터 단단하게",
      leadKey: "번호를 누르거나 클릭해서 고르면 보기마다 바로 밑에 설명이 붙습니다. 확인하고 Enter 로 다음 문제.",
      leadTouch: "보기를 누르면 바로 밑에 설명이 붙습니다. 확인하고 아래 다음 문제 버튼으로 넘어가세요.",
      stats: "개념 문제",
    },
    exam: {
      eyebrow: "Korean History · 1급 · 실전",
      headline: "자료를 읽고, 시험장처럼 판단하기",
      leadKey: "한능검 심화 기출 유형 그대로. 자료 한 편을 읽고 다섯 보기 중 고릅니다. 보기 다섯은 모두 실제 사실 — 자료와 맞는 하나만 정답이에요.",
      leadTouch: "한능검 심화 기출 유형 그대로. 자료를 읽고 다섯 보기 중 하나를 누르세요. 보기 다섯은 모두 실제 사실 — 자료와 맞는 하나만 정답이에요.",
      stats: "실전 문제",
    },
    seonji: {
      eyebrow: "Korean History · 선지 선별",
      headline: "이 선지, 누구 이야기일까",
      leadKey: "시험에 자주 나오는 선지 한 줄을 보고 해당하는 시대·왕·나라·기구를 네 보기 중에서 고릅니다. 1~4 로 고르고 Enter 로 다음 문제.",
      leadTouch: "시험에 자주 나오는 선지 한 줄을 보고 해당하는 시대·왕·나라·기구를 네 보기 중에서 고릅니다.",
      stats: "선지 선별",
    },
    king: {
      eyebrow: "Korean History · 왕 맞추기",
      headline: "이 왕 때의 일, 아닌 일",
      leadKey: "왕 이름을 보고 그 왕 때의 업적·사건인 선지(또는 아닌 선지)를 고릅니다. 보기는 풀 때마다 바뀌어요. 1~4 로 고르고 Enter 로 다음 문제.",
      leadTouch: "왕 이름을 보고 그 왕 때의 업적·사건인 선지(또는 아닌 선지)를 고릅니다. 보기는 풀 때마다 바뀌어요.",
      stats: "왕 맞추기",
    },
    gichul: {
      eyebrow: "Korean History · 기출 선지",
      headline: "실제 시험에 나온 선지만",
      leadKey: "최근 기출 문제지의 보기 하나하나를 4지선다로 바꿨습니다. 선지를 보고 해당하는 시대·왕·나라·사건을 고르세요. 해설에 몇 회 몇 번인지 나와요.",
      leadTouch: "최근 기출 보기 하나하나를 4지선다로 바꿨습니다. 해설에 몇 회 몇 번인지 나와요.",
      stats: "기출 선지",
    },
  };

  var ICONS = {
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
    swap: '<path d="M4 8h13"/><path d="m14 4 4 4-4 4"/><path d="M20 16H7"/><path d="m10 12-4 4 4 4"/>',
    flame: '<path d="M12 22c4.4 0 7-2.9 7-6.6 0-3.2-2.1-5.2-3.4-7.1-.4 1.6-1.3 2.6-2.4 3.1.2-3-1-6-3.7-7.4.3 2.6-1 4-2.5 5.6C5.6 11.3 5 13 5 15.4 5 19.1 7.6 22 12 22Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  };
  function icon(name, size) {
    size = size || 16;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[name] +
      "</svg>"
    );
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  /** 자료 글의 작은 표식: (가)·(나)는 붉게, __밑줄__ 은 밑줄로 */
  function mark(s) {
    var out = esc(s).replace(/__([^_]+)__/g, "<u>$1</u>");
    // 투자자산운용사 자료의 "(연)"·"(원)" 같은 단위 표기는 그대로 둔다
    return IS_INVEST ? out : out.replace(/\(([가-힣])\)/g, '<b class="blank">($1)</b>');
  }
  /** 여러 줄 문제(선지 선별): 앞줄은 선지·사건, 마지막 줄은 묻는 말이라 작게 */
  function qHtml(s) {
    var lines = String(s).split("\n");
    if (lines.length < 2) return mark(s);
    var ask = lines.pop();
    return lines.map(mark).join("<br>") + '<span class="q-ask">' + mark(ask) + "</span>";
  }
  function $(id) { return document.getElementById(id); }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** 애니메이션 클래스를 떼었다 다시 붙여 처음부터 재생한다 */
  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ---------- 문제 은행 ----------
  // 왕 맞추기 문제 은행: 시대마다 [{k: 왕 번호, d: 업적 번호, m: "is"(옳은 것) | "not"(아닌 것)}].
  // 보기는 build 때 고른다. 순서는 data/king.js 순서 그대로라 거기에는 덧붙이기만 한다(오답 노트 id)
  var KBANK = {};
  KINGS.forEach(function (k, ki) {
    var rows = KBANK[k.era] || (KBANK[k.era] = []);
    k.deeds.forEach(function (d, di) { rows.push({ k: ki, d: di, m: "is" }); });
    if (k.deeds.length >= 3) k.deeds.forEach(function (d, di) { rows.push({ k: ki, d: di, m: "not" }); });
  });
  var BANK_SIZE = { concept: 0, exam: 0, seonji: 0, king: 0, gichul: 0 };
  ERAS.forEach(function (e) {
    BANK_SIZE.concept += (BANK[e.id] || []).length;
    BANK_SIZE.exam += (EXAM[e.id] || []).length;
    BANK_SIZE.seonji += (SEONJI[e.id] || []).length;
    BANK_SIZE.king += (KBANK[e.id] || []).length;
    BANK_SIZE.gichul += (GICHUL[e.id] || []).length;
  });
  function bankOf(tab) { return tab === "exam" ? EXAM : tab === "seonji" ? SEONJI : tab === "king" ? KBANK : tab === "gichul" ? GICHUL : BANK; }
  /** id 는 "시대:줄번호" */
  function rowOf(tab, id) {
    var p = id.split(":");
    var rows = bankOf(tab)[p[0]];
    return rows && rows[Number(p[1])];
  }

  // ---------- 기록 (이 브라우저에만 남는다) ----------
  function emptyStats() {
    return { solved: 0, correct: 0, streak: 0, best: 0, byEra: {}, wrong: [] };
  }
  function cleanStats(s, tab) {
    s = Object.assign(emptyStats(), s || {});
    s.wrong = (Array.isArray(s.wrong) ? s.wrong : []).filter(function (id) { return typeof id === "string" && !!rowOf(tab, id); });
    if (isDrill(tab)) {
      // 1회독 진도: 시대마다 이번 바퀴에 푼 줄 번호. 기록에 남아 앱을 다시 열어도 이어서 낸다
      var read = {};
      var r = s.read && typeof s.read === "object" ? s.read : {};
      Object.keys(r).forEach(function (era) {
        var rows = bankOf(tab)[era];
        if (!rows || !Array.isArray(r[era])) return;
        var ok = r[era].filter(function (i, k, a) { return i >= 0 && i < rows.length && a.indexOf(i) === k; });
        if (ok.length) read[era] = ok;
      });
      s.read = read;
      s.rounds = s.rounds > 0 ? Math.floor(s.rounds) : 0;
      s.skip = (Array.isArray(s.skip) ? s.skip : []).filter(function (id, k, a) { return typeof id === "string" && !!rowOf(tab, id) && a.indexOf(id) === k; });
      s.again = (Array.isArray(s.again) ? s.again : []).filter(function (a) {
        return a && typeof a.id === "string" && !!rowOf(tab, a.id) && (a.step === 1 || a.step === 2) && typeof a.at === "number";
      });
    }
    return s;
  }
  /** 버린 선지(st.skip)는 1회독 대상에서 빠진다 */
  function skipSet(st) {
    var o = {};
    (st.skip || []).forEach(function (id) { o[id] = true; });
    return o;
  }
  function readCount(st) {
    var sk = skipSet(st);
    return Object.keys(st.read || {}).reduce(function (n, era) {
      return n + st.read[era].filter(function (i) { return !sk[era + ":" + i]; }).length;
    }, 0);
  }
  function roundTotal(st, t) {
    return BANK_SIZE[t] - (st.skip || []).length;
  }
  /** 1회독·다시 보기·버리기를 쓰는 탭: 선지 선별, 기출 선지 */
  function isDrill(t) { return t === "seonji" || t === "gichul"; }
  function loadStats() {
    var out = { concept: emptyStats(), exam: emptyStats(), seonji: emptyStats(), king: emptyStats(), gichul: emptyStats() };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var v2 = JSON.parse(raw);
        out.concept = cleanStats(v2.concept, "concept");
        out.exam = cleanStats(v2.exam, "exam");
        out.seonji = cleanStats(v2.seonji, "seonji");
        out.king = cleanStats(v2.king, "king");
        out.gichul = cleanStats(v2.gichul, "gichul");
        return out;
      }
      // 두 탭이 생기기 전 기록은 개념 문제 기록으로 이어받는다
      var old = OLD_KEY && localStorage.getItem(OLD_KEY);
      if (old) out.concept = cleanStats(JSON.parse(old), "concept");
    } catch (e) {
      /* 사생활 보호 모드 등 — 기록 없이 계속 푼다 */
    }
    return out;
  }
  function saveStats() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(stats));
    } catch (e) {
      /* 저장 못 해도 풀이는 계속된다 */
    }
  }

  // ---------- 출제 ----------
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  /** 개념 문제·선지 선별: 보기는 낼 때마다 섞고, 정답은 데이터에서 늘 두 번째 칸, 7~9번째 칸은 오답 풀이 */
  function buildConcept(id, t) {
    t = t || "concept";
    var row = rowOf(t, id);
    if (!row) return null;
    var notesBy = {};
    notesBy[row[2]] = row[6] || "";
    notesBy[row[3]] = row[7] || "";
    notesBy[row[4]] = row[8] || "";
    var choices = shuffle([row[1], row[2], row[3], row[4]]);
    var notes = choices.map(function (c) {
      if (c === row[1]) return row[5];
      var n = notesBy[c] || "";
      var dash = n.indexOf(" — ");
      return dash >= 0 ? n.slice(dash + 3) : n;
    });
    return { id: id, tab: t, era: id.split(":")[0], q: row[0], choices: choices, answer: choices.indexOf(row[1]), notes: notes };
  }
  /** 실전 문제: 다섯 보기. (가)~(마) 처럼 자리가 뜻을 갖는 보기는 섞지 않는다 */
  function buildExam(id) {
    var q = rowOf("exam", id);
    if (!q) return null;
    var fixed = q.fixed || q.choices.every(function (c) { return /^\([가-힣]\)$/.test(String(c).trim()); });
    var idx = q.choices.map(function (c, i) { return i; });
    var order = fixed ? idx : shuffle(idx);
    return {
      id: id,
      tab: "exam",
      era: id.split(":")[0],
      q: q.stem,
      points: q.points,
      source: q.source,
      choices: order.map(function (i) { return q.choices[i]; }),
      notes: order.map(function (i) { return q.notes[i]; }),
      answer: order.indexOf(q.answer),
    };
  }
  /** 왕 맞추기: 그 왕의 업적 + 다른 왕(같은 나라 먼저)의 업적으로 보기 넷을 그때그때 고른다 */
  function kingLabel(k) { return k.name + "(" + k.nation + ")"; }
  function foreignDeeds(k, n) {
    var tiers = [
      KINGS.filter(function (o) { return o !== k && o.nation === k.nation; }),
      KINGS.filter(function (o) { return o !== k && o.nation !== k.nation && o.era === k.era; }),
      KINGS.filter(function (o) { return o !== k && o.nation !== k.nation && o.era !== k.era; }),
    ];
    var out = [], usedKing = {};
    for (var t = 0; t < tiers.length && out.length < n; t++) {
      // 한 왕에서 하나씩 — 같은 왕의 문장이 두 개 섞이지 않게
      var pool = shuffle(tiers[t]);
      for (var i = 0; i < pool.length && out.length < n; i++) {
        var o = pool[i];
        if (usedKing[o.name + o.nation]) continue;
        usedKing[o.name + o.nation] = true;
        out.push({ text: o.deeds[Math.floor(Math.random() * o.deeds.length)], king: o });
      }
    }
    return out;
  }
  function buildKing(id) {
    var row = rowOf("king", id);
    if (!row) return null;
    var k = KINGS[row.k];
    var items;
    if (row.m === "is") {
      items = [{ text: k.deeds[row.d], king: k, ans: true }].concat(foreignDeeds(k, 3));
    } else {
      var mine = [row.d].concat(shuffle(k.deeds.map(function (d, i) { return i; }).filter(function (i) { return i !== row.d; })).slice(0, 2));
      items = mine.map(function (i) { return { text: k.deeds[i], king: k }; });
      var f = foreignDeeds(k, 1)[0];
      f.ans = true;
      items.push(f);
    }
    items = shuffle(items);
    var who = k.nation + " " + k.name;
    return {
      id: id,
      tab: "king",
      era: k.era,
      q: who + "\n" + (row.m === "is" ? "이 왕 때의 일로 옳은 것은?" : "이 왕 때의 일이 __아닌__ 것은?"),
      choices: items.map(function (it) { return it.text; }),
      answer: items.findIndex(function (it) { return it.ans; }),
      notes: items.map(function (it) {
        if (it.king === k) return row.m === "is" ? "맞다 — " + k.name + " 때의 일이다." : k.name + " 때의 일이 맞다.";
        return kingLabel(it.king) + " 때의 일이다" + (row.m === "not" ? " — " + k.name + " 때의 일이 아니다." : ".");
      }),
    };
  }
  function build(tab, id) {
    return tab === "exam" ? buildExam(id) : tab === "king" ? buildKing(id) : buildConcept(id, tab);
  }
  /** 출제 비중대로 시대를 하나 고른다 — 그 탭에 문제가 있는 시대만 */
  function pickEra(tab) {
    var bank = bankOf(tab);
    var pool = ERAS.filter(function (e) { return (bank[e.id] || []).length; });
    var total = pool.reduce(function (s, e) { return s + e.weight; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r < 0) return pool[i].id;
    }
    return pool[pool.length - 1].id;
  }
  /** 탭·시대마다 이번에 이미 낸 줄 번호. 다 돌면 비우고 다시 돈다 */
  var seen = { concept: {}, exam: {}, seonji: {}, king: {}, gichul: {} };
  function nextId(tab, prevId) {
    var st = stats[tab];
    if (modes[tab] === "wrong" && st.wrong.length) {
      var pool = st.wrong.length > 1 ? st.wrong.filter(function (id) { return id !== prevId; }) : st.wrong;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (isDrill(tab)) return nextUnread(st, prevId, tab);
    // 전체 랜덤에서도 오답 노트 문제가 아주 조금 더 자주 나온다: 다른 문제보다 약 1.2배.
    // 티 나지 않게 한 번에 붙는 확률은 6% 를 넘지 않는다. 맞히면 choose() 가 노트에서 지운다
    var wrongPool = st.wrong.filter(function (id) { return id !== prevId; });
    if (wrongPool.length && Math.random() < Math.min(0.06, (0.2 * wrongPool.length) / Math.max(1, BANK_SIZE[tab]))) {
      return wrongPool[Math.floor(Math.random() * wrongPool.length)];
    }
    var era = pickEra(tab);
    var rows = bankOf(tab)[era];
    var used = seen[tab][era] || (seen[tab][era] = {});
    if (Object.keys(used).length >= rows.length) used = seen[tab][era] = {};
    var left = [];
    for (var i = 0; i < rows.length; i++) if (!used[i] && era + ":" + i !== prevId) left.push(i);
    var idx = left.length ? left[Math.floor(Math.random() * left.length)] : 0;
    used[idx] = true;
    return era + ":" + idx;
  }
  /** 선지 선별 전체 랜덤: 이번 바퀴에 아직 안 푼 문항만, 시대 비중 없이 고르게. 오답 노트 문제도 끼우지 않는다.
   *  다 풀면 한 바퀴(rounds)를 올리고 처음부터 다시 돈다 */
  function nextUnread(st, prevId, t) {
    // 틀린 선지는 20문제 뒤, 그걸 맞히면 60문제 뒤에 다시 낸다 (st.again: {id, at: 몇 번째 풀이 뒤, step 1·2})
    var again = st.again || (st.again = []);
    var due = null;
    again.forEach(function (a) { if (a.at <= st.solved && a.id !== prevId && (!due || a.at < due.at)) due = a; });
    if (due) {
      notice = due.step === 1 ? "앞에서 틀린 선지예요. 이번엔 맞혀 보세요." : "한 번 더 확인 — 앞에서 다시 맞힌 선지예요. 이번에도 맞히면 오답 노트에서 빠져요.";
      return due.id;
    }
    var read = st.read || (st.read = {});
    var sk = skipSet(st);
    var left = [];
    ERAS.forEach(function (e) {
      var rows = bankOf(t)[e.id] || [];
      var done = {};
      (read[e.id] || []).forEach(function (i) { done[i] = true; });
      for (var i = 0; i < rows.length; i++) if (!done[i] && !sk[e.id + ":" + i] && e.id + ":" + i !== prevId) left.push(e.id + ":" + i);
    });
    if (left.length) return left[Math.floor(Math.random() * left.length)];
    if (roundTotal(st, t) <= 0) return prevId || ERAS[0].id + ":0"; // 전부 버렸으면 더 낼 게 없다
    // 1회독 끝: 틀린 게 남았으면(다시 보기 대기 중인 것 포함) 오답 노트로 넘어가 한 번씩 맞혀 비우고, 하나도 없으면 다음 바퀴
    st.again = [];
    if (st.wrong.length) {
      modes[t] = "wrong";
      notice = "전체 선지 1회독 완료! 남은 오답 " + st.wrong.length + "개를 바로 정리합니다. 한 번 맞히면 노트에서 빠져요.";
      return nextId(t, prevId);
    }
    newRound(st);
    notice = "모든 선지를 다 맞혔어요! " + (st.rounds + 1) + "회독을 처음부터 시작합니다.";
    return nextUnread(st, prevId, t);
  }
  function newRound(st) {
    st.read = {};
    st.rounds = (st.rounds || 0) + 1;
    saveStats();
  }
  /** 다음 문제 위에 한 번만 띄울 안내 (선지 선별 단계 전환) */
  var notice = "";

  // ---------- 상태 ----------
  var stats = loadStats();
  var tab = "concept";
  var modes = { concept: "all", exam: "all", seonji: "all", king: "all", gichul: "all" };
  var current = null;
  var picked = null;
  var count = 0;
  var justAnswered = false;

  function ask() {
    if (!BANK_SIZE[tab]) { current = null; picked = null; render(); return; }
    current = build(tab, nextId(tab, current && current.tab === tab ? current.id : null));
    var nt = $("qNotice");
    nt.textContent = notice;
    nt.classList.toggle("hidden", !notice);
    notice = "";
    picked = null;
    unsureMarked = false;
    count++;
    render();
    replay($("qBody"), "enter");
    choiceEls.forEach(function (b, i) {
      b.style.setProperty("--i", i);
      replay(b, "enter");
    });
  }

  function choose(i) {
    if (!current || picked !== null || i >= current.choices.length) return;
    picked = i;
    justAnswered = true;
    var ok = i === current.answer;
    var st = stats[tab];
    var e = st.byEra[current.era] || { t: 0, c: 0 };
    st.byEra[current.era] = { t: e.t + 1, c: e.c + (ok ? 1 : 0) };
    st.solved++;
    if (ok) st.correct++;
    st.streak = ok ? st.streak + 1 : 0;
    st.best = Math.max(st.best, st.streak);
    var at = st.wrong.indexOf(current.id);
    if (isDrill(tab) && modes[tab] === "all") {
      // 선지 선별 1회독: 틀리면 20문제 뒤 → 맞히면 60문제 뒤 → 또 맞히면 오답 노트에서 뺀다. 중간에 틀리면 20문제 뒤부터 다시
      var again = st.again || (st.again = []);
      var ai = -1;
      again.forEach(function (a, k) { if (a.id === current.id) ai = k; });
      if (!ok) {
        var a1 = { id: current.id, at: st.solved + 20, step: 1 };
        if (ai >= 0) again[ai] = a1; else again.push(a1);
        if (at < 0) st.wrong.push(current.id);
      } else if (ai >= 0 && again[ai].step === 1) {
        again[ai] = { id: current.id, at: st.solved + 60, step: 2 };
      } else {
        if (ai >= 0) again.splice(ai, 1);
        if (at >= 0) st.wrong.splice(at, 1);
      }
    } else {
      if (ok && at >= 0) st.wrong.splice(at, 1);
      if (!ok && at < 0) st.wrong.push(current.id);
      // 오답 노트에서 맞혀 뺀 선지는 다시 보기 대기에서도 뺀다
      if (isDrill(tab) && ok && stats[tab].again) {
        stats[tab].again = stats[tab].again.filter(function (a) { return a.id !== current.id; });
      }
    }
    if (isDrill(tab)) {
      // 풀었으면(맞든 틀리든) 이번 바퀴에서는 다시 내지 않는다 — 틀린 건 오답 노트에서 따로 푼다
      var p = current.id.split(":");
      var rd = st.read || (st.read = {});
      var list = rd[p[0]] || (rd[p[0]] = []);
      if (list.indexOf(Number(p[1])) < 0) list.push(Number(p[1]));
    }
    saveStats();
    render();
    justAnswered = false;
  }

  /** 맞혔지만 헷갈린(찍은) 문제: 틀린 것처럼 기록하고 오답 노트에 넣는다.
   *  선지 선별 1회독에서는 틀렸을 때처럼 20문제 뒤 → 60문제 뒤 다시 보기를 처음부터 건다 */
  var unsureMarked = false;
  function markUnsure() {
    if (!current || picked === null || picked !== current.answer || unsureMarked) return;
    unsureMarked = true;
    var st = stats[tab];
    var e = st.byEra[current.era];
    if (e && e.c > 0) e.c--;
    if (st.correct > 0) st.correct--;
    st.streak = 0;
    if (st.wrong.indexOf(current.id) < 0) st.wrong.push(current.id);
    if (isDrill(tab) && modes[tab] === "all") {
      var again = (st.again || (st.again = [])).filter(function (a) { return a.id !== current.id; });
      again.push({ id: current.id, at: st.solved + 20, step: 1 });
      st.again = again;
    }
    saveStats();
    render();
  }

  /** 버리기(선지 선별): 안 외울 선지 — 맞힌 것으로 치고, 오답 노트·다시 보기에서 빼고, 앞으로 다시 내지 않는다 */
  function markSkip() {
    if (!isDrill(tab) || !current || picked === null) return;
    var st = stats[tab];
    if (picked !== current.answer || unsureMarked) {
      var e = st.byEra[current.era] || (st.byEra[current.era] = { t: 0, c: 0 });
      e.c = Math.min(e.t, e.c + 1);
      st.correct = Math.min(st.solved, st.correct + 1);
    }
    st.wrong = st.wrong.filter(function (id) { return id !== current.id; });
    st.again = (st.again || []).filter(function (a) { return a.id !== current.id; });
    st.skip = st.skip || [];
    if (st.skip.indexOf(current.id) < 0) st.skip.push(current.id);
    saveStats();
    next();
  }

  function next() {
    if (picked === null) return;
    // 오답 노트를 다 맞혀 비었으면 전체 랜덤으로 돌아간다
    if (modes[tab] === "wrong" && !stats[tab].wrong.length) {
      modes[tab] = "all";
      if (isDrill(tab)) {
        var st = stats[tab];
        if (readCount(st) >= roundTotal(st, tab)) {
          newRound(st);
          notice = "오답 노트까지 모두 비웠어요! " + (st.rounds + 1) + "회독을 처음부터 시작합니다.";
        } else {
          notice = "오답 노트를 모두 비웠어요! 남은 " + (roundTotal(st, tab) - readCount(st)) + "개 선지로 돌아갑니다.";
        }
      }
    }
    ask();
    // 방금 클릭한 보기 자리에 포커스 테두리가 남으면 새 문제에서 미리 고른 것처럼 보인다
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    scrollToQuestion();
  }

  /** 휴대폰에서 아래로 내려 읽다가 넘기면, 새 문제가 화면 위에서 시작하게 문제 카드로 올려 준다 */
  function scrollToQuestion() {
    var navBottom = document.querySelector(".nav-shell").getBoundingClientRect().bottom;
    var top = $("qPanel").getBoundingClientRect().top;
    if (top >= navBottom && top < window.innerHeight * 0.4) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + top - navBottom - 12), behavior: reduceMotion ? "auto" : "smooth" });
  }

  function switchTab(t) {
    if (t === "mock") {
      if (!IS_INVEST) openMock();
      return;
    }
    var wasMock = mockOn;
    if (mockOn) closeMock();
    if (t === tab) {
      if (wasMock) render();
      return;
    }
    tab = t;
    count--;
    ask();
  }

  // ---------- 모의고사 (한국사): 문제지 · 해설지 PDF 내려받기 ----------
  var mockOn = false;
  function openMock() {
    mockOn = true;
    document.body.classList.add("show-mock");
    document.querySelectorAll("[data-tab]").forEach(function (el) {
      var on = el.getAttribute("data-tab") === "mock";
      el.classList.toggle("tab-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
    slide("tabSeg", document.querySelector('[data-tab="mock"]'));
    $("eyebrow").textContent = "Korean History · 1급 · 모의고사";
    $("headline").textContent = "인쇄해서, 시험장처럼 80분";
    $("leadKey").textContent = $("leadTouch").textContent = "회차마다 문제지와 해설지를 따로 내려받을 수 있어요. 언제든 다시 받을 수 있습니다.";
    $("dock").classList.remove("is-on");
    var grid = $("mockGrid");
    if (!grid.childElementCount) {
      grid.innerHTML = (window.MOCKS || []).map(function (m) {
        var n = String(m.r).padStart(2, "0");
        return (
          '<article class="panel mock-card">' +
          '<p class="mock-no num">' + m.r + "<small>회</small></p>" +
          '<p class="mock-meta">50문항 · 100점 · 80분</p>' +
          '<div class="mock-btns">' +
          '<a class="btn btn-primary" href="' + esc(m.q) + '" download="한국사 모의고사 ' + n + '회 문제지.pdf"><span data-icon="download"></span>문제 다운로드<small>' + m.qMB + "MB</small></a>" +
          '<a class="btn" href="' + esc(m.a) + '" download="한국사 모의고사 ' + n + '회 해설지.pdf"><span data-icon="download"></span>해설지 다운로드<small>' + m.aMB + "MB</small></a>" +
          "</div></article>"
        );
      }).join("");
      grid.querySelectorAll("[data-icon]").forEach(function (el) { el.outerHTML = icon(el.getAttribute("data-icon"), 15); });
    }
  }
  function closeMock() {
    mockOn = false;
    document.body.classList.remove("show-mock");
  }
  function switchMode(m) {
    if (m === modes[tab] || (m === "wrong" && !stats[tab].wrong.length)) return;
    modes[tab] = m;
    count--;
    ask();
  }

  // 기록 초기화는 두 번 눌러야 지워진다. 브라우저 확인 창(confirm)은 막힌 환경이 있어 화면 안에서 묻는다
  var resetArmed = null;
  function reset() {
    var btn = $("resetBtn");
    var label = btn.querySelector(".reset-label");
    if (!resetArmed) {
      label.textContent = "한 번 더 누르면 지워져요";
      btn.classList.add("is-armed");
      resetArmed = setTimeout(disarmReset, 3000);
      return;
    }
    disarmReset();
    stats[tab] = emptyStats();
    saveStats();
    if (modes[tab] === "wrong") {
      modes[tab] = "all";
      count--;
      ask();
    } else render();
  }
  function disarmReset() {
    clearTimeout(resetArmed);
    resetArmed = null;
    var btn = $("resetBtn");
    btn.classList.remove("is-armed");
    btn.querySelector(".reset-label").textContent = "기록 초기화";
  }

  // ---------- 기록 옮기기 ----------
  // 서버가 없어서 기록은 기기마다 따로 남는다. 두 탭 기록을 코드 한 줄로 바꿔 복사·붙여넣기로 옮긴다
  var CODE_PREFIX = IS_INVEST ? "INVEST1." : "HANSA2.";
  var OLD_PREFIX = IS_INVEST ? "INVEST0." : "HANSA1.";
  function exportText() {
    return CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(stats))));
  }
  function parseCode(text) {
    var t = String(text || "").replace(/\s+/g, "");
    var prefix = t.indexOf(CODE_PREFIX) === 0 ? CODE_PREFIX : t.indexOf(OLD_PREFIX) === 0 ? OLD_PREFIX : null;
    if (!prefix) return null;
    try {
      var s = JSON.parse(decodeURIComponent(escape(atob(t.slice(prefix.length)))));
      if (typeof s !== "object" || !s) return null;
      // 예전 코드(개념 문제만)는 개념 기록만 바꾸고 실전 기록은 둔다
      if (prefix === OLD_PREFIX) return { concept: cleanStats(s, "concept"), exam: stats.exam, seonji: stats.seonji, king: stats.king, gichul: stats.gichul };
      // 선지 선별이 생기기 전 코드에는 seonji 가 없다 — 그 기록은 이 기기 것을 둔다
      return { concept: cleanStats(s.concept, "concept"), exam: cleanStats(s.exam, "exam"), seonji: s.seonji ? cleanStats(s.seonji, "seonji") : stats.seonji, king: s.king ? cleanStats(s.king, "king") : stats.king, gichul: s.gichul ? cleanStats(s.gichul, "gichul") : stats.gichul };
    } catch (e) {
      return null;
    }
  }
  function moveMsg(text, ok) {
    var m = $("moveMsg");
    m.textContent = text;
    m.className = "move-msg" + (ok === true ? " is-ok" : ok === false ? " is-bad" : "");
  }
  function toggleMove() {
    var panel = $("movePanel");
    var open = panel.classList.toggle("hidden") === false;
    $("moveBtn").setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      $("exportCode").value = exportText();
      moveMsg("");
    }
  }
  function copyCode() {
    var box = $("exportCode");
    box.value = exportText();
    var fallback = function () {
      box.focus();
      box.select();
      moveMsg("코드를 선택해 두었어요. 길게 눌러 복사하세요.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(box.value).then(function () {
        moveMsg("복사했어요. 다른 기기의 「가져오기」 칸에 붙여 넣으세요.", true);
      }, fallback);
    } else fallback();
  }
  var importArmed = null;
  function importCode() {
    var nextStats = parseCode($("importCode").value);
    var btn = $("importBtn");
    if (!nextStats) {
      moveMsg("코드가 올바르지 않아요. 「" + CODE_PREFIX + "」로 시작하는 코드 전체를 붙여 넣으세요.", false);
      return;
    }
    if (!importArmed) {
      btn.textContent = "한 번 더 누르면 바뀌어요";
      btn.classList.add("is-armed");
      moveMsg(
        "가져올 기록: 개념 " + nextStats.concept.solved + "문제 · 오답 " + nextStats.concept.wrong.length + "개 / 실전 " +
          nextStats.exam.solved + "문제 · 오답 " + nextStats.exam.wrong.length + "개",
      );
      importArmed = setTimeout(disarmImport, 4000);
      return;
    }
    disarmImport();
    stats = nextStats;
    saveStats();
    $("importCode").value = "";
    $("exportCode").value = exportText();
    moveMsg("가져왔어요. 이 기기 기록이 바뀌었습니다.", true);
    if (modes[tab] === "wrong" && !stats[tab].wrong.length) {
      modes[tab] = "all";
      count--;
      ask();
    } else render();
  }
  function disarmImport() {
    clearTimeout(importArmed);
    importArmed = null;
    var btn = $("importBtn");
    btn.classList.remove("is-armed");
    btn.textContent = "가져오기";
  }

  // ---------- 자료 상자 (실전) ----------
  function lines(text) {
    return String(text || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  }
  function paragraphs(text) {
    return lines(text).map(function (l) { return "<p>" + mark(l) + "</p>"; }).join("");
  }
  /** 사진 자료: 위키미디어 공용의 자유 라이선스 사진. 출처는 답을 고른 뒤에 보인다(파일 이름에 정답이 들어 있는 경우가 많아서) */
  function figure(img) {
    if (!img || !img.src) return "";
    return (
      '<figure class="src-fig">' +
      (img.label ? '<span class="fig-label">' + esc(img.label) + "</span>" : "") +
      '<img src="' + esc(img.src) + '" alt="' + esc(img.alt || "") + '" loading="eager" decoding="async" referrerpolicy="no-referrer" ' +
      "onerror=\"this.parentNode.classList.add('is-broken')\">" +
      '<span class="fig-fallback">사진을 불러오지 못했어요 — ' + esc(img.alt || "") + "</span>" +
      (img.credit
        ? '<figcaption class="credit">사진: ' +
          (img.page ? '<a href="' + esc(img.page) + '" target="_blank" rel="noopener">' + esc(img.credit) + "</a>" : esc(img.credit)) +
          "</figcaption>"
        : "") +
      "</figure>"
    );
  }
  function renderSource(s) {
    var kind = s.kind;
    var html = '<span class="src-tag">자료</span>';
    if (kind === "사진") {
      html += figure(s.image);
      if (s.title) html += '<p class="fig-title">' + mark(s.title) + "</p>";
      if (s.text) html += '<div class="fig-text">' + paragraphs(s.text) + "</div>";
      return html;
    }
    if (s.image) html += figure(s.image);
    if (s.images) html += '<div class="src-figs">' + s.images.map(figure).join("") + "</div>";
    if (kind === "사료") {
      html += '<blockquote class="src-quote">' + paragraphs(s.text) + "</blockquote>";
      if (s.cite) html += '<p class="src-cite">– ' + mark(s.cite) + " –</p>";
    } else if (kind === "대화") {
      var speakers = [];
      html += '<div class="bubbles">';
      lines(s.text).forEach(function (l) {
        var m = l.match(/^([^:：]{1,12})[:：]\s*(.*)$/);
        var who = m ? m[1].trim() : "";
        var say = m ? m[2] : l;
        if (who && speakers.indexOf(who) < 0) speakers.push(who);
        var side = speakers.indexOf(who) % 2 === 1 ? " right" : "";
        html +=
          '<div class="bubble' + side + '"><span class="who">' + esc(who.slice(0, 2)) + "</span>" +
          '<span class="say"><small>' + esc(who) + "</small>" + mark(say) + "</span></div>";
      });
      html += "</div>";
    } else if (kind === "안내문") {
      if (s.title) html += '<p class="src-title">' + mark(s.title) + "</p>";
      var items = lines(s.text);
      var bullets = items.filter(function (l) { return /^[·•\-]/.test(l); });
      if (bullets.length) {
        var head = items.filter(function (l) { return !/^[·•\-]/.test(l); });
        html += head.map(function (l) { return "<p>" + mark(l) + "</p>"; }).join("");
        html += '<ul class="src-list">' + bullets.map(function (l) { return "<li>" + mark(l) + "</li>"; }).join("") + "</ul>";
      } else html += paragraphs(s.text);
      if (s.cite) html += '<p class="src-cite">' + mark(s.cite) + "</p>";
    } else if (kind === "신문") {
      if (s.title) html += '<p class="news-head">' + mark(s.title) + "</p>";
      html += '<p class="news-meta">' + esc(s.cite || "역사 신문") + "</p>";
      html += '<div class="news-body">' + paragraphs(s.text) + "</div>";
    } else if (kind === "일기") {
      if (s.title) html += '<p class="diary-date">' + mark(s.title) + "</p>";
      html += paragraphs(s.text);
    } else if (kind === "연표") {
      if (s.lead) html += '<p class="tl-lead">' + mark(s.lead) + "</p>";
      var ev = lines(s.text);
      html += '<div class="tl-scroll"><div class="tl">';
      ev.forEach(function (e, i) {
        if (i) html += '<div class="tl-gap"><span>(' + "가나다라마바".charAt(i - 1) + ")</span></div>";
        html += '<div class="tl-ev"><span class="dot"></span>' + mark(e) + "</div>";
      });
      html += "</div></div>";
    } else if (kind === "검색") {
      html +=
        '<div class="search-bar">' + icon("search", 15) + '<span class="q">' + mark(s.title || "") + '</span><span class="go">검색</span></div>';
      var res = lines(s.text);
      html += '<div class="search-res">';
      if (res.some(function (l) { return /^[·•\-]/.test(l); }))
        html += '<ul class="src-list">' + res.map(function (l) { return "<li>" + mark(l) + "</li>"; }).join("") + "</ul>";
      else html += paragraphs(s.text);
      html += "</div>";
    } else if (kind === "표") {
      // 한 줄 = 한 행, 칸은 | 로 나눈다. 첫 줄이 머리글
      var rows = lines(s.text).map(function (l) { return l.split("|").map(function (c) { return c.trim(); }); });
      html += '<div class="tbl-wrap"><table class="src-table">' +
        rows.map(function (r, i) {
          var tag = i === 0 ? "th" : "td";
          return "<tr>" + r.map(function (c) { return "<" + tag + ">" + mark(c) + "</" + tag + ">"; }).join("") + "</tr>";
        }).join("") + "</table></div>";
      if (s.cite) html += '<p class="src-cite">' + mark(s.cite) + "</p>";
    } else if (kind === "묶음") {
      html += '<div class="packs">';
      lines(s.text).forEach(function (l) {
        var m = l.match(/^\(([가-힣])\)\s*(.*)$/);
        html += '<div class="pack"><b>(' + (m ? m[1] : "") + ")</b><span>" + mark(m ? m[2] : l) + "</span></div>";
      });
      html += "</div>";
    } else {
      // 지문 · 사례 · 계산 (투자자산운용사)
      if (s.title) html += '<p class="src-title">' + mark(s.title) + "</p>";
      html += paragraphs(s.text);
      if (s.cite) html += '<p class="src-cite">' + mark(s.cite) + "</p>";
    }
    return html;
  }

  // ---------- 효과 ----------
  /** 정답 보기의 번호에서 금빛 불꽃이 튀어 오른다 */
  function sparks(choiceEl) {
    if (reduceMotion) return;
    var badge = choiceEl.querySelector(".badge");
    var sx = badge.offsetLeft + badge.offsetWidth / 2;
    var sy = badge.offsetTop + badge.offsetHeight / 2;
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("span");
      s.className = "spark";
      var ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.5;
      var dist = 34 + Math.random() * 40;
      s.style.setProperty("--sx", sx + "px");
      s.style.setProperty("--sy", sy + "px");
      s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      s.style.setProperty("--dy", Math.sin(ang) * dist - 10 + "px");
      s.style.animationDelay = Math.random() * 80 + "ms";
      choiceEl.appendChild(s);
      setTimeout(function (el) { el.remove(); }, 1100, s);
    }
  }
  /** 활성 탭 아래 알약을 그 자리로 미끄러뜨린다 */
  function slide(segId, activeEl) {
    var seg = $(segId);
    var slider = seg.querySelector(".seg-slider");
    if (!activeEl) { slider.classList.remove("is-ready"); return; }
    slider.style.width = activeEl.offsetWidth + "px";
    slider.style.transform = "translateX(" + (activeEl.offsetLeft - 3) + "px)";
    if (!slider.classList.contains("is-ready")) requestAnimationFrame(function () { slider.classList.add("is-ready"); });
  }
  function updateSliders() {
    var activeTab = document.querySelector('[data-tab="' + (mockOn ? "mock" : tab) + '"]');
    slide("tabSeg", activeTab);
    slide("modeSeg", document.querySelector('[data-mode="' + modes[tab] + '"]'));
    // 휴대폰에서 탭 줄이 옆으로 넘치면 고른 탭이 보이게 밀어 둔다
    var seg = $("tabSeg");
    if (activeTab && seg.scrollWidth > seg.clientWidth) {
      var l = activeTab.offsetLeft, r = l + activeTab.offsetWidth;
      if (l < seg.scrollLeft) seg.scrollLeft = l - 8;
      else if (r > seg.scrollLeft + seg.clientWidth) seg.scrollLeft = r - seg.clientWidth + 8;
    }
  }

  // ---------- 그리기 ----------
  var choiceEls = [];
  function setup() {
    var ol = $("choices");
    for (var i = 0; i < 5; i++) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.innerHTML =
        '<span class="badge num">' + (i + 1) + "</span>" +
        '<span class="choice-body"><span class="choice-text"></span><span class="choice-note"></span></span>' +
        '<span class="choice-ico ok">' + icon("check", 18) + '</span><span class="choice-ico bad">' + icon("close", 18) + "</span>";
      b.addEventListener("click", choose.bind(null, i));
      // 스포트라이트가 마우스를 따라오게
      b.addEventListener("mousemove", function (ev) {
        var r = this.getBoundingClientRect();
        this.style.setProperty("--x", ev.clientX - r.left + "px");
        this.style.setProperty("--y", ev.clientY - r.top + "px");
      });
      li.appendChild(b);
      ol.appendChild(li);
      choiceEls.push(b);
    }
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      el.innerHTML = icon(el.getAttribute("data-icon"), el.getAttribute("data-icon") === "arrow" ? 13 : 14);
    });
    $("flame").innerHTML = icon("flame", 18);
    document.querySelectorAll("[data-tab]").forEach(function (el) {
      el.addEventListener("click", function () { switchTab(el.getAttribute("data-tab")); });
    });
    document.querySelectorAll("[data-mode]").forEach(function (el) {
      el.addEventListener("click", function () { switchMode(el.getAttribute("data-mode")); });
    });
    $("nextBtn").addEventListener("click", next);
    $("dockBtn").addEventListener("click", next);
    $("unsureBtn").addEventListener("click", markUnsure);
    $("skipBtn").addEventListener("click", markSkip);
    $("resetBtn").addEventListener("click", reset);
    $("moveBtn").addEventListener("click", toggleMove);
    $("copyBtn").addEventListener("click", copyCode);
    $("importBtn").addEventListener("click", importCode);

    // 시대별 줄은 한 번만 만들고 숫자만 바꾼다
    $("eraList").innerHTML = ERAS.map(function (e) {
      return (
        '<li class="era-row" data-era="' + e.id + '" style="--c:' + ERA_COLOR[e.id] + '">' +
        '<span class="era-name">' + esc(e.short || e.label) + "</span>" +
        '<span class="era-weight num">' + Math.round((e.weight / TOTAL_WEIGHT) * 100) + "%</span>" +
        '<div class="bar"><div></div></div>' +
        '<span class="era-score num">–</span></li>'
      );
    }).join("");

    $("siteFoot").textContent = IS_INVEST
      ? "투자자산운용사 세부과목 출제 비중(100문항 기준)대로 개념 " + BANK_SIZE.concept + "문항 · 실전 " + BANK_SIZE.exam +
        "문항 중 랜덤 출제 · 문제는 출제 범위를 바탕으로 새로 쓴 것입니다 · 기록은 이 브라우저에만 저장됩니다"
      : "한국사능력검정 심화 출제 비중으로 구석기 ~ 노무현 정부 범위에서 개념 " + BANK_SIZE.concept + "문항 · 실전 " + BANK_SIZE.exam +
        "문항 중 랜덤 출제 · 선지 선별 " + BANK_SIZE.seonji + "문항 · 왕 맞추기 " + KINGS.length + "명 · 기출 선지 " + BANK_SIZE.gichul + "문항 · 기록은 이 브라우저에만 저장됩니다";
    $("eraHeadTitle").textContent = IS_INVEST ? "세부과목별" : "시대별";
    document.querySelectorAll("[data-subject]").forEach(function (el) {
      var on = el.getAttribute("data-subject") === SUBJECT;
      el.classList.toggle("is-on", on);
      if (on) el.setAttribute("aria-current", "page");
    });

    // 1~5 로 고르고 Enter 로 넘어간다. 포커스된 버튼이 Enter 를 한 번 더 먹지 않게 기본 동작을 막는다
    window.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || mockOn) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) next();
        return;
      }
      var n = ["1", "2", "3", "4", "5"].indexOf(e.key);
      if (n >= 0 && current && n < current.choices.length) {
        e.preventDefault();
        if (picked === null) replay(choiceEls[n].querySelector(".badge"), "press");
        choose(n);
      }
    });

    // 마우스를 따라다니는 빛 — 터치 화면은 CSS 가 숨긴다
    var glow = $("glow");
    var raf = null;
    window.addEventListener("mousemove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        glow.style.setProperty("--mx", e.clientX + "px");
        glow.style.setProperty("--my", e.clientY + "px");
        glow.classList.add("is-on");
      });
    });
    window.addEventListener("resize", updateSliders);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateSliders);
  }

  function render() {
    var q = current;
    var answered = picked !== null;
    var right = answered && q && picked === q.answer;
    var st = stats[tab];
    var text = TAB_TEXT[tab];

    // 내비
    document.querySelectorAll("[data-tab]").forEach(function (el) {
      var on = el.getAttribute("data-tab") === tab;
      el.classList.toggle("tab-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll("[data-mode]").forEach(function (el) {
      var on = el.getAttribute("data-mode") === modes[tab];
      el.classList.toggle("tab-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
    var wrongTab = document.querySelector('[data-mode="wrong"]');
    wrongTab.disabled = !st.wrong.length && modes[tab] !== "wrong";
    wrongTab.title = st.wrong.length ? "" : "아직 틀린 문제가 없어요";
    $("wrongCount").textContent = st.wrong.length;
    updateSliders();

    // 머리글
    $("eyebrow").textContent = text.eyebrow;
    $("headline").textContent = text.headline;
    $("leadKey").textContent = text.leadKey;
    $("leadTouch").textContent = text.leadTouch;
    $("statsTab").textContent = text.stats;
    $("maxKey").textContent = tab === "exam" && !IS_INVEST ? "5" : "4";

    var panel = $("qPanel");
    panel.classList.toggle("exam", tab === "exam");
    panel.classList.toggle("answered", answered);
    panel.classList.toggle("is-ok", !!right);
    panel.classList.toggle("is-bad", answered && !right);

    if (!q) {
      // 그 탭에 아직 문제가 없다
      document.documentElement.style.setProperty("--era", "var(--accent)");
      $("eraChip").textContent = "준비 중";
      $("qSub").textContent = "";
      $("qNo").textContent = "";
      $("src").classList.add("hidden");
      $("qText").textContent = "이 탭에는 아직 문제가 없어요.";
      choiceEls.forEach(function (b) { b.parentNode.classList.add("hidden"); });
      $("nextBtn").disabled = true;
      $("dock").classList.remove("is-on");
      renderStats(st, null);
      return;
    }

    var era = ERA_BY_ID[q.era];
    // 선지 선별은 「어느 시대·나라인가」를 묻는 문항이 많아, 시대 표시(칩·범위·색·기록 칸 강조)가 답을 알려 준다 — 고른 뒤에만 보인다
    var hideEra = isDrill(tab) && !answered;
    document.documentElement.style.setProperty("--era", hideEra ? "var(--accent)" : ERA_COLOR[q.era] || "#d6a44f");
    $("eraChip").textContent = hideEra ? "선지" : era.label;
    $("qSub").textContent = hideEra ? "" : tab === "exam" && q.points ? (q.source.kind + " · " + q.points + "점") : era.range;
    $("wrongModeChip").classList.toggle("hidden", modes[tab] !== "wrong");
    // 기출 선지: 같은 사실이 76~80회에 몇 번 나왔는지 (답을 알려 주지 않으니 고르기 전에도 보인다)
    var cc = $("countChip");
    cc.classList.toggle("hidden", tab !== "gichul");
    if (tab === "gichul") {
      var times = (window.GICHUL_COUNT || {})[q.id] || 1;
      cc.textContent = times + "회 출제";
      cc.classList.toggle("is-hot", times >= 4);
    }
    $("qNo").textContent = "No. " + count;

    // 자료 (실전만)
    var src = $("src");
    if (tab === "exam" && q.source) {
      // 같은 문제를 다시 그릴 때(답을 고를 때)는 자료를 새로 만들지 않는다 — 사진이 깜빡이지 않게
      if (src.dataset.id !== q.id + "#" + count) {
        src.className = "src kind-" + q.source.kind + (q.source.image || q.source.images ? " has-fig" : "");
        src.innerHTML = renderSource(q.source);
        src.dataset.id = q.id + "#" + count;
      }
    } else {
      src.className = "src hidden";
      src.innerHTML = "";
      src.dataset.id = "";
    }

    $("qText").innerHTML = qHtml(q.q) + (tab === "exam" && q.points ? '<span class="pts">[' + q.points + "점]</span>" : "");

    // 도장
    var stamp = $("stamp");
    if (answered) {
      stamp.className = "stamp " + (right ? "ok" : "bad");
      stamp.textContent = right ? "정답" : "오답";
      if (justAnswered) replay(stamp, "is-on");
      else stamp.classList.add("is-on");
      $("verdict").textContent = right ? "정답입니다" : "오답입니다";
    } else {
      stamp.className = "stamp";
      stamp.textContent = "";
      $("verdict").textContent = "";
    }

    // 보기
    choiceEls.forEach(function (b, i) {
      var li = b.parentNode;
      if (i >= q.choices.length) { li.classList.add("hidden"); return; }
      li.classList.remove("hidden");
      var isAnswer = answered && i === q.answer;
      var isWrong = answered && i === picked && !isAnswer;
      b.querySelector(".badge").textContent = tab === "exam" ? CIRCLED[i] : String(i + 1);
      b.querySelector(".choice-text").textContent = q.choices[i];
      // 고르는 순간 보기 모두 밑에 설명이 붙는다 — 아래로 내려 볼 필요 없이 바로 확인하고 넘어가게
      b.querySelector(".choice-note").textContent = answered ? q.notes[i] || "" : "";
      b.classList.toggle("is-answer", isAnswer);
      b.classList.toggle("is-wrong", isWrong);
      b.classList.toggle("is-dim", answered && !isAnswer && !isWrong);
      b.setAttribute("aria-disabled", answered ? "true" : "false");
      b.setAttribute("aria-label", i + 1 + "번 " + q.choices[i]);
      if (!answered) b.classList.remove("pulse", "shake");
      if (justAnswered && isAnswer) { replay(b, "pulse"); sparks(b); }
      if (justAnswered && isWrong) replay(b, "shake");
    });

    var nb = $("nextBtn");
    nb.disabled = !answered;
    nb.classList.toggle("btn-primary", answered);
    var dock = $("dock");
    dock.classList.toggle("is-on", answered);
    dock.setAttribute("aria-hidden", answered ? "false" : "true");
    $("dockBtn").tabIndex = answered ? 0 : -1;

    // 맞혔을 때만: 찍어서 맞힌 거면 오답 노트로 보낼 수 있게
    var ub = $("unsureBtn");
    ub.classList.toggle("hidden", !right);
    ub.disabled = unsureMarked;
    ub.textContent = unsureMarked ? "오답 노트에 넣었어요" : "헷갈렸어요 · 오답 노트에 넣기";
    $("skipBtn").classList.toggle("hidden", !(answered && isDrill(tab)));

    renderStats(st, hideEra ? null : q.era);
  }

  function renderStats(st, currentEra) {
    var rate = st.solved ? Math.round((st.correct / st.solved) * 100) : null;
    $("statSolved").textContent = st.solved;
    $("statBank").textContent = isDrill(tab)
      ? (st.rounds ? st.rounds + 1 + "회독 " : "1회독 ") + (readCount(st) + (st.skip || []).length) + " / " + BANK_SIZE[tab]
      : "전체 " + BANK_SIZE[tab] + "문항";
    $("statRate").textContent = rate === null ? "–" : rate + "%";
    var ring = $("ringFg");
    ring.style.strokeDashoffset = 100 - (rate || 0);
    ring.className.baseVal = "ring-fg" + (rate === null ? "" : rate >= 80 ? " good" : rate < 60 ? " low" : "");
    var streakEl = $("statStreak");
    var prevStreak = Number($("streakNum").textContent);
    $("streakNum").textContent = st.streak;
    if (justAnswered && st.streak > prevStreak) replay(streakEl, "bump");
    var flame = $("flame");
    flame.classList.toggle("is-on", st.streak >= 3);
    flame.classList.toggle("hot", st.streak >= 10);
    $("statBest").textContent = "최고 " + st.best;
    $("resetBtn").disabled = !st.solved;
    document.querySelectorAll(".era-row").forEach(function (row) {
      var id = row.getAttribute("data-era");
      var r = st.byEra[id];
      var pct = r && r.t ? Math.round((r.c / r.t) * 100) : null;
      row.classList.toggle("is-current", id === currentEra);
      var fill = row.querySelector(".bar > div");
      fill.style.width = (pct || 0) + "%";
      fill.style.background = pct === null ? "transparent" : pct >= 80 ? "var(--up)" : pct >= 60 ? "var(--accent)" : "var(--down)";
      row.querySelector(".era-score").textContent = r ? r.c + "/" + r.t : "–";
    });
  }

  setup();
  ask();
})();
