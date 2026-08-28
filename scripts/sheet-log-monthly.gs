/* ================================================================
   헬릭스 로그 — 달별로 나눠 담기 (Google Apps Script)
   ================================================================
   원본 로그 시트("Helix AMC — 사이트 이벤트 로그")의 [log] 탭이
   한없이 길어지는 것을 막는다. 지난달 이전 기록을 달별 탭
   ([log 2026-07], [log 2026-08] …) 으로 옮기고, [log] 탭에는
   이번 달 기록만 남긴다.

   ▸ 왜 필요한가
     기록이 하루 1,600줄씩 쌓여 4만 줄을 넘기면, 요약 시트가
     로그를 끌어오는 수식(IMPORTRANGE)이 "결과가 너무 큽니다" 로
     멈춘다. 유입 경로(UTM) 값까지 실리면 한 줄이 더 길어져 그
     한계에 더 빨리 닿는다. 달이 바뀔 때마다 지난달치를 옆 탭으로
     덜어내면, 받는 탭은 항상 한 달치 이하로 유지된다.

   ▸ 사이트 코드는 건드리지 않는다
     기록을 받아 적는 쪽(웹앱 주소로 들어오는 Apps Script)은 그대로
     [log] 탭에 이어 쓴다. 이 스크립트가 뒤에서 지난달치만 덜어낼
     뿐이라, 받는 쪽을 고치거나 다시 배포할 필요가 없다.
     (다시 배포하면 웹앱 주소가 바뀌어 기록이 통째로 끊길 수 있어,
      일부러 건드리지 않는 방식을 골랐다.)

   ── 쓰는 법 ──────────────────────────────────────────────────
   1) 요약 스프레드시트("📊 헬릭스 측정 요약")에서
      [확장 프로그램] → [Apps Script]
   2) 왼쪽 파일 목록에서 ➕ → [스크립트] 로 파일을 하나 만들고
      (이름은 아무거나, 예: 로그달별정리) 이 내용을 통째로 붙여넣기
   3) 같은 프로젝트의 sheet-dwell-journey.gs 도 최신 내용으로
      맞춰 둘 것 (상단 메뉴가 거기서 만들어진다)
   4) 저장(Ctrl+S) → 스프레드시트 탭으로 돌아가 새로고침(F5)
   5) 상단 메뉴 [📁 로그 달별 정리] →
        · [지금 상태 보기]      : 무엇이 얼마나 옮겨질지 미리 확인
        · [지금 달별로 나누기]  : 실제로 옮기기
        · [매일 새벽 자동 정리 켜기] : 매일 새벽 4시에 알아서

   처음 한 번은 권한 허용 창이 뜬다(본인 계정이므로 허용).

   ▸ 안전장치
     - 시간 칸을 못 읽는 줄은 손대지 않는다(어느 달인지 모르므로).
     - 옮길 줄을 옆 탭에 다 적고 나서야 원래 자리를 지운다.
     - 자동 정리는 새벽 4시 — 기록이 거의 안 들어오는 시간대.
   ================================================================ */

/** 원본 로그 스프레드시트 ID (Helix AMC — 사이트 이벤트 로그) */
var M_LOG_SPREADSHEET_ID = '1llPxKf_TyLt2G_DucyQNBzxbzhzGBXyYOhxAMnp_sG0';

/** 기록을 받아 적는 탭 이름 */
var M_LOG_SHEET_NAME = 'log';

/** 달별 탭 이름 앞에 붙일 말 → 'log 2026-08' */
var M_ARCHIVE_PREFIX = 'log ';

/* 받는 탭에 몇 달치를 남길 것인가.
   0 = 이번 달만 남기고 나머지는 전부 달별 탭으로.
   1 로 올리면 지난달까지 [log] 에 남는다(그만큼 다시 길어진다). */
var M_KEEP_MONTHS = 0;

/** 한 번 실행에서 옮길 최대 줄 수 — 실행 시간 상한(6분)에 걸리지 않게 */
var M_MAX_MOVE = 60000;

/* ================================================================
   ① 지금 달별로 나누기
   ================================================================ */
