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
