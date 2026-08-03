/* ================================================================
   HELIX AMC — 섹션 도달 + 체류시간 측정 (GA4 + 구글 시트 병행)
   ================================================================
   "몇 % 스크롤했나"(global/scroll-depth.js) 와 별개로, "페이지의 어느
   파트까지 실제로 봤나(도달)" 와 "그 파트를 몇 초나 보고 있었나(체류)"
   를 섹션 단위로 측정한다.

   ① 도달 : `<page>_sec_<key>`   — 섹션 진입 시 1회
   ② 체류 : `<page>_dwell_<key>` — 페이지를 떠날 때 누적 초 전송

   ▸ 이벤트 이름 자체를 섹션별로 분리
     GA4 맞춤 측정기준(custom dimension) 등록 없이도 이벤트 보고서에서
     바로 섹션별로 갈라져 보이게 하려는 의도. 파라미터로만 구분하면
     등록 + 탐색 리포트 설정이 필요해져 사용자가 바로 확인 못 함.
     (체류 '초' 값은 GA4 보고서에서 바로 안 보이므로 구글 시트에서 확인)
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
    /* 진료과목 페이지 — 이 분기가 없으면 방문이 home 으로 잘못 집계된다
       (응급증상이 겪었던 것과 같은 문제). */
    if (/(^|\/)services(\/|$)/.test(p) ||
        document.querySelector('[class*="dept-card_"]')) return 'services';
    /* 응급증상은 슬러그가 /symptoms — scroll-depth.js 와 동일 판정 유지 */
    if (/(^|\/)(symptoms|emergency)(\/|$)/.test(p) ||
        document.querySelector('.em_card, [data-emergency-open]')) return 'emergency';
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
    /* 키는 pageKey() 가 돌려주는 값과 정확히 같아야 한다. 소개 페이지는
       주소가 /discover-helix 라 판정이 'discover' 인데 여기 키가 'about'
       이어서 목록을 못 찾고 섹션 측정이 통째로 안 돌고 있었다(로그 시트에서
       소개 방문 28건 대비 섹션 도달 0건으로 발각). 이벤트 이름도
       discover_page_view 와 같은 계열(discover_sec_*)로 맞춰진다. */
    discover: [
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
    /* 진료과목 — 페이지 본문이 진료과 카드 5장이라, 카드 자체를 섹션으로 본다.
       (클래스는 dept-border.js / dept-nav.js 가 쓰는 것과 동일) */
    services: [
      { key: 'im', label: '내과',       sel: '.dept-card_im' },
      { key: 'sg', label: '외과',       sel: '.dept-card_sg' },
      { key: 'di', label: '영상의학과', sel: '.dept-card_di' },
      { key: 'oc', label: '안과',       sel: '.dept-card_oc' },
      { key: 'dt', label: '치과',       sel: '.dept-card_dt' }
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

  /* ================================================================
     ② 체류시간 — 그 파트를 실제로 몇 초 보고 있었나
     ================================================================
     판정: 섹션이 화면의 40% 이상을 덮거나, 섹션 자신의 50% 이상이
     보이면 "보는 중". 두 조건을 OR 로 둔 이유 — 화면보다 긴 섹션은
     자신의 50% 가 절대 안 차고, 짧은 섹션은 화면 40% 를 못 채운다.

     자리 비움 제외: 탭을 다른 창으로 돌리거나(document.hidden),
     60초간 아무 조작이 없으면 타이머를 멈춘다. 안 그러면 창만 띄워두고
     자리를 뜬 시간이 통째로 체류로 잡혀 데이터가 무의미해진다.

     전송 시점: 페이지를 떠날 때(pagehide). 모바일에선 pagehide 가 안
     뜨는 경우가 많아 화면 숨김(visibilitychange) 에서도 보내되, 이미
     보낸 만큼을 뺀 '증가분' 만 보낸다 → 시트에서 그냥 합계 내면 총 체류.
     ================================================================ */
  var DWELL_MIN_MS = 1000;   /* 1초 미만은 '지나감' 으로 보고 기록 안 함 */
  var IDLE_MS      = 60000;  /* 60초간 조작 없으면 자리 비움으로 간주 */
  var TICK_MS      = 5000;   /* 주기 점검 — 가만히 있어도 자리 비움 감지 */

  /* [{ def, els: [...], total: 누적ms, since: 시작ts|null, sent: 전송한ms }] */
  var tracked = [];
  var lastActivity = Date.now();
  var docHidden = false;

  /* els 중 하나라도 '보는 중' 이면 true (데스크탑/모바일 듀얼 마크업 대응 —
     숨은 쪽은 rect 높이가 0 이라 자연히 탈락) */
  function viewing(els) {
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!vh) return false;
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (!r.height) continue;
      var vis = Math.min(vh, r.bottom) - Math.max(0, r.top);
      if (vis <= 0) continue;
      if (vis / vh >= 0.4 || vis / r.height >= 0.5) return true;
    }
    return false;
  }

  /* 타이머 상태 재계산. forceOff 면 열린 타이머를 모두 닫는다. */
  function recompute(forceOff) {
    var t = Date.now();
    var idleAt = lastActivity + IDLE_MS;
    var awake = !docHidden && t < idleAt;
    /* 자리 비움으로 끊는 경우, '마지막 조작 + 60초' 까지만 체류로 인정 */
    var endMark = (!docHidden && t >= idleAt) ? Math.min(t, idleAt) : t;

    for (var i = 0; i < tracked.length; i++) {
      var d = tracked[i];
      var live = !forceOff && awake && viewing(d.els);
      if (live) {
        if (d.since === null) d.since = t;
      } else if (d.since !== null) {
        d.total += Math.max(0, endMark - d.since);
        d.since = null;
      }
    }
  }

  function sendDwell(def, ms) {
    var name = PAGE + '_dwell_' + def.key;
    var sec = Math.round(ms / 1000);
    var params = {
      item_type: 'section_dwell',
      page: PAGE,
      device: device(),
      section_key: def.key,
      section_name: def.label,
      section_index: def.index,
      dwell_sec: sec,
      value: sec
    };
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        window.gtag('event', name, params);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        params.event = name;
        window.dataLayer.push(params);
      }
      log('dwell', name, sec + 's');
    } catch (e) { log('dwell send error', e); }
  }

  /* 누적분 중 아직 안 보낸 증가분만 전송 */
  function flush() {
    recompute(true);
    for (var i = 0; i < tracked.length; i++) {
      var d = tracked[i];
      var delta = d.total - d.sent;
      if (delta < DWELL_MIN_MS) continue;
      d.sent = d.total;
      sendDwell(d.def, delta);
    }
  }

  function initDwell() {
    if (!tracked.length) return;
    docHidden = !!document.hidden;

    var ticking = false;
    function onScroll() {
      lastActivity = Date.now();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; recompute(false); });
    }
    function bump() { lastActivity = Date.now(); }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    var acts = ['mousemove', 'keydown', 'touchstart', 'click', 'wheel'];
    for (var i = 0; i < acts.length; i++) {
      window.addEventListener(acts[i], bump, { passive: true });
    }

    document.addEventListener('visibilitychange', function () {
      docHidden = !!document.hidden;
      if (docHidden) {
        flush();                    /* 모바일 이탈은 대개 여기서 잡힌다 */
      } else {
        lastActivity = Date.now();  /* 돌아왔으면 다시 켜기 */
        recompute(false);
      }
    });
    window.addEventListener('pagehide', flush);

    setInterval(function () { recompute(false); }, TICK_MS);
    recompute(false);               /* 첫 화면에 이미 걸쳐 있는 섹션 시작 */
    log('dwell tracking on for', tracked.length, 'sections');
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
      var els = [];
      for (var j = 0; j < picked.length; j++) {
        var target = resolve(picked[j]);
        if (!target || target.__helixSecDef) continue;
        target.__helixSecDef = def;
        io.observe(target);
        els.push(target);
        observed++;
      }
      if (observed) {
        found++;
        /* 도달과 같은 요소로 체류도 잰다 (셀렉터 이원화 방지) */
        tracked.push({ def: def, els: els, total: 0, since: null, sent: 0 });
      }
    }
    log('page =', PAGE, '| sections observed =', found, '/', DEFS.length);
    initDwell();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
