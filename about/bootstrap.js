/* ================================================================
   HELIX AMC - ABOUT PAGE BOOTSTRAP LOADER (v1.6 — stable initial layout)
   Webflow About 페이지 head에 한 번만 붙여두면 됨.
   항상 최신 커밋 기준으로 about.css / about.js 를 로드.
   ================================================================ */

(function () {
  'use strict';

  /* STAGING SELF-REDIRECT — Webflow head 는 @main 으로 고정이라
     새 파일을 FILES 에 추가하는 변경은 main 머지 전엔 staging 에
     안 들어왔던 문제. 스테이징 도메인이면 @staging bootstrap 을
     재로드해서 그쪽 FILES 로 실행한다. 2회차는 flag 보고 skip. */
  if (!window.__helixAboutBootstrapRedirected &&
      /\.webflow\.io$/i.test(location.hostname)) {
    window.__helixAboutBootstrapRedirected = true;
    var __s = document.createElement('script');
    __s.src = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@staging/about/bootstrap.js?t=' +
              Math.floor(Date.now() / 60000);
    __s.async = false;
    document.head.appendChild(__s);
    return;
  }

  /* 기본 배치와 앵커는 버전 조회 전부터 확보한다. 배지 생성 전에도
     최종 배지 줄의 공간을 남겨 모바일 #cert 직접 진입을 보존한다. */
  var initialLayout = document.createElement('style');
  initialLayout.id = 'helix-about-initial-layout';
  initialLayout.textContent =
    '.whiteframe_close-copy,.whiteframe_close_m{background-image:var(--helix-history-background,none)!important}' +
    '#cert .div-block-158{background-image:var(--helix-veccs-mark,none)!important}' +
    '#cert .div-block-157{background-image:var(--helix-cat-mark,none)!important}' +
    '@media(max-width:767px){' +
    '#cert{display:block!important}' +
    '#cert:not(.helix-cert-ready) .about_grid-3-_mid-align{' +
      'display:block!important;visibility:hidden!important;height:47.5vw!important;min-height:0!important}' +
    '#cert.helix-cert-ready .about_grid-3-_mid-align{display:none!important}}';
  document.head.appendChild(initialLayout);
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (type) {
    window.addEventListener(type, function () { window.__helixAboutUserMoved = true; }, { once: true, passive: true });
  });

  /* 첫 화면 이미지 우선 로드 — Webflow 가 모든 <img> 에 loading="lazy" 를
     자동으로 박아서 hero/상단 이미지가 늦게 뜨는 문제. 첫 ~1.5 화면 분량
     안에 들어오는 이미지만 eager + fetchpriority:high 로 승격. */
  (function eagerLoadAboveFold() {
    function upgrade(img) {
      if (!img || img.__helixEager) return;
      /* 로고/심볼은 레이아웃 계산 전에도 우선 요청. 숨겨진 PC/모바일
         복제 이미지의 0×0 사각형은 화면 위 이미지로 오인하지 않는다. */
      if (img.matches('.header_logo,.image-28,.image-23')) {
        img.loading = 'eager';
        img.setAttribute('fetchpriority', 'high');
        img.__helixEager = true;
        return;
      }
      var rect;
      try { rect = img.getBoundingClientRect(); } catch (e) { return; }
      var vh = window.innerHeight || 800;
      if (rect.width > 0 && rect.height > 0 && rect.top < vh * 1.5 && rect.bottom > -100) {
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

  /* FOUC 방지: 첫 렌더부터 hero 요소를 opacity:0 으로 숨김.
     about.js 의 GSAP 타임라인이 인라인 opacity 값으로 페이드인. */
  try {
    var s = document.createElement('style');
    s.id = 'helix-about-fouc-guard';
    s.textContent =
      '.about-heading,.about_contents_sub-title,img.image-23,.about_contents-title{opacity:0}' +
      /* 연혁 카드덱: init 전엔 모두 가려둠 (스크롤로 펼쳐지는 사고 방지).
         card-stack.js 가 .helix-deck-host 안으로 옮긴 뒤 다시 보이게.
         홈 카드덱과 클래스 분리됨: 홈=.just-box_qqqqqqq, about=.just-box_card */
      '.just-box_card{visibility:hidden!important}' +
      '.helix-deck-host .just-box_card{visibility:visible!important}' +
      /* 하이브리드 박스: about.js 가 사이드 박스를 center 위로 이동하기 전엔
         자연 위치에 잠깐 그려질 수 있음 → 초기 opacity:0, JS 가 중앙박스만 다시 켬 */
      '.about_hybrid-contents_box{opacity:0}';
    (document.head || document.documentElement).appendChild(s);
    /* 느린 모듈이 도착하기 전에 원래 카드 배치를 드러내지 않는다.
       최종 로드 실패 시에는 loadFile에서 즉시 복구, 무응답은 8초 안전망. */
    setTimeout(function () {
      if (!document.querySelector('.helix-deck-host')) {
        var fix = document.createElement('style');
        fix.textContent = '.just-box_card{visibility:visible!important}';
        document.head.appendChild(fix);
        console.warn('[about-bootstrap] card-stack 미가동 → cards visibility 강제 해제');
      }
    }, 8000);
    setTimeout(function () {
      if (window.__helixAboutInit) return;
      var recovery = document.createElement('style');
      recovery.textContent = '.about-heading,.about_contents_sub-title,img.image-23{opacity:1!important}';
      document.head.appendChild(recovery);
    }, 8000);
  } catch (e) {}

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  /* staging / production 분리 (home/bootstrap.js 와 동일 정책):
     *.webflow.io → @staging, 그 외 → @main */
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* 기기 오분류 교정 — 화면 폭을 바꾸므로 무엇보다 먼저 */
    'global/viewport-fix.js',
    /* 뷰포트 판정 (window.HelixVP) — 교정된 폭을 봐야 하므로 그 다음 */
    'global/viewport.js',
    'global/accessibility.js',
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
    /* 플로팅 상담 CTA — 전 페이지 오른쪽 하단 고정 */
    'global/floating-cta.css',
    'global/floating-cta.js',
    /* 헤더 + 햄버거 메뉴 — 홈과 동일 사양
       (hamburger 의 MENU_COMING_SOON=true 모드에서 클릭 시 토스트를
       띄우는 coming-soon.js 가 함께 로드돼야 동작함) */
    'global/global.css',
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
    'home/global/coming-soon.css',
    'home/global/coming-soon.js',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'about/about.css',
    'about/about.js',
    /* 코드 기반 인증 모달 — 상세 Webflow 페이지 요청 없이 원문 표시.
       공유 주소 /discover-helix?cert=aaha|emergency|cat#cert */
    'about/cert-modal/modal.css',
    'about/cert-modal/modal.js',
    /* 연혁 카드덱 (.just-box_card) — home/global 공유 모듈 */
    'home/global/card-stack.css',
    'home/global/card-stack.js',
    /* 푸터 인터랙션 — 홈과 동일 (이메일 복사 / SNS 아이콘 새 탭) */
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

  function injectCss(url, onerr, onload) {
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = url;
    if (onerr) link.onerror = onerr;
    if (onload) link.onload = onload;
    document.head.appendChild(link);
    return link;
  }

  function injectJs(url, onload, onerr, independent) {
    var s = document.createElement('script');
    s.src   = url;
    s.async = !!independent;
    if (onload) s.onload = onload;
    if (onerr)  s.onerror = onerr;
    document.head.appendChild(s);
    return s;
  }

  function loadFile(path, ref, ready) {
    /* HTML head의 선행 측정 모듈이 이미 초기화됐다면 같은 파일을
       다른 커밋 주소로 다시 받지 않는다. 실패한 선행 태그는 재시도한다. */
    var initialized = {
      'global/measure-gate.js': '__helixGateInit',
      'global/ga4-base.js': '__helixGA4Init',
      'global/session.js': '__helixSessionInit',
      'global/sheet-log.js': '__helixSheetLogInit'
    };
    if (initialized[path] && window[initialized[path]]) { if (ready) ready(); return; }
    var url = cdn(ref, path);
    var ext = path.split('.').pop();
    var fallback = function () {
      if (ref === BRANCH) {
        console.warn('[about-bootstrap] failed even from @' + BRANCH + ':', path);
        if (path === 'home/global/card-stack.js') {
          var recovery = document.createElement('style');
          recovery.textContent = '.just-box_card{visibility:visible!important}';
          document.head.appendChild(recovery);
        }
        if (ready) ready();
        return;
      }
      console.warn('[about-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH, ready);
    };
    if (ext === 'css') injectCss(url, fallback, ready);
    else if (ext === 'js') injectJs(url, ready, fallback);
  }

  function injectAll(ref) {
    document.documentElement.style.setProperty('--helix-veccs-mark', 'url("' + cdn(ref, 'about/cert-modal/assets/veccs-no-date.png') + '")');
    document.documentElement.style.setProperty('--helix-cat-mark', 'url("' + cdn(ref, 'about/cert-modal/assets/cfc-gold-no-year-card.png') + '")');
    /* 큰 연혁 장식은 근처에 도달할 때 한 번만 요청한다.
       내부 PNG를 무손실 WebP로 압축한 표시용 SVG 사본이다. */
    function historyBackground() {
      var targets = document.querySelectorAll('.whiteframe_close-copy,.whiteframe_close_m');
      function reveal() {
        document.documentElement.style.setProperty('--helix-history-background', 'url("' + cdn(ref, 'about/assets/history-background.svg') + '")');
      }
      if (!targets.length) return;
      if (!('IntersectionObserver' in window)) { reveal(); return; }
      var observer = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        reveal();
        observer.disconnect();
      }, { rootMargin: '200% 0px' });
      targets.forEach(function (target) { observer.observe(target); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', historyBackground, { once: true });
    else historyBackground();
    /* CSS 요청부터 시작. 화면 구성은 보조 기능의 다운로드 완료를
       기다리지 않는다. 각 묶음 안의 의존 순서는 그대로 보존한다. */
    var first = ['global/viewport-fix.js', 'global/viewport.js',
      'global/measure-gate.js', 'global/ga4-base.js', 'global/session.js', 'global/sheet-log.js',
      'home/global/coming-soon.js', 'home/global/hamburger.js',
      'about/about.js', 'about/cert-modal/modal.js', 'home/global/card-stack.js'];
    var critical = ['global/global.css', 'about/about.css', 'about/cert-modal/modal.css', 'home/global/card-stack.css'];
    var styles = [];
    FILES.filter(function (path) { return /\.css$/.test(path); }).forEach(function (path) {
      if (critical.indexOf(path) === -1) { loadFile(path, ref); return; }
      styles.push(new Promise(function (resolve) { loadFile(path, ref, resolve); }));
    });
    /* 필수 CSS 파싱이 끝나야 크기 측정·배지 생성·모달을 시작한다.
       보조 CSS까지 기다리지는 않으며, JS 다운로드는 preload로 먼저 시작한다. */
    first.forEach(function (path) {
      if (/^global\/(measure-gate|ga4-base|session|sheet-log)\.js$/.test(path)) return;
      var hint = document.createElement('link');
      hint.rel = 'preload'; hint.as = 'script'; hint.href = cdn(ref, path);
      document.head.appendChild(hint);
    });
    Promise.all(styles).then(function () {
      first.forEach(function (path) { loadFile(path, ref); });
      FILES.filter(function (path) { return /\.js$/.test(path) && first.indexOf(path) === -1; })
        .forEach(function (path) { loadFile(path, ref); });
    });
  }

  /* ── 커밋 SHA 조회 (트래픽 절감) ───────────────────────────────
     예전: 페이지를 열 때마다 /commits/<branch> 를 불렀다. 이 응답엔 그 커밋에서
     바뀐 파일의 diff 가 통째로 실려 있어 한 번에 수 KB~수십 KB 다. 우리가 필요한
     건 40자짜리 SHA 하나뿐인데 그 값 하나 얻자고 매번 그만큼을 받아왔다.
     지금: SHA 만 들어 있는 /git/ref/heads/<branch>(수백 바이트) 를 쓰고, 받은
     SHA 를 브라우저에 10분 보관해 재사용한다(아래 SHA_TTL). 방문자가 여러
     페이지를 둘러봐도 조회는 사실상 1회. 배포 직후 즉시 확인이 필요하면
     주소에 ?fresh=1 을 붙여 보관분을 건너뛴다. */
  var SHA_KEY = 'helix.sha.' + BRANCH;
  var SHA_TTL = 600000;             /* 10분 — 보관분 재사용(조회 횟수를 크게 줄임) */
  var SHA_FALLBACK_MAX = 43200000;  /* 12시간 — 이보다 오래된 보관분은 @BRANCH 가 더 최신 */
  var FRESH = /[?&]fresh=1\b/.test(location.search);

  /* sessionStorage(탭 하나) → localStorage(브라우저 전체). 탭·방문이 바뀌어도
     같은 SHA 를 재사용해 GitHub 조회(비로그인 시간당 60회 제한)에 걸릴 일이
     크게 준다. 배포 직후 바로 확인하려면 주소에 ?fresh=1 을 붙인다. */
  function readSha() {
    try { return JSON.parse(localStorage.getItem(SHA_KEY) || 'null'); } catch (e) { return null; }
  }

  function resolveSha(done, fail) {
    /* 페이지 진입 코드가 이미 버전을 결정했다면 같은 API를 다시 조회하지 않는다. */
    var source = document.currentScript && document.currentScript.src || '';
    var pinned = source.match(/@([0-9a-f]{7,40})\/about\/bootstrap\.js(?:[?#]|$)/i);
    if (pinned && window.__helixAboutEntryRef === pinned[1]) { done(pinned[1]); return; }
    var cached = readSha();
    if (!FRESH && cached && cached.sha && (Date.now() - cached.t) < SHA_TTL) { done(cached.sha); return; }
    var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO +
              '/git/ref/heads/' + BRANCH + '?t=' + Math.floor(Date.now() / 60000);
    var settled = false;
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    function fallback(err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (cached && cached.sha && (Date.now() - cached.t) < SHA_FALLBACK_MAX) done(cached.sha);
      else fail(err);
    }
    var timer = setTimeout(function () {
      fallback('SHA lookup timeout');
      if (controller) controller.abort();
    }, 2500);
    var options = { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' };
    if (controller) options.signal = controller.signal;
    fetch(api, options)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        if (settled) return;
        var sha = ((d.object && d.object.sha) || d.sha || '').substring(0, 10);
        if (!sha) throw new Error('no sha in response');
        settled = true;
        clearTimeout(timer);
        try { localStorage.setItem(SHA_KEY, JSON.stringify({ sha: sha, t: Date.now() })); } catch (e) {}
        done(sha);
      })
      .catch(function (err) {
        /* ⚠ 조회 실패 시 곧장 @BRANCH 로 가면 jsDelivr 엣지 캐시가 최대 12시간
           묵은 파일을 내줘 "고쳤는데 화면에 안 나온다" 가 반복된다(2026-08-27 사고).
           마지막으로 알던 커밋(고정 주소 = 캐시가 꼬일 수 없음)이 12시간 안쪽이면
           그걸 먼저 쓰고, 그보다 오래됐을 때만 @BRANCH 로 넘긴다. */
        fallback(err);
      });
  }

  /* GSAP ScrollTrigger 플러그인 — 다이어그램 2구간 스크롤 스크럽용.
     about.js 가 ScrollTrigger 가 등록된 뒤에 안전하게 사용할 수 있도록
     plugin 로드를 먼저 시작 (about.js 보다 먼저 head 에 inject). */
  var stUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
  injectJs(stUrl, function () {
    if (window.gsap && window.gsap.registerPlugin && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
  }, null, true);

  resolveSha(function (sha) {
    console.log('[about-bootstrap] loading commit', sha);
    window.HELIX_REF = sha;
    injectAll(sha);
  }, function (err) {
    console.warn('[about-bootstrap] SHA 조회 실패, @' + BRANCH + ' 로 폴백', err);
    window.HELIX_REF = BRANCH;
    injectAll(BRANCH);
  });
})();
