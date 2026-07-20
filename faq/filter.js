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
     - 다중 선택: 한 그룹에서 칩 여러 개 켜기 가능 → 그 중 하나라도 맞으면 표시(OR)
     - 그룹끼리는 AND: 켜진 그룹이 여럿이면 모두 만족해야 표시
     - 아무 칩도 안 켜진 그룹은 조건 없음(전체 통과)
     - 칩 다시 클릭 → 해제. .faq-chip_reset → 그 그룹만 해제
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
          var on = !group.active[val];
          group.active[val] = on;
          chip.classList.toggle('is-on', on);
          chip.setAttribute('aria-pressed', on ? 'true' : 'false');
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
    var pending = null;
    for (var i = 0; i < seq.length; i++) {
      var el = seq[i];
      if (isLabel(el)) {
        pending = attrForLabel(el.textContent);
      } else if (pending) {         // 라벨 직후의 칩묶음
        bindGroup(el, pending);
        pending = null;
      }
    }
    if (!GROUPS.length) return false;

    apply();
    return true;
  }

  function start() {
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
