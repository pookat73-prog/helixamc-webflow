/* ================================================================
   GLOBAL BUTTON GLOW ANIMATION
   GSAP tween으로 box-shadow 직접 제어 (인라인 스타일 우선순위 보장)
   Dependencies: GSAP (already loaded via bootstrap)
   ================================================================ */

(function () {
  'use strict';

  function isPurple(el) {
    return el.classList.contains('bt-box-4');
  }

  function startGlow(el) {
    if (!window.gsap) return;

    var maxGlow = isPurple(el)
      ? '0 0 1.6vw 0.6vw rgba(85,40,170,1), 0 0 3vw 1vw rgba(85,40,170,0.5)'
      : '0 0 1.6vw 0.6vw rgba(0,117,214,1), 0 0 3vw 1vw rgba(0,117,214,0.5)';
    var minGlow = isPurple(el)
      ? '0 0 0.15vw 0.05vw rgba(85,40,170,0.05)'
      : '0 0 0.15vw 0.05vw rgba(0,117,214,0.05)';

    /* Phase 1: fade in to max glow over 0.6s */
    gsap.to(el, { boxShadow: maxGlow, duration: 0.6, ease: 'power2.out' });

    /* Phase 2: pulse loop starting after 1.5s */
    gsap.to(el, {
      boxShadow: minGlow,
      duration: 1.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 1.5
    });
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
