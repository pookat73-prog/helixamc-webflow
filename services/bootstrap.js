/* HELIX AMC — fixed release loader for services/bootstrap.js. */

(function () {
  'use strict';

  var releaseEntry = document.currentScript && document.currentScript.src || '';
  var releaseRoot = "https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@";
  var releaseRef = releaseEntry.slice(releaseRoot.length, releaseRoot.length + 40);
  var releasePath = releaseEntry.split(/[?#]/, 1)[0];
  if (!/^[0-9a-f]{40}$/.test(releaseRef) ||
      releasePath !== releaseRoot + releaseRef + "/services/bootstrap.js") {
    console.warn('[helix-bootstrap] expected a fixed release URL:', "services/bootstrap.js");
    return;
  }

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';

  var FILES = [
    /* 기기 오분류 교정 — 화면 폭을 바꾸므로 무엇보다 먼저.
       이 페이지에만 있던 services/landscape-mobile.js 를 전 페이지용으로
       옮긴 것. 같은 판정·같은 처방이며, 둘을 함께 두면 meta 를 서로
       덮어써 깜빡이므로 옛 파일은 제거했다. */
    'global/viewport-fix.js',
    /* 뷰포트 판정 (window.HelixVP) — 교정된 폭을 봐야 하므로 그 다음 */
    'global/viewport.js',
    /* 진료과목 카드의 테두리와 화살표를 측정·공통 스크립트보다 먼저 준비한다.
       Webflow 카드가 이미 DOM에 있어 초기 화면에서 장식이 늦게 덧그려지는 시간을 줄인다. */
    'services/dept-border.js',
    'services/dept-nav.js',
    'global/accessibility.js',
    /* 운영자 제외 스위치 — ?helix-noga=1 로 켠 브라우저는 측정 안 함.
       gtag 가 만들어지기 전에 가로채야 해서 ga4-base 보다 앞에 둔다. */
    'global/measure-gate.js',
    /* ── 측정 (다른 페이지와 동일 구성) ──────────────────────────
       이 페이지는 그동안 측정 파일이 하나도 없어 방문·스크롤·클릭이
       통째로 기록되지 않았다. ga4-base 가 gtag 를 만들고, session 이
       방문 묶음·유입 경로를 붙이고, sheet-log 가 구글 시트로 복사한다.
       순서 중요 — ga4-base 가 가장 먼저. */
    'global/ga4-base.js',
    'global/session.js',
    'global/sheet-log.js',
    'global/ga-inspector.js',
    'global/scroll-depth.js',
    /* 페이지 체류시간 — 이 페이지에 실제로 몇 초 있었나 */
    'global/page-time.js',
    'global/section-reach.js',
    /* 진료과 카드 클릭(어느 과에 관심 있는지) — 이 페이지 전용 */
    'services/services-ga.js',
    /* 전역 스타일 + 헤더/햄버거/상단버튼 — 기존 globalBootstrap 이 로드하던 것 */
    'global/global.css',
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정. 이 페이지만 빠져 있어
       상담 신청 버튼이 안 떴다. 다른 페이지와 동일 구성으로 맞춤. */
    'global/floating-cta.css',
    'global/floating-cta.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    /* 헤더의 잠긴 탭(data-coming-soon) 클릭 시 "준비중입니다" 토스트 +
       '진료과목' 탭을 /services 로 승격(markLiveNav). 다른 페이지와 동일 동작. */
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    /* 위로가기 버튼(global/top-button.*)은 진료과목 페이지에서 의도적으로 제외.
       사용자 요청 — 이 페이지에서만 위로가기 버튼 안 띄움. 다른 페이지는 그대로 유지.
       (남아있을 수 있는 Webflow legacy 버튼 .link-block-11 은 services.css 에서 숨김) */
    /* 진료과목 전용 — 페이지 오버라이드(영상의학과 카드 모바일 사진 제거 등) */
    'services/services.css',
    /* 진료과목 전용 — SEO 구조화데이터(MedicalWebPage + 진료과 ItemList) 주입.
       Webflow 커스텀코드 쓰기 406 우회 (services/seo-loader.js 참고) */
    'services/seo-loader.js'
  ];

  function cdn(ref, path) {
    /* @<SHA> 는 immutable 이라 캐시 버스터 불필요. @branch 폴백 시엔 분 단위 버스터. */
    var q = /^[0-9a-f]{7,40}$/i.test(ref) ? '' : ('?t=' + Math.floor(Date.now() / 60000));
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path + q;
  }

  function injectCss(url, onerr) {
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = url;
    if (onerr) link.onerror = onerr;
    if (/\/home\/global\/hamburger\.css(?:[?#]|$)/.test(url)) {
      link.addEventListener('load', function () { link.removeAttribute('data-helix-menu-css-error'); }, true);
      link.addEventListener('error', function () { link.setAttribute('data-helix-menu-css-error', link.href); }, true);
    }
    document.head.appendChild(link);
  }

  function injectJs(url, onerr) {
    var s = document.createElement('script');
    s.src   = url;
    s.async = /\/global\/ga-inspector\.js(?:[?#]|$)/.test(url);
    if (/\/home\/global\/hamburger\.js(?:[?#]|$)/.test(url)) {
      /* Preserve a native failure even when the shared loader starts later. */
      s.setAttribute('data-helix-menu-js-pending', url);
      s.onload = function () {
        s.removeAttribute('data-helix-menu-js-pending');
        s.removeAttribute('data-helix-menu-js-error');
      };
      s.onerror = function () {
        s.removeAttribute('data-helix-menu-js-pending');
        s.setAttribute('data-helix-menu-js-error', url);
        s.remove(); // A native-failed script cannot own the module for older consumers.
        if (onerr) onerr();
      };
    } else if (onerr) s.onerror = onerr;
    document.head.appendChild(s);
  }

  function loadFile(path, ref, menuRetry) {
    if (window.__helixSiteMeasurementOwns && window.__helixSiteMeasurementOwns(path)) { return; }
    /* Respect module ownership claims; guards alone do not prove completion. */
    var initialized = {
      'global/measure-gate.js': '__helixGateInit',
      'global/ga4-base.js': '__helixGA4Init',
      'global/session.js': '__helixSessionInit',
      'global/sheet-log.js': '__helixSheetLogInit',
      'home/global/hamburger.js': '__helixHamburgerInit'
    };
    if (initialized[path] && window[initialized[path]]) return;
    /* 점검 화면은 ga-inspector.js와 같은 URL 조건에서만 내려받는다. */
    if (path === 'global/ga-inspector.js' &&
        !/[?&](ga-inspect|debug-ga)=1/.test(location.search)) return;
    var url = cdn(ref, path);
    if (path === 'home/global/hamburger.js') {
      /* A concurrent producer may still own this exact request. Presence alone
         cannot identify unknown/failed scripts or a different asset version. */
      var scripts = document.querySelectorAll('script[data-helix-menu-js-pending]');
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src === url &&
            scripts[i].getAttribute('data-helix-menu-js-pending') === url) return;
      }
    }
    var ext = path.split('.').pop();
    var fallback = function () {
      var menuAsset = /^(home\/global\/hamburger\.(css|js))$/.test(path) && /^[0-9a-f]{7,40}$/i.test(ref);
      if (menuRetry || !menuAsset) {
        console.warn('[services-bootstrap] failed even from @' + ref + ':', path);
        return;
      }
      /* The menu pair shares an immutable protocol; other assets retain branch fallback. */
      loadFile(path, ref, menuAsset);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, fallback);
  }

  function injectAll(ref) {
    window.HELIX_REF = ref;
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  injectAll(releaseRef);
})();
