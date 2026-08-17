/* ================================================================
   HELIX AMC — 특화진료(/specialty-care) BOOTSTRAP LOADER  v1.0
   Webflow 특화진료 페이지 head 로더가 이 파일을 불러옴.

   ⚠ 처음엔 이 페이지 전용 인터랙션 파일만 싣는 최소 구성이었다.
     페이지가 정식 공개되면서 헤더 메뉴·햄버거·상담 CTA 가 다른 페이지와
     똑같이 동작해야 해서 전역 묶음을 추가했다 (헤더 링크가 안 걸리고
     호버 효과도 없고 상담 버튼도 안 뜨던 원인).

   ⚠ hamburger.js 는 GSAP 을 쓴다 → 페이지 head 에 gsap.min.js 가
     먼저 실려 있어야 한다 (services 페이지와 동일 구성).

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
    /* 기기 오분류 교정 — 화면 폭을 바꾸므로 무엇보다 먼저 */
    'global/viewport-fix.js',
    /* 뷰포트 판정 (window.HelixVP) — 교정된 폭을 봐야 하므로 그 다음 */
    'global/viewport.js',
    /* 전역 스타일 — 헤더 링크 스타일·호버 효과가 여기 들어 있다 */
    'global/global.css',
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정 */
    'global/floating-cta.css',
    'global/floating-cta.js',
    /* 헤더 햄버거 메뉴 (GSAP 의존) */
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    /* 헤더의 잠긴 탭 클릭 시 "준비중입니다" 토스트 + '진료과목'·'특화진료' 탭을
       실제 페이지 링크로 승격(markLiveNav). 다른 페이지와 동일 동작. */
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    /* 특화진료 항목 hover 인터랙션
         · specialty.css — 설명 펼침/접힘. js 없이 단독으로 동작한다.
         · specialty.js  — 코멧 선(ㄱ자 경로 + 바닥 가로선). 선만 담당.
       둘을 나눠 둔 이유: js 가 CDN 에서 못 와도 설명은 정상적으로 펼쳐진다. */
    'specialty/specialty.css',
    'specialty/specialty.js'
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
