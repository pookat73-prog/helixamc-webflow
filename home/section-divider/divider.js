/* ================================================================
   SECTION CONNECTOR LINE (SVG): Button1 bottom-center -> Section2 heading top
   ScrollTrigger + stroke-dashoffset animation (draw then erase).

   SVG path: simple vertical line (1px)
   Animation: Phase 1 draw, Phase 2+3 erase (scroll-linked via ScrollTrigger)
   End point: section2 heading reaches 75% of viewport (complete erase)

   Debug: add ?debug-line=1 to URL or set window.DEBUG_SECTION_LINE = true
   Version: 12 (straight line, fixed pathLength, hidden on page load)
   ================================================================ */

(function () {
  'use strict';

  var BTN1_CLASS = '.discover-helix_button';
  var AMPLITUDE  = 14;
  var NUM_WAVES  = 5;
  var STEPS      = 120;

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
    /* Simple vertical line (not sinusoidal) */
    return 'M ' + cx.toFixed(2) + ' 0 L ' + cx.toFixed(2) + ' ' + height.toFixed(2);
  }

  function createSVGLine() {
    if (svgEl) return;

    /* Create inline SVG wrapper */
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

  /* 섹션 1 바텀 절대좌표 반환.
     btn1의 가장 가까운 <section> 조상 엘리먼트의 bottom을 사용.
     Webflow 레이아웃에서 버튼이 flex-stretch로 늘어나도 영향 없음. */
  function findSec1Bottom(btn) {
    var scrollY = window.scrollY || window.pageYOffset;

    /* closest <section> 우선 */
    var sec = btn.closest('section');

    /* <section> 없으면 className에 'section' 포함하는 조상 탐색 */
    if (!sec) {
      var node = btn.parentElement;
      while (node && node !== document.body) {
        if (/section/i.test(node.className)) { sec = node; break; }
        node = node.parentElement;
      }
    }

    if (sec) {
      var r = sec.getBoundingClientRect();
      log('sec1 bottom via <' + sec.tagName.toLowerCase() + '> .' +
          (sec.className.split(' ')[0] || '') + ' h=' + r.height.toFixed(0));
      return r.bottom + scrollY;
    }

    /* 폴백: section을 못 찾으면 btn 바텀 직접 사용 */
    log('sec1: section ancestor not found, using btn.bottom');
    return btn.getBoundingClientRect().bottom + scrollY;
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

    /* ── 위치 먼저 측정 (트리거 생성 전) ───────────────────────── */
    var scrollY    = window.scrollY || window.pageYOffset;
    var btnBot_abs = findSec1Bottom(btn1);          /* 섹션 1 바텀 기준 */
    var s2R        = sec2Head.getBoundingClientRect();
    var s2Top_abs  = s2R.top + scrollY;
    var bR         = btn1.getBoundingClientRect();
    var lineX      = bR.left + bR.width / 2;

    log('sec1Bot_abs=' + btnBot_abs.toFixed(0) +
        ' s2Top_abs=' + s2Top_abs.toFixed(0));

    /* ── 마커 요소: 실제 버튼 바텀 위치에 1px div ────────────────
       ScrollTrigger 트리거로 사용해 stretched btn1 측정을 우회함 */
    var marker = document.createElement('div');
    marker.setAttribute('data-helix-divider-marker', '1');
    marker.style.cssText =
      'position:absolute;top:' + btnBot_abs + 'px;left:0;' +
      'width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(marker);

    /* Draw: 마커(= 실제 버튼 바텀)가 뷰포트 중앙 → sec2 헤딩 75% */
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

    /* Erase: 마커가 뷰포트 아래로 사라짐 → sec2 헤딩 50% */
    ScrollTrigger.create({
      trigger: marker,
      start: 'top bottom',
      endTrigger: sec2Head,
      end: 'top 50%',
      scrub: true,
      markers: DEBUG,
      onUpdate: function (self) {
        tailProgress = self.progress;
        applyDash();
      }
    });

    /* ── SVG 위치 및 경로 설정 ───────────────────────────────── */
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
