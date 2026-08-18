/* ================================================================
   HELIX AMC — 전 사이트 이벤트 자동 시트 로깅
   ================================================================
   gtag('event', ...) 로 나가는 모든 측정(GA4)을 가로채, 같은 내용을
   구글 시트에도 한 줄씩 같이 쌓는다. GA4 맞춤 측정기준 등록·탐색
   분석 리포트 설정 없이도, 시트만 열면 어떤 이벤트가 몇 번/무슨
   내용으로 발생했는지 바로 확인 가능.

   동작:
   - FILES 배열에서 global/ga4-base.js 바로 다음에 로드 — 그때 이미
     window.gtag 가 정의돼 있으므로 감싸서 'event' 호출만 가로챈다.
   - GA4 와 동일한 도메인 게이트: 정식 사이트(main)에서만 전송.
     스테이징(*.webflow.io)은 원천 skip (테스트 트래픽이 시트에
     안 섞이도록 — CLAUDE.md GA4 도메인 게이트 정책과 동일).
   - 전송은 navigator.sendBeacon 우선(페이지 이탈 중에도 유실 없음),
     미지원 브라우저는 fetch(keepalive) 로 폴백.
   - [2026-08-11 추가] 병원에서 낸 방문은 시트에도 안 쌓이게 한다.
     GA4 쪽은 관리자 화면의 '내부 트래픽' 규칙(IP 기준)이 알아서 걸러
     주지만, 시트로 보내는 이 경로는 받는 쪽(Apps Script)이 요청자
     IP 를 알 수 없다. 그래서 브라우저가 자기 공인 IP 를 한 번 확인해
     병원 IP 면 애초에 안 보낸다. 시트에 흔적 자체가 안 남는다.
     · 브라우저마다 켜야 하는 운영자 제외 스위치(measure-gate)와 달리,
       병원 와이파이로 들어온 기기는 설정 없이 자동으로 빠진다.
     · IP 확인이 막히면(사내 방화벽 등) '병원 아님' 으로 보고 그냥
       기록한다 — 필터가 실패해도 측정이 멎지는 않게.

   디버그: URL 에 ?debug-sheet-log=1
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixSheetLogInit) return;
  window.__helixSheetLogInit = true;

  /* ⚠️ 측정은 정식 사이트(main)에서만 — 스테이징은 원천 차단 */
  if (/\.webflow\.io$/i.test(location.hostname)) return;
  /* 운영자 제외 — global/measure-gate.js 가 켜 둔 표시가 있으면 측정 안 함
     (?helix-noga=1 로 켠 브라우저) */
  if (window.__helixNoMeasure) return;


  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbw4_teiXT692qgXtvKn9XfPuevpGGj6GxVodB-qvTZdLHMMhpaeP3UwHTtRVajoY-PB/exec';

  /* 병원 공인 IP 목록 — GA4 관리자 > 데이터 스트림 > 내부 트래픽 정의
     (규칙명 "나_BD")와 같은 값으로 유지할 것. 회선이 유동 IP 면 값이
     바뀔 수 있으니, 시트에 병원 방문이 다시 섞이면 여기부터 확인. */
  var INTERNAL_IPS = ['1.220.235.252'];

  var DEBUG = /[?&]debug-sheet-log=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[sheet-log]'].concat(Array.prototype.slice.call(arguments)));
  }

  /* 공인 IP 확인은 방문 한 번에 한 번만. 결과를 그 방문 동안 기억해 둬서
     (sessionStorage) 다음 페이지부터는 기다림 없이 바로 판정한다. */
  var CACHE_KEY = 'helix_sheetlog_internal';
  var cached = null;
  try { cached = sessionStorage.getItem(CACHE_KEY); } catch (e) {}

  var ipCheck;
  if (cached === '1' || cached === '0') {
    ipCheck = Promise.resolve(cached === '1');
    log('ip check (cached) internal:', cached === '1');
  } else {
    ipCheck = fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var ip = d && d.ip;
        var isInternal = !!ip && INTERNAL_IPS.indexOf(ip) !== -1;
        try { sessionStorage.setItem(CACHE_KEY, isInternal ? '1' : '0'); } catch (e) {}
        log('ip check', ip, 'internal:', isInternal);
        return isInternal;
      })
      .catch(function (e) {
        /* 확인 실패 = 병원 아님으로 간주(기록은 계속). 다만 캐시엔 안 남겨
           다음 페이지에서 다시 시도하게 둔다. */
        log('ip check failed, 기록 계속', e);
        return false;
      });
  }

  function send(eventName, params) {
    params = params || {};
    var payload;
    /* 보낼 내용은 지금(이벤트 시점) 만들어 둔다 — session.js 가 같은
       params 객체를 나중에 더 채우기 때문에, IP 확인을 기다리는 사이
       내용이 달라지지 않도록. */
    try {
      payload = {
        event_name: eventName,
        page: params.page || '',
        device: params.device || (window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop')),
        value: params.value || '',
        params: params
      };
      payload = JSON.parse(JSON.stringify(payload));
      /* 시트 호환 — 유입처를 싣는 이름을 source 에서 entry_src 로 바꿨는데
         (GA4 가 source 를 유입 경로로 덮어써서. session.js 머리말 참고),
         시트 수식이 아직 "source" 를 읽고 있을 수 있어 같은 값을 옛 이름
         으로도 한 벌 넣어 둔다. 이건 시트로 가는 사본에만 붙고 GA4 로는
         안 나가므로 유입 경로가 다시 덮일 일은 없다. */
      if (payload.params && payload.params.entry_src && !payload.params.source) {
        payload.params.source = payload.params.entry_src;
      }
    } catch (e) { log('payload error', e); return; }

    ipCheck.then(function (isInternal) {
      if (isInternal) { log('skip (병원 IP)', eventName); return; }
      try {
        var body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
        } else {
          fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, body: body });
        }
        log('sent', eventName, payload);
      } catch (e) { log('send error', e); }
    });
  }

  /* window.gtag 를 한 번만 감싼다 — 다른 모듈(ga-inspector 등)이 이미
     감싸둔 상태여도 그 위에 다시 감싸면 되므로 순서 무관, 중복 감싸기만 방지. */
  var original = window.gtag;
  if (typeof original !== 'function' || original.__helixSheetWrapped) return;
  var wrapped = function () {
    original.apply(this, arguments);
    if (arguments[0] === 'event') send(arguments[1], arguments[2]);
  };
  wrapped.__helixSheetWrapped = true;
  window.gtag = wrapped;
  log('gtag wrapped, sending to sheet (병원 IP 제외 켜짐)');
})();
