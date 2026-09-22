/* ================================================================
   HELIX AMC — 외과(/surgery) 공통 기능 BOOTSTRAP LOADER  v1.2

   외과 페이지의 Webflow 네이티브 본문은 그대로 두고, 다른 공개 페이지와
   동일한 전역 화면·내비게이션 기능만 연결한다.

   측정 모듈은 포함하지 않는다. 측정 변경은 staging이 아니라 main에서
   별도로 검증·반영하는 프로젝트 규칙을 따른다. 다만 화면 기능 모듈이
   자체적으로 gtag를 호출할 수 있으므로 webflow.io에서는 이를 no-op으로
   바꿔 스테이징 테스트 이벤트가 정식 속성에 섞이지 않게 한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixSurgeryBootstrapInit) return;
  window.__helixSurgeryBootstrapInit = true;

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  if (BRANCH === 'staging') {
    window.gtag = function () {};
  }

  var FILES = [
    'global/viewport-fix.js',
    'global/viewport.js',
    'global/accessibility.js',
    'global/global.css',
    'services/surgery-card-stack.css',
    'global/floating-cta.css',
    'global/floating-cta.js',
    'global/popup.css',
    'global/popup.js',
    'global/top-button.css',
    'global/top-button.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'home/global/footer.css',
    'home/global/footer.js'
  ];

  function cdn(ref, path) {
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path;
  }

  function loadFile(path, ref) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    if (ext === 'css') {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onerror = function () { console.warn('[surgery-bootstrap] load failed:', path); };
      document.head.appendChild(link);
      return;
    }
    if (ext === 'js') {
      var script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onerror = function () { console.warn('[surgery-bootstrap] load failed:', path); };
      document.head.appendChild(script);
    }
  }

  function currentRef() {
    var src = '';
    try {
      if (document.currentScript && document.currentScript.src) src = document.currentScript.src;
    } catch (e) {}
    if (!src) {
      var scripts = document.querySelectorAll('script[src*="/services/surgery-bootstrap.js"]');
      if (scripts.length) src = scripts[scripts.length - 1].src;
    }
    var match = src.match(/@([^/]+)\/services\/surgery-bootstrap\.js/);
    return match && match[1] ? match[1] : BRANCH;
  }

  var REF = currentRef();
  window.HELIX_REF = REF;
  console.log('[surgery-bootstrap] ref', REF);
  FILES.forEach(function (path) { loadFile(path, REF); });
})();

/* 외과 인트로: 두 원은 화면 안으로 충분히 들어온 뒤, 좌·우 바깥선이 차례로 그려진다. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_INTRO_RING_DRAW__) return;
  window.__HELIX_SURGERY_INTRO_RING_DRAW__ = true;

  var RING_SELECTOR = '.hx-sg-rings > .hx-sg-ring';
  var HOST_CLASS = 'hx-sg-ring-draw-host';
  var READY_CLASS = 'hx-sg-ring-draw-ready';
  var VISIBLE_CLASS = 'hx-sg-ring-draw-visible';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var FALLBACK_HALF_RING_LENGTH = Math.PI * 50;

  function isVisible(element) {
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 &&
      style.display !== 'none' && style.visibility !== 'hidden';
  }

  /* non-scaling-stroke에서는 dash 길이도 화면상의 픽셀 기준이 된다. */
  function getRenderedHalfRingLength(svg) {
    var rect = svg.getBoundingClientRect();
    var radiusX = rect.width / 2;
    var radiusY = rect.height / 2;

    if (!radiusX || !radiusY) return FALLBACK_HALF_RING_LENGTH;

    /* 타원 반 둘레의 Ramanujan 근사값. 원과 모바일 비율 모두에 대응한다. */
    return Math.PI * (
      3 * (radiusX + radiusY) -
      Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY))
    ) / 2;
  }

  function createOutline(ring, startFromRight) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    var arcPaths = startFromRight
      ? [
        'M 100 50 A 50 50 0 0 0 0 50',
        'M 100 50 A 50 50 0 0 1 0 50'
      ]
      : [
        'M 0 50 A 50 50 0 0 1 100 50',
        'M 0 50 A 50 50 0 0 0 100 50'
      ];

    svg.classList.add('hx-sg-ring-draw');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    ring.appendChild(svg);

    /* 화면 바깥쪽 한 점에서 위·아래 호가 동시에 퍼져 각 원을 완성한다. */
    arcPaths.forEach(function (arcPath) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', arcPath);
      path.classList.add('hx-sg-ring-draw-path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0075d6');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-dasharray', FALLBACK_HALF_RING_LENGTH + ' ' + FALLBACK_HALF_RING_LENGTH);
      path.setAttribute('stroke-dashoffset', -FALLBACK_HALF_RING_LENGTH);
      svg.appendChild(path);
    });
    ring.classList.add(HOST_CLASS);
  }

  function prepareOutline(ring) {
    var svg = ring.querySelector('.hx-sg-ring-draw');
    var halfRingLength = getRenderedHalfRingLength(svg);

    Array.prototype.forEach.call(
      ring.querySelectorAll('.hx-sg-ring-draw-path'),
      function (path) {
        path.setAttribute('stroke-dasharray', halfRingLength + ' ' + halfRingLength);
        path.setAttribute('stroke-dashoffset', -halfRingLength);
        path.style.setProperty('--hx-sg-ring-dash-end', (-2 * halfRingLength) + 'px');
      }
    );
    ring.classList.add(READY_CLASS);
  }

  function initIntroRingDraw() {
    var rings = Array.prototype.slice.call(document.querySelectorAll(RING_SELECTOR))
      .filter(isVisible);
    if (rings.length < 2) return;

    /* 레이아웃의 DOM 순서가 바뀌어도 화면상 왼쪽·오른쪽 기준을 유지한다. */
    rings.sort(function (a, b) {
      return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
    });

    var leftRing = rings[0];
    var rightRing = rings[1];

    createOutline(leftRing, false);
    createOutline(rightRing, true);
    /* 두 원이 만나는 안쪽 끝만 부드럽게 사라지도록 화면 방향을 표시한다. */
    leftRing.classList.add('hx-sg-ring-draw-inner-right');
    rightRing.classList.add('hx-sg-ring-draw-inner-left');
    document.documentElement.classList.add('hx-sg-ring-draw-motion');

    function lockSolidStroke(ring) {
      window.setTimeout(function () {
        Array.prototype.forEach.call(
          ring.querySelectorAll('.hx-sg-ring-draw-path'),
          function (path) {
            path.setAttribute('stroke-dasharray', 'none');
            path.setAttribute('stroke-dashoffset', '0');
          }
        );
      }, 980);
    }

    function startRing(ring) {
      prepareOutline(ring);
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          ring.classList.add(VISIBLE_CLASS);
          lockSolidStroke(ring);
        });
      });
    }

    function reveal() {
      startRing(leftRing);
      window.setTimeout(function () {
        startRing(rightRing);
      }, 160);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      return;
    }

    if (!('IntersectionObserver' in window)) {
      reveal();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      reveal();
    }, {
      root: null,
      rootMargin: '0px 0px -32% 0px',
      threshold: .2
    });

    observer.observe(leftRing.closest('.hx-sg-rings'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntroRingDraw, { once: true });
  } else {
    initIntroRingDraw();
  }
})();

