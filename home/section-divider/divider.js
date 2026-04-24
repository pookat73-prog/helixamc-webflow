/* ═══════════════════════════════════════════════════════════════
   SECTION CONNECTOR LINE: Button 1 bottom-center → Section 2 head top (-0.5vw)
   JavaScript - DOM injection + dynamic positioning
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SEC2_HEAD_CLASS = '.section2-heading';

  function createConnectorLine() {
    if (document.querySelector('.section-connector-line')) return;

    var btn1     = document.querySelector('.discover-helix_button');
    var sec2Head = document.querySelector(SEC2_HEAD_CLASS);

    if (!btn1 || !sec2Head) return;

    var line = document.createElement('div');
    line.className = 'section-connector-line';
    document.body.style.position = 'relative';
    document.body.appendChild(line);

    function positionLine() {
      var r1 = btn1.getBoundingClientRect();
      var r2 = sec2Head.getBoundingClientRect();
      var sy = window.scrollY || window.pageYOffset;
      line.style.left   = (r1.left + r1.width / 2) + 'px';
      line.style.top    = (r1.bottom + sy) + 'px';
      line.style.height = Math.max(0, r2.top - r1.bottom - 0.005 * window.innerWidth) + 'px';
    }

    positionLine();
    window.addEventListener('resize', positionLine);
  }

  // Webflow push (초기 로드 시)
  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () { setTimeout(createConnectorLine, 200); });

  // 폴백: Webflow가 이미 실행된 경우 load 이벤트로 처리
  if (document.readyState === 'complete') {
    setTimeout(createConnectorLine, 300);
  } else {
    window.addEventListener('load', function () { setTimeout(createConnectorLine, 300); });
  }
})();
