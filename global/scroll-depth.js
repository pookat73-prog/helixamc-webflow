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

  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() { if (DEBUG) console.log.apply(console, ['[helix-ga]'].concat([].slice.call(arguments))); }

  /* 페이지 식별 — DOM 마커 우선(슬러그 변경에 강함), 경로는 보조 */
  function pageKey() {
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    var p = (location.pathname || '/').toLowerCase();
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
