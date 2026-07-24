/* ================================================================
   HELIX AMC - GA 측정 점검 오버레이 (GA Inspector)
   ================================================================
   URL 에 ?ga-inspect=1 (또는 ?debug-ga=1) 을 붙이고 들어오면, 이 페이지
   어디에 구글 애널리틱스(GA) 측정이 걸려 있는지 화면 위에 바로 보여준다.

   두 가지를 동시에 표시한다:

   ① 측정이 걸린 자리에 형광 테두리 + 배지
      "여기를 누르면 무슨 이벤트가 발사되는지" 를 클릭 전에 눈으로 확인.
      (플로팅 상담 버튼, 푸터 이메일·SNS, 지점 주소복사·전화, 서초 전화 등)

   ② 실시간 발사 로그 패널 (오른쪽 아래)
      gtag 호출을 가로채서, 어떤 측정이든 발사되는 순간 패널에 한 줄씩
      쌓인다. 페이지뷰·스크롤 깊이처럼 특정 버튼이 아니라 페이지 전체에
      걸린 측정도 여기 다 뜬다. 클릭으로 발사된 거면 그 자리 테두리가
      잠깐 초록으로 번쩍인다.

   평소(쿼리 파라미터 없을 때)에는 아무 것도 하지 않는다 — 일반 방문자
   에겐 완전히 투명. FILES 배열에서 ga4-base.js 바로 다음에 로드해
   다른 모듈들이 gtag 를 부르기 전에 가로채기를 걸어 둔다.
   ================================================================ */
