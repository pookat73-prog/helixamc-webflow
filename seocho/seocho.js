/* ================================================================
   HELIX AMC - 서초본원 페이지: 네이버 지도 연동
   ================================================================
   - 컨테이너: .map_naver 또는 #map_naver (Webflow Designer)
   - 마커 + 정보창 + "네이버 지도에서 길찾기" 버튼
   - Naver Maps JS SDK 는 bootstrap 이 ncpClientId 와 함께 inject.
   ================================================================ */

/* ----- 어느 지점 페이지인가 (파일 전역) -----
   이 파일은 서초·일산 두 페이지가 함께 쓴다 (일산 페이지가 서초 복제본이라
   클래스·구조가 같다). 측정 이벤트 이름과 branch 값을 지점별로 갈라두지
   않으면 일산에서 누른 전화·길찾기가 전부 서초 실적에 합산된다.

   ⚠️ 이 파일은 IIFE 가 여러 개다. 판정값을 어느 한 IIFE 안에 var 로 두면
      다른 IIFE 에서 ReferenceError 가 나 그 블록의 측정이 통째로 죽는다
      (예전 헬릭스 라인의 navbar 스코프 사고와 같은 형태). 그래서 window 에
      얹어 공유한다.

   ⚠️ 값은 호출 시점에 계산한다. bootstrap 이 이 파일을 본문보다 먼저 실행할
      수 있어, 로드 시점에 data-map-name 을 찾으면 아직 없을 수 있다.
      실제 호출은 전부 클릭 핸들러 안이라 그때는 본문이 이미 있다. */
window.HelixBranch = window.HelixBranch || (function () {
  var cached = null;
  function key() {
    if (cached) return cached;
    var k = 'seocho';
    if (/(^|\/)ilsan(\/|$)/.test((location.pathname || '/').toLowerCase())) {
      k = 'ilsan';
    } else {
      var el = document.querySelector('[data-map-name]');
      if (el && /일산/.test(el.getAttribute('data-map-name') || '')) k = 'ilsan';
      else if (document.readyState === 'loading') return k;  /* 본문 전 — 캐시 보류 */
    }
    cached = k;
    return k;
  }
  return {
    key:  key,                                                    /* 이벤트 이름 앞머리 */
    name: function () { return key() === 'ilsan' ? '일산' : '서초'; }  /* branch 파라미터 */
  };
})();

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

  /* 데스크탑/모바일 섹션이 각각 동일 ID/클래스 (map_naver) 를 갖는 경우가 있음.
     초기 가시성 판단은 Webflow 반응형 CSS 적용 타이밍에 따라 잘못된 후보를
     집어 한쪽 섹션에만 마운트되고 다른 쪽은 빈 검정으로 남는 회귀가 있었음.
     → 가시성 판단 없이 모든 후보에 마운트. ResizeObserver 가 0→실제 사이즈
     전환 시점에 naver resize 를 트리거하므로 어느 쪽이 보이든 타일이 그려짐. */
  function findContainers() {
    var nodes = document.querySelectorAll('#map_naver, .map_naver');
    return [].slice.call(nodes);
  }
  function findContainer() {
    var list = findContainers();
    return list[0] || null;
  }

  function buildDirectionsUrl() {
    /* 사용자 요청: "길찾기" 버튼이 실제 길찾기 화면이 아니라
       네이버 지도의 서초 본원 플레이스(업체) 페이지로 가야 함.
       플레이스 페이지 안에 영업정보·리뷰·길찾기 버튼이 다 들어 있어
       사용자가 원하는 정보를 원스톱으로 봄. */
    return CLINIC.naverPlaceId
      ? 'https://map.naver.com/p/entry/place/' + CLINIC.naverPlaceId
      : 'https://map.naver.com/p/search/' + encodeURIComponent(CLINIC.address);
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

    /* GA4 — 길찾기(네이버 플레이스) 클릭. target=_blank 라 페이지는 유지되지만
       안전하게 beacon 전송. 지도 마커 클릭이 아니라 명시적 "길찾기" 버튼만 집계. */
    a.addEventListener('click', function () {
      var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
      var payload = {
        item_type: 'directions',
        branch: window.HelixBranch.name(),
        device: device,
        value: a.href,
        transport_type: 'beacon'
      };
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', window.HelixBranch.key() + '_directions_' + device, payload);
        } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
          payload.event = window.HelixBranch.key() + '_directions_' + device;
          window.dataLayer.push(payload);
        }
      } catch (e) {}
      log('directions click', device);
    });

    container.appendChild(a);
  }

  function initMap() {
    var containers = findContainers();
    if (!containers.length) {
      log('container not found (.map_naver / #map_naver)');
      return;
    }
    if (!window.naver || !window.naver.maps) {
      log('naver.maps SDK not loaded');
      containers.forEach(function (c) { renderFallback(c, '지도 SDK 로드 실패'); });
      return;
    }
    containers.forEach(mountMap);
  }

  function mountMap(container) {
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

    /* 컨테이너가 처음에 0×0 이거나 미디어쿼리로 늦게 보이는 경우, naver
       지도는 자동으로 재측정하지 않아 타일이 영영 안 그려짐 (검정 박스).
       ResizeObserver 로 사이즈 변화 시점에 강제 resize 트리거. */
    if (typeof ResizeObserver !== 'undefined') {
      var lastW = container.offsetWidth;
      var lastH = container.offsetHeight;
      var ro = new ResizeObserver(function () {
        var w = container.offsetWidth, h = container.offsetHeight;
        if (w !== lastW || h !== lastH) {
          lastW = w; lastH = h;
          if (w > 0 && h > 0) {
            naver.maps.Event.trigger(map, 'resize');
            map.setCenter(center);
            log('resize triggered', w + 'x' + h);
          }
        }
      });
      ro.observe(container);
    }
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

      /* GA4 — 의료진 분과 탭 클릭. 원본 .w-tab-link 에만 부착.
         (스크롤 시 뜨는 미니 탭 메뉴/모바일 드롭다운은 결국 orig.click() 을
         호출해 이 핸들러를 재발화 → 한 번만 집계, 중복 없음.) preventDefault
         하지 않아 Webflow 탭 전환은 그대로 동작. */
      wrap.querySelectorAll('.w-tab-menu .w-tab-link').forEach(function (tabLink) {
        if (tabLink.__helixTabTracked) return;
        tabLink.__helixTabTracked = true;
        tabLink.addEventListener('click', function () {
          var dept = (tabLink.textContent || '').replace(/\s+/g, ' ').trim();
          var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
          var payload = {
            item_type: 'doctor_dept_tab',
            branch: window.HelixBranch.name(),
            device: device,
            dept: dept || 'unknown'
          };
          try {
            if (typeof window.gtag === 'function') {
              window.gtag('event', window.HelixBranch.key() + '_dept_tab_' + device, payload);
            } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
              payload.event = window.HelixBranch.key() + '_dept_tab_' + device;
              window.dataLayer.push(payload);
            }
          } catch (e) {}
        });
      });

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
   SUBHEADER — 호버 / 스크롤스파이 / 클릭 시 메인 블루 밑줄
   ================================================================
   about.js 의 동일 패턴 이식. 서브헤더 각 탭에:
   - 스크롤 위치에 따라 해당 섹션의 탭에 .is-active 부착 (파란 밑줄)
   - 클릭 시 그 섹션으로 부드럽게 스크롤 (헤더 + 서브헤더 높이 보정)
   ================================================================ */
