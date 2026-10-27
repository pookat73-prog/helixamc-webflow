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
      // Stop short of the heading; let the tail start later and erase over a longer interval.
      var eraseStart = drawStart + travel * .80;
      var eraseEnd = drawStart + travel * 1.50;
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
      var head = Math.min(.94, clamp((scroll - g.drawStart) / (g.drawEnd - g.drawStart)));
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
