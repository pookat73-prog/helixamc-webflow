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

  /* 전화 아이콘 SVG 주입 — 두 블록 안에 한 번만 prepend */
  var PHONE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 ' +
    '19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 ' +
    '12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 ' +
    '0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
    '</svg>';

  function injectIcons() {
    CALL_BLOCKS.forEach(function (b) {
      document.querySelectorAll(b.selector).forEach(function (el) {
        if (el.querySelector('.helix-call-icon')) return;
        var span = document.createElement('span');
        span.className = 'helix-call-icon';
        span.innerHTML = PHONE_SVG;
        el.insertBefore(span, el.firstChild);
      });
    });
  }

  if (document.readyState !== 'loading') injectIcons();
  else document.addEventListener('DOMContentLoaded', injectIcons);
  /* Webflow IX2 가 늦게 wrapper 갈아끼우는 경우 대비 — 한 번 더 */
  setTimeout(injectIcons, 800);

  /* 클릭 가능 힌트 + 아이콘 스타일 (둘 다 셀렉터 커버) */
  try {
    var style = document.createElement('style');
    style.textContent =
      '.call.seocho, .call-seocho, .call.ilsan, .call-ilsan { cursor: pointer; }' +
      '.helix-call-icon {' +
        'display: inline-flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'width: 1.6em;' +
        'height: 1.6em;' +
        'border-radius: 50%;' +
        'background: #0075d6;' +
        'color: #ffffff;' +
        'margin-right: 0.6em;' +
        'vertical-align: middle;' +
        'flex: 0 0 auto;' +
      '}' +
      '.helix-call-icon svg { width: 55%; height: 55%; }';
    document.head.appendChild(style);
  } catch (e) {}
})();