(function () {
  'use strict';

  /* 서브헤더는 듀얼 마크업 — 데스크탑용과 모바일용이 둘 다 DOM 에 있고
     미디어쿼리로 한쪽만 보인다. 숨은 쪽은 높이 0 이므로 한쪽만 재면
     폰에서 0 이 나오고, 착지 지점이 모바일 서브헤더 뒤로 들어가 제목이
     가려진다. 클래스명 변경에 견디도록 .subheader_click-area 의 조상
     section 으로 찾아 그중 가장 높은(=보이는) 것을 채택. */
  /* 진단 모드 — URL 에 ?debug-sub=1 을 붙이면 앵커를 누를 때마다
     "무엇이 화면 위를 덮고 있는지 / 목표 섹션이 어디 있는지 / 보정이 얼마나
     일어났는지" 를 콘솔에 찍는다. 착지가 안 맞을 때 추측 없이 원인을 특정하는 용도. */
  var DBG = /[?&]debug-sub=1/.test(location.search);
  function dlog() {
    if (!DBG) return;
    var a = ['[sub]'];
    for (var i = 0; i < arguments.length; i++) a.push(arguments[i]);
    try { console.log.apply(console, a); } catch (e) {}
  }
  function elName(el) {
    if (!el) return '(null)';
    var c = (el.className && el.className.toString ? el.className.toString() : '') || '';
    return (el.tagName || '?').toLowerCase() + (c ? '.' + c.trim().split(/\s+/).join('.') : '');
  }

  /* 헤더도 서브헤더와 같은 듀얼 마크업 — 데스크탑용(header.header)과
     모바일용(header.header_mobile)이 둘 다 DOM 에 있고 한쪽만 보인다.
     querySelector 는 셀렉터 순서가 아니라 문서 순서상 첫 번째(=데스크탑)를
     집어오므로 폰에서 높이가 0 이 되어, 착지 지점이 헤더 높이만큼 위로 떠
     제목이 가린다. 아래 sync() 와 동일하게 "화면 맨 위에 붙어 있는 것 중
     가장 높은 것"을 채택. */
  function headerH() {
    var cands = document.querySelectorAll(
      'header.header, header.header_mobile, header, .w-nav, nav[role="banner"]'
    );
    var max = 0;
    for (var i = 0; i < cands.length; i++) {
      var r = cands[i].getBoundingClientRect();
      if (r.top <= 1 && r.height > max) max = r.height;
    }
    return max;
  }

  function subheaderH() {
    var links = document.querySelectorAll('.subheader_click-area');
    var seen = [];
    var max = 0;
    for (var i = 0; i < links.length; i++) {
      var sec = links[i].closest('section');
      if (!sec || seen.indexOf(sec) !== -1) continue;
      seen.push(sec);
      var h = sec.getBoundingClientRect().height;
      if (h > max) max = h;
    }
    return max;
  }

  /* 화면 위쪽에 "실제로 붙어 있는" 고정/스티키 바들의 아래 끝(px).
     헤더 → 서브헤더 → 필터처럼 세로로 이어 붙은 것들을 위에서부터 연결해
     가며 가장 아래 끝을 구한다. 전체화면 오버레이(메뉴/모달), 화면 밖으로
     나간 것, 위쪽 바가 아닌 것은 제외.
     요소 이름을 하나도 몰라도 되는 게 핵심 — 마크업이 바뀌어도 따라간다. */
  function topBarsBottom(exclude) {
    var vh = window.innerHeight || 0;
    var all = document.body.getElementsByTagName('*');
    var bars = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (exclude && (el === exclude || exclude.contains(el) || el.contains(exclude))) continue;
      var cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom <= 0) continue;            /* 화면 위로 나감 */
      if (r.height > vh * 0.5) continue;      /* 전체화면 오버레이 */
      if (r.top > vh * 0.4) continue;         /* 위쪽 바가 아님 */
      bars.push({ el: el, r: r });
    }
    bars.sort(function (a, b) { return a.r.top - b.r.top; });
    var max = 0;
    for (var j = 0; j < bars.length; j++) {
      var b = bars[j].r;
      var used = b.top <= max + 4 && b.bottom > max;
      if (used) max = b.bottom;
      dlog('  바', used ? 'O' : 'x', elName(bars[j].el),
        'top', Math.round(b.top), 'h', Math.round(b.height), 'bottom', Math.round(b.bottom));
    }
    dlog('  → 덮는 높이', Math.round(max));
    return max;
  }

  /* 스무스 스크롤이 끝난 뒤 목표 섹션 top 이 위 고정 바들 아래에 있는지
     확인하고, 모자라면 그만큼만 더 내린다. 스티키 바는 클릭 시점엔 아직
     안 붙어 있어 미리 정확히 잴 수 없다 — 도착 후에 재야 실제 값이 나온다. */
  /* 스크롤이 "실제로 멈출 때까지" 기다렸다가 콜백.
     고정 시간(setTimeout)에 기대면 이동 거리가 길 때 아직 스무스 스크롤
     중이라, 보정해도 진행 중이던 애니메이션이 곧바로 덮어써 무효가 된다.
     scrollend 이벤트는 브라우저별 지원이 갈려(iOS Safari 17 미만 없음)
     신뢰할 수 없다. 그래서 스크롤 위치가 멎었는지를 직접 확인한다. */
  function whenScrollSettles(cb) {
    var last = -1, same = 0, ticks = 0;
    var iv = setInterval(function () {
      var y = window.pageYOffset;
      if (y === last) same++; else same = 0;
      last = y;
      if (same >= 3 || ++ticks > 60) {   /* 약 150ms 정지, 3초 상한 */
        clearInterval(iv);
        cb();
      }
    }, 50);
  }

  function settleAfterScroll(target) {
    var rounds = 0;
    var cancelled = false;
    function onUser() { cancelled = true; }
    window.addEventListener('wheel', onUser, { passive: true });
    window.addEventListener('touchmove', onUser, { passive: true });

    function done() {
      window.removeEventListener('wheel', onUser);
      window.removeEventListener('touchmove', onUser);
    }

    function round() {
      whenScrollSettles(function () {
        if (cancelled) { dlog('보정 취소 — 사용자가 스크롤함'); return done(); }
        dlog('스크롤 멈춤. 보정 라운드', rounds + 1, '| 섹션 top',
          Math.round(target.getBoundingClientRect().top));
        /* gap > 0 = 섹션 top 이 고정 바 아래 끝보다 위에 있다 = 가려져 있다.
           드러내려면 섹션을 화면 아래로 내려야 하고, 그건 스크롤을 그만큼
           "위로" 올리는 것이다. (+gap 으로 내리면 더 잘린다) */
        var gap = (topBarsBottom(target) + 8) - target.getBoundingClientRect().top;
        if (gap > 1 && ++rounds <= 3) {
          dlog('  가려짐 → 위로', Math.round(gap), 'px 보정');
          window.scrollTo({ top: window.pageYOffset - gap, behavior: 'auto' });
          round();
        } else {
          dlog('보정 종료. gap', Math.round(gap), '| 최종 섹션 top',
            Math.round(target.getBoundingClientRect().top));
          done();
        }
      });
    }
    round();
  }

  function init() {
    var links = document.querySelectorAll('.subheader_click-area');
    if (!links.length) return false;

    /* 타깃 결정: href ID 우선, 없으면 .subheader_title 텍스트와 매칭되는
       visible 헤딩의 가장 가까운 section. about.js 와 동일 알고리즘. */
    function findVisibleTarget(href, linkEl) {
      if (href && href.charAt(0) === '#' && href.length >= 2) {
        var id = href.slice(1);
        var all = document.querySelectorAll('[id="' + id.replace(/"/g, '\\"') + '"]');
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          if (el.offsetParent !== null || el.getClientRects().length > 0) return el;
        }
      }
      if (linkEl) {
        var titleEl = linkEl.querySelector('.subheader_title') || linkEl;
        var title = (titleEl.textContent || '').replace(/\s+/g, ' ').trim();
        if (title.length >= 2) {
          var headings = document.querySelectorAll('h1, h2, h3, h4');
          for (var j = 0; j < headings.length; j++) {
            var h = headings[j];
            if (h.offsetParent === null && h.getClientRects().length === 0) continue;
            var ht = (h.textContent || '').replace(/\s+/g, ' ').trim();
            if (!ht) continue;
            if (ht === title || ht.indexOf(title) !== -1 || title.indexOf(ht) !== -1) {
              return h.closest('section') || h.closest('[class*="section"]') || h;
            }
          }
        }
      }
      return null;
    }

    var entries = [];
    links.forEach(function (a) {
      var target = findVisibleTarget(a.getAttribute('href') || '', a);
      if (target) entries.push({ link: a, target: target });
    });
    if (!entries.length) return false;

    function setActive(link) {
      links.forEach(function (l) { l.classList.remove('is-active', 'w--current'); });
      if (link) link.classList.add('is-active');
    }

    var clickedAt = 0;
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;
        var t = findVisibleTarget(href, a);
        if (!t) return;
        e.preventDefault();
        setActive(a);
        clickedAt = Date.now();

        /* GA4 — 서브헤더 메뉴 클릭 (섹션 이동). 같은 페이지 내 스크롤이라
           페이지 언로드 없음 → 일반 gtag 로 충분. */
        (function () {
          var titleEl = a.querySelector('.subheader_title') || a;
          var menu = (titleEl.textContent || '').replace(/\s+/g, ' ').trim();
          var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
          var payload = {
            item_type: 'subheader_nav',
            branch: window.HelixBranch.name(),
            device: device,
            menu: menu || 'unknown',
            value: href
          };
          try {
            if (typeof window.gtag === 'function') {
              window.gtag('event', window.HelixBranch.key() + '_subheader_nav_' + device, payload);
            } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
              payload.event = window.HelixBranch.key() + '_subheader_nav_' + device;
              window.dataLayer.push(payload);
            }
          } catch (e) {}
        })();

        /* 마지막 섹션(공간 갤러리 #photo) 은 제목 맞춤 대상에서 제외 —
           페이지 끝이라 어차피 더 내려갈 여지가 없다. 나머지 섹션은 헤더 +
           서브헤더 아래에 섹션 top 이 오게 해서 제목/첫 블록부터 보이게 함. */
        var subH = href === '#photo' ? 0 : subheaderH();
        dlog('서브헤더 핸들러 실행:', href, '| 헤더', Math.round(headerH()),
          '| 서브헤더', Math.round(subH), '| 목표', elName(t));
        var y = t.getBoundingClientRect().top + window.pageYOffset - (headerH() + subH + 12);
        window.scrollTo({ top: y, behavior: 'smooth' });
        /* 위 값은 어림치. 실제 보정은 아래 전역 위임 핸들러가 도착 후 처리 */
        if (history.replaceState) history.replaceState(null, '', href);
      });
    });

    /* 스크롤스파이 — spy line(헤더+서브헤더+16px)을 품는 섹션을 활성화.
       품는 섹션 없으면 line 까지 가장 가까운 섹션. */
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (Date.now() - clickedAt < 700) return;
        var subH = subheaderH();
        var line = headerH() + subH + 16;
        var straddle = null;
        var closest = null;
        var closestDist = Infinity;
        for (var i = 0; i < entries.length; i++) {
          var rect = entries[i].target.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          if (rect.top <= line && rect.bottom > line) straddle = entries[i].link;
          var dist;
          if (rect.bottom < line) dist = line - rect.bottom;
          else if (rect.top > line) dist = rect.top - line;
          else dist = 0;
          if (dist < closestDist) { closestDist = dist; closest = entries[i].link; }
        }
        var current = straddle || closest;
        if (!current && window.pageYOffset < 50) current = entries[0].link;
        if (current && !current.classList.contains('is-active')) setActive(current);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* 폰트 크기 통일 — "인터벤션 센터" 처럼 일부 탭만 더 작게 박힌 케이스.
       CSS inherit 가 Webflow 의 강한 선언을 못 이기는 환경 대응: 런타임에서
       모든 .subheader_title 의 computed font-size 중 최대값을 모든 탭에
       인라인으로 강제. (resize 시 vw 단위로 재계산되도록 다시 적용) */
    function normalizeFonts() {
      /* "인터벤션 센터" 탭은 .subheader_click-area 클래스가 없어 links 에
         안 잡힘. → section.subheader 안 모든 텍스트 요소를 통째로 스캔.
         leaf 텍스트 요소(자식 텍스트 노드를 직접 가진 요소)의 max
         computed font-size 측정 → 같은 영역의 모든 요소에 인라인 강제. */
      var subRoot = document.querySelector('section.subheader');
      if (!subRoot) return;

      function leafTextEls(root) {
        var out = [];
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
        var n = walker.currentNode;
        while (n) {
          var hasText = false;
          for (var i = 0; i < n.childNodes.length; i++) {
            var c = n.childNodes[i];
            if (c.nodeType === 3 && c.nodeValue && c.nodeValue.trim()) { hasText = true; break; }
          }
          if (hasText) out.push(n);
          n = walker.nextNode();
        }
        return out;
      }

      var allEls = [].slice.call(subRoot.querySelectorAll('*'));
      /* 1) 이전 인라인 제거 후 재측정 (resize/vw 대응) */
      allEls.forEach(function (el) { el.style.fontSize = ''; });

      /* 2) 진짜 텍스트 leaf 의 최대 폰트 크기 */
      var maxPx = 0;
      leafTextEls(subRoot).forEach(function (el) {
        var px = parseFloat(getComputedStyle(el).fontSize) || 0;
        if (px > maxPx) maxPx = px;
      });

      /* 3) 서브헤더 안 모든 요소에 인라인 !important 강제 */
      if (maxPx > 0) {
        allEls.forEach(function (el) {
          el.style.setProperty('font-size', maxPx + 'px', 'important');
        });
      }
    }
    normalizeFonts();
    /* 폰트 로드/리사이즈 대응 */
    window.addEventListener('resize', function () {
      /* rAF 로 컴포지트 후 측정 */
      requestAnimationFrame(normalizeFonts);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(normalizeFonts).catch(function () {});
    }
    return true;
  }

  function start() {
    if (init()) return;
    /* CMS/IX2 가 늦게 DOM 을 채우는 케이스 대비 재시도 */
    var tries = 0;
    var t = setInterval(function () {
      if (init() || ++tries >= 25) clearInterval(t);
    }, 200);
  }

  /* 페이지 내 앵커 이동은 서브헤더 말고 다른 경로로도 일어난다 (모바일 헤더
     메뉴 등). 그런 경로는 위 핸들러가 안 걸려 보정 없이 착지해 제목이 헤더에
     가린다. 그래서 클릭 주체와 무관하게 "도착 후 보정"만 덧붙인다.
     스크롤 자체는 원래 하던 쪽에 맡기고 preventDefault 하지 않는다.
     캡처 단계라 다른 핸들러가 전파를 막아도 실행된다. */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '#' || href.length < 2) return;
    dlog('앵커 클릭:', href, '| 누른 것', elName(a), '| 화면폭', window.innerWidth);
    if (href === '#photo') { dlog('  #photo 는 제외 대상'); return; }
    var id = href.slice(1);
    var list = document.querySelectorAll('[id="' + id.replace(/"/g, '\\"') + '"]');
    dlog('  같은 id 요소', list.length, '개');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.offsetParent !== null || el.getClientRects().length > 0) {
        dlog('  보이는 목표:', elName(el));
        settleAfterScroll(el);
        return;
      }
    }
    dlog('  보이는 목표 없음 — 보정 안 함');
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', start);
})();

