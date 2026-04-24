/* ═══════════════════════════════════════════════════════════════
   SECTION 1: HOME PAGE HERO ANIMATION
   JavaScript - GSAP Timeline Logic
   Dependencies: GSAP 3.12.2+ (loaded via CDN)

   타임라인 (슬로건 시작 t=0.2 기준)
   t=0.5  슬로건    1.2s ease-out  → 끝 t=1.7
   t=1.6  배경      1.4s power3.out → 끝 t=3.0  (버튼과 동시 종료)
   t=2.2  버튼      0.8s ease-out  → 끝 t=3.0  (배경과 동시 종료)
   t=3.0~ 버튼 후광  1.5s 최대 → 펄스 루프

   글로우: .bt-box-1 래퍼에 적용 (buttons.css와 일관성 유지)
   data-s1-init: buttons.js 중복 트리거 방지용 마킹
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function startSection1() {
    if (typeof gsap === 'undefined') {
      console.warn('[Section1] GSAP not loaded.');
      return;
    }

    var box1 = document.querySelector('.bt-box-1');
    var tl = gsap.timeline();

    // FOUC 방지: 등장 전 완전 숨김
    gsap.set(['.home_slogan', '.div-block-150', '.bt-box-1'], { autoAlpha: 0 });

    // buttons.js IntersectionObserver 중복 방지
    if (box1) box1.setAttribute('data-s1-init', '');

    // 슬로건: t=0.5, 1.2s, ease-out
    tl.to('.home_slogan', {
      autoAlpha: 1,
      duration: 1.2,
      ease: 'power2.out'
    }, 0.5);

    // 배경: t=1.6, 1.4s, power3.out → t=3.0 종료 (버튼과 동시)
    tl.to('.div-block-150', {
      autoAlpha: 1,
      duration: 1.4,
      ease: 'power3.out'
    }, 1.6);

    // 버튼 래퍼: t=2.2, 0.8s → t=3.0 종료 (배경과 동시)
    tl.to('.bt-box-1', {
      autoAlpha: 1,
      duration: 0.8,
      ease: 'power2.out',
      onStart: function () {
        if (box1) box1.classList.add('is-holding');
      },
      onComplete: function () {
        setTimeout(function () {
          if (box1) box1.classList.add('is-looping');
        }, 1500);
      }
    }, 2.2);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    setTimeout(startSection1, 100);
  });
})();
