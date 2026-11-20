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

  /* Imaging click coverage lives in the already-loaded shared entry, independent
     of motion preferences. One page-specific record per action; the existing
     ui_click and semantic events remain separate and must not be summed. */
  var imaging = /^\/diagnostic-imaging\/?$/.test(location.pathname);
  var trackImagingClick = null;
  if (imaging && !/\.webflow\.io$/i.test(location.hostname)) {
    var imagingSelector = 'a,button,summary,video,[role="button"],[role="tab"],[tabindex],input[type="checkbox"],input[type="radio"],select,.image-18,.menu-bar_mobile,.footer-logo-clickable,.footer-email-clickable,.footer-sns-icon,[data-cta-target],[data-coming-soon]';
    window.__helixImagingMeasure = { selector: imagingSelector };
    if (/[?&](ga-inspect|debug-ga)=1(?:&|$)/.test(location.search)) FILES.unshift('global/ga-inspector.js');
    trackImagingClick = function (event) {
      if (window.__helixNoMeasure || !window.HelixMeasure) return;
      var el = event.target && event.target.closest && event.target.closest(imagingSelector);
      if (!el || el.closest('#helix-noga-badge,[class*="hx-gai-"]') || el.disabled) return;
      var raw = el.getAttribute('href') || '', destination = '', targetKey = '', branch = '';
      try {
        var url = new URL(raw, location.href);
        if (raw && /^https?:$/.test(url.protocol)) destination = url.origin + url.pathname;
        if (url.protocol === 'tel:') destination = 'tel:';
        if (/^#hx-di-(principles|equipment|workflow|safety)$/.test(raw)) targetKey = raw.slice(1);
        if (url.origin === location.origin && /^\/(seocho|ilsan)\/?$/.test(url.pathname)) branch = url.pathname.slice(1).replace(/\/$/, '');
        if (/^(www\.)?svicc\.co\.kr$/i.test(url.hostname)) branch = 'svicc';
      } catch (_) {}
      if (!branch && el.closest('.hx-sg-cta-row')) {
        var branchName = el.querySelector('.branch-name-2');
        var branchText = branchName && branchName.textContent.trim();
        if (branchText === '서초') branch = 'seocho';
        if (branchText === '일산') branch = 'ilsan';
      }
      var sectionEl = el.closest('[data-measure-section],section[id]');
      var section = sectionEl && (sectionEl.getAttribute('data-measure-section') || sectionEl.id) || '';
      if (el.closest('#hxFctaModal,#hxFctaRoot,.hx-fcta-wrap')) section = 'consultation';
      else if (el.closest('#hx-menu-overlay,.hx-menu-close,header,#Header')) section = 'menu';
      else if (el.closest('footer,.footer')) section = 'footer';
      else if (el.closest('.hx-sg-cta-row')) section = 'imaging_outro';
      else if (el.matches('.hx-di-nav-link')) section = 'imaging_navigation';
      else if (el.matches('.helix-top-btn')) section = 'back_to_top';
      var label = el.getAttribute('data-measure-label') || el.getAttribute('aria-label') || el.getAttribute('alt') || '';
      if (!label && !el.matches('input,select,textarea') && !el.closest('form')) label = (el.textContent || '').replace(/\s+/g, ' ').trim();
      var key = el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
      if (!el.id && el.parentElement) key += ':nth-child(' + (Array.prototype.indexOf.call(el.parentElement.children, el) + 1) + ')';
      window.HelixMeasure.emit('diagnostic_imaging_click', {
        page: 'diagnostic_imaging', source_page: '/diagnostic-imaging',
        section_key: section || 'imaging_content', item_type: targetKey ? 'section_navigation' : branch ? 'branch_link' : 'control',
        control_id: el.id || '', control_key: key.slice(0, 160), control_label: (label || el.id || '클릭 요소').slice(0, 100),
        target_key: targetKey, branch: branch, link_url: destination, conv: 0
      });
    };
    document.addEventListener('click', trackImagingClick, true);
  }

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
    if (imaging && typeof trackImagingClick === 'function') trackImagingClick(event);
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

  // The services head can pin an older department loader. Complete only the
  // newly opened imaging card and its structured URL from this shared revision.
  function imagingEntry(ref) {
    if (!/^\/services\/?$/.test(location.pathname)) return;
    document.querySelectorAll('.dept-card_di').forEach(function (card) {
      if (card.tagName === 'A' && card.getAttribute('href') === '/diagnostic-imaging') return;
      var link = document.createElement('a');
      Array.prototype.forEach.call(card.attributes, function (attribute) {
        link.setAttribute(attribute.name, attribute.value);
      });
      link.href = '/diagnostic-imaging';
      link.setAttribute('aria-label', '영상의학과 자세히 보기');
      link.style.color = 'inherit';
      link.style.textDecoration = 'none';
      while (card.firstChild) link.appendChild(card.firstChild);
      card.parentNode.replaceChild(link, card);
    });
    var id = 'helix-services-schema';
    if (document.getElementById(id)) return;
    fetch(ROOT + ref + '/seo-snippets/services.html')
      .then(function (r) { if (!r.ok) throw new Error('Services SEO unavailable'); return r.text(); })
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
        var observer;
        function removePrevious() {
          var removed = false;
          document.querySelectorAll('script[type="application/ld+json"]').forEach(function (previous) {
            if (previous.id === id) return;
            try {
              var data = JSON.parse(previous.textContent);
              if ((data['@graph'] || []).some(function (entry) { return entry['@id'] === 'https://helix-amc.com/services#page'; })) {
                previous.remove();
                removed = true;
              }
            } catch (_) {}
          });
          if (removed && observer) observer.disconnect();
          return removed;
        }
        // If the pinned loader's fetch is still pending, retire just its old
        // services graph when it arrives. Other page/site entities are untouched.
        if (!removePrevious()) {
          observer = new MutationObserver(removePrevious);
          observer.observe(document.head, { childList: true });
          setTimeout(function () { observer.disconnect(); }, 30000);
        }
        document.head.appendChild(schema);
      }).catch(function (error) { console.warn('[services-seo]', error); });
  }

  function inject(ref) {
    if (!/^[0-9a-f]{10,40}$/i.test(ref || '')) return;
    imagingSeo(ref);
    imagingEntry(ref);
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
