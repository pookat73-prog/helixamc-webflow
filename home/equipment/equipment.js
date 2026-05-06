/* ================================================================
   HOME EQUIPMENT SECTION (.blackframe_image-he)

   유일한 인터랙션: 한글 "캐논 알페닉스" 빛반사 sweep.
   - 콘텐츠 페이드인 : Webflow IX2 + sections-animations.js (.official-font_title)
   - 배경 (.blackframe_image-he) : 인터랙션 없음
   - 헤드/영문/본문 : 인터랙션 없음

   메커니즘은 about/about.js 의 helixShineSweep 와 동일 (LOCKED v1).
   ================================================================ */

(function () {
  'use strict';

  if (window.__HELIX_EQUIPMENT_LOADED__) return;
  window.__HELIX_EQUIPMENT_LOADED__ = true;

  var DEBUG = /[?&]debug-equipment=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[Equipment]'].concat([].slice.call(arguments)));
  } : function () {};

  function ensureHelixShineKeyframes() {
    if (document.getElementById('helix-shine-keyframes')) return;
    var style = document.createElement('style');
    style.id = 'helix-shine-keyframes';
    style.textContent =
      '@keyframes helix-shine-sweep {' +
      '  from { background-position: 100% 0; }' +
      '  to   { background-position: 0% 0; }' +
      '}';
    document.head.appendChild(style);
  }

  function helixShinePrime(el) {
    if (!el || el.dataset.helixShinePrimed === '1') return;
    var base = window.getComputedStyle(el).color || 'rgb(255,255,255)';
    var bm = base.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
    var br = bm ? +bm[1] : 255, bg = bm ? +bm[2] : 255, bb = bm ? +bm[3] : 255;
    var ba = bm && bm[4] != null ? +bm[4] : 1;
    var baseRGB = 'rgba(' + br + ',' + bg + ',' + bb + ',' + ba + ')';
    el.dataset.helixShineBase = baseRGB;
    el.style.backgroundImage = 'linear-gradient(' + baseRGB + ', ' + baseRGB + ')';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = '100% 100%';
    el.style.setProperty('-webkit-background-clip', 'text');
    el.style.setProperty('background-clip', 'text');
    el.style.setProperty('-webkit-text-fill-color', 'transparent');
    el.style.color = 'transparent';
    el.dataset.helixShinePrimed = '1';
  }

  function helixShineSweep(el, opts) {
    if (!el) return;
    if (el.dataset.helixShining === '1') return;
    helixShinePrime(el);
    opts = opts || {};
    var peakColor = opts.peakColor || '0,117,214';
    var peakAlpha = (opts.peakAlpha != null) ? opts.peakAlpha : 0.85;
    var bandWidth = opts.bandWidth || 14;
    var duration  = opts.duration  || 1700;
    var angle     = opts.angle     || '115deg';

    var lo = Math.max(0, 50 - bandWidth);
    var hi = Math.min(100, 50 + bandWidth);

    var baseRGB = el.dataset.helixShineBase;
    var bm2 = baseRGB.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
    var br = +bm2[1], bg = +bm2[2], bb = +bm2[3];
    var ba = bm2[4] != null ? +bm2[4] : 1;
    var pm = peakColor.split(',');
    var pr = +pm[0] || 0, pg = +pm[1] || 0, pb = +pm[2] || 0;
    var mixR = Math.round(br * (1 - peakAlpha) + pr * peakAlpha);
    var mixG = Math.round(bg * (1 - peakAlpha) + pg * peakAlpha);
    var mixB = Math.round(bb * (1 - peakAlpha) + pb * peakAlpha);
    var peakRGB = 'rgba(' + mixR + ',' + mixG + ',' + mixB + ',' + ba + ')';

    var grad = 'linear-gradient(' + angle + ', '
      + baseRGB + ' 0%, '
      + baseRGB + ' ' + lo + '%, '
      + peakRGB + ' 50%, '
      + baseRGB + ' ' + hi + '%, '
      + baseRGB + ' 100%)';

    ensureHelixShineKeyframes();
    el.dataset.helixShining = '1';
    el.style.backgroundImage = grad;
    el.style.backgroundSize = '500% 100%';
    el.style.backgroundPosition = '100% 0';
    el.style.animation = 'helix-shine-sweep ' + (duration / 1000) + 's cubic-bezier(0.7, 0, 1, 1) forwards';

    setTimeout(function () {
      el.style.removeProperty('animation');
      el.style.backgroundImage = 'linear-gradient(' + baseRGB + ', ' + baseRGB + ')';
      el.style.backgroundSize = '100% 100%';
      el.style.removeProperty('background-position');
      delete el.dataset.helixShining;
    }, duration + 60);
  }

  function findAlphenix() {
    var frames = document.querySelectorAll('.blackframe_image-he');
    var found = null;
    Array.prototype.forEach.call(frames, function (frame) {
      if (found) return;
      var titles = frame.querySelectorAll('.official-font_title');
      Array.prototype.forEach.call(titles, function (h) {
        if (found) return;
        var t = (h.textContent || '').replace(/\s+/g, '');
        if (t.indexOf('캐논알페닉스') !== -1) found = h;
      });
    });
    return found;
  }

  /* ============================================================
     이 섹션에서 알페닉스 페이드(.official-font_title 의 GSAP) +
     빛반사 외 모든 인터랙션을 무력화.

     무력화 대상:
       - Webflow IX2 (data-w-id 바인딩 + 인라인 opacity/transform)
       - 헤드 .parag_title-w
       - 영문 .official-font_title_en
       - 본문 .nomalparag-w_left-spacing
       - 래퍼들 (.div-block-130, .about_title-a-b, section.clearframe, 무명 div)
       - 배경 section.blackframe_image-he 자체

     보호:
       - 한글 .official-font_title (캐논 알페닉스) → sections-animations.js
         의 expo.in 페이드+스케일 + 이 파일의 빛반사 그대로 유지

     실행 시점: 가능한 빨리 + 안전망으로 여러 차례 (DOMContentLoaded, Webflow
     ready, load, +500ms). data-w-id 를 미리 떼면 IX2 가 아예 바인딩 안 함.
     이미 IX2 가 인라인 opacity:0 등을 박아놨다면 !important 인라인으로 덮음.
  ============================================================ */
  function neutralizeIX(alphenix) {
    var frames = document.querySelectorAll('.blackframe_image-he');
    if (!frames.length) return;

    Array.prototype.forEach.call(frames, function (frame) {
      /* frame 자체부터 */
      var nodes = [frame];
      var all = frame.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) nodes.push(all[i]);

      nodes.forEach(function (el) {
        if (el === alphenix) return;
        if (el.hasAttribute && el.hasAttribute('data-w-id')) {
          el.removeAttribute('data-w-id');
        }
        if (!el.style) return;
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        el.style.removeProperty('visibility');
        el.style.setProperty('opacity',    '1',       'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('transform',  'none',    'important');
      });
    });
    log('IX2 neutralized (alphenix protected=' + !!alphenix + ')');
  }

  function init() {
    var alphenix = findAlphenix();
    log('alphenix found=' + !!alphenix);

    /* alphenix 미발견이어도 IX2 무력화는 실행 (텍스트 변경 대응) */
    neutralizeIX(alphenix);

    if (!alphenix) return;

    /* IO 진입 → 페이드인 (sections-animations.js GSAP expo.in ~1.1s) 완료 대기 → sweep.
       1.3s = 페이드 1.1s + 잔여 버퍼 0.2s. 약간 남은 스케일 잔향 위로 빛이 흐름. */
    var fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      setTimeout(function () {
        helixShineSweep(alphenix, {
          peakColor: '0,117,214',
          peakAlpha: 0.85,
          bandWidth: 14,
          duration:  1700
        });
        log('shimmer fired');
      }, 1300);
    }

    if (!('IntersectionObserver' in window)) { fire(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { fire(); io.disconnect(); }
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });
    io.observe(alphenix);
  }

  /* IX2 무력화는 가능한 빨리 + 여러 시점에서 반복 (IX2 가 늦게 바인딩해도 덮음) */
  function earlyNeutralize() {
    neutralizeIX(findAlphenix());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', earlyNeutralize);
    document.addEventListener('DOMContentLoaded', init);
  } else {
    earlyNeutralize();
    setTimeout(init, 200);
  }
  window.addEventListener('load', earlyNeutralize);
  setTimeout(earlyNeutralize, 500);
  setTimeout(earlyNeutralize, 1500);
  window.Webflow = window.Webflow || [];
  window.Webflow.push(earlyNeutralize);
  window.Webflow.push(init);
})();
