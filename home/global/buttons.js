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
                    el.classList.add('is-holding');
                    setTimeout(function () {
                        el.classList.remove('is-holding');
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
