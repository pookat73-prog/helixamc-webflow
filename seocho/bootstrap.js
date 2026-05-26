/* ================================================================
   HELIX AMC - 서초본원 페이지 BOOTSTRAP LOADER (v1.2)
   Webflow 서초본원 페이지 head 에 아래 두 줄만 붙이면 됨:

   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   <script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/seocho/bootstrap.js"></script>

   네이버 지도 SDK 는 본 bootstrap 이 NAVER_CLIENT_ID 와 함께 inject.
   ================================================================ */

(function () {
  'use strict';

  /* ⚠️ 네이버 클라우드 플랫폼에서 발급받은 Web Dynamic Map Client ID.
     도메인 화이트리스트(helixamc.com, *.webflow.io 등)로 보호되므로
     코드 노출 자체는 안전. 발급 후 아래 값만 교체. */
  var NAVER_CLIENT_ID = 'nt1rlbecwi';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* 전역 + 헤더 + 햄버거 (다른 페이지와 동일 사양) */
    'global/global.css',
    /* 전역 GA4 분석 (페이지 뷰 + 스크롤 깊이 25/50/75/100%) */
    'global/scroll-depth.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    /* 서초본원 전용 */
    'seocho/seocho.css',
    'seocho/seocho.js',
    /* 푸터 (홈/about 과 동일) */
    'home/global/footer.css',
    'home/global/footer.js'
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
        console.warn('[seocho-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[seocho-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, null, fallback);
  }

  function injectAll(ref) {
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* 네이버 지도 SDK — Client ID 없으면 경고만 띄우고 스킵 */
  if (NAVER_CLIENT_ID && NAVER_CLIENT_ID !== 'REPLACE_WITH_YOUR_NCP_CLIENT_ID') {
    injectJs(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' +
        encodeURIComponent(NAVER_CLIENT_ID) +
        '&ncpClientId=' + encodeURIComponent(NAVER_CLIENT_ID) +
        '&submodules=geocoder',
      function () { console.log('[seocho-bootstrap] naver maps SDK loaded'); },
      function () { console.warn('[seocho-bootstrap] naver maps SDK load failed'); }
    );
  } else {
    console.warn('[seocho-bootstrap] NAVER_CLIENT_ID 미설정 — seocho/bootstrap.js 의 상수를 교체하세요.');
  }

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
      console.log('[seocho-bootstrap] loading commit', sha);
      window.HELIX_REF = sha;
      injectAll(sha);
    })
    .catch(function (err) {
      console.warn('[seocho-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
      window.HELIX_REF = BRANCH;
      injectAll(BRANCH);
    });
})();
