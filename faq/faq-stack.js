/* ================================================================
   HELIX AMC — FAQ 아코디언 v4 (겹침 스택 폐기)

   실제 DOM (Webflow):
     .faq-list                       ← 컨테이너
       └ .faq_q [data-species...]    ← 목록 항목(카드 단위) = ITEM
           └ .faq_box                ← 카드 = CARD
               ├ .faq_qa  질문 + 요약(.faq-a) + '자세히' 인디케이터(주입)
               └ .faq_answer-ai  상세(.faq-a_Full) = ANSWER

   동작 (구분선 아코디언)
     평소  : 박스·그림자 없이 얇은 구분선으로만 질문 나열. 질문 + 요약 표시,
             각 행 오른쪽에 + 아이콘.
     클릭  : 질문 행 또는 + 를 누르면 상세가 카드 '안'으로 인라인 펼쳐지고
             + → − 로 바뀜. 아래 리스트는 자연스레 밀려 내려감. 다시 누르면 접힘.
             아코디언식(하나 열면 나머지 닫힘). 펼치면 화면에 다 보이게 시야 이동.

   선·그림자·테두리 등 카드 효과 = 이 파일(코드) + faq.css.
   정렬/타이포 등 원본 디자인 = Webflow 캔버스.

   기존 클릭 토글(faq.js)은 이 파일이 __helixFaqInit 를 선점해 자동 비활성.
   ⚠ 되돌리려면 faq/bootstrap.js FILES 에서 이 파일 + faq-stack.css 제거.

   디버그: URL 에 ?faq-stack-debug=1  → 로그.
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
  function setIndicator(rec, open) {
    if (!rec.indicator) return;
    rec.indicator.setAttribute('aria-expanded', open ? 'true' : 'false');
    rec.indicator.setAttribute('aria-label', open ? '답변 접기' : '답변 펼치기');
  }
  /* +/− 인디케이터는 카드 기준 절대배치(오른쪽 고정)라 이동 불필요 — no-op */
  function placeIndicator(rec, open) {}
  function closeRec(r) {
    if (!r) return;
    r.item.classList.remove('is-open');
    setIndicator(r, false);
    placeIndicator(r, false);
  }
  function openRec(rec) {
    ITEMS.forEach(function (r) { if (r !== rec) closeRec(r); });
    rec.item.classList.add('is-open');
    setIndicator(rec, true);
    placeIndicator(rec, true);
  }
  function toggleRec(rec) {
    var willOpen = !rec.item.classList.contains('is-open');
    if (willOpen) openRec(rec); else closeRec(rec);
    // 펼침/접힘으로 카드 높이가 바뀜 → 겹침·아래 항목 위치 즉시 재계산
    // (펼친 카드는 전체 노출로 잡혀 아래 리스트가 실제로 밀려 내려감)
    moStop(); layout(); moStart();
    // 펼칠 때, 늘어난 카드가 화면에 다 들어오도록 시야 이동(상단 헤더/고정필터 침범 금지)
    if (willOpen) ensureVisible(rec.item);
  }

  /* 상단 고정 요소(헤더 + 필터 고정표시)의 화면상 하단 y — 이 밑에 카드 top 을 둠 */
  function topGuard() {
    var hb = 56;
    var h = document.querySelector('header.header');
    if (h) { try { if (getComputedStyle(h).position === 'fixed') hb = h.getBoundingClientRect().bottom; } catch (e) {} }
    var pinned = 0;
    try { if (window.__helixFaqPinnedH) pinned = window.__helixFaqPinnedH() || 0; } catch (e) {}
    return hb + pinned;
  }

  /* 펼친 카드가 뷰포트에 최대한 다 보이도록 스크롤. 카드가 화면보다 크면 top 을
     고정 요소 바로 밑에 맞춤(질문부터 보이게). 상단 고정 요소는 절대 안 가림. */
  function ensureVisible(item) {
    if (!item) return;
    setTimeout(function () {
      var guard = topGuard() + 12;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var margin = 16;
      var r = item.getBoundingClientRect();
      var delta = 0;
      if (r.height >= vh - guard - margin) {
        delta = r.top - guard;                                   // 다 안 들어감 → top 정렬
      } else if (r.bottom > vh - margin) {
        delta = Math.min(r.bottom - (vh - margin), r.top - guard); // 아래 잘림 → 내리되 top 유지
      } else if (r.top < guard) {
        delta = r.top - guard;                                   // 위가 가림 → 올림
      }
      if (Math.abs(delta) > 2) {
        try { window.scrollBy({ top: delta, behavior: 'smooth' }); }
        catch (e) { window.scrollBy(0, delta); }
      }
    }, 20);
  }

  /* 질문 행 오른쪽에 +/− 인디케이터 주입 (상세가 있을 때만).
     카드 기준 절대배치(오른쪽). 질문(질문블록) 클릭으로도 열고 닫히게. */
  function buildIndicator(rec) {
    if (rec.indicator || !rec.answer) return;
    var host = rec.card;
    if (!host) return;
    var el = document.createElement('div');
    el.className = 'helix-faq-indicator';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-expanded', 'false');
    el.setAttribute('aria-label', '답변 펼치기');
    el.innerHTML = '<span class="helix-faq-indicator__pm" aria-hidden="true"></span>';
    host.appendChild(el);   // 카드 오른쪽 고정(절대배치)
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toggleRec(rec); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRec(rec); }
    });
    rec.indicator = el;

    /* '질문 클릭 → 답 펼침' — 질문블록(요약 포함) 클릭도 토글.
       링크/버튼/인디케이터 클릭은 제외(원래 동작 보존). */
    if (rec.qa) {
      rec.qa.style.cursor = 'pointer';
      rec.qa.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.closest && t.closest('a, button, .helix-faq-indicator')) return;
        toggleRec(rec);
      });
    }
  }

  /* 상세 문단의 수동 줄바꿈(<br>)을 각각 .faq-line 블록으로 감쌈 → CSS 가
     '첫 줄 제외, 둘째 줄바꿈부터 들여쓰기'를 적용할 수 있게. (예전 faq.js 가
     하던 일인데, faq-stack 이 faq.js 를 비활성화하므로 여기로 옮김) */
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

    /* 카드 배경이 투명이면 채워 테두리/그림자가 뜨는 카드처럼 보이게(원본 배경 있으면 유지). */
    if (isTransparent(getComputedStyle(card).backgroundColor)) card.style.background = opaqueBg(card);

    /* 상세 문단 각 줄을 .faq-line 으로 감쌈 → 둘째 줄바꿈부터 들여쓰기(CSS) 적용 */
    if (answer) {
      var textEl = answer.querySelector('[class*="faq-a_full" i]') || answer.querySelector('p');
      if (textEl) wrapLinesForIndent(textEl);
    }

    var rec = { item: item, card: card, answer: answer, qa: qa, summary: summary, indicator: null };
    buildIndicator(rec);   // 요약 밑 '자세히' 인디케이터 (누르면 상세 펼침)
    ITEMS.push(rec);
  }

  /* 아코디언 — 겹침 없음. 예전 스택이 넣었을 수 있는 인라인 음수 margin 만
     걷어내 세로 배치가 CSS 간격을 따르게 함. (레이아웃은 CSS 가 담당) */
  function layout() {
    for (var i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].item) ITEMS[i].item.style.marginTop = '';
    }
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
