/* ================================================================
   HEADER LOGO LINK SAFETY NET
   Webflow nav brand href 누락 또는 외부 click 핸들러 가로채기로
   헤더 로고 클릭 시 홈("/") 이동이 안 먹는 회귀를 방어.

   동작:
   - 현재 경로가 "/" 면 최상단으로 smooth scroll
   - 그 외 경로면 location.href = "/"

   바인딩 대상 (다중 폴백):
   1) header.header .w-nav-brand
   2) header .w-nav-brand
   3) .w-nav-brand
   4) header.header a[href="/"]
   5) header.header img (Webflow 가 href 를 떼버린 케이스 대비)

   coming-soon.js 의 캡처 단계 차단을 피하기 위해 EXEMPT 어트리뷰트
   부여 + capture 단계 click 리스너로 우선권 확보.
   ================================================================ */

(function () {
  'use strict';

  if (window.__HELIX_HEADER_INIT__) return;
  window.__HELIX_HEADER_INIT__ = true;

  function findLogo() {
    return (
      document.querySelector('header.header .w-nav-brand') ||
      document.querySelector('header .w-nav-brand') ||
      document.querySelector('.w-nav-brand') ||
      document.querySelector('header.header a[href="/"]') ||
      document.querySelector('header.header img')
    );
  }

  function go(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (location.pathname === '/' || location.pathname === '') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      location.href = '/';
    }
  }

  function bind() {
    var el = findLogo();
    if (!el) return false;
    if (el.dataset.helixHeaderLogoInit) return true;
    el.dataset.helixHeaderLogoInit = '1';

    if (!el.hasAttribute('data-coming-soon-exempt')) {
      el.setAttribute('data-coming-soon-exempt', '1');
    }
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'link');
    el.setAttribute('aria-label', '홈으로 이동');

    el.addEventListener('click', go, true);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') go(e);
    });
    return true;
  }

  function retry() {
    if (bind()) return;
    var n = 0;
    var iv = setInterval(function () {
      if (bind() || ++n >= 50) clearInterval(iv);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retry);
  } else {
    retry();
  }
  window.addEventListener('load', retry);
})();
