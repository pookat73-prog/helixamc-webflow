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

  function flashFeedback(el, msg) {
    if (!el.dataset.helixOrig) el.dataset.helixOrig = el.innerText;
    el.innerText = msg;
    el.classList.add('footer-email-copied');

    if (el._helixFeedbackTimer) clearTimeout(el._helixFeedbackTimer);
    el._helixFeedbackTimer = setTimeout(function () {
      el.innerText = el.dataset.helixOrig;
      el.classList.remove('footer-email-copied');
      delete el.dataset.helixOrig;
    }, 1600);
  }

  function findFooter() {
    /* Webflow Native 컴포넌트 .footer (section) — 가장 가능성 높은 selector
       부터 차례로 시도 */
    return document.querySelector('section.footer') ||
           document.querySelector('.footer') ||
           document.querySelector('section[class*="footer" i]') ||
           document.querySelector('[class*="footer" i]:not([class*="-bar" i])') ||
           null;
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
        var src = el.dataset.helixOrig || el.innerText;
        var match = src.match(EMAIL_RE);
        if (!match) return;
        var email = match[0];
        copyText(email).then(function () {
          flashFeedback(el, '복사완료 ' + email);
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

  function initSnsLinks(footer) {
    var imgs = findSnsImages(footer);
    if (!imgs.length) {
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
     초기화 — 푸터 요소가 늦게 들어오는 경우 대비 retry + observer
  ============================================================ */
  var initialized = false;

  function init() {
    if (initialized) return true;
    var footer = findFooter();
    if (!footer) { dbg('footer not found yet'); return false; }

    var emails = initEmailCopy(footer);
    var sns    = initSnsLinks(footer);

    if (emails || sns) {
      initialized = true;
      log('initialized (email=' + emails + ', sns=' + sns + ')');
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
