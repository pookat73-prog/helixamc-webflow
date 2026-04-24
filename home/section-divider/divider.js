/* ================================================================
   SECTION CONNECTOR LINE: Button1 bottom-center -> Section2 heading top
   Scroll-animated draw/erase via clipPath.

   Phase 1 (scroll start -> button bottom exits): line grows downward
   Phase 2 (button fully gone -> sec2 at 50vh):   erase from top, slow
   Phase 3 (sec2 at 50vh -> 15vh):                fast convergence

   Debug: add ?debug-line=1 to URL or set window.DEBUG_SECTION_LINE = true
   Version: 6
   ================================================================ */

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

  /* Find section 2 heading:
     1) .section2-heading class first
     2) Walk up from button, check siblings for first heading */
  function findSec2Head(btn) {
    var el = document.querySelector('.section2-heading');
    if (el) { log('sec2: found via .section2-heading class'); return el; }
    var node = btn.parentElement;
    while (node && node !== document.body) {
      var sib = node.nextElementSibling;
      if (sib) {
        var h = sib.querySelector('h1,h2,h3,h4,[class*="heading"],[class*="Heading"]');
        if (h) { log('sec2: auto-detected via DOM ->', h.tagName, h.className.slice(0, 30)); return h; }
      }
      node = node.parentElement;
    }
    log('sec2: not found - add .section2-heading class to the section 2 heading for accuracy');
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
    log('line created');
  }

  function update() {
    rafId = null;
    if (!btn1 || !sec2Head || !line) return;

    var sy  = window.scrollY || window.pageYOffset;
    var vh  = window.innerHeight;
    var vw  = window.innerWidth;
    var bR  = btn1.getBoundingClientRect();
    var s2R = sec2Head.getBoundingClientRect();

    var btnBot_abs = bR.bottom + sy;
    var s2Top_abs  = s2R.top   + sy;

    var lineH = Math.max(0, s2Top_abs - btnBot_abs - 0.005 * vw);
    var lineX = bR.left + bR.width / 2;

    line.style.left   = lineX + 'px';
    line.style.top    = btnBot_abs + 'px';
    line.style.height = lineH + 'px';

    if (lineH < 1) {
      line.style.clipPath = 'inset(0% 0 100% 0)';
      return;
    }

    /* Milestones */
    var M1 = Math.max(1, btnBot_abs);
    var M2 = Math.max(M1 + 1, s2Top_abs - vh * 0.5);
    var M3 = Math.max(M2 + 1, s2Top_abs - vh * 0.15);

    var cTop, cBot;

    if (sy <= 0) {
      cTop = 0; cBot = 1;

    } else if (sy <= M1) {
      /* Phase 1: draw downward (bottom clip 1 -> 0) */
      cTop = 0;
      cBot = 1 - easeInOut(sy / M1);

    } else if (sy <= M2) {
      /* Phase 2: erase from top, slow (top clip 0 -> 0.65) */
      cTop = easeInOut((sy - M1) / (M2 - M1)) * 0.65;
      cBot = 0;

    } else if (sy <= M3) {
      /* Phase 3: top catches up to fixed bottom (ease-in accelerating) */
      var t = clamp((sy - M2) / (M3 - M2), 0, 1);
      cTop = 0.65 + t * t * 0.35;
      cBot = 0;

    } else {
      cTop = 1; cBot = 0;
    }

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
    if (!btn1) { log('setup waiting - .discover-helix_button not found'); return false; }

    sec2Head = sec2Head || findSec2Head(btn1);
    if (!sec2Head) { log('setup waiting - section 2 heading not found'); return false; }

    var r = btn1.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) { log('setup waiting - button layout not ready'); return false; }

    ensureLine();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
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
        if (!initialized) log('retry giving up after ' + n + ' attempts');
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
