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

  /* btn1의 실제 바텀 절대좌표 반환.
     flex-stretch로 섹션 높이까지 늘어난 경우:
       A) Range API → 실제 콘텐츠 바텀
       B) .home_slogan 바텀 + 갭 + 자연 높이 추정
       C) 섹션 높이의 65% 폴백 */
  function findBtnBottom(btn) {
    var bR      = btn.getBoundingClientRect();
    var scrollY = window.scrollY || window.pageYOffset;
    var s1El    = document.querySelector('.home_background') ||
                  btn.closest('section') ||
                  btn.parentElement;
    var s1R     = s1El ? s1El.getBoundingClientRect() : null;

    /* stretch 아니면 직접 사용 */
    if (!s1R || (s1R.bottom - bR.bottom) > 20) {
      log('findBtnBottom: direct', bR.bottom + scrollY);
      return bR.bottom + scrollY;
    }
    log('findBtnBottom: stretched, trying Range API...');

    /* A. Range API */
    try {
      var range = document.createRange();
      range.selectNodeContents(btn);
      var rBR    = range.getBoundingClientRect();
      var relPos = s1R.height > 0 ? (rBR.bottom - s1R.top) / s1R.height : 0;
      if (rBR.height > 0 && rBR.height < 200 && relPos > 0.15 && relPos < 0.96) {
        log('findBtnBottom: Range API ->', (rBR.bottom + scrollY).toFixed(0));
        return rBR.bottom + scrollY;
      }
      log('findBtnBottom: Range out of range relPos=' + relPos.toFixed(2));
    } catch (e) { log('findBtnBottom: Range err', e); }

    /* B. .home_slogan 기반 추정 */
    var slogan = document.querySelector('.home_slogan');
    if (slogan) {
      var sR   = slogan.getBoundingClientRect();
      var cs   = getComputedStyle(btn);
      var natH = (parseFloat(cs.lineHeight) || 20) +
                 (parseFloat(cs.paddingTop) || 0) +
                 (parseFloat(cs.paddingBottom) || 0);
      var gap  = parseFloat(getComputedStyle(slogan).marginBottom) || 0;
      var btBox = document.querySelector('.bt-box-1');
      if (btBox) gap += parseFloat(getComputedStyle(btBox).marginTop) || 0;
      var est    = sR.bottom + gap + natH;
      var estRel = s1R.height > 0 ? (est - s1R.top) / s1R.height : 0;
      if (estRel > 0.15 && estRel < 0.96) {
        log('findBtnBottom: slogan estimate ->', (est + scrollY).toFixed(0));
        return est + scrollY;
      }
      log('findBtnBottom: slogan out of range estRel=' + estRel.toFixed(2));
    }

    /* C. 섹션 65% 폴백 */
    var fb = s1R.top + s1R.height * 0.65;
    log('findBtnBottom: 65% fallback ->', (fb + scrollY).toFixed(0));
    return fb + scrollY;
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
      var tail = Math.min(tailProgress, headProgress);
      var visibleLen = (headProgress - tail) * pathLength;
      var dashOffset  = -tail * pathLength;
      pathEl.setAttribute('stroke-dasharray', visibleLen + ' ' + pathLength);
      pathEl.setAttribute('stroke-dashoffset', dashOffset);
    }

    /* Draw: button bottom reaches viewport center → sec2 heading reaches 75% */
    var drawTrigger = ScrollTrigger.create({
      trigger: btn1,
      start: 'bottom center',
      endTrigger: sec2Head,
      end: 'top 75%',
      scrub: true,
      markers: DEBUG,
      onUpdate: function (self) {
        headProgress = self.progress;
        applyDash();
      }
    });

    /* Erase: button fully leaves viewport → sec2 heading reaches 50% */
    ScrollTrigger.create({
      trigger: btn1,
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

    /* 버튼 바텀 절대좌표 — flex-stretch 보정 포함 */
    var btnBot_abs = findBtnBottom(btn1);

    var s2R        = sec2Head.getBoundingClientRect();
    var s2Top_abs  = s2R.top + (window.scrollY || window.pageYOffset);
    var lineH      = Math.max(1, s2Top_abs - btnBot_abs);
    var bR         = btn1.getBoundingClientRect();
    var lineX      = bR.left + bR.width / 2;

    log('btnBot_abs=' + btnBot_abs.toFixed(0) + ' s2Top_abs=' + s2Top_abs.toFixed(0) + ' lineH=' + lineH.toFixed(0));

    /* Position SVG to cover button-to-sec2 span */
    var svgW = AMPLITUDE * 2 + 4;
    svgEl.style.left = (lineX - svgW / 2) + 'px';
    svgEl.style.top  = btnBot_abs + 'px';
    svgEl.style.width  = svgW + 'px';
    svgEl.style.height = lineH + 'px';

    /* Set SVG coordinate space */
    svgEl.setAttribute('width', AMPLITUDE * 2 + 4);
    svgEl.setAttribute('height', Math.ceil(lineH));

    /* Build path and set initial hidden state */
    var relCx = AMPLITUDE + 2;
    pathEl.setAttribute('d', buildPath(relCx, lineH));
    pathLength = pathEl.getTotalLength() || lineH;

    pathEl.setAttribute('stroke-dasharray', '0 ' + pathLength);
    pathEl.setAttribute('stroke-dashoffset', '0');

    log('animation initialized');
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
