/* ================================================================
   HELIX AMC — 모바일 플로팅 CTA 본문 겹침 보정
   홈·특화진료·FAQ에서만 적용한다.
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixFloatingCtaMobileFixInit) return;
  window.__helixFloatingCtaMobileFixInit = true;

  var path = (location.pathname || '/').replace(/\/$/, '') || '/';
  var page = path === '/' ? 'home' :
    path === '/specialty-care' ? 'specialty' :
    path === '/faq' ? 'faq' : '';

  if (!page) return;

  var root = document.documentElement;
  root.classList.add('hx-fcta-overlap-fix', 'hx-fcta-page-' + page);
})();
