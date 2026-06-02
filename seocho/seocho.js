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

  /* 데스크탑/모바일 섹션이 각각 동일 ID/클래스 (map_naver) 를 갖는 경우가 있어
     getElementById 는 첫 번째 (보통 데스크탑) 만 반환 → 모바일에서 숨겨진
     데스크탑 컨테이너에 마운트되고 실제 보이는 모바일 섹션은 빈 채로 남음.
     모든 후보를 찾아 "현재 보이는" 것만 반환. 둘 다 안 보이면 첫 번째 반환. */
  function findContainers() {
    var nodes = document.querySelectorAll('#map_naver, .map_naver');
    var visible = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var cs = getComputedStyle(el);
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null) {
        visible.push(el);
      }
    }
    if (visible.length) return visible;
    return nodes.length ? [nodes[0]] : [];
  }
  function findContainer() {
    var list = findContainers();
    return list[0] || null;
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
   SUBHEADER — 호버 / 스크롤스파이 / 클릭 시 메인 블루 밑줄
   ================================================================
   about.js 의 동일 패턴 이식. 서브헤더 각 탭에:
   - 스크롤 위치에 따라 해당 섹션의 탭에 .is-active 부착 (파란 밑줄)
   - 클릭 시 그 섹션으로 부드럽게 스크롤 (헤더 + 서브헤더 높이 보정)
   ================================================================ */
(function () {
  'use strict';

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
        var hEl = document.querySelector('header.header, header, nav');
        var headerH = hEl ? hEl.getBoundingClientRect().height : 0;
        var sub = document.querySelector('.subheader');
        var subH = sub ? sub.getBoundingClientRect().height : 0;
        var y = t.getBoundingClientRect().top + window.pageYOffset - (headerH + subH + 12);
        window.scrollTo({ top: y, behavior: 'smooth' });
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
        var hEl = document.querySelector('header.header, header, nav');
        var headerH = hEl ? hEl.getBoundingClientRect().height : 0;
        var sub = document.querySelector('.subheader');
        var subH = sub ? sub.getBoundingClientRect().height : 0;
        var line = headerH + subH + 16;
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
      /* 1) 측정 대상: 각 탭의 가장 안쪽 텍스트 요소들.
         탭 안의 모든 자손을 보고, 실제 텍스트 노드를 직접 가진 요소만 모음.
         이렇게 해야 "인터벤션 센터" 처럼 inner span 이 자체 font-size 를 박은
         케이스에서 진짜 렌더링 size 를 잡을 수 있음. */
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
        if (!out.length) out.push(root);
        return out;
      }

      /* 2) 일단 이전 인라인 제거 후 측정 (resize 후 vw 단위 재계산). */
      var allTouched = [];
      links.forEach(function (a) {
        a.style.fontSize = '';
        a.querySelectorAll('*').forEach(function (el) {
          el.style.fontSize = '';
          allTouched.push(el);
        });
        allTouched.push(a);
      });

      /* 3) 각 탭의 leaf 텍스트 요소 중 최대 컴퓨티드 폰트 크기 → 전체 max. */
      var maxPx = 0;
      links.forEach(function (a) {
        leafTextEls(a).forEach(function (el) {
          var px = parseFloat(getComputedStyle(el).fontSize) || 0;
          if (px > maxPx) maxPx = px;
        });
      });

      /* 4) 탭 링크 + 모든 자손에 인라인 !important 로 동일 px 강제. */
      if (maxPx > 0) {
        links.forEach(function (a) {
          a.style.setProperty('font-size', maxPx + 'px', 'important');
          a.querySelectorAll('*').forEach(function (el) {
            el.style.setProperty('font-size', maxPx + 'px', 'important');
          });
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
    var hEl = document.querySelector('header.header, header, .w-nav, nav');
    if (hEl) {
      var h = hEl.getBoundingClientRect().height;
      if (h > 0) document.documentElement.style.setProperty('--header-h', h + 'px');
    }
    var sEl = document.querySelector('section.subheader');
    if (sEl) {
      var sh = sEl.getBoundingClientRect().height;
      if (sh > 0) document.documentElement.style.setProperty('--subheader-h', sh + 'px');
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

  var MQ = '(min-width: 480px)';
  var mini = null;
  var miniLinks = [];
  var origLinks = [];
  var origMenu = null;
  var origMo = null;
  var visible = false;
  var rafPending = false;

  function isEligible() { return window.matchMedia(MQ).matches; }

  function buildMini() {
    if (mini || !origMenu) return;
    var clone = origMenu.cloneNode(true);
    clone.className = (clone.className || '') + ' helix-mini-tabmenu';
    clone.setAttribute('role', 'tablist');
    clone.setAttribute('aria-label', '의료진 분과 (미니)');
    /* Webflow Tabs 가 클론을 자기 인스턴스로 오인하지 않도록 식별 attribute 제거 */
    clone.removeAttribute('data-w-id');
    clone.querySelectorAll('[data-w-tab]').forEach(function (el) {
      el.removeAttribute('data-w-id');
      el.id = ''; /* 원본과 id 충돌 방지 */
      el.removeAttribute('aria-controls');
      el.setAttribute('tabindex', '-1');
    });
    document.body.appendChild(clone);
    mini = clone;
    miniLinks = [].slice.call(clone.querySelectorAll('.w-tab-link'));
    origLinks = [].slice.call(origMenu.querySelectorAll('.w-tab-link'));

    miniLinks.forEach(function (mLink, i) {
      mLink.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var orig = origLinks[i];
        if (orig) orig.click();
      });
    });

    /* 원본 활성 탭 변화 → 미니에 동기화 */
    origMo = new MutationObserver(syncActive);
    origLinks.forEach(function (l) {
      origMo.observe(l, { attributes: true, attributeFilter: ['class', 'aria-selected'] });
    });
    syncActive();
  }

  function syncActive() {
    if (!miniLinks.length) return;
    origLinks.forEach(function (o, i) {
      var m = miniLinks[i];
      if (!m) return;
      var on = o.classList.contains('w--current');
      m.classList.toggle('w--current', on);
      m.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function destroyMini() {
    if (origMo) { origMo.disconnect(); origMo = null; }
    if (mini && mini.parentNode) mini.parentNode.removeChild(mini);
    mini = null;
    miniLinks = [];
    origLinks = [];
    visible = false;
  }

  function setVisible(on) {
    if (!mini || visible === on) return;
    visible = on;
    mini.classList.toggle('is-visible', on);
  }

  function check() {
    rafPending = false;
    if (!origMenu) return;
    if (!isEligible()) { setVisible(false); return; }
    if (!mini) buildMini();
    var rect = origMenu.getBoundingClientRect();
    var headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56;
    var subH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--subheader-h')) || 0;
    /* 원본 탭 메뉴의 bottom 이 (헤더 + 서브헤더) 아래로 사라지는 순간 미니 등장 */
    setVisible(rect.bottom < headerH + subH);
  }

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(check);
  }

  function onResize() {
    if (!isEligible()) {
      if (mini) destroyMini();
      return;
    }
    onScroll();
  }

  function init() {
    origMenu = document.querySelector('.w-tabs .w-tab-menu');
    if (!origMenu) return false;
    if (isEligible()) buildMini();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
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

   GA4 이벤트: seocho_phone_call
     params: { item_type: 'phone_call', branch: '서초',
               device: 'mobile'|'desktop', value: '0221359119' }
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

  function trackCall(digits, cb) {
    var params = {
      item_type: 'phone_call',
      branch: '서초',
      device: device(),
      value: digits
    };
    var fired = false;
    function done() { if (fired) return; fired = true; try { cb && cb(); } catch (e) {} }
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        params.event_callback = done;
        window.gtag('event', 'seocho_phone_call', params);
        /* 안전 타임아웃 — gtag callback 누락 대비 */
        setTimeout(done, 1000);
        log('gtag sent', params);
        return;
      }
      if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        var dlParams = {};
        for (var k in params) { if (params.hasOwnProperty(k) && k !== 'event_callback') dlParams[k] = params[k]; }
        dlParams.event = 'seocho_phone_call';
        window.dataLayer.push(dlParams);
        log('dataLayer pushed', dlParams);
      }
    } catch (e) { log('track error', e); }
    /* gtag 없거나 실패 → 즉시 진행 */
    setTimeout(done, 0);
  }

  function bindGroup(container, digits) {
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
      var ok = window.confirm(pretty + ' 로 전화 연결하시겠습니까?\n번호가 자동으로 복사됩니다.');
      if (!ok) { log('user cancelled'); return; }

      copyText(pretty);
      var telHref = 'tel:' + digits;
      trackCall(digits, function () {
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

      bindGroup(container, digits);
      log('bound', digits, container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhoneSection);
  } else {
    initPhoneSection();
  }
  /* Webflow IX2 가 늦게 DOM 을 조작하는 케이스 대비 */
  window.addEventListener('load', initPhoneSection);
})();
