/* ================================================================
   HELIX AMC — FAQ 카드 겹치기(스택) 실험 v2

   실제 DOM (Webflow):
     .faq-list                       ← 컨테이너
       └ .faq_q [data-species...]    ← 목록 항목(겹치는 단위) = ITEM
           └ .faq_box                ← 카드(배경) = CARD
               ├ .faq_qa  질문 + 요약(.faq-a)
               └ .faq_answer-ai  상세(.faq-a_Full) = ANSWER

   동작 (호버 전용 — 클릭 상호작용 없음)
     평소  : 카드가 겹쳐 쌓여 '질문만 빼꼼'.
             겹침 양 = JS 가 '요약(.faq-a) 시작 지점'을 실측해, 다음 카드가
             딱 그 아래(요약부터)를 덮도록 음수 margin 을 넣음 → 질문만 남음.
     호버  : 그 항목이 위로 떠오르며 z 최상단 → 가려졌던 요약이 드러남.
             상세(.faq_answer-ai)는 항상 숨김.

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

    /* 카드 배경 채우기(겹쳐도 아래가 안 비치게) */
    if (isTransparent(getComputedStyle(card).backgroundColor)) card.style.background = opaqueBg(card);

    /* 호버 전용 — 클릭 상호작용 없음. 상세(.faq_answer-ai)는 항상 숨김. */

    ITEMS.push({ item: item, card: card, answer: answer, qa: qa, summary: summary });
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
