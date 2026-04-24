/* ═══════════════════════════════════════════════════════════════
   GLOBAL BUTTON GLOW ANIMATION
   JavaScript - IntersectionObserver trigger
   Dependencies: none (no GSAP required)
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    function initButtonGlow() {
        const targets = document.querySelectorAll(
            '.bt-box-1, .bt-box-2, .bt-box-3, .bt-box-4'
        );
        if (!targets.length) return;

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    observer.unobserve(el);
                    // section1.js가 관리하는 요소는 건너뜀 (중복 트리거 방지)
                    if (el.hasAttribute('data-s1-init')) return;
                    el.classList.add('is-holding');
                    setTimeout(function () {
                        el.classList.add('is-looping');
                    }, 1500);
                });
            },
            { threshold: 0.3 }
        );

        targets.forEach(function (el) { observer.observe(el); });
    }

    window.Webflow = window.Webflow || [];
    window.Webflow.push(function () { setTimeout(initButtonGlow, 100); });
})();
