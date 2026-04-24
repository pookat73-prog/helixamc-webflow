/* ═══════════════════════════════════════════════════════════════
   SECTION CONNECTOR LINE: Button 1 bottom-center → Section 2 head top (-0.5vw)
   JavaScript - DOM injection + dynamic positioning

   디버그: URL에 ?debug-line=1 추가 또는 window.DEBUG_SECTION_LINE = true
   Version: 2
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SEC2_HEAD_CLASS = '.section2-heading';
  var BTN1_CLASS      = '.discover-helix_button';

  var DEBUG = window.DEBUG_SECTION_LINE ||
              /[?&]debug-line=1/.test(location.search);
  var log = DEBUG ? function () {
    var args = ['[SectionLine]'].concat([].slice.call(arguments));
    console.log.apply(console, args);
  } : function () {};

  var line         = null;
  var btn1         = null;
  var sec2Head     = null;
  var positionLine = null;
  var initialized  = false;

  function ensureLine() {
    if (line) return line;
    line = document.createElement('div');
    line.className = 'section-connector-line';
    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(line);
    log('line element created and appended to body');
    return line;
  }

  function setup() {
    if (initialized) return true;

    btn1     = btn1     || document.querySelector(BTN1_CLASS);
    sec2Head = sec2Head || document.querySelector(SEC2_HEAD_CLASS);

    if (!btn1 || !sec2Head) {
      log('setup waiting — btn1:', !!btn1, 'sec2Head:', !!sec2Head);
      return false;
    }

    ensureLine();

    positionLine = function () {
      var r1 = btn1.getBoundingClientRect();
      var r2 = sec2Head.getBoundingClientRect();
      var sy = window.scrollY || window.pageYOffset;
      var x  = r1.left + r1.width / 2;
      var y  = r1.bottom + sy;
      var h  = Math.max(0, r2.top - r1.bottom - 0.005 * window.innerWidth);
      line.style.left   = x + 'px';
      line.style.top    = y + 'px';
      line.style.height = h + 'px';
      log('positioned — left:', x.toFixed(1), 'top:', y.toFixed(1), 'height:', h.toFixed(1));
    };

    positionLine();
    window.addEventListener('resize', positionLine);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(positionLine);
    }
    window.addEventListener('load', function () { setTimeout(positionLine, 100); });

    initialized = true;
    log('setup complete');
    return true;
  }

  function retryInit(source) {
    if (initialized) return;
    log('retryInit triggered by:', source);
    var tries = 0;
    var max   = 33;
    var iv    = setInterval(function () {
      if (setup() || ++tries >= max) {
        clearInterval(iv);
        if (!initialized) log('retry gave up after', tries, 'tries');
      }
    }, 300);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () { setTimeout(function () { retryInit('Webflow.push'); }, 100); });

  if (document.readyState === 'complete') {
    setTimeout(function () { retryInit('readyState=complete'); }, 100);
  } else {
    window.addEventListener('load', function () { setTimeout(function () { retryInit('load'); }, 100); });
  }

  if (document.readyState !== 'loading') {
    setTimeout(function () { retryInit('readyState!=loading'); }, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { retryInit('DOMContentLoaded'); }, 200); });
  }
})();
