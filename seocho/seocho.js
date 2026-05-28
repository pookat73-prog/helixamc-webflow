/* ================================================================
   HELIX AMC - 서초본원 페이지: 네이버 지도 연동
   ================================================================
   - 컨테이너: .map_naver 또는 #map_naver (Webflow Designer)
   - 마커 + 정보창 + "네이버 지도에서 길찾기" 버튼
   - Naver Maps JS SDK 는 bootstrap 이 ncpClientId 와 함께 inject.
   ================================================================ */

(function () {
  'use strict';

  /* ----- 병원 정보 (서초본원) -----
     ⚠️ 정확한 좌표는 네이버 지도에서 핀 찍어 확인 후 교체 필요.
     아래 값은 "서울특별시 서초구 신반포로 162 르본시티" 기준 근사치. */
  var CLINIC = {
    name: '헬릭스 동물의료센터 서초본원',
    address: '서울특별시 서초구 신반포로 162 르본시티 2층',
    lat: 37.5048785,
    lng: 127.0023317,
    /* 네이버 지도 플레이스 ID — map.naver.com URL 의 /place/{id} 값. */
    naverPlaceId: '36786130'
  };

  var DEBUG = /[?&]debug-naver=1/.test(location.search);
  function log() { if (DEBUG) console.log.apply(console, ['[naver-map]'].concat([].slice.call(arguments))); }

  function findContainer() {
    return document.getElementById('map_naver')
        || document.querySelector('.map_naver');
  }

  function buildDirectionsUrl() {
    /* 네이버 지도 모바일 앱/웹 공통 길찾기 URL.
       slat/slng 없이 dlat/dlng/dname 만 주면 출발지를 사용자 현 위치로 잡음. */
    var params = new URLSearchParams({
      dlat: String(CLINIC.lat),
      dlng: String(CLINIC.lng),
      dname: CLINIC.name
    });
    return 'https://map.naver.com/p/directions/-/' +
           encodeURIComponent(CLINIC.lat + ',' + CLINIC.lng + ',' + CLINIC.name) +
           '/-/transit?' + params.toString();
  }

  function renderFallback(container, msg) {
    var url = 'https://map.naver.com/p/search/' + encodeURIComponent(CLINIC.address);
    container.innerHTML =
      '<div class="naver-map-fallback">' +
        '<div>' + (msg || '지도를 불러올 수 없습니다.') + '</div>' +
        '<a href="' + url + '" target="_blank" rel="noopener">네이버 지도에서 보기 →</a>' +
      '</div>';
  }

  function addDirectionsButton(container) {
    if (container.querySelector('.naver-map-directions')) return;
    var a = document.createElement('a');
    a.className = 'naver-map-directions';
    a.href = buildDirectionsUrl();
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>' +
        '<circle cx="12" cy="9" r="2.5"/>' +
      '</svg>' +
      '<span>길찾기</span>';
    container.appendChild(a);
  }

  function initMap() {
    var container = findContainer();
    if (!container) {
      log('container not found (.map_naver / #map_naver)');
      return;
    }
    if (!window.naver || !window.naver.maps) {
      log('naver.maps SDK not loaded');
      renderFallback(container, '지도 SDK 로드 실패');
      return;
    }

    var center = new naver.maps.LatLng(CLINIC.lat, CLINIC.lng);
    var map = new naver.maps.Map(container, {
      center: center,
      zoom: 16,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_LEFT,
        style: naver.maps.ZoomControlStyle.SMALL
      },
      mapTypeControl: false,
      scaleControl: false,
      logoControl: true,
      /* 패닝/줌 시 타일·라벨 등장 지연 최소화 */
      tileTransition: false,    /* 타일 페이드인 제거 → 즉시 표시 */
      tileSpare: 4,             /* 뷰포트 밖 타일을 더 많이 선로드 (default 1) */
      disableKineticPan: false
    });

    var marker = new naver.maps.Marker({
      position: center,
      map: map,
      title: CLINIC.name
    });

    /* InfoWindow 제거 — 병원명/주소는 페이지에 이미 텍스트로 노출되어 중복.
       마커 클릭 시 네이버 지도 검색으로 새 창 오픈 (모바일 대응 포함). */
    naver.maps.Event.addListener(marker, 'click', function () {
      var url = CLINIC.naverPlaceId
        ? 'https://map.naver.com/p/entry/place/' + CLINIC.naverPlaceId
        : 'https://map.naver.com/p/search/' + encodeURIComponent(CLINIC.address);
      window.open(url, '_blank', 'noopener');
    });

    addDirectionsButton(container);
    log('initialized at', CLINIC.lat, CLINIC.lng);
    /* 핀은 위 CLINIC.lat/lng 정확 좌표에 고정.
       (이전의 주소 재지오코딩 덮어쓰기는 핀을 라벨에서 밀어내 제거) */
  }

  /* SDK 가 늦게 도달할 수 있으므로 다중 시점 시도 */
  function waitForSdk(retries) {
    retries = retries == null ? 30 : retries;
    if (window.naver && window.naver.maps) { initMap(); return; }
    if (retries <= 0) {
      var c = findContainer();
      if (c) renderFallback(c, '지도 SDK 로드 시간 초과');
      log('SDK timeout');
      return;
    }
    setTimeout(function () { waitForSdk(retries - 1); }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { waitForSdk(); });
  } else {
    waitForSdk();
  }
})();

