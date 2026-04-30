/* ================================================================
   HELIX AMC - AUTO BOOTSTRAP LOADER (v3 — footer interactions)
   Pasted once in Webflow. Always serves the latest commit.

   Strategy:
     1) Fetch latest commit SHA from GitHub API
     2) Load CSS/JS via jsDelivr using that SHA (immutable URL)
     3) If any file 404s (jsDelivr indexing delay), fall back to @main
     4) If GitHub API fails entirely, fall back to @main for everything
   ================================================================ */

(function () {
  'use strict';

  /* 진단용 로그 — 어떤 bootstrap 버전이 로드됐는지 콘솔로 확인 가능
     v3 = footer.css/.js 포함, v2 = 그 이전 */
  console.log('[helix-bootstrap] loader v3 (with footer interactions)');

  /* idempotency guard: bootstrap 이 두 번 로드돼도 한 번만 실행
     (옛 bootstrap.js 가 헤드에 같이 남아있는 경우의 안전망) */
  if (window.__HELIX_BOOTSTRAP_LOADED__) {
    console.warn('[helix-bootstrap] already loaded, skipping duplicate execution');
    return;
  }
  window.__HELIX_BOOTSTRAP_LOADED__ = true;

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = 'main';

  var FILES = [
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
    'home/global/footer.js'
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
    /* 중복 주입 방지 — bootstrap 이 두 번 로드돼도 prepaint <style> 은 하나만.
       (Webflow head 에 옛 bootstrap.js?v=2 와 신 bootstrap-v2.js 가 둘 다
       남아있는 케이스에서 같은 ID 의 <style> 이 두 개 생기는 사고 방지) */
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

  function cdn(ref, path) {
    /* Cache-busting: new timestamp every minute prevents stale browser caches */
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

  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH;

  /* Load ScrollTrigger plugin for GSAP animations */
  var scrollTriggerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
  injectJs(scrollTriggerUrl, function () {
    if (window.gsap && window.gsap.registerPlugin) {
      window.gsap.registerPlugin(ScrollTrigger);
    }
  });

  fetch(api, { headers: { 'Accept': 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha in response');
      console.log('[helix-bootstrap] loading commit', sha);
      injectAll(sha);
    })
    .catch(function (err) {
      console.warn('[helix-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
      injectAll(BRANCH);
    });
})();

