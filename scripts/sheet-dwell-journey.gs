/* ================================================================
   헬릭스 측정 요약 — "체류·동선" 시트 자동 생성 (Google Apps Script)
   ================================================================
   요약 스프레드시트에 [체류·동선] 탭을 만들고, 원본 로그를 읽어
   네 가지 표를 채운다.

     1. 방문 하나가 얼마나 머무나        (방문 수 / 평균·중앙값 체류)
     2. 페이지별 — 한 페이지에 몇 초 머무나
     3. 동선 — 어디서 어디로 옮겨 갔나   (이동 쌍 집계)
     4. 방문별 동선 상세                 (최근 방문의 페이지 순서)

   ▸ 체류시간을 두 가지 방식으로 잰다
     - 실측(active_sec)  : global/page-time.js 가 보낸 값. 탭을 다른
                           창으로 돌리거나 자리를 비운 시간은 빠져 있어
                           '실제로 본 시간' 에 가깝다.
     - 간격 추정         : 같은 방문 안에서 다음 페이지로 넘어갈 때까지의
                           시간. 실측이 없는 기록도 대략을 볼 수 있게 하려는
                           보조 수단(마지막 페이지는 알 수 없어 제외).
     두 값을 나란히 두어, 실측이 쌓이기 전에도 감을 잡을 수 있게 했다.

   ▸ 동선은 방문 표식(sid) 이 있는 기록만 쓴다
     한 방문 안의 페이지 진입을 시각(같으면 step) 순으로 이어붙인다.
     sid 가 없던 옛 기록은 누가 누구인지 가를 수 없어 제외 — 넣으면
     서로 다른 사람의 이동이 한 사람의 동선으로 붙어 버린다.

   ── 쓰는 법 ──────────────────────────────────────────────────
   1) 요약 스프레드시트에서 [확장 프로그램] → [Apps Script]
   2) 이 파일 내용을 통째로 붙여넣고 저장 (Ctrl+S)
   3) 스프레드시트 탭으로 돌아가 브라우저 새로고침 (F5)
   4) 상단 메뉴에 [📊 체류·동선] 이 생긴다 → [지금 새로 만들기] 클릭
      (처음 한 번은 권한 허용 창이 뜬다 — 본인 계정이므로 허용)
   5) [체류·동선] 탭이 생기며 표가 채워진다

   Apps Script 화면에서 직접 실행하는 방법도 그대로 남아 있다
   (함수 목록에서 buildDwellJourney 선택 후 실행). 메뉴 쪽이 편해서
   그걸 기본으로 안내한다.

   기간은 아래 PERIOD_DAYS 로 조절. 0 이면 전체 기간.
   ================================================================ */

/** 원본 로그 스프레드시트 ID (Helix AMC — 사이트 이벤트 로그) */
var LOG_SPREADSHEET_ID = '1llPxKf_TyLt2G_DucyQNBzxbzhzGBXyYOhxAMnp_sG0';

/** 최근 며칠을 볼 것인가. 0 = 전체 기간 */
var PERIOD_DAYS = 30;

/** 결과를 쓸 탭 이름 */
var OUT_SHEET_NAME = '체류·동선';

/** 방문별 상세에 몇 개 방문까지 보여줄 것인가 */
var DETAIL_LIMIT = 40;

/* 빼고 싶은 방문의 표식(sid) 목록 — 운영자 본인이 둘러본 기록 지우기용.

   앞으로 들어올 기록은 사이트의 제외 스위치(?helix-noga=1)로 막으면 되지만,
   이미 쌓인 것은 여기서 빼야 한다. 4번 표 '방문별 동선 상세' 의 맨 오른쪽
   '방문 표식' 칸에서 본인 방문(시각·동선을 보면 알아볼 수 있다)의 값을
   복사해 아래에 따옴표로 감싸 쉼표로 이어 붙이면 된다.

   예) var EXCLUDE_SIDS = ['msfi5ua2-0vv9m9', 'msf00002-zzzzzz']; */
var EXCLUDE_SIDS = [];

/** 페이지 키를 사람이 읽는 이름으로 */
var PAGE_LABEL = {
  home: '홈 /',
  seocho: '서초 /seocho',
  discover: '소개 /discover-helix',
  about: '소개 /discover-helix',
  faq: 'FAQ /faq',
  emergency: '응급증상 /symptoms',
  services: '진료과목 /services'
};

