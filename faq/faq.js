/* ================================================================
   HELIX AMC — FAQ 자세히보기 / 간략히보기 토글 (v2.0)

   Webflow 실제 구조 (컴포넌트):
   - .faq_qa (FAQ_QA 컴포넌트)      : 질문 카드. 내부에 .faq-more 링크 2개
       · "자세히 보기 +"  (펼치기)
       · "간략히 보기 -"  (접기)
   - .faq_answer-ai (FAQ_Answer AI) : 상세 답변 = 펼침부분(질문과 별개 형제 요소)

   동작 (사용자 스펙)
   - 기본: 각 질문 뒤 .faq_answer-ai 숨김. "간략히 보기" 숨기고 "자세히 보기"만.
   - "자세히 보기" 클릭 → 그 질문에 짝지어진 .faq_answer-ai 노출 + 두 링크 교체
   - "간략히 보기" 클릭 → .faq_answer-ai 숨김 + 두 링크 교체(원위치)

   접힘/펼침 상태는 Webflow 에서 이미 디자인됨 → JS 는 보이기/숨기기만. 애니 없음.
   디버그: URL 에 ?debug-faq=1
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqInit) return;
  window.__helixFaqInit = true;

  var DEBUG = /[?&]debug-faq=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ]'].concat(Array.prototype.slice.call(arguments)));
  }

  var QA_SEL     = '.faq_qa';
  var ANSWER_SEL = '[class*="faq_answer"]'; // faq_answer-ai (또는 faq_answer)
  var MORE_SEL   = '.faq-more';

  /* 질문↔답변 짝짓기: .faq_qa 와 답변을 문서 순서로 훑어, 각 질문 뒤 첫 답변을
     짝지음. (질문/답변이 별개 형제 인스턴스인 구조에 맞음) */
  function collectPairs() {
    var nodes = document.querySelectorAll(QA_SEL + ',' + ANSWER_SEL);
    var pairs = [];
    var pendingQ = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var isQ = n.matches(QA_SEL);
      var isA = n.matches(ANSWER_SEL);
      if (isA && !isQ) {
        if (pendingQ) { pairs.push({ qa: pendingQ, answer: n }); pendingQ = null; }
      } else if (isQ) {
        pendingQ = n;
      }
    }
    return pairs;
  }

  /* 질문 카드 안의 자세히/간략히 링크 찾기 (텍스트로 구분) */
  function findLinks(qa) {
    var links = qa.querySelectorAll(MORE_SEL);
    var expand = null, collapse = null;
    for (var i = 0; i < links.length; i++) {
      var t = (links[i].textContent || '').replace(/\s+/g, '');
      if (!expand && /자세히/.test(t)) expand = links[i];
      else if (!collapse && /간략히|간략/.test(t)) collapse = links[i];
    }
    // 텍스트 매칭 실패 대비: 순서 기반 폴백(첫째 자세히, 둘째 간략히)
    if (!expand && links[0]) expand = links[0];
    if (!collapse && links[1]) collapse = links[1];
    return { expand: expand, collapse: collapse, all: links };
  }

  function setOpen(item, open) {
    if (item.answer) item.answer.classList.toggle('is-open', open);
    if (item.expand)   item.expand.classList.toggle('is-hidden', open);   // 펼치면 자세히 숨김
    if (item.collapse) item.collapse.classList.toggle('is-hidden', !open); // 펼치면 간략히 노출
    if (item.expand)   item.expand.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.open = open;
  }

  function bind(item) {
    if (item.expand) {
      item.expand.addEventListener('click', function (e) {
        e.preventDefault();
        setOpen(item, true);
      });
    }
    if (item.collapse) {
      item.collapse.addEventListener('click', function (e) {
        e.preventDefault();
        setOpen(item, false);
      });
    }
  }

  function init() {
    var pairs = collectPairs();
    // 질문은 있는데 답변 짝이 하나도 없으면 아직 렌더 전 → 대기
    var qaCount = document.querySelectorAll(QA_SEL).length;
    if (!qaCount) { return false; }

    document.documentElement.classList.add('faq-js-ready');

    // 답변이 아직 없더라도 질문 카드의 링크 초기화는 진행
    var items = pairs.map(function (p) {
      var lk = findLinks(p.qa);
      return { qa: p.qa, answer: p.answer, expand: lk.expand, collapse: lk.collapse, open: false };
    });

    // 짝을 못 찾은 질문(답변 없는)도 링크만이라도 초기화
    var pairedQa = items.map(function (it) { return it.qa; });
    document.querySelectorAll(QA_SEL).forEach(function (qa) {
      if (pairedQa.indexOf(qa) !== -1) return;
      var lk = findLinks(qa);
      items.push({ qa: qa, answer: null, expand: lk.expand, collapse: lk.collapse, open: false });
    });

    items.forEach(function (item) {
      setOpen(item, false); // 기본: 답변 숨김 + 간략히 숨김 + 자세히 노출
      bind(item);
    });

    log('초기화 완료 — 질문', qaCount, '개 / 답변 짝', pairs.length, '개');
    return true;
  }

  function boot() {
    if (init()) return;
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (init() || tries >= 20) clearInterval(iv); // 최대 ~5초
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
