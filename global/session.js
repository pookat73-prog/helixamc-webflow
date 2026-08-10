/* ================================================================
   HELIX AMC — 방문 묶음(세션) + 유입 경로 자동 부착
   ================================================================
   지금까지 로그 시트의 한 줄 한 줄은 서로 남남이었다. "방문수 160" 도
   사람 수가 아니라 페이지가 열린 횟수라, 한 사람이 다섯 번 새로고침하면
   5로 세어졌다. 누가 어디서 들어와 어떤 순서로 움직였는지도 알 수 없었다.

   이 모듈은 모든 측정에 다음 세 가지를 자동으로 붙인다.

   ① sid       — 같은 방문끼리 묶는 값. 30분간 아무 측정이 없으면 새 방문.
                 → 시트에서 sid 를 세면 '사람이 몇 번 왔나',
                   sid 로 묶으면 '한 사람이 어떤 순서로 움직였나' 가 보인다.
   ② source    — 어디서 들어왔나 (naver / google / kakao / instagram /
                 ad(utm 있음) / direct / 그 외 도메인). 방문 첫 순간에
                 한 번 정하고 그 방문 내내 유지 — 사이트 안에서 페이지를
                 옮겨 다녀도 최초 유입처가 유지되도록.
   ③ visitor   — new / returning. 이 브라우저의 첫 방문인지.

   utm 이 붙어 들어온 경우 utm_source/medium/campaign 도 함께 싣는다.

   동작 방식: window.gtag 를 감싸 event 호출의 파라미터 객체에 값을
   '제자리에서' 채워 넣는다. 같은 객체를 sheet-log.js 도 그대로 읽으므로
   GA4 와 구글 시트 양쪽에 동일하게 들어간다(로드 순서 무관).

   저장은 localStorage — 탭을 여러 개 띄워도 같은 방문으로 묶인다.
   차단된 환경(사생활 보호 모드 등)에서는 메모리로 폴백해 조용히 동작.

   ⚠️ 측정은 정식 사이트에서만 — 스테이징(*.webflow.io)은 즉시 종료.
   디버그: URL 에 ?debug-ga=1
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixSessionInit) return;
  window.__helixSessionInit = true;

  if (/\.webflow\.io$/i.test(location.hostname)) return;
  /* 운영자 제외 — global/measure-gate.js 가 켜 둔 표시가 있으면 측정 안 함
     (?helix-noga=1 로 켠 브라우저) */
  if (window.__helixNoMeasure) return;


  var DEBUG = /[?&]debug-ga=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[helix-sess]'].concat([].slice.call(arguments)));
  }

  var KEY_SESS = 'helix_sess';
  var KEY_SEEN = 'helix_seen';
  var TTL      = 30 * 60 * 1000;   /* 30분 무활동 → 새 방문 (업계 통용 기준) */

  /* localStorage 가 막힌 브라우저(사생활 보호 등)에서도 죽지 않도록 폴백 */
  var mem = {};
  function get(k) {
    try { var v = localStorage.getItem(k); return v === null ? mem[k] : v; }
    catch (e) { return mem[k]; }
  }
  function set(k, v) {
    mem[k] = v;
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function newId() {
    /* 사람을 식별하는 값이 아니라 '이번 방문' 을 묶는 임시 표식.
       개인정보가 들어가지 않도록 난수 + 시각만 쓴다. */
    return Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2, 8);
  }

  /* ── 유입처 판정 ─────────────────────────────────────────────
     검색·SNS 는 도메인으로, 광고는 utm 유무로 가른다. 사이트 내부
     이동(같은 호스트)은 유입이 아니므로 direct 로 취급하지 않고
     '방문 첫 순간에 정한 값' 을 그대로 유지한다(아래 ensure 참고). */
  function classify(ref, qp) {
    if (qp.get('utm_source') || qp.get('utm_medium') || qp.get('gclid') || qp.get('fbclid')) {
      return qp.get('utm_source') ? 'ad:' + qp.get('utm_source') : 'ad';
    }
    if (!ref) return 'direct';
    var host = '';
    try { host = new URL(ref).hostname.toLowerCase(); } catch (e) { return 'other'; }
    if (host === location.hostname.toLowerCase()) return 'internal';
    if (/naver\./.test(host))                 return 'naver';
    if (/google\./.test(host))                return 'google';
    if (/daum\.|kakao\./.test(host))          return 'daum';
    if (/instagram\./.test(host))             return 'instagram';
    if (/facebook\.|fb\./.test(host))         return 'facebook';
    if (/youtube\.|youtu\.be/.test(host))     return 'youtube';
    if (/bing\./.test(host))                  return 'bing';
    return host;   /* 그 외는 도메인 그대로 — 나중에 시트에서 눈으로 확인 */
  }

  /* ── 현재 방문 확보 (없거나 30분 지났으면 새로 시작) ───────── */
  function ensure() {
    var now = Date.now();
    var s = null;
    try { s = JSON.parse(get(KEY_SESS) || 'null'); } catch (e) { s = null; }

    if (s && s.ts && (now - s.ts) < TTL) {
      s.ts = now;                    /* 활동 갱신 — 계속 같은 방문 */
      set(KEY_SESS, JSON.stringify(s));
      return s;
    }

    /* 새 방문 시작 — 이 순간의 유입처를 기록해 방문 내내 유지한다.
       내부 이동으로 새 방문이 시작된 경우(30분 넘게 머물다 이동 등)
       'internal' 이 되는데, 유입처로는 의미가 없어 direct 로 둔다. */
    var qp  = new URLSearchParams(location.search);
    var src = classify(document.referrer || '', qp);
    if (src === 'internal') src = 'direct';

    var seen = get(KEY_SEEN);
    s = {
      id: newId(),
      ts: now,
      src: src,
      ref: (document.referrer || '').slice(0, 200),
      land: location.pathname,                      /* 이번 방문의 첫 페이지 */
      utm_source:   qp.get('utm_source')   || '',
      utm_medium:   qp.get('utm_medium')   || '',
      utm_campaign: qp.get('utm_campaign') || '',
      visitor: seen ? 'returning' : 'new'
    };
    set(KEY_SESS, JSON.stringify(s));
    set(KEY_SEEN, '1');
    log('새 방문 시작', s);
    return s;
  }

  /* ── 이번 방문에서 몇 번째로 연 페이지인가 (동선) ──────────────
     sid 만으로는 "같은 방문" 인 것만 알 뿐, 어떤 순서로 옮겨 다녔는지는
     시각(초 단위) 으로 추측해야 했다. 같은 초에 여러 이벤트가 찍히면
     순서가 뒤섞여 동선이 어긋난다. 그래서 페이지를 열 때마다 번호를
     매기고(step), 직전 페이지 주소(prev) 를 함께 싣는다.
     → 시트에서 sid 로 묶고 step 으로 정렬하면 동선이 그대로 나오고,
       prev → page 쌍을 세면 '어디서 어디로 갔나' 가 집계된다. */
  var PATH   = location.pathname || '/';
  var stepNo = 1;
  var prevPath = '';

  function bumpPage() {
    var s = ensure();
    s.n = (typeof s.n === 'number' ? s.n : 0) + 1;
    prevPath = s.last || '';         /* 직전에 보던 페이지 (첫 페이지면 빈값) */
    s.last = PATH;
    stepNo = s.n;
    set(KEY_SESS, JSON.stringify(s));
    log('페이지 순서', stepNo, '| 직전', prevPath || '(없음)');
  }

  /* ── 전환(문의로 이어지는 행동) 자동 태깅 ──────────────────────
     "전환" 이라 부를 만한 행동이 전화·상담·길찾기·주소복사로 흩어져 있어,
     한 표로 세려면 이벤트 이름을 일일이 나열해야 했다. 전화만 세면 30일에
     10여 건뿐이라 "의료진을 본 쪽이 1.7배" 같은 비교가 한두 건에 뒤집히는
     상태였다(측정 보고서 05-하나: 전환의 정의가 너무 좁다).

     여기서 이벤트 이름만 보고 conv=1 + conv_type 을 자동으로 붙인다.
     각 측정 모듈은 손댈 필요가 없고, 새 전환 행동이 생기면 아래 표에 한 줄만
     더하면 전 사이트에 적용된다.

     conv_type
       lead    실제 상담 신청 접수 (가장 강한 신호)
       phone   전화 걸기 / 번호 복사
       consult 상담 메뉴 열기 · 신청 폼 열기
       map     길찾기 · 오시는 길
       copy    주소 · 이메일 복사
     ※ vet_chart_click(수의사용 웹차트)은 보호자 전환이 아니라 제외. */
  var CONV_RULES = [
    { type: 'lead',    re: /^cta_form_submit$/ },
    { type: 'phone',   re: /(_phone_call($|_)|^tel_copy_|^cta_call$|^emergency_call_|^emergency_modal_call_)/ },
    { type: 'consult', re: /^cta_(open|form_open)$/ },
    { type: 'map',     re: /(^seocho_directions_|^emergency_map_click_)/ },
    { type: 'copy',    re: /^copy_(address|email)_/ }
  ];

  function convType(name) {
    if (!name) return '';
    for (var i = 0; i < CONV_RULES.length; i++) {
      if (CONV_RULES[i].re.test(name)) return CONV_RULES[i].type;
    }
    return '';
  }

  /* ── 모든 event 파라미터에 제자리 주입 ──────────────────────── */
  function decorate(params, eventName) {
    if (!params || typeof params !== 'object') return params;
    var s = ensure();

    /* 전환 표시 — 이미 모듈이 직접 넣었으면 존중 */
    if (params.conv === undefined) {
      var ct = convType(eventName);
      if (ct) {
        params.conv = 1;
        params.conv_type = ct;
        /* page-time.js 가 "이 방문에서 뭔가 행동을 했나" 를 붙일 수 있게
           같은 창 안에 표시를 남긴다. 한 페이지만 보고 나간 방문을
           만족 이탈 / 읽은 이탈 / 즉시 이탈로 가르는 근거가 된다. */
        window.__helixActed = 1;
        window.__helixActedType = ct;
      }
    }
    /* 이미 값이 있으면 덮지 않는다 — 개별 모듈이 의도적으로 넣은 값 보호 */
    if (!params.sid)     params.sid     = s.id;
    if (!params.step)    params.step    = stepNo;
    if (!params.prev && prevPath) params.prev = prevPath;
    if (!params.source)  params.source  = s.src;
    if (!params.visitor) params.visitor = s.visitor;
    if (!params.landing) params.landing = s.land;
    if (s.utm_source   && !params.utm_source)   params.utm_source   = s.utm_source;
    if (s.utm_medium   && !params.utm_medium)   params.utm_medium   = s.utm_medium;
    if (s.utm_campaign && !params.utm_campaign) params.utm_campaign = s.utm_campaign;
    return params;
  }

  function wrap() {
    var original = window.gtag;
    if (typeof original !== 'function' || original.__helixSessWrapped) return false;
    var wrapped = function () {
      if (arguments[0] === 'event') {
        /* 파라미터를 아예 안 넘긴 호출(예: gtag('event','x'))도 있어
           객체를 만들어 끼워 넣는다. */
        if (typeof arguments[2] !== 'object' || arguments[2] === null) {
          arguments[2] = {};
          arguments.length = Math.max(arguments.length, 3);
        }
        decorate(arguments[2], arguments[1]);
      }
      return original.apply(this, arguments);
    };
    wrapped.__helixSessWrapped = true;
    window.gtag = wrapped;
    return true;
  }

  /* ga4-base.js 가 gtag 를 정의한 뒤에 감싸야 한다. 정상 로드 순서라면
     즉시 성공하지만, 순서가 어긋난 경우를 대비해 잠깐 재시도한다. */
  if (!wrap()) {
    var tries = 0;
    var timer = setInterval(function () {
      if (wrap() || ++tries > 40) clearInterval(timer);   /* 최대 ~4초 */
    }, 100);
  }

  /* 페이지 진입 즉시 방문 확보(첫 이벤트 전에 유입처 고정) +
     이번 페이지의 순서 번호 확정 */
  bumpPage();
  log('준비 완료');
})();
