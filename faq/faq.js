/* ================================================================
   HELIX AMC — FAQ 자세히보기 / 간략히보기 토글 (v5 — 부드러운 펼침)

   Webflow 실제 구조 (컴포넌트):
   - FAQ_QA (렌더 클래스 faq_qa)              : 질문 카드. 내부 .faq-more 링크 2개
       · "자세히 보기 +" (펼치기)  · "간략히 보기 -" (접기)
   - FAQ_Answer AI (렌더 클래스 faq_answer-ai) : 상세 답변 = 펼침부분(별개 형제)

   동작
   - 기본: 각 질문 뒤 답변 접힘 + "간략히 보기" 숨김("자세히 보기"만)
   - 자세히 보기 클릭 → 답변이 높이 애니메이션으로 스르륵 펼침 + 링크 교체
   - 간략히 보기 클릭 → 스르륵 접힘 + 링크 원위치

   v5 — 즉시 show/hide(팔락) → max-height + opacity 트랜지션으로 고급스럽게.
   - 애니메이션은 인라인 style 로 직접(CSS 캐시 무관)
   - 선택자 대소문자 무관([class*="..." i]) → FAQ_QA/faq_qa 모두 매칭
   - MutationObserver 로 필터/탭 재렌더 추적
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
    console.log.apply(console, ['[FAQ v5]'].concat(Array.prototype.slice.call(arguments)));
  }

  var QA_SEL   = '[class*="faq_qa" i]';
  var ANS_SEL  = '[class*="faq_answer" i]';
  var MORE_SEL = '[class*="faq-more" i]';

  var OPEN_EASE  = 'max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';
  var CLOSE_EASE = 'max-height 0.34s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease';

  function showEl(el) { if (el) el.style.removeProperty('display'); }
  function hideEl(el) { if (el) el.style.setProperty('display', 'none', 'important'); }

  /* 답변 패널 — 접힘(즉시/애니) */
  function closeAnswer(a, instant) {
    if (!a) return;
    a.__open = false;
    a.style.overflow = 'hidden';
    if (instant) {
      a.style.transition = 'none';
      a.style.maxHeight = '0px';
      a.style.opacity = '0';
      void a.offsetHeight; // reflow 확정
    } else {
      a.style.transition = 'none';
      a.style.maxHeight = a.scrollHeight + 'px'; // 현재 높이 고정
      void a.offsetHeight;
      a.style.transition = CLOSE_EASE;
      a.style.maxHeight = '0px';
      a.style.opacity = '0';
    }
  }

  /* 답변 패널 — 펼침(애니) */
  function openAnswer(a) {
    if (!a) return;
    a.__open = true;
    showEl(a); // 옛 버전이 display:none 박았을 수 있어 해제
    a.style.overflow = 'hidden';
    a.style.transition = 'none';
    a.style.maxHeight = '0px';
    void a.offsetHeight;
    var target = a.scrollHeight; // 전체 콘텐츠 높이
    a.style.transition = OPEN_EASE;
    a.style.opacity = '1';
    a.style.maxHeight = target + 'px';
    var done = function (e) {
      if (e && e.propertyName && e.propertyName !== 'max-height') return;
      if (a.__open) a.style.maxHeight = 'none'; // 내부 변화 자연 반영
      a.removeEventListener('transitionend', done);
    };
    a.addEventListener('transitionend', done);
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

  function answerFor(qa) {
    var flat = Array.prototype.slice.call(document.querySelectorAll(QA_SEL + ',' + ANS_SEL));
    var i = flat.indexOf(qa);
    for (var j = i + 1; j < flat.length; j++) {
      if (flat[j].matches(ANS_SEL)) return flat[j];
      if (flat[j].matches(QA_SEL)) break;
    }
    return null;
  }

  function setState(it, open, instant) {
    it.open = open;
    if (open) { openAnswer(it.answer); hideEl(it.expand); showEl(it.collapse); }
    else      { closeAnswer(it.answer, instant); showEl(it.expand); hideEl(it.collapse); }
    if (it.expand) it.expand.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function process() {
    var qas = document.querySelectorAll(QA_SEL);
    var fresh = 0;
    for (var i = 0; i < qas.length; i++) {
      var qa = qas[i];

      if (qa.__faqItem) {
        var ex = qa.__faqItem;
        // 재렌더 안전망: 닫힘인데 답변이 다시 열려버린 경우만 즉시 재접힘
        if (ex.answer && !ex.open && ex.answer.style.maxHeight !== '0px') {
          closeAnswer(ex.answer, true);
          showEl(ex.expand); hideEl(ex.collapse);
        }
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

      setState(it, false, true); // 초기 접힘은 즉시(애니 없이)
    }
    if (fresh) log('신규 처리', fresh, '개 / 총 faq_qa', qas.length, '개');
    return qas.length;
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
