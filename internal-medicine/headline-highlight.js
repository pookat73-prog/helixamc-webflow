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
      '  border: 1px solid #0075d6;',
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
      "    gap: 1.5rem;",
      "  }",
      "  .whiteframe_open .sg_rings > .sg_ring.for-white-bg {",
      "    width: min(100%, 22rem);",
      "    padding: 1.5rem;",
      "  }",
      "  .whiteframe_open .sg_rings > .sg_ring.for-white-bg.right {",
      "    margin-left: 0;",
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

    function showFinalState() {
      words.forEach(function (word) {
        word.classList.add('is-filled');
      });
      words[2].classList.add('is-current', 'is-moving', 'is-dimmed');
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
    var sweep = 'radial-gradient(circle var(--hx-im-shine-radius) at 50% 50%,' + tint(0.40) +
      ' 0%,' + tint(0.33) + ' 35%,' + tint(0.12) + ' 68%,' + base + ' 100%)';
    var style = document.createElement('style');
    style.textContent = '.hx-im-insight-shine{background-clip:text;-webkit-background-clip:text;' +
      '-webkit-text-fill-color:transparent;background-size:300% 400%;background-repeat:no-repeat;}';
    document.head.appendChild(style);
    // Keep the original glyph silhouette; light uses an eroded inner alpha mask.
    var svgNS = 'http://www.w3.org/2000/svg';
    function svgNode(tag, attributes) {
      var node = document.createElementNS(svgNS, tag);
      Object.keys(attributes).forEach(function (key) {
        node.setAttribute(key, attributes[key]);
      });
      return node;
    }
    var svg = svgNode('svg', { width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false' });
    svg.style.cssText = 'position:absolute;pointer-events:none;overflow:hidden;';
    var defs = svgNode('defs', {});
    var filter = svgNode('filter', { id: 'hx-im-insight-inner-light',
      x: '0%', y: '0%', width: '100%', height: '100%',
      primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
    var innerMask = svgNode('feMorphology', { in: 'SourceAlpha', operator: 'erode',
      radius: parseFloat(getComputedStyle(heading).fontSize) * 0.022, result: 'innerAlpha' });
    filter.appendChild(innerMask);
    filter.appendChild(svgNode('feFlood', { 'flood-color': base, result: 'basePaint' }));
    filter.appendChild(svgNode('feComposite', { in: 'basePaint', in2: 'SourceAlpha',
      operator: 'in', result: 'originalGlyph' }));
    filter.appendChild(svgNode('feComposite', { in: 'SourceGraphic', in2: 'innerAlpha',
      operator: 'in', result: 'innerLight' }));
    var merge = svgNode('feMerge', {});
    merge.appendChild(svgNode('feMergeNode', { in: 'originalGlyph' }));
    merge.appendChild(svgNode('feMergeNode', { in: 'innerLight' }));
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);
    heading.style.filter = 'url("#hx-im-insight-inner-light")';
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
      innerMask.setAttribute('radius', parseFloat(getComputedStyle(heading).fontSize) * 0.022);
      var bounds = heading.getBoundingClientRect();
      var radius = bounds.width * 0.9;
      var spread = bounds.width * 0.38;
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
