/* ================================================================
   SECTION 1: HOME PAGE HERO ANIMATION
   GSAP Timeline - slogan -> button -> background
   Dependencies: GSAP 3.12.2+

   Order:
     t=0.3   slogan  1.2s  asymmetric ease-in-out (in 60% / out 40%)
     t=1.3   button  0.8s  expo.out
     t=1.45  bg      1.5s  asymmetric ease-in-out (in 75% / out 25%)

   DOM detach ("virtual placeholder") strategy:
     slogan and button are descendants of the bg section
     (legacy: .div-block-150, new: .BlackFrame_Image(Hero) wrapping
     .home_contents which holds slogan/button). CSS opacity on the bg
     parent cascades to children, so hiding bg also hides its children.
     To let each element fade independently we:
       1. Clone el as a hidden ghost that holds the layout slot
       2. Move the real el to bg's parent with position:absolute and
          coordinates matching the ghost's position
       3. After bg's fade completes, restore the real el to its
          original DOM position and remove the ghost.

   Debug: add ?debug-s1=1 to URL or set window.DEBUG_SECTION1 = true
   ================================================================ */

(function () {
  'use strict';

  /* idempotency: 두 번 로드돼도 detach/ghost 중복 생성 방지 */
  if (window.__HELIX_SECTION1_LOADED__) return;
  window.__HELIX_SECTION1_LOADED__ = true;

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
    /* cloneNode 가 Webflow 의 인라인 `style="opacity:1!important;visibility:visible!important"`
       까지 같이 복제할 수 있으므로 setProperty + 'important' 로 명시적으로 덮어씌움.
       단순 `ghost.style.visibility = 'hidden'` 은 인라인 !important 와 외부 CSS !important
       에 모두 패배할 수 있음 → ghost 가 보여 슬로건이 중첩으로 보이는 버그 원인. */
    ghost.style.setProperty('visibility',     'hidden', 'important');
    ghost.style.setProperty('opacity',        '0',      'important');
    ghost.style.setProperty('pointer-events', 'none',   'important');
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
    /* bg section: legacy .div-block-150 → new BlackFrame_Image(Hero).
       Attribute selector covers paren-escape and casing variants. */
    var bg     = document.querySelector('.div-block-150') ||
                 document.querySelector('[class*="lackFrame_Image"]') ||
                 document.querySelector('[class*="lackframe_image"]');
    var box1   = document.querySelector('.bt-box-1');

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

    /* 인라인 visibility:hidden 적용 완료 → bootstrap의 prepaint 가드 제거.
       이 시점부터는 section1.js가 직접 노출 시점을 통제함.
       bootstrap 이 두 번 로드돼서 같은 ID 의 <style> 이 두 개 생긴 경우에도
       모두 제거하도록 querySelectorAll 사용. */
    var prepaints = document.querySelectorAll('#helix-home-prepaint, style#helix-home-prepaint');
    prepaints.forEach(function (p) { if (p.parentNode) p.parentNode.removeChild(p); });

    /* box1에 최고밝기 box-shadow를 초기 상태로 설정
       → opacity 0→1 페이드인하면서 글로우도 자연스럽게 같이 등장 */
    if (box1) {
      box1.style.setProperty('box-shadow', '0 0 0.6vw 0.18vw rgba(0,117,214,0.90), 0 0 8.0vw 0.15vw rgba(0,117,214,0.30)', 'important');
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

    /* cleanup 신뢰성 강화 — bg fadeIn 의 onComplete 가 어떤 이유로
       (예: bg=null) 안 불려도 ghost 가 영구 잔존하지 않도록 안전망 타이머 추가.
       runCleanups 는 idempotent (한 번만 실행). */
    var cleanupRan = false;
    function runCleanups() {
      if (cleanupRan) return;
      cleanupRan = true;
      log('runCleanups firing');
      cleanups.forEach(function (c) {
        try { c.cleanup(); } catch (e) { console.warn('[Section1] cleanup failed:', e); }
      });
      /* 잔존 ghost 마지막 청소 — cleanups 가 비어있거나 실패한 경우의 안전망 */
      var orphans = document.querySelectorAll('[data-s1-ghost]');
      orphans.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      if (orphans.length) log('removed', orphans.length, 'orphan ghost(s)');
      /* DOM이 최종 위치로 복원된 후 divider.js에 신호 */
      setTimeout(function () {
        try { window.dispatchEvent(new CustomEvent('helix-s1-done')); } catch (e) {}
        log('helix-s1-done dispatched');
      }, 50);
    }

    /* 페이드인 시퀀스 — 웹폰트가 도착한 후에 시작해야 폰트 메트릭 변화로
       인한 줄바꿈 점프(예: '심' 자가 다음 줄에서 위로 튀어오르는 현상)가 안 생김.
       타이밍 압축: 시작점/지속시간 모두 단축 → 사용자 진입 후 ~1.6s 안에 종료 */
    function startFades() {
      log('fonts ready, starting fades');
      /* slogan: t=0.1 ~ 0.9 (0.8s) */
      fadeIn(slogan, 'slogan', 0.8, easeSlogan, 0.1);
      /* button: t=0.5 ~ 1.0 (0.5s, expo.out) */
      fadeIn(box1, 'button', 0.5, 'expo.out', 0.5,
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
      /* bg: t=0.6 ~ 1.6 (1.0s) */
      fadeIn(bg, 'bg', 1.0, easeBg, 0.6, null, runCleanups);
      /* 안전망: bg onComplete 가 안 불려도 cleanup 보장 (1.6s 끝 + 0.5s 여유) */
      setTimeout(runCleanups, 2100);
    }

    /* 슬로건 폰트 로드 + Webflow 레이아웃 settle 후 fade 시작.

       콜드 캐시: 네트워크 지연 덕에 자연스럽게 Webflow CSS/IX2 가 settle 후
                  fade 시작 → 문제 없음.
       웜 캐시:   모든 파일이 즉시 들어와 section1.js 가 너무 빠르게 실행 →
                  Webflow 가 슬로건 폰트 메트릭을 적용하기 전에 fade 시작 →
                  fade 도중 폰트 swap 으로 '심'/'중' 줄바꿈 점프 재발.

       해결 — 다단계 대기:
       1) document.fonts.load(슬로건 폰트, 텍스트) — 명시적 폰트 로드
       2) document.fonts.ready                    — 모든 폰트 로드 완료
       3) requestAnimationFrame × 2               — Webflow 레이아웃 settle
       4) startFades()                            — 그제서야 fade 시작 */
    var fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      /* rAF × 2: 첫 frame 에 Webflow CSS 적용 반영, 두 번째 frame 에 paint.
         그 후 fade 시작하면 슬로건 메트릭이 이미 안정된 상태. */
      requestAnimationFrame(function () {
        requestAnimationFrame(startFades);
      });
    }

    var loadPromises = [];
    if (document.fonts && document.fonts.load && slogan) {
      var s = window.getComputedStyle(slogan);
      var fontSpec = (s.fontWeight || '400') + ' ' + (s.fontSize || '1em') +
                     ' ' + (s.fontFamily || 'sans-serif');
      var text = (slogan.textContent || '').trim() || ' ';
      try {
        loadPromises.push(document.fonts.load(fontSpec, text).catch(function () {}));
      } catch (e) {}
    }
    if (document.fonts && document.fonts.ready) {
      loadPromises.push(document.fonts.ready.catch(function () {}));
    }

    if (loadPromises.length) {
      Promise.all(loadPromises).then(fire, fire);
    } else {
      fire();
    }
    /* 안전망: 폰트 로드가 영영 안 와도 1초 후 강제 시작 */
    setTimeout(fire, 1000);

    log('timeline queued (waiting for fonts)');
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
