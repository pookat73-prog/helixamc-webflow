/* ================================================================
   HELIX AMC — 내과 페이지 전용 코드 로더

   페이지 head 로더가 대상 브랜치의 커밋 SHA 로 이 파일을 불러온다.
   이 파일은 같은 immutable SHA 의 내과 섹션 인터랙션을 로드한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__hxImBootstrapInit) return;
  window.__hxImBootstrapInit = true;

  var OWNER = 'pookat73-prog';
  var REPO = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  var src = '';

  try {
    if (document.currentScript && document.currentScript.src) src = document.currentScript.src;
  } catch (error) {}

  if (!src) {
    var scripts = document.querySelectorAll('script[src*="/internal-medicine/bootstrap.js"]');
    if (scripts.length) src = scripts[scripts.length - 1].src;
  }

  var match = src.match(/@([^/]+)\/internal-medicine\/bootstrap\.js/);
  var REF = match && match[1] ? match[1] : BRANCH;
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + REF +
    '/internal-medicine/headline-highlight.js' +
    (/^[0-9a-f]{7,40}$/i.test(REF) ? '' : '?t=' + Math.floor(Date.now() / 60000));
  script.async = false;
  script.onerror = function () {
    if (REF === BRANCH) return;
    var fallback = document.createElement('script');
    fallback.src = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + BRANCH +
      '/internal-medicine/headline-highlight.js?t=' + Math.floor(Date.now() / 60000);
    fallback.async = false;
    document.head.appendChild(fallback);
  };
  document.head.appendChild(script);
})();