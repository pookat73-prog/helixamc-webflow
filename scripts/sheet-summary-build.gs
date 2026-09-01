/* ================================================================
   헬릭스 측정 요약 — 표 14개를 스크립트가 직접 그린다 (Google Apps Script)
   ================================================================
   지금 요약 탭([헬릭스측정요약가져오기용])은 절반이 시트 수식이다.
   로그를 통째로 끌어오는 수식(IMPORTRANGE) 8벌 + 세는 수식 154자리.
   이 방식은 두 가지로 계속 터진다.

     · 로그가 길어지면 멈춘다 — 8만 줄에 닿으면 "결과가 너무 큽니다".
       9월 1일 기준 5.5만 줄, 하루 1,767줄씩 늘어 9월 중순이 한계.
     · 조용히 빈 표가 된다 — 8월 6일 사고. 날짜 비교가 어긋나 QUERY 가
       오류 대신 빈 결과를 내, 원장님이 사이트 고장으로 오해했다.

   그래서 표를 수식이 아니라 이 스크립트가 직접 그린다. 같은 파일의
   [체류·동선] 탭이 이미 그 방식이고 한 번도 안 터졌다.

   ▸ 이 파일이 하는 일
     원본 로그를 직접 읽어(달별 탭 포함) 표 14개를 새 탭에 그린다.
     기존 요약 탭은 손대지 않는다 — 숫자가 다 맞는 것을 확인한 뒤에
     사람이 옛 수식을 걷어낸다. 안 맞으면 새 탭만 지우면 끝이다.

   ▸ 지금 있는 것을 그대로 옮긴 것이다 (일부러 안 고쳤다)
     옮기는 김에 집계 규칙을 손보면, 숫자가 안 맞을 때 원인이 이사
     때문인지 규칙 변경 때문인지 가릴 수 없다. 그래서 눈에 밟히는
     것들도 그대로 뒀고, 어디가 왜 이상한지는 주석으로 남겼다.
     (표5 와 표8 의 전화 세는 법이 다른 것 · 표1 합계가 표2 와 89
      차이 나는 것 — 둘 다 아래 해당 자리에 설명이 있다.)

   ── 쓰는 법 ──────────────────────────────────────────────────
   1) 요약 스프레드시트에서 [확장 프로그램] → [Apps Script]
   2) ➕ → [스크립트] 로 파일을 만들고(이름 예: 요약표만들기)
      ⚠️ 새 파일에 미리 들어 있는 function myFunction() { } 껍데기를
         반드시 지우고(Ctrl+A → Delete) 이 내용을 붙여넣을 것.
         껍데기 안에 붙여넣으면 함수가 전부 그 안에 갇혀
         "함수를 찾을 수 없습니다" 가 뜬다.
   3) 저장(Ctrl+S) → 스프레드시트로 돌아가 새로고침(F5)
   4) 상단 메뉴 [📊 요약 표(새 방식)] → [지금 새로 만들기]
      (메뉴가 안 보이면 Code.gs 도 최신 내용으로 맞춰야 한다 —
       메뉴는 그 파일의 onOpen 이 만든다. 편집기에서 함수 목록의
       buildSummaryTables 를 골라 ▶ 실행해도 똑같이 만들어진다.)

   ▸ 조회 기간은 지금처럼 숫자 여섯 칸으로
     새 탭 5줄의 B·C·D(시작 년·월·일) F·G·H(종료 년·월·일) 를 고치고
     다시 [지금 새로 만들기] 를 누르면 그 기간으로 다시 그린다.
     새 탭이 아직 없으면 기존 요약 탭의 같은 자리에서 값을 가져온다.

   ▸ 시간대는 원본 로그 쪽을 쓴다 — 중요
     요약 스프레드시트는 America/Los_Angeles 로 되어 있어(한국보다
     16시간 늦음), 그 기준으로 날짜·시각을 계산하면 표6(시간대별)과
     표7(요일별)이 통째로 밀린다. 그래서 날짜·시각·요일은 항상
     원본 로그 스프레드시트의 시간대로 읽는다.

   ⚠️ 같은 프로젝트의 다른 파일과 함수 이름이 겹치면 한쪽이 조용히
      덮인다(Apps Script 는 파일이 달라도 이름 공간이 하나다).
      그래서 이 파일의 이름은 전부 sb / SB_ 로 시작한다. 새 함수를
      더할 때도 같은 규칙을 지킬 것.
   ================================================================ */

/** 원본 로그 스프레드시트 ID (Helix AMC — 사이트 이벤트 로그) */
var SB_LOG_SPREADSHEET_ID = '1llPxKf_TyLt2G_DucyQNBzxbzhzGBXyYOhxAMnp_sG0';

/** 표를 그릴 탭 이름 — 기존 요약 탭과 나란히 두고 대조한다 */
var SB_OUT_SHEET_NAME = '요약(새 방식)';

/** 조회 기간 입력을 가져올 기존 요약 탭 (새 탭에 값이 없을 때만 본다) */
var SB_SOURCE_TAB = '헬릭스측정요약가져오기용';

/* 빼고 싶은 방문의 표식(sid) — 운영자 본인이 둘러본 기록 지우기용.
   지금 수식에는 이 장치가 없어 비워 둔다. 값을 넣으면 그 방문의
   기록이 모든 표에서 빠지므로, 기존 수식과 숫자를 대조하는 동안에는
   비워 둘 것. 예) var SB_EXCLUDE_SIDS = ['msfi5ua2-0vv9m9']; */
var SB_EXCLUDE_SIDS = [];

/** 로그를 한 번에 몇 줄씩 읽을 것인가 — 실행 시간 6분 상한 회피용 */
var SB_READ_CHUNK = 10000;

/* 의료진 이름 대응표 — params 에 doctor(한글 이름)가 없을 때만 쓴다.
   8월 3일 이전 기록은 영문 slug 만 남아 있어, 이걸 안 거치면 같은
   사람이 '한주열' 과 'hanjuyeol' 두 줄로 갈린다.
   (기존 AG열 수식 안에 박혀 있던 표를 그대로 옮긴 것) */
var SB_DOCTOR_BY_SLUG = {
  imjihyeon: '임지현', gimhyoju: '김효주', baggimseohyeon: '박김서현',
  hongyiju: '홍의주', jeonjonghyi: '전종희', jangmunseog: '장문석',
  igyeongsu: '이경수', gimtaeseong: '김태성', gimjaehyeon: '김재현',
  sonyeongmin: '손영민', jeongdahong: '정다홍', guhaein: '구해인',
  jeongjeongyun: '정정윤', coejimin: '최지민', gimyumin: '김유민',
  seongcanju: '성찬주', joseongu: '조성우', iyeongeun: '이영은',
  hanjuyeol: '한주열', gimyujin: '김유진', gimjonggyeong: '김종경',
  eomharim: '엄하림', hansangjin: '한상진', jojuhyi: '조주희',
  gangyurim: '강유림'
};

/* 표4 — 페이지별 섹션 목록. 순서가 곧 화면의 위→아래 순서이고,
   '여기서 이탈' 이 바로 다음 줄과의 차이라서 순서를 바꾸면 뜻이
   달라진다. 도달률·체류의 분모는 그 페이지의 방문수(표1 의 값). */
