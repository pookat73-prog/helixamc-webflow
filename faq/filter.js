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

  function apply() {
    var its = items();
    var visible = 0;
    for (var i = 0; i < its.length; i++) {
      var it = its[i];
      var show = true;
      for (var g = 0; g < GROUPS.length && show; g++) {
        var grp = GROUPS[g];
        var wanted = [];
        for (var v in grp.active) { if (grp.active[v]) wanted.push(v); }
        if (!wanted.length) continue;                 // 조건 없는 그룹 통과
        var have = attrValues(it, grp.attr);
        var hit = false;
        for (var w = 0; w < wanted.length; w++) {
          if (have.indexOf(wanted[w]) >= 0) { hit = true; break; }   // OR
        }
        if (!hit) show = false;                        // 그룹끼리 AND
      }
      it.style.display = show ? '' : 'none';
      if (show) visible++;
    }
    updateEmpty(visible === 0 && anyActive());
    log('apply → 표시', visible, '/', its.length);
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
