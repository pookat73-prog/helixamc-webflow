/* ================================================================
   ABOUT — NODES CLUSTER
   5 노드 + 얽힌 연결선. 한 노드가 활성화되면 커지고 바깥으로
   드리프트하면서 클러스터 전체가 그 방향으로 회전.
   라인은 매 프레임 노드 중심 좌표로 갱신 → 절대 안 떨어짐.
   ================================================================ */

(function () {
  'use strict';

  var CONTAINER_ID = 'w-node-_810f296c-ac78-274c-a805-e5d2fa51c6f8-e0c16bc5';
  var CONTAINER_CLASS = 'diagram-place-holder';

  /* viewBox 좌표계: 200 x 200, 중심 (100,100) */
  var VB = 200;
  var CX = 100;
  var CY = 100;

  /* 노드 베이스 위치(클러스터 형상). 크고 작은 5개, 적당히 겹침 허용. */
  var NODES = [
    { x:  98, y:  72, r: 14 },  // 0  상단 큰 노드
    { x:  72, y: 102, r:  9 },  // 1  좌측
    { x: 128, y:  98, r: 11 },  // 2  우상
    { x:  92, y: 124, r:  7 },  // 3  중앙 하단 작은
    { x: 124, y: 132, r: 10 }   // 4  우하
  ];

  /* 적당히 얼키설키한 연결 (6선) */
  var LINKS = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2]
  ];

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  function whenGsap(fn, tries) {
    tries = tries || 0;
    if (window.gsap) return fn(window.gsap);
    if (tries > 100) { console.warn('[nodes-cluster] gsap 미로드'); return; }
    setTimeout(function () { whenGsap(fn, tries + 1); }, 50);
  }

  function build(host) {
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'helix-nodes-svg');
    svg.setAttribute('viewBox', '0 0 ' + VB + ' ' + VB);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    /* 회전 그룹 (클러스터 중심 기준) */
    var gRot = document.createElementNS(svgNS, 'g');
    gRot.setAttribute('class', 'helix-nodes-rot');
    gRot.setAttribute('transform', 'rotate(0 ' + CX + ' ' + CY + ')');
    svg.appendChild(gRot);

    /* 라인 먼저 (노드 아래에) */
    var lineEls = LINKS.map(function (pair) {
      var ln = document.createElementNS(svgNS, 'line');
      ln.setAttribute('class', 'helix-nodes-link');
      ln.setAttribute('data-a', pair[0]);
      ln.setAttribute('data-b', pair[1]);
      gRot.appendChild(ln);
      return ln;
    });

    /* 노드 */
    var dotEls = NODES.map(function (n, i) {
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('class', 'helix-nodes-dot');
      c.setAttribute('cx', n.x);
      c.setAttribute('cy', n.y);
      c.setAttribute('r', n.r);
      c.setAttribute('data-i', i);
      gRot.appendChild(c);
      return c;
    });

    host.appendChild(svg);
    return { svg: svg, gRot: gRot, lineEls: lineEls, dotEls: dotEls };
  }

  /* 노드 i 의 현재 (회전 전) 위치 = base + offset[i] */
  function syncLines(state) {
    for (var k = 0; k < state.lineEls.length; k++) {
      var ln = state.lineEls[k];
      var a = +ln.getAttribute('data-a');
      var b = +ln.getAttribute('data-b');
      var pa = state.pos[a];
      var pb = state.pos[b];
      ln.setAttribute('x1', pa.x);
      ln.setAttribute('y1', pa.y);
      ln.setAttribute('x2', pb.x);
      ln.setAttribute('y2', pb.y);
    }
  }

  function applyNode(state, i) {
    var dot = state.dotEls[i];
    var p = state.pos[i];
    dot.setAttribute('cx', p.x);
    dot.setAttribute('cy', p.y);
    dot.setAttribute('r', NODES[i].r * state.scale[i]);
    dot.style.fill = state.active === i ? '#f4f7fb' : '#0075d6';
  }

  function animate(gsap, state) {
    var tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });

    /* 활성화 순서 (시각적 회전 흐름 자연스럽게) */
    var ORDER = [0, 2, 4, 3, 1];
    var clusterRot = { v: 0 };

    ORDER.forEach(function (i) {
      var n = NODES[i];
      /* 바깥쪽 방향 = 중심에서 노드로 향하는 단위벡터 */
      var dx = n.x - CX, dy = n.y - CY;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ox = (dx / len) * 18;
      var oy = (dy / len) * 18;

      /* 회전 델타: 노드 위치별 자연스러운 방향 (각도 기반) */
      var angle = Math.atan2(dy, dx);
      var rotDelta = Math.sin(angle) * 28 + (i % 2 ? 12 : -10);

      var sub = gsap.timeline();

      /* 1) 활성 노드 커지고 바깥쪽으로 호 드리프트 + 색 변경 */
      sub.to(state.scale, {
        ['' + i]: 1.55,
        duration: 0.55,
        onStart: function () { state.active = i; applyNode(state, i); }
      }, 0);
      sub.to(state.offset[i], {
        x: ox, y: oy,
        duration: 1.1,
        ease: 'sine.inOut',
        onUpdate: function () {
          state.pos[i].x = NODES[i].x + state.offset[i].x;
          state.pos[i].y = NODES[i].y + state.offset[i].y;
          applyNode(state, i);
          syncLines(state);
        }
      }, 0);

      /* 2) 클러스터 회전 (살짝 lag) */
      sub.to(clusterRot, {
        v: clusterRot.v + rotDelta,
        duration: 1.2,
        ease: 'sine.inOut',
        onUpdate: function () {
          state.gRot.setAttribute(
            'transform',
            'rotate(' + clusterRot.v.toFixed(3) + ' ' + CX + ' ' + CY + ')'
          );
        }
      }, 0.15);

      /* 3) 홀드 */
      sub.to({}, { duration: 0.3 });

      /* 4) 노드 원위치 + 원크기 + 원색 (회전은 유지) */
      sub.to(state.offset[i], {
        x: 0, y: 0,
        duration: 0.7,
        ease: 'sine.inOut',
        onUpdate: function () {
          state.pos[i].x = NODES[i].x + state.offset[i].x;
          state.pos[i].y = NODES[i].y + state.offset[i].y;
          applyNode(state, i);
          syncLines(state);
        }
      });
      sub.to(state.scale, {
        ['' + i]: 1,
        duration: 0.5,
        onComplete: function () {
          state.active = -1;
          applyNode(state, i);
        }
      }, '<');

      tl.add(sub);
    });

    return tl;
  }

  function findHost() {
    return document.querySelector('.' + CONTAINER_CLASS) ||
           document.getElementById(CONTAINER_ID) ||
           document.querySelector('[id="' + CONTAINER_ID + '"]');
  }

  function init(tries) {
    tries = tries || 0;
    var host = findHost();
    if (!host) {
      if (tries < 40) { /* DOM 늦게 그려질 수 있음 (~10s 한도) */
        setTimeout(function () { init(tries + 1); }, 250);
      } else {
        console.warn('[nodes-cluster] container not found:', CONTAINER_ID);
      }
      return;
    }
    if (host.querySelector('.helix-nodes-svg')) return; /* 중복 가드 */

    var built = build(host);

    var state = {
      svg: built.svg,
      gRot: built.gRot,
      lineEls: built.lineEls,
      dotEls: built.dotEls,
      pos: NODES.map(function (n) { return { x: n.x, y: n.y }; }),
      offset: NODES.map(function () { return { x: 0, y: 0 }; }),
      scale: NODES.map(function () { return 1; }),
      active: -1
    };

    /* 초기 그리기 */
    state.dotEls.forEach(function (_, i) { applyNode(state, i); });
    syncLines(state);

    whenGsap(function (gsap) { animate(gsap, state); });
  }

  ready(init);
})();
