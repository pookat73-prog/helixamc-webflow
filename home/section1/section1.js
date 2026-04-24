/* ================================================================
   SECTION 1: HOME PAGE HERO ANIMATION
   GSAP Timeline - slogan -> button -> background
   Dependencies: GSAP 3.12.2+

   Order:
     t=0.3   slogan  1.2s  asymmetric ease-in-out (in 60% / out 40%)
     t=1.3   button  0.8s  expo.out
     t=1.45  bg      1.5s  asymmetric ease-in-out (in 75% / out 25%)

   Glow: applied to .bt-box-1 wrapper (consistent with buttons.css)
   data-s1-init: marker to prevent buttons.js IntersectionObserver double-trigger
   ================================================================ */

(function () {
  'use strict';

  /* Asymmetric ease-in-out:
     inRatio=0.6  -> first 60% is ease-in, last 40% ease-out
     inRatio=0.75 -> first 75% is ease-in, last 25% ease-out (more extreme) */
  function asymInOut(inRatio, inPow) {
    inPow = inPow || 2;
    var outRatio = 1 - inRatio;
    return function (t) {
      if (t < inRatio) {
        var ti = t / inRatio;
        return 0.5 * Math.pow(ti, inPow);
      }
      var to = (t - inRatio) / outRatio;
      return 0.5 + 0.5 * to * (2 - to);
    };
  }

  var easeSlogan = asymInOut(0.6, 2);
  var easeBg     = asymInOut(0.75, 3);

  function startSection1() {
    if (typeof gsap === 'undefined') {
      console.warn('[Section1] GSAP not loaded.');
      return;
    }

    var box1 = document.querySelector('.bt-box-1');
    var tl = gsap.timeline();

    gsap.set(['.home_slogan', '.div-block-150', '.bt-box-1'], { autoAlpha: 0 });

    if (box1) box1.setAttribute('data-s1-init', '');

    tl.to('.home_slogan', {
      autoAlpha: 1,
      duration: 1.2,
      ease: easeSlogan
    }, 0.3);

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
    }, 1.3);

    tl.to('.div-block-150', {
      autoAlpha: 1,
      duration: 1.5,
      ease: easeBg
    }, 1.45);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    setTimeout(startSection1, 100);
  });
})();
