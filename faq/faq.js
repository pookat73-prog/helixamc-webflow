/* ================================================================
   HELIX AMC — FAQ 자세히보기 / 간략히보기 토글 (v3 — CSS 비의존)

   Webflow 실제 구조 (컴포넌트):
   - FAQ_QA (렌더 클래스 faq_qa)       : 질문 카드. 내부 .faq-more 링크 2개
       · "자세히 보기 +" (펼치기)
       · "간략히 보기 -" (접기)
   - FAQ_Answer AI (렌더 클래스 faq_answer-ai) : 상세 답변 = 펼침부분(별개 형제)

   동작
   - 기본: 각 질문 뒤 답변 숨김 + "간략히 보기" 숨김("자세히 보기"만)
   - 자세히 보기 클릭 → 짝지어진 답변 노출 + 두 링크 교체
   - 간략히 보기 클릭 → 답변 숨김 + 두 링크 원위치

   ⚠ 견고화 포인트
   - 숨김/보임을 **인라인 style 로 직접** 처리 → faq.css 가 stale/미로드여도 동작
   - 선택자를 **대소문자 무관**(`[class*="..." i]`) → FAQ_QA / faq_qa 모두 매칭
   - JS 실패 시 전부 표시(콘텐츠 유실 없음)

   디버그: URL 에 ?debug-faq=1
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqInit) return;
  window.__helixFaqInit = true;

  var DEBUG = /[?&]debug-faq=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ v3]'].concat(Array.prototype.slice.call(arguments)));
  }

  var QA_SEL   = '[class*="faq_qa" i]';
  var ANS_SEL  = '[class*="faq_answer" i]';
  var MORE_SEL = '[class*="faq-more" i]';

  function hideEl(el) { if (el) el.style.setProperty('display', 'none', 'important'); }
  function showEl(el) { if (el) el.style.removeProperty('display'); } // Webflow 원래 display 복원

  /* 질문↔답변 짝짓기: 문서 순서로 훑어 각 질문 뒤 첫 답변을 짝지음 */
  function collectPairs() {
    var flat = Array.prototype.slice.call(document.querySelectorAll(QA_SEL + ',' + ANS_SEL));
    var items = [], pendingQ = null;
    for (var i = 0; i < flat.length; i++) {
      var n = flat[i];
      var isQ = n.matches(QA_SEL);
      var isA = n.matches(ANS_SEL);
      if (isA && !isQ) {
        if (pendingQ) { items.push({ qa: pendingQ, answer: n }); pendingQ = null; }
      } else if (isQ) {
        pendingQ = n;
      }
    }
    if (pendingQ) items.push({ qa: pendingQ, answer: null });
    return items;
  }

  /* 질문 카드 안의 자세히/간략히 링크 (텍스트로 구분) */
  function findLinks(qa) {
    var ls = qa.querySelectorAll(MORE_SEL);
    var expand = null, collapse = null;
    for (var i = 0; i < ls.length; i++) {
      var t = (ls[i].textContent || '').replace(/\s+/g, '');
      if (!expand && /자세히/.test(t)) expand = ls[i];
      else if (!collapse && /간략/.test(t)) collapse = ls[i];
    }
    if (!expand && ls[0]) expand = ls[0];               // 폴백: 첫째=자세히
    if (!collapse && ls[1]) collapse = ls[1];           // 폴백: 둘째=간략히
    return { expand: expand, collapse: collapse, count: ls.length };
  }

  function setState(it, open) {
    if (open) { showEl(it.answer); hideEl(it.expand); showEl(it.collapse); }
    else      { hideEl(it.answer); showEl(it.expand); hideEl(it.collapse); }
    if (it.expand) it.expand.setAttribute('aria-expanded', open ? 'true' : 'false');
    it.open = open;
  }

  function wire(it) {
    if (it.expand && !it.expand.__faqWired) {
      it.expand.__faqWired = true;
      it.expand.addEventListener('click', function (e) { e.preventDefault(); setState(it, true); });
    }
    if (it.collapse && !it.collapse.__faqWired) {
      it.collapse.__faqWired = true;
      it.collapse.addEventListener('click', function (e) { e.preventDefault(); setState(it, false); });
    }
  }

  function run() {
    var qaEls  = document.querySelectorAll(QA_SEL);
    var ansEls = document.querySelectorAll(ANS_SEL);
    if (!qaEls.length) {
      log('대기 — .faq_qa 아직 0개 (렌더 전이거나 클래스명 상이)');
      return false; // 재시도
    }

    var items = collectPairs().map(function (p) {
      var lk = findLinks(p.qa);
      return { qa: p.qa, answer: p.answer, expand: lk.expand, collapse: lk.collapse, open: false };
    });

    items.forEach(function (it) { setState(it, false); wire(it); });

    log('완료 — faq_qa', qaEls.length, '/ faq_answer*', ansEls.length, '/ 짝', items.length);
    if (!ansEls.length) log('⚠ faq_answer* 0개 — 답변 컴포넌트가 이 페이지에 없거나 클래스 상이');
    return true;
  }

  function boot() {
    if (run()) return;
    var n = 0;
    var iv = setInterval(function () { if (run() || ++n >= 20) clearInterval(iv); }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
