/* ================================================================
   HELIX AMC — 외과(/oegwa) 공통 기능 BOOTSTRAP LOADER  v1.0

   외과 페이지의 Webflow 네이티브 본문은 그대로 두고, 다른 공개 페이지와
   동일한 전역 화면·내비게이션 기능만 연결한다.

   측정 모듈은 포함하지 않는다. 측정 변경은 staging이 아니라 main에서
   별도로 검증·반영하는 프로젝트 규칙을 따른다. 다만 화면 기능 모듈이
   자체적으로 gtag를 호출할 수 있으므로 webflow.io에서는 이를 no-op으로
   바꿔 스테이징 테스트 이벤트가 정식 속성에 섞이지 않게 한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixSurgeryBootstrapInit) return;
  window.__helixSurgeryBootstrapInit = true;

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  if (BRANCH === 'staging') {
    window.gtag = function () {};
  }

  var FILES = [
    'global/viewport-fix.js',
    'global/viewport.js',
    'global/accessibility.js',
    'global/global.css',
    'global/floating-cta.css',
    'global/floating-cta.js',
    'global/popup.css',
    'global/popup.js',
    'global/top-button.css',
    'global/top-button.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'home/global/footer.css',
    'home/global/footer.js'
  ];

  function cdn(ref, path) {
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path;
  }

  function loadFile(path, ref) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    if (ext === 'css') {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onerror = function () { console.warn('[surgery-bootstrap] load failed:', path); };
      document.head.appendChild(link);
      return;
    }
    if (ext === 'js') {
      var script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onerror = function () { console.warn('[surgery-bootstrap] load failed:', path); };
      document.head.appendChild(script);
    }
  }

  function currentRef() {
    var src = '';
    try {
      if (document.currentScript && document.currentScript.src) src = document.currentScript.src;
    } catch (e) {}
    if (!src) {
      var scripts = document.querySelectorAll('script[src*="/services/surgery-bootstrap.js"]');
      if (scripts.length) src = scripts[scripts.length - 1].src;
    }
    var match = src.match(/@([^/]+)\/services\/surgery-bootstrap\.js/);
    return match && match[1] ? match[1] : BRANCH;
  }

  var REF = currentRef();
  window.HELIX_REF = REF;
  console.log('[surgery-bootstrap] ref', REF);
  FILES.forEach(function (path) { loadFile(path, REF); });
})();
