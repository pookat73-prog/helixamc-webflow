/* ================================================================
   HELIX AMC — 진료과목(services) 페이지 BOOTSTRAP LOADER (v2)

   Webflow services 페이지 <head> 에 붙는 인라인 로더가 도메인 판정으로
   이 파일을 @staging / @main 에서 불러온다.

   이 부트스트랩은 GitHub API 로 대상 브랜치의 최신 커밋 SHA 를 조회한 뒤,
   그 SHA 의 immutable jsDelivr URL 로 실제 파일들을 로드한다.
   → jsDelivr 의 @branch edge 캐시가 stale 이어도 영향 없음(퍼지 불필요).

   기존 Webflow "등록 스크립트"(globalBootstrap / deptUshapeBorder /
   deptDetailNav) 를 대체. 등록 스크립트는 한 달짜리 커스텀코드 앱 기능이라
   만료되므로, 다른 페이지들과 동일하게 GitHub + jsDelivr 로 이관.

   v2: @branch 직접 로드 → 커밋 SHA immutable 로드로 변경(stale 캐시 회피).
   ================================================================ */

(function () {
  'use strict';

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
    /* @<SHA> 는 immutable 이라 캐시 버스터 불필요. @branch 폴백 시엔 분 단위 버스터. */
    var q = /^[0-9a-f]{7,40}$/i.test(ref) ? '' : ('?t=' + Math.floor(Date.now() / 60000));
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path + q;
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
      loadFile(path, BRANCH);   /* SHA 로드 실패 시 브랜치 ref 로 폴백 */
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, fallback);
  }

  function injectAll(ref) {
    window.HELIX_REF = ref;
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* 대상 브랜치 최신 커밋 SHA 조회 → immutable URL 로 로드. 실패하면 @branch 폴백. */
  fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH,
        { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (d) {
      var sha = (d.sha || '').substring(0, 10);
      if (!sha) throw 0;
      injectAll(sha);
    })
    .catch(function () { injectAll(BRANCH); });
})();
