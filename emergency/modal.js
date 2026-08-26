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

  /* GA4 — 사이트 공통 패턴(<이벤트>_<device>, beacon). 측정은 정식 도메인에서만
     (ga4-base 도메인 게이트가 스테이징에선 no-op). */
  function emGa(eventName, params) {
    try {
      var device = window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop');
      var p = params || {};
      p.device = device;
      var name = eventName + '_' + device;
      if (typeof window.gtag === 'function') {
        p.transport_type = 'beacon';
        window.gtag('event', name, p);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        p.event = name;
        window.dataLayer.push(p);
      }
    } catch (e) {}
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

  /* 11개 증상 데이터 인라인 — 클릭 시 네트워크 0회로 즉시 모달 표시.
     전체 합쳐도 ~3.7KB 라 bootstrap 부담 없음. 데이터 수정 시 여기 + data/*.json 둘 다 갱신.
     (data/*.json 은 인라인에 없는 slug 들어와도 동작하도록 fallback 으로 유지) */
  var INLINE_DATA = {
    'collapse': { name: '온몸에 힘이 없음',
      highlights: ['억지로 세우거나 걷게 하지 말기', '목·가슴 압박 금지'],
      catNotes: ['소리 없이 갑자기 주저앉거나 몸에 힘없이 늘어짐', '고개를 들기 어려워함', '일시적으로 회복돼도 재발 가능성이 높아 즉시 내원 필요'] },
    'severe-pain': { name: '극심한 통증',
      highlights: ['사람용 진통제 절대 금지', '조심히 이동'],
      catNotes: ['울음 없이 조용해지는 것 자체가 심한 통증 신호', '빠르고 얕은 호흡, 몸을 말고 숨어버리는 행동', '만지면 으르렁거리거나 갑작스러운 공격성 증가'] },
    'proptosis': { name: '안구돌출',
      highlights: ['안구를 눌러 넣으려고 하지 말기', '생리식염수 적신 거즈로 안구 보호'],
      catNotes: ['발생 빈도는 낮지만 조직 손상이 더 빠르게 진행됨', '안구 주변 피하출혈이 심하게 나타남', '통증으로 발로 눈을 긁다 악화될 수 있어 즉각적 보호 필요'] },
    'hemorrhage': { name: '과다출혈',
      highlights: ['깨끗한 천으로 압박', '출혈 부위를 위로 향하기'],
      catNotes: ['적은 출혈에도 빠르게 빈혈이 진행될 수 있음', '행동이 갑자기 조용해지거나 호흡이 빨라짐', '겉으로 보이지 않는 내부 출혈 가능성도 고려 필요'] },
    'dyspnea': { name: '호흡곤란',
      highlights: ['가슴·목 압박 금지', '불필요한 자극 최소화'],
      catNotes: ['가슴과 복부가 크게 들썩이는 복식호흡', '앞다리를 벌리고 선 자세', '숨소리 없이 조용히 숨 차하는 모습'] },
    'hyperthermia': { name: '고체온',
      highlights: ['체온 서서히 낮추기', '얼음물 사용 금지'],
      catNotes: ['헐떡임 없이 조용히 진행되는 고체온', '호흡이 약간 빨라지거나 몸을 바닥에 깊게 늘어뜨림', '차 안이나 좁은 공간에 장시간 있었던 경우 특히 위험'] },
    'hypothermia': { name: '저체온',
      highlights: ['담요로 체온 서서히 올리기', '핫팩은 수건에 감싸 간접 사용'],
      catNotes: ['떨림 없이 바로 무기력해지고 움직임이 줄어듦', '몸을 둥글게 말고 꼼짝 않는 자세 유지', '잇몸·혀가 창백하거나 차가움'] },
    'seizure': { name: '발작',
      highlights: ['억지로 잡거나 입에 손 넣지 말기', '발작 시간 기록'],
      catNotes: ['짧은 멍해짐, 시선 고정, 턱 떨림', '갑자기 깜짝 놀란 듯 뛰어오르는 동작', '발작 후 일시적 공격성 증가'] },
    'syncope': { name: '실신',
      highlights: ['가능하면 실신 순간 영상 확보', '물·음식 즉시 섭취 금지'],
      catNotes: ['심장 관련 부정맥과 연관된 경우가 많음', '짧게 회복돼도 매우 위험', '허탈·구토·급격한 불안 동반 가능'] },
    'shock': { name: '쇼크',
      highlights: ['담요 등으로 체온 유지', '과한 움직임 금지'],
      catNotes: ["심박수가 정상이거나 오히려 낮아지는 '숨은 쇼크'", '과도하게 얕은 호흡, 몸을 말고 숨어버리는 행동', '잇몸이 창백하거나 노란빛을 띰'] },
    'paralysis': { name: '마비',
      highlights: ['억지로 걷게 하지 말기', '최대한 움직임 최소화해 이동'],
      catNotes: ['갑작스러운 뒷다리 마비와 비명에 가까운 통증', '뒷다리 발바닥이 차갑고 창백함', '호흡 곤란'] }
  };

  var dataCache = {};
  var modalEl = null;
  var lastFocus = null;

  function getRef() {
    if (window.HELIX_REF) return window.HELIX_REF;
    return /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  }

  /* @<SHA> 면 불변이라 버스터 불필요. 붙이면 1분마다 주소가 새것이 돼
     브라우저 캐시가 통째로 무효화된다(방문마다 전부 재다운로드).
     내용이 바뀔 수 있는 @branch 폴백일 때만 붙인다. */
  function bust(ref) {
    return /^[0-9a-f]{7,40}$/i.test(ref) ? '' : ('?t=' + Math.floor(Date.now() / 60000));
  }
  function dataUrl(slug) {
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
           '@' + getRef() + '/emergency/data/' + slug + '.json' + bust(getRef());
  }

  function fetchSymptom(slug) {
    if (dataCache[slug]) return dataCache[slug];
    /* 인라인 데이터 — 네트워크 없이 즉시 resolve */
    if (INLINE_DATA[slug]) {
      var inlined = Promise.resolve(INLINE_DATA[slug]);
      dataCache[slug] = inlined;
      return inlined;
    }
    var url = dataUrl(slug);
    log('fetching', slug, url);
    var p = fetch(url, /[?&]t=/.test(url) ? { cache: 'no-store' } : undefined)
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
        var bkey = branch.getAttribute('data-branch') || '';
        /* 상세모달 CTA 측정 — 서초·일산 모두 집계 (일산 수요 근거 확보, 2026-08 측정 개선) */
        var bname = bkey === 'ilsan' ? '일산' : '서초';
        emGa('emergency_modal_call', { item_type: 'emergency_modal_cta', branch: bname, value: tel });
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

  /* ── 열람 시간 측정 ────────────────────────────────────────────
     이 페이지는 증상 카드 11장이 한 화면에 들어가는 구조라 '스크롤로
     어디까지 읽었나' 가 의미가 없다. 대신 "어떤 증상을 열어서 얼마나
     읽었나" 가 실제 관심도 신호다. 열었다가 바로 닫으면(2초 미만)
     잘못 눌렀거나 원하던 내용이 아니었다는 뜻이라 기록하지 않는다. */
  var READ_MIN_MS = 2000;
  var readFrom = 0, readOf = null;

  function readStart(data) {
    readFrom = Date.now();
    readOf = data || null;
  }

  function readEnd() {
    if (!readFrom || !readOf) { readFrom = 0; readOf = null; return; }
    var ms = Date.now() - readFrom;
    readFrom = 0;
    var t = readOf; readOf = null;
    if (ms < READ_MIN_MS) return;
    emGa('emergency_symptom_read', {
      item_type: 'emergency_symptom_read',
      symptom: t.name || t.slug,
      slug: t.slug,
      read_sec: Math.round(ms / 1000),
      value: Math.round(ms / 1000)
    });
  }

  /* 모달을 열어둔 채 페이지를 떠나거나 탭을 돌리는 경우도 회수 */
  window.addEventListener('pagehide', readEnd);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) readEnd();
  });

  function open(data) {
    var m = ensureModal();
    render(data);
    readStart(data);
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
    readEnd();
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

    /* GA4 — 증상 카드 클릭(상세모달 열기). 어느 증상인지 slug/name 으로 집계. */
    emGa('emergency_symptom_open', { item_type: 'emergency_symptom', symptom: t.name || t.slug, slug: t.slug });

    /* 인라인 데이터가 있으면 바로 풀 렌더 — 스켈레톤 플래시 없음.
       없는 slug 만 스켈레톤 → fetch 폴백. */
    if (INLINE_DATA[t.slug]) {
      open(INLINE_DATA[t.slug]);
      return;
    }
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
