/* ================================================================
   HELIX AMC — 진료과목(services) 페이지 전용
   기기가 "엉뚱한 브레이크포인트"에 걸리는 두 경우를 viewport 폭으로 교정

   교정 대상
   -----------------------------------------------------------------
   (A) 가로로 돌린 큰 폰 (예: 갤럭시 S24+)
       → CSS 폭이 ~900px 로 잡혀 Webflow 태블릿(768~991)에 걸림
       → 태블릿 화면이 나옴. 원하는 건 가로모바일.
       처방: viewport 폭을 767 로 → Webflow 가로모바일(≤767) 강제.

   (B) 세로로 세운 아이패드 프로 12.9" (폭 1024px)
       → 992 이상이라 Webflow 데스크탑에 걸림 → 데스크탑 화면이 나옴.
       원하는 건 태블릿.
       처방: viewport 폭을 991 로 → Webflow 태블릿(≤991) 강제.

   폰 vs 태블릿, 태블릿 vs 데스크탑 구분 기준
   -----------------------------------------------------------------
   - 가로 폰   : 가로 방향 + 화면 높이 낮음(≤500px). 태블릿은 높이가 커서 제외.
   - 세로 프로 : 세로 방향 + 자연 폭이 992~1024. (11인치는 834라 이미 태블릿.)

   ⚠️ 무한 플리커 방지 — "자연 폭 측정 후 판정"
   -----------------------------------------------------------------
   viewport 폭을 강제로 바꾸면 innerWidth 자체가 바뀐다. 그래서 폭 조건을
   현재 innerWidth 로 계속 재평가하면: 강제 → 조건 풀림 → 원복 → 조건 성립 →
   … 무한 반복(플리커)이 난다.
   해법: 재평가는 "실제 회전(orientation change)" 때만 하고, 매번 먼저 원본
   viewport 로 복원해 '자연 폭' 을 측정한 뒤 판정한다. 우리가 meta 를 바꿔
   생기는 resize 로는 재평가하지 않으므로 루프가 없다.
   ================================================================ */

(function () {
  'use strict';

  var LANDSCAPE_PHONE_MAX_H = 500;   /* 가로 폰: 이 높이 이하 (태블릿은 초과) */
  var PRO_MIN_W = 992;               /* 세로 프로: 자연 폭 하한 (데스크탑 경계) */
  /* 세로 프로 자연 폭 상한. 모델별 세로 폭이 달라 넉넉히 1040 까지:
       - 아이패드 프로 12.9" (~M2 이전) : 1024
       - 아이패드 프로 13"  (M4, 2024~) : 1032  ← 1024 로 잡으면 여기서 샘
       - 아이패드 에어 13"  (M2)         : 1024
     1040 상한이면 위 셋 다 커버, 세로 데스크탑 모니터(대개 1080+)는 제외. */
  var PRO_MAX_W = 1040;

  var FORCE_LANDSCAPE_PHONE = 'width=767';  /* ≤767 켜고 ≤479 안 켬 = 가로모바일 */
  var FORCE_PRO_PORTRAIT   = 'width=991';   /* ≤991 켜고 데스크탑 안 켬 = 태블릿 */

  var DEBUG = /[?&]debug-bp=1/.test(location.search);

  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }

  /* Webflow 기본 viewport 값 보관 → 해당 없을 때 원복 + '자연 폭' 측정용 */
  var ORIGINAL = meta.getAttribute('content') || 'width=device-width, initial-scale=1';

  function evaluate() {
    /* 먼저 원본으로 되돌려 강제 이전의 '자연 폭/높이' 를 측정 (플리커 방지 핵심) */
    meta.setAttribute('content', ORIGINAL);
    /* 복원 반영(reflow) 후 측정 */
    requestAnimationFrame(function () {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var landscape = w > h;

      if (DEBUG) {
        console.log('[bp] natural w=' + w + ' h=' + h +
          ' landscape=' + landscape +
          ' → phone=' + (landscape && h <= LANDSCAPE_PHONE_MAX_H) +
          ' proPortrait=' + (!landscape && w >= PRO_MIN_W && w <= PRO_MAX_W));
      }

      if (landscape && h <= LANDSCAPE_PHONE_MAX_H) {
        /* (A) 가로 폰 → 가로모바일 강제 */
        meta.setAttribute('content', FORCE_LANDSCAPE_PHONE);
      } else if (!landscape && w >= PRO_MIN_W && w <= PRO_MAX_W) {
        /* (B) 세로 아이패드 프로 → 태블릿 강제 */
        meta.setAttribute('content', FORCE_PRO_PORTRAIT);
      }
      /* 그 외(일반 폰 세로 / 태블릿 / 데스크탑) → ORIGINAL 유지 */
    });
  }

  evaluate();

  /* 실제 회전 때만 재평가 — 우리가 meta 를 바꿔 생기는 resize 로는 재평가 안 함.
     orientation change 는 방향이 실제로 바뀔 때만 발생 → 루프 없음. */
  var mqPortrait = window.matchMedia('(orientation: portrait)');
  if (mqPortrait.addEventListener) mqPortrait.addEventListener('change', evaluate);
  else if (mqPortrait.addListener) mqPortrait.addListener(evaluate); /* 구형 사파리 */
  window.addEventListener('orientationchange', evaluate);
})();
