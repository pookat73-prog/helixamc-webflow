/* ================================================================
   HELIX AMC — 특화진료(/specialty-care) 코멧 선  v2.0
   specialty/bootstrap.js 가 로드. 짝: specialty/specialty.css

   하는 일 — 사용자 목업(card_comet_v3) 그대로
   -----------------------------------------------------------------
   항목(.hst-item-wrap)에 마우스를 올리면
     · 한글명(.spec-item-name) 바로 아래에서 파란 선이 출발해 오른쪽
       끝까지 뻗고, 모서리를 둥글게 돌아 아래로 내려간다
     · 머리가 먼저 나가고 꼬리가 TAIL_LAG 만큼 늦게 따라오며 지워져서,
       짧은 선이 경로를 '기어가는' 것처럼 보인다
     · 머리가 바닥에 닿는 순간(=DURATION) 그 자리에 가로선이 켜지고
       한 번 밝게 터진 뒤, 380ms 뒤 은은한 선으로 가라앉는다
     · 마우스가 나가면 선이 왔던 길로 되돌아 나가고 가로선도 꺼진다

   v2.0 변경 — ㄱ자 경로 복원
     v1.0 은 한글명 아래 가로 밑줄만 그렸다. 목업의 핵심인 '오른쪽으로
     뻗고 → 모서리 돌아 → 내려가 → 닿는 자리가 켜진다' 가 통째로 빠져
     있었다. 목업 그대로 되돌림.

   ⚠ 글자는 1px 도 밀리지 않는다
     SVG 와 바닥 가로선은 CSS 에서 position:absolute 다. 자리를 차지하지
     않고 항목 위에 떠 있을 뿐이라, 항목 높이·간격·열 배치가 바뀌지 않는다.
     항목을 카드(테두리·배경)로 만들지도 않는다 — 사용자 지시.

   ⚠ 좌표는 하드코딩하지 않는다
     한글명 위치, 항목 오른쪽 끝, 펼쳤을 때의 바닥 — 셋 다 실제 DOM 을
     재서 구한다. 그래서 글자 길이·폰트·화면 폭이 달라져도 항상 맞는다.
     바닥은 '펼친 상태'의 위치라야 하는데 평소엔 접혀 있으므로, 잠깐
     펼친 모양으로 만들어 재고 즉시 되돌린다(같은 실행 흐름 안이라
     화면에는 안 보임 — 목업의 FLIP 기법 그대로).

   ⚠ 이 파일은 '선'만 담당한다
     설명·CTA 의 펼침/접힘은 specialty.css 의 :hover 규칙이 단독으로 한다.
     그래서 이 파일이 CDN 에서 못 와도 글이 안 갇힌다. 여기에 펼침 로직을
     옮기지 말 것.

   ⚠ 클래스 이름 주의 (v1.0 사고 재발 방지)
     항목 상자의 Webflow 클래스는 `HST-Item-Wrap` → 게시되면
     `.hst-item-wrap`. 예전 CSS 가 있지도 않은 `.spec-item-wrap` 을
     붙잡고 있어 PC 에서 설명이 통째로 안 보였다. Designer 에서 이 이름을
     바꾸면 여기와 specialty.css 두 곳을 같이 고쳐야 한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixSpecialtyCometInit) return;
  window.__helixSpecialtyCometInit = true;

  var NS     = 'http://www.w3.org/2000/svg';
  var WRAP   = '.hst-item-wrap';
  var NAME   = '.spec-item-name';
  var REVEAL = '.spec-item-reveal';

  var BLUE       = '#0075D6';
  var DURATION   = 480;   /* 머리가 바닥에 닿기까지(ms). specialty.css 의 펼침 .48s 와 같아야 함 */
  var TAIL_LAG   = 170;   /* 꼬리가 머리를 뒤늦게 쫓는 시간차. 클수록 '기어가는' 느낌 */
  var FLASH_HOLD = 380;   /* 발광 유지 후 은은한 선으로 가라앉기까지 */
  var RADIUS     = 20;    /* 꺾이는 모서리 라운드 */
  var GAP_Y      = 2;     /* 한글명 바닥에서 선까지 (기존 3px 틈 안) */

  /* 마우스가 없는 기기(휴대폰·태블릿)는 설명을 처음부터 펼쳐 두므로 선도 안 그린다.
     CSS 의 @media (hover:none) 과 판정을 일치시킨다. */
  function hasHover() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* easeOutCubic — 빠르게 튀어나갔다가 서서히 멈춤 */
  function ease(x) { return 1 - Math.pow(1 - x, 3); }

  /* ── 경로 좌표 측정 ────────────────────────────────────────────
     반환: {d, endX, targetY, startX} — 모두 항목 상자 기준 좌표.
     바닥(targetY)은 '펼친 상태'의 위치라야 하므로, 접혀 있으면 잠깐
     펼친 모양으로 만들어 재고 즉시 되돌린다. 같은 실행 흐름 안에서
     끝나므로 브라우저가 중간 상태를 그리지 않는다(깜빡임 없음). */
  function measure(item) {
    var wrap = item.wrap, name = item.name, reveal = item.reveal;
    var wrapRect = wrap.getBoundingClientRect();
    if (!wrapRect.width) return false;

    var cs = getComputedStyle(wrap);
    var padRight = parseFloat(cs.paddingRight) || 0;

    var nameRect = name.getBoundingClientRect();
    var startX = Math.round(nameRect.left - wrapRect.left);
    var y0     = Math.round(nameRect.bottom - wrapRect.top + GAP_Y);
    var endX   = Math.round(wrapRect.width - padRight);

    /* 펼친 상태의 바닥을 잰다. 이미 펼쳐져 있으면(=마우스가 올라가 있으면)
       손대지 않고 그대로 읽는다. */
    var targetY;
    var expanded = reveal.getBoundingClientRect().height > 1;
    if (expanded) {
      targetY = Math.round(reveal.getBoundingClientRect().bottom - wrapRect.top);
    } else {
      /* ⚠ 되돌리는 순서가 중요하다.
         펼친 값을 잰 뒤 transition 해제까지 한꺼번에 걷어내면, 그 순간
         '120px → 0' 이 CSS 의 .48s 트랜지션을 타고 재생된다. 즉 페이지가
         뜨자마자 설명이 잠깐 펼쳐졌다 접히는 깜빡임이 생긴다(실측 확인:
         항목 높이가 잠시 125 → 126.9 로 뜸).
         그래서 ① 크기만 먼저 되돌리고 ② 강제 리플로우로 '접힘'을
         트랜지션 없이 확정한 뒤 ③ 마지막에 transition 을 풀어준다. */
      reveal.style.transition = 'none';
      reveal.style.maxHeight  = '120px';   /* CSS 의 hover 값과 동일 */
      reveal.style.marginTop  = '5px';
      reveal.style.opacity    = '1';
      targetY = Math.round(reveal.getBoundingClientRect().bottom - wrapRect.top);

      reveal.style.maxHeight = '';         /* ① 크기만 원복 */
      reveal.style.marginTop = '';
      reveal.style.opacity   = '';
      void reveal.offsetHeight;            /* ② 트랜지션 없이 접힘 확정 */
      reveal.style.transition = '';        /* ③ 이제 트랜지션 복구 */
    }

    if (endX - startX < RADIUS * 2 || targetY - y0 < RADIUS * 2) return false;

    var cornerX = endX - RADIUS;
    item.d = 'M' + startX + ',' + y0 +
             ' L' + cornerX + ',' + y0 +
             ' A' + RADIUS + ',' + RADIUS + ' 0 0 1 ' + endX + ',' + (y0 + RADIUS) +
             ' L' + endX + ',' + targetY;

    item.svg.setAttribute('width',  wrapRect.width);
    item.svg.setAttribute('height', targetY + 4);
    item.svg.setAttribute('viewBox', '0 0 ' + wrapRect.width + ' ' + (targetY + 4));
    item.path.setAttribute('d', item.d);
    item.len = item.path.getTotalLength();

    /* 바닥 가로선 — 선이 닿는 높이에, 글자 왼쪽부터 항목 오른쪽 끝까지 */
    item.edge.style.left  = startX + 'px';
    item.edge.style.width = (endX - startX) + 'px';
    item.edge.style.top   = targetY + 'px';
    return true;
  }

  /* a(경로 시작 쪽 끝) ~ b(경로 끝 쪽 끝) 구간만 보이도록. 목업과 동일한 식. */
  function applyDash(item, a, b) {
    var seg = Math.max(0, b - a);
    item.path.style.strokeDasharray  = seg + ' ' + item.len;
    item.path.style.strokeDashoffset = b + item.len - 2 * a;
  }

  function stop(item) {
    if (item.raf) { cancelAnimationFrame(item.raf); item.raf = null; }
    clearTimeout(item.flashTimer);
  }

  function lightEdge(item) {
    item.edge.classList.add('is-lit', 'is-flash');
    item.flashTimer = setTimeout(function () {
      item.edge.classList.remove('is-flash');   /* 강한 발광은 가라앉고 은은한 선으로 */
    }, FLASH_HOLD);
  }

  /* forward=true 펼침 / false 접힘. 목업의 runWorm 과 같은 진행식. */
  function runWorm(item, forward) {
    var start = performance.now();
    var total = DURATION + TAIL_LAG;
    var L = item.len;

    function frame(now) {
      var t = now - start;
      var head = ease(Math.min(Math.max(t / DURATION, 0), 1));
      var tail = ease(Math.min(Math.max((t - TAIL_LAG) / DURATION, 0), 1));

      if (forward) applyDash(item, L * tail, L * head);
      else         applyDash(item, L * (1 - head), L * (1 - tail));

      if (t < total) {
        item.raf = requestAnimationFrame(frame);
      } else {
        item.raf = null;
        applyDash(item, forward ? L : 0, forward ? L : 0);  /* 끝나면 완전히 사라짐 */
      }
    }
    item.raf = requestAnimationFrame(frame);
  }

  function enter(item) {
    stop(item);
    if (!item.measured) item.measured = measure(item);
    if (!item.measured) return;

    item.edge.classList.remove('is-flash');

    if (reducedMotion()) { lightEdge(item); return; }

    applyDash(item, 0, 0);
    runWorm(item, true);

    /* 머리가 바닥에 닿는 시점(꼬리가 따라붙기 전)에 가로선 점등 */
    item.flashTimer = setTimeout(function () { lightEdge(item); }, DURATION);
  }

  function leave(item) {
    stop(item);
    item.edge.classList.remove('is-lit', 'is-flash');
    if (!item.measured) return;
    if (reducedMotion()) { applyDash(item, 0, 0); return; }
    runWorm(item, false);
  }

  function setup(wrap) {
    var name   = wrap.querySelector(NAME);
    var reveal = wrap.querySelector(REVEAL);
    if (!name || !reveal) return null;

    var svg = wrap.querySelector('.hx-spec-svg');
    if (!svg) {
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'hx-spec-svg');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('aria-hidden', 'true');
      wrap.appendChild(svg);
    }

    var path = svg.querySelector('path');
    if (!path) {
      path = document.createElementNS(NS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', BLUE);
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
    }

    var edge = wrap.querySelector('.hx-spec-edge');
    if (!edge) {
      edge = document.createElement('i');
      edge.className = 'hx-spec-edge';
      edge.setAttribute('aria-hidden', 'true');
      wrap.appendChild(edge);
    }

    var item = { wrap: wrap, name: name, reveal: reveal, svg: svg, path: path,
                 edge: edge, raf: null, flashTimer: null, len: 0, measured: false };

    item.measured = measure(item);
    if (item.measured) applyDash(item, 0, 0);

    wrap.addEventListener('mouseenter', function () { enter(item); });
    wrap.addEventListener('mouseleave', function () { leave(item); });
    return item;
  }

  var items = [];

  function remeasure() {
    items.forEach(function (it) {
      if (it.raf || it.wrap.matches(':hover')) return;   /* 움직이는 중엔 건드리지 않음 */
      it.measured = measure(it);
      if (it.measured) applyDash(it, 0, 0);
    });
  }

  function init() {
    if (!hasHover()) return;

    var wraps = document.querySelectorAll(WRAP);
    if (!wraps.length) {
      console.warn('[specialty] ' + WRAP + ' 요소를 못 찾음 — Webflow 에서 클래스 이름이 바뀌었는지 확인');
      return;
    }

    for (var i = 0; i < wraps.length; i++) {
      var it = setup(wraps[i]);
      if (it) items.push(it);
    }

    /* 폰트가 늦게 도착하면 글자 위치·높이가 달라진다 → 도착 후 다시 잰다. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(remeasure);
    }
    window.addEventListener('load', remeasure);

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(remeasure, 150);
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
