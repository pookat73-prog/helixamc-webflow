/* ================================================================
   HELIX AMC — 페이지 체류시간 (한 페이지에 몇 초 있었나)
   ================================================================
   지금까지 체류시간은 '섹션별'(global/section-reach.js) 로만 쟀다.
   그런데 섹션 체류를 다 더해도 페이지 체류가 되지 않는다 — 섹션 사이
   빈 구간은 어디에도 안 잡히고, 섹션 정의가 없는 페이지(FAQ·응급증상)
   는 통째로 0 이다. 그래서 "이 페이지에 몇 초 있었나" 를 따로 잰다.

   ▸ 두 가지 초를 함께 보낸다
     - active_sec : 실제로 보고 있던 초. 탭을 다른 창으로 돌리거나
                    60초간 아무 조작이 없으면 시계를 멈춘다.
                    (자리만 비운 시간이 체류로 잡히면 숫자가 무의미)
     - total_sec  : 페이지를 연 순간부터 떠날 때까지의 총 초.
                    active 와 나란히 두면 '띄워만 두고 안 본 시간' 이 보인다.

   ▸ 보내는 시점
     페이지를 떠날 때(pagehide). 모바일은 pagehide 가 안 뜨는 경우가
     많아 화면 숨김(visibilitychange) 에서도 보내되, 이미 보낸 만큼을
     뺀 '증가분' 만 보낸다 → 시트에서 그냥 SUM 하면 총 체류가 된다.
     (section-reach.js 의 체류 전송 방식과 동일 — 두 숫자의 기준을
      맞춰 두어야 시트에서 나란히 비교할 수 있다)

   ▸ 방문 내 순서(step)·직전 페이지(prev) 는 global/session.js 가
     모든 이벤트에 자동으로 붙여 준다 → 이 모듈은 초만 신경 쓴다.

   이벤트명: <page>_time_on_page   (page = home|discover|seocho|
             emergency|faq|services — scroll-depth.js 와 동일 판정)

   ⚠️ 측정은 정식 사이트에서만 — 스테이징(*.webflow.io) 은 원천 skip.
   디버그: URL 에 ?debug-ga=1
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixPageTimeInit) return;
  window.__helixPageTimeInit = true;

  /* ⚠️ 측정은 정식 사이트(main)에서만 (CLAUDE.md GA4 도메인 게이트 정책) */
  if (/\.webflow\.io$/i.test(location.hostname)) return;
  /* 운영자 제외 — global/measure-gate.js 가 켜 둔 표시가 있으면 측정 안 함
     (?helix-noga=1 로 켠 브라우저) */
  if (window.__helixNoMeasure) return;


  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[helix-time]'].concat([].slice.call(arguments)));
  }

  /* 페이지 식별 — scroll-depth.js / section-reach.js 와 동일 판정.
     세 모듈의 page 값이 어긋나면 시트에서 같은 페이지가 둘로 갈린다. */
  function pageKey() {
    var p = (location.pathname || '/').toLowerCase();
    if (/discover/.test(p)) return 'discover';
    if (/(^|\/)services(\/|$)/.test(p) ||
        document.querySelector('[class*="dept-card_"]')) return 'services';
    if (/(^|\/)(symptoms|emergency)(\/|$)/.test(p) ||
        document.querySelector('.em_card, [data-emergency-open]')) return 'emergency';
    if (/faq/.test(p) || document.querySelector('.faq_tab-name, [class*="faq-list" i]')) return 'faq';
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    if (/seocho|서초/.test(p)) return 'seocho';
    if (/about/.test(p)) return 'about';
    return 'home';
  }

  var PAGE = pageKey();
  function device() { return window.innerWidth <= 767 ? 'mobile' : 'desktop'; }

  var MIN_MS  = 1000;    /* 1초 미만은 '스쳐 지나감' — 기록 안 함 */
  var IDLE_MS = 60000;   /* 60초간 조작 없으면 자리 비움으로 간주 */
  var TICK_MS = 5000;    /* 주기 점검 — 가만히 있어도 자리 비움 감지 */

  var openedAt     = Date.now();   /* 페이지를 연 시각 */
  var activeTotal  = 0;            /* 실제로 보고 있던 누적 ms */
  var activeSince  = null;         /* 지금 보는 중이면 그 시작 ts */
  var sentActive   = 0;            /* 이미 전송한 active ms (증가분 계산용) */
  var sentTotal    = 0;            /* 이미 전송한 total ms */
  var lastActivity = Date.now();
  var docHidden    = !!document.hidden;

  /* 시계 상태 재계산. forceOff 면 열린 시계를 닫는다(전송 직전). */
  function recompute(forceOff) {
    var t = Date.now();
    var idleAt = lastActivity + IDLE_MS;
    var awake  = !docHidden && t < idleAt;
    /* 자리 비움으로 끊는 경우 '마지막 조작 + 60초' 까지만 체류로 인정 */
    var endMark = (!docHidden && t >= idleAt) ? Math.min(t, idleAt) : t;

    if (!forceOff && awake) {
      if (activeSince === null) activeSince = t;
    } else if (activeSince !== null) {
      activeTotal += Math.max(0, endMark - activeSince);
      activeSince = null;
    }
  }

  /* ── 이 방문을 어떻게 읽어야 하나 ────────────────────────────────
     "한 페이지만 보고 나갔다" 는 방문의 절반을 차지하는데, 그 안에는
     성격이 정반대인 것들이 섞여 있다. 전화번호만 확인하고 만족해서 나간
     방문과, 광고로 들어와 7초 만에 튕겨 나간 방문이 같은 한 줄로 세어진다
     (측정 보고서 3-3). 셋으로 가를 수 있게 판정값을 함께 남긴다.

       acted      이 방문에서 전환 행동(전화·상담·길찾기·복사)이 있었나
                  — global/session.js 가 이벤트 이름을 보고 켜 둔 표시
       acted_type 그 행동의 종류 (phone / consult / map / copy / lead)
       engaged    실제로 보고 있던 시간이 30초 이상인가
       bounce_kind
         satisfied  행동이 있었다 → 이탈이 아니라 성공에 가깝다
         read       행동은 없지만 30초 이상 봤다 → 읽고 나갔다
         quick      10초 미만, 행동 없음 → 진짜 개선 대상은 여기뿐
         short      그 사이 (10~30초, 행동 없음)

     ⚠️ 이 값은 '이 페이지에 대한' 판정이다. 방문 전체가 한 페이지였는지는
        session.js 가 붙이는 step(방문 내 순서)으로 시트에서 가른다
        — step=1 이면서 그 방문에 다른 페이지 기록이 없으면 1페이지 방문. */
  function verdict(activeSoFar, totalSoFar) {
    var actSec = activeSoFar / 1000;
    var acted  = !!window.__helixActed;
    var kind;
    if (acted)               kind = 'satisfied';
    else if (actSec >= 30)   kind = 'read';
    else if (totalSoFar / 1000 < 10) kind = 'quick';
    else                     kind = 'short';
    return {
      acted:      acted ? 1 : 0,
      acted_type: acted ? (window.__helixActedType || '') : '',
      engaged:    actSec >= 30 ? 1 : 0,
      bounce_kind: kind
    };
  }

  function send(activeDelta, totalDelta, totalSoFar) {
    var name = PAGE + '_time_on_page';
    var v = verdict(activeTotal, totalSoFar);
    var params = {
      item_type:  'time_on_page',
      page:       PAGE,
      device:     device(),
      active_sec: Math.round(activeDelta / 1000),   /* 합계용 — 증가분 */
      total_sec:  Math.round(totalDelta / 1000),    /* 합계용 — 증가분 */
      elapsed_sec: Math.round(totalSoFar / 1000),   /* 참고용 — 진입 후 누적 */
      active_total_sec: Math.round(activeTotal / 1000), /* 참고용 — 이 페이지 누적 active */
      acted:       v.acted,
      acted_type:  v.acted_type,
      engaged:     v.engaged,
      bounce_kind: v.bounce_kind,
      value:      Math.round(activeDelta / 1000)
    };
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        window.gtag('event', name, params);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        params.event = name;
        window.dataLayer.push(params);
      }
      log('sent', name, params.active_sec + 's active /', params.total_sec + 's total');
    } catch (e) { log('send error', e); }
  }

  /* 아직 안 보낸 증가분만 전송 */
  function flush() {
    recompute(true);
    var totalSoFar   = Date.now() - openedAt;
    var activeDelta  = activeTotal - sentActive;
    var totalDelta   = totalSoFar - sentTotal;
    if (activeDelta < MIN_MS && totalDelta < MIN_MS) return;
    sentActive = activeTotal;
    sentTotal  = totalSoFar;
    send(activeDelta, totalDelta, totalSoFar);
  }

  function init() {
    var ticking = false;
    function onScroll() {
      lastActivity = Date.now();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; recompute(false); });
    }
    function bump() { lastActivity = Date.now(); }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    var acts = ['mousemove', 'keydown', 'touchstart', 'click', 'wheel'];
    for (var i = 0; i < acts.length; i++) {
      window.addEventListener(acts[i], bump, { passive: true });
    }

    document.addEventListener('visibilitychange', function () {
      docHidden = !!document.hidden;
      if (docHidden) {
        flush();                    /* 모바일 이탈은 대개 여기서 잡힌다 */
      } else {
        lastActivity = Date.now();
        recompute(false);
      }
    });
    window.addEventListener('pagehide', flush);

    setInterval(function () { recompute(false); }, TICK_MS);
    recompute(false);
    log('page =', PAGE, '| 체류시간 측정 시작');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
