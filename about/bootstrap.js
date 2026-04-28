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
