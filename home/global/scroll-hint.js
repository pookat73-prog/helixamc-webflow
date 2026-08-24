/* ================================================================
   HOME — 스크롤 유도 꺽쇠 화살표 (v1.0)

   무엇: 첫 화면 하단 가운데에 작은 꺽쇠(∨) 하나를 띄워
         "아래로 더 있다" 를 알려 줌.

   언제 뜨나: 히어로(슬로건·버튼·배경) 등장이 끝난 뒤.
         section1.js 가 끝나면서 쏘는 'helix-s1-done' 신호를 기다림.
         (신호가 안 오는 경우를 대비해 4초 뒤 강제로 띄우는 안전망 있음)

   언제 사라지나: 스크롤을 시작하면 그 정도에 비례해 서서히 옅어지고,
         화면 절반 이상 내려간 시점에 완전히 사라짐. 한 번 충분히
         내려간(첫 화면 60%) 뒤에는 위로 되돌아와도 다시 안 뜸 —
         이미 아래에 뭐가 있는지 본 사람에게 또 권할 필요가 없어서.

   안전장치:
     · pointer-events:none (CSS) → 아래 요소 클릭을 절대 안 막음
     · 홈 히어로가 없는 페이지에서는 아예 만들지 않음
     · 진입 시 이미 스크롤돼 있으면(새로고침 복원 등) 만들지 않음
     · 중복 실행 가드
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixScrollHintInit) return;
  window.__helixScrollHintInit = true;

  var DEBUG = /[?&]debug-scroll-hint=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[ScrollHint]'].concat([].slice.call(arguments)));
  } : function () {};

  /* 홈 히어로가 있는 페이지에서만 동작 */
  function hasHero() {
    return !!(document.querySelector('.home_slogan') ||
              document.querySelector('.home_background'));
  }

  /* 사라짐 구간: 스크롤 0 → FADE_END 사이에서 1 → 0 으로 옅어짐 */
  var FADE_END_RATIO  = 0.35;   /* 첫 화면 높이의 35% 내려가면 완전히 투명 */
  var RETIRE_RATIO    = 0.60;   /* 60% 넘게 내려가면 영구 제거 */
  var SHOW_DELAY      = 400;    /* 히어로 종료 후 이 정도 뒤에 등장 */
  var FALLBACK_DELAY  = 4000;   /* 신호가 안 오면 이 시점에 강제 등장 */

  var el = null;
  var shown = false;
  var retired = false;
  var ticking = false;

  function vh() { return window.innerHeight || 800; }
  function scrollY() {
    return window.pageYOffset ||
           (document.documentElement && document.documentElement.scrollTop) || 0;
  }

  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'hx-scroll-hint';
    el.setAttribute('aria-hidden', 'true');   /* 장식 요소 — 스크린리더는 건너뜀 */
    el.innerHTML = '<span class="hx-scroll-hint__chevron"></span>';
    document.body.appendChild(el);
    log('built');
    return el;
  }

  function retire() {
    if (retired) return;
    retired = true;
    if (el && el.parentNode) el.parentNode.removeChild(el);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    log('retired');
  }

  /* 스크롤 위치 → 투명도 반영 (rAF 로 프레임당 1회만 계산) */
  function apply() {
    ticking = false;
    if (retired || !el) return;
    var y = scrollY();
    if (y > vh() * RETIRE_RATIO) { retire(); return; }
    if (!shown) return;                       /* 아직 등장 전이면 건드리지 않음 */
    var end = vh() * FADE_END_RATIO;
    var o = end > 0 ? (1 - y / end) : 0;
    if (o < 0) o = 0;
    if (o > 1) o = 1;
    el.style.opacity = String(o);
  }

  function onScroll() {
    if (ticking || retired) return;
    ticking = true;
    (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(apply);
  }

  function show() {
    if (shown || retired) return;
    /* 등장 직전에 이미 내려가 있으면 띄우지 않음 */
    if (scrollY() > vh() * 0.15) { retire(); return; }
    build();
    shown = true;
    /* 한 프레임 뒤에 opacity 를 올려야 CSS transition 이 실제로 재생됨 */
    (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () {
      if (el && !retired) el.style.opacity = '1';
      log('shown');
    });
    /* 등장 전환(0.6s)이 끝나면 짧은 전환으로 갈아탐 → 스크롤에 바로 반응 */
    setTimeout(function () {
      if (el && !retired) el.classList.add('is-tracking');
    }, 650);
  }

  function init() {
    if (!hasHero()) { log('no hero — skip'); return; }
    /* 새로고침 위치 복원 등으로 이미 내려가 있으면 아예 시작 안 함 */
    if (scrollY() > vh() * 0.15) { log('already scrolled — skip'); return; }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* 히어로 등장이 끝나면 그때 띄움 */
    window.addEventListener('helix-s1-done', function () {
      setTimeout(show, SHOW_DELAY);
    });
    /* 안전망 — 신호가 영영 안 와도 결국은 뜬다 */
    setTimeout(show, FALLBACK_DELAY);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
