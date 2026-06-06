/* ================================================================
   HELIX AMC — 응급 증상 안내 페이지 전용 스크립트
   ----------------------------------------------------------------
   모달 자체는 emergency/modal.js 가 담당. 본 파일은 페이지에 박힌
   기타 전역 UI 핸들러 (분원 전화 블록 등) 처리.
   ================================================================ */

(function () {
  'use strict';
  if (window.__helixEmergencyInit) return;
  window.__helixEmergencyInit = true;

  /* 페이지 상단/하단의 "call seocho" / "call ilsan" 블록 클릭 → 전화 연결.
     Webflow 가 클래스 이름 공백을 그대로 두는 경우(.call.seocho)와
     하이픈으로 변환하는 경우(.call-seocho) 둘 다 커버. */
  var CALL_BLOCKS = [
    { selector: '.call.seocho, .call-seocho', tel: '02-2135-9119' },
    { selector: '.call.ilsan, .call-ilsan',   tel: '031-978-7575' }
  ];

  /* "map seocho" / "map ilsan" 블록 클릭 → 지점 상세 페이지의 오시는길
     섹션(#map_naver) 으로 이동. 페이지 진입 시 anchor 가 viewport 맨
     위에 오도록 브라우저 기본 동작 활용. */
  var MAP_BLOCKS = [
    { selector: '.map.seocho, .map-seocho', href: '/seoco-bonweon#map_naver' },
    /* 일산분원 방문안내 상세 페이지 미완성 — 이동 차단, 토스트만. */
    { selector: '.map.ilsan, .map-ilsan',   pending: true }
  ];

  function showPendingToast(msg) {
    var t = document.createElement('div');
    t.className = 'helix-em-toast';
    t.textContent = msg || '준비중입니다';
    document.body.appendChild(t);
    /* 다음 프레임에 visible 클래스 부여 → fade-in */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('is-visible'); });
    });
    setTimeout(function () {
      t.classList.remove('is-visible');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
    }, 1800);
  }

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    /* 전화 블록 */
    for (var i = 0; i < CALL_BLOCKS.length; i++) {
      var hit = e.target.closest(CALL_BLOCKS[i].selector);
      if (!hit) continue;
      e.preventDefault();
      var tel = CALL_BLOCKS[i].tel;
      var ok = window.confirm(tel + ' 로 전화 연결하시겠습니까?');
      if (ok) {
        location.href = 'tel:' + tel.replace(/\D/g, '');
      }
      return;
    }
    /* 지도 블록 — 지점 상세 페이지 #map_naver 로 이동 */
    for (var j = 0; j < MAP_BLOCKS.length; j++) {
      var mhit = e.target.closest(MAP_BLOCKS[j].selector);
      if (!mhit) continue;
      e.preventDefault();
      if (MAP_BLOCKS[j].pending) {
        showPendingToast('준비중입니다');
      } else {
        location.href = MAP_BLOCKS[j].href;
      }
      return;
    }
  });

  /* 전화 아이콘 SVG */
  var PHONE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 ' +
    '19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 ' +
    '12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 ' +
    '0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
    '</svg>';

  /* 위치 핀 SVG */
  var MAP_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
    '<circle cx="12" cy="10" r="3"/>' +
    '</svg>';

  function injectIcon(selector, svg, iconClass) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.querySelector('.' + iconClass)) return;
      var span = document.createElement('span');
      span.className = 'helix-em-icon ' + iconClass;
      span.innerHTML = svg;
      el.insertBefore(span, el.firstChild);
    });
  }

  function injectIcons() {
    CALL_BLOCKS.forEach(function (b) { injectIcon(b.selector, PHONE_SVG, 'helix-call-icon'); });
    MAP_BLOCKS.forEach(function (b)  { injectIcon(b.selector, MAP_SVG,   'helix-map-icon');  });
  }

  if (document.readyState !== 'loading') injectIcons();
  else document.addEventListener('DOMContentLoaded', injectIcons);
  /* Webflow IX2 가 늦게 wrapper 갈아끼우는 경우 대비 — 한 번 더 */
  setTimeout(injectIcons, 800);

  /* ==============================================================
     데스크탑 전용 — 컨텐츠 섹션이 푸터로 침범 안 하게
     --------------------------------------------------------------
     ≥992px 에서만 동작. 페이지 자체 스크롤은 살리고 (푸터 접근 가능),
     응급 카드가 들어있는 섹션 1 개만 측정해서, viewport(헤더 제외) 보다
     크면 zoom 으로 축소해 한 화면에 맞춤. 푸터/외 섹션 무영향.
     ============================================================== */
  var DESKTOP_MIN = 992;
  var fitRoot = null;

  function findFitRoot() {
    if (fitRoot && document.contains(fitRoot)) return fitRoot;
    /* 응급 카드가 들어있는 가장 가까운 section 을 fit 대상으로 잡음.
       카드 한 장이라도 있어야 의미 있음 (없으면 NO-OP).
       선제 숨김은 CSS (:has) 가 담당 — inline visibility 안 박음. */
    var card = document.querySelector('[data-emergency-open]');
    if (!card) return null;
    fitRoot = card.closest('section') ||
              card.closest('.section') ||
              card.closest('main > div') ||
              card.parentElement;
    if (fitRoot) fitRoot.classList.add('helix-em-fit-root');
    return fitRoot;
  }

  function clearFit(root) {
    if (!root) return;
    root.style.zoom = '';
    root.style.transform = '';
    root.style.width = '';
    root.style.maxHeight = '';
    root.style.overflow = '';
    root.style.boxSizing = '';
    root.style.visibility = '';
  }

  function applyFit() {
    var root = findFitRoot();
    if (!root) return;

    /* 모바일/태블릿 — 락 해제 + 선제 숨김 해제 */
    if (window.innerWidth < DESKTOP_MIN) {
      document.documentElement.classList.remove('helix-em-locked');
      clearFit(root);
      root.classList.add('helix-em-fit-done');
      return;
    }

    document.documentElement.classList.add('helix-em-locked');
    /* 적용된 fit 값 초기화 (자연 높이 재측정 위해) */
    root.style.zoom = '';
    root.style.transform = '';
    root.style.width = '';
    root.style.maxHeight = '';
    root.style.overflow = '';
    root.style.boxSizing = '';
    /* 헤더가 fixed 라 가시 영역 = viewport - header. global.css 변수 사용. */
    var headerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10
    ) || 56;
    var targetH = window.innerHeight - headerH;
    var natural = root.scrollHeight;

    root.style.boxSizing = 'border-box';
    root.style.maxHeight = targetH + 'px';
    root.style.overflow = 'hidden';

    if (natural > targetH + 1) {
      var z = targetH / natural;
      /* 너무 작아지면 가독성 박살 — 0.7 이하로는 안 줄임 */
      if (z < 0.7) z = 0.7;
      if ('zoom' in root.style || CSS.supports('zoom', '0.5')) {
        root.style.zoom = z;
      } else {
        root.style.transform = 'scale(' + z + ')';
        root.style.width = (100 / z) + '%';
      }
    }

    /* 측정/적용 끝 — 보이기 (CSS :has 선제 숨김 해제) */
    root.classList.add('helix-em-fit-done');
  }

  /* 첫 적용 — DOMContentLoaded 시점에 즉시 (이미지 로드 안 기다림) */
  if (document.readyState !== 'loading') {
    applyFit();
  } else {
    document.addEventListener('DOMContentLoaded', applyFit);
  }
  /* 이미지/폰트 늦게 들어오면 높이 바뀔 수 있어 한 번 더 */
  window.addEventListener('load', applyFit);
  setTimeout(applyFit, 1500);

  /* 리사이즈 debounce */
  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(applyFit, 120);
  });

  /* DOM 변화 (Webflow IX2 wrapper 교체 등) 대응 */
  try {
    var mo = new MutationObserver(function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(applyFit, 200);
    });
    mo.observe(document.body, { childList: true, subtree: false });
    setTimeout(function () { mo.disconnect(); }, 8000);
  } catch (e) {}

  /* 클릭 가능 힌트 + 아이콘 스타일 */
  try {
    var style = document.createElement('style');
    style.textContent =
      '.call.seocho, .call-seocho, .call.ilsan, .call-ilsan,' +
      '.map.seocho, .map-seocho, .map.ilsan, .map-ilsan {' +
        'cursor: pointer;' +
        'display: inline-flex !important;' +
        'align-items: center;' +
        'justify-content: center;' +
        'padding: 0 !important;' +
        'width: 28px !important;' +
        'height: 28px !important;' +
      '}' +
      '.helix-em-icon {' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'width: 100%;' +
        'height: 100%;' +
        'border-radius: 50%;' +
        'background: #0075d6;' +
        'color: #ffffff;' +
        'box-sizing: border-box;' +
      '}' +
      '.helix-em-icon svg { width: 50%; height: 50%; }' +
      '.helix-em-toast {' +
        'position: fixed;' +
        'left: 50%;' +
        'bottom: 80px;' +
        'transform: translate(-50%, 10px);' +
        'background: rgba(13, 17, 23, 0.92);' +
        'color: #fff;' +
        'padding: 12px 20px;' +
        'border-radius: 999px;' +
        'font-size: 14px;' +
        'font-weight: 500;' +
        'letter-spacing: 0.02em;' +
        'box-shadow: 0 4px 20px rgba(0,0,0,0.3);' +
        'z-index: 99999;' +
        'opacity: 0;' +
        'pointer-events: none;' +
        'transition: opacity 0.3s ease, transform 0.3s ease;' +
      '}' +
      '.helix-em-toast.is-visible {' +
        'opacity: 1;' +
        'transform: translate(-50%, 0);' +
      '}';
    document.head.appendChild(style);
  } catch (e) {}
})();