/* 통증 관리: 원은 환자의 안정된 기준점으로 고정하고, 바깥 격자만 정렬되어 안정으로 수렴한다. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_PAIN_MOTION__) return;

  function initPainMotion() {
    if (window.__HELIX_SURGERY_PAIN_MOTION__) return;

    var oval = document.querySelector('.hx-sg-pain-oval');
    if (!oval) return;

    var section = oval.closest('section');
    if (!section) return;

    window.__HELIX_SURGERY_PAIN_MOTION__ = true;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var duration = 9500;
  var ns = 'http://www.w3.org/2000/svg';
  var frame = 0;
  var start = 0;
  var elapsed = 0;
  var finishedAt = 0;
  var started = false;

  section.setAttribute('data-hx-sg-pain-motion', '');

  var art = document.createElementNS(ns, 'svg');
  art.classList.add('hx-sg-pain-art');
  art.setAttribute('viewBox', '0 0 600 600');
  art.setAttribute('aria-hidden', 'true');
  art.setAttribute('focusable', 'false');
  art.innerHTML = [
    '<defs>',
    '<linearGradient id="hx-sg-pain-core" gradientUnits="userSpaceOnUse" x1="-150" y1="300" x2="750" y2="300">',
    '<stop id="hx-sg-pain-core-start" offset="0" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-core-end" offset="1" stop-color="#d60019"/>',
    '</linearGradient>',
    '<linearGradient id="hx-sg-pain-line" gradientUnits="userSpaceOnUse" x1="-600" y1="300" x2="1200" y2="300">',
    '<stop id="hx-sg-pain-line-blue-left" offset="0" stop-color="#0075d6"/>',
    '<stop id="hx-sg-pain-line-red-left" offset="0" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-line-red-right" offset="1" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-line-blue-right" offset="1" stop-color="#0075d6"/>',
    '</linearGradient>',
    '<radialGradient id="hx-sg-pain-clear"><stop offset=".87" stop-color="black"/><stop offset="1" stop-color="white"/></radialGradient>',
    '<radialGradient id="hx-sg-pain-fade"><stop offset=".55" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>',
    '<mask id="hx-sg-pain-mask" x="-600" y="-300" width="1800" height="1200" maskUnits="userSpaceOnUse">',
    '<ellipse cx="300" cy="300" rx="860" ry="520" fill="url(#hx-sg-pain-fade)"/>',
    '<circle cx="300" cy="300" r="380" fill="url(#hx-sg-pain-clear)"/>',
    '</mask>',
    '<radialGradient id="hx-sg-pain-atmosphere"><stop offset=".55" stop-color="white" stop-opacity="0"/><stop id="hx-sg-pain-field-color" offset=".83" stop-color="#d60019" stop-opacity=".10"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient>',
    '</defs>',
    '<ellipse id="hx-sg-pain-field" cx="300" cy="300" rx="375" ry="375" fill="url(#hx-sg-pain-atmosphere)" opacity="0"/>',
    '<g id="hx-sg-pain-sheet" fill="none" stroke="url(#hx-sg-pain-line)" stroke-linecap="round" stroke-linejoin="round" mask="url(#hx-sg-pain-mask)" opacity="0"></g>',
    '<path id="hx-sg-pain-wave" fill="none" stroke="url(#hx-sg-pain-line)" stroke-width="1.65" stroke-linecap="round" mask="url(#hx-sg-pain-mask)" opacity="0"/> '
  ].join('');
  oval.prepend(art);

  var sheet = art.querySelector('#hx-sg-pain-sheet');
  var centerWave = art.querySelector('#hx-sg-pain-wave');
  var field = art.querySelector('#hx-sg-pain-field');
  var fieldColor = art.querySelector('#hx-sg-pain-field-color');
  var coreStart = art.querySelector('#hx-sg-pain-core-start');
  var coreEnd = art.querySelector('#hx-sg-pain-core-end');
  var lineBlueLeft = art.querySelector('#hx-sg-pain-line-blue-left');
  var lineRedLeft = art.querySelector('#hx-sg-pain-line-red-left');
  var lineRedRight = art.querySelector('#hx-sg-pain-line-red-right');
  var lineBlueRight = art.querySelector('#hx-sg-pain-line-blue-right');
  var horizontal = [];
  var vertical = [];

  function makePath(opacity, width) {
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('opacity', opacity);
    path.setAttribute('stroke-width', width);
    sheet.appendChild(path);
    return path;
  }

  for (var h = 0; h < 11; h += 1) horizontal.push(makePath('.19', '.85'));
  for (var v = 0; v < 19; v += 1) vertical.push(makePath('.12', '.75'));

  function clamp(value) {
    return Math.min(1, Math.max(0, value));
  }

  function smooth(value) {
    value = clamp(value);
    return value < .5
      ? 8 * value * value * value * value
      : 1 - Math.pow(-2 * value + 2, 4) / 2;
  }

  function span(time, from, to) {
    return smooth((time - from) / (to - from));
  }

  function torsionNode(u, v, centre, direction, active, clock) {
    var dx = u - centre;
    var envelope = Math.exp(-(dx * dx / (2 * 275 * 275) + v * v / (2 * 350 * 350)));
    var diamond = Math.max(0, 1 - Math.abs(dx) / 430 - Math.abs(v) / 500);
    var irregular = 1
      + .10 * Math.sin(clock * 1.65 + centre * .011)
      + .055 * Math.sin(clock * .82 + dx * .016 - v * .010);
    var angle = direction * active * envelope * (.55 + .20 * diamond) * irregular;
    var stretchX = 1 + active * envelope * (.37 + .10 * Math.sin(clock * 1.18 + centre * .012));
    var squeezeY = 1 - active * envelope * (.23 + .06 * Math.cos(clock * 1.42 - dx * .012));
    var x = dx * stretchX;
    var y = v * squeezeY;
    var targetX = centre + x * Math.cos(angle) - y * Math.sin(angle);
    var targetY = x * Math.sin(angle) + y * Math.cos(angle);
    return [u + (targetX - u) * envelope, v + (targetY - v) * envelope];
  }

  function point(u, v, motion) {
    var active = motion.twist * (1 - motion.collapse);
    var node = torsionNode(u, v, -470, 1, active, motion.clock);
    node = torsionNode(node[0], node[1], 470, -1, active, motion.clock);
    var xNode = node[0];
    var yNode = node[1];
    var band = yNode * (1 - motion.collapse) * (1 - active * .075);
    var amplitude = (29 * (1 - motion.collapse) + 56 * motion.collapse) * motion.rise * (1 - motion.calm);
    var irregularWave = .10 * Math.sin(xNode / 58 + motion.clock * 1.16 + yNode / 175);
    var wave = amplitude * (Math.sin(xNode / 105 - motion.clock * 1.9) + irregularWave);
    var ripple = motion.rise * (1 - motion.collapse) * (14 + 10 * active)
      * Math.sin(yNode / 165 + xNode / 230 - motion.clock * .55)
      + active * 9 * Math.sin(xNode / 74 + yNode / 108 + motion.clock * .92);
    var x = xNode * (1 + active * .05 * Math.cos(xNode / 210 + motion.clock * .84));
    var y = band * .86 + ripple + wave;
    var rotation = -.10 * (1 - motion.collapse);
    return [
      300 + x * Math.cos(rotation) - y * Math.sin(rotation),
      300 + x * Math.sin(rotation) + y * Math.cos(rotation)
    ];
  }

  function gridPath(index, isHorizontal, motion) {
    var d = '';
    for (var i = 0; i <= 64; i += 1) {
      var u = isHorizontal ? -900 + i / 64 * 1800 : (index - 9) * 90;
      var v = isHorizontal ? (index - 5) * 85 : -520 + i / 64 * 1040;
      var p = point(u, v, motion);
      d += (i ? 'L' : 'M') + p[0].toFixed(2) + ',' + p[1].toFixed(2) + ' ';
    }
    return d;
  }

  function render(time, now) {
    elapsed = Math.min(duration, Math.max(0, time));
    var on = span(elapsed, 650, 1550);
    var rise = span(elapsed, 1450, 3000);
    var twist = span(elapsed, 3400, 5500);
    var collapse = span(elapsed, 5250, 6700);
    var calm = span(elapsed, 6500, 7650);
    var meshVisible = rise * (1 - span(elapsed, 6200, 6700));
    var waveVisible = span(elapsed, 6000, 6700);
    var change = span(elapsed, 7350, 8600);
    var clock = elapsed / 1000;
    var motion = { rise: rise, twist: twist, collapse: collapse, calm: calm, clock: clock };
    var coreColor = change < .78 ? '#d60019' : '#0075d6';
    var edge = change >= 1 ? .5 : change * .5;

    coreStart.setAttribute('stop-color', coreColor);
    coreEnd.setAttribute('stop-color', coreColor);
    lineBlueLeft.setAttribute('stop-color', '#0075d6');
    lineRedLeft.setAttribute('stop-color', change >= 1 ? '#0075d6' : '#d60019');
    lineRedRight.setAttribute('stop-color', change >= 1 ? '#0075d6' : '#d60019');
    lineBlueRight.setAttribute('stop-color', '#0075d6');
    lineRedLeft.setAttribute('offset', edge);
    lineRedRight.setAttribute('offset', 1 - edge);
    field.setAttribute('opacity', on * .7);
    fieldColor.setAttribute('stop-color', change < .5 ? '#d60019' : '#0075d6');
    fieldColor.setAttribute('stop-opacity', '.07');
    sheet.setAttribute('opacity', meshVisible);

    if (meshVisible > .001) {
      horizontal.forEach(function (path, index) {
        path.setAttribute('d', gridPath(index, true, motion));
      });
      vertical.forEach(function (path, index) {
        path.setAttribute('d', gridPath(index, false, motion));
      });
    }

    centerWave.setAttribute('d', gridPath(5, true, motion));
    centerWave.setAttribute('opacity', waveVisible * .75);

    var pulseReady = span(elapsed, 8600, 9100);
    var pulsePhase = finishedAt ? ((now - finishedAt) % 2400) / 2400 : 0;
    var pulseStrength = pulseReady * Math.pow(Math.sin(Math.PI * pulsePhase), 1.8);
    var rgb = coreColor === '#0075d6' ? '0,117,214' : '214,0,25';
    var borderOpacity = on * (.76 + .24 * change);
    var glowAlpha = on * (.12 + .08 * (1 - change) + pulseStrength * .09);
    var pulseReach = 18 + pulseStrength * 24;

    oval.style.setProperty('border-color', 'rgba(' + rgb + ',' + borderOpacity.toFixed(3) + ')', 'important');
    oval.style.setProperty('box-shadow', '0 0 ' + pulseReach.toFixed(1) + 'px rgba(' + rgb + ',' + glowAlpha.toFixed(3) + ')', 'important');
    art.dataset.phase = elapsed < 650 ? 'empty' : elapsed < 3400 ? 'wave' : elapsed < 5500 ? 'torsion' : elapsed < 7650 ? 'converge' : 'stable';
  }

  function tick(now) {
    var sequenceTime = now - start;
    if (sequenceTime >= duration) {
      if (!finishedAt) finishedAt = now;
      render(duration, now);
    } else {
      render(sequenceTime, now);
    }
    frame = window.requestAnimationFrame(tick);
  }

  function play() {
    if (started) return;
    started = true;
    if (reduced.matches) {
      render(duration, window.performance.now());
      return;
    }
    start = window.performance.now();
    frame = window.requestAnimationFrame(tick);
  }

  function observe() {
    render(0, window.performance.now());
    if (!('IntersectionObserver' in window)) {
      play();
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      play();
    }, {
      root: null,
      rootMargin: '0px 0px -25% 0px',
      threshold: 0
    });
    observer.observe(oval);
  }

  reduced.addEventListener('change', function () {
    if (!reduced.matches) return;
    window.cancelAnimationFrame(frame);
    render(duration, window.performance.now());
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(observe);
  } else {
    observe();
  }

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPainMotion, { once: true });
  } else {
    initPainMotion();
  }
})();

/* 외과 전문성 문구: Webflow 원문이 일치할 때만 지정한 두 지점에서 줄을 나눈다. */
(function () {
  'use strict';

  function initExpertiseStatement() {
    var heading = document.querySelector(
      '.hx-sg-expertise-copy .hx-sg-readable-statement-white'
    );
    if (!heading) return;

    var lines = [
      '수만 건의 임상 데이터와 경험을 바탕으로',
      '수술 중 발생하는 모든 돌발 상황에',
      '즉각 대응합니다.'
    ];
    var copy = heading.textContent.replace(/\s+/g, ' ').trim();
    if (copy !== lines.join(' ')) return;

    heading.textContent = lines.join('\n');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExpertiseStatement, { once: true });
  } else {
    initExpertiseStatement();
  }
})();

