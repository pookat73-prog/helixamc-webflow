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

  /* ── 헤더/햄버거/coming-soon 공유 모듈 동적 로드 ──
     about/bootstrap.js 가 jsDelivr @main 에 stale 캐시될 때를 대비해
     window.HELIX_REF (약식 SHA) 기준으로 약식 inject. 이미 로드된 경우 스킵. */
  (function injectSharedModules() {
    var ref = window.HELIX_REF || 'main';
    var t   = Math.floor(Date.now() / 60000);
    var BASE = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' + ref + '/';
    var assets = [
      { type: 'css', path: 'global/global.css' },
      { type: 'css', path: 'home/global/hamburger.css' },
      { type: 'css', path: 'home/global/coming-soon.css' },
      { type: 'js',  path: 'home/global/coming-soon.js' },
      { type: 'js',  path: 'home/global/hamburger.js' }
    ];
    assets.forEach(function (a) {
      var url = BASE + a.path + '?t=' + t;
      var sel = a.type === 'css'
        ? 'link[href*="' + a.path + '"]'
        : 'script[src*="' + a.path + '"]';
      if (document.querySelector(sel)) return;
      var el;
      if (a.type === 'css') {
        el = document.createElement('link');
        el.rel = 'stylesheet';
        el.href = url;
      } else {
        el = document.createElement('script');
        el.src = url;
        el.async = false;
      }
      document.head.appendChild(el);
    });
  })();

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
       각 hex 는 fullHexPath 로 완결된 개별 개체로 그림 (공유 엣지 중복 OK).
       outerEdges = 이웃과 공유하지 않는 외부 perimeter 엣지 — 5개 헥사가
       모두 모인 뒤 전체 silhouette 으로 파동 쏠 때 사용. */
    var hexes = [
      { id: 'naekwa',    label: '내과',       cx: w * 0.5, cy: -1.5 * s, outerEdges: [0, 4, 5],       inner: true },
      { id: 'oikwa',     label: '외과',       cx: w * 1.5, cy: -1.5 * s, outerEdges: [0, 1, 5],       inner: true },
      { id: 'ankwa',     label: '안과',       cx: 0,       cy: 0,        outerEdges: [2, 3, 4, 5]                },
      { id: 'yeongsang', label: '영상의학과', cx: w,       cy: 0,        outerEdges: [2, 3],           inner: true },
      { id: 'chikwa',    label: '치과',       cx: w * 2,   cy: 0,        outerEdges: [0, 1, 2, 3]                }
    ];

    /* 모션 시퀀서가 hex 메타 (cx/cy/inner 등) 를 다시 측정하지 않고 쓸 수
       있도록 노출. */
    window.__helixHexes = hexes;

    var INNER_SCALE = 0.93;

    var minX = -w/2,        maxX = w * 2 + w/2;
    var minY = -1.5*s - s,  maxY = s;
    /* scale:1.18 bounce 가 viewBox 바깥으로 나가지 않도록 여유 확보.
       가장 넓은 hex(ankwa/chikwa) 반폭 ≈ w/2, 18% 팽창 = 0.18*(w/2) ≈ 15.
       상하도 동일 비율. 패딩 25로 충분히 커버. */
    var pad = 25;

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
    /* overflow hidden — viewBox 밖으로 content 가 삐져나와 부모 pin-spacer 에
       잘리는 현상 방지. pad=25 로 scale:1.18 bounce 를 viewBox 안에 흡수. */
    svg.style.overflow = 'hidden';
    svg.setAttribute('overflow', 'hidden');

    /* ── defs: 공유 shimmer gradient + inner hex clipPaths ── */
    var svgDefs = document.createElementNS(svgNS, 'defs');

    /* 대각선 빛반사 그라디언트 (rect 기준 objectBoundingBox) */
    var sGrad = document.createElementNS(svgNS, 'linearGradient');
    sGrad.setAttribute('id', 'helix-shimmer-grad');
    sGrad.setAttribute('x1', '0%');  sGrad.setAttribute('y1', '0%');
    sGrad.setAttribute('x2', '100%'); sGrad.setAttribute('y2', '100%');
    [[0,0],[35,0],[50,0.28],[65,0],[100,0]].forEach(function(s2) {
      var st = document.createElementNS(svgNS, 'stop');
      st.setAttribute('offset', s2[0] + '%');
      st.setAttribute('stop-color', '#0075d6');
      st.setAttribute('stop-opacity', s2[1]);
      sGrad.appendChild(st);
    });
    svgDefs.appendChild(sGrad);

    hexes.forEach(function(hx) {
      if (!hx.inner) return;
      var iv = vertices(hx.cx, hx.cy, INNER_SCALE);
      var cp = document.createElementNS(svgNS, 'clipPath');
      cp.setAttribute('id', 'clip-inner-' + hx.id);
      var cpP = document.createElementNS(svgNS, 'path');
      cpP.setAttribute('d', fullHexPath(iv));
      cp.appendChild(cpP);
      svgDefs.appendChild(cp);
    });
    svg.appendChild(svgDefs);

    hexes.forEach(function (hx) {
      var verts = vertices(hx.cx, hx.cy);
      var g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'hex hex-' + hx.id);
      g.setAttribute('data-cx', hx.cx);
      g.setAttribute('data-cy', hx.cy);

      /* 완결된 6엣지 hex (공유 엣지도 양쪽에서 모두 그림 → 닫힌 fill). */
      var p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', fullHexPath(verts));
      g.appendChild(p);

      /* inner hex 유리 fill */
      if (hx.inner) {
        var iv2 = vertices(hx.cx, hx.cy, INNER_SCALE);
        var iPath = document.createElementNS(svgNS, 'path');
        iPath.setAttribute('d', fullHexPath(iv2));
        iPath.setAttribute('class', 'hex-glass');
        g.appendChild(iPath);
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

    /* shimmer beam — hex 그룹 밖, SVG 직접 자식 (그룹 transform 영향 X) */
    hexes.forEach(function(hx) {
      if (!hx.inner) return;
      var beamW = 130;
      var halfW = w * INNER_SCALE / 2;
      var xFrom = hx.cx - halfW - beamW;
      var xTo   = hx.cx + halfW;
      var beam = document.createElementNS(svgNS, 'rect');
      beam.setAttribute('id', 'shimmer-' + hx.id);
      beam.setAttribute('x', xFrom);
      beam.setAttribute('y', hx.cy - s * 1.05);
      beam.setAttribute('width', beamW);
      beam.setAttribute('height', s * 2.1);
      beam.setAttribute('fill', 'url(#helix-shimmer-grad)');
      beam.setAttribute('clip-path', 'url(#clip-inner-' + hx.id + ')');
      beam.setAttribute('opacity', '0');
      beam.setAttribute('data-x-from', xFrom);
      beam.setAttribute('data-x-to',   xTo);
      svg.appendChild(beam);
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
       명시적으로 세팅해서 첫 페인트와 첫 트윈 사이 점프 방지.
       transformPerspective 도 같이 박아둠 → Section 2 의 rotateY 가 SVG <g>
       위에서 진짜 3D 로 보이게 (CSS 의 perspective 가 SVG 내부에서 종종
       전파 안 되는 케이스 보호). */
    hexes.forEach(function (hx) {
      var g = svg.querySelector('.hex-' + hx.id);
      if (!g) return;
      gsap.set(g, {
        opacity: 0,
        scale: 0.55,
        svgOrigin: hx.cx + ' ' + hx.cy,
        transformPerspective: 1200
      });
      /* 레이더 펄스용 inner 초기 상태 — 평소 invisible, 자기 hex 중심에서
         scale·fade. svgOrigin 한 번 박아두면 후속 트윈도 동일 origin. */
      var inner = g.querySelector('.hex-inner');
      if (inner) {
        gsap.set(inner, {
          opacity: 0,
          scale: 1,
          svgOrigin: hx.cx + ' ' + hx.cy
        });
      }
    });

    /* 모든 inner 펄스 제거 — 사용자 요청. */
    if (window.__hexInnerPulseTween) {
      window.__hexInnerPulseTween.kill();
      window.__hexInnerPulseTween = null;
    }

    var played = false;
    function play() {
      if (played) return window.__hexS1Tl;
      played = true;

      var tl = gsap.timeline();

      /* Phase A — 내 → 외 → 영 → 안 → 치 출렁 엇박 등장 (2단계).
         각 헥사: scale 0.55 → 1.18 (overshoot up + fade in) → 1 (settle).
         5개가 비균등 stagger 로 차례로 출렁이며 등장. */
      var order = ['naekwa', 'oikwa', 'yeongsang', 'ankwa', 'chikwa'];
      var ENTRANCE_TIMES = [0.00, 0.08, 0.22, 0.30, 0.44];
      var GROW_DUR = 0.25;
      var SETTLE_DUR = 0.20;
      order.forEach(function (id, i) {
        var g = svg.querySelector('.hex-' + id);
        if (!g) return;
        var t = ENTRANCE_TIMES[i];
        tl.to(g, {
          opacity: 1,
          scale: 1.18,
          duration: GROW_DUR,
          ease: 'power2.inOut'
        }, t);
        tl.to(g, {
          scale: 1,
          duration: SETTLE_DUR,
          ease: 'power2.inOut'
        }, t + GROW_DUR);
      });

      /* Phase B — 내·외·영 inner 펄스 "통 통" 빠르게.
         빠른 등장(0.05s) → 빠른 수축+페이드(0.25s) = 0.3s 이내. */
      var phaseB = tl.duration() + 0.25;

      /* Phase B 의 inner 펄스/silhouette 스피너 모두 삭제.
         이너 효과는 initHexAnimations 의 shimmer (gradient yoyo) 가 항상
         돌고 있어서 별도 트리거 불필요. */

      window.__hexS1Tl = tl;
      log('hex timeline duration:', tl.duration().toFixed(2) + 's');

      /* 등장 완료 후 shimmer 루프 시작 */
      tl.then(function() {
        var innerIds = hexes.filter(function(h) { return h.inner; });
        innerIds.forEach(function(hx, i) {
          var beam = svg.querySelector('#shimmer-' + hx.id);
          if (!beam) return;
          var xFrom = parseFloat(beam.getAttribute('data-x-from'));
          var xTo   = parseFloat(beam.getAttribute('data-x-to'));
          gsap.set(beam, { opacity: 1 });
          gsap.fromTo(beam,
            { attr: { x: xFrom } },
            { attr: { x: xTo },
              duration: 1.6, ease: 'power1.inOut',
              repeat: -1, repeatDelay: 4.5,
              delay: i * 1.4
            }
          );
        });
      });

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
      /* ROW_ORDER — 각 hex 의 honeycomb origin cx 순서 (좌→우) 와 일치시켜
         펼침 시 서로 경로 크로스가 일어나지 않도록 함.
         ankwa(cx=0) → naekwa(0.5w) → yeongsang(w) → oikwa(1.5w) → chikwa(2w)
         조건 충족: 영상 중심 / 내외 안쪽(±1) / 안치 가장자리(±2). */
      var ROW_ORDER     = ['ankwa', 'naekwa', 'yeongsang', 'oikwa', 'chikwa'];
      var ROW_CENTER_X  = 173;
      var ROW_Y         = -75;
      var ROW_STEP      = 110;   /* 펼침 간격 (스케일 후 헥사 사이가 살짝 떨어짐) */
      /* COMP_STEP_X — 합체 후 인접 헥사 사이의 화면 간격이 0.3vw 가 되도록
         viewBox 단위로 환산. svg 가 100% width 라 pixelsPerUnit 변동이 작지만
         리사이즈 시 다시 계산. */
      var COMP_STEP_X   = 26;    /* 초기값, 아래에서 즉시 재계산 */
      var COMP_STEP_Y   = 0;     /* 세로 offset 없음 — 가로로만 쌓임 */
      function computeCompStepX() {
        try {
          var rect = svg.getBoundingClientRect();
          var vb = svg.viewBox && svg.viewBox.baseVal;
          if (!rect.width || !vb || !vb.width) return;
          var pxPerUnit = rect.width / vb.width;
          var targetPx  = window.innerWidth * 0.003;  /* 0.3vw */
          COMP_STEP_X = targetPx / pxPerUnit;
        } catch (e) {}
      }
      computeCompStepX();
      var ROW_SCALE     = 0.6;   /* 5 hex 가 viewBox 안에 들어가게 다운스케일 */
      var TILT_Y        = 32;    /* 비스듬한 우향우 각도 (deg) */

      /* 두 단계 분리:
         - spreadTl     : box1 → box2 스크롤 구간에서 펼침(일렬). 스크럽.
         - box2EnterTl  : box2 진입 시 자동 재생 시퀀스 — 비스듬 회전 → 한 점
                          으로 모임 → 4개 fade out (yeongsang 만 생존) → 정면
                          으로 다시 회전 → 파동 1회. */
      var spreadTl    = gsap.timeline({ paused: true });
      var box2EnterTl = gsap.timeline({ paused: true });

      /* 5→1 합체 후 생존 헥사 — 정중앙 (yeongsang = 영상의학과). */
      var SURVIVOR_ID = 'yeongsang';

      ROW_ORDER.forEach(function (id, i) {
        var hx = null;
        for (var k = 0; k < hexes.length; k++) {
          if (hexes[k].id === id) { hx = hexes[k]; break; }
        }
        var g = svg.querySelector('.hex-' + id);
        if (!hx || !g) return;

        var rowX  = ROW_CENTER_X + (i - 2) * ROW_STEP;
        var rowDx = rowX - hx.cx;
        var rowDy = ROW_Y - hx.cy;
        /* 켜켜히 stack — 합쳐지지 않고 대각선으로 비스듬히 쌓인 모습이 최종 상태.
           5장 카드가 살짝씩 옆+아래로 어긋나 layering 이 또렷이 보이게. */
        var mergeX  = ROW_CENTER_X + (i - 2) * COMP_STEP_X;
        var mergeY  = ROW_Y       + (i - 2) * COMP_STEP_Y;
        var mergeDx = mergeX - hx.cx;
        var mergeDy = mergeY - hx.cy;

        var spreadHex = gsap.timeline({
          defaults: { svgOrigin: hx.cx + ' ' + hx.cy }
        });

        /* 펼침: identity(원래 위치) → 일렬 row 위치 */
        spreadHex.fromTo(g,
          { x: 0, y: 0, scale: 1 },
          { x: rowDx, y: rowDy, scale: ROW_SCALE,
            duration: 1.0, ease: 'power2.inOut',
            immediateRender: false },
          0
        );

        spreadTl.add(spreadHex, 0);

        /* box2 자동 시퀀스 — 각 hex 별 트윈을 하나의 통합 타임라인에 add */
        var hexEnter = gsap.timeline({
          defaults: { svgOrigin: hx.cx + ' ' + hx.cy }
        });

        /* Phase A (0.0~0.6s): 비스듬 Y축 회전 */
        hexEnter.to(g, { rotationY: 32, duration: 0.6, ease: 'power2.inOut' }, 0);

        /* Phase B (0.6~1.6s): 대각선으로 모이며 켜켜이 쌓임 (X+Y offset) */
        hexEnter.to(g, { x: mergeDx, y: mergeDy, duration: 1.0, ease: 'power2.inOut' }, 0.6);

        /* Phase C (1.6~2.2s): 5장 모두 정면 복귀 — 카드 stack 같은 최종 모습.
           합쳐지지 않고 비스듬히 쌓인 상태가 그대로 유지됨. */
        hexEnter.to(g, { rotationY: 0, duration: 0.6, ease: 'power2.inOut' }, 1.6);

        box2EnterTl.add(hexEnter, 0);
      });

      /* Phase B 시점에 텍스트 fade out 시작 (합쳐질수록 텍스트 사라짐) */
      var hexTexts = svg.querySelectorAll('.hex text');
      if (hexTexts.length) {
        box2EnterTl.to(hexTexts,
          { opacity: 0, duration: 0.8, ease: 'power2.in' },
          0.6);
      }

      /* Phase B 시작 직전 z-order 재배치 — 합칠 때 맨 왼쪽 헥사(chikwa) 가
         최상단, 생존자(yeongsang) 가 최하단. SVG 는 DOM 순서대로 렌더되므로
         appendChild 로 끝으로 이동 = 위로 올림. */
      box2EnterTl.call(function () {
        var parent = svg.querySelector('.helix-hex-diagram') || svg;
        /* z-order (DOM 순서: 뒤쪽 → 앞쪽): ankwa 최하단 … chikwa 최상단.
           ROW_ORDER 마지막 헥사(chikwa) 가 stack 의 제일 첫 장(앞면). */
        var stackOrder = ['ankwa', 'naekwa', 'yeongsang', 'oikwa', 'chikwa'];
        stackOrder.forEach(function (id) {
          var g = svg.querySelector('.hex-' + id);
          if (g && g.parentNode) g.parentNode.appendChild(g);
        });
      }, null, 0.55);

      /* Phase E (2.2~3.0s): 파동 1회 — stack 중심에서 동심원 펄스. */
      var box2Wave = injectBox2Wave(svg, ROW_CENTER_X, ROW_Y);
      if (box2Wave) {
        box2EnterTl.fromTo(box2Wave,
          { attr: { r: 8 }, opacity: 0.9 },
          { attr: { r: 180 }, opacity: 0,
            duration: 0.8, ease: 'power2.out',
            immediateRender: false },
          2.2);
      }

      /* 호환용 — 외부에서 참조 가능한 이름 유지. */
      var section2Tl = box2EnterTl;

      /* Box 3 — 모핑 후 심볼에서 펄스 1번 + 궤도 도는 빛점.
         박스 3 진입 → 펄스 1회 + 궤도 빛점 fade in.
         박스 3 위로 역스크롤 → effects 통째 fade out (박스 1·2 에 보이지
         않게). 펄스는 "한 번" 이라 다시 진입해도 재발사 안 함. */
      var box3Effects = injectBox3Effects(holder);
      if (box3Effects && box3Ref) {
        gsap.set(box3Effects, { opacity: 0 });
        var pulseEl = box3Effects.querySelector('.box3-pulse');
        var dotEl   = box3Effects.querySelector('.box3-orbit-dot');
        if (pulseEl) gsap.set(pulseEl, { opacity: 0, attr: { r: 40 } });
        if (dotEl)   gsap.set(dotEl,   { opacity: 0 });

        var box3PulseFired = false;
        window.ScrollTrigger.create({
          trigger: box3Ref,
          start: 'top 75%',
          onEnter: function () {
            /* effects layer fade in (매번 박스3 재진입 시 다시 켬) */
            gsap.to(box3Effects, { opacity: 1, duration: 0.4, ease: 'power2.out' });
            /* 펄스 — 최초 진입 시 한 번만 발사 ("파동 한번 퉁") */
            if (!box3PulseFired && pulseEl) {
              box3PulseFired = true;
              gsap.set(pulseEl, { opacity: 1, attr: { r: 20 } });
              gsap.to(pulseEl, {
                attr: { r: 220 }, opacity: 0,
                duration: 1.6, ease: 'power2.out'
              });
            }
            /* 궤도 빛점 fade in (매 진입 시 다시 켬, 영구 순회) */
            if (dotEl) {
              gsap.to(dotEl, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.4 });
            }
            log('box3 onEnter (pulseFired=' + box3PulseFired + ')');
          },
          onLeaveBack: function () {
            /* 박스 3 위로 역스크롤 → effects 통째 fade out
               (박스 1·2 영역에 궤도 빛점이 비치지 않게) */
            gsap.to(box3Effects, { opacity: 0, duration: 0.3, ease: 'power2.in' });
            log('box3 onLeaveBack → effects hidden');
          }
        });
        log('box3 effects ready');
      }

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

      /* 핀 시작점·종료점 튜닝.
         start: 'center center'
           = 다이어그램의 시각 중심이 viewport 중심에 닿는 순간 pin.
             이전엔 'top top' 이라 viewport 최상단(서브헤드 영역)에 박혀
             부자연스러웠음. 중심에서 잡으면 좌측 콘텐츠와 시선 라인이
             맞고, 서브헤드와 겹치지 않음.
         end: 'bottom top' on 박스 3
           = 박스 3 의 bottom 이 viewport top 에 닿을 때 (= 박스 3 이 위로
             완전히 사라질 때) 까지 핀 유지. 핀 해제 시점에는 다이어그램
             원래 자리(top=928)가 이미 viewport 위로 한참 지난 상태라
             unpin 점프 없음.
         pinSpacing: false — Webflow row layout 이 흩어져 있어 spacer 추가
           시 박스 2,3 섹션이 밀리는 사고 방지. */
      window.ScrollTrigger.create({
        trigger: holder,
        endTrigger: pinEnd,
        /* start 'center 40%' — 다이어그램 중심이 viewport 40% 라인에 닿는
           순간 pin. 'center center' (50%) 보다 위쪽에 자리잡아 좌측 콘텐츠
           박스 1 의 시각 y 와 더 잘 맞춤 (이전엔 콘텐츠보다 살짝 아래에서
           시작해서 어색했음). */
        start: 'center 40%',
        end: 'bottom top',
        pin: holder,
        pinSpacing: false,
        pinType: 'fixed',
        anticipatePin: 1
      });
      try {
        var pinStartScroll = Math.round(holder.getBoundingClientRect().top + window.scrollY + holder.getBoundingClientRect().height / 2 - window.innerHeight / 2);
        var pinEndScroll = Math.round(pinEnd.getBoundingClientRect().bottom + window.scrollY);
        console.log('[helix-s2 pin] attached, pinStartScroll≈' + pinStartScroll + ' pinEndScroll≈' + pinEndScroll + ' range≈' + (pinEndScroll - pinStartScroll) + 'px');
      } catch (e) {}

      /* SPREAD: box1 → box2 스크럽 (일렬 펼침)
         BOX2 ENTER: box2 진입 시 자동 재생 (회전→모임→합체→정면→파동)
         box1 영역에선 spread progress 0 → hexes 정적, 등장만. */

      function forceS1Done() {
        if (typeof window.__hexS1Play === 'function') window.__hexS1Play();
        if (window.__hexS1Tl) window.__hexS1Tl.progress(1);
      }

      /* SPREAD: box1.center → box3.top 까지 — 세번째 스크롤(box3) 도달 시점에
         펼침이 완전히 완성되도록 box1·box2 전체 구간을 스크럽으로 사용. */
      window.ScrollTrigger.create({
        trigger: box1Ref || holder,
        endTrigger: box3Ref || box2Ref || box1Ref || holder,
        start: 'center center',
        end: 'top center',
        scrub: 1,
        animation: spreadTl,
        onEnter: forceS1Done,
        onUpdate: function (self) {
          if (self.progress > 0 && (!window.__hexS1Tl || window.__hexS1Tl.progress() < 1)) {
            forceS1Done();
          }
        }
      });

      /* BOX3 STACK: box3 영역에서 합체 스크럽 — 펼침 완료 직후 켜켜이 쌓임. */
      window.ScrollTrigger.create({
        trigger: box3Ref || box2Ref || holder,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
        animation: box2EnterTl
      });

      log('section 2 ready — spread:' + spreadTl.duration().toFixed(2) +
          's box2Enter:' + box2EnterTl.duration().toFixed(2) + 's');
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

  /* 헬릭스 심볼 모핑 타겟 stage 주입.
     - stage 는 GSAP 가 위치/스케일/오파시티를 다루는 wrapper
     - 그 안의 <img> 는 CSS 다층 drop-shadow + hue-shift 시머 애니메이션으로
       크리스탈 3D 인상을 근사 표현 (진짜 3D 모델 아님)
     - src 는 about hero 의 img.image-23 src 를 그대로 재사용 (사용자가
       올린 심볼.svg 도 같은 PNG 가 wrapping 된 형태라 시각적으로 동일) */
  /* box2 정면 헥사 파동 — survivor 위치에 동심원 stroke 1회 발사용 SVG circle */
  function injectBox2Wave(svg, cx, cy) {
    if (!svg) return null;
    var existing = svg.querySelector('.box2-wave');
    if (existing) return existing;
    var ns = 'http://www.w3.org/2000/svg';
    var c = document.createElementNS(ns, 'circle');
    c.setAttribute('class', 'box2-wave');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', 8);
    c.setAttribute('fill', 'none');
    c.setAttribute('stroke', '#0075d6');
    c.setAttribute('stroke-width', '2');
    c.setAttribute('opacity', '0');
    c.style.pointerEvents = 'none';
    svg.appendChild(c);
    return c;
  }

  function injectMorphSymbol(holder) {
    if (!holder) return null;
    var existing = holder.querySelector('.hex-morph-stage');
    if (existing) return existing;

    var hero = document.querySelector('img.image-23');
    var src = hero ? (hero.currentSrc || hero.src) : '';
    if (!src) return null;

    var stage = document.createElement('div');
    stage.className = 'hex-morph-stage';

    var img = document.createElement('img');
    img.className = 'hex-morph-symbol';
    img.src = src;
    img.alt = '';
    img.draggable = false;
    stage.appendChild(img);

    holder.appendChild(stage);
    return stage;
  }

  /* Box 3 — 심볼에서 파동 한번 + 궤도 도는 빛점.
     placeholder 궤도 = 수직 타원 (실제 심볼 path 데이터가 없어 근사).
     진짜 path 모션 원할 시 path 데이터가 있는 벡터 SVG 가 필요. */
  function injectBox3Effects(holder) {
    if (!holder) return null;
    var existing = holder.querySelector('.box3-effects');
    if (existing) return existing;

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'box3-effects');
    svg.setAttribute('viewBox', '-100 -160 200 320');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    /* Pulse ring — 펄스 1번 (확장하며 fade out) */
    var pulse = document.createElementNS(ns, 'circle');
    pulse.setAttribute('class', 'box3-pulse');
    pulse.setAttribute('cx', '0'); pulse.setAttribute('cy', '0');
    pulse.setAttribute('r', '40');
    pulse.setAttribute('fill', 'none');
    pulse.setAttribute('stroke', '#7fc4ff');
    pulse.setAttribute('stroke-width', '2');
    svg.appendChild(pulse);

    /* 궤도 path (placeholder = 수직 타원) — 보이지 않게, motion 전용 */
    var orbitD = 'M 0,-130 A 60,130 0 1,1 0,130 A 60,130 0 1,1 0,-130 Z';
    var orbit = document.createElementNS(ns, 'path');
    orbit.setAttribute('class', 'box3-orbit-path');
    orbit.setAttribute('d', orbitD);
    orbit.setAttribute('fill', 'none');
    orbit.setAttribute('stroke', 'none');
    svg.appendChild(orbit);

    /* 궤도 도는 빛점 + halo */
    var dotG = document.createElementNS(ns, 'g');
    dotG.setAttribute('class', 'box3-orbit-dot');
    var halo = document.createElementNS(ns, 'circle');
    halo.setAttribute('r', '12');
    halo.setAttribute('fill', 'rgba(127,196,255,0.35)');
    var core = document.createElementNS(ns, 'circle');
    core.setAttribute('r', '4');
    core.setAttribute('fill', '#ffffff');
    dotG.appendChild(halo);
    dotG.appendChild(core);
    /* SVG <animateMotion> — 6s 주기로 path 무한 순회 */
    var motion = document.createElementNS(ns, 'animateMotion');
    motion.setAttribute('dur', '6s');
    motion.setAttribute('repeatCount', 'indefinite');
    motion.setAttribute('path', orbitD);
    motion.setAttribute('rotate', 'auto');
    dotG.appendChild(motion);
    svg.appendChild(dotG);

    holder.appendChild(svg);
    return svg;
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

  /* ── "최초" 사선 물들기 ─────────────────────────────────────────
     런타임에 실제 텍스트 색을 읽어 background-clip:text 그라데이션에
     명시 색상값으로 박음 → currentColor / transparent 문제 없음.
     GSAP 으로 backgroundPosition 을 animate → 사선 wash 효과.
     ─────────────────────────────────────────────────────────────── */
  function initHistorySpark() {
    var SEL = '.about_history_title_official-font';

    function applyWash(el) {
      if (el.dataset.washDone) return false;

      /* 실제 텍스트 색 읽기 (span 적용 전에 읽어야 정확) */
      var cs = getComputedStyle(el);
      var fill = cs.getPropertyValue('-webkit-text-fill-color');
      var base = (fill && fill !== 'rgba(0, 0, 0, 0)' && fill !== 'transparent')
        ? fill : cs.color;
      if (!base || base === 'rgba(0, 0, 0, 0)' || base === 'transparent') base = '#ffffff';
      log('history spark base=' + base);

      /* "최초" 토큰만 span 으로 wrap */
      var TOKEN = '최초';
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var nodes = []; var n;
      while ((n = walker.nextNode())) nodes.push(n);
      var span = null;
      nodes.forEach(function (t) {
        var idx = t.nodeValue.indexOf(TOKEN);
        if (idx < 0 || span) return;
        span = document.createElement('span');
        span.style.display = 'inline';
        var frag = document.createDocumentFragment();
        if (idx > 0) frag.appendChild(document.createTextNode(t.nodeValue.slice(0, idx)));
        frag.appendChild(span);
        var rest = t.nodeValue.slice(idx + TOKEN.length);
        if (rest) frag.appendChild(document.createTextNode(rest));
        t.parentNode.replaceChild(frag, t);
      });
      if (!span) return false;
      span.textContent = TOKEN;
      el.dataset.washDone = '1';

      /* -webkit-text-fill-color 를 currentColor 로 고정해 color 애니메이션이 반영되도록 */
      span.style.webkitTextFillColor = 'currentColor';
      span.style.color = base;

      function start() {
        if (!window.gsap) return;
        gsap.timeline({ repeat: -1, repeatDelay: 1.5, delay: 0.5 })
          .to(span, { color: '#0075d6', duration: 1.4, ease: 'sine.inOut' })
          .to(span, { color: '#0075d6', duration: 2.0 })          /* 2초 유지 */
          .to(span, { color: base,     duration: 1.2, ease: 'sine.inOut' });
      }

      if (!('IntersectionObserver' in window)) { start(); return true; }
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect(); start();
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
      io.observe(el);
      return true;
    }

    function tryInit() {
      var els = document.querySelectorAll(SEL);
      log('history spark: found=' + els.length);
      var any = false;
      els.forEach(function (el) { if (applyWash(el)) any = true; });
      return any;
    }

    if (tryInit()) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (tryInit() || ++tries > 20) clearInterval(iv);
    }, 300);
  }

  /* ── Standard-font 형광펜 sweep ───────────────────────────────
     CSS 가 background-image (메인 블루 → 투명 그라데이션) 와
     transition 을 정의. JS 는 IntersectionObserver 로 진입 시
     .is-highlighted 부착 → background-size 0% → 100% 확장.
     ─────────────────────────────────────────────────────────── */
  function initStandardFontHighlight() {
    /* 사용자 지정 정확 선택자 — "헬릭스는 ~ 진화하고있습니다" 문단 */
    var SEL = 'body > section:nth-child(22) > div > div > div:nth-child(2)';
    var el = document.querySelector(SEL);
    log('standard-font highlight target=' + !!el);
    if (!el) return;

    el.classList.add('is-highlight-target');

    function trigger() {
      if (el.dataset.highlightDone) return;
      el.dataset.highlightDone = '1';
      el.classList.add('is-highlighted');
    }

    if (!('IntersectionObserver' in window)) { trigger(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { trigger(); io.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    io.observe(el);
  }

  /* ── 쫀득한 h2 등장 ────────────────────────────────────────────
     CSS 가 초기 숨김 + transition 정의. JS 는 IntersectionObserver
     로 진입 시 .is-chewy-in 부착 → fade + Y 슬라이드 + scale.
     ─────────────────────────────────────────────────────────── */
  function initChewyH2() {
    var SEL = '#w-node-_12c5d099-8df6-4231-81c4-5ea6bfff211d-e0c16bc5 > h2';
    var el = document.querySelector(SEL);
    log('chewy h2 target=' + !!el);
    if (!el) return;

    function trigger() {
      if (el.dataset.chewyDone) return;
      el.dataset.chewyDone = '1';
      el.classList.add('is-chewy-in');
    }

    if (!('IntersectionObserver' in window)) { trigger(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { trigger(); io.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    io.observe(el);
  }

  /* ── div-block-108 — 휘발유 점화 글로우 ─────────────────────────
     CSS 가 conic-gradient + @property 로 burn-angle 0→360deg 애니메이션.
     JS 는 IO 진입 시 .is-burning 부착.
     ─────────────────────────────────────────────────────────── */
  function initBurnGlow() {
    var SEL = '#w-node-_5aa01e07-0ac7-cd46-9cc7-c5935c3c48a8-e0c16bc5 > div.div-block-108';
    var el = document.querySelector(SEL);
    /* 무조건 console — 디버깅용 (target=false 면 selector 가 안 잡히는 것) */
    console.log('[burn-glow] target=' + !!el, 'sel=' + SEL);
    /* selector 가 안 잡히면 div-block-108 만이라도 모든 인스턴스 찾기 */
    if (!el) {
      var fallback = document.querySelectorAll('.div-block-108');
      console.log('[burn-glow] fallback .div-block-108 count=' + fallback.length);
      if (fallback.length) el = fallback[0];
    }
    if (!el) return;

    function trigger() {
      if (el.dataset.burnDone) return;
      el.dataset.burnDone = '1';
      el.classList.add('is-burning');
      console.log('[burn-glow] is-burning added on', el);
    }

    if (!('IntersectionObserver' in window)) { trigger(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { trigger(); io.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    io.observe(el);
  }

  /* ── Hybrid Operation Room h1 — 좌상단 비대칭 reveal ─────────── */
  function initHybridRoomTitle() {
    var SEL = '#hybrid-operation-room > div.just-box_qqqqqqqqq > div > h1.official-font_title';
    var el = document.querySelector(SEL);
    log('hybrid-room title target=' + !!el);
    if (!el) return;

    function trigger() {
      if (el.dataset.cornerInDone) return;
      el.dataset.cornerInDone = '1';
      el.classList.add('is-corner-in');
    }

    if (!('IntersectionObserver' in window)) { trigger(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { trigger(); io.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    io.observe(el);
  }

  /* ── 타임라인 가운데 펼침 ────────────────────────────────────── */
  function initHistoryTimeline() {
    var BADGE_SEL = '.about_history_time-line_contents';
    var TEXT_SEL  = '.about_history_time-line_contents-copy_title';

    function tryInit() {
      var badges = document.querySelectorAll(BADGE_SEL);
      var texts  = document.querySelectorAll(TEXT_SEL);
      log('history timeline: badges=' + badges.length + ' texts=' + texts.length);
      if (!badges.length) return false;

      var vcx = window.innerWidth / 2;

      badges.forEach(function (el, i) {
        /* 뱃지: 처음부터 보이되 화면 정중앙에 위치 */
        var rect = el.getBoundingClientRect();
        var offset = Math.round(vcx - (rect.left + rect.width / 2));
        el.style.transform = 'translateX(' + offset + 'px)';
        el.style.opacity = '1';
        el.classList.add('js-ready');
        el.style.transitionDelay = (i * 0.09) + 's';
      });
      texts.forEach(function (el, i) {
        /* 텍스트: 뱃지 뒤에서 출발해 오른쪽으로 슬라이드.
           opacity 는 transform 보다 늦게 페이드인 → 뱃지가 비켜준 뒤에야 보임. */
        var rect = el.getBoundingClientRect();
        var offset = Math.round(vcx - rect.left);
        el.style.transform = 'translateX(' + offset + 'px)';
        el.style.opacity = '0';
        el.classList.add('js-ready');
        var rowDelay = i * 0.09;
        var ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
        /* transform: 즉시 / opacity: 0.35s 늦게 페이드인 */
        el.style.transition =
          'transform 0.6s ' + ease + ' ' + rowDelay + 's, ' +
          'opacity 0.4s ' + ease + ' ' + (rowDelay + 0.35) + 's';
      });

      function fire() {
        badges.forEach(function (el) { el.classList.add('is-visible'); });
        texts.forEach(function (el)  { el.classList.add('is-visible'); });
        log('history timeline: fired');
      }

      if (!('IntersectionObserver' in window)) { fire(); return true; }
      var fired = false;
      var io = new IntersectionObserver(function (entries) {
        if (fired || !entries[0].isIntersecting) return;
        fired = true; io.disconnect(); fire();
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
      io.observe(badges[0]);
      return true;
    }

    if (tryInit()) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (tryInit() || ++tries > 20) clearInterval(iv);
    }, 300);
  }

  /* ── History Helix Line ─────────────────────────────────────────
     "최초의 길" 정중앙 → .about_history_title_sub-font 위까지
     사인파 헬릭스 라인을 빠르게 draw + erase.
     ─────────────────────────────────────────────────────────────── */
  function initHistoryHelixLine() {
    var TOP_SEL    = '.div-block-163';
    var BOTTOM_SEL = '.about_history_title_sub-font';
    /* draw 트리거는 여전히 "최초의 길" 진입 기준으로 — 시각/타이밍 분리 */
    var DRAW_TRIGGER_SEL = '.about_history_title_official-font';
    var COLOR      = '#0075d6';
    var STROKE     = 0.6;

    function build() {
      var top    = document.querySelector(TOP_SEL);
      var bottom = document.querySelector(BOTTOM_SEL);
      if (!top || !bottom) return false;

      var topR    = top.getBoundingClientRect();
      var botR    = bottom.getBoundingClientRect();
      var sx      = window.scrollX, sy = window.scrollY;
      var startX  = topR.left + topR.width / 2 + sx;
      var startY  = topR.bottom + sy + 8;                  /* 최초 문단 바로 아래 */
      var endX    = botR.left + botR.width / 2 + sx;
      var endY    = botR.top  + sy - 8;                    /* sub-font 위에서 끝 */

      if (endY - startY < 50) return false;                /* 너무 가까우면 skip */

      /* SVG 자체는 0×0 으로 두고 overflow:visible 로 path 만 그려지게 함.
         (큰 width/height 박으면 body 스크롤/레이아웃에 영향 가서 헤더/섹션 사이
         틈새가 벌어지는 사고가 생김) */
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('xmlns', svgNS);
      svg.style.position      = 'absolute';
      svg.style.left          = '0';
      svg.style.top           = '0';
      svg.style.width         = '1px';
      svg.style.height        = '1px';
      svg.style.pointerEvents = 'none';
      svg.style.zIndex        = '5';
      svg.style.overflow      = 'visible';
      svg.setAttribute('overflow', 'visible');

      /* 직선 path */
      var d = 'M' + startX.toFixed(1) + ',' + startY.toFixed(1) +
              ' L' + endX.toFixed(1) + ',' + endY.toFixed(1);

      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', COLOR);
      path.setAttribute('stroke-width', String(STROKE));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');

      svg.appendChild(path);
      document.body.appendChild(svg);

      var len = path.getTotalLength();
      path.style.strokeDasharray  = len;
      path.style.strokeDashoffset = len;

      var drawnFired = false, erasedFired = false;
      function drawLine() {
        if (drawnFired) return; drawnFired = true;
        if (!window.gsap) {
          path.style.transition = 'stroke-dashoffset 0.55s cubic-bezier(0.65,0,0.35,1)';
          path.style.strokeDashoffset = '0';
          return;
        }
        gsap.to(path, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' });
      }
      function eraseLine() {
        if (erasedFired) return; erasedFired = true;
        if (!drawnFired) drawLine();
        if (!window.gsap) {
          path.style.transition = 'stroke-dashoffset 0.5s cubic-bezier(0.65,0,0.35,1)';
          path.style.strokeDashoffset = String(-len);
          return;
        }
        gsap.to(path, { strokeDashoffset: -len, duration: 0.5, ease: 'power2.inOut', delay: 0.1 });
      }

      if (!('IntersectionObserver' in window)) {
        drawLine();
        setTimeout(eraseLine, 800);
        return true;
      }

      /* Draw 트리거: 최초의 길 (또는 fallback 으로 top 자체) 가 상단 20%에 들어오면 */
      var drawTrigger = document.querySelector(DRAW_TRIGGER_SEL) || top;
      var ioDraw = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        ioDraw.disconnect(); drawLine();
      }, { rootMargin: '0px 0px -80% 0px', threshold: 0 });
      ioDraw.observe(drawTrigger);

      /* Erase: 출발 요소(.div-block-163) 가 뷰포트에서 완전히 사라지는 순간
         (홈 헬릭스 라인과 동일한 패턴) */
      var wasVisible = false;
      var ioErase = new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible) { wasVisible = true; return; }
        if (!wasVisible) return;
        ioErase.disconnect(); eraseLine();
      }, { threshold: 0 });
      ioErase.observe(top);

      log('history helix line ready, len=' + len.toFixed(0));
      return true;
    }

    /* layout 안정화 후 시도 + 재시도 */
    setTimeout(function () {
      if (build()) return;
      var tries = 0;
      var iv = setInterval(function () {
        if (build() || ++tries > 30) clearInterval(iv);
      }, 300);
    }, 800);
  }

  /* ── 스크롤 진입 페이드인 + 스케일 ──────────────────────────────
     .about_we-are-here     — fade 0.8s + scale 2s (power2.out), 동시 시작
     .about_history_title_new — fade 1.5s + scale 1.5s (power2.inOut),
                                we-are-here 와 엇박으로 0.5s 딜레이
     ─────────────────────────────────────────────────────────────── */
  function initWeAreHereReveal() {
    var configs = [
      {
        sel: '.about_we-are-here',
        fadeDur: 0.8, scaleDur: 2.0, ease: 'power2.out', delay: 0
      },
      {
        /* 국내 최초~도입 — we-are-here 다음에 곧이어 (0.5s) */
        sel: '.about_history_title_new',
        fadeDur: 1.2, scaleDur: 1.2, ease: 'power2.inOut', delay: 0.5
      }
    ];

    function reveal(el, cfg) {
      if (window.gsap) {
        gsap.set(el, { opacity: 0, scale: 0.8, transformOrigin: '50% 50%' });
        var tl = gsap.timeline({ delay: cfg.delay });
        tl.to(el, { opacity: 1, duration: cfg.fadeDur,  ease: cfg.ease }, 0);
        tl.to(el, { scale: 1,   duration: cfg.scaleDur, ease: cfg.ease }, 0);
      } else {
        el.style.transition =
          'opacity ' + cfg.fadeDur + 's ease-in-out ' + cfg.delay + 's, ' +
          'transform ' + cfg.scaleDur + 's ease-in-out ' + cfg.delay + 's';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.8)';
        requestAnimationFrame(function () {
          el.style.opacity = '1';
          el.style.transform = 'scale(1)';
        });
      }
    }

    configs.forEach(function (cfg) {
      var els = document.querySelectorAll(cfg.sel);
      if (!els.length) { log('no ' + cfg.sel); return; }

      els.forEach(function (el) {
        if (window.gsap) gsap.set(el, { opacity: 0, scale: 0.8, transformOrigin: '50% 50%' });
        else { el.style.opacity = '0'; el.style.transform = 'scale(0.8)'; }
      });

      if (!('IntersectionObserver' in window)) {
        els.forEach(function (el) { reveal(el, cfg); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          reveal(e.target, cfg);
        });
      }, { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0 });
      els.forEach(function (el) { io.observe(el); });
    });
  }

  /* ── .about_hybrid-contents_box 양쪽 펼침 ───────────────────────
     박스 2개: 둘 다 두 박스의 기하 중심점에서 시작 (1번 visible, 2번 invisible).
     스크롤 진입 시 각자 자연 위치로 슬라이드, 2번은 동시에 페이드인.
     박스 ≥3 개일 땐 시각상 가운데 박스를 anchor 로 두고 나머지 사이드가
     center 에서 펼쳐지는 방식 유지.
     ─────────────────────────────────────────────────────────────── */
  function initHybridUnfold() {
    var SEL = '.about_hybrid-contents_box';

    function build() {
      var nodes = document.querySelectorAll(SEL);
      if (nodes.length < 2) { log('hybrid: nodes=' + nodes.length); return false; }

      /* 시각 순서로 정렬 — DOM 순서와 무관하게 화면상 좌→우 */
      var boxes = Array.prototype.slice.call(nodes).sort(function (a, b) {
        return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
      });
      if (!boxes[0].getBoundingClientRect().width) return false;

      var rects = boxes.map(function (b) { return b.getBoundingClientRect(); });

      /* anchorCx 결정.
         - 2개 → 두 박스 중심의 평균 (둘 다 그 점에서 출발해 양쪽으로 펼침)
         - 3+개 → 시각상 가운데 박스 중심 (그 박스는 고정 anchor) */
      var anchorCx;
      var anchorIdx = -1;          /* 슬라이드만, 페이드 없음. -1 이면 모두 페이드인 */
      if (boxes.length === 2) {
        anchorCx = (rects[0].left + rects[0].width / 2 +
                    rects[1].left + rects[1].width / 2) / 2;
        /* 1번(좌측 박스, 사용자 설명상 '가운데에서 시작하고 보이는') 은
           슬라이드만 — opacity 변화 없음. */
        anchorIdx = 0;
      } else {
        anchorIdx = Math.floor(boxes.length / 2);
        anchorCx  = rects[anchorIdx].left + rects[anchorIdx].width / 2;
      }

      /* 초기 상태: 모든 박스를 anchorCx 로 translate. anchor 박스는 visible,
         나머지는 invisible (페이드인 대기). */
      boxes.forEach(function (b, i) {
        var cx = rects[i].left + rects[i].width / 2;
        var dx = anchorCx - cx;
        var op = (i === anchorIdx) ? 1 : 0;
        if (window.gsap) gsap.set(b, { x: dx, opacity: op });
        else {
          b.style.transform = 'translateX(' + dx + 'px)';
          b.style.opacity = String(op);
        }
      });

      var played = false;
      function play() {
        if (played) return; played = true;
        boxes.forEach(function (b, i) {
          if (window.gsap) {
            gsap.to(b, { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' });
          } else {
            b.style.transition = 'transform 1s cubic-bezier(0.22,1,0.36,1), opacity 0.8s ease-out';
            b.style.transform  = 'translateX(0)';
            b.style.opacity    = '1';
          }
        });
        log('hybrid unfold play');
      }

      /* 트리거는 anchor 박스 (또는 첫 박스) — 스크롤 진입 감지 */
      var triggerEl = boxes[anchorIdx >= 0 ? anchorIdx : 0];
      if (!('IntersectionObserver' in window)) { play(); return true; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          play();
        });
      }, { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0 });
      io.observe(triggerEl);
      log('hybrid unfold ready, count=' + boxes.length + ' anchorIdx=' + anchorIdx);
      return true;
    }

    if (build()) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (build() || ++tries > 30) clearInterval(iv);
    }, 200);
  }

  function init() {
    log('init');
    renderHexDiagram();
    initHexAnimations();
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

/* ================================================================
   CARD STACK — embedded copy of home/global/card-stack.{css,js}
   bootstrap injectJs 가 외부 파일 로드에 실패하는 케이스 대비.
   about.js 자체는 안정적으로 로드되므로 카드덱도 함께 보장.
   외부 card-stack.js 가 먼저 init 했으면 자동 스킵.
   ================================================================ */
(function () {
  'use strict';

  if (!document.getElementById('helix-card-stack-css')) {
    var st = document.createElement('style');
    st.id = 'helix-card-stack-css';
    st.textContent =
      '.helix-deck-host{position:relative;margin:0 auto;touch-action:pan-y;user-select:none;-webkit-user-select:none;overflow:visible}' +
      '.helix-deck-host > .just-box_qqqqqqq,.helix-deck-host > *:not(.helix-deck-arrow){position:absolute !important;left:50%;top:0;margin:0 !important;transform-origin:50% 50%;will-change:transform,opacity;cursor:grab;transition:box-shadow 0.25s ease;isolation:isolate;background-color:inherit}' +
      '.helix-deck-host > .is-top{z-index:10;box-shadow:0 6px 18px rgba(0,0,0,0.18),0 18px 48px rgba(0,0,0,0.10)}' +
      '.helix-deck-host > .is-dragging{cursor:grabbing;transition:none !important}' +
      '.helix-deck-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:50;width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:50%;color:#333;cursor:pointer;padding:0;margin:0;outline:none;transition:transform 0.18s ease,opacity 0.18s ease;-webkit-tap-highlight-color:transparent;opacity:0.85}' +
      '.helix-deck-arrow:hover{transform:translateY(-50%) scale(1.15);opacity:1}' +
      '.helix-deck-arrow:active{transform:translateY(-50%) scale(0.92)}' +
      '.helix-deck-arrow svg{display:block}' +
      '.helix-deck-arrow-left{left:-64px}' +
      '.helix-deck-arrow-right{right:-64px}' +
      '@media (max-width:600px){.helix-deck-arrow{width:40px;height:40px}.helix-deck-arrow svg{width:20px;height:20px}.helix-deck-arrow-left{left:-44px}.helix-deck-arrow-right{right:-44px}}';
    document.head.appendChild(st);
  }

  console.log('[Deck] embedded card-stack loaded');

  function log() {
    console.log.apply(console, ['[Deck-emb]'].concat([].slice.call(arguments)));
  }

  var CARD_SELECTOR    = '.just-box_qqqqqqq';
  var SECTION_SELECTOR = '.white-frame_connect';
  var DRY_RUN          = /[?&]deck-dry=1/.test(location.search);
  var VISIBLE        = 4;
  var STACK_OFFSET_Y = 8;
  var STACK_OFFSET_X = 8;
  var STACK_TILT     = 0;
  var STACK_SCALE    = 0;
  var FLY_THRESHOLD = 0.25;
  var FLY_VELOCITY  = 0.45;
  var FLY_DURATION  = 240;
  var SNAP_DURATION = 220;

  var initialized = false;

  function init() {
    if (initialized) return true;
    if (document.querySelector('.helix-deck-host')) { initialized = true; return true; }

    var cardsAll = document.querySelectorAll(CARD_SELECTOR);
    log('found ' + CARD_SELECTOR + ':', cardsAll.length);
    if (cardsAll.length < 2) return false;

    var sections = [];
    Array.prototype.forEach.call(cardsAll, function (c) {
      var sec = c.closest(SECTION_SELECTOR);
      if (sec) sections.push(sec);
    });
    if (sections.length !== cardsAll.length) sections = [];

    var firstCard = cardsAll[0];
    var rect = firstCard.getBoundingClientRect();
    var cardW = rect.width;
    var cardH = rect.height;
    log('first card size:', cardW + 'x' + cardH);
    if (!cardW || !cardH) return false;
    if (cardW > window.innerWidth * 1.05) {
      log('⚠️ card width > 105% viewport, ABORT');
      return true;
    }
    if (DRY_RUN) { initialized = true; return true; }

    var siblings = Array.prototype.slice.call(cardsAll);
    var firstGrid = firstCard.parentElement;
    var host = document.createElement('div');
    host.className = 'helix-deck-host';
    var maxIdxLocal = Math.min(VISIBLE - 1, siblings.length - 1);
    host.style.height = (cardH + maxIdxLocal * STACK_OFFSET_Y) + 'px';
    host.style.width  = (cardW + maxIdxLocal * STACK_OFFSET_X) + 'px';
    host.style.margin = '0 auto';
    host.style.display = 'block';

    firstGrid.insertBefore(host, firstCard);
    siblings.forEach(function (c) {
      c.style.width  = cardW + 'px';
      c.style.height = cardH + 'px';
      host.appendChild(c);
      var bg = window.getComputedStyle(c).backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        c.style.backgroundColor = '#ffffff';
      }
      c.style.visibility = 'visible';
    });

    sections.forEach(function (sec, i) {
      if (i > 0) { sec.style.display = 'none'; sec.setAttribute('data-deck-hidden', '1'); }
    });

    var deck = siblings.slice();
    var maxIdx  = Math.min(VISIBLE - 1, deck.length - 1);
    var halfOffX = maxIdx * STACK_OFFSET_X / 2;
    var halfOffY = maxIdx * STACK_OFFSET_Y / 2;

    function applyTransforms(animate) {
      deck.forEach(function (card, i) {
        if (i >= VISIBLE) {
          card.style.opacity = '0';
          card.style.pointerEvents = 'none';
          card.style.transform = 'translate(-50%, 0px) rotate(' + STACK_TILT + 'deg) scale(' + (1 - VISIBLE * STACK_SCALE) + ')';
          card.classList.remove('is-top');
          card.style.zIndex = String(deck.length - i);
          return;
        }
        var x = (maxIdx - i) * STACK_OFFSET_X - halfOffX;
        var y = (maxIdx - i) * STACK_OFFSET_Y - halfOffY;
        var scale = 1 - i * STACK_SCALE;
        var z = deck.length - i;
        card.style.transition = animate ? 'transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease' : '';
        card.style.opacity = '1';
        card.style.pointerEvents = (i === 0) ? 'auto' : 'none';
        card.style.zIndex = String(z);
        card.style.transform = 'translate(calc(-50% + ' + x + 'px), ' + y + 'px) rotate(' + STACK_TILT + 'deg) scale(' + scale + ')';
        if (i === 0) card.classList.add('is-top');
        else card.classList.remove('is-top');
      });
    }

    applyTransforms(false);
    if (sections[0]) sections[0].classList.add('helix-deck-ready');
    log('deck initialized:', deck.length);

    var drag = null;
    function onPointerDown(e) {
      var top = deck[0];
      if (!top || (!top.contains(e.target) && e.target !== top)) return;
      var interactive = e.target.closest && e.target.closest('a, button, [role="button"]');
      if (interactive) return;
      drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, startT: performance.now(), lastX: e.clientX, lastT: performance.now(), dx: 0, dy: 0, vx: 0 };
      top.classList.add('is-dragging');
      try { top.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.startX;
      drag.dy = e.clientY - drag.startY;
      var now = performance.now();
      var dt = now - drag.lastT;
      if (dt > 0) drag.vx = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX; drag.lastT = now;
      var top = deck[0]; if (!top) return;
      top.style.transition = 'none';
      top.style.transform = 'translate(calc(-50% + ' + (halfOffX + drag.dx) + 'px), ' + (halfOffY + drag.dy) + 'px) rotate(' + STACK_TILT + 'deg) scale(1)';
    }
    function onPointerUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var top = deck[0]; var dx = drag.dx; var vx = drag.vx; drag = null;
      if (top) { top.classList.remove('is-dragging'); try { top.releasePointerCapture(e.pointerId); } catch (err) {} }
      if (!top) return;
      if (Math.abs(dx) > cardW * FLY_THRESHOLD || Math.abs(vx) > FLY_VELOCITY) flyOut(top, dx >= 0 ? 1 : -1);
      else snapBack(top);
    }
    function snapBack(card) {
      card.style.transition = 'transform ' + SNAP_DURATION + 'ms cubic-bezier(0.22,1,0.36,1)';
      card.style.transform = 'translate(calc(-50% + ' + halfOffX + 'px), ' + halfOffY + 'px) rotate(' + STACK_TILT + 'deg) scale(1)';
    }
    var cycling = false;
    function flyOut(card, dir) {
      if (cycling) return;
      cycling = true;
      var flyX = dir * Math.min(cardW * 0.18, 80);
      card.style.transition = 'transform ' + FLY_DURATION + 'ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease';
      card.style.transform = 'translate(calc(-50% + ' + (halfOffX + flyX) + 'px), ' + halfOffY + 'px) rotate(' + STACK_TILT + 'deg) scale(1)';
      card.style.opacity = '0';
      var rest = deck.slice(1);
      rest.forEach(function (c, idx) {
        var nx = (maxIdx - idx) * STACK_OFFSET_X - halfOffX;
        var ny = (maxIdx - idx) * STACK_OFFSET_Y - halfOffY;
        var s  = 1 - idx * STACK_SCALE;
        c.style.transition = 'transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease';
        c.style.transform = 'translate(calc(-50% + ' + nx + 'px), ' + ny + 'px) rotate(' + STACK_TILT + 'deg) scale(' + s + ')';
      });
      setTimeout(function () {
        deck.push(deck.shift());
        var last = deck[deck.length - 1];
        last.style.transition = 'none';
        last.style.opacity = '0';
        last.style.transform = 'translate(-50%, 0px) rotate(' + STACK_TILT + 'deg) scale(' + (1 - VISIBLE * STACK_SCALE) + ')';
        requestAnimationFrame(function () { applyTransforms(true); cycling = false; });
      }, FLY_DURATION);
    }
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup',   onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('dragstart', function (e) { e.preventDefault(); });

    function makeArrow(dir) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'helix-deck-arrow helix-deck-arrow-' + (dir < 0 ? 'left' : 'right');
      btn.setAttribute('aria-label', dir < 0 ? '이전 카드' : '다음 카드');
      btn.innerHTML = dir < 0
        ? '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M16 4 L6 12 L16 20 Z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 4 L18 12 L8 20 Z"/></svg>';
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var top = deck[0]; if (top && !cycling) flyOut(top, dir);
      });
      return btn;
    }
    host.appendChild(makeArrow(-1));
    host.appendChild(makeArrow(+1));

    initialized = true;
    return true;
  }

  var retrying = false;
  function retry() {
    if (retrying || initialized) return;
    retrying = true;
    var n = 0;
    var iv = setInterval(function () {
      if (init() || ++n >= 30) { clearInterval(iv); retrying = false; }
    }, 200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else setTimeout(retry, 300);
  window.addEventListener('load', retry);
  window.Webflow = window.Webflow || [];
  window.Webflow.push(retry);
})();

/* ================================================================
   #helix-for-family — 자식 div 엇박 페이드 인 (스크롤 진입 트리거)
   - div-block-57 / div-block-132 의 직계 div 자식을 DOM 순서로 수집
   - IntersectionObserver 가 뷰포트 진입 감지 시 stagger delay 로
     .is-family-in 부착 (CSS 가 페이드/스케일/blur 풀림)
   - delay: 기본 220ms 간격, 홀수 인덱스에 +90ms 오프셋으로 엇박
   ================================================================ */
(function () {
  'use strict';

  var SELECTOR =
    '#helix-for-family > div.div-block-57 > div, ' +
    '#helix-for-family > div.div-block-132 > div';

  function bind() {
    var els = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
    if (!els.length) return false;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-family-in'); });
      return true;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = els.indexOf(entry.target);
        var delay = idx * 220 + (idx % 2 ? 90 : 0); /* 엇박 */
        setTimeout(function () {
          entry.target.classList.add('is-family-in');
        }, delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
    return true;
  }

  var tries = 0;
  function start() {
    if (bind()) return;
    if (++tries >= 30) return;
    setTimeout(start, 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', start);
})();

/* ================================================================
   의료진 카드 (.div-block-72) — 잔잔한 슬라이드 페이드 인
   - DOM 순서대로 150ms 일정 stagger
   - IntersectionObserver 진입 시 .is-doctor-in 부착
   ================================================================ */
(function () {
  'use strict';

  function bind() {
    /* CSS grid order 와 DOM 순서가 어긋나서, 시각 좌→우 순서를 명시. */
    var ORDER = ['ts-vet', 'sy-vet', 'hj-vet', 'ys-vet', 'sh-vet', 'si-vet', 'hs-vet', 'hc-vet'];
    var els = [];
    ORDER.forEach(function (cls) {
      var el = document.querySelector('.' + cls);
      if (el) els.push(el);
    });
    if (!els.length) return false;

    /* DOM 순서가 화면 좌→우 와 다른 경우가 있어 (CSS grid order 가
       DOM 과 어긋남) 화면상 시각 위치로 정렬. 행은 top, 같은 행은 left. */
    els.sort(function (a, b) {
      var ra = a.getBoundingClientRect();
      var rb = b.getBoundingClientRect();
      var rowGap = 40; /* 같은 행으로 간주할 top 허용 오차 */
      if (Math.abs(ra.top - rb.top) > rowGap) return ra.top - rb.top;
      return ra.left - rb.left;
    });

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-doctor-in'); });
      return true;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        /* 한 행이 3장 단위라 stagger 도 3 단위로 리셋 — 두번째 행이
           나중에 진입해도 카드별 누적 지연이 무한정 늘어나지 않음. */
        var idx = els.indexOf(entry.target);
        setTimeout(function () {
          entry.target.classList.add('is-doctor-in');
        }, (idx % 3) * 150);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
    return true;
  }

  var tries = 0;
  function start() {
    if (bind()) return;
    if (++tries >= 30) return;
    setTimeout(start, 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', start);
})();

/* ================================================================
   SUBHEADER — 호버 / 스크롤스파이 / 클릭 밑줄
   ================================================================ */
(function () {
  'use strict';

  function init() {
    var links = document.querySelectorAll('.subheader_click-area');
    if (!links.length) return;

    var entries = [];
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href.length < 2) return;
      var target = document.getElementById(href.slice(1)) ||
                   document.querySelector(href);
      if (target) entries.push({ link: a, target: target });
    });
    if (!entries.length) return;

    function setActive(link) {
      links.forEach(function (l) { l.classList.remove('is-active', 'w--current'); });
      if (link) link.classList.add('is-active');
    }

    var clickedAt = 0;
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;
        var t = document.getElementById(href.slice(1)) || document.querySelector(href);
        if (!t) return;
        e.preventDefault();
        setActive(a);
        clickedAt = Date.now();
        var hEl = document.querySelector('header.header, header, nav');
        var headerH = hEl ? hEl.getBoundingClientRect().height : 0;
        var sub = document.querySelector('.subheader');
        var subH = sub ? sub.getBoundingClientRect().height : 0;
        var y = t.getBoundingClientRect().top + window.pageYOffset - (headerH + subH + 12);
        window.scrollTo({ top: y, behavior: 'smooth' });
        if (history.replaceState) history.replaceState(null, '', href);
      });
    });

    /* 스크롤스파이 — 뷰포트 상단 30% 라인을 통과한 가장 최근 섹션 활성화 */
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (Date.now() - clickedAt < 700) return;
        var line = window.innerHeight * 0.3;
        var current = null;
        for (var i = 0; i < entries.length; i++) {
          var rect = entries[i].target.getBoundingClientRect();
          if (rect.top <= line) current = entries[i].link;
          else break;
        }
        if (!current && window.pageYOffset < 50) current = entries[0].link;
        if (current && !current.classList.contains('is-active')) setActive(current);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ================================================================
   MOTION HOLDER FIT — 좌측 콘텐츠 컬럼 높이에 맞춰 우측 모션 영역 고정
   - 제목 박스 top ~ 마지막 본문 박스 bottom 범위로 모션 홀더 높이 매칭
   - overflow:visible 로 펄스/이펙트 잘림 방지
   - resize / load 시 재계산, ScrollTrigger.refresh()
   ================================================================ */
(function () {
  'use strict';

  var WRAPPER_IDS = [
    'w-node-_8b35afef-acb7-2f39-45ec-7a0b3dfd6b90-3dfd6b90', /* 2구간 */
    'w-node-_6103b565-ef5e-f722-abf7-6712e4a7d351-e0c16bc5'  /* 3구간 */
  ];

  function fitOne(wrapperId) {
    var wrapper = document.getElementById(wrapperId);
    if (!wrapper) return false;

    var bodies = wrapper.querySelectorAll('.about_three_contents-box');
    if (!bodies.length) return false;
    var leftCol = bodies[0].parentElement;
    if (!leftCol) return false;

    /* 모션 홀더 — 좌측 컬럼이 아닌 형제 (또는 .diagram-place-holder) */
    var motionHolder = wrapper.querySelector('.diagram-place-holder');
    if (!motionHolder) {
      var rowChildren = leftCol.parentElement
        ? Array.prototype.slice.call(leftCol.parentElement.children)
        : [];
      for (var i = 0; i < rowChildren.length; i++) {
        if (rowChildren[i] !== leftCol) { motionHolder = rowChildren[i]; break; }
      }
    }
    if (!motionHolder) return false;

    /* 이전 inline 값 초기화 후 자연 위치 측정 */
    motionHolder.style.height   = '';
    motionHolder.style.top      = '';
    motionHolder.style.position = 'relative';
    motionHolder.style.overflow = 'visible';

    var leftRect    = leftCol.getBoundingClientRect();
    var motionRect  = motionHolder.getBoundingClientRect();
    var wrapperRect = wrapper.getBoundingClientRect();

    var targetH = leftRect.height;
    var shift   = motionRect.top - leftRect.top;

    /* 클램프 — 시각적 bottom 이 wrapper(=구간) bottom 을 절대 넘지 않도록.
       leftCol 이 wrapper 보다 더 아래로 늘어진 경우 height 를 줄임. */
    var visibleBottom = (motionRect.top - shift) + targetH;
    if (visibleBottom > wrapperRect.bottom) {
      targetH = Math.max(0, wrapperRect.bottom - (motionRect.top - shift));
    }

    if (targetH > 0) {
      motionHolder.style.height = targetH + 'px';
      motionHolder.style.top    = (-shift) + 'px';
    }
    return true;
  }

  function fitAll() {
    var anyOk = false;
    WRAPPER_IDS.forEach(function (id) { if (fitOne(id)) anyOk = true; });
    if (anyOk && window.ScrollTrigger && window.ScrollTrigger.refresh) {
      window.ScrollTrigger.refresh();
    }
  }

  /* 초기 + 폰트/이미지 로드 후 재계산 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fitAll);
  } else {
    fitAll();
  }
  window.addEventListener('load', fitAll);
  setTimeout(fitAll, 600);
  setTimeout(fitAll, 1500);

  /* 디바운스 resize */
  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(fitAll, 120);
  });
})();
