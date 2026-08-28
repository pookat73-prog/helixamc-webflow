/* ================================================================
   HELIX AMC - 공유 GA4 분석: 페이지 뷰 + 스크롤 깊이
   ================================================================
   home / about / seocho 세 페이지 공통 로드 (각 bootstrap FILES 에 등록).
   페이지를 DOM 마커로 자동 감지해 페이지별 이벤트명으로 전송하므로,
   모든 페이지가 동일 기준(25/50/75/100% 4단계)으로 추적된다.

   home/global 의 gtag 패턴과 동일:
   - gtag 있으면 gtag('event', ...), 없으면 dataLayer.push 폴백

   ① <page>_page_view   : 페이지 진입 시 1회
   ② <page>_scroll_depth: 25/50/75/100% 도달 시 각 1회 (100% 후 리스너 해제)

   <page> = home | about | seocho
   디버그: URL 에 ?debug-ga=1
   ================================================================ */
(function () {
  'use strict';

  /* 중복 로드 가드 (한 페이지에 두 번 주입돼도 한 번만 동작) */
  if (window.__helixScrollDepthInit) return;
  window.__helixScrollDepthInit = true;

  /* ⚠️ 측정은 정식 사이트(main)에서만 — 스테이징(*.webflow.io)에선
     페이지뷰/스크롤 깊이 측정을 쏘지 않음 (정식 GA4 데이터 오염 방지). */
  if (/\.webflow\.io$/i.test(location.hostname)) return;
  /* 운영자 제외 — global/measure-gate.js 가 켜 둔 표시가 있으면 측정 안 함
     (?helix-noga=1 로 켠 브라우저) */
  if (window.__helixNoMeasure) return;


  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() { if (DEBUG) console.log.apply(console, ['[helix-ga]'].concat([].slice.call(arguments))); }

  /* 페이지 식별 — DOM 마커 우선(슬러그 변경에 강함), 경로는 보조 */
  function pageKey() {
    var p = (location.pathname || '/').toLowerCase();
    /* 경로 우선 — discover-helix 는 about 템플릿(+about/bootstrap.js)을 재사용해
       about DOM 마커(.about-heading 등)를 가질 수 있다. DOM 마커보다 경로를
       먼저 가려야 디스커버 트래픽이 about 으로 섞이지 않는다. */
    if (/discover/.test(p)) return 'discover';
    /* 진료과목 페이지 — 이 분기가 없으면 방문이 home 으로 잘못 집계된다
       (응급증상이 겪었던 것과 같은 문제). */
    if (/(^|\/)services(\/|$)/.test(p) ||
        document.querySelector('[class*="dept-card_"]')) return 'services';
    /* 특화진료 페이지 — 이 분기가 없으면 방문·스크롤·체류가 전부 home 으로
       잘못 집계된다 (진료과목·응급증상이 겪었던 것과 같은 문제).
       판정은 floating-cta.js 와 동일하게 맞춘다 — 한 페이지의 page 값이
       모듈마다 달라지면 시트에서 합산이 안 된다. */
    if (/(^|\/)specialty(-care)?(\/|$)/.test(p) ||
        document.querySelector('.hst_grid, .hst-item-wrap')) return 'specialty';
    /* 응급증상 페이지 — 실제 슬러그가 /symptoms 라서 'emergency' 라는 글자를
       찾는 방식으로는 못 잡는다. 이걸 빠뜨려 응급 방문이 전부 home 으로
       집계되고 있었다(홈은 부풀고 응급은 0으로 보임).
       (^|/)(symptoms|emergency)($|/) 로 인증 상세(/emergency-cert)는 제외. */
    if (/(^|\/)(symptoms|emergency)(\/|$)/.test(p) ||
        document.querySelector('.em_card, [data-emergency-open]')) return 'emergency';
    /* FAQ 페이지 — 경로/DOM 마커로 우선 판정(안 그러면 home 으로 오분류됨) */
    if (/faq/.test(p) || document.querySelector('.faq_tab-name, [class*="faq-list" i]')) return 'faq';
    /* 일산 분원 — 서초 페이지를 복제해 만든 페이지라 .map_naver 를 그대로
       갖고 있다. 아래 서초 판정보다 먼저 걸러내지 않으면 일산 방문·전화·
       스크롤이 통째로 서초 실적에 합산된다. URL 우선, 지도 컨테이너에
       박아둔 data-map-name 을 폴백으로 본다(슬러그가 바뀌어도 살아남게). */
    var mapName = document.querySelector('[data-map-name]');
    if (/(^|\/)ilsan(\/|$)/.test(p) ||
        (mapName && /일산/.test(mapName.getAttribute('data-map-name') || ''))) return 'ilsan';
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    if (/seocho|서초/.test(p)) return 'seocho';
    if (/about/.test(p)) return 'about';
    return 'home';
  }

  var PAGE = pageKey();
  function device() { return window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop'); }

  function send(eventName, params) {
    try {
      var base = { item_type: params.item_type, page: PAGE, device: device() };
      for (var k in params) { if (params.hasOwnProperty(k)) base[k] = params[k]; }
      if (typeof window.gtag === 'function') {
        base.transport_type = 'beacon';
        window.gtag('event', eventName, base);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        base.event = eventName;
        window.dataLayer.push(base);
      }
      log('sent', eventName, base);
    } catch (e) { log('send error', e); }
  }

  /* ① 페이지 뷰 */
  function trackPageView() {
    send(PAGE + '_page_view', { item_type: 'page_view', value: location.pathname });
  }

  /* ② 스크롤 깊이 — 25/50/75/100% 각 1회 */
  function initScrollDepth() {
    var thresholds = [25, 50, 75, 100];
    var fired = {};
    var ticking = false;

    function check() {
      ticking = false;
      var doc = document.documentElement;
      var body = document.body;
      var scrollTop = window.scrollY || doc.scrollTop || 0;
      var winH = window.innerHeight || doc.clientHeight || 0;
      var docH = Math.max(
        body ? body.scrollHeight : 0, doc.scrollHeight,
        body ? body.offsetHeight : 0, doc.offsetHeight
      );
      var scrollable = docH - winH;

      /* 화면보다 짧아 스크롤할 게 없는 페이지 — 예전엔 여기서 percent 를 100
         으로 놔서 25·50·75·100 이 페이지 열자마자 한꺼번에 찍혔다. 끝까지
         읽은 게 아니라 페이지가 짧았을 뿐이므로 아무 것도 보내지 않는다.
         (이미지 로드 등으로 나중에 길어지면 그때부터 정상 측정된다.) */
      if (scrollable <= 0) return;

      var percent = Math.min(100, (scrollTop / scrollable) * 100);

      /* 한 번의 검사에서 여러 단계를 동시에 넘긴 경우(빠른 스크롤, 앵커 점프)
         가장 높은 단계 하나만 보낸다. 넘긴 단계를 전부 보내면 같은 초에 여러
         줄이 몰려 찍히고, 발송이 비동기라 도착 순서까지 뒤집혀(50 → 100 → 75)
         "어디까지 읽었나" 를 읽을 수 없게 된다. 건너뛴 낮은 단계는 보내지
         않되 발사 완료로 표시해, 뒤늦게 중복으로 나가지 않게 한다. */
      var reached = 0;
      for (var i = 0; i < thresholds.length; i++) {
        var t = thresholds[i];
        if (percent >= t && !fired[t]) {
          fired[t] = true;
          reached = t;
        }
      }
      if (reached) {
        send(PAGE + '_scroll_depth', {
          item_type: 'scroll_depth',
          percent_scrolled: reached,
          value: reached
        });
      }
      /* 모두 발사되면 리스너 해제 */
      if (fired[100]) {
        window.removeEventListener('scroll', onScroll);
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    /* 첫 화면에서 이미 일부 도달했거나 페이지가 짧은 경우 즉시 1회 평가 */
    check();
  }

  function init() {
    log('page =', PAGE);
    trackPageView();
    initScrollDepth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
