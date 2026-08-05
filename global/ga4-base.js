/* ================================================================
   HELIX AMC - GA4 BASE LOADER (Google Analytics 4)
   ================================================================
   모든 페이지 (home / about / seocho / emergency) 공통 GA4 초기화.
   각 bootstrap.js FILES 배열의 **가장 첫 줄** 로 등록.

   동작 순서:
     1) window.dataLayer 와 gtag stub 함수 즉시 정의
        → 이 시점부터 다른 스크립트의 gtag('event', ...) 호출이
          모두 dataLayer 에 안전하게 큐잉됨 (gtag.js 도착 전 손실 0)
     2) gtag('config', GA_ID) 로 측정 시작 선언
     3) googletagmanager.com 의 gtag.js 를 async inject
        → 도착하면 자동으로 dataLayer 큐 처리 + 이후 호출 실시간 전송

   페이지뷰 / 스크롤 깊이 25·50·75·100% / 버튼·전화·이메일·SNS 클릭
   등 사이트 전 영역의 gtag 이벤트는 이 로더가 켜져야 비로소 수집됨.

   디버그: GA4 DebugView 활성화는 URL 에 ?_dbg=1 또는
   Google Tag Assistant 확장으로 확인.
   ================================================================ */
(function () {
  'use strict';

  /* 중복 로드 가드 — bootstrap 이 두 번 로드돼도 GA 도 한 번만 초기화 */
  if (window.__helixGA4Init) return;
  window.__helixGA4Init = true;

  /* ⚠️ 측정은 정식 사이트(main)에서만.
     스테이징(*.webflow.io)은 실사용 사이트가 아니므로, 여기서 측정을 쏘면
     정식 GA4 속성(G-PWCB5MVC32)에 테스트 트래픽이 섞여 데이터가 오염됨.
     → 스테이징 도메인이면 gtag.js 본체 inject / config 를 건너뛰고,
        다른 모듈의 gtag('event', ...) 호출이 조용히 아무 것도 안 하도록
        no-op gtag stub 만 정의하고 즉시 종료. */
  if (/\.webflow\.io$/i.test(location.hostname)) {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') { window.gtag = function () {}; }
    console.log('[helix-ga4] staging(*.webflow.io) 감지 — 측정 비활성화');
    return;
  }

  /* 운영자 제외 — global/measure-gate.js 가 켜 둔 표시가 있으면 측정 안 함
     (?helix-noga=1 로 켠 브라우저) */
  if (window.__helixNoMeasure) return;

  var GA_ID = 'G-PWCB5MVC32';

  /* Webflow Site Settings 의 GA4 통합이 켜져 있으면 Webflow 가 이미 동일
     gtag.js 를 inject 한 상태. 그 경우 우리는 page_view 중복 발사 방지를
     위해 본체 inject 와 config 호출은 skip 하고, gtag 함수 / dataLayer 만
     보장 (커스텀 이벤트 코드가 안전하게 gtag 호출 가능하도록). */
  var alreadyInjected = !!document.querySelector(
    'script[src*="googletagmanager.com/gtag/js?id=' + GA_ID + '"]'
  );

  /* dataLayer + gtag stub 동기 정의 — 이후 모든 gtag 호출 안전 큐잉 */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (alreadyInjected) {
    console.log('[helix-ga4] Webflow 통합 GA 감지 — 중복 inject skip');
    return;
  }

  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  /* gtag.js 본체 async inject */
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  (document.head || document.documentElement).appendChild(s);
})();
