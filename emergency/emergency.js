/* ================================================================
   HELIX AMC — 응급 증상 안내 페이지 전용 스크립트
   ----------------------------------------------------------------
   모달 자체는 emergency/modal.js 가 담당. 본 파일은 페이지에 박힌
   기타 전역 UI 핸들러 (분원 전화 블록 등) 처리.
   ================================================================ */

(function () {
  'use strict';
  if (window.__helixEmergencyInit) return;
  window.__helixEmergencyInit = true;

  /* 페이지 상단/하단의 "call seocho" / "call ilsan" 블록 클릭 → 전화 연결.
     Webflow 가 클래스 이름 공백을 그대로 두는 경우(.call.seocho)와
     하이픈으로 변환하는 경우(.call-seocho) 둘 다 커버. */
  var CALL_BLOCKS = [
    { selector: '.call.seocho, .call-seocho', tel: '02-2135-9119' },
    { selector: '.call.ilsan, .call-ilsan',   tel: '031-978-7575' }
  ];

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    for (var i = 0; i < CALL_BLOCKS.length; i++) {
      var hit = e.target.closest(CALL_BLOCKS[i].selector);
      if (!hit) continue;
      e.preventDefault();
      var tel = CALL_BLOCKS[i].tel;
      var ok = window.confirm(tel + ' 로 전화 연결하시겠습니까?');
      if (ok) {
        location.href = 'tel:' + tel.replace(/\D/g, '');
      }
      return;
    }
  });

  /* 클릭 가능 힌트 — 둘 다 셀렉터 커버 */
  try {
    var style = document.createElement('style');
    style.textContent =
      '.call.seocho, .call-seocho, .call.ilsan, .call-ilsan { cursor: pointer; }';
    document.head.appendChild(style);
  } catch (e) {}
})();
