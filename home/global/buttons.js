/* ═══════════════════════════════════════════════════════════════
   GLOBAL BUTTON GLOW ANIMATION
   JavaScript - IntersectionObserver trigger
   Dependencies: none (no GSAP required)
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    var started = false;

    function initButtonGlow() {
        if (started) return;
        started = true;

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

    // Webflow push (초기 로드 시)
    window.Webflow = window.Webflow || [];
    window.Webflow.push(function () { setTimeout(initButtonGlow, 100); });

    // 폴백: Webflow가 이미 실행된 경우 load 이벤트로 처리
    if (document.readyState === 'complete') {
        setTimeout(initButtonGlow, 100);
    } else {
        window.addEventListener('load', function () { setTimeout(initButtonGlow, 100); });
    }
})();
