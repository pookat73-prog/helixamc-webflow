/* ================================================================
   HELIX AMC — 내과 섹션 2 헤드라인 하이라이트
   대상: #hx-im-intro 의 기존 About_Mini_Title 한 개
   ================================================================ */

(function () {
  'use strict';

  if (window.__hxImHeadlineHighlightInit) return;
  window.__hxImHeadlineHighlightInit = true;

  var EXPECTED = '정밀한 진단과 숙련된 의료진의 통찰, 그리고 보호자님과의 긴밀한 소통';
  var WORD_PATTERN = /진단|통찰|소통/g;
  var STYLE_ID = 'hx-im-headline-highlight-style';
  var RING_STYLE_ID = 'hx-im-insight-ring-style';

  function addRingStyles() {
    if (document.getElementById(RING_STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = RING_STYLE_ID;
    style.textContent = [
      '.whiteframe_open .sg_rings > .sg_ring.for-white-bg.left,',
      '.whiteframe_open .sg_rings > .sg_ring.for-white-bg.right {',
      '  box-sizing: border-box;',
      '  border: 1px solid transparent;',
      '  border-radius: 50%;',
      '}',
      ".whiteframe_open > .sg_rings {",
      "  align-items: center;",
      "  justify-content: center;",
      "}",
      ".whiteframe_open .sg_rings > .sg_ring.for-white-bg {",
      "  width: min(32rem, calc((100% + 3rem) / 2));",
      "  height: auto;",
      "  min-width: 0;",
      "  max-width: none;",
      "  aspect-ratio: 1;",
      "  flex: 0 0 auto;",
      "  margin: 0;",
      "  left: auto;",
      "  right: auto;",
      "  padding: clamp(1.5rem, 3vw, 3rem);",
      "  align-items: center;",
      "  justify-content: center;",
      "}",
      ".whiteframe_open .sg_rings > .sg_ring.for-white-bg.right {",
      "  margin-left: -3rem;",
      "}",
      ".whiteframe_open .sg_ring_content {",
      "  box-sizing: border-box;",
      "  width: 100%;",
      "  max-width: 22rem;",
      "  padding: 0;",
      "}",
      ".whiteframe_open .sg_ring_body {",
      "  width: 100%;",
      "  max-width: 100%;",
      "  margin-inline: auto;",
      "}",
      ".whiteframe_open > .sg_rings { isolation: isolate; }",
      ".whiteframe_open .sg_rings > .sg_ring.for-white-bg { border-color: transparent; }",
      ".whiteframe_open .sg_ring.for-white-bg::before,",
      ".whiteframe_open .sg_ring.for-white-bg::after {",
      "  content: \"\";",
      "  position: absolute;",
      "  border-radius: 50%;",
      "  pointer-events: none;",
      "}",
      ".whiteframe_open .sg_ring.for-white-bg::before {",
      "  inset: -1px;",
      "  z-index: 1;",
      "  border: 1px solid #0075d6;",
      "}",
      ".whiteframe_open .sg_ring.for-white-bg::after {",
      "  inset: -28px;",
      "  z-index: 0;",
      "  background: radial-gradient(circle closest-side at center,",
      "    transparent calc(100% - 48px),",
      "    rgba(0, 117, 214, .01) calc(100% - 40px),",
      "    rgba(0, 117, 214, .06) calc(100% - 28px),",
      "    rgba(0, 117, 214, .02) calc(100% - 16px),",
      "    transparent 100%);",
      "}",
      ".whiteframe_open .sg_ring.for-white-bg.left::before,",
      ".whiteframe_open .sg_ring.for-white-bg.left::after {",
      "  -webkit-mask-image: radial-gradient(ellipse 24% 40% at 100% 50%, transparent 0 22%, rgba(0, 0, 0, .28) 52%, #000 100%), linear-gradient(to bottom, rgba(0, 0, 0, .08) 0 25%, #000 40%);",
      "  mask-image: radial-gradient(ellipse 24% 40% at 100% 50%, transparent 0 22%, rgba(0, 0, 0, .28) 52%, #000 100%), linear-gradient(to bottom, rgba(0, 0, 0, .08) 0 25%, #000 40%);",
      "  -webkit-mask-composite: source-in;",
      "  mask-composite: intersect;",
      "}",
      ".whiteframe_open .sg_ring.for-white-bg.right::before,",
      ".whiteframe_open .sg_ring.for-white-bg.right::after {",
      "  -webkit-mask-image: radial-gradient(ellipse 24% 40% at 0 50%, transparent 0 22%, rgba(0, 0, 0, .28) 52%, #000 100%);",
      "  mask-image: radial-gradient(ellipse 24% 40% at 0 50%, transparent 0 22%, rgba(0, 0, 0, .28) 52%, #000 100%);",
      "}",
      ".whiteframe_open .sg_ring_content { position: relative; z-index: 2; }",
      "@media (max-width: 767px) {",
      "  .whiteframe_open .sg_ring.for-white-bg.left::before,",
      "  .whiteframe_open .sg_ring.for-white-bg.left::after,",
      "  .whiteframe_open .sg_ring.for-white-bg.right::before,",
      "  .whiteframe_open .sg_ring.for-white-bg.right::after {",
      "    -webkit-mask-image: none;",
      "    mask-image: none;",
      "  }",
      "}",
      ".whiteframe_open > .div-block-353 { position: relative; z-index: 1; }",
      "@media (max-width: 767px) {",
      "  .whiteframe_open .sg_ring.for-white-bg.left::before,",
      "  .whiteframe_open .sg_ring.for-white-bg.left::after {",
      "    -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, .08) 0 25%, #000 40%);",
      "    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, .08) 0 25%, #000 40%);",
      "    -webkit-mask-composite: source-over;",
      "    mask-composite: add;",
      "  }",
      "}",
      "@media (max-width: 767px) {",
      "  .whiteframe_open > .div-block-353 {",
      "    grid-template-columns: minmax(0, 1fr);",
      "  }",
      "  .whiteframe_open > .div-block-353 > .hx-im-inner {",
      "    width: 100%;",
      "    max-width: none;",
      "  }",
      "  .whiteframe_open > .sg_rings {",
      "    flex-direction: column;",
      "    gap: 0;",
      "  }",
      "  .whiteframe_open .sg_rings > .sg_ring.for-white-bg {",
      "    width: min(100%, 22rem);",
      "    padding: 1.5rem;",
      "  }",
      "  .whiteframe_open .sg_rings > .sg_ring.for-white-bg.right {",
      "    margin-left: 0;",
      "    margin-top: -1.5rem;",
      "  }",
      "}"
    ].join('\n');
    document.head.appendChild(style);
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#hx-im-intro .hx-im-highlight-word {',
      '  position: relative;',
      '  display: inline-block;',
      '  white-space: nowrap;',
      '  isolation: isolate;',
      '}',
      '#hx-im-intro .hx-im-highlight-word::before {',
      '  content: "";',
      '  position: absolute;',
      '  z-index: -1;',
      '  left: -0.1em;',
      '  top: calc(50% + 0.035em);',
      '  width: calc(100% + 0.2em);',
      '  height: 1.04em;',
      '  background-image: linear-gradient(rgba(0, 117, 214, 0.12), rgba(0, 117, 214, 0.12));',
      '  background-repeat: no-repeat;',
      '  background-position: left center;',
      '  background-size: 0% 100%;',
      '  transform: translateY(-50%);',
      '  transition: background-size 620ms cubic-bezier(0.4, 0, 0.2, 1);',
      '}',
      '#hx-im-intro .hx-im-highlight-word::after {',
      '  content: "";',
      '  position: absolute;',
      '  z-index: 1;',
      '  left: -0.1em;',
      '  top: calc(50% + 0.035em);',
      '  width: 2px;',
      '  height: 1.04em;',
      '  border-radius: 1px;',
      '  background: rgba(0, 117, 214, 0.92);',
      '  opacity: 0;',
      '  pointer-events: none;',
      '  transform: translate(-100%, -50%);',
      '  transition: left 620ms cubic-bezier(0.4, 0, 0.2, 1), transform 620ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease;',
      '}',
      '#hx-im-intro .hx-im-highlight-word.is-current::after { opacity: 1; }',
      '#hx-im-intro .hx-im-highlight-word.is-moving::after { left: calc(100% + 0.1em); transform: translate(0, -50%); }',
      '#hx-im-intro .hx-im-highlight-word.is-filled::before { background-size: 100% 100%; }',
      '#hx-im-intro .hx-im-highlight-word.is-dimmed::after { opacity: 0.3; }',
      '@media (prefers-reduced-motion: reduce) {',
      '  #hx-im-intro .hx-im-highlight-word::before,',
      '  #hx-im-intro .hx-im-highlight-word::after { transition: none; animation: none; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function wrapTargetWords(heading) {
    var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    var words = [];
    nodes.forEach(function (node) {
      var text = node.nodeValue || '';
      var pattern = new RegExp(WORD_PATTERN.source, 'g');
      var match;
      var lastIndex = 0;
      var fragment = document.createDocumentFragment();

      while ((match = pattern.exec(text))) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        var word = document.createElement('span');
        word.className = 'hx-im-highlight-word';
        word.textContent = match[0];
        fragment.appendChild(word);
        words.push(word);
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex === 0) return;
      if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      node.parentNode.replaceChild(fragment, node);
    });

    return words;
  }

  function init() {
    addRingStyles();

    var heading = document.querySelector('#hx-im-intro h2.about_mini_title.for-white-bg');
    if (!heading) return;

    var actual = (heading.textContent || '').replace(/\s+/g, ' ').trim();
    if (actual !== EXPECTED) return;

    var words = wrapTargetWords(heading);
    if (words.length !== 3) return;
    addStyles();

    var played = false;
    var observer = null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function finishHighlight() {
      if (heading.dataset.hxImHighlightComplete === 'true') return;
      heading.dataset.hxImHighlightComplete = 'true';
      heading.dispatchEvent(new Event('hx-im-headline-highlight-complete'));
    }

    function showFinalState() {
      words.forEach(function (word) {
        word.classList.add('is-filled');
      });
      words[2].classList.add('is-current', 'is-moving', 'is-dimmed');
      finishHighlight();
    }

    function play() {
      if (played) return;
      played = true;
      if (observer) observer.disconnect();
      if (reduceMotion.matches) {
        showFinalState();
        return;
      }

      var index = 0;
      function playNext() {
        var word = words[index];
        word.classList.add('is-current');
        window.setTimeout(function () {
          word.classList.add('is-moving', 'is-filled');
          window.setTimeout(function () {
            if (index === words.length - 1) {
              window.setTimeout(function () {
                word.classList.add('is-dimmed');
                // Wait for the final cursor's 350ms opacity transition to settle.
                window.setTimeout(finishHighlight, 350);
              }, 180);
              return;
            }
            word.classList.remove('is-current');
            index += 1;
            window.setTimeout(playNext, 180);
          }, 660);
        }, index === 0 ? 280 : 160);
      }
      playNext();
    }

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      play();
    } else {
      observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) play();
      }, { threshold: 0.1, rootMargin: '0px 0px -12% 0px' });
      observer.observe(heading);
    }

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', function (event) {
        if (event.matches) {
          played = true;
          if (observer) observer.disconnect();
          showFinalState();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
/* 내과 통찰: 첫 문단 완성 후 결론 문장에 무광 표면 빛반사 한 번 */
(function () {
  'use strict';

  function initInsightShine() {
    if (document.documentElement.getAttribute('data-wf-page') !== '69d74a8ea2cac3ea9cfed34d') return;
    var inner = document.querySelector('.whiteframe_open .div-block-353 .hx-im-inner');
    if (!inner) return;
    var first = inner.querySelector('h2:first-child');
    var heading = inner.querySelector('h2:nth-child(2)');
    if (!first || !heading || heading.textContent.trim() !== '그것이 수의사의 본질적인 역량입니다.') return;
    if (heading.classList.contains('hx-im-insight-shine')) return;
    if (!CSS.supports('background-clip', 'text') && !CSS.supports('-webkit-background-clip', 'text')) return;

    var base = getComputedStyle(heading).color;
    var rgb = base.match(/[\d.]+/g);
    if (!rgb || rgb.length < 3) return;
    function tint(amount) {
      return 'rgb(' + rgb.slice(0, 3).map(function (v) {
        return Math.round(Number(v) + (255 - Number(v)) * amount);
      }).join(',') + ')';
    }
    var solid = 'linear-gradient(' + base + ',' + base + ')';
    var sweep = 'radial-gradient(circle var(--hx-im-shine-radius) at 50% 50%,' + tint(0.45) +
      ' 0%,' + tint(0.33) + ' 35%,' + tint(0.12) + ' 68%,' + base + ' 100%)';
    var style = document.createElement('style');
    style.textContent = '.hx-im-insight-shine{background-clip:text;-webkit-background-clip:text;' +
      '-webkit-text-fill-color:transparent;background-size:300% 400%;background-repeat:no-repeat;}';
    document.head.appendChild(style);
    heading.style.backgroundImage = solid;
    heading.style.backgroundPosition = '100% 0';
    heading.classList.add('hx-im-insight-shine');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
    var visible = false;
    var ready = first.style.opacity !== '' && Number(first.style.opacity) >= 0.999;
    var played = false;
    var animation = null;
    function play() {
      if (played || !ready || !visible || reduceMotion.matches) return;
      played = true;
      opacityObserver.disconnect();
      visibilityObserver.disconnect();
      heading.style.backgroundImage = sweep;
      var bounds = heading.getBoundingClientRect();
      var radius = bounds.width * 0.9;
      var spread = bounds.width * 0.35;
      var paintWidth = bounds.width * 3;
      var paintHeight = radius * 2 + spread * 2 + bounds.height;
      var centerX = bounds.width * 0.5;
      var centerY = bounds.height * 0.55 - radius;
      heading.style.setProperty('--hx-im-shine-radius', spread + 'px');
      heading.style.backgroundSize = paintWidth + 'px ' + paintHeight + 'px';
      var path = [];
      for (var step = 0; step <= 48; step += 1) {
        var t = step / 48;
        // The light revolves around one fixed center at a constant radius.
        var angle = (160 - 140 * t) * Math.PI / 180;
        var x = centerX + radius * Math.cos(angle);
        var y = centerY + radius * Math.sin(angle);
        path.push({ offset: t, backgroundPosition:
          (x - paintWidth / 2) + 'px ' + (y - paintHeight / 2) + 'px' });
      }
      animation = heading.animate(path, { duration: 2400, easing: 'linear' });
      window.setTimeout(function () {
        window.dispatchEvent(new Event('hx-im-insight-ring-start'));
      }, 1200);
      animation.onfinish = function () { heading.style.backgroundImage = solid; };
    }
    var opacityObserver = new MutationObserver(function () {
      ready = Number(getComputedStyle(first).opacity) >= 0.999;
      play();
    });
    opacityObserver.observe(first, { attributes: true, attributeFilter: ['style'] });
    var visibilityObserver = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      play();
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    visibilityObserver.observe(heading);
    reduceMotion.addEventListener('change', function (event) {
      if (!event.matches) return;
      opacityObserver.disconnect();
      visibilityObserver.disconnect();
      if (animation) animation.cancel();
      heading.style.backgroundImage = solid;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInsightShine, { once: true });
  } else {
    initInsightShine();
  }
})();

/* 내과 통찰: 가운데 원 그리기 후 기존 두 원으로 분리 */
(function () {
  'use strict';
  function initRingSequence() {
    if (document.documentElement.getAttribute('data-wf-page') !== '69d74a8ea2cac3ea9cfed34d') return;
    var host = document.querySelector('.whiteframe_open > .sg_rings');
    if (!host || host.dataset.hxRingMotion) return;
    var rings = [host.querySelector('.sg_ring.left'), host.querySelector('.sg_ring.right')];
    if (rings.some(function (ring) { return !ring; })) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || !rings[0].animate) return;
    host.dataset.hxRingMotion = 'pending';
    var style = document.createElement('style');
    style.textContent = [
      '.sg_rings[data-hx-ring-motion="pending"] > .sg_ring { visibility: hidden; }',
      '.sg_rings[data-hx-ring-motion="drawing"] > .sg_ring { visibility: hidden; }',
      '.whiteframe_open .sg_rings[data-hx-ring-blending] .sg_ring.for-white-bg:is(.left,.right)::before { animation: hxImRingMaskIn 1100ms 300ms cubic-bezier(.42,0,.58,1) both; }',
      '.whiteframe_open .sg_rings .hx-im-ring-full-outline { position: absolute; inset: -1px; z-index: 1; box-sizing: content-box; padding: 0; border: 1px solid #0075d6; border-radius: 50%; pointer-events: none; animation: hxImRingMaskOut 1100ms 300ms cubic-bezier(.42,0,.58,1) both; }',
      '@keyframes hxImRingMaskIn { from { opacity: 0; } to { opacity: 1; } }',
      '@keyframes hxImRingMaskOut { from { opacity: 1; } to { opacity: 0; } }',
      '.sg_rings[data-hx-ring-motion="splitting"] .sg_ring::after { opacity: 0; }',
      '.sg_rings[data-hx-ring-motion="settling"] .sg_ring::after { animation: hxImRingHalo 200ms ease-out; }',
      '@keyframes hxImRingHalo { from { opacity: 0; } to { opacity: 1; } }'
    ].join('\n');
    document.head.appendChild(style);
    var active = [];
    var fullOutlines = [];
    var svg = null;
    var timers = [];
    var played = false;
    function later(fn, delay) { timers.push(window.setTimeout(fn, delay)); }
    function finish() {
      timers.forEach(window.clearTimeout);
      active.forEach(function (animation) { animation.cancel(); });
      fullOutlines.forEach(function (outline) { outline.remove(); });
      delete host.dataset.hxRingBlending;
      if (svg) svg.remove();
      host.dataset.hxRingMotion = 'done';
      window.removeEventListener('hx-im-insight-ring-start', start);
    }
    function start() {
      if (played || reduced.matches) return;
      played = true;
      var box = host.getBoundingClientRect();
      var bounds = rings.map(function (ring) { return ring.getBoundingClientRect(); });
      var cx = (bounds[0].left + bounds[0].width / 2 + bounds[1].left + bounds[1].width / 2) / 2 - box.left;
      var cy = (bounds[0].top + bounds[0].height / 2 + bounds[1].top + bounds[1].height / 2) / 2 - box.top;
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;';
      var circle = document.createElementNS(svg.namespaceURI, 'circle');
      circle.setAttribute('r', Math.max(0, bounds[0].width / 2 + .5));
      circle.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') rotate(-90) scale(1 -1)');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#0075d6');
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('pathLength', '1');
      circle.setAttribute('stroke-dasharray', '1');
      circle.setAttribute('stroke-dashoffset', '1');
      svg.appendChild(circle);
      host.appendChild(svg);
      host.dataset.hxRingMotion = 'drawing';
      var draw = circle.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: 900, easing: 'cubic-bezier(.42,0,.58,1)', fill: 'forwards' });
      active.push(draw);
      later(function () {
        svg.remove();
        // Crossfade a full outline into the final masked outline while the
        // rings separate; mask-image itself changes discretely in browsers.
        host.dataset.hxRingBlending = 'true';
        host.dataset.hxRingMotion = 'splitting';
        rings.forEach(function (ring, index) {
          var outline = document.createElement('span');
          outline.className = 'hx-im-ring-full-outline';
          outline.setAttribute('aria-hidden', 'true');
          ring.appendChild(outline);
          fullOutlines.push(outline);
          var b = bounds[index];
          var dx = cx - (b.left + b.width / 2 - box.left);
          var dy = cy - (b.top + b.height / 2 - box.top);
          active.push(ring.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }],
            { duration: 850, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' }));
          active.push(ring.querySelector('.sg_ring_content').animate([{ opacity: 0 }, { opacity: 1 }],
            { delay: 350, duration: 400, easing: 'ease-out', fill: 'both' }));
        });
        later(function () { host.dataset.hxRingMotion = 'settling'; }, 700);
        later(finish, 1450);
      }, 900);
    }
    window.addEventListener('hx-im-insight-ring-start', start);
    reduced.addEventListener('change', function (event) { if (event.matches) finish(); });
    window.addEventListener('resize', function () { if (played) finish(); }, { once: true });
    // If an anchor jump skips the conclusion, still reveal the diagram in view.
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      var heading = document.querySelector('.whiteframe_open .hx-im-insight-shine');
      if (heading && heading.getBoundingClientRect().bottom < 0) start();
      if (played) observer.disconnect();
    }, { threshold: .1 });
    observer.observe(host);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRingSequence, { once: true });
  } else { initRingSequence(); }
})();

