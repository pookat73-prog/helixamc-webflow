/* ================================================================
   HELIX AMC — 일반용 FAQ '구분선 아코디언' (일반 목록 전용)

   페이지에 faq-list 가 2개(질환용/일반용). 클래스·data-faq-section 이
   동일해 CSS 로는 구분 불가. 하지만:
     - 질환용 카드(FAQ_QA 컴포넌트)에는 '자세히 보기'(.faq-more) 링크가 있고
     - 일반용 카드(FAQ(C) 컴포넌트)에는 없다.
   → '.faq-more 가 하나도 없는 faq-list' = 일반용. 그 목록에만
     data-faq-general + .helix-gfaq-* 마커를 달고 아코디언을 붙인다.
     질환용(faq_box)은 faq-stack.js 가 따로 처리 → 서로 안 겹침.

   일반용 카드 DOM (Webflow FAQ(C) 컴포넌트):
     (list) > (item, data-category) > .FAQ(C)_Q Box
                > .FAQ(C)_Q         > "Q." + h3.faq-q     ← 질문 행
                > .FAQ(C)_Answer AI > p.faq-a_Full        ← 답변

   동작: 평소 답변 숨김. 질문/+ 클릭 → 답 펼침(+→−). 아코디언(하나 열면
   나머지 닫힘). 박스 없이 얇은 구분선 + 옅은 왼쪽 세로선 답변(faq-general.css).

   디버그: URL 에 ?faq-general-debug=1
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqGeneralInit) return;
  window.__helixFaqGeneralInit = true;

  var DEBUG = /[?&]faq-general-debug=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ-General]'].concat(Array.prototype.slice.call(arguments)));
  }

  var LIST_SEL = '[class*="faq-list" i]';
  var MORE_SEL = '[class*="faq-more" i]';   // 질환용에만 있는 '자세히 보기' 링크
  var ANS_SEL  = '[class*="faq-a_full" i]'; // 답변 문단
  var Q_SEL    = '[class*="faq-q" i]';      // 질문 헤딩(h3.faq-q)

  var RECS = [];   // { item, box, qRow, answer, indicator }

  var PAGE_SIZE = 6;         // 한 페이지에 보여줄 질문 수
  var curPage = 1;
  var pagerEl = null;
  var generalListEl = null;

  var BOX_SEL = '[class*="faq_box" i]';   // 질환용 카드 클래스(일반용엔 없음)
  var QA_SEL  = '[class*="faq_qa" i]';    // 질환용 질문블록 클래스

  /* 일반용 목록 = 질환 신호(faq_box/faq_qa/faq-more) 전무 + faq-a_full 있음.
     Webflow 컴포넌트 지연 렌더로 잠깐 질환 목록을 오인하지 않게 신호를 여럿 본다. */
  function generalLists() {
    var out = [];
    var lists = document.querySelectorAll(LIST_SEL);
    for (var i = 0; i < lists.length; i++) {
      var l = lists[i];
      if (l.querySelector(BOX_SEL)) continue;       // 질환 카드(faq_box) → 제외
      if (l.querySelector(QA_SEL)) continue;        // 질환 질문블록(faq_qa) → 제외
      if (l.querySelector(MORE_SEL)) continue;      // '자세히 보기' → 제외
      if (!l.querySelector(ANS_SEL)) continue;      // 답변(faq-a_full) 없으면 제외
      out.push(l);
    }
    return out;
  }

  function setIndicator(rec, open) {
    if (rec.qRow) {
      rec.qRow.setAttribute('aria-expanded', open ? 'true' : 'false');
      rec.qRow.setAttribute('aria-label', open ? '답변 접기' : '답변 펼치기');
    }
  }
  function closeRec(r) {
    if (!r) return;
    r.item.classList.remove('is-open');
    setIndicator(r, false);
  }
  function openRec(rec) {
    RECS.forEach(function (r) { if (r !== rec) closeRec(r); });   // 아코디언
    rec.item.classList.add('is-open');
    setIndicator(rec, true);
  }
  function toggleRec(rec) {
    if (rec.item.classList.contains('is-open')) closeRec(rec);
    else { openRec(rec); ensureVisible(rec.item); }
  }

  /* 상단 고정 헤더 밑으로 카드가 다 보이도록 시야 이동(질환용과 동일 감각) */
  function headerBottom() {
    var h = document.querySelector('header.header') || document.querySelector('.header');
    if (h) { try { if (getComputedStyle(h).position === 'fixed') return h.getBoundingClientRect().bottom; } catch (e) {} }
    return 56;
  }
  function ensureVisible(item) {
    if (!item) return;
    setTimeout(function () {
      var guard = headerBottom() + 12;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var margin = 16;
      var r = item.getBoundingClientRect();
      var delta = 0;
      if (r.height >= vh - guard - margin) delta = r.top - guard;
      else if (r.bottom > vh - margin) delta = Math.min(r.bottom - (vh - margin), r.top - guard);
      else if (r.top < guard) delta = r.top - guard;
      if (Math.abs(delta) > 2) {
        try { window.scrollBy({ top: delta, behavior: 'smooth' }); }
        catch (e) { window.scrollBy(0, delta); }
      }
    }, 20);
  }

  /* +/− 인디케이터를 질문 행(qRow)의 마지막 플렉스 자식으로 붙임 */
  function buildIndicator(rec) {
    if (rec.indicator || !rec.qRow) return;
    var el = document.createElement('div');
    el.className = 'helix-gfaq-indicator';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="helix-gfaq-indicator__pm"></span>';
    rec.qRow.appendChild(el);
    rec.indicator = el;
  }

  function processItem(item) {
    if (item.__helixGfaq) return;
    var answer = item.querySelector(ANS_SEL);
    var qHead = item.querySelector(Q_SEL);
    if (!answer || !qHead) return;                  // 질문/답변 없으면 카드 아님
    item.__helixGfaq = true;

    var answerWrap = answer.parentElement || answer;   // .FAQ(C)_Answer AI
    var qRow = qHead.parentElement || qHead;           // .FAQ(C)_Q (질문 행)
    var box = qRow.parentElement || item;              // .FAQ(C)_Q Box

    item.classList.add('helix-gfaq-item');
    box.classList.add('helix-gfaq-box');
    qRow.classList.add('helix-gfaq-q');
    qHead.classList.add('helix-gfaq-qtext');
    answerWrap.classList.add('helix-gfaq-answer');

    /* 네이티브 'Q.' 마크(텍스트가 정확히 'Q'/'Q.')를 찾아 숨기고,
       내가 통제하는 뱃지를 질문 행 맨 앞에 새로 넣는다(원본 스타일 의존 X). */
    var nativeQ = null;
    var cand = qRow.querySelectorAll('*');
    for (var i = 0; i < cand.length; i++) {
      var c = cand[i];
      if (c === qHead || c.contains(qHead)) continue;
      if (/^q\.?$/i.test((c.textContent || '').trim())) { nativeQ = c; break; }
    }
    if (nativeQ) nativeQ.style.display = 'none';
    if (!qRow.querySelector('.helix-gfaq-qmark')) {
      var badge = document.createElement('span');
      badge.className = 'helix-gfaq-qmark';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = 'Q';
      qRow.insertBefore(badge, qRow.firstChild);
    }

    // 접근성: 질문 행을 버튼처럼
    qRow.setAttribute('role', 'button');
    qRow.setAttribute('tabindex', '0');
    qRow.setAttribute('aria-expanded', 'false');

    var rec = { item: item, box: box, qRow: qRow, answer: answerWrap, indicator: null };
    buildIndicator(rec);   // qRow 마지막에 +/− 붙임

    qRow.addEventListener('click', function (e) {
      var tt = e.target;
      if (tt && tt.closest && tt.closest('a, button')) return;
      toggleRec(rec);
    });
    qRow.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRec(rec); }
    });

    RECS.push(rec);
  }

  /* ── 페이징 (일반 목록 전용) ─────────────────────────────────────
     일반 목록은 필터가 없어 전체를 PAGE_SIZE 씩 끊어 페이지로 보여줌.
     pager 는 질환용과 동일 스타일(faq.css .faq-pager/.faq-page-btn 등) 재사용,
     일반 섹션의 'Pages' 슬롯에 렌더(없으면 목록 뒤에 생성). */
  function pageWindow(cur, total) {
    if (total <= 7) { var a = []; for (var i = 1; i <= total; i++) a.push(i); return a; }
    var out = [1], lo = Math.max(2, cur - 1), hi = Math.min(total - 1, cur + 1);
    if (lo > 2) out.push('…');
    for (var p = lo; p <= hi; p++) out.push(p);
    if (hi < total - 1) out.push('…');
    out.push(total);
    return out;
  }
  function findPagesSlot() {
    if (!generalListEl) return null;
    var scope = (generalListEl.closest && generalListEl.closest('section')) || generalListEl.parentElement;
    if (!scope) return null;
    var cand = scope.querySelectorAll('[class*="pages" i]');
    for (var i = 0; i < cand.length; i++) {
      if (!cand[i].contains(generalListEl) && !generalListEl.contains(cand[i])) return cand[i];
    }
    return null;
  }
  function goToPage(p) {
    curPage = p;
    applyPaging();
    try {
      var top = generalListEl.getBoundingClientRect().top + window.pageYOffset - (headerBottom() + 20);
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } catch (e) {}
  }
  function renderPager(totalPages) {
    if (!generalListEl) return;
    var sec = (generalListEl.closest && generalListEl.closest('section')) || null;
    // 안전장치: 일반 섹션(질환 카드 없음)에만 페이저를 둔다. 질환 섹션이면 취소.
    if (sec && sec.querySelector(BOX_SEL)) return;
    // 캐시된 pager 가 일반 섹션 밖(예: 질환 슬롯)이면 버리고 다시 찾음
    if (pagerEl && sec && !sec.contains(pagerEl)) pagerEl = null;
    if (!pagerEl) {
      pagerEl = findPagesSlot();
      if (pagerEl) { if (!/\bfaq-pager\b/.test(pagerEl.className)) pagerEl.className += ' faq-pager'; }
      else if (generalListEl && generalListEl.parentNode) {
        pagerEl = document.createElement('nav');
        pagerEl.className = 'faq-pager';
        generalListEl.parentNode.insertBefore(pagerEl, generalListEl.nextSibling);
      }
    }
    if (!pagerEl) return;
    pagerEl.innerHTML = '';
    pagerEl.setAttribute('aria-label', 'FAQ 페이지 이동');
    if (totalPages <= 1) return;
    function btn(label, page, opts) {
      opts = opts || {};
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'faq-page-btn' + (opts.cls ? ' ' + opts.cls : '');
      var lbl = document.createElement('span');
      lbl.className = 'faq-page-lbl';
      lbl.textContent = label;
      b.appendChild(lbl);
      if (opts.active) { b.classList.add('is-current'); b.setAttribute('aria-current', 'page'); }
      if (opts.disabled) b.disabled = true;
      else b.addEventListener('click', function (e) { e.preventDefault(); goToPage(page); });
      pagerEl.appendChild(b);
    }
    btn('‹', curPage - 1, { cls: 'faq-page-nav', disabled: curPage <= 1 });
    var win = pageWindow(curPage, totalPages);
    for (var i = 0; i < win.length; i++) {
      if (win[i] === '…') {
        var s = document.createElement('span'); s.className = 'faq-page-gap'; s.textContent = '…';
        pagerEl.appendChild(s);
      } else btn(String(win[i]), win[i], { active: win[i] === curPage });
    }
    btn('›', curPage + 1, { cls: 'faq-page-nav', disabled: curPage >= totalPages });
  }
  function applyPaging() {
    if (!generalListEl || !RECS.length) return;
    var totalPages = Math.max(1, Math.ceil(RECS.length / PAGE_SIZE));
    if (curPage > totalPages) curPage = totalPages;
    if (curPage < 1) curPage = 1;
    var start = (curPage - 1) * PAGE_SIZE, end = start + PAGE_SIZE;
    for (var i = 0; i < RECS.length; i++) {
      var on = (i >= start && i < end);
      RECS[i].item.style.display = on ? '' : 'none';
      if (!on) closeRec(RECS[i]);
    }
    renderPager(totalPages);
  }

  function process() {
    var lists = generalLists();
    var fresh = 0;
    for (var i = 0; i < lists.length; i++) {
      var list = lists[i];
      list.setAttribute('data-faq-general', '1');
      if (i === 0) generalListEl = list;   // 페이징 대상(첫 일반 목록) — 매번 갱신
      // 목록이 속한 섹션에 상단 여백 클래스(마진 겹침으로 어두운 body 노출 방지)
      var sec = list.closest ? list.closest('section') : null;
      if (sec) sec.classList.add('helix-gfaq-section');
      // 직속 자식(카드 항목) 순회
      var kids = list.children;
      for (var k = 0; k < kids.length; k++) {
        if (kids[k].nodeType !== 1) continue;
        if (!kids[k].__helixGfaq) { processItem(kids[k]); if (kids[k].__helixGfaq) fresh++; }
      }
    }
    if (fresh) log('일반용 카드', fresh, '개 처리 / 목록', lists.length, '개');
    applyPaging();   // 페이지 구간만 표시 + pager 렌더
    return lists.length;
  }

  /* 진단(디버그 전용): 화면에 보이는 '어두운 배경 + 넓은' 요소를 찾아 로그.
     검은 띠 정체 파악용. ?faq-general-debug=1 일 때만. */
  function diagnoseDark() {
    if (!DEBUG) return;
    try {
      var vw = window.innerWidth || 1000;
      var all = document.querySelectorAll('body *');
      var hits = [];
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var r = el.getBoundingClientRect();
        if (r.height < 16 || r.width < vw * 0.6) continue;      // 넓고 어느정도 높이만
        var cs = getComputedStyle(el);
        var bg = cs.backgroundColor || '';
        var m = bg.match(/rgba?\(([^)]+)\)/);
        if (!m) continue;
        var p = m[1].split(',').map(function (s) { return parseFloat(s); });
        var a = p.length > 3 ? p[3] : 1;
        if (a < 0.5) continue;                                   // 투명 제외
        var lum = 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
        if (lum > 60) continue;                                  // 밝으면 제외 → 어두운 것만
        hits.push({ cls: el.className || el.tagName, bg: bg, top: Math.round(r.top), h: Math.round(r.height) });
      }
      log('어두운 넓은 요소 후보:', hits);
    } catch (e) { log('diagnoseDark err', e); }
  }

  function start() {
    process();
    setTimeout(diagnoseDark, 800);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(process).catch(function () {});
    window.addEventListener('load', process);

    // Webflow 탭/목록 지연 렌더 대비 감시 + 폴백 폴링
    try {
      var mo = new MutationObserver(function () {
        if (mo.__t) return;
        mo.__t = setTimeout(function () { mo.__t = null; process(); }, 120);
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    var n = 0;
    var iv = setInterval(function () { process(); if (++n >= 12) clearInterval(iv); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
