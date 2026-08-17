/* ================================================================
   HELIX AMC — 뷰포트 기준 (사이트 자체 기준) v1

   ■ 왜 필요한가
   지금은 "지금 모바일인가?" 를 파일마다 각자 판정한다. JS 안에서만
   `innerWidth <= 767` 이 32곳, CSS 미디어쿼리 기준 폭은 19가지
   (420/460/479/520/599/600/720/767/768/850/991/1080 …). 한 곳을 고치면
   다른 곳이 어긋나는 이유가 이것이다.
   이 파일이 그 기준을 한 곳에 모은다. 숫자를 바꾸려면 아래 BANDS 만 고친다.

   ■ 폭만으로는 부족하다 (가로/세로 비율 문제)
   폭이 좁아지면 같은 내용이 세로로 길어진다. 그래서 폭만 보고 크기·여백을
   정하면 두 가지가 깨진다.
     - 가로로 돌린 폰 (예: 844×390) — 폭이 넓다고 글자를 키우면 높이가
       모자라 한 화면에 안 들어감
     - 세로로 긴 폰 (390×844) — 세로 여백까지 폭에 비례시키면 스크롤 폭발
   그래서 폭 밴드와 별개로 "화면이 낮은가 / 길쭉한가" 를 함께 내보낸다.

   ■ 무엇을 하나
   <html> 에 아래 속성을 붙인다. CSS 는 미디어쿼리 대신 이 속성을 봐도 된다.
     data-vp="phone-sm|phone|phone-lg|tablet|laptop|desktop|wide"
     data-vp-orient="portrait|landscape"
     data-vp-short="1"   화면 높이가 낮음 (가로 폰 등)
     data-vp-tall="1"    화면이 세로로 길쭉함 (폭/높이 < 0.55)
   그리고 window.HelixVP 로 같은 판정을 JS 에서 쓸 수 있게 한다.

   ⚠️ device() 는 기존 32곳과 판정이 완전히 같다 (<=767 → mobile).
      측정(GA4) 이 이 값으로 mobile/desktop 을 나누고 있어, 여기서 기준을
      바꾸면 이전 데이터와 비교가 깨진다. 폭 밴드를 새로 쓰더라도
      device() 만은 767 을 유지할 것.

   ⚠️ 미디어쿼리에는 CSS 변수를 못 쓴다 (@media (max-width: var(--x)) 는
      동작하지 않음). 그래서 "숨김/보임 같은 큰 레이아웃 전환" 은 지금처럼
      미디어쿼리로 두고 (첫 화면 깜빡임 방지), 이 속성은 "크기·여백 미세
      조정" 에 쓴다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixVPInit) return;
  window.__helixVPInit = true;

  /* ── 여기만 고치면 사이트 전체 기준이 바뀐다 ────────────────────
     각 밴드의 값은 "이 폭까지" (상한, 포함). 마지막 wide 는 그 위 전부.

     이 숫자를 이렇게 잡은 이유:
       390  아이폰 15/14 393, 갤럭시 S 계열 360~412 — 표준 폰의 바닥
       480  큰 폰과 작은 폰의 경계
       767  폰과 태블릿의 경계 (Webflow 와 동일하게 둠 — 아래 주석 참고)
       1039 아이패드 프로 13"(M4) 세로 폭이 1032 라 991 로 자르면 이 기기가
            데스크탑으로 새어나간다. services/landscape-mobile.js 가 지금
            이 문제를 그 페이지에서만 viewport 를 속여 막고 있다.
       1439 디자인 기준 폭 1440 바로 아래까지 = 노트북 구간
       1919 1440~1919 가 표준 데스크탑, 1920 이상이 대형 모니터
     ------------------------------------------------------------------ */
  var BANDS = [
    { name: 'phone-sm', max: 389 },
    { name: 'phone',    max: 479 },
    { name: 'phone-lg', max: 767 },
    { name: 'tablet',   max: 1039 },
    { name: 'laptop',   max: 1439 },
    { name: 'desktop',  max: 1919 },
    { name: 'wide',     max: Infinity }
  ];

  /* 높이·비율 기준 */
  var H_SHORT   = 500;   /* 이 높이 이하 = 낮은 화면 (가로로 돌린 폰) */
  var R_TALL    = 0.55;  /* 폭/높이 가 이 값 미만 = 세로로 길쭉 (폰 세로는 ~0.46) */

  /* 측정(GA4) 용 mobile/desktop 경계 — 바꾸지 말 것 (위 주석 참고) */
  var DEVICE_MOBILE_MAX = 767;

  var root = document.documentElement;
  var listeners = [];
  var last = {};

  function w() { return window.innerWidth  || root.clientWidth  || 0; }
  function h() { return window.innerHeight || root.clientHeight || 0; }

  function band() {
    var width = w();
    for (var i = 0; i < BANDS.length; i++) {
      if (width <= BANDS[i].max) return BANDS[i].name;
    }
    return 'wide';
  }

  function state() {
    var width = w(), height = h();
    return {
      w: width,
      h: height,
      band: band(),
      orient: height >= width ? 'portrait' : 'landscape',
      short: height > 0 && height <= H_SHORT,
      tall: height > 0 && (width / height) < R_TALL,
      device: width <= DEVICE_MOBILE_MAX ? 'mobile' : 'desktop'
    };
  }

  function apply() {
    var s = state();
    if (s.band === last.band && s.orient === last.orient &&
        s.short === last.short && s.tall === last.tall) return s;

    root.setAttribute('data-vp', s.band);
    root.setAttribute('data-vp-orient', s.orient);
    if (s.short) root.setAttribute('data-vp-short', '1');
    else root.removeAttribute('data-vp-short');
    if (s.tall) root.setAttribute('data-vp-tall', '1');
    else root.removeAttribute('data-vp-tall');

    last = s;
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](s); } catch (e) {}
    }
    return s;
  }

  window.HelixVP = {
    /* 현재 상태 한 덩어리 */
    get: function () { return state(); },

    /* 폭 밴드 이름 */
    band: band,

    /* 측정용 mobile/desktop — 기존 코드와 100% 동일 판정 */
    device: function () { return w() <= DEVICE_MOBILE_MAX ? 'mobile' : 'desktop'; },

    /* 가로로 돌린 폰: 가로 방향 + 높이 낮음. 태블릿은 높이가 커서 제외된다.
       services/landscape-mobile.js 와 같은 기준. */
    isLandscapePhone: function () {
      var s = state();
      return s.orient === 'landscape' && s.short && s.w <= 1039;
    },

    /* 화면이 낮다 (한 화면에 넣는 레이아웃을 쓰면 안 되는 상황) */
    isShort: function () { return state().short; },

    /* 화면이 세로로 길쭉하다 (세로 여백을 폭에 비례시키면 안 되는 상황) */
    isTall: function () { return state().tall; },

    /* 기준값 읽기 전용 — 다른 파일이 숫자를 다시 적지 않도록 */
    BANDS: BANDS.slice(),
    H_SHORT: H_SHORT,
    R_TALL: R_TALL,

    /* 상태가 실제로 바뀔 때만 호출된다 (같은 밴드 안의 리사이즈는 무시) */
    onChange: function (cb) {
      if (typeof cb === 'function') listeners.push(cb);
      return function () {
        var i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    }
  };

  apply();

  var t;
  function schedule(delay) {
    clearTimeout(t);
    t = setTimeout(apply, delay);
  }
  window.addEventListener('resize', function () { schedule(120); });
  /* 회전은 브라우저가 크기를 늦게 갱신하는 기기가 있어 조금 더 기다린다 */
  window.addEventListener('orientationchange', function () { schedule(220); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(); });
  }
})();