/* HELIX Section 02 brand motion — approved v40. The entrance runs once;
   only the light circulation repeats. Appended to the existing loaded module. */
(function () {
  'use strict';
  if (document.documentElement.getAttribute('data-wf-page') !== '69d74a8ea2cac3ea9cfed34d') return;
  var scriptURL = document.currentScript && document.currentScript.src;
  if (!scriptURL) return;
  var symbolURL = new URL('assets/helix-symbol.webp', scriptURL).href;
  var motionRoot = {};
/* HELIX motion geometry and deterministic timing. No runtime dependencies. */
(function (root) {
  'use strict';
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const progress = (t, start, duration) => ease((t - start) / duration);
  // Invert Bezier X to get time, rather than treating the curve parameter as time.
  function cubicBezier(v,points){
    v=clamp(v);if(v===0||v===1)return v;
    const [x1,y1,x2,y2]=points;
    let lo=0,hi=1;
    for(let i=0;i<26;i++){
      const u=(lo+hi)/2,a=1-u,x=3*a*a*u*x1+3*a*u*u*x2+u*u*u;
      if(x<v)lo=u;else hi=u;
    }
    const u=(lo+hi)/2,a=1-u;
    return 3*a*a*u*y1+3*a*u*u*y2+u*u*u;
  }
  const motionCurves={draw:[.76,0,.24,1],flow:[.50,0,.30,1],retract:[.76,0,.24,1],symbolScale:[1,0,1,.34]};
  const diagnosticMotion={flashes:[0,.09,.17],flashRise:.06,flashDuration:.20,flashOpacity:.62,
    starts:[.18,.27,.35],drawDurations:[.51,.64,.68],shrinkStart:1.13,shrinkDuration:.34,release:1.45,parkX:118,
    originXs:[-138.8,-24.3,30.56],headingGap:50};
  const insightMotion={continuation:1.45,convergenceDuration:.40,scaleDuration:.30,fadeDuration:.20,trailLag:.05};
  const timedCurve=(t,start,duration,points)=>t<=start?0:t>=start+duration?1:cubicBezier((t-start)/duration,points);
  // Convergence ends at the symbol. The invisible orbit has its own later birth.
  const duration=diagnosticMotion.release+insightMotion.continuation,completeTime=duration+.4;
  const smoother=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
  // An oval with a left-offset twist, then a small physical front-down pitch.
  // Screen roll is independent; camera-space depth drives occlusion and light.
  const orbit={radiusX:218,radiusY:88,height:44,twistBias:.105,pitch:-2.5*Math.PI/180,
    elevation:12*Math.PI/180,roll:-2*Math.PI/180,focal:1000,centerX:300,centerY:220};
  function orbitPoint(u){
    const theta=2*Math.PI*u,s=Math.sin(theta),c=Math.cos(theta);
    const se=Math.sin(orbit.elevation),ce=Math.cos(orbit.elevation),te=Math.tan(orbit.elevation);
    const ovalX=orbit.radiusX*s,ovalY=-orbit.radiusY*c;
    // The cos(theta) term shifts the apparent waist left without pinching the oval.
    const ovalZ=-orbit.height*(Math.sin(2*theta)+2*orbit.twistBias*c)+ovalY*te;
    const vx=orbit.radiusX*c,ovalVy=orbit.radiusY*s;
    const ovalVz=-2*orbit.height*(Math.cos(2*theta)-orbit.twistBias*s)+ovalVy*te;
    const cp=Math.cos(orbit.pitch),sp=Math.sin(orbit.pitch);
    const worldX=ovalX,worldY=ovalY*cp-ovalZ*sp,worldZ=ovalY*sp+ovalZ*cp;
    const vy=ovalVy*cp-ovalVz*sp,vz=ovalVy*sp+ovalVz*cp;
    const depth=worldY*ce+worldZ*se,dDepth=vy*ce+vz*se;
    const screenY=worldY*se-worldZ*ce,dScreenY=vy*se-vz*ce;
    const scale=orbit.focal/(orbit.focal-depth),dScale=orbit.focal*dDepth/Math.pow(orbit.focal-depth,2);
    const x=worldX*scale,y=screenY*scale,dx=vx*scale+worldX*dScale,dy=dScreenY*scale+screenY*dScale;
    const cr=Math.cos(orbit.roll),sr=Math.sin(orbit.roll);
    return {x:orbit.centerX+x*cr-y*sr,y:orbit.centerY+x*sr+y*cr,
      dx:dx*cr-dy*sr,dy:dx*sr+dy*cr,worldX,worldY,worldZ,depth,scale,u};
  }
  const ring=Array.from({length:16},(_,i)=>{
    const a=orbitPoint(i/16),b=orbitPoint((i+1)/16),h=2*Math.PI/16/3;
    return [a.x,a.y,a.x+h*a.dx,a.y+h*a.dy,b.x-h*b.dx,b.y-h*b.dy,b.x,b.y];
  });
  ring[ring.length-1][6]=ring[0][0];ring[ring.length-1][7]=ring[0][1];
  const convergencePoint={x:300,y:188};
  const bodyEnvelope=[[224.107,251.937],[224.242,250.633],[224.526,248.678],[227.178,236.269],[249.422,140.805],[255.073,120.441],[256.288,117.827],[256.978,116.52],[258.686,113.903],[260.215,111.94],[262.073,109.974],[263.588,108.661],[265.268,107.348],[267.28,106.032],[268.451,105.373],[269.789,104.712],[272.964,103.387],[275.632,102.713],[348.114,98.574],[350.744,98.618],[354.202,99.321],[356.344,100.003],[360.461,101.367],[362.108,102.042],[364.746,103.383],[365.738,104.048],[367.557,105.375],[370.214,108.016],[372.217,110.648],[373.569,113.271],[374.419,115.238],[375.296,118.509],[375.672,121.123],[375.725,123.734],[375.602,125.69],[375.17,128.297],[371.53,147.293],[353.226,234.129],[351.565,240.745],[350.472,244.697],[349.762,246.672],[348.707,249.304],[347.323,251.937],[345.611,254.572],[343.569,257.207],[342.382,258.525],[340.355,260.504],[338.837,261.824],[337.996,262.485],[336.147,263.807],[335.139,264.469],[332.625,265.798],[331.285,266.462],[329.611,267.131],[327.771,267.8],[325.264,268.476],[320.42,269.176],[253.361,277.128],[247.773,277.035],[244.809,276.339],[239.042,274.302],[237.395,273.626],[235.913,272.953],[234.758,272.285],[232.775,270.955],[231.948,270.292],[230.456,268.969],[229.291,267.651],[228.29,266.335],[226.613,263.706],[225.762,261.741],[225.249,260.43],[224.548,257.813],[224.172,255.2]];
  // Pull the envelope closer to the mark; a narrow feather replaces the hard cut.
  const occlusion=bodyEnvelope.map(([x,y])=>[300+(x-300)*.965,188+(y-188)*.98]);
  const occlusionSoftness=3;
  const entryOrigins=[110,172,298];
  function makeEntry(index,startY=entryOrigins[index],startX=diagnosticMotion.originXs[index],parkX=diagnosticMotion.parkX) {
    const controls=[],curves=[];
    function guide(x){
      // Remain horizontal past the parked head so B-spline support cannot
      // round the end of the initial straight stroke. Curves begin after release.
      const join=smoother((x-parkX-10)/(276-parkX-10));
      const y=startY+(convergencePoint.y-startY)*join;
      return [x,y];
    }
    controls.push(guide(startX),guide(startX),guide(startX));
    const firstGrid=Math.floor((startX-8)/4.5625)+1;
    for(let i=firstGrid;i<=64;i++){const x=8+292*i/64;controls.push(guide(x));}
    controls.push(guide(300),guide(300));
    // A shared horizontal terminal enters the symbol, with no downward hook
    // toward the former visible ring. Preserve the C2 B-spline construction.
    const step=2.28125;
    controls.splice(-3,3,[convergencePoint.x-step,convergencePoint.y],
      [convergencePoint.x,convergencePoint.y],[convergencePoint.x+step,convergencePoint.y]);
    // Uniform cubic B-spline conversion: first AND second derivatives match.
    for(let i=0;i<controls.length-3;i++){
      const [a,b,c,d]=controls.slice(i,i+4),curve=[];
      for(const weights of [[1,4,1,0],[0,4,2,0],[0,2,4,0],[0,1,4,1]]){
        for(let axis=0;axis<2;axis++)curve.push((weights[0]*a[axis]+weights[1]*b[axis]+weights[2]*c[axis]+weights[3]*d[axis])/6);
      }
      curves.push(curve);
    }
    return curves;
  }
  const entries=entryOrigins.map((_,i)=>makeEntry(i));
  function cubic(c, t) {
    const a = 1-t;
    return {x:a*a*a*c[0]+3*a*a*t*c[2]+3*a*t*t*c[4]+t*t*t*c[6],
      y:a*a*a*c[1]+3*a*a*t*c[3]+3*a*t*t*c[5]+t*t*t*c[7]};
  }
  function sample(curves) {
    const points = [{...cubic(curves[0],0), length:0,u:0}],ends=[];
    const steps=curves.length>4?24:200;
    curves.forEach((c,index) => {
      for(let i=1;i<=steps;i++) {
        const p=cubic(c,i/steps), last=points[points.length-1];
        p.length=last.length+Math.hypot(p.x-last.x,p.y-last.y);
        p.u=(index+i/steps)/curves.length;points.push(p);
      }
      ends.push(points[points.length-1].length);
    });
    const length=points[points.length-1].length;
    return {points,length,breaks:[0,...ends.map(v=>v/length)]};
  }
  const ringTable=sample(ring), entryTables=entries.map(sample);
  const frontRanges=[];
  let frontRun=null;
  for(let i=1;i<ringTable.points.length;i++){
    const a=ringTable.points[i-1],b=ringTable.points[i];
    if(orbitPoint((a.u+b.u)/2).depth>0){
      if(!frontRun)frontRun=[a.length/ringTable.length,b.length/ringTable.length];
      else frontRun[1]=b.length/ringTable.length;
    }else if(frontRun){frontRanges.push(frontRun);frontRun=null;}
  }
  if(frontRun)frontRanges.push(frontRun);
  const maxDepth=Math.max(...ringTable.points.map(p=>Math.abs(orbitPoint(p.u).depth)));
  function pointAt(table, fraction) {
    const target=clamp(fraction)*table.length, pts=table.points;
    let lo=0,hi=pts.length-1;
    while(lo+1<hi){const mid=(lo+hi)>>1;if(pts[mid].length<target)lo=mid;else hi=mid;}
    const a=pts[lo],b=pts[hi],u=(target-a.length)/(b.length-a.length||1);
    return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,u:a.u+(b.u-a.u)*u};
  }
  function path(curves, closed) {
    return 'M'+curves[0][0]+' '+curves[0][1]+curves.map(c=>' C'+c.slice(2).join(' ')).join('')+(closed?' Z':'');
  }
  function segment(table,start,end) {
    const pts=[pointAt(table,start),...table.points.filter(p=>p.length>start*table.length&&p.length<end*table.length),pointAt(table,end)];
    return 'M'+pts.map(p=>p.x.toFixed(3)+' '+p.y.toFixed(3)).join(' L');
  }
  // Both layers meet in the same opaque blue at their boundaries. This avoids
  // the abrupt opacity/width jump of the previous foreground overlay.
  const paintMinX=pointAt(ringTable,frontRanges[0][1]).x;
  const paintMaxX=pointAt(ringTable,frontRanges[0][0]).x;
  const orbitPalette={edge:[154,182,207],rear:[181,202,220],front:[131,169,203]};
  function ringColor(x,front){
    const mix=Math.sin(Math.PI*clamp((x-paintMinX)/(paintMaxX-paintMinX)));
    const target=front?orbitPalette.front:orbitPalette.rear;
    return orbitPalette.edge.map((v,i)=>Math.round(v+(target[i]-v)*mix));
  }
  const orbitDuration=9,dotStartTime=diagnosticMotion.release+insightMotion.continuation*(1.51/2.23),dotStartU=.43;
  const dotIndex=dotStartU*(ringTable.points.length-1),dotLo=Math.floor(dotIndex);
  const dotStartFraction=(ringTable.points[dotLo].length+
    (ringTable.points[dotLo+1].length-ringTable.points[dotLo].length)*(dotIndex-dotLo))/ringTable.length;
  // A continuous screen-slope speed field: descend faster, climb more slowly.
  // Integrate reciprocal speed along the closed arc, then invert elapsed time.
  // This preserves a nine-second lap and avoids independent stop/start tweens.
  const dotRhythm={strength:.42,slopeGain:2,samples:2048};
  function dotSpeedWeight(fraction){
    const p=orbitPoint(pointAt(ringTable,fraction).u);
    const slope=p.dy/Math.hypot(p.dx,p.dy);
    return Math.exp(dotRhythm.strength*Math.tanh(dotRhythm.slopeGain*slope));
  }
  const dotTimeTable=[{fraction:0,phase:0}];
  let travelTime=0,previousWeight=dotSpeedWeight(0);
  for(let i=1;i<=dotRhythm.samples;i++){
    const fraction=i/dotRhythm.samples,weight=dotSpeedWeight(fraction);
    travelTime+=(1/previousWeight+1/weight)/(2*dotRhythm.samples);
    dotTimeTable.push({fraction,phase:travelTime});previousWeight=weight;
  }
  dotTimeTable.forEach(p=>{p.phase/=travelTime;});
  function dotPhaseAtFraction(fraction){
    const index=clamp(fraction)*dotRhythm.samples,lo=Math.min(Math.floor(index),dotRhythm.samples-1);
    const a=dotTimeTable[lo],b=dotTimeTable[lo+1];
    return a.phase+(b.phase-a.phase)*(index-lo);
  }
  function dotFractionAtPhase(phase){
    phase=clamp(phase);let lo=0,hi=dotTimeTable.length-1;
    while(lo+1<hi){const mid=(lo+hi)>>1;if(dotTimeTable[mid].phase<phase)lo=mid;else hi=mid;}
    const a=dotTimeTable[lo],b=dotTimeTable[hi];
    return a.fraction+(b.fraction-a.fraction)*(phase-a.phase)/(b.phase-a.phase);
  }
  const dotStartPhase=dotPhaseAtFraction(dotStartFraction);
  function createEntryBasis(origins=entryOrigins,startXs=diagnosticMotion.originXs,parkX=Math.max(diagnosticMotion.parkX,Math.max(...startXs)+32)){
    const canonical=origins===entryOrigins&&startXs===diagnosticMotion.originXs&&parkX===diagnosticMotion.parkX;
    const curves=canonical?entries:origins.map((y,i)=>makeEntry(i,y,startXs[i],parkX));
    const tables=canonical?entryTables:curves.map(sample);
    const parks=tables.map(table=>{
      const pts=table.points;let i=1;while(i<pts.length-1&&pts[i].x<parkX)i++;
      const a=pts[i-1],b=pts[i],v=clamp((parkX-a.x)/(b.x-a.x));
      return (a.length+(b.length-a.length)*v)/table.length;
    });
    // Anchor to the shortest remaining arc; all longer arcs catch up monotonically.
    const reference=Math.min(...tables.map((table,i)=>table.length*(1-parks[i])));
    return {origins,startXs,parkX,curves,tables,parks,reference};
  }
  const entryBasis=createEntryBasis();
  function flowDistance(t,reference=entryBasis.reference){
    return timedCurve(t,diagnosticMotion.release,insightMotion.convergenceDuration,motionCurves.flow)*reference;
  }
  function releasedHead(table,park,reference,t){
    const d=flowDistance(t,reference),remaining=table.length*(1-park),merge=smoother(d/reference);
    if(d>=reference)return 1;
    return clamp((table.length*park+d+(remaining-reference)*merge)/table.length);
  }
  function flowState(t,basis=entryBasis){
    const {tables,parks,reference}=basis,distance=flowDistance(t,reference);
    return {distance,reference,ringDraw:0,
      entries:tables.map((table,i)=>{
        const draw=t<=diagnosticMotion.release?parks[i]*timedCurve(t,diagnosticMotion.starts[i],diagnosticMotion.drawDurations[i],motionCurves.draw):releasedHead(table,parks[i],reference,t);
        const shrink=timedCurve(t,diagnosticMotion.shrinkStart,diagnosticMotion.shrinkDuration,motionCurves.retract);
        // First collapse to a point, then pull a short moving stroke from it.
        // Pin the tail to the formed point until its delayed clock catches up.
        const shrinkEnd=diagnosticMotion.shrinkStart+diagnosticMotion.shrinkDuration;
        const tail=t<=shrinkEnd?draw*shrink:Math.min(draw,Math.max(
          releasedHead(table,parks[i],reference,shrinkEnd),
          releasedHead(table,parks[i],reference,t-insightMotion.trailLag)));
        const remaining=Math.max(0,draw-tail)*table.length;
        const point=t>=shrinkEnd&&remaining<1e-5&&draw<1;
        const tip=t>=diagnosticMotion.shrinkStart?smoother(1-remaining/6):0;
        return {draw,tail,opacity:.55,width:1.1+1.5*tip,point};
      })};
  }
  const handoffTime=diagnosticMotion.release+insightMotion.convergenceDuration;
  const symbolScaleMotion={start:handoffTime-.32,duration:insightMotion.scaleDuration,from:.985,to:1,
    arrivalScale:.994,settleDuration:.16};
  const symbolFadeMotion={start:handoffTime-.23,duration:insightMotion.fadeDuration,power:6};
  const communicationMotion={start:symbolScaleMotion.start+symbolScaleMotion.duration+symbolScaleMotion.settleDuration+.02,
    startU:.40,singleDuration:.30,lapDuration:orbitDuration,twistRadians:Math.PI,radius:12,leadDistance:8,
    splitDuration:.52,edgeSplitSpan:.10,edgeMergeSpan:.09,turnSpeed:.48,midSpeed:1.48,
    trailDuration:.30,trailLength:40,trailSamples:24,headRadius:6.2};
  const wrap=v=>((v%1)+1)%1;
  function orbitFractionAtU(u){
    const index=u*(ringTable.points.length-1),lo=Math.min(Math.floor(index),ringTable.points.length-2);
    return (ringTable.points[lo].length+(ringTable.points[lo+1].length-ringTable.points[lo].length)*(index-lo))/ringTable.length;
  }
  function outerTurn(lo,hi,right){
    for(let i=0;i<44;i++){const mid=(lo+hi)/2;if((orbitPoint(mid).dx>0)===right)lo=mid;else hi=mid;}
    const u=(lo+hi)/2;return {u,fraction:orbitFractionAtU(u)};
  }
  const communicationTurns={right:outerTurn(.15,.35,true),left:outerTurn(.65,.85,false)};
  const communicationStartFraction=orbitFractionAtU(communicationMotion.startU);
  const communicationTwistStart=communicationStartFraction+.10;
  function communicationSpeedWeight(fraction){
    const m=communicationMotion,right=communicationTurns.right.fraction,left=communicationTurns.left.fraction;
    const f=right+wrap(fraction-right),leg=f<left?(f-right)/(left-right):(f-left)/(1+right-left);
    // Ease through both broad arcs: slow at the outer turns, faster midway.
    const rhythm=m.turnSpeed+(m.midSpeed-m.turnSpeed)*Math.pow(Math.sin(Math.PI*leg),2);
    return dotSpeedWeight(fraction)*rhythm;
  }
  const communicationTimeTable=[{fraction:0,phase:0}];
  let communicationTravelTime=0,communicationPreviousWeight=communicationSpeedWeight(0);
  for(let i=1;i<=dotRhythm.samples;i++){
    const fraction=i/dotRhythm.samples,weight=communicationSpeedWeight(fraction);
    communicationTravelTime+=(1/communicationPreviousWeight+1/weight)/(2*dotRhythm.samples);
    communicationTimeTable.push({fraction,phase:communicationTravelTime});communicationPreviousWeight=weight;
  }
  communicationTimeTable.forEach(p=>{p.phase/=communicationTravelTime;});
  function communicationPhaseAtFraction(fraction){
    const index=clamp(fraction)*dotRhythm.samples,lo=Math.min(Math.floor(index),dotRhythm.samples-1);
    const a=communicationTimeTable[lo],b=communicationTimeTable[lo+1];
    return a.phase+(b.phase-a.phase)*(index-lo);
  }
  function communicationFractionAtPhase(phase){
    phase=clamp(phase);let lo=0,hi=communicationTimeTable.length-1;
    while(lo+1<hi){const mid=(lo+hi)>>1;if(communicationTimeTable[mid].phase<phase)lo=mid;else hi=mid;}
    const a=communicationTimeTable[lo],b=communicationTimeTable[hi];
    return a.fraction+(b.fraction-a.fraction)*(phase-a.phase)/(b.phase-a.phase);
  }
  const communicationStartPhase=communicationPhaseAtFraction(communicationStartFraction);
  function communicationPhase(age){
    return communicationStartPhase+Math.max(0,age)/communicationMotion.lapDuration;
  }
  const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function communicationPose(t){
    const m=communicationMotion,age=Math.max(0,t-m.start),phase=communicationPhase(age);
    const turns=Math.floor(phase),fraction=communicationFractionAtPhase(wrap(phase)),unwrapped=turns+fraction;
    const u=pointAt(ringTable,fraction).u,p=orbitPoint(u),a=orbitPoint(u-1e-5),b=orbitPoint(u+1e-5);
    const se=Math.sin(orbit.elevation),ce=Math.cos(orbit.elevation);
    const camera=v=>[v.worldX,v.worldY*se-v.worldZ*ce,v.worldY*ce+v.worldZ*se];
    const center=camera(p),va=camera(a),vb=camera(b),tangent=unit(vb.map((v,i)=>v-va[i]));
    const normal=unit([-tangent[1],tangent[0],0]),binormal=cross(tangent,normal);
    const splitStart=m.start+m.singleDuration;
    const edgeOpen=smoother((fraction-communicationTurns.right.fraction)/m.edgeSplitSpan);
    const edgeClose=1-smoother((fraction-communicationTurns.left.fraction)/m.edgeMergeSpan);
    const edgeSplit=edgeOpen*edgeClose;
    const split=progress(t,splitStart,m.splitDuration)*edgeSplit;
    // Swap sides once on the front arc; reunite before the rear passage.
    // Orientation resets only where separation is exactly zero.
    const twist=clamp((fraction-communicationTwistStart)/(communicationTurns.left.fraction-communicationTwistStart));
    const angle=m.twistRadians*twist,radius=m.radius*split;
    const displacement=normal.map((v,i)=>radius*(Math.cos(angle)*v+Math.sin(angle)*binormal[i]));
    // A very small, symmetric lead/lag keeps the pair together rather than
    // turning it into a leader and follower. Grow it with the initial split.
    const lead=m.leadDistance*.5*split;
    const cr=Math.cos(orbit.roll),sr=Math.sin(orbit.roll);
    const opacity=progress(t,m.start,.13);
    return {fraction,unwrapped,split,twist,edgeSplit,center:p,lights:[1,-1].map((sign,index)=>{
      const q=center.map((v,i)=>v+sign*(displacement[i]+lead*tangent[i])),perspective=orbit.focal/(orbit.focal-q[2]);
      const x=q[0]*perspective,y=q[1]*perspective;
      const localDepth=sign*displacement[2]/m.radius;
      return {x:orbit.centerX+x*cr-y*sr,y:orbit.centerY+x*sr+y*cr,depth:q[2],
        worldCamera:q,scale:perspective*(.95+.07*localDepth),
        opacity:opacity*(.88+.12*localDepth)*(index===0?1:progress(t,splitStart,.22)*smoother(edgeSplit/.22)),front:q[2]>0};
    })};
  }
  function communicationState(t,reduced=false){
    const m=communicationMotion,pose=communicationPose(t),history=[];
    if(t<=m.start)return {fraction:pose.fraction,split:pose.split,twist:pose.twist,lights:pose.lights.map(head=>({...head,trail:[]}))};
    let tailTime=Math.max(m.start,t-m.trailDuration);
    const coordinate=time=>{const p=communicationPhase(time-m.start);return Math.floor(p)+communicationFractionAtPhase(wrap(p));};
    // Bound both time and distance, so each tail remains a small passing trace.
    if(pose.unwrapped-coordinate(tailTime)>m.trailLength/ringTable.length){
      let lo=tailTime,hi=t;
      for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(pose.unwrapped-coordinate(mid)>m.trailLength/ringTable.length)lo=mid;else hi=mid;}
      tailTime=hi;
    }
    for(let i=0;i<=m.trailSamples;i++)history.push(communicationPose(tailTime+(t-tailTime)*i/m.trailSamples));
    return {fraction:pose.fraction,split:pose.split,twist:pose.twist,lights:pose.lights.map((head,index)=>({
      ...head,opacity:reduced?head.opacity*.92:head.opacity,
      trail:history.slice(1).map((frame,i)=>{
        const a=history[i].lights[index],b=frame.lights[index],q=(i+.5)/m.trailSamples;
        const point=p=>p.x.toFixed(3)+' '+p.y.toFixed(3);
        let rear='',front='';
        if((a.depth>0)===(b.depth>0)){
          const d='M'+point(a)+' L'+point(b);if(a.depth>0)front=d;else rear=d;
        }else{
          const v=-a.depth/(b.depth-a.depth),mid={x:a.x+(b.x-a.x)*v,y:a.y+(b.y-a.y)*v};
          const first='M'+point(a)+' L'+point(mid),last='M'+point(mid)+' L'+point(b);
          if(a.depth>0){front=first;rear=last;}else{rear=first;front=last;}
        }
        return {a,b,rear,front,width:.35+.9*Math.sqrt(q),opacity:.42*Math.pow(q,1.8)*Math.min(a.opacity,b.opacity)};
      })
    }))};
  }
  function flashAt(t,index,basis){
    const p=basis.tables[index].points[0],age=t-diagnosticMotion.flashes[index];
    const intensity=age<0||age>=diagnosticMotion.flashDuration?0:
      age<diagnosticMotion.flashRise?ease(age/diagnosticMotion.flashRise):1-ease((age-diagnosticMotion.flashRise)/(diagnosticMotion.flashDuration-diagnosticMotion.flashRise));
    return {x:p.x,y:p.y,opacity:diagnosticMotion.flashOpacity*intensity,scale:.66+.34*intensity};
  }
  function state(t,reduced,basis=entryBasis) {
    t=Math.max(0,t);
    if(reduced)t=completeTime;
    const fraction=reduced ? dotStartFraction : dotFractionAtPhase((dotStartPhase+Math.max(0,t-dotStartTime)/orbitDuration)%1);
    const dot=pointAt(ringTable,fraction),pose=orbitPoint(dot.u),depth=Math.max(-1,Math.min(1,pose.depth/maxDepth));
    const frame=basis,flow=flowState(t,frame),entryProgress=flow.distance/flow.reference;
    // Hold almost invisible, then accelerate sharply to full presence.
    // A tiny decelerating scale tail remains after the image is fully visible.
    const symbolOpacity=t>=symbolFadeMotion.start+symbolFadeMotion.duration?1:
      Math.pow(clamp((t-symbolFadeMotion.start)/symbolFadeMotion.duration),symbolFadeMotion.power);
    const mainScaleEnd=symbolScaleMotion.start+symbolScaleMotion.duration;
    const settle=clamp((t-mainScaleEnd)/symbolScaleMotion.settleDuration);
    const symbolScale=t<=mainScaleEnd?symbolScaleMotion.from+(symbolScaleMotion.arrivalScale-symbolScaleMotion.from)*
      timedCurve(t,symbolScaleMotion.start,symbolScaleMotion.duration,motionCurves.symbolScale):
      symbolScaleMotion.arrivalScale+(symbolScaleMotion.to-symbolScaleMotion.arrivalScale)*(1-Math.pow(1-settle,3));
    return {t,entries:flow.entries,entryCurves:frame.curves,entryLengths:frame.tables.map(table=>table.length),
      flashes:frame.tables.map((_,i)=>flashAt(t,i,frame)),
      entryProgress,flowDistance:flow.distance,flowReference:flow.reference,
      symbolOpacity,
      symbolScale,
      symbolY:0,symbolBlur:0,rearOcclusion:.84*symbolOpacity,
      communication:communicationState(t,reduced),
      ringDraw:flow.ringDraw,dotOpacity:reduced?1:progress(t,dotStartTime,.22),
      dot,dotScale:.94*pose.scale,dotDepthOpacity:.91+.09*depth,
      fraction,front:pose.depth>1e-9,
      phase:t<diagnosticMotion.starts[2]+diagnosticMotion.drawDurations[2]?'진단 · 통찰 · 소통이 차례로 출발합니다':
        t<diagnosticMotion.shrinkStart?'아주 잠깐 유지합니다':
        t<diagnosticMotion.shrinkStart+diagnosticMotion.shrinkDuration?'꼬리가 따라와 작은 점으로 모입니다':
        entryProgress<1?'심볼을 향해 하나로 수렴합니다':t<communicationMotion.start?'헬릭스 심볼이 나타납니다':
          t<communicationMotion.start+communicationMotion.singleDuration?'작은 빛이 우상단에서 내려옵니다':'하나의 빛이 둘로 나뉘어 소통합니다'};
  }
  root.HelixMotion={orbit,orbitPoint,ring,entries,makeEntry,ringTable,entryTables,frontRanges,occlusion,occlusionSoftness,
    paintMinX,paintMaxX,orbitPalette,ringColor,dotStartFraction,dotStartTime,dotStartPhase,dotRhythm,dotSpeedWeight,dotPhaseAtFraction,dotFractionAtPhase,
    sample,pointAt,path,segment,state,flowDistance,flowState,diagnosticMotion,insightMotion,convergencePoint,createEntryBasis,entryBasis,handoffTime,cubicBezier,motionCurves,symbolScaleMotion,symbolFadeMotion,communicationMotion,communicationTurns,communicationStartFraction,communicationSpeedWeight,communicationPhaseAtFraction,communicationFractionAtPhase,communicationPhase,communicationPose,communicationState,duration,completeTime,orbitDuration};
  if(typeof module!=='undefined')module.exports=root.HelixMotion;
})(motionRoot);

  var core = motionRoot.HelixMotion;
  var markup = "<svg id=\"hx-im-brand-art\" viewBox=\"0 0 600 500\" xmlns=\"http://www.w3.org/2000/svg\" focusable=\"false\">\n    <defs>\n     <linearGradient id=\"hx-im-brand-orbit-rear\" gradientUnits=\"userSpaceOnUse\" x1=\"82.13279970983712\" y1=\"0\" x2=\"517.8672002901628\" y2=\"0\"><stop offset=\"0\" stop-color=\"rgb(154,182,207)\"/><stop offset=\"0.03125\" stop-color=\"rgb(157,184,208)\"/><stop offset=\"0.0625\" stop-color=\"rgb(159,186,210)\"/><stop offset=\"0.09375\" stop-color=\"rgb(162,188,211)\"/><stop offset=\"0.125\" stop-color=\"rgb(164,190,212)\"/><stop offset=\"0.15625\" stop-color=\"rgb(167,191,213)\"/><stop offset=\"0.1875\" stop-color=\"rgb(169,193,214)\"/><stop offset=\"0.21875\" stop-color=\"rgb(171,195,215)\"/><stop offset=\"0.25\" stop-color=\"rgb(173,196,216)\"/><stop offset=\"0.28125\" stop-color=\"rgb(175,197,217)\"/><stop offset=\"0.3125\" stop-color=\"rgb(176,199,218)\"/><stop offset=\"0.34375\" stop-color=\"rgb(178,200,218)\"/><stop offset=\"0.375\" stop-color=\"rgb(179,200,219)\"/><stop offset=\"0.40625\" stop-color=\"rgb(180,201,219)\"/><stop offset=\"0.4375\" stop-color=\"rgb(180,202,220)\"/><stop offset=\"0.46875\" stop-color=\"rgb(181,202,220)\"/><stop offset=\"0.5\" stop-color=\"rgb(181,202,220)\"/><stop offset=\"0.53125\" stop-color=\"rgb(181,202,220)\"/><stop offset=\"0.5625\" stop-color=\"rgb(180,202,220)\"/><stop offset=\"0.59375\" stop-color=\"rgb(180,201,219)\"/><stop offset=\"0.625\" stop-color=\"rgb(179,200,219)\"/><stop offset=\"0.65625\" stop-color=\"rgb(178,200,218)\"/><stop offset=\"0.6875\" stop-color=\"rgb(176,199,218)\"/><stop offset=\"0.71875\" stop-color=\"rgb(175,197,217)\"/><stop offset=\"0.75\" stop-color=\"rgb(173,196,216)\"/><stop offset=\"0.78125\" stop-color=\"rgb(171,195,215)\"/><stop offset=\"0.8125\" stop-color=\"rgb(169,193,214)\"/><stop offset=\"0.84375\" stop-color=\"rgb(167,191,213)\"/><stop offset=\"0.875\" stop-color=\"rgb(164,190,212)\"/><stop offset=\"0.90625\" stop-color=\"rgb(162,188,211)\"/><stop offset=\"0.9375\" stop-color=\"rgb(159,186,210)\"/><stop offset=\"0.96875\" stop-color=\"rgb(157,184,208)\"/><stop offset=\"1\" stop-color=\"rgb(154,182,207)\"/></linearGradient><linearGradient id=\"hx-im-brand-orbit-front\" gradientUnits=\"userSpaceOnUse\" x1=\"82.13279970983712\" y1=\"0\" x2=\"517.8672002901628\" y2=\"0\"><stop offset=\"0\" stop-color=\"rgb(154,182,207)\"/><stop offset=\"0.03125\" stop-color=\"rgb(152,181,207)\"/><stop offset=\"0.0625\" stop-color=\"rgb(150,179,206)\"/><stop offset=\"0.09375\" stop-color=\"rgb(147,178,206)\"/><stop offset=\"0.125\" stop-color=\"rgb(145,177,205)\"/><stop offset=\"0.15625\" stop-color=\"rgb(143,176,205)\"/><stop offset=\"0.1875\" stop-color=\"rgb(141,175,205)\"/><stop offset=\"0.21875\" stop-color=\"rgb(139,174,204)\"/><stop offset=\"0.25\" stop-color=\"rgb(138,173,204)\"/><stop offset=\"0.28125\" stop-color=\"rgb(136,172,204)\"/><stop offset=\"0.3125\" stop-color=\"rgb(135,171,204)\"/><stop offset=\"0.34375\" stop-color=\"rgb(134,171,203)\"/><stop offset=\"0.375\" stop-color=\"rgb(133,170,203)\"/><stop offset=\"0.40625\" stop-color=\"rgb(132,170,203)\"/><stop offset=\"0.4375\" stop-color=\"rgb(131,169,203)\"/><stop offset=\"0.46875\" stop-color=\"rgb(131,169,203)\"/><stop offset=\"0.5\" stop-color=\"rgb(131,169,203)\"/><stop offset=\"0.53125\" stop-color=\"rgb(131,169,203)\"/><stop offset=\"0.5625\" stop-color=\"rgb(131,169,203)\"/><stop offset=\"0.59375\" stop-color=\"rgb(132,170,203)\"/><stop offset=\"0.625\" stop-color=\"rgb(133,170,203)\"/><stop offset=\"0.65625\" stop-color=\"rgb(134,171,203)\"/><stop offset=\"0.6875\" stop-color=\"rgb(135,171,204)\"/><stop offset=\"0.71875\" stop-color=\"rgb(136,172,204)\"/><stop offset=\"0.75\" stop-color=\"rgb(138,173,204)\"/><stop offset=\"0.78125\" stop-color=\"rgb(139,174,204)\"/><stop offset=\"0.8125\" stop-color=\"rgb(141,175,205)\"/><stop offset=\"0.84375\" stop-color=\"rgb(143,176,205)\"/><stop offset=\"0.875\" stop-color=\"rgb(145,177,205)\"/><stop offset=\"0.90625\" stop-color=\"rgb(147,178,206)\"/><stop offset=\"0.9375\" stop-color=\"rgb(150,179,206)\"/><stop offset=\"0.96875\" stop-color=\"rgb(152,181,207)\"/><stop offset=\"1\" stop-color=\"rgb(154,182,207)\"/></linearGradient>\n     <radialGradient id=\"hx-im-brand-partner-light\">\n      <stop offset=\"0\" stop-color=\"#f8fdff\"/><stop offset=\".14\" stop-color=\"#e1f5ff\" stop-opacity=\".94\"/>\n      <stop offset=\".32\" stop-color=\"#9ccfe9\" stop-opacity=\".72\"/>\n      <stop offset=\".62\" stop-color=\"#79b8db\" stop-opacity=\".22\"/>\n      <stop offset=\"1\" stop-color=\"#79b8db\" stop-opacity=\"0\"/>\n     </radialGradient>\n     <filter id=\"hx-im-brand-envelope-feather\" filterUnits=\"userSpaceOnUse\" x=\"180\" y=\"60\" width=\"250\" height=\"260\"><feGaussianBlur stdDeviation=\"3\"/></filter>\n     <radialGradient id=\"hx-im-brand-orbit-light\">\n      <stop offset=\"0\" stop-color=\"#f5fcff\" stop-opacity=\"1\"/>\n      <stop offset=\".14\" stop-color=\"#d9f3ff\" stop-opacity=\".94\"/>\n      <stop offset=\".32\" stop-color=\"#73c4ff\" stop-opacity=\".68\"/>\n      <stop offset=\".62\" stop-color=\"#4bafff\" stop-opacity=\".22\"/>\n      <stop offset=\"1\" stop-color=\"#398fff\" stop-opacity=\"0\"/>\n     </radialGradient>\n     <mask id=\"hx-im-brand-body-envelope\" maskUnits=\"userSpaceOnUse\" x=\"-600\" y=\"0\" width=\"1200\" height=\"500\" style=\"mask-type:luminance\">\n      <rect x=\"-600\" width=\"1200\" height=\"500\" fill=\"white\"/>\n      <path data-occlusion d=\"M226.76325500000002 250.65826 L226.89353 249.38034000000002 L227.16759000000002 247.46444 L229.72677 235.30362 L251.19223 141.7489 L256.645445 121.79218 L257.81792 119.23046 L258.48377 117.9496 L260.13199 115.38494 L261.60747499999997 113.4612 L263.400445 111.53452 L264.86242000000004 110.24778 L266.48362 108.96104 L268.42519999999996 107.67135999999999 L269.55521500000003 107.02554 L270.846385 106.37776000000001 L273.91026 105.07926 L276.48488 104.41874 L346.43001 100.36252 L348.96796 100.40563999999999 L352.30493 101.09458 L354.37196 101.76294 L358.344865 103.09966 L359.93422 103.76116 L362.47988999999995 105.07534 L363.43717 105.72704 L365.192505 107.0275 L367.75651 109.61568000000001 L369.68940499999997 112.19503999999999 L370.99408500000004 114.76558 L371.81433499999997 116.69324 L372.66064 119.89882 L373.02348 122.46054000000001 L373.074625 125.01932 L372.95592999999997 126.9362 L372.53905000000003 129.49106 L369.02644999999995 148.10714000000002 L351.36309 233.20641999999998 L349.760225 239.6901 L348.70547999999997 243.56306 L348.02033 245.49856 L347.002255 248.07792 L345.666695 250.65826 L344.014615 253.24056000000002 L342.044085 255.82286 L340.89863 257.11449999999996 L338.94257500000003 259.05392 L337.477705 260.34752000000003 L336.66614 260.99530000000004 L334.881855 262.29086 L333.909135 262.93962 L331.483125 264.24204 L330.19002500000005 264.89275999999995 L328.574615 265.54837999999995 L326.799015 266.204 L324.37976000000003 266.86648 L319.7053 267.55248 L254.99336499999998 275.34544 L249.600945 275.25430000000006 L246.74068499999998 274.57222 L241.17553 272.57596 L239.58617500000003 271.91348 L238.156045 271.25393999999994 L237.04147 270.5993 L235.12787500000002 269.29589999999996 L234.32982 268.64615999999995 L232.89004 267.34961999999996 L231.765815 266.05798000000004 L230.79985 264.76829999999995 L229.181545 262.19188 L228.36033 260.26617999999996 L227.865285 258.9814 L227.18882000000002 256.41674 L226.82598000000002 253.856 Z\" fill=\"black\" filter=\"url(#hx-im-brand-envelope-feather)\"/>\n     </mask>\n    </defs>\n    <g mask=\"url(#hx-im-brand-body-envelope)\">\n\n\n\n    <path data-entry=\"\" class=\"entry\"/><path data-entry=\"\" class=\"entry\"/><path data-entry=\"\" class=\"entry\"/>\n    <g data-start-flash=\"\" style=\"opacity:0\"><circle fill=\"url(#hx-im-brand-orbit-light)\" r=\"5.8\"/></g>\n    <g data-start-flash=\"\" style=\"opacity:0\"><circle fill=\"url(#hx-im-brand-orbit-light)\" r=\"5.8\"/></g>\n    <g data-start-flash=\"\" style=\"opacity:0\"><circle fill=\"url(#hx-im-brand-orbit-light)\" r=\"5.8\"/></g>\n    <path data-ring class=\"orbit\" d=\"M300.16045242829836 224.59475637661077 C326.62781915884403 233.8754511539189 352.8592813681525 242.91338475040166 377.3924385544183 249.12095170798813 C401.92559574068406 255.3285186655746 424.7733871464575 258.642165428457 444.6430547586839 257.8563884905998 C464.5127223709103 257.07061155274255 481.41128936976804 252.1625513276235 494.04367567701865 243.96272249875418 C506.67606198426927 235.76289366988485 515.0217284102865 224.30803727061317 517.8672002901628 212.39190971885478 C520.7126721700391 200.47578216709638 518.0057666912221 188.2236877373666 509.1741021165977 179.18950882390294 C500.3424375419733 170.1553299104393 485.34317800687995 164.50617967045204 465.0206204917515 164.25067859843244 C444.6980629766231 163.99517752641285 419.07920739195305 169.18175051901392 390.5820864508246 178.48976851834806 C362.08496550969613 187.7977865176822 330.79263102400034 201.08002266382414 299.8069575123546 214.47198642941987 C268.82128400070883 227.8639501950156 238.20149609255608 241.1689130636927 210.59658378197102 250.7587598555559 C182.99167147138596 260.34860664741905 158.40873448723855 266.13500070218316 138.56158021858832 266.94707835260647 C118.7144259499381 267.7591560030298 103.5930315710111 263.6342772703108 94.03903509086216 256.20722520171586 C84.48503861071322 248.7801731331209 80.49818110211608 238.16652697029465 82.13279970983712 227.60809028114525 C83.76741831755815 217.04965359199585 91.02473000212797 206.67994154007758 103.14455030335637 199.41205229779007 C115.26437060458477 192.14416305550256 132.23052853658885 188.05372569948798 152.5688385911075 188.08469129941483 C172.90714864562614 188.11565689934167 196.58666679447956 192.24096598451794 221.78894771675868 199.06462374648038 C246.99122863903781 205.88828150844282 273.6930856977526 215.31406159930262 300.16045242829836 224.59475637661077 Z\" display=\"none\"/>\n    <path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"0\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"1\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"2\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"3\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"4\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"5\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"6\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"7\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"8\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"9\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"10\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"11\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"12\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"13\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"14\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"15\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"16\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"17\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"18\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"19\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"20\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"21\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"22\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"rear\" data-sample=\"23\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"0\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"1\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"2\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"3\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"4\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"5\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"6\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"7\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"8\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"9\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"10\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"11\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"12\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"13\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"14\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"15\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"16\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"17\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"18\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"19\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"20\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"21\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"22\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"rear\" data-sample=\"23\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><g data-comet-head=\"\" data-partner=\"0\" data-side=\"rear\" style=\"opacity:0\"><circle fill=\"url(#hx-im-brand-orbit-light)\" r=\"6.2\"/></g><g data-comet-head=\"\" data-partner=\"1\" data-side=\"rear\" style=\"opacity:0\"><circle fill=\"url(#hx-im-brand-partner-light)\" r=\"6.2\"/></g>\n    </g>\n    <g data-symbol><image x=\"219.196875\" y=\"65.759375\" width=\"163.2\" height=\"244.8\" href=\"\" preserveAspectRatio=\"xMidYMid meet\"/></g>\n    <g data-foreground=\"\">\n    <path data-front class=\"orbit front\" d=\"M517.867 212.392 L518.194 210.901 L518.463 209.408 L518.673 207.915 L518.825 206.422 L518.917 204.933 L518.951 203.447 L518.926 201.968 L518.841 200.495 L518.696 199.032 L518.491 197.579 L518.225 196.138 L517.900 194.710 L517.513 193.297 L517.065 191.901 L516.556 190.523 L515.985 189.165 L515.353 187.827 L514.658 186.513 L513.902 185.223 L513.082 183.958 L512.200 182.721 L511.255 181.513 L510.246 180.335 L509.174 179.190 L508.038 178.078 L506.838 177.003 L505.575 175.964 L504.248 174.964 L502.859 174.002 L501.407 173.080 L499.893 172.198 L498.318 171.358 L496.681 170.560 L494.983 169.805 L493.225 169.094 L491.406 168.428 L489.528 167.808 L487.590 167.234 L485.593 166.708 L483.537 166.230 L481.423 165.801 L479.251 165.422 L477.021 165.095 L474.734 164.819 L472.390 164.595 L469.990 164.426 L467.533 164.311 L465.021 164.251 L462.453 164.247 L459.831 164.299 L457.156 164.407 L454.429 164.570 L451.651 164.788 L448.823 165.059 L445.947 165.383 L443.022 165.760 L440.051 166.189 L437.034 166.670 L433.972 167.202 L430.867 167.784 L427.719 168.416 L424.529 169.097 L421.300 169.827 L418.030 170.604 L414.723 171.430 L411.377 172.302 L407.996 173.221 L404.580 174.185 L401.129 175.195 L397.645 176.249 L394.129 177.348 L390.582 178.490 L387.006 179.674 L383.401 180.897 L379.771 182.159 L376.115 183.457 L372.435 184.790 L368.734 186.156 L365.011 187.553 L361.268 188.979 L357.507 190.434 L353.729 191.915 L349.936 193.421 L346.128 194.949 L342.307 196.499 L338.474 198.069 L334.632 199.656 L330.780 201.260 L326.921 202.878 L323.055 204.509 L319.185 206.151 L315.311 207.803 L311.435 209.463 L307.558 211.129 L303.682 212.799 L299.807 214.472 L295.936 216.145 L292.070 217.816 L288.210 219.483 L284.357 221.144 L280.513 222.798 L276.678 224.443 L272.854 226.078 L269.041 227.701 L265.242 229.310 L261.457 230.904 L257.687 232.482 L253.934 234.041 L250.198 235.581 L246.481 237.099 L242.784 238.594 L239.108 240.065 L235.455 241.510 L231.824 242.926 L228.218 244.314 L224.638 245.671 L221.085 246.996 L217.559 248.286 L214.063 249.541 L210.597 250.759 L207.162 251.938 L203.759 253.076 L200.390 254.174 L197.054 255.231 L193.752 256.247 L190.486 257.220 L187.256 258.150 L184.062 259.037 L180.906 259.881 L177.788 260.680 L174.709 261.435 L171.670 262.145 L168.671 262.808 L165.713 263.426 L162.797 263.997 L159.924 264.520 L157.094 264.996 L154.308 265.424 L151.567 265.802 L148.872 266.132 L146.223 266.412 L143.621 266.641 L141.067 266.820 L138.562 266.947 L136.105 267.023 L133.699 267.048 L131.342 267.023 L129.036 266.949 L126.780 266.827 L124.575 266.656 L122.422 266.438 L120.321 266.174 L118.272 265.864 L116.275 265.509 L114.331 265.110 L112.440 264.667 L110.603 264.181 L108.820 263.653 L107.092 263.083 L105.418 262.473 L103.799 261.823 L102.235 261.133 L100.728 260.404 L99.276 259.638 L97.881 258.834 L96.543 257.994 L95.262 257.118 L94.039 256.207 L92.874 255.262 L91.767 254.286 L90.717 253.279 L89.726 252.243 L88.793 251.180 L87.918 250.090 L87.101 248.976 L86.343 247.838 L85.642 246.678 L85.000 245.498 L84.416 244.299 L83.890 243.082 L83.423 241.849 L83.013 240.600 L82.663 239.339 L82.370 238.065 L82.136 236.780 L81.960 235.487 L81.843 234.185 L81.784 232.877 L81.783 231.564 L81.841 230.247 L81.958 228.928 L82.133 227.608\" display=\"none\"/>\n    <path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"0\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"1\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"2\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"3\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"4\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"5\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"6\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"7\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"8\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"9\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"10\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"11\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"12\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"13\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"14\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"15\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"16\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"17\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"18\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"19\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"20\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"21\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"22\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"0\" data-side=\"front\" data-sample=\"23\" fill=\"none\" stroke=\"#5c9bda\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"0\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"1\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"2\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"3\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"4\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"5\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"6\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"7\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"8\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"9\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"10\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"11\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"12\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"13\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"14\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"15\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"16\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"17\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"18\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"19\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"20\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"21\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"22\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><path data-comet-trail=\"\" data-partner=\"1\" data-side=\"front\" data-sample=\"23\" fill=\"none\" stroke=\"#88b5d6\" stroke-linecap=\"butt\" style=\"opacity:0\"/><g data-comet-head=\"\" data-partner=\"0\" data-side=\"front\" style=\"opacity:0\"><circle fill=\"url(#hx-im-brand-orbit-light)\" r=\"6.2\"/></g><g data-comet-head=\"\" data-partner=\"1\" data-side=\"front\" style=\"opacity:0\"><circle fill=\"url(#hx-im-brand-partner-light)\" r=\"6.2\"/></g>\n    </g>\n   </svg>";

  function initBrandMotion() {
    var section = document.getElementById('hx-im-intro');
    var heading = section && section.querySelector('h2.about_mini_title.for-white-bg');
    var frame = section && section.querySelector('.div-block-350');
    if (!heading || !frame || section.querySelector('.hx-im-brand-motion')) return;
    var words = Array.from(heading.querySelectorAll('.hx-im-highlight-word'));
    if (words.length !== 3) return;

    var style = document.createElement('style');
    style.id = 'hx-im-brand-motion-style';
    style.textContent = [
      '#hx-im-intro .hx-im-brand-motion{position:absolute;pointer-events:none;user-select:none;z-index:0;line-height:0;}',
      '#hx-im-intro .hx-im-brand-motion svg{display:block;width:100%;height:auto;overflow:visible;}',
      '#hx-im-intro .hx-im-brand-motion .entry{fill:none;stroke:#5c91cf;stroke-width:1.1;stroke-linecap:round;opacity:0;}',
      '#hx-im-intro .hx-im-brand-motion.is-stacked{position:relative;inset:auto!important;width:min(100%,480px)!important;margin:24px auto 0;grid-column:1/-1;}',
      '#hx-im-intro .hx-im-brand-motion [data-symbol]{opacity:0;}'
    ].join('\n');
    document.head.appendChild(style);
    if (getComputedStyle(section).position === 'static') section.style.position = 'relative';

    var art = document.createElement('div');
    art.className = 'hx-im-brand-motion';
    art.setAttribute('aria-hidden', 'true');
    art.innerHTML = markup;
    var svg = art.querySelector('svg');
    var symbol = svg.querySelector('[data-symbol]');
    var image = symbol.querySelector('image');
    var occlusion = svg.querySelector('[data-occlusion]');
    var lines = Array.from(svg.querySelectorAll('[data-entry]'));
    var flashes = Array.from(svg.querySelectorAll('[data-start-flash]'));
    var heads = Array.from(svg.querySelectorAll('[data-comet-head]'));
    var trails = Array.from(svg.querySelectorAll('[data-comet-trail]'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var narrow = window.matchMedia('(max-width: 767px)');
    var basis = core.entryBasis, elapsed = 0, previous = null, raf = 0, layoutRAF = 0;
    var inView = false, entered = false, ready = false, failed = false, stacked = false, staticShown = false, geometryKey = '';
    var highlightComplete = heading.dataset.hxImHighlightComplete === 'true';
    var lastCurves = null;
    var diagnostic = { version: 'v40', status: 'loading', asset: symbolURL };
    window.__hxImBrandMotion = diagnostic;
    section.appendChild(art);

    function isStatic() { return reduce.matches || narrow.matches || stacked; }
    function canRun() { return ready && !failed && highlightComplete && entered && inView && !document.hidden && !isStatic(); }
    function paint() {
      if (isStatic() && ready && inView) staticShown = true;
      if (!isStatic() && staticShown) elapsed = Math.max(elapsed, core.completeTime);
      var s = core.state(elapsed, isStatic(), basis);
      if (lastCurves !== s.entryCurves) {
        lines.forEach(function (node, i) { node.setAttribute('d', core.path(s.entryCurves[i], false)); });
        lastCurves = s.entryCurves;
      }
      lines.forEach(function (node, i) {
        var e = s.entries[i], length = s.entryLengths[i], span = Math.max(0, e.draw - e.tail) * length;
        node.style.visibility = span > 1e-5 || e.point ? 'visible' : 'hidden';
        node.style.strokeDasharray = Math.max(span, e.point ? .001 : 0) + ' ' + (length + 1);
        node.style.strokeDashoffset = String(-e.tail * length);
        node.style.strokeWidth = e.width;
        node.style.opacity = e.opacity;
      });
      flashes.forEach(function (node, i) {
        var f = s.flashes[i]; node.style.opacity = f.opacity;
        node.setAttribute('transform', 'translate(' + f.x + ' ' + f.y + ') scale(' + f.scale + ')');
      });
      var transform = 'translate(300 188) scale(' + s.symbolScale + ') translate(-300 -188)';
      symbol.style.opacity = s.symbolOpacity; symbol.setAttribute('transform', transform);
      occlusion.style.opacity = s.rearOcclusion; occlusion.setAttribute('transform', transform);
      heads.forEach(function (node, i) {
        var light = s.communication.lights[i % 2];
        node.setAttribute('transform', 'translate(' + light.x + ' ' + light.y + ') scale(' + light.scale + ')');
        node.style.opacity = light.front === (i >= 2) ? light.opacity : 0;
      });
      trails.forEach(function (node, i) {
        var n = core.communicationMotion.trailSamples, side = i >= 2 * n ? 'front' : 'rear';
        var sample = s.communication.lights[Math.floor(i / n) % 2].trail[i % n];
        node.setAttribute('d', sample ? sample[side] : '');
        node.style.strokeWidth = sample ? sample.width : 0;
        node.style.opacity = sample ? sample.opacity : 0;
      });
      diagnostic.elapsed = elapsed;
      diagnostic.status = failed ? 'error' : !ready ? 'loading' : isStatic() ? 'static' :
        !highlightComplete ? 'waiting' : elapsed >= core.duration ? 'loop' : 'intro';
      diagnostic.running = canRun();
      diagnostic.stacked = stacked;
      art.dataset.hxImBrandPhase = diagnostic.status;
    }
    function tick(now) {
      raf = 0;
      if (!canRun()) { previous = null; return; }
      if (previous !== null) elapsed += (now - previous) / 1000;
      previous = now; paint(); raf = requestAnimationFrame(tick);
    }
    function sync() {
      if (!canRun() && raf) { cancelAnimationFrame(raf); raf = 0; previous = null; }
      if (canRun() && !raf) { previous = null; raf = requestAnimationFrame(tick); }
      paint();
    }
    function textLines() {
      var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT), rects = [], node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        var range = document.createRange(); range.selectNodeContents(node);
        Array.from(range.getClientRects()).forEach(function (r) { if (r.width > 0) rects.push(r); });
      }
      return words.map(function (word) {
        var range = document.createRange(); range.selectNodeContents(word);
        var box = range.getBoundingClientRect(), cy = box.top + box.height / 2;
        var sameLine = rects.filter(function (r) { return Math.abs(r.top + r.height / 2 - cy) < Math.max(3, box.height * .35); });
        return { cy: cy, right: Math.max.apply(null, sameLine.map(function (r) { return r.right; }).concat(box.right)) };
      });
    }
    function layout() {
      layoutRAF = 0;
      var anchors = textLines(), bounds = section.getBoundingClientRect(), content = frame.getBoundingClientRect();
      if (bounds.width <= 0 || content.width <= 0) return;
      var textRight = Math.max.apply(null, anchors.map(function (a) { return a.right; }));
      var available = content.right - textRight - core.diagnosticMotion.headingGap - 12;
      var width = Math.min(600, content.width * .56, available / .82);
      stacked = narrow.matches || width < 280;
      art.classList.toggle('is-stacked', stacked);
      if (stacked) {
        // On narrow layouts the existing text/grid stays intact; only a static
        // completed graphic is added underneath, inside the same section.
        basis = core.entryBasis;
      } else {
        var left = textRight + core.diagnosticMotion.headingGap - width * .05;
        var lineHeight = (anchors[2].cy - anchors[0].cy) / 3;
        var centerY = anchors[1].cy + lineHeight * .30;
        var top = centerY - width * core.convergencePoint.y / 600;
        art.style.width = width + 'px';
        art.style.left = left - bounds.left - section.clientLeft + 'px';
        art.style.top = top - bounds.top - section.clientTop + 'px';
        var starts = anchors.map(function (a) { return (a.right + core.diagnosticMotion.headingGap - left) / width * 600; });
        var origins = anchors.map(function (a) { return (a.cy - top) / width * 600; });
        var key = origins.concat(starts).map(function (v) { return v.toFixed(3); }).join(',');
        if (key !== geometryKey || basis === core.entryBasis) {
          basis = core.createEntryBasis(origins, starts); geometryKey = key;
        }
        diagnostic.gaps = anchors.map(function (a, i) { return left + starts[i] / 600 * width - a.right; });
      }
      sync();
    }
    function scheduleLayout() { if (!layoutRAF) layoutRAF = requestAnimationFrame(layout); }
    heading.addEventListener('hx-im-headline-highlight-complete', function () {
      highlightComplete = true; sync();
    }, { once: true });
    image.addEventListener('error', function () {
      failed = true; art.style.display = 'none'; sync();
      console.warn('[hx-im-brand-motion] symbol image failed to load');
    });
    image.addEventListener('load', function () { ready = true; sync(); }, { once: true });
    image.setAttribute('href', symbolURL);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; sync(); },
        { threshold: .1 }).observe(section);
      var entrance = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        entered = true; entrance.disconnect(); sync();
      }, { threshold: .1, rootMargin: '0px 0px -12% 0px' });
      entrance.observe(heading);
    } else { inView = true; entered = true; }
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', function () { elapsed = Math.max(elapsed, core.completeTime); sync(); });
    narrow.addEventListener('change', scheduleLayout);
    window.addEventListener('resize', scheduleLayout, { passive: true });
    if ('ResizeObserver' in window) {
      var resize = new ResizeObserver(scheduleLayout); resize.observe(section); resize.observe(heading);
    }
    if (document.fonts) {
      document.fonts.ready.then(scheduleLayout);
      document.fonts.addEventListener('loadingdone', scheduleLayout);
    }
    layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBrandMotion, { once: true });
  else initBrandMotion();
})();

