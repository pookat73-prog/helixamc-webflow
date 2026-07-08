/* ================================================================
   HELIX AMC — 진료과목(services) 카드 → 상세페이지 이동 버튼  (v2)
   기존 Webflow 등록 스크립트 deptDetailNav 를 GitHub 파일로 이관.
   services/bootstrap.js 가 로드.

   동작
   - 각 진료과 카드(.dept-card_im/_sg/_di/_oc/_dt) 안 .right-pointing-arrow
     를 원형 화살표 버튼으로 스타일링.
   - 카드 전체가 클릭 영역 → LINKS 의 URL 로 이동.
   - 카드 호버 시: 그 카드는 바닥·우측을 고정한 채 위·왼쪽으로 커지고(scale,
     transform-origin: bottom right), 같은 그리드의 나머지 카드는 더 어두워지고
     채도가 낮아짐(강조). 화살표 버튼 자체는 안 변함(파랑 채움·슬라이드 없음).

   v2 수정 (사용자 피드백)
   - 화살표를 유니코드(\2192) → 폰트 독립 SVG 로 교체 (카드 폰트에 → 글리프가
     없어 "◀92" 두부로 깨지던 문제).
   - 원 테두리를 불투명 블루 + 살짝 어두운 원 배경으로 → 사진 위에서도 또렷.
   - 호버 확대 기준점을 bottom-right 로 고정 → 카드가 위·왼쪽으로 커짐. 바닥이
     안 내려가므로 사진 아래 밝은 부분이 드러나 회색 바처럼 보이던 문제 해소.

   v3 수정 (사용자 피드백)
   - dept-border.js 가 로드 시 고정 크기로 그린 정적 장식이 카드 scale 을 안
     따라가 어긋나던 문제:
     · 카드 사이 그림자 오버레이([data-hx-sh-*]) 가 제자리에 남던 문제
     · 안과/치과가 든 오른쪽 열 컨테이너(div-block-263)의 테두리([data-hx-u])가
       안쪽 카드만 커질 때 뜬 파란 선으로 어긋나던 문제
     → 그리드 호버 동안 이 정적 장식들을 부드럽게 숨김(각 카드 자체 테두리만
       남아 스케일과 함께 정확히 움직임).

   상세페이지 연결
   - 상세페이지를 만들면 아래 LINKS 값만 채우면 됨 (Webflow 손댈 필요 없음).
     예) im: '/naegwa'
   ================================================================ */
