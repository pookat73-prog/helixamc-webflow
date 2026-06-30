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
  var bust   = '?t=' + Math.floor(Date.now() / 60000);

  function load(src) {
    var s = document.createElement('script');
    s.src   = src;
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
  }
  function bodyUrl(ref) {
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + ref + '/home/bootstrap.js' + bust;
  }

  console.log('[helix-bootstrap] v3 entry → resolving latest SHA of @' + BRANCH);

  /* ?t=Date.now() + no-store: GitHub API 의 CDN 엣지/브라우저 캐시가 옛 커밋
     SHA 를 내주는 stale 문제 차단. 매 요청을 고유 주소로 만들어 항상 최신
     브랜치 HEAD 를 받는다. (about/emergency bootstrap 과 동일 패턴) */
  fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH +
        '?t=' + Date.now(),
        { headers: { 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (d) {
      var sha = (d.sha || '').substring(0, 40);
      if (!sha) throw new Error('no sha');
      window.__helixCommitSha = sha;
      console.log('[helix-bootstrap] v3 → loading bootstrap @' + sha.substring(0, 10) + ' (immutable)');
      load(bodyUrl(sha));
    })
    .catch(function (err) {
      console.warn('[helix-bootstrap] v3 SHA resolve failed, fallback @' + BRANCH, err);
      load(bodyUrl(BRANCH));
    });
})();