/* ================================================================
   메뉴 — 스프레드시트를 열 때 상단에 [📊 체류·동선] 을 붙인다
   ================================================================
   Apps Script 편집기의 실행 버튼을 찾아 들어가지 않아도, 시트 상단
   메뉴에서 바로 돌릴 수 있게 하려는 것. 이 함수는 스프레드시트를
   열 때 구글이 알아서 부른다(따로 실행할 필요 없음).
   → 붙여넣고 저장한 뒤 시트를 새로고침(F5) 해야 메뉴가 나타난다. */
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('📊 체류·동선')
    .addItem('지금 새로 만들기', 'buildDwellJourney')
    .addSeparator()
    .addItem('매일 아침 자동 갱신 켜기', 'installDailyTrigger')
    .addItem('자동 갱신 끄기', 'removeDailyTrigger')
    .addToUi();

  /* 로그가 한없이 길어지지 않게 달별 탭으로 덜어내는 메뉴.
     실제 기능은 같은 프로젝트의 sheet-log-monthly.gs 에 있다 —
     그 파일을 안 넣었으면 눌렀을 때 '함수를 찾을 수 없습니다' 가 뜬다. */
  ui.createMenu('📁 로그 달별 정리')
    .addItem('지금 상태 보기', 'showLogSheetStatus')
    .addItem('지금 달별로 나누기', 'rollLogByMonth')
    .addSeparator()
    .addItem('매일 새벽 자동 정리 켜기', 'installMonthlyLogTrigger')
    .addItem('자동 정리 끄기', 'removeMonthlyLogTrigger')
    .addToUi();

  /* 요약 표 14개를 수식이 아니라 스크립트가 직접 그린다.
     실제 기능은 같은 프로젝트의 sheet-summary-build.gs 에 있다 —
     그 파일을 안 넣었으면 눌렀을 때 '함수를 찾을 수 없습니다' 가 뜬다.
     기존 요약 탭은 건드리지 않고 [요약(새 방식)] 탭에 나란히 그린다. */
  ui.createMenu('📊 요약 표(새 방식)')
    .addItem('지금 새로 만들기', 'buildSummaryTables')
    .addSeparator()
    .addItem('기준값과 대조하기 (2026년 8월)', 'verifySummaryAgainstBaseline')
    .addToUi();

  /* 이 시트가 어떻게 짜여 있는지(수식·표 제목) 글 파일로 뽑는다.
     Claude 는 시트의 수식을 볼 수 없어서, 이걸 한 번 돌려 두면
     "어느 칸을 어떻게 고쳐야 하는지" 를 정확히 짚을 수 있다.
     실제 기능은 같은 프로젝트의 sheet-structure-export.gs 에 있다. */
  ui.createMenu('🧰 진단')
    .addItem('요약 시트 구조 내보내기', 'exportSummaryStructure')
    .addToUi();
}

/* ================================================================
   메인
   ================================================================ */
function buildDwellJourney() {
  var since = PERIOD_DAYS > 0 ? Date.now() - PERIOD_DAYS * 86400000 : 0;
  var rows = readLog_(since);
  var events = parseEvents_(rows, since);

  if (!events.length) {
    /* 왜 비었는지 바로 알 수 있게 근거를 같이 적는다 — 읽은 탭과 줄 수,
       조회 기간. (예전에 빈 탭을 읽고 이유 없이 "없습니다" 만 나왔다) */
    writeSheet_([
      ['헬릭스 — 체류시간 · 동선'],
      ['조회 기간에 기록이 없습니다.'],
      ['원본에서 읽은 곳: ' + (LOG_SOURCE_NAME || '(못 찾음)') + ' / 원본 줄 수: ' + rows.length],
      ['조회 기간: ' + periodText_(PERIOD_DAYS)],
      ['기간을 넓히려면 스크립트 위쪽 PERIOD_DAYS 를 0 으로 바꾸세요 (전체 기간).']
    ]);
    toast_('기록을 찾지 못했습니다 — 탭 안의 안내를 확인해 주세요.');
    return;
  }

  var visits = groupVisits_(events);
  var out = [];

  out.push(['헬릭스 — 체류시간 · 동선']);
  var head = periodText_(PERIOD_DAYS) + ' · 방문 ' + visits.length + '건 · 기록 ' +
             (events.length - visits.skippedEvents) + '건';
  if (visits.excludedEvents) {
    head += '   · 직접 빼기로 지정한 기록 ' + visits.excludedEvents + '건 제외';
  }
  if (visits.skippedEvents) {
    head += '   (방문 표식이 없던 옛 기록 ' + visits.skippedEvents +
            '건은 제외 — 누가 누구인지 가를 수 없어 넣으면 동선이 뒤엉킵니다)';
  }
  out.push([head]);
  out.push(['갱신 시각: ' + fmtDateTime_(new Date()) + ' · 원본: ' + LOG_SOURCE_NAME]);
  out.push([]);

  pushBlock_(out, tableVisitSummary_(visits));
  pushBlock_(out, tablePageDwell_(visits));
  pushBlock_(out, tableFlow_(visits));
  pushBlock_(out, tableVisitDetail_(visits));

  writeSheet_(out);
  toast_('완료 — [' + OUT_SHEET_NAME + '] 탭에 방문 ' + visits.length + '건을 정리했습니다.');
}

