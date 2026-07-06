/* ================================================================
   HELIX AMC — 진료과목(services) 카드 → 상세페이지 이동 버튼  (v2)
   기존 Webflow 등록 스크립트 deptDetailNav 를 GitHub 파일로 이관.
   services/bootstrap.js 가 로드.

   동작
   - 각 진료과 카드(.dept-card_im/_sg/_di/_oc/_dt) 안 .right-pointing-arrow
     를 원형 화살표 버튼으로 스타일링.
   - 카드 전체가 클릭 영역 → LINKS 의 URL 로 이동.
   - 카드 호버 시: 그 카드는 바닥·우측을 고정한 채 위·왼쪽으로 커지고(scale,
     transform-origin: bottom right) 화살표가 블루로 채워지며, 같은 그리드의
     나머지 카드는 어두워지고 채도가 낮아짐(강조).

   v2 수정 (사용자 피드백)
   - 화살표를 유니코드(\2192) → 폰트 독립 SVG 로 교체 (카드 폰트에 → 글리프가
     없어 "◀92" 두부로 깨지던 문제).
   - 원 테두리를 불투명 블루 + 살짝 어두운 원 배경으로 → 사진 위에서도 또렷.
   - 호버 확대 기준점을 bottom-right 로 고정 → 카드가 위·왼쪽으로 커짐. 바닥이
     안 내려가므로 사진 아래 밝은 부분이 드러나 회색 바처럼 보이던 문제 해소.

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
    /* 화살표 버튼(원) — 불투명 블루 테두리 + 살짝 어두운 배경으로 또렷하게 */
    '.right-pointing-arrow{width:32px;height:32px;border-radius:50%;border:1.5px solid #0075d6;' +
    'background-color:rgba(13,17,23,.35);display:flex;align-items:center;justify-content:center;' +
    'box-sizing:border-box;transition:background-color .25s,border-color .25s}' +
    /* 원 안 화살표 글리프(SVG) */
    '.right-pointing-arrow::before{content:"";width:14px;height:14px;' +
    'background:center/14px no-repeat ' + ARROW + ';transition:transform .25s}' +
    /* 그리드 호버: 나머지 카드는 어두워지고 채도 낮아짐 */
    '.dept-grid:hover [class*="dept-card_"]{filter:brightness(.5) saturate(.55)}' +
    /* 호버한 카드: 원복 + 바닥·우측 고정한 채 확대(위·왼쪽으로 커짐) + 은은한 그림자 */
    '.dept-grid:hover [class*="dept-card_"]:hover{filter:none;transform:scale(1.04);z-index:30;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.35)}' +
    /* 호버한 카드의 화살표: 블루로 채워지고 살짝 오른쪽 이동 */
    '[class*="dept-card_"]:hover .right-pointing-arrow{background-color:#0075d6;border-color:#0075d6}' +
    '[class*="dept-card_"]:hover .right-pointing-arrow::before{transform:translateX(2px)}';

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
