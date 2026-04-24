/* ═══════════════════════════════════════════════════════════════
   SECTION CONNECTOR LINE: Button 1 bottom-center → Section 2 head top (-0.5vw)
   JavaScript - scroll-animated draw/erase via clipPath

   Phase 1 (scroll start → button top exits):  line grows downward
   Phase 2 (button exits → sec2 at 50vh):      erase from top, slow
   Phase 3 (sec2 at 50vh → 15vh):              fast convergence, line gone

   디버그: URL에 ?debug-line=1 추가 또는 window.DEBUG_SECTION_LINE = true
   Version: 5
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var BTN1_CLASS = '.discover-helix_button';

  var DEBUG = window.DEBUG_SECTION_LINE ||
              /[?&]debug-line=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[SectionLine]'].concat([].slice.call(arguments)));
  } : function () {};

  var line        = null;
  var btn1        = null;
  var sec2Head    = null;
  var initialized = false;
  var rafId       = null;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function easeInOut(t) {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /* 섹션 2 헤딩 자동 탐지:
     1) .section2-heading 클래스 우선
     2) 버튼 조상 형제 노드에서 첫 헤딩 */
  function findSec2Head(btn) {
    var el = document.querySelector('.section2-heading');
    if (el) { log('sec2: .section2-heading 클래스로 찾음'); return el; }
    var node = btn.parentElement;
    while (node && node !== document.body) {
      var sib = node.nextElementSibling;
      if (sib) {
        var h = sib.querySelector('h1,h2,h3,h4,[class*="heading"],[class*="Heading"]');
        if (h) { log('sec2: DOM 자동탐지 →', h.tagName, h.className.slice(0, 30)); return h; }
      }
      node = node.parentElement;
    }
    log('sec2: 찾지 못함 — .section2-heading 클래스를 섹션 2 헤딩에 추가하면 정확해집니다');
    return null;
  }

  function ensureLine() {
    if (line) return;
    line = document.createElement('div');
    line.className = 'section-connector-line';
    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(line);
    line.style.clipPath = 'inset(0% 0 100% 0)';
    log('line 생성 완료');
  }

  function update() {
    rafId = null;
    if (!btn1 || !sec2Head || !line) return;

    var sy  = window.scrollY || window.pageYOffset;
    var vh  = window.innerHeight;
    var vw  = window.innerWidth;
    var bR  = btn1.getBoundingClientRect();
    var s2R = sec2Head.getBoundingClientRect();

    /* 절대좌표 기준점 */
    var btnTop_abs = bR.top    + sy;
    var btnBot_abs = bR.bottom + sy;
    var s2Top_abs  = s2R.top   + sy;

    /* 라인 전체 크기 (항상 full extent로 유지) */
    var lineH = Math.max(0, s2Top_abs - btnBot_abs - 0.005 * vw);
    var lineX = bR.left + bR.width / 2;

    line.style.left   = lineX + 'px';
    line.style.top    = btnBot_abs + 'px';
    line.style.height = lineH + 'px';

    if (lineH < 1) {
      line.style.clipPath = 'inset(0% 0 100% 0)';
      return;
    }

    /* ── 스크롤 마일스톤 ─────────────────────────────────────────── */
    /* M1: 버튼 상단이 뷰포트 상단에 도달 → 라인 완전히 그려짐       */
    var M1 = Math.max(1, btnTop_abs);
    /* M2: sec2 상단이 뷰포트 50% 위치 → 빠른 수렴 시작              */
    var M2 = Math.max(M1 + 1, s2Top_abs - vh * 0.5);
    /* M3: 라인 완전 소멸                                             */
    var M3 = Math.max(M2 + 1, s2Top_abs - vh * 0.15);

    /* ── clipPath 계산 (0–1 비율) ────────────────────────────────── */
    var cTop, cBot;

    if (sy <= 0) {
      /* 스크롤 전: 숨김 */
      cTop = 0; cBot = 1;

    } else if (sy <= M1) {
      /* Phase 1: 아래로 그려짐 (bottom clip 1→0) */
      cTop = 0;
      cBot = 1 - easeInOut(sy / M1);

    } else if (sy <= M2) {
      /* Phase 2: 위에서 지워짐, 느리게 (top clip 0→0.65) */
      cTop = easeInOut((sy - M1) / (M2 - M1)) * 0.65;
      cBot = 0;

    } else if (sy <= M3) {
      /* Phase 3: 빠른 수렴 — top 느리게, bottom 빠르게 따라옴 */
      var t = clamp((sy - M2) / (M3 - M2), 0, 1);
      cTop = 0.65 + t * 0.1;      /* 0.65 → 0.75 (느림) */
      cBot = t * t * 0.25;        /* 0 → 0.25 (ease-in, 가속) */

    } else {
      /* 소멸 */
      cTop = 1; cBot = 0;
    }

    /* 합계 100% 초과 방지 */
    if (cTop + cBot > 1) cBot = Math.max(0, 1 - cTop);

    line.style.clipPath =
      'inset(' + (cTop * 100).toFixed(2) + '% 0 '
               + (cBot * 100).toFixed(2) + '% 0)';

    log('sy', sy | 0,
        '| M1', M1 | 0, 'M2', M2 | 0, 'M3', M3 | 0,
        '| cTop', (cTop * 100).toFixed(1) + '%',
        'cBot', (cBot * 100).toFixed(1) + '%');
  }

  function schedule() {
    if (!rafId) rafId = requestAnimationFrame(update);
  }

  function setup() {
    if (initialized) return true;

    btn1     = btn1     || document.querySelector(BTN1_CLASS);
    if (!btn1) { log('setup waiting — .discover-helix_button 없음'); return false; }

    sec2Head = sec2Head || findSec2Head(btn1);
    if (!sec2Head) { log('setup waiting — 섹션 2 헤딩 없음'); return false; }

    var r = btn1.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) { log('setup waiting — 버튼 레이아웃 미완료'); return false; }

    ensureLine();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    window.addEventListener('load', function () { setTimeout(schedule, 100); });

    initialized = true;
    schedule();
    log('setup complete');
    return true;
  }

  function retryInit(source) {
    if (initialized) return;
    log('retryInit from:', source);
    var n = 0;
    var iv = setInterval(function () {
      if (setup() || ++n >= 33) {
        clearInterval(iv);
        if (!initialized) log('retry 포기 — 요소를 찾지 못했습니다 (' + n + '회)');
      }
    }, 300);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () { setTimeout(function () { retryInit('Webflow.push'); }, 100); });

  if (document.readyState === 'complete') {
    setTimeout(function () { retryInit('immediate'); }, 100);
  } else {
    window.addEventListener('load', function () { setTimeout(function () { retryInit('load'); }, 100); });
  }

  if (document.readyState !== 'loading') {
    setTimeout(function () { retryInit('not-loading'); }, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { retryInit('DOMContentLoaded'); }, 200); });
  }
})();
