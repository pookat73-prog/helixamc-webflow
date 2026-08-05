/* ================================================================
   HELIX AMC — 내 방문은 측정에서 빼기 (운영자 제외 스위치)
   ================================================================
   병원 관계자가 사이트를 들락거린 것도 그대로 방문으로 집계돼,
   방문 수·체류시간·동선이 실제 보호자들의 행동과 섞여 왜곡된다.
   이 모듈은 "이 브라우저는 세지 마라" 는 표시를 남겨 둘 수 있게 한다.

   ▸ 켜기 : 주소 뒤에 ?helix-noga=1  을 붙여 한 번 연다
   ▸ 끄기 : 주소 뒤에 ?helix-noga=0  을 붙여 한 번 연다
   ▸ 확인 : 콘솔에 [helix-gate] 줄이 뜨는지 본다

   한 번 켜두면 그 브라우저에서는 계속 제외된다(localStorage 저장).
   브라우저·기기마다 따로 켜야 한다 — 표시를 그 브라우저 안에만
   남기기 때문(사람을 알아보는 방식이 아니라서 그렇다).
   시크릿 창이나 저장소를 지우면 표시도 함께 사라진다.

   ▸ 어떻게 막는가
     제외 상태면 이 자리에서 gtag 를 '아무 일도 안 하는 함수' 로 미리
     정의해 둔다. 이후 로드되는 모든 측정 모듈(ga4-base / session /
     sheet-log / scroll-depth / page-time / section-reach)은
     window.__helixNoMeasure 를 보고 스스로 멈추고, 혹시 빠뜨린
     모듈이 gtag 를 부르더라도 아무 것도 나가지 않는다(이중 안전).

   ⚠️ FILES 배열의 가장 첫 줄에 둘 것. ga4-base.js 보다 먼저 실행돼야
      gtag 가 만들어지기 전에 가로챌 수 있다. (gtag 를 쓰지 않는
      모듈이라 ga4-base 보다 앞서도 순서 문제는 없다.)
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixGateInit) return;
  window.__helixGateInit = true;

  var KEY = 'helix_noga';

  /* 주소에 스위치가 실려 오면 먼저 반영한다 (?helix-noga=1 / =0) */
  var toggled = null;
  try {
    var m = /[?&]helix-noga=([01])/.exec(location.search || '');
    if (m) {
      toggled = m[1] === '1';
      if (toggled) localStorage.setItem(KEY, '1');
      else localStorage.removeItem(KEY);
    }
  } catch (e) {}

  var off = false;
  try { off = localStorage.getItem(KEY) === '1'; } catch (e) { off = false; }

  window.__helixNoMeasure = off;

  if (toggled === true) {
    console.log('%c[helix-gate] 이 브라우저는 이제 측정에서 제외됩니다. ' +
                '되돌리려면 주소 뒤에 ?helix-noga=0 을 붙여 한 번 여세요.',
                'color:#0075d6;font-weight:bold');
  } else if (toggled === false) {
    console.log('%c[helix-gate] 측정 제외를 해제했습니다. 이 브라우저도 다시 집계됩니다.',
                'color:#0075d6;font-weight:bold');
  }

  if (!off) return;

  console.log('[helix-gate] 측정 제외 상태 — 이 방문은 GA4 와 구글 시트 어디에도 쌓이지 않습니다.');

  /* 뒤이어 로드될 모듈들이 안심하고 gtag 를 부를 수 있도록 빈 껍데기만
     만들어 둔다. ga4-base.js 의 스테이징 게이트와 같은 방식. */
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') { window.gtag = function () {}; }
})();
