/* ================================================================
   HELIX AMC - ABOUT PAGE BOOTSTRAP LOADER
   Webflow About 페이지 head에 한 번만 붙여두면 됨.
   항상 최신 커밋 기준으로 about.css / about.js 를 로드.
   ================================================================ */

(function () {
  'use strict';

  /* FOUC 방지: 첫 렌더부터 hero 요소를 숨기기 위해 CSS 도착을 기다리지 않고
     인라인 <style> 을 동기적으로 주입. about.js 가 .helix-about-ready 를
     <html> 에 부여하면 표시. */
  try {
    var s = document.createElement('style');
    s.id = 'helix-about-fouc-guard';
    s.textContent =
      '.about-heading,.about_contents_sub-title,img.image-23{visibility:hidden}' +
      'html.helix-about-ready .about-heading,' +
      'html.helix-about-ready .about_contents_sub-title,' +
      'html.helix-about-ready img.image-23{visibility:visible}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = 'main';

  /* 깨끗한 롤백 상태 — about 전용 CSS/JS 만 로드. card-stack 등 인터랙션은
     필요 시 다시 추가. */
  var FILES = [
    'about/about.css',
    'about/about.js'
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
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, null, fallback);
  }

  function injectAll(ref) {
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH;

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
