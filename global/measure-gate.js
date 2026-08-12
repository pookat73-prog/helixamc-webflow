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

  /* ── 표시를 두 군데에 남긴다 (localStorage + 쿠키) ────────────────
     한쪽만 쓰면 자꾸 풀려서 매번 다시 켜야 했다. 풀리는 이유는 대개 셋:
       · Safari 는 localStorage 를 7일 지나면 지운다 (사파리 정책)
       · 브라우저에 '종료 시 사이트 데이터 삭제' 가 켜져 있는 경우
       · 시크릿 창 — 창을 닫으면 저장소가 통째로 사라진다 (이건 못 피한다.
         시크릿으로 확인할 땐 아래 '점검 모드' 북마크로 들어오면 된다)
     두 군데에 남겨두면 한쪽이 지워져도 나머지 한쪽에서 되살린다. 그리고
     방문할 때마다 다시 써서 만료 시계를 처음으로 되돌린다. */
  function readCookie() {
    try {
      var m = new RegExp('(?:^|; )' + KEY + '=([^;]*)').exec(document.cookie || '');
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }
  function writeMark(on) {
    try {
      if (on) localStorage.setItem(KEY, '1');
      else localStorage.removeItem(KEY);
    } catch (e) {}
    try {
      document.cookie = KEY + '=' + (on ? '1' : '') +
        ';path=/;max-age=' + (on ? 60 * 60 * 24 * 365 : 0) + ';samesite=lax';
    } catch (e) {}
  }

  /* 주소에 스위치가 실려 오면 먼저 반영한다 (?helix-noga=1 / =0) */
  var toggled = null;
  try {
    var m = /[?&]helix-noga=([01])/.exec(location.search || '');
    if (m) {
      toggled = m[1] === '1';
      writeMark(toggled);
    }
  } catch (e) {}

  var ls = null, ck = readCookie();
  try { ls = localStorage.getItem(KEY); } catch (e) {}
  var off = (ls === '1' || ck === '1');

  /* 한쪽만 남아 있으면 다른 쪽을 되살리고, 켜져 있으면 만료 시계도 되감는다 */
  if (off) writeMark(true);

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

  /* ── 지금 제외 중이라는 걸 화면에 보여준다 ───────────────────────
     여태 콘솔에만 찍혀서, 켜졌는지 확인하려면 매번 F12 를 열어야 했다.
     그래서 "켜둔 줄 알았는데 안 켜져 있던" 경우를 눈치채지 못했다.
     왼쪽 아래에 작은 표시를 띄워 한눈에 보이게 한다. 눌러서 해제할 수도
     있고, 오른쪽 ✕ 로 이번 방문에만 숨길 수도 있다. */
  function badge() {
    if (document.getElementById('helix-noga-badge')) return;
    var el = document.createElement('div');
    el.id = 'helix-noga-badge';
    el.style.cssText = [
      'position:fixed', 'left:12px', 'bottom:12px', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'gap:8px',
      'padding:7px 10px', 'border-radius:6px',
      'background:rgba(13,17,23,.82)', 'color:#f4f7fb',
      'font:600 11px/1.2 -apple-system,BlinkMacSystemFont,"Malgun Gothic",sans-serif',
      'letter-spacing:.02em', 'box-shadow:0 2px 10px rgba(0,0,0,.25)',
      'pointer-events:auto', 'user-select:none'
    ].join(';');

    var dot = document.createElement('span');
    dot.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#0075d6;flex:0 0 auto';

    var txt = document.createElement('span');
    txt.textContent = '내 방문 측정 제외 중';
    txt.title = '눌러서 해제 (다시 집계됩니다)';
    txt.style.cursor = 'pointer';
    txt.addEventListener('click', function () {
      writeMark(false);
      location.href = location.pathname + '?helix-noga=0';
    });

    var x = document.createElement('span');
    x.textContent = '✕';
    x.title = '이번 방문에만 숨기기 (제외는 그대로 유지)';
    x.style.cssText = 'cursor:pointer;opacity:.55;font-weight:400';
    x.addEventListener('click', function () { el.remove(); });

    el.appendChild(dot); el.appendChild(txt); el.appendChild(x);
    document.body.appendChild(el);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', badge);
  } else {
    badge();
  }
})();
