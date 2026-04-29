/* ================================================================
   COMING SOON TOAST

   동작:
   - data-coming-soon="1" (또는 단순 data-coming-soon) 어트리뷰트 가진
     모든 클릭 가능한 요소(앵커/버튼/래퍼)에 대해
   - 클릭 시 페이지 이동/기본동작 차단
   - PC: 마우스 커서 우하단에 "준비중입니다" 토스트 노출 → 0.9s 풀 노출 → 0.3s 페이드아웃
   - 모바일/터치: 화면 하단 중앙에 같은 토스트 (커서 없음)

   캡처 단계 리스너 사용 → Webflow가 붙인 다른 핸들러나 a[href] 기본 이동을
   확실히 가로챔. 마킹 요소 자체뿐 아니라 그 자손까지 click이 버블해도 동작.
   ================================================================ */

(function () {
  'use strict';

  var ATTR = 'data-coming-soon';
  var TEXT = '준비중입니다';
  var SHOW_MS = 900;   /* 풀 노출 시간 */
  var FADE_MS = 300;   /* 페이드아웃 시간 (CSS transition과 일치) */
  var CURSOR_OFFSET_X = 14;  /* 커서 우측 오프셋 */
  var CURSOR_OFFSET_Y = 18;  /* 커서 하단 오프셋 */

  var toast = null;
  var hideTimer = null;
  var fadeTimer = null;

  /* 터치 환경 감지 — 마지막 입력이 touch였으면 모바일 토스트로,
     아니면 mouse 좌표 기준 토스트 */
  var lastInputType = 'mouse';
  function markPointerType(e) {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      lastInputType = 'touch';
    } else if (e.pointerType === 'mouse') {
      lastInputType = 'mouse';
    }
  }

  function ensureToast() {
    if (toast && toast.isConnected) return toast;
    toast = document.createElement('div');
    toast.className = 'helix-coming-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = TEXT;
    document.body.appendChild(toast);
    return toast;
  }

  function clampToViewport(x, y, w, h) {
    var pad = 6;
    var maxX = window.innerWidth  - w - pad;
    var maxY = window.innerHeight - h - pad;
    if (x > maxX) x = maxX;
    if (y > maxY) y = maxY;
    if (x < pad) x = pad;
    if (y < pad) y = pad;
    return { x: x, y: y };
  }

  function showAt(clientX, clientY, useCursor) {
    var t = ensureToast();

    /* 이전 타이머 클리어 — 빠르게 여러 번 누르면 위치만 갱신 */
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }

    if (useCursor) {
      t.classList.remove('is-mobile');
      t.classList.add('is-cursor');
      /* 측정용으로 잠깐 보이게 (clipped to bottom-right corner first) */
      t.style.left = '-9999px';
      t.style.top  = '-9999px';
      t.classList.add('is-visible');
      var rect = t.getBoundingClientRect();
      var pos  = clampToViewport(
        clientX + CURSOR_OFFSET_X,
        clientY + CURSOR_OFFSET_Y,
        rect.width,
        rect.height
      );
      t.style.left = pos.x + 'px';
      t.style.top  = pos.y + 'px';
    } else {
      t.classList.remove('is-cursor');
      t.classList.add('is-mobile');
      t.style.left = '';
      t.style.top  = '';
      /* 다음 frame에 visible 클래스 적용 → transform/opacity 트랜지션 동작 */
      requestAnimationFrame(function () { t.classList.add('is-visible'); });
    }

    /* 풀 노출 후 페이드아웃, 페이드아웃 끝나면 토스트는 DOM에 남기지만 invisible */
    hideTimer = setTimeout(function () {
      t.classList.remove('is-visible');
      fadeTimer = setTimeout(function () {
        /* 정리: 위치 리셋 (다음 등장 시 깜빡임 방지) */
        t.style.left = '-9999px';
        t.style.top  = '-9999px';
      }, FADE_MS);
    }, SHOW_MS);
  }

  function findBlockedTarget(node) {
    /* click target에서 위로 올라가며 data-coming-soon 마킹된 조상 찾기 */
    var el = node;
    while (el && el !== document.body && el.nodeType === 1) {
      if (el.hasAttribute && el.hasAttribute(ATTR)) {
        var v = el.getAttribute(ATTR);
        /* 빈 값/"1"/"true"는 활성화로 간주, "0"/"false"는 비활성 */
        if (v === null || v === '' || v === '1' || v === 'true') return el;
        if (v !== '0' && v !== 'false') return el;  /* 그 외 값도 활성 */
        return null;
      }
      el = el.parentElement;
    }
    return null;
  }

  function handleClick(e) {
    var target = findBlockedTarget(e.target);
    if (!target) return;

    /* preventDefault 만으로 a[href] 기본 이동 차단 충분.
       stopPropagation 은 일부러 호출하지 않음 — 헤더 햄버거 메뉴처럼
       링크 click 시 자체 닫기 핸들러가 필요한 경우(hamburger.js 의 closeMenu)
       가 정상 동작하도록 이벤트 버블을 살려둠. */
    e.preventDefault();

    /* 마지막 입력이 mouse면 커서 옆 토스트, 아니면(터치/펜) 화면 하단 토스트 */
    var useCursor = (lastInputType === 'mouse');

    showAt(e.clientX, e.clientY, useCursor);
  }

  function init() {
    /* pointer 종류 추적 (mouse/touch/pen 구분) */
    if (window.PointerEvent) {
      document.addEventListener('pointerdown', markPointerType, true);
    } else {
      document.addEventListener('touchstart', function () { lastInputType = 'touch'; }, true);
      document.addEventListener('mousedown',  function () { lastInputType = 'mouse'; }, true);
    }

    /* capture 단계로 등록 → Webflow의 다른 click 핸들러보다 먼저 가로챔 */
    document.addEventListener('click', handleClick, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
