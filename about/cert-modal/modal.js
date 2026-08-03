/* ================================================================
   About 인증 카드 "+" 상세보기 모달 (v1.7)

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

   v1.3 — 모달 검수 수정. 카드 비율 깨짐(폭 확정 후 max-height 로 높이를
   자르면 aspect-ratio 무효), 눈 아이콘으로 끈 섹션이 PC 에서 되살아나던
   회귀, PC 인디케이터 점 대비, 태블릿 내용 잘림.

   v1.4 — 휴대폰에서 상세 내용 세로 재배치. 상세 페이지에 모바일
   브레이크포인트가 없고 데스크톱 가로 2단 + vw 고정폭으로만 짜여 있어,
   휴대폰에선 칸이 반씩 쪼개져 글줄이 몇 글자마다 끊겼음
   (reflowSlideForMobile 참고).

   v1.5 — (a) 짝 없이 숨겨진 본문 되살리기. 일부 섹션은 본문 묶음
   (.grid2)을 휴대폰 폭에서 끄면서 대신 보여줄 .grid2_m 을 안 만들어둬,
   슬라이드가 제목과 푸터만 남고 본문이 통째로 사라졌음 (고양이 인증
   2번째 섹션). 짝이 없을 때만 되살린다 — reviveOrphanHidden.
   (b) v1.4 에서 이미지에 무조건 걸던 max-width:100% 가, 원래 %로 작게
   잡아둔 푸터 로고(max-width:19%)까지 덮어써 화면 가득 커지던 문제 —
   실제로 넘칠 때만 제한하도록 수정.

   v1.6 — 응급 인증 표지에서 왼쪽 인증마크 높이를 옆 제목·본문 덩어리에
   맞춤 (fitCoverMark 참고). 마크 칸 높이가 200px 로 못 박혀 있어
   오른쪽보다 짧게 떠 어긋나 보이던 문제.

   v1.7 — (a) 고양이 인증 표지도 마크를 키움. 가로로 긴 마크(1311×697)라
   높이를 맞추면 폭이 과해지므로, 폭을 가로줄의 40% 로 잡고 세로는 마크
   윗변을 제목 윗변에 맞춤 (COVER_MARK_FIT 의 width 모드 + align).
   (b) 설명 상자의 테두리·구분선·제목 색을 인증마크에서 뽑은 색으로 통일.
   테두리 클래스(.div-block-79-copy)가 세 상세 페이지 공용이라 어느 인증을
   열든 AAHA 레드가 나오고, 고양이만 구분선·제목이 핑크라 상자 안에서 색이
   따로 놀던 문제. 모달에 data-cert(슬러그)를 달아 modal.css 가 인증별로
   가른다.
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
  var currentSlug = null;

  var MOBILE_MAX = 767;
  function isMobileView() { return window.innerWidth <= MOBILE_MAX; }

  /* ----------------------------------------------------------------
     모달 안 상세 내용 세로 재배치 (휴대폰 전용)
     ----------------------------------------------------------------
     인증 상세 페이지는 모바일 브레이크포인트가 없고 데스크톱 가로 2단 +
     vw 고정폭으로만 짜여 있다. 그대로 휴대폰에 띄우면 칸이 반씩 쪼개져
     빨간 박스가 34vw(=160px)까지 좁아지고 글줄이 몇 글자마다 끊긴다.

     클래스 이름이 12개 섹션마다 제각각(aaha-box / grid2 / flex-block-61
     / div-block-83 ...)이라 이름을 일일이 박는 대신, 계산된 배치를 읽어
     "가로로 늘어선 묶음"과 "화면보다 한참 좁은 글상자"를 찾아 세로 1단 +
     전체 폭으로 되돌린다.

     인라인 스타일은 라이브 DOM 에만 붙는다. 슬라이드는 매번 캐시된
     HTML 문자열에서 다시 만들어지므로 캐시가 오염되지 않는다. */
  function elementChildren(el) {
    return Array.prototype.filter.call(el.children, function (c) {
      return c.nodeType === 1;
    });
  }

  function hasOwnText(el) {
    return !!(el.textContent || '').trim();
  }

  function classListOf(el) {
    var cn = el.className;
    if (typeof cn !== 'string') return [];       // SVG 등은 문자열이 아님
    return cn.split(/\s+/).filter(Boolean);
  }

  /* 짝 없이 숨겨진 본문 묶음 되살리기.
     상세 페이지는 섹션에 따라 본문 묶음(.grid2)을 휴대폰 폭에서
     display:none 으로 꺼두는데, 대신 보여줄 모바일 묶음(.grid2_m)을
     안 만들어둔 섹션이 있다. 그대로 두면 슬라이드가 제목과 푸터만 남고
     본문이 통째로 사라진다 (고양이 인증 2번째 섹션).

     - 눈 아이콘(인라인 display:none)으로 끈 것은 손대지 않음
     - 모바일 전용(_M) 묶음은 되살리지 않음 (데스크톱 폭에서 숨는 게 정상)
     - 옆에 짝(_M)이 있으면 그대로 둠 — 되살리면 같은 내용이 두 번 나옴
     - 글이 거의 없는 장식용 요소도 제외 */
  function reviveOrphanHidden(sec) {
    Array.prototype.forEach.call(sec.querySelectorAll('*'), function (el) {
      if (/display\s*:\s*none/i.test(el.getAttribute('style') || '')) return;

      var cs;
      try { cs = window.getComputedStyle(el); } catch (_) { return; }
      if (!cs || cs.display !== 'none') return;

      var classes = classListOf(el);
      if (!classes.length) return;
      if (classes.some(function (c) { return /_m$/i.test(c); })) return;

      if ((el.textContent || '').trim().length < 20) return;

      var parent = el.parentElement;
      if (!parent) return;
      var hasCounterpart = elementChildren(parent).some(function (sib) {
        if (sib === el) return false;
        var sc = classListOf(sib).join(' ').toLowerCase();
        return classes.some(function (c) {
          return sc.indexOf(c.toLowerCase() + '_m') !== -1;
        });
      });
      if (hasCounterpart) return;

      /* 되살릴 때 원래 display 값을 알 수 없으므로(none 으로 덮여 있음),
         칸이 여럿이면 flex 세로로 — 아래 재배치가 이어서 1단으로 정리하고
         grid 간격(row-gap)은 flex 에서도 그대로 먹는다. */
      var many = elementChildren(el).length >= 2;
      el.style.setProperty('display', many ? 'flex' : 'block', 'important');
      if (many) el.style.setProperty('flex-direction', 'column', 'important');
    });
  }

  function reflowSlideForMobile(slide) {
    if (!slide) return;
    var sec = slide.firstElementChild;
    if (!sec) return;
    var inner = sec.clientWidth;
    if (!inner) return;

    /* 숨은 본문을 먼저 되살린 뒤 배치를 정리해야 되살린 것도 함께 정리됨 */
    reviveOrphanHidden(sec);

    var nodes = sec.querySelectorAll('*');
    Array.prototype.forEach.call(nodes, function (el) {
      var tag = el.tagName;
      if (tag === 'BR' || tag === 'SCRIPT' || tag === 'STYLE') return;

      var cs;
      try { cs = window.getComputedStyle(el); } catch (_) { return; }
      if (!cs || cs.display === 'none') return;

      if (tag === 'IMG' || tag === 'SVG') {
        /* 넘칠 때만 폭을 제한한다.
           무조건 max-width:100% 를 걸면, 원래 %로 작게 잡아둔 이미지
           (푸터 로고 .image-31 은 max-width:19%)의 제한까지 덮어써서
           화면 가득 커진다. 실제로 부모 밖으로 나갈 때만 손댈 것. */
        var parent = el.parentElement;
        var limit = parent ? parent.clientWidth : inner;
        var shown = 0;
        try { shown = el.getBoundingClientRect().width; } catch (_) {}
        if (limit > 0 && shown > limit + 1) {
          el.style.setProperty('max-width', '100%', 'important');
          el.style.setProperty('height', 'auto', 'important');
        }
        return;
      }

      var kids = elementChildren(el);

      /* 1) 가로로 늘어선 묶음 → 세로 1단 */
      if (cs.display === 'grid' || cs.display === 'inline-grid') {
        var cols = (cs.gridTemplateColumns || '').trim().split(/\s+/).length;
        if (cols > 1) {
          el.style.setProperty('grid-template-columns', '1fr', 'important');
          el.style.setProperty('grid-auto-flow', 'row', 'important');
        }
      } else if (cs.display === 'flex' || cs.display === 'inline-flex') {
        if ((cs.flexDirection || 'row').indexOf('row') === 0 && kids.length >= 2) {
          el.style.setProperty('flex-direction', 'column', 'important');
        }
        /* 세로 묶음의 자식이 내용 폭만큼 쪼그라들지 않게 폭을 채움.
           (데스크톱은 align-items:center 라 휴대폰에선 로고·박스가
           가운데에서 작게 뭉침) */
        el.style.setProperty('align-items', 'stretch', 'important');
      }

      /* 2) 이미지만 든 상자 — 데스크톱 vw 높이 기준이라 휴대폰에선
            우표만 해짐. 높이 제한을 풀고 화면 폭 기준으로 다시 키움. */
      if (!hasOwnText(el) && kids.length === 1 && kids[0].tagName === 'IMG') {
        var h = parseFloat(cs.height) || 0;
        if (h > 0 && h < inner * 0.34) {
          el.style.setProperty('height', 'auto', 'important');
          var im = kids[0];
          im.style.setProperty('width', Math.round(inner * 0.42) + 'px', 'important');
          im.style.setProperty('height', 'auto', 'important');
          im.style.setProperty('margin-left', 'auto', 'important');
          im.style.setProperty('margin-right', 'auto', 'important');
        }
        return;
      }

      /* 3) 화면보다 한참 좁은 글상자 → 폭 채우기 (vw 고정폭 잔재) */
      if (hasOwnText(el)) {
        var w = parseFloat(cs.width) || 0;
        if (w > 0 && w < inner * 0.86) {
          el.style.setProperty('width', '100%', 'important');
          el.style.setProperty('max-width', '100%', 'important');
        }
      }
    });
  }

  function reflowAllSlides() {
    if (!track || !isMobileView()) return;
    Array.prototype.forEach.call(track.children, reflowSlideForMobile);
  }

  /* ----------------------------------------------------------------
     표지 슬라이드 — 인증마크를 옆 덩어리 높이에 맞춤 (PC 폭 전용)
     ----------------------------------------------------------------
     표지는 [왼쪽 인증마크] + [오른쪽 제목 + 설명 상자] 두 칸이 가로로 선다.
     마크 칸(.div-block-81)이 높이 200px 로 못 박혀 있어 오른쪽 덩어리보다
     짧게 뜨고, 위아래로 여백이 남아 두 칸이 어긋나 보였다.

     마크 높이를 오른쪽 덩어리에 맞춘다. 마크는 비율이 고정이라 높이가
     커진 만큼 가로도 넓어지므로, 오른쪽 설명 상자의 고정폭(34vw)도 함께
     풀어 남는 폭만 쓰게 한다. 안 풀면 두 칸을 합친 줄이 카드 안쪽 폭을
     넘겨 좌우로 삐져나간다 (modal.css 의 배지 폭 상한 주석 참고).

     오른쪽이 좁아지면 글줄이 늘어 다시 높아진다 — 그래서 한 번에 맞추지
     않고 몇 번 되풀이해 수렴시킨다.

     마크 원본 비율이 인증마다 달라 맞추는 방식을 둘로 나눈다.

     - match : 마크 높이를 옆 덩어리에 맞춘다. 정사각(응급 1575×1575)처럼
               높이를 키워도 폭이 감당되는 마크용.
     - width : 마크 폭을 가로줄의 일정 비율로 잡고 높이는 비율대로 따라간다.
               가로로 긴 마크(고양이 1311×697)는 높이를 맞추면 폭이 높이의
               1.88배까지 벌어져 옆 글칸이 지나치게 좁아진다. 대신 지금보다
               넉넉히 키운다. 높이가 옆 덩어리보다 낮을 수밖에 없으므로
               align 으로 세로 위치를 정한다 — flex-start 면 마크 윗변이
               제목 윗변과 나란해진다.

     AAHA(세로로 긴 300×375)는 아직 손대지 않는다. */
  var COVER_MARK_FIT = {
    '/emergency-cert': { mode: 'match', maxRowRatio: 0.46 },
    '/cat-cert':       { mode: 'width', rowRatio: 0.40, align: 'flex-start' }
  };

  function fitCoverMark(slide) {
    if (!slide || isMobileView()) return;   /* 휴대폰은 세로 1단이라 해당 없음 */
    var cfg = COVER_MARK_FIT[currentSlug];
    if (!cfg) return;

    var sec = slide.firstElementChild;
    if (!sec) return;
    var img = sec.querySelector('img.cert_shedow');
    if (!img) return;
    var cell = img.parentElement;              /* 마크 칸 */
    var row = cell && cell.parentElement;      /* 두 칸을 담은 가로줄 */
    if (!row) return;

    var side = elementChildren(row).filter(function (c) { return c !== cell; });
    if (!side.length) return;

    /* 이미지가 아직 안 받아졌으면 원본 비율을 알 수 없다 — 도착한 뒤 다시 */
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      img.addEventListener('load', function () { fitCoverMark(slide); },
        { once: true });
      return;
    }

    var rowWidth = row.clientWidth || 0;
    if (!rowWidth) return;
    var ratio = img.naturalWidth / img.naturalHeight;

    /* 오른쪽 칸 — 폭은 원래대로 두되, 마크에 밀려 자리가 모자라면 줄어들게.
       (flex 를 1 로 주면 반대로 남는 폭까지 차지해 되레 넓어진다) */
    side.forEach(function (el) {
      el.style.setProperty('flex', '0 1 auto', 'important');
      el.style.setProperty('min-width', '0', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      Array.prototype.forEach.call(el.querySelectorAll('*'), function (d) {
        d.style.setProperty('max-width', '100%', 'important');
      });
    });

    /* 마크 — modal.css 의 폭 상한(200px)을 풀고 높이 기준으로 크기를 잡는다.
       칸의 width 까지 함께 박아야 한다. 안 그러면 칸 폭을 정할 때 이미지의
       원본 크기(1575px)가 기준이 돼 줄이 터진다. */
    cell.style.setProperty('flex', '0 0 auto', 'important');
    img.style.setProperty('max-width', 'none', 'important');
    img.style.setProperty('max-height', 'none', 'important');
    img.style.setProperty('width', 'auto', 'important');
    img.style.setProperty('height', '100%', 'important');

    /* 가로로 긴 마크 — 폭을 기준으로 잡는다. 옆 높이를 쫓아가지 않으므로
       되풀이할 것도 없다. */
    if (cfg.mode === 'width') {
      var w = Math.round(rowWidth * cfg.rowRatio);
      cell.style.setProperty('width', w + 'px', 'important');
      cell.style.setProperty('height', Math.round(w / ratio) + 'px', 'important');
      if (cfg.align) cell.style.setProperty('align-self', cfg.align, 'important');
      return;
    }

    /* 마크가 커지면 오른쪽이 좁아져 다시 높아진다 — 몇 번 되풀이해 수렴 */
    var maxMarkWidth = rowWidth * cfg.maxRowRatio;
    for (var i = 0; i < 4; i++) {
      var target = 0;
      side.forEach(function (el) {
        var h = el.getBoundingClientRect().height;
        if (h > target) target = h;
      });
      if (!target) return;
      if (target * ratio > maxMarkWidth) target = maxMarkWidth / ratio;
      cell.style.setProperty('height', Math.round(target) + 'px', 'important');
      cell.style.setProperty('width', Math.round(target * ratio) + 'px', 'important');
    }
  }

  function tuneCoverSlides() {
    if (!track) return;
    Array.prototype.forEach.call(track.children, function (slide) {
      fitCoverMark(slide);
    });
  }

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

    /* 화면 회전/창 크기 변경으로 모바일↔데스크톱 경계를 넘으면 다시 그림.
       세로 재배치는 인라인 스타일로 붙이므로, 가로로 돌렸을 때 그대로
       두면 데스크톱 폭인데도 1단으로 남는다. 캐시된 HTML 에서 다시
       만들 뿐이라 재요청은 없음. */
    var wasMobile = isMobileView();
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (!overlay || !overlay.classList.contains('is-open')) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var nowMobile = isMobileView();
        if (nowMobile === wasMobile) {
          reflowAllSlides();
          tuneCoverSlides();
          return;
        }
        wasMobile = nowMobile;
        if (currentSlug) open(currentSlug);
      }, 180);
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
    currentSlug = slug;
    /* 어떤 인증을 열었는지 CSS 가 알 수 있게 표시 — 설명 상자 테두리·구분선·
       제목을 그 인증마크의 색으로 맞추는 데 쓴다 (modal.css) */
    overlay.setAttribute('data-cert', slug);
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
        /* 레이아웃이 확정된 뒤 세로 재배치 (clientWidth 측정 필요) */
        reflowAllSlides();
        tuneCoverSlides();
        /* 글꼴이 늦게 도착하면 글줄 높이가 바뀐다 — 그 뒤 한 번 더 맞춤 */
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(tuneCoverSlides).catch(function () {});
        }
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
