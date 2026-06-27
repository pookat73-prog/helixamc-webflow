/* ================================================================
   HELIX AMC - 서초본원 페이지 BOOTSTRAP LOADER (v1.14 — 의료진 모달 정식 도메인 활성화)
   Webflow 서초본원 페이지 head 에 아래 두 줄만 붙이면 됨:

   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   <script src="https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/seocho/bootstrap.js"></script>

   네이버 지도 SDK 는 본 bootstrap 이 NAVER_CLIENT_ID 와 함께 inject.
   ================================================================ */

(function () {
  'use strict';

  /* STAGING SELF-REDIRECT — Webflow head 는 @main 으로 고정이라
     새 파일을 FILES 에 추가하는 변경은 main 머지 전엔 staging 에
     안 들어왔던 문제. 스테이징 도메인이면 @staging bootstrap 을
     재로드해서 그쪽 FILES 로 실행한다. 2회차는 flag 보고 skip. */
  if (!window.__helixSeochoBootstrapRedirected &&
      /\.webflow\.io$/i.test(location.hostname)) {
    window.__helixSeochoBootstrapRedirected = true;
    var __s = document.createElement('script');
    __s.src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/seocho/bootstrap.js?t=' +
              Math.floor(Date.now() / 60000);
    __s.async = false;
    document.head.appendChild(__s);
    return;
  }

  /* 첫 화면 이미지 우선 로드 — Webflow 가 모든 <img> 에 loading="lazy" 를
     자동으로 박아서 hero/상단 이미지가 늦게 뜨는 문제. 첫 ~1.5 화면 분량
     안에 들어오는 이미지만 eager + fetchpriority:high 로 승격. */
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

  /* ⚠️ 네이버 클라우드 플랫폼에서 발급받은 Web Dynamic Map Client ID.
     도메인 화이트리스트(helixamc.com, *.webflow.io 등)로 보호되므로
     코드 노출 자체는 안전. 발급 후 아래 값만 교체. */
  var NAVER_CLIENT_ID = 'nt1rlbecwi';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* GA4 base loader — gtag.js 본체. 반드시 scroll-depth.js / seocho.js 보다
       먼저 로드. 다른 모든 모듈의 gtag('event', ...) 호출이 안전하게 큐잉되도록
       FILES 배열의 가장 첫 줄에 둠. */
    'global/ga4-base.js',
    /* 전역 + 헤더 + 햄버거 (다른 페이지와 동일 사양) */
    'global/global.css',
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정 */
    'global/floating-cta.css',
    'global/floating-cta.js',
    /* 전역 GA4 분석 (페이지 뷰 + 스크롤 깊이 25/50/75/100%) */
    'global/scroll-depth.js',
    /* 전역 공지 팝업 (중앙 모달, 매 방문 노출) */
    'global/popup.css',
    'global/popup.js',
    /* 전역 위로가기 버튼 — body 주입 + 푸터 위 1.5vw 클램프 */
    'global/top-button.css',
    'global/top-button.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    /* 서초본원 전용 */
    'seocho/seocho.css',
    'seocho/seocho.js',
    /* 서초본원 하단 리뉴얼 고정 바 (모바일 전용) */
    'seocho/renewal-bar.css',
    'seocho/renewal-bar.js',
    /* 의료진 상세 모달 — 페이지에 [data-doctor-open] 이 있을 때만 동작.
       없으면 listen 만 하고 zero overhead. 카드 컴포넌트 자체와 무관.
       데이터: seocho/doctors/data/<group>/<slug>.json */
    'seocho/doctors/modal.css',
    'seocho/doctors/modal.js',
    /* 의료진 카드 JSON 렌더러 — 페이지에 [data-doctor-group] 컨테이너가
       있을 때만 동작. Phase 1 (인프라) 시점엔 컨테이너 없어 no-op.
       데이터: seocho/doctors/data/<group>/_index.json + <slug>.json */
    'seocho/doctors/card-render.js',
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
        console.warn('[seocho-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[seocho-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, null, fallback);
  }

  function injectAll(ref) {
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* 네이버 지도 SDK — Client ID 없으면 경고만 띄우고 스킵 */
  if (NAVER_CLIENT_ID && NAVER_CLIENT_ID !== 'REPLACE_WITH_YOUR_NCP_CLIENT_ID') {
    injectJs(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' +
        encodeURIComponent(NAVER_CLIENT_ID) +
        '&ncpClientId=' + encodeURIComponent(NAVER_CLIENT_ID) +
        '&submodules=geocoder',
      function () { console.log('[seocho-bootstrap] naver maps SDK loaded'); },
      function () { console.warn('[seocho-bootstrap] naver maps SDK load failed'); }
    );
  } else {
    console.warn('[seocho-bootstrap] NAVER_CLIENT_ID 미설정 — seocho/bootstrap.js 의 상수를 교체하세요.');
  }

  /* SHA 라운드트립 제거 — 워크플로우가 push 마다 자동 퍼지 + 워밍업 하므로
     @branch 직접 로드해도 stale 사실상 없음. 이전 SHA 패턴 대비 ~300ms 단축. */
  window.HELIX_REF = BRANCH;
  injectAll(BRANCH);

  /* 의료진 카드 번들 선제 fetch — bootstrap 실행 즉시 시작해서, card-render.js
     가 로드되어 실행될 때쯤이면 이미 도착해 있도록. card-render 는
     window.HELIX_DOCTOR_BUNDLE_PROMISE 가 있으면 그걸 우선 await. */
  try {
    var bundleUrl = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
                    '@' + BRANCH + '/seocho/doctors/data/_all.json?t=' +
                    Math.floor(Date.now() / 60000);
    window.HELIX_DOCTOR_BUNDLE_PROMISE = fetch(bundleUrl, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  } catch (e) {}
})();
