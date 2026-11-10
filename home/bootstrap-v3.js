/* ================================================================
   HELIX AMC - home/bootstrap-v3.js (SHA-RESOLVING ENTRY)
   ================================================================
   Webflow head 에 박힌 진입점 스크립트.

   [예전 방식의 문제]
   본체 bootstrap.js 를 @staging / @main "브랜치 주소" 로 불렀음.
   jsDelivr 는 브랜치 주소를 최대 12시간 캐시 → FILES 배열에 새 파일을
   추가해도 옛 bootstrap 이 떠서 "사이트에 반영 안 됨" 이 반복됐다.
   (다른 CSS/JS 는 전부 @<SHA> 변경불가 주소라 신선했고, 오직 bootstrap
    파일 자체만 브랜치 주소라 stale 의 유일한 진원지였음.)

   [근본 해결]
   진입점이 먼저 GitHub API 로 해당 브랜치의 최신 커밋 SHA 를 알아낸 뒤,
   변경 불가능한 @<SHA> 주소로 본체 bootstrap.js 를 로드한다.
   → 본체도 항상 신선. 브랜치 캐시 stale 문제 원천 제거.

   - staging / main 분기: hostname 기반 (*.webflow.io → staging)
   - 알아낸 SHA 는 window.__helixCommitSha 로 본체에 넘겨 API 중복 호출 0
   - window.__helixHomeBootstrapRedirected=true 로 본체의 옛 self-redirect 차단
   - API 실패 시 저장된 SHA 또는 게시된 진입점 SHA 로 복구
   - 중복 실행 가드
   ================================================================ */