function rollLogByMonth() {
  var plan = mPlan_();
  if (plan.error) { mToast_(plan.error); return; }

  if (!plan.moveRows.length) {
    mToast_('옮길 기록이 없습니다 — [' + plan.sheetName + '] 탭엔 ' +
            mKeepText_() + ' 기록만 있습니다.');
    return;
  }

  var ss = plan.ss;
  var log = plan.sheet;
  var width = plan.width;

  /* 옆 탭에 먼저 다 적는다 — 적기 전에 지우면 사고가 난다 */
  var moved = [];
  for (var i = 0; i < plan.order.length; i++) {
    var key = plan.order[i];
    var rows = plan.bucket[key];
    var name = M_ARCHIVE_PREFIX + key;
    var sh = ss.getSheetByName(name);

    if (!sh) {
      sh = ss.insertSheet(name);
      mEnsureSize_(sh, 1, width);
      sh.getRange(1, 1, 1, width).setValues([plan.header]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }

    var start = Math.max(sh.getLastRow(), 1) + 1;
    mEnsureSize_(sh, start + rows.length - 1, width);
    sh.getRange(start, 1, rows.length, width).setValues(rows);
    moved.push(name + ' ' + rows.length + '줄');
  }
  SpreadsheetApp.flush();

  /* 그 다음에야 원래 자리를 지운다 */
  mDeleteRows_(log, plan.moveRows);
  SpreadsheetApp.flush();

  var left = Math.max(log.getLastRow() - 1, 0);
  mToast_('완료 — ' + moved.join(' · ') + ' 로 옮겼습니다. [' +
          plan.sheetName + '] 에 남은 줄: ' + left);
}

/* ================================================================
   ② 지금 상태 보기 (아무것도 옮기지 않는다)
   ================================================================ */
function showLogSheetStatus() {
  var plan = mPlan_();
  if (plan.error) { mAlert_('로그 달별 정리', plan.error); return; }

  var lines = [];
  lines.push('받는 탭: [' + plan.sheetName + '] — 머리글 빼고 ' + plan.dataRows + '줄');
  lines.push('남겨 둘 기간: ' + mKeepText_());
  lines.push('');

  lines.push('[' + plan.sheetName + '] 안의 달별 줄 수');
  var keys = [];
  for (var k in plan.countAll) keys.push(k);
  keys.sort();
  for (var i = 0; i < keys.length; i++) {
    lines.push('  ' + (keys[i] === '(시간 못 읽음)' ? keys[i] : keys[i]) +
               ' : ' + plan.countAll[keys[i]] + '줄' +
               (plan.keep[keys[i]] ? '  ← 그대로 둠' : ''));
  }
  lines.push('');

  if (plan.moveRows.length) {
    lines.push('지금 [지금 달별로 나누기] 를 누르면 ' + plan.moveRows.length + '줄이 옮겨집니다:');
    for (var j = 0; j < plan.order.length; j++) {
      lines.push('  → [' + M_ARCHIVE_PREFIX + plan.order[j] + '] ' +
                 plan.bucket[plan.order[j]].length + '줄');
    }
  } else {
    lines.push('옮길 기록이 없습니다.');
  }

  lines.push('');
  lines.push('이미 만들어져 있는 달별 탭');
  var made = mArchiveSheets_(plan.ss);
  if (!made.length) {
    lines.push('  (아직 없음)');
  } else {
    for (var m = 0; m < made.length; m++) {
      lines.push('  [' + made[m].getName() + '] ' + Math.max(made[m].getLastRow() - 1, 0) + '줄');
    }
  }

  mAlert_('로그 달별 정리 — 지금 상태', lines.join('\n'));
}

/* ================================================================
   ③ 자동 정리 켜기 · 끄기
   ================================================================ */
function installMonthlyLogTrigger() {
  removeMonthlyLogTrigger();
  ScriptApp.newTrigger('rollLogByMonth').timeBased().atHour(4).everyDays(1).create();
  mToast_('매일 새벽 4시에 지난달 기록을 달별 탭으로 옮깁니다.');
}

function removeMonthlyLogTrigger() {
  var all = ScriptApp.getProjectTriggers();
  var n = 0;
  for (var i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'rollLogByMonth') { ScriptApp.deleteTrigger(all[i]); n++; }
  }
  if (n) mToast_('자동 정리를 껐습니다.');
}

/* ================================================================
   ④ 계획 세우기 — 무엇을 어디로 옮길지만 계산(쓰지는 않음)
   ================================================================ */
function mPlan_() {
  var ss;
  try { ss = SpreadsheetApp.openById(M_LOG_SPREADSHEET_ID); }
  catch (e) { return { error: '로그 파일을 열지 못했습니다: ' + e }; }

  var log = ss.getSheetByName(M_LOG_SHEET_NAME) || mFindLogSheet_(ss);
  if (!log) return { error: '기록이 담긴 탭을 찾지 못했습니다 (머리글에 \'이벤트명\' 이 있는 탭을 찾습니다).' };

  var lastRow = log.getLastRow();
  var width = Math.max(log.getLastColumn(), 1);
  var header = log.getRange(1, 1, 1, width).getValues()[0];

  var plan = {
    ss: ss,
    sheet: log,
    sheetName: log.getName(),
    width: width,
    header: header,
    dataRows: Math.max(lastRow - 1, 0),
    bucket: {},
    order: [],
    moveRows: [],
    countAll: {},
    keep: mKeepKeys_(ss.getSpreadsheetTimeZone(), M_KEEP_MONTHS)
  };
  if (lastRow < 2) return plan;

  var tz = ss.getSpreadsheetTimeZone();
  var values = log.getRange(2, 1, lastRow - 1, width).getValues();

  for (var i = 0; i < values.length; i++) {
    var key = mMonthKey_(values[i][0], tz);
    var label = key || '(시간 못 읽음)';
    plan.countAll[label] = (plan.countAll[label] || 0) + 1;

    if (!key) continue;                       /* 어느 달인지 모르는 줄은 안 건드림 */
    if (plan.keep[key]) continue;             /* 남겨 두기로 한 달 */
    if (plan.moveRows.length >= M_MAX_MOVE) continue;  /* 다음 실행에서 마저 */

    if (!plan.bucket[key]) { plan.bucket[key] = []; plan.order.push(key); }
    plan.bucket[key].push(values[i]);
    plan.moveRows.push(i + 2);                /* 실제 시트 줄 번호 */
  }
  plan.order.sort();
  return plan;
}

