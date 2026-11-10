/* ================================================================
   HELIX AMC — 공통 UI 보완 로더
   페이지별 로더가 연결하지 않은 공통 기능만 같은 커밋에서 불러온다.
   사이트 footer가 immutable SHA 주소로 연결하며 본문은 변경하지 않는다.
   ================================================================ */
(function () {
  'use strict';

  // Doctor URLs intentionally render the existing full-screen history modal.
  if (window.self !== window.top || /^\/doctors\//.test(location.pathname) || window.__helixSharedUiInit) return;
  window.__helixSharedUiInit = true;

  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  var ROOT = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@';
  var source = document.currentScript && document.currentScript.src || '';
  var match = source.match(/@([0-9a-f]{10,40})\/global\/bootstrap\.js(?:[?#]|$)/i);
  var FILES = [
    'global/viewport-fix.js',
    'global/viewport.js',
    'global/accessibility.js',
    'global/global.css',
    'global/floating-cta.css',
    'global/floating-cta.js',
    'global/floating-cta-mobile-fix.css',
    'global/floating-cta-mobile-fix.js',
    'global/top-button.css',
    'global/top-button.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'home/global/footer.css',
    'home/global/footer.js'
  ];
  var guards = {
    'global/viewport-fix.js': '__helixVPFixInit',
    'global/viewport.js': '__helixVPInit',
    'global/accessibility.js': '__helixAccessibilityInit',
    'global/floating-cta.js': '__helixFloatingCtaInit',
    'global/floating-cta-mobile-fix.js': '__helixFloatingCtaMobileFixInit',
    'global/top-button.js': '__helixTopButtonInit',
    'home/global/coming-soon.js': '__helixComingSoonToastInit',
    'home/global/hamburger.js': '__helixHamburgerInit',
    'home/global/footer.js': '__HELIX_FOOTER_INIT__'
  };

  function present(path) {
    if (guards[path] && window[guards[path]]) return true;
    // Match the repository path across revisions, including in-flight page loads.
    return Array.prototype.some.call(document.querySelectorAll('script[src],link[rel="stylesheet"][href]'), function (el) {
      var url = el.src || el.href;
      return url.indexOf('/helixamc-webflow@') !== -1 && url.split(/[?#]/)[0].endsWith('/' + path);
    });
  }

  function inject(ref) {
    if (!/^[0-9a-f]{10,40}$/i.test(ref || '')) return;
    document.documentElement.classList.add('hx-fcta-mobile-bar');
    document.documentElement.classList.remove('hx-fcta-mobile-only');
    FILES.forEach(function (path) {
      if (present(path)) return;
      var css = /\.css$/.test(path);
      var el = document.createElement(css ? 'link' : 'script');
      if (css) { el.rel = 'stylesheet'; el.href = ROOT + ref + '/' + path; }
      else { el.src = ROOT + ref + '/' + path; el.async = false; }
      el.setAttribute('data-helix-shared-ui', '');
      el.onerror = function () {
        // A failed request must not block a later retry or replace page modules.
        el.remove();
        console.warn('[shared-ui] load failed:', path);
      };
      document.head.appendChild(el);
    });
  }

  function boot() {
    if (match) { inject(match[1]); return; }
    fetch('https://api.github.com/repos/pookat73-prog/helixamc-webflow/git/ref/heads/' + BRANCH,
      { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('UI revision unavailable'); return r.json(); })
      .then(function (data) { inject(data.object && data.object.sha); })
      .catch(function (error) { console.warn('[shared-ui]', error); });
  }

  // Give page loaders first choice of their modules; complete only missing UI.
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot, { once: true });
})();