var SB_SECTION_GROUPS = [
  { label: '홈', prefix: 'home', denom: 'home', items: [
    ['hero', '메인 첫화면'], ['sec2', '섹션2'], ['sec3', '섹션3'],
    ['branch', '지점 카드'], ['svicc', 'SVICC']
  ]},
  { label: '소개', prefix: 'discover', denom: 'discover', items: [
    ['hero', '첫화면'], ['contents', '본문 3박스'], ['equipment', '핵심 장비'],
    ['hybrid', '하이브리드실'], ['history', '연혁'], ['family', '보호자'],
    ['cert', '인증']
  ]},
  { label: '서초', prefix: 'seocho', denom: 'seocho', items: [
    ['hero', '첫화면'], ['map', '지도'], ['vets', '의료진'],
    ['phone', '전화문의'], ['photo', '공간사진']
  ]},
  { label: '진료과목', prefix: 'services', denom: 'services', items: [
    ['im', '내과'], ['sg', '외과'], ['di', '영상의학과'],
    ['oc', '안과'], ['dt', '치과']
  ]}
];

/* ================================================================
   메인 — 표 14개를 새 탭에 그린다
   ================================================================ */
function buildSummaryTables() {
  var started = new Date();
  var period = sbReadPeriod_();
  var log = sbReadLog_(period);
  var data = sbParse_(log.rows, period);

  /* 결과가 비면 왜 비었는지 탭에 적는다 — 조용히 빈 표를 내놓으면
     사이트가 고장난 줄 오해한다(8월 6일 사고). 읽은 탭·줄 수·기간을
     함께 적어, 어디를 봐야 하는지 바로 알 수 있게. */
  if (!data.rows.length) {
    sbWriteSheet_([
      ['헬릭스 측정 요약 — 이 기간엔 기록이 없습니다'],
      ['조회 기간: ' + period.text],
      ['원본에서 읽은 곳: ' + (log.sourceText || '(못 찾음)')],
      ['원본 줄 수: ' + log.rows.length + '건 (그중 시간 칸을 읽은 것 ' + data.total + '건)'],
      ['기간 칸(5줄의 B·C·D · F·G·H)을 넓힌 뒤 다시 [지금 새로 만들기] 를 눌러 보세요.'],
      ['갱신 시각: ' + sbNowText_()]
    ]);
    sbToast_('이 기간엔 기록이 없습니다 — 탭 안의 안내를 확인해 주세요.');
    return;
  }

  var grid = sbBuildGrid_(period, log, data);
  sbWriteSheet_(grid);

  var sec = Math.round((new Date() - started) / 1000);
  sbToast_('완료 — [' + SB_OUT_SHEET_NAME + '] 탭에 이 기간 ' +
           data.rows.length + '건을 정리했습니다. (' + sec + '초)');
}

/* ================================================================
   ① 조회 기간 — 숫자 여섯 칸
   ================================================================
   원장님이 익숙한 입력 방식을 그대로 둔다(설계서 5절).
   먼저 새 탭의 값을 보고, 없으면 기존 요약 탭에서 가져온다.
   둘 다 없으면 이번 달 1일 ~ 오늘. */
function sbReadPeriod_() {
  var ss = SpreadsheetApp.getActive();
  var got = sbPeriodFromSheet_(ss.getSheetByName(SB_OUT_SHEET_NAME)) ||
            sbPeriodFromSheet_(ss.getSheetByName(SB_SOURCE_TAB));

  if (!got) {
    var now = new Date();
    got = { y1: now.getFullYear(), m1: now.getMonth() + 1, d1: 1,
            y2: now.getFullYear(), m2: now.getMonth() + 1, d2: now.getDate() };
  }

  got.startKey = sbDateKey_(got.y1, got.m1, got.d1);
  got.endKey = sbDateKey_(got.y2, got.m2, got.d2);
  got.text = got.y1 + '년 ' + got.m1 + '월 ' + got.d1 + '일  ~  ' +
             got.y2 + '년 ' + got.m2 + '월 ' + got.d2 + '일';
  /* 달별 탭을 건너뛸지 판단할 때 쓴다(기간 앞의 달은 아예 안 연다) */
  got.startMonth = sbDateKey_(got.y1, got.m1, 1).slice(0, 7);
  got.endMonth = sbDateKey_(got.y2, got.m2, 1).slice(0, 7);
  return got;
}

function sbPeriodFromSheet_(sh) {
  if (!sh || sh.getLastRow() < 5) return null;
  var v = sh.getRange(5, 2, 1, 7).getValues()[0];   /* B5 ~ H5 */
  var y1 = Number(v[0]), m1 = Number(v[1]), d1 = Number(v[2]);
  var y2 = Number(v[4]), m2 = Number(v[5]), d2 = Number(v[6]);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;
  return { y1: y1, m1: m1, d1: d1, y2: y2, m2: m2, d2: d2 };
}

/* ================================================================
   ② 로그 읽기 — 달별 탭까지 전부
   ================================================================
   로그는 [log](이번 달) + [log 2026-07] [log 2026-08] … 로 나뉘어
   있다. 머리글에 '이벤트명' 이 있는 탭을 전부 읽어 이어붙인다.
   조회 기간 밖인 달 탭은 열지 않는다(그만큼 빨라진다).
   한 번에 다 읽지 않고 나눠 읽는다 — 5만 줄이 넘어 실행 시간
   상한(6분)에 걸리지 않게. */
function sbReadLog_(period) {
  var ss = SpreadsheetApp.openById(SB_LOG_SPREADSHEET_ID);
  var sheets = ss.getSheets();
  var picked = [];
  var fallback = null, fallbackRows = -1;

  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (sh.getLastRow() < 2) continue;
    var head = sh.getRange(1, 1, 1, Math.min(8, sh.getLastColumn() || 1)).getValues()[0].join('|');
    if (head.indexOf('이벤트명') >= 0) {
      if (sbMonthTabOutOfPeriod_(sh.getName(), period)) continue;
      picked.push(sh);
    } else if (sh.getLastRow() > fallbackRows) {
      fallback = sh; fallbackRows = sh.getLastRow();
    }
  }
  if (!picked.length && fallback) picked.push(fallback);

  var rows = [];
  var names = [];
  for (var j = 0; j < picked.length; j++) {
    var sheet = picked[j];
    var last = sheet.getLastRow();
    var n = 0;
    for (var start = 2; start <= last; start += SB_READ_CHUNK) {
      var take = Math.min(SB_READ_CHUNK, last - start + 1);
      var block = sheet.getRange(start, 1, take, 6).getValues();
      for (var k = 0; k < block.length; k++) rows.push(block[k]);
      n += take;
    }
    names.push(sheet.getName() + ' ' + n + '줄');
  }

  return {
    rows: rows,
    sourceText: names.length ? names.join(' + ') : '(빈 파일)',
    timeZone: ss.getSpreadsheetTimeZone()
  };
}

/* 'log 2026-07' 처럼 달 이름이 붙은 탭이 조회 기간 밖이면 건너뛴다.
   달 이름이 없는 탭([log] 등)은 언제나 읽는다 — 이번 달치가 거기 있다. */
