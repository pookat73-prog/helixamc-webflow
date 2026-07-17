/* ================================================================
   HELIX AMC — FAQ 자세히보기 / 간략히보기 토글 (v10 — 덩어리 페이드인)

   Webflow 실제 구조 (컴포넌트, 2026-07 개편):
     FAQ_Box
       ├─ FAQ_QA (faq_qa)            : 질문 + 요약(faq-a) + "자세히 보기 +"(faq-more)
       └─ FAQ_Answer AI (faq_answer-ai) : 상세 답변(펼침부분). 내부:
            · faq-a_Full  = 상세 문단
            · CTA Chip 등
            · "간략히 보기 -"(faq-more)  ← 접기 버튼이 답변 쪽으로 옮겨짐

   → 예전(v9)엔 펼침·접힘 버튼이 같은 카드(FAQ_QA) 안에 둘 다 있었으나,
     이제 펼침은 FAQ_QA, 접힘은 FAQ_Answer AI 안으로 분리됨. 그래서 한 카드
     안에서 둘 다 찾던 로직이 접힘을 못 잡던 문제 → 답변을 기준으로 두 버튼을
     각각 찾아 짝지음.

   펼침 연출 (개편)
     - 영역(높이) 즉시 열림
     - 답변 '전체 덩어리'가 통째로 페이드인 + 아래→제자리로 살짝 둥실
     - (예전의 구분선 draw / 문단 개별 stagger 는 제거 — 답변에 구분선 없음)
   접힘: 덩어리 페이드아웃 → 빈 공간 닫힘 (역순)

   요약(faq-a)은 항상 표시. JS 실패 시 답변 전부 표시(그대로 열려 있음).

   디버그 로그:  URL 에 ?debug-faq=1
   튜닝 패널:    URL 에 ?faq-tune=1  (실사용에선 안 뜸)
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqInit) return;
  window.__helixFaqInit = true;

  var DEBUG = /[?&]debug-faq=1\b/.test(location.search);
  var TUNE  = /[?&]faq-tune=1\b/.test(location.search);
  function log() {
    if (!DEBUG && !TUNE) return;
    console.log.apply(console, ['[FAQ v10]'].concat(Array.prototype.slice.call(arguments)));
  }

  var ANS_SEL  = '[class*="faq_answer" i]';   // FAQ_Answer AI → faq_answer-ai
  var MORE_SEL = '[class*="faq-more" i]';      // 펼침·접힘 링크 공통 클래스

  /* ── 조절 가능한 값(초/픽셀) — 튜닝 패널이 실시간 수정 ────────────── */
  var CFG = (window.HELIX_FAQ_CFG = {
    // 펼침(덩어리 페이드인 + 둥실)
    fadeDur:   0.5,                               // 전체 덩어리 페이드인 시간
    floatDur:  0.6,                               // 둥실(아래→제자리) 이동 시간
    floatDist: 10,                                // 둥실 이동 거리(px) — 아래에서 살짝 떠오름
    ease:      'cubic-bezier(0.22, 1, 0.36, 1)',  // 부드럽게 안착(easeOutExpo 계열)
    // 접힘(역순)
    cFadeDur:   0.28,                             // 덩어리 페이드아웃 시간
    cHeightDur: 0.4                               // 페이드아웃 뒤 빈 공간 닫힘 시간
  });

  var EASE_PRESETS = {
    '부드럽게 안착(현재)': 'cubic-bezier(0.22, 1, 0.36, 1)',
    '천천히':            'cubic-bezier(0.4, 0, 0.2, 1)',
    '쫀득(살짝 튕김)':    'cubic-bezier(0.34, 1.4, 0.5, 1)',
    '선형':             'linear'
  };

  function showEl(el) { if (el) el.style.removeProperty('display'); }
  function hideEl(el) { if (el) el.style.setProperty('display', 'none', 'important'); }
  function textOf(el) { return (el.textContent || '').replace(/\s+/g, ''); }

  /* 상세 본문에 사용자가 넣은 수동 줄바꿈(<br>)은 CSS text-indent 의 '첫 줄'로
     인식되지 않아 그 줄만 안 들어감. 각 줄을 블록 <span> 으로 감싸면 문단의
     text-indent 를 상속받아 줄마다 첫 줄 들여쓰기가 적용됨. */
  function wrapLinesForIndent(text) {
    if (!text || text.__faqLinesWrapped) return;
    var html = text.innerHTML;
    if (!/<br|[\r\n]/i.test(html)) { text.__faqLinesWrapped = true; return; }
    var segs = html.split(/<br\s*\/?>|\r?\n/i);
    text.innerHTML = segs.map(function (s) {
      return '<span class="faq-line">' + s + '</span>';
    }).join('');
    text.__faqLinesWrapped = true;
  }

  /* 답변(a) 기준으로 펼침·접힘 버튼을 찾는다.
     - 접힘: 답변 '안'의 faq-more (텍스트에 '간략')
     - 펼침: 답변을 감싸는 상위(FAQ_Box)에서 답변 밖에 있는 faq-more (텍스트에 '자세히') */
  function findItemLinks(a) {
    var expand = null, collapse = null;

    var inside = a.querySelectorAll(MORE_SEL);
    for (var i = 0; i < inside.length; i++) {
      if (/간략/.test(textOf(inside[i]))) { collapse = inside[i]; break; }
    }
    if (!collapse && inside[0]) collapse = inside[0];

    var node = a;
    for (var up = 0; up < 4 && node; up++) {
      node = node.parentElement;
      if (!node) break;
      var links = node.querySelectorAll(MORE_SEL);
      var firstOutside = null;
      for (var j = 0; j < links.length; j++) {
        if (a.contains(links[j])) continue;          // 답변 안(=접힘)은 제외
        if (!firstOutside) firstOutside = links[j];
        if (/자세히/.test(textOf(links[j]))) { expand = links[j]; break; }
      }
      if (expand) break;
      if (firstOutside) { expand = firstOutside; break; }
    }
    return { expand: expand, collapse: collapse };
  }

  /* ── 펼침 ─────────────────────────────────────────────────────── */
  function openAnswer(a) {
    if (!a) return;
    a.__open = true;
    showEl(a);
    a.style.overflow = 'hidden';

    // 시작 상태: 투명 + 살짝 아래
    a.style.transition = 'none';
    a.style.transitionDelay = '0s';
    a.style.opacity = '0';
    a.style.transform = 'translateY(' + CFG.floatDist + 'px)';
    a.style.maxHeight = 'none';   // 흰 공간은 클릭 즉시 통째로 확보(높이 애니 없음)
    void a.offsetHeight;

    // 덩어리 통째로 페이드인 + 제자리로 둥실
    a.style.transition = 'opacity ' + CFG.fadeDur + 's ' + CFG.ease
                       + ', transform ' + CFG.floatDur + 's ' + CFG.ease;
    a.style.opacity = '1';
    a.style.transform = 'translateY(0)';
  }

  /* ── 접힘 ─────────────────────────────────────────────────────── */
  function closeAnswer(a, instant) {
    if (!a) return;
    a.__open = false;
    a.style.overflow = 'hidden';

    if (instant) {
      a.style.transition = 'none';
      a.style.transitionDelay = '0s';
      a.style.maxHeight = '0px';
      a.style.opacity = '0';
      a.style.transform = 'translateY(' + CFG.floatDist + 'px)';
      void a.offsetHeight;
      return;
    }

    // 현재 높이 고정 → 덩어리 페이드아웃 → (딜레이 후) 빈 공간 닫힘
    a.style.transition = 'none';
    a.style.transitionDelay = '0s';
    a.style.maxHeight = a.scrollHeight + 'px';
    void a.offsetHeight;

    a.style.transition = 'opacity ' + CFG.cFadeDur + 's ease'
                       + ', transform ' + CFG.cFadeDur + 's ease'
                       + ', max-height ' + CFG.cHeightDur + 's cubic-bezier(0.7,0,0.84,0) ' + CFG.cFadeDur + 's';
    a.style.opacity = '0';
    a.style.transform = 'translateY(' + CFG.floatDist + 'px)';
    a.style.maxHeight = '0px';
  }

  function setState(it, open, instant) {
    it.open = open;
    if (open) {
      openAnswer(it.answer);
      hideEl(it.expand);
      showEl(it.collapse);        // 접힘 버튼은 답변 안에 있음 — 함께 노출
    } else {
      closeAnswer(it.answer, instant);
      showEl(it.expand);          // 접힘 버튼은 답변과 함께 닫히므로 별도 숨김 불필요
    }
    if (it.expand) it.expand.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  var ITEMS = [];

  function process() {
    var answers = document.querySelectorAll(ANS_SEL);
    var fresh = 0;
    for (var i = 0; i < answers.length; i++) {
      var a = answers[i];
      if (a.__faqItem) {
        var ex = a.__faqItem;
        if (!ex.open && a.style.maxHeight !== '0px') { closeAnswer(a, true); showEl(ex.expand); }
        continue;
      }
      var lk = findItemLinks(a);
      var it = { answer: a, expand: lk.expand, collapse: lk.collapse, open: false };
      a.__faqItem = it; ITEMS.push(it); fresh++;

      var textEl = a.querySelector('[class*="faq-a_full" i]') || a.querySelector('p');
      if (textEl) wrapLinesForIndent(textEl);

      (function (item) {
        if (item.expand)   item.expand.addEventListener('click',   function (e) { e.preventDefault(); setState(item, true); });
        if (item.collapse) item.collapse.addEventListener('click', function (e) { e.preventDefault(); setState(item, false); });
      })(it);

      setState(it, false, true);
    }
    if (fresh) log('신규 처리', fresh, '개 / 총', answers.length, '개');
    return answers.length;
  }

  function start() {
    process();
    try {
      var mo = new MutationObserver(function () {
        if (mo.__t) return;
        mo.__t = setTimeout(function () { mo.__t = null; process(); }, 80);
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    var n = 0;
    var iv = setInterval(function () { process(); if (++n >= 12) clearInterval(iv); }, 500);
    if (TUNE) buildPanel();
  }

  /* ── 튜닝 패널 (?faq-tune=1) ─────────────────────────────────── */
  function buildPanel() {
    if (document.getElementById('faq-tune-panel')) return;
    var css = '#faq-tune-panel{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:270px;'
      + 'background:#0d1117;color:#e6edf3;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;'
      + 'border:1px solid #30363d;border-radius:10px;padding:12px 14px;box-shadow:0 8px 30px rgba(0,0,0,.5)}'
      + '#faq-tune-panel h4{margin:0 0 8px;font-size:13px;color:#58a6ff}'
      + '#faq-tune-panel label{display:block;margin:9px 0 2px;color:#8b949e}'
      + '#faq-tune-panel .row{display:flex;align-items:center;gap:8px}'
      + '#faq-tune-panel input[type=range]{flex:1}'
      + '#faq-tune-panel .val{width:52px;text-align:right;color:#e6edf3;font-variant-numeric:tabular-nums}'
      + '#faq-tune-panel select{width:100%;background:#161b22;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:3px}'
      + '#faq-tune-panel .btns{display:flex;gap:6px;margin-top:10px}'
      + '#faq-tune-panel button{flex:1;background:#238636;color:#fff;border:0;border-radius:6px;padding:6px;cursor:pointer;font-size:12px}'
      + '#faq-tune-panel button.sec{background:#21262d;border:1px solid #30363d}'
      + '#faq-tune-panel textarea{width:100%;height:60px;margin-top:8px;background:#161b22;color:#7ee787;'
      + 'border:1px solid #30363d;border-radius:6px;font:11px/1.4 ui-monospace,monospace;padding:6px;resize:none}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var box = document.createElement('div'); box.id = 'faq-tune-panel';
    function sliderRow(key, label, min, max, step, unit) {
      return '<label>' + label + '</label><div class="row">'
        + '<input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + CFG[key] + '">'
        + '<span class="val" data-v="' + key + '">' + CFG[key] + unit + '</span></div>';
    }
    function selRow(key, label, presets) {
      var opts = '';
      for (var name in presets) opts += '<option value="' + presets[name] + '"' + (presets[name] === CFG[key] ? ' selected' : '') + '>' + name + '</option>';
      return '<label>' + label + '</label><select data-k="' + key + '">' + opts + '</select>';
    }
    box.innerHTML = '<h4>FAQ 펼침 튜닝</h4>'
      + sliderRow('fadeDur',   '페이드인 시간',   0.2, 1.2, 0.05, 's')
      + sliderRow('floatDur',  '둥실 시간',       0.2, 1.2, 0.05, 's')
      + sliderRow('floatDist', '둥실 거리',       0, 40, 1, 'px')
      + selRow('ease',         '이징', EASE_PRESETS)
      + sliderRow('cFadeDur',  '접힘 페이드',     0.1, 0.8, 0.02, 's')
      + sliderRow('cHeightDur','접힘 닫힘',       0.2, 0.9, 0.02, 's')
      + '<div class="btns"><button data-act="play">▶ 미리보기</button>'
      + '<button class="sec" data-act="copy">값 복사</button></div>'
      + '<textarea readonly data-out></textarea>';
    document.body.appendChild(box);

    var out = box.querySelector('[data-out]');
    function nameOf() { for (var n in EASE_PRESETS) if (EASE_PRESETS[n] === CFG.ease) return n; return CFG.ease; }
    function refreshOut() {
      out.value =
        '페이드인 ' + CFG.fadeDur + 's / 둥실 ' + CFG.floatDur + 's ' + CFG.floatDist + 'px\n' +
        '이징 ' + nameOf() + '\n' +
        '접힘 페이드 ' + CFG.cFadeDur + 's / 닫힘 ' + CFG.cHeightDur + 's';
    }
    refreshOut();

    var first = ITEMS[0];
    function preview() {
      if (!first) return;
      setState(first, false, true);
      setTimeout(function () { setState(first, true); }, 60);
    }

    box.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      var v = e.target.value;
      CFG[k] = (e.target.type === 'range') ? parseFloat(v) : v;
      var span = box.querySelector('[data-v="' + k + '"]');
      if (span) span.textContent = CFG[k] + (k === 'floatDist' ? 'px' : 's');
      refreshOut();
      preview();
    });
    box.addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'play') preview();
      if (act === 'copy') { out.select(); try { document.execCommand('copy'); } catch (x) {} e.target.textContent = '복사됨!'; setTimeout(function(){ e.target.textContent='값 복사'; }, 1200); }
    });
    log('튜닝 패널 활성 — ?faq-tune=1');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