(function () {
  'use strict';

  /* 진료과별 상세페이지 URL. null 이면 클릭해도 이동 안 함(안전). */
  var LINKS = {
    im: null,  // 내과
    sg: null,  // 외과
    di: null,  // 영상의학과
    oc: null,  // 안과
    dt: null   // 치과
  };

  /* 폰트 독립 화살표(→) — 흰색 stroke SVG 를 data-URI 로. content:"\2192" 는
     카드 헤딩 폰트에 → 글리프가 없으면 두부로 깨지므로 사용하지 않음. */
  var ARROW =
    'url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20' +
    'viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23fff%27%20' +
    'stroke-width=%272.5%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E' +
    '%3Cpath%20d=%27M4%2012h15%27/%3E%3Cpath%20d=%27M13%206l6%206-6%206%27/%3E%3C/svg%3E")';

  var CSS =
    /* 카드: 클릭 가능 + 부드러운 전환. 확대 기준점은 우하단 고정(바닥·우측) */
    '[class*="dept-card_"]{cursor:pointer;transform-origin:bottom right;transition:transform .3s ease,filter .3s ease,box-shadow .3s ease}' +
    /* 화살표 버튼(원) — 다크 배경 + 블루 테두리로 항상 고정(호버해도 안 변함).
       z-index 16 으로 겹침 그림자(SH, z-index 15) 위에 올림(카드 z-index 제거로
       전역 stacking 에서 경쟁 → 그림자보다 위). */
    '.right-pointing-arrow{width:32px;height:32px;border-radius:50%;border:1.5px solid #0075d6;' +
    'background-color:rgba(13,17,23,.35);display:flex;align-items:center;justify-content:center;' +
    'box-sizing:border-box;position:relative;z-index:16}' +
    /* 원 안 화살표 글리프(SVG) — 위치 고정(호버 슬라이드 없음) */
    '.right-pointing-arrow::before{content:"";width:14px;height:14px;' +
    'background:center/14px no-repeat ' + ARROW + '}' +
    /* 그리드 호버: 나머지 카드는 더 어둡게 + 채도 더 낮게 */
    '.dept-grid:hover [class*="dept-card_"]{filter:brightness(.3) saturate(.35)}' +
    /* 호버한 카드: 원복 + 바닥·우측 고정한 채 확대(위·왼쪽으로 커짐) + 은은한 그림자 */
    '.dept-grid:hover [class*="dept-card_"]:hover{filter:none;transform:scale(1.04);z-index:30;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.35)}' +
    /* SH 겹침 그림자([data-hx-sh-*]) 처리:
       각 카드는 "다음 요소"의 왼쪽 그림자(left:-reach)에 덮여 뒤에 있는 것처럼
       보인다. 카드가 커지면(위로) 그 위에 덮인 다음 요소의 그림자는 고정 높이라
       원래 높이에서 툭 잘린다. → 호버한 카드 "위에 덮인 그림자"(다음 형제 요소의
       [data-hx-sh-l])를 끈다. 나머지 카드 그림자는 유지 → 깊이감 보존.
       그리드 순서: 내과(im) → 외과(sg) → 영상(di) → 안과/치과 컨테이너(div-block-263). */
    '[data-hx-sh-l],[data-hx-sh-ri]{transition:opacity .3s ease}' +
    '.dept-card_im:hover~.dept-card_sg [data-hx-sh-l],' +   /* 내과 위 = 외과 l */
    '.dept-card_sg:hover~.dept-card_di [data-hx-sh-l],' +   /* 외과 위 = 영상 l */
    '.dept-card_di:hover~.div-block-263 [data-hx-sh-l],' +  /* 영상 위 = 컨테이너 l */
    '.div-block-263:hover [data-hx-sh-l],' +                /* 안과/치과: 컨테이너 l */
    '.div-block-263:hover [data-hx-sh-ri]{opacity:0}' +      /* 안과/치과: 컨테이너 우측 */
    /* 영상 카드 이미지 강제 표시 — Webflow 게시본 버그 우회.
       증상: 디자이너 캔버스엔 영상 이미지가 보이는데, 라이브 태블릿(768~991)에서만
       display:none 으로 사라짐. Webflow 게시 CSS 가 디자인과 어긋나 이 셀만 숨김을 내보내며,
       재게시·요소 재생성으로도 안 지워짐(플랫폼 단 꼬임). → 사이트가 원래 주입하는 이 CSS 로
       !important 강제 표시해 그 숨김을 이김.
       .dept_image_di 는 데스크탑 덱(dept-container(DT))에만 있고 그 덱은 ≤767 에서 통째로
       숨겨지므로, 이 규칙은 모바일(가로모바일 텍스트덱)에 영향 없음. min-height 는 영상 카드가
       격자에서 혼자 앉아 높이를 못 받아 접히는 것 방지(다른 카드는 짝이 있어 불필요). */
    '@media screen and (min-width:768px) and (max-width:991px){' +
    /* 카드에 클립 — 이미지가 카드 바닥 밖으로 삐져나가지 않게. 아이패드 미니(768px,
       태블릿 최소폭)에서 이미지 세로가 넘쳐 바닥을 뚫던 문제 차단. */
    '.dept-card_di{min-height:418px !important;overflow:hidden !important}' +
    /* 높이는 상한 없이 min 만(=바닥). 카드가 큰 기기(아이패드 에어 등)에선 카드
       높이만큼 이미지가 늘어나 채우고, 좁은 기기(미니)에선 카드 overflow 로 잘림.
       ※ 상한(max-height)을 박으면 큰 카드에서 이미지 밑에 검은 띠가 생김 → 넣지 말 것. */
    '.dept_image_di{display:flex !important;min-height:348px !important;overflow:hidden !important}' +
    /* 안쪽 실제 이미지는 비율 유지하며 영역을 꽉 채우되 넘치지 않게 */
    '.dept_image_di img,.dept_image_di>*{object-fit:cover !important;width:100% !important;height:100% !important}' +
    '}';

  function injectCss() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function keyFor(card) {
    var m = (card.className || '').match(/dept-card_(\w+)/i);
    return m ? m[1].toLowerCase() : null;
  }

  /* 영상 카드 이미지 강제 표시 (JS) — 일부 게시본에서 이미지에 인라인/고특이도 display:none 이
     걸려 CSS !important 로도 안 밀릴 때, 인라인 !important 를 직접 걸어 무조건 이긴다.
     태블릿(768~991) 에서만 적용. 그 밖에선 우리가 건 인라인만 해제(원래 규칙 따르게).
     .dept_image_di 는 데스크탑 덱(dept-container(DT)) 전용 → 모바일 텍스트덱 무영향. */
  function forceDiTablet() {
    var img = document.querySelector('.dept_image_di');
    if (!img) return;
    if (window.innerWidth >= 768 && window.innerWidth <= 991) {
      img.style.setProperty('display', 'flex', 'important');
      img.style.setProperty('min-height', '348px', 'important');
      /* 클립만(상한 없음) — 좁은 태블릿(미니)에선 넘침을 잘라내고, 큰 태블릿
         (에어)에선 이미지가 카드 높이만큼 늘어나 검은 띠가 안 생기게.
         CSS !important 가 인라인에 밀리는 게시본까지 커버. */
      img.style.setProperty('overflow', 'hidden', 'important');
    } else {
      img.style.removeProperty('display');
      img.style.removeProperty('min-height');
      img.style.removeProperty('overflow');
    }
  }

  function init() {
    injectCss();
    forceDiTablet();
    [300, 1200].forEach(function (t) { setTimeout(forceDiTablet, t); });
    var _rt;
    window.addEventListener('resize', function () { clearTimeout(_rt); _rt = setTimeout(forceDiTablet, 150); });
    document.querySelectorAll('[class*="dept-card_"]').forEach(function (card) {
      var k = keyFor(card);
      if (!k || !(k in LINKS)) return;
      card.addEventListener('click', function () {
        var url = LINKS[k];
        if (url) location.href = url;
      });
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
