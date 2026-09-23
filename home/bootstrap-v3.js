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
   - API 실패 시 @<branch> 폴백 (안전망)
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

  console.log('[helix-bootstrap] v3 entry → resolving latest SHA of @' + BRANCH);

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
     같은 SHA 를 재사용하므로 GitHub 조회(비로그인 시간당 60회 제한)에 걸릴
     일이 크게 줄어든다. 배포 직후 바로 확인하려면 주소에 ?fresh=1 을 붙인다. */
  function readSha() {
    try { return JSON.parse(localStorage.getItem(SHA_KEY) || 'null'); } catch (e) { return null; }
  }
  var cached = readSha();

  if (!FRESH && cached && cached.sha && (Date.now() - cached.t) < SHA_TTL) {
    window.__helixCommitSha = cached.sha;
    console.log('[helix-bootstrap] v3 → 보관된 SHA 재사용 @' + cached.sha.substring(0, 10));
    load(bodyUrl(cached.sha));
    return;
  }

  fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/git/ref/heads/' + BRANCH +
        '?t=' + Math.floor(Date.now() / 60000),
        { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (d) {
      var sha = ((d.object && d.object.sha) || d.sha || '').substring(0, 40);
      if (!sha) throw new Error('no sha');
      window.__helixCommitSha = sha;
      try { localStorage.setItem(SHA_KEY, JSON.stringify({ sha: sha, t: Date.now() })); } catch (e) {}
      console.log('[helix-bootstrap] v3 → loading bootstrap @' + sha.substring(0, 10) + ' (immutable)');
      load(bodyUrl(sha));
    })
    .catch(function (err) {
      /* ⚠ 여기서 곧장 @BRANCH 로 떨어지면 jsDelivr 엣지 캐시가 최대 12시간 묵은
         파일을 계속 내줘 "고쳤는데 화면에 안 나온다" 가 반복된다(2026-08-27 사고).
         조회가 실패해도 마지막으로 알던 커밋 번호(고정 주소 = 캐시가 꼬일 수 없음)가
         12시간 안쪽이면 그걸 쓴다. 그보다 오래됐을 때만 @BRANCH 로 간다. */
      var usable = cached && cached.sha && (Date.now() - cached.t) < SHA_FALLBACK_MAX;
      console.warn('[helix-bootstrap] v3 SHA resolve failed → ' +
        (usable ? '마지막 SHA @' + cached.sha.substring(0, 10) : '@' + BRANCH), err);
      load(bodyUrl(usable ? cached.sha : BRANCH));
    });
})();
