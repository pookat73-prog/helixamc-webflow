/* ================================================================
   HELIX AMC — FAQ 필터 (v1)

   Webflow '질환으로 보기' 탭 콘텐츠 안의 필터 칩들을, FAQ 항목에 이미
   박혀 있는 커스텀 어트리뷰트로 연결한다.

   Webflow 구조 (2026-07):
     .faq-filter        (그룹 래퍼)  → 안에 .faq-filter-label (SPECIES / FIELD)
     .faq-filter-opts   (그룹의 칩 묶음, .faq-filter 바로 다음 형제)
       .faq-chip        (필터 칩)      → 텍스트 = 필터값, .faq-num = 개수(정적)
       .faq-chip_reset  (그룹 초기화)  → "↻ 초기화"
     .faq-list > .faq_q (질문 항목)   → data-species / data-category / data-dept / data-specialty

   라벨 → 어트리뷰트 매핑:
     SPECIES → data-species   (강아지 / 고양이)
     FIELD   → data-category  (관절·보행·신경, 심장·호흡기 …, 콤마 다중값 가능)

   동작 (사용자 확정):
     - 그룹(문단) 내 단일 선택: 한 그룹에서는 칩 하나만 활성. 다른 칩을 누르면
       그 그룹의 기존 선택은 해제되고 새 칩이 켜짐(같은 그룹 중복 선택 불가)
     - 그룹끼리는 AND: SPECIES 선택 그리고 FIELD 선택을 모두 만족해야 표시
     - 아무 칩도 안 켜진 그룹은 조건 없음(전체 통과)
     - 켜진 칩 다시 클릭 → 해제. .faq-chip_reset → 그 그룹 해제
     - '일반으로 보기' 탭의 칩 묶음은 라벨(.faq-filter) 래퍼가 없어 자동 제외

   페이징:
     - 항목을 8개씩 끊어서 페이지로 표시. 필터가 걸리면 '통과한 항목'만
       다시 8개씩 페이징. 필터 바꾸면 1페이지로 리셋.
     - 페이지 번호는 Webflow 에 마련된 슬롯(.pages, 목록 뒤 형제)에 렌더.
       슬롯이 없으면 목록 뒤에 직접 생성(폴백).

   숫자(.faq-num)는 Webflow 정적 텍스트 그대로 둔다(재계산 안 함).

   디버그: URL 에 ?debug-faq=1
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqFilterInit) return;
  window.__helixFaqFilterInit = true;

  var DEBUG = /[?&]debug-faq=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ filter v1]'].concat(Array.prototype.slice.call(arguments)));
  }

  var LIST_SEL  = '[class*="faq-list" i]';
  var OPTS_SEL  = '[class*="faq-filter-opts" i]';
  var LABEL_SEL = '[class*="faq-filter-label" i]';
  var CHIP_SEL  = '[class*="faq-chip" i]';        // faq-chip + faq-chip_reset 둘 다 매칭
  var RESET_SEL = '[class*="faq-chip_reset" i]';
  var NUM_SEL   = '[class*="faq-num" i]';

  function isReset(el) { return /faq-chip_reset/i.test(el.className || ''); }

  /* 라벨 텍스트 → 항목 어트리뷰트 */
  function attrForLabel(txt) {
    var t = (txt || '').toUpperCase();
    if (t.indexOf('SPECIES') >= 0) return 'data-species';
    if (t.indexOf('FIELD')   >= 0) return 'data-category';
    return null;
  }

  /* 칩의 필터값 = 칩 텍스트에서 개수(.faq-num) 텍스트 제거 */
  function chipValue(chip) {
    var t = chip.textContent || '';
    var num = chip.querySelector(NUM_SEL);
    if (num && num.textContent) t = t.replace(num.textContent, '');
    return t.replace(/\s+/g, ' ').trim();
  }

  /* 항목 어트리뷰트를 콤마 분리 → 트림 배열 */
  function attrValues(el, attr) {
    var raw = el.getAttribute(attr) || '';
    if (!raw) return [];
    return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  var GROUPS = [];   // { attr, active: {} , reset }
  var listEl = null;
  var emptyEl = null;
  var filterRegionEls = [];   // 필터 영역(라벨+칩묶음) — 화면에서 가려졌는지 판정용
  var pinnedEl = null;        // 선택 필터 상단 고정 표시

  var PAGE_SIZE   = 5;    // 한 페이지에 보여줄 질문 수
  var currentPage = 1;
  var pagerEl     = null;

  function items() {
    if (!listEl) return [];
    return Array.prototype.filter.call(listEl.children, function (el) {
      return el.nodeType === 1 && el.hasAttribute('data-category');
    });
  }

  function anyActive() {
    for (var i = 0; i < GROUPS.length; i++) {
      for (var k in GROUPS[i].active) { if (GROUPS[i].active[k]) return true; }
    }
    return false;
  }

  /* 필터를 통과한 항목이면 true (표시 대상). 페이징은 별도. */
  function matchesFilter(it) {
    for (var g = 0; g < GROUPS.length; g++) {
      var grp = GROUPS[g];
      var wanted = [];
      for (var v in grp.active) { if (grp.active[v]) wanted.push(v); }
      if (!wanted.length) continue;                 // 조건 없는 그룹 통과
      var have = attrValues(it, grp.attr);
      var hit = false;
      for (var w = 0; w < wanted.length; w++) {
        if (have.indexOf(wanted[w]) >= 0) { hit = true; break; }   // OR
      }
      if (!hit) return false;                        // 그룹끼리 AND
    }
    return true;
  }

  function apply() {
    var its = items();

    // 1) 필터 통과 항목 추리기
    var matched = [];
    for (var i = 0; i < its.length; i++) {
      if (matchesFilter(its[i])) matched.push(its[i]);
    }

    // 2) 페이지 범위 보정 (필터로 페이지 수가 줄면 마지막 페이지로 당김)
    var totalPages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    var startIdx = (currentPage - 1) * PAGE_SIZE;
    var endIdx   = startIdx + PAGE_SIZE;

    // 3) 필터 통과 + 현재 페이지 구간만 표시, 나머지 숨김
    var mi = 0;
    for (var k = 0; k < its.length; k++) {
      var it = its[k];
      var ok = matchesFilter(it);
      var onPage = ok && (mi >= startIdx && mi < endIdx);
      if (ok) mi++;
      it.style.display = onPage ? '' : 'none';
    }

    updateEmpty(matched.length === 0 && anyActive());
    renderPager(totalPages);
    updatePinned();   // 선택 필터 상단 고정 표시 갱신
    log('apply → 매칭', matched.length, '/ 페이지', currentPage, '/', totalPages);
  }

  /* ── 페이지네이션 ─────────────────────────────────────────────── */
  function ensurePager() {
    if (pagerEl) return pagerEl;
    // Webflow 에 미리 마련된 슬롯(.pages, 목록 뒤 형제)을 우선 사용.
    var slot = null, n = listEl ? listEl.nextElementSibling : null;
    while (n) {
      var cls = (n.getAttribute('class') || '').toLowerCase().split(/\s+/);
      if (cls.indexOf('pages') >= 0) { slot = n; break; }
      n = n.nextElementSibling;
    }
    if (slot) {
      pagerEl = slot;
      if (!/\bfaq-pager\b/.test(pagerEl.className)) pagerEl.className += ' faq-pager';
    } else {
      // 폴백: 슬롯이 없으면 목록 뒤에 직접 생성
      pagerEl = document.createElement('nav');
      pagerEl.className = 'faq-pager';
      if (listEl && listEl.parentNode) listEl.parentNode.insertBefore(pagerEl, listEl.nextSibling);
      else if (listEl) listEl.appendChild(pagerEl);
    }
    pagerEl.setAttribute('aria-label', 'FAQ 페이지 이동');
    return pagerEl;
  }

  function goToPage(p) {
    currentPage = p;
    apply();
    // 페이지 바뀌면 목록 상단이 보이게 스크롤 (초기 로드 땐 호출 안 됨)
    try {
      var top = listEl.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    } catch (e) {}
  }

  /* 표시할 페이지 번호 목록(현재 주변 + 처음/끝, 생략은 '…') */
  function pageWindow(cur, total) {
    if (total <= 7) {
      var all = [];
      for (var i = 1; i <= total; i++) all.push(i);
      return all;
    }
    var out = [1];
    var lo = Math.max(2, cur - 1), hi = Math.min(total - 1, cur + 1);
    if (lo > 2) out.push('…');
    for (var p = lo; p <= hi; p++) out.push(p);
    if (hi < total - 1) out.push('…');
    out.push(total);
    return out;
  }

  function renderPager(totalPages) {
    ensurePager();
    pagerEl.innerHTML = '';
    // 페이지가 1개뿐이면 버튼만 비우고 슬롯은 그대로 둔다(display:none 금지).
    // 슬롯을 없애면 그 높이만큼 아래 여백이 사라져 레이아웃이 위로 당겨짐.
    // CSS 의 min-height 가 빈 상태에서도 같은 높이를 예약해 여백을 유지.
    if (totalPages <= 1) return;

    function btn(label, page, opts) {
      opts = opts || {};
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'faq-page-btn' + (opts.cls ? ' ' + opts.cls : '');
      // 숫자는 span 으로 감싼다 — 선택 페이지 하이라이터가 글자 폭에 맞게 깔리도록
      var lbl = document.createElement('span');
      lbl.className = 'faq-page-lbl';
      lbl.textContent = label;
      b.appendChild(lbl);
      if (opts.active) { b.classList.add('is-current'); b.setAttribute('aria-current', 'page'); }
      if (opts.disabled) { b.disabled = true; }
      else { b.addEventListener('click', function (e) { e.preventDefault(); goToPage(page); }); }
      pagerEl.appendChild(b);
    }

    btn('‹', currentPage - 1, { cls: 'faq-page-nav', disabled: currentPage <= 1 });
    var win = pageWindow(currentPage, totalPages);
    for (var i = 0; i < win.length; i++) {
      if (win[i] === '…') {
        var s = document.createElement('span');
        s.className = 'faq-page-gap';
        s.textContent = '…';
        pagerEl.appendChild(s);
      } else {
        btn(String(win[i]), win[i], { active: win[i] === currentPage });
      }
    }
    btn('›', currentPage + 1, { cls: 'faq-page-nav', disabled: currentPage >= totalPages });
  }

  function updateEmpty(showEmpty) {
    if (!listEl) return;
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'faq-empty';
      emptyEl.textContent = '선택한 조건에 해당하는 질문이 없습니다.';
      listEl.appendChild(emptyEl);
    }
    emptyEl.style.display = showEmpty ? 'block' : 'none';
  }

  /* ── 선택 필터 상단 고정 표시 ──────────────────────────────────
     스크롤이 올라가 필터 칩 영역이 헤더 밑으로 사라지면, '지금 어떤 필터가
     켜져 있는지'를 화면 상단에 고정으로 보여줌(눌러 필터로 되돌아가기). */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function headerBottom() {
    var h = document.querySelector('header.header') || document.querySelector('.header');
    if (h) { try { if (getComputedStyle(h).position === 'fixed') return h.getBoundingClientRect().bottom; } catch (e) {} }
    return 56;
  }
  function filterBottom() {
    var b = 0;
    for (var i = 0; i < filterRegionEls.length; i++) {
      var el = filterRegionEls[i];
      if (!el || !el.getBoundingClientRect) continue;
      var r = el.getBoundingClientRect();
      if (r.bottom > b) b = r.bottom;
    }
    return b;
  }
  function activeSummary() {
    var parts = [];
    for (var g = 0; g < GROUPS.length; g++) {
      for (var v in GROUPS[g].active) { if (GROUPS[g].active[v]) parts.push(v); }
    }
    return parts;
  }
  function firstFilterEl() {
    var top = null, topY = Infinity;
    for (var i = 0; i < filterRegionEls.length; i++) {
      var r = filterRegionEls[i].getBoundingClientRect();
      if (r.top < topY) { topY = r.top; top = filterRegionEls[i]; }
    }
    return top;
  }
  function buildPinned() {
    if (pinnedEl) return pinnedEl;
    pinnedEl = document.createElement('div');
    pinnedEl.className = 'faq-pinned-filter';
    pinnedEl.setAttribute('role', 'status');
    pinnedEl.style.display = 'none';
    pinnedEl.title = '필터로 이동';
    pinnedEl.addEventListener('click', function () {
      var f = firstFilterEl();
      if (!f) return;
      try {
        var y = f.getBoundingClientRect().top + window.pageYOffset - (headerBottom() + 10);
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      } catch (e) {}
    });
    document.body.appendChild(pinnedEl);
    return pinnedEl;
  }
  function updatePinned() {
    buildPinned();
    var parts = activeSummary();
    if (!parts.length) { pinnedEl.style.display = 'none'; return; }
    pinnedEl.innerHTML = '<span class="faq-pinned-filter__label">선택된 필터</span>' +
      parts.map(function (p) { return '<span class="faq-pinned-filter__chip">' + escapeHtml(p) + '</span>'; }).join('');
    syncPinnedVisibility();
  }
  function syncPinnedVisibility() {
    if (!pinnedEl) return;
    var covered = filterBottom() <= headerBottom() + 4;   // 필터 영역이 헤더 밑으로 사라짐
    var show = activeSummary().length > 0 && covered;
    pinnedEl.style.top = headerBottom() + 'px';
    pinnedEl.style.display = show ? '' : 'none';
  }
  var scrollRaf = null;
  function onScrollResize() {
    if (scrollRaf) return;
    scrollRaf = (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(function () {
      scrollRaf = null;
      syncPinnedVisibility();
    });
  }
  // faq-stack.js 가 카드 펼침 시 시야 이동에 쓸 '고정필터 높이' 노출
  window.__helixFaqPinnedH = function () {
    if (!activeSummary().length) return 0;
    if (pinnedEl) { var h = pinnedEl.getBoundingClientRect().height; if (h) return h; }
    return 44;
  };

  function isLabel(el) { return /faq-filter-label/i.test(el.className || ''); }

  function bindGroup(optsEl, attr) {
    var group = { attr: attr, active: {}, chips: [] };
    GROUPS.push(group);

    var chips = optsEl.querySelectorAll(CHIP_SEL);
    for (var i = 0; i < chips.length; i++) {
      (function (chip) {
        if (isReset(chip)) {
          chip.addEventListener('click', function (e) {
            e.preventDefault();
            group.active = {};
            for (var j = 0; j < group.chips.length; j++) group.chips[j].classList.remove('is-on');
            currentPage = 1;               // 필터 바뀌면 1페이지부터
            apply();
          });
          return;
        }
        var val = chipValue(chip);
        if (!val) return;
        group.chips.push(chip);
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', function (e) {
          e.preventDefault();
          var wasOn = !!group.active[val];
          // 같은 그룹(문단) 안에서는 단일 선택 — 나머지 칩 모두 해제
          group.active = {};
          for (var j = 0; j < group.chips.length; j++) {
            group.chips[j].classList.remove('is-on');
            group.chips[j].setAttribute('aria-pressed', 'false');
          }
          if (!wasOn) {                    // 켜져 있던 걸 다시 누르면 해제(토글)
            group.active[val] = true;
            chip.classList.add('is-on');
            chip.setAttribute('aria-pressed', 'true');
          }
          currentPage = 1;                 // 필터 바뀌면 1페이지부터
          apply();
        });
      })(chips[i]);
    }
    log('그룹 연결', attr, '칩', group.chips.length, '개');
  }

  function build() {
    listEl = document.querySelector(LIST_SEL);
    // 라벨 + 칩묶음을 '문서 순서'로 훑는다. 라벨(SPECIES/FIELD)이 나오면
    // 바로 다음 칩묶음(opts)을 그 라벨의 그룹으로 짝짓는다. Quick Stack Cell
    // 래핑에 흔들리지 않고, 라벨이 앞서지 않는 '일반 탭' 칩묶음은 자동 제외됨.
    var seq = document.querySelectorAll(LABEL_SEL + ',' + OPTS_SEL);
    if (!listEl || !seq.length) return false;

    GROUPS = [];
    filterRegionEls = [];
    var pending = null, pendingLabel = null;
    for (var i = 0; i < seq.length; i++) {
      var el = seq[i];
      if (isLabel(el)) {
        pending = attrForLabel(el.textContent);
        pendingLabel = el;
      } else if (pending) {         // 라벨 직후의 칩묶음
        bindGroup(el, pending);
        if (pendingLabel) filterRegionEls.push(pendingLabel);
        filterRegionEls.push(el);   // 필터 영역 = 라벨 + 칩묶음 (가림 판정용)
        pending = null;
        pendingLabel = null;
      }
    }
    if (!GROUPS.length) return false;

    apply();
    return true;
  }

  function start() {
    window.addEventListener('scroll', onScrollResize, { passive: true });
    window.addEventListener('resize', onScrollResize);
    if (build()) {
      log('필터 준비 완료 — 그룹', GROUPS.length, '개');
      return;
    }
    // Webflow 탭/목록이 늦게 렌더될 수 있어 잠깐 재시도
    var n = 0;
    var iv = setInterval(function () {
      if (build() || ++n >= 20) {
        clearInterval(iv);
        if (GROUPS.length) log('필터 지연 준비 완료 — 그룹', GROUPS.length, '개');
        else log('필터 요소를 찾지 못함 (칩/목록 없음)');
      }
    }, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* ================================================================
   질환 탭 활성 시에만 '별도로 뺀 섹션' 표시 토글
   ----------------------------------------------------------------
   구조: 탭(질환/일반)은 Section A(WhiteFrame for List) 안에 있고, Webflow
   기본 탭은 그 안의 패널만 자동으로 켜고 끔. 사용자가 faq 목록을 별도
   Section B(WhiteFrame for List_connect = faq-list+페이징+CTA)로 빼서,
   기본 탭은 Section B 를 못 건드림.
   → '질환으로 보기' 탭이 활성일 때만 Section B 를 보이고, '일반으로 보기'
     땐 숨긴다. (일반 콘텐츠는 Section A 안 패널에서 기본 탭이 표시)

   탭 판별: '질환' 탭 링크는 안쪽 글자 요소가 .faq_tab-name (일반 탭은
   .text-block-366). 그 글자를 품은 .w-tab-link 가 .w--current 면 질환 활성.
   섹션 판별: 클래스에 list_connect 포함(WhiteFrame for List_connect).
   ================================================================ */
(function () {
  'use strict';

  function diseaseTabLink() {
    var name = document.querySelector('.faq_tab-name');
    return name && name.closest ? name.closest('.w-tab-link') : null;
  }
  function sectionB() {
    // 1순위: 안정적 커스텀 속성(REST 로 박아둠, Publish 후 사이트에 반영)
    // 2순위: 폴백 — Publish 전이거나 속성 없을 때 클래스명으로
    return document.querySelector('[data-faq-section="disease-list"]')
        || document.querySelector('[class*="list_connect" i]');
  }
  function sync() {
    var sec = sectionB(), tab = diseaseTabLink();
    if (!sec || !tab) return false;
    var on = tab.classList.contains('w--current');   // 질환 탭 활성?
    sec.style.display = on ? '' : 'none';
    return true;
  }
  function bind() {
    sync();
    // 탭 클릭 → Webflow 가 .w--current 를 옮긴 뒤(한 틱 후) 재동기화
    var links = document.querySelectorAll('.w-tab-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        setTimeout(sync, 0);
        setTimeout(sync, 80);
      });
    }
    // 키보드/프로그램적 전환 대비 — 탭 메뉴 클래스 변화 감시
    try {
      var link = diseaseTabLink();
      var menu = link && link.parentElement;
      if (menu) {
        var mo = new MutationObserver(function () { sync(); });
        mo.observe(menu, { attributes: true, subtree: true, attributeFilter: ['class'] });
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
  // 탭/섹션이 늦게 렌더되는 경우 대비 폴백 폴링(최대 6초)
  var n = 0;
  var iv = setInterval(function () { sync(); if (++n >= 12) clearInterval(iv); }, 500);
})();
