/* ================================================================
   HELIX AMC - AUTO BOOTSTRAP LOADER
   Pasted once in Webflow. Always serves the latest commit.

   Strategy:
     1) Fetch latest commit SHA from GitHub API
     2) Load CSS/JS via jsDelivr using that SHA (immutable URL)
     3) If any file 404s (jsDelivr indexing delay), fall back to @main
     4) If GitHub API fails entirely, fall back to @main for everything
   ================================================================ */

(function () {
  'use strict';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = 'main';

  var FILES = [
    'home/section1/section1.css',
    'home/section1/section1.js',
    'home/section-divider/divider.css',
    'home/section-divider/divider.js',
    'home/global/buttons.css',
    'home/global/buttons.js',
    'home/global/sections-animations.css',
    'home/global/sections-animations.js'
  ];

  /* Pre-paint FOUC/FOUT guard:
     bootstrap.js가 section1.css를 async로 주입하기 때문에, CSS가 도착하기
     전에 hero 슬로건/버튼이 자연 레이아웃 + 폴백 폰트로 잠깐 그려지는
     깜빡임이 발생함. 인라인 style을 동기 주입해 첫 페인트 전에 가림.
     section1.js가 인라인 visibility:hidden을 직접 설정하면 가드 제거.

     주의: catch-all (.home_background > *) 은 다른 페이지 요소까지 숨길 위험이
     있어 사용 금지. 명시 셀렉터만 사용. */
  (function injectPrepaintGuard() {
    var style = document.createElement('style');
    style.id = 'helix-home-prepaint';
    style.textContent =
      '.home_slogan,' +
      '.bt-box-1,' +
      '.div-block-150,' +
      '[class*="lackFrame_Image"],' +
      '[class*="lackframe_image"]' +
      '{visibility:hidden!important}';
    (document.head || document.documentElement).appendChild(style);
    /* 안전망: 6초 안에 section1.js 가 가드를 제거하지 않으면 강제 해제 */
    setTimeout(function () {
      var s = document.getElementById('helix-home-prepaint');
      if (s && s.parentNode) {
        s.parentNode.removeChild(s);
        console.warn('[helix-bootstrap] section1 not ready in 6s, removing prepaint guard');
      }
    }, 6000);
  })();

  function cdn(ref, path) {
    /* Cache-busting: new timestamp every minute prevents stale browser caches */
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
        console.warn('[helix-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[helix-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
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

  /* Load ScrollTrigger plugin for GSAP animations */
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
      console.log('[helix-bootstrap] loading commit', sha);
      injectAll(sha);
    })
    .catch(function (err) {
      console.warn('[helix-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
      injectAll(BRANCH);
    });
})();

