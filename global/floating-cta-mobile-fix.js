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
  var bootAttempts = 0;

  function boot() {
    var shell = document.querySelector('.hx-fcta-shell');
    if (!shell) {
      if (bootAttempts++ < 40) window.setTimeout(boot, 100);
      return;
    }
    if (!window.IntersectionObserver) return;

    /* 홈 빠른 지점 선택에는 전화 연결이 이미 있으므로, 그 영역이 보이는 동안
       플로팅 CTA를 숨겨 같은 행동이 겹쳐 보이지 않게 한다. FAQ의 하단 전화
       카드도 같은 이유로 중복 플로팅 CTA를 숨긴다. */
    var selector = page === 'home' ? '#hx-branch-quickbar' :
      page === 'faq' ? '[class*="faq-cta_surface" i]' : '';
    if (!selector) return;

    var context = document.querySelector(selector);
    if (!context) {
      if (bootAttempts++ < 40) window.setTimeout(boot, 100);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.some(function (entry) {
        return entry.isIntersecting && entry.intersectionRect.height > 0;
      });
      shell.classList.toggle('is-context-hidden', visible);
      shell.setAttribute('aria-hidden', visible ? 'true' : 'false');
    }, { threshold: 0.01 });

    observer.observe(context);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