/** 매일 아침 자동 갱신 켜기 */
function installDailyTrigger() {
  removeDailyTrigger();
  ScriptApp.newTrigger('buildDwellJourney').timeBased().atHour(7).everyDays(1).create();
  toast_('매일 아침 7시에 자동으로 새로 만듭니다.');
}

/** 자동 갱신 끄기 */
function removeDailyTrigger() {
  var all = ScriptApp.getProjectTriggers();
  var n = 0;
  for (var i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'buildDwellJourney') { ScriptApp.deleteTrigger(all[i]); n++; }
  }
  if (n) toast_('자동 갱신을 껐습니다.');
}

/** 화면 오른쪽 아래에 잠깐 뜨는 알림 */
function toast_(msg) {
  try { SpreadsheetApp.getActive().toast(msg, '체류·동선', 6); } catch (e) {}
}

/* ================================================================
   ① 로그 읽기 · 해석
   ================================================================ */
/* 원본 로그 파일에서 '진짜 기록이 있는 탭' 을 모두 찾아 읽는다.

   처음엔 그냥 첫 번째 탭(getSheets()[0])을 읽었는데, 로그 파일의 첫
   탭이 비어 있어서 "기록이 없습니다" 만 나왔다. 그래서 머리글에
   '이벤트명' 이 있는 탭을 찾도록 바꿨다.

   [2026-08-28] 로그가 달별로 나뉘면서(받는 탭 [log] + 지난달 탭
   [log 2026-07] …) 한 탭만 읽으면 지난달 기록이 통째로 빠진다.
   그래서 '이벤트명' 머리글을 가진 탭을 **전부** 읽어 이어붙인다.
   조회 기간 밖인 달 탭은 아예 열지 않는다(느려지지 않게).
   머리글 줄이 섞여 들어와도 parseEvents_ 가 시간 칸을 못 읽어
   알아서 건너뛴다. */
var LOG_SOURCE_NAME = '';   /* 어느 탭을 읽었는지 — 시트 맨 윗줄에 적는다 */

function readLog_(sinceMs) {
  var sheets = SpreadsheetApp.openById(LOG_SPREADSHEET_ID).getSheets();
  var picked = [];
  var fallback = null, fallbackRows = -1;

  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    var rows = sh.getLastRow();
    if (rows < 2) continue;

    var head = sh.getRange(1, 1, 1, Math.min(8, sh.getLastColumn() || 1)).getValues()[0].join('|');
    if (head.indexOf('이벤트명') >= 0) {
      if (monthTabOutOfPeriod_(sh.getName(), sinceMs)) continue;
      picked.push(sh);
      continue;
    }
    if (rows > fallbackRows) { fallback = sh; fallbackRows = rows; }
  }

  /* 머리글로 못 찾으면 예전처럼 '줄 수가 가장 많은 탭' 하나를 쓴다 */
  if (!picked.length && fallback) picked.push(fallback);

  if (!picked.length) { LOG_SOURCE_NAME = '(빈 파일)'; return []; }

  var all = [];
  var names = [];
  for (var j = 0; j < picked.length; j++) {
    var values = picked[j].getDataRange().getValues();
    names.push(picked[j].getName() + ' ' + values.length + '줄');
    for (var k = 0; k < values.length; k++) all.push(values[k]);
  }
  LOG_SOURCE_NAME = names.join(' + ') + ' 탭';
  return all;
}

