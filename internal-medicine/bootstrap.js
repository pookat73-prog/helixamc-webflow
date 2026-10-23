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
    var lastShape = '';
    function update() {
      var box = script.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var style = getComputedStyle(title);
      var titleBox = title.getBoundingClientRect();
      var shape = [box.width, box.height, titleBox.left - box.left,
        titleBox.top - box.top, titleBox.width, titleBox.height,
        style.fontFamily, style.fontSize, style.fontWeight,
        style.letterSpacing, title.textContent].join('|');
      if (shape === lastShape) return;

      // A fully opaque halo touches each blue glyph, then quickly softens outward.
      var canvas = document.createElement('canvas');
      var scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(box.width * scale);
      canvas.height = Math.ceil(box.height * scale);
      var context = canvas.getContext('2d');
      if (!context) return;
      context.scale(scale, scale);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      context.globalCompositeOperation = 'destination-out';
      context.font = style.fontStyle + ' ' + style.fontWeight + ' ' +
        style.fontSize + ' ' + style.fontFamily;
      context.fillStyle = '#000';
      context.strokeStyle = '#000';
      context.lineWidth = 4;
      context.lineJoin = 'round';
      context.shadowColor = '#000';
      context.shadowBlur = 12 * scale;
      var ascent = context.measureText(title.textContent).fontBoundingBoxAscent;
      if (!Number.isFinite(ascent)) ascent = parseFloat(style.fontSize) * .8;
      var walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      var range = document.createRange();
      while (walker.nextNode()) {
        var node = walker.currentNode;
        var offset = 0;
        Array.from(node.nodeValue).forEach(function (letter) {
          range.setStart(node, offset);
          offset += letter.length;
          range.setEnd(node, offset);
          if (!letter.trim()) return;
          var glyph = range.getBoundingClientRect();
          var x = glyph.left - box.left;
          var y = glyph.top - box.top + ascent;
          context.strokeText(letter, x, y);
          context.fillText(letter, x, y);
        });
      }
      script.style.setProperty('--hx-im-insight-mask', 'url("' + canvas.toDataURL() + '")');
      lastShape = shape;
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
      function refreshFont() { lastShape = ''; update(); }
      document.fonts.ready.then(refreshFont);
      document.fonts.addEventListener('loadingdone', refreshFont);
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
