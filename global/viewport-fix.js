/* ================================================================
   HELIX AMC — 기기 오분류 교정 (전 페이지) v1

   ■ 무엇을 고치나
   Webflow 는 화면 구간(479 / 767 / 991)을 바꿀 수 없게 막아 뒀다. 그래서
   실제 기기 중 "엉뚱한 칸"에 떨어지는 것들이 생긴다. 섹션 숨김/보임이
   그 칸을 기준으로 걸려 있어, 잘못 걸리면 아예 다른 화면이 나온다.

     (A) 가로로 돌린 큰 폰 (예: 갤럭시 S24+ 900×411)
         → 폭이 900 이라 태블릿(768~991) 칸에 걸림 → 태블릿 화면이 나옴
         → 원하는 건 가로모바일
         처방: 화면 폭을 767 이라고 알려 줌 → Webflow 가로모바일 강제

     (B) 세로로 세운 아이패드 프로 (12.9" 1024 / 13" M4 1032)
         → 992 이상이라 데스크탑 칸에 걸림 → 데스크탑 화면이 나옴
         → 원하는 건 태블릿
         처방: 화면 폭을 991 이라고 알려 줌 → Webflow 태블릿 강제

   ■ 왜 이 방식인가 (섹션을 코드로 끄고 켜는 대신)
   Webflow 마크업을 한 글자도 안 건드린다. 숨김/보임은 여전히 CSS 가
   결정하므로, 화면이 그려질 때 이미 한 쪽만 켜져 있다 → 두 벌이 겹쳐
   보이는 깜빡임이 없다. 되돌리려면 이 파일만 빼면 된다.

   ■ 무한 플리커 방지 — "자연 폭 측정 후 판정"
   화면 폭을 강제로 바꾸면 innerWidth 자체가 바뀐다. 그래서 조건을 현재
   innerWidth 로 계속 재평가하면: 강제 → 조건 풀림 → 원복 → 조건 성립 →
   … 무한 반복이 난다. 그래서 재평가는 "실제 회전" 때만 하고, 매번 먼저
   원본으로 복원해 '자연 폭' 을 측정한 뒤 판정한다.

   ■ 반영 시점
   이 파일은 페이지 로더(bootstrap)가 불러오므로 첫 화면이 그려진 직후에
   적용된다. 해당되는 두 기기에서는 아주 짧게 원래 칸의 화면이 스쳤다가
   바뀔 수 있다. 없애려면 페이지 head 에 직접 심어야 하는데, 그러면 코드가
   Webflow 안으로 들어가 GitHub 관리에서 벗어나므로 지금은 이 방식을 쓴다.
   (진료과목 페이지에서 같은 방식으로 가동 중이었고 문제 보고 없음)

   ⚠️ 이 파일은 global/viewport.js 보다 먼저 실행되어야 한다. 폭을 교정한
      뒤라야 viewport.js 의 밴드 판정이 맞는 값을 본다. 각 bootstrap 의
      FILES 배열에서 항상 맨 앞에 둘 것.
   ⚠️ 아래 세 숫자는 global/viewport.js 의 H_SHORT / tablet 밴드 상한과
      짝이다. 한쪽만 고치면 판정이 어긋난다.
   ================================================================ */

(function () {
  'use strict';

  /* bootstrap 이 여럿인 페이지에서 두 번 실행되면 meta 를 서로 덮어써
     플리커가 난다. 한 번만 돌게 잠근다. */
  if (window.__helixVPFixInit) return;
  window.__helixVPFixInit = true;

  var LANDSCAPE_PHONE_MAX_H = 500;   /* 가로 폰: 이 높이 이하 (태블릿은 초과) */
  var PRO_MIN_W = 992;               /* 세로 프로: 자연 폭 하한 (데스크탑 경계) */
  /* 세로 프로 자연 폭 상한. 모델별로 달라 넉넉히 1040 까지:
       아이패드 프로 12.9"(~M2) 1024 / 프로 13"(M4) 1032 / 에어 13"(M2) 1024
     1024 로 잡으면 M4 가 샌다. 세로 데스크탑 모니터(대개 1080+)는 제외됨. */
  var PRO_MAX_W = 1040;

  var FORCE_LANDSCAPE_PHONE = 'width=767';  /* ≤767 켜고 ≤479 안 켬 = 가로모바일 */
  var FORCE_PRO_PORTRAIT    = 'width=991';  /* ≤991 켜고 데스크탑 안 켬 = 태블릿 */

  var DEBUG = /[?&]debug-bp=1/.test(location.search);

  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }

  /* Webflow 기본값 보관 → 해당 없을 때 원복 + '자연 폭' 측정용 */
  var ORIGINAL = meta.getAttribute('content') || 'width=device-width, initial-scale=1';

  /* 어떤 교정이 걸렸는지 다른 모듈·디버깅이 볼 수 있게 남긴다 */
  function mark(kind) {
    window.__helixVPFix = kind;
    if (kind) document.documentElement.setAttribute('data-vp-fix', kind);
    else document.documentElement.removeAttribute('data-vp-fix');
  }

  function evaluate() {
    /* 먼저 원본으로 되돌려 강제 이전의 '자연 폭/높이' 를 측정 (플리커 방지 핵심) */
    meta.setAttribute('content', ORIGINAL);
    requestAnimationFrame(function () {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var landscape = w > h;

      var isLandscapePhone = landscape && h <= LANDSCAPE_PHONE_MAX_H;
      var isProPortrait    = !landscape && w >= PRO_MIN_W && w <= PRO_MAX_W;

      if (DEBUG) {
        console.log('[vp-fix] 자연 폭 w=' + w + ' h=' + h +
          ' | 가로=' + landscape +
          ' | 가로폰=' + isLandscapePhone +
          ' | 세로프로=' + isProPortrait);
      }

      if (isLandscapePhone) {
        meta.setAttribute('content', FORCE_LANDSCAPE_PHONE);
        mark('landscape-phone');
      } else if (isProPortrait) {
        meta.setAttribute('content', FORCE_PRO_PORTRAIT);
        mark('pro-portrait');
      } else {
        /* 일반 폰 세로 / 태블릿 / 데스크탑 → 원본 그대로 */
        mark('');
      }
    });
  }

  evaluate();

  /* 실제 회전 때만 재평가 — 우리가 meta 를 바꿔 생기는 resize 로는 재평가 안 함
     (그래야 무한 반복이 안 난다). */
  var mqPortrait = window.matchMedia('(orientation: portrait)');
  if (mqPortrait.addEventListener) mqPortrait.addEventListener('change', evaluate);
  else if (mqPortrait.addListener) mqPortrait.addListener(evaluate); /* 구형 사파리 */
  window.addEventListener('orientationchange', evaluate);
})();
