/* ================================================================
   GLOBAL BUTTON GLOW ANIMATION
   IntersectionObserver trigger
   Dependencies: none
   ================================================================ */

(function () {
  'use strict';

  function initButtonGlow() {
    var targets = document.querySelectorAll(
      '.bt-box-1, .bt-box-2, .bt-box-3, .bt-box-4'
    );
    console.log('[ButtonGlow] found', targets.length, 'button targets');
    if (!targets.length) {
      console.warn('[ButtonGlow] no buttons found with selectors: .bt-box-1/2/3/4');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        /* Skip section1.js ghost placeholders and managed elements */
        if (el.hasAttribute('data-s1-ghost')) {
          console.log('[ButtonGlow] skipped ghost:', el.className);
          return;
        }
        if (el.hasAttribute('data-s1-init')) {
          console.log('[ButtonGlow] skipped s1-init:', el.className);
          return;
        }
        console.log('[ButtonGlow] adding is-holding to:', el.className);
        el.classList.add('is-holding');
        setTimeout(function () {
          console.log('[ButtonGlow] adding is-looping to:', el.className);
          el.classList.add('is-looping');
        }, 1500);
      });
    }, { threshold: 0.3 });

    targets.forEach(function (el) {
      if (el.hasAttribute('data-s1-ghost')) return;
      observer.observe(el);
    });
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () { setTimeout(initButtonGlow, 100); });
})();
