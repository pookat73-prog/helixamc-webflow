/* ================================================================
   HELIX AMC - ABOUT PAGE JS
   ================================================================
   FOUC 방지 + CLS 방지:
   - ds-endendend 폰트 로드 대기
   - image-23 를 preload + Image() prefetch + loading=eager 로 가능한 빨리
   - 셋 다 준비되면 .helix-about-ready 클래스로 일괄 표시 */

(function () {
  'use strict';

  var READY_CLASS = 'helix-about-ready';
  var HERO_FONT   = 'ds-endendend';
  var DEBUG = /[?&]debug-about=1/.test(location.search);
  var t0 = performance.now();
  var root = document.documentElement;

  function log() {
    if (!DEBUG) return;
    var args = ['[About +' + Math.round(performance.now() - t0) + 'ms]'];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.log.apply(console, args);
  }

  function reveal(reason) {
    if (root.classList.contains(READY_CLASS)) return;
    root.classList.add(READY_CLASS);
    log('reveal:', reason);
  }

  function whenHeroFontReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var loads = [
      document.fonts.load('1em "' + HERO_FONT + '"').catch(function () {}),
      document.fonts.load('700 1em "' + HERO_FONT + '"').catch(function () {})
    ];
    return Promise.all(loads).then(function () {
      /* fonts.load 는 다운로드 완료 시점만 보장. 실제 레이아웃이 새 폰트로
         재계산되려면 한두 프레임 더 필요. 2x rAF 로 대기. */
      return new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { log('font ready'); resolve(); });
        });
      });
    });
  }

  function preloadSymbol() {
    var imgs = document.querySelectorAll('img.image-23');
    if (!imgs.length) { log('no image-23 found'); return Promise.resolve(); }

    var promises = [];
    imgs.forEach(function (img) {
      try { img.loading = 'eager'; } catch (e) {}
      try { img.decoding = 'sync'; } catch (e) {}
      try { img.fetchPriority = 'high'; } catch (e) {}

      var src = img.currentSrc || img.src;
      if (src) {
        /* <link rel=preload> 로 fetch 우선순위 끌어올리기 */
        try {
          var link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          link.fetchPriority = 'high';
          document.head.appendChild(link);
        } catch (e) {}

        /* Image() 로 한 번 더 프리페치 (브라우저 캐시 공유) */
        try {
          var pre = new Image();
          pre.fetchPriority = 'high';
          pre.src = src;
        } catch (e) {}
      }

      if (img.complete && img.naturalWidth > 0) return;
      promises.push(new Promise(function (resolve) {
        img.addEventListener('load', function () { log('image-23 loaded'); resolve(); }, { once: true });
        img.addEventListener('error', resolve, { once: true });
      }));
    });
    return Promise.all(promises);
  }

  function init() {
    log('init');
    Promise.all([whenHeroFontReady(), preloadSymbol()]).then(function () {
      reveal('all-ready');
    });
    /* 안전 폴백 */
    setTimeout(function () { reveal('timeout'); }, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
