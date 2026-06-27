/* ================================================================
   HELIX AMC - home/bootstrap-v3.js (REDIRECT SHIM)
   ================================================================
   호환성 shim. Webflow head 에 옛 v3 src 가 박혀 있는 페이지가
   있어, 이 파일은 본체 home/bootstrap.js 를 한 번 더 fetch 해서
   실행함. 결과적으로 FILES 배열은 본체 한 곳에서만 관리.

   - staging / production 분기는 본체와 동일 (hostname 기반)
   - 중복 실행 가드 (__HELIX_BOOTSTRAP_V3_REDIRECTED)
   - 캐시버스트: 분 단위 timestamp

   Webflow head 의 src 를 home/bootstrap.js 로 교체할 수 있으면
   본 파일은 사실상 무용지물이지만, 교체 누락 페이지의 안전망으로
   유지함.
   ================================================================ */
(function () {
  'use strict';
  if (window.__HELIX_BOOTSTRAP_V3_REDIRECTED) return;
  window.__HELIX_BOOTSTRAP_V3_REDIRECTED = true;

  console.log('[helix-bootstrap] v3 shim → 본체 home/bootstrap.js 로 redirect');

  var ref = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' + ref +
          '/home/bootstrap.js?t=' + Math.floor(Date.now() / 60000);
  s.async = false;
  (document.head || document.documentElement).appendChild(s);
})();
