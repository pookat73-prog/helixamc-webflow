/* ================================================================
   HELIX AMC — FAQ 카드 겹치기(스택) v3 — 호버 + '자세히' 클릭 펼침

   실제 DOM (Webflow):
     .faq-list                       ← 컨테이너
       └ .faq_q [data-species...]    ← 목록 항목(겹치는 단위) = ITEM
           └ .faq_box                ← 카드(배경) = CARD
               ├ .faq_qa  질문 + 요약(.faq-a)
               └ .faq_answer-ai  상세(.faq-a_Full) = ANSWER

   동작
     평소  : 카드가 겹쳐 쌓여 '질문만 빼꼼'.
             겹침 양 = JS 가 '요약(.faq-a) 시작 지점'을 실측해, 다음 카드가
             딱 그 아래(요약부터)를 덮도록 음수 margin 을 넣음 → 질문만 남음.
     호버  : 그 항목이 위로 떠오르며 z 최상단 → 가려졌던 요약이 드러남.
             요약 밑에 중앙정렬로 '자세히' + 감각 화살표 인디케이터가 뜸.
     클릭  : '자세히' 누르면 상세(.faq_answer-ai)가 카드 아래로 펼쳐짐(오버레이).
             아코디언식(하나 열면 나머지 닫힘). 열린 카드는 마우스가 떠나도
             떠오른 채 고정. 다시 누르면 접힘.

   기존 클릭 토글(faq.js)은 이 파일이 __helixFaqInit 를 선점해 자동 비활성.
   ⚠ 되돌리려면 faq/bootstrap.js FILES 에서 이 파일 + faq-stack.css 제거.

   디버그: URL 에 ?faq-stack-debug=1  → 카드별 실측 peek/overlap 로그.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqStackInit) return;
  window.__helixFaqStackInit = true;
  window.__helixFaqInit = true;   // 기존 faq.js(클릭 토글) 비활성화

  var DEBUG = /[?&]faq-stack-debug=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ-Stack v2]'].concat(Array.prototype.slice.call(arguments)));
  }

  var CARD_SEL = '[class*="faq_box" i]';       // .faq_box (카드)
  var QA_SEL   = '[class*="faq_qa" i]';        // .faq_qa (질문+요약)
  var ANS_SEL  = '[class*="faq_answer" i]';    // .faq_answer-ai (상세)
  var SUM_SEL  = '[class*="faq-a" i]';         // 요약 .faq-a (질문블록 아래)
  var PEEK_MIN = 56;                            // 실측 실패 시 최소 노출 높이(px)

  function isTransparent(bg) {
    return !bg || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)|transparent/.test(bg.replace(/\s/g, ''));
  }
  function opaqueBg(el) {
    var n = el;
    for (var i = 0; i < 8 && n; i++) {
      var bg = getComputedStyle(n).backgroundColor;
      if (!isTransparent(bg)) return bg;
      n = n.parentElement;
    }
    return '#0d1117';
  }
  function neutralizeIX2(el) {
    if (!el) return;
    el.removeAttribute('data-w-id');
    ['opacity', 'transform', 'display', 'max-height', 'visibility'].forEach(function (p) {
      el.style.removeProperty(p);
    });
  }

  var ITEMS = [];   // { item, card, answer, qa, summary }

  /* 항목(겹치는 단위) = '.faq-list 의 직속 자식'. data-species 로 잡으면
     카드 안쪽에도 data-species 가 달린 카드(예: 3번)가 다른 그룹으로 빠져
     겹침이 안 먹음 → 컨테이너 직속 자식으로 확정. */
  function findContainerAndItem(card) {
    var container = card.closest('[class*="faq-list" i]');
    if (container) {
      var node = card;
      while (node.parentElement && node.parentElement !== container) node = node.parentElement;
      return { container: container, item: node };
    }
    var item = card.closest('[data-species]') || card.parentElement || card;
    return { container: item.parentElement, item: item };
  }

  /* ── 펼침(자세히) 상태 관리 ────────────────────────────────────
     카드 호버로 요약이 드러난 뒤, 요약 밑 '자세히' 인디케이터를 누르면
     상세(.faq_answer-ai)가 카드 아래로 펼쳐짐. 아코디언식: 하나 열면 나머지
     닫힘. 열린 카드는 마우스가 떠나도 CSS(.is-open)로 떠오른 채 고정. */
  function closeRec(r) {
    if (!r) return;
    r.item.classList.remove('is-open');
    if (r.indicator) r.indicator.setAttribute('aria-expanded', 'false');
  }
  function openRec(rec) {
    ITEMS.forEach(function (r) { if (r !== rec) closeRec(r); });
    rec.item.classList.add('is-open');
    if (rec.indicator) rec.indicator.setAttribute('aria-expanded', 'true');
  }
  function toggleRec(rec) {
    if (rec.item.classList.contains('is-open')) closeRec(rec);
    else openRec(rec);
  }

  /* 요약 밑에 '자세히' + 감각 화살표 인디케이터 주입 (상세가 있을 때만). */
  function buildIndicator(rec) {
    if (rec.indicator || !rec.answer) return;
    var qa = rec.qa || rec.card;
    if (!qa) return;
    var el = document.createElement('div');
    el.className = 'helix-faq-indicator';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-expanded', 'false');
    el.setAttribute('aria-label', '자세히 보기');
    el.innerHTML =
      '<span class="helix-faq-indicator__label">자세히</span>' +
      '<svg class="helix-faq-indicator__arrow" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 9l7 7 7-7"/></svg>';
    // 요약 바로 뒤에 끼워넣기(요약이 qa 직속일 때). 아니면 qa 끝에 붙임(요약 아래).
    if (rec.summary && rec.summary.parentNode === qa) qa.insertBefore(el, rec.summary.nextSibling);
    else qa.appendChild(el);
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toggleRec(rec); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRec(rec); }
    });
    rec.indicator = el;
  }

  function processCard(card) {
    if (card.__faqStack) return;
    card.__faqStack = true;

    var ci = findContainerAndItem(card);
    var item = ci.item;
    var container = ci.container;
    var qa = card.querySelector(QA_SEL);
    var answer = card.querySelector(ANS_SEL);
    var summary = qa ? qa.querySelector(SUM_SEL) : null;

    if (container) container.classList.add('helix-faq-list');
    item.classList.add('helix-faq-item');
    card.classList.add('helix-faq-card');
    if (answer) answer.classList.add('helix-faq-answer');

    neutralizeIX2(item);
    neutralizeIX2(card);
    neutralizeIX2(answer);

    /* 카드 배경 채우기(투명 카드일 때만 — 겹쳐도 아래가 안 비치게).
       카드에 이미 배경이 있으면 손대지 않음(Webflow 원본 유지). */
    if (isTransparent(getComputedStyle(card).backgroundColor)) card.style.background = opaqueBg(card);

    /* 펼침 상세는 카드 '바로 아래'에 이어붙는 오버레이 → 상세 컨테이너 배경을
       카드 배경과 '똑같이' 맞춰 이음매(회색 띠) 없이 카드가 늘어난 것처럼 보이게.
       (안쪽 흰 답변 박스 .faq-a_Full 은 그대로 — 이건 '답변 말풍선'). */
    if (answer) {
      var cardBg = getComputedStyle(card).backgroundColor;
      if (isTransparent(cardBg)) cardBg = opaqueBg(card);
      answer.style.setProperty('background-color', cardBg, 'important');
      answer.style.setProperty('background-image', 'none', 'important');
    }

    /* 호버 연출은 전적으로 CSS(:hover)가 담당 — JS 는 위치(겹침)만 계산. */

    var rec = { item: item, card: card, answer: answer, qa: qa, summary: summary, indicator: null };
    buildIndicator(rec);   // 요약 밑 '자세히' 인디케이터 (누르면 상세 펼침)
    ITEMS.push(rec);
  }

  /* 질문만 남기는 실측 겹침: 각 항목의 '요약 시작 y' 를 재서, 다음 항목이
     그 지점부터 덮도록 음수 margin. 필터로 숨은 항목은 제외하고 재계산. */
  function layout() {
    // 컨테이너별 그룹핑(보이는 항목만)
    var groups = [];
    var seen = [];
    ITEMS.forEach(function (rec) {
      var it = rec.item;
      if (!it.parentElement) return;
      var cs = getComputedStyle(it);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var gi = seen.indexOf(it.parentElement);
      if (gi === -1) { seen.push(it.parentElement); groups.push([rec]); }
      else groups[gi].push(rec);
    });

    groups.forEach(function (list) {
      // DOM 순서 정렬
      list.sort(function (a, b) {
        return (a.item.compareDocumentPosition(b.item) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
      });

      var m = list.map(function (rec) {
        var it = rec.item;
        var itTop = it.getBoundingClientRect().top;
        var peek;
        if (rec.summary) {
          peek = rec.summary.getBoundingClientRect().top - itTop;   // 요약 시작 = 질문 끝
        }
        if (!(peek > PEEK_MIN)) peek = Math.min(PEEK_MIN, it.offsetHeight);
        return { rec: rec, peek: peek, h: it.offsetHeight };
      });

      // 첫 항목은 원래 위쪽 여백 유지(필터 박스와의 간격) — 인라인 override 제거
      if (m.length) m[0].rec.item.style.marginTop = '';
      for (var i = 1; i < m.length; i++) {
        var prev = m[i - 1];
        var overlap = Math.max(0, Math.round(prev.h - prev.peek));
        m[i].rec.item.style.marginTop = (-overlap) + 'px';
      }
      if (DEBUG && m.length) {
        log('그룹', m.length, '개 / 첫 항목 peek≈' + Math.round(m[0].peek) + 'px, h=' + m[0].h + 'px');
      }
    });
  }

  var MO = null;
  var MO_OPTS = {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['style', 'class', 'data-species', 'data-category', 'data-dept']
  };
  function moStop() { if (MO) try { MO.disconnect(); } catch (e) {} }
  function moStart() { if (MO) try { MO.observe(document.documentElement, MO_OPTS); } catch (e) {} }

  var layoutT = null;
  function relayout() {
    if (layoutT) return;
    layoutT = setTimeout(function () {
      layoutT = null;
      moStop();       // 내 margin 수정이 옵저버를 재발동해 루프 도는 것 방지
      layout();
      moStart();
    }, 60);
  }

  function process() {
    var cards = document.querySelectorAll(CARD_SEL);
    var fresh = 0;
    for (var i = 0; i < cards.length; i++) {
      if (!cards[i].__faqStack) { processCard(cards[i]); fresh++; }
    }
    if (fresh) { log('신규 카드', fresh, '개 / 총', cards.length, '개'); relayout(); }
    return cards.length;
  }

  function start() {
    process();
    relayout();

    // 폰트 로드 후 재측정(질문 높이 확정)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout).catch(function () {});
    window.addEventListener('load', relayout);
    window.addEventListener('resize', relayout);

    // DOM 추가/필터 변경 감시 (layout 중엔 moStop 으로 잠시 끊어 루프 방지)
    try {
      MO = new MutationObserver(function () {
        if (MO.__t) return;
        MO.__t = setTimeout(function () { MO.__t = null; process(); relayout(); }, 90);
      });
      moStart();
    } catch (e) {}

    // 초기 몇 차례 보정 패스
    var n = 0;
    var iv = setInterval(function () { process(); relayout(); if (++n >= 10) clearInterval(iv); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
