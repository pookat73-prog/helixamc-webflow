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
        /* Phase B 광선 sweep — beam 이 hex 영역 밖으로 새지 않도록
           full hex 모양으로 clipPath 를 박아두고, 그 안에서 대각선 라인
           이 평행 이동으로 훑고 지나가게 한다. */
        var clipId = 'helixhex-clip-' + hx.id;
        var clip = document.createElementNS(svgNS, 'clipPath');
        clip.setAttribute('id', clipId);
        var clipShape = document.createElementNS(svgNS, 'path');
        clipShape.setAttribute('d', fullHexPath(verts));
        clip.appendChild(clipShape);
        defs.appendChild(clip);

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

        /* 외부 그룹: clip 고정 (transform 없음).
           내부 mover 그룹: beam 라인을 perpendicular 방향으로 평행 이동 →
           clip 영역 안에서만 보이는 사선 광선이 된다. */
        var beamWrap = document.createElementNS(svgNS, 'g');
        beamWrap.setAttribute('class', 'hex-beam-wrap');
        beamWrap.setAttribute('clip-path', 'url(#' + clipId + ')');

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

    function play() {
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

      log('hex timeline duration:', tl.duration().toFixed(2) + 's');
    }

    if (!('IntersectionObserver' in window)) { play(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        play();
      });
    }, { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0 });
    io.observe(holder);
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

  /* About_Background 높이 = 서브헤더 top - 헤더 bottom 으로 정확히 맞추기.
     헤더(.w-nav 등) 바로 아래에서 시작 → 서브헤더(.about_contents_sub-title)
     바로 위까지의 영역에 영상이 정확히 채워지도록.
     리사이즈/폰트로딩으로 sub-title 위치가 변동되므로 ResizeObserver 로 추적. */
  function fitBgToSubtitle() {
    var bg = document.querySelector('.About_Background, .about_background, .about-background');
    var sub = document.querySelector('.about_contents_sub-title');
    if (!bg || !sub) return;

    var navbar = document.querySelector('.w-nav') ||
                 document.querySelector('nav')    ||
                 document.querySelector('header');
    var navH = navbar ? navbar.getBoundingClientRect().height : 0;

    /* sub-title 의 절대 Y 좌표 (페이지 기준) - bg 의 절대 top */
    var scrollY = window.scrollY || window.pageYOffset;
    var bgTopAbs  = bg.getBoundingClientRect().top  + scrollY;
    var subTopAbs = sub.getBoundingClientRect().top + scrollY;

    /* 헤더가 fixed/sticky 일 때 bg 위쪽 navH 만큼이 헤더에 가려져 있을 수
       있음. bg 가 viewport 최상단에서 시작한다면 navH 만큼 빼서 영상 영역
       시작점 정렬. 그렇지 않으면 그대로 사용. */
    var bgVisibleTop = bgTopAbs < navH ? navH : bgTopAbs;
    var targetH      = subTopAbs - bgVisibleTop;
    if (targetH < 100) return;  /* 비정상 측정 방어 */

    bg.style.height    = targetH + 'px';
    bg.style.minHeight = '0';   /* 기존 100vh min-height 가 키 잡지 못하도록 */
    log('bg fitted: navH=' + navH.toFixed(0) +
        ' bgTop=' + bgTopAbs.toFixed(0) +
        ' subTop=' + subTopAbs.toFixed(0) +
        ' h=' + targetH.toFixed(0));
  }

  function setupBgFit() {
    fitBgToSubtitle();
    /* 폰트 로딩 후 sub-title 위치가 변하므로 한 번 더 */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(fitBgToSubtitle, 0); });
    }
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(fitBgToSubtitle, 100);
    });
    var sub = document.querySelector('.about_contents_sub-title');
    if (sub && window.ResizeObserver) {
      try { new ResizeObserver(fitBgToSubtitle).observe(sub); } catch (e) {}
    }
  }

  function init() {
    log('init');
    renderHexDiagram();
    initHexAnimations();
    initViewport60FadeIn();
    setupBgFit();
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
