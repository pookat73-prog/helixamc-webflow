/* ================================================================
   HELIX AMC - ABOUT PAGE BOOTSTRAP LOADER
   Webflow About 페이지 head에 한 번만 붙여두면 됨.
   항상 최신 커밋 기준으로 파일을 불러옴.
   ================================================================ */

(function () {
  'use strict';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = 'main';

  var FILES = [
    'about/about.css',
    'about/about.js',
    'home/global/card-stack.css',
    'home/global/card-stack.js'
  ];

  /* Pre-paint flicker guard: 카드 덱이 초기화되기 전에 Webflow가 카드 섹션을
     세로로 늘어진 자연 레이아웃으로 먼저 그리는 깜빡임을 차단.
     덱 init이 끝나면 첫 섹션에 .helix-deck-ready를 붙여 노출. */
  (function injectPrepaintGuard() {
    var style = document.createElement('style');
    style.id = 'helix-deck-prepaint';
    style.textContent =
      '.white-frame_connect{visibility:hidden!important}' +
      '.white-frame_connect.helix-deck-ready{visibility:visible!important}';
    /* head가 아직 없을 수도 있으므로 documentElement에 붙임 */
    (document.head || document.documentElement).appendChild(style);
    /* 안전망: 6초 안에 덱이 준비되지 않으면 가드 해제(원본 레이아웃이라도 보이도록) */
    setTimeout(function () {
      if (!document.querySelector('.white-frame_connect.helix-deck-ready')) {
        var s = document.getElementById('helix-deck-prepaint');
        if (s && s.parentNode) s.parentNode.removeChild(s);
        console.warn('[about-bootstrap] deck not ready in 6s, removing prepaint guard');
      }
    }, 6000);
  })();

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
        console.warn('[about-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[about-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
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

  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH;

  /* GSAP ScrollTrigger 로드 */
  var scrollTriggerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
  injectJs(scrollTriggerUrl, function () {
    if (window.gsap && window.gsap.registerPlugin) {
      window.gsap.registerPlugin(ScrollTrigger);
    }
  });

  fetch(api, { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha in response');
      console.log('[about-bootstrap] loading commit', sha);
      window.HELIX_REF = sha;
      injectAll(sha);
    })
    .catch(function (err) {
      console.warn('[about-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
      window.HELIX_REF = BRANCH;
      injectAll(BRANCH);
    });
})();