/* 'log 2026-07' 처럼 달 이름이 붙은 탭이 조회 기간보다 앞서면 건너뛴다.
   달 이름이 없는 탭([log] 등)은 항상 읽는다. */
function monthTabOutOfPeriod_(name, sinceMs) {
  if (!sinceMs) return false;
  var m = String(name).match(/(\d{4})-(\d{1,2})$/);
  if (!m) return false;
  var monthEnd = new Date(+m[1], +m[2], 1).getTime();   /* 그 달의 다음 달 1일 0시 */
  return monthEnd < sinceMs;
}

/** 한 줄을 {t, name, page, device, sid, step, prev, source, activeSec} 로 */
function parseEvents_(rows, sinceMs) {
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r || r.length < 2) continue;

    var t = toMillis_(r[0]);
    if (!t) continue;                       /* 헤더행·빈행 */
    if (sinceMs && t < sinceMs) continue;

    var name = String(r[1] || '');
    if (!name) continue;

    var p = safeJson_(r[5]);
    var page = String(r[2] || p.page || '');
    if (page === 'about') page = 'discover'; /* 옛 표기 통합 */

    out.push({
      t: t,
      name: name,
      page: page,
      device: String(r[3] || p.device || ''),
      sid: String(p.sid || ''),
      step: numOr_(p.step, 0),
      prev: String(p.prev || ''),
      source: String(p.source || ''),
      activeSec: numOr_(p.active_sec, -1),
      isView: /_page_view$/.test(name),
      isTime: /_time_on_page$/.test(name)
    });
  }
  out.sort(function (a, b) { return a.t - b.t; });
  return out;
}

/** 같은 방문끼리 묶는다 — 방문 표식(sid) 이 있는 기록만.

   sid 가 없던 시절(2026-08-03 이전) 기록은 일부러 뺀다. 예전엔 기기
   종류(mobile/desktop) 말고는 사람을 가를 단서가 없어, 그걸로 묶으면
   서로 다른 사람의 이동이 한 사람의 동선으로 이어붙어 버린다.
   실제로 그렇게 해봤더니 "62분짜리 방문", "홈→서초→홈→FAQ" 같은
   있지도 않은 동선이 만들어져 숫자가 오히려 거짓말을 했다.
   빠진 건수는 맨 윗줄에 적어 둔다. */
function groupVisits_(events) {
  var bySid = {};
  var order = [];
  var skipped = 0;
  var excluded = 0;

  /* 빼기로 지정한 방문 표식 — 빠른 조회를 위해 표로 만들어 둔다 */
  var drop = {};
  for (var d = 0; d < EXCLUDE_SIDS.length; d++) drop[String(EXCLUDE_SIDS[d]).trim()] = true;

  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (!e.sid) { skipped++; continue; }
    if (drop[e.sid]) { excluded++; continue; }
    if (!bySid[e.sid]) { bySid[e.sid] = []; order.push(e.sid); }
    bySid[e.sid].push(e);
  }

  var visits = [];
  for (var j = 0; j < order.length; j++) visits.push(makeVisit_(order[j], bySid[order[j]]));

  visits.sort(function (a, b) { return b.start - a.start; });
  visits.skippedEvents = skipped;
  visits.excludedEvents = excluded;
  return visits;
}

