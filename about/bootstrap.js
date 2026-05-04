/* ================================================================
   HELIX AMC - ABOUT PAGE BOOTSTRAP LOADER
   Webflow About 페이지 head에 한 번만 붙여두면 됨.
   항상 최신 커밋 기준으로 about.css / about.js 를 로드.
   ================================================================ */

(function () {
  'use strict';

  /* FOUC 방지: 첫 렌더부터 hero 요소를 opacity:0 으로 숨김.
     about.js 의 GSAP 타임라인이 인라인 opacity 값으로 페이드인. */
  try {
    var s = document.createElement('style');
    s.id = 'helix-about-fouc-guard';
    s.textContent =
      '.about-heading,.about_contents_sub-title,img.image-23,.about_contents-title,.about_three_contents-box{opacity:0}' +
      /* 카드덱: init 전엔 모두 가려둠 (스크롤로 펼쳐지는 사고 방지).
         card-stack.js 가 .helix-deck-host 안으로 옮긴 뒤 다시 보이게. */
      '.just-box_qqqqqqq{visibility:hidden!important}' +
      '.helix-deck-host .just-box_qqqqqqq{visibility:visible!important}' +
      /* 하이브리드 박스: about.js 가 사이드 박스를 center 위로 이동하기 전엔
         자연 위치에 잠깐 그려질 수 있음 → 초기 opacity:0, JS 가 중앙박스만 다시 켬 */
      '.about_hybrid-contents_box{opacity:0}';
    (document.head || document.documentElement).appendChild(s);
    /* 안전망: 3초 안에 카드덱 init 실패하면 cards visibility 강제 해제
       (실패해도 카드가 영영 안 보이는 사고 방지) */
    setTimeout(function () {
      if (!document.querySelector('.helix-deck-host')) {
        var fix = document.createElement('style');
        fix.textContent = '.just-box_qqqqqqq{visibility:visible!important}';
        document.head.appendChild(fix);
        console.warn('[about-bootstrap] card-stack 미가동 → cards visibility 강제 해제');
      }
    }, 3000);
  } catch (e) {}

  var OWNER  = 'pookat73-prog';
  var REPO   = 'helixamc-webflow';
  var BRANCH = 'main';

  var FILES = [
    /* 헤더 + 햄버거 메뉴 — 홈과 동일 사양 */
    'global/global.css',
    'home/global/hamburger.css',
    'home/global/hamburger.js',
    'about/about.css',
    'about/about.js',
    /* 카드덱 (.just-box_qqqqqqq) — home/global 공유 모듈 */
    'home/global/card-stack.css',
    'home/global/card-stack.js'
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
        console.warn('[about-bootstrap] failed even from @' + BRANCH + ':', path);
        return;
      }
      console.warn('[about-bootstrap] SHA load failed for ' + path + ', retrying @' + BRANCH);
      loadFile(path, BRANCH);
    };
    if (ext === 'css') injectCss(url, fallback);
    else if (ext === 'js') injectJs(url, null, fallback);
  }

  function injectAll(ref) {
    FILES.forEach(function (path) { loadFile(path, ref); });
  }

  /* Cache 무력화: 브라우저/SW 가 옛 SHA 응답을 들고있으면 옛 영상 URL 로 흐름.
     timestamp 쿼리로 매 로드 fresh 응답 강제. */
  var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/commits/' + BRANCH +
            '?t=' + Date.now();

  /* GSAP ScrollTrigger 플러그인 — 다이어그램 2구간 스크롤 스크럽용.
     about.js 가 ScrollTrigger 가 등록된 뒤에 안전하게 사용할 수 있도록
     plugin 로드를 먼저 시작 (about.js 보다 먼저 head 에 inject). */
  var stUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
  injectJs(stUrl, function () {
    if (window.gsap && window.gsap.registerPlugin && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
  });

  fetch(api, {
    headers: { 'Accept': 'application/vnd.github+json' },
    cache: 'no-store'
  })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var sha = (data.sha || '').substring(0, 10);
      if (!sha) throw new Error('no sha in response');
      console.log('[about-bootstrap] loading commit', sha);
      window.HELIX_REF = sha;
      injectAll(sha);
    })
    .catch(function (err) {
      console.warn('[about-bootstrap] API fetch failed, fallback to @' + BRANCH, err);
      window.HELIX_REF = BRANCH;
      injectAll(BRANCH);
    });
})();
