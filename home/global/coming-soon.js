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

  /* 이미 열려 있는 페이지로 가는 링크는 토스트로 막지 않는다.

     배경: 버튼 컴포넌트("메인페이지 버튼")에 data-coming-soon="1" 이
     컴포넌트 수준으로 박혀 있어 그 버튼을 쓰는 모든 자리가 한꺼번에 막힌다.
     Webflow 컴포넌트 인스턴스는 속성을 따로 덮어쓸 수 없어서
     (set_attributes → "does not support attributes"), 버튼마다 끄고 켜는 게
     불가능하다. 그래서 "무슨 버튼인가" 대신 "어디로 가는 링크인가"로 판정.

     아직 비공개인 페이지는 아래 목록에 없으므로 그대로 토스트가 뜬다.
     페이지를 열 때마다 여기 한 줄 추가. */
  var LIVE_PATHS = ['/symptoms'];

  /* ── 스테이징에서만 여는 페이지 (도메인 게이트) ──
     특화진료(/specialty-care)는 아직 정식 공개 전이다. 정식 사이트에서는
     '준비중입니다' 토스트를 그대로 유지하고, 스테이징(*.webflow.io)에서만
     실제 페이지로 이동시킨다.

     왜 브랜치를 가르지 않고 도메인으로 판정하나: staging 에만 두면
     나중에 다른 작업을 staging→main 으로 승격할 때 이게 딸려 올라가
     의도치 않게 정식에 공개된다. 도메인 게이트는 코드가 main 에 올라가도
     정식 도메인에서는 게이트에 걸려 계속 닫혀 있다. (GA4 측정과 같은 방식)

     정식 공개 시점에는 이 블록을 지우고 위 LIVE_PATHS / 아래 LIVE_NAV 에
     직접 한 줄씩 넣으면 된다. */
  if (/\.webflow\.io$/i.test(location.hostname)) {
    LIVE_PATHS.push('/specialty-care');
  }

  function isLivePathLink(node) {
    if (!node || !node.closest) return false;
    var a = node.closest('a[href]');
    if (!a) return false;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (_) { return false; }
    if (u.origin !== location.origin) return false;
    return LIVE_PATHS.indexOf(u.pathname.replace(/\/$/, '')) !== -1;
  }

  function findBlockedTarget(node) {
    /* 업프론트: 클릭 타겟에서 가장 가까운 라이브 지점 카드 조상이 있고
       텍스트가 라이브 패턴이면 즉시 토스트 차단 (마킹 레이스 무관). */
    if (node && node.closest) {
      var liveCard = node.closest(LIVE_BRANCH_CARD_SEL);
      if (liveCard && LIVE_BRANCH_PATTERN.test(liveCard.textContent || '')) return null;
    }
    /* 열려 있는 페이지로 가는 링크면 컴포넌트 마킹과 무관하게 이동시킨다 */
    if (isLivePathLink(node)) return null;
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

  /* ── 준비중 클릭 측정 ────────────────────────────────────────────
     여태 토스트만 뜨고 기록이 한 줄도 안 남던 자리. "아직 안 연 기능인데도
     눌러본 수요" 를 잡으려고 클릭마다 GA4 이벤트를 쏜다. window.gtag
     (ga4-base) 에 편승 → 스테이징(*.webflow.io)에선 no-op stub 이라
     자동으로 아무 것도 안 나감(별도 도메인 게이트 불필요).

     ⚠️ 햄버거 메뉴 항목은 hamburger.js 가 menu_nav_click(coming_soon:1) 도
        따로 쏜다. 두 이벤트는 묻는 게 달라(메뉴에서 어디로 갔나 / 준비중인데
        눌린 수요) 일부러 둘 다 남기되, 시트에서 두 표를 더하면 메뉴 클릭이
        두 번 세어진다. 합산할 땐 area='menu' 를 한쪽에서 빼고 더할 것. */
  function csPage() {
    var p = (location.pathname || '/').toLowerCase();
    if (/discover/.test(p))            return 'discover';
    if (/seocho|seoco/.test(p))        return 'seocho';
    if (/emergency|symptoms/.test(p))  return 'emergency';
    if (/specialty/.test(p))           return 'specialty';
    if (/services/.test(p))            return 'services';
    if (/faq/.test(p))                 return 'faq';
    return 'home';
  }
  var CS_PAGE = csPage();

  function csText(el) {
    return ((el && (el.innerText || el.textContent)) || '').replace(/\s+/g, ' ').trim();
  }

  /* 어느 자리에서 눌렀나 — 시트에서 사람이 바로 읽히게 굵직하게만 나눔 */
  function csArea(el) {
    if (!el || !el.closest) return 'other';
    if (el.closest('.hx-menu-overlay'))          return 'menu';
    if (el.closest('.bt-box-2'))                 return 'home_specialty_cta';
    if (el.closest(LIVE_BRANCH_CARD_SEL))        return 'branch_card';
    if (el.closest('.just-box_qqqqqqq'))         return 'deck_card';
    if (el.closest('header, .header, nav, [class*="navbar" i]')) return 'header';
    if (el.closest('footer, .footer'))           return 'footer';
    return 'other';
  }

  /* 라벨 — 마킹된 요소가 사진 링크라 글자가 없을 수 있어(지점 카드의 이미지
     링크 등) 가까운 카드/버튼까지 올라가 글자를 줍는다. 지점 카드는 카드 전체
     글이 딸려와 라벨이 길어지므로 지점 이름으로 갈음. */
  function csLabel(el) {
    var s = csText(el);
    if (!s && el && el.closest) {
      var host = el.closest(LIVE_BRANCH_CARD_SEL + ', .just-box_qqqqqqq, .bt-box-2, [class*="button" i]');
      if (host) s = csText(host);
    }
    if (/일산|고양시|덕양구|978-7575/.test(s)) return '일산 분원';
    if (/서초|2135-9119/.test(s))              return '서초 본원';
    return s.slice(0, 40);
  }

  function trackComingSoon(el) {
    try {
      var d = window.innerWidth <= 767 ? 'mobile' : 'desktop';
      var label = csLabel(el);
      var p = {
        item_type: 'coming_soon_click',
        page: CS_PAGE,
        device: d,
        area: csArea(el),
        label: label,
        value: label
      };
      var name = 'coming_soon_click_' + d;
      if (typeof window.gtag === 'function') {
        p.transport_type = 'beacon';
        window.gtag('event', name, p);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        p.event = name;
        window.dataLayer.push(p);
      }
    } catch (err) {}
  }

  function handleClick(e) {
    var target = findBlockedTarget(e.target);
    if (!target) return;

    /* preventDefault 만으로 a[href] 기본 이동 차단 충분.
       stopPropagation 은 일부러 호출하지 않음 — 헤더 햄버거 메뉴처럼
       링크 click 시 자체 닫기 핸들러가 필요한 경우(hamburger.js 의 closeMenu)
       가 정상 동작하도록 이벤트 버블을 살려둠. */
    e.preventDefault();

    /* 토스트가 실제로 뜨는 클릭만 측정 (라이브로 푼 링크는 위에서 이미 return) */
    trackComingSoon(target);

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

  /* 헤더 1차 네비 탭 라이브 링크 — 텍스트 정확 매칭.
     헤더의 "진료과목" 같은 Webflow 네이티브 링크는 컴포넌트에 data-coming-soon 이
     박혀 준비중 토스트만 떴음. 텍스트가 정확히 일치하면 data-coming-soon 을 떼고
     data-helix-link 를 걸어 클릭 시 해당 페이지로 이동(handleLiveCardClick 가 처리). */
  var LIVE_NAV = [
    { text: '진료과목', url: '/services' }
  ];

  /* 스테이징에서만 여는 메뉴 — 위 LIVE_PATHS 의 도메인 게이트와 같은 이유.
     헤더와 햄버거 메뉴 양쪽 모두 텍스트가 '특화진료' 라 이 한 줄로 둘 다 열린다.
     정식 공개 시점에 이 블록을 지우고 위 배열에 직접 넣으면 됨. */
  if (/\.webflow\.io$/i.test(location.hostname)) {
    LIVE_NAV.push({ text: '특화진료', url: '/specialty-care' });
  }
  function markLiveNav() {
    var cands = document.querySelectorAll('a,[data-coming-soon]');
    Array.prototype.forEach.call(cands, function (el) {
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      for (var i = 0; i < LIVE_NAV.length; i++) {
        if (txt !== LIVE_NAV[i].text) continue;
        if (el.hasAttribute('data-coming-soon')) el.removeAttribute('data-coming-soon');
        if (el.getAttribute(LIVE_ATTR) !== LIVE_NAV[i].url) {
          el.setAttribute(LIVE_ATTR, LIVE_NAV[i].url);
          el.style.cursor = 'pointer';
        }
      }
    });
  }

  /* 헤더 '지점안내' 탭 → 홈 맨 밑 지점 카드 섹션으로 이동.
     - 홈이면 부드럽게 스크롤, 다른 페이지면 홈(?to=branches)으로 이동 후 로드 시 스크롤.
     - 텍스트 공백 무시 매칭('지점 안내'/'지점안내' 모두). */
  var BRANCH_SCROLL_ATTR = 'data-helix-scroll';
  function isHomePath() { return /^\/(index\.html)?$/i.test(location.pathname); }
  function markBranchNav() {
    document.querySelectorAll('a,[data-coming-soon]').forEach(function (el) {
      if ((el.textContent || '').replace(/\s+/g, '') !== '지점안내') return;
      if (el.hasAttribute('data-coming-soon')) el.removeAttribute('data-coming-soon');
      if (!el.hasAttribute(BRANCH_SCROLL_ATTR)) {
        el.setAttribute(BRANCH_SCROLL_ATTR, '1');
        el.style.cursor = 'pointer';
      }
    });
  }
  function scrollToBranchSection() {
    var t = document.querySelector(BRANCH_CARD_SEL);
    if (!t) return false;
    var sec = (t.closest && t.closest('section')) || t;
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  function handleBranchNavClick(e) {
    var el = e.target;
    while (el && el !== document.body && el.nodeType === 1) {
      if (el.hasAttribute && el.hasAttribute(BRANCH_SCROLL_ATTR)) {
        e.preventDefault();
        e.stopPropagation();
        if (isHomePath()) scrollToBranchSection();
        else window.location.href = '/?to=branches';
        return;
      }
      el = el.parentElement;
    }
  }
  document.addEventListener('click', handleBranchNavClick, true);
  function maybeScrollBranchOnLoad() {
    if (!isHomePath() || !/[?&]to=branches/.test(location.search)) return;
    var n = 0;
    var iv = setInterval(function () {
      if (scrollToBranchSection() || ++n >= 40) {
        clearInterval(iv);
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
      }
    }, 150);
  }

  /* ── 헤더 GA 측정 (전 페이지 공통 헤더) ──
     홈 로고 / 진료과목 탭 클릭에 전용 GA 이벤트를 붙인다. window.gtag(ga4-base)
     에 편승 → 스테이징(*.webflow.io)에선 no-op stub 이라 자동 비활성(측정 안 감).
     실제 발사는 아래 document 캡처 리스너가 담당하고, 여기선 인스펙터 네모용
     마커(data-hx-hdr-ga)만 부여한다.
       - 로고: 헤더 안에서 홈(/)으로 가는, 이미지 품은 링크
       - 진료과목: markLiveNav 가 승격한 data-helix-link="/services" 요소 */
  function hxHeaderGa(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  function hxHeaderRoot() {
    return document.querySelector('.navbar1_component') ||
           document.querySelector('header') ||
           document.querySelector('[class*="navbar" i]') ||
           document.querySelector('nav');
  }
  function hxIsHomeHref(a) {
    var href = a.getAttribute('href');
    if (href == null) return false;
    if (href === '/' || /^\/(index\.html)?$/i.test(href)) return true;
    try {
      var u = new URL(a.href, location.href);
      return u.origin === location.origin && /^\/(index\.html)?$/i.test(u.pathname);
    } catch (e) { return false; }
  }
  var HDR_GA_ATTR = 'data-hx-hdr-ga';
  function markHeaderGa() {
    var header = hxHeaderRoot();
    if (header) {
      var anchors = header.querySelectorAll('a');
      Array.prototype.forEach.call(anchors, function (a) {
        if (a.getAttribute(HDR_GA_ATTR)) return;
        if (hxIsHomeHref(a) && (a.querySelector('img,svg') || /logo/i.test(a.className || ''))) {
          a.setAttribute(HDR_GA_ATTR, 'logo');
        }
      });
    }
    /* 진료과목 링크는 data-helix-link="/services" 로 유일 식별(헤더 스코프 불필요) */
    var svc = document.querySelectorAll('[' + LIVE_ATTR + '="/services"]');
    Array.prototype.forEach.call(svc, function (el) {
      if (!el.getAttribute(HDR_GA_ATTR)) el.setAttribute(HDR_GA_ATTR, 'services');
    });
  }
  /* 발사 리스너 — document 캡처. handleLiveCardClick 이 진료과목 클릭에서
     stopPropagation 을 부르지만, 그건 "다른 타깃으로의 전파"만 막을 뿐
     document 에 걸린 형제 캡처 리스너는 그대로 실행되므로 여기서 안전하게 발사. */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('[' + HDR_GA_ATTR + '="logo"]')) hxHeaderGa('header_logo_home', {});
    else if (t.closest('[' + HDR_GA_ATTR + '="services"]')) hxHeaderGa('header_services_click', {});
  }, true);

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
    /* 헤더 "진료과목" 등 1차 네비 탭 → 실제 페이지 링크로 승격 */
    markLiveNav();
    /* 헤더 "지점안내" 탭 → 홈 지점 카드 섹션 스크롤 이동으로 승격 */
    markBranchNav();
    /* 헤더 홈 로고 / 진료과목 탭 → GA 측정 마커 부여 */
    markHeaderGa();
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
    /* 홈 진입 시 ?to=branches 면 지점 카드 섹션으로 스크롤 */
    maybeScrollBranchOnLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', start);
})();
