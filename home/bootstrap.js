/* ================================================================
   HELIX AMC - AUTO BOOTSTRAP LOADER (v3.4 — home scroll hint)
   Pasted once in Webflow. Always serves the latest commit.

   Strategy:
     1) Fetch latest commit SHA from GitHub API
     2) Load CSS/JS via jsDelivr using that SHA (immutable URL)
     3) If any file 404s (jsDelivr indexing delay), fall back to @main
     4) If GitHub API fails entirely, fall back to @main for everything
   ================================================================ */

(function () {
  'use strict';

  /* STAGING SELF-REDIRECT — Webflow head 는 @main 으로 고정이라
     새 파일을 FILES 에 추가하는 변경은 main 머지 전엔 staging 에
     안 들어왔던 문제. 스테이징 도메인이면 @staging bootstrap 을
     재로드해서 그쪽 FILES 로 실행한다. 2회차는 flag 보고 skip. */
  if (!window.__helixHomeBootstrapRedirected &&
      /\.webflow\.io$/i.test(location.hostname)) {
    window.__helixHomeBootstrapRedirected = true;
    var __s = document.createElement('script');
    __s.src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/home/bootstrap.js?t=' +
              Math.floor(Date.now() / 60000);
    __s.async = false;
    document.head.appendChild(__s);
    return;
  }

  /* 진단용 로그 — 어떤 bootstrap 버전이 로드됐는지 콘솔로 확인 가능
     v3 = footer.css/.js 포함, v2 = 그 이전 */
  console.log('[helix-bootstrap] loader v3 (with footer interactions)');

  /* 네이버 서치어드바이저 소유확인 — 무료 플랜이라 Webflow 커스텀 코드가
     막혀 메타 태그를 head 에 못 박는 상황. JS 로 주입 시도 (네이버 크롤러가
     JS 실행 안 하면 실패할 수 있음 — 그 경우 유료 플랜 일시 전환 필요). */
  (function injectNaverVerification() {
    if (document.querySelector('meta[name="naver-site-verification"]')) return;
    var m = document.createElement('meta');
    m.name = 'naver-site-verification';
    m.content = '9407eafa782f0831db21ef8fda85d42d654c53a8';
    (document.head || document.documentElement).appendChild(m);
  })();

  /* 첫 화면 이미지 우선 로드 — Webflow 가 모든 <img> 에 loading="lazy" 를
     자동으로 박아서 hero/상단 이미지가 늦게 뜨는 문제. 첫 ~1.5 화면 분량
     안에 들어오는 이미지만 eager + fetchpriority:high 로 승격. 아래쪽
     이미지는 그대로 lazy 유지해 초기 대역폭 보호. */
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

  /* iPad Pro 전용 태블릿 모드 — viewport meta 강제 991px 로 축소
     조건 (모두 만족 시에만 발동, 그 외 기기는 영향 없음):
       · pointer: coarse  → 1차 입력이 터치
       · hover:    none   → hover 불가 (터치 가능 노트북/Surface 등 제외)
       · 992 ≤ innerWidth ≤ 1400 → iPad Pro 11"/12.9" 범위
     영향:
       · iPhone (≤767/991) → 이미 모바일/태블릿, 변화 없음
       · iPad mini/Air     → 이미 ≤991, 변화 없음
       · 데스크탑/노트북   → pointer:fine 또는 hover:hover, 변화 없음
       · 데스크탑 터치스크린 → hover:hover 통과 못해 변화 없음 */
  (function ipadTabletMode() {
    if (!window.matchMedia) return;
    var touchOnly =
      matchMedia('(pointer: coarse)').matches &&
      matchMedia('(hover: none)').matches;
    if (!touchOnly) return;
    var w = window.innerWidth;
    if (w < 992 || w > 1400) return;
    var vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = document.createElement('meta');
      vp.name = 'viewport';
      document.head.appendChild(vp);
    }
    vp.setAttribute('content', 'width=991, initial-scale=' + (w / 991).toFixed(4));
    console.log('[helix-bootstrap] iPad Pro detected (' + w + 'px) → tablet viewport (991px)');
  })();

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  /* staging / production 분리:
     - *.webflow.io (Webflow 스테이징 도메인) → @staging 브랜치 로드
     - 그 외 (정식 도메인) → @main 브랜치 로드
     덕분에 staging 에서 먼저 검증 → 안전하면 main 으로 promote */
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* 기기 오분류 교정 — 화면 폭을 바꾸므로 무엇보다 먼저 */
    'global/viewport-fix.js',
    /* 뷰포트 판정 (window.HelixVP) — 교정된 폭을 봐야 하므로 그 다음 */
    'global/viewport.js',
    /* 운영자 제외 스위치 — ?helix-noga=1 로 켠 브라우저는 측정 안 함.
       gtag 가 만들어지기 전에 가로채야 해서 ga4-base 보다 앞에 둔다. */
    'global/measure-gate.js',
    /* GA4 base loader — gtag.js 본체. 반드시 scroll-depth.js 보다 먼저 로드.
       다른 모든 페이지 모듈의 gtag('event', ...) 호출이 안전하게 큐잉되도록
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
    /* 사이트 전역 (헤더 메뉴, 한글 줄바꿈 정책 등) */
    'global/global.css',
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정 */
    'global/floating-cta.css',
    'global/floating-cta.js',
    /* 전역 GA4 분석 (페이지 뷰 + 스크롤 깊이 25/50/75/100%) */
    'global/scroll-depth.js',
    /* 페이지 체류시간 — 이 페이지에 실제로 몇 초 있었나 */
    'global/page-time.js',
    /* 전역 GA4 분석 (섹션 도달 — 어느 파트까지 봤나) */
    'global/section-reach.js',
    /* 전역 공지 팝업 (중앙 모달, 매 방문 노출) */
    'global/popup.css',
    'global/popup.js',
    /* 전역 위로가기 버튼 — body 주입 + 푸터 위 1.5vw 클램프 */
    'global/top-button.css',
    'global/top-button.js',
    /* 햄버거 메뉴 (전 페이지 공통) — 다른 페이지 bootstrap 엔 다 있는데 홈만
       빠져 있어 홈에서 메뉴가 안 열렸음. coming-soon.js 보다 먼저 로드해도
       버튼 바인딩은 exempt 방식이라 순서 무관. */
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'home/section1/section1.css',
    'home/section1/section1.js',
    'home/section-divider/divider.css',
    'home/section-divider/divider.js',
    'home/global/buttons.css',
    'home/global/buttons.js',
    'home/global/sections-animations.css',
    'home/global/sections-animations.js',
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/footer.css',
    'home/global/footer.js',
    /* 카드덱 (.just-box_qqqqqqq) — 카드 없으면 자동 스킵 */
    'home/global/card-stack.css',
    'home/global/card-stack.js',
    /* 첫 화면 스크롤 유도 꺽쇠 화살표 — 히어로 끝나면 등장, 스크롤하면 사라짐 */
    'home/global/scroll-hint.css',
    'home/global/scroll-hint.js',
    /* 핵심 장비 섹션 — 캐논 알페닉스 빛반사만 (콘텐츠 페이드는 Webflow IX2) */
    'home/equipment/equipment.js'
  ];

  /* Pre-paint FOUC/FOUT guard:
     bootstrap.js가 section1.css를 async로 주입하기 때문에, CSS가 도착하기
     전에 hero 슬로건/버튼이 자연 레이아웃 + 폴백 폰트로 잠깐 그려지는
     깜빡임이 발생함. 인라인 style을 동기 주입해 첫 페인트 전에 가림.
     section1.js가 인라인 visibility:hidden을 직접 설정하면 가드 제거.

     중요: Webflow 슬로건 등에 인라인 `style="visibility:visible !important;
     opacity:1 !important"` 이 박혀 있는 경우, 같은 속성을 CSS의 !important
     로 덮어쓸 수 없음(인라인 !important 가 항상 이김). 따라서 시각적
     숨김은 `clip-path: inset(100%)` 로 대체 — 클립은 인라인이 거의 쓰지
     않는 별도 속성이라 안전하게 숨길 수 있음.

     section1.js 가 prepaint <style> 을 제거하면 clip-path 규칙 자체가
     사라지므로 정상 노출됨. 그 시점엔 forceOpacity 로 인라인 opacity:0/
     visibility:hidden 이 부여돼 GSAP 페이드인까지 안전. */
  (function injectPrepaintGuard() {
    /* 중복 주입 방지 — bootstrap 이 두 번 로드돼도 prepaint <style> 은 하나만 */
    if (document.getElementById('helix-home-prepaint')) return;
    var style = document.createElement('style');
    style.id = 'helix-home-prepaint';
    style.textContent =
      '.home_slogan,' +
      '.bt-box-1,' +
      '.div-block-150,' +
      '[class*="lackFrame_Image"],' +
      '[class*="lackframe_image"]' +
      '{clip-path:inset(100%)!important;-webkit-clip-path:inset(100%)!important;visibility:hidden!important;opacity:0!important}';
    (document.head || document.documentElement).appendChild(style);
    /* 안전망: 6초 안에 section1.js 가 가드를 제거하지 않으면 강제 해제 */
    setTimeout(function () {
      var s = document.getElementById('helix-home-prepaint');
      if (s && s.parentNode) {
        s.parentNode.removeChild(s);
        console.warn('[helix-bootstrap] section1 not ready in 6s, removing prepaint guard');
      }
    }, 6000);
  })();

  /* @<SHA> 주소는 그 자체로 "이 커밋의 이 파일" 이라 내용이 절대 안 바뀐다.
     여기에 분 단위 ?t= 를 붙이면 1분마다 주소가 새것이 돼 브라우저/CDN 캐시가
     통째로 무효화됨 → 방문자가 페이지를 옮길 때마다 30개 파일을 매번 다시
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
        console.warn('[helix-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[helix-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH);
    };
    if (ext === 'css') {
      injectCss(url, fallback);
    } else if (ext === 'js') {
      injectJs(url, null, fallback);
    }
  }

  function injectAll(ref) {
    console.log('[helix-bootstrap] injecting ' + FILES.length + ' files at ref=' + ref + ':\n  - ' + FILES.join('\n  - '));
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

  /* Load ScrollTrigger plugin for GSAP animations */
  var scrollTriggerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
  injectJs(scrollTriggerUrl, function () {
    if (window.gsap && window.gsap.registerPlugin) {
      window.gsap.registerPlugin(ScrollTrigger);
    }
  });

  /* 진입점(bootstrap-v3.js)이 이미 최신 SHA 를 알아내 넘겨줬으면 재사용
     → GitHub API 중복 호출 제거 (rate limit 보호) */
  if (window.__helixCommitSha) {
    var shaFromEntry = window.__helixCommitSha.substring(0, 10);
    console.log('[helix-bootstrap] reusing SHA from entry:', shaFromEntry);
    injectAll(shaFromEntry);
  } else {
    resolveSha(function (sha) {
      console.log('[helix-bootstrap] loading commit', sha);
      injectAll(sha);
    }, function (err) {
      console.warn('[helix-bootstrap] SHA 조회 실패, @' + BRANCH + ' 로 폴백', err);
      injectAll(BRANCH);
    });
  }
})();