function sbMonthTabOutOfPeriod_(name, period) {
  var m = String(name).match(/(\d{4})-(\d{1,2})$/);
  if (!m) return false;
  var key = m[1] + '-' + (m[2].length < 2 ? '0' + m[2] : m[2]);
  return key < period.startMonth || key > period.endMonth;
}

/* ================================================================
   ③ 해석 — 한 줄을 표가 쓸 수 있는 모양으로
   ================================================================
   로그 한 줄: 시간 / 이벤트명 / page / device / value / params(JSON).
   기존 요약 탭이 AG~AQ열 수식으로 뽑아 쓰던 값들을 여기서 뽑는다.
   정규식은 그 수식들과 같은 것을 쓴다 — params 가 온전한 JSON 이
   아닌 줄도 있어, JSON.parse 로 바꾸면 결과가 미묘하게 달라진다. */
function sbParse_(rows, period) {
  var tz = sbLogTimeZone_();
  var drop = {};
  for (var d = 0; d < SB_EXCLUDE_SIDS.length; d++) drop[String(SB_EXCLUDE_SIDS[d]).trim()] = true;

  var out = [];
  var total = 0;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r) continue;
    var name = String(r[1] || '');
    if (!name || name === '이벤트명') continue;      /* 머리글 줄 */

    var stamp = sbStamp_(r[0], tz);
    if (!stamp) continue;                            /* 시간을 못 읽는 줄 */
    total++;

    /* 기간 밖이면 params 를 뜯지 않는다 — 5만 줄 × 정규식 7벌은 비싸다 */
    if (stamp.dateKey < period.startKey || stamp.dateKey > period.endKey) continue;

    var params = String(r[5] || '');
    var sid = sbPick_(params, 'sid');
    if (sid && drop[sid]) continue;

    var value = r[4];
    out.push({
      name: name,
      page: String(r[2] || ''),
      device: String(r[3] || ''),
      value: value,
      num: sbNum_(value),
      sid: sid,
      doctor: sbDoctor_(params),
      dept: sbPick_(params, 'dept'),
      source: sbPick_(params, 'source'),
      visitor: sbPick_(params, 'visitor'),
      question: sbPick_(params, 'question'),
      symptom: sbPick_(params, 'symptom'),
      dateKey: stamp.dateKey,
      hour: stamp.hour,
      dow: sbWeekday_(stamp.dateKey)
    });
  }

  return { rows: out, total: total };
}

/* params 에서 값 하나 뽑기 — AG~AQ열의 REGEXEXTRACT 와 같은 규칙 */
function sbPick_(params, key) {
  if (!params) return '';
  var m = params.match(new RegExp('"' + key + '":"([^"]+)"'));
  return m ? m[1] : '';
}

/* 의료진 이름 — doctor(한글)가 있으면 그대로, 없으면 slug 를 한글로.
   요즘 기록은 doctor 를 직접 싣지만(대응표에 없는 이름도 나온다),
   옛 기록은 slug 뿐이라 두 경로를 모두 살려 둔다. */
function sbDoctor_(params) {
  var direct = sbPick_(params, 'doctor');
  if (direct) return direct;
  var slug = sbPick_(params, 'slug');
  if (!slug) return '';
  return SB_DOCTOR_BY_SLUG[slug] || '';
}

/* 시간 칸 → { dateKey:'yyyy-MM-dd', hour:0~23 }
   세 가지 모양을 모두 받는다.
     · 날짜 값   : 원본 로그 시트의 시간대로 읽는다 (요약 시트 시간대를
                   쓰면 날짜가 하루씩 밀린다 — 설계서 4절 첫 항목)
     · 글자      : 앞 10자를 날짜, 12번째부터 두 자를 시각으로
                   (기존 AL·AM열 수식과 같은 방식)
     · 엑셀식 숫자: 정수부가 날짜, 소수부가 시각
   못 읽으면 null → 그 줄은 세지 않는다. */
function sbStamp_(v, tz) {
  if (v && typeof v.getTime === 'function') {
    var ms = v.getTime();
    if (isNaN(ms)) return null;
    var s = Utilities.formatDate(v, tz, 'yyyy-MM-dd|H');
    var p = s.split('|');
    return { dateKey: p[0], hour: Number(p[1]) };
  }

  if (typeof v === 'number' && v > 0) {
    var days = Math.floor(v);
    var frac = v - days;
    var base = new Date(Date.UTC(1899, 11, 30) + days * 86400000);
    return {
      dateKey: Utilities.formatDate(base, 'UTC', 'yyyy-MM-dd'),
      hour: Math.floor(frac * 24 + 1e-9)
    };
  }

  var text = String(v || '').trim();
  if (!text) return null;
  var m = text.match(/^(\d{4})[-.\/]\s*(\d{1,2})[-.\/]\s*(\d{1,2})/);
  if (!m) return null;
  var h = text.match(/(\d{1,2}):(\d{2})/);
  var hour = h ? Number(h[1]) : 0;
  if (/오후/.test(text) && hour < 12) hour += 12;
  if (/오전/.test(text) && hour === 12) hour = 0;
  return { dateKey: sbDateKey_(+m[1], +m[2], +m[3]), hour: hour };
}

/* 요일 — 1 이 일요일 (시트의 WEEKDAY 와 같은 규칙) */
function sbWeekday_(dateKey) {
  var p = dateKey.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 1;
}

var SB_TZ_CACHE = '';
function sbLogTimeZone_() {
  if (!SB_TZ_CACHE) {
    SB_TZ_CACHE = SpreadsheetApp.openById(SB_LOG_SPREADSHEET_ID).getSpreadsheetTimeZone();
  }
  return SB_TZ_CACHE;
}

/* ================================================================
   ④ 표 14개 그리기
   ================================================================
   줄·칸 자리를 지금 요약 탭과 똑같이 맞춘다(설계서 3절 결정).
   표를 정리하거나 줄이는 일은 숫자가 다 맞은 뒤에 따로 한다 —
   자리까지 같아야 두 탭을 나란히 놓고 눈으로 대조할 수 있다. */
