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
    /* 화살표 버튼(원) — 다크 배경 + 블루 테두리로 항상 고정(호버해도 안 변함) */
    '.right-pointing-arrow{width:32px;height:32px;border-radius:50%;border:1.5px solid #0075d6;' +
    'background-color:rgba(13,17,23,.35);display:flex;align-items:center;justify-content:center;' +
    'box-sizing:border-box}' +
    /* 원 안 화살표 글리프(SVG) — 위치 고정(호버 슬라이드 없음) */
    '.right-pointing-arrow::before{content:"";width:14px;height:14px;' +
    'background:center/14px no-repeat ' + ARROW + '}' +
    /* 그리드 호버: 나머지 카드는 더 어둡게 + 채도 더 낮게 */
    '.dept-grid:hover [class*="dept-card_"]{filter:brightness(.3) saturate(.35)}' +
    /* 호버한 카드: 원복 + 바닥·우측 고정한 채 확대(위·왼쪽으로 커짐) + 은은한 그림자 */
    '.dept-grid:hover [class*="dept-card_"]:hover{filter:none;transform:scale(1.04);z-index:30;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.35)}' +
    /* dept-border.js 카드 사이 그림자 오버레이([data-hx-sh-*])는 카드 scale 을
       안 따라가므로 아무 카드나 호버 시 숨긴다. (컨테이너 랩퍼 테두리는
       dept-border.js 에서 아예 안 그리므로 여기서 처리할 것 없음 — 안과·치과가
       각자 자기 테두리를 가짐) */
    '[data-hx-sh-l],[data-hx-sh-ri]{transition:opacity .3s ease}' +
    '.dept-grid:hover [data-hx-sh-l],.dept-grid:hover [data-hx-sh-ri]{opacity:0}';

  function injectCss() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function keyFor(card) {
    var m = (card.className || '').match(/dept-card_(\w+)/i);
    return m ? m[1].toLowerCase() : null;
  }

  function init() {
    injectCss();
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
