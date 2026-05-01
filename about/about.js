/* ================================================================
   HELIX AMC - ABOUT PAGE JS
   ================================================================
   시퀀스:
   - 0ms          초기 (헤드/서브헤드/심볼/배경 비디오 모두 opacity:0)
   - +200ms       헤드 fade-in (1.0s)
   - +1200ms      심볼 + 서브헤드 fade-in (1.0s)
   - +2200ms      배경 비디오 fade-in (1.2s)

   배경 비디오는 Webflow 가 아닌 코드로 .About_Background 안에 주입.
   ================================================================ */

(function () {
  'use strict';

  var HERO_FONT = 'ds-endendend';
  var BG_PARENT_SELECTOR = '.About_Background, .about_background, .about-background';
  var BG_VIDEO_PATH = 'about/bg-video.mp4';
  var DEBUG = /[?&]debug-about=1/.test(location.search);
  var t0 = performance.now();

  function log() {
    if (!DEBUG) return;
    var args = ['[About +' + Math.round(performance.now() - t0) + 'ms]'];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.log.apply(console, args);
  }

  function whenHeroFontReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('1em "' + HERO_FONT + '"').catch(function () {}),
      document.fonts.load('700 1em "' + HERO_FONT + '"').catch(function () {})
    ]).then(function () {
      /* 폰트 다운로드 후 layout 재계산까지 2x rAF 대기 */
      return new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { log('font ready'); resolve(); });
        });
      });
    });
  }

  function preloadSymbol() {
    var imgs = document.querySelectorAll('img.image-23');
    if (!imgs.length) { log('no image-23'); return Promise.resolve(); }
    var promises = [];
    imgs.forEach(function (img) {
      try { img.loading = 'eager'; } catch (e) {}
      try { img.decoding = 'sync'; } catch (e) {}
      try { img.fetchPriority = 'high'; } catch (e) {}
      var src = img.currentSrc || img.src;
      if (src) {
        try {
          var l = document.createElement('link');
          l.rel = 'preload'; l.as = 'image'; l.href = src; l.fetchPriority = 'high';
          document.head.appendChild(l);
        } catch (e) {}
        try { var p = new Image(); p.fetchPriority = 'high'; p.src = src; } catch (e) {}
      }
      if (img.complete && img.naturalWidth > 0) return;
      promises.push(new Promise(function (resolve) {
        img.addEventListener('load', function () { log('image-23 loaded'); resolve(); }, { once: true });
        img.addEventListener('error', resolve, { once: true });
      }));
    });
    return Promise.all(promises);
  }

  function injectBgVideo() {
    var parent = document.querySelector(BG_PARENT_SELECTOR);
    if (!parent) { log('bg parent not found'); return null; }
    var existing = parent.querySelector('video.helix-bg-video');
    if (existing) return existing;

    var ref = window.HELIX_REF || 'main';
    var src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' + ref + '/' + BG_VIDEO_PATH;

    var v = document.createElement('video');
    v.className = 'helix-bg-video';
    v.muted = true;
    v.defaultMuted = true;
    v.autoplay = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    /* iOS Safari autoplay 보장용 속성 명시 */
    v.setAttribute('muted', '');
    v.setAttribute('autoplay', '');
    v.setAttribute('loop', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'object-fit:cover',
      'z-index:0',
      'pointer-events:none',
      'opacity:0'
    ].join(';');
    v.src = src;

    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.insertBefore(v, parent.firstChild);

    /* 비디오의 형제 자식(컨텐츠 래퍼들)을 위로 올려서 비디오 위에 항상 보이게 */
    Array.prototype.forEach.call(parent.children, function (child) {
      if (child === v) return;
      var cs = getComputedStyle(child);
      if (cs.position === 'static') child.style.position = 'relative';
      var z = parseInt(child.style.zIndex || cs.zIndex, 10);
      if (!z || z < 2) child.style.zIndex = '2';
    });

    log('bg video injected:', src);
    return v;
  }

  function whenVideoReady(v) {
    if (!v) return Promise.resolve();
    if (v.readyState >= 2) { log('video already ready'); return Promise.resolve(); }
    return new Promise(function (resolve) {
      var done = false;
      function fin(reason) {
        if (done) return; done = true;
        log('video ready:', reason);
        resolve();
      }
      v.addEventListener('loadeddata', function () { fin('loadeddata'); }, { once: true });
      v.addEventListener('error', function () { fin('error'); }, { once: true });
      setTimeout(function () { fin('timeout'); }, 4000);
    });
  }

  function showAllImmediate(video) {
    var els = document.querySelectorAll('.about-heading, .about_contents_sub-title, img.image-23');
    els.forEach(function (el) { el.style.opacity = '1'; });
    if (video) video.style.opacity = '1';
  }

  function runTimeline(video) {
    if (typeof gsap === 'undefined') {
      log('GSAP missing → fallback show');
      showAllImmediate(video);
      return;
    }
    var heading = document.querySelectorAll('.about-heading');
    var subhead = document.querySelectorAll('.about_contents_sub-title');
    var symbol  = document.querySelectorAll('img.image-23');

    var tl = gsap.timeline({ delay: 0.2 });
    if (heading.length) {
      tl.to(heading, { opacity: 1, duration: 1.0, ease: 'power2.out' });
    }
    var symAndSub = [].concat(Array.prototype.slice.call(symbol), Array.prototype.slice.call(subhead));
    if (symAndSub.length) {
      tl.to(symAndSub, { opacity: 1, duration: 1.0, ease: 'power2.out' });
    }
    if (video) {
      tl.to(video, { opacity: 1, duration: 1.2, ease: 'power2.out' });
    }
    log('timeline started');
  }

  function init() {
    log('init');
    var video = injectBgVideo();

    var allReady = Promise.all([
      whenHeroFontReady(),
      preloadSymbol(),
      whenVideoReady(video)
    ]);

    var started = false;
    function start(reason) {
      if (started) return; started = true;
      log('start:', reason);
      runTimeline(video);
    }

    allReady.then(function () { start('all-ready'); });
    /* 안전 폴백 */
    setTimeout(function () { start('timeout'); }, 4500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
