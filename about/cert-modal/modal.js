/* ================================================================
   About 인증 카드 "+" 상세보기 모달 (v2.3)

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
   맞춤. 마크 칸 높이가 200px 로 못 박혀 있어 오른쪽보다 짧게 떠 어긋나
   보이던 문제. → v1.9 에서 걷어냄.

   v1.7 — (a) 고양이 인증 표지도 마크를 키움. 가로로 긴 마크(1311×697)라
   높이를 맞추면 폭이 과해지므로, 폭을 가로줄의 40% 로 잡음.
   → v1.9 에서 걷어냄.
   (b) 설명 상자의 테두리·구분선·제목 색을 인증마크에서 뽑은 색으로 통일.
   → v1.10 에서 걷어냄.

   v1.9 — 표지 인증마크를 키우는 기능(v1.6 · v1.7a)을 통째로 걷어냄.
   세 인증에 규칙이 제각각이라 마크 폭이 달라졌고, 그만큼 옆 제목 칸의 폭도
   인증마다 달라져 제목 줄바꿈이 따로 놀았다. 규칙을 하나로 통일해봤지만
   (v1.8) 세 인증이 다 같이 어긋나 보여, 기능 자체를 뺀다. 이제 세 인증 모두
   modal.css 의 마크 폭 상한(200px)만 적용받아 같은 크기로 선다.
   인증별 색 통일(v1.7b)은 이 문제와 무관하므로 그대로 둔다.

   v1.10 — 인증별 색 통일(v1.7b)까지 걷어냄. 표지 어긋남을 코드 쪽에서
   하나씩 되짚는 중이라, 최근에 얹은 것을 순서대로 뺀다. 이로써 최근 배치
   (v1.6~v1.8)에서 얹은 것은 모두 빠졌고, 남은 것은 그 이전 상태 — 즉
   modal.css 의 마크 폭 상한(#1295)과 휴대폰 재배치(v1.4·v1.5)뿐이다.
   설명 상자 색은 다시 Webflow 원본 클래스 색(세 페이지 공용 AAHA 레드,
   고양이만 구분선 핑크)으로 돌아간다.

   v2.0 (되돌림) — 상세 페이지를 화면 너비로 펼친 뒤 축소해 보여주려 했으나,
   모달이 프레임 면적을 넘어 크게 떠서 되돌림. 모달은 상세 섹션
   (.cert-modal-frame) 이 디자인된 면적, 즉 960×540 만큼만 보여준다.

   v1.11 — 프레임 안쪽 덧칠을 걷어냄 (modal.css). 섹션을 카드 높이에 맞춰
   늘리고 마지막 묶음을 바닥에 붙이던 규칙, 인증마크 폭 상한 200px, 마크 칸
   가운데 정렬 — 셋 다 디자이너 화면과 간격·크기를 다르게 만들던 것들이라
   뺀다. 이제 PC 에서는 바깥 여백만 걷고 안쪽은 Webflow 가 그리는 그대로다.
   휴대폰(≤767px)·태블릿(≤991px) 재배치는 그대로 유지 — 카드가 디자인 폭
   960px 보다 좁아지는 구간이라 그대로 두면 내용이 잘린다.

   v2.1 — PC·태블릿에서 상세 페이지를 "고정 폭 틀"(iframe) 안에서 그린다.
   프레임(960×540)은 어느 창에서 보든 같은데 그 안 크기가 vw(창 너비 기준)라
   글자·상자만 창을 따라 변했다 — 넓은 창에서 내용이 프레임에 안 맞아 짜부돼
   보이고, 개발자도구로 폭을 고정하면 멀쩡해 보이던 것이 같은 이유다.
   확대·축소로는 못 고친다(통째로 줄여도 안쪽 비율은 그대로). 브라우저가 vw 를
   재는 기준을 바꿔야 하고, 그게 iframe 이다 — 틀 너비를 1440px 로 못 박아
   누가 어떤 창에서 보든 같은 그림이 나오게 한다. openWithFixedFrame 참고.
   휴대폰은 예전 방식(섹션 직접 심기 + 세로 1단) 그대로.

   v2.2 — 틀 안에서 영문 제목 글꼴이 기본 글꼴로 나오던 문제. Adobe(Typekit)
   글꼴은 스크립트가 실행되면서 글꼴 규칙을 문서에 넣어주는 방식인데, 틀 안에서는
   스크립트를 일부러 안 돌리기 때문. 스크립트는 계속 막아둔 채, 바깥 페이지에 이미
   들어와 있는 글꼴 규칙만 골라 틀 안으로 복사한다 (copyFontRules).

   v2.3 — v2.2 로는 글꼴이 안 잡혔다. 이 사이트는 글꼴 스타일시트를 주소로
   불러오지 않고(바깥에도 typekit 링크 0개) 스크립트가 규칙을 문서에 직접
   심는 방식이라, 태그를 복사하는 것만으로는 못 가져온다. 그래서 세 갈래로
   가져온다 — 링크 복사 / 문서에 들어와 있는 @font-face 규칙을 글자로 옮겨
   심기 / 이미 받아둔 글꼴 객체를 틀 안 문서에 등록. 아울러 한글이 단어
   중간에서 끊기던 것(합→니다)도 띄어쓰기에서만 끊기도록 바꾼다.

   v3.0 — 휴대폰도 "고정 폭 틀"(iframe) 로 통일. 상세 페이지에는 디자이너가
   이미 만들어 둔 휴대폰 화면이 들어 있다 (Webflow 의 좁은 화면 구간:
   2단으로 놓였던 본문이 세로 1단으로 바뀌고, 글자도 화면 폭에 맞게 커짐).
   그런데 예전 방식은 상세 페이지의 조각(section)을 소개 페이지 안으로
   옮겨 심는 것이라, 브라우저가 화면 폭을 "소개 페이지 기준" 으로 재고
   그 휴대폰 화면이 아예 켜지지 않았다. 그래서 코드가 배치를 하나하나
   추측해 되돌려야 했고(reflowSlideForMobile), 그 추측이 틀리는 만큼
   글상자가 좁게 뭉치거나 글씨가 깨알같이 작아졌다.

   이제는 휴대폰에서도 상세 페이지를 자기 화면(틀) 안에서 통째로 그린다.
   틀의 너비를 휴대폰 화면 너비로 맞추면, 브라우저가 그 틀을 기준으로
   폭을 재므로 디자이너가 만든 휴대폰 화면이 그대로 켜진다. 추측 배치가
   필요 없어지고, 어느 기기에서 보든 디자이너 화면과 같은 그림이 나온다.

   - 틀 너비는 휴대폰 화면 너비, 단 479px 을 넘지 않게 잡는다. 상세
     페이지의 세로 1단 디자인이 이 폭 이하에서만 켜지기 때문 — 조금 넓은
     휴대폰에서는 그 그림을 그대로 조금 확대해 보여준다.
   - 내용이 화면보다 길면 카드가 위아래로 스크롤된다 (틀 높이를 내용
     길이에 맞춰 잡고, 카드 쪽이 스크롤을 맡음).
   - 틀 안에서는 손가락 입력을 받지 않게 해 둔다 — 안 그러면 스크롤이
     틀에 먹혀 카드가 안 움직이는 기기가 있다. 상세 내용은 읽기 전용이라
     잃는 기능이 없다.
   - 예전 방식(조각 옮겨심기 + 추측 배치)은 틀을 못 여는 경우의 대비책으로
     그대로 남겨 둔다.
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
  var iframeEl = null;        /* 고정 폭 틀 — 없으면 섹션 직접 심기(대비책) 모드 */
  var iframeSections = [];    /* 그 틀 안의 상세 섹션들 */
  var isMobileFrame = false;  /* 지금 틀이 휴대폰 폭 기준인지 */

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
  function reviveOrphanHidden(sec, win) {
    var W = win || window;   /* 틀(iframe) 안 요소면 그 틀의 창으로 재야 함 */
    Array.prototype.forEach.call(sec.querySelectorAll('*'), function (el) {
      if (/display\s*:\s*none/i.test(el.getAttribute('style') || '')) return;

      var cs;
      try { cs = W.getComputedStyle(el); } catch (_) { return; }
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
      if (many) {
        el.style.setProperty('flex-direction', 'column', 'important');
        /* 원래 2단 그리드는 칸을 가운데로 모으게 잡혀 있다(align-items:center).
           세로 1단에서는 그 값이 글상자를 내용 폭만큼 좁게 만들어 가운데
           뭉치므로, 폭을 채우도록 되돌린다. */
        el.style.setProperty('align-items', 'stretch', 'important');
      }
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

  /* ----------------------------------------------------------------
     휴대폰 — 옆으로 나란히 붙은 채 남은 묶음만 세로로 세우기
     ----------------------------------------------------------------
     상세 페이지의 좁은 화면 규칙은 본문 묶음까지만 만들어져 있고, 표지
     (인증마크 + 제목·설명)는 가로 배치 그대로다. 그래서 휴대폰에서 둘이
     나란히 붙어 글 칸이 손가락만큼 좁아지고 글줄이 몇 글자마다 끊긴다.

     이미 세로로 서 있는 묶음(푸터 등)이나 글이 충분히 넓게 나오는 묶음은
     건드리지 않는다 — 좁은 화면 규칙이 제대로 켜진 장을 망가뜨리지 않도록,
     "글 칸이 실제로 좁을 때" 만 세운다. */
  var MOBILE_MIN_TEXT_RATIO = 0.55;   /* 글 칸이 이보다 좁으면 세로로 */
  var MOBILE_MIN_FONT = 13;           /* 이보다 작은 글자는 끌어올림 (px) */

  /* 덩이 사이 간격 — 상세 페이지는 간격도 화면폭 비례(1.3vw 등)로 잡혀 있어
     휴대폰에선 5px 밖에 안 된다(같은 값이 PC 에선 19px). 원래 비율
     (제목↔본문은 좁게, 덩이끼리는 넓게)은 지키면서 배로 늘린다. */
  var MOBILE_GAP_SCALE = 2.2;
  var MOBILE_MIN_GAP = 6;
  var MOBILE_MAX_GAP = 44;

  function fitMobileSection(sec, win) {
    if (!sec || sec.getAttribute('data-helix-mobile-fit') === '1') return;
    var W = win || window;
    var inner = sec.clientWidth;
    if (!inner) return;
    sec.setAttribute('data-helix-mobile-fit', '1');

    Array.prototype.forEach.call(sec.querySelectorAll('*'), function (el) {
      var cs;
      try { cs = W.getComputedStyle(el); } catch (_) { return; }
      if (!cs || cs.display === 'none') return;

      /* 좌우 여백이 화면 대비 과하면 줄인다. 좁은 단으로 만들려고 넣어둔
         큰 여백(16vw 짜리도 있다)이 휴대폰에선 글 칸을 절반으로 깎는다. */
      var pl = parseFloat(cs.paddingLeft) || 0;
      var pr = parseFloat(cs.paddingRight) || 0;
      if (pl + pr > inner * 0.18) {
        var side = Math.round(inner * 0.04);
        el.style.setProperty('padding-left', side + 'px', 'important');
        el.style.setProperty('padding-right', side + 'px', 'important');
      }

      var kids = elementChildren(el);
      if (kids.length < 2) return;

      /* 세로로 쌓인 덩이 사이 간격 벌리기 */
      var isCol = (cs.display === 'flex' || cs.display === 'inline-flex') &&
                  (cs.flexDirection || 'row').indexOf('column') === 0;
      if (isCol || cs.display === 'grid' || cs.display === 'inline-grid') {
        var gap = parseFloat(cs.rowGap) || 0;
        var want = Math.min(Math.max(gap * MOBILE_GAP_SCALE, MOBILE_MIN_GAP), MOBILE_MAX_GAP);
        if (want > gap) el.style.setProperty('row-gap', Math.round(want) + 'px', 'important');
      }

      var isRow = (cs.display === 'flex' || cs.display === 'inline-flex') &&
                  (cs.flexDirection || 'row').indexOf('row') === 0;
      var cols = 0;
      if (cs.display === 'grid' || cs.display === 'inline-grid') {
        cols = (cs.gridTemplateColumns || '').trim().split(/\s+/).length;
      }
      if (!isRow && cols < 2) return;

      var cramped = kids.some(function (k) {
        if (!hasOwnText(k)) return false;
        var w = 0;
        try { w = k.getBoundingClientRect().width; } catch (_) {}
        return w > 0 && w < inner * MOBILE_MIN_TEXT_RATIO;
      });
      if (!cramped) return;

      if (cols >= 2) {
        el.style.setProperty('grid-template-columns', '1fr', 'important');
        el.style.setProperty('grid-auto-flow', 'row', 'important');
      } else {
        el.style.setProperty('flex-direction', 'column', 'important');
        el.style.setProperty('align-items', 'stretch', 'important');
      }
      /* 세우고 나면 좌우로 벌어져 있던 간격이 위아래 간격이 된다 — 이것도
         화면폭 비례라 휴대폰에선 좁으므로 같이 늘린다. */
      var rowGap = parseFloat(cs.rowGap) || 0;
      el.style.setProperty(
        'row-gap',
        Math.round(Math.min(Math.max(rowGap * MOBILE_GAP_SCALE, MOBILE_MIN_GAP), MOBILE_MAX_GAP)) + 'px',
        'important'
      );
      kids.forEach(function (k) {
        k.style.setProperty('width', 'auto', 'important');
        k.style.setProperty('max-width', '100%', 'important');
      });

      /* 세운 묶음 안 정리 — 옆으로 나란히 놓는 걸 전제로 짜여 있어서,
         세로로 세우기만 하면 안쪽이 여전히 좁게 뭉친다.
           - 설명 상자에 폭이 화면폭 비례(34vw)로 박혀 있음: PC(1440 기준)
             에선 490px 이라 알맞지만 휴대폰에선 132px 밖에 안 된다
           - 칸들이 "내용 폭만큼만" 잡히게 돼 있어 왼쪽에 몰림
         → 글 상자는 폭을 채우고, 마크·이름·설명을 가운데로 모은다. */
      el.style.setProperty('align-self', 'stretch', 'important');
      el.style.setProperty('text-align', 'center', 'important');

      var groupW = el.clientWidth || inner;
      Array.prototype.forEach.call(el.querySelectorAll('*'), function (d) {
        var ds;
        try { ds = W.getComputedStyle(d); } catch (_) { return; }
        if (!ds || ds.display === 'none') return;

        if (/^(flex-start|start|baseline)$/.test(ds.alignSelf)) {
          d.style.setProperty('align-self', 'stretch', 'important');
        }
        if ((ds.display === 'flex' || ds.display === 'inline-flex') &&
            /^(flex-start|start)$/.test(ds.alignItems)) {
          d.style.setProperty('align-items', 'stretch', 'important');
        }

        /* 폭이 박혀 있어 좁게 남은 글 상자는 폭을 채운다 */
        var dw = 0;
        try { dw = d.getBoundingClientRect().width; } catch (_) {}
        if (hasOwnText(d) && dw > 0 && dw < groupW * 0.86) {
          d.style.setProperty('width', 'auto', 'important');
          d.style.setProperty('max-width', '100%', 'important');
        }

        if (/^(left|start)$/.test(ds.textAlign)) {
          d.style.setProperty('text-align', 'center', 'important');
        }
      });

      /* 그림은 칸이 넓어져도 칸 왼쪽에 붙어 있다 — 칸이 아니라 그림 자체를
         가운데로 보낸다 (좌우 여백을 자동으로 두면 남는 자리를 반씩 나눠
         가져 가운데에 선다). */
      Array.prototype.forEach.call(el.querySelectorAll('img'), function (im) {
        im.style.setProperty('display', 'block', 'important');
        im.style.setProperty('margin-left', 'auto', 'important');
        im.style.setProperty('margin-right', 'auto', 'important');
      });
    });

    /* 못 읽을 만큼 작은 글자 끌어올리기 — 안전장치.
       위 CSS 는 이름을 아는 것들만 손보므로, 인증 페이지마다 다른 이름을
       쓰는 요소가 남아 있을 수 있다. 실제로 잰 글자 크기가 기준보다 작을
       때만 올리고, 줄 간격도 원래 비율대로 따라 올린다. */
    Array.prototype.forEach.call(sec.querySelectorAll('*'), function (el) {
      if (!hasOwnText(el)) return;
      var hasTextChild = elementChildren(el).some(hasOwnText);
      if (hasTextChild) return;             /* 글이 실제로 놓인 말단만 */

      var cs;
      try { cs = W.getComputedStyle(el); } catch (_) { return; }
      if (!cs || cs.display === 'none') return;

      var fs = parseFloat(cs.fontSize);
      if (!(fs > 0) || fs >= MOBILE_MIN_FONT) return;

      var lh = parseFloat(cs.lineHeight);
      var ratio = lh > 0 ? lh / fs : 0;
      if (!(ratio > 1.05)) ratio = 1.4;     /* 줄 간격이 글자보다 좁게 잡힌 경우 */
      el.style.setProperty('font-size', MOBILE_MIN_FONT + 'px', 'important');
      el.style.setProperty('line-height', Math.round(MOBILE_MIN_FONT * ratio) + 'px', 'important');
    });

    /* 세로로 세우고 나면 이미지가 폭을 넘길 수 있다 (표지 인증마크는 폭
       제한이 풀려 있어 가로로 삐져나간다). 실제로 넘칠 때만 제한한다 —
       무조건 걸면 %로 작게 잡아둔 푸터 로고까지 화면 가득 커진다. */
    Array.prototype.forEach.call(sec.querySelectorAll('img'), function (im) {
      var parent = im.parentElement;
      var limit = parent ? parent.clientWidth : inner;
      var r;
      try { r = im.getBoundingClientRect(); } catch (_) { return; }
      if (!r || !(r.width > 0)) return;
      if (!(limit > 0) || r.width <= limit + 1) return;   /* 안 넘치면 그대로 */

      /* 칸에 높이가 정해져 있으면(표지 인증마크 칸은 200px) 그 높이를
         지키며 줄인다. 폭에 맞춰 늘리면 마크 하나가 화면을 가득 채운다. */
      var ph = 0;
      try { ph = parseFloat(W.getComputedStyle(parent).height) || 0; } catch (_) {}
      if (ph > 0 && r.height > ph + 1) {
        im.style.setProperty('max-height', '100%', 'important');
        im.style.setProperty('width', 'auto', 'important');
        im.style.setProperty('max-width', '100%', 'important');
        im.style.setProperty('margin-left', 'auto', 'important');
        im.style.setProperty('margin-right', 'auto', 'important');
        return;
      }
      im.style.setProperty('max-width', '100%', 'important');
      im.style.setProperty('height', 'auto', 'important');
    });
  }

  function reflowAllSlides() {
    /* 틀(iframe) 모드에서는 상세 페이지가 자기 화면을 스스로 켜므로
       이 추측 배치가 필요 없다 — 대비책으로 섹션을 직접 심었을 때만. */
    if (!track || !isMobileView() || iframeEl) return;
    Array.prototype.forEach.call(track.children, reflowSlideForMobile);
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
          layoutIframe();   /* 카드 폭이 바뀌면 틀 축소 비율도 다시 */
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

  /* ----------------------------------------------------------------
     PC·태블릿 — 상세 페이지를 "고정 폭 틀" 안에서 그린다
     ----------------------------------------------------------------
     상세 페이지는 크기가 vw(브라우저 창 너비 기준)로 짜여 있다 — 설명 상자
     34vw, 약칭 제목 1.58vw, 표지 제목 1.6vw. 그래서 프레임(960×540)은 어느
     창에서 보든 960×540 인데 그 안의 글자·상자만 창 너비를 따라 커졌다 작아진다.
     보는 사람 창 크기마다 다른 그림이 나오고, 창이 넓으면 내용이 프레임에
     안 맞아 짜부돼 보인다. 개발자도구에서 폭을 고정해 보면 멀쩡했던 이유다.

     확대·축소로는 못 고친다 — 통째로 줄여도 안쪽 비율은 그대로다. 브라우저가
     vw 를 계산하는 기준 자체를 바꿔야 하고, 그 방법이 iframe 이다. iframe 안에서
     vw 는 그 틀의 너비 기준으로 잡히므로, 틀 너비를 DESIGN_WIDTH 로 못 박으면
     누가 어떤 창에서 보든 항상 같은 그림이 나온다.

     틀은 DESIGN_WIDTH 로 넓게 두고, 그중 프레임(960×540)이 놓인 자리만 잘라
     카드에 보여준다. 카드가 960 보다 좁아지는 창에서는 그 비율만큼 통째로
     줄인다 — 이때는 안쪽 비율이 이미 고정돼 있으므로 그냥 작아지기만 한다.

     ⚠️ sandbox="allow-same-origin" (allow-scripts 없음) — 틀 안 페이지의
     스크립트를 아예 실행하지 않는다. 방문 측정이 중복으로 잡히는 것도,
     Webflow 인터랙션이 요소를 숨겨놓는 것도 함께 막힌다. 우리 쪽에서
     문서를 읽고 손보는 것은 same-origin 이라 그대로 된다.

     휴대폰(≤767px)도 같은 틀을 쓰되 틀 너비만 다르게 잡는다 (v3.0).
     1440px 짜리 그림을 손바닥만 하게 줄이면 글씨를 못 읽으므로, 틀 너비를
     휴대폰 화면 너비로 맞춰 상세 페이지가 스스로 휴대폰 화면을 켜게 한다.
     이 때 틀 안의 vw 도 휴대폰 폭 기준이 되어 글자 크기가 알아서 맞는다. */
  var DESIGN_WIDTH = 1440;   /* 상세 페이지가 디자인된 기준 창 너비 */

  /* 상세 페이지의 세로 1단 휴대폰 디자인이 켜지는 최대 폭.
     이보다 넓은 휴대폰(가로 화면 등)에서는 틀을 이 폭으로 두고 통째로
     조금 확대해 보여준다 — 안 그러면 어중간한 폭에서 본문이 다시 2단으로
     쪼개져 글줄이 몇 글자마다 끊긴다. */
  var MOBILE_FRAME_MAX = 479;

  /* 그렇게 확대할 때의 상한. 없으면 가로로 눕힌 휴대폰(폭 740 등)에서
     1.5배 넘게 부풀어 글씨가 우스꽝스럽게 커진다. 상한에 걸리면 남는
     좌우는 여백으로 두고 가운데에 놓는다. */
  var MOBILE_MAX_SCALE = 1.15;

  function mobileFrameWidth(card) {
    return Math.min(card.clientWidth, MOBILE_FRAME_MAX);
  }

  /* 화면 회전 등으로 카드 폭이 바뀌면 틀 너비도 따라가야 상세 페이지가
     그 폭 기준으로 다시 그려진다. 바꿨으면 true — 부르는 쪽에서 한 프레임
     쉬었다가 다시 재야 한다 (폭을 바꾼 직후엔 아직 옛 크기로 측정됨). */
  function syncMobileFrameWidth(card) {
    var want = mobileFrameWidth(card);
    if (!want) return false;
    if (parseInt(iframeEl.style.width, 10) === want) return false;
    iframeEl.style.width = want + 'px';
    return true;
  }

  /* 틀 안 글꼴 살리기.
     영문 제목에 쓰는 Adobe(Typekit) 글꼴은 <script> 가 실행되면서 글꼴 규칙을
     문서에 넣어주는 방식이다. 그런데 틀 안에서는 스크립트를 일부러 안 돌리므로
     (측정 중복·인터랙션 숨김 차단), 그대로 두면 영문 제목이 기본 글꼴로 나온다.

     글꼴 규칙은 문서마다 따로 필요하지만, 바깥 페이지에는 이미 그 규칙이 들어와
     있다. 그 중 글꼴 관련 것만 골라 틀 안으로 복사한다 — 스크립트는 여전히 안
     돌리고, 글꼴 파일은 이미 받아둔 것이라 새로 받지도 않는다.

     ⚠️ 바깥 스타일을 통째로 복사하면 안 된다 — 소개 페이지용 규칙이 틀 안
     요소에 걸려 배치가 틀어진다. 반드시 글꼴 것만. */
  function copyFontRules(idoc) {
    var head = idoc.head || idoc.body;
    if (!head) return;

    /* (1) 주소로 불러오는 글꼴 스타일시트는 링크째 복사 */
    Array.prototype.forEach.call(
      document.querySelectorAll('link[rel="stylesheet"]'),
      function (l) {
        if (/typekit|fonts\.googleapis|fonts\.gstatic/i.test(l.href || '')) {
          try { head.appendChild(idoc.importNode(l, true)); } catch (_) {}
        }
      }
    );

    /* (2) 문서에 들어와 있는 @font-face 규칙을 글자로 옮겨 심기.
       스크립트가 넣은 규칙은 <style> 안에 글자로 남지 않고 메모리에만 있는
       경우가 있어(insertRule), 태그를 복사하는 것만으로는 안 잡힌다. */
    var css = '';
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var rules = null;
      try { rules = sheet.cssRules; } catch (_) { return; }   /* 외부 도메인은 못 읽음 */
      if (!rules) return;
      Array.prototype.forEach.call(rules, function (r) {
        if (r && r.type === 5) css += r.cssText + '\n';       /* 5 = @font-face */
      });
    });
    if (css) {
      var st = idoc.createElement('style');
      st.textContent = css;
      head.appendChild(st);
    }

    /* (3) 이미 받아둔 글꼴 자체를 틀 안 문서에도 등록.
       (1)(2) 로 못 잡는 방식 — 스크립트가 글꼴 객체만 만들어 넣는 경우 —
       까지 커버한다. 같은 사이트 문서라 글꼴 파일을 새로 받지 않는다. */
    try {
      document.fonts.forEach(function (ff) {
        try { idoc.fonts.add(ff); } catch (_) {}
      });
    } catch (_) {}
  }

  function showIframeSection(idx) {
    if (!iframeSections.length) return;
    iframeSections.forEach(function (sec, i) {
      /* .cert-modal-frame 은 클래스 자체가 display:none 이라(페이지에 노출
         안 되는 자료용 페이지) 보여줄 때 켜준다.
         PC 는 flex — 클래스가 세로 정렬·여백을 flex 기준으로 잡아두었기 때문.
         휴대폰은 block — 상세 페이지의 휴대폰 화면이 block 기준으로 짜여 있어
         flex 로 켜면 안쪽 묶음이 디자이너 화면과 다르게 눌린다. */
      sec.style.setProperty('display', i === idx ? 'flex' : 'none', 'important');
    });

    /* 보이는 장만 정리한다 — 숨은 장은 크기를 잴 수 없어(폭 0) 좁은지
       넓은지 판단이 안 된다. 장마다 한 번씩만 돈다. */
    if (isMobileFrame && iframeEl) {
      fitMobileSection(iframeSections[idx], iframeEl.contentWindow);
    }
    layoutIframe();
  }

  function layoutIframe() {
    if (!iframeEl || !overlay) return;
    var card = overlay.querySelector('.helix-cert-modal__card');
    var sec = iframeSections[currentIdx];
    if (!card || !sec) return;

    /* 휴대폰은 틀 너비가 화면 폭을 따라간다 — 회전 등으로 폭이 바뀌었으면
       먼저 맞추고, 새 폭으로 다시 그려진 뒤에 측정한다. */
    if (isMobileFrame && syncMobileFrameWidth(card)) {
      requestAnimationFrame(layoutIframe);
      return;
    }

    /* 휴대폰 — 내용이 화면보다 짧아도 상세 화면이 카드를 채우게 한다.
       안 그러면 아래쪽이 텅 빈 채로 남고, 바닥에 붙어야 할 구분선·로고가
       화면 한가운데 떠 있는 것처럼 보인다 (상세 화면은 위 내용과 바닥
       묶음을 위아래로 벌려 놓는 구조라, 높이가 있어야 그렇게 잡힌다). */
    if (isMobileFrame) {
      var frameW = parseFloat(iframeEl.style.width) || card.clientWidth;
      var s0 = Math.min(card.clientWidth / frameW, MOBILE_MAX_SCALE);
      var slideEl = iframeEl.closest('.helix-cert-modal__slide');
      var avail = card.clientHeight;
      if (slideEl) {
        var scs = window.getComputedStyle(slideEl);
        avail = slideEl.clientHeight -
          (parseFloat(scs.paddingTop) || 0) - (parseFloat(scs.paddingBottom) || 0);
      }
      if (avail > 0 && s0 > 0) {
        sec.style.setProperty('min-height', Math.floor(avail / s0) + 'px', 'important');
      }
    }

    var rect = sec.getBoundingClientRect();   /* 틀 안에서의 프레임 위치·크기 */
    if (!rect.width) return;

    /* 틀 높이를 프레임에 맞춰 — 남는 아래쪽이 스크롤을 만들지 않도록 */
    iframeEl.style.height = Math.ceil(rect.top + rect.height) + 'px';

    /* 프레임의 왼쪽 위 모서리를 카드의 왼쪽 위에 맞추고, 카드 폭에 맞춰 축소.
       translate 를 scale 뒤에 두면 이동량도 함께 축소돼 좌표가 맞는다.
       (휴대폰은 틀 너비가 이미 화면 폭이라 대개 배율 1 — 화면이 479px 보다
       넓을 때만 그만큼 확대된다.) */
    var scale = card.clientWidth / rect.width;
    var offsetX = 0;
    if (isMobileFrame && scale > MOBILE_MAX_SCALE) {
      scale = MOBILE_MAX_SCALE;
      offsetX = (card.clientWidth - rect.width * scale) / 2;   /* 남는 좌우는 여백 */
    }
    iframeEl.style.transformOrigin = 'top left';
    iframeEl.style.transform =
      'scale(' + scale + ') translate(' +
      (-rect.left + offsetX / scale) + 'px, ' + (-rect.top) + 'px)';

    /* 틀은 transform 으로만 줄이거나 늘리므로 바깥에서 보는 높이는 따로
       알려줘야 한다 — 그래야 내용이 길 때 카드가 그만큼 스크롤된다.
       PC 는 카드 높이에 딱 맞으므로 CSS 기본값(100%)에 맡긴다. */
    var wrap = iframeEl.parentElement;
    if (wrap) {
      wrap.style.height = isMobileFrame
        ? Math.ceil(rect.height * scale) + 'px'
        : '';
    }
  }

  function openWithFixedFrame(slug) {
    track.innerHTML = '';
    track.style.transform = 'translateX(0)';

    var card = overlay.querySelector('.helix-cert-modal__card');
    isMobileFrame = isMobileView();

    var slide = document.createElement('div');
    slide.className = 'helix-cert-modal__slide is-fixed-frame' +
      (isMobileFrame ? ' is-mobile-frame' : '');

    /* 틀을 감싸는 상자 — 틀은 transform 으로 줄거나 늘어나므로, 바깥에서 보는
       실제 높이는 이 상자가 들고 있어야 카드 스크롤 길이가 맞는다. */
    var wrap = document.createElement('div');
    wrap.className = 'helix-cert-modal__framewrap';

    var f = document.createElement('iframe');
    f.className = 'helix-cert-modal__frame';
    f.title = '인증 상세';
    f.setAttribute('scrolling', 'no');
    f.setAttribute('sandbox', 'allow-same-origin');
    f.style.width = (isMobileFrame && card ? mobileFrameWidth(card) : DESIGN_WIDTH) + 'px';
    f.style.height = '540px';

    wrap.appendChild(f);
    slide.appendChild(wrap);
    track.appendChild(slide);
    iframeEl = f;
    iframeSections = [];

    f.addEventListener('load', function () {
      var idoc = null;
      try { idoc = f.contentDocument; } catch (_) {}
      if (!idoc || !idoc.body) { openWithSections(slug); return; }

      /* 페이지 문맥(바깥 여백·스크롤·다른 요소)을 걷고 상세 섹션만 남긴다 */
      var css =
        'html,body{margin:0!important;padding:0!important}' +
        'body > *{display:none!important}' +
        /* 한글은 브라우저 기본값이 "글자 사이 아무 데서나 줄바꿈" 이라, 글줄이
           한 칸만 모자라도 "합니다." 가 "합 / 니다" 로 끊긴다. 띄어쓰기에서만
           끊기도록. */
        'body{word-break:keep-all!important}';

      if (isMobileFrame) {
        /* 휴대폰 — 상세 섹션은 높이가 540px 로 못박혀 있어(PC 카드 크기),
           그대로 두면 세로로 늘어난 내용이 잘린다. 높이를 내용만큼 풀고,
           길어진 만큼은 카드 쪽에서 스크롤한다. */
        css +=
          'html,body{height:auto!important;overflow:visible!important}' +
          'section.cert-modal-frame{height:auto!important;min-height:0!important;' +
          'width:100%!important;max-width:100%!important;' +
          /* 위 여백 — 상세 페이지가 잡아둔 28px 로는 화면 맨 위 닫기 버튼
             바로 밑에서 내용이 시작해 답답하다. 화면 폭에 비례해 넉넉히. */
          'padding-top:14vw!important}' +
          /* 넘치는 이미지만 가로 폭 안으로. !important 를 쓰지 않아, 원래
             %로 작게 잡아둔 로고(.image-31 max-width:19%)는 그대로 둔다. */
          /* object-fit — 세로로 세우면서 그림 칸이 넓어지면 그림이 칸을
             채우려 옆으로 늘어난다(인증마크가 찌그러짐). 칸 크기는 그대로
             두고 그림만 원래 비율로 안에 맞춘다. */
          'img{max-width:100%;object-fit:contain}' +

          /* 좁은 화면용 값이 따로 없어 휴대폰에서만 유독 작아지는 것들.
             PC 는 크기 기준이 창 너비(1440)인데 보이는 틀은 960 이라 글자가
             1.5배 크게 잡히는 반면, 휴대폰은 그 둘이 같아 그만큼 작아진다.
               - 파란 영문 제목(Why? / How? / What?) 3.3vw → 5.6vw
               - 표지 빨간 약칭·영문 이름
               - 구분선 아래 병원 로고 19% → 40% */
          '.writing-english-copy-l{font-size:5.6vw!important;line-height:1.15!important}' +
          '.text-block-25{font-size:4.4vw!important;line-height:1.25!important}' +
          '.text-block-25-copy-copy{font-size:3.1vw!important;line-height:1.35!important}' +
          '.image-31{max-width:40%!important}' +

          /* PC 는 정해진 높이(540px)에 내용이 꽉 차서 위아래로 고르게 벌려
             놓는 것이 자연스럽지만, 세로로 긴 휴대폰 화면에서는 같은 방식이
             내용을 띄엄띄엄 흩어놓는다. 내용은 위에서부터 쌓고, 구분선·로고만
             바닥에 붙인다. */
          'section.cert-modal-frame > *{justify-content:flex-start!important}' +
          'section.cert-modal-frame > * > :last-child{margin-top:auto!important}';
      } else {
        css += 'html,body{overflow:hidden!important}';
      }

      var st = idoc.createElement('style');
      st.textContent = css;
      (idoc.head || idoc.body).appendChild(st);
      copyFontRules(idoc);
      /* 바깥 페이지 글꼴이 늦게 도착하면 그때 한 번 더 옮겨 심는다 */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          copyFontRules(idoc);
          layoutIframe();
        }).catch(function () {});
      }

      iframeSections = Array.prototype.slice.call(
        idoc.querySelectorAll('section.cert-modal-frame')
      ).filter(function (sec) {
        /* Designer 에서 눈 아이콘으로 끈 섹션은 제외 — Webflow 가 인라인
           style="display:none" 으로 내보낸다 (cat-cert 4번째 섹션) */
        return !/display\s*:\s*none/i.test(sec.getAttribute('style') || '');
      });

      if (!iframeSections.length) { openWithSections(slug); return; }

      /* 섹션이 body 바로 아래가 아니면 그 조상들도 되살려야 보인다 */
      iframeSections.forEach(function (sec) {
        var p = sec.parentElement;
        while (p && p !== idoc.body) {
          p.style.setProperty('display', 'block', 'important');
          p = p.parentElement;
        }
      });

      /* 휴대폰 — 상세 페이지 본문 묶음(.grid2)은 좁은 화면에서 꺼지도록
         잡혀 있는데, 대신 보여줄 묶음(.grid2_m)을 안 만들어 둔 페이지가
         있다(인증 상세는 세 페이지 다 그렇다). 그대로 두면 제목과 로고만
         남고 본문이 통째로 사라지므로, 짝 없이 숨은 본문만 세로 1단으로
         되살린다. 짝이 있으면 건드리지 않는다(같은 내용이 두 번 나옴). */
      if (isMobileFrame) {
        var iwin = f.contentWindow;
        iframeSections.forEach(function (sec) { reviveOrphanHidden(sec, iwin); });
      }

      currentCount = iframeSections.length;
      buildDots(currentCount);
      go(0, true);

      /* 글꼴이 늦게 도착하면 글줄 높이가 바뀐다 — 그 뒤 한 번 더 맞춤 */
      if (idoc.fonts && idoc.fonts.ready) {
        idoc.fonts.ready.then(layoutIframe).catch(function () {});
      }
    });

    f.addEventListener('error', function () { openWithSections(slug); });
    f.src = slug;
  }

  function open(slug) {
    if (!overlay) buildOverlay();
    currentSlug = slug;
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

    iframeEl = null;
    iframeSections = [];

    /* 모든 화면에서 고정 폭 틀 안에 그린다 — PC 는 창 너비에 따라 안쪽이
       변하지 않도록, 휴대폰은 상세 페이지가 자기 휴대폰 화면을 켜도록.
       틀을 못 여는 경우에만 예전 방식(섹션 직접 심기)으로 물러선다. */
    openWithFixedFrame(slug);
  }

  function openWithSections(slug) {
    iframeEl = null;
    iframeSections = [];
    isMobileFrame = false;
    track.innerHTML = '<div class="helix-cert-modal__loading">불러오는 중...</div>';

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

  function updateNav(idx) {
    Array.prototype.forEach.call(dotsEl.children, function (d, i) {
      d.classList.toggle('is-active', i === idx);
    });
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === currentCount - 1;
  }

  function go(idx, instant) {
    if (currentCount === 0) return;
    if (idx < 0) idx = 0;
    if (idx >= currentCount) idx = currentCount - 1;
    currentIdx = idx;

    /* 고정 폭 틀(iframe) 모드 — 슬라이드를 옆으로 미는 대신 틀 안에서
       보여줄 섹션만 바꾼다 */
    if (iframeEl) {
      showIframeSection(idx);
      updateNav(idx);
      /* 휴대폰은 슬라이드가 세로로 길어 스크롤이 남아 있다 — 넘길 때 맨 위로 */
      var frameSlide = iframeEl.closest('.helix-cert-modal__slide');
      if (frameSlide && frameSlide.scrollTo) frameSlide.scrollTo(0, 0);
      return;
    }

    if (instant) {
      var prevTransition = track.style.transition;
      track.style.transition = 'none';
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      /* 다음 프레임에 transition 복구 */
      requestAnimationFrame(function () { track.style.transition = prevTransition; });
    } else {
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    }
    updateNav(idx);
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
