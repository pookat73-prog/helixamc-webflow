/* ================================================================
   HELIX AMC — 응급 페이지 하단 지점 CTA (접이식 카드)
   ----------------------------------------------------------------
   Webflow 데스크탑 카드 디자인을 그대로 모바일 하단에 띄움.
   펼침: "24시 응급 진료" + 서초/일산 두 행 + 하단 ▾ 꺽쇠
   접힘: "24시 응급 진료" 한 줄 바 + 위 ▴ 꺽쇠

   세션 동안 접힘/펼침 상태 기억 (sessionStorage).
   리뉴얼 바 떠 있으면 그 위로 자동 오프셋.
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixBranchCtaInit) return;
  window.__helixBranchCtaInit = true;

  var STATE_KEY = 'helixBranchCtaState';

  /* Webflow asset CDN — Designer 의 지점 로고 이미지 자산 그대로 */
  var BRANCHES = [
    {
      key: 'seocho', name: '서초본원', tel: '02-2135-9119',
      mapHref: '/seoco-bonweon#map_naver',
      img: 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/69d39160537239833ee5ed2d_%EC%9E%90%EC%82%B0%209.png',
      alt: '헬릭스동물메디컬센터 서초본원'
    },
    {
      key: 'ilsan', name: '일산분원', tel: '031-978-7575',
      mapPending: true,
      img: 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/69d39160a58d7071c8161446_%EC%9E%90%EC%82%B0%2010.png',
      alt: '헬릭스동물메디컬센터 일산분원'
    }
  ];

  var PHONE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 ' +
    '19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 ' +
    '12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 ' +
    '0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
    '</svg>';

  var MAP_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
    '<circle cx="12" cy="10" r="3"/>' +
    '</svg>';

  function readState() {
    try {
      var v = window.sessionStorage.getItem(STATE_KEY);
      return v === 'collapsed' ? 'collapsed' : 'expanded';
    } catch (e) { return 'expanded'; }
  }
  function writeState(s) {
    try { window.sessionStorage.setItem(STATE_KEY, s); } catch (e) {}
  }

  /* ── GA4 헬퍼 — 응급 내원 CTA 클릭 측정 ──
     gtag 있으면 gtag('event'), 없으면 dataLayer.push 폴백 (사이트 공통 패턴) */
  function gaSend(eventName, branch, value) {
    try {
      var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
      var params = {
        item_type: 'emergency_cta',
        branch: branch || 'unknown',
        device: device,
        value: value || ''
      };
      var name = eventName + '_' + device;
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        window.gtag('event', name, params);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        params.event = name;
        window.dataLayer.push(params);
      }
    } catch (e) {}
  }

  function build() {
    if (document.querySelector('.helix-branch-cta')) return;

    var root = document.createElement('div');
    root.className = 'helix-branch-cta';

    var rowsHtml = BRANCHES.map(function (b) {
      return '<a class="helix-branch-cta__row" href="#" data-branch="' + b.key + '">' +
               '<img class="helix-branch-cta__logo" src="' + b.img + '" alt="' + b.alt + '" loading="lazy" decoding="async" />' +
               '<span class="helix-branch-cta__icons">' +
                 '<span class="helix-branch-cta__icon-btn" data-action="map" aria-label="' + b.name + ' 오시는 길">' + MAP_SVG + '</span>' +
                 '<span class="helix-branch-cta__icon-btn" data-action="call" aria-label="' + b.name + ' 전화 연결">' + PHONE_SVG + '</span>' +
               '</span>' +
             '</a>';
    }).join('');

    root.innerHTML =
      '<div class="helix-branch-cta__card" role="region" aria-label="24시 응급 진료 안내">' +
        '<p class="helix-branch-cta__header">24시 응급 진료</p>' +
        rowsHtml +
        '<button type="button" class="helix-branch-cta__collapse" data-toggle="collapse" aria-label="접기">' +
          '<span class="helix-branch-cta__chevron" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +
      '<button type="button" class="helix-branch-cta__compact" data-toggle="expand" aria-label="24시 응급 진료 펼치기">' +
        '<span class="helix-branch-cta__chevron" aria-hidden="true"></span>' +
        '<span class="helix-branch-cta__compact-label">24시 응급 진료</span>' +
        '<span class="helix-branch-cta__chevron" aria-hidden="true" style="visibility:hidden"></span>' +
      '</button>';

    document.body.appendChild(root);

    /* 초기 상태 복원 */
    var initial = readState();
    root.classList.add(initial === 'collapsed' ? 'is-collapsed' : 'is-expanded');

    function setCollapsed(c) {
      root.classList.toggle('is-collapsed', c);
      root.classList.toggle('is-expanded', !c);
      writeState(c ? 'collapsed' : 'expanded');
    }

    root.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;

      /* 접기 꺽쇠 (펼침 상태) */
      var collapseBtn = t.closest('[data-toggle="collapse"]');
      if (collapseBtn) {
        e.preventDefault();
        setCollapsed(true);
        return;
      }
      /* 펼치기 컴팩트 바 (접힘 상태) */
      var expandBtn = t.closest('[data-toggle="expand"]');
      if (expandBtn) {
        e.preventDefault();
        setCollapsed(false);
        return;
      }

      /* 행 안 아이콘 — 전화 / 지도 */
      var iconBtn = t.closest('[data-action]');
      if (iconBtn) {
        e.preventDefault();
        e.stopPropagation();
        var row = iconBtn.closest('.helix-branch-cta__row');
        var key = row && row.getAttribute('data-branch');
        var branch = BRANCHES.filter(function (b) { return b.key === key; })[0];
        if (!branch) return;
        var act = iconBtn.getAttribute('data-action');
        if (act === 'call') {
          gaSend('emergency_call', branch.name, branch.tel);
          if (window.confirm(branch.tel + ' 로 전화 연결하시겠습니까?')) {
            location.href = 'tel:' + branch.tel.replace(/\D/g, '');
          }
        } else if (act === 'map') {
          gaSend('emergency_map_click', branch.name, branch.mapHref || '');
          if (branch.mapPending) {
            alert('일산분원 방문 안내 페이지는 준비 중입니다.');
          } else if (branch.mapHref) {
            location.href = branch.mapHref;
          }
        }
        return;
      }

      /* 행 자체 클릭 (아이콘 외) — 전화로 기본 */
      var rowEl = t.closest('.helix-branch-cta__row');
      if (rowEl) {
        e.preventDefault();
        var k = rowEl.getAttribute('data-branch');
        var br = BRANCHES.filter(function (b) { return b.key === k; })[0];
        if (br) {
          gaSend('emergency_call', br.name, br.tel);
          if (window.confirm(br.tel + ' 로 전화 연결하시겠습니까?')) {
            location.href = 'tel:' + br.tel.replace(/\D/g, '');
          }
        }
      }
    });

    /* 리뉴얼 바 충돌 회피 — 리뉴얼 바가 떠 있으면 그 위로 자리.
       리뉴얼 바가 늦게 들어오거나 사용자가 X 로 닫는 변화 모두 반응. */
    function syncBottomOffset() {
      var renewal = document.querySelector('.helix-renewal-bar.is-open');
      var base = 14;
      if (renewal) {
        var h = renewal.getBoundingClientRect().height;
        base = Math.round(h + 10);
      }
      document.documentElement.style.setProperty('--helix-branch-cta-bottom', base + 'px');
    }
    syncBottomOffset();
    setTimeout(syncBottomOffset, 600);
    setTimeout(syncBottomOffset, 1500);
    window.addEventListener('resize', syncBottomOffset);

    /* DOM 변화 (리뉴얼 바 늦은 등장 / 닫힘 / class 변화) 즉시 반영 */
    try {
      var mo = new MutationObserver(function () {
        syncBottomOffset();
      });
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    } catch (e) {}

    /* 진입 슬라이드 업 */
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
