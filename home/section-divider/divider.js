/* ================================================================
   SECTION CONNECTOR LINE (SVG): Button1 bottom-center -> Section2 heading top
   ScrollTrigger + stroke-dashoffset animation (draw then erase).

   SVG path: simple vertical line (1px)
   Animation: Phase 1 draw, Phase 2+3 erase (scroll-linked via ScrollTrigger)

   Bug fix: erase trigger was 'top bottom' → fired at scrollY < 0 (before page
   loads), so erase was already 45%+ complete when drawing started. Line only
   became visible ~200px into scroll, appearing to start at section boundary.
   Fix: erase start changed to 'top top' (marker exits viewport top = scrollY
   equals marker page-y), so draw completes before erase begins.

   Debug: add ?debug-line=1 to URL or set window.DEBUG_SECTION_LINE = true
   Version: 13 (erase trigger timing fix)
   ================================================================ */

(function () {
  'use strict';

  var BTN1_CLASS = '.discover-helix_button';
  var AMPLITUDE  = 14;

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

  function findSec2Head(btn) {
    var el = document.querySelector('.section2-heading');
    if (el) { log('sec2: found via .section2-heading class'); return el; }
    var node = btn.parentElement;
    while (node && node !== document.body) {
      var sib = node.nextElementSibling;
      if (sib) {
        var h = sib.querySelector('h1,h2,h3,h4,[class*="heading"],[class*="Heading"]');
        if (h) { log('sec2: auto-detected ->', h.tagName); return h; }
      }
      node = node.parentElement;
    }
    log('sec2: not found');
    return null;
  }

  function buildPath(cx, height) {
    return 'M ' + cx.toFixed(2) + ' 0 L ' + cx.toFixed(2) + ' ' + height.toFixed(2);
  }

  function createSVGLine() {
    if (svgEl) return;

    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgEl.setAttribute('class', 'helix-line-svg');
    svgEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:9999;';

    pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('class', 'helix-line-path');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', '#0075d6');
    pathEl.setAttribute('stroke-width', '1');
    pathEl.setAttribute('stroke-linecap', 'round');
    svgEl.appendChild(pathEl);

    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(svgEl);
    log('SVG created');
  }

  function initAnimationOnce() {
    if (initialized || !window.gsap || !window.gsap.timeline) {
      if (!window.gsap) log('waiting for GSAP...');
      return;
    }

    btn1 = document.querySelector(BTN1_CLASS);
    if (!btn1) { log('button not found'); return; }

    sec2Head = findSec2Head(btn1);
    if (!sec2Head) { log('section2 heading not found'); return; }

    createSVGLine();

    var headProgress = 0;
    var tailProgress = 0;
    var pathLength   = 0;

    function applyDash() {
      if (!pathLength) return;
      var tail       = Math.min(tailProgress, headProgress);
      var visibleLen = (headProgress - tail) * pathLength;
      var dashOffset = -tail * pathLength;
      pathEl.setAttribute('stroke-dasharray', visibleLen + ' ' + pathLength);
      pathEl.setAttribute('stroke-dashoffset', dashOffset);
    }

    /* ── 위치 측정 ────────────────────────────────────────────── */
    var scrollY    = window.scrollY || window.pageYOffset;
    var bR         = btn1.getBoundingClientRect();
    var btnBot_abs = bR.bottom + scrollY;   /* 버튼 바텀 절대 좌표 */
    var lineX      = bR.left + bR.width / 2;
    var s2R        = sec2Head.getBoundingClientRect();
    var s2Top_abs  = s2R.top + scrollY;

    log('btnBot_abs=' + btnBot_abs.toFixed(0) +
        ' s2Top_abs=' + s2Top_abs.toFixed(0));

    /* ── 마커: 버튼 바텀 위치에 1px div (ScrollTrigger 기준점) ── */
    var marker = document.createElement('div');
    marker.setAttribute('data-helix-divider-marker', '1');
    marker.style.cssText =
      'position:absolute;top:' + btnBot_abs + 'px;left:0;' +
      'width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(marker);

    /* Draw: marker top이 뷰포트 center → sec2 헤딩 top 75% */
    ScrollTrigger.create({
      trigger: marker,
      start: 'top center',
      endTrigger: sec2Head,
      end: 'top 75%',
      scrub: true,
      markers: DEBUG,
      onUpdate: function (self) {
        headProgress = self.progress;
        applyDash();
      }
    });

    /* Erase: 버튼 바텀이 뷰포트 TOP을 통과하는 순간 (버튼 완전히 사라진 시점) 꼬리 출발 */
    ScrollTrigger.create({
      trigger: btn1,
      start: 'bottom top',
      endTrigger: sec2Head,
      end: 'top 25%',
      scrub: true,
      markers: DEBUG,
      onUpdate: function (self) {
        tailProgress = self.progress;
        applyDash();
      }
    });

    /* ── SVG 위치 및 경로 설정 ─────────────────────────────────── */
    var lineH = Math.max(1, s2Top_abs - btnBot_abs);
    var svgW  = AMPLITUDE * 2 + 4;

    svgEl.style.left   = (lineX - svgW / 2) + 'px';
    svgEl.style.top    = btnBot_abs + 'px';
    svgEl.style.width  = svgW + 'px';
    svgEl.style.height = lineH + 'px';

    svgEl.setAttribute('width',  AMPLITUDE * 2 + 4);
    svgEl.setAttribute('height', Math.ceil(lineH));

    var relCx = AMPLITUDE + 2;
    pathEl.setAttribute('d', buildPath(relCx, lineH));
    pathLength = pathEl.getTotalLength() || lineH;

    pathEl.setAttribute('stroke-dasharray', '0 ' + pathLength);
    pathEl.setAttribute('stroke-dashoffset', '0');

    log('initialized lineH=' + lineH.toFixed(0));
    initialized = true;
  }

  function retryInit() {
    var n = 0;
    var iv = setInterval(function () {
      initAnimationOnce();
      if (initialized || ++n >= 30) clearInterval(iv);
    }, 100);
  }

  /* section1.js DOM 복원 완료 신호 수신 후 측정 */
  window.addEventListener('helix-s1-done', function () {
    setTimeout(retryInit, 50);
  });

  /* 폴백: section1이 없는 페이지거나 이미 로드된 경우 (5s 후) */
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!initialized) retryInit();
    }, 5000);
  });
})();
