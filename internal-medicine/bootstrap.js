/* ================================================================
   HELIX AMC — 내과 페이지 전용 코드 로더

   페이지 head 로더가 대상 브랜치의 커밋 SHA 로 이 파일을 불러온다.
   이 파일은 같은 immutable SHA 의 내과 섹션 인터랙션을 로드한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__hxImBootstrapInit) return;
  window.__hxImBootstrapInit = true;

  // The published shared footer still marks standalone pages as mobile-only.
  // Correct only this page after that footer runs, without a full-site publish.
  if (/^\/internal-medicine\/?$/.test(location.pathname)) {
    var showDesktopCta = function () {
      document.documentElement.classList.remove('hx-fcta-mobile-only');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showDesktopCta, { once: true });
    else showDesktopCta();
  }

  // Keep the 1440px composition through laptop/tablet widths. Phone sections
  // need their own vertical design and deliberately retain Webflow's layout.
  // Inline in the existing loader: no new CDN file or FILES registration.
  var responsiveStyle = document.createElement('style');
  responsiveStyle.id = 'hx-im-responsive-style';
  responsiveStyle.textContent = `
    /* Keep the process cards at a readable size on wide desktop screens.
       The narrower gap places step 5 on the return arc, whose height is set
       by the four stacked cards rather than by the viewport width. */
    @media (min-width: 1440px) {
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .hx-im-process-flow {
        width: 100%;
        max-width: 841px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 53px;
      }
    }
    @media (min-width: 768px) and (max-width: 1439px) {
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] {
        --hx-im-gutter: clamp(24px, calc(50vw - 458px), 18.2vw);
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] body > :is(
        .im_intro-image, .whiteframe.im, .whiteframe_open,
        .white-frame_mini.im, #hx-im-process,
        .white-frame_connect, .whiteframe_close,
        .hx-im-responsive-closing-frame
      ) {
        padding-inline: var(--hx-im-gutter);
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .im_intro-image > .flex-block-62 {
        width: 100%;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] :is(
        .flex-block-62 > *, .div-block-353 > *, .div-block-355 > *,
        .hx-im-process-flow > *, .hx-im-area-grid > *
      ) { min-width: 0; }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] :is(.div-block-353, .div-block-355) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .hx-im-process-flow {
        width: 100%;
        max-width: 841px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: clamp(32px, 8.89vw, 128px);
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .whiteframe_open > .sg_rings {
        flex-direction: row;
        gap: 0;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .whiteframe_open .sg_ring_body {
        font-size: clamp(14px, 1.11vw, 16px);
        line-height: 1.7;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .white-frame_mini.im .sj_outro_quote {
        font-size: clamp(24px, 1.945vw, 28px);
        line-height: 1.45;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] #hx-im-intro .about_mini_title {
        font-size: clamp(24px, 1.9vw, 27.36px);
        line-height: 1.4;
      }
    }
    @media (min-width: 1040px) and (max-width: 1439px) {
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .hx-im-process-flow {
        gap: clamp(53px, calc(215px - 11.25vw), 98px);
      }
    }
    @media (min-width: 768px) and (max-width: 1039px) {
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .whiteframe_open > .sg_rings {
        bottom: 3rem;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .im_intro-image {
        padding-block: 96px;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .im_intro-image .st_intro_body {
        font-size: 18px;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .im_intro-image :is(.div-block-340, .div-block-367) {
        padding-left: 0;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] .im_intro-image .sj_intro_eng-keyword {
        right: 0;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] #hx-im-process :is(.div-block-357, .div-block-358) {
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 6px;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] #hx-im-process .sj_step_title {
        flex: 0 0 auto;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] #hx-im-process .sj_step_title-en {
        width: 100%;
        bottom: 0;
        line-height: 1.4;
      }
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] #hx-im-process .sj_step.for-list {
        padding-top: 104px;
      }
    }
  `;
  document.head.appendChild(responsiveStyle);

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
          // Reinforce the soft halo without widening its fully erased core.
          context.strokeText(letter, x, y);
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

/* HELIX_IM_CARE_AC_START — selected A+C cards, scoped to the existing care area. */
(function () {
  'use strict';

  if (!/^\/internal-medicine\/?$/.test(location.pathname)) return;

  function initCareAreas() {
    if (document.querySelector('.hx-im-care-section')) return;
    var sections = Array.from(document.querySelectorAll('section[id="hx-im-areas"]'));
    var sources = sections.flatMap(function (section) {
      return Array.from(section.querySelectorAll('article.hx-c2-type-card'));
    });
    var fronts = {
      '01': ['만성 기침', '호흡 곤란'],
      '02': ['만성신부전(CKD)', '요로결석'],
      '03': ['구토·설사', '식욕부진·황달'],
      '04': ['발작', '후지마비'],
      '05': ['당뇨', '갑상선/부갑상선 질환'],
      '06': ['환자 맞춤형', '항암 치료']
    };

    function textOf(element) {
      if (!element) return '';
      var copy = element.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"], .hx-c2-sample-source-hidden').forEach(function (node) { node.remove(); });
      return copy.textContent.replace(/\s+/g, ' ').trim();
    }

    // The published Webflow copy remains the source of medical text and URLs.
    var data = sources.map(function (card) {
      var number = textOf(card.querySelector('.hx-c2-refined-index'));
      var immune = card.querySelector('.hx-c2-unified-immune');
      var procedure = card.querySelector('.hx-c2-refined-procedure');
      var center = card.querySelector('.hx-c2-center-button-wrap a[href]');
      return {
        number: number,
        title: textOf(card.querySelector('.hx-c2-refined-title')),
        english: textOf(card.querySelector('.hx-c2-refined-en')),
        front: fronts[number],
        lead: textOf(card.querySelector('.hx-c2-scope-lead')),
        items: Array.from(card.querySelectorAll('.hx-c2-unified-list .hx-c2-disease-item, .hx-c2-scope-diseases .hx-c2-disease-item')).map(textOf),
        groupLabel: immune ? textOf(procedure.querySelector('.hx-c2-refined-label')) : '',
        groupItems: immune ? Array.from(immune.querySelectorAll('.hx-c2-disease-item')).map(textOf) : [],
        procedureLabel: procedure && !immune ? textOf(procedure.querySelector('.hx-c2-refined-label')) : '',
        procedures: procedure && !immune ? Array.from(procedure.querySelectorAll('.hx-c2-refined-treatment')).map(function (item) {
          var link = item.matches('a') ? item : item.parentElement.querySelector('a[href]');
          return { text: textOf(item), href: link && link.getAttribute('href') };
        }) : [],
        center: center ? { text: textOf(center), href: center.getAttribute('href'), target: center.getAttribute('target') } : null
      };
    });
    if (data.length !== 6 || data.some(function (item, index) {
      return item.number !== '0' + (index + 1) || !item.title || !item.english || !item.front;
    })) return;

    var root = sections[0];
    var container = root.querySelector('.hx-im-inner');
    if (!container) return;
    root.style.setProperty('--hx-im-care-font', getComputedStyle(sources[0]).fontFamily);

    var style = document.createElement('style');
    style.id = 'hx-im-care-ac-style';
    style.textContent = `
      html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] [data-hx-im-care-source][hidden] { display:none !important; }
      #hx-im-areas.hx-im-care-section { padding-bottom:clamp(32px, 5.2vw, 100px); }
      .hx-im-care-section .hx-im-areas-head { margin-bottom:24px; }
      .hx-im-care-section .hx-im-care-grid {
        display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-auto-rows:1fr; gap:24px;
        width:100%; font-family:var(--hx-im-care-font); color:#11202c;
      }
      .hx-im-care-section .hx-im-care-card {
        box-sizing:border-box; min-width:0; margin:0; padding:26px; display:flex;
        background:#fff; border:1px solid #dfe6ed; border-radius:8px;
        box-shadow:0 9px 24px -13px #2b45603d;
      }
      .hx-im-care-section .hx-im-care-full {
        display:flex; flex-direction:column; width:100%; min-width:0; min-height:340px;
        font-size:.9375rem; line-height:1.75; overflow-wrap:anywhere; word-break:keep-all;
      }
      .hx-im-care-section :is(.hx-im-care-top, .hx-im-care-short-top) { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
      .hx-im-care-section .hx-im-care-number { flex:none; color:#8195a8; font:400 1.8125rem/1 Georgia,serif; letter-spacing:-.03em; }
      .hx-im-care-section .hx-im-care-english { margin:0; text-align:right; color:#5a6b7d; font:italic .8125rem/1.5 Georgia,serif; }
      .hx-im-care-section .hx-im-care-heading { min-height:var(--hx-im-care-heading-height,0px); }
      .hx-im-care-section .hx-im-care-heading-inner { display:flow-root; }
      .hx-im-care-section .hx-im-care-title { margin:16px 0 20px; color:#11202c; font-size:1.625rem; line-height:1.4; letter-spacing:-.05em; font-weight:500; }
      .hx-im-care-section .hx-im-care-content { flex:1; min-width:0; padding-bottom:20px; }
      .hx-im-care-section .hx-im-care-lead { margin:0 0 14px; font-weight:500; }
      .hx-im-care-section .hx-im-care-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 16px; list-style:none; margin:0; padding:0; color:#3d4f6b; }
      .hx-im-care-section .hx-im-care-list li { min-width:0; margin:0; padding:0; }
      .hx-im-care-section .hx-im-care-list-long { grid-template-columns:1fr; gap:4px; }
      .hx-im-care-section .hx-im-care-label { color:#5a6b7d; font-size:.6875rem; font-weight:500; line-height:1.6; margin:0 0 8px; }
      .hx-im-care-section .hx-im-care-group { margin-top:16px; }
      .hx-im-care-section .hx-im-care-footer { min-height:var(--hx-im-care-footer-height,0px); }
      .hx-im-care-section .hx-im-care-footer-inner:not(:empty) { border-top:1px solid #e2e8ee; padding-top:12px; }
      .hx-im-care-section .hx-im-care-procedure { display:block; margin:6px 0 0; color:#11202c; text-decoration:none; font-weight:500; }
      .hx-im-care-section .hx-im-care-procedure[aria-disabled="true"] { cursor:default; }
      .hx-im-care-section .hx-im-care-center { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:16px; padding:12px 14px; background:#edf2f7; border-radius:6px; color:#3d4f6b; text-decoration:none; font-size:.8125rem; line-height:1.6; }
      .hx-im-care-section .hx-im-care-short { display:none; }
      .hx-im-care-section :is(button,a):focus-visible { outline:3px solid #0075d6; outline-offset:4px; }
      .hx-im-care-section .hx-im-care-dialog {
        box-sizing:border-box; position:fixed; inset:0; margin:auto; width:min(660px,calc(100% - 48px));
        max-width:none; max-height:calc(100dvh - 48px); padding:0; border:1px solid #dfe6ed;
        border-radius:15px; background:#fff; color:#11202c; font-family:var(--hx-im-care-font);
        overflow:hidden; box-shadow:0 30px 90px #091a3440;
      }
      .hx-im-care-section .hx-im-care-dialog[open] { display:flex; flex-direction:column; }
      .hx-im-care-section .hx-im-care-dialog::backdrop { background:#0d172c6b; }
      .hx-im-care-section .hx-im-care-dialog-scroll { min-height:0; overflow-y:auto; overscroll-behavior:contain; }
      .hx-im-care-section .hx-im-care-dialog-head { position:relative; flex:none; padding:24px 28px 20px; border-bottom:1px solid #e2e8ee; }
      .hx-im-care-section .hx-im-care-dialog-title { margin:10px 48px 0 0; font-size:1.5rem; line-height:1.4; font-weight:500; letter-spacing:-.05em; overflow-wrap:anywhere; }
      .hx-im-care-section .hx-im-care-dialog-en { margin:6px 48px 0 0; color:#5a6b7d; font:italic .875rem/1.5 Georgia,serif; }
      .hx-im-care-section .hx-im-care-close { position:absolute; top:16px; right:16px; display:grid; place-items:center; width:44px; height:44px; padding:0; border:1px solid #dce3ea; border-radius:50%; background:#fff; color:#11202c; font:300 28px/1 sans-serif; cursor:pointer; }
      .hx-im-care-section .hx-im-care-dialog-body { padding:24px 28px 28px; font-size:.9375rem; line-height:1.8; word-break:keep-all; overflow-wrap:anywhere; }
      .hx-im-care-section .hx-im-care-dialog-body .hx-im-care-content { padding-bottom:24px; }
      .hx-im-care-section .hx-im-care-dialog-body .hx-im-care-list { grid-template-columns:1fr; }
      @media(min-width:1800px) {
        .hx-im-care-section .hx-im-care-card { padding:28px; }
        .hx-im-care-section .hx-im-care-title { font-size:1.75rem; }
      }
      @media(min-width:768px) and (max-width:991px) {
        .hx-im-care-section .hx-im-care-grid { gap:16px; }
        .hx-im-care-section .hx-im-care-card { padding:20px; }
        .hx-im-care-section .hx-im-care-title { font-size:1.4375rem; }
        .hx-im-care-section .hx-im-care-full { font-size:.875rem; }
        .hx-im-care-section .hx-im-care-list { grid-template-columns:1fr; gap:6px; }
      }
      @media(max-width:767px) {
        #hx-im-areas.hx-im-care-section { padding-top:32px; padding-bottom:32px; }
        .hx-im-care-section .hx-im-areas-head { margin-bottom:20px; }
        .hx-im-care-section .hx-im-areas-head h2 { font-size:1.75rem; line-height:1.3; }
        .hx-im-care-section .hx-im-care-grid { gap:10px; }
        .hx-im-care-section .hx-im-care-card { padding:0; }
        .hx-im-care-section .hx-im-care-full { display:none; }
        .hx-im-care-section .hx-im-care-short {
          box-sizing:border-box; display:flex; flex-direction:column; align-items:stretch; width:100%; min-width:0; min-height:148px;
          padding:12px 12px 10px; margin:0; border:0; border-radius:7px; background:transparent; color:#11202c;
          font:inherit; text-align:left; cursor:pointer; -webkit-tap-highlight-color:transparent;
        }
        .hx-im-care-section .hx-im-care-short .hx-im-care-number { font-size:1.5rem; }
        .hx-im-care-section .hx-im-care-open { color:#8195a8; font-size:.875rem; }
        .hx-im-care-section .hx-im-care-primary { display:block; margin:6px 0; font-size:1rem; line-height:1.45; letter-spacing:-.055em; font-weight:500; word-break:keep-all; overflow-wrap:anywhere; }
        .hx-im-care-section .hx-im-care-primary > span { display:block; }
        .hx-im-care-section .hx-im-care-department { margin-top:auto; padding-top:6px; border-top:1px solid #e2e8ee; font-size:.6875rem; line-height:1.4; color:#5a6b7d; letter-spacing:-.035em; word-break:keep-all; overflow-wrap:anywhere; }
        .hx-im-care-section .hx-im-care-card:has([aria-expanded="true"]) { border-color:#11202c; background:#11202c; }
        .hx-im-care-section .hx-im-care-short[aria-expanded="true"] { color:#fff; }
        .hx-im-care-section [aria-expanded="true"] :is(.hx-im-care-number,.hx-im-care-open,.hx-im-care-department) { color:#bdccd9; border-color:#51616f; }
      }
      @media(max-width:360px) {
        .hx-im-care-section .hx-im-care-short { padding:13px 11px 11px; min-height:143px; }
        .hx-im-care-section .hx-im-care-primary { font-size:.90625rem; }
      }
      @media(max-width:767px) and (orientation:portrait) {
        .hx-im-care-section .hx-im-care-dialog { margin:auto 0 0; width:100%; max-height:88dvh; border-radius:18px 18px 0 0; padding-bottom:env(safe-area-inset-bottom,0px); }
      }
      @media(max-width:767px) and (orientation:landscape) {
        #hx-im-areas.hx-im-care-section { padding-top:24px; padding-bottom:24px; }
        .hx-im-care-section .hx-im-care-short { min-height:132px; padding:12px; }
        .hx-im-care-section .hx-im-care-primary { margin-top:7px; margin-bottom:10px; }
        .hx-im-care-section .hx-im-care-dialog { width:min(660px,calc(100% - 32px)); max-height:calc(100dvh - 24px); }
        .hx-im-care-section .hx-im-care-dialog-head { padding:16px 24px; }
        .hx-im-care-section .hx-im-care-dialog-title { font-size:1.25rem; margin-top:6px; }
        .hx-im-care-section .hx-im-care-dialog-head .hx-im-care-number { font-size:1.375rem; }
        .hx-im-care-section .hx-im-care-dialog-body { padding:18px 24px 24px; }
      }
    `;
    document.head.appendChild(style);

    function node(tag, className, text) {
      var element = document.createElement(tag);
      element.className = className;
      if (text) element.textContent = text;
      return element;
    }
    function list(items, long) {
      var ul = node('ul', 'hx-im-care-list' + (long ? ' hx-im-care-list-long' : ''));
      items.forEach(function (item) { ul.appendChild(node('li', '', item)); });
      return ul;
    }
    function content(item) {
      var body = node('div', 'hx-im-care-content');
      if (item.lead) body.appendChild(node('p', 'hx-im-care-lead', item.lead));
      if (item.items.length) body.appendChild(list(item.items));
      if (item.groupItems.length) {
        var group = node('div', 'hx-im-care-group');
        group.appendChild(node('p', 'hx-im-care-label', item.groupLabel));
        group.appendChild(list(item.groupItems, true));
        body.appendChild(group);
      }
      return body;
    }
    function footer(item) {
      var inner = node('div', 'hx-im-care-footer-inner');
      if (item.procedures.length) {
        inner.appendChild(node('p', 'hx-im-care-label', item.procedureLabel));
        item.procedures.forEach(function (procedure) {
          var treatment = node(procedure.href ? 'a' : 'p', 'hx-im-care-procedure', procedure.text);
          if (procedure.href) treatment.setAttribute('href', procedure.href);
          if (procedure.href === '#') {
            treatment.setAttribute('aria-disabled', 'true');
            treatment.setAttribute('tabindex', '-1');
            treatment.dataset.hxImLinkPending = 'true';
            treatment.addEventListener('click', function (event) { event.preventDefault(); });
          }
          inner.appendChild(treatment);
        });
      }
      if (item.center) {
        var link = node('a', 'hx-im-care-center', item.center.text);
        link.setAttribute('href', item.center.href);
        if (item.center.target) link.setAttribute('target', item.center.target);
        link.rel = 'noopener';
        var arrow = node('span', '', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        link.appendChild(arrow);
        inner.appendChild(link);
      }
      return inner;
    }

    var grid = node('div', 'hx-im-care-grid');
    var buttons = [];
    data.forEach(function (item) {
      var card = node('article', 'hx-im-care-card');
      card.tabIndex = -1;
      var full = node('div', 'hx-im-care-full');
      var heading = node('div', 'hx-im-care-heading');
      var headingInner = node('div', 'hx-im-care-heading-inner');
      var top = node('div', 'hx-im-care-top');
      top.appendChild(node('span', 'hx-im-care-number', item.number));
      top.appendChild(node('p', 'hx-im-care-english', item.english));
      headingInner.appendChild(top);
      headingInner.appendChild(node('h3', 'hx-im-care-title', item.title));
      heading.appendChild(headingInner);
      full.appendChild(heading);
      full.appendChild(content(item));
      var bottom = node('div', 'hx-im-care-footer');
      bottom.appendChild(footer(item));
      bottom.hidden = !bottom.firstElementChild.childElementCount;
      full.appendChild(bottom);
      card.appendChild(full);

      var button = node('button', 'hx-im-care-short');
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'hx-im-care-dialog');
      button.setAttribute('aria-label', item.front.join(' · ') + ' — ' + item.title + ' 상세 보기');
      var shortTop = node('span', 'hx-im-care-short-top');
      var number = node('span', 'hx-im-care-number', item.number);
      number.setAttribute('aria-hidden', 'true');
      shortTop.appendChild(number);
      var open = node('span', 'hx-im-care-open', '↗');
      open.setAttribute('aria-hidden', 'true');
      shortTop.appendChild(open);
      button.appendChild(shortTop);
      var primary = node('span', 'hx-im-care-primary');
      item.front.forEach(function (line) { primary.appendChild(node('span', '', line)); });
      button.appendChild(primary);
      button.appendChild(node('span', 'hx-im-care-department', item.title));
      button.addEventListener('click', function () { openDetails(item, button); });
      card.appendChild(button);
      buttons.push(button);
      grid.appendChild(card);
    });

    container.replaceChildren(grid);
    root.classList.add('hx-im-care-section');
    sections.slice(1).forEach(function (section) {
      section.dataset.hxImCareSource = 'true';
      section.hidden = true;
      section.removeAttribute('id');
    });

    // Native modal top layer makes the rest of the page inert, including shared CTAs.
    // Keep the dialog inside #hx-im-areas so existing center-link attribution works.
    var dialog = node('dialog', 'hx-im-care-dialog');
    dialog.id = 'hx-im-care-dialog';
    dialog.setAttribute('aria-labelledby', 'hx-im-care-dialog-title');
    var dialogHead = node('div', 'hx-im-care-dialog-head');
    var dialogNumber = node('span', 'hx-im-care-number');
    var dialogTitle = node('h3', 'hx-im-care-dialog-title');
    dialogTitle.id = 'hx-im-care-dialog-title';
    var dialogEnglish = node('p', 'hx-im-care-dialog-en');
    var closeButton = node('button', 'hx-im-care-close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', '상세 내용 닫기');
    dialogHead.append(dialogNumber, dialogTitle, dialogEnglish);
    var dialogBody = node('div', 'hx-im-care-dialog-body');
    var dialogScroll = node('div', 'hx-im-care-dialog-scroll');
    dialogScroll.tabIndex = 0;
    dialogScroll.setAttribute('role', 'region');
    dialogScroll.setAttribute('aria-label', '진료 영역 상세 내용');
    dialogScroll.append(dialogHead, dialogBody);
    dialog.append(dialogScroll, closeButton);
    root.appendChild(dialog);
    var active = null;
    var locked = null;

    function openDetails(item, button) {
      if (!matchMedia('(max-width:767px)').matches || dialog.open) return;
      active = button;
      dialogNumber.textContent = item.number;
      dialogTitle.textContent = item.title;
      dialogEnglish.textContent = item.english;
      dialogBody.replaceChildren(content(item), footer(item));
      locked = { x:window.scrollX, y:window.scrollY, styles:{} };
      ['position', 'top', 'left', 'right', 'width'].forEach(function (property) {
        locked.styles[property] = document.body.style[property];
      });
      document.body.style.position = 'fixed';
      document.body.style.top = -locked.y + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      button.setAttribute('aria-expanded', 'true');
      dialog.showModal();
      dialogScroll.scrollTop = 0;
      closeButton.focus({preventScroll:true});
    }
    dialog.addEventListener('close', function () {
      if (!locked) return;
      var previous = locked;
      locked = null;
      Object.keys(previous.styles).forEach(function (property) { document.body.style[property] = previous.styles[property]; });
      if (active) {
        active.setAttribute('aria-expanded', 'false');
        var target = matchMedia('(max-width:767px)').matches ? active : active.closest('article');
        target.focus({preventScroll:true});
      }
      window.scrollTo(previous.x, previous.y);
    });
    closeButton.addEventListener('click', function () { dialog.close(); });
    var backdropDown = false;
    function outside(event) {
      var bounds = dialog.getBoundingClientRect();
      return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    }
    dialog.addEventListener('pointerdown', function (event) { backdropDown = event.target === dialog && outside(event); });
    dialog.addEventListener('click', function (event) {
      if (backdropDown && event.target === dialog && outside(event)) dialog.close();
      backdropDown = false;
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var focusable = Array.from(dialog.querySelectorAll('button, a[href]:not([aria-disabled="true"]), [tabindex="0"]'));
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    function layout() {
      var width = grid.getBoundingClientRect().width;
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      var mobile = matchMedia('(max-width:767px)').matches;
      var columns = 2;
      if (!mobile && window.innerWidth >= 1800 && width >= Math.max(1128,70.5 * rem)) columns = 3;
      if (mobile && window.innerWidth >= 480 && matchMedia('(orientation:landscape)').matches && width >= Math.max(470,29.375 * rem)) columns = 3;
      if (width < (mobile ? 14 : 40) * rem) columns = 1;
      grid.style.gridTemplateColumns = 'repeat(' + columns + ',minmax(0,1fr))';
      if (!mobile) {
        if (dialog.open) dialog.close();
        ['heading', 'footer'].forEach(function (part) {
          var max = Math.max.apply(null, Array.from(grid.querySelectorAll('.hx-im-care-' + part + '-inner')).map(function (element) { return element.getBoundingClientRect().height; }));
          grid.style.setProperty('--hx-im-care-' + part + '-height', Math.ceil(max) + 'px');
        });
      }
    }
    var pending = false;
    function scheduleLayout() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; layout(); });
    }
    layout();
    window.addEventListener('resize', scheduleLayout);
    if (window.ResizeObserver) {
      var observer = new ResizeObserver(scheduleLayout);
      observer.observe(container);
      grid.querySelectorAll('.hx-im-care-heading-inner,.hx-im-care-footer-inner').forEach(function (element) { observer.observe(element); });
    }
    if (document.fonts) {
      document.fonts.ready.then(scheduleLayout);
      document.fonts.addEventListener('loadingdone', scheduleLayout);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCareAreas, {once:true});
  else initCareAreas();
})();
/* HELIX_IM_CARE_AC_END */
