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

  function init() {
    var alphenix = findAlphenix();
    log('alphenix found=' + !!alphenix);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200);
  }
  window.Webflow = window.Webflow || [];
  window.Webflow.push(init);
})();
