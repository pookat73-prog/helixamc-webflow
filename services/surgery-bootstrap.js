/* ================================================================
   HELIX AMC — 외과(/surgery) 공통 기능 BOOTSTRAP LOADER  v1.2

   외과 페이지의 Webflow 네이티브 본문은 그대로 두고, 다른 공개 페이지와
   동일한 전역 화면·내비게이션 기능만 연결한다.

   측정 모듈은 포함하지 않는다. 측정 변경은 staging이 아니라 main에서
   별도로 검증·반영하는 프로젝트 규칙을 따른다. 다만 화면 기능 모듈이
   자체적으로 gtag를 호출할 수 있으므로 webflow.io에서는 이를 no-op으로
   바꿔 스테이징 테스트 이벤트가 정식 속성에 섞이지 않게 한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixSurgeryBootstrapInit) return;
  window.__helixSurgeryBootstrapInit = true;

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  if (BRANCH === 'staging') {
    window.gtag = function () {};
  }

  var FILES = [
    'global/viewport-fix.js',
    'global/viewport.js',
    'global/accessibility.js',
    'global/global.css',
    'services/surgery-card-stack.css',
    'global/floating-cta.css',
    'global/floating-cta.js',
    'global/popup.css',
    'global/popup.js',
    'global/top-button.css',
    'global/top-button.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'home/global/footer.css',
    'home/global/footer.js'
  ];

  function cdn(ref, path) {
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path;
  }

  function loadFile(path, ref) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    if (ext === 'css') {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onerror = function () { console.warn('[surgery-bootstrap] load failed:', path); };
      document.head.appendChild(link);
      return;
    }
    if (ext === 'js') {
      var script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onerror = function () { console.warn('[surgery-bootstrap] load failed:', path); };
      document.head.appendChild(script);
    }
  }

  function currentRef() {
    var src = '';
    try {
      if (document.currentScript && document.currentScript.src) src = document.currentScript.src;
    } catch (e) {}
    if (!src) {
      var scripts = document.querySelectorAll('script[src*="/services/surgery-bootstrap.js"]');
      if (scripts.length) src = scripts[scripts.length - 1].src;
    }
    var match = src.match(/@([^/]+)\/services\/surgery-bootstrap\.js/);
    return match && match[1] ? match[1] : BRANCH;
  }

  var REF = currentRef();
  window.HELIX_REF = REF;
  console.log('[surgery-bootstrap] ref', REF);
  FILES.forEach(function (path) { loadFile(path, REF); });
})();

/* 외과 전문성 문구: Webflow 원문이 일치할 때만 지정한 두 지점에서 줄을 나눈다. */
(function () {
  'use strict';

  function initExpertiseStatement() {
    var heading = document.querySelector(
      '.hx-sg-expertise-copy .hx-sg-readable-statement-white'
    );
    if (!heading) return;

    var lines = [
      '수만 건의 임상 데이터와 경험을 바탕으로',
      '수술 중 발생하는 모든 돌발 상황에',
      '즉각 대응합니다.'
    ];
    var copy = heading.textContent.replace(/\s+/g, ' ').trim();
    if (copy !== lines.join(' ')) return;

    heading.textContent = lines.join('\n');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExpertiseStatement, { once: true });
  } else {
    initExpertiseStatement();
  }
})();

/* 안전 시스템 카드: 번호·본문·구분선은 유지하고, 국문·영문 제목 묶음만 순차 표시한다. */
(function () {
  'use strict';

  if (window.__HELIX_SURGERY_CARD_TITLES__) return;
  window.__HELIX_SURGERY_CARD_TITLES__ = true;

  var CARD_BEAT = 520;
  var TITLE_DURATION = 720;
  var TITLE_FADE_EASING = 'cubic-bezier(.32, 0, .18, 1)';
  var TITLE_PULL_EASING = 'cubic-bezier(.6, 0, .12, 1)';

  function initSafetyCardTitles() {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.hx-sg-safety-card')
    );

    if (!cards.length || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var titles = cards.map(function (card) {
      return card.querySelector('.div-block-322');
    }).filter(function (title) {
      return title;
    });

    if (!titles.length) return;

    titles.forEach(function (title) {
      title.style.opacity = '0';
      title.style.transform = 'translateX(-12px) scaleX(.925) scaleY(.985)';
      title.style.transformOrigin = 'left center';
      title.style.transition =
        'opacity ' + TITLE_DURATION + 'ms ' + TITLE_FADE_EASING + ', ' +
        'transform ' + TITLE_DURATION + 'ms ' + TITLE_PULL_EASING;
      title.style.willChange = 'opacity, transform';
    });

    function revealAll() {
      titles.forEach(function (title) {
        title.style.opacity = '1';
        title.style.transform = 'none';
        title.style.willChange = 'auto';
      });
    }

    var started = false;

    function play() {
      if (started) return;
      started = true;

      titles.forEach(function (title, index) {
        window.setTimeout(function () {
          title.style.opacity = '1';
          title.style.transform = 'translateX(0) scaleX(1) scaleY(1)';
        }, index * CARD_BEAT);
      });

      window.setTimeout(
        revealAll,
        ((titles.length - 1) * CARD_BEAT) + TITLE_DURATION + 120
      );
    }

    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      play();
    }, {
      root: null,
      rootMargin: '0px 0px -48% 0px',
      threshold: 0
    });

    observer.observe(cards[0]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSafetyCardTitles, { once: true });
  } else {
    initSafetyCardTitles();
  }
})();
