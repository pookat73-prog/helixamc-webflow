/* ================================================================
   FOOTER INTERACTIONS
   - 이메일 텍스트 클릭 → 클립보드 복사 + 토스트 피드백
   - SNS 아이콘 클릭 → 외부 링크 새 탭 오픈

   푸터는 Webflow Native 컴포넌트(.footer)로 캡슐화. DOM 으로 렌더링될 때
   내부 클래스가 그대로 노출되지만, Webflow 가 클래스명을 임의로 다듬는
   경우(공백 처리, prefix 등)도 있어 다중 폴백 전략 사용.

   매칭 전략:
   - 이메일: 텍스트가 이메일 패턴 → 클래스 의존 0%
   - SNS: 클래스 매칭 → 컨테이너 매칭 → 위치 매칭, 3단 폴백
   ================================================================ */

(function () {
  'use strict';

  if (window.__HELIX_FOOTER_INIT__) return;
  window.__HELIX_FOOTER_INIT__ = true;

  var DEBUG = /[?&]debug-footer=1/.test(location.search);
  var log = function () {
    console.log.apply(console, ['[Footer]'].concat([].slice.call(arguments)));
  };
  var dbg = DEBUG ? log : function () {};

  /* SNS 링크 — 푸터 SNS 영역 이미지 순서대로 (좌→우) */
  var SNS_URLS = [
    { url: 'https://www.instagram.com/helix_amc/', label: 'Instagram' },
    { url: 'https://blog.naver.com/helix_amc',     label: 'Naver Blog' }
  ];

  var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    ta.style.left     = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        fallbackCopy(text);
      });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  /* 토스트: 화면 하단 중앙에 잠깐 떠올랐다 사라지는 메시지 박스.
     이메일 텍스트 자체는 건드리지 않음 → 레이아웃 점프 0.
     동일 ID 재사용 → 연타해도 박스 하나만 유지. */
  function showToast(msg) {
    var toast = document.getElementById('helix-footer-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'helix-footer-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;

    /* 애니메이션 재시작: 클래스 제거 → reflow → 다시 추가 */
    toast.classList.remove('helix-toast-show');
    void toast.offsetWidth;
    toast.classList.add('helix-toast-show');

    if (toast._helixTimer) clearTimeout(toast._helixTimer);
    toast._helixTimer = setTimeout(function () {
      toast.classList.remove('helix-toast-show');
    }, 1800);
  }

  function findFooter() {
    /* Webflow Native 컴포넌트 .footer (section) — 가장 가능성 높은 selector
       부터 차례로 시도. 모두 실패 시 휴리스틱: 페이지 하단(문서 하단 30% 안에
       시작) 영역에 email 패턴 텍스트가 있는 가장 가까운 section/footer 조상.
       Webflow 에서 클래스를 임의로 변경한 경우 대비. */
    var direct =
      document.querySelector('section.footer') ||
      document.querySelector('.footer') ||
      document.querySelector('footer') ||
      document.querySelector('section[class*="footer" i]') ||
      document.querySelector('[class*="footer" i]:not([class*="-bar" i])');
    if (direct) return direct;

    /* 휴리스틱 폴백 */
    var docH = document.documentElement.scrollHeight;
    var threshold = docH * 0.7;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node, hits = [];
    while ((node = walker.nextNode())) {
      if (!EMAIL_RE.test(node.textContent || '')) continue;
      var p = node.parentElement;
      if (!p) continue;
      var top = p.getBoundingClientRect().top + window.pageYOffset;
      if (top < threshold) continue;
      var sec = p.closest('footer, section, [class*="footer" i]') || p;
      if (sec) hits.push(sec);
    }
    if (hits.length) {
      dbg('footer via heuristic (email near page bottom):', hits[0].tagName, hits[0].className);
      return hits[0];
    }
    return null;
  }

  /* ============================================================
     EMAIL: 텍스트 노드 직계 자식 중 이메일 패턴 보유한 가장 깊은 요소
  ============================================================ */
  function initEmailCopy(footer) {
    var hits = 0;
    var candidates = footer.querySelectorAll('div, p, span, a, h1, h2, h3, h4, h5, h6');

    candidates.forEach(function (el) {
      /* 직계 텍스트 노드에 이메일이 있어야 OK (조상이 같은 텍스트 자식 통해 매칭되는 것 방지) */
      var hasOwnEmail = false;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === 3 && EMAIL_RE.test(n.textContent || '')) {
          hasOwnEmail = true;
          break;
        }
      }
      if (!hasOwnEmail) return;
      if (el.dataset.helixEmailInit) return;
      el.dataset.helixEmailInit = '1';

      el.style.cursor = 'pointer';
      el.classList.add('footer-email-clickable');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', '이메일 주소 복사');

      function onCopy(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var match = el.innerText.match(EMAIL_RE);
        if (!match) return;
        var email = match[0];
        copyText(email).then(function () {
          showToast('복사완료 · ' + email);
          dbg('email copied:', email);
        });
      }

      el.addEventListener('click', onCopy);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') onCopy(e);
      });
      hits++;
      dbg('email handler bound:', el.className || el.tagName);
    });

    if (!hits) {
      log('이메일 요소를 찾지 못했습니다 (footer 안에 이메일 패턴 텍스트 없음)');
    }
    return hits;
  }

  /* ============================================================
     SNS: 다중 폴백 전략으로 좌→우 이미지 2개 식별
     1) 클래스에 sns 들어간 컨테이너 안의 img
     2) 푸터의 마지막 img 묶음 (로고 image 제외)
     3) 모든 img 중 좌→우 정렬 후 마지막 2개
  ============================================================ */
  function findSnsImages(footer) {
    /* 전략 1: 클래스에 sns 들어간 컨테이너 */
    var snsContainer = footer.querySelector(
      '[class*="sns" i], [class*="_sns" i], [class*="-sns" i], [class*="footersns" i]'
    );
    if (snsContainer) {
      var imgs1 = snsContainer.querySelectorAll('img');
      if (imgs1.length >= 1) {
        dbg('SNS via class container, imgs=' + imgs1.length);
        return Array.from(imgs1);
      }
    }

    /* 전략 2: 모든 img 의 부모를 그룹핑 — 가장 많은 img 묶음 가진 부모 */
    var allImgs = Array.from(footer.querySelectorAll('img'));
    if (!allImgs.length) return [];

    var parentBuckets = new Map();
    allImgs.forEach(function (img) {
      var p = img.parentElement;
      if (!p) return;
      if (!parentBuckets.has(p)) parentBuckets.set(p, []);
      parentBuckets.get(p).push(img);
    });

    var biggest = null, biggestCount = 0;
    parentBuckets.forEach(function (imgs, parent) {
      if (imgs.length > biggestCount) {
        biggest = imgs;
        biggestCount = imgs.length;
      }
    });
    if (biggest && biggest.length >= 2) {
      dbg('SNS via parent grouping, imgs=' + biggest.length);
      return biggest;
    }

    /* 전략 3: 푸터 내 모든 img 중 마지막 2개 (로고 첫 번째 제외 가정) */
    if (allImgs.length >= 3) {
      var tail = allImgs.slice(-2);
      dbg('SNS via tail-of-images, imgs=' + tail.length);
      return tail;
    }

    /* 전략 4: img 개수 적음 → 그냥 전부 */
    dbg('SNS via all-images, imgs=' + allImgs.length);
    return allImgs;
  }

  function bindSnsImages(imgs) {
    if (!imgs || !imgs.length) {
      log('SNS 아이콘 이미지를 찾지 못했습니다 (footer 안에 img 없음)');
      return 0;
    }

    /* 좌→우 정렬 (DOM 순서 다를 수 있어 시각 위치 기준으로 보정) */
    imgs = imgs.filter(function (img) {
      return img.offsetParent !== null;  /* 보이는 이미지만 */
    });
    imgs.sort(function (a, b) {
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      return ar.left - br.left;
    });

    var hits = 0;
    imgs.forEach(function (img, i) {
      if (i >= SNS_URLS.length) return;
      if (img.dataset.helixSnsInit) return;
      img.dataset.helixSnsInit = '1';

      var entry = SNS_URLS[i];
      img.style.cursor = 'pointer';
      img.classList.add('footer-sns-icon');
      img.setAttribute('role', 'link');
      img.setAttribute('tabindex', '0');
      img.setAttribute('aria-label', entry.label);

      function go(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        window.open(entry.url, '_blank', 'noopener,noreferrer');
        dbg('sns open:', entry.label, entry.url);
      }

      img.addEventListener('click', go);
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') go(e);
      });

      hits++;
      dbg('sns handler bound:', entry.label, '→', img.src || img.className);
    });

    return hits;
  }

  /* ============================================================
     LOGO: 푸터 첫 번째 img (SNS 아이콘 제외) → 홈 "/" 이동
     푸터 컴포넌트 노드 순서상 로고가 항상 첫 img. SNS 아이콘 셋에서
     제외된 가장 앞쪽 img 를 로고로 간주.
  ============================================================ */
  function initLogoLink(footer, snsImgs) {
    var snsSet = new Set(snsImgs || []);
    var imgs = Array.from(footer.querySelectorAll('img'));
    var logo = null;
    for (var i = 0; i < imgs.length; i++) {
      if (!snsSet.has(imgs[i]) && imgs[i].offsetParent !== null) {
        logo = imgs[i]; break;
      }
    }
    if (!logo) { dbg('logo img not found'); return 0; }
    if (logo.dataset.helixLogoInit) return 1;
    logo.dataset.helixLogoInit = '1';

    logo.style.cursor = 'pointer';
    logo.classList.add('footer-logo-clickable');
    logo.setAttribute('role', 'link');
    logo.setAttribute('tabindex', '0');
    logo.setAttribute('aria-label', '홈으로 이동');

    function go(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (location.pathname === '/' || location.pathname === '') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        location.href = '/';
      }
      dbg('logo click → /');
    }

    logo.addEventListener('click', go);
    logo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') go(e);
    });

    /* 로고 컨테이너가 <a> 인 경우 중복 네비게이션 방지: 부모 a 의 href 만
       유지하고 우리 핸들러에 위임 (동일 동작) */
    return 1;
  }

  /* SCROLL-TO-TOP BUTTON (.div-block-141) — JS 관여 0
     이 버튼은 Webflow Designer (IX2 / Sticky 등) 에서 통제. footer.js 는
     아무 것도 안 함. v1~v3 시도 모두 IX2 와 경합으로 회귀했던 학습 결과. */

  /* ============================================================
     초기화 — 푸터 요소가 늦게 들어오는 경우 대비 retry + observer
  ============================================================ */
  var initialized = false;

  /* ============================================================
     글로벌 mailto: 가로채기 — footer detect 와 무관하게 모든 mailto 링크를
     클립보드 복사 + 토스트로 변환. Webflow 가 footer 클래스를 바꾸거나
     이메일 텍스트를 <a href="mailto:..."> 안에 넣은 경우도 커버.
  ============================================================ */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    var raw = (a.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0];
    var email = decodeURIComponent(raw).trim();
    if (!email) return;
    copyText(email).then(function () {
      showToast('복사완료 · ' + email);
      dbg('mailto link copied:', email);
    });
  }, true);

  /* ============================================================
     LINK PROTECTION — 푸터 내 모든 실제 <a href> 링크가 항상 이동되도록.
     coming-soon.js 가 캡처 단계 click 핸들러로 a[href] 기본 이동을 막을 수
     있는데, 어떤 페이지의 마커 셀렉터가 우연히 푸터 요소와 매칭되면 푸터
     링크가 토스트만 뜨고 이동 안 되는 사고가 발생함 (예: about 페이지의
     '.cta-style' 마커). 푸터 내 유효한 href 를 가진 <a> 에는 coming-soon
     EXEMPT 어트리뷰트를 명시 부여 → 어떤 마킹과도 무관하게 정상 이동.
     mailto/tel/# 링크는 다른 핸들러가 처리하므로 EXEMPT 부여 안 함.
  ============================================================ */
  function protectFooterLinks(footer) {
    var anchors = footer.querySelectorAll('a[href]');
    var n = 0;
    anchors.forEach(function (a) {
      var href = (a.getAttribute('href') || '').trim();
      if (!href) return;
      if (href === '#' || href.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.dataset.helixLinkProtected) return;
      a.dataset.helixLinkProtected = '1';
      /* coming-soon.js 의 findBlockedTarget 은 가까운 EXEMPT 가 있으면
         차단하지 않음. 링크 자체에 부여 → 자손 click 도 안전. */
      if (!a.hasAttribute('data-coming-soon-exempt')) {
        a.setAttribute('data-coming-soon-exempt', '1');
      }
      n++;
    });
    if (n) dbg('footer link protection: ' + n + ' anchors marked exempt');
    return n;
  }

  function init() {
    if (initialized) return true;
    var footer = findFooter();
    /* 푸터를 못 찾으면 body 전역 스캔 절대 안 함 — 헤더 로고/네비/히어로
       img·이메일 패턴에 잘못 바인딩되어 시각 회귀 일으키는 사고 차단.
       footer 가 들어올 때까지 retry/observer 로 대기. */
    if (!footer) { dbg('footer not yet, will retry'); return false; }

    var emails = initEmailCopy(footer);
    var snsImgs = findSnsImages(footer);
    var sns    = bindSnsImages(snsImgs);
    var logo   = initLogoLink(footer, snsImgs);
    var links  = protectFooterLinks(footer);

    if (emails || sns || logo || links) {
      initialized = true;
      log('initialized (email=' + emails + ', sns=' + sns + ', logo=' + logo + ', links=' + links + ', footerFound=' + !!footer + ')');
      return true;
    }
    return false;
  }

  function retry() {
    var n = 0;
    var iv = setInterval(function () {
      if (init() || ++n >= 50) clearInterval(iv);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retry);
  } else {
    retry();
  }
  window.addEventListener('load', retry);
  window.Webflow = window.Webflow || [];
  window.Webflow.push(retry);

  /* DOM 변경 감지 — Native 컴포넌트가 늦게 hydrate 되는 경우 대비 */
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () {
      if (!initialized) init();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    /* 10s 후 observer 해제 (메모리 절약) */
    setTimeout(function () { mo.disconnect(); }, 10000);
  }
})();