function sbBuildGrid_(period, log, data) {
  var g = sbGrid_();
  var ev = data.rows;

  /* ── 머리말 ─────────────────────────────────────────────── */
  g.set(1, 'A', '헬릭스 측정 요약');
  g.set(2, 'A', "아래 숫자 여섯 칸만 바꾸면 아래 표 전부가 그 기간으로 다시 계산됩니다. (고친 뒤 메뉴에서 [지금 새로 만들기])");
  g.set(3, 'A', '갱신 시각: ' + sbNowText_() + '  ·  이 탭은 수식이 아니라 스크립트가 그립니다');
  g.set(4, 'B', '시작 년'); g.set(4, 'C', '시작 월'); g.set(4, 'D', '시작 일');
  g.set(4, 'F', '종료 년'); g.set(4, 'G', '종료 월'); g.set(4, 'H', '종료 일');
  g.set(5, 'A', '여기만 고치세요');
  g.set(5, 'B', period.y1); g.set(5, 'C', period.m1); g.set(5, 'D', period.d1);
  g.set(5, 'F', period.y2); g.set(5, 'G', period.m2); g.set(5, 'H', period.d2);
  g.set(6, 'A', '조회 기간: ' + period.text);
  g.set(7, 'A', '전체 ' + data.total + '건 중 이 기간 ' + ev.length + '건');
  g.set(8, 'A', '전체 기간을 보려면 시작 2020/1/1, 종료 2099/12/31 을 넣으세요.');
  g.set(9, 'A', '원본에서 읽은 곳: ' + log.sourceText + '  (시간대 ' + sbLogTimeZone_() + ')');

  /* ── 1. 페이지별 방문 · 끝까지 읽은 비율 ─────────────────── */
  /* 홈·서초·응급에 붙은 조건들은 옛 기록의 혼입과 중복을 걷어내려고
     일부러 넣은 것이다. 그래서 여섯 줄의 방문수 합(4,679)이 표2의
     페이지 열린 횟수(4,768)보다 89 적다 — 버그가 아니다. */
  var pv = {
    home: sbCount_(ev, function (e) { return e.name === 'home_page_view' && String(e.value) === '/'; }),
    seocho: sbCount_(ev, function (e) { return e.name === 'seocho_page_view' && e.page === 'seocho'; }),
    discover: sbCount_(ev, function (e) { return e.name === 'discover_page_view'; }),
    faq: sbCount_(ev, function (e) { return e.name === 'faq_page_view'; }),
    emergency: sbCount_(ev, function (e) {
      return e.name === 'emergency_page_view' ||
             (e.name === 'home_page_view' && String(e.value) === '/symptoms');
    }),
    services: sbCount_(ev, function (e) { return e.name === 'services_page_view'; })
  };
  var done = {
    home: sbCount_(ev, function (e) { return e.name === 'home_scroll_depth' && e.num === 100; }),
    seocho: sbCount_(ev, function (e) { return e.name === 'seocho_scroll_depth' && e.page === 'seocho' && e.num === 100; }),
    discover: sbCount_(ev, function (e) { return e.name === 'discover_scroll_depth' && e.num === 100; }),
    faq: sbCount_(ev, function (e) { return e.name === 'faq_scroll_depth' && e.num === 100; }),
    emergency: sbCount_(ev, function (e) { return e.name === 'emergency_scroll_depth' && e.num === 100; }),
    services: sbCount_(ev, function (e) { return e.name === 'services_scroll_depth' && e.num === 100; })
  };

  g.set(10, 'A', '1. 페이지별 방문 · 끝까지 읽은 비율');
  g.set(11, 'A', '페이지'); g.set(11, 'C', '방문수'); g.set(11, 'D', '끝까지(100%)');
  g.set(11, 'E', '끝까지 비율'); g.set(11, 'F', '비고');

  var pageRows = [
    [12, '홈 /', 'home', '주소가 / 인 것만 — 응급증상 섞임 제거'],
    [13, '서초 /seocho', 'seocho', '페이지칸 있는 것만 — 옛 2배 중복 제거'],
    [14, '소개 /discover-helix', 'discover', ''],
    [15, 'FAQ /faq', 'faq', ''],
    [16, '응급증상 /symptoms', 'emergency', '옛 오분류(home) 합산 복구'],
    [17, '진료과목 /services', 'services', '8/3 부터 측정 시작']
  ];
  for (var p = 0; p < pageRows.length; p++) {
    var row = pageRows[p], key = row[2];
    g.set(row[0], 'A', row[1]);
    g.set(row[0], 'B', key);
    g.set(row[0], 'C', pv[key]);
    g.set(row[0], 'D', done[key]);
    g.set(row[0], 'E', sbPct_(done[key], pv[key]));
    if (row[3]) g.set(row[0], 'F', row[3]);
  }

  /* ── 2. 사람 기준 ───────────────────────────────────────── */
  var allPv = sbCount_(ev, sbIsPageView_);
  var visits = sbSidSet_(ev, function () { return true; });          /* AT열 */
  var callVisits = sbSidSet_(ev, sbIsCallEvent_);                    /* AV열 */
  var vetVisits = sbSidSet_(ev, function (e) { return e.name === 'seocho_sec_vets'; });  /* AX열 */

  var visitCount = sbSetSize_(visits);
  var newPv = sbCount_(ev, function (e) { return sbIsPageView_(e) && e.visitor === 'new'; });

  g.set(19, 'A', "2. 사람 기준 — 몇 '번' 이 아니라 몇 '명분' 인가  (8/3 부터 쌓임)");
  g.set(20, 'A', '지표'); g.set(20, 'B', '값'); g.set(20, 'C', '설명');
  g.set(21, 'A', '순 방문 횟수'); g.set(21, 'B', visitCount); g.set(21, 'C', '같은 사람이 새로고침해도 1로 셉니다');
  g.set(22, 'A', '페이지 열린 횟수'); g.set(22, 'B', allPv); g.set(22, 'C', '새로고침도 각각 셈');
  g.set(23, 'A', '방문당 페이지 수'); g.set(23, 'B', visitCount ? sbRound1_(allPv / visitCount) : ''); g.set(23, 'C', '1에 가까우면 첫 페이지만 보고 나감');
  g.set(24, 'A', '신규 방문 비중'); g.set(24, 'B', sbPct_(newPv, allPv)); g.set(24, 'C', '처음 온 사람의 비중');

  /* ── 3. 전화까지 간 방문의 특징 ─────────────────────────── */
  var callCount = sbSetSize_(callVisits);
  var vetCount = sbSetSize_(vetVisits);
  var vetCall = sbInBoth_(vetVisits, callVisits);
  var noVet = visitCount - vetCount;
  var noVetCall = callCount - vetCall;

  g.set(26, 'A', '3. 전화까지 간 방문의 특징  ← 홈페이지 개선 판단의 핵심');
  g.set(27, 'A', '지표'); g.set(27, 'B', '값'); g.set(27, 'C', '해석');
  g.set(28, 'A', '전체 방문'); g.set(28, 'B', visitCount);
  g.set(29, 'A', '전화까지 간 방문'); g.set(29, 'B', callCount); g.set(29, 'C', '전화·상담전화를 한 번이라도 누른 방문');
  g.set(30, 'A', '전화 전환율'); g.set(30, 'B', sbPct_(callCount, visitCount)); g.set(30, 'C', '100명이 오면 몇 명이 전화하나');
  g.set(32, 'A', '의료진 섹션을 본 방문'); g.set(32, 'B', vetCount); g.set(32, 'C', '서초 의료진 파트까지 스크롤한 방문');
  g.set(33, 'A', '그중 전화까지 간 방문'); g.set(33, 'B', vetCall);
  g.set(34, 'A', '→ 전환율 (A)'); g.set(34, 'B', sbPct_(vetCall, vetCount)); g.set(34, 'C', '의료진을 본 사람의 전화율');
  g.set(35, 'A', '의료진을 안 본 방문'); g.set(35, 'B', noVet);
  g.set(36, 'A', '그중 전화까지 간 방문'); g.set(36, 'B', noVetCall);
  g.set(37, 'A', '→ 전환율 (B)'); g.set(37, 'B', sbPct_(noVetCall, noVet)); g.set(37, 'C', '의료진을 안 본 사람의 전화율');
  g.set(38, 'A', '의료진 열람 효과 (A÷B)');
  g.set(38, 'B', (vetCount && noVet && noVetCall) ? sbRound1_((vetCall / vetCount) / (noVetCall / noVet)) + '배' : '');
  g.set(38, 'C', '1보다 크면 의료진 파트가 전화를 끌어낸다는 뜻');

  /* ── 4. 섹션별 도달 · 체류 · 이탈 ───────────────────────── */
  g.set(40, 'A', '4. 섹션별 — 어디까지 읽고, 몇 초 머물고, 어디서 나가나');
  g.set(41, 'A', '페이지'); g.set(41, 'B', '섹션'); g.set(41, 'C', '도달수');
  g.set(41, 'D', '도달률'); g.set(41, 'E', '방문당 체류(초)'); g.set(41, 'F', '여기서 이탈');

  var r = 42;
  for (var gi = 0; gi < SB_SECTION_GROUPS.length; gi++) {
    var grp = SB_SECTION_GROUPS[gi];
    var denom = pv[grp.denom];
    var reach = [];
    for (var si = 0; si < grp.items.length; si++) {
      reach.push(sbCountName_(ev, grp.prefix + '_sec_' + grp.items[si][0]));
    }
    for (var s2 = 0; s2 < grp.items.length; s2++) {
      var dwell = sbSumValue_(ev, grp.prefix + '_dwell_' + grp.items[s2][0]);
      g.set(r, 'A', grp.label);
      g.set(r, 'B', grp.items[s2][1]);
      g.set(r, 'C', reach[s2]);
      g.set(r, 'D', sbPct_(reach[s2], denom));
      g.set(r, 'E', denom ? sbRound1_(dwell / denom) : '');
      /* 이탈 = 이 섹션 도달수 − 바로 아래 섹션 도달수. 맨 아래 섹션은
         다음이 없어 뺄 수가 없다 → 숫자 대신 '(마지막)' */
      g.set(r, 'F', s2 === grp.items.length - 1 ? '(마지막)' : Math.max(0, reach[s2] - reach[s2 + 1]));
      r++;
    }
  }

  /* ── 5. 모바일 vs PC ────────────────────────────────────── */
  /* ⚠️ 여기의 전화 세는 법은 표8과 다르다. 이 표는 이름에 phone_call 이
     든 것 + emergency_call_* + cta_call 만 세고, 표8이 함께 세는
     tel_copy_*(번호 복사)와 emergency_modal_call_*(응급 팝업 전화)은
     빠진다. 그래서 8월 기준 두 표의 전화가 2건 어긋난다.
     지금은 있는 그대로 옮긴다 — 전환 중에 규칙을 바꾸면 숫자가 안 맞을
     때 원인이 이사 때문인지 규칙 변경 때문인지 가릴 수 없다.
     맞출지 말지는 대조가 끝난 뒤에 따로 정한다. */
  function deviceCalls(dev) {
    return sbCount_(ev, function (e) {
      return e.device === dev &&
             (e.name.indexOf('phone_call') >= 0 ||
              e.name.indexOf('emergency_call_') === 0 ||
              e.name === 'cta_call');
    });
  }
  var mobilePv = sbCount_(ev, function (e) { return sbIsPageView_(e) && e.device === 'mobile'; });
  var deskPv = sbCount_(ev, function (e) { return sbIsPageView_(e) && e.device === 'desktop'; });
  var mobileCall = deviceCalls('mobile');
  var deskCall = deviceCalls('desktop');

  g.set(65, 'A', '5. 모바일 vs PC');
  g.set(66, 'A', '기기'); g.set(66, 'B', '방문수'); g.set(66, 'C', '비중');
  g.set(66, 'D', '전화 건수'); g.set(66, 'E', '전화 전환율');
  g.set(67, 'A', '모바일'); g.set(67, 'B', mobilePv); g.set(67, 'C', sbPct_(mobilePv, allPv));
  g.set(67, 'D', mobileCall); g.set(67, 'E', sbPct_(mobileCall, mobilePv));
  g.set(68, 'A', 'PC'); g.set(68, 'B', deskPv); g.set(68, 'C', sbPct_(deskPv, allPv));
  g.set(68, 'D', deskCall); g.set(68, 'E', sbPct_(deskCall, deskPv));

  /* ── 6. 시간대별 ────────────────────────────────────────── */
  var byHour = [];
  for (var h = 0; h < 24; h++) byHour.push(0);
  var byDow = [0, 0, 0, 0, 0, 0, 0, 0];
  for (var i2 = 0; i2 < ev.length; i2++) {
    if (!sbIsPageView_(ev[i2])) continue;
    if (ev[i2].hour >= 0 && ev[i2].hour < 24) byHour[ev[i2].hour]++;
    byDow[ev[i2].dow]++;
  }

  g.set(70, 'A', '6. 시간대별 방문  ← 야간·새벽 응급 수요 파악');
  g.set(71, 'A', '시각'); g.set(71, 'B', '방문수'); g.set(71, 'D', '시각'); g.set(71, 'E', '방문수');
  for (var hh = 0; hh < 12; hh++) {
    g.set(72 + hh, 'A', hh + '시');
    g.set(72 + hh, 'B', byHour[hh]);
    g.set(72 + hh, 'D', (hh + 12) + '시');
    g.set(72 + hh, 'E', byHour[hh + 12]);
  }

  /* ── 7. 요일별 ──────────────────────────────────────────── */
  var dowName = ['', '일', '월', '화', '수', '목', '금', '토'];
  g.set(85, 'A', '7. 요일별 방문');
  g.set(86, 'A', '요일'); g.set(86, 'B', '방문수');
  for (var w = 1; w <= 7; w++) {
    g.set(86 + w, 'A', dowName[w]);
    g.set(86 + w, 'B', byDow[w]);
  }

  /* ── 8. 전화 · 상담 ─────────────────────────────────────── */
  var homeCall = sbCountPrefix_(ev, 'home_phone_call_') + sbCountPrefix_(ev, 'tel_copy_');
  var seochoCall = sbCountName_(ev, 'seocho_phone_call');
  var faqCall = sbCountName_(ev, 'faq_phone_call');
  var emCall = sbCountPrefix_(ev, 'emergency_call_') + sbCountPrefix_(ev, 'emergency_modal_call_');
  var ctaFormOpen = sbCountName_(ev, 'cta_form_open');
  var ctaFormSubmit = sbCountName_(ev, 'cta_form_submit');

  g.set(95, 'A', '8. 전화 · 상담 (전환 행동)');
  g.set(96, 'A', '행동'); g.set(96, 'B', '건수'); g.set(96, 'C', '비고');
  g.set(97, 'A', '홈 지점카드 전화'); g.set(97, 'B', homeCall); g.set(97, 'C', '옛 이름 합산');
  g.set(98, 'A', '서초 전화'); g.set(98, 'B', seochoCall);
  g.set(99, 'A', 'FAQ 전화'); g.set(99, 'B', faqCall);
  g.set(100, 'A', '응급 전화'); g.set(100, 'B', emCall);
  g.set(101, 'A', '전화 합계'); g.set(101, 'B', homeCall + seochoCall + faqCall + emCall);
  g.set(102, 'A', '상담 메뉴 열기'); g.set(102, 'B', sbCountName_(ev, 'cta_open'));
  g.set(103, 'A', '상담 → 전화 걸기'); g.set(103, 'B', sbCountName_(ev, 'cta_call'));
  g.set(104, 'A', '상담 폼 열기'); g.set(104, 'B', ctaFormOpen);
  g.set(105, 'A', '상담 폼 제출'); g.set(105, 'B', ctaFormSubmit); g.set(105, 'C', '실제 상담 접수');
  g.set(106, 'A', '폼 작성 완료율'); g.set(106, 'B', sbPct_(ctaFormSubmit, ctaFormOpen)); g.set(106, 'C', '낮으면 폼이 길거나 어렵다는 뜻');

  /* ── 9. 진료과목 카드 클릭 ──────────────────────────────── */
  g.set(108, 'A', '9. 진료과목 카드 클릭  ← 어느 과 상세페이지부터 만들지');
  g.set(109, 'A', '과'); g.set(109, 'B', '클릭수');
  var depts = ['내과', '외과', '영상의학과', '안과', '치과'];
  for (var di = 0; di < depts.length; di++) {
    var deptName = depts[di];
    g.set(110 + di, 'A', deptName);
    g.set(110 + di, 'B', sbCount_(ev, function (e) {
      return e.name.indexOf('services_dept_click_') === 0 && e.dept === deptName;
    }));
  }

  /* ── 10. FAQ 질문별 · 11. 응급 증상별 ───────────────────── */
  var faqOpen = sbGroupCount_(ev, function (e) { return e.name === 'faq_open'; }, 'question');
  var faqRead = sbGroupAvg_(ev, function (e) { return e.name === 'faq_read'; }, 'question');
  var symOpen = sbGroupCount_(ev, function (e) { return e.name.indexOf('emergency_symptom_open') === 0; }, 'symptom');
  var symRead = sbGroupAvg_(ev, function (e) { return e.name.indexOf('emergency_symptom_read') === 0; }, 'symptom');

  g.set(116, 'A', '10. FAQ 질문별  ← 많이 열렸는데 평균초가 짧으면 답변이 부실하다는 신호');
  g.set(116, 'G', '11. 응급 증상별');
  g.set(117, 'A', '질문 (열람 많은 순)'); g.set(117, 'B', '열람');
  g.set(117, 'D', '질문 (오래 읽힌 순)'); g.set(117, 'E', '평균초');
  g.set(117, 'G', '증상 (열람 많은 순)'); g.set(117, 'H', '열람');
  g.set(117, 'J', '증상 (오래 읽힌 순)'); g.set(117, 'K', '평균초');
  g.set(118, 'B', '열람'); g.set(118, 'E', '평균초');
  g.set(118, 'H', '열람'); g.set(118, 'K', '평균초');

  sbPutPairs_(g, 119, 'A', 'B', faqOpen);
  sbPutPairs_(g, 119, 'D', 'E', faqRead);
  sbPutPairs_(g, 119, 'G', 'H', symOpen);
  sbPutPairs_(g, 119, 'J', 'K', symRead);

  /* ── 12. 유입 경로 · 13. 의료진 상세보기 · 14. 분과탭 ───── */
  /* 원래 자리는 142줄. 위의 FAQ·증상 표가 그보다 길어지면 겹치므로
     그만큼만 아래로 민다(기간에 따라 줄 수가 변한다). */
  var block1End = 119 + Math.max(faqOpen.length, faqRead.length, symOpen.length, symRead.length);
  var base = Math.max(142, block1End + 2);

  var srcRows = sbGroupCount_(ev, sbIsPageView_, 'source');
  var docRows = sbGroupCount_(ev, function (e) { return e.name.indexOf('seocho_doctor_detail') === 0; }, 'doctor');
  var tabRows = sbGroupCount_(ev, function (e) { return e.name.indexOf('seocho_dept_tab') === 0; }, 'dept');

  g.set(base, 'A', '12. 유입 경로');
  g.set(base, 'D', '13. 의료진 상세보기');
  g.set(base, 'G', '14. 분과탭');
  g.set(base + 1, 'A', '유입처'); g.set(base + 1, 'B', '페이지 열림');
  g.set(base + 1, 'D', '의료진'); g.set(base + 1, 'E', '클릭');
  g.set(base + 1, 'G', '분과'); g.set(base + 1, 'H', '클릭');
  g.set(base + 2, 'B', '열람'); g.set(base + 2, 'E', '열람'); g.set(base + 2, 'H', '열람');

  sbPutPairs_(g, base + 3, 'A', 'B', srcRows);
  sbPutPairs_(g, base + 3, 'D', 'E', docRows);
  sbPutPairs_(g, base + 3, 'G', 'H', tabRows);

  return g.rows;
}

