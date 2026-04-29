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
      ? '0 0 1.7vw 0.3vw rgba(85,40,170,1)'
      : '0 0 1.7vw 0.3vw rgba(0,117,214,1)';

    /* Phase 1: 최고밝기 즉시 설정 */
    el.style.setProperty('box-shadow', maxGlow, 'important');

    /* Phase 2: 1.5초 홀드 후 CSS is-looping으로 핸드오프 */
    setTimeout(function () {
      el.style.removeProperty('box-shadow');
      el.classList.add('is-looping');
    }, 1500);
  }

  function initButtonGlow() {
    /* bt-box-1 은 section1.js 가, bt-box-2 는 sections-animations.js 가
       각자 페이드인 + 글로우 시퀀스를 통제하므로 여기서는 bt-box-3/4 만 담당 */
    var targets = document.querySelectorAll('.bt-box-3,.bt-box-4');
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
