/* ═══════════════════════════════════════════════════════════════
   SECTION CONNECTOR LINE: Button 1 bottom-center → Section 2 head top (-0.5vw)
   JavaScript - DOM injection + dynamic positioning

   디버그: URL에 ?debug-line=1 추가 또는 window.DEBUG_SECTION_LINE = true
   Version: 4
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var BTN1_CLASS = '.discover-helix_button';

  var DEBUG = window.DEBUG_SECTION_LINE ||
              /[?&]debug-line=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[SectionLine]'].concat([].slice.call(arguments)));
  } : function () {};

  var line         = null;
  var btn1         = null;
  var sec2Head     = null;
  var positionLine = null;
  var initialized  = false;

  /* 섹션 2 헤딩 자동 탐지:
     1) .section2-heading 클래스 우선
     2) 버튼의 조상 중 형제 노드를 가진 레벨에서 다음 형제의 첫 헤딩 */
  function findSec2Head(btn) {
    var explicit = document.querySelector('.section2-heading');
    if (explicit) { log('sec2Head: .section2-heading 클래스로 찾음'); return explicit; }

    var node = btn.parentElement;
    while (node && node !== document.body) {
      var sib = node.nextElementSibling;
      if (sib) {
        var h = sib.querySelector('h1, h2, h3, h4, [class*="heading"], [class*="Heading"]');
        if (h) { log('sec2Head: DOM 자동탐지 →', h.tagName, h.className.slice(0, 40)); return h; }
      }
      node = node.parentElement;
    }
    log('sec2Head: 찾지 못함 — .section2-heading 클래스를 섹션 2 헤딩에 추가하면 정확해집니다');
    return null;
  }

  function ensureLine() {
    if (line) return line;
    line = document.createElement('div');
    line.className = 'section-connector-line';
    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(line);
    log('line 생성 완료');
    return line;
  }

  function setup() {
    if (initialized) return true;

    btn1 = btn1 || document.querySelector(BTN1_CLASS);
    if (!btn1) { log('setup waiting — .discover-helix_button 없음'); return false; }

    sec2Head = sec2Head || findSec2Head(btn1);
    if (!sec2Head) { log('setup waiting — 섹션 2 헤딩 없음'); return false; }

    // 레이아웃 완료 확인
    var r1check = btn1.getBoundingClientRect();
    if (r1check.width === 0 && r1check.height === 0) {
      log('setup waiting — 버튼 레이아웃 미완료');
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
      log('positioned — x:', x.toFixed(1), 'y:', y.toFixed(1), 'h:', h.toFixed(1));
    };

    positionLine();
    window.addEventListener('resize', positionLine);
    window.addEventListener('scroll', positionLine, { passive: true });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(positionLine); }
    window.addEventListener('load', function () { setTimeout(positionLine, 100); });

    initialized = true;
    log('setup complete');
    return true;
  }

  function retryInit(source) {
    if (initialized) return;
    log('retryInit from:', source);
    var tries = 0;
    var iv = setInterval(function () {
      if (setup() || ++tries >= 33) {
        clearInterval(iv);
        if (!initialized) log('retry 포기 — 요소를 찾지 못했습니다 (' + tries + '회)');
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