/* 묶어 센 결과를 두 칸(이름·값)에 세로로 적는다.
   결과가 없으면 옛 QUERY 수식과 같은 말을 남긴다 — 빈칸으로 두면
   "측정이 멈춘 것"으로 오해한다. */
function sbPutPairs_(g, startRow, colKey, colVal, pairs) {
  if (!pairs.length) {
    g.set(startRow, colKey, '이 기간엔 기록 없음');
    return;
  }
  for (var i = 0; i < pairs.length; i++) {
    g.set(startRow + i, colKey, pairs[i][0]);
    g.set(startRow + i, colVal, pairs[i][1]);
  }
}

/* ================================================================
   ⑤ 세는 잔심부름
   ================================================================ */
/* 줄·칸 자리를 지정해 표를 짜는 작은 도구.
   set(줄번호, 'C', 값) 처럼 쓰면 빈 자리는 알아서 채워 둔다. */
function sbGrid_() {
  var rows = [];
  return {
    rows: rows,
    set: function (r, col, v) {
      var c = typeof col === 'number' ? col : sbColNum_(col);
      while (rows.length < r) rows.push([]);
      var row = rows[r - 1];
      while (row.length < c) row.push('');
      row[c - 1] = v;
    }
  };
}

function sbColNum_(letters) {
  var n = 0;
  var s = String(letters).toUpperCase();
  for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
  return n;
}

