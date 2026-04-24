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

    if (bg && slogan) console.log('[Section1] bg contains slogan?', bg.contains(slogan));
    if (bg && box1)   console.log('[Section1] bg contains box1?',   bg.contains(box1));
    if (slogan) console.log('[Section1] slogan parent:', slogan.parentElement && slogan.parentElement.className);
    if (box1)   console.log('[Section1] box1 parent:',   box1.parentElement   && box1.parentElement.className);
    if (bg)     console.log('[Section1] bg parent:',     bg.parentElement     && bg.parentElement.className);

    if (!slogan && !bg && !box1) {
      console.warn('[Section1] no selectors matched, retrying...');
      return false;
    }

    started = true;

    /* Force opacity + visibility with !important inline so we beat Webflow CSS */
    function forceOpacity(el, v) {
      if (!el) return;
      el.style.setProperty('opacity', String(v), 'important');
      el.style.setProperty('visibility', v > 0 ? 'visible' : 'hidden', 'important');
    }

    forceOpacity(slogan, 0);
    forceOpacity(bg, 0);
    forceOpacity(box1, 0);

    if (slogan) {
      var cs = window.getComputedStyle(slogan);
      console.log('[Section1] slogan after forceHide: opacity=' + cs.opacity + ' visibility=' + cs.visibility);
    }

    if (box1) box1.setAttribute('data-s1-init', '');

    var t0 = performance.now();
    function elapsed() { return ((performance.now() - t0) / 1000).toFixed(2); }

    /* Independent tweens with explicit delay (no shared timeline) */
    function fadeIn(el, name, duration, ease, delay, onStart, onComplete) {
      if (!el) return;
      var state = { v: 0 };
      gsap.to(state, {
        v: 1,
        duration: duration,
        delay: delay,
        ease: ease,
        onStart: function () {
          console.log('[Section1] ' + name + ' fade start at t=' + elapsed() + 's');
          if (onStart) onStart();
        },
        onUpdate: function () { forceOpacity(el, state.v); },
        onComplete: onComplete
      });
    }

    fadeIn(slogan, 'slogan', 1.2, easeSlogan, 0.3);
    fadeIn(box1, 'button', 0.8, 'expo.out', 1.3,
      function () { if (box1) box1.classList.add('is-holding'); },
      function () {
        setTimeout(function () { if (box1) box1.classList.add('is-looping'); }, 1500);
      });
    fadeIn(bg, 'bg', 1.5, easeBg, 1.45);

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
