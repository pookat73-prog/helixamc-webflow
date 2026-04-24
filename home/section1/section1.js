/* ═══════════════════════════════════════════════════════════════
   SECTION 1: HOME PAGE HERO ANIMATION
   JavaScript - GSAP Timeline Logic
   Dependencies: GSAP 3.12.2+ (loaded via CDN)

   타임라인 (슬로건 시작 t=0.2 기준)
   t=0.2  슬로건    1.2s ease-out
   t=1.0  배경      0.9s power3.out
   t=1.1  버튼      0.8s ease-out  →  끝 t=1.9
   t=1.9~ 버튼 후광  1.5s 최대 → 펄스 루프
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function startSection1() {
    if (typeof gsap === 'undefined') {
      console.warn('[Section1] GSAP not loaded.');
      return;
    }

    var b1 = document.querySelector('.discover-helix_button');
    var b4 = document.querySelector('.flex-block-23 .cta-style');
    var tl = gsap.timeline();

    // FOUC 방지
    gsap.set(['.home_slogan', '.div-block-150', '.bt-box-1'], { autoAlpha: 0 });

    // 슬로건: t=0.2, 1.2s, ease-out
    tl.to('.home_slogan', {
      autoAlpha: 1,
      duration: 1.2,
      ease: 'power2.out'
    }, 0.2);

    // 배경: t=1.0, 0.9s, power3.out
    tl.to('.div-block-150', {
      autoAlpha: 1,
      duration: 0.9,
      ease: 'power3.out'
    }, 1.0);

    // 버튼 래퍼(bt-box-1): t=1.1, 0.8s, ease-out
    tl.to('.bt-box-1', {
      autoAlpha: 1,
      duration: 0.8,
      ease: 'power2.out',
      onStart: function () {
        if (b1) b1.classList.add('is-holding');
        if (b4) b4.classList.add('is-holding');
      },
      onComplete: function () {
        setTimeout(function () {
          if (b1) b1.classList.add('is-looping');
          if (b4) b4.classList.add('is-looping');
        }, 1500);
      }
    }, 1.1);
  }

  // 🧪 CDN 자동 배포 테스트: "짠" 오버레이 (테스트 후 제거 예정)
  function injectZanTest() {
    if (document.getElementById('cdn-test-zan')) return;
    var zan = document.createElement('div');
    zan.id = 'cdn-test-zan';
    zan.textContent = '짠';
    zan.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'font-size:30vw;font-weight:900;color:#0075d6;' +
      'text-shadow:0 0 60px rgba(0,117,214,0.8),0 0 20px rgba(0,117,214,1);' +
      'z-index:99999;pointer-events:none;font-family:sans-serif;';
    document.body.appendChild(zan);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    injectZanTest();
    setTimeout(startSection1, 100);
  });
})();