function makeVisit_(sid, evs) {
  evs.sort(function (a, b) {
    if (a.t !== b.t) return a.t - b.t;
    return (a.step || 0) - (b.step || 0);
  });

  var v = {
    sid: sid,
    events: evs,
    start: evs[0].t,
    end: evs[evs.length - 1].t,
    device: '',
    source: ''
  };
  v.durationSec = Math.round((v.end - v.start) / 1000);

  for (var i = 0; i < evs.length; i++) {
    if (!v.device && evs[i].device) v.device = evs[i].device;
    if (!v.source && evs[i].source) v.source = evs[i].source;
  }

  /* ── 이 방문이 지나간 페이지 순서 ──────────────────────────
     page_view 를 시간(같으면 step) 순으로 이어붙인다. 새로고침 등으로
     같은 페이지가 연달아 나오면 하나로 접는다(동선이 지저분해짐). */
  var seq = [];
  for (var j = 0; j < evs.length; j++) {
    if (!evs[j].isView || !evs[j].page) continue;
    if (seq.length && seq[seq.length - 1].page === evs[j].page) continue;
    seq.push({ page: evs[j].page, t: evs[j].t, prev: evs[j].prev });
  }
  v.seq = seq;

  /* ── 페이지별 체류 ────────────────────────────────────────
     실측(active_sec 합계) 과 간격 추정(다음 이벤트까지) 을 따로 담는다. */
  var real = {};
  var est = {};
  for (var k = 0; k < evs.length; k++) {
    if (evs[k].isTime && evs[k].page && evs[k].activeSec >= 0) {
      real[evs[k].page] = (real[evs[k].page] || 0) + evs[k].activeSec;
    }
  }
  for (var n = 0; n < seq.length - 1; n++) {
    var gap = Math.round((seq[n + 1].t - seq[n].t) / 1000);
    if (gap > 0 && gap < 1800) est[seq[n].page] = (est[seq[n].page] || 0) + gap;
  }
  v.realDwell = real;
  v.estDwell = est;

  return v;
}

/* ================================================================
   ② 표 만들기
   ================================================================ */

/** 1. 방문 하나가 얼마나 머무나 */
function tableVisitSummary_(visits) {
  var durs = [], pages = [];
  for (var i = 0; i < visits.length; i++) {
    durs.push(visits[i].durationSec);
    pages.push(visits[i].seq.length);
  }
  if (!durs.length) { durs = [0]; pages = [0]; }

  var rows = [
    ['1. 방문 하나가 얼마나 머무나'],
    ['지표', '값', '설명'],
    ['방문 수', visits.length, '30분간 아무 움직임이 없으면 새 방문으로 셉니다'],
    ['평균 체류시간', secText_(avg_(durs)), '한 번 방문에서 사이트를 떠날 때까지'],
    ['중앙값 체류시간', secText_(median_(durs)), '절반의 방문은 이 시간보다 오래 머뭅니다'],
    ['가장 오래 머문 방문', secText_(Math.max.apply(null, durs)), ''],
    ['방문당 페이지 수', round1_(avg_(pages)), '1 에 가까우면 첫 페이지만 보고 나갑니다'],
    ['1페이지만 보고 나간 비율', pct_(count_(pages, function (n) { return n <= 1; }), pages.length),
      '높을수록 첫 화면에서 발길을 돌린다는 뜻'],
    ['30초 이상 머문 방문', pct_(count_(durs, function (n) { return n >= 30; }), durs.length),
      '내용을 실제로 읽은 방문의 비중']
  ];
  return rows;
}

/** 2. 페이지별 — 한 페이지에 몇 초 머무나 */
function tablePageDwell_(visits) {
  var acc = {};   /* page → {realSum, realN, estSum, estN, views} */
  function slot(p) {
    if (!acc[p]) acc[p] = { realSum: 0, realN: 0, estSum: 0, estN: 0, views: 0 };
    return acc[p];
  }

  for (var i = 0; i < visits.length; i++) {
    var v = visits[i];
    for (var j = 0; j < v.seq.length; j++) slot(v.seq[j].page).views++;
    for (var p in v.realDwell) { var s = slot(p); s.realSum += v.realDwell[p]; s.realN++; }
    for (var q in v.estDwell)  { var e = slot(q); e.estSum  += v.estDwell[q];  e.estN++;  }
  }

  var list = [];
  for (var page in acc) {
    var a = acc[page];
    list.push({
      page: page,
      views: a.views,
      real: a.realN ? a.realSum / a.realN : null,
      realN: a.realN,
      est: a.estN ? a.estSum / a.estN : null
    });
  }
  list.sort(function (x, y) { return y.views - x.views; });

  var rows = [
    ['2. 페이지별 — 한 페이지에 몇 초 머무나'],
    ['페이지', '열린 횟수', '실측 체류(평균)', '실측 건수', '간격 추정(평균)', '비고']
  ];
  for (var k = 0; k < list.length; k++) {
    var it = list[k];
    rows.push([
      PAGE_LABEL[it.page] || it.page,
      it.views,
      it.real === null ? '—' : secText_(it.real),
      it.realN,
      it.est === null ? '—' : secText_(it.est),
      it.real === null ? '실측은 새 측정 배포 뒤부터 쌓입니다' : ''
    ]);
  }
  rows.push(['', '', '', '', '', '']);
  rows.push(['※ 실측 = 실제로 화면을 보고 있던 시간(자리 비움 제외). 간격 추정 = 다음 페이지로 넘어갈 때까지의 시간(마지막 페이지는 알 수 없어 빠짐).']);
  return rows;
}

