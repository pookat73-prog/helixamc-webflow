/* ================================================================
   SECTION 1: HOME PAGE HERO ANIMATION
   GSAP Timeline - slogan -> button -> background
   Dependencies: GSAP 3.12.2+

   Order:
     t=0.3   slogan  1.2s  asymmetric ease-in-out (in 60% / out 40%)
     t=1.3   button  0.8s  expo.out
     t=1.45  bg      1.5s  asymmetric ease-in-out (in 75% / out 25%)
   ================================================================ */

(function () {
  'use strict';

  console.log('[Section1] script loaded');

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

  var started = false;

  function startSection1() {
    if (started) return true;

    if (typeof gsap === 'undefined') {
      console.warn('[Section1] GSAP not loaded yet, retrying...');
      return false;
    }

    var slogan = document.querySelector('.home_slogan');
    var bg     = document.querySelector('.div-block-150');
    var box1   = document.querySelector('.bt-box-1');

    console.log('[Section1] selectors found:',
      'slogan=' + !!slogan,
      'bg=' + !!bg,
      'box1=' + !!box1);

    if (!slogan && !bg && !box1) {
      console.warn('[Section1] no selectors matched, retrying...');
      return false;
    }

    started = true;

    /* Force initial hidden with !important to beat Webflow styles */
    function forceHide(el) {
      if (!el) return;
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
    }
    function clearForced(el) {
      if (!el) return;
      el.style.removeProperty('opacity');
      el.style.removeProperty('visibility');
    }

    forceHide(slogan);
    forceHide(bg);
    forceHide(box1);

    /* Verify actually hidden */
    if (slogan) {
      var cs = window.getComputedStyle(slogan);
      console.log('[Section1] slogan after forceHide: opacity=' + cs.opacity + ' visibility=' + cs.visibility);
    }

    if (box1) box1.setAttribute('data-s1-init', '');

    var tl = gsap.timeline();

    if (slogan) {
      tl.call(function () { clearForced(slogan); }, null, 0.3)
        .fromTo(slogan,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.2, ease: easeSlogan }, 0.3);
    }
    if (box1) {
      tl.call(function () { clearForced(box1); }, null, 1.3)
        .fromTo(box1,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.8,
            ease: 'expo.out',
            onStart:    function () { box1.classList.add('is-holding'); },
            onComplete: function () {
              setTimeout(function () { box1.classList.add('is-looping'); }, 1500);
            }
          }, 1.3);
    }
    if (bg) {
      tl.call(function () { clearForced(bg); }, null, 1.45)
        .fromTo(bg,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.5, ease: easeBg }, 1.45);
    }

    console.log('[Section1] timeline started');
    return true;
  }

  function initWithRetry() {
    if (startSection1()) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (startSection1() || ++tries >= 40) {
        clearInterval(iv);
        if (!started) console.warn('[Section1] init failed after ' + tries + ' retries');
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWithRetry);
  } else {
    initWithRetry();
  }
})();
