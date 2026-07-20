/* ================================================================
   HELIX AMC — FAQ 카드 겹치기(스택) 실험 v1

   평소  : 카드가 겹쳐 쌓여 '질문만 빼꼼'
   호버  : 카드가 위로 떠오르며 답변이 아래로 펼쳐짐(미리보기)
   클릭  : 그 카드를 '열림'으로 고정 → 상세설명 계속 표시(다시 클릭 = 닫힘)

   기존 클릭 토글(faq.js)은 이 파일이 __helixFaqInit 를 선점해 자동 비활성.
   ⚠ 되돌리려면 faq/bootstrap.js FILES 에서 이 파일 + faq-stack.css 제거.

   디버그: URL 에 ?faq-stack-debug=1

   DOM(2026-07 개편):
     FAQ_Box                              ← 카드(.helix-faq-card)
       ├─ FAQ_QA (faq_qa)                 ← 질문(항상 빼꼼)
       └─ FAQ_Answer AI (faq_answer-ai)   ← 답변(오버레이로 펼침)
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqStackInit) return;
  window.__helixFaqStackInit = true;
  window.__helixFaqInit = true;   // 기존 faq.js(클릭 토글) 비활성화

  var DEBUG = /[?&]faq-stack-debug=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ-Stack]'].concat(Array.prototype.slice.call(arguments)));
  }

  var ANS_SEL = '[class*="faq_answer" i]';   // FAQ_Answer AI
  var Q_SEL   = '[class*="faq_qa" i]';       // FAQ_QA(질문)

  /* 답변 기준으로 카드(FAQ_Box)와 질문(FAQ_QA)을 찾는다.
     카드 = 답변을 담고, 답변 밖에 질문도 담고 있는 최초 상위. */
  function findCard(answer) {
    var node = answer;
    for (var i = 0; i < 5 && node && node.parentElement; i++) {
      var p = node.parentElement;
      var q = p.querySelector(Q_SEL);
      if (q && !answer.contains(q)) return { card: p, question: q };
      node = p;
    }
    return { card: answer.parentElement || answer, question: null };
  }

  /* 겹칠 때 아래 카드가 비치지 않도록 불투명 배경색을 위로 탐색 */
  function opaqueBg(el) {
    var n = el;
    for (var i = 0; i < 6 && n; i++) {
      var bg = getComputedStyle(n).backgroundColor;
      if (bg && bg !== 'transparent' && !/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(bg)) return bg;
      n = n.parentElement;
    }
    return '#0d1117';   // 사이트 기본 배경 폴백
  }

  /* Webflow IX2 인라인(초기 숨김/트랜스폼) 무력화 + 재바인딩 차단 */
  function neutralizeIX2(el) {
    if (!el) return;
    el.removeAttribute('data-w-id');
    ['opacity', 'transform', 'display', 'max-height', 'visibility'].forEach(function (p) {
      el.style.removeProperty(p);
    });
  }

  function isTransparent(bg) {
    return /rgba?\(0,0,0,0\)|transparent/.test((bg || '').replace(/\s/g, ''));
  }

  var CARDS = [];

  function processAnswer(answer) {
    if (answer.__faqStack) return null;
    var f = findCard(answer);
    var card = f.card;
    if (!card) return null;

    answer.__faqStack = true;
    card.__faqStack = true;

    var container = card.parentElement;
    if (container && !container.classList.contains('helix-faq-stack')) {
      container.classList.add('helix-faq-stack');
    }

    card.classList.add('helix-faq-card');
    answer.classList.add('helix-faq-answer');
    if (f.question) f.question.classList.add('helix-faq-q');

    neutralizeIX2(answer);
    neutralizeIX2(card);

    /* 카드/답변 배경 채우기(겹침 가독) */
    var bg = opaqueBg(card);
    if (isTransparent(getComputedStyle(card).backgroundColor)) card.style.background = bg;
    answer.style.background = bg;

    /* 클릭 → 열림 고정 토글. 단, 답변 안 링크/버튼(전화·복사·CTA)은 그대로 동작 */
    card.addEventListener('click', function (e) {
      if (e.target.closest('a, button, [role="button"], input, textarea')) return;
      card.classList.toggle('is-open');
      log('toggle is-open =', card.classList.contains('is-open'));
    });

    CARDS.push(card);
    return card;
  }

  /* 같은 컨테이너 안 카드들에 겹침(음수 margin) 부여 — 첫 카드는 제외 */
  function applyStacking() {
    var groups = {};
    CARDS.forEach(function (card) {
      var parent = card.parentElement;
      if (!parent) return;
      if (!parent.__faqGroupId) parent.__faqGroupId = 'g' + (++applyStacking.__n || (applyStacking.__n = 1));
      (groups[parent.__faqGroupId] = groups[parent.__faqGroupId] || []).push(card);
    });
    Object.keys(groups).forEach(function (gid) {
      var list = groups[gid];
      list.forEach(function (card, idx) {
        if (idx === 0) card.classList.remove('is-stacked');
        else card.classList.add('is-stacked');
      });
    });
  }

  function process() {
    var answers = document.querySelectorAll(ANS_SEL);
    var fresh = 0;
    for (var i = 0; i < answers.length; i++) {
      if (processAnswer(answers[i])) fresh++;
    }
    if (fresh) { applyStacking(); log('신규', fresh, '개 / 총', answers.length, '개'); }
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
