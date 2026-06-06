/* ================================================================
   HELIX AMC — 응급 페이지 하단 지점 CTA (접이식)
   ----------------------------------------------------------------
   하단 우측 작은 칩으로 떠 있다가, 탭하면 위로 패널이 펴지며
   서초본원 / 일산분원 두 행이 나타남. 다시 탭하면 접힘.

   노출은 emergency/branch-cta.css 의 @media (orientation: portrait
   and max-width: 991px) 가 통제 — JS 는 DOM 주입과 토글만 담당.

   리뉴얼 바와 충돌 안 하도록, 리뉴얼 바가 실제 떠 있으면 그 위로
   올라가게 CSS 변수 --helix-branch-cta-bottom 을 동적 조정.
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixBranchCtaInit) return;
  window.__helixBranchCtaInit = true;

  var BRANCHES = [
    { key: 'seocho', name: '서초본원', tel: '02-2135-9119' },
    { key: 'ilsan',  name: '일산분원', tel: '031-978-7575' }
  ];

  var PHONE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 ' +
    '19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 ' +
    '12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 ' +
    '0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
    '</svg>';

  function build() {
    if (document.querySelector('.helix-branch-cta')) return;

    var root = document.createElement('div');
    root.className = 'helix-branch-cta';

    var rowsHtml = BRANCHES.map(function (b) {
      var digits = b.tel.replace(/\D/g, '');
      return '<a class="helix-branch-cta__row" href="tel:' + digits + '" ' +
             'data-branch="' + b.key + '" data-tel="' + b.tel + '">' +
               '<span class="helix-branch-cta__name">' + b.name + '</span>' +
               '<span class="helix-branch-cta__tel">' + b.tel + '</span>' +
             '</a>';
    }).join('');

    root.innerHTML =
      '<div class="helix-branch-cta__panel" aria-hidden="true">' +
        '<p class="helix-branch-cta__title">지점 전화 연결</p>' +
        rowsHtml +
      '</div>' +
      '<button type="button" class="helix-branch-cta__toggle" aria-expanded="false" aria-label="지점 전화 메뉴 열기">' +
        '<span class="helix-branch-cta__icon">' + PHONE_SVG + '</span>' +
        '<span class="helix-branch-cta__label">지점 전화</span>' +
        '<span class="helix-branch-cta__chevron" aria-hidden="true"></span>' +
      '</button>';

    document.body.appendChild(root);

    var toggle = root.querySelector('.helix-branch-cta__toggle');
    var panel = root.querySelector('.helix-branch-cta__panel');

    function setOpen(open) {
      root.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '지점 전화 메뉴 닫기' : '지점 전화 메뉴 열기');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      setOpen(!root.classList.contains('is-open'));
    });

    /* 패널 바깥 탭 시 접기 */
    document.addEventListener('click', function (e) {
      if (!root.classList.contains('is-open')) return;
      if (root.contains(e.target)) return;
      setOpen(false);
    });

    /* 전화 행 클릭 — 확인창 통해 tel: (다른 페이지 톤 통일) */
    panel.addEventListener('click', function (e) {
      var row = e.target.closest && e.target.closest('.helix-branch-cta__row');
      if (!row) return;
      e.preventDefault();
      var tel = row.getAttribute('data-tel') || '';
      var ok = window.confirm(tel + ' 로 전화 연결하시겠습니까?');
      if (ok) {
        location.href = 'tel:' + tel.replace(/\D/g, '');
      }
      setOpen(false);
    });

    /* 리뉴얼 바와 겹침 회피 — 떠 있으면 그 위로 올림 */
    function syncBottomOffset() {
      var renewal = document.querySelector('.helix-renewal-bar.is-open');
      var base = 16;
      if (renewal) {
        var h = renewal.getBoundingClientRect().height;
        base = Math.round(h + 12);
      }
      document.documentElement.style.setProperty('--helix-branch-cta-bottom', base + 'px');
    }
    syncBottomOffset();
    setTimeout(syncBottomOffset, 600);
    setTimeout(syncBottomOffset, 1500);
    window.addEventListener('resize', syncBottomOffset);

    /* 진입 슬라이드 업 — 다음 프레임에 is-mounted */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('is-mounted'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
