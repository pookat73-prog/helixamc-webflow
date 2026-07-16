/* ================================================================
   HELIX AMC - FAQ 페이지 BOOTSTRAP LOADER (v1.0 — 아코디언 + 자세히보기 토글)
   Webflow FAQ 페이지 head 에 아래 두 줄만 붙이면 됨:

   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   <script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/faq/bootstrap.js"></script>
   ================================================================ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     STAGING SELF-REDIRECT
     Webflow head 는 @main/faq/bootstrap.js 로 고정. 스테이징 도메인
     (*.webflow.io) 이면 @staging 의 같은 bootstrap 을 다시 불러 그쪽
     (최신 FILES) 로 실행. 2회차는 플래그 보고 skip.
     ───────────────────────────────────────────────────────────── */
  if (!window.__helixFaqBootstrapRedirected &&
      /\.webflow\.io$/i.test(location.hostname)) {
    window.__helixFaqBootstrapRedirected = true;
    var __s = document.createElement('script');
    __s.src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/faq/bootstrap.js?t=' +
              Math.floor(Date.now() / 60000);
    __s.async = false;
    document.head.appendChild(__s);
    return;
  }

  /* 첫 화면 이미지 우선 로드 — Webflow 가 모든 <img> 에 loading="lazy" 를
     자동으로 박아서 상단 이미지가 늦게 뜨는 문제. 첫 ~1.5 화면 안 이미지만
     eager + fetchpriority:high 로 승격. */
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
       안전하게 큐잉되도록 FILES 배열 첫 줄에 둠. (도메인 게이트로 스테이징
       에선 no-op) */
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
    /* FAQ 전용 — 아코디언 여닫기 + 자세히보기/간략히보기 토글 */
    'faq/faq.css',
    'faq/faq.js',
    /* 푸터 (홈/about 과 동일) */
    'home/global/footer.css',
    'home/global/footer.js'
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
        console.warn('[faq-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[faq-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, null, fallback);
  }

  function injectAll(ref) {
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* @branch 직접 로드 — 워크플로우가 push 마다 자동 퍼지 + 워밍업 */
  window.HELIX_REF = BRANCH;
  injectAll(BRANCH);
})();
