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
    lat: 37.5089,
    lng: 127.0156,
    /* 네이버 지도 길찾기 URL 용 식별자. lat,lng 만으로도 동작. */
    naverPlaceQuery: '헬릭스 동물의료센터 서초본원'
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
      logoControl: true
    });

    var marker = new naver.maps.Marker({
      position: center,
      map: map,
      title: CLINIC.name
    });

    var infoHtml =
      '<div class="naver-iw">' +
        '<h4 class="naver-iw__title">' + CLINIC.name + '</h4>' +
        '<p class="naver-iw__addr">' + CLINIC.address + '</p>' +
      '</div>';

    var infowindow = new naver.maps.InfoWindow({
      content: infoHtml,
      borderColor: '#0075d6',
      borderWidth: 1,
      anchorSize: new naver.maps.Size(12, 12),
      pixelOffset: new naver.maps.Point(0, -6)
    });

    /* 초기 오픈 + 마커 클릭 시 토글 */
    infowindow.open(map, marker);
    naver.maps.Event.addListener(marker, 'click', function () {
      if (infowindow.getMap()) infowindow.close();
      else infowindow.open(map, marker);
    });

    addDirectionsButton(container);
    log('initialized at', CLINIC.lat, CLINIC.lng);
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
