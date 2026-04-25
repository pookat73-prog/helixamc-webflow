(function () {
  'use strict';

  /* ── 링크 설정 (URL 변경 시 여기만 수정) ── */
  var BRANCHES = [
    { text: '서초 본원',          href: '#' },
    { text: '일산 분원',          href: '#' },
    { text: '서울동물영상종양센터', href: '#' }
  ];

  var NAV_LINKS = [
    { text: 'about HELIX',        href: '#' },
    { text: '진료과목・특화진료',  href: '#' },
    { text: '의료 인프라',         href: '#' },
    { text: 'FAQ・뉴스룸',         href: '#' },
    { text: '응급증상안내',        href: '#' }
  ];

  var VET_CHART_HREF = '#';

  /* ── 오버레이 HTML 생성 ── */
  function buildOverlayHTML() {
    var branchesHTML = BRANCHES.map(function (b) {
      return '<a href="' + b.href + '" class="hx-menu-branch">' + b.text + '</a>';
    }).join('');

    var navHTML = NAV_LINKS.map(function (n) {
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

  function init() {
    /* 오버레이 DOM 주입 */
    var tmp = document.createElement('div');
    tmp.innerHTML = buildOverlayHTML();
    document.body.appendChild(tmp.firstChild);

    var overlay = document.querySelector('.hx-menu-overlay');
    var isOpen  = false;

    var staggerItems = overlay.querySelectorAll(
      '.hx-menu-branch, .hx-menu-divider, .hx-menu-nav-link, .hx-menu-footer-link'
    );
    gsap.set(staggerItems, { y: 24, opacity: 0 });

    function openMenu() {
      isOpen = true;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('hx-menu-open');

      var tl = gsap.timeline();
      tl.to(overlay, { opacity: 1, duration: 0.28, ease: 'power2.out' });
      tl.to(staggerItems, {
        y: 0, opacity: 1,
        duration: 0.4,
        stagger: 0.055,
        ease: 'power3.out'
      }, '-=0.12');
    }

    function closeMenu() {
      isOpen = false;
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: function () {
          overlay.classList.remove('is-open');
          overlay.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('hx-menu-open');
          gsap.set(staggerItems, { y: 24, opacity: 0 });
        }
      });
    }

    /* ── 기존 Webflow 햄버거 버튼 가로채기 ──
       clone으로 Webflow 이벤트 리스너를 제거하고 우리 핸들러만 연결 */
    var wfBtn = document.querySelector('.w-nav-button');
    if (wfBtn) {
      var clone = wfBtn.cloneNode(true);
      wfBtn.parentNode.replaceChild(clone, wfBtn);
      clone.addEventListener('click', function () {
        if (isOpen) closeMenu(); else openMenu();
      });
    }

    /* ESC 키로 닫기 */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    /* 메뉴 링크 클릭 시 닫기 */
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
