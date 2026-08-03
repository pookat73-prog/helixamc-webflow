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

  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() { if (DEBUG) console.log.apply(console, ['[helix-ga]'].concat([].slice.call(arguments))); }

  /* 페이지 식별 — DOM 마커 우선(슬러그 변경에 강함), 경로는 보조 */
  function pageKey() {
    var p = (location.pathname || '/').toLowerCase();
    /* 경로 우선 — discover-helix 는 about 템플릿(+about/bootstrap.js)을 재사용해
       about DOM 마커(.about-heading 등)를 가질 수 있다. DOM 마커보다 경로를
       먼저 가려야 디스커버 트래픽이 about 으로 섞이지 않는다. */
    if (/discover/.test(p)) return 'discover';
    /* 응급증상 페이지 — 실제 슬러그가 /symptoms 라서 'emergency' 라는 글자를
       찾는 방식으로는 못 잡는다. 이걸 빠뜨려 응급 방문이 전부 home 으로
       집계되고 있었다(홈은 부풀고 응급은 0으로 보임).
       (^|/)(symptoms|emergency)($|/) 로 인증 상세(/emergency-cert)는 제외. */
    if (/(^|\/)(symptoms|emergency)(\/|$)/.test(p) ||
        document.querySelector('.em_card, [data-emergency-open]')) return 'emergency';
    /* FAQ 페이지 — 경로/DOM 마커로 우선 판정(안 그러면 home 으로 오분류됨) */
    if (/faq/.test(p) || document.querySelector('.faq_tab-name, [class*="faq-list" i]')) return 'faq';
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    if (/seocho|서초/.test(p)) return 'seocho';
    if (/about/.test(p)) return 'about';
    return 'home';
  }

  var PAGE = pageKey();
  function device() { return window.innerWidth <= 767 ? 'mobile' : 'desktop'; }

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
      var percent = scrollable <= 0 ? 100 : Math.min(100, (scrollTop / scrollable) * 100);

      for (var i = 0; i < thresholds.length; i++) {
        var t = thresholds[i];
        if (percent >= t && !fired[t]) {
          fired[t] = true;
          send(PAGE + '_scroll_depth', {
            item_type: 'scroll_depth',
            percent_scrolled: t,
            value: t
          });
        }
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