/** 3. 동선 — 어디서 어디로 옮겨 갔나 */
function tableFlow_(visits) {
  var pair = {};
  var entry = {};
  var exit = {};

  for (var i = 0; i < visits.length; i++) {
    var seq = visits[i].seq;
    if (!seq.length) continue;
    entry[seq[0].page] = (entry[seq[0].page] || 0) + 1;
    exit[seq[seq.length - 1].page] = (exit[seq[seq.length - 1].page] || 0) + 1;
    for (var j = 0; j < seq.length - 1; j++) {
      var key = seq[j].page + '\t' + seq[j + 1].page;
      pair[key] = (pair[key] || 0) + 1;
    }
  }

  var list = [];
  for (var k in pair) {
    var kv = k.split('\t');
    list.push({ from: kv[0], to: kv[1], n: pair[k] });
  }
  list.sort(function (a, b) { return b.n - a.n; });

  var rows = [['3. 동선 — 어디서 어디로 옮겨 갔나'], ['어디서', '→', '어디로', '건수']];
  if (!list.length) {
    rows.push(['(페이지를 두 곳 이상 본 방문이 아직 없습니다)', '', '', '']);
  }
  for (var m = 0; m < Math.min(list.length, 25); m++) {
    rows.push([
      PAGE_LABEL[list[m].from] || list[m].from, '→',
      PAGE_LABEL[list[m].to] || list[m].to, list[m].n
    ]);
  }

  rows.push(['', '', '', '']);
  rows.push(['들어온 첫 페이지', '', '마지막으로 보고 나간 페이지', '']);
  var eKeys = sortedKeys_(entry), xKeys = sortedKeys_(exit);
  var rowsN = Math.max(eKeys.length, xKeys.length);
  for (var n = 0; n < rowsN; n++) {
    rows.push([
      n < eKeys.length ? (PAGE_LABEL[eKeys[n]] || eKeys[n]) : '',
      n < eKeys.length ? entry[eKeys[n]] : '',
      n < xKeys.length ? (PAGE_LABEL[xKeys[n]] || xKeys[n]) : '',
      n < xKeys.length ? exit[xKeys[n]] : ''
    ]);
  }
  return rows;
}

/** 4. 방문별 동선 상세 */
function tableVisitDetail_(visits) {
  var rows = [
    ['4. 방문별 동선 상세 (최근 ' + DETAIL_LIMIT + '개 방문)'],
    ['시작 시각', '기기', '유입처', '페이지 수', '체류', '어떤 순서로 봤나', '방문 표식']
  ];
  var shown = 0;
  for (var i = 0; i < visits.length && shown < DETAIL_LIMIT; i++) {
    var v = visits[i];
    if (!v.seq.length) continue;
    shown++;
    var path = [];
    for (var j = 0; j < v.seq.length; j++) path.push(PAGE_LABEL[v.seq[j].page] || v.seq[j].page);
    rows.push([
      fmtDateTime_(new Date(v.start)),
      v.device || '',
      v.source || '',
      v.seq.length,
      secText_(v.durationSec),
      path.join('  →  '),
      v.sid
    ]);
  }
  if (shown === 0) rows.push(['(표시할 방문이 없습니다)', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '']);
  rows.push(['※ 내 방문을 빼려면 그 줄의 \'방문 표식\' 값을 복사해, 스크립트 위쪽 EXCLUDE_SIDS 에 넣고 다시 새로 만드세요.']);
  return rows;
}

/* ================================================================
   ③ 시트에 쓰기
   ================================================================ */
