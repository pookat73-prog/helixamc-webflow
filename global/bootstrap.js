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

  // ScrollTrigger refresh can cancel a native smooth scroll at its current
  // offset. Finish the requested navigation, unless the visitor takes control.
  var cancelTopScroll = null;
  function scrollToTop() {
    if (cancelTopScroll) cancelTopScroll();
    var timer;
    var inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    function cancel() {
      clearTimeout(timer);
      window.removeEventListener('scrollend', finish);
      inputs.forEach(function (name) { window.removeEventListener(name, cancel, true); });
      cancelTopScroll = null;
    }
    function finish() {
      cancel();
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
    }
    cancelTopScroll = cancel;
    inputs.forEach(function (name) { window.addEventListener(name, cancel, { capture: true, passive: true }); });
    window.addEventListener('scrollend', finish);
    timer = setTimeout(finish, 1500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Some page heads still pin an older top-button module. Capture navigation
  // here so the same completion and cancellation rules apply to those visitors.
  window.addEventListener('click', function (event) {
    var target = event.target && event.target.closest && event.target.closest('.helix-top-btn');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    if (window.HelixMeasure) window.HelixMeasure.emit('back_to_top', { item_type: 'navigation' });
    scrollToTop();
  }, true);

  function present(path) {
    if (guards[path] && window[guards[path]]) return true;
    // Match the repository path across revisions, including in-flight page loads.
    return Array.prototype.some.call(document.querySelectorAll('script[src],link[rel="stylesheet"][href]'), function (el) {
      var url = el.src || el.href;
      return url.indexOf('/helixamc-webflow@') !== -1 && url.split(/[?#]/)[0].endsWith('/' + path);
    });
  }

  // This page has no department bootstrap. Reuse the existing immutable
  // shared-UI revision to load its SEO without changing Webflow head/footer.
  function imagingSeo(ref) {
    if (!/^\/diagnostic-imaging\/?$/.test(location.pathname)) return;
    var id = 'helix-diagnostic-imaging-schema';
    if (document.getElementById(id)) return;
    fetch(ROOT + ref + '/seo-snippets/diagnostic-imaging.html')
      .then(function (r) { if (!r.ok) throw new Error('Imaging SEO unavailable'); return r.text(); })
      .then(function (html) {
        if (document.getElementById(id)) return;
        var box = document.createElement('div');
        box.innerHTML = html;
        var node = box.querySelector('script[type="application/ld+json"]');
        if (!node) return;
        JSON.parse(node.textContent);
        var schema = document.createElement('script');
        schema.id = id;
        schema.type = 'application/ld+json';
        schema.textContent = node.textContent;
        document.head.appendChild(schema);
      }).catch(function (error) { console.warn('[imaging-seo]', error); });
    var images = [
      ['6aed5edae0c6bdf582d7a91e', '영상 판독용 모니터에 표시된 반려동물 CT 영상'],
      ['6aec0e58c5701aa99afaa44b', 'CT 촬영실에서 반려동물의 CT 영상과 3D 재구성 영상을 확인하는 모습'],
      ['6aec0fe85e1dd5f74676c6bb', '영상검사 전 마취 장비를 점검하는 의료진']
    ];
    images.forEach(function (entry) {
      document.querySelectorAll('img[src*="' + entry[0] + '"]').forEach(function (image) {
        if (!image.getAttribute('alt')) image.alt = entry[1];
      });
    });
  }

  function inject(ref) {
    if (!/^[0-9a-f]{10,40}$/i.test(ref || '')) return;
    imagingSeo(ref);
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
