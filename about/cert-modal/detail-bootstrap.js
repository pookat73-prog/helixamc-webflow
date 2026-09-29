/* 인증 상세 URL 전용 로더. Webflow 페이지 head에서는 이 파일만 불러온다. */
(function () {
  'use strict';

  if (!/^\/(aaha-cert|emergency-cert|cat-cert)\/?$/.test(location.pathname)) return;
  if (window.__helixCertDetailBootstrap) return;
  window.__helixCertDetailBootstrap = true;
  document.documentElement.classList.add('helix-cert-detail');

  var branch = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  var base = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@';
  var css = 'about/cert-modal/modal.css';
  var js = 'about/cert-modal/modal.js';
  var directCss = 'about/cert-detail-direct.css';
  var directJs = 'about/cert-detail-direct.js';
  var key = 'helix.cert-detail.sha.' + branch;
  var fresh = /[?&]fresh=1\b/.test(location.search);

  function url(ref, path) {
    return base + ref + '/' + path +
      (/^[0-9a-f]{7,40}$/i.test(ref) ? '' : '?t=' + Math.floor(Date.now() / 60000));
  }

  function load(ref) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url(ref, css);
    link.onload = function () {
      var directLink = document.createElement('link');
      directLink.rel = 'stylesheet';
      directLink.href = url(ref, directCss);
      document.head.appendChild(directLink);

      var script = document.createElement('script');
      script.src = url(ref, js);
      script.async = false;
      script.onload = function () {
        var directScript = document.createElement('script');
        directScript.src = url(ref, directJs);
        directScript.async = false;
        document.head.appendChild(directScript);
      };
      script.onerror = function () {
        if (ref !== branch) load(branch);
      };
      document.head.appendChild(script);
    };
    link.onerror = function () {
      if (ref !== branch) load(branch);
    };
    document.head.appendChild(link);
  }

  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
  if (!fresh && cached && cached.sha && Date.now() - cached.t < 600000) {
    load(cached.sha);
    return;
  }

  fetch('https://api.github.com/repos/pookat73-prog/helixamc-webflow/git/ref/heads/' + branch,
    { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = ((data.object && data.object.sha) || '').substring(0, 10);
      if (!sha) throw new Error('Missing commit SHA');
      try { localStorage.setItem(key, JSON.stringify({ sha: sha, t: Date.now() })); } catch (_) {}
      load(sha);
    })
    .catch(function () {
      if (cached && cached.sha && Date.now() - cached.t < 43200000) load(cached.sha);
      else load(branch);
    });
})();
