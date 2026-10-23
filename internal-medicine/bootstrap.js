/* ================================================================
   HELIX AMC — 내과 페이지 전용 코드 로더

   페이지 head 로더가 대상 브랜치의 커밋 SHA 로 이 파일을 불러온다.
   이 파일은 같은 immutable SHA 의 내과 섹션 인터랙션을 로드한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__hxImBootstrapInit) return;
  window.__hxImBootstrapInit = true;

  var OWNER = 'pookat73-prog';
  var REPO = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  var src = '';

  try {
    if (document.currentScript && document.currentScript.src) src = document.currentScript.src;
  } catch (error) {}

  if (!src) {
    var scripts = document.querySelectorAll('script[src*="/internal-medicine/bootstrap.js"]');
    if (scripts.length) src = scripts[scripts.length - 1].src;
  }

  var match = src.match(/@([^/]+)\/internal-medicine\/bootstrap\.js/);
  var REF = match && match[1] ? match[1] : BRANCH;
  var FILES = [
    'global/global.css',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/footer.css',
    'home/global/footer.js',
    'internal-medicine/headline-highlight.js'
  ];

  function loadFile(path, ref) {
    var url = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path;
    var cacheBust = /^[0-9a-f]{7,40}$/i.test(ref) ? '' : '?t=' + Math.floor(Date.now() / 60000);
    var element;

    if (/\.css$/i.test(path)) {
      element = document.createElement('link');
      element.rel = 'stylesheet';
      element.href = url + cacheBust;
    } else {
      element = document.createElement('script');
      element.src = url + cacheBust;
      element.async = false;
    }

    element.onerror = function () {
      if (ref !== BRANCH) loadFile(path, BRANCH);
    };
    document.head.appendChild(element);
  }

  // Styles and heading legibility must not depend on the animation CDN.
  FILES.filter(function (path) { return /\.css$/i.test(path); })
    .forEach(function (path) { loadFile(path, REF); });

  function initInsightOverlap() {
    var frame = document.querySelector('.whiteframe_open .div-block-352');
    if (!frame) return;
    var title = frame.querySelector('.about_mini_title.for-big-blue');
    var script = frame.querySelector('.about_mini_title.for-big-eng.white-bg');
    if (!title || !script) return;
    function update() {
      var range = document.createRange();
      range.selectNodeContents(title);
      var bottom = range.getBoundingClientRect().bottom;
      var overlap = Math.max(0, bottom - script.getBoundingClientRect().top + 2);
      script.style.setProperty('--hx-im-insight-overlap', overlap + 'px');
    }
    update();
    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(update);
      observer.observe(frame);
      observer.observe(title);
      observer.observe(script);
    }
    window.addEventListener('resize', update, { passive: true });
    if (document.fonts) {
      document.fonts.ready.then(update);
      document.fonts.addEventListener('loadingdone', update);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInsightOverlap, { once: true });
  } else {
    initInsightOverlap();
  }

  var gsap = document.createElement('script');
  gsap.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
  gsap.async = false;
  gsap.onload = function () {
    FILES.filter(function (path) { return !/\.css$/i.test(path); })
      .forEach(function (path) { loadFile(path, REF); });
  };
  gsap.onerror = function () {
    console.warn('[internal-medicine-bootstrap] GSAP load failed; header menu was not initialized');
  };
  document.head.appendChild(gsap);
})();
