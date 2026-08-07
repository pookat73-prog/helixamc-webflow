/* ================================================================
   HELIX AMC — 특화진료(/specialty-care) 코멧 선  v3.1
   specialty/bootstrap.js 가 로드. 짝: specialty/specialty.css

   하는 일 — 사용자 목업(card_comet_v3) 그대로
   -----------------------------------------------------------------
   항목(.hst-item-wrap)에 마우스를 올리면
     · 한글명(.spec-item-name) 바로 아래에서 파란 선이 출발해 오른쪽
       끝까지 뻗고, 모서리를 둥글게 돌아 아래로 내려간다
     · 머리가 먼저 나가고 꼬리가 TAIL_LAG 만큼 늦게 따라오며 지워져서,
       짧은 선이 경로를 '기어가는' 것처럼 보인다
     · 머리가 바닥에 닿는 순간(=DURATION), 항목 사이에 이미 있는 회색
       구분선(.hst_sb_line)이 파랗게 켜지며 한 번 터진 뒤 가라앉는다
     · 마우스가 나가면 경로는 그냥 사라지고, 켜졌던 파란 밑변만 도로
       회색으로 꺼진다 (되감기 없음 — v3.1)

   v3.1 변경 — 접힐 때 되감기 제거
     마우스가 나갈 때 선을 거꾸로 다시 그리던 것을 뺐다. 사용자 요청:
     "접힐 때는 역순으로 선이 그어지던 걸 없애줘. 밑변 파란색이 켜졌던 게
      다시 꺼지는 것만 남겨줘."

   v3.0 변경 — 바닥 가로선을 '있던 회색 선' 으로
     따로 그린 파란 선이 항목 사이 회색 구분선과 위치가 달라 따로 놀았다.
     이제 그 회색 선을 찾아(nextElementSibling) 착지점으로 삼고, 그 선
     자체를 켠다. 같은 요소라 어긋날 수가 없다. 열의 맨 아래 항목처럼
     뒤에 회색 선이 없으면 대체 선(.hx-spec-edge)을 만들어 쓴다.

   v2.0 변경 — ㄱ자 경로 복원
     v1.0 은 한글명 아래 가로 밑줄만 그렸다. 목업의 핵심인 '오른쪽으로
     뻗고 → 모서리 돌아 → 내려가 → 닿는 자리가 켜진다' 가 통째로 빠져
     있었다. 목업 그대로 되돌림.

   ⚠ 글자는 1px 도 밀리지 않는다
     SVG 와 바닥 가로선은 CSS 에서 position:absolute 다. 자리를 차지하지
     않고 항목 위에 떠 있을 뿐이라, 항목 높이·간격·열 배치가 바뀌지 않는다.
     항목을 카드(테두리·배경)로 만들지도 않는다 — 사용자 지시.

   ⚠ 좌표는 하드코딩하지 않는다
     한글명 위치, 항목 오른쪽 끝, 회색 구분선 위치 — 셋 다 실제 DOM 을
     재서 구한다. 그래서 글자 길이·폰트·화면 폭이 달라져도 항상 맞는다.
     펼쳤을 때의 바닥은 강제로 펼쳐 보지 않고, scrollHeight 로 '펼치면
     늘어날 높이' 를 계산해 회색 선 위치에 더한다(강제 펼침은 되돌릴 때
     트랜지션이 재생돼 깜빡이는 사고가 있었다).

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
  var GRAY   = 'hst_sb_line';   /* 항목 사이 회색 구분선(Webflow HST_SB_line) */
  var MAXREV = 120;             /* specialty.css 의 hover max-height 와 같아야 함 */

  /* 이 항목 바로 아래에 붙어 있는 회색 구분선. 열의 맨 아래 항목엔 없다
     (회색 선 8개 / 항목 12개). 없으면 null → 대체 선을 만들어 쓴다. */
  function grayLine(wrap) {
    var n = wrap.nextElementSibling;
    return (n && n.className && n.className.indexOf(GRAY) !== -1) ? n : null;
  }

  var BLUE       = '#0075D6';
  var DURATION   = 480;   /* 머리가 바닥에 닿기까지(ms). specialty.css 의 펼침 .48s 와 같아야 함 */
  var TAIL_LAG   = 170;   /* 꼬리가 머리를 뒤늦게 쫓는 시간차. 클수록 '기어가는' 느낌 */
  var FLASH_HOLD = 380;   /* 발광 유지 후 은은한 선으로 가라앉기까지 */
  var RADIUS     = 12;    /* 꺾이는 모서리 라운드. 실제 칸이 164px(글 폭 119px)로
                             좁아 목업의 24 를 그대로 쓰면 모서리가 가로 구간을
                             다 먹는다. 폭에 맞춰 축소. */
  var DESKTOP_MIN = 992;  /* 이 폭 이상에서만 동작. specialty.css 와 같아야 함 */
  var GAP_Y      = 2;     /* 한글명 바닥에서 선까지 (기존 3px 틈 안) */

  /* 좁은 화면은 설명을 처음부터 펼쳐 두므로 선도 안 그린다.
     CSS 의 @media (min-width: 992px) 와 판정을 일치시킨다.

     ⚠ 예전엔 matchMedia('(hover:hover) and (pointer:fine)') 로 판정했다가
     크게 데였다. 사용자 PC 브라우저가 이 조건을 false 로 보고해(터치스크린
     노트북·기기 에뮬레이션·태블릿 모드 등에서 흔함) 선이 아예 안 그려졌고,
     같은 조건을 쓰던 CSS 의 접는 규칙까지 통째로 죽어 설명 12개가 항상
     펼쳐진 채 남았다. 폭 기준으로 바꾼 이유다. hover 판정으로 되돌리지 말 것. */
  function isDesktop() {
    return window.innerWidth >= DESKTOP_MIN;
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
    /* 세로 구간은 '오른쪽 안쪽 여백의 한가운데' 에 세운다.
       글 영역 경계(width - padRight)에 딱 세우면 실제 칸이 좁아(글 폭 119px)
       설명 글자의 오른쪽 끝을 선이 스친다. 목업은 320px 카드라 여유가 있었다.
       여백 절반만큼 바깥으로 밀어 글자와 떨어뜨린다. */
    var endX   = Math.round(wrapRect.width - padRight / 2);

    /* ── 착지점(targetY) ──
       회색 구분선이 있으면 '그 선의 위치' 가 곧 착지점이다. 지금은 접혀
       있으니, 펼쳐지면서 그 선이 내려갈 거리를 더해준다.

       ⚠ 예전처럼 잠깐 강제로 펼쳐서 재지 않는다. 되돌릴 때 트랜지션이
       재생돼 깜빡이는 사고가 있었다. scrollHeight 는 max-height:0 +
       overflow:hidden 상태에서도 '내용의 실제 높이' 를 알려주므로,
       손대지 않고 계산만으로 구할 수 있다. */
    var revTarget = Math.min(reveal.scrollHeight, MAXREV);
    var revNow    = reveal.getBoundingClientRect().height;
    var mtNow     = parseFloat(getComputedStyle(reveal).marginTop) || 0;
    var grow      = (revTarget - revNow) + (5 - mtNow);   /* 펼치면 늘어날 높이 */

    var gl = grayLine(wrap);
    var targetY;
    if (gl) {
      targetY = Math.round(gl.getBoundingClientRect().top - wrapRect.top + grow);
    } else {
      targetY = Math.round(wrapRect.height + grow);
    }
    item.gl = gl;

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

    /* 켤 대상: 회색 구분선이 있으면 그것, 없으면 대체 선.
       대체 선은 회색 선과 같은 모양이 되도록 항목 전체 폭으로 깐다. */
    if (gl) {
      item.lit = gl;
      item.edge.style.display = 'none';
    } else {
      item.lit = item.edge;
      item.edge.style.display = '';
      item.edge.style.left  = '0px';
      item.edge.style.width = Math.round(wrapRect.width) + 'px';
      item.edge.style.top   = targetY + 'px';
    }
    return true;
  }

  /* a(경로 시작 쪽 끝) ~ b(경로 끝 쪽 끝) 구간만 보이도록. 목업과 동일한 식. */
  function applyDash(item, a, b) {
    var seg = Math.max(0, b - a);
    item.path.style.strokeDasharray  = seg + ' ' + item.len;
    item.path.style.strokeDashoffset = b + item.len - 2 * a;

    /* ⚠ 길이 0 일 때 반드시 숨긴다.
       stroke-linecap:round 라서 길이가 0 인 dash 도 둥근 끝처리 때문에
       '점' 하나로 그려진다. 그대로 두면 애니메이션이 끝난 뒤 선이 출발했던
       자리에 파란 점이 남는다(사용자 지적). 움직이는 동안의 둥근 끝은
       살려야 하므로 linecap 은 그대로 두고, 길이 0 인 순간만 감춘다. */
    item.path.style.visibility = seg > 0.5 ? 'visible' : 'hidden';
  }

  function stop(item) {
    if (item.raf) { cancelAnimationFrame(item.raf); item.raf = null; }
    clearTimeout(item.flashTimer);
  }

  function lightEdge(item) {
    if (!item.lit) return;
    item.lit.classList.add('hx-lit', 'hx-flash');
    item.flashTimer = setTimeout(function () {
      if (item.lit) item.lit.classList.remove('hx-flash');   /* 발광은 가라앉고 은은한 선으로 */
    }, FLASH_HOLD);
  }

  function darkenEdge(item) {
    if (!item.lit) return;
    item.lit.classList.remove('hx-lit', 'hx-flash');
  }

  /* 코멧 한 번 보내기(펼칠 때만). 머리가 앞서고 꼬리가 TAIL_LAG 만큼 늦게
     따라오며 지워져, 끝나면 경로가 저절로 사라진다.

     ⚠ 되감기(역주행)는 없다. 마우스가 나갈 때 선을 거꾸로 다시 그리던 것을
     사용자 요청으로 뺐다("접힐 때 역순으로 선이 그어지던 걸 없애줘").
     나갈 때는 경로를 그냥 감추고, 켜졌던 파란 밑변만 도로 꺼진다. */
  function runWorm(item) {
    var start = performance.now();
    var total = DURATION + TAIL_LAG;
    var L = item.len;

    function frame(now) {
      var t = now - start;
      var head = ease(Math.min(Math.max(t / DURATION, 0), 1));
      var tail = ease(Math.min(Math.max((t - TAIL_LAG) / DURATION, 0), 1));
      applyDash(item, L * tail, L * head);

      if (t < total) {
        item.raf = requestAnimationFrame(frame);
      } else {
        item.raf = null;
        applyDash(item, L, L);   /* 꼬리가 머리를 따라잡아 경로가 사라진 상태 */
      }
    }
    item.raf = requestAnimationFrame(frame);
  }

  function enter(item) {
    stop(item);
    /* ⚠ 로드 시점이 아니라 '마우스가 올라온 시점' 에 잰다.
       로더가 css 를 <link> 로 붙이는 건 비동기라, 로드 직후엔 우리 css 가
       아직 적용 안 됐을 수 있다. 그 상태에서 재면
         · 항목에 position:relative 가 없어 기준점이 엉뚱한 조상으로 잡히고
         · 설명이 안 접혀 있어 바닥을 잘못 읽는다
       hover 시점엔 css·폰트·레이아웃이 모두 확정돼 있어 이 문제가 없다.
       12개 항목 × hover 1회당 측정 1회라 비용도 무시할 수준. */
    item.measured = measure(item);
    if (!item.measured) return;

    if (item.lit) item.lit.classList.remove('hx-flash');

    if (reducedMotion()) { lightEdge(item); return; }

    applyDash(item, 0, 0);
    runWorm(item);

    /* 머리가 바닥에 닿는 시점(꼬리가 따라붙기 전)에 가로선 점등 */
    item.flashTimer = setTimeout(function () { lightEdge(item); }, DURATION);
  }

  function leave(item) {
    stop(item);
    darkenEdge(item);          /* 파란 밑변 → 원래 회색으로 (CSS 트랜지션 .28s) */
    if (item.measured) applyDash(item, 0, 0);   /* 경로는 되감지 않고 그냥 감춤 */
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
                 edge: edge, lit: null, gl: null,
                 raf: null, flashTimer: null, len: 0, measured: false };

    /* 여기서는 재지 않는다 — enter() 가 hover 시점에 잰다(위 주석 참고). */
    wrap.addEventListener('mouseenter', function () { enter(item); });
    wrap.addEventListener('mouseleave', function () { leave(item); });
    return item;
  }

  var items = [];

  /* 화면이 바뀌면 다음 hover 때 다시 재도록 표시만 해둔다.
     미리 재두지 않는 이유는 enter() 의 주석과 같다. */
  function invalidate() {
    items.forEach(function (it) { it.measured = false; });
  }

  function init() {
    if (!isDesktop()) return;

    var wraps = document.querySelectorAll(WRAP);
    if (!wraps.length) {
      console.warn('[specialty] ' + WRAP + ' 요소를 못 찾음 — Webflow 에서 클래스 이름이 바뀌었는지 확인');
      return;
    }

    for (var i = 0; i < wraps.length; i++) {
      var it = setup(wraps[i]);
      if (it) items.push(it);
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(invalidate, 150);
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
