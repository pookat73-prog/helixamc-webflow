/* ================================================================
   HELIX AMC — 진료과목(services) 페이지 클릭 측정
   ================================================================
   이 페이지는 그동안 측정 파일이 하나도 실리지 않아 통째로 깜깜했다.
   방문·스크롤·섹션 도달은 공용 모듈(scroll-depth / section-reach)이
   맡고, 여기서는 이 페이지에만 있는 행동 하나를 잡는다.

   ▸ 진료과 카드 클릭 — 어느 과에 관심이 있는지
     services_dept_click_<기기>  (dept: 한글 과명, dept_key: 코드)

   상세페이지가 아직 없는 과는 클릭 시 "준비중입니다" 토스트만 뜨는데
   (dept-nav.js), 그 클릭도 똑같이 기록한다. 오히려 "상세페이지를 어느
   과부터 만들어야 하나" 를 알려주는 신호라 has_page 로 구분해 남긴다.

   dept-nav.js 의 클릭 핸들러를 건드리지 않고 별도 리스너로 붙는다
   (그쪽은 이동/토스트 담당, 여기는 측정 담당 — 서로 독립).

   ⚠️ 측정은 정식 사이트에서만 — 스테이징(*.webflow.io)은 즉시 종료.
   디버그: URL 에 ?debug-ga=1
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixServicesGaInit) return;
  window.__helixServicesGaInit = true;

  if (/\.webflow\.io$/i.test(location.hostname)) return;

  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[helix-services-ga]'].concat([].slice.call(arguments)));
  }

  /* 카드 클래스 코드 → 사람이 읽을 과명. dept-nav.js 의 LINKS 키와 동일. */
  var DEPT = {
    im: '내과',
    sg: '외과',
    di: '영상의학과',
    oc: '안과',
    dt: '치과'
  };

  function device() { return window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop'); }

  function send(key, card) {
    var name = 'services_dept_click_' + device();
    var params = {
      item_type: 'dept_click',
      page: 'services',
      device: device(),
      dept: DEPT[key] || key,
      dept_key: key,
      /* 상세페이지가 연결돼 있는지 — 없으면 토스트만 뜨는 과 */
      has_page: !!(card.getAttribute('data-dept-href') || card.querySelector('a[href]:not([href="#"])')),
      value: DEPT[key] || key
    };
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        window.gtag('event', name, params);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        params.event = name;
        window.dataLayer.push(params);
      }
      log('sent', name, params);
    } catch (e) { log('send error', e); }
  }

  function init() {
    /* 클릭 위임 — 카드가 나중에 다시 그려져도(반응형 재배치) 따라간다.
       dept-nav.js 가 카드 자체에 이동 핸들러를 걸어두므로, 캡처 단계에서
       받아 이동 전에 측정이 먼저 나가게 한다. */
    document.addEventListener('click', function (e) {
      var card = e.target && e.target.closest && e.target.closest('[class*="dept-card_"]');
      if (!card) return;
      var m = (card.className || '').match(/dept-card_(\w+)/i);
      if (!m) return;
      /* 숨은 덱(데스크탑용/모바일용 이중 마크업)의 카드는 클릭될 수 없지만,
         혹시 잡히면 거른다. */
      if (!card.getBoundingClientRect().width) return;
      send(m[1].toLowerCase(), card);
    }, true);
    log('ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
