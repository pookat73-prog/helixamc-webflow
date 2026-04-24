/* ═══════════════════════════════════════════════════════════════
   SECTION CONNECTOR LINE: Button 1 bottom-center → Section 2 head top (-0.5vw)
   JavaScript - DOM injection + dynamic positioning
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SEC2_HEAD_CLASS = '.section2-heading';
  var BTN1_CLASS      = '.discover-helix_button';

  var line            = null;
  var btn1            = null;
  var sec2Head        = null;
  var positionLine    = null;

  function ensureLine() {
    if (line) return line;
    line = document.createElement('div');
    line.className = 'section-connector-line';
    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(line);
    return line;
  }

  function setup() {
    if (line && btn1 && sec2Head) return true;

    btn1     = btn1     || document.querySelector(BTN1_CLASS);
    sec2Head = sec2Head || document.querySelector(SEC2_HEAD_CLASS);

    if (!btn1 || !sec2Head) return false;

    ensureLine();

    positionLine = function () {
      var r1 = btn1.getBoundingClientRect();
      var r2 = sec2Head.getBoundingClientRect();
      var sy = window.scrollY || window.pageYOffset;
      line.style.left   = (r1.left + r1.width / 2) + 'px';
      line.style.top    = (r1.bottom + sy) + 'px';
      line.style.height = Math.max(0, r2.top - r1.bottom - 0.005 * window.innerWidth) + 'px';
    };

    positionLine();
    window.addEventListener('resize', positionLine);

    // 이미지/폰트 로드 후 레이아웃 변화 대응
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(positionLine);
    }
    window.addEventListener('load', function () { setTimeout(positionLine, 100); });

    return true;
  }

  // 재시도 루프: 최대 10초 동안 0.3초마다 시도
  function retryInit() {
    var tries = 0;
    var max   = 33;
    var iv    = setInterval(function () {
      if (setup() || ++tries >= max) clearInterval(iv);
    }, 300);
  }

  // Webflow push
  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () { setTimeout(retryInit, 100); });

  // 폴백1: load 이벤트
  if (document.readyState === 'complete') {
    setTimeout(retryInit, 100);
  } else {
    window.addEventListener('load', function () { setTimeout(retryInit, 100); });
  }

  // 폴백2: DOMContentLoaded
  if (document.readyState !== 'loading') {
    setTimeout(retryInit, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(retryInit, 200); });
  }
})();
