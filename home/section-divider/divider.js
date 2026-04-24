/* ================================================================
   SECTION CONNECTOR LINE (SVG): Button1 bottom-center -> Section2 heading top
   SVG stroke-dashoffset scroll animation with sinusoidal helix path.

   Phase 1 (scroll start -> button bottom exits): line grows downward
   Phase 2 (button fully gone -> sec2 at 50vh):   erase from top, slow
   Phase 3 (sec2 at 50vh -> 15vh):                fast convergence

   Debug: add ?debug-line=1 to URL or set window.DEBUG_SECTION_LINE = true
   Version: 7 (SVG)
   ================================================================ */

(function () {
  'use strict';

  var BTN1_CLASS = '.discover-helix_button';
  var AMPLITUDE  = 14;   /* px - horizontal sine deviation */
  var NUM_WAVES  = 5;    /* complete sine cycles over the full connector height */
  var STEPS      = 120;  /* polyline point count - higher = smoother */

  var DEBUG = window.DEBUG_SECTION_LINE ||
              /[?&]debug-line=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[SectionLine]'].concat([].slice.call(arguments)));
  } : function () {};

  var svgEl    = null;
  var pathEl   = null;
  var btn1     = null;
  var sec2Head = null;
  var initialized = false;
  var rafId    = null;

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
        if (h) { log('sec2: auto-detected ->', h.tagName, h.className.slice(0, 30)); return h; }
      }
      node = node.parentElement;
    }
    log('sec2: not found - add .section2-heading to the section 2 heading');
    return null;
  }

  /* Build sinusoidal polyline from (cx, y0) to (cx, y1) */
  function buildPath(cx, y0, y1) {
    var height = y1 - y0;
    var d = '';
    for (var i = 0; i <= STEPS; i++) {
      var t  = i / STEPS;
      var px = cx + AMPLITUDE * Math.sin(t * NUM_WAVES * 2 * Math.PI);
      var py = y0 + t * height;
      d += (i === 0 ? 'M ' : ' L ') + px.toFixed(2) + ' ' + py.toFixed(2);
    }
    return d;
  }

  function ensureSVG() {
    if (svgEl) return;

    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'section-connector-svg');
    /* height:1px + overflow:visible lets the path render at any y without
       the SVG element itself expanding the page scroll height */
    svgEl.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:1px;' +
      'overflow:visible;pointer-events:none;z-index:9999;';

    pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', '#0075d6');
    pathEl.setAttribute('stroke-width', '1');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    svgEl.appendChild(pathEl);

    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(svgEl);
    log('SVG created');
  }

  function update() {
    rafId = null;
    if (!btn1 || !sec2Head || !svgEl) return;

    var sy  = window.scrollY || window.pageYOffset;
    var vh  = window.innerHeight;
    var bR  = btn1.getBoundingClientRect();
    var s2R = sec2Head.getBoundingClientRect();

    var cx = bR.left + bR.width / 2;
    var y0 = bR.bottom + sy;   /* absolute: button bottom */
    var y1 = s2R.top   + sy;   /* absolute: sec2 heading top */

    if (y1 - y0 < 1) {
      pathEl.setAttribute('d', '');
      return;
    }

    pathEl.setAttribute('d', buildPath(cx, y0, y1));
    var L = pathEl.getTotalLength();
    if (L < 1) return;

    /* Milestones (same logic as clip-path version) */
    var M1 = Math.max(1,      y0);
    var M2 = Math.max(M1 + 1, y1 - vh * 0.5);
    var M3 = Math.max(M2 + 1, y1 - vh * 0.15);

    var da; /* stroke-dasharray string */

    if (sy <= 0) {
      /* Hidden before scrolling */
      da = '0 ' + L;

    } else if (sy <= M1) {
      /* Phase 1: draw from top (button) downward */
      var drawn = (easeInOut(sy / M1) * L).toFixed(2);
      da = drawn + ' ' + L;

    } else if (sy <= M3) {
      /* Phase 2+3: erase from top
         dasharray: "0 <erased> <visible>" hides the first <erased> pixels */
      var eraseRatio;
      if (sy <= M2) {
        eraseRatio = easeInOut((sy - M1) / (M2 - M1)) * 0.65;
      } else {
        var t = clamp((sy - M2) / (M3 - M2), 0, 1);
        eraseRatio = 0.65 + t * t * 0.35;
      }
      var erased  = eraseRatio * L;
      var visible = Math.max(0, L - erased);
      da = '0 ' + erased.toFixed(2) + ' ' + visible.toFixed(2) + ' ' + L;

    } else {
      /* Fully erased */
      da = '0 ' + L;
    }

    pathEl.setAttribute('stroke-dasharray',  da);
    pathEl.setAttribute('stroke-dashoffset', '0');

    log('sy', sy | 0,
        '| M1', M1 | 0, 'M2', M2 | 0, 'M3', M3 | 0,
        '| L', L.toFixed(0),
        '| da', da);
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

    ensureSVG();

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
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () { retryInit('DOMContentLoaded'); }, 200);
    });
  }
})();