function sbColLetter_(n) {
  var s = '';
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function sbCount_(rows, fn) {
  var n = 0;
  for (var i = 0; i < rows.length; i++) if (fn(rows[i])) n++;
  return n;
}

function sbCountName_(rows, name) {
  return sbCount_(rows, function (e) { return e.name === name; });
}

function sbCountPrefix_(rows, prefix) {
  return sbCount_(rows, function (e) { return e.name.indexOf(prefix) === 0; });
}

/** 값칸(초)의 합 — 표4의 체류에 쓴다 */
function sbSumValue_(rows, name) {
  var s = 0;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].name !== name) continue;
    var n = rows[i].num;
    if (!isNaN(n)) s += n;
  }
  return s;
}

function sbIsPageView_(e) { return /_page_view$/.test(e.name); }

/* 전화까지 간 방문을 가르는 기준 — 옛 AV열 수식의 정규식 그대로.
   이름 어딘가에 phone_call / emergency_call / cta_call 이 든 것.
   (tel_copy_* 번호 복사와 emergency_modal_call_* 은 여기 안 들어간다 —
    표8은 그 둘을 세므로 두 표의 전화 숫자가 다르다. 위 표5 주석 참고) */
function sbIsCallEvent_(e) { return /(phone_call|emergency_call|cta_call)/.test(e.name); }

