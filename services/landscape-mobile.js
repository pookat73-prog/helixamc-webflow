/* ================================================================
   HELIX AMC — 진료과목(services) 페이지 전용
   가로로 돌린 "폰"을 태블릿이 아니라 가로모바일 레이아웃으로 강제

   문제
   -----------------------------------------------------------------
   갤럭시 S24+ 같은 큰 폰을 가로로 돌리면 브라우저가 인식하는 CSS 가로폭이
   약 830~900px 로 나온다. Webflow 태블릿 브레이크포인트(768~991px)가
   딱 그 구간이라, 브라우저는 "가로로 돌린 큰 폰"과 "진짜 태블릿"을
   폭만 봐선 구분하지 못하고 → 가로 폰에 태블릿 레이아웃을 씌운다.

   해법 (방법 B — viewport 폭 강제)
   -----------------------------------------------------------------
   폰과 태블릿을 가르는 진짜 기준은 "높이"다.
     - 가로 폰   : 폭 넓고 높이 낮음(대략 350~480px)
     - 가로 태블릿: 높이가 훨씬 큼(600px 이상)
   그래서 (가로 방향 + 화면 높이 낮음) 이 둘이 겹치면 = 가로 폰 으로 보고,
   viewport 폭을 767 로 고정한다. 그러면:
     - Webflow 의 ≤767 규칙(가로모바일)이 켜지고
     - ≤479 규칙(세로모바일)은 안 켜짐
   → 정확히 "가로모바일" 레이아웃이 통째로 나온다.

   왜 min-width 게이트를 안 쓰나 (무한 플리커 방지)
   -----------------------------------------------------------------
   viewport 폭을 767 로 바꾸면 브라우저가 인식하는 width 자체가 바뀐다.
   그래서 판정 조건에 width 계열(min-width 등)을 넣으면, 강제 후 조건이
   풀리고 → 원복 → 다시 조건 성립 → … 무한 반복(플리커)이 난다.
   판정은 폭을 바꿔도 안정적인 (orientation + max-height) 두 가지로만 한다.
   (같은 max-height:500 기준을 emergency.css 도 가로 폰 감지에 쓴다.)
   ================================================================ */

(function () {
  'use strict';

  /* 가로 폰 판정 — 폭을 강제로 바꿔도 뒤집히지 않는 조건만 사용.
     767 로 강제하면 높이도 같이 축소되지만 여전히 500 밑이라 매칭 유지 → 안정. */
  var PHONE_LANDSCAPE = '(orientation: landscape) and (max-height: 500px)';

  /* ≤767 은 켜고 ≤479 는 안 켜지는 값 = 딱 가로모바일 브레이크포인트.
     축소량도 최소(폰 가로폭이 대개 767 보다 조금 큼)라 확대가 덜하다. */
  var FORCE_WIDTH = 767;

  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }

  /* Webflow 기본 viewport 값을 원본으로 보관 → 세로/태블릿/데스크톱에서 복원 */
  var ORIGINAL = meta.getAttribute('content') || 'width=device-width, initial-scale=1';

  var mq = window.matchMedia(PHONE_LANDSCAPE);

  function apply() {
    if (mq.matches) {
      /* 가로 폰 → 폭 767 고정으로 Webflow 가로모바일 레이아웃 강제 */
      meta.setAttribute('content', 'width=' + FORCE_WIDTH);
    } else {
      /* 세로 / 태블릿 / 데스크톱 → 원래 반응형 viewport 로 복원 */
      meta.setAttribute('content', ORIGINAL);
    }
  }

  apply();

  /* 회전 대응 — matchMedia change 가 정석. 구형 사파리는 addListener 폴백.
     일부 안드로이드는 change 누락 케이스가 있어 orientationchange 도 병행. */
  if (mq.addEventListener) mq.addEventListener('change', apply);
  else if (mq.addListener) mq.addListener(apply);
  window.addEventListener('orientationchange', apply);
})();
