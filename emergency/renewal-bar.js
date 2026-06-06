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
    text: '이 페이지는 현재 리뉴얼 중입니다.'
  };

  var DISMISS_KEY = 'helixRenewalBarDismissed';

  /* 중복 주입 가드 */
  if (window.__helixRenewalBarInit) return;
  window.__helixRenewalBarInit = true;

  function dismissed() {
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setDismissed() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch (e) {}
  }

  function build() {
    if (dismissed()) return;
    if (document.querySelector('.helix-renewal-bar')) return;

    var bar = document.createElement('div');
    bar.className = 'helix-renewal-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');

    var text = document.createElement('p');
    text.className = 'helix-renewal-bar__text';
    text.textContent = CONFIG.text;
    bar.appendChild(text);

    var close = document.createElement('button');
    close.className = 'helix-renewal-bar__close';
    close.setAttribute('type', 'button');
    close.setAttribute('aria-label', '닫기');
    close.innerHTML = '&times;';
    bar.appendChild(close);

    document.body.appendChild(bar);

    close.addEventListener('click', function () {
      bar.classList.remove('is-open');
      setDismissed();
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
