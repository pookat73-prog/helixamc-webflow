/* ================================================================
   HELIX AMC — FAQ 아코디언 + 자세히보기/간략히보기 토글 (v1.0)

   담당 동작 두 가지
   1) 폇다 접었다 : .faq_qa(질문) 클릭 → 짝지어진 .faq_answer(답변) 펼침/접힘
      - "펼침부분(답변)은 질문과 별개 요소" 라는 구조를 전제로,
        문서 순서상 각 질문 바로 다음에 오는 답변을 자동으로 짝지음.
        (형제/자식/중첩 어느 구조든 동작)
   2) 자세히보기 / 간략히보기 : 답변 텍스트를 몇 줄만 보여주고(줄 제한),
      넘칠 때만 '자세히보기' 노출 → 클릭 시 전체 펼침 + '간략히보기' 로 전환.
      - 컴포넌트에 이미 토글 요소가 있으면(클래스 .faq_more / [data-faq-more]
        또는 '자세히보기' 텍스트) 그걸 찾아 연결, 없으면 버튼을 주입.

   설정 오버라이드: window.HELIX_FAQ_CONFIG = { clampLines: 3, singleOpen: false }
   디버그: URL 에 ?debug-faq=1
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqInit) return;
  window.__helixFaqInit = true;

  var CFG = Object.assign({
    clampLines: 3,       // 자세히보기 접힘 시 노출 줄 수
    singleOpen: false,   // true 면 한 번에 하나만 펼침(아코디언)
    moreLabel: '자세히보기',
    lessLabel: '간략히보기'
  }, window.HELIX_FAQ_CONFIG || {});

  var DEBUG = /[?&]debug-faq=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    var a = ['[FAQ]'].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, a);
  }

  /* ── 질문/답변 짝짓기 ─────────────────────────────────────────
     .faq_qa 와 .faq_answer 를 문서 순서로 훑어, 각 질문 뒤 첫 답변을 짝지음.
     중첩(답변이 질문 자식)일 때도 querySelectorAll 문서 순서상 질문이 먼저
     나오므로 그대로 짝지어짐. */
  function collectPairs() {
    var nodes = document.querySelectorAll('.faq_qa, .faq_answer');
    var pairs = [];
    var pendingQ = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var isA = n.classList.contains('faq_answer');
      var isQ = n.classList.contains('faq_qa');
      // 답변 안에 또 다른 질문이 들어가는 비정상 케이스 방지: 답변 우선 판정
      if (isA) {
        if (pendingQ) { pairs.push({ qa: pendingQ, answer: n }); pendingQ = null; }
      } else if (isQ) {
        pendingQ = n;
      }
    }
    return pairs;
  }

  /* 질문+답변이 같은 부모를 공유하면 그 부모(=아이템 래퍼)도 반환 */
  function itemWrapperOf(qa, answer) {
    if (qa.parentElement && qa.parentElement === answer.parentElement) {
      return qa.parentElement;
    }
    return null;
  }

  /* 답변 내 '자세히보기' 대상 텍스트 요소 찾기(버튼 주입 위치 기준) */
  function findClampTarget(answer) {
    return answer.querySelector(
      '[data-faq-text], .faq_answer_text, .faq-answer-text, .faq_answer-text, .faq_text, .w-richtext'
    ) || answer.querySelector('p') || answer;
  }

  /* 컴포넌트에 이미 존재하는 '자세히보기' 토글 요소 탐지 */
  function findExistingMore(answer, wrapper) {
    var scopes = [answer];
    if (wrapper) scopes.push(wrapper);
    for (var s = 0; s < scopes.length; s++) {
      var byClass = scopes[s].querySelector('[data-faq-more], .faq_more, .faq-more, .faq_detail-toggle');
      if (byClass) return byClass;
    }
    // 텍스트로 탐지 ('자세히' 포함, 단 자기 자신이 답변 본문 전체는 아님)
    for (var t = 0; t < scopes.length; t++) {
      var cands = scopes[t].querySelectorAll('a, button, div, span');
      for (var i = 0; i < cands.length; i++) {
        var txt = (cands[i].textContent || '').trim();
        if ((txt === CFG.moreLabel || txt === CFG.lessLabel || /^자세히/.test(txt)) &&
            txt.length <= 8) {
          return cands[i];
        }
      }
    }
    return null;
  }

  /* ── 펼침/접힘 애니메이션 제어 ───────────────────────────────── */
  function openAnswer(item) {
    var a = item.answer;
    a.classList.add('faq-anim');
    a.classList.remove('is-collapsed');
    // 현재 높이에서 목표 높이로
    a.style.maxHeight = a.scrollHeight + 'px';
    a.style.opacity = '1';
    // 트랜지션 종료 후 max-height:none → 내부(자세히보기 등) 변화가 자연 반영
    var done = function (e) {
      if (e && e.propertyName && e.propertyName !== 'max-height') return;
      if (!item.qa.classList.contains('is-open')) return; // 그 사이 닫혔으면 무시
      a.style.maxHeight = 'none';
      a.removeEventListener('transitionend', done);
    };
    a.addEventListener('transitionend', done);
    setOpenState(item, true);
  }

  function closeAnswer(item) {
    var a = item.answer;
    a.classList.add('faq-anim');
    // max-height:none → 실제 픽셀값으로 고정한 뒤 0 으로(트랜지션 발동)
    if (a.style.maxHeight === 'none' || a.style.maxHeight === '') {
      a.style.maxHeight = a.scrollHeight + 'px';
    }
    // 강제 reflow
    void a.offsetHeight;
    a.classList.add('is-collapsed');
    a.style.maxHeight = '0px';
    a.style.opacity = '0';
    setOpenState(item, false);
  }

  function setOpenState(item, open) {
    item.qa.classList.toggle('is-open', open);
    item.answer.classList.toggle('is-open', open);
    if (item.wrapper) item.wrapper.classList.toggle('is-open', open);
    item.qa.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function toggleItem(item, allItems) {
    var willOpen = !item.qa.classList.contains('is-open');
    if (willOpen && CFG.singleOpen) {
      allItems.forEach(function (other) {
        if (other !== item && other.qa.classList.contains('is-open')) closeAnswer(other);
      });
    }
    if (willOpen) openAnswer(item); else closeAnswer(item);
  }

  /* ── 자세히보기 토글 세팅 ────────────────────────────────────── */
  function setupReadMore(item) {
    if (CFG.clampLines <= 0) return;
    var target = findClampTarget(item.answer);
    if (!target) return;

    // 대상에 줄 수 변수 세팅 후 클램프 적용
    target.style.setProperty('--faq-clamp', String(CFG.clampLines));
    target.classList.add('faq-clamp');

    // 넘치는지 판정(클램프 상태의 clientHeight < 실제 scrollHeight)
    var overflowing = target.scrollHeight - target.clientHeight > 2;
    if (!overflowing) {
      target.classList.remove('faq-clamp'); // 짧으면 클램프 불필요
      item.readMore = null;
      log('read-more: 짧음, 스킵');
      return;
    }

    var btn = findExistingMore(item.answer, item.wrapper);
    var injected = false;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'faq-more-btn';
      btn.innerHTML = '<span class="faq-more-label"></span><span class="faq-more-caret" aria-hidden="true">⌄</span>';
      target.insertAdjacentElement('afterend', btn);
      injected = true;
    }
    var labelEl = btn.querySelector('.faq-more-label') || btn;

    function paint(expanded) {
      if (labelEl === btn && !injected) {
        // 기존 요소: 텍스트만 교체
        btn.textContent = expanded ? CFG.lessLabel : CFG.moreLabel;
      } else {
        labelEl.textContent = expanded ? CFG.lessLabel : CFG.moreLabel;
      }
      btn.classList.toggle('is-expanded', expanded);
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
    paint(false);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation(); // 아코디언 접힘 방지
      var expanded = target.classList.toggle('faq-clamp') === false;
      paint(expanded);
      // 답변이 열려 있으면 높이 재계산(max-height:none 상태면 자동 반영)
      if (item.qa.classList.contains('is-open') && item.answer.style.maxHeight !== 'none') {
        item.answer.style.maxHeight = item.answer.scrollHeight + 'px';
      }
    });

    item.readMore = { btn: btn, target: target };
    log('read-more: 활성', injected ? '(버튼 주입)' : '(기존 요소 연결)');
  }

  /* ── 질문 클릭/키보드 바인딩 ─────────────────────────────────── */
  function bindItem(item, allItems) {
    var qa = item.qa;
    if (!qa.hasAttribute('role')) qa.setAttribute('role', 'button');
    if (!qa.hasAttribute('tabindex')) qa.setAttribute('tabindex', '0');
    qa.setAttribute('aria-expanded', 'false');
    if (item.answer.id) qa.setAttribute('aria-controls', item.answer.id);

    qa.addEventListener('click', function (e) {
      // 질문 안의 실제 링크/버튼(화살표 제외) 클릭은 그대로 두고 토글 안 함
      var interactive = e.target && e.target.closest
        ? e.target.closest('a[href], button')
        : null;
      if (interactive && qa.contains(interactive) &&
          !interactive.classList.contains('faq-arrow') &&
          !interactive.hasAttribute('data-faq-arrow')) {
        return;
      }
      toggleItem(item, allItems);
    });

    qa.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggleItem(item, allItems);
      }
    });
  }

  /* ── 초기화 ──────────────────────────────────────────────────── */
  function init() {
    var pairs = collectPairs();
    if (!pairs.length) { log('faq_qa/faq_answer 짝 없음 — 대기'); return false; }

    document.documentElement.classList.add('faq-js-ready');

    var items = pairs.map(function (p) {
      return { qa: p.qa, answer: p.answer, wrapper: itemWrapperOf(p.qa, p.answer), readMore: null };
    });

    items.forEach(function (item) {
      // 초기: 접힘(애니 없이 즉시) — .faq-anim 은 첫 토글부터
      setupReadMore(item);
      item.answer.classList.add('is-collapsed');
      item.answer.style.maxHeight = '0px';
      item.answer.style.opacity = '0';
      setOpenState(item, false);
      bindItem(item, items);
    });

    log('초기화 완료 — 아이템', items.length, '개', CFG);
    return true;
  }

  /* Webflow 렌더 타이밍 대비: 즉시 시도 → 실패 시 잠깐 재시도/관찰 */
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
