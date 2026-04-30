/* ================================================================
   FOOTER INTERACTIONS
   - 이메일 텍스트 클릭 → 클립보드 복사 + 토스트 피드백
   - SNS 아이콘 클릭 → 외부 링크 새 탭 오픈

   푸터는 Webflow Native 컴포넌트(.footer)로 캡슐화되어 있지만 DOM 으로
   렌더링될 때는 내부 클래스(.text-block-27, .image-21/22)가 그대로 노출됨.

   이메일은 클래스 의존도를 줄이기 위해 텍스트가 이메일 패턴인지 검사
   (혹시 클래스명 변경되더라도 깨지지 않도록).
   ================================================================ */

(function () {
  'use strict';

  if (window.__HELIX_FOOTER_INIT__) return;
  window.__HELIX_FOOTER_INIT__ = true;

  var DEBUG = /[?&]debug-footer=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[Footer]'].concat([].slice.call(arguments)));
  } : function () {};

  /* SNS 링크 매핑 — 컴포넌트 내부 이미지 슬롯 순서대로
     Image 21 (왼쪽) = 인스타그램
     Image 22 (오른쪽) = 네이버 블로그 */
  var SNS_LINKS = {
    'image-21': 'https://www.instagram.com/helix_amc/',
    'image-22': 'https://blog.naver.com/helix_amc'
  };

  var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.left = '-9999px';
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
    /* 원본 보존: 한 번만 저장 (연속 클릭 안전) */
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
    return document.querySelector('section.footer') ||
           document.querySelector('.footer') ||
           null;
  }

  function initEmailCopy(footer) {
    /* 이메일 텍스트를 가진 가장 안쪽 텍스트 노드 보유 요소 탐색
       (text-block-27 외 다른 클래스로 바뀌어도 동작하도록 패턴 매칭) */
    var candidates = footer.querySelectorAll('div, p, span, a');
    candidates.forEach(function (el) {
      /* 부모-자식 모두 매칭되는 경우를 피하려고 직계 텍스트 검사 */
      var hasOwnEmailText = false;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === 3 && EMAIL_RE.test(n.textContent || '')) {
          hasOwnEmailText = true;
          break;
        }
      }
      if (!hasOwnEmailText) return;
      if (el.dataset.helixEmailInit) return;
      el.dataset.helixEmailInit = '1';

      el.style.cursor = 'pointer';
      el.classList.add('footer-email-clickable');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', '이메일 주소 복사');

      function handleCopy(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var src = el.dataset.helixOrig || el.innerText;
        var match = src.match(EMAIL_RE);
        if (!match) return;
        var email = match[0];
        copyText(email).then(function () {
          flashFeedback(el, '복사완료 ' + email);
          log('email copied:', email);
        });
      }

      el.addEventListener('click', handleCopy);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') handleCopy(e);
      });
      log('email handler bound:', el);
    });
  }

  function initSnsLinks(footer) {
    Object.keys(SNS_LINKS).forEach(function (cls) {
      var url = SNS_LINKS[cls];
      var imgs = footer.querySelectorAll('.' + cls);
      imgs.forEach(function (img) {
        if (img.dataset.helixSnsInit) return;
        img.dataset.helixSnsInit = '1';

        img.style.cursor = 'pointer';
        img.classList.add('footer-sns-icon');
        img.setAttribute('role', 'link');
        img.setAttribute('tabindex', '0');
        img.setAttribute('aria-label', cls === 'image-21' ? 'Instagram' : 'Naver Blog');

        function go(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          window.open(url, '_blank', 'noopener,noreferrer');
          log('sns open:', url);
        }

        img.addEventListener('click', go);
        img.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') go(e);
        });
      });
    });
  }

  function init() {
    var footer = findFooter();
    if (!footer) { log('footer not found, retry'); return false; }
    initEmailCopy(footer);
    initSnsLinks(footer);
    log('initialized');
    return true;
  }

  function retry() {
    var n = 0;
    var iv = setInterval(function () {
      if (init() || ++n >= 30) clearInterval(iv);
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
})();