/* 내과 진료 프로세스: 진입 후 1 → 4 → 5 → 1 순차 점등 */
(function () {
  var mobile = window.matchMedia('(max-width: 767px)');
  function init() {
    if (mobile.matches) {
      mobile.addEventListener('change', init, { once: true });
      return;
    }
    var section = document.querySelector('#hx-im-process');
    if (!section || section.dataset.hxImMotion) return;
    var titles = Array.from(section.querySelectorAll('.sj_step.for-title'));
    var cards = titles.map(function (element) { return element.parentElement; });
    if (cards.length < 5) return;
    section.dataset.hxImMotion = 'ready';
    section.classList.add('hx-im-motion-ready');
    cards.forEach(function (element) { element.classList.add('hx-im-process-pair'); });
    cards[4].classList.add('hx-im-step5-halo');
    var old = section.querySelector('.hx-im-process-loop');
    if (old) old.remove();
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'hx-im-process-loop');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><filter id="hx-im-dot-glow" x="-500%" y="-500%" width="1100%" height="1100%"><feGaussianBlur stdDeviation="5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="glow"/><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path fill="none" stroke="currentColor" stroke-width="2" opacity=".8"/><g opacity="0"><circle r="3" fill="#009cff" filter="url(#hx-im-dot-glow)"/><circle r="3" fill="#bfeaff"/></g>';
    section.appendChild(svg);
    var path = svg.querySelector('path');
    var light = svg.querySelector('g');
    var core = light.lastElementChild;
    var progress = 0;
    var length = 0;
    var stop = .5;
    var frame = 0;
    var played = false;
    var disposed = false;
    var traceFrame = 0;
    var pauseTimer = 0;
    var animations = [];
    function watch(animation) {
      animations.push(animation);
      animation.finished.catch(function () {});
      return animation;
    }
    function disableOnMobile(event) {
      if (!event.matches) return;
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(traceFrame);
      clearTimeout(pauseTimer);
      animations.forEach(function (animation) { animation.cancel(); });
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', check);
      mobile.removeEventListener('change', disableOnMobile);
      svg.remove();
      cards[4].classList.remove('hx-im-step5-halo', 'hx-im-halo-lit');
      section.classList.remove('hx-im-motion-ready');
      delete section.dataset.hxImMotion;
      delete section.dataset.hxImPhase;
      mobile.addEventListener('change', init, { once: true });
    }
    mobile.addEventListener('change', disableOnMobile);
    var shadow = '0 3px 21px -6px ' + getComputedStyle(section).getPropertyValue('--텍스트위계4').trim();

    function paint() {
      path.style.strokeDasharray = length + ' ' + length;
      path.style.strokeDashoffset = length * (1 - progress);
      var point = path.getPointAtLength(length * progress);
      light.setAttribute('transform', 'translate(' + point.x + ' ' + point.y + ')');
    }
    function draw() {
      if (disposed) return;
      var bounds = section.getBoundingClientRect();
      function rect(element) {
        var box = element.getBoundingClientRect();
        return { right: box.right - bounds.left, cx: box.left - bounds.left + box.width / 2, cy: box.top - bounds.top + box.height / 2 };
      }
      var start = rect(cards[3]);
      var middle = rect(cards[4]);
      var end = rect(cards[0]);
      var fromX = start.right + 2;
      var toX = end.right + 10;
      var controlX = (middle.cx - (fromX + toX) / 8) / .75;
      svg.setAttribute('viewBox', '0 0 ' + bounds.width + ' ' + bounds.height);
      if (middle.cy > start.cy) {
        var outer = Math.min(bounds.width - 12, Math.max(start.right, middle.right, end.right) + 24);
        path.setAttribute('d', 'M ' + fromX + ' ' + start.cy +
          ' C ' + outer + ' ' + start.cy + ' ' + (middle.cx - 60) + ' ' + middle.cy + ' ' + middle.cx + ' ' + middle.cy +
          ' C ' + (middle.cx + 60) + ' ' + middle.cy + ' ' + outer + ' ' + end.cy + ' ' + toX + ' ' + end.cy);
      } else {
        path.setAttribute('d', 'M ' + fromX + ' ' + start.cy + ' C ' + controlX + ' ' + start.cy + ' ' + controlX + ' ' + end.cy + ' ' + toX + ' ' + end.cy);
      }
      length = path.getTotalLength();
      var nearest = Infinity;
      for (var i = 1; i < 100; i++) {
        var point = path.getPointAtLength(length * i / 100);
        var distance = Math.hypot(point.x - middle.cx, point.y - middle.cy);
        if (distance < nearest) { nearest = distance; stop = i / 100; }
      }
      paint();
    }
    function schedule() {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    }
    function fadeTitle(index, delay) {
      return watch(titles[index].animate([{ boxShadow: '0 3px 21px -6px transparent' }, { boxShadow: shadow }], {
        duration: 1100, delay: delay || 0, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards'
      }));
    }
    function trace(from, to, duration) {
      section.dataset.hxImPhase = to < 1 ? 'arc-to-5' : 'arc-to-1';
      svg.style.visibility = 'visible';
      light.setAttribute('opacity', '1');
      return new Promise(function (resolve) {
        var started;
        function tick(now) {
          if (started === undefined) started = now;
          var fraction = Math.min(1, (now - started) / duration);
          var eased = fraction * fraction * (3 - 2 * fraction);
          progress = from + (to - from) * eased;
          paint();
          if (fraction < 1) traceFrame = requestAnimationFrame(tick);
          else resolve();
        }
        traceFrame = requestAnimationFrame(tick);
      });
    }
    async function play() {
      if (played || disposed || mobile.matches) return;
      played = true;
      window.removeEventListener('scroll', check);
      section.dataset.hxImMotion = 'playing';
      section.dataset.hxImPhase = 'shadows-1-to-4';
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        titles.forEach(function (element) { element.style.boxShadow = shadow; });
        cards[4].classList.add('hx-im-halo-lit');
        svg.style.visibility = 'visible';
        light.setAttribute('opacity', '1');
        core.setAttribute('fill', '#009cff');
        progress = 1;
        paint();
      } else {
        var shadows = titles.slice(0, 4).map(function (_, index) { return fadeTitle(index, index * 260).finished; });
        await Promise.all(shadows);
        if (disposed) return;
        await trace(0, stop, 1200);
        if (disposed) return;
        section.dataset.hxImPhase = 'step-5-flash';
        cards[4].classList.add('hx-im-halo-lit');
        fadeTitle(4, 260);
        await new Promise(function (resolve) { pauseTimer = setTimeout(resolve, 1400); });
        if (disposed) return;
        await trace(stop, 1, 1400);
        if (disposed) return;
        section.dataset.hxImPhase = 'endpoint-settle';
        await Promise.all([
          watch(core.animate([{ fill: '#bfeaff' }, { fill: '#009cff' }], { duration: 350, fill: 'forwards', easing: 'ease-out' })).finished,
          watch(light.firstElementChild.animate([{ opacity: 1 }, { opacity: .6 }], { duration: 350, fill: 'forwards', easing: 'ease-out' })).finished
        ]);
      }
      if (disposed) return;
      section.dataset.hxImMotion = 'complete';
      section.dataset.hxImPhase = 'complete';
    }
    function check() {
      var bounds = section.getBoundingClientRect();
      if (bounds.top <= window.innerHeight * .3 && bounds.bottom > 0) play().catch(function (error) { if (!disposed) console.error(error); });
    }
    var observer = new ResizeObserver(schedule);
    observer.observe(section);
    cards.forEach(function (element) { observer.observe(element); });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('scroll', check, { passive: true });
    if (document.fonts) document.fonts.ready.then(function () { draw(); check(); });
    draw();
    check();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

/* 본문 → 심도 있는 통찰: 홈처럼 스크롤에 맞춰 그리고 꼬리부터 지우는 브랜드 선. */
(function () {
  'use strict';
  if (document.documentElement.getAttribute('data-wf-page') !== '69d74a8ea2cac3ea9cfed34d') return;

  function init() {
    if (document.getElementById('hx-im-insight-connector')) return;
    var intro = document.getElementById('hx-im-intro');
    var body = intro && intro.querySelector('.div-block-351 .nomal-parag');
    var next = intro && intro.nextElementSibling;
    var heading = next && next.querySelector('.div-block-352 .about_mini_title.for-big-blue');
    if (!body || !heading) return;

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.id = 'hx-im-insight-connector';
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    // A body-level overlay crosses the section boundary without changing either layout.
    svg.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;overflow:visible;pointer-events:none;';
    var navbar = document.querySelector('.navbar, .w-nav, header');
    var navZ = navbar && parseInt(getComputedStyle(navbar).zIndex, 10);
    svg.style.zIndex = navZ > 0 ? navZ - 1 : 10;
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#0075d6');
    path.setAttribute('stroke-width', '1.3');
    path.setAttribute('stroke-linecap', 'butt');
    path.setAttribute('stroke-dasharray', '0 999999');
    svg.appendChild(path);
    document.body.appendChild(svg);

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var frame = 0, needsMeasure = true, geometry = null;
    var displayedScroll = null, previousTime = null;
    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function textBounds(element) {
      var range = document.createRange();
      range.selectNodeContents(element);
      var box = range.getBoundingClientRect();
      return box.width && box.height ? box : element.getBoundingClientRect();
    }
    function measure() {
      var start = textBounds(body), end = textBounds(heading);
      var origin = svg.getBoundingClientRect();
      var gap = window.innerWidth <= 767 ? 20 : 28;
      var top = start.bottom + gap, bottom = end.top - gap;
      if (!start.width || !end.width || bottom <= top) { geometry = null; return; }
      var x1 = start.left + start.width / 2 - origin.left;
      var x2 = end.left + end.width / 2 - origin.left;
      var y1 = top - origin.top, y2 = bottom - origin.top, middle = (y1 + y2) / 2;
      path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + middle + ' ' + x2 + ' ' + middle + ' ' + x2 + ' ' + y2);
      var scroll = window.scrollY, height = window.innerHeight;
      var drawStart = top + scroll - height * .65;
      // Keep a real drawing interval even when a short viewport compresses the gap.
      var drawEnd = Math.max(drawStart + height * .30, bottom + scroll - height * .6);
      var travel = drawEnd - drawStart;
      // Keep a longer stroke through more scroll travel; erase it before the title (~97%).
      var eraseStart = drawStart + travel * .64;
      var eraseEnd = drawStart + travel * .98;
      geometry = { length: path.getTotalLength(), drawStart: drawStart, drawEnd: drawEnd,
        eraseStart: eraseStart, eraseEnd: eraseEnd };
    }
    function render(now) {
      frame = 0;
      if (needsMeasure) {
        needsMeasure = false; measure();
        displayedScroll = window.scrollY; previousTime = null;
      }
      if (!geometry || reduce.matches) { svg.style.visibility = 'hidden'; return; }
      var target = window.scrollY;
      // Frame-rate-independent easing: follow scrolling gently, then stop requesting frames.
      var deltaTime = previousTime === null ? 1000 / 60 : Math.min(64, now - previousTime);
      displayedScroll += (target - displayedScroll) * (1 - Math.exp(-deltaTime / 260));
      if (Math.abs(target - displayedScroll) < .1 || document.hidden) displayedScroll = target;
      var g = geometry, scroll = displayedScroll;
      var head = clamp((scroll - g.drawStart) / (g.drawEnd - g.drawStart));
      var tail = Math.min(head, clamp((scroll - g.eraseStart) / (g.eraseEnd - g.eraseStart)));
      var visible = (head - tail) * g.length;
      path.setAttribute('stroke-dasharray', visible + ' ' + (g.length + 1));
      path.setAttribute('stroke-dashoffset', String(-tail * g.length));
      svg.style.visibility = visible > .01 ? 'visible' : 'hidden';
      svg.dataset.phase = head === 0 ? 'before' : tail >= head ? 'complete' : tail > 0 ? 'erase' : 'draw';
      if (displayedScroll !== target) { previousTime = now; schedule(); }
      else previousTime = null;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(render); }
    function refresh() { needsMeasure = true; schedule(); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', refresh, { passive: true });
    window.addEventListener('load', refresh, { once: true });
    window.addEventListener('pageshow', refresh);
    reduce.addEventListener('change', refresh);
    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(refresh);
      [intro, next, document.body].forEach(function (element) { observer.observe(element); });
    }
    if (document.fonts) {
      document.fonts.ready.then(refresh);
      document.fonts.addEventListener('loadingdone', refresh);
    }
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
