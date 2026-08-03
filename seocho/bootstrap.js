/* ================================================================
   HELIX AMC - 서초본원 페이지 BOOTSTRAP LOADER (v1.15 — 커밋 SHA 고정 로딩으로 캐시 stale 원천 차단)
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
    /* 방문 묶음(세션) + 유입 경로 — 모든 이벤트에 자동 부착.
       ga4-base 가 gtag 를 만든 직후에 감싸야 한다. */
    'global/session.js',
    /* GA 측정 점검 오버레이 — ?ga-inspect=1 일 때만 동작 (평소 무해).
       ga4-base 바로 다음에 둬 다른 모듈보다 먼저 gtag 가로채기 설치. */
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
    /* 전역 GA4 분석 (페이지 뷰 + 스크롤 깊이 25/50/75/100%) */
    'global/scroll-depth.js',
    /* 전역 GA4 분석 (섹션 도달 — 어느 파트까지 봤나) */
    'global/section-reach.js',
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

  /* @<SHA> 주소는 그 자체로 "이 커밋의 이 파일" 이라 내용이 절대 안 바뀐다.
     여기에 분 단위 ?t= 를 붙이면 1분마다 주소가 새것이 돼 브라우저/CDN 캐시가
     통째로 무효화됨 → 방문자가 페이지를 옮길 때마다 파일 전체를 매번 다시
     내려받게 되고, jsDelivr 도 매번 원본을 새로 떠오는 게 됨(트래픽 폭증).
     배포하면 SHA 자체가 바뀌므로 버스터 없이도 새 코드는 항상 즉시 반영된다.
     내용이 바뀔 수 있는 @branch 폴백일 때만 버스터를 붙인다. */
  function cdn(ref, path) {
    var q = /^[0-9a-f]{7,40}$/i.test(ref) ? '' : ('?t=' + Math.floor(Date.now() / 60000));
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path + q;
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

  /* 의료진 카드 번들 선제 fetch — card-render.js 가 로드될 때쯤 이미 도착해
     있도록. card-render 는 window.HELIX_DOCTOR_BUNDLE_PROMISE 가 있으면 우선 await.
     ref(SHA 또는 branch) 를 받아 그 주소로 프리페치. */
  function startBundlePrefetch(ref) {
    try {
      /* @<SHA> 면 불변이라 버스터·no-store 불필요 (매 방문 25KB 재다운로드였음) */
      var isSha = /^[0-9a-f]{7,40}$/i.test(ref);
      var bundleUrl = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
                      '@' + ref + '/seocho/doctors/data/_all.json' +
                      (isSha ? '' : '?t=' + Math.floor(Date.now() / 60000));
      window.HELIX_DOCTOR_BUNDLE_PROMISE = fetch(bundleUrl, isSha ? undefined : { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    } catch (e) {}
  }

  /* 실제 로드 진입 — ref 로 모든 파일/번들 로드. HELIX_REF 도 같은 ref 로
     맞춰 card-render.js 등이 동일 커밋의 데이터를 가져오게 함. */
  function boot(ref) {
    window.HELIX_REF = ref;
    injectAll(ref);
    startBundlePrefetch(ref);
  }

  /* 근본 캐시 수정 — 최신 커밋 SHA 를 GitHub API 로 조회해 그 SHA 의
     immutable jsDelivr 주소로 로드. @branch 는 jsDelivr 엣지 캐시가 최대
     수시간 stale 이라 배포가 즉시 반영 안 되던 문제 → SHA 는 매 배포마다
     새 주소라 캐시가 낄 수 없어 즉시 반영. (홈 로더와 동일 전략.)
     API 실패 / 파일 404 시엔 loadFile 이 알아서 @branch 로 폴백. */
  /* ── 커밋 SHA 조회 (트래픽 절감) ───────────────────────────────
     예전: 페이지를 열 때마다 /commits/<branch> 를 불렀다. 이 응답엔 그 커밋에서
     바뀐 파일의 diff 가 통째로 실려 있어 한 번에 수 KB~수십 KB 다. 우리가 필요한
     건 40자짜리 SHA 하나뿐인데 그 값 하나 얻자고 매번 그만큼을 받아왔다.
     지금: SHA 만 들어 있는 /git/ref/heads/<branch>(수백 바이트) 를 쓰고, 받은
     SHA 를 이 탭 안에서 60초 동안 재사용한다. 방문자가 여러 페이지를 둘러봐도
     조회는 사실상 1회. 60초라 배포 직후 새로고침 검증에는 지장이 없다. */
  var SHA_KEY = 'helix.sha.' + BRANCH;
  var SHA_TTL = 60000;

  function resolveSha(done, fail) {
    try {
      var c = JSON.parse(sessionStorage.getItem(SHA_KEY) || 'null');
      if (c && c.sha && (Date.now() - c.t) < SHA_TTL) { done(c.sha); return; }
    } catch (e) {}
    var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO +
              '/git/ref/heads/' + BRANCH + '?t=' + Math.floor(Date.now() / 60000);
    fetch(api, { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        var sha = ((d.object && d.object.sha) || d.sha || '').substring(0, 10);
        if (!sha) throw new Error('no sha in response');
        try { sessionStorage.setItem(SHA_KEY, JSON.stringify({ sha: sha, t: Date.now() })); } catch (e) {}
        done(sha);
      })
      .catch(fail);
  }

  if (window.__helixCommitSha) {
    boot(window.__helixCommitSha.substring(0, 10));
  } else {
    resolveSha(function (sha) {
      console.log('[seocho-bootstrap] loading commit', sha);
      boot(sha);
    }, function (err) {
      console.warn('[seocho-bootstrap] SHA 조회 실패, @' + BRANCH + ' 로 폴백', err);
      boot(BRANCH);
    });
  }
})();
