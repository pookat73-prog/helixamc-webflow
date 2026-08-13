/* ================================================================
   HELIX AMC — 진료과목(services) 페이지 BOOTSTRAP LOADER (v2)

   Webflow services 페이지 <head> 에 붙는 인라인 로더가 도메인 판정으로
   이 파일을 @staging / @main 에서 불러온다.

   이 부트스트랩은 GitHub API 로 대상 브랜치의 최신 커밋 SHA 를 조회한 뒤,
   그 SHA 의 immutable jsDelivr URL 로 실제 파일들을 로드한다.
   → jsDelivr 의 @branch edge 캐시가 stale 이어도 영향 없음(퍼지 불필요).

   기존 Webflow "등록 스크립트"(globalBootstrap / deptUshapeBorder /
   deptDetailNav) 를 대체. 등록 스크립트는 한 달짜리 커스텀코드 앱 기능이라
   만료되므로, 다른 페이지들과 동일하게 GitHub + jsDelivr 로 이관.

   v2: @branch 직접 로드 → 커밋 SHA immutable 로드로 변경(stale 캐시 회피).
   ================================================================ */

(function () {
  'use strict';

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* 운영자 제외 스위치 — ?helix-noga=1 로 켠 브라우저는 측정 안 함.
       gtag 가 만들어지기 전에 가로채야 해서 ga4-base 보다 앞에 둔다. */
    'global/measure-gate.js',
    /* ── 측정 (다른 페이지와 동일 구성) ──────────────────────────
       이 페이지는 그동안 측정 파일이 하나도 없어 방문·스크롤·클릭이
       통째로 기록되지 않았다. ga4-base 가 gtag 를 만들고, session 이
       방문 묶음·유입 경로를 붙이고, sheet-log 가 구글 시트로 복사한다.
       순서 중요 — ga4-base 가 가장 먼저. */
    'global/ga4-base.js',
    'global/session.js',
    'global/sheet-log.js',
    'global/ga-inspector.js',
    'global/scroll-depth.js',
    /* 페이지 체류시간 — 이 페이지에 실제로 몇 초 있었나 */
    'global/page-time.js',
    'global/section-reach.js',
    /* 진료과 카드 클릭(어느 과에 관심 있는지) — 이 페이지 전용 */
    'services/services-ga.js',
    /* 전역 스타일 + 헤더/햄버거/상단버튼 — 기존 globalBootstrap 이 로드하던 것 */
    'global/global.css',
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정. 이 페이지만 빠져 있어
       상담 신청 버튼이 안 떴다. 다른 페이지와 동일 구성으로 맞춤. */
    'global/floating-cta.css',
    'global/floating-cta.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    /* 헤더의 잠긴 탭(data-coming-soon) 클릭 시 "준비중입니다" 토스트 +
       '진료과목' 탭을 /services 로 승격(markLiveNav). 다른 페이지와 동일 동작. */
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    /* 위로가기 버튼(global/top-button.*)은 진료과목 페이지에서 의도적으로 제외.
       사용자 요청 — 이 페이지에서만 위로가기 버튼 안 띄움. 다른 페이지는 그대로 유지.
       (남아있을 수 있는 Webflow legacy 버튼 .link-block-11 은 services.css 에서 숨김) */
    /* 진료과목 전용 — 페이지 오버라이드(영상의학과 카드 모바일 사진 제거 등) */
    'services/services.css',
    /* 진료과목 전용 — 가로 폰을 태블릿이 아닌 가로모바일 레이아웃으로 강제 */
    'services/landscape-mobile.js',
    /* 진료과목 전용 — 카드 U자 테두리(기존 deptUshapeBorder) */
    'services/dept-border.js',
    /* 진료과목 전용 — 화살표 상세이동 버튼 + 카드 강조 호버(기존 deptDetailNav) */
    'services/dept-nav.js',
    /* 진료과목 전용 — SEO 구조화데이터(MedicalWebPage + 진료과 ItemList) 주입.
       Webflow 커스텀코드 쓰기 406 우회 (services/seo-loader.js 참고) */
    'services/seo-loader.js'
  ];

  function cdn(ref, path) {
    /* @<SHA> 는 immutable 이라 캐시 버스터 불필요. @branch 폴백 시엔 분 단위 버스터. */
    var q = /^[0-9a-f]{7,40}$/i.test(ref) ? '' : ('?t=' + Math.floor(Date.now() / 60000));
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/' + path + q;
  }

  function injectCss(url, onerr) {
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = url;
    if (onerr) link.onerror = onerr;
    document.head.appendChild(link);
  }

  function injectJs(url, onerr) {
    var s = document.createElement('script');
    s.src   = url;
    s.async = false;
    if (onerr) s.onerror = onerr;
    document.head.appendChild(s);
  }

  function loadFile(path, ref) {
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    var fallback = function () {
      if (ref === BRANCH) {
        console.warn('[services-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      loadFile(path, BRANCH);   /* SHA 로드 실패 시 브랜치 ref 로 폴백 */
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, fallback);
  }

  function injectAll(ref) {
    window.HELIX_REF = ref;
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

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

  /* 대상 브랜치 최신 커밋 SHA 조회 → immutable URL 로 로드. 실패하면 @branch 폴백. */
  resolveSha(function (sha) { injectAll(sha); }, function () { injectAll(BRANCH); });
})();
