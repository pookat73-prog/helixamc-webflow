/* ================================================================
   HELIX AMC — 섹션 도달 측정 (GA4 + 구글 시트 병행)
   ================================================================
   "몇 % 스크롤했나"(global/scroll-depth.js) 와 별개로, "페이지의 어느
   파트까지 실제로 봤나" 를 섹션 단위로 측정한다.

   ▸ 이벤트 이름 자체를 섹션별로 분리 (`<page>_sec_<key>`)
     GA4 맞춤 측정기준(custom dimension) 등록 없이도 이벤트 보고서에서
     바로 섹션별로 갈라져 보이게 하려는 의도. 파라미터로만 구분하면
     등록 + 탐색 리포트 설정이 필요해져 사용자가 바로 확인 못 함.
   ▸ gtag 로 보내므로 global/sheet-log.js 가 자동으로 가로채
     구글 시트에도 같이 쌓인다 (별도 배선 불필요).

   대상 페이지: home / about / seocho
   - faq  : 탭+필터로 콘텐츠가 교체되는 구조라 "섹션 도달" 무의미
            (탭 전환·필터·펼침은 faq/faq-ga.js 가 이미 측정 중)
   - emergency : 카드 11개가 한 화면에 들어가는 단일 섹션 구조
            (카드 클릭은 emergency 모듈이 이미 측정 중)

   디버그: URL 에 ?debug-ga=1
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixSectionReachInit) return;
  window.__helixSectionReachInit = true;

  /* ⚠️ 측정은 정식 사이트(main)에서만 — 스테이징(*.webflow.io) 은 원천 skip
     (CLAUDE.md GA4 도메인 게이트 정책과 동일) */
  if (/\.webflow\.io$/i.test(location.hostname)) return;

  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[helix-sec]'].concat([].slice.call(arguments)));
  }

  /* 페이지 식별 — scroll-depth.js 와 동일 판정 (두 측정의 page 값 일치 보장) */
  function pageKey() {
    var p = (location.pathname || '/').toLowerCase();
    if (/discover/.test(p)) return 'discover';
    if (/faq/.test(p) || document.querySelector('.faq_tab-name, [class*="faq-list" i]')) return 'faq';
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    if (/seocho|서초/.test(p)) return 'seocho';
    if (/about/.test(p)) return 'about';
    return 'home';
  }

  /* 섹션 정의 — 위→아래 순서. key 는 GA4 이벤트 이름에 들어가므로 ASCII.
     sel 은 "그 섹션을 대표하는 요소" 셀렉터. 요소 자체가 <section> 이
     아니면 가장 가까운 조상 section 으로 승격해 관측한다(아래 resolve).
     label 은 시트에서 사람이 읽을 한국어 이름. */
  var SECTIONS = {
    home: [
      { key: 'hero',   label: '메인 첫화면',   sel: '.home_slogan, [class*="lackFrame_Image"]' },
      { key: 'sec2',   label: '섹션2',         sel: '.section2-heading', nth: 0 },
      { key: 'sec3',   label: '섹션3',         sel: '.section2-heading', nth: 1 },
      { key: 'branch', label: '지점 카드',     sel: '.home_branch-card' },
      { key: 'svicc',  label: 'SVICC',        sel: '.home_background_svicc' }
    ],
    about: [
      { key: 'hero',      label: '첫화면',        sel: '.about-heading' },
      { key: 'contents',  label: '본문 3박스',    sel: '.about_three_contents-box' },
      /* .clearframe 는 제외 — #hybrid-operation-room 이 ClearFrame 콤보
         클래스를 함께 물고 있어 장비 섹션이 하이브리드실에서 오발사됨 */
      { key: 'equipment', label: '핵심 장비',     sel: 'section.blackframe_image-he' },
      { key: 'hybrid',    label: '하이브리드실',  sel: '#hybrid-operation-room' },
      { key: 'history',   label: '연혁',          sel: '#helix-history' },
      { key: 'family',    label: '보호자',        sel: '#helix-for-family' },
      { key: 'cert',      label: '인증',          sel: '#cert' }
    ],
    seocho: [
      { key: 'hero',  label: '첫화면',   sel: 'section[class*="intro_backgra"]' },
      { key: 'map',   label: '지도',     sel: '#map_naver, .map_naver' },
      { key: 'vets',  label: '의료진',   sel: '#vets, #vets_M' },
      { key: 'phone', label: '전화문의', sel: '#phone' },
      { key: 'photo', label: '공간사진', sel: '#photo' }
    ]
  };

  var PAGE = pageKey();
  var DEFS = SECTIONS[PAGE];
  if (!DEFS) { log('no section map for page =', PAGE, '- skip'); return; }

  function device() { return window.innerWidth <= 767 ? 'mobile' : 'desktop'; }

  /* 데스크탑/모바일 듀얼 마크업 — 같은 셀렉터가 2벌 존재하고 한쪽만 보인다.
     숨은 쪽이 관측되면 스크롤과 무관하게 오발사되므로 반드시 걸러낸다. */
  function isVisible(el) {
    if (!el || el.offsetParent === null) return false;
    var r = el.getClientRects();
    return !!(r && r.length);
  }

  /* 대표 요소 → 실제 관측 대상. 요소가 section 안에 있으면 그 section 을
     쓴다(섹션 전체 진입을 재려는 의도). section 이 없으면 요소 자체. */
  function resolve(el) {
    if (!el) return null;
    if (el.tagName && el.tagName.toLowerCase() === 'section') return el;
    return (el.closest && el.closest('section')) || el;
  }

  var fired = {};

  function send(def) {
    if (fired[def.key]) return;
    fired[def.key] = true;
    var name = PAGE + '_sec_' + def.key;
    var params = {
      item_type: 'section_reach',
      page: PAGE,
      device: device(),
      section_key: def.key,
      section_name: def.label,
      section_index: def.index,
      value: def.index
    };
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        window.gtag('event', name, params);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        params.event = name;
        window.dataLayer.push(params);
      }
      log('reached', name, params);
    } catch (e) { log('send error', e); }
  }

  function init() {
    /* 섹션 상단이 화면 아래 25% 선을 넘어오는 순간 = "이 파트를 봤다".
       화면에 살짝 걸치기만 한 상태에서 오발사되는 것을 막는 여유값. */
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.isIntersecting) continue;
        var def = e.target.__helixSecDef;
        if (!def || !isVisible(e.target)) continue;
        send(def);
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });

    var found = 0;
    for (var i = 0; i < DEFS.length; i++) {
      var def = DEFS[i];
      def.index = i + 1;
      var nodes = document.querySelectorAll(def.sel);
      if (!nodes.length) { log('missing section', def.key, def.sel); continue; }

      /* nth 지정(홈 섹션2/3 처럼 같은 셀렉터가 순서로만 구분되는 경우) */
      var picked = [];
      if (typeof def.nth === 'number') {
        if (nodes[def.nth]) picked.push(nodes[def.nth]);
      } else {
        picked = [].slice.call(nodes);
      }

      /* 듀얼 마크업이면 후보를 모두 관측해두고, 실제로 보이는 쪽이
         먼저 교차할 때 1회만 발사한다(fired 가드로 중복 차단). */
      var observed = 0;
      for (var j = 0; j < picked.length; j++) {
        var target = resolve(picked[j]);
        if (!target || target.__helixSecDef) continue;
        target.__helixSecDef = def;
        io.observe(target);
        observed++;
      }
      if (observed) found++;
    }
    log('page =', PAGE, '| sections observed =', found, '/', DEFS.length);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
