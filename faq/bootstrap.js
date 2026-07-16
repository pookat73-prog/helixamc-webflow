/* ================================================================
   HELIX AMC - FAQ 페이지 BOOTSTRAP LOADER (v2 — 커밋 SHA 불변 로드)
   Webflow FAQ 페이지 head 로더가 이 파일을 불러옴.

   ⚠ 캐시 원천 회피: FILES 를 @staging/@main 브랜치 ref 로 로드하면 jsDelivr
   엣지 캐시가 최대 12h stale → 코드 고쳐도 브라우저에 안 닿는 문제 반복됨.
   그래서 GitHub API 로 브랜치 HEAD 커밋 SHA 를 조회해, 그 SHA 의 immutable
   jsDelivr URL 로 FILES 를 로드한다(홈/글로벌 bootstrap 과 동일 방식).
   ================================================================ */

(function () {
  'use strict';

  /* 첫 화면 이미지 우선 로드 — Webflow 가 모든 <img> 에 loading="lazy" 를
     자동으로 박아서 상단 이미지가 늦게 뜨는 문제. */
  (function eagerLoadAboveFold() {
    function upgrade(img) {
      if (!img || img.__helixEager) return;
      var rect;
      try { rect = img.getBoundingClientRect(); } catch (e) { return; }
      var vh = window.innerHeight || 800;
      if (rect.top < vh * 1.5 && rect.bottom > -100) {
        img.loading = 'eager';
        img.setAttribute('fetchpriority', 'high');
        img.decoding = 'async';
        img.__helixEager = true;
      }
    }
    function scan() { document.querySelectorAll('img').forEach(upgrade); }
    if (document.readyState !== 'loading') scan();
    else document.addEventListener('DOMContentLoaded', scan);
    try {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (!n || n.nodeType !== 1) continue;
            if (n.tagName === 'IMG') upgrade(n);
            else if (n.querySelectorAll) n.querySelectorAll('img').forEach(upgrade);
          }
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 5000);
    } catch (e) {}
  })();

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* GA4 base loader — gtag.js 본체. 다른 모듈의 gtag('event', ...) 호출이
       안전하게 큐잉되도록 FILES 배열 첫 줄에. (도메인 게이트로 스테이징 no-op) */
    'global/ga4-base.js',
    /* GA 측정 점검 오버레이 — ?ga-inspect=1 일 때만 동작 (평소 무해) */
    'global/ga-inspector.js',
    /* 전역 + 헤더 + 햄버거 (다른 페이지와 동일 사양) */
    'global/global.css',
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정 */
    'global/floating-cta.css',
    'global/floating-cta.js',
    /* 전역 GA4 분석 (페이지 뷰 + 스크롤 깊이) */
    'global/scroll-depth.js',
    /* 전역 공지 팝업 */
    'global/popup.css',
    'global/popup.js',
    /* 전역 위로가기 버튼 */
    'global/top-button.css',
    'global/top-button.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    /* FAQ 전용 — 자세히보기/간략히보기 토글 */
    'faq/faq.css',
    'faq/faq.js',
    /* 푸터 (홈/about 과 동일) */
    'home/global/footer.css',
    'home/global/footer.js'
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

  function injectJs(url, onload, onerr) {
    var s = document.createElement('script');
    s.src   = url;
    s.async = false;
    if (onload) s.onload = onload;
    if (onerr)  s.onerror = onerr;
    document.head.appendChild(s);
    return s;
  }

  function loadFile(path, ref, isFallback) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    var fallback = function () {
      if (isFallback) { console.warn('[faq-bootstrap] load failed:', path); return; }
      console.warn('[faq-bootstrap] SHA load failed for ' + path + ', retry @' + BRANCH);
      loadFile(path, BRANCH, true);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, null, fallback);
  }

  function injectAll(ref, isFallback) {
    FILES.forEach(function (path) { loadFile(path, ref, isFallback); });
  }

  /* 브랜치 HEAD 커밋 SHA 조회 → 그 SHA 의 immutable URL 로 로드.
     API 실패(레이트리밋 등) 시에만 @BRANCH 로 폴백. */
  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH +
            '?t=' + Date.now();
  fetch(api, { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha');
      window.HELIX_REF = sha;
      console.log('[faq-bootstrap] loading commit', sha);
      injectAll(sha, false);
    })
    .catch(function (err) {
      console.warn('[faq-bootstrap] SHA API 실패, @' + BRANCH + ' 폴백', err);
      window.HELIX_REF = BRANCH;
      injectAll(BRANCH, true);
    });
})();
