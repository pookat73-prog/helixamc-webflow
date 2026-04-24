/* ═══════════════════════════════════════════════════════════════
   SECTION 1: HOME PAGE HERO ANIMATION
   JavaScript - GSAP Timeline Logic
   Dependencies: GSAP 3.12.2+ (loaded via CDN)
   ═══════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    function startSection1() {
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

        /* 1. 헤드(슬로건): 0s 즉시 등장 (검은 바닥 덕분에 바로 보임) */
        tl.to(".home_slogan", { 
            autoAlpha: 1, 
            duration: 1.2, 
            ease: "power2.out" 
        }, 0);

        /* 2. 배경 알맹이: 1.8s 등장 (슬로건 완전 등장 후 0.6s 공백 뒤 입장) */
        tl.to(".div-block-150", {
            autoAlpha: 1,
            duration: 1.0,
            ease: "none"
        }, 1.8);

        /* 3. 버튼: 3.0s 등장 시작 -> 3.6s 종료 (배경 완전 등장 후 합류) */
        tl.to([".discover-helix_button", ".flex-block-23"], {
            autoAlpha: 1,
            duration: 0.6,
            ease: "power2.out",
            onStart: () => {
                if (b1) b1.classList.add('is-holding');
                if (b4) b4.classList.add('is-holding');
            },
            onComplete: () => {
                // 등장 완료 후 1.5초 정지 후 루프로 매끄럽게 연결
                // is-holding 제거 후 is-looping 추가: !important 충돌로 애니메이션이 차단되는 것을 방지
                setTimeout(() => {
                    if (b1) { b1.classList.remove('is-holding'); b1.classList.add('is-looping'); }
                    if (b4) { b4.classList.remove('is-holding'); b4.classList.add('is-looping'); }
                }, 1500);
            }
        }, 3.0);
    }

    // Webflow와 호환되는 초기화
    window.Webflow = window.Webflow || [];
    window.Webflow.push(() => { 
        setTimeout(startSection1, 100); 
    });
})();

