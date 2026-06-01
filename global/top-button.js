/* ================================================================
   HELIX AMC — GLOBAL TOP BUTTON (code-rendered)
   - body 에 .helix-top-btn 주입 (모든 페이지 공통)
   - 항상 표시, 클릭 시 smooth scroll to top
   - 푸터 진입 시 bottom 을 동적으로 올려 푸터 위 1.5vw 까지만 따라옴
   - 디자이너에 남아있는 legacy .link-block-11 인스턴스는 런타임 제거
   ================================================================ */
(function () {
  'use strict';

  var DEBUG = /[?&]debug-topbtn=1/.test(location.search);
  function dbg(){ if(DEBUG) console.log.apply(console, ['[top-btn]'].concat([].slice.call(arguments))); }

  var ICON  = 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/69dc468edccab2e2a301f4d0_%EC%9C%84%EB%A1%9C%EA%B0%80%EA%B8%B0.svg';
  var GAP_VW = 1.5;

  var btn = null;
  var baseBottomPx = 0;
  var rafId = 0;

  function purgeLegacy() {
    var nodes = document.querySelectorAll('a.link-block-11, .link-block-11');
    var n = 0;
    nodes.forEach(function (el) {
      if (el.classList && el.classList.contains('helix-top-btn')) return;
      el.remove();
      n++;
    });
    if (n) dbg('purged legacy nodes:', n);
  }

  function inject() {
    if (btn && document.body.contains(btn)) return btn;
    btn = document.createElement('a');
    btn.className = 'helix-top-btn';
    btn.href = '#';
    btn.setAttribute('aria-label', '맨 위로');
    btn.innerHTML =
      '<div class="helix-top-btn__box">' +
        '<img class="helix-top-btn__icon" src="' + ICON + '" alt="">' +
        '<div class="helix-top-btn__label">위로가기</div>' +
      '</div>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
    dbg('injected');
    return btn;
  }

  function findFooter() {
    return (
      document.querySelector('section.footer') ||
      document.querySelector('.footer') ||
      document.querySelector('footer') ||
      document.querySelector('section[class*="footer" i]') ||
      document.querySelector('[class*="footer" i]:not([class*="-bar" i])')
    );
  }

  function readBase() {
    if (!btn) return;
    btn.style.bottom = '';
    var v = parseFloat(getComputedStyle(btn).bottom);
    baseBottomPx = isFinite(v) ? v : 0;
    dbg('base bottom=', baseBottomPx + 'px');
  }

  function update() {
    rafId = 0;
    if (!btn) return;
    var footer = findFooter();
    if (!footer) { if (btn.style.bottom) btn.style.bottom = ''; return; }
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var gapPx = (GAP_VW / 100) * vw;
    var fRect = footer.getBoundingClientRect();
    if (fRect.top >= vh) {
      if (btn.style.bottom) btn.style.bottom = '';
      return;
    }
    var overlap = vh - fRect.top;
    var clamped = overlap + gapPx;
    if (clamped <= baseBottomPx) {
      if (btn.style.bottom) btn.style.bottom = '';
      return;
    }
    btn.style.bottom = clamped + 'px';
  }

  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(update);
  }

  function boot() {
    purgeLegacy();
    inject();
    readBase();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { readBase(); schedule(); });
    schedule();
    /* Webflow IX2 가 늦게 legacy 를 다시 박을 수 있어 짧게 반복 정리 */
    var n = 0;
    var iv = setInterval(function () {
      purgeLegacy();
      schedule();
      if (++n >= 30) clearInterval(iv);
    }, 200);
    dbg('initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
