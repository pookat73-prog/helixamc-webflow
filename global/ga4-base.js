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
    window.gtag = function () {};
    console.log('[helix-ga4] staging(*.webflow.io) 감지 — 측정 비활성화');
    return;
  }

  /* 운영자 제외 — global/measure-gate.js 가 켜 둔 표시가 있으면 측정 안 함
     (?helix-noga=1 로 켠 브라우저) */
  if (window.__helixNoMeasure || window.self !== window.top) {
    window.gtag = function () {};
    return;
  }

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
  var forward = window.gtag || gtag;
  window.gtag = function () {
    if (window.__helixNoMeasure) return;
    if (arguments[0] === 'event' && arguments[2] && typeof arguments[2] === 'object') {
      var params = arguments[2];
      var controls = ['transport_type', 'event_callback', 'event_timeout', 'debug_mode', 'send_to'];
      var keys = Object.keys(params).filter(function (key) { return controls.indexOf(key) < 0; });
      if (keys.length > 25) {
        /* The raw-sheet wrapper still keeps the complete object. GA4 accepts
           at most 25 custom event parameters: preserve the action's detail
           before optional session/UTM copies already available to GA itself. */
        var priority = ['page', 'device', 'event_id', 'sid', 'content_type', 'content_id', 'item_type', 'branch', 'conv', 'conv_type', 'section_key', 'doctor', 'slug', 'dept', 'symptom', 'cert', 'item', 'group', 'question', 'field', 'error_type', 'cta_src', 'form_id', 'read_sec', 'dwell_sec', 'active_sec', 'total_sec', 'percent_scrolled', 'slide_index', 'direction', 'guide_position', 'guide_result', 'event_id', 'interaction_id', 'entry_src', 'visitor'];
        var selected = {}, count = 0;
        priority.concat(keys).forEach(function (key) {
          if (count < 25 && Object.prototype.hasOwnProperty.call(params, key) && !Object.prototype.hasOwnProperty.call(selected, key)) {
            selected[key] = params[key]; count++;
          }
        });
        controls.forEach(function (key) { if (params[key] !== undefined) selected[key] = params[key]; });
        var args = Array.prototype.slice.call(arguments); args[2] = selected;
        return forward.apply(this, args);
      }
    }
    return forward.apply(this, arguments);
  };

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

/* Shared measurement helpers. Never collect entered names, phone numbers,
   symptom text or clipboard contents. Event labels describe the interface. */
(function () {
  'use strict';
  if (window.HelixMeasure || window.__helixNoMeasure || /\.webflow\.io$/i.test(location.hostname) || window.self !== window.top) return;
  function page() {
    var path = (location.pathname || '/').replace(/\/$/, '') || '/';
    if (/^\/doctors\//.test(path)) return 'doctor';
    var pages = { '/': 'home', '/discover-helix': 'discover', '/specialty-care': 'specialty', '/symptoms': 'emergency' };
    return pages[path] || path.replace(/^\//, '').replace(/[^a-z0-9_]/gi, '_');
  }
  function emit(name, params) {
    if (window.__helixNoMeasure || typeof window.gtag !== 'function') return;
    var p = Object.assign({ page: page(), device: window.HelixVP ? window.HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop'), transport_type: 'beacon' }, params || {});
    window.gtag('event', name, p);
  }
  /* Active visible reading, delta-only on hide/pagehide; resumes after return.
     Stop explicitly when the modal/question is no longer visible. */
  function reader(name, params) {
    var total = 0, sent = 0, since = document.hidden ? null : Date.now(), last = Date.now(), stopped = false;
    function update() {
      var now = Date.now();
      if (since !== null) total += Math.max(0, Math.min(now, last + 60000) - since);
      since = !stopped && !document.hidden && now < last + 60000 ? now : null;
    }
    function flush() {
      update();
      var delta = total - sent;
      if (delta < 2000) return;
      sent = total;
      emit(name, Object.assign({}, params, { read_sec: Math.round(delta / 1000), value: Math.round(delta / 1000) }));
    }
    function activity() { update(); last = Date.now(); if (!document.hidden && !stopped) since = last; }
    function visibility() { if (document.hidden) flush(); else activity(); }
    var acts = ['click', 'keydown', 'pointermove', 'touchstart', 'scroll'];
    acts.forEach(function (type) { window.addEventListener(type, activity, { passive: true }); });
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', flush);
    var timer = setInterval(update, 5000);
    return { flush: flush, activity: activity, stop: function () {
      if (stopped) return;
      flush(); stopped = true; since = null; clearInterval(timer);
      acts.forEach(function (type) { window.removeEventListener(type, activity); });
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', flush);
    } };
  }
  window.HelixMeasure = { page: page, emit: emit, reader: reader };
})();

/* Advertising pixels share exactly the same exclusion boundary as GA4.
   Only a confirmed successful lead is forwarded, with no entered form data. */
(function () {
  'use strict';
  if (window.__helixAdsInit || window.__helixNoMeasure || /\.webflow\.io$/i.test(location.hostname) || window.self !== window.top) return;
  window.__helixAdsInit = true;
  if (!window.fbq) {
    var fb = function () { if (fb.callMethod) fb.callMethod.apply(fb, arguments); else fb.queue.push(arguments); };
    fb.push = fb; fb.loaded = true; fb.version = '2.0'; fb.queue = [];
    window.fbq = window._fbq = fb;
    var meta = document.createElement('script'); meta.async = true;
    meta.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(meta);
    fb('init', '2286274068810823'); fb('track', 'PageView');
  }
  if (!window.ttq || !window.ttq._i) {
    var tt = window.ttq = window.ttq || [];
    window.TiktokAnalyticsObject = 'ttq';
    ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'].forEach(function (method) {
      tt[method] = function () { tt.push([method].concat([].slice.call(arguments))); };
    });
    tt._i = {}; tt._i.D9EMN6BC77UD5IE52MB0 = []; tt._t = { D9EMN6BC77UD5IE52MB0: Date.now() }; tt._o = { D9EMN6BC77UD5IE52MB0: {} };
    tt._i.D9EMN6BC77UD5IE52MB0._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    tt.instance = function (id) { return tt._i[id] || []; };
    var tiktok = document.createElement('script'); tiktok.async = true;
    tiktok.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=D9EMN6BC77UD5IE52MB0&lib=ttq'; document.head.appendChild(tiktok);
    tt.page();
  }
  window.__helixTrackAdsLead = function (id) {
    if (window.__helixNoMeasure) return;
    try { if (window.fbq) window.fbq('track', 'Lead', {}, { eventID: id }); } catch (e) {}
    try { if (window.ttq && window.ttq.track) window.ttq.track('SubmitForm', {}, { event_id: id }); } catch (e) {}
  };
})();
