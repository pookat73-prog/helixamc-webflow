/* ================================================================
   SECTION 1: HOME PAGE HERO ANIMATION
   GSAP Timeline - slogan -> button -> background
   Dependencies: GSAP 3.12.2+

   Order:
     t=0.3   slogan  1.2s  asymmetric ease-in-out (in 60% / out 40%)
     t=1.3   button  0.8s  expo.out
     t=1.45  bg      1.5s  asymmetric ease-in-out (in 75% / out 25%)

   DOM detach ("virtual placeholder") strategy:
     slogan and button are typically children of .div-block-150 (bg).
     CSS opacity on the parent cascades to children, so hiding bg also
     hides its children. To let each element fade independently we:
       1. Clone el as a hidden ghost that holds the layout slot
       2. Move the real el to bg's parent with position:absolute and
          coordinates matching the ghost's position
       3. After bg's fade completes, restore the real el to its
          original DOM position and remove the ghost.

   Debug: add ?debug-s1=1 to URL or set window.DEBUG_SECTION1 = true
   ================================================================ */

(function () {
  'use strict';

  /* bt-box-1을 가능한 빨리 표시해 buttons.js와의 레이스 컨디션 방지 */
  (function earlyProtect() {
    var b1 = document.querySelector('.bt-box-1');
    if (b1) b1.setAttribute('data-s1-init', '');
  }());

  var DEBUG = window.DEBUG_SECTION1 ||
              /[?&]debug-s1=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[Section1]'].concat([].slice.call(arguments)));
  } : function () {};

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

  /* Virtual placeholder: clone el as ghost, move el out to targetParent */
  function detachWithGhost(el, targetParent) {
    var origParent = el.parentNode;
    var origNext   = el.nextSibling;

    if (window.getComputedStyle(targetParent).position === 'static') {
      targetParent.style.position = 'relative';
    }

    var ghost = el.cloneNode(true);
    ghost.style.visibility    = 'hidden';
    ghost.style.pointerEvents = 'none';
    ghost.removeAttribute('id');
    ghost.setAttribute('data-s1-ghost', '1');
    origParent.insertBefore(ghost, el);

    var gRect = ghost.getBoundingClientRect();
    var pRect = targetParent.getBoundingClientRect();

    el.style.setProperty('position', 'absolute', 'important');
    el.style.setProperty('left',     (gRect.left - pRect.left) + 'px', 'important');
    el.style.setProperty('top',      (gRect.top  - pRect.top)  + 'px', 'important');
    el.style.setProperty('width',    gRect.width  + 'px', 'important');
    el.style.setProperty('margin',   '0', 'important');
    el.style.setProperty('z-index',  '100', 'important');

    targetParent.appendChild(el);

    return {
      cleanup: function () {
        el.style.removeProperty('position');
        el.style.removeProperty('left');
        el.style.removeProperty('top');
        el.style.removeProperty('width');
        el.style.removeProperty('margin');
        el.style.removeProperty('z-index');
        if (origNext && origNext.parentNode === origParent) {
          origParent.insertBefore(el, origNext);
        } else {
          origParent.appendChild(el);
        }
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      }
    };
  }

  function startSection1() {
    if (started) return true;

    if (typeof gsap === 'undefined') {
      log('GSAP not loaded yet, retrying...');
      return false;
    }

    var slogan = document.querySelector('.home_slogan');
    var bg     = document.querySelector('.div-block-150');
    var box1   = document.querySelector('.bt-box-1');

    console.log('[Section1] box1 element:', box1);
    log('selectors found:',
        'slogan=' + !!slogan,
        'bg=' + !!bg,
        'box1=' + !!box1);

    if (!slogan && !bg && !box1) {
      log('no selectors matched, retrying...');
      return false;
    }

    started = true;

    /* Detach slogan and box1 if they're descendants of bg */
    var cleanups = [];
    if (bg && bg.parentElement) {
      var target = bg.parentElement;
      try {
        if (slogan && bg.contains(slogan)) {
          log('detaching slogan from bg');
          cleanups.push(detachWithGhost(slogan, target));
        }
        if (box1 && bg.contains(box1)) {
          log('detaching box1 from bg');
          cleanups.push(detachWithGhost(box1, target));
        }
      } catch (e) {
        console.warn('[Section1] detach failed, continuing without:', e);
      }
    }

    function forceOpacity(el, v) {
      if (!el) return;
      el.style.setProperty('opacity', String(v), 'important');
      el.style.setProperty('visibility', v > 0 ? 'visible' : 'hidden', 'important');
    }

    forceOpacity(slogan, 0);
    forceOpacity(bg, 0);
    forceOpacity(box1, 0);

    /* box1에 최고밝기 box-shadow를 초기 상태로 설정
       → opacity 0→1 페이드인하면서 글로우도 자연스럽게 같이 등장 */
    if (box1) {
      box1.style.setProperty('box-shadow', '0 0 2.6vw 0.9vw rgba(0,117,214,1)', 'important');
      box1.setAttribute('data-s1-init', '');
    }

    function fadeIn(el, name, duration, ease, delay, onStart, onComplete) {
      if (!el) return;
      var state = { v: 0 };
      gsap.to(state, {
        v: 1,
        duration: duration,
        delay: delay,
        ease: ease,
        onStart: function () {
          log(name + ' fade start (delay=' + delay + 's)');
          if (onStart) onStart();
        },
        onUpdate: function () { forceOpacity(el, state.v); },
        onComplete: onComplete
      });
    }

    fadeIn(slogan, 'slogan', 1.2, easeSlogan, 0.3);
    fadeIn(box1, 'button', 0.8, 'expo.out', 1.3,
      null,
      function () {
        if (!box1) return;
        /* 버튼 페이드인 완료 후 최고밝기로 1.5초 홀드 → shimmer 핸드오프 */
        setTimeout(function () {
          if (!box1) return;
          box1.style.removeProperty('box-shadow');
          box1.classList.add('is-looping');
        }, 1500);
      });
    fadeIn(bg, 'bg', 1.5, easeBg, 1.45, null, function () {
      log('all fades done, restoring DOM');
      cleanups.forEach(function (c) {
        try { c.cleanup(); } catch (e) { console.warn('[Section1] cleanup failed:', e); }
      });
      /* DOM이 최종 위치로 복원된 후 divider.js에 신호 */
      setTimeout(function () {
        try { window.dispatchEvent(new CustomEvent('helix-s1-done')); } catch (e) {}
        log('helix-s1-done dispatched');
      }, 50);
    });

    log('timeline started');
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
