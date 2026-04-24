/* ═══════════════════════════════════════════════════════════════
   SECTION 1: HOME PAGE HERO ANIMATION
   JavaScript - GSAP Timeline Logic
   Dependencies: GSAP 3.12.2+ (loaded via CDN)

   등장 순서: 슬로건 → 버튼 → 배경
   t=0.3  슬로건  1.2s  비대칭 ease-in-out (in 60% / out 40%)
   t=0.5  버튼    0.8s  expo.out (확 등장 → 서서히 안착)
   t=0.65 배경    1.5s  비대칭 ease-in-out (in 75% / out 25%, 더 극단적)

   글로우: .bt-box-1 래퍼에 적용 (buttons.css와 일관성 유지)
   data-s1-init: buttons.js 중복 트리거 방지용 마킹
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* 비대칭 ease-in-out: inRatio = in 페이즈가 차지하는 비율
     inRatio=0.6 → 앞 60% 구간이 ease-in, 뒤 40%가 ease-out
     inRatio=0.75 → 앞 75%가 ease-in, 뒤 25%가 ease-out (더 극단적) */
  function asymInOut(inRatio, inPow) {
    inPow = inPow || 2;
    var outRatio = 1 - inRatio;
    return function (t) {
      if (t < inRatio) {
        // ease-in 구간: 0 → 0.5
        var ti = t / inRatio;
        return 0.5 * Math.pow(ti, inPow);
      }
      // ease-out 구간: 0.5 → 1
      var to = (t - inRatio) / outRatio;
      return 0.5 + 0.5 * to * (2 - to);
    };
  }

  var easeSlogan = asymInOut(0.6, 2);   // 슬로건: in 60% / out 40%
  var easeBg     = asymInOut(0.75, 3);  // 배경: in 75% / out 25%, power3 in

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

    // 슬로건: t=0.3, 1.2s — 비대칭 inOut (in60/out40)
    tl.to('.home_slogan', {
      autoAlpha: 1,
      duration: 1.2,
      ease: easeSlogan
    }, 0.3);

    // 버튼: t=0.5, 0.8s — expo.out (팍 켜졌다 서서히 안착)
    tl.to('.bt-box-1', {
      autoAlpha: 1,
      duration: 0.8,
      ease: 'expo.out',
      onStart: function () {
        if (box1) box1.classList.add('is-holding');
      },
      onComplete: function () {
        setTimeout(function () {
          if (box1) box1.classList.add('is-looping');
        }, 1500);
      }
    }, 0.5);

    // 배경: t=0.65, 1.5s — 비대칭 inOut (in75/out25, power3 in)
    tl.to('.div-block-150', {
      autoAlpha: 1,
      duration: 1.5,
      ease: easeBg
    }, 0.65);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    setTimeout(startSection1, 100);
  });
})();
