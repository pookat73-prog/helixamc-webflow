/* ================================================================
   HELIX AMC - 응급 페이지 하단 업데이트 안내 고정 바 (모바일 전용)
   ----------------------------------------------------------------
   하단에서 슬라이드 업 → 계속 유지. 우측 X 로 현재 페이지뷰만 숨김.
   세션 지속성 없음 — 새로고침/재방문 시 항상 다시 등장.
   노출 여부(브레이크포인트)는 emergency/renewal-bar.css 의
   @media (max-width: 991px) 가 제어 — JS 는 DOM 만 주입.

   ▼ 문구는 아래 CONFIG.text 수정.
   ================================================================ */
(function () {
  'use strict';

  /* OPT-IN — 명시적으로 켜지 않으면 no-op. 옛 bootstrap 캐시가 본 스크립트를
     로드해도 DOM 에 박지 않음. 다음 페이지에서 켜려면 페이지 head 또는
     해당 페이지 bootstrap 에서:
       window.HELIX_RENEWAL_BAR_ENABLE = true;
     를 본 스크립트 로드 전에 선언. */
  if (!window.HELIX_RENEWAL_BAR_ENABLE) return;

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

    /* X 닫기 — 현재 페이지뷰 동안만 숨김. 새로고침/재방문 시 다시 등장
       (세션 지속성 없음 — 사용자 요청). */
    var close = document.createElement('button');
    close.className = 'helix-renewal-bar__close';
    close.setAttribute('type', 'button');
    close.setAttribute('aria-label', '닫기');
    close.innerHTML = '&times;';
    bar.appendChild(close);

    document.body.appendChild(bar);

    close.addEventListener('click', function () {
      bar.classList.remove('is-open');
      setTimeout(function () {
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      }, 450);
    });

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
