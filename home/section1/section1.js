/* ═══════════════════════════════════════════════════════════════
   SECTION 1: HOME PAGE HERO ANIMATION
   JavaScript - GSAP Timeline Logic
   Dependencies: GSAP 3.12.2+ (loaded via CDN)

   타임라인 (슬로건 시작 t=0.2 기준)
   t=0.3  슬로건    1.5s ease-out  → 끝 t=1.8
   t=1.5  배경      1.3s power3.out → 끝 t=2.8  (슬로건 끝 0.3s 전에 시작)
   t=1.8  버튼      1.0s ease-out  → 끝 t=2.8  (슬로건 완료 시점에 시작)
   t=2.8~ 버튼 후광  1.5s 최대 → 펄스 루프

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

    // 슬로건: t=0.3, 1.5s, ease-out
    tl.to('.home_slogan', {
      autoAlpha: 1,
      duration: 1.5,
      ease: 'power2.out'
    }, 0.3);

    // 배경: t=1.5, 1.3s → t=2.8 종료 (슬로건 73% 시점에 시작)
    tl.to('.div-block-150', {
      autoAlpha: 1,
      duration: 1.3,
      ease: 'power3.out'
    }, 1.5);

    // 버튼: t=1.8, 1.0s → t=2.8 종료 (슬로건 완료 시점, 배경과 동시 종료)
    tl.to('.bt-box-1', {
      autoAlpha: 1,
      duration: 1.0,
      ease: 'power2.out',
      onStart: function () {
        if (box1) box1.classList.add('is-holding');
      },
      onComplete: function () {
        setTimeout(function () {
          if (box1) box1.classList.add('is-looping');
        }, 1500);
      }
    }, 1.8);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    setTimeout(startSection1, 100);
  });
})();
