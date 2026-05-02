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
    /* SHA-pinned URL 이 immutable 이지만 브라우저 캐시가 옛 응답 들고있을 수 있어
       ref 자체를 쿼리로 박아 캐시 키 강제 분리. */
    var src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' + ref + '/' + BG_VIDEO_PATH + '?v=' + ref;

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
    els.forEach(function (el) { el.style.opacity = '1'; el.style.visibility = 'visible'; });
    if (video) { video.style.opacity = '1'; video.style.visibility = 'visible'; }
  }

  function runTextTimeline() {
    if (typeof gsap === 'undefined') {
      log('GSAP missing → fallback show text');
      var els = document.querySelectorAll('.about-heading, .about_contents_sub-title, img.image-23');
      els.forEach(function (el) { el.style.opacity = '1'; el.style.visibility = 'visible'; });
      return Promise.resolve();
    }
    var heading = document.querySelectorAll('.about-heading');
    var subhead = document.querySelectorAll('.about_contents_sub-title');
    var symbol  = document.querySelectorAll('img.image-23');

    [heading, subhead, symbol].forEach(function (list) {
      list.forEach(function (el) { el.style.visibility = 'visible'; });
    });
    var allText = [].concat(
      Array.prototype.slice.call(heading),
      Array.prototype.slice.call(subhead),
      Array.prototype.slice.call(symbol)
    );
    if (allText.length) gsap.set(allText, { opacity: 0 });

    return new Promise(function (resolve) {
      var tl = gsap.timeline({ delay: 0.2, onComplete: resolve });
      if (heading.length) {
        tl.fromTo(heading, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.out' });
      }
      var symAndSub = [].concat(Array.prototype.slice.call(symbol), Array.prototype.slice.call(subhead));
      if (symAndSub.length) {
        tl.fromTo(symAndSub, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.out' });
      }
      if (!tl.duration()) resolve();
      log('text timeline started');
    });
  }

  function fadeInVideo(video) {
    if (!video) return;
    video.style.visibility = 'visible';
    if (typeof gsap === 'undefined') {
      video.style.opacity = '1';
      return;
    }
    gsap.fromTo(video, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });
    log('video fade started');
  }

  function renderHexDiagram() {
    var holder = document.querySelector('.diagram-place-holder');
    if (!holder) { log('diagram-place-holder not found'); return; }
    if (holder.querySelector('.helix-hex-diagram')) return;

    /* pointy-top 육각형. 인접 헥사가 공유하는 엣지는 한쪽에서만 그려서
       선이 두꺼워 보이는 현상 제거. */
    var s = 100;                 /* 변 길이 */
    var sqrt3 = Math.sqrt(3);
    var w = sqrt3 * s;           /* 헥사 가로 폭 */

    /* 정점 인덱스: 0 top, 1 top-right, 2 bottom-right, 3 bottom, 4 bottom-left, 5 top-left
       엣지 E_i 는 정점 i → (i+1)%6
       각 hex 의 edges 배열 = 그릴 엣지 인덱스. 공유 엣지는 한쪽에서만 소유. */
    var hexes = [
      { id: 'naekwa',    label: '내과',       cx: w * 0.5, cy: -1.5 * s, edges: [0,1,2,3,4,5], inner: true },
      { id: 'oikwa',     label: '외과',       cx: w * 1.5, cy: -1.5 * s, edges: [0,1,2,3,5],   inner: true },
      { id: 'ankwa',     label: '안과',       cx: 0,       cy: 0,        edges: [1,2,3,4,5]   },
      { id: 'yeongsang', label: '영상의학과', cx: w,       cy: 0,        edges: [1,2,3],       inner: true },
      { id: 'chikwa',    label: '치과',       cx: w * 2,   cy: 0,        edges: [0,1,2,3]     }
    ];

    /* 모션 시퀀서가 hex 메타 (cx/cy/inner 등) 를 다시 측정하지 않고 쓸 수
       있도록 노출. */
    window.__helixHexes = hexes;

    var INNER_SCALE = 0.93;

    var minX = -w/2,        maxX = w * 2 + w/2;
    var minY = -1.5*s - s,  maxY = s;
    var pad = 8;

    function vertices(cx, cy, scale) {
      var k = scale || 1;
      var ss = s * k, ww = w * k;
      return [
        [cx,           cy - ss],
        [cx + ww/2,    cy - ss/2],
        [cx + ww/2,    cy + ss/2],
        [cx,           cy + ss],
        [cx - ww/2,    cy + ss/2],
        [cx - ww/2,    cy - ss/2]
      ];
    }

    function fullHexPath(verts) {
      return 'M' + verts[0][0].toFixed(3) + ' ' + verts[0][1].toFixed(3) +
        ' L' + verts[1][0].toFixed(3) + ' ' + verts[1][1].toFixed(3) +
        ' L' + verts[2][0].toFixed(3) + ' ' + verts[2][1].toFixed(3) +
        ' L' + verts[3][0].toFixed(3) + ' ' + verts[3][1].toFixed(3) +
        ' L' + verts[4][0].toFixed(3) + ' ' + verts[4][1].toFixed(3) +
        ' L' + verts[5][0].toFixed(3) + ' ' + verts[5][1].toFixed(3) + ' Z';
    }

    function buildPath(verts, edges) {
      var sorted = edges.slice().sort(function (a, b) { return a - b; });
      var parts = [];
      var i = 0;
      while (i < sorted.length) {
        var startVi = sorted[i];
        var p = verts[startVi];
        parts.push('M' + p[0].toFixed(3) + ' ' + p[1].toFixed(3));
        var endVi = (startVi + 1) % 6;
        p = verts[endVi];
        parts.push('L' + p[0].toFixed(3) + ' ' + p[1].toFixed(3));
        i++;
        while (i < sorted.length && sorted[i] === endVi) {
          endVi = (sorted[i] + 1) % 6;
          p = verts[endVi];
          parts.push('L' + p[0].toFixed(3) + ' ' + p[1].toFixed(3));
          i++;
        }
      }
      return parts.join(' ');
    }

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'helix-hex-diagram');
    svg.setAttribute('viewBox',
      (minX - pad) + ' ' + (minY - pad) + ' ' +
      (maxX - minX + pad * 2) + ' ' + (maxY - minY + pad * 2));
    svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    svg.style.overflow = 'hidden';

    var defs = document.createElementNS(svgNS, 'defs');
    svg.appendChild(defs);

    hexes.forEach(function (hx) {
      var verts = vertices(hx.cx, hx.cy);
      var g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'hex hex-' + hx.id);
      g.setAttribute('data-cx', hx.cx);
      g.setAttribute('data-cy', hx.cy);

      var p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', buildPath(verts, hx.edges));
      g.appendChild(p);

      if (hx.inner) {
        var innerD = fullHexPath(vertices(hx.cx, hx.cy, INNER_SCALE));

        var inner = document.createElementNS(svgNS, 'path');
        inner.setAttribute('class', 'hex-inner');
        inner.setAttribute('d', innerD);
        g.appendChild(inner);

        /* Phase B 펄스용 emit 클론.
           inner 와 동일 path 를 그대로 한 장 더 깔아두고, 시그니처 모션
           시점에 "원본은 그대로 → 이 클론이 안쪽으로 작아지며 흐려져
           사라짐" = "이너가 또다른 외곽선을 한 번 쏘고 사라지는" 효과. */
        var emit = document.createElementNS(svgNS, 'path');
        emit.setAttribute('class', 'hex-emit');
        emit.setAttribute('d', innerD);
        g.appendChild(emit);
      } else {
        /* Phase B 광선 sweep — beam 이 외곽선 위에서만 보이도록 stroke
           마스크를 사용한다. mask 안의 stroked hex path 가 white = 보이는
           영역, 나머지(검정)는 투명 → beam 라인이 외곽선과 교차하는
           구간에서만 빛이 흐르듯 드러남. clipPath(영역 클립) 와 달리
           hex 내부 빈 공간에는 beam 이 비치지 않는다. */
        var maskId = 'helixhex-stroke-mask-' + hx.id;
        var mask = document.createElementNS(svgNS, 'mask');
        mask.setAttribute('id', maskId);
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
        /* mask 영역은 hex 주위로 충분히 크게 — beam 이 sweep 중 어떤
           위치여도 mask region 밖으로 새지 않게. */
        mask.setAttribute('x', hx.cx - s * 2);
        mask.setAttribute('y', hx.cy - s * 2);
        mask.setAttribute('width',  s * 4);
        mask.setAttribute('height', s * 4);

        var maskShape = document.createElementNS(svgNS, 'path');
        maskShape.setAttribute('d', fullHexPath(verts));
        maskShape.setAttribute('fill', 'none');
        maskShape.setAttribute('stroke', '#ffffff');
        /* mask stroke 두께가 외곽선 highlight 밴드 폭을 결정. 시각적
           외곽선보다 살짝 두껍게 잡아 빛이 stroke 주변으로 약간 번지듯. */
        maskShape.setAttribute('stroke-width', '4');
        maskShape.setAttribute('stroke-linejoin', 'miter');
        mask.appendChild(maskShape);
        defs.appendChild(mask);

        var gradId = 'helixhex-beam-grad-' + hx.id;
        var grad = document.createElementNS(svgNS, 'linearGradient');
        grad.setAttribute('id', gradId);
        grad.setAttribute('gradientUnits', 'objectBoundingBox');
        grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
        grad.setAttribute('x2', '1'); grad.setAttribute('y2', '1');
        [
          { o: 0.00, c: '#0075d6', a: 0 },
          { o: 0.40, c: '#7fc4ff', a: 0.55 },
          { o: 0.50, c: '#ffffff', a: 1 },
          { o: 0.60, c: '#7fc4ff', a: 0.55 },
          { o: 1.00, c: '#0075d6', a: 0 }
        ].forEach(function (st) {
          var stop = document.createElementNS(svgNS, 'stop');
          stop.setAttribute('offset', st.o);
          stop.setAttribute('stop-color', st.c);
          stop.setAttribute('stop-opacity', st.a);
          grad.appendChild(stop);
        });
        defs.appendChild(grad);

        /* 외부 그룹: mask 고정 (transform 없음).
           내부 mover 그룹: beam 라인을 perpendicular 방향으로 평행 이동 →
           mask 의 stroke 밴드와 교차하는 구간에서만 빛이 보임. */
        var beamWrap = document.createElementNS(svgNS, 'g');
        beamWrap.setAttribute('class', 'hex-beam-wrap');
        beamWrap.setAttribute('mask', 'url(#' + maskId + ')');

        var mover = document.createElementNS(svgNS, 'g');
        mover.setAttribute('class', 'hex-beam-mover');

        var beam = document.createElementNS(svgNS, 'line');
        beam.setAttribute('class', 'hex-beam');
        /* 길이 3s, (1,1) 방향 라인. perpendicular 평행 이동으로 hex 한쪽에서
           반대쪽까지 sweep. */
        var halfDiag = s * 1.5;
        var dl = halfDiag / Math.sqrt(2);
        beam.setAttribute('x1', hx.cx - dl);
        beam.setAttribute('y1', hx.cy - dl);
        beam.setAttribute('x2', hx.cx + dl);
        beam.setAttribute('y2', hx.cy + dl);
        beam.setAttribute('stroke', 'url(#' + gradId + ')');
        mover.appendChild(beam);
        beamWrap.appendChild(mover);
        g.appendChild(beamWrap);
      }

      var t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', hx.cx);
      t.setAttribute('y', hx.cy);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('font-size', 24);   /* SVG user units → 다이어그램과 함께 스케일됨 */
      t.textContent = hx.label;
      g.appendChild(t);

      svg.appendChild(g);
    });

    holder.appendChild(svg);
    log('hex diagram rendered');
  }

  /* ================================================================
     Hex Diagram — Section 1 모션 시퀀스
     ================================================================
     Phase A : 내 → 외 → 영 → 안 → 치 순서로 페이드인 + 스케일 인
     Phase B : 모두 등장 후 시그니처 모션
       - 내·외·영 (inner 보유): inner 외곽선이 또다른 외곽선 한 장을 쏘고,
         그 클론이 안으로 작아지며 흐려져 사라짐
       - 안·치 (inner 없음): 사선 광선이 hex 를 한 번 훑고 지나감 (clipPath
         로 hex 영역 안에서만 보임)
     트리거: .diagram-place-holder 가 뷰포트 진입 시 한 번만 재생.
     ================================================================ */
  function initHexAnimations() {
    if (typeof gsap === 'undefined') { log('GSAP missing → skip hex anim'); return; }
    var holder = document.querySelector('.diagram-place-holder');
    var svg = holder && holder.querySelector('.helix-hex-diagram');
    if (!svg) { log('hex svg not found → skip anim'); return; }

    var hexes = window.__helixHexes || [];
    if (!hexes.length) { log('no hex meta'); return; }

    /* 초기 상태 — CSS 가 .hex { opacity: 0 } 로 가려 두지만 transform 까지
       명시적으로 세팅해서 첫 페인트와 첫 트윈 사이 점프 방지. */
    hexes.forEach(function (hx) {
      var g = svg.querySelector('.hex-' + hx.id);
      if (!g) return;
      gsap.set(g, {
        opacity: 0,
        scale: 0.55,
        svgOrigin: hx.cx + ' ' + hx.cy
      });
      if (hx.inner) {
        var emit = g.querySelector('.hex-emit');
        if (emit) gsap.set(emit, { opacity: 0, scale: 1, svgOrigin: hx.cx + ' ' + hx.cy });
      } else {
        var mover = g.querySelector('.hex-beam-mover');
        if (mover) gsap.set(mover, { opacity: 0, x: 0, y: 0 });
      }
    });

    var played = false;
    function play() {
      if (played) return window.__hexS1Tl;
      played = true;

      var tl = gsap.timeline();

      /* Phase A — 사용자 지정 등장 순서: 내 → 외 → 영 → 안 → 치 */
      var order = ['naekwa', 'oikwa', 'yeongsang', 'ankwa', 'chikwa'];
      var STAGGER = 0.22;
      var ENTER_DUR = 0.6;
      order.forEach(function (id, i) {
        var g = svg.querySelector('.hex-' + id);
        if (!g) return;
        tl.to(g, {
          opacity: 1,
          scale: 1,
          duration: ENTER_DUR,
          ease: 'back.out(1.1)'
        }, i * STAGGER);
      });

      /* Phase B — 모두 등장 + 짧은 호흡 후 시그니처 모션 */
      var phaseB = tl.duration() + 0.35;

      hexes.forEach(function (hx, i) {
        if (!hx.inner) return;
        var emit = svg.querySelector('.hex-' + hx.id + ' .hex-emit');
        if (!emit) return;
        /* 안으로 작아지며 흐려지는 단발 펄스. 헥사별 미세 stagger 로
           세 hex 가 동시에 터지지 않고 살짝 어긋나 보이게. */
        tl.fromTo(emit,
          { opacity: 0.95, scale: 1 },
          {
            opacity: 0,
            scale: 0.5,
            duration: 0.75,
            ease: 'power2.out',
            svgOrigin: hx.cx + ' ' + hx.cy
          },
          phaseB + i * 0.08
        );
      });

      hexes.forEach(function (hx, i) {
        if (hx.inner) return;
        var mover = svg.querySelector('.hex-' + hx.id + ' .hex-beam-mover');
        if (!mover) return;
        /* 라인은 (1,1) 방향. perpendicular = (1,-1) / √2.
           beam 을 (1,-1) 방향으로 멀리 → (-1,1) 방향으로 멀리 끌어당기면
           hex 한쪽 바깥에서 반대쪽 바깥까지 사선으로 훑는다. */
        var SWEEP = 200;
        var d = SWEEP / Math.sqrt(2);
        var beamStart = phaseB + 0.18 + i * 0.14;
        tl.set(mover,   { x:  d, y: -d, opacity: 0 }, beamStart);
        tl.to(mover,    { opacity: 1, duration: 0.12, ease: 'power1.out' }, beamStart);
        tl.to(mover,    { x: -d, y:  d, duration: 0.55, ease: 'sine.inOut' }, beamStart);
        tl.to(mover,    { opacity: 0, duration: 0.16, ease: 'power1.in' }, beamStart + 0.55);
      });

      window.__hexS1Tl = tl;
      log('hex timeline duration:', tl.duration().toFixed(2) + 's');
      return tl;
    }

    /* Section 2 onEnter 가 빠른 스크롤 케이스를 보호할 수 있도록 노출. */
    window.__hexS1Play = play;

    /* Section 1 트리거 = 좌측 첫 번째 콘텐츠 박스 (.about_three_contents-box[0]).
       이 박스가 viewport 75% 라인에 닿으면 헥사 등장 시퀀스 재생.
       이 시점엔 .about_contents-title 가 이미 페이드인 완료된 상태 (title 은
       박스보다 먼저 80% 라인에서 fade 시작 + 1s transition). */
    var boxes = document.querySelectorAll('.about_three_contents-box');
    var box1 = boxes[0] || holder;

    if (!('IntersectionObserver' in window)) { play(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        play();
      });
    }, { root: null, rootMargin: '0px 0px -25% 0px', threshold: 0 });
    io.observe(box1);
    log('s1 trigger bound to: ' + (box1.className || box1.tagName));
  }

  /* ================================================================
     Hex Diagram — Section 2 (스크롤 스크럽)
     ================================================================
     Phase 1 : 5 헥사 일렬 평면 펼침 (+ 다운스케일 → viewBox 안에 맞춤)
     Phase 2 : 제자리에서 세로축 비스듬한 우향우 (rotateY)
     Phase 3 : 그 자세 그대로 거리 매우 좁게 모임 (압축)
     Phase 4 : 정면으로 돌면서 가까이 (rotateY 0 + scale up + Z translate)
     트리거 : .diagram-place-holder top 이 viewport top 도달 시 핀,
              1 뷰포트 분량 스크롤로 timeline 진행 (scrub 1).
     ================================================================ */
  function initHexSection2() {
    if (typeof gsap === 'undefined') { log('GSAP missing → skip s2'); return; }

    var tries = 0;
    function tryInit() {
      if (typeof window.ScrollTrigger !== 'undefined') {
        doInit();
        return;
      }
      if (++tries > 60) { log('ScrollTrigger never loaded → s2 disabled'); return; }
      setTimeout(tryInit, 100);
    }

    function doInit() {
      var holder = document.querySelector('.diagram-place-holder');
      var svg = holder && holder.querySelector('.helix-hex-diagram');
      if (!svg) { log('s2: hex svg not found'); return; }

      var hexes = window.__helixHexes || [];
      if (!hexes.length) { log('s2: no hex meta'); return; }

      /* viewBox 좌표계 기준 (about.js renderHexDiagram 와 동일):
         - x 가운데 ≈ 173 (= w), y 가운데 ≈ -75 */
      var ROW_ORDER     = ['naekwa', 'oikwa', 'yeongsang', 'ankwa', 'chikwa'];
      var ROW_CENTER_X  = 173;
      var ROW_Y         = -75;
      var ROW_STEP      = 110;   /* 펼침 간격 (스케일 후 헥사 사이가 살짝 떨어짐) */
      var COMP_STEP     = 28;    /* 압축 간격 (서로 거의 겹침) */
      var ROW_SCALE     = 0.6;   /* 5 hex 가 viewBox 안에 들어가게 다운스케일 */
      var TILT_Y        = 32;    /* 비스듬한 우향우 각도 (deg) */
      var END_SCALE     = 1.5;   /* 정면 복귀 시 줌인 스케일 */
      var END_Z         = 90;    /* 살짝 viewer 쪽으로 다가옴 (perspective 와 함께) */

      var section2Tl = gsap.timeline({ paused: true });

      ROW_ORDER.forEach(function (id, i) {
        var hx = null;
        for (var k = 0; k < hexes.length; k++) {
          if (hexes[k].id === id) { hx = hexes[k]; break; }
        }
        var g = svg.querySelector('.hex-' + id);
        if (!hx || !g) return;

        var rowX = ROW_CENTER_X + (i - 2) * ROW_STEP;
        var compX = ROW_CENTER_X + (i - 2) * COMP_STEP;
        var rowDx = rowX - hx.cx;
        var rowDy = ROW_Y - hx.cy;
        var compDx = compX - hx.cx;

        /* svgOrigin 한 번 잡아두면 후속 트윈에도 동일 origin 사용 →
           rotation·scale 이 항상 hex 자체 중심에서 일어남. */
        var hexTl = gsap.timeline({
          defaults: { svgOrigin: hx.cx + ' ' + hx.cy }
        });

        hexTl.to(g, { x: rowDx, y: rowDy, scale: ROW_SCALE,
                      duration: 1.0, ease: 'power2.inOut' }, 0);
        hexTl.to(g, { rotationY: TILT_Y,
                      duration: 0.8, ease: 'power2.inOut' }, 1.0);
        hexTl.to(g, { x: compDx,
                      duration: 0.8, ease: 'power2.inOut' }, 1.8);
        hexTl.to(g, { rotationY: 0, scale: END_SCALE, z: END_Z,
                      duration: 1.0, ease: 'power3.in' }, 2.6);

        section2Tl.add(hexTl, 0);
      });

      window.__hexS2Tl = section2Tl;

      var boxes2 = document.querySelectorAll('.about_three_contents-box');
      var box1Ref = boxes2[0] || null;
      var box2Ref = boxes2[1] || null;
      var box3Ref = boxes2[2] || null;

      /* Pin 전략 — 다이어그램이 콘텐츠 박스 1·2·3 전체 스크롤 동안 viewport
         에 고정되도록 명시적 trigger/endTrigger 사용. 공통 조상 탐색 대신
         박스 1 시작 ~ 박스 3 끝 으로 직접 범위 지정 (Webflow row 가 어떤
         wrapper 로 싸여있어도 안전). */
      var pinStart = box1Ref || holder;
      var pinEnd   = box3Ref || box2Ref || box1Ref || holder;

      /* 디버그: 항상 출력 (debug flag 무관) — pin 안 먹는 케이스 추적용.
         DOMRect 가 콘솔에서 펼치기 번거롭지 않게 top/height 만 평탄화. */
      try {
        function rectInfo(el) {
          if (!el) return null;
          var r = el.getBoundingClientRect();
          return {
            top: Math.round(r.top + window.scrollY),
            left: Math.round(r.left),
            w: Math.round(r.width),
            h: Math.round(r.height),
            absBottom: Math.round(r.top + window.scrollY + r.height)
          };
        }
        var pinStartParent = pinStart && pinStart.parentElement;
        var holderParent = holder.parentElement;
        var holderGrandparent = holderParent && holderParent.parentElement;
        var diag = {
          scrollY: Math.round(window.scrollY),
          viewportH: window.innerHeight,
          boxesFound: boxes2.length,
          holder: rectInfo(holder),
          holderParent: holderParent && (holderParent.className || holderParent.tagName),
          holderParentRect: rectInfo(holderParent),
          holderGrandparent: holderGrandparent && (holderGrandparent.className || holderGrandparent.tagName),
          holderGrandparentRect: rectInfo(holderGrandparent),
          pinStart: pinStart === holder ? 'holder(fallback)' : (pinStart.className || pinStart.tagName),
          pinStartRect: rectInfo(pinStart),
          pinStartParent: pinStartParent && (pinStartParent.className || pinStartParent.tagName),
          pinStartParentRect: rectInfo(pinStartParent),
          pinEnd: pinEnd === holder ? 'holder(fallback)' : (pinEnd.className   || pinEnd.tagName),
          pinEndRect: rectInfo(pinEnd),
          pinRangePx: pinEnd && pinStart ?
            Math.round(pinEnd.getBoundingClientRect().bottom - pinStart.getBoundingClientRect().top) : null
        };
        /* JSON 문자열로 출력 — 콘솔에서 한 줄로 다 보이게 (객체 접힘 회피). */
        console.log('[helix-s2 v3] ' + JSON.stringify(diag));
      } catch (e) { console.warn('[helix-s2 debug error]', e); }

      /* 핵심 수정 — trigger 를 다이어그램 자체로.
         이전엔 박스1 을 trigger 로 썼는데, 박스1 top(=1042) 에서 pin 이
         발동되면 그 시점엔 다이어그램(top=928) 이 이미 viewport 위로
         사라진 상태였음 (114px 위). 다이어그램이 viewport top 에 닿는
         순간(scroll=928) pin 이 시작되어야 자연스럽게 고정됨.
         endTrigger 는 박스3 의 bottom 이 viewport bottom 에 닿을 때까지
         (= 박스 3 까지 모두 본 시점). */
      window.ScrollTrigger.create({
        trigger: holder,
        endTrigger: pinEnd,
        start: 'top top',
        end: 'bottom bottom',
        pin: holder,
        /* pinSpacing false — 다이어그램은 별도 컬럼(white-frame_connect)
           안에 있고, 좌측 박스들은 다른 DOM 트리에 흩어져 있음. spacer
           추가 시 white-frame_connect 가 1500+px 늘어나면서 그 다음 섹션
           (박스 2, 3 위치) 이 함께 밀려 layout shift 발생. spacer 없이
           position:fixed 로만 고정 — 다이어그램 자리는 잠시 비지만, 박스
           들이 자연스럽게 흘러가는 동안 다이어그램은 viewport 에 박힘. */
        pinSpacing: false,
        pinType: 'fixed',
        anticipatePin: 1
      });
      try {
        console.log('[helix-s2 pin] attached, pin range ≈ ' +
          Math.round(pinEnd.getBoundingClientRect().bottom + window.innerHeight - holder.getBoundingClientRect().top) + 'px');
      } catch (e) {}

      /* Scrub: Section 2 timeline 진행도를 콘텐츠 2 박스의 스크롤 범위에
         매핑. 박스 2 가 viewport 75% 진입 시 시작, bottom 25% 통과 시 끝. */
      var triggerEl = box2Ref || rowEl || holder;

      function forceS1Done() {
        if (typeof window.__hexS1Play === 'function') window.__hexS1Play();
        if (window.__hexS1Tl) window.__hexS1Tl.progress(1);
      }

      window.ScrollTrigger.create({
        trigger: triggerEl,
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: 1,
        animation: section2Tl,
        onEnter: forceS1Done,
        onUpdate: function (self) {
          /* 페이지 로드 시 이미 트리거 범위 안이면 onEnter 가 안 불릴 수
             있으므로, 처음으로 진행도가 0 을 넘는 순간에도 안전망. */
          if (self.progress > 0 && (!window.__hexS1Tl || window.__hexS1Tl.progress() < 1)) {
            forceS1Done();
          }
        }
      });

      log('section 2 ready, tl total: ' + section2Tl.duration().toFixed(2) + 's, scrub trigger=' + (triggerEl.className || triggerEl.tagName));
    }

    tryInit();
  }

  function findCommonAncestor(a, b) {
    if (!a || !b) return null;
    var seen = [];
    for (var n = a; n; n = n.parentElement) seen.push(n);
    for (var m = b; m; m = m.parentElement) {
      if (seen.indexOf(m) !== -1) return m;
    }
    return null;
  }

  function initViewport60FadeIn() {
    var sel = '.about_contents-title, .divider_blue_grad_no-spacing-1, .divider_blue_grad_no-spacing, .about_three_contents-box';
    var els = document.querySelectorAll(sel);
    if (!els.length) { log('no viewport-60 targets'); return; }
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    /* 폰트(ds-endendend + 페이지 모든 웹폰트) 가 로드되기 전에 .is-visible
       을 붙이면 폴백 폰트로 먼저 그려졌다가 갈아끼워지는 현상 발생 →
       폰트 준비 + 뷰포트 진입 둘 다 만족할 때만 활성화.
       document.fonts.ready 는 페이지 내 모든 @font-face (본문 포함) 가
       로드 완료된 시점에 resolve 되므로 본문박스 fade-in 중 폰트 swap 방지. */
    var fontReady = Promise.all([
      whenHeroFontReady(),
      (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve()
    ]);
    /* 폰트 무한 대기 방지: 1.5s 폴백 */
    var fontReadyOrTimeout = Promise.race([
      fontReady,
      new Promise(function (resolve) { setTimeout(resolve, 1500); })
    ]);
    var pending = [];
    function flush() {
      pending.splice(0).forEach(function (el) { el.classList.add('is-visible'); });
    }
    var fontDone = false;
    fontReadyOrTimeout.then(function () { fontDone = true; flush(); log('font ready → flush'); });

    /* rootMargin bottom -20% → 뷰포트 상단 80% 라인에 element top 이 닿을 때 트리거 */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          io.unobserve(e.target);
          if (fontDone) e.target.classList.add('is-visible');
          else pending.push(e.target);
          log('viewport-80 visible:', e.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -20% 0px', threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
  }

  function init() {
    log('init');
    renderHexDiagram();
    initHexAnimations();
    initHexSection2();
    initViewport60FadeIn();
    var video = injectBgVideo();
    var videoReadyP = whenVideoReady(video);

    /* 텍스트는 비디오를 기다리지 않음 — 폰트+심볼 준비되면 즉시 시작 */
    var textReadyP = Promise.all([whenHeroFontReady(), preloadSymbol()]);

    /* 텍스트 시퀀스 끝난 뒤 비디오 페이드. 비디오가 그 시점에 아직 안 왔으면 기다렸다 진행 */
    var textStarted = false;
    function startText(reason) {
      if (textStarted) return; textStarted = true;
      log('text start:', reason);
      runTextTimeline().then(function () {
        videoReadyP.then(function () { fadeInVideo(video); });
      });
    }

    textReadyP.then(function () { startText('ready'); });
    /* 텍스트용 안전 폴백 (비디오 무관) */
    setTimeout(function () { startText('text-timeout'); }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
