/* ================================================================
   HELIX AMC — FAQ 자세히보기 / 간략히보기 토글 (v4 — 재렌더 추적)

   Webflow 실제 구조 (컴포넌트):
   - FAQ_QA (렌더 클래스 faq_qa)              : 질문 카드. 내부 .faq-more 링크 2개
       · "자세히 보기 +" (펼치기)  · "간략히 보기 -" (접기)
   - FAQ_Answer AI (렌더 클래스 faq_answer-ai) : 상세 답변 = 펼침부분(별개 형제)

   동작
   - 기본: 각 질문 뒤 답변 숨김 + "간략히 보기" 숨김("자세히 보기"만)
   - 자세히 보기 클릭 → 답변 노출 + 두 링크 교체 / 간략히 보기 → 원위치

   ⚠ v4 핵심 — 왜 v3 가 안 먹었나
   FAQ 페이지엔 필터/탭이 있어 목록이 **로드 후 다시 그려짐**. v3 는 한 번만
   숨겨서, 재렌더된 새 요소엔 적용이 안 됐음(진단: answer inline "" = 미적용).
   → MutationObserver 로 항목이 (재)등장할 때마다 처리. 처리 표식으로 중복 방지.

   - 숨김/보임은 인라인 style 로 직접(CSS 캐시 무관)
   - 선택자 대소문자 무관([class*="..." i]) → FAQ_QA/faq_qa 모두 매칭
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
    console.log.apply(console, ['[FAQ v4]'].concat(Array.prototype.slice.call(arguments)));
  }

  var QA_SEL   = '[class*="faq_qa" i]';
  var ANS_SEL  = '[class*="faq_answer" i]';
  var MORE_SEL = '[class*="faq-more" i]';

  function hideEl(el) { if (el) el.style.setProperty('display', 'none', 'important'); }
  function showEl(el) { if (el) el.style.removeProperty('display'); } // Webflow 원래 display 복원

  /* 질문 뒤 첫 답변(다음 질문 전) 찾기 — 문서 순서 기준 */
  function answerFor(qa) {
    var flat = Array.prototype.slice.call(document.querySelectorAll(QA_SEL + ',' + ANS_SEL));
    var i = flat.indexOf(qa);
    for (var j = i + 1; j < flat.length; j++) {
      if (flat[j].matches(ANS_SEL)) return flat[j];
      if (flat[j].matches(QA_SEL)) break; // 다음 질문 전까지만
    }
    return null;
  }

  function findLinks(qa) {
    var ls = qa.querySelectorAll(MORE_SEL);
    var expand = null, collapse = null;
    for (var i = 0; i < ls.length; i++) {
      var t = (ls[i].textContent || '').replace(/\s+/g, '');
      if (!expand && /자세히/.test(t)) expand = ls[i];
      else if (!collapse && /간략/.test(t)) collapse = ls[i];
    }
    if (!expand && ls[0]) expand = ls[0];
    if (!collapse && ls[1]) collapse = ls[1];
    return { expand: expand, collapse: collapse };
  }

  function setState(it, open) {
    it.open = open;
    if (open) { showEl(it.answer); hideEl(it.expand); showEl(it.collapse); }
    else      { hideEl(it.answer); showEl(it.expand); hideEl(it.collapse); }
    if (it.expand) it.expand.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* 모든 .faq_qa 처리. 이미 처리한 항목은 스킵하되, 재렌더로 인라인이 날아간
     경우(닫힘인데 answer 가 다시 보임)만 재차 숨김. */
  function process() {
    var qas = document.querySelectorAll(QA_SEL);
    var fresh = 0;
    for (var i = 0; i < qas.length; i++) {
      var qa = qas[i];

      if (qa.__faqItem) {
        var ex = qa.__faqItem;
        // 재렌더 안전망: 닫힘 상태인데 답변이 다시 보이면 재숨김
        if (ex.answer && !ex.open && ex.answer.style.display !== 'none') hideEl(ex.answer);
        continue;
      }

      var lk = findLinks(qa);
      var it = { qa: qa, answer: answerFor(qa), expand: lk.expand, collapse: lk.collapse, open: false };
      qa.__faqItem = it;
      fresh++;

      (function (item) {
        if (item.expand) item.expand.addEventListener('click', function (e) { e.preventDefault(); setState(item, true); });
        if (item.collapse) item.collapse.addEventListener('click', function (e) { e.preventDefault(); setState(item, false); });
      })(it);

      setState(it, false);
    }
    if (fresh) log('신규 처리', fresh, '개 / 총 faq_qa', qas.length, '개');
    return qas.length;
  }

  function start() {
    process();

    // 재렌더/지연렌더 추적: 항목이 (다시) 나타날 때마다 process
    try {
      var mo = new MutationObserver(function () {
        if (mo.__t) return;
        mo.__t = setTimeout(function () { mo.__t = null; process(); }, 80);
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}

    // 보조 안전망: 초기 몇 초간 폴링(옵저버가 못 잡는 케이스 대비)
    var n = 0;
    var iv = setInterval(function () { process(); if (++n >= 12) clearInterval(iv); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
