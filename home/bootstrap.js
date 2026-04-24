/* ═══════════════════════════════════════════════════════════════
   HELIX AMC — AUTO BOOTSTRAP LOADER
   Pasted once in Webflow. Always serves the latest commit.

   Strategy:
     1) Fetch latest commit SHA of main branch from GitHub API
     2) Load all CSS/JS files via jsDelivr using that SHA
        (immutable URL → never stale cache)
     3) Fallback to @main if API fails

   Dependencies: none (GSAP is loaded separately in head code)
   ═══════════════════════════════════════════════════════════════ */

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
    'home/global/buttons.js'
  ];

  function cdnBase(sha) {
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + sha;
  }

  function injectAll(base) {
    FILES.forEach(function (path) {
      var ext = path.split('.').pop();
      if (ext === 'css') {
        var link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = base + '/' + path;
        document.head.appendChild(link);
      } else if (ext === 'js') {
        var script = document.createElement('script');
        script.src   = base + '/' + path;
        script.async = false; /* preserve execution order */
        document.head.appendChild(script);
      }
    });
  }

  /* GitHub API: get latest commit SHA (no auth needed, 60 req/h per IP) */
  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH;

  fetch(api, { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha in response');
      console.log('[helix-bootstrap] loading commit', sha);
      injectAll(cdnBase(sha));
    })
    .catch(function (err) {
      console.warn('[helix-bootstrap] SHA fetch failed → fallback to @' + BRANCH, err);
      injectAll(cdnBase(BRANCH));
    });
})();
