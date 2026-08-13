(function () {
  'use strict';

  /* ── 링크 설정 (URL 변경 시 여기만 수정) ── */
  /* event 가 지정된 항목은 공용 menu_nav_click 대신 그 전용 이벤트를 쏨.
     스빅(SVICC)은 홈 배너 버튼(svicc_click_*)·소개 페이지 버튼
     (about_svic_cta_*) 과 함께 세야 하는데, 메뉴 경유분만 menu_nav_click
     안에 묻혀 있어 합산이 안 됐다. 전용 이름을 줘서 세 입구를 합칠 수 있게 함. */
  var BRANCHES = [
    { text: '서초 본원',          href: '/seocho' },
    { text: '일산 분원',          href: '#' },
    { text: '서울동물영상종양센터', href: 'https://www.svicc.co.kr/', event: 'menu_svicc_click' }
  ];

  /* 그룹 항목: 한 줄에 나란히, 각각 별도 링크.
     event 가 지정된 항목은 공용 menu_nav_click 대신 그 전용 이벤트를 쏨
     (전환 성격이 다른 링크를 GA 에서 한 줄로 따로 집계하기 위함). */
  var NAV_LINKS = [
    { text: 'discover HELIX', href: '/discover-helix' },
    { group: [ { text: '진료과목', href: '/services', event: 'menu_services_click' }, { text: '특화진료', href: '/specialty-care' } ] },
    { text: '의료 인프라',   href: '#' },
    { group: [ { text: 'FAQ', href: '/faq' }, { text: '뉴스룸', href: '#' }, { text: '칼럼', href: '#' } ] },
    { text: '응급증상안내',  href: '/symptoms', event: 'menu_emergency_click' }
  ];

  /* 수의사용 웹 차트 = 벳칭 웹리퍼 협력병원 접속(로그인) 주소.
     외부 사이트라 externalAttr 이 자동으로 새 탭(target=_blank) 처리. */
  var VET_CHART_HREF = 'https://cross-vet.vetching.cc/auth/helix/refer';

  /* 햄버거 아이콘 자체를 "준비중"으로 막을지 여부.
     true  → 아이콘 클릭해도 메뉴 안 열리고 "준비중입니다" 토스트만 뜸
     false → 정상 동작 (메뉴 열림)
     ── 전체 개방 ──
     주요 메뉴(서초본원·SVICC·discover HELIX·진료과목·특화진료·응급증상안내)가
     연결되어 메뉴를 도메인 무관 전체 개방. 아직 미연결 항목(일산분원·의료인프라·
     뉴스룸·칼럼·수의사용 웹차트)은 호버하면 흐려지고(hamburger.css) 클릭하면
     coming-soon.js 가 "준비중입니다" 토스트로 안내. */
  var MENU_COMING_SOON = false;

  /* href 가 '#' 이면 아직 미연결 → data-coming-soon 자동 부여 */
  function comingSoonAttr(href) {
    return href === '#' ? ' data-coming-soon="1"' : '';
  }

  /* 외부 사이트(http/https) 링크는 새 탭으로 — 우리 사이트는 그대로 두고
     딴 창에서 열림. 내부 경로('/seocho' 등)엔 아무 것도 안 붙음. */
  function externalAttr(href) {
    return /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
  }

  /* 전용 GA 이벤트가 지정된 항목이면 data-ga-event 속성 부여.
     클릭 핸들러가 이 속성을 읽어 공용 menu_nav_click 대신 전용 이벤트를 쏨.
     인스펙터도 이 속성으로 전용 네모를 그림. */
  function gaAttr(item) {
    return item && item.event ? ' data-ga-event="' + item.event + '"' : '';
  }

  /* ── 오버레이 HTML 생성 ── */
  function buildOverlayHTML() {
    var branchesHTML = BRANCHES.map(function (b) {
      return '<a href="' + b.href + '"' + comingSoonAttr(b.href) + externalAttr(b.href) + gaAttr(b) +
        ' class="hx-menu-branch">' + b.text + '</a>';
    }).join('');

    var navHTML = NAV_LINKS.map(function (n) {
      if (n.group) {
        var inner = n.group.map(function (g, i) {
          return (i > 0 ? '<span class="hx-menu-nav-sep">・</span>' : '') +
            '<a href="' + g.href + '"' + comingSoonAttr(g.href) + externalAttr(g.href) + gaAttr(g) +
            ' class="hx-menu-nav-link">' + g.text + '</a>';
        }).join('');
        return '<div class="hx-menu-nav-group">' + inner + '</div>';
      }
      return '<a href="' + n.href + '"' + comingSoonAttr(n.href) + externalAttr(n.href) + gaAttr(n) +
        ' class="hx-menu-nav-link">' + n.text + '</a>';
    }).join('');

    return (
      '<div class="hx-menu-overlay" role="dialog" aria-modal="true" aria-hidden="true">' +
        '<div class="hx-menu-body">' +
          '<div class="hx-menu-branches">' + branchesHTML + '</div>' +
          '<div class="hx-menu-divider"></div>' +
          '<nav class="hx-menu-nav">' + navHTML + '</nav>' +
        '</div>' +
        '<div class="hx-menu-footer">' +
          '<a href="' + VET_CHART_HREF + '"' + comingSoonAttr(VET_CHART_HREF) + externalAttr(VET_CHART_HREF) +
            ' data-ga-event="vet_chart_click" class="hx-menu-footer-link">' +
            '수의사용 웹 차트' +
            '<span class="hx-menu-footer-link__arrow">›</span>' +
          '</a>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── 헤더 하단 위치 감지 ── */
  function getHeaderBottom() {
    var header = document.querySelector('.navbar1_component') ||
                 document.querySelector('[class*="navbar"]') ||
                 document.querySelector('header') ||
                 document.querySelector('nav');
    return header ? header.getBoundingClientRect().bottom : 0;
  }

  function positionOverlay(overlay) {
    /* 진료과목 링크 왼쪽 끝에 패널 좌측 정렬 */
    var links = document.querySelectorAll('a');
    var anchor = null;
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent.trim().indexOf('진료과목') !== -1) {
        anchor = links[i];
        break;
      }
    }
    if (anchor) {
      var left = anchor.getBoundingClientRect().left;
      overlay.style.left  = left + 'px';
      overlay.style.right = '0';
      overlay.style.width = 'auto';
    }
  }

  /* ── GA4 측정 헬퍼 ──
     ga4-base.js 가 정의한 window.gtag 에 편승. 스테이징(*.webflow.io)에선
     그 stub 이 no-op 이라 자동으로 아무 것도 안 쏨 → 별도 도메인 게이트 불필요.
     어느 페이지의 햄버거인지 page 파라미터로 구분 (floating-cta.js 와 동일 규칙). */
  function menuPage() {
    var p = (location.pathname || '/').toLowerCase();
    if (/discover/.test(p)) return 'discover';
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    if (/seocho|서초|seoco/.test(p)) return 'seocho';
    if (/about/.test(p)) return 'about';
    if (/emergency|응급/.test(p)) return 'emergency';
    return 'home';
  }
  var MENU_PAGE = menuPage();

  function ga(eventName, params) {
    if (typeof window.gtag === 'function') {
      var p = params || {};
      p.page = MENU_PAGE;
      window.gtag('event', eventName, p);
    }
  }

  function init() {
    /* 중복 초기화 가드: 페이지 자체 bootstrap 과 site-wide global bootstrap 이
       둘 다 hamburger.js 를 로드하는 경우, 오버레이/리스너가 두 벌 생겨
       클릭이 열림→닫힘으로 상쇄돼 "안 열리는" 것처럼 보임. 한 번만 실행. */
    if (window.__helixHamburgerInit) return;
    window.__helixHamburgerInit = true;

    /* 백드롭 주입 */
    var backdrop = document.createElement('div');
    backdrop.className = 'hx-menu-backdrop';
    document.body.appendChild(backdrop);

    /* X 버튼 주입 */
    var closeBtn = document.createElement('button');
    closeBtn.className = 'hx-menu-close';
    closeBtn.setAttribute('aria-label', '메뉴 닫기');
    document.body.appendChild(closeBtn);

    /* 오버레이 DOM 주입 */
    var tmp = document.createElement('div');
    tmp.innerHTML = buildOverlayHTML();
    document.body.appendChild(tmp.firstChild);

    /* 안전망: 이전 세션/렌더에서 body.hx-menu-open 가 stuck 으로 남는 경우
       (GSAP transition 중간 차단, page reload 등) 페이지 스크롤이 영영 잠김.
       init 시점에 강제로 클리어. */
    document.body.classList.remove('hx-menu-open');

    var overlay  = document.querySelector('.hx-menu-overlay');
    var isOpen   = false;
    var activeEl = null; /* 클릭된 링크 기억 */

    /* 그룹 내부 링크는 그룹 div 단위로 stagger */
    var staggerItems = overlay.querySelectorAll(
      '.hx-menu-branch, .hx-menu-divider, .hx-menu-nav > *, .hx-menu-footer-link'
    );
    gsap.set(staggerItems, { y: 20, opacity: 0 });

    function setActive(el) {
      overlay.querySelectorAll('.hx-menu-branch, .hx-menu-nav-link, .hx-menu-footer-link')
        .forEach(function (a) { a.classList.remove('is-active'); });
      if (el) el.classList.add('is-active');
      activeEl = el;
    }

    function openMenu() {
      isOpen = true;
      ga('menu_open', {});
      positionOverlay(overlay);
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      backdrop.classList.add('is-open');
      closeBtn.classList.add('is-visible');
      document.body.classList.add('hx-menu-open');

      /* 이전에 클릭한 링크 활성 복원 */
      if (activeEl) activeEl.classList.add('is-active');

      var tl = gsap.timeline();
      tl.fromTo(overlay,
        { x: '100%' },
        { x: '0%', duration: 0.35, ease: 'power3.out' }
      );
      tl.to(staggerItems, {
        y: 0, opacity: 1,
        duration: 0.35,
        stagger: 0.05,
        ease: 'power3.out'
      }, '-=0.2');
    }

    function closeMenu(reason) {
      isOpen = false;
      ga('menu_close', { method: reason || 'unknown' });
      document.body.classList.remove('hx-menu-open');
      closeBtn.classList.remove('is-visible');
      gsap.to(overlay, {
        x: '100%',
        duration: 0.28,
        ease: 'power3.in',
        onComplete: function () {
          overlay.classList.remove('is-open');
          overlay.setAttribute('aria-hidden', 'true');
          backdrop.classList.remove('is-open');
          gsap.set(staggerItems, { y: 20, opacity: 0 });
        }
      });
    }

    /* ── 햄버거 클릭 이벤트 연결 ──
       페이지/뷰포트마다 헤더 마크업이 달라(홈: .menu-bar_mobile 데스크탑+모바일
       헤더 컴포넌트 양쪽에 존재, about/기타: .menu-bar_mobile, 구버전: .image-18)
       버거 버튼이 페이지에 2개 이상 있을 수 있음. querySelector 로 첫 하나만
       잡으면 화면에 실제로 보이는(다른) 버튼엔 리스너가 안 붙어 안 열림.
       → 매칭되는 모든 버거 버튼에 바인딩. */
    var BURGER_SEL = '.menu-bar_mobile, .image-18';

    function bindBurger(btn) {
      if (!btn || btn.__hxBurgerBound) return;
      btn.__hxBurgerBound = true;
      btn.style.cursor = 'pointer';

      /* 버거 아이콘은 Webflow 헤더 컴포넌트에 data-coming-soon="1" 이 baked-in
         돼 있어, 그대로 두면 coming-soon.js 가 클릭을 가로채 "준비중" 토스트만
         띄우고 메뉴가 안 열림. 메뉴 여는 버튼은 준비중 대상이 아니므로 꼬리표를
         떼고 exempt 를 부여해 토스트를 확실히 차단. (햄버거 자체 준비중 모드일
         때만 다시 data-coming-soon 부여) */
      btn.removeAttribute('data-coming-soon');
      if (MENU_COMING_SOON) {
        btn.setAttribute('data-coming-soon', '1');
      } else {
        btn.setAttribute('data-coming-soon-exempt', '1');
      }

      btn.addEventListener('click', function () {
        if (MENU_COMING_SOON) return;  /* 토스트는 coming-soon.js 가 처리 */
        if (isOpen) closeMenu('toggle'); else openMenu();
      });
    }

    function bindAllBurgers() {
      var list = document.querySelectorAll(BURGER_SEL);
      for (var i = 0; i < list.length; i++) bindBurger(list[i]);
      return list.length;
    }

    /* 즉시 바인딩 + 늦게 렌더되는 헤더 컴포넌트(IX2/컴포넌트 인스턴스) 대비 재시도 */
    if (bindAllBurgers() === 0) {
      console.warn('[hx-menu] burger button not found yet, retrying');
    }
    var burgerScan = 0;
    var burgerIv = setInterval(function () {
      bindAllBurgers();
      if (++burgerScan >= 20) clearInterval(burgerIv);
    }, 250);

    /* 백드롭 / X 버튼 클릭 → 닫기 */
    backdrop.addEventListener('click', function () { closeMenu('backdrop'); });
    closeBtn.addEventListener('click', function () { closeMenu('close_button'); });

    /* ESC 키로 닫기 */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeMenu('esc');
    });

    /* 링크 클릭 → 활성 처리 후 닫기.
       단 준비중(미연결) 항목은 메뉴를 닫지 않음 — 잘못 눌렀거나, 다른 항목을
       마저 훑어보려는 경우 매번 다시 열 필요 없게. "준비중" 토스트는
       coming-soon.js 가 그대로 띄움. */
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        var comingSoon = a.hasAttribute('data-coming-soon');
        /* 전용 이벤트가 지정된 링크(응급증상·진료과목·수의사용 웹차트)는
           공용 menu_nav_click 대신 그 이벤트를 쏨 → 전환 성격별 분리 집계.
           나머지 링크는 기존대로 공용 menu_nav_click. */
        var dedicated = a.getAttribute('data-ga-event');
        ga(dedicated || 'menu_nav_click', {
          link_text: (a.textContent || '').trim(),
          link_url: a.getAttribute('href') || '',
          coming_soon: comingSoon ? 1 : 0
        });
        if (comingSoon) return;
        setActive(a);
        closeMenu('nav_link');
      });
    });

    /* 리사이즈 시 패널 위치 재조정 */
    window.addEventListener('resize', function () {
      if (isOpen) positionOverlay(overlay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
