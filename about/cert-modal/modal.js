/* ================================================================
   About 인증 카드 "+" 상세보기 모달 (v1.0)

   동작:
   - About 페이지에서 인증 카드의 "+" 버튼(컴포넌트 "동그라미+블루")은
     본래 /yiryojin, /yiryojin-copy, /yiryojin-copy-2 페이지로 새 탭 이동.
   - 본 스크립트가 그 링크 클릭을 가로채 모달을 열고, 해당 페이지를
     fetch 해서 <section> 들을 슬라이드로 보여줌.
   - 같은 사이트의 같은 Webflow 글로벌 CSS 가 이미 로드돼 있으므로
     섹션 클래스 스타일은 그대로 적용됨.

   캐시: 슬러그별로 한 번 fetch → 세션 동안 재사용.
   끝에서: 멈춤 (이전/다음 비활성). 인증 페이지 간 순환 X.
   ================================================================ */

(function () {
  'use strict';

  /* About 페이지에서만 동작 — 다른 페이지에 about/bootstrap.js 가 들어가도
     불필요한 클릭 가로채기 막기 위해 path 한정. */
  var ABOUT_PATHS = ['/discover-helix'];
  if (ABOUT_PATHS.indexOf(location.pathname.replace(/\/$/, '')) === -1) {
    /* 단, *.webflow.io 의 about 별칭 경로도 허용하려면 여기 확장 */
    /* 일단 path 매칭 안 되면 조용히 종료 */
    /* return; — 실제로는 about 페이지에만 about/bootstrap.js 가 붙으므로
       path 체크 없이도 안전. 그래도 보수적으로 매칭 안 되면 빠지지 않고
       이벤트 가로채기에서 슬러그 화이트리스트로 한 번 더 거른다. */
  }

  /* 모달이 가로챌 상세페이지 슬러그 (about 페이지의 + 버튼 링크 대상) */
  var DETAIL_SLUGS = ['/yiryojin', '/yiryojin-copy', '/yiryojin-copy-2'];

  var cache = Object.create(null);  // slug → string[] (section outerHTML 배열)
  var overlay = null;
  var track = null;
  var prevBtn = null;
  var nextBtn = null;
  var dotsEl = null;
  var currentIdx = 0;
  var currentCount = 0;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'helix-cert-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = [
      '<div class="helix-cert-modal__backdrop" data-close></div>',
      '<div class="helix-cert-modal__card">',
      '  <button class="helix-cert-modal__close" data-close aria-label="닫기">×</button>',
      '  <button class="helix-cert-modal__nav helix-cert-modal__nav--prev" data-prev aria-label="이전">◀</button>',
      '  <button class="helix-cert-modal__nav helix-cert-modal__nav--next" data-next aria-label="다음">▶</button>',
      '  <div class="helix-cert-modal__viewport">',
      '    <div class="helix-cert-modal__track"></div>',
      '  </div>',
      '  <div class="helix-cert-modal__dots"></div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);
    track = overlay.querySelector('.helix-cert-modal__track');
    prevBtn = overlay.querySelector('[data-prev]');
    nextBtn = overlay.querySelector('[data-next]');
    dotsEl = overlay.querySelector('.helix-cert-modal__dots');

    overlay.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
      else if (e.target.closest('[data-prev]')) go(currentIdx - 1);
      else if (e.target.closest('[data-next]')) go(currentIdx + 1);
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay || !overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); go(currentIdx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(currentIdx + 1); }
    });
  }

  function fetchSections(slug) {
    if (cache[slug]) return Promise.resolve(cache[slug]);
    return fetch(slug, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        /* body 직속 <section> 들. Webflow 의 .page-wrapper > main 같은 구조라
           descendant 셀렉터로 잡아도 헤더/푸터 안에 있는 section 은 거의 없음.
           안전하게 main 영역 우선, 없으면 body 전체. */
        var roots = doc.querySelectorAll('main section, body > .page-wrapper section, body section');
        var seen = Object.create(null);
        var out = [];
        roots.forEach(function (sec) {
          /* nav/header/footer 안에 있는 section 은 제외 */
          if (sec.closest('header, footer, nav')) return;
          /* 중복 (셀렉터 여러 개 OR 결합으로) 제거 */
          var key = sec.outerHTML.slice(0, 200);
          if (seen[key]) return;
          seen[key] = 1;
          out.push(sec.outerHTML);
        });
        cache[slug] = out;
        return out;
      });
  }

  function open(slug) {
    if (!overlay) buildOverlay();
    overlay.classList.add('is-open');
    document.documentElement.classList.add('helix-cert-modal-open');
    track.innerHTML = '<div class="helix-cert-modal__loading">불러오는 중...</div>';
    track.style.transform = 'translateX(0)';
    dotsEl.innerHTML = '';
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    fetchSections(slug)
      .then(function (htmls) {
        track.innerHTML = '';
        htmls.forEach(function (h) {
          var slide = document.createElement('div');
          slide.className = 'helix-cert-modal__slide';
          slide.innerHTML = h;
          track.appendChild(slide);
        });
        currentCount = htmls.length;
        buildDots(currentCount);
        go(0, true);
      })
      .catch(function (err) {
        track.innerHTML = '<div class="helix-cert-modal__loading">불러오기 실패: ' +
          (err && err.message ? err.message : '알 수 없는 오류') + '</div>';
      });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.documentElement.classList.remove('helix-cert-modal-open');
  }

  function buildDots(n) {
    dotsEl.innerHTML = '';
    if (n <= 1) return;
    for (var i = 0; i < n; i++) {
      var d = document.createElement('button');
      d.className = 'helix-cert-modal__dot';
      d.type = 'button';
      d.setAttribute('aria-label', '슬라이드 ' + (i + 1));
      d.dataset.idx = String(i);
      d.addEventListener('click', function (e) {
        go(parseInt(e.currentTarget.dataset.idx, 10));
      });
      dotsEl.appendChild(d);
    }
  }

  function go(idx, instant) {
    if (currentCount === 0) return;
    if (idx < 0) idx = 0;
    if (idx >= currentCount) idx = currentCount - 1;
    currentIdx = idx;
    if (instant) {
      var prevTransition = track.style.transition;
      track.style.transition = 'none';
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      /* 다음 프레임에 transition 복구 */
      requestAnimationFrame(function () { track.style.transition = prevTransition; });
    } else {
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    }
    Array.prototype.forEach.call(dotsEl.children, function (d, i) {
      d.classList.toggle('is-active', i === idx);
    });
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === currentCount - 1;
    /* 슬라이드 안 스크롤 위치는 매 전환 시 맨 위로 리셋 */
    var active = track.children[idx];
    if (active && active.scrollTo) active.scrollTo(0, 0);
  }

  function isDetailPath(pathname) {
    if (!pathname) return false;
    /* 끝의 / 제거 후 정확 매칭 */
    var p = pathname.replace(/\/$/, '');
    return DETAIL_SLUGS.indexOf(p) !== -1;
  }

  function markExempt() {
    /* coming-soon.js (capture 단계) 가 토스트로 가로채지 않도록
       상세페이지 링크에 exempt 속성 박음. coming-soon 의 findBlockedTarget
       이 위로 올라가며 EXEMPT_ATTR (data-coming-soon-exempt) 만나면 즉시 중단. */
    var anchors = document.querySelectorAll('a[href]');
    Array.prototype.forEach.call(anchors, function (a) {
      var url;
      try { url = new URL(a.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      if (!isDetailPath(url.pathname)) return;
      a.setAttribute('data-coming-soon-exempt', '1');
    });
  }

  function attach() {
    markExempt();
    /* Webflow IX2 / 컴포넌트가 늦게 마운트하는 경우 대비 — DOM 변경 감지
       시 다시 마킹. 5초 후 해제. */
    try {
      var mo = new MutationObserver(function () { markExempt(); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 5000);
    } catch (_) {}

    document.addEventListener('click', function (e) {
      /* 컴포넌트 인스턴스 클릭 시 가장 가까운 <a> 가 트리거 */
      var a = e.target.closest('a[href]');
      if (!a) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      if (!isDetailPath(url.pathname)) return;
      e.preventDefault();
      e.stopPropagation();
      open(url.pathname);
    }, true);
  }

  if (document.readyState !== 'loading') attach();
  else document.addEventListener('DOMContentLoaded', attach);
})();
