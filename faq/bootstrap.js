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
    /* 방문 묶음(세션) + 유입 경로 — 모든 이벤트에 자동 부착.
       ga4-base 가 gtag 를 만든 직후에 감싸야 한다. */
    'global/session.js',
    /* GA 측정 점검 오버레이 — ?ga-inspect=1 일 때만 동작 (평소 무해) */
    'global/ga-inspector.js',
    /* 전 사이트 이벤트 자동 구글시트 로깅 — gtag('event', ...) 를
       가로채 같은 내용을 시트에도 한 줄씩 적재 (GA4 맞춤 측정기준 없이
       바로 확인 가능). 도메인 게이트는 GA4 와 동일(정식 사이트만) */
    'global/sheet-log.js',
    /* 전역 + 헤더 + 햄버거 (다른 페이지와 동일 사양) */
    'global/global.css',
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정 */
    'global/floating-cta.css',
    'global/floating-cta.js',
    /* 전역 GA4 분석 (페이지 뷰 + 스크롤 깊이) */
    'global/scroll-depth.js',
    /* FAQ 전용 GA4 측정 — 질환/일반 탭·필터·항목 펼침·페이지 이동 */
    'faq/faq-ga.js',
    /* FAQ 하단 CTA '전화 문의하기' — 확인창 → 복사 → tel: 연결 + GA4 */
    'faq/cta-call.js',
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
    /* FAQ 카드 겹치기(스택) 실험 — faq-stack.js 가 __helixFaqInit 를 선점해
       아래 기존 클릭 토글(faq.js)을 자동 비활성화. 되돌리려면 이 두 줄만 제거. */
    'faq/faq-stack.css',
    'faq/faq-stack.js',
    /* FAQ 전용 — 자세히보기/간략히보기 토글(스택 실험이 켜지면 자동 무효) */
    'faq/faq.css',
    'faq/faq.js',
    /* FAQ 전용 — 질환으로 보기 탭 필터 칩 연결 */
    'faq/filter.js',
    /* FAQ 전용 — 일반용 목록만 구분선 아코디언(질환용 faq_box 엔 안 닿음) */
    'faq/faq-general.css',
    'faq/faq-general.js',
    /* FAQ 전용 — 자동 반응형. Webflow 에 vw 로만 박힌 크기(하한·상한 없음)에
       clamp(하한, 원래vw, 상한) 을 씌워 좁은/넓은 화면에서 자동으로 맞춤.
       ⚠ 다른 FAQ CSS 뒤에 와야 함(마지막에 로드돼야 크기 규칙이 이김) */
    'faq/faq-responsive.css',
    /* FAQ 전용 — SEO 구조화데이터(FAQPage JSON-LD) 주입.
       Webflow head freeform 쓰기가 406 으로 막혀, 다른 SEO 페이지의 head
       로더 대신 bootstrap FILES 로 동일 주입 수행 (faq/seo-loader.js 참고) */
    'faq/seo-loader.js',
    /* FAQ 전용 — 콘텐츠 캐주얼 복사 방지(억지력). 내용 영역만, AI/봇 무관 */
    'faq/protect.js',
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

  /* 자기 자신이 로드된 URL 의 ref 를 그대로 재활용 → GitHub API 호출 없음.
     페이지 head 로더가 이미 커밋 SHA 를 조회해 faq/bootstrap.js@<sha> 로
     불러오므로, 그 <sha>(immutable) 를 FILES 에도 그대로 쓴다.
     (레이트리밋·"SHA API 실패" 로그 제거. head 로더가 폴백했으면 여기 ref 는
     'staging'/'main' 이 되어 그대로 @BRANCH 로 로드) */
  function currentRef() {
    var src = '';
    try { if (document.currentScript && document.currentScript.src) src = document.currentScript.src; } catch (e) {}
    if (!src) {
      var ss = document.querySelectorAll('script[src*="/faq/bootstrap.js"]');
      if (ss.length) src = ss[ss.length - 1].src;
    }
    var m = src.match(/@([^/]+)\/faq\/bootstrap\.js/);
    return (m && m[1]) ? m[1] : BRANCH;
  }

  var REF = currentRef();
  var usedFallback = (REF === BRANCH); // ref 가 브랜치명이면 head 로더가 폴백한 것
  window.HELIX_REF = REF;
  console.log('[faq-bootstrap] ref', REF);
  injectAll(REF, usedFallback);
})();
