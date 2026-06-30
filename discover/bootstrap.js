/* ================================================================
   HELIX AMC - 디스커버 헬릭스(/discover-helix, "헬릭스 소개") BOOTSTRAP
   ================================================================
   Webflow 디스커버 헬릭스 페이지 head 에 아래 두 줄만 붙이면 됨:

   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   <script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/discover/bootstrap.js"></script>

   ※ 이 페이지는 "측정 전용" 구성 — 헤더/푸터/플로팅 CTA 같은 시각 요소는
     주입하지 않고 GA 측정 모듈만 로드한다. (페이지 모양 변화 0)
       · global/ga4-base.js      gtag.js 본체
       · global/ga-inspector.js  ?ga-inspect=1 측정 점검 오버레이
       · global/scroll-depth.js  discover_page_view + discover_scroll_depth
   ================================================================ */

(function () {
  'use strict';

  /* STAGING SELF-REDIRECT — Webflow head 는 @main 고정이라, 새 파일을 FILES
     에 추가하는 변경은 main 머지 전엔 staging 에 안 들어오는 문제. 스테이징
     도메인이면 @staging 의 같은 bootstrap 을 다시 불러 그쪽 FILES 로 실행.
     2회차는 플래그 보고 skip. */
  if (!window.__helixDiscoverBootstrapRedirected &&
      /\.webflow\.io$/i.test(location.hostname)) {
    window.__helixDiscoverBootstrapRedirected = true;
    var __s = document.createElement('script');
    __s.src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/discover/bootstrap.js?t=' +
              Math.floor(Date.now() / 60000);
    __s.async = false;
    document.head.appendChild(__s);
    return;
  }

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* GA4 base loader — gtag.js 본체. 반드시 scroll-depth.js 보다 먼저 로드. */
    'global/ga4-base.js',
    /* GA 측정 점검 오버레이 — ?ga-inspect=1 일 때만 동작 (평소 무해).
       ga4-base 바로 다음에 둬 다른 모듈보다 먼저 gtag 가로채기 설치. */
    'global/ga-inspector.js',
    /* 전역 GA4 분석 (페이지 뷰 + 스크롤 깊이 25/50/75/100%) */
    'global/scroll-depth.js'
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
    return link;
  }

  function injectJs(url, onload, onerr) {
    var s = document.createElement('script');
    s.src   = url;
    s.async = false;
    if (onload) s.onload = onload;
    if (onerr)  s.onerror = onerr;
    document.head.appendChild(s);
    return s;
  }

  function loadFile(path, ref) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    var fallback = function () {
      if (ref === BRANCH) {
        console.warn('[discover-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[discover-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, null, fallback);
  }

  function injectAll(ref) {
    console.log('[discover-bootstrap] injecting ' + FILES.length + ' files at ref=' + ref);
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* ?t=Date.now(): GitHub API 엣지 stale SHA 방지 */
  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH +
            '?t=' + Date.now();

  fetch(api, {
    headers: { 'Accept': 'application/vnd.github+json' },
    cache: 'no-store'
  })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha in response');
      console.log('[discover-bootstrap] loading commit', sha);
      window.HELIX_REF = sha;
      injectAll(sha);
    })
    .catch(function (err) {
      console.warn('[discover-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
      window.HELIX_REF = BRANCH;
      injectAll(BRANCH);
    });
})();