(function () {
  'use strict';

  /* 켜는 스위치 — URL 에 ?ga-inspect=1 또는 ?debug-ga=1 있을 때만 동작 */
  if (!/[?&](ga-inspect|debug-ga)=1/.test(location.search)) return;

  /* ⚠️ 측정은 정식 사이트(main)에서만 — 스테이징(*.webflow.io)에선 측정
     자체가 꺼져 있으므로, 점검 오버레이(테두리·배지·실시간 로그)도 표시 안 함. */
  if (/\.webflow\.io$/i.test(location.hostname)) {
    console.log('[helix-ga-inspector] staging(*.webflow.io) — 측정 비활성 상태라 점검기 미표시');
    return;
  }

  /* 중복 주입 가드 */
  if (window.__helixGaInspectorInit) return;
  window.__helixGaInspectorInit = true;

  var GA_ID = 'G-PWCB5MVC32';

  /* ── 페이지 식별 (scroll-depth.js 와 동일 규칙) ── */
  function pageKey() {
    var p = (location.pathname || '/').toLowerCase();
    /* 경로 우선 — discover-helix 는 about 템플릿(+about/bootstrap.js)을 재사용해
       about DOM 마커를 가질 수 있어, DOM 마커보다 경로를 먼저 가린다. */
    if (/discover/.test(p)) return 'discover';
    if (/faq/.test(p) || document.querySelector('.faq_tab-name, [class*="faq-list" i]')) return 'faq';
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    if (/seocho|서초/.test(p)) return 'seocho';
    if (/about/.test(p)) return 'about';
    if (/emergency|응급/.test(p)) return 'emergency';
    return 'home';
  }
  var PAGE = pageKey();

  /* ================================================================
     측정이 걸린 자리 목록 (코드에서 실제로 gtag 가 묶이는 셀렉터)
     selector 가 화면에 있으면 그 자리에 테두리+배지를 그린다.
     event 는 사람이 읽을 라벨(실제 이벤트명은 device/지점에 따라 _* 변동).
  ================================================================ */
  var TARGETS = [
    /* 전 페이지 공통 — 플로팅 상담 CTA */
    { sel: '#hxFctaToggle',         label: '플로팅 · 상담 문의하기', event: 'cta_open' },
    { sel: '#hxFctaCallBtn',        label: '플로팅 · 전화 걸기',  event: 'cta_call' },
    { sel: '#hxFctaFormBtn',        label: '플로팅 · 폼 열기',    event: 'cta_form_open' },
    { sel: '#hxFctaSubmit',         label: '플로팅 · 폼 제출',    event: 'cta_form_submit' },
    /* 푸터 (홈 등) */
    { sel: '.footer-email-clickable', label: '푸터 · 이메일 복사', event: 'copy_email_*' },
    { sel: '.footer-sns-icon',        label: '푸터 · SNS 클릭',    event: 'sns_click_*' },
    /* 홈 지점 카드 */
    { sel: '.copy-text-button',     label: '지점 · 주소 복사',    event: 'copy_address_*' },
    /* tel_copy 는 홈 지점카드 안 전화 링크 전용 핸들러(sections-animations.js).
       .home_branch-card 로 한정하지 않으면 응급 모달 분원 전화(tel: 링크) 등
       사이트 전역 tel: 링크에 오배지됨. */
    { sel: '.home_branch-card a[href^="tel:"]', label: '지점 · 전화번호', event: 'tel_copy_*' },
    { sel: '.home_branch-card a[href]', label: '지점 · 상세페이지 이동', event: 'open_detail_*', match: isBranchDetailLink },
    /* 홈 히어로 메인 CTA */
    { sel: '.discover-helix_button', label: '히어로 · 메인 버튼',  event: 'hero_cta_click_*' },
    /* 홈 "응급상황인가요?" 응급증상 CTA */
    { sel: '.bt-box-3',             label: '홈 · 응급증상 CTA',   event: 'emergency_symptom_cta_*' },
    /* 홈 SVICC 버튼 */
    { sel: '.bt-box-4',             label: 'SVICC 버튼',          event: 'svicc_click_*' },
    /* 서초 전화 */
    { sel: '.branch_phoneno',       label: '서초 · 전화',         event: 'seocho_phone_call' },
    /* 응급 페이지 하단 24시 응급 진료 CTA */
    { sel: '.helix-branch-cta__row', label: '응급 · 지점 전화',   event: 'emergency_call_*' },
    { sel: '.helix-branch-cta__icon-btn[data-action="map"]', label: '응급 · 오시는 길', event: 'emergency_map_click_*' },
    /* 응급 페이지 증상 카드 + 카드 옆/모달 CTA (모두 응급 페이지에만 존재하는 셀렉터).
       카드 옆·모달 CTA 는 일산 제외(서초만) — data-branch/클래스로 서초만 배지. */
    { sel: '.em_card, [data-emergency-open]', label: '응급 · 증상 카드', event: 'emergency_symptom_open_*' },
    { sel: '.call.seocho, .call-seocho', label: '응급 · 서초 전화(카드옆)', event: 'emergency_card_cta_*' },
    { sel: '.map.seocho, .map-seocho',   label: '응급 · 서초 오시는길(카드옆)', event: 'emergency_card_cta_*' },
    { sel: '.helix-emergency-modal_branch[data-branch="seocho"]', label: '응급 · 모달 서초 전화', event: 'emergency_modal_call_*' }
  ];

  /* about(=/discover-helix) 페이지 전용 — .cta-style / .link-block 등은 다른
     페이지에도 존재하므로 이 페이지에서만 표시(오표시 방지). 의료진 지점 버튼은
     텍스트 매칭이라 정적 셀렉터로 안 잡지만, 클릭 시 실시간 로그에 뜸. */
  if (PAGE === 'about' || PAGE === 'discover') {
    /* 섹션 CTA(서초본원·일산·특화·응급)는 .cta_seocho_button/.cta-style 클래스를
       공유 → 클래스만으로는 구분 불가(이중·오라벨). 텍스트로 가려 버튼마다 1개씩. */
    var CTA_FAM = '.cta_seocho_button, .cta-style';
    function hasText(re) { return function (el) { return re.test((el.innerText || '')); }; }
    TARGETS = TARGETS.concat([
      { sel: '.subheader_click-area', label: '소개 · 서브헤더 링크', event: 'subheader_nav_*' },
      { sel: CTA_FAM, label: '소개 · 서초본원 CTA', event: 'about_seocho_cta_*', match: hasText(/서초/) },
      { sel: CTA_FAM, label: '소개 · 응급증상 CTA', event: 'about_emergency_cta_*', match: hasText(/응급|증상/) },
      { sel: CTA_FAM, label: '소개 · 본문 CTA',     event: 'about_cta_*', match: function (el) { var s = el.innerText || ''; return !/일산|특화/.test(s); } },
      { sel: '.link-block',        label: '소개 · 스빅(SVIC)',   event: 'about_svic_cta_*' },
      { sel: '.helix-deck-arrow-left, .helix-deck-arrow-right', label: '소개 · 연혁 화살표', event: 'history_deck_nav_*' },
      { sel: '#cert .cert-plus',   label: '소개 · 인증 카드(+)', event: 'cert_modal_open_*' },
      /* 의료진 지점 버튼 — 고정 클래스가 없어 본문(헤더/푸터 제외)의 짧은
         지점명 버튼을 텍스트로 식별. */
      { sel: 'a, button, [role="button"], [class*="button" i], [class*="btn" i]',
        label: '소개 · 의료진 지점버튼', event: 'doctor_branch_click_*', match: isDoctorBranchEl }
    ]);
  }

  /* 서초본원 페이지 전용 */
  if (PAGE === 'seocho') {
    TARGETS = TARGETS.concat([
      /* 첫 섹션(인트로) 전화 — .heading-2 는 흔한 클래스라 인트로 섹션 안 +
         전화번호 텍스트만 배지. (예약 섹션 전화는 위 .branch_phoneno 배지) */
      { sel: 'section[class*="intro_backgra"] .heading-2', label: '서초 · 첫섹션 전화', event: 'seocho_phone_call',
        match: function (el) { return !el.children.length && /\d{2,3}[.\- ]?\d{3,4}[.\- ]?\d{4}/.test(el.innerText || el.textContent || ''); } },
      { sel: '.subheader_click-area',   label: '서초 · 서브헤더 링크',  event: 'seocho_subheader_nav_*' },
      { sel: '.w-tab-menu .w-tab-link', label: '서초 · 분과 탭',       event: 'seocho_dept_tab_*' },
      { sel: '[data-doctor-open]',      label: '서초 · 의료진 상세(+)', event: 'seocho_doctor_detail_*' },
      { sel: '.naver-map-directions',   label: '서초 · 길찾기',        event: 'seocho_directions_*' }
    ]);
  }

  /* FAQ 페이지 전용 — 질환/일반 양쪽 측정 자리. 질문 카드의 '자세히'
     인디케이터(질환) / 질문 행(일반) 은 faq-stack.js·faq-general.js 가 로드
     후 주입하고, 페이징으로 현재 페이지 항목만 보인다. 인스펙터는 클릭·DOM
     변동 때 재스캔하므로 탭 전환/페이지 이동에 따라 배지가 따라붙는다. */
  if (PAGE === 'faq') {
    TARGETS = TARGETS.concat([
      { sel: '.w-tab-menu .w-tab-link', label: 'FAQ · 탭(질환/일반)', event: 'faq_tab_select' },
      { sel: '[class*="faq-chip" i]',   label: 'FAQ · 필터 칩',      event: 'faq_filter_select',
        match: function (el) { return !/faq-chip_reset/i.test(el.className || ''); } },
      { sel: '[class*="faq-chip_reset" i]', label: 'FAQ · 필터 초기화', event: 'faq_filter_reset' },
      /* 질환 질문 — '자세히' 펼침 버튼(카드마다 1개). 정확한 클래스 토큰으로
         잡아야 함: [class*="..."] 는 하위 label/arrow(__label/__arrow)까지 걸려
         한 버튼에 네모칸이 3중으로 겹침. */
      { sel: '.helix-faq-indicator', label: 'FAQ · 질환 질문 펼치기', event: 'faq_open' },
      /* 일반 질문 — 질문 행(카드마다 1개). 정확한 토큰(하위 qmark/qtext 제외) */
      { sel: '.helix-gfaq-q', label: 'FAQ · 일반 질문 펼치기', event: 'faq_open' },
      /* 페이지 이동 (질환/일반 공통) */
      { sel: '[class*="faq-page-btn" i]', label: 'FAQ · 페이지 이동', event: 'faq_page_nav' }
    ]);
  }

  /* 지점 카드 안에서 상세페이지로 실제 이동하는 링크인지 — sections-animations.js
     의 open_detail 트래커와 동일 판정 (tel/mailto/앵커/외부/자기참조 제외). */
  function isBranchDetailLink(el) {
    var href = el.getAttribute('href') || '';
    if (/^(tel:|mailto:|#|javascript:)/i.test(href.trim())) return false;
    var url;
    try { url = new URL(el.href, location.href); } catch (e) { return false; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname) return false;
    return true;
  }

  /* 의료진 카드의 지점 버튼인지 — 짧은 지점명 정확 매칭 + 헤더/푸터/CTA 제외 */
  function isDoctorBranchEl(el) {
    var s = (el.innerText || '').replace(/\s+/g, ' ').trim();
    /* 일산 분원은 측정 제외 (요청) */
    if (!/^(서초\s*본원|서울동물영상종양센터)$/.test(s)) return false;
    if (el.closest('header, .header, nav, .subheader, footer, .footer, [class*="header" i], [class*="footer" i]')) return false;
    if (el.closest('.cta_seocho_button, .cta-style, .link-block')) return false;
    return true;
  }

  /* 페이지 단위 측정(특정 버튼 아님) — 안내용 칩 */
  var PAGE_LEVEL = [
    PAGE + '_page_view  (페이지 진입 1회)',
    PAGE + '_scroll_depth  (스크롤 25 / 50 / 75 / 100%)'
  ];

  /* ── 클릭 직후 발사된 이벤트를 그 자리에 연결하기 위한 최근 클릭 기록 ── */
  var lastClick = { el: null, t: 0 };
  document.addEventListener('click', function (e) {
    lastClick.el = e.target;
    lastClick.t = Date.now();
  }, true);

  /* ================================================================
     gtag / dataLayer 가로채기 — 어떤 측정이든 발사되면 패널에 기록
     ga4-base.js 가 이미 window.gtag 와 dataLayer 를 정의해 둔 상태.
     원본 함수를 보존하고 감싼다(측정 자체는 그대로 GA 로 전송됨).
  ================================================================ */
  var events = [];   /* {name, params, time, fromClick} */

  function record(name, params) {
    var fresh = (Date.now() - lastClick.t) < 1200;
    var entry = {
      name: name,
      params: params || {},
      time: nowStr(),
      el: fresh ? lastClick.el : null
    };
    events.push(entry);
    if (events.length > 200) events.shift();
    renderLog();
    if (entry.el) flashElement(entry.el);
  }

  function wrap() {
    /* gtag('event', name, params) 만 골라 기록 (config/js/set 은 무시) */
    var origGtag = window.gtag;
    window.gtag = function () {
      try {
        if (arguments[0] === 'event') record(arguments[1], arguments[2]);
      } catch (e) {}
      if (typeof origGtag === 'function') return origGtag.apply(this, arguments);
    };
    /* dataLayer.push 폴백 경로도 가로채기 */
    try {
      window.dataLayer = window.dataLayer || [];
      var origPush = window.dataLayer.push.bind(window.dataLayer);
      window.dataLayer.push = function () {
        try {
          var a = arguments[0];
          if (a && a.event && !a['gtm.start']) record(a.event, a);
        } catch (e) {}
        return origPush.apply(null, arguments);
      };
    } catch (e) {}
  }

  function nowStr() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  /* ================================================================
     UI — 스타일 주입
  ================================================================ */
  function injectStyle() {
    if (document.getElementById('hx-gai-style')) return;
    var s = document.createElement('style');
    s.id = 'hx-gai-style';
    s.textContent = [
      /* 측정 자리 오버레이 레이어 (클릭 방해 안 하도록 pointer-events:none) */
      '#hx-gai-overlay{position:fixed;inset:0;z-index:2147483600;pointer-events:none}',
      '.hx-gai-box{position:absolute;border:2px solid #00e5ff;border-radius:6px;' +
        'background:rgba(0,229,255,.06);' +
        'animation:hx-gai-pulse 1.6s ease-in-out infinite}',
      /* 상시 번쩍 루프 — 클릭 안 해도 측정 걸린 자리가 바로 보이게 */
      '@keyframes hx-gai-pulse{' +
        '0%,100%{box-shadow:0 0 0 2px rgba(0,229,255,.22),0 0 9px rgba(0,229,255,.3)}' +
        '50%{box-shadow:0 0 0 4px rgba(0,229,255,.5),0 0 22px rgba(0,229,255,.7)}}',
      /* 클릭으로 실제 발사된 순간엔 초록으로 강조(루프 잠깐 정지) */
      '.hx-gai-box.flash{border-color:#39ff88;animation:none;' +
        'box-shadow:0 0 0 3px rgba(57,255,136,.5),0 0 20px rgba(57,255,136,.8)}',
      /* 귀퉁이 점 — 측정 지점 마커 */
      '.hx-gai-corner{position:absolute;top:-6px;right:-6px;width:13px;height:13px;' +
        'border-radius:50%;background:#00e5ff;box-shadow:0 0 0 2px #0d1117,0 0 10px #00e5ff;' +
        'animation:hx-gai-dot 1.6s ease-in-out infinite}',
      '@keyframes hx-gai-dot{0%,100%{transform:scale(1);opacity:.85}' +
        '50%{transform:scale(1.5);opacity:1}}',
      '.hx-gai-tag{position:absolute;top:-11px;left:-2px;max-width:240px;' +
        'font:600 11px/1.4 -apple-system,system-ui,sans-serif;color:#001016;' +
        'background:#00e5ff;padding:1px 7px;border-radius:5px;white-space:nowrap;' +
        'overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 4px rgba(0,0,0,.3)}',
      /* 패널 */
      '#hx-gai-panel{position:fixed;right:14px;bottom:14px;width:340px;max-width:92vw;' +
        'max-height:62vh;display:flex;flex-direction:column;z-index:2147483640;' +
        'background:#0d1117;color:#e6edf3;border:1px solid #1f6feb;border-radius:12px;' +
        'box-shadow:0 10px 40px rgba(0,0,0,.55);font:13px/1.5 -apple-system,system-ui,sans-serif;' +
        'overflow:hidden}',
      '#hx-gai-panel.min{max-height:none}',
      '#hx-gai-panel.min .hx-gai-body,#hx-gai-panel.min .hx-gai-sub{display:none}',
      '.hx-gai-head{display:flex;align-items:center;gap:8px;padding:10px 12px;' +
        'background:#161b22;border-bottom:1px solid #21262d;cursor:default}',
      '.hx-gai-dot{width:8px;height:8px;border-radius:50%;background:#39ff88;flex:0 0 auto;' +
        'box-shadow:0 0 8px #39ff88}',
      '.hx-gai-title{font-weight:700;font-size:13px}',
      '.hx-gai-title small{display:block;font-weight:400;color:#8b949e;font-size:11px;margin-top:1px}',
      '.hx-gai-head .hx-gai-spacer{flex:1}',
      '.hx-gai-btn{cursor:pointer;border:1px solid #30363d;background:#21262d;color:#e6edf3;' +
        'border-radius:6px;padding:3px 8px;font-size:11px;line-height:1.4}',
      '.hx-gai-btn:hover{background:#30363d}',
      '.hx-gai-btn.on{background:#1f6feb;border-color:#1f6feb;color:#fff}',
      '.hx-gai-sub{padding:8px 12px;border-bottom:1px solid #21262d;background:#0d1117}',
      '.hx-gai-sub b{color:#58a6ff;font-weight:600}',
      '.hx-gai-chip{display:inline-block;margin:3px 4px 0 0;padding:1px 7px;border-radius:5px;' +
        'background:#161b22;border:1px solid #30363d;color:#adbac7;font-size:11px}',
      '.hx-gai-body{overflow-y:auto;padding:6px 0}',
      '.hx-gai-empty{padding:14px 12px;color:#8b949e;font-size:12px}',
      '.hx-gai-row{padding:7px 12px;border-bottom:1px solid #161b22}',
      '.hx-gai-row .nm{font-weight:600;color:#7ee787;word-break:break-all}',
      '.hx-gai-row .mt{color:#8b949e;font-size:11px;margin-top:1px}',
      '.hx-gai-row .pm{color:#adbac7;font-size:11px;margin-top:2px;word-break:break-all}',
      '.hx-gai-row .pm span{color:#79c0ff}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  /* ── 오버레이 레이어 + 패널 생성 ── */
  var overlay, panel, body, badgeBtn;
  var showBadges = true;
  var boxMap = [];   /* {target, box, tag, el} */

  function buildUI() {
    injectStyle();

    overlay = document.createElement('div');
    overlay.id = 'hx-gai-overlay';
    document.body.appendChild(overlay);

    panel = document.createElement('div');
    panel.id = 'hx-gai-panel';
    panel.innerHTML =
      '<div class="hx-gai-head">' +
        '<span class="hx-gai-dot"></span>' +
        '<div class="hx-gai-title">GA 측정 점검' +
          '<small>' + GA_ID + ' · ' + PAGE + ' 페이지</small></div>' +
        '<span class="hx-gai-spacer"></span>' +
        '<button class="hx-gai-btn on" data-act="badges">측정 위치</button>' +
        '<button class="hx-gai-btn" data-act="clear">지우기</button>' +
        '<button class="hx-gai-btn" data-act="min">_</button>' +
      '</div>' +
      '<div class="hx-gai-sub">' +
        '<b>페이지 단위 측정</b>' +
        PAGE_LEVEL.map(function (t) { return '<span class="hx-gai-chip">' + esc(t) + '</span>'; }).join('') +
      '</div>' +
      '<div class="hx-gai-body"></div>';
    document.body.appendChild(panel);
    body = panel.querySelector('.hx-gai-body');
    badgeBtn = panel.querySelector('[data-act="badges"]');

    panel.addEventListener('click', function (e) {
      var b = e.target.closest('.hx-gai-btn');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'badges') {
        showBadges = !showBadges;
        b.classList.toggle('on', showBadges);
        overlay.style.display = showBadges ? '' : 'none';
      } else if (act === 'clear') {
        events.length = 0;
        renderLog();
      } else if (act === 'min') {
        panel.classList.toggle('min');
        b.textContent = panel.classList.contains('min') ? '▢' : '_';
      }
    });

    renderLog();
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── 발사 로그 렌더 ── */
  function renderLog() {
    if (!body) return;
    if (!events.length) {
      body.innerHTML = '<div class="hx-gai-empty">아직 발사된 측정이 없습니다.<br>' +
        '버튼을 누르거나 스크롤하면 여기에 실시간으로 쌓입니다.</div>';
      return;
    }
    var html = '';
    for (var i = events.length - 1; i >= 0; i--) {
      var ev = events[i];
      html += '<div class="hx-gai-row">' +
        '<div class="nm">' + esc(ev.name) + '</div>' +
        '<div class="mt">' + ev.time + (ev.el ? ' · 클릭 발사' : ' · 자동') + '</div>' +
        '<div class="pm">' + paramStr(ev.params) + '</div>' +
      '</div>';
    }
    body.innerHTML = html;
  }

  function paramStr(p) {
    if (!p || typeof p !== 'object') return '';
    var out = [];
    for (var k in p) {
      if (!p.hasOwnProperty(k)) continue;
      if (k === 'event' || k === 'transport_type') continue;
      out.push('<span>' + esc(k) + '</span>:' + esc(String(p[k])).slice(0, 60));
    }
    return out.join(' &nbsp; ');
  }

  /* ================================================================
     측정 자리 테두리/배지 — 화면 좌표로 그려 레이아웃 영향 0
  ================================================================ */
  function scanTargets() {
    if (!overlay) return;
    /* 현재 살아있는 박스 제거 후 다시 그림 (DOM 변동/스크롤 대응) */
    overlay.innerHTML = '';
    boxMap = [];
    var seen = [];   /* 한 요소엔 배지 1개만 — 여러 셀렉터에 걸려도 이중 표시 방지 */
    TARGETS.forEach(function (t) {
      var nodes = document.querySelectorAll(t.sel);
      nodes.forEach(function (el) {
        if (!isVisible(el)) return;
        if (isOccluded(el)) return;             /* 모달 등에 가려진 요소엔 배지 안 그림 */
        if (t.match && !t.match(el)) return;   /* 텍스트 등 추가 필터 */
        if (seen.indexOf(el) !== -1) return;    /* 이미 배지 달린 요소면 skip */
        seen.push(el);
        var box = document.createElement('div');
        box.className = 'hx-gai-box';
        var tag = document.createElement('div');
        tag.className = 'hx-gai-tag';
        tag.textContent = t.label + ' › ' + t.event;
        box.appendChild(tag);
        var corner = document.createElement('div');
        corner.className = 'hx-gai-corner';
        box.appendChild(corner);
        overlay.appendChild(box);
        boxMap.push({ el: el, box: box });
      });
    });
    position();
  }

  /* 모달/오버레이 등에 실제로 가려진 요소인지 — 중심점을 히트테스트.
     중심이 뷰포트 밖이면(스크롤로 화면 밖) 판정 skip → 아래쪽 배지는
     스크롤하면 position() 이 따라가므로 그대로 유지. 점검기 오버레이는
     pointer-events:none 라 elementFromPoint 가 무시(배지가 방해 안 함). */
  function isOccluded(el) {
    try {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var vw = window.innerWidth, vh = window.innerHeight;
      if (cx < 0 || cy < 0 || cx > vw || cy > vh) return false; /* 뷰포트 밖 → 가림 판정 안 함 */
      var top = document.elementFromPoint(cx, cy);
      if (!top) return false;
      if (top === el || el.contains(top) || top.contains(el)) return false;
      return true; /* 다른 요소(모달 등)가 위를 덮음 */
    } catch (e) { return false; }
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    var st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
  }

  function position() {
    for (var i = 0; i < boxMap.length; i++) {
      var m = boxMap[i];
      var r = m.el.getBoundingClientRect();
      m.box.style.left = r.left + 'px';
      m.box.style.top = r.top + 'px';
      m.box.style.width = r.width + 'px';
      m.box.style.height = r.height + 'px';
    }
  }

  /* 클릭으로 측정이 발사되면 그 자리 박스를 잠깐 초록으로 번쩍 */
  function flashElement(el) {
    for (var i = 0; i < boxMap.length; i++) {
      var m = boxMap[i];
      if (m.el === el || m.el.contains(el) || (el.contains && el.contains(m.el))) {
        m.box.classList.add('flash');
        (function (box) {
          setTimeout(function () { box.classList.remove('flash'); }, 900);
        })(m.box);
      }
    }
  }

  /* ── 위치 갱신 루프 (스크롤/리사이즈 시 rAF 로 따라감) ── */
  var rafPending = false;
  function onMove() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () { rafPending = false; position(); });
  }

  /* ================================================================
     기동
  ================================================================ */
  function start() {
    buildUI();
    scanTargets();

    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', function () { scanTargets(); }, { passive: true });

    /* 탭 전환 시 배지 재스캔 — Webflow 탭은 활성 탭만 표시(display:none)라,
       숨은 탭(외과·정형외과 등) 의 측정 자리, 클릭으로 열리는 모달(증상
       상세·의료진 상세) 안 CTA, 아코디언 등 — 클릭으로 UI 가 바뀌면 그 요소가
       비로소 보이므로 재스캔해야 배지가 따라감. 디버그 오버레이라 매 클릭
       재스캔해도 부담 없음(디바운스). (측정 자체는 위임이라 항상 발사됨.) */
    document.addEventListener('click', function () {
      setTimeout(scanTargets, 60);
      setTimeout(scanTargets, 340);
    }, true);

    /* 푸터·플로팅 CTA 등은 DOMContentLoaded 이후 늦게 주입됨 → 재스캔 */
    var rescans = [400, 1000, 2000, 3500];
    rescans.forEach(function (ms) { setTimeout(scanTargets, ms); });

    /* DOM 변동도 감지해 재스캔 (과도 호출 방지 위해 디바운스) */
    try {
      var deb;
      var mo = new MutationObserver(function () {
        clearTimeout(deb);
        deb = setTimeout(scanTargets, 250);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 8000);
    } catch (e) {}

    console.log('[helix-ga-inspect] 측정 점검 ON · page=' + PAGE + ' · 측정자리 ' +
      boxMap.length + '개 표시');
  }

  /* gtag 가로채기는 최대한 빨리(다른 모듈이 부르기 전) */
  wrap();

  if (document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();
