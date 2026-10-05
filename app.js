// 한국사 1급 문제 풀이 — 화면 동작 전부.
// 문제는 data/*.js 가 window.ERAS, window.BANK 에 올려 둔다.
(function () {
  "use strict";

  var ERAS = window.ERAS;
  var BANK = window.BANK;
  var STORE_KEY = "hansa1-v1";
  var TOTAL_WEIGHT = ERAS.reduce(function (s, e) { return s + e.weight; }, 0);
  var ERA_BY_ID = {};
  ERAS.forEach(function (e) { ERA_BY_ID[e.id] = e; });

  var ICONS = {
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
  };
  function icon(name, size) {
    size = size || 16;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  // ---------- 기록 (이 브라우저에만 남는다) ----------
  function emptyStats() {
    return { solved: 0, correct: 0, streak: 0, best: 0, byEra: {}, wrong: [] };
  }
  function loadStats() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return emptyStats();
      var s = Object.assign(emptyStats(), JSON.parse(raw));
      // 문제 은행에서 사라진 id 는 오답 노트에서도 뺀다
      s.wrong = s.wrong.filter(function (id) { return !!rowOf(id); });
      return s;
    } catch (e) {
      return emptyStats();
    }
  }
  function saveStats() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(stats));
    } catch (e) {
      /* 사생활 보호 모드 등 — 기록 없이 계속 푼다 */
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
  /** id 는 "시대:줄번호" */
  function rowOf(id) {
    var p = id.split(":");
    return BANK[p[0]] && BANK[p[0]][Number(p[1])];
  }
  /** 보기는 낼 때마다 새로 섞는다. 정답은 데이터에서 늘 두 번째 칸, 7~9번째 칸은 오답 1~3의 풀이 */
  function build(id) {
    var row = rowOf(id);
    if (!row) return null;
    var choices = shuffle([row[1], row[2], row[3], row[4]]);
    var notes = {};
    notes[row[2]] = row[6] || "";
    notes[row[3]] = row[7] || "";
    notes[row[4]] = row[8] || "";
    return { id: id, era: id.split(":")[0], q: row[0], choices: choices, answer: choices.indexOf(row[1]), explain: row[5], notes: notes };
  }
  /** 출제 비중대로 시대를 하나 고른다 */
  function pickEra() {
    var r = Math.random() * TOTAL_WEIGHT;
    for (var i = 0; i < ERAS.length; i++) {
      r -= ERAS[i].weight;
      if (r < 0) return ERAS[i].id;
    }
    return ERAS[ERAS.length - 1].id;
  }
  /** 시대마다 이번에 이미 낸 줄 번호. 다 돌면 비우고 다시 돈다 */
  var seen = {};
  function nextId(prevId) {
    if (mode === "wrong" && stats.wrong.length) {
      var pool = stats.wrong.length > 1 ? stats.wrong.filter(function (id) { return id !== prevId; }) : stats.wrong;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    var era = pickEra();
    var rows = BANK[era];
    var used = seen[era] || (seen[era] = {});
    if (Object.keys(used).length >= rows.length) used = seen[era] = {};
    var left = [];
    for (var i = 0; i < rows.length; i++) if (!used[i] && era + ":" + i !== prevId) left.push(i);
    var idx = left.length ? left[Math.floor(Math.random() * left.length)] : 0;
    used[idx] = true;
    return era + ":" + idx;
  }

  // ---------- 상태 ----------
  var stats = loadStats();
  var mode = "all";
  var current = null;
  var picked = null;
  var count = 0;

  function ask() {
    current = build(nextId(current && current.id));
    picked = null;
    count++;
    render();
  }

  function choose(i) {
    if (!current || picked !== null) return;
    picked = i;
    var ok = i === current.answer;
    var e = stats.byEra[current.era] || { t: 0, c: 0 };
    stats.byEra[current.era] = { t: e.t + 1, c: e.c + (ok ? 1 : 0) };
    stats.solved++;
    if (ok) stats.correct++;
    stats.streak = ok ? stats.streak + 1 : 0;
    stats.best = Math.max(stats.best, stats.streak);
    var at = stats.wrong.indexOf(current.id);
    if (ok && at >= 0) stats.wrong.splice(at, 1);
    if (!ok && at < 0) stats.wrong.push(current.id);
    saveStats();
    render();
  }

  function next() {
    if (picked === null) return;
    // 오답 노트를 다 맞혀 비었으면 전체 랜덤으로 돌아간다
    if (mode === "wrong" && !stats.wrong.length) mode = "all";
    ask();
    // 방금 클릭한 보기 자리에 포커스 테두리가 남으면 새 문제에서 미리 고른 것처럼 보인다
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    scrollToQuestion();
  }

  /** 휴대폰에서 아래로 내려 읽다가 넘기면, 새 문제가 화면 위에서 시작하게 문제 카드로 올려 준다 */
  function scrollToQuestion() {
    var navBottom = document.querySelector(".nav-shell").getBoundingClientRect().bottom;
    var top = $("qPanel").getBoundingClientRect().top;
    if (top >= navBottom && top < window.innerHeight * 0.4) return; // 이미 잘 보이는 위치
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, window.scrollY + top - navBottom - 12), behavior: reduce ? "auto" : "smooth" });
  }

  function switchMode(m) {
    if (m === mode || (m === "wrong" && !stats.wrong.length)) return;
    mode = m;
    count--; // 방식만 바꾼 것이라 문제 번호는 그대로 이어 간다
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
    stats = emptyStats();
    saveStats();
    if (mode === "wrong") {
      mode = "all";
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

  // ---------- 그리기 ----------
  var choiceEls = [];
  function setup() {
    var ol = $("choices");
    for (var i = 0; i < 4; i++) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.innerHTML =
        '<span class="badge num">' + (i + 1) + '</span>' +
        '<span class="choice-body"><span class="choice-text"></span><span class="choice-note"></span></span>' +
        '<span class="choice-ico ok">' + icon("check", 18) + '</span><span class="choice-ico bad">' + icon("close", 18) + "</span>";
      b.addEventListener("click", choose.bind(null, i));
      li.appendChild(b);
      ol.appendChild(li);
      choiceEls.push(b);
    }
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      el.innerHTML = icon(el.getAttribute("data-icon"), el.getAttribute("data-icon") === "arrow" ? 13 : 14);
    });
    document.querySelectorAll("[data-mode]").forEach(function (el) {
      el.addEventListener("click", function () { switchMode(el.getAttribute("data-mode")); });
    });
    $("nextBtn").addEventListener("click", next);
    $("dockBtn").addEventListener("click", next);
    $("resetBtn").addEventListener("click", reset);

    // 시대별 줄은 한 번만 만들고 숫자만 바꾼다
    $("eraList").innerHTML = ERAS.map(function (e) {
      return (
        '<li class="era-row" data-era="' + e.id + '">' +
        '<span class="era-name">' + esc(e.label) + "</span>" +
        '<span class="era-weight num">' + Math.round((e.weight / TOTAL_WEIGHT) * 100) + "%</span>" +
        '<div class="bar"><div></div></div>' +
        '<span class="era-score num">–</span></li>'
      );
    }).join("");

    var bankSize = ERAS.reduce(function (s, e) { return s + BANK[e.id].length; }, 0);
    $("siteFoot").textContent =
      "한국사능력검정 심화 출제 비중으로 구석기 ~ 노무현 정부 범위에서 " + bankSize + "문항 중 랜덤 출제 · 기록은 이 브라우저에만 저장됩니다";

    // 1~4 로 고르고 Enter 로 넘어간다. 포커스된 버튼이 Enter 를 한 번 더 먹지 않게 기본 동작을 막는다
    window.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) next();
        return;
      }
      var n = ["1", "2", "3", "4"].indexOf(e.key);
      if (n >= 0) {
        e.preventDefault();
        choose(n);
      }
    });
  }

  /** 보기 밑에 붙일 설명: 정답이면 해설, 오답이면 그 보기의 풀이("보기 — 설명"에서 설명만) */
  function noteFor(q, i) {
    if (i === q.answer) return q.explain;
    var note = q.notes[q.choices[i]] || "";
    var dash = note.indexOf(" — ");
    return dash >= 0 ? note.slice(dash + 3) : note;
  }

  function render() {
    var q = current;
    var answered = picked !== null;
    var right = answered && picked === q.answer;
    var era = ERA_BY_ID[q.era];

    // 내비
    document.querySelectorAll("[data-mode]").forEach(function (el) {
      var on = el.getAttribute("data-mode") === mode;
      el.classList.toggle("tab-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
    var wrongTab = document.querySelector('[data-mode="wrong"]');
    wrongTab.disabled = !stats.wrong.length && mode !== "wrong";
    wrongTab.title = stats.wrong.length ? "" : "아직 틀린 문제가 없어요";
    $("wrongCount").textContent = stats.wrong.length;

    // 문제
    $("eraChip").textContent = era.label;
    $("eraRange").textContent = era.range;
    $("wrongModeChip").classList.toggle("hidden", mode !== "wrong");
    $("qNo").textContent = "No. " + count;
    $("qText").textContent = q.q;
    var panel = $("qPanel");
    panel.classList.toggle("answered", answered);
    panel.classList.toggle("is-ok", right);
    panel.classList.toggle("is-bad", answered && !right);

    var v = $("verdict");
    v.classList.toggle("hidden", !answered);
    if (answered) {
      v.className = "chip verdict pop " + (right ? "chip-up" : "chip-down");
      v.innerHTML = icon(right ? "check" : "close", 15) + (right ? "정답" : "오답");
    }

    choiceEls.forEach(function (b, i) {
      var isAnswer = answered && i === q.answer;
      var isWrong = answered && i === picked && !isAnswer;
      b.querySelector(".choice-text").textContent = q.choices[i];
      // 고르는 순간 네 보기 모두 밑에 설명이 붙는다 — 아래로 내려 볼 필요 없이 바로 확인하고 넘어가게
      b.querySelector(".choice-note").textContent = answered ? noteFor(q, i) : "";
      b.classList.toggle("is-answer", isAnswer);
      b.classList.toggle("is-wrong", isWrong);
      b.classList.toggle("is-dim", answered && !isAnswer && !isWrong);
      b.setAttribute("aria-disabled", answered ? "true" : "false");
      b.setAttribute("aria-label", i + 1 + "번 " + q.choices[i]);
    });

    var nb = $("nextBtn");
    nb.disabled = !answered;
    nb.classList.toggle("btn-primary", answered);
    var dock = $("dock");
    dock.classList.toggle("is-on", answered);
    dock.setAttribute("aria-hidden", answered ? "false" : "true");
    $("dockBtn").tabIndex = answered ? 0 : -1;

    // 기록
    $("statSolved").textContent = stats.solved;
    $("statRate").textContent = stats.solved ? Math.round((stats.correct / stats.solved) * 100) + "%" : "–";
    $("statStreak").textContent = stats.streak;
    $("statBest").textContent = "최고 " + stats.best;
    $("resetBtn").disabled = !stats.solved;
    document.querySelectorAll(".era-row").forEach(function (row) {
      var id = row.getAttribute("data-era");
      var r = stats.byEra[id];
      var pct = r && r.t ? Math.round((r.c / r.t) * 100) : null;
      row.classList.toggle("is-current", id === q.era);
      var fill = row.querySelector(".bar > div");
      fill.style.width = (pct || 0) + "%";
      fill.style.background = pct === null ? "transparent" : pct >= 80 ? "var(--up)" : pct >= 60 ? "var(--accent)" : "var(--down)";
      row.querySelector(".era-score").textContent = r ? r.c + "/" + r.t : "–";
    });
  }

  setup();
  ask();
})();
