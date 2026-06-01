/* ================================================================
   HELIX AMC — GLOBAL TOP BUTTON
   Webflow 컴포넌트 "top" (.link-block-11) 은 position:fixed 로 박혀 있음.
   푸터가 뷰포트에 들어오면 푸터 위 1.5vw 까지만 따라 올라오도록
   bottom 을 동적 보정. 푸터 침범 방지.
   ================================================================ */
(function () {
  'use strict';

  var DEBUG = /[?&]debug-topbtn=1/.test(location.search);
  function dbg() { if (DEBUG) console.log.apply(console, ['[top-btn]'].concat([].slice.call(arguments))); }

  var GAP_VW = 1.5;
  var BTN_SELECTOR = '.link-block-11';

  function findFooter() {
    return (
      document.querySelector('section.footer') ||
      document.querySelector('.footer') ||
      document.querySelector('footer') ||
      document.querySelector('section[class*="footer" i]') ||
      document.querySelector('[class*="footer" i]:not([class*="-bar" i])')
    );
  }

  function findButton() {
    var nodes = document.querySelectorAll(BTN_SELECTOR);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var s = getComputedStyle(el);
      if (s.position === 'fixed') return el;
    }
    return nodes[0] || null;
  }

  var btn = null;
  var footer = null;
  var baseBottomPx = null;
  var rafId = 0;

  function readBaseBottom() {
    btn.style.bottom = '';
    var s = getComputedStyle(btn);
    var v = parseFloat(s.bottom);
    baseBottomPx = isFinite(v) ? v : 0;
    dbg('base bottom=', baseBottomPx + 'px');
  }

  function update() {
    rafId = 0;
    if (!btn || !footer) return;
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var gapPx = (GAP_VW / 100) * vw;
    var fRect = footer.getBoundingClientRect();

    if (fRect.top >= vh) {
      if (btn.style.bottom) btn.style.bottom = '';
      return;
    }
    var overlap = vh - fRect.top;
    var clampedBottom = overlap + gapPx;
    if (clampedBottom <= baseBottomPx) {
      if (btn.style.bottom) btn.style.bottom = '';
      return;
    }
    btn.style.bottom = clampedBottom + 'px';
  }

  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(update);
  }

  var initialized = false;
  function init() {
    if (initialized) return true;
    btn = findButton();
    footer = findFooter();
    if (!btn || !footer) return false;
    initialized = true;
    readBaseBottom();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { readBaseBottom(); schedule(); });
    schedule();
    dbg('initialized');
    return true;
  }

  function retry() {
    var n = 0;
    var iv = setInterval(function () {
      if (init() || ++n >= 50) clearInterval(iv);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retry);
  } else {
    retry();
  }
  window.addEventListener('load', retry);
})();
