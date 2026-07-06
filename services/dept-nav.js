/* ================================================================
   HELIX AMC — 진료과목(services) 카드 → 상세페이지 이동 버튼
   기존 Webflow 등록 스크립트 deptDetailNav v1.4.0 을 GitHub 파일로 이관.
   services/bootstrap.js 가 로드.

   동작
   - 각 진료과 카드(.dept-card_im/_sg/_di/_oc/_dt) 안 .right-pointing-arrow
     를 원형 화살표 버튼으로 스타일링.
   - 카드 전체가 클릭 영역 → LINKS 의 URL 로 이동.
   - 카드 호버 시: 그 카드는 살짝 커지고(scale) 화살표가 블루로 채워지며,
     같은 그리드의 나머지 카드는 어두워지고 채도가 낮아짐(강조).

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

  var CSS =
    '[class*="dept-card_"]{cursor:pointer;transition:transform .3s ease,filter .3s ease,box-shadow .3s ease}' +
    '.right-pointing-arrow{width:32px;height:32px;border-radius:50%;border:1.5px solid rgba(0,117,214,.55);display:flex;align-items:center;justify-content:center;color:#fff;box-sizing:border-box;transition:background-color .25s,border-color .25s}' +
    '.right-pointing-arrow::before{content:"\\2192";font-size:15px;line-height:1;color:#fff;transition:transform .25s}' +
    '.dept-grid:hover [class*="dept-card_"]{filter:brightness(.55) saturate(.6)}' +
    '.dept-grid:hover [class*="dept-card_"]:hover{filter:none;transform:scale(1.04);z-index:30;box-shadow:0 10px 30px rgba(0,0,0,.45)}' +
    '[class*="dept-card_"]:hover .right-pointing-arrow{background:#0075d6;border-color:#0075d6}' +
    '[class*="dept-card_"]:hover .right-pointing-arrow::before{transform:translateX(3px)}';

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
