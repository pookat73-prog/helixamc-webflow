/* ================================================================
   HELIX AMC — 응급 증상 상세 모달 (emergency/modal.js)
   ----------------------------------------------------------------
   사용법 (Webflow 측):
     증상 카드 (EM_card 인스턴스) 에 다음 속성:
       data-emergency-open="<slug>"

   데이터 위치:
     emergency/data/<slug>.json
       → 객체. 스키마:
         {
           "name":      "<증상 이름>",                    (필수)
           "highlights": ["<핵심 응급 처치 카피1>", "<카피2>"],   (필수, 1~2줄)
           "catNotes":   ["<고양이 특이 증상1>", "<2>", "<3>"]    (선택)
         }

   "지금 바로 와주세요" 배지, 안내 문구, 분원 푸터 (서초/일산 전화) 는
   모든 증상 공통이라 템플릿에 하드코딩.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixEmergencyModalInit) return;
  window.__helixEmergencyModalInit = true;

  var DEBUG = /[?&]debug-emergency=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    var args = ['[emergency-modal]'].concat([].slice.call(arguments));
    try { console.log.apply(console, args); } catch (e) {}
  }
  function warn() {
    var args = ['[emergency-modal]'].concat([].slice.call(arguments));
    try { console.warn.apply(console, args); } catch (e) {}
  }

  var OWNER = 'pookat73-prog';
  var REPO  = 'helixamc-webflow';

  /* 분원 전화 — 디자인의 푸터 두 박스. 번호/이미지 변경 시 여기만 수정.
     img: Webflow 에셋 (자산 9/10 — 헬릭스동물메디컬센터 + 분원명 통합 이미지) */
  var BRANCHES = [
    { key: 'seocho', name: '서초본원', tel: '02-2135-9119',
      img: 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/69d39160537239833ee5ed2d_%EC%9E%90%EC%82%B0%209.png' },
    { key: 'ilsan',  name: '일산분원', tel: '031-978-7575',
      img: 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/69d39160a58d7071c8161446_%EC%9E%90%EC%82%B0%2010.png' }
  ];

  /* Webflow 컴포넌트 인스턴스에 data-emergency-open 을 박을 수 없어서
     (인스턴스 레벨 attribute 미지원), 카드 wrapper(.em_card) 안의 증상
     이름 텍스트로 슬러그 자동 매핑. 향후 카드 추가 시 여기 매핑만 늘리면 됨. */
  var NAME_TO_SLUG = [
    ['온몸에 힘이 없음', 'collapse'],
    ['극심한 통증',     'severe-pain'],
    ['안구돌출',        'proptosis'],
    ['과다출혈',        'hemorrhage'],
    ['호흡곤란',        'dyspnea'],
    ['고체온',          'hyperthermia'],
    ['저체온',          'hypothermia'],
    ['발작',            'seizure'],
    ['실신',            'syncope'],
    ['쇼크',            'shock'],
    ['마비',            'paralysis']
  ];

  var dataCache = {};
  var modalEl = null;
  var lastFocus = null;

  function getRef() {
    if (window.HELIX_REF) return window.HELIX_REF;
    return /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  }

  function dataUrl(slug) {
    var t = Math.floor(Date.now() / 60000);
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
           '@' + getRef() + '/emergency/data/' + slug + '.json?t=' + t;
  }

  function fetchSymptom(slug) {
    if (dataCache[slug]) return dataCache[slug];
    var url = dataUrl(slug);
    log('fetching', slug, url);
    var p = fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (!d || typeof d !== 'object') throw new Error('expected object');
        return d;
      })
      .catch(function (err) {
        warn('load failed:', slug, err && err.message);
        delete dataCache[slug];
        return null;
      });
    dataCache[slug] = p;
    return p;
  }

  /* 전화 아이콘 SVG — 인라인 (외부 자원 0) */
  var PHONE_SVG =
    '<svg class="helix-emergency-modal_phone-icon" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 ' +
    '19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 ' +
    '12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 ' +
    '0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
    '</svg>';

  /* 닫기 X SVG */
  var CLOSE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
    '</svg>';

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'helix-emergency-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'helix-emergency-modal-name');

    var branchesHtml = BRANCHES.map(function (b) {
      var digits = b.tel.replace(/\D/g, '');
      return '<a class="helix-emergency-modal_branch" href="tel:' + digits + '" ' +
             'data-branch="' + b.key + '" data-tel="' + b.tel + '">' +
               '<img class="helix-emergency-modal_branch-img" src="' + b.img + '" ' +
                 'alt="헬릭스동물메디컬센터 ' + b.name + '" loading="lazy" decoding="async" />' +
               '<span class="helix-emergency-modal_branch-phone">' + PHONE_SVG + '</span>' +
             '</a>';
    }).join('');

    modalEl.innerHTML =
      '<div class="helix-emergency-modal_backdrop" data-modal-close="1" aria-hidden="true"></div>' +
      '<div class="helix-emergency-modal_panel" role="document">' +
        '<button type="button" class="helix-emergency-modal_close" aria-label="닫기" data-modal-close="1">' + CLOSE_SVG + '</button>' +
        '<h2 class="helix-emergency-modal_name" id="helix-emergency-modal-name"></h2>' +
        '<div class="helix-emergency-modal_badge-row">' +
          '<span class="helix-emergency-modal_badge">지금 바로 와주세요</span>' +
          '<p class="helix-emergency-modal_intro">다음 사항에 유의하며 즉시 반려동물 응급실로 내원하세요.</p>' +
        '</div>' +
        '<ul class="helix-emergency-modal_highlights"></ul>' +
        '<section class="helix-emergency-modal_notes">' +
          '<h3 class="helix-emergency-modal_notes-label">고양이 특이 증상</h3>' +
          '<ul class="helix-emergency-modal_notes-list"></ul>' +
        '</section>' +
        '<div class="helix-emergency-modal_branches">' + branchesHtml + '</div>' +
      '</div>';

    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (e) {
      var closer = e.target.closest && e.target.closest('[data-modal-close]');
      if (closer) {
        e.preventDefault();
        close();
        return;
      }
      /* 분원 전화 클릭 — 확인창 → tel: 전환 (다른 페이지의 전화 핸들러와 동일 톤) */
      var branch = e.target.closest && e.target.closest('.helix-emergency-modal_branch');
      if (branch) {
        var tel = branch.getAttribute('data-tel') || '';
        if (tel) {
          var ok = window.confirm(tel + ' 로 전화 연결하시겠습니까?');
          if (!ok) e.preventDefault();
        }
      }
    });
    return modalEl;
  }

  function fillList(ul, items) {
    ul.innerHTML = '';
    if (!Array.isArray(items)) return;
    items.forEach(function (s) {
      if (s == null) return;
      var li = document.createElement('li');
      li.textContent = String(s);
      ul.appendChild(li);
    });
  }

  /* 스켈레톤 — fetch 가 늦을 때 화면이 비어 보이지 않게 펄스 바 채움 */
  function fillSkeleton(ul, lines) {
    ul.innerHTML = '';
    for (var i = 0; i < lines; i++) {
      var li = document.createElement('li');
      li.className = 'helix-emergency-modal_skeleton';
      ul.appendChild(li);
    }
  }

  function render(data) {
    var m = ensureModal();
    m.querySelector('.helix-emergency-modal_name').textContent = data.name || '';
    fillList(m.querySelector('.helix-emergency-modal_highlights'), data.highlights);

    var notesSection = m.querySelector('.helix-emergency-modal_notes');
    var notesList = notesSection.querySelector('.helix-emergency-modal_notes-list');
    if (Array.isArray(data.catNotes) && data.catNotes.length) {
      notesSection.style.display = '';
      fillList(notesList, data.catNotes);
    } else {
      notesSection.style.display = 'none';
    }

    var panel = m.querySelector('.helix-emergency-modal_panel');
    if (panel) panel.scrollTop = 0;
  }

  function open(data) {
    var m = ensureModal();
    render(data);
    lastFocus = document.activeElement;
    document.documentElement.classList.add('helix-emergency-modal-open');
    document.body.classList.add('helix-emergency-modal-open');
    m.style.display = 'flex';
    requestAnimationFrame(function () {
      m.classList.add('is-open');
      var closeBtn = m.querySelector('.helix-emergency-modal_close');
      if (closeBtn) {
        try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); }
      }
    });
  }

  function close() {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;
    modalEl.classList.remove('is-open');
    document.documentElement.classList.remove('helix-emergency-modal-open');
    document.body.classList.remove('helix-emergency-modal-open');
    setTimeout(function () {
      if (modalEl && !modalEl.classList.contains('is-open')) {
        modalEl.style.display = '';
      }
    }, 320);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
    lastFocus = null;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
      e.preventDefault();
      close();
    }
  });

  /* 카드 → {slug, name} 추출. 우선순위는 click 핸들러와 동일. */
  function resolveTarget(el) {
    if (!el || !el.closest) return null;
    var trigger = el.closest('[data-emergency-open]');
    if (trigger) {
      var s = (trigger.getAttribute('data-emergency-open') || '').trim();
      if (!s) return null;
      var n = '';
      for (var j = 0; j < NAME_TO_SLUG.length; j++) {
        if (NAME_TO_SLUG[j][1] === s) { n = NAME_TO_SLUG[j][0]; break; }
      }
      return { slug: s, name: n };
    }
    var card = el.closest('.em_card');
    if (!card) return null;
    var text = card.textContent || '';
    for (var i = 0; i < NAME_TO_SLUG.length; i++) {
      if (text.indexOf(NAME_TO_SLUG[i][0]) >= 0) {
        return { slug: NAME_TO_SLUG[i][1], name: NAME_TO_SLUG[i][0] };
      }
    }
    return null;
  }

  /* 카드에 손가락 닿는/마우스 누르는 순간 미리 JSON 받아오기 — 클릭 떨어질 때쯤 도착 */
  function prefetch(e) {
    if (!e.target) return;
    var t = resolveTarget(e.target);
    if (t && t.slug) fetchSymptom(t.slug);
  }
  document.addEventListener('pointerdown', prefetch, { passive: true });

  /* 페이지 로드 직후 11개 증상 JSON 전부 병렬 프리페치 — 클릭 시점엔 메모리 캐시 hit.
     idle 콜백으로 띄워서 페이지 초기 페인트 방해 안 함. */
  function prefetchAll() {
    NAME_TO_SLUG.forEach(function (pair) { fetchSymptom(pair[1]); });
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetchAll, { timeout: 1500 });
  } else {
    setTimeout(prefetchAll, 400);
  }

  document.addEventListener('click', function (e) {
    var t = resolveTarget(e.target);
    if (!t || !t.slug) return;
    e.preventDefault();
    log('click open', t.slug);

    /* 즉시 모달 셸 표시 — 이름은 카드 텍스트에서 바로 꺼내 채움.
       상세 내용은 fetch 끝나면 채워넣음. 그 사이엔 스켈레톤. */
    open({ name: t.name || t.slug, highlights: [], catNotes: [] });
    var mNow = ensureModal();
    fillSkeleton(mNow.querySelector('.helix-emergency-modal_highlights'), 2);
    var notesSection = mNow.querySelector('.helix-emergency-modal_notes');
    notesSection.style.display = '';
    fillSkeleton(notesSection.querySelector('.helix-emergency-modal_notes-list'), 3);

    fetchSymptom(t.slug).then(function (data) {
      if (!modalEl || !modalEl.classList.contains('is-open')) return;
      if (!data) {
        data = { name: t.name || t.slug, highlights: ['상세 정보 준비 중입니다.'], catNotes: [] };
      }
      render(data);
    });
  });

  log('ready (ref=' + getRef() + ')');
})();