/* ================================================================
   HEADER / SUBHEADER 높이 → --header-h / --subheader-h CSS 변수 동기화
   section.subheader top 을 실제 헤더 높이에 맞춰 빈틈 제거.
   미니 분과 헤더 (아래 LOCKED) 의 top 위치 계산에도 사용됨.
   ================================================================ */
(function () {
  'use strict';

  function sync() {
    /* 데스크탑 헤더 (header.header) 와 모바일 헤더 (header.header_mobile)
       가 둘 다 DOM 에 있고 미디어쿼리로 한쪽만 보임. 보이지 않는 쪽은 높이
       0 으로 잡히므로, 모든 후보 중 높이가 가장 큰(=현재 보이는) 것을 채택. */
    var candidates = document.querySelectorAll(
      'header.header, header.header_mobile, header, .w-nav, nav[role="banner"]'
    );
    var maxH = 0;
    for (var i = 0; i < candidates.length; i++) {
      var rect = candidates[i].getBoundingClientRect();
      if (rect.top <= 1 && rect.height > maxH) maxH = rect.height;
    }
    if (maxH > 0) document.documentElement.style.setProperty('--header-h', maxH + 'px');
    /* 서브헤더도 헤더와 같은 듀얼 마크업 — 데스크탑용은 폰에서, 모바일용은
       그 위 화면에서 숨는다. 한쪽만 재면 폰에서 0 이 잡혀 분과 드롭다운이
       서브헤더 뒤에 겹쳐 뜬다. 클래스명 변경에 견디도록 .subheader_click-area
       의 조상 section 으로 찾아 가장 높은(=보이는) 것을 채택. */
    var subLinks = document.querySelectorAll('.subheader_click-area');
    var seenSub = [];
    var maxSh = 0;
    for (var s = 0; s < subLinks.length; s++) {
      var sec = subLinks[s].closest('section');
      if (!sec || seenSub.indexOf(sec) !== -1) continue;
      seenSub.push(sec);
      var sh = sec.getBoundingClientRect().height;
      if (sh > maxSh) maxSh = sh;
    }
    if (maxSh > 0) document.documentElement.style.setProperty('--subheader-h', maxSh + 'px');
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
   의료진 분과 미니 헤더 — 스크롤 시 서브헤더 밑에서 슬라이드 다운
   ================================================================
   원본 .w-tab-menu 가 viewport 위로 벗어나면, body 직속에 박은
   클론(.helix-mini-tabmenu) 이 서브헤더 바로 밑에서 슬라이드 다운으로
   등장. 모양은 위 가장자리 평평·아래 좌우 모서리만 둥근 인덱스 탭.

   - 미니 탭 클릭 → 원본 탭 click() 으로 위임 (Webflow Tabs 가 처리)
   - 원본 .w--current 클래스 변화 → MutationObserver 로 미니에 동기화
   - 데스크탑 ~ 가로 모바일 (≥480px) 에서만 동작. 세로 모바일은 미적용.
   ================================================================ */
(function () {
  'use strict';

  var MQ_DESKTOP = '(min-width: 480px)';
  var mini = null;
  var miniLinks = [];
  var origLinks = [];
  var origMenu = null;
  var origMo = null;
  var visible = false;
  var rafPending = false;
  var nextSectionEl = null;
  var mode = null; /* 'desktop' | 'mobile' — 현재 빌드된 미니 헤더 형태 */
  var miniPanel = null; /* 모바일 드롭다운 패널 */
  var miniLabel = null; /* 모바일 버튼의 활성 분과명 텍스트 노드 */

  function viewportMode() {
    return window.matchMedia(MQ_DESKTOP).matches ? 'desktop' : 'mobile';
  }
  function isEligible() { return true; /* 모바일도 이제 지원 (드롭다운 형태) */ }

  /* 원본 .w-tab-menu 다음에 오는 서브헤더 앵커의 타깃 섹션을 찾음.
     서브헤더 anchor link 들의 href=#id 를 순회: origMenu 가 속한 섹션 다음
     순서의 anchor 가 가리키는 요소가 곧 "다음 섹션". 못 찾으면 null. */
  function detectNextSection() {
    if (!origMenu) return null;
    var anchors = [].slice.call(document.querySelectorAll('.subheader_click-area[href^="#"]'));
    if (!anchors.length) return null;
    var targets = anchors.map(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return null;
      var list = document.querySelectorAll('[id="' + id.replace(/"/g, '\\"') + '"]');
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.offsetParent !== null || el.getClientRects().length > 0) return el;
      }
      /* 보이는 것이 없으면 후보에서 제외. 숨겨진 요소(display:none)는 좌표가
         전부 0 이라, 이걸 "다음 섹션"으로 잡으면 아래 beforeNext 판정이
         (0 > line) 로 항상 거짓이 되어 미니 분과 헤더가 영영 안 뜬다.
         듀얼 마크업이라 #vets 는 폰에서, #vets_M 은 데스크탑에서 숨는다. */
      return null;
    });
    /* origMenu 의 absolute top 기준, 그보다 더 아래에 있는 첫 타깃 = 다음 섹션 */
    var menuTop = origMenu.getBoundingClientRect().top + window.pageYOffset;
    var best = null;
    var bestTop = Infinity;
    targets.forEach(function (t) {
      if (!t) return;
      var top = t.getBoundingClientRect().top + window.pageYOffset;
      if (top > menuTop + 4 && top < bestTop) { best = t; bestTop = top; }
    });
    return best;
  }

  function buildMini() {
    if (mini || !origMenu) return;
    origLinks = [].slice.call(origMenu.querySelectorAll('.w-tab-link'));
    mode = viewportMode();
    if (mode === 'desktop') buildDesktopMini();
    else buildMobileMini();

    /* 원본 활성 탭 변화 → 미니에 동기화 */
    origMo = new MutationObserver(syncActive);
    origLinks.forEach(function (l) {
      origMo.observe(l, { attributes: true, attributeFilter: ['class', 'aria-selected'] });
    });
    syncActive();
  }

  function buildDesktopMini() {
    var clone = origMenu.cloneNode(true);
    clone.className = (clone.className || '') + ' helix-mini-tabmenu';
    clone.setAttribute('role', 'tablist');
    clone.setAttribute('aria-label', '의료진 분과 (미니)');
    clone.removeAttribute('data-w-id');
    clone.querySelectorAll('[data-w-tab]').forEach(function (el) {
      el.removeAttribute('data-w-id');
      el.id = '';
      el.removeAttribute('aria-controls');
      el.setAttribute('tabindex', '-1');
    });
    document.body.appendChild(clone);
    mini = clone;
    miniLinks = [].slice.call(clone.querySelectorAll('.w-tab-link'));

    miniLinks.forEach(function (mLink, i) {
      mLink.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var orig = origLinks[i];
        if (orig) orig.click();
      });
    });
  }

  function buildMobileMini() {
    /* 모바일: 작은 fixed 버튼 + 누르면 펼쳐지는 드롭다운 패널.
       버튼은 현재 활성 분과명 + ▼ 표시. */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'helix-mini-tabselect';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    var labelSpan = document.createElement('span');
    labelSpan.className = 'helix-mini-tabselect_label';
    labelSpan.textContent = '분과 선택';
    var caret = document.createElement('span');
    caret.className = 'helix-mini-tabselect_caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '▾';
    btn.appendChild(labelSpan);
    btn.appendChild(caret);

    var panel = document.createElement('div');
    panel.className = 'helix-mini-tabpanel';
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', '의료진 분과');

    miniLinks = [];
    origLinks.forEach(function (orig, i) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'helix-mini-tabpanel_item';
      item.setAttribute('role', 'option');
      item.textContent = (orig.textContent || '').trim();
      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        orig.click();
        closePanel();
      });
      panel.appendChild(item);
      miniLinks.push(item);
    });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = btn.classList.toggle('is-open');
      panel.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* 외부 탭 시 닫힘, 스크롤/리사이즈에도 닫힘 */
    document.addEventListener('click', function (e) {
      if (!btn.classList.contains('is-open')) return;
      if (btn.contains(e.target) || panel.contains(e.target)) return;
      closePanel();
    }, true);
    window.addEventListener('scroll', closePanel, { passive: true });

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    mini = btn;
    miniPanel = panel;
    miniLabel = labelSpan;
  }

  function closePanel() {
    if (!mini || mode !== 'mobile') return;
    mini.classList.remove('is-open');
    if (miniPanel) miniPanel.classList.remove('is-open');
    mini.setAttribute('aria-expanded', 'false');
  }

  function syncActive() {
    if (!origLinks.length) return;
    var activeIdx = -1;
    origLinks.forEach(function (o, i) {
      if (o.classList.contains('w--current')) activeIdx = i;
    });
    if (mode === 'desktop') {
      if (!miniLinks.length) return;
      origLinks.forEach(function (o, i) {
        var m = miniLinks[i];
        if (!m) return;
        var on = i === activeIdx;
        m.classList.toggle('w--current', on);
        m.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    } else if (mode === 'mobile') {
      if (miniLabel && activeIdx >= 0) {
        var t = (origLinks[activeIdx].textContent || '').trim();
        if (t) miniLabel.textContent = t;
      }
      miniLinks.forEach(function (item, i) {
        var on = i === activeIdx;
        item.classList.toggle('is-active', on);
        item.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
  }

  function destroyMini() {
    if (origMo) { origMo.disconnect(); origMo = null; }
    if (mini && mini.parentNode) mini.parentNode.removeChild(mini);
    if (miniPanel && miniPanel.parentNode) miniPanel.parentNode.removeChild(miniPanel);
    mini = null;
    miniPanel = null;
    miniLabel = null;
    miniLinks = [];
    origLinks = [];
    visible = false;
    mode = null;
  }

  function setVisible(on) {
    if (!mini || visible === on) return;
    visible = on;
    mini.classList.toggle('is-visible', on);
    if (miniPanel) {
      miniPanel.classList.toggle('is-visible', on);
      if (!on) closePanel();
    }
  }

  function findVisibleOrigMenu() {
    var nodes = document.querySelectorAll('.w-tabs .w-tab-menu');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.offsetParent !== null || el.getClientRects().length > 0) return el;
    }
    return nodes.length ? nodes[0] : null;
  }

  function check() {
    rafPending = false;
    /* 데스크탑/모바일 듀얼 마크업: viewport 바뀌면 보이는 쪽이 달라짐 →
       매 check 마다 visible 한 w-tab-menu 재확인. 다른 것으로 바뀌면 미니 재빌드. */
    var current = findVisibleOrigMenu();
    if (current && current !== origMenu) {
      if (mini) destroyMini();
      origMenu = current;
      nextSectionEl = detectNextSection() || nextSectionEl;
    }
    if (!origMenu) return;
    /* viewport 모드가 바뀌면 미니 재빌드 */
    if (mini && mode !== viewportMode()) destroyMini();
    if (!mini) buildMini();
    var rect = origMenu.getBoundingClientRect();
    /* 숨겨진 듀얼 마크업 (display:none 등) → rect 0,0 으로 false-positive
       방지. 보이지 않으면 미니 숨김. */
    if (rect.width === 0 && rect.height === 0) { setVisible(false); return; }
    var headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56;
    var subH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--subheader-h')) || 0;
    var line = headerH + subH;

    /* 의료진 안내 섹션 안에 있을 때만 미니 표시. 경계 판단:
       - 원본 탭이 line 위로 사라졌고 (rect.bottom < line) AND
       - "다음 섹션의 top" 이 아직 line 아래일 때.
       다음 섹션 = 서브헤더 앵커들 중 원본 탭 다음 순서의 앵커가 가리키는 섹션.
       (closest('section') 은 탭 래퍼 자체에 잡혀 너무 일찍 사라지는 케이스
        대응.) 다음 앵커 못 찾으면 끝까지 표시. */
    var beforeNext = true;
    if (nextSectionEl) {
      var nRect = nextSectionEl.getBoundingClientRect();
      beforeNext = nRect.top > line;
    }
    setVisible(rect.bottom < line && beforeNext);
  }

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(check);
  }

  function onResize() {
    if (mini && mode !== viewportMode()) destroyMini();
    /* nextSection 도 재측정 (DOM 위치 변경 가능) */
    nextSectionEl = detectNextSection() || nextSectionEl;
    onScroll();
  }

  function init() {
    origMenu = findVisibleOrigMenu();
    if (!origMenu) return false;
    nextSectionEl = detectNextSection();
    /* 서브헤더/CMS 가 늦게 채워질 수 있어 한 번 더 재시도 */
    if (!nextSectionEl) setTimeout(function () { nextSectionEl = detectNextSection(); }, 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', function () { nextSectionEl = detectNextSection() || nextSectionEl; });
    onScroll();
    return true;
  }

  function start() {
    if (init()) return;
    var tries = 0;
    var t = setInterval(function () {
      if (init() || ++tries >= 25) clearInterval(t);
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* ================================================================
   GA4 분석 — 서초본원 페이지 뷰 + 스크롤 깊이  ← 제거됨 (중복 집계 원인)
   ================================================================
   여기 있던 seocho_page_view / seocho_scroll_depth 자체 측정 블록은
   global/scroll-depth.js 가 보내는 것과 이벤트 이름이 완전히 같은데,
   서로의 중복 방지 장치(__helixScrollDepthInit)를 공유하지 않아 서초
   페이지에서만 두 번씩 발사됐다. → 서초 방문수·스크롤 도달이 실제의
   2배로 집계됨.

   공용 모듈(global/scroll-depth.js)이 .map_naver 마커로 이 페이지를
   'seocho' 로 정확히 판정해 동일한 이벤트를 이미 보내므로, 중복인
   이 블록을 제거한다. 여기에 측정을 다시 넣지 말 것.
   ================================================================ */

/* ================================================================
   예약 안내 전화번호 — 클릭 → 확인창 → 복사 + tel: 연결 + GA4
   ================================================================
   대상: section#phone 안의 모든 전화번호 그룹
     · .branch_phoneno      (예: "02.2135.9")
     · .branch_phoneno_119  (예: "119")
   두 헤딩을 같은 부모 (.div-block-206) 에서 합쳐 0221359119 로 정규화.
   클릭 가능 영역: 그 부모 컨테이너 (헤딩 두 개 모두 포함).

   동작 흐름:
     1. 사용자 클릭 → confirm("전화로 연결하시겠습니까? 번호도 자동 복사됩니다.")
     2. 확인 시:
        a) 번호를 클립보드에 복사 (실패해도 다음 단계 진행)
        b) GA4 event 전송 — gtag event_callback 안에서 tel: 이동 (beacon 보장)
        c) 1000ms 안전 타임아웃 — gtag 실패해도 전화는 무조건 연결
     3. 취소 시: 아무것도 안 함

   GA4 이벤트 두 개 — 눌렀다 / 확인까지 했다 를 나눠 본다
     seocho_phone_intent  번호를 누른 순간 (확인창 뜨기 전, 취소해도 남음)
       params: { item_type: 'phone_intent', ... }
     seocho_phone_call    확인창에서 '확인' 을 누른 뒤 (실제 연결)
       params: { item_type: 'phone_call', branch: '서초'|'일산',
                 device: 'mobile'|'desktop', value: '0221359119' }
     두 값의 차이 = 확인창에서 되돌아간 사람. 데스크탑은 실제 통화로
     이어지지 않으니 '전화 의향' 은 intent 쪽으로 읽는다.
   ================================================================ */
(function () {
  'use strict';

  var DEBUG = /[?&]debug-phone=1/.test(location.search);
  function log() { if (DEBUG) console.log.apply(console, ['[seocho-phone]'].concat([].slice.call(arguments))); }

  function device() { return window.innerWidth <= 767 ? 'mobile' : 'desktop'; }

  function digitsOnly(s) { return (s || '').replace(/\D+/g, ''); }

  function formatDisplay(d) {
    /* 0221359119 → 02-2135-9119 (서울 지역번호 02 기준) */
    if (d.length === 10 && d.indexOf('02') === 0) {
      return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6);
    }
    if (d.length === 11) {
      return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    }
    return d;
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
      }
    } catch (e) {}
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) { return false; }
  }

  /* 번호를 누른 것 자체 — 확인창 결과와 무관하게 1회.
     데스크탑에선 실제 통화로 이어지지 않으니, 데스크탑의 '전화 의향' 은
     사실상 이 값으로 봐야 한다. */
  function trackIntent(digits, sectionLabel) {
    var params = {
      item_type: 'phone_intent',
      branch: window.HelixBranch.name(),
      device: device(),
      section: sectionLabel || 'unknown',
      value: digits
    };
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        window.gtag('event', window.HelixBranch.key() + '_phone_intent', params);
        log('intent sent', params);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        params.event = window.HelixBranch.key() + '_phone_intent';
        window.dataLayer.push(params);
      }
    } catch (e) { log('intent error', e); }
  }

  function trackCall(digits, sectionLabel, cb) {
    var params = {
      item_type: 'phone_call',
      branch: window.HelixBranch.name(),
      device: device(),
      section: sectionLabel || 'unknown',
      value: digits
    };
    var fired = false;
    function done() { if (fired) return; fired = true; try { cb && cb(); } catch (e) {} }
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        params.event_callback = done;
        window.gtag('event', window.HelixBranch.key() + '_phone_call', params);
        /* 안전 타임아웃 — gtag callback 누락 대비 */
        setTimeout(done, 1000);
        log('gtag sent', params);
        return;
      }
      if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        var dlParams = {};
        for (var k in params) { if (params.hasOwnProperty(k) && k !== 'event_callback') dlParams[k] = params[k]; }
        dlParams.event = window.HelixBranch.key() + '_phone_call';
        window.dataLayer.push(dlParams);
        log('dataLayer pushed', dlParams);
      }
    } catch (e) { log('track error', e); }
    /* gtag 없거나 실패 → 즉시 진행 */
    setTimeout(done, 0);
  }

  function bindGroup(container, digits, sectionLabel) {
    if (container.__helixPhoneBound) return;
    container.__helixPhoneBound = true;
    container.style.cursor = 'pointer';
    container.setAttribute('role', 'button');
    container.setAttribute('tabindex', '0');
    container.setAttribute('aria-label', '전화 ' + formatDisplay(digits) + ' 로 연결');

    function handler(e) {
      e.preventDefault();
      e.stopPropagation();
      var pretty = formatDisplay(digits);

      /* 번호를 누른 시점에 먼저 한 줄 남긴다 (확인창 뜨기 전).
         seocho_phone_call 은 확인창에서 '확인' 을 눌러야만 기록되는데,
         30일간 서초 방문 378건·전화 섹션 도달 85건인데도 0건이었다.
         눌러보는 사람이 없는 것인지 확인창에서 다 취소하는 것인지
         구분할 방법이 없어 개선 방향을 못 정한다.
         intent(눌렀다) 와 call(확인까지 했다) 을 나눠 그 차이를 본다.
         ※ intent 는 conv 태깅 대상이 아니다 — 같은 클릭이 call 로도
           기록되므로 전환 수가 두 번 세어지지 않게 한다. */
      trackIntent(digits, sectionLabel);

      var ok = window.confirm(pretty + ' 로 전화 연결하시겠습니까?\n번호가 자동으로 복사됩니다.');
      if (!ok) { log('user cancelled'); return; }

      copyText(pretty);
      var telHref = 'tel:' + digits;
      trackCall(digits, sectionLabel, function () {
        log('navigating', telHref);
        window.location.href = telHref;
      });
    }

    container.addEventListener('click', handler);
    container.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') handler(ev);
    });
  }

  function initPhoneSection() {
    var section = document.getElementById('phone');
    if (!section) { log('section#phone not found'); return; }

    /* .branch_phoneno (메인 번호) 를 기준으로 그룹 식별.
       같은 부모 안에 .branch_phoneno_119 (뒷자리) 가 있으면 합쳐서 정규화. */
    var mainNodes = section.querySelectorAll('.branch_phoneno');
    if (!mainNodes.length) { log('.branch_phoneno not found'); return; }

    Array.prototype.forEach.call(mainNodes, function (mainEl) {
      /* 119 클래스도 .branch_phoneno 에 매칭되지 않게 정확히 거름. */
      if (mainEl.classList.contains('branch_phoneno_119')) return;

      var container = mainEl.parentElement;
      if (!container) return;

      var tailEl = container.querySelector('.branch_phoneno_119');
      var raw = (mainEl.textContent || '') + (tailEl ? tailEl.textContent : '');
      var digits = digitsOnly(raw);
      if (digits.length < 9) { log('invalid digits, skip', raw); return; }

      bindGroup(container, digits, 'reservation');
      log('bound', digits, container);
    });
  }

  /* ── 첫 섹션(인트로) 전화번호 ───────────────────────────────
     대상: section.intro_backgra / .intro_backgra_m / .intro_backgra_m2
           (데스크탑 + 모바일 반응형 변형) 안의 H1.heading-2 = "02-2135-9119".
     .heading-2 는 Webflow 자동 클래스라 흔하므로, 인트로 섹션 안 + 전화번호
     텍스트(숫자 9자리+) 로 좁혀 오검출 방지. 예약 섹션과 동일 동작
     (확인창 → 복사 → tel: 연결 → GA4). section='hero' 로 구분 집계. */
  function initHeroPhone() {
    var introSecs = document.querySelectorAll('section[class*="intro_backgra"]');
    if (!introSecs.length) { log('intro section not found'); return; }

    Array.prototype.forEach.call(introSecs, function (sec) {
      var cands = sec.querySelectorAll('.heading-2');
      Array.prototype.forEach.call(cands, function (el) {
        /* 자식 요소 없는(=텍스트 리프) 노드만, 전화번호 형태만 */
        if (el.children.length) return;
        var digits = digitsOnly(el.textContent || '');
        if (digits.length < 9 || digits.length > 11) return;
        bindGroup(el, digits, 'hero');
        log('hero phone bound', digits, el);
      });
    });
  }

  function initAllPhones() {
    initPhoneSection();
    initHeroPhone();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPhones);
  } else {
    initAllPhones();
  }
  /* Webflow IX2 가 늦게 DOM 을 조작하는 케이스 대비 */
  window.addEventListener('load', initAllPhones);
})();

