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

  var ATTR        = 'data-coming-soon';
  var EXEMPT_ATTR = 'data-coming-soon-exempt';
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

  /* 라이브 지점 패턴 — 마킹 레이스/셀렉터 미스매치 폴백.
     클릭 시점에 카드 텍스트가 이 패턴을 포함하면 토스트 차단 (페이지 이동 전용). */
  var LIVE_BRANCH_PATTERN = /서초|2135-9119/;
  var LIVE_BRANCH_CARD_SEL = '.home_branch-card, .flex-block-22 > .div-block-151';

  function findBlockedTarget(node) {
    /* 업프론트: 클릭 타겟에서 가장 가까운 라이브 지점 카드 조상이 있고
       텍스트가 라이브 패턴이면 즉시 토스트 차단 (마킹 레이스 무관). */
    if (node && node.closest) {
      var liveCard = node.closest(LIVE_BRANCH_CARD_SEL);
      if (liveCard && LIVE_BRANCH_PATTERN.test(liveCard.textContent || '')) return null;
    }
    /* click target에서 위로 올라가며 data-coming-soon 마킹된 조상 찾기.
       단, 더 가까운 조상이 data-coming-soon-exempt 면 차단 안 함
       (예: branch-card 의 copy 버튼 / tel 링크는 카드 자체 마킹과 무관하게 동작) */
    var el = node;
    while (el && el !== document.body && el.nodeType === 1) {
      if (el.hasAttribute && el.hasAttribute(EXEMPT_ATTR)) return null;
      /* 라이브 지점 카드(서초 등 data-helix-link) 는 페이지 이동 전용 —
         마킹 레이스로 data-coming-soon 이 남아도 토스트는 띄우지 않음 */
      if (el.hasAttribute && el.hasAttribute('data-helix-link')) return null;
      /* 폴백: 마킹이 안 됐어도 라이브 지점 카드 텍스트면 토스트 차단 */
      if (el.matches && el.matches(LIVE_BRANCH_CARD_SEL) &&
          LIVE_BRANCH_PATTERN.test(el.textContent || '')) return null;
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


/* ================================================================
   COMING SOON MARKER — 준비중 토스트 대상 요소 자동 마킹
   대상 (홈):
     · .bt-box-2 / .bt-box-3 / .bt-box-4 — 특화진료 / 응급 / SVIC CTA
     · .home_branch-card / .flex-block-22 > .div-block-151
       — 지점 카드 (서초/일산/SVICC, legacy + 현재 Webflow DOM)
     · .just-box_qqqqqqq — 섹션3 카드덱 카드들 ("+" 버튼 포함)
   면제 (마커가 박혀도 기존 동작 유지):
     · .copy-text-button — 주소 복사
     · a[href^="tel:"] — 전화 링크
     · a[href^="mailto:"] — 메일 링크 (footer.js 가 별도 처리)
   ================================================================ */
(function () {
  'use strict';

  var COMING_SELECTORS = [
    '.bt-box-2',
    /* .bt-box-3 (응급내원이 필요한 증상 CTA) — 사용자 지시로 준비중 해제, Webflow href 그대로 사용 */
    /* .bt-box-4 (SVIC CTA) — 사용자 지시로 준비중 해제, Webflow href 그대로 사용 */
    '.home_branch-card',
    '.flex-block-22 > .div-block-151',
    '.just-box_qqqqqqq'
  ];
  var EXEMPT_SELECTORS = [
    '.copy-text-button',
    'a[href^="tel:"]',
    'a[href^="mailto:"]'
  ];
  /* 지점 카드 중 "라이브" 처리할 카드 (준비중 해제 + 클릭 시 페이지 이동).
     식별: 카드 텍스트에 매칭 패턴 포함 시 해당 URL 로 이동. */
  var LIVE_BRANCH_CARDS = [
    { match: /서초|2135-9119/, url: '/seocho', label: '서초본원' }
  ];
  var BRANCH_CARD_SEL = '.home_branch-card, .flex-block-22 > .div-block-151';
  var LIVE_ATTR = 'data-helix-link';

  function detectLiveBranch(card) {
    var txt = (card.textContent || '').replace(/\s+/g, ' ');
    for (var i = 0; i < LIVE_BRANCH_CARDS.length; i++) {
      if (LIVE_BRANCH_CARDS[i].match.test(txt)) return LIVE_BRANCH_CARDS[i];
    }
    return null;
  }

  function markLiveBranchCards() {
    document.querySelectorAll(BRANCH_CARD_SEL).forEach(function (card) {
      var live = detectLiveBranch(card);
      if (!live) return;
      /* 준비중 마킹 해제 (혹시 박혔어도 제거) */
      if (card.hasAttribute('data-coming-soon')) card.removeAttribute('data-coming-soon');
      /* 라이브 링크 어트리뷰트 + 커서 + 클릭 가능 표시 */
      if (card.getAttribute(LIVE_ATTR) !== live.url) {
        card.setAttribute(LIVE_ATTR, live.url);
        card.style.cursor = 'pointer';
      }
    });
  }

  /* Webflow Designer 컴포넌트 정의/인스턴스에 custom attribute 로 박혀 있는
     data-coming-soon 을 떼어내야 하는 라이브 셀렉터.
     셀렉터에 매칭되는 element 와 그 자손 anchor 의 data-coming-soon 제거. */
  var FORCE_RELEASE_SELECTORS = [
    '.bt-box-3',  /* 응급내원이 필요한 증상 CTA — 컴포넌트 정의에 박힌 attr */
    '.bt-box-4'   /* SVIC CTA — 동일 컴포넌트 사용 */
  ];

  function forceRelease() {
    FORCE_RELEASE_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.hasAttribute('data-coming-soon')) el.removeAttribute('data-coming-soon');
        el.querySelectorAll('[data-coming-soon]').forEach(function (sub) {
          sub.removeAttribute('data-coming-soon');
        });
      });
    });
  }

  function mark() {
    COMING_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.hasAttribute('data-coming-soon')) {
          el.setAttribute('data-coming-soon', '1');
        }
      });
    });
    /* Webflow Designer 에서 박은 attribute 강제 해제 (mark 뒤에 실행) */
    forceRelease();
    EXEMPT_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.hasAttribute('data-coming-soon-exempt')) {
          el.setAttribute('data-coming-soon-exempt', '1');
        }
      });
    });
    /* 라이브 지점 카드는 마킹 직후 해제 (mark 가 박은 data-coming-soon 제거) */
    markLiveBranchCards();
  }

  /* 라이브 지점 카드 클릭 → 페이지 이동.
     capture 단계로 등록해 Webflow IX2 click 보다 먼저 처리.
     단, 카드 내부 exempt 요소(주소 복사 버튼 / tel 링크 / mailto) 는 자기 동작 유지. */
  function handleLiveCardClick(e) {
    /* 업프론트 폴백: 가장 가까운 지점 카드 조상 + 라이브 패턴 일치 시 즉시 이동 */
    if (e.target && e.target.closest) {
      if (e.target.closest('[data-coming-soon-exempt]')) return;
      var liveCard = e.target.closest(BRANCH_CARD_SEL);
      if (liveCard) {
        var live = detectLiveBranch(liveCard);
        if (live) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = live.url;
          return;
        }
      }
    }
    var el = e.target;
    while (el && el !== document.body && el.nodeType === 1) {
      if (el.hasAttribute && el.hasAttribute('data-coming-soon-exempt')) return;
      if (el.hasAttribute && el.hasAttribute(LIVE_ATTR)) {
        var url = el.getAttribute(LIVE_ATTR);
        if (url) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = url;
        }
        return;
      }
      /* 폴백: 마킹이 안 됐어도 라이브 지점 카드 텍스트면 직접 이동 */
      if (el.matches && el.matches(BRANCH_CARD_SEL)) {
        var live = detectLiveBranch(el);
        if (live) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = live.url;
          return;
        }
      }
      el = el.parentElement;
    }
  }
  document.addEventListener('click', handleLiveCardClick, true);

  function start() {
    mark();
    /* 카드덱은 card-stack.js 가 DOM 을 옮긴 후 다시 마킹 필요 */
    var n = 0;
    var iv = setInterval(function () {
      mark();
      if (++n >= 20) clearInterval(iv);
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', start);
})();
