/* ═══════════════════════════════════════════════════════════════
   SECTION DIVIDER: Section 1 → Section 2 Crossing Line
   JavaScript - IntersectionObserver trigger (no GSAP required)
   Synced from Webflow Custom Code
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function initDivider() {
    const divider = document.querySelector('.section-divider');
    if (!divider) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            divider.classList.add('is-visible');
            observer.unobserve(divider);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(divider);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    setTimeout(initDivider, 100);
  });
})();
