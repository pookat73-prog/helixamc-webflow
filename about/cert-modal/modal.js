/* ================================================================
   About 인증 카드 "+" 상세보기 모달 (v1.3)

   동작:
   - About 페이지에서 인증 카드의 "+" 버튼(컴포넌트 "동그라미+블루")은
     본래 /aaha-cert, /emergency-cert, /cat-cert 상세 페이지로 새 탭 이동.
   - 본 스크립트가 그 링크 클릭을 가로채 모달을 열고, 해당 페이지를
     fetch 해서 <section> 들을 슬라이드로 보여줌.
   - 같은 사이트의 같은 Webflow 글로벌 CSS 가 이미 로드돼 있으므로
     섹션 클래스 스타일은 그대로 적용됨.

   캐시: 슬러그별로 한 번 fetch → 세션 동안 재사용.
   끝에서: 멈춤 (이전/다음 비활성). 인증 페이지 간 순환 X.

   v1.1 — Webflow Designer 에서 숨겨둔(눈 아이콘 off) 섹션은 슬라이드에서
   제외. 안 그러면 빈 화면 슬라이드 + 인디케이터 점이 하나 더 생김
   (cat-cert 4번째 섹션이 숨김 상태였음).

   v1.2 — 모바일(≤767px) 전용 인증 배지 줄 추가.
   휴대폰에서는 인증 카드 3개가 세로로 길게 늘어져 한눈에 안 들어오고,
   ≤479px 에서는 Webflow 쪽 그리드가 아예 display:none 이라 인증이
   통째로 안 보였음. 그래서 모바일에선 카드 대신 "인증마크만" 떼어
   한 줄 3칸으로 크게 깔고, 탭하면 기존 상세 모달이 열리게 함
   (배지를 실제 <a href="/aaha-cert"> 로 만들어 아래 클릭 가로채기가
   그대로 처리 → 별도 경로 추가 없음).
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

  /* 모달이 가로챌 상세페이지 슬러그 (about 페이지의 + 버튼 링크 대상)
     새 슬러그 (번역어 통일):
     - /aaha-cert:      AAHA 인증
     - /emergency-cert: 응급 인증
     - /cat-cert:       고양이 인증
     구 로마자 슬러그(/cert-aaha, /yiryojin*)도 당분간 함께 유지 —
     Webflow 페이지 이름변경 배포 타이밍이 어긋나도 모달이 안 깨지도록.
     정식 반영 확인 후 아래 옛 항목들 제거 예정. */
  var DETAIL_SLUGS = [
    '/aaha-cert', '/emergency-cert', '/cat-cert',
    '/cert-aaha', '/yiryojin', '/yiryojin-copy', '/yiryojin-copy-2'
  ];

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

    /* GA4 — 인증 상세 모달 열림 측정 (어떤 인증 카드가 열렸는지 slug 로 구분) */
    try {
      var __dev = window.innerWidth <= 767 ? 'mobile' : 'desktop';
      var __p = { item_type: 'cert_modal', cert: slug, device: __dev };
      if (typeof window.gtag === 'function') {
        __p.transport_type = 'beacon';
        window.gtag('event', 'cert_modal_open_' + __dev, __p);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        __p.event = 'cert_modal_open_' + __dev;
        window.dataLayer.push(__p);
      }
    } catch (e) {}
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
        dropHiddenSlides();
        currentCount = track.children.length;
        buildDots(currentCount);
        go(0, true);
      })
      .catch(function (err) {
        track.innerHTML = '<div class="helix-cert-modal__loading">불러오기 실패: ' +
          (err && err.message ? err.message : '알 수 없는 오류') + '</div>';
      });
  }

  /* 안 보여야 하는 섹션 걸러내기 — "숨김" 두 종류를 구분해서 처리한다.

     (a) Designer 눈 아이콘 off → 인라인 style="display:none"
         → 의도적으로 뺀 것이므로 화면폭과 무관하게 항상 제외
     (b) 페이지 CSS 의 화면폭별 숨김 (.cert-modal-frame: ≥768px 이면 none)
         → 모달 안에서는 섹션이 곧 본문이라, 전부 (b) 로 숨은 경우엔
            강제로 켜야 함. 안 그러면 빈 슬라이드만 보임.

     둘을 합쳐서 "전부 숨김이면 아무것도 안 지움" 으로 처리하면, PC 에서
     (a) 로 끈 섹션까지 같이 되살아나 빈 슬라이드가 부활한다 (#1282 회귀).
     그래서 (a) 를 먼저 무조건 제거한 뒤 남은 것만 (b) 로 판정. */
  function dropHiddenSlides() {
    function drop(slide) { slide.parentNode.removeChild(slide); }
    function isCssHidden(slide) {
      var sec = slide.firstElementChild;
      if (!sec) return true;
      var cs;
      try { cs = window.getComputedStyle(sec); } catch (_) { return false; }
      return !!cs && cs.display === 'none';
    }

    var slides = Array.prototype.slice.call(track.children);

    /* 1단계 — Designer 에서 눈 아이콘으로 끈 섹션은 화면폭과 무관하게 항상 제외.
       Webflow 는 이 경우 인라인 style="display:none" 으로 내보낸다.
       (cat-cert 4번째 섹션이 이 상태 — #1282) */
    var eyeHidden = slides.filter(function (slide) {
      var sec = slide.firstElementChild;
      return !!sec && /display\s*:\s*none/i.test(sec.getAttribute('style') || '');
    });
    eyeHidden.forEach(drop);

    /* 2단계 — 남은 것 중 페이지 CSS 로 숨은 것 판정 */
    var rest = Array.prototype.slice.call(track.children);
    if (!rest.length) return;
    var cssHidden = rest.filter(isCssHidden);

    if (cssHidden.length === rest.length) {
      /* 남은 게 전부 숨김 — 상세 페이지 CSS 가 특정 화면폭에서만 보이도록
         해둔 상황 (.cert-modal-frame 은 ≥768px 에서 display:none, 모바일
         폭에서만 display:block). 예전엔 여기서 그냥 빠져서 빈 슬라이드만
         남았음. 모달 안에서는 섹션이 곧 본문이므로 강제로 켠다.

         눈 아이콘으로 끈 섹션은 1단계에서 이미 빠졌으므로, 여기서 켜지는
         것은 "원래 보여야 하는데 화면폭 때문에 숨은" 섹션들만. */
      overlay.classList.add('is-force-visible');
      return;
    }
    overlay.classList.remove('is-force-visible');
    cssHidden.forEach(drop);
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

  /* ----------------------------------------------------------------
     모바일 인증 배지 줄 — 인증마크만 떼어 한 줄 3칸
     ----------------------------------------------------------------
     각 인증 카드에서 (1) 마크 div (2) "+" 버튼의 링크 를 뽑아
     <a> 배지로 다시 조립한다. 마크는 원본 div 를 clone 해서 Webflow
     클래스(.div-block-157/158/159)를 그대로 들고 오므로 배경 이미지
     주소를 코드에 박아둘 필요가 없음 (이미지 교체돼도 따라감).
     보이기/숨기기는 CSS 미디어쿼리 담당 — JS 는 폭을 재지 않음
     (가로/세로 전환, 데스크톱 창 줄이기 모두 CSS 가 알아서 처리). */
  var CERTS = [
    { card: '.about_contents_box_ahha',  mark: '.div-block-159',
      slug: '/aaha-cert',      tag: 'AAHA',      kr: '미국동물병원협회' },
    { card: '.about_contents_box_veccs', mark: '.div-block-158',
      slug: '/emergency-cert', tag: 'VECCS',     kr: '응급·중환자 케어' },
    { card: '.about_contents_box_cfc',   mark: '.div-block-157',
      slug: '/cat-cert',       tag: 'CFC GOLD',  kr: '고양이 친화 진료소' }
  ];

  function buildMobileBadges() {
    var section = document.getElementById('cert');
    if (!section) return;
    /* 중복 생성 방지 — MutationObserver 나 재호출로 두 번 들어올 수 있음 */
    if (section.querySelector('.helix-cert-badges')) return;

    var grid = section.querySelector('.about_grid-3-_mid-align');
    var wrap = document.createElement('div');
    wrap.className = 'helix-cert-badges';

    var built = 0;
    CERTS.forEach(function (cert) {
      var card = section.querySelector(cert.card);
      if (!card) return;
      var mark = card.querySelector(cert.mark);
      if (!mark) return;

      /* 슬러그는 카드 안 "+" 버튼의 실제 href 를 우선 사용 —
         Webflow 에서 페이지 슬러그를 바꿔도 배지가 따라감. */
      var href = cert.slug;
      var plus = card.querySelector('a[href]');
      if (plus) {
        try {
          var u = new URL(plus.href, location.href);
          if (u.origin === location.origin && isDetailPath(u.pathname)) href = u.pathname;
        } catch (_) {}
      }

      var a = document.createElement('a');
      a.className = 'helix-cert-badge';
      a.href = href;
      a.setAttribute('aria-label', cert.kr + ' ' + cert.tag + ' 인증 상세 보기');
      /* coming-soon.js 토스트가 가로채지 않도록 면제 표시 (markExempt 와 동일) */
      a.setAttribute('data-coming-soon-exempt', '1');

      var markWrap = document.createElement('span');
      markWrap.className = 'helix-cert-badge__markwrap';

      var markClone = mark.cloneNode(false);
      markClone.classList.add('helix-cert-badge__mark');
      /* 원본에 IX2 등이 박아둔 인라인 크기/투명도는 배지에선 방해만 됨 */
      markClone.removeAttribute('data-w-id');
      markClone.style.removeProperty('opacity');
      markClone.style.removeProperty('width');
      markClone.style.removeProperty('height');
      markWrap.appendChild(markClone);

      var tag = document.createElement('span');
      tag.className = 'helix-cert-badge__tag';
      tag.textContent = cert.tag;

      var kr = document.createElement('span');
      kr.className = 'helix-cert-badge__kr';
      kr.textContent = cert.kr;

      a.appendChild(markWrap);
      a.appendChild(tag);
      a.appendChild(kr);
      wrap.appendChild(a);
      built++;
    });

    if (!built) return;
    if (grid && grid.parentNode) grid.parentNode.insertBefore(wrap, grid.nextSibling);
    else section.appendChild(wrap);
  }

  function attach() {
    markExempt();
    buildMobileBadges();
    /* Webflow IX2 / 컴포넌트가 늦게 마운트하는 경우 대비 — DOM 변경 감지
       시 다시 마킹. 5초 후 해제. */
    try {
      var mo = new MutationObserver(function () {
        markExempt();
        /* 인증 카드/"+"버튼이 늦게 마운트되는 경우 배지도 뒤늦게 조립.
           내부에서 중복 생성은 막으므로 여러 번 불려도 안전. */
        buildMobileBadges();
      });
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
