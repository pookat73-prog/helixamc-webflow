/* ================================================================
   HELIX AMC — FAQ 자세히보기 / 간략히보기 토글 (v6 — 연출 강화)

   Webflow 실제 구조 (컴포넌트):
   - FAQ_QA (faq_qa)          : 질문 카드 + 요약(faq-a). 내부 .faq-more 링크 2개
   - FAQ_Answer AI (faq_answer-ai) : 상세 답변(펼침부분). 내부:
       · FAQ_Line (faq_line)   = 구분선
       · faq-a_Full (faq-a_full) = 상세 문단

   동작
   - 기본: 답변 접힘 + "간략히 보기" 숨김("자세히 보기"만). 요약은 항상 표시.
   - 자세히 보기 클릭 → 펼침 연출:
       (1) 컨테이너 높이 max-height 로 스르륵
       (2) 구분선 가운데→양쪽 scaleX(0→1) ease-in-out
       (3) 문단 fade + 아래서 위로 slide-in (살짝 delay)
   - 간략히 보기 클릭 → 역방향으로 접힘

   - 애니메이션은 인라인 style 로 직접(CSS 캐시 무관)
   - 선택자 대소문자 무관, MutationObserver 로 필터/탭 재렌더 추적
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
    console.log.apply(console, ['[FAQ v8]'].concat(Array.prototype.slice.call(arguments)));
  }

  var QA_SEL   = '[class*="faq_qa" i]';
  var ANS_SEL  = '[class*="faq_answer" i]';
  var MORE_SEL = '[class*="faq-more" i]';
  var LINE_SEL = '[class*="faq_line" i]';                       // FAQ_Line 구분선
  var TEXT_SEL = '[class*="faq-a_full" i], [class*="faq_fa" i]'; // 상세 문단/내용

  /* 펼침 — 영역은 곧바로 열리고, 선만 아주 천천히 기다가 끝에서 팍! */
  var H_OPEN     = 'max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  var LINE_OPEN  = 'transform 0.7s cubic-bezier(0.85, 0, 0.92, 0.06)';          // 극단 easeIn: 천천히 기다가 팍
  var TEXT_OPEN  = 'opacity 0.4s ease, transform 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
  var TEXT_OPEN_DELAY = '0.52s';                                                // 선이 팍 그어진 뒤 문단 등장
  /* 접힘 (역순: 문단 → 선 → 높이) */
  var H_CLOSE    = 'max-height 0.42s cubic-bezier(0.7, 0, 0.84, 0)';            // 마지막에 팍 닫힘
  var LINE_CLOSE = 'transform 0.4s cubic-bezier(0.6, 0, 0.9, 0.2)';             // 가운데로 오므라듦
  var TEXT_CLOSE = 'opacity 0.2s ease, transform 0.26s cubic-bezier(0.5, 0, 0.75, 0)';
  var LINE_CLOSE_DELAY   = '0.13s';                                             // 문단 먼저 빠진 뒤 선
  var HEIGHT_CLOSE_DELAY = '0.24s';                                             // 선까지 오므라든 뒤 높이 닫힘

  function showEl(el) { if (el) el.style.removeProperty('display'); }
  function hideEl(el) { if (el) el.style.setProperty('display', 'none', 'important'); }

  function parts(a) {
    return {
      line: a.querySelector(LINE_SEL),
      text: a.querySelector('[class*="faq-a_full" i]') || a.querySelector('[class*="faq_fa" i]') || a.querySelector('p')
    };
  }

  /* 서브 요소 시작 상태(닫힘) 세팅 */
  function primeClosed(p) {
    if (p.line) { p.line.style.transition = 'none'; p.line.style.transitionDelay = '0s'; p.line.style.transformOrigin = 'center'; p.line.style.transform = 'scaleX(0)'; }
    if (p.text) { p.text.style.transition = 'none'; p.text.style.transitionDelay = '0s'; p.text.style.opacity = '0'; p.text.style.transform = 'translateY(10px)'; }
  }

  function closeAnswer(a, instant) {
    if (!a) return;
    a.__open = false;
    a.style.overflow = 'hidden';
    var p = parts(a);
    if (instant) {
      a.style.transition = 'none';
      a.style.transitionDelay = '0s';
      a.style.maxHeight = '0px';
      primeClosed(p);
      void a.offsetHeight;
      return;
    }
    // 높이 현재값 고정
    a.style.transition = 'none';
    a.style.transitionDelay = '0s';
    a.style.maxHeight = a.scrollHeight + 'px';
    void a.offsetHeight;

    // 역순: (1) 문단 먼저 빠짐
    if (p.text) {
      p.text.style.transition = TEXT_CLOSE;
      p.text.style.transitionDelay = '0s';
      p.text.style.opacity = '0';
      p.text.style.transform = 'translateY(10px)';
    }
    // (2) 선이 가운데로 오므라듦 (문단 뒤)
    if (p.line) {
      p.line.style.transition = LINE_CLOSE;
      p.line.style.transitionDelay = LINE_CLOSE_DELAY;
      p.line.style.transform = 'scaleX(0)';
    }
    // (3) 높이 닫힘 (마지막에 팍)
    a.style.transition = H_CLOSE;
    a.style.transitionDelay = HEIGHT_CLOSE_DELAY;
    a.style.maxHeight = '0px';
  }

  function openAnswer(a) {
    if (!a) return;
    a.__open = true;
    showEl(a);
    a.style.overflow = 'hidden';
    var p = parts(a);

    // 시작 상태 확정(닫힘)
    a.style.transition = 'none';
    a.style.transitionDelay = '0s';
    a.style.maxHeight = '0px';
    a.style.opacity = '1';
    primeClosed(p);
    void a.offsetHeight;

    var target = a.scrollHeight; // transform/opacity 는 레이아웃 높이에 영향 없음

    // (1) 영역(높이)은 곧바로 열림
    a.style.transition = H_OPEN;
    a.style.maxHeight = target + 'px';
    // (2) 구분선: 가운데→양쪽, 아주 천천히 기다가 끝에서 팍
    if (p.line) {
      p.line.style.transition = LINE_OPEN;
      p.line.style.transitionDelay = '0s';
      p.line.style.transform = 'scaleX(1)';
    }
    // (3) 문단: 선이 팍 그어진 뒤 fade + slide-in
    if (p.text) {
      p.text.style.transition = TEXT_OPEN;
      p.text.style.transitionDelay = TEXT_OPEN_DELAY;
      p.text.style.opacity = '1';
      p.text.style.transform = 'translateY(0)';
    }

    var done = function (e) {
      if (e && e.propertyName && e.propertyName !== 'max-height') return;
      if (a.__open) a.style.maxHeight = 'none'; // 펼침 후 내부 변화 자연 반영
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
      setState(it, false, true);
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
