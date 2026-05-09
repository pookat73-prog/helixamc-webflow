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
  /* .webflow.io 도메인 = 스테이징 사이트 → staging 브랜치 로드
     커스텀 도메인 = 정식 사이트 → main 브랜치 로드 */
  var BRANCH = /\.webflow\.io$/.test(location.hostname) ? 'staging' : 'main';

  var FILES = [
    /* 사이트 전역 (헤더 메뉴, 한글 줄바꿈 정책 등) */
    'global/global.css',
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

