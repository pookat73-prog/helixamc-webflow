/* ================================================================
   HELIX AMC - GLOBAL BOOTSTRAP
   Webflow Site Settings → Custom Code → Head에 한 번만 붙여두면
   모든 페이지에서 자동으로 최신 커밋 기준으로 로드됨.

   ⚠ 스테이징 도메인 게이트 (다른 모든 bootstrap 과 동일 사양):
      *.webflow.io 이면 @staging, 정식 도메인이면 @main 을 본다.
      이 게이트가 없으면 — 스테이징 검증 중(staging 이 main 보다 앞선
      정상 상태) 페이지 로더는 새 메뉴/global 을 @staging 에서 불러오는데,
      이 global bootstrap 은 옛 것을 @main 에서 불러와 덮어써버려
      "새 버전 깜빡 → 옛날로 복귀" 회귀가 남. (반드시 hostname 기준 유지)
   ================================================================ */

(function () {
  'use strict';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    'global/global.css',
    'global/floating-cta.css',
    'global/floating-cta.js',
    'global/top-button.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js'
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
        console.warn('[global-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[global-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH);
    };
    if (ext === 'css') {
      injectCss(url, fallback);
    } else if (ext === 'js') {
      injectJs(url, null, fallback);
    }
  }

  function injectAll(ref) {
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* ?t=Date.now(): GitHub API CDN 엣지 stale SHA 방지 (고유 주소화) */
  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH +
            '?t=' + Date.now();

  fetch(api, { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha in response');
      console.log('[global-bootstrap] loading commit', sha);
      injectAll(sha);
    })
    .catch(function (err) {
      console.warn('[global-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
      injectAll(BRANCH);
    });
})();