/* 통증 관리 문구: 지정한 세 줄만 유지하고, 좁은 폭에서는 글자 크기만 맞춘다. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_PAIN_THREE_LINES__) return;
  window.__HELIX_SURGERY_PAIN_THREE_LINES__ = true;

  var LINES = [
    '환자가 일상과 치료 과정 속의 고통을',
    '스스로 감내하기보다, 회복에만 전념할 수 있도록',
    '정교한 통증 제어에 집중합니다.'
  ];

  function initPainThreeLines() {
    var statement = document.querySelector(
      '.hx-sg-responsive-frame7 .hx-sg-readable-statement'
    );
    if (!statement) return;

    var copy = (statement.innerText || statement.textContent).replace(/\s+/g, ' ').trim();
    if (copy !== LINES.join(' ')) return;

    var fragment = document.createDocumentFragment();
    LINES.forEach(function (line, index) {
      if (index) fragment.appendChild(document.createElement('br'));
      fragment.appendChild(document.createTextNode(line));
    });
    statement.replaceChildren(fragment);
    statement.dataset.hxThreeLineFit = 'true';
    statement.style.whiteSpace = 'nowrap';
    statement.style.wordBreak = 'normal';
    statement.style.overflowWrap = 'normal';

    var frame = null;

    function fit() {
      frame = null;
      statement.style.removeProperty('font-size');

      var naturalSize = parseFloat(window.getComputedStyle(statement).fontSize);
      var rect = statement.getBoundingClientRect();
      var viewportWidth = window.visualViewport
        ? window.visualViewport.width
        : (window.innerWidth || document.documentElement.clientWidth);
      var visibleWidth = Math.max(
        0,
        Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)
      );
      var availableWidth = Math.min(statement.clientWidth, visibleWidth);
      var requiredWidth = Array.prototype.reduce.call(
        statement.childNodes,
        function (widest, node) {
          if (node.nodeType !== Node.TEXT_NODE) return widest;
          var range = document.createRange();
          range.selectNodeContents(node);
          return Math.max(widest, range.getBoundingClientRect().width);
        },
        0
      );
      if (!naturalSize || !availableWidth || !requiredWidth) return;

      if (requiredWidth <= availableWidth) return;

      var fittedSize = naturalSize * ((availableWidth - 2) / requiredWidth);
      statement.style.fontSize = fittedSize.toFixed(3) + 'px';
    }

    function scheduleFit() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fit);
    }

    scheduleFit();
    window.addEventListener('resize', scheduleFit, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleFit, { passive: true });
    }

    if ('ResizeObserver' in window && statement.parentElement) {
      var observedWidth = 0;
      new ResizeObserver(function (entries) {
        var width = entries[0] ? entries[0].contentRect.width : 0;
        if (!width || Math.abs(width - observedWidth) < 0.5) return;
        observedWidth = width;
        scheduleFit();
      }).observe(statement.parentElement);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleFit);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPainThreeLines, { once: true });
  } else {
    initPainThreeLines();
  }
})();

/* 안전 시스템·예후 관리 카드: 각 섹션의 국문·영문 제목 묶음만 순차 표시한다. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_CARD_TITLES__) return;
  window.__HELIX_SURGERY_CARD_TITLES__ = true;

  var CARD_BEAT = 520;
  var TITLE_DURATION = 720;
  var TITLE_FADE_EASING = 'cubic-bezier(.32, 0, .18, 1)';
  var TITLE_PULL_EASING = 'cubic-bezier(.6, 0, .12, 1)';

  function initSafetyCardTitles(cardSelector, titleSelector) {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll(cardSelector)
    );

    if (!cards.length || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var titles = cards.map(function (card) {
      return card.querySelector(titleSelector);
    }).filter(function (title) {
      return title;
    });

    if (!titles.length) return;

    titles.forEach(function (title) {
      if (cardSelector === '.hx-sg-aftercare-card') {
        title.style.transition = 'none';
      }
      title.style.opacity = '0';
      title.style.transform = 'translateX(-12px) scaleX(.925) scaleY(.985)';
      title.style.transformOrigin = 'left center';
      if (cardSelector === '.hx-sg-aftercare-card') {
        title.getBoundingClientRect();
      }
      title.style.transition =
        'opacity ' + TITLE_DURATION + 'ms ' + TITLE_FADE_EASING + ', ' +
        'transform ' + TITLE_DURATION + 'ms ' + TITLE_PULL_EASING;
      title.style.willChange = 'opacity, transform';
    });

    function revealAll() {
      titles.forEach(function (title) {
        title.style.opacity = '1';
        title.style.transform = 'none';
        title.style.willChange = 'auto';
      });
    }

    var started = false;

    function play() {
      if (started) return;
      started = true;

      titles.forEach(function (title, index) {
        window.setTimeout(function () {
          title.style.opacity = '1';
          title.style.transform = 'translateX(0) scaleX(1) scaleY(1)';
        }, index * CARD_BEAT);
      });

      window.setTimeout(
        revealAll,
        ((titles.length - 1) * CARD_BEAT) + TITLE_DURATION + 120
      );
    }

    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      play();
    }, {
      root: null,
      rootMargin: '0px 0px -48% 0px',
      threshold: 0
    });

    observer.observe(cards[0]);
  }

  function initCardTitleGroups() {
    initSafetyCardTitles('.hx-sg-safety-card', '.div-block-322');
    initSafetyCardTitles('.hx-sg-aftercare-card', '.div-block-332, .div-block-333');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardTitleGroups, { once: true });
  } else {
    initCardTitleGroups();
  }
})();

/* 수술 철학·예후 관리 카드: 각 카드가 화면의 70% 지점에 닿으면 후광과 그림자를 한 번 드러낸다. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_PRINCIPLE_CARD_SHADOWS__) return;
  window.__HELIX_SURGERY_PRINCIPLE_CARD_SHADOWS__ = true;

  var ROOT_CLASS = 'hx-sg-principle-shadow-motion';
  var VISIBLE_CLASS = 'hx-sg-principle-shadow-visible';
  var ANIMATING_CLASS = 'hx-sg-principle-shadow-animating';
  var SHADOW_DURATION = 800;

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add(ROOT_CLASS);

  function initPrincipleCardShadows() {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.hx-sg-principle-card, .hx-sg-aftercare-card')
    );

    if (!cards.length) {
      document.documentElement.classList.remove(ROOT_CLASS);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var card = entry.target;
        observer.unobserve(card);
        card.classList.add(ANIMATING_CLASS);

        window.requestAnimationFrame(function () {
          card.classList.add(VISIBLE_CLASS);
        });

        window.setTimeout(function () {
          card.classList.remove(ANIMATING_CLASS);
        }, SHADOW_DURATION + 80);
      });
    }, {
      root: null,
      rootMargin: '0px 0px -30% 0px',
      threshold: 0
    });

    cards.forEach(function (card) {
      observer.observe(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrincipleCardShadows, { once: true });
  } else {
    initPrincipleCardShadows();
  }
})();
