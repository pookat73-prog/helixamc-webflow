/* ═══════════════════════════════════════════════════════════════
   SECTION CONNECTOR LINE: Button 1 bottom-center → Section 2 head top (-0.5vw)
   JavaScript - DOM injection + dynamic positioning
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SEC2_HEAD_CLASS = '.section2-heading';

  function createConnectorLine() {
    var btn1     = document.querySelector('.discover-helix_button');
    var sec2Head = document.querySelector(SEC2_HEAD_CLASS);

    if (!btn1 || !sec2Head) {
      console.warn('[SectionLine] 요소를 찾을 수 없습니다:', !btn1 ? '.discover-helix_button' : SEC2_HEAD_CLASS);
      return;
    }

    var line = document.createElement('div');
    line.className = 'section-connector-line';

    if (document.body.style.position !== 'relative') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(line);

    function positionLine() {
      var btn1Rect  = btn1.getBoundingClientRect();
      var sec2Rect  = sec2Head.getBoundingClientRect();
      var scrollY   = window.scrollY || window.pageYOffset;

      var x      = btn1Rect.left + btn1Rect.width / 2;
      var yStart = btn1Rect.bottom + scrollY;
      var yEnd   = sec2Rect.top + scrollY - 0.005 * window.innerWidth;

      line.style.left   = x + 'px';
      line.style.top    = yStart + 'px';
      line.style.height = Math.max(0, yEnd - yStart) + 'px';
    }

    positionLine();
    window.addEventListener('resize', positionLine);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    setTimeout(createConnectorLine, 200);
  });
})();