/** 머리글에 '이벤트명' 이 있는 탭 — 이름이 바뀌었을 때의 대비 */
function mFindLogSheet_(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getLastRow() < 2) continue;
    if (mIsArchiveName_(sheets[i].getName())) continue;
    var w = Math.min(8, sheets[i].getLastColumn() || 1);
    var head = sheets[i].getRange(1, 1, 1, w).getValues()[0].join('|');
    if (head.indexOf('이벤트명') >= 0) return sheets[i];
  }
  return null;
}

function mArchiveSheets_(ss) {
  var out = [];
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (mIsArchiveName_(sheets[i].getName())) out.push(sheets[i]);
  }
  out.sort(function (a, b) { return a.getName() < b.getName() ? -1 : 1; });
  return out;
}

function mIsArchiveName_(name) {
  return name.indexOf(M_ARCHIVE_PREFIX) === 0 && /\d{4}-\d{2}$/.test(name);
}

/* ================================================================
   ⑤ 잔심부름
   ================================================================ */
/** 남겨 둘 달 목록 — {'2026-08': true} */
function mKeepKeys_(tz, keepMonths) {
  var now = new Date();
  var keep = {};
  for (var i = 0; i <= keepMonths; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1, 12, 0, 0);
    keep[Utilities.formatDate(d, tz, 'yyyy-MM')] = true;
  }
  return keep;
}

function mKeepText_() {
  return M_KEEP_MONTHS > 0 ? '최근 ' + (M_KEEP_MONTHS + 1) + '개월' : '이번 달';
}

/** 시간 칸 → '2026-08'. 못 읽으면 빈 문자열 */
function mMonthKey_(v, tz) {
  var ms = mToMillis_(v);
  if (!ms) return '';
  return Utilities.formatDate(new Date(ms), tz, 'yyyy-MM');
}

/* 시간 칸을 밀리초로. 날짜 칸일 수도, 글자일 수도, 엑셀식 숫자일 수도 있어
   세 가지를 모두 받아준다. 못 읽으면 0.
   (sheet-dwell-journey.gs 의 toMillis_ 와 같은 규칙 — 같은 프로젝트에
    넣어도 이름이 겹치지 않게 따로 둔다) */
function mToMillis_(v) {
  if (v && typeof v.getTime === 'function') {
    var ms = v.getTime();
    return isNaN(ms) ? 0 : ms;
  }
  if (typeof v === 'number' && v > 0) return Math.round((v - 25569) * 86400000);

  var s = String(v || '').trim();
  if (!s || s === '시간') return 0;

  var m = s.match(/^(\d{4})[-.\/\s]+(\d{1,2})[-.\/\s]+(\d{1,2})[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0).getTime();

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

/** 탭이 좁거나 짧으면 늘려 둔다 (새 탭은 기본 1000줄 26칸) */
function mEnsureSize_(sh, rows, cols) {
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
  if (sh.getMaxColumns() < cols) sh.insertColumnsAfter(sh.getMaxColumns(), cols - sh.getMaxColumns());
}

/* 옮긴 줄들을 지운다. 이어진 구간끼리 묶어 아래쪽부터 지운다 —
   위에서부터 지우면 남은 줄 번호가 밀려 엉뚱한 줄을 지우게 된다. */
function mDeleteRows_(sh, rows) {
  if (!rows.length) return;
  rows.sort(function (a, b) { return a - b; });

  var blocks = [];
  var start = rows[0], prev = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i] === prev + 1) { prev = rows[i]; continue; }
    blocks.push([start, prev - start + 1]);
    start = prev = rows[i];
  }
  blocks.push([start, prev - start + 1]);

  for (var b = blocks.length - 1; b >= 0; b--) sh.deleteRows(blocks[b][0], blocks[b][1]);
}

/** 화면 오른쪽 아래에 잠깐 뜨는 알림 */
function mToast_(msg) {
  try { SpreadsheetApp.getActive().toast(msg, '로그 달별 정리', 8); } catch (e) {}
  try { Logger.log(msg); } catch (e2) {}
}

/** 긴 안내는 창으로 (자동 실행 중이면 조용히 기록만) */
function mAlert_(title, body) {
  try { SpreadsheetApp.getUi().alert(title, body, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { mToast_(body); }
}