/* ================================================================
   의료진 분과 Webflow Tabs — focus-scroll 점프 차단
   ================================================================
   증상: 라이브에서 분과 탭(특히 기본 활성 탭 '내과')을 누르면 페이지가
   위로 튀어 탭 메뉴가 sticky 서브헤더 밑으로 숨고, 다른 과를 누르면
   다시 내려오는 것처럼 보임. 디자이너 프리뷰에는 없음.

   원인: Webflow 의 tabs 런타임은 탭 활성화 시 활성 패널(.w-tab-pane)에
   .focus() 를 건다. 이 페이지엔 sticky 서브헤더가 있어, 브라우저가 focus
   대상을 보이게 하려 자동 스크롤 → 점프 발생.

   해결: 탭 패널의 focus() 를 preventScroll 로 감싸 스크롤을 원천 차단하고,
   탭 클릭 전후 스크롤 위치를 몇 프레임 고정해 잔여 점프까지 막는다.
   (Designer 설정은 건드리지 않음 — 순수 런타임 가드)
   ================================================================ */
(function () {
  'use strict';

  function patchPaneFocus(pane) {
    if (pane.__helixFocusPatched) return;
    pane.__helixFocusPatched = true;
    var nativeFocus = HTMLElement.prototype.focus;
    pane.focus = function (opts) {
      var o = opts || {};
      o.preventScroll = true;
      return nativeFocus.call(this, o);
    };
  }

  /* 활성 탭 형광펜(.w--current ::before) 띠 폭을 텍스트에 정확히 맞추기 위해
     각 탭 링크의 텍스트 노드를 인라인 span.helix-tab-hl 으로 감싼다.
     (CSS 의 .helix-tab-hl::before 가 이 span 기준으로 그려짐) */
  function wrapTextNodes(node) {
    var kids = [].slice.call(node.childNodes);
    kids.forEach(function (c) {
      if (c.nodeType === 3 && c.nodeValue && c.nodeValue.trim()) {
        var span = document.createElement('span');
        span.className = 'helix-tab-hl';
        c.parentNode.replaceChild(span, c);
        span.appendChild(c);
      } else if (c.nodeType === 1 && !c.classList.contains('helix-tab-hl')) {
        wrapTextNodes(c);
      }
    });
  }

  function wrapTabLinkText(link) {
    if (link.__helixHlWrapped) return;
    link.__helixHlWrapped = true;
    wrapTextNodes(link);
  }

  /* 인접 분과 탭 사이에 세로 구분선(.helix-tab-sep) 삽입.
     flex 아이템으로 넣어 양쪽 간격이 동일 → 항상 가운데. */
  function insertSeparators(menu) {
    if (!menu || menu.__helixSepDone) return;
    menu.__helixSepDone = true;
    var links = [].slice.call(menu.querySelectorAll('.w-tab-link'));
    for (var i = 0; i < links.length - 1; i++) {
      var link = links[i];
      var sep = document.createElement('div');
      sep.className = 'helix-tab-sep';
      sep.setAttribute('aria-hidden', 'true');
      link.parentNode.insertBefore(sep, link.nextSibling);
    }
  }

  function pinScroll() {
    var x = window.scrollX, y = window.scrollY;
    var restore = function () { window.scrollTo(x, y); };
    requestAnimationFrame(restore);
    requestAnimationFrame(function () { requestAnimationFrame(restore); });
    setTimeout(restore, 0);
    setTimeout(restore, 60);
  }

  function setup() {
    var tabs = document.querySelectorAll('.w-tabs');
    if (!tabs.length) return false;
    tabs.forEach(function (wrap) {
      if (wrap.__helixTabsGuarded) return;
      wrap.__helixTabsGuarded = true;

      wrap.querySelectorAll('.w-tab-pane').forEach(patchPaneFocus);
      wrap.querySelectorAll('.w-tab-menu .w-tab-link').forEach(wrapTabLinkText);
      insertSeparators(wrap.querySelector('.w-tab-menu'));

      var menu = wrap.querySelector('.w-tab-menu') || wrap;
      menu.addEventListener('mousedown', pinScroll, true);
      menu.addEventListener('click', pinScroll, true);
      /* 키보드 화살표 이동도 동일 점프 발생 → keydown 가드 */
      menu.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowLeft' || k === 'ArrowRight' ||
            k === 'ArrowUp' || k === 'ArrowDown' ||
            k === 'Home' || k === 'End' || k === 'Enter' || k === ' ') {
          pinScroll();
        }
      }, true);
    });
    return true;
  }

  function init() {
    if (setup()) return;
    /* 탭/CMS 가 늦게 렌더될 수 있으므로 다중 시점 재시도 */
    var tries = 0;
    var t = setInterval(function () {
      if (setup() || ++tries >= 25) clearInterval(t);
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ================================================================
   HEADER 높이 → --header-h CSS 변수 동기화
   section.subheader top 을 실제 헤더 높이에 맞춰 빈틈 제거.
   (about.js 의 동일 로직 이식)
   ================================================================ */
(function () {
  'use strict';

  function sync() {
    var hEl = document.querySelector('header.header, header, .w-nav, nav');
    if (!hEl) return;
    var h = hEl.getBoundingClientRect().height;
    if (h > 0) {
      document.documentElement.style.setProperty('--header-h', h + 'px');
    }
  }

  var pollCount = 0;
  var pollTimer = setInterval(function () {
    sync();
    if (++pollCount >= 20) clearInterval(pollTimer);
  }, 200);

  window.addEventListener('resize', sync);
  window.addEventListener('load', sync);
  sync();
})();

/* ================================================================
   GA4 분석 — 서초본원 페이지 뷰 + 스크롤 깊이
   ================================================================
   home/global 의 gtag 패턴과 동일:
   - gtag 있으면 gtag('event', ...), 없으면 dataLayer.push 폴백
   - device(mobile/desktop) 구분, branch=서초 고정
   ① seocho_page_view  : 페이지 진입 시 1회
   ② seocho_scroll_depth: 25/50/75/100% 도달 시 각 1회
   디버그: URL 에 ?debug-ga=1
   ================================================================ */
(function () {
  'use strict';

  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() { if (DEBUG) console.log.apply(console, ['[seocho-ga]'].concat([].slice.call(arguments))); }

  function device() { return window.innerWidth <= 767 ? 'mobile' : 'desktop'; }

  function send(eventName, params) {
    try {
      var base = { item_type: params.item_type, branch: '서초', device: device() };
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
    send('seocho_page_view', { item_type: 'page_view', value: location.pathname });
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
          send('seocho_scroll_depth', {
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
    trackPageView();
    initScrollDepth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
