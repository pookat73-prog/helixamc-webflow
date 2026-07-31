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

   디버그: URL 에 ?debug-sheet-log=1
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixSheetLogInit) return;
  window.__helixSheetLogInit = true;

  /* ⚠️ 측정은 정식 사이트(main)에서만 — 스테이징은 원천 차단 */
  if (/\.webflow\.io$/i.test(location.hostname)) return;

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbw4_teiXT692qgXtvKn9XfPuevpGGj6GxVodB-qvTZdLHMMhpaeP3UwHTtRVajoY-PB/exec';

  var DEBUG = /[?&]debug-sheet-log=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[sheet-log]'].concat(Array.prototype.slice.call(arguments)));
  }

  function send(eventName, params) {
    params = params || {};
    try {
      var payload = {
        event_name: eventName,
        page: params.page || '',
        device: params.device || (window.innerWidth <= 767 ? 'mobile' : 'desktop'),
        value: params.value || '',
        params: params
      };
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
      } else {
        fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, body: body });
      }
      log('sent', eventName, payload);
    } catch (e) { log('send error', e); }
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
  log('gtag wrapped, sending to sheet');
})();
