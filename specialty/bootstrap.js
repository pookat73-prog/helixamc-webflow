/* ================================================================
   HELIX AMC — 특화진료(/specialty-care) BOOTSTRAP LOADER  v1.0
   Webflow 특화진료 페이지 head 로더가 이 파일을 불러옴.

   ⚠ 의도적으로 최소 구성.
     이 페이지엔 원래 로더가 없었다. 다른 페이지처럼 전역 묶음
     (헤더/푸터/플로팅 버튼/팝업 등)을 통째로 실으면 요청하지 않은
     요소들이 화면에 새로 나타난다. 그래서 이번 인터랙션에 필요한
     파일만 싣는다. 나중에 전역 묶음이 필요해지면 그 때 추가.

   ⚠ 캐시 원천 회피: FILES 를 @staging/@main 브랜치 ref 로 로드하면
     jsDelivr 엣지 캐시가 최대 12h stale → 코드를 고쳐도 브라우저에
     안 닿는 문제가 반복된다. 그래서 페이지 head 로더가 조회해 둔
     커밋 번호(SHA, 고정 주소)를 그대로 물려받아 FILES 에 쓴다.
   ================================================================ */

(function () {
  'use strict';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* 특화진료 항목 hover 인터랙션 — 설명 펼침. css 단독으로 동작한다. */
    'specialty/specialty.css'

    /* ⚠ 'specialty/specialty.js' (코멧 선) 는 일시 중단.
       실제 페이지에서 선의 조준이 어긋났다 — 옆 칸을 침범하고 세로 길이가
       안 맞았다. 원인 추정: 이 로더가 css 를 <link> 로 붙이는 동안 js 가
       먼저 실행되면, 좌표를 재는 시점에 우리 css 가 아직 적용되지 않아
         · 항목 상자에 position:relative 가 없어 선의 기준점이 엉뚱한
           조상으로 잡히고(→ 옆 칸 침범)
         · 설명이 접혀 있지 않아 '펼친 상태 바닥' 을 잘못 재는(→ 높이 안 맞음)
       일이 동시에 일어난다. 로컬 테스트는 css 가 즉시 적용되는 환경이라
       이 경우를 못 잡았다.
       고쳐서 실제 페이지로 검증한 뒤 다시 켤 것. 그때까지 설명 펼침만 나감. */
  ];

  function cdn(ref, path) {
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

  function injectJs(url, onerr) {
    var s = document.createElement('script');
    s.src   = url;
    s.async = false;
    if (onerr) s.onerror = onerr;
    document.head.appendChild(s);
    return s;
  }

  function loadFile(path, ref, isFallback) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    var fallback = function () {
      if (isFallback) { console.warn('[specialty-bootstrap] load failed:', path); return; }
      console.warn('[specialty-bootstrap] SHA load failed for ' + path + ', retry @' + BRANCH);
      loadFile(path, BRANCH, true);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, fallback);
  }

  /* 자기 자신이 로드된 주소에서 커밋 번호를 그대로 재활용 → GitHub API 재조회 없음.
     head 로더가 이미 specialty/bootstrap.js@<sha> 로 불러왔으므로 그 <sha> 를 쓴다.
     head 로더가 폴백했다면 여기 ref 는 'staging'/'main' 이 되어 그대로 브랜치 로드. */
  function currentRef() {
    var src = '';
    try { if (document.currentScript && document.currentScript.src) src = document.currentScript.src; } catch (e) {}
    if (!src) {
      var ss = document.querySelectorAll('script[src*="/specialty/bootstrap.js"]');
      if (ss.length) src = ss[ss.length - 1].src;
    }
    var m = src.match(/@([^/]+)\/specialty\/bootstrap\.js/);
    return (m && m[1]) ? m[1] : BRANCH;
  }

  var REF = currentRef();
  var usedFallback = (REF === BRANCH);
  window.HELIX_REF = REF;
  console.log('[specialty-bootstrap] ref', REF);
  FILES.forEach(function (path) { loadFile(path, REF, usedFallback); });
})();