function writeSheet_(rows) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(OUT_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(OUT_SHEET_NAME);
  sh.clear();

  var width = 1;
  for (var i = 0; i < rows.length; i++) width = Math.max(width, rows[i].length);
  var grid = [];
  for (var j = 0; j < rows.length; j++) {
    var r = rows[j].slice();
    while (r.length < width) r.push('');
    grid.push(r);
  }

  sh.getRange(1, 1, grid.length, width).setValues(grid);

  /* 제목 줄 굵게 — 숫자로 시작하는 표 제목과 맨 위 제목 */
  sh.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  for (var k = 0; k < grid.length; k++) {
    var first = String(grid[k][0] || '');
    if (/^\d\. /.test(first)) {
      sh.getRange(k + 1, 1, 1, width).setFontWeight('bold').setBackground('#e8f0fe');
    } else if (first === '지표' || first === '페이지' || first === '어디서' || first === '시작 시각') {
      sh.getRange(k + 1, 1, 1, width).setFontWeight('bold').setBackground('#f1f3f4');
    }
  }

  sh.setFrozenRows(3);
  for (var c = 1; c <= width; c++) sh.autoResizeColumn(c);
  sh.getRange(1, 1, grid.length, width).setVerticalAlignment('middle');
}

function pushBlock_(out, rows) {
  for (var i = 0; i < rows.length; i++) out.push(rows[i]);
  out.push([]);
  out.push([]);
}

/* ================================================================
   ④ 잔심부름
   ================================================================ */
/* 시간 칸을 밀리초로. 날짜 칸일 수도, 글자일 수도, 엑셀식 숫자일 수도 있어
   세 가지를 모두 받아준다. 못 읽으면 0 (그 줄은 건너뜀). */
function toMillis_(v) {
  /* 날짜 객체 — instanceof 대신 getTime 유무로 판정(환경 차이에 안전) */
  if (v && typeof v.getTime === 'function') {
    var ms = v.getTime();
    return isNaN(ms) ? 0 : ms;
  }
  if (typeof v === 'number' && v > 0) return Math.round((v - 25569) * 86400000);

  var s = String(v || '').trim();
  if (!s || s === '시간') return 0;

  /* 2026-07-31 14:59:46 / 2026.7.31 14:59 / 2026/7/31T14:59 */
  var m = s.match(/^(\d{4})[-.\/\s]+(\d{1,2})[-.\/\s]+(\d{1,2})[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0).getTime();

  /* 2026. 8. 1 오전 11:20:29 (한국어 표기) */
  var k = s.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (k) {
    var h = +k[5];
    if (k[4] === '오후' && h < 12) h += 12;
    if (k[4] === '오전' && h === 12) h = 0;
    return new Date(+k[1], +k[2] - 1, +k[3], h, +k[6], k[7] ? +k[7] : 0).getTime();
  }

  var d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function safeJson_(v) {
  var s = String(v || '').trim();
  if (!s || s.charAt(0) !== '{') return {};
  try { return JSON.parse(s); } catch (e) { return {}; }
}

function numOr_(v, dflt) {
  var n = Number(v);
  return isNaN(n) ? dflt : n;
}

function avg_(a) {
  if (!a.length) return 0;
  var s = 0;
  for (var i = 0; i < a.length; i++) s += a[i];
  return s / a.length;
}

function median_(a) {
  if (!a.length) return 0;
  var b = a.slice().sort(function (x, y) { return x - y; });
  var m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}

function count_(a, fn) {
  var n = 0;
  for (var i = 0; i < a.length; i++) if (fn(a[i])) n++;
  return n;
}

function pct_(n, total) {
  if (!total) return '0%';
  return Math.round((n / total) * 1000) / 10 + '%';
}

function round1_(n) { return Math.round(n * 10) / 10; }

/** 초를 사람이 읽는 말로 — 90 → "1분 30초" */
function secText_(sec) {
  var s = Math.round(sec);
  if (s < 60) return s + '초';
  var m = Math.floor(s / 60);
  var r = s % 60;
  return r ? m + '분 ' + r + '초' : m + '분';
}

function sortedKeys_(obj) {
  var keys = [];
  for (var k in obj) keys.push(k);
  keys.sort(function (a, b) { return obj[b] - obj[a]; });
  return keys;
}

function fmtDateTime_(d) {
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
         ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function periodText_(days) {
  return days > 0 ? '최근 ' + days + '일' : '전체 기간';
}
