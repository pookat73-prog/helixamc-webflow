/* ================================================================
   HELIX AMC - AUTO BOOTSTRAP LOADER
   Pasted once in Webflow. Always serves the latest commit.

   Strategy:
     1) Use cached SHA from sessionStorage immediately (instant load)
     2) Fetch latest commit SHA from GitHub API in background to refresh cache
     3) Load CSS/JS via jsDelivr using SHA (immutable URL — full CDN/browser cache)
     4) If any file 404s (jsDelivr indexing delay), fall back to @main
     5) If GitHub API fails entirely, fall back to @main for everything

   Performance notes:
     - SHA URL is immutable → no cache-busting query string needed
       (browser/jsDelivr can cache forever, instant on revisit)
     - sessionStorage caches SHA across same-tab navigation (no API roundtrip)
     - ScrollTrigger loaded from same jsDelivr origin as content (connection reuse)
   ================================================================ */

(function () {
  'use strict';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = 'main';
  var SHA_CACHE_KEY = 'helix-sha:' + OWNER + '/' + REPO + '@' + BRANCH;
  var SHA_CACHE_TTL = 5 * 60 * 1000;  /* 5 minutes — fresh enough for editors, fast for users */

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

  function cdn(ref, path) {
    /* SHA-pinned URL is immutable; no cache-busting needed.
       For @main fallback, jsDelivr cache is purged via GitHub Actions workflow. */
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path;
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

  var injected = false;
  function injectAll(ref) {
    if (injected) return;
    injected = true;
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* ── SHA cache helpers ───────────────────────────────────────── */
  function readShaCache() {
    try {
      var raw = sessionStorage.getItem(SHA_CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.sha || !obj.t) return null;
      return obj;
    } catch (e) { return null; }
  }
  function writeShaCache(sha) {
    try {
      sessionStorage.setItem(SHA_CACHE_KEY, JSON.stringify({ sha: sha, t: Date.now() }));
    } catch (e) {}
  }

  /* ── ScrollTrigger: load from jsDelivr (same origin as content → connection reuse) ── */
  injectJs('https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/ScrollTrigger.min.js', function () {
    if (window.gsap && window.gsap.registerPlugin && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
  });

  /* ── Stale-while-revalidate: use cached SHA instantly, refresh in background ── */
  var cached = readShaCache();
  if (cached && (Date.now() - cached.t) < SHA_CACHE_TTL) {
    console.log('[helix-bootstrap] using cached commit', cached.sha);
    injectAll(cached.sha);
  }

  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH;
  fetch(api, { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha in response');
      writeShaCache(sha);
      if (!injected) {
        console.log('[helix-bootstrap] loading commit', sha);
        injectAll(sha);
      }
      /* If we already injected from cache and SHA changed, files for the new
         commit will load on the next page navigation (browser fetches fresh
         once cache expires). Reloading mid-session is unnecessary. */
    })
    .catch(function (err) {
      if (!injected) {
        console.warn('[helix-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
        injectAll(BRANCH);
      }
    });
})();

