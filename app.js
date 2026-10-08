// 한국사 1급 문제 풀이 — 화면 동작 전부.
// 개념 문제는 data/*.js 가 window.BANK 에, 실전 문제는 data/exam/*.js 가 window.EXAM 에 올려 둔다.
(function () {
  "use strict";

  var ERAS = window.ERAS;
  var BANK = window.BANK || {};
  var EXAM = window.EXAM || {};
  var STORE_KEY = "hansa1-v2";
  var OLD_KEY = "hansa1-v1";
  var CIRCLED = ["①", "②", "③", "④", "⑤"];
  var TOTAL_WEIGHT = ERAS.reduce(function (s, e) { return s + e.weight; }, 0);
  var ERA_BY_ID = {};
  ERAS.forEach(function (e) { ERA_BY_ID[e.id] = e; });

  /** 시대마다 색 하나 — 고려는 청자, 조선 전기는 청화백자, 일제 강점기는 진홍 */
  var ERA_COLOR = {
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
  var TAB_TEXT = {
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
  };

  var ICONS = {
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
    swap: '<path d="M4 8h13"/><path d="m14 4 4 4-4 4"/><path d="M20 16H7"/><path d="m10 12-4 4 4 4"/>',
    flame: '<path d="M12 22c4.4 0 7-2.9 7-6.6 0-3.2-2.1-5.2-3.4-7.1-.4 1.6-1.3 2.6-2.4 3.1.2-3-1-6-3.7-7.4.3 2.6-1 4-2.5 5.6C5.6 11.3 5 13 5 15.4 5 19.1 7.6 22 12 22Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
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
    return esc(s)
      .replace(/__([^_]+)__/g, "<u>$1</u>")
      .replace(/\(([가-힣])\)/g, '<b class="blank">($1)</b>');
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
  var BANK_SIZE = { concept: 0, exam: 0 };
  ERAS.forEach(function (e) {
    BANK_SIZE.concept += (BANK[e.id] || []).length;
    BANK_SIZE.exam += (EXAM[e.id] || []).length;
  });
  function bankOf(tab) { return tab === "exam" ? EXAM : BANK; }
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
    return s;
  }
  function loadStats() {
    var out = { concept: emptyStats(), exam: emptyStats() };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var v2 = JSON.parse(raw);
        out.concept = cleanStats(v2.concept, "concept");
        out.exam = cleanStats(v2.exam, "exam");
        return out;
      }
      // 두 탭이 생기기 전 기록은 개념 문제 기록으로 이어받는다
      var old = localStorage.getItem(OLD_KEY);
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
  /** 개념 문제: 보기는 낼 때마다 섞고, 정답은 데이터에서 늘 두 번째 칸, 7~9번째 칸은 오답 풀이 */
  function buildConcept(id) {
    var row = rowOf("concept", id);
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
    return { id: id, tab: "concept", era: id.split(":")[0], q: row[0], choices: choices, answer: choices.indexOf(row[1]), notes: notes };
  }
  /** 실전 문제: 다섯 보기. (가)~(마) 처럼 자리가 뜻을 갖는 보기는 섞지 않는다 */
  function buildExam(id) {
    var q = rowOf("exam", id);
    if (!q) return null;
    var fixed = q.fixed || q.choices.every(function (c) { return /^\([가-힣]\)$/.test(String(c).trim()); });
    var order = fixed ? [0, 1, 2, 3, 4] : shuffle([0, 1, 2, 3, 4]);
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
  function build(tab, id) {
    return tab === "exam" ? buildExam(id) : buildConcept(id);
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
  var seen = { concept: {}, exam: {} };
  function nextId(tab, prevId) {
    var st = stats[tab];
    if (modes[tab] === "wrong" && st.wrong.length) {
      var pool = st.wrong.length > 1 ? st.wrong.filter(function (id) { return id !== prevId; }) : st.wrong;
      return pool[Math.floor(Math.random() * pool.length)];
    }
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

  // ---------- 상태 ----------
  var stats = loadStats();
  var tab = "concept";
  var modes = { concept: "all", exam: "all" };
  var current = null;
  var picked = null;
  var count = 0;
  var justAnswered = false;

  function ask() {
    if (!BANK_SIZE[tab]) { current = null; picked = null; render(); return; }
    current = build(tab, nextId(tab, current && current.tab === tab ? current.id : null));
    picked = null;
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
    if (ok && at >= 0) st.wrong.splice(at, 1);
    if (!ok && at < 0) st.wrong.push(current.id);
    saveStats();
    render();
    justAnswered = false;
  }

  function next() {
    if (picked === null) return;
    // 오답 노트를 다 맞혀 비었으면 전체 랜덤으로 돌아간다
    if (modes[tab] === "wrong" && !stats[tab].wrong.length) modes[tab] = "all";
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
    if (t === tab) return;
    tab = t;
    count--;
    ask();
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
  var CODE_PREFIX = "HANSA2.";
  var OLD_PREFIX = "HANSA1.";
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
      if (prefix === OLD_PREFIX) return { concept: cleanStats(s, "concept"), exam: stats.exam };
      return { concept: cleanStats(s.concept, "concept"), exam: cleanStats(s.exam, "exam") };
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
      moveMsg("코드가 올바르지 않아요. 「HANSA2.」로 시작하는 코드 전체를 붙여 넣으세요.", false);
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
  function renderSource(s) {
    var kind = s.kind;
    var html = '<span class="src-tag">자료</span>';
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
    } else if (kind === "묶음") {
      html += '<div class="packs">';
      lines(s.text).forEach(function (l) {
        var m = l.match(/^\(([가-힣])\)\s*(.*)$/);
        html += '<div class="pack"><b>(' + (m ? m[1] : "") + ")</b><span>" + mark(m ? m[2] : l) + "</span></div>";
      });
      html += "</div>";
    } else {
      html += paragraphs(s.text);
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
    slide("tabSeg", document.querySelector('[data-tab="' + tab + '"]'));
    slide("modeSeg", document.querySelector('[data-mode="' + modes[tab] + '"]'));
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
    $("resetBtn").addEventListener("click", reset);
    $("moveBtn").addEventListener("click", toggleMove);
    $("copyBtn").addEventListener("click", copyCode);
    $("importBtn").addEventListener("click", importCode);

    // 시대별 줄은 한 번만 만들고 숫자만 바꾼다
    $("eraList").innerHTML = ERAS.map(function (e) {
      return (
        '<li class="era-row" data-era="' + e.id + '" style="--c:' + ERA_COLOR[e.id] + '">' +
        '<span class="era-name">' + esc(e.label) + "</span>" +
        '<span class="era-weight num">' + Math.round((e.weight / TOTAL_WEIGHT) * 100) + "%</span>" +
        '<div class="bar"><div></div></div>' +
        '<span class="era-score num">–</span></li>'
      );
    }).join("");

    $("siteFoot").textContent =
      "한국사능력검정 심화 출제 비중으로 구석기 ~ 노무현 정부 범위에서 개념 " + BANK_SIZE.concept + "문항 · 실전 " + BANK_SIZE.exam +
      "문항 중 랜덤 출제 · 기록은 이 브라우저에만 저장됩니다";

    // 1~5 로 고르고 Enter 로 넘어간다. 포커스된 버튼이 Enter 를 한 번 더 먹지 않게 기본 동작을 막는다
    window.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
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
    $("maxKey").textContent = tab === "exam" ? "5" : "4";

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
    document.documentElement.style.setProperty("--era", ERA_COLOR[q.era] || "#d6a44f");
    $("eraChip").textContent = era.label;
    $("qSub").textContent = tab === "exam" ? (q.source.kind + " · " + q.points + "점") : era.range;
    $("wrongModeChip").classList.toggle("hidden", modes[tab] !== "wrong");
    $("qNo").textContent = "No. " + count;

    // 자료 (실전만)
    var src = $("src");
    if (tab === "exam") {
      src.className = "src kind-" + q.source.kind;
      src.innerHTML = renderSource(q.source);
    } else {
      src.className = "src hidden";
      src.innerHTML = "";
    }

    $("qText").innerHTML = mark(q.q) + (tab === "exam" ? '<span class="pts">[' + q.points + "점]</span>" : "");

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

    renderStats(st, q.era);
  }

  function renderStats(st, currentEra) {
    var rate = st.solved ? Math.round((st.correct / st.solved) * 100) : null;
    $("statSolved").textContent = st.solved;
    $("statBank").textContent = "전체 " + BANK_SIZE[tab] + "문항";
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
