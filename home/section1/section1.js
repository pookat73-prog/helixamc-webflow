/* ═══════════════════════════════════════════════════════════════
   SECTION 1: HOME PAGE HERO ANIMATION
   JavaScript - GSAP Timeline Logic
   Dependencies: GSAP 3.12.2+ (loaded via CDN)
   Updated: 2026-04-24
   ═══════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    var started = false;

    function startSection1() {
        if (started) return;
        started = true;

        // GSAP이 로드되지 않으면 폴백으로 요소 가시화 후 종료
        if (typeof gsap === 'undefined') {
            console.warn('[Section1] GSAP not loaded. Applying fallback visibility.');
            document.querySelectorAll('.home_slogan, .div-block-150, .discover-helix_button, .flex-block-23')
                .forEach(function(el) { el.style.opacity = '1'; el.style.visibility = 'visible'; });
            return;
        }

        const tl = gsap.timeline();
        const b1 = document.querySelector('.discover-helix_button');
        const b4 = document.querySelector('.flex-block-23 .cta-style');

        if (!b4) console.warn('[Section1] .flex-block-23 .cta-style not found. Purple button glow skipped.');

        /* 0. 즉시 가시성 확보 준비 (FOUC 방지) */
        gsap.set([
            ".home_slogan", 
            ".div-block-150", 
            ".discover-helix_button", 
            ".flex-block-23"
        ], { autoAlpha: 0 });

        /* 1. 슬로건: t=0.3s, 1.2s, power2.out → 종료 t=1.5s */
        tl.to(".home_slogan", {
            autoAlpha: 1,
            duration: 1.2,
            ease: "power2.out"
        }, 0.3);

        /* 2. 배경: t=0.8s, 2.0s, power3.out → 종료 t=2.8s */
        tl.to(".div-block-150", {
            autoAlpha: 1,
            duration: 2.0,
            ease: "power3.out"
        }, 0.8);

        /* 3. 버튼: t=0.9s(배경+0.1), 1.9s, power2.out → 종료 t=2.8s (배경과 동일) */
        tl.to([".discover-helix_button", ".flex-block-23"], {
            autoAlpha: 1,
            duration: 1.9,
            ease: "power2.out",
            onStart: () => {
                if (b1) b1.classList.add('is-holding');
                if (b4) b4.classList.add('is-holding');
                // 버튼 등장 시점 기준 1.5s 후 루프 전환 (onComplete 기준 아님)
                setTimeout(() => {
                    if (b1) { b1.classList.remove('is-holding'); b1.classList.add('is-looping'); }
                    if (b4) { b4.classList.remove('is-holding'); b4.classList.add('is-looping'); }
                }, 1500);
            }
        }, 0.9);
    }

    // Webflow push (초기 로드 시)
    window.Webflow = window.Webflow || [];
    window.Webflow.push(function() { setTimeout(startSection1, 100); });

    // 폴백: Webflow가 이미 실행된 경우 load 이벤트로 처리
    if (document.readyState === 'complete') {
        setTimeout(startSection1, 100);
    } else {
        window.addEventListener('load', function() { setTimeout(startSection1, 100); });
    }
})();
