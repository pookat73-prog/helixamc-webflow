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
    /* 기기 오분류 교정 — 화면 폭을 바꾸므로 무엇보다 먼저 */
    'global/viewport-fix.js',
    /* 뷰포트 판정 — 다른 모듈이 window.HelixVP 를 쓰므로 그 다음 */
    'global/viewport.js',
    /* 제목 구조·의미 있는 이미지 대체 텍스트 접근성 보완 */
    'global/accessibility.js',
    'global/global.css',
    'global/floating-cta.css',
    'global/floating-cta.js',
    'global/top-button.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js'
  ];

  /* @<SHA> 주소는 그 자체로 "이 커밋의 이 파일" 이라 내용이 절대 안 바뀐다.
     여기에 분 단위 ?t= 를 붙이면 1분마다 주소가 새것이 돼 브라우저/CDN 캐시가
     통째로 무효화됨 → 방문자가 페이지를 옮길 때마다 파일 전체를 매번 다시
     내려받게 되고, jsDelivr 도 매번 원본을 새로 떠오는 게 됨(트래픽 폭증).
     배포하면 SHA 자체가 바뀌므로 버스터 없이도 새 코드는 항상 즉시 반영된다.
     내용이 바뀔 수 있는 @branch 폴백일 때만 버스터를 붙인다. */
  function cdn(ref, path) {
    var q = /^[0-9a-f]{7,40}$/i.test(ref) ? '' : ('?t=' + Math.floor(Date.now() / 60000));
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path + q;
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

  /* ── 커밋 SHA 조회 (트래픽 절감) ───────────────────────────────
     예전: 페이지를 열 때마다 /commits/<branch> 를 불렀다. 이 응답엔 그 커밋에서
     바뀐 파일의 diff 가 통째로 실려 있어 한 번에 수 KB~수십 KB 다. 우리가 필요한
     건 40자짜리 SHA 하나뿐인데 그 값 하나 얻자고 매번 그만큼을 받아왔다.
     지금: SHA 만 들어 있는 /git/ref/heads/<branch>(수백 바이트) 를 쓰고, 받은
     SHA 를 이 탭 안에서 60초 동안 재사용한다. 방문자가 여러 페이지를 둘러봐도
     조회는 사실상 1회. 60초라 배포 직후 새로고침 검증에는 지장이 없다. */
  var SHA_KEY = 'helix.sha.' + BRANCH;
  var SHA_TTL = 60000;

  function resolveSha(done, fail) {
    try {
      var c = JSON.parse(sessionStorage.getItem(SHA_KEY) || 'null');
      if (c && c.sha && (Date.now() - c.t) < SHA_TTL) { done(c.sha); return; }
    } catch (e) {}
    var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO +
              '/git/ref/heads/' + BRANCH + '?t=' + Math.floor(Date.now() / 60000);
    fetch(api, { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        var sha = ((d.object && d.object.sha) || d.sha || '').substring(0, 10);
        if (!sha) throw new Error('no sha in response');
        try { sessionStorage.setItem(SHA_KEY, JSON.stringify({ sha: sha, t: Date.now() })); } catch (e) {}
        done(sha);
      })
      .catch(fail);
  }

  resolveSha(function (sha) {
    console.log('[global-bootstrap] loading commit', sha);
    injectAll(sha);
  }, function (err) {
    console.warn('[global-bootstrap] SHA 조회 실패, @' + BRANCH + ' 로 폴백', err);
    injectAll(BRANCH);
  });
})();
