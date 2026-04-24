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
      console.log('[ButtonGlow] intersection callback fired with', entries.length, 'entries');
      entries.forEach(function (entry) {
        console.log('[ButtonGlow] entry:', entry.target.className, 'isIntersecting:', entry.isIntersecting);
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
        console.log('[ButtonGlow] element:', el, 'display:', window.getComputedStyle(el).display);
        el.classList.add('is-holding');
        el.style.boxShadow = '0 0 0.8vw 0.25vw rgba(0, 117, 214, 0.85)';
        el.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        console.log('[ButtonGlow] after style:', el.style.boxShadow, el.style.backgroundColor);
        setTimeout(function () {
          console.log('[ButtonGlow] adding is-looping to:', el.className);
          el.classList.add('is-looping');
        }, 1500);
      });
    }, { threshold: 0.3 });

    var observeCount = 0;
    targets.forEach(function (el) {
      if (el.hasAttribute('data-s1-ghost')) {
        console.log('[ButtonGlow] skipping observe for ghost');
        return;
      }
      console.log('[ButtonGlow] observing button:', el.className);
      observer.observe(el);
      observeCount++;
    });
    console.log('[ButtonGlow] started observing', observeCount, 'buttons');
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () { setTimeout(initButtonGlow, 100); });
})();
