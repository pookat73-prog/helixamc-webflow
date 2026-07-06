/* ================================================================
   HELIX AMC — 진료과목(services) 페이지 BOOTSTRAP LOADER (v1.0)

   Webflow services 페이지 Page Settings 의 <head> 에 아래 두 줄만:

   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   <script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/services/bootstrap.js"></script>

   기존 Webflow "등록 스크립트"(globalBootstrap / deptUshapeBorder /
   deptDetailNav) 를 대체한다. 등록 스크립트는 한 달짜리 커스텀코드
   앱 기능이라 만료되므로, 다른 페이지들과 동일하게 GitHub + jsDelivr
   부트스트랩 방식(영구)으로 이관.
   ================================================================ */

(function () {
  'use strict';

  /* STAGING SELF-REDIRECT — Webflow head 는 @main 으로 고정이라, 스테이징
     도메인(*.webflow.io)이면 @staging bootstrap 을 재로드해 그쪽 파일로
     실행한다. 2회차는 flag 보고 skip (seocho/bootstrap.js 와 동일 패턴). */
  if (!window.__helixServicesBootstrapRedirected &&
      /\.webflow\.io$/i.test(location.hostname)) {
    window.__helixServicesBootstrapRedirected = true;
    var __s = document.createElement('script');
    __s.src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/services/bootstrap.js?t=' +
              Math.floor(Date.now() / 60000);
    __s.async = false;
    document.head.appendChild(__s);
    return;
  }

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* 전역 스타일 + 헤더/햄버거/상단버튼 — 기존 globalBootstrap 이 로드하던 것 */
    'global/global.css',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'global/top-button.js',
    /* 진료과목 전용 — 카드 U자 테두리(기존 deptUshapeBorder) */
    'services/dept-border.js',
    /* 진료과목 전용 — 화살표 상세이동 버튼 + 카드 강조 호버(기존 deptDetailNav) */
    'services/dept-nav.js'
  ];

  function cdn(ref, path) {
    var t = Math.floor(Date.now() / 60000);
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path + '?t=' + t;
  }

  function injectCss(url, onerr) {
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = url;
    if (onerr) link.onerror = onerr;
    document.head.appendChild(link);
  }

  function injectJs(url, onerr) {
    var s = document.createElement('script');
    s.src   = url;
    s.async = false;
    if (onerr) s.onerror = onerr;
    document.head.appendChild(s);
  }

  function loadFile(path, ref) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    var fallback = function () {
      if (ref === BRANCH) {
        console.warn('[services-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      loadFile(path, BRANCH);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, fallback);
  }

  /* SHA 라운드트립 제거 — 워크플로우가 push 마다 @branch 캐시를 퍼지하므로
     @branch 직접 로드해도 stale 사실상 없음 (seocho/emergency 와 동일). */
  window.HELIX_REF = BRANCH;
  FILES.forEach(function (path) { loadFile(path, BRANCH); });
})();
