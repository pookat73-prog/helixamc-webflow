/* ================================================================
   HELIX AMC — 특화진료(/specialty-care) 코멧 선  v4.1
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

   v4.1 변경 — 재둔 값이 낡아 생기던 두 증상
     ① 방사선 치료·스텐트 시술·FMT (여유가 있는 열들의 맨 아래 항목) 만 파란
        선이 바닥선과 안 맞고 위에 그려짐. 여유 없는 열(비강경)은 멀쩡.
     ② 중간 항목들이 마우스를 올리면 오히려 줄어듦.

     원인은 하나 — 좌표를 로드 직후 한 번만 재 두는데, 그 뒤에 글자 높이가
     달라지는 것(늦게 도착하는 폰트)을 못 따라갔다.
       ① 마지막 항목의 착지점은 '열 바닥' 이고 그 자리는 가장 긴 열이 정한다.
          글자가 커지면 가장 긴 열이 더 자라 나머지 열의 여유가 늘어나는데,
          재둔 바닥은 그대로라 선이 위에 남는다. 여유가 큰 열일수록 더 틀어짐.
          실측: 글줄 높이가 뒤늦게 13px 커지자 13 / 26 / 39px 어긋남.
       ② 줄일 여백을 '재둔 설명 높이' 로 잡는데 그 값이 실제보다 크면
          늘어나는 것보다 더 줄여서 카드가 작아진다.

     고침
       · hover 할 때마다 다시 잰다. v4.0 으로 펼침이 높이를 안 바꾸게 된
         덕분에, #1377 이 피하려던 '접히는 중 부풀어 있는 상태' 위험이 없어졌다.
       · 늘어날 높이를 '지금 높이' 로 빼서 구하지 않고 평상시 상수로 계산한다
         (접히는 도중 재도 값이 안 흔들림 → ② 원천 차단).
       · 높이가 실제로 변하는 순간을 ResizeObserver 로 지켜본다.
         '폰트가 언제 오는지' 를 짐작하지 않는다.

     덤 — 여백을 고정 85px 로 넉넉히 잡던 것을 '가장 긴 설명 + 10px' 로 바꿨다.
     사용자 지적("표가 전체적으로 늘어나서") 대로 표가 늘 길어지기 때문.
     넓은 화면에서는 대개 Webflow 원래 60px 그대로다.

   v4.0 변경 — 펼쳐도 아래가 안 밀린다
     증상: FMT 에 올렸다가 신장 투석으로 넘어가면 파란 선이 카드가 펼쳐지는
     만큼 아래로 밀렸다. FMT 는 열의 맨 아래라 '떠 있는 대체 선'을 써서
     제자리에 있는데, 신장 투석은 글 흐름 안에 있는 진짜 회색 구분선을 켜기
     때문에 설명이 펼쳐진 높이만큼 그대로 떠밀린 것.

     고침: 항목 아래에 원래 비어 있던 여백(padding-bottom)을 펼치는 만큼
     줄인다. 항목 전체 높이가 그대로라 아래 회색 선도, 그 아래 항목도
     밀리지 않는다. 여백보다 설명이 길면 남는 만큼(residual)만 밀리고,
     선의 착지점도 그 남는 만큼만 내려가도록 계산에 반영한다.
     (v4.1 부터 여백 크기를 '가장 긴 설명 + 10px' 로 맞추므로 residual 은 0)

     ⚠ 재는 것과 적용하는 것을 나눠 둔다. measure() 는 값만 계산해 기억하고,
     실제로 여백을 줄이는 건 enter() 가 한다. measureAll() 이 평상시에도
     measure() 를 돌리기 때문에, 여기서 여백을 건드리면 쉬고 있는 항목까지
     줄어든다.

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
  var COL    = '.hst_col';      /* 항목들을 담은 세로 열(Webflow HST_Col) */
  var GRID   = '.hst_grid';     /* 네 열을 담은 표(Webflow HST_Grid). 열 바닥을 정하는 주체 */
  var MAXREV = 200;             /* specialty.css 의 hover max-height 와 같아야 함.
                                   실제 펼침 높이는 JS 가 정확히 못박으므로 이 값은
                                   '설마' 를 막는 상한일 뿐 — 너무 낮으면 설명이 잘린다. */

  /* 이 항목 바로 아래에 붙어 있는 회색 구분선. 열의 맨 아래 항목엔 없다
     (회색 선 8개 / 항목 12개). 없으면 null → 대체 선을 만들어 쓴다. */
  function grayLine(wrap) {
    var n = wrap.nextElementSibling;
    return (n && n.className && n.className.indexOf(GRAY) !== -1) ? n : null;
  }

  /* 펼쳤을 때 설명이 차지할 높이. scrollHeight 는 정수로 반올림돼 실제와 최대
     1px 남짓 어긋나고, 그 차이가 그대로 카드 높이 흔들림으로 남는다. 그래서
     자식들의 실제 높이를 소수점까지 더해서 구한다(줄간격은 flex gap). */
  function revealHeight(reveal) {
    var kids = reveal.children, n = kids.length;
    if (!n) return reveal.scrollHeight;
    var gap = parseFloat(getComputedStyle(reveal).rowGap) || 0;
    var h = 0;
    for (var i = 0; i < n; i++) h += kids[i].getBoundingClientRect().height;
    return h + gap * (n - 1);
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
  var MIN_PAD    = 10;    /* 펼침을 아래 여백으로 흡수하고도 남겨 둘 최소 여백.
                             설명 마지막 줄이 회색 구분선에 딱 붙지 않게 하는 숨통.
                             여백 크기를 '가장 긴 설명 + 이 값' 으로 잡으므로,
                             키우면 표가 그만큼 길어진다. */
  var WF_PAD     = 60;    /* Webflow 원래 아래 여백. 설명이 짧아 더 필요 없으면
                             이 값 그대로 둬서 표가 안 길어지게 한다. */
  var TOAST_MS   = 1800;  /* 토스트 노출 시간 */

  /* 항목별 상세페이지 주소. 아직 없으므로 전부 비어 있고, 클릭하면
     "준비중입니다" 토스트만 뜬다. 상세페이지가 생기면 한글명을 키로
     여기에 주소만 넣으면 그 항목만 이동으로 바뀐다.
     예) '종양 색전술': '/specialty/tumor-embolization' */
  var LINKS = {};

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

  /* ── '자세히 보기 →' 클릭 안내 토스트 ──
     진료과목 페이지(services/dept-nav.js)와 같은 동작. 요소 하나를 만들어
     재사용하고, 연타해도 다시 뜨도록 리플로우로 트랜지션을 재시작한다. */
  var _toastEl, _toastTimer;
  function showToast(msg) {
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.className = 'hx-toast';
      (document.body || document.documentElement).appendChild(_toastEl);
    }
    _toastEl.textContent = msg;
    void _toastEl.offsetWidth;            /* 연타 시 트랜지션 재시작 */
    _toastEl.classList.add('is-on');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { _toastEl.classList.remove('is-on'); }, TOAST_MS);
  }

  /* 클릭은 문서에 한 번만 걸어 위임 처리한다. 항목마다 걸지 않으므로
     Webflow 가 요소를 다시 그려도 계속 동작한다.
     ⚠ 코멧(선)과 달리 화면 폭을 가리지 않는다 — 좁은 화면에서는 설명이
     처음부터 펼쳐져 있어 '자세히 보기' 를 바로 누를 수 있기 때문. */
  function initCta() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var cta = (t && t.closest) ? t.closest('.spec-item-cta') : null;
      if (!cta) return;

      e.preventDefault();

      var wrap = cta.closest(WRAP);
      var nameEl = wrap && wrap.querySelector(NAME);
      var key = nameEl ? (nameEl.textContent || '').trim() : '';
      var url = LINKS[key];

      if (url) location.href = url;
      else showToast('준비중입니다');
    });
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
    /* 아래 여백의 '원래 값'. 흡수 중(인라인 값이 박혀 있는 동안)에는 읽지
       않고 마지막으로 읽어 둔 값을 쓴다 — 안 그러면 줄인 값을 원래 값으로
       착각해 재흡수하며 점점 깎인다. 폭이 바뀌어 다시 잴 때는 인라인이
       비어 있으므로 자동으로 새 값이 들어온다. */
    if (!wrap.style.paddingBottom) item.basePad = parseFloat(cs.paddingBottom) || 0;

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
    /* 펼치면 늘어날 높이 = 설명 높이 + margin-top 이 -3 에서 5 로 가는 8px.
       ⚠ '지금 높이' 를 빼는 식으로 쓰지 않는다. 접히는 도중에 재면 그 값이
       중간값이라, 줄일 여백을 실제보다 크게 잡아 카드가 오히려 줄어든다
       (사용자 지적: "중간 카드들은 호버되면 도리어 줄어들어").
       평상시 값(높이 0 / margin -3)은 상수이므로 그대로 쓴다. */
    var revTarget = Math.min(revealHeight(reveal), MAXREV);
    var grow      = revTarget + 8;

    /* ── 늘어날 높이를 '이미 비어 있던 아래 여백' 안으로 흡수 (v4.0) ──
       항목 아래에는 원래 비어 있는 여백이 있다(padding-bottom).
       펼치는 만큼 그 여백을 줄이면 항목 전체 높이가 그대로라, 아래 회색
       구분선(= 파랗게 켜질 선)도 그 아래 항목도 밀리지 않는다.
       여백보다 설명이 길면 남는 만큼(residual)만 밀린다.
       ⚠ 여기서는 계산만. 실제로 줄이는 건 enter() — 위 헤더 주석 참고. */
    item.absorb    = Math.max(0, Math.min(grow, item.basePad - MIN_PAD));
    item.revTarget = revTarget;
    var residual   = grow - item.absorb;

    var gl = grayLine(wrap);
    var targetY;
    if (gl) {
      /* 아래에 회색 구분선이 있으면 그 선이 곧 착지점 */
      targetY = Math.round(gl.getBoundingClientRect().top - wrapRect.top + residual);
    } else {
      /* ── 열의 마지막 항목 — 아래에 회색 구분선이 없다 ──
         두 후보 중 더 아래를 택한다.

           내용 바닥 : 펼쳤을 때 글이 끝나는 자리
           열 바닥   : 표 아래 테두리(.hst_grid border-bottom)가 지나는 자리

         칸이 길어 여유가 있으면 '열 바닥' 이 더 아래다 → 바닥에 깔린 선
         위치에 맞춰 켜진다(사용자 요청). 여유가 없는 칸은 펼치면서 열이
         같이 늘어나므로 '내용 바닥' 이 곧 새 열 바닥이 된다.

         이렇게 두면 어느 칸이 긴지 세어 둘 필요가 없다 — 칸마다 알아서
         맞는 쪽을 고른다. 나중에 항목이 늘거나 글이 길어져도 그대로 맞음. */
      var col = wrap.closest ? wrap.closest(COL) : null;
      var contentBottom = wrapRect.height + residual;
      var colBottom = col ? (col.getBoundingClientRect().bottom - wrapRect.top) : contentBottom;
      targetY = Math.round(Math.max(colBottom, contentBottom));
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
    /* 마우스가 올라온 지금 다시 잰다 (v4.1).
       예전엔 hover 시점 측정이 위험했다 — 직전에 보던 항목이 접히는 중이면
       열이 부풀어 있어서, 처음 펼칠 때와 다른 칸을 거쳐 펼칠 때 선 높이가
       달라졌다(#1377). v4.0 부터는 펼쳐도 항목 높이가 변하지 않으므로
       (실측: 항목을 갈아타는 내내 열 높이 일정) 그 위험이 사라졌다.

       반대로 '미리 재 두기' 만 하면 잰 뒤에 글자 높이가 달라지는 경우
       (늦게 도착하는 폰트)를 못 따라간다. 이 사이트는 Adobe 가변 폰트를 쓰는데
       document.fonts.ready 가 그보다 먼저 끝나는 사고를 about 페이지에서 이미
       겪었다. 실제로 이것 때문에 열 마지막 항목(방사선·스텐트·FMT)의 선이
       바닥선보다 위에 그려지고, 중간 항목은 호버 시 되레 줄어들었다.
       '언제 오는지' 를 짐작하는 대신 매번 다시 재서 원천 차단한다.
       12개 × hover 1회당 1번이라 비용은 무시할 수준. */
    item.measured = measure(item);
    if (!item.measured) return;

    /* 펼치는 만큼 아래 여백을 줄여, 항목 전체 높이를 그대로 유지한다 (v4.0).
       max-height 도 '실제 펼칠 높이' 로 못박는다 — CSS 의 고정 120px 로 두면
       설명이 짧은 항목은 먼저 다 자라 버려서 여백 줄어드는 속도와 어긋나
       그 사이 높이가 잠깐 출렁인다. 같은 값으로 맞추면 둘이 정확히 동행한다. */
    item.wrap.style.paddingBottom = (item.basePad - item.absorb) + 'px';
    item.reveal.style.maxHeight   = item.revTarget + 'px';

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
    /* 줄여 뒀던 아래 여백과 못박아 둔 펼침 높이를 되돌린다 (v4.0).
       measure 가 실패해 선을 못 그린 경우에도 되돌려야 하므로 위에 둔다. */
    item.wrap.style.paddingBottom = '';
    item.reveal.style.maxHeight   = '';
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
                 basePad: 0, absorb: 0, revTarget: 0,
                 raf: null, flashTimer: null, len: 0, measured: false };

    /* 여기서는 재지 않는다 — enter() 가 hover 시점에 잰다(위 주석 참고). */
    wrap.addEventListener('mouseenter', function () { enter(item); });
    wrap.addEventListener('mouseleave', function () { leave(item); });
    return item;
  }

  var items = [];

  /* 우리 css 가 실제로 적용됐는지 — 접힘 규칙(max-height:0)이 살아 있으면 적용된 것.
     로더가 css 를 <link> 로 붙이는 건 비동기라, 로드 직후엔 아직일 수 있다.
     그 상태에서 재면 기준점(position:relative)과 바닥을 둘 다 잘못 읽는다. */
  function cssApplied() {
    if (!items.length) return false;
    return getComputedStyle(items[0].reveal).maxHeight === '0px';
  }

  /* ── 아래 여백을 '가장 긴 설명이 들어갈 만큼' 으로 맞춘다 (v4.1) ──
     Webflow 기본 60px 은 설명이 한 줄일 때 기준이라, 두세 줄이 되는 폭에서는
     모자라 그만큼이 아래를 밀었다. 그렇다고 넉넉히 고정해 두면 표 전체가 늘
     길어진다(사용자 지적: "표가 전체적으로 늘어나서"). 그래서 실제 설명 높이를
     재서 필요한 만큼만 늘린다 — 넓은 화면에서는 대개 원래 60px 그대로다.

     여백을 이 값으로 잡으면 흡수량(absorb)이 항상 grow 와 같아져 밀림이 0 이 된다.
     ⚠ 마우스가 올라가 있는 동안에는 건드리지 않는다. 그 항목은 여백을 이미
     인라인으로 줄여 쓰고 있어서, 여기서 바꾸면 서로 싸운다. */
  function fitReserve() {
    var maxGrow = 0, busy = false;
    items.forEach(function (it) {
      if (it.wrap.style.paddingBottom) busy = true;
      var g = Math.min(revealHeight(it.reveal), MAXREV) + 8;
      if (g > maxGrow) maxGrow = g;
    });
    if (busy || !maxGrow) return;
    var pad = Math.max(WF_PAD, Math.ceil(maxGrow) + MIN_PAD);
    document.documentElement.style.setProperty('--hx-spec-pad', pad + 'px');
  }

  /* '아무것도 펼쳐지지 않은 평상시' 좌표를 일괄로 재서 기억해 둔다.
     지금 마우스가 올라가 있는 항목은 건너뛴다(그 항목은 펼쳐져 있어 값이 틀림). */
  function measureAll() {
    fitReserve();                 /* 여백부터 확정하고 → 그 상태에서 좌표를 잰다 */
    items.forEach(function (it) {
      if (it.raf) return;
      if (it.wrap.matches && it.wrap.matches(':hover')) return;
      it.measured = measure(it);
      if (it.measured) applyDash(it, 0, 0);
    });
  }

  /* css 가 붙을 때까지 짧게 기다렸다가 첫 측정. 최대 약 2초. */
  function measureWhenReady(tries) {
    if (cssApplied() || tries <= 0) { measureAll(); return; }
    setTimeout(function () { measureWhenReady(tries - 1); }, 60);
  }

  function init() {
    initCta();          /* 토스트는 폭과 무관하게 항상 */
    if (!isDesktop()) return;   /* 아래는 코멧(선) 전용 */

    var wraps = document.querySelectorAll(WRAP);
    if (!wraps.length) {
      console.warn('[specialty] ' + WRAP + ' 요소를 못 찾음 — Webflow 에서 클래스 이름이 바뀌었는지 확인');
      return;
    }

    for (var i = 0; i < wraps.length; i++) {
      var it = setup(wraps[i]);
      if (it) items.push(it);
    }

    measureWhenReady(32);                       /* css 적용 직후 평상시 좌표 확보 */
    window.addEventListener('load', measureAll);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureAll);    /* 폰트가 늦게 오면 글자 높이가 바뀜 */
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(measureAll, 150);
    });

    /* ── 글자 높이가 나중에 변하면 여백을 다시 맞춘다 (v4.1) ──
       hover 때마다 다시 재므로 선 좌표는 이미 안전하다. 다만 '여백 크기' 는
       평상시에 정해 두는 값이라, 늦게 도착한 폰트로 설명 줄 수가 바뀌면
       모자라거나 남는다. load / fonts.ready 로는 부족하다 — 이 사이트가 쓰는
       Adobe 가변 폰트는 document.fonts.ready 보다 늦게 오는 사고를 about
       페이지에서 이미 겪었다. 그래서 '언제 오는지' 를 짐작하지 않고, 높이가
       실제로 변하는 순간을 직접 지켜본다.

       ⚠ 이 관찰자를 계속 켜 둘 수 있는 것은 v4.0 덕분이다. 펼쳐도 항목 높이가
       변하지 않으므로(실측: 항목을 갈아타는 내내 열 높이 일정) 마우스만
       움직여서는 울리지 않는다. 설명 글의 높이는 접혀 있어도 그대로라
       (max-height 로 잘려 있을 뿐) 폰트가 바뀌면 정확히 이 관찰자가 잡는다. */
    if (window.ResizeObserver) {
      var ht, ro = new ResizeObserver(function () {
        clearTimeout(ht);
        ht = setTimeout(measureAll, 120);
      });
      var grid = document.querySelector(GRID);
      if (grid) ro.observe(grid);                     /* 가장 긴 열이 바뀌는 것 */
      items.forEach(function (it) {
        ro.observe(it.wrap);                          /* 한글명·영문명 높이 */
        var kids = it.reveal.children;
        for (var k = 0; k < kids.length; k++) ro.observe(kids[k]);  /* 설명·CTA 높이 */
      });
    }
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