/* ================================================================
   Hash anchor fallback — id 가 없고 클래스만 있는 element 에도 anchor
   동작. 예: /seocho#map_naver 로 진입 시 .map_naver 로 스크롤.
   페이지 진입 직후엔 hero 애니메이션 / IX2 가 scroll 을 0 으로 가로채는
   경우가 있어 두 시점(600ms / 1500ms) 보강 호출.
   ================================================================ */
(function () {
  'use strict';
  if (!location.hash || location.hash.length < 2) return;

  var slug = location.hash.slice(1);

  function tryScroll() {
    /* id 우선, 없으면 같은 이름의 class 로 fallback */
    var el = document.getElementById(slug) || document.querySelector('.' + slug);
    if (!el) return false;
    /* fixed header 가 섹션 위를 가리는 거 회피 — 헤더 높이 + 19vw 여유 */
    var header = document.querySelector('header.header, .header, [class*="navbar"]');
    var headerH = (header && header.offsetHeight) || 80;
    var offsetVw = 19 * window.innerWidth / 100;
    var top = el.getBoundingClientRect().top + window.scrollY - headerH - offsetVw;
    if (top < 0) top = 0;
    try {
      window.scrollTo({ top: top, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, top);
    }
    return true;
  }

  function run() {
    setTimeout(tryScroll, 600);
    setTimeout(tryScroll, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
