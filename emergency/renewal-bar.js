/* ================================================================
   HELIX AMC - 응급 페이지 하단 리뉴얼 고정 바 (모바일 전용)
   ----------------------------------------------------------------
   하단에서 슬라이드 업 → 계속 유지. 우측 X 로 닫기.
   노출 여부(브레이크포인트)는 emergency/renewal-bar.css 의
   @media (max-width: 850px) 가 제어 — JS 는 DOM 만 주입.
   닫으면 같은 세션 동안 다시 안 뜸 (sessionStorage).

   ▼ 문구는 아래 CONFIG.text 수정.
   ================================================================ */
(function () {
  'use strict';

  var CONFIG = {
    text: '업데이트 작업 중입니다.'
  };

  /* 중복 주입 가드 */
  if (window.__helixRenewalBarInit) return;
  window.__helixRenewalBarInit = true;

  function build() {
    if (document.querySelector('.helix-renewal-bar')) return;

    var bar = document.createElement('div');
    bar.className = 'helix-renewal-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');

    var text = document.createElement('p');
    text.className = 'helix-renewal-bar__text';
    text.textContent = CONFIG.text;
    bar.appendChild(text);

    document.body.appendChild(bar);

    /* 다음 프레임에 is-open 부여 → 하단에서 스르륵 슬라이드 업 */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.classList.add('is-open'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