/** 조건에 맞는 기록의 방문 표식(sid) 모으기 — 빈 것은 빼고 중복 제거 */
function sbSidSet_(rows, pred) {
  var set = {};
  for (var i = 0; i < rows.length; i++) {
    var e = rows[i];
    if (!e.sid) continue;
    if (!pred(e)) continue;
    set[e.sid] = true;
  }
  return set;
}

function sbSetSize_(set) {
  var n = 0;
  for (var k in set) if (set.hasOwnProperty(k)) n++;
  return n;
}

function sbInBoth_(a, b) {
  var n = 0;
  for (var k in a) if (a.hasOwnProperty(k) && b[k]) n++;
  return n;
}

/* 묶어 세기 — 옛 QUERY 의 'group by … order by count desc' 와 같은 결과.
   같은 개수끼리는 이름 순으로 둔다(QUERY 도 묶음을 이름 순으로 만든 뒤
   개수로 다시 세워, 동점이면 이름 순이 남는다). */
function sbGroupCount_(rows, pred, field) {
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var e = rows[i];
    if (!pred(e)) continue;
    var key = e[field];
    if (!key) continue;                       /* 빈 값은 뺀다 */
    map[key] = (map[key] || 0) + 1;
  }
  return sbSortPairs_(map);
}

/** 묶어 평균 내기 — 값칸이 숫자인 기록만 (옛 QUERY 의 avg 와 같다) */
function sbGroupAvg_(rows, pred, field) {
  var sum = {}, cnt = {};
  for (var i = 0; i < rows.length; i++) {
    var e = rows[i];
    if (!pred(e)) continue;
    var key = e[field];
    if (!key) continue;
    if (isNaN(e.num)) continue;
    sum[key] = (sum[key] || 0) + e.num;
    cnt[key] = (cnt[key] || 0) + 1;
  }
  var avg = {};
  for (var k in sum) if (sum.hasOwnProperty(k)) avg[k] = sum[k] / cnt[k];
  return sbSortPairs_(avg);
}

function sbSortPairs_(map) {
  var pairs = [];
  for (var k in map) if (map.hasOwnProperty(k)) pairs.push([k, map[k]]);
  pairs.sort(function (a, b) {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
  });
  return pairs;
}

function sbNum_(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  var n = Number(v);
  return isNaN(n) ? NaN : n;
}

/** 18.5% 처럼 — 나눌 수 없으면 빈칸 (옛 수식의 IFERROR 와 같다) */
function sbPct_(n, d) {
  if (!d) return '';
  return (Math.round((n / d) * 1000) / 10).toFixed(1) + '%';
}

function sbRound1_(n) { return Math.round(n * 10) / 10; }

function sbDateKey_(y, m, d) {
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  return y + '-' + p(m) + '-' + p(d);
}

/* 갱신 시각도 원본 로그 쪽 시간대(한국)로 적는다.
   요약 스프레드시트가 America/Los_Angeles 라, 그쪽 시간대로 적으면
   9월 1일 아침에 만든 표에 '2026-08-31 18:45' 이 찍힌다. 표 안의
   날짜·시각은 전부 한국 기준인데 머리말만 16시간 뒤로 가 있으면
   어느 쪽을 믿어야 할지 알 수 없다. */
function sbNowText_() {
  return Utilities.formatDate(new Date(), sbLogTimeZone_(), 'yyyy-MM-dd HH:mm');
}

function sbToast_(msg) {
  try { SpreadsheetApp.getActive().toast(msg, '요약 표', 8); } catch (e) {}
  Logger.log(msg);
}

/* ================================================================
   ⑥ 시트에 쓰기
   ================================================================ */
function sbWriteSheet_(rows) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SB_OUT_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SB_OUT_SHEET_NAME);
  sh.clear();

  var width = 1;
  for (var i = 0; i < rows.length; i++) width = Math.max(width, rows[i].length);
  width = Math.max(width, 11);                      /* A~K 는 늘 확보 */

  var grid = [];
  for (var j = 0; j < rows.length; j++) {
    var r = (rows[j] || []).slice();
    while (r.length < width) r.push('');
    grid.push(r);
  }
  if (!grid.length) return;

  /* 숫자처럼 생긴 글자(전화번호 등)를 시트가 멋대로 바꾸지 않게
     값 그대로 넣는다 — setValues 는 원래 값을 유지한다. */
  sh.getRange(1, 1, grid.length, width).setValues(grid);

  sh.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  sh.getRange(5, 2, 1, 7).setBackground('#fff2cc');   /* 고치는 칸만 색으로 */

  for (var k = 0; k < grid.length; k++) {
    var first = String(grid[k][0] || '');
    var second = String(grid[k][3] || '');           /* D열 — 오른쪽 표 제목 */
    if (/^\d+\. /.test(first) || /^\d+\. /.test(second) || /^\d+\. /.test(String(grid[k][6] || ''))) {
      sh.getRange(k + 1, 1, 1, width).setFontWeight('bold').setBackground('#e8f0fe');
    } else if (first === '지표' || first === '페이지' || first === '기기' ||
               first === '시각' || first === '요일' || first === '행동' ||
               first === '과' || first === '유입처' || first === '질문 (열람 많은 순)') {
      sh.getRange(k + 1, 1, 1, width).setFontWeight('bold').setBackground('#f1f3f4');
    }
  }

  /* 백분율 칸의 서식을 못박는다.
     '80.6%' 라고 써 넣으면 시트가 그걸 글자가 아니라 숫자 0.806 으로
     바꿔 저장하고, 서식은 시트가 알아서 고른다(브라우저·지역 설정에
     따라 '80.60%' 로 보일 수 있다). 보이는 모양을 옛 표와 똑같이
     소수 한 자리로 두려면 여기서 직접 지정해야 한다. */
  var pctCells = [];
  for (var pr = 0; pr < grid.length; pr++) {
    for (var pc = 0; pc < width; pc++) {
      var pv2 = grid[pr][pc];
      if (typeof pv2 === 'string' && /^-?\d+(\.\d+)?%$/.test(pv2)) {
        pctCells.push(sbColLetter_(pc + 1) + (pr + 1));
      }
    }
  }
  if (pctCells.length) sh.getRangeList(pctCells).setNumberFormat('0.0%');

  var widths = [320, 110, 110, 320, 110, 230, 200, 110, 40, 200, 110];
  for (var c = 0; c < widths.length && c < width; c++) sh.setColumnWidth(c + 1, widths[c]);
  sh.getRange(1, 1, grid.length, width).setVerticalAlignment('middle');
}

