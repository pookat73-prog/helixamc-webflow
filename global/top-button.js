/* ================================================================
   HELIX AMC — GLOBAL TOP BUTTON (code-rendered)
   - body 에 .helix-top-btn 주입 (모든 페이지 공통)
   - 항상 표시, 클릭 시 smooth scroll to top
   - 푸터 진입 시 bottom 을 동적으로 올려 푸터 위 1.5vw 까지만 따라옴
   - 디자이너에 남아있는 legacy .link-block-11 인스턴스는 런타임 제거
   ================================================================ */
(function () {
  'use strict';

  var DEBUG = /[?&]debug-topbtn=1/.test(location.search);
  function dbg(){ if(DEBUG) console.log.apply(console, ['[top-btn]'].concat([].slice.call(arguments))); }

  /* 화살표는 인라인 SVG(대칭·뷰박스 정중앙)로 렌더 — 외부 애셋 내부가
     비대칭이라 라벨과 어긋나 보이던 문제 제거 + CDN 의존 제거 */
  var GAP_VW = 1.5;

  var btn = null;
  var baseBottomPx = 0;
  var rafId = 0;

  function purgeLegacy() {
    var nodes = document.querySelectorAll('a.link-block-11, .link-block-11');
    var n = 0;
    nodes.forEach(function (el) {
      if (el.classList && el.classList.contains('helix-top-btn')) return;
      el.remove();
      n++;
    });
    if (n) dbg('purged legacy nodes:', n);
  }

  function inject() {
    if (btn && document.body.contains(btn)) return btn;
    btn = document.createElement('a');
    btn.className = 'helix-top-btn';
    btn.href = '#';
    btn.setAttribute('aria-label', '맨 위로');
    /* 아이콘만(글자 제거) — '맨 위로' 의미의 바+화살표. 접근성은 앵커의
       aria-label="맨 위로" 로 유지. */
    btn.innerHTML =
      '<div class="helix-top-btn__box">' +
        '<svg class="helix-top-btn__icon" viewBox="0 0 24 24" fill="none"' +
          ' stroke="#ffffff" stroke-width="2" stroke-linecap="round"' +
          ' stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M7 5.4H17"/><path d="M12 19V9.2"/><path d="M7.4 13.6L12 9l4.6 4.6"/>' +
        '</svg>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
    dbg('injected');
    return btn;
  }

  function findFooter() {
    return (
      document.querySelector('section.footer') ||
      document.querySelector('.footer') ||
      document.querySelector('footer') ||
      document.querySelector('section[class*="footer" i]') ||
      document.querySelector('[class*="footer" i]:not([class*="-bar" i])')
    );
  }

  function readBase() {
    if (!btn) return;
    btn.style.bottom = '';
    var v = parseFloat(getComputedStyle(btn).bottom);
    baseBottomPx = isFinite(v) ? v : 0;
    dbg('base bottom=', baseBottomPx + 'px');
  }

  /* 다른 플로팅 요소들 (리뉴얼 바, 지점 CTA 카드 등) 과도 겹치지 않게.
     화면 하단에 떠 있는 임의의 fixed 요소 위로 항상 GAP_VW 띄움. */
  var FLOATING_SELECTORS = [
    '.helix-renewal-bar.is-open',
    '.helix-branch-cta.is-mounted',
    '.hx-fcta-btn'              /* 플로팅 상담 버튼 — 항상 떠 있음. 위로가기를 그 위로 */
  ];

  function update() {
    rafId = 0;
    if (!btn) return;
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var gapPx = (GAP_VW / 100) * vw;

    /* 1) 푸터 overlap */
    var maxOverlap = 0;
    var footer = findFooter();
    if (footer) {
      var fRect = footer.getBoundingClientRect();
      if (fRect.top < vh) maxOverlap = Math.max(maxOverlap, vh - fRect.top);
    }

    /* 2) 다른 플로팅 요소들 — 본인 제외, 화면 안에 있는 것만 */
    FLOATING_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el === btn || btn.contains(el)) return;
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.top >= vh) return;
        var occupy = vh - r.top;
        if (occupy > maxOverlap) maxOverlap = occupy;
      });
    });

    if (maxOverlap === 0) {
      if (btn.style.bottom) btn.style.bottom = '';
      return;
    }
    var clamped = maxOverlap + gapPx;
    if (clamped <= baseBottomPx) {
      if (btn.style.bottom) btn.style.bottom = '';
      return;
    }
    btn.style.bottom = clamped + 'px';
  }

  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(update);
  }

  function boot() {
    purgeLegacy();
    inject();
    readBase();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { readBase(); schedule(); });
    schedule();

    /* 플로팅 요소 (리뉴얼 바, 지점 CTA, 그 안 펼침/접힘) 가 변할 때
       오프셋 갱신. body 의 자식 추가/제거 + class 변경 감지. */
    try {
      var mo2 = new MutationObserver(schedule);
      mo2.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    } catch (e) {}
    /* Webflow IX2 가 늦게 legacy 를 다시 박을 수 있어 짧게 반복 정리 */
    var n = 0;
    var iv = setInterval(function () {
      purgeLegacy();
      schedule();
      if (++n >= 30) clearInterval(iv);
    }, 200);
    dbg('initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
