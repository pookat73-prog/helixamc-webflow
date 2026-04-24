/* ================================================================
   GLOBAL BUTTON GLOW ANIMATION
   IntersectionObserver trigger + keyframes injected inline
   Dependencies: none
   ================================================================ */

(function () {
  'use strict';

  /* Inject keyframes into document head */
  var style = document.createElement('style');
  style.textContent = [
    '@keyframes helixGlowBlue {',
    '  0%,100% { box-shadow: 0 0 0.8vw 0.25vw rgba(0,117,214,0.85); }',
    '  50%      { box-shadow: 0 0 0.4vw 0.1vw  rgba(0,117,214,0.08); }',
    '}',
    '@keyframes helixGlowPurple {',
    '  0%,100% { box-shadow: 0 0 0.8vw 0.25vw rgba(85,40,170,0.85); }',
    '  50%      { box-shadow: 0 0 0.4vw 0.1vw  rgba(85,40,170,0.08); }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  function isPurple(el) {
    return el.classList.contains('bt-box-4');
  }

  function startGlow(el) {
    var shadow = isPurple(el)
      ? '0 0 0.8vw 0.25vw rgba(85,40,170,0.85)'
      : '0 0 0.8vw 0.25vw rgba(0,117,214,0.85)';

    /* Phase 1: fade-in to full glow */
    el.style.transition = 'box-shadow 0.6s ease';
    el.style.boxShadow  = shadow;

    /* Phase 2: swap to pulsing loop after 1.5s */
    setTimeout(function () {
      el.style.transition = 'none';
      el.style.animation  = isPurple(el)
        ? 'helixGlowPurple 2.8s ease-in-out infinite'
        : 'helixGlowBlue 2.8s ease-in-out infinite';
    }, 1500);
  }

  function initButtonGlow() {
    var targets = document.querySelectorAll('.bt-box-1,.bt-box-2,.bt-box-3,.bt-box-4');
    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        if (el.hasAttribute('data-s1-ghost')) return;
        if (el.hasAttribute('data-s1-init'))  return;
        startGlow(el);
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
