(function () {
  'use strict';

  /* ── 링크 설정 (URL 변경 시 여기만 수정) ── */
  var BRANCHES = [
    { text: '서초 본원',          href: '#' },
    { text: '일산 분원',          href: '#' },
    { text: '서울동물영상종양센터', href: '#' }
  ];

  /* 그룹 항목: 한 줄에 나란히, 각각 별도 링크 */
  var NAV_LINKS = [
    { text: 'about HELIX',  href: '#' },
    { group: [ { text: '진료과목', href: '#' }, { text: '특화진료', href: '#' } ] },
    { text: '의료 인프라',   href: '#' },
    { group: [ { text: 'FAQ', href: '#' }, { text: '뉴스룸', href: '#' } ] },
    { text: '응급증상안내',  href: '#' }
  ];

  var VET_CHART_HREF = '#';

  /* ── 오버레이 HTML 생성 ── */
  function buildOverlayHTML() {
    var branchesHTML = BRANCHES.map(function (b) {
      return '<a href="' + b.href + '" class="hx-menu-branch">' + b.text + '</a>';
    }).join('');

    var navHTML = NAV_LINKS.map(function (n) {
      if (n.group) {
        var inner = n.group.map(function (g, i) {
          return (i > 0 ? '<span class="hx-menu-nav-sep">・</span>' : '') +
            '<a href="' + g.href + '" class="hx-menu-nav-link">' + g.text + '</a>';
        }).join('');
        return '<div class="hx-menu-nav-group">' + inner + '</div>';
      }
      return '<a href="' + n.href + '" class="hx-menu-nav-link">' + n.text + '</a>';
    }).join('');

    return (
      '<div class="hx-menu-overlay" role="dialog" aria-modal="true" aria-hidden="true">' +
        '<div class="hx-menu-body">' +
          '<div class="hx-menu-branches">' + branchesHTML + '</div>' +
          '<div class="hx-menu-divider"></div>' +
          '<nav class="hx-menu-nav">' + navHTML + '</nav>' +
        '</div>' +
        '<div class="hx-menu-footer">' +
          '<a href="' + VET_CHART_HREF + '" class="hx-menu-footer-link">' +
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
    var top = getHeaderBottom();
    overlay.style.top    = top + 'px';
    overlay.style.height = (window.innerHeight - top) + 'px';

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

  function init() {
    /* 백드롭 주입 */
    var backdrop = document.createElement('div');
    backdrop.className = 'hx-menu-backdrop';
    document.body.appendChild(backdrop);

    /* 오버레이 DOM 주입 */
    var tmp = document.createElement('div');
    tmp.innerHTML = buildOverlayHTML();
    document.body.appendChild(tmp.firstChild);

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
      positionOverlay(overlay);
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      backdrop.classList.add('is-open');
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

    function closeMenu() {
      isOpen = false;
      document.body.classList.remove('hx-menu-open');
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

    /* ── .image-18 클릭 이벤트 연결 ── */
    var btn = document.querySelector('.image-18');
    if (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function () {
        if (isOpen) closeMenu(); else openMenu();
      });
    } else {
      console.warn('[hx-menu] .image-18 not found');
    }

    /* 백드롭 클릭 → 닫기 */
    backdrop.addEventListener('click', closeMenu);

    /* ESC 키로 닫기 */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    /* 링크 클릭 → 활성 처리 후 닫기 */
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        setActive(a);
        closeMenu();
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
