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

/* 외과 인트로: 두 원의 선은 고정하고, 충분히 진입한 뒤 오른쪽 원 후광만 드러낸다. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_INTRO_RING_DRAW__) return;
  window.__HELIX_SURGERY_INTRO_RING_DRAW__ = true;

  var RING_SELECTOR = '.hx-sg-rings > .hx-sg-ring';
  var HOST_CLASS = 'hx-sg-ring-draw-host';
  var READY_CLASS = 'hx-sg-ring-draw-ready';
  var GLOW_CLASS = 'hx-sg-ring-draw-right-glow';
  var GLOW_VISIBLE_CLASS = 'hx-sg-ring-draw-glow-visible';
  var OVERLAP_SHIELD_CLASS = 'hx-sg-ring-overlap-shield';
  var OVERLAP_SHIELD_PADDING = 34;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isVisible(element) {
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 &&
      style.display !== 'none' && style.visibility !== 'hidden';
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

    /* 겹침 경계는 마스크로 비우고, 선 자체는 처음부터 완성된 상태로 둔다. */
    arcPaths.forEach(function (arcPath) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', arcPath);
      path.classList.add('hx-sg-ring-draw-path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#0075d6');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    });
    ring.classList.add(HOST_CLASS);
    ring.classList.add(READY_CLASS);
  }

  function createOverlapShield(leftRing, rightRing) {
    var shield = document.createElement('span');

    shield.className = OVERLAP_SHIELD_CLASS;
    shield.setAttribute('aria-hidden', 'true');
    rightRing.appendChild(shield);

    function positionShield() {
      var leftBounds = leftRing.getBoundingClientRect();
      var rightBounds = rightRing.getBoundingClientRect();

      shield.style.left = (leftBounds.left - rightBounds.left - OVERLAP_SHIELD_PADDING) + 'px';
      shield.style.top = (leftBounds.top - rightBounds.top - OVERLAP_SHIELD_PADDING) + 'px';
      shield.style.width = (leftBounds.width + (OVERLAP_SHIELD_PADDING * 2)) + 'px';
      shield.style.height = (leftBounds.height + (OVERLAP_SHIELD_PADDING * 2)) + 'px';
    }

    positionShield();

    if ('ResizeObserver' in window) {
      var resizeObserver = new ResizeObserver(positionShield);
      resizeObserver.observe(leftRing);
      resizeObserver.observe(rightRing);
    } else {
      window.addEventListener('resize', positionShield, { passive: true });
    }
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

    /* dash 전개 방향과 맞춰, 화면 바깥쪽 점에서 위·아래 호가 드러나게 한다. */
    createOutline(leftRing, true);
    createOutline(rightRing, false);
    /* 두 원이 만나는 안쪽 끝만 부드럽게 사라지도록 화면 방향을 표시한다. */
    leftRing.classList.add('hx-sg-ring-draw-inner-right');
    rightRing.classList.add('hx-sg-ring-draw-inner-left');
    rightRing.classList.add(GLOW_CLASS);
    createOverlapShield(leftRing, rightRing);

    function revealGlow() {
      rightRing.classList.add(GLOW_VISIBLE_CLASS);
    }

    if (reduceMotion) {
      revealGlow();
      return;
    }

    if (!('IntersectionObserver' in window)) {
      revealGlow();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      revealGlow();
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
  var duration = 6400;
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
    '<stop id="hx-sg-pain-line-blue-left" offset="0" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-line-front-red-left" offset=".5" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-line-red-left" offset="0" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-line-red-right" offset="1" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-line-front-red-right" offset=".5" stop-color="#d60019"/>',
    '<stop id="hx-sg-pain-line-blue-right" offset="1" stop-color="#d60019"/>',
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

  var rippleLayer = document.createElement('span');
  rippleLayer.className = 'hx-sg-pain-ripples';
  rippleLayer.setAttribute('aria-hidden', 'true');
  rippleLayer.innerHTML = '<span class="hx-sg-pain-ripple"></span><span class="hx-sg-pain-ripple"></span>';
  art.after(rippleLayer);
  var ripples = Array.prototype.slice.call(rippleLayer.children);

  var sheet = art.querySelector('#hx-sg-pain-sheet');
  var centerWave = art.querySelector('#hx-sg-pain-wave');
  var field = art.querySelector('#hx-sg-pain-field');
  var fieldColor = art.querySelector('#hx-sg-pain-field-color');
  var coreStart = art.querySelector('#hx-sg-pain-core-start');
  var coreEnd = art.querySelector('#hx-sg-pain-core-end');
  var lineBlueLeft = art.querySelector('#hx-sg-pain-line-blue-left');
  var lineFrontRedLeft = art.querySelector('#hx-sg-pain-line-front-red-left');
  var lineRedLeft = art.querySelector('#hx-sg-pain-line-red-left');
  var lineRedRight = art.querySelector('#hx-sg-pain-line-red-right');
  var lineFrontRedRight = art.querySelector('#hx-sg-pain-line-front-red-right');
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

  function accelerate(value) {
    return Math.pow(clamp(value), 4.2);
  }

  function backOut(value) {
    value = clamp(value);
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
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

  function meshClockAt(clock) {
    return clock < 1.85 ? clock * 3.4 : 1.85 * 3.4 + (clock - 1.85) * 2.2;
  }

  function meshSurface(u, clock) {
    return 1.35 * Math.sin(u / 150 - meshClockAt(clock));
  }

  function rawMeshPoint(u, v, motion) {
    var active = motion.twist;
    var node = torsionNode(u, v, -470, 1, active, motion.clock);
    node = torsionNode(node[0], node[1], 470, -1, active, motion.clock);
    var xNode = node[0];
    var yNode = node[1];
    var band = yNode * (1 - active * .075);
    var swell = 1 + .88 * Math.sin(Math.PI * clamp((motion.clock - .08) / 1.25));
    var amplitude = 52 * motion.rise * swell;
    var irregularWave = .10 * Math.sin(xNode / 58 + motion.clock * 1.16 + yNode / 175);
    var wave = amplitude * (meshSurface(xNode, motion.clock) + irregularWave);
    var ripple = motion.rise * (22 + 10 * active)
      * Math.sin(yNode / 165 + xNode / 230 - motion.clock * 1.25)
      + active * 9 * Math.sin(xNode / 74 + yNode / 108 + motion.clock * .92);
    var x = xNode * (1 + active * .05 * Math.cos(xNode / 210 + motion.clock * .84));
    var y = band * .86 + ripple + wave;
    var rotation = -.10;
    return [
      300 + x * Math.cos(rotation) - y * Math.sin(rotation),
      300 + x * Math.sin(rotation) + y * Math.cos(rotation)
    ];
  }

  function point(u, v, motion) {
    var raw = rawMeshPoint(u, v, motion);
    if (!motion.collapse || v === 0) return raw;
    var spine = rawMeshPoint(u, 0, motion);
    return [
      raw[0] + (spine[0] - raw[0]) * motion.collapse,
      raw[1] + (spine[1] - raw[1]) * motion.collapse
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

  function impulsePath(progress, strength, motion) {
    var d = '';
    var front = 380 + 700 * progress;
    var width = 20 + 26 * progress;
    var amplitude = (108 - 72 * progress) * strength;
    var feather = 14 + 14 * progress;
    for (var i = 0; i <= 128; i += 1) {
      var u = -900 + i / 128 * 1800;
      var distance = Math.abs(u) - front;
      var trough = Math.exp(-(distance * distance) / (2 * width * width));
      var edge = clamp((distance + feather) / (2 * feather));
      var ahead = progress >= 1 ? 0 : edge * edge * (3 - 2 * edge);
      var spine = rawMeshPoint(u, 0, motion);
      var x = 300 + u + (spine[0] - (300 + u)) * ahead;
      var y = 300 + (spine[1] - 300) * ahead + amplitude * trough;
      d += (i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
    }
    return d;
  }

  function anticipationPath(strength, motion, lockedMotion, lockStrength) {
    var d = '';
    for (var i = 0; i <= 128; i += 1) {
      var u = -900 + i / 128 * 1800;
      var distance = Math.abs(u) - 360;
      var nearCore = Math.exp(-(distance * distance) / (2 * 105 * 105));
      var movingSpine = rawMeshPoint(u, 0, motion);
      var lockedSpine = rawMeshPoint(u, 0, lockedMotion);
      var localLock = nearCore * lockStrength;
      var x = movingSpine[0] + (lockedSpine[0] - movingSpine[0]) * localLock;
      var baseY = movingSpine[1] + (lockedSpine[1] - movingSpine[1]) * localLock;
      var y = baseY - 30 * strength * nearCore;
      d += (i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
    }
    return d;
  }

  function render(time, now) {
    elapsed = Math.min(duration, Math.max(0, time));
    var on = span(elapsed, 0, 100);
    var rise = span(elapsed, 80, 900);
    var twist = .60 * span(elapsed, 180, 700);
    var collapse = accelerate((elapsed - 600) / 1250);
    var calm = accelerate((elapsed - 1450) / 500);
    var handoff = span(elapsed, 1650, 1950);
    var meshLineFade = Math.pow(1 - handoff, 2);
    var waveVisible = handoff;
    var impactStarted = elapsed >= 4250;
    var change = clamp((elapsed - 4250) / 1000);
    var impulseStrength = span(elapsed, 4250, 4300) * (1 - span(elapsed, 5200, 5250));
    var anticipation = impactStarted ? 0 : span(elapsed, 3400, 3800);
    var clock = elapsed / 1000;
    var motion = { rise: rise, twist: twist, collapse: collapse, calm: calm, clock: clock };
    var lockedMotion = { rise: rise, twist: twist, collapse: collapse, calm: calm, clock: Math.min(clock, 3.8) };
    var anticipationLock = span(elapsed, 3800, 3880);
    var idlePulseClock = -1;
    if (finishedAt && elapsed >= duration) {
      var idleAge = now - finishedAt;
      idlePulseClock = idleAge >= 12000 ? (idleAge - 12000) % 14000 : -1;
    }
    var idlePulseActive = idlePulseClock >= 0 && idlePulseClock < 1050;
    var idleImpulseStrength = idlePulseActive ? span(idlePulseClock, 0, 60) * (1 - span(idlePulseClock, 850, 1050)) : 0;
    var activeImpulseStrength = idlePulseActive ? idleImpulseStrength : impulseStrength;
    var coreColor = impactStarted ? '#0075d6' : '#d60019';
    var lineDone = change >= 1;
    var blueEdge = Math.min(.5, (380 + 700 * change) / 1800);
    var leftFront = .5 - blueEdge;
    var rightFront = .5 + blueEdge;

    coreStart.setAttribute('stop-color', coreColor);
    coreEnd.setAttribute('stop-color', coreColor);
    lineBlueLeft.setAttribute('stop-color', lineDone ? '#0075d6' : '#d60019');
    lineFrontRedLeft.setAttribute('stop-color', lineDone ? '#0075d6' : '#d60019');
    lineRedLeft.setAttribute('stop-color', impactStarted ? '#0075d6' : '#d60019');
    lineRedRight.setAttribute('stop-color', impactStarted ? '#0075d6' : '#d60019');
    lineFrontRedRight.setAttribute('stop-color', lineDone ? '#0075d6' : '#d60019');
    lineBlueRight.setAttribute('stop-color', lineDone ? '#0075d6' : '#d60019');
    lineBlueLeft.setAttribute('offset', 0);
    lineFrontRedLeft.setAttribute('offset', leftFront);
    lineRedLeft.setAttribute('offset', leftFront);
    lineRedRight.setAttribute('offset', rightFront);
    lineFrontRedRight.setAttribute('offset', rightFront);
    lineBlueRight.setAttribute('offset', 1);
    field.setAttribute('opacity', on * .7);
    fieldColor.setAttribute('stop-color', coreColor);
    fieldColor.setAttribute('stop-opacity', '.07');
    sheet.setAttribute('opacity', on);

    horizontal.forEach(function (path) { path.setAttribute('opacity', (.19 * meshLineFade).toFixed(4)); });
    vertical.forEach(function (path) { path.setAttribute('opacity', (.12 * meshLineFade).toFixed(4)); });
    if (elapsed <= 1950) {
      horizontal.forEach(function (path, index) { path.setAttribute('d', gridPath(index, true, motion)); });
      vertical.forEach(function (path, index) { path.setAttribute('d', gridPath(index, false, motion)); });
    }

    centerWave.setAttribute('d', impactStarted
      ? impulsePath(change, impulseStrength, motion)
      : anticipation > 0
        ? anticipationPath(anticipation, motion, lockedMotion, anticipationLock)
        : gridPath(5, true, motion));
    centerWave.setAttribute('opacity', waveVisible * .75);

    var rippleClock = elapsed;
    var rippleSpecs = [[4250, 760, .15, .27], [4350, 900, .23, .18]];
    if (finishedAt && elapsed >= duration) {
      rippleClock = idlePulseClock;
      rippleSpecs = [[0, 760, .12, .15], [110, 900, .19, .09]];
    }
    rippleSpecs.forEach(function (spec, index) {
      var progress = clamp((rippleClock - spec[0]) / spec[1]);
      var active = rippleClock >= spec[0] && rippleClock < spec[0] + spec[1];
      var appear = clamp(progress / .08);
      ripples[index].style.transform = 'scale(' + (1 + spec[2] * backOut(progress)).toFixed(4) + ')';
      ripples[index].style.opacity = active
        ? (spec[3] * appear * Math.pow(1 - progress, 1.35)).toFixed(4)
        : '0';
    });

    var rgb = coreColor === '#0075d6' ? '0,117,214' : '214,0,25';
    var borderOpacity = on * (.76 + .24 * change);
    var glowAlpha = on * (.12 + .08 * (1 - change) + activeImpulseStrength * .18);
    var pulseReach = 18 + activeImpulseStrength * 24;

    oval.style.setProperty('border-color', 'transparent', 'important');
    oval.style.setProperty('box-shadow', 'none', 'important');
    oval.style.setProperty('--hx-core-color', 'rgba(' + rgb + ',' + borderOpacity.toFixed(3) + ')');
    oval.style.setProperty('--hx-core-shadow', '0 0 ' + pulseReach.toFixed(1) + 'px rgba(' + rgb + ',' + glowAlpha.toFixed(3) + ')');
    art.dataset.phase = elapsed < 1950 ? 'mesh' : elapsed < 4250 ? 'line' : 'stable';
    art.dataset.time = Math.round(elapsed);
    art.dataset.idlePulse = idleImpulseStrength.toFixed(4);
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

/* 핵심 장비 카드: 실제 이미지가 준비될 때까지 각 카드 위에 "이미지 수정중" 임시 도장을 얹는다.
   이미지 확정되면 이 블록과 surgery-card-stack.css 의 .hx-sg-equip-wip-label 을 함께 지울 것. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_EQUIP_WIP__) return;
  window.__HELIX_SURGERY_EQUIP_WIP__ = true;

  var LABEL_TEXT = '이미지 수정중';
  var HEADING_PATTERN = /장비/;

  /* 장비 카드는 데스크톱·모바일용 섹션이 나뉘어 있어(예: hx-sg-equipment-mobile-visible),
     제목이 속한 섹션 하나만으로는 일부 카드를 놓친다. 클래스 이름에 "equipment" 가 들어간
     요소는 모두 같은 그룹으로 보고 합친다. */
  function findEquipmentSections() {
    var sections = [];

    function add(node) {
      if (!node || sections.indexOf(node) !== -1) return;
      sections.push(node);
    }

    var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (var i = 0; i < headings.length; i++) {
      if (HEADING_PATTERN.test(headings[i].textContent || '')) {
        add(headings[i].closest('section') || headings[i].closest('div'));
        break;
      }
    }

    var byClass = document.querySelectorAll('[class*="equipment"]');
    for (var j = 0; j < byClass.length; j++) {
      add(byClass[j]);
    }

    return sections;
  }

  function isIconImage(img) {
    return !!img.closest('svg') || /icon/i.test(img.className || '');
  }

  function stampLabel(img) {
    if (img.dataset.helixWipStamped) return;
    img.dataset.helixWipStamped = '1';

    var wrapper = img.parentElement;
    if (!wrapper) return;

    if (window.getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }

    var label = document.createElement('div');
    label.className = 'hx-sg-equip-wip-label';
    label.setAttribute('aria-hidden', 'true');
    label.textContent = LABEL_TEXT;
    wrapper.appendChild(label);
  }

  function init() {
    var sections = findEquipmentSections();
    if (!sections.length) return;

    var images = [];
    sections.forEach(function (section) {
      Array.prototype.slice.call(section.querySelectorAll('img')).forEach(function (img) {
        if (images.indexOf(img) === -1) images.push(img);
      });
    });

    images.filter(function (img) { return !isIconImage(img); }).forEach(stampLabel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