/* ================================================================
   ⑦ 기준값 대조 — 옛 표와 숫자가 같은지 스스로 확인
   ================================================================
   조회 기간을 2026년 8월 1일 ~ 8월 31일로 두고 이 함수를 돌리면,
   설계서 7절의 기준값과 한 칸씩 맞춰 보고 어긋난 곳만 알려 준다.
   눈으로 32칸을 대조하면 반드시 하나쯤 놓친다.

   기준값은 '옛 수식이 그 기간에 실제로 보여 준 값' 이다. 새 탭이
   이걸 그대로 내면 이사가 성공한 것이고, 어긋나면 어긋난 자리부터
   보면 된다. (다른 기간에는 쓸 수 없다 — 그때는 두 탭을 나란히 놓고
   본다.) */
function verifySummaryAgainstBaseline() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SB_OUT_SHEET_NAME);
  if (!sh) { sbTell_('먼저 [지금 새로 만들기] 로 표를 그려 주세요.'); return; }

  var p = sbPeriodFromSheet_(sh);
  if (!p || p.y1 !== 2026 || p.m1 !== 8 || p.d1 !== 1 || p.y2 !== 2026 || p.m2 !== 8 || p.d2 !== 31) {
    sbTell_('이 대조는 2026년 8월 1일 ~ 8월 31일 기준입니다.\n' +
            '5줄의 기간 칸을 2026/8/1 ~ 2026/8/31 로 맞추고 다시 그린 뒤 눌러 주세요.');
    return;
  }

  var cells = [
    ['C12', 2581, '표1 홈 방문수'], ['D12', 478, '표1 홈 끝까지'],
    ['C13', 1153, '표1 서초 방문수'], ['C14', 516, '표1 소개 방문수'],
    ['C15', 44, '표1 FAQ 방문수'], ['C16', 74, '표1 응급 방문수'],
    ['C17', 311, '표1 진료과목 방문수'],
    ['B21', 2157, '표2 순 방문 횟수'], ['B22', 4768, '표2 페이지 열린 횟수'],
    ['B23', 2.2, '표2 방문당 페이지 수'], ['B24', '80.6%', '표2 신규 방문 비중'],
    ['B29', 49, '표3 전화까지 간 방문'], ['B32', 703, '표3 의료진 본 방문'],
    ['B33', 18, '표3 그중 전화'], ['B35', 1454, '표3 안 본 방문'],
    ['B36', 31, '표3 안 본 중 전화'], ['B38', '1.2배', '표3 열람 효과'],
    ['B67', 3046, '표5 모바일 방문수'], ['B68', 1722, '표5 PC 방문수'],
    ['D67', 58, '표5 모바일 전화'], ['D68', 15, '표5 PC 전화'],
    ['B101', 54, '표8 전화 합계'], ['B102', 96, '표8 상담 메뉴 열기'],
    ['B105', 7, '표8 폼 제출'], ['B106', '23.3%', '표8 폼 완료율'],
    ['B110', 209, '표9 내과'], ['B111', 181, '표9 외과']
  ];

  var bad = [];
  var ok = 0;
  for (var i = 0; i < cells.length; i++) {
    var got = sh.getRange(cells[i][0]).getValue();
    if (sbSame_(got, cells[i][1])) ok++;
    else bad.push(cells[i][2] + ' (' + cells[i][0] + ') — 기준 ' + cells[i][1] + ' / 지금 ' + got);
  }

  /* 표12~14 는 줄 자리가 기간에 따라 달라져, 이름으로 찾아 맞춘다 */
  var lookups = [
    ['A', 'B', 'naver', 1913, '표12 naver'],
    ['A', 'B', 'ad:naver', 1170, '표12 ad:naver'],
    ['A', 'B', 'direct', 751, '표12 direct'],
    ['D', 'E', '임지현', 198, '표13 임지현'],
    ['G', 'H', '외과', 635, '표14 외과']
  ];
  for (var j = 0; j < lookups.length; j++) {
    var L = lookups[j];
    var got2 = sbFindValue_(sh, L[0], L[1], L[2]);
    if (sbSame_(got2, L[3])) ok++;
    else bad.push(L[4] + ' — 기준 ' + L[3] + ' / 지금 ' + (got2 === null ? '(못 찾음)' : got2));
  }

  /* 개별 값이 맞아도 이 관계가 깨지면 어딘가 새고 있다는 뜻 */
  var v = function (a1) { return Number(sh.getRange(a1).getValue()) || 0; };
  var pvTotal = v('B22');
  var hourSum = 0, dowSum = 0;
  for (var h = 0; h < 12; h++) hourSum += v('B' + (72 + h)) + v('E' + (72 + h));
  for (var w = 0; w < 7; w++) dowSum += v('B' + (87 + w));
  var ties = [
    ['표5 방문수 합 = 표2 페이지 열린 횟수', v('B67') + v('B68'), pvTotal],
    ['표6 시간대 합 = 표2 페이지 열린 횟수', hourSum, pvTotal],
    ['표7 요일 합 = 표2 페이지 열린 횟수', dowSum, pvTotal],
    ['표3 전화 분해 (본 + 안 본 = 전체 전화)', v('B33') + v('B36'), v('B29')],
    ['표3 방문 분해 (본 + 안 본 = 전체 방문)', v('B32') + v('B35'), v('B21')],
    ['표1 방문수 합 (4,679 여야 정상 — 표2와 89 차이)',
      v('C12') + v('C13') + v('C14') + v('C15') + v('C16') + v('C17'), 4679]
  ];
  for (var t = 0; t < ties.length; t++) {
    if (ties[t][1] === ties[t][2]) ok++;
    else bad.push(ties[t][0] + ' — ' + ties[t][1] + ' ≠ ' + ties[t][2]);
  }

  var msg = bad.length
    ? '맞은 곳 ' + ok + ' · 어긋난 곳 ' + bad.length + '\n\n' + bad.join('\n')
    : '기준값 ' + ok + '곳이 모두 맞습니다. 옛 수식을 걷어내도 됩니다.';
  sbTell_(msg);
}

/** 한 열에서 이름을 찾아 옆 칸 값을 돌려준다 (표12~14 대조용) */
function sbFindValue_(sh, keyCol, valCol, key) {
  var last = sh.getLastRow();
  var keys = sh.getRange(keyCol + '1:' + keyCol + last).getValues();
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]) === key) return sh.getRange(valCol + (i + 1)).getValue();
  }
  return null;
}

/* 기준값과 견주기 — 숫자는 아주 작은 오차까지, 글자는 그대로.

   백분율은 따로 본다. '80.6%' 라고 써 넣어도 시트는 그걸 숫자
   0.806 으로 바꿔 저장하기 때문에, 글자끼리 견주면 맞는 값도
   틀렸다고 나온다(2026-09-01 첫 대조에서 실제로 두 줄이 그렇게
   걸렸다 — 숫자는 맞고 견주는 쪽이 틀렸던 것). */
function sbSame_(got, want) {
  if (typeof want === 'number') {
    var n = Number(got);
    return !isNaN(n) && Math.abs(n - want) < 0.05;
  }

  var w = String(want);
  if (/%$/.test(w)) {
    var wantPct = parseFloat(w);
    var gotPct = typeof got === 'number' ? got * 100 : parseFloat(String(got));
    return !isNaN(gotPct) && Math.abs(gotPct - wantPct) < 0.05;
  }

  return String(got) === w;
}

/** 결과 알림 — 시트에서 돌리면 창으로, 편집기에서 돌리면 기록으로 */
function sbTell_(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
}
