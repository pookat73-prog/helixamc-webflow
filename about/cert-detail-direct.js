/* ================================================================
   HELIX AMC — 인증 상세 페이지 직접 접속 헤더
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixCertDirectInit) return;
  window.__helixCertDirectInit = true;

  var allowed = ['/aaha-cert', '/emergency-cert', '/cat-cert'];
  var path = (location.pathname || '').replace(/\/$/, '');
  if (allowed.indexOf(path) === -1) return;

  var LOGO = 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/' +
    '69d700bcc34b330ceea4724c_%EC%A1%B0%ED%95%A9%ED%98%95%20%EB%A1%9C%EA%B3%A02-p-500.webp';

  function boot() {
    if (!document.body || document.querySelector('.hx-cert-direct-header')) return;

    document.body.classList.add('hx-cert-direct');

    var header = document.createElement('header');
    header.className = 'hx-cert-direct-header';
    header.setAttribute('aria-label', '인증 상세 페이지 안내');
    header.innerHTML = [
      '<a class="hx-cert-direct-header__home" href="/" aria-label="헬릭스동물메디컬센터 홈">',
        '<img class="hx-cert-direct-header__logo" src="' + LOGO + '"',
          ' alt="헬릭스동물메디컬센터">',
      '</a>',
      '<a class="hx-cert-direct-header__back" href="/discover-helix#cert">인증 안내</a>'
    ].join('');

    document.body.insertBefore(header, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