(function () {
  'use strict';
  if (window.__HELIX_BOOTSTRAP_V3_REDIRECTED) return;
  window.__HELIX_BOOTSTRAP_V3_REDIRECTED = true;

  /* 본체 bootstrap.js 의 자체 staging self-redirect 를 막음
     (진입점이 이미 올바른 SHA 본체를 로드하므로 중복 로드 불필요) */
  window.__helixHomeBootstrapRedirected = true;

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  /* 첫 방문에도 API 없이 복구할 수 있도록 게시된 진입점의 고정 SHA를 보관한다. */
  var entrySrc = document.currentScript && document.currentScript.src || '';
  var entrySha = entrySrc.match(/@([0-9a-f]{40})\/home\/bootstrap-v3\.js(?:[?#]|$)/i);
  var PUBLISHED_REF = entrySha ? entrySha[1] : BRANCH;

  function load(src) {
    var s = document.createElement('script');
    s.src   = src;
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
  }
  /* @<SHA> 는 그 커밋의 그 파일이라 내용이 안 바뀜 → 캐시 버스터 불필요.
     예전엔 여기에도 분 단위 ?t= 를 붙여서, 1분만 지나도 주소가 새것이 되는
     바람에 방문자가 페이지를 옮길 때마다 bootstrap 본체를 다시 받았다.
     내용이 바뀔 수 있는 @branch 폴백일 때만 버스터를 붙인다. */
  function bodyUrl(ref) {
    var q = /^[0-9a-f]{7,40}$/i.test(ref) ? '' : ('?t=' + Math.floor(Date.now() / 60000));
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/home/bootstrap.js' + q;
  }

  /* 조회 실패로 고른 복구 버전도 본체에 전달해 같은 조회를 반복하지 않는다. */
  function loadBody(ref) {
    if (settled) return;
    settled = true;
    clearTimeout(resolveTimer);
    window.__helixHomeBootstrapRef = ref;
    if (/^[0-9a-f]{7,40}$/i.test(ref)) window.__helixCommitSha = ref;
    /* 본체를 받는 동안에도 첫 화면 스타일 다운로드는 먼저 시작한다. */
    ['global/global.css', 'home/global/coming-soon.css',
      'home/section1/section1.css', 'home/global/buttons.css'].forEach(function (path) {
      var hint = document.createElement('link');
      hint.rel = 'preload'; hint.as = 'style';
      hint.href = bodyUrl(ref).replace(/home\/bootstrap\.js/, path);
      (document.head || document.documentElement).appendChild(hint);
    });
    load(bodyUrl(ref));
  }

  var settled = false;
  var resolveTimer;

  console.log('[helix-bootstrap] v3 entry → resolving latest SHA of @' + BRANCH);

  /* ── 커밋 SHA 조회 (트래픽 절감) ───────────────────────────────
     예전: 페이지를 열 때마다 /commits/<branch> 를 불렀다. 이 응답엔 그 커밋에서
     바뀐 파일의 diff 가 통째로 실려 있어 한 번에 수 KB~수십 KB 다. 우리가 필요한
     건 40자짜리 SHA 하나뿐인데 그 값 하나 얻자고 매번 그만큼을 받아왔다.
     지금: SHA 만 들어 있는 /git/ref/heads/<branch>(수백 바이트) 를 쓰고, 받은
     SHA 를 브라우저에 10분 보관해 재사용한다(아래 SHA_TTL). 방문자가 여러
     페이지를 둘러봐도 조회는 사실상 1회. 배포 직후 즉시 확인이 필요하면
     주소에 ?fresh=1 을 붙여 보관분을 건너뛴다. */
  /* 새 진입점이 게시되면 이전 배포의 보관 SHA로 되돌아가지 않는다.
     다른 페이지의 공유 캐시와도 분리하되, GitHub 재조회 제한은 함께 지킨다. */
  var SHA_KEY = 'helix.home.sha.' + BRANCH + '.' + PUBLISHED_REF;
  var RETRY_KEY = 'helix.sha.' + BRANCH + '.retryAt';
  var SHA_TTL = 600000;             /* 10분 — 보관분 재사용(조회 횟수를 크게 줄임) */
  var SHA_FALLBACK_MAX = 43200000;  /* 12시간 — 오래된 보관분 대신 게시된 진입점 버전으로 복구 */
  var FRESH = /[?&]fresh=1\b/.test(location.search);

  /* sessionStorage(탭 하나) → localStorage(브라우저 전체). 탭·방문이 바뀌어도
     같은 SHA 를 재사용하므로 GitHub 조회(비로그인 시간당 60회 제한)에 걸릴
     일이 크게 줄어든다. 배포 직후 바로 확인하려면 주소에 ?fresh=1 을 붙인다. */
  function readSha() {
    try { return JSON.parse(localStorage.getItem(SHA_KEY) || 'null'); } catch (e) { return null; }
  }
  var cached = readSha();
  if (cached && !/^[0-9a-f]{7,40}$/i.test(cached.sha || '')) cached = null;
  var retryAt = 0;
  try { retryAt = Number(localStorage.getItem(RETRY_KEY)) || 0; } catch (e) {}

  if (!FRESH && cached && cached.sha && (Date.now() - cached.t) < SHA_TTL) {
    console.log('[helix-bootstrap] v3 → 보관된 SHA 재사용 @' + cached.sha.substring(0, 10));
    loadBody(cached.sha);
    return;
  }

  /* fresh=1 도 GitHub가 알린 제한 해제 시각은 건너뛰지 않는다. */
  if (retryAt > Date.now()) {
    var pausedRef = cached && (Date.now() - cached.t) < SHA_FALLBACK_MAX ? cached.sha : PUBLISHED_REF;
    console.log('[helix-bootstrap] v3 → SHA 재조회 대기, @' + pausedRef + ' 재사용');
    loadBody(pausedRef);
    return;
  }

  function fallback() {
    var usable = cached && cached.sha && (Date.now() - cached.t) < SHA_FALLBACK_MAX;
    loadBody(usable ? cached.sha : PUBLISHED_REF);
  }
  /* 조회가 멈춰도 첫 화면이 무기한 대기하지 않도록 검증된 SHA로 한 번만 시작.
     늦은 응답으로 실행 중인 CSS/JS 버전을 섞거나 다음 방문의 캐시를 바꾸지 않는다. */
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  resolveTimer = setTimeout(function () {
    fallback();
    if (controller) controller.abort();
  }, 2000);
  var options = { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' };
  if (controller) options.signal = controller.signal;
  fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/git/ref/heads/' + BRANCH +
        '?t=' + Math.floor(Date.now() / 60000),
        options)
    .then(function (r) {
      if (r.ok) return r.json();
      if (r.status === 403 || r.status === 429) {
        var resetAt = Number(r.headers.get('X-RateLimit-Reset')) * 1000;
        var retryAfter = Number(r.headers.get('Retry-After')) * 1000;
        retryAt = Math.max(Date.now() + 60000, resetAt || 0, Date.now() + (retryAfter || 0));
        try { localStorage.setItem(RETRY_KEY, String(retryAt)); } catch (e) {}
      }
      return Promise.reject(r.status);
    })
    .then(function (d) {
      if (settled) return;
      var sha = ((d.object && d.object.sha) || d.sha || '').substring(0, 40);
      if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error('invalid sha');
      try { localStorage.setItem(SHA_KEY, JSON.stringify({ sha: sha, t: Date.now() })); } catch (e) {}
      try { localStorage.removeItem(RETRY_KEY); } catch (e) {}
      console.log('[helix-bootstrap] v3 → loading bootstrap @' + sha.substring(0, 10) + ' (immutable)');
      loadBody(sha);
    })
    .catch(function (err) {
      if (settled) return;
      /* 최근 저장 SHA를 우선하고, 첫 방문·오래된 저장값은 게시된 고정 SHA로 복구.
         진입점이 옛 @branch 주소인 경우에만 기존 branch 복구 경로를 유지한다. */
      var usable = cached && cached.sha && (Date.now() - cached.t) < SHA_FALLBACK_MAX;
      console.warn('[helix-bootstrap] v3 SHA resolve failed → ' +
        (usable ? '마지막 SHA @' + cached.sha.substring(0, 10) : '게시된 버전 @' + PUBLISHED_REF.substring(0, 10)), err);
      fallback();
    });
})();
