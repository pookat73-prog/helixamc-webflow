/* ================================================================
   요약 시트 구조 내보내기 (Google Apps Script)
   ================================================================
   요약 스프레드시트가 실제로 어떻게 짜여 있는지 —— 어느 칸에 어떤
   수식이 들어 있고, 표 제목이 무엇이고, 탭이 몇 개인지 —— 를 글
   파일 하나로 뽑아 드라이브에 저장한다.

   ▸ 왜 필요한가
     Claude 는 스프레드시트의 **수식을 볼 수 없다.** 드라이브로 받을
     수 있는 건 계산이 끝난 '값' 뿐이라, `=QUERY(...)` 같은 수식은
     내려받아도 결과 숫자만 보인다. 그래서 "이 표가 왜 비었나",
     "이 수식을 어떻게 바꿔야 하나" 를 매번 사용자가 눈으로 읽어
     불러 줘야 했다. 이 파일을 한 번 돌려 두면 그 왕복이 없어진다.

   ▸ 무엇이 나오나 (글 파일 한 개)
     - 탭 목록과 크기
     - 수식이 든 칸 전부 (같은 수식이 아래로 반복되면 한 줄로 접어서)
     - 표 제목·머리글 같은 짧은 글자 칸 (A~Y 열, 위쪽 300줄)
     - 로그가 실려 들어온 무거운 영역은 건너뛴다 (읽을 필요가 없음)

   ▸ 개인정보
     상담 신청자 이름·전화번호 같은 값이 시트에 있다면 그 칸도 글자로
     같이 나온다. 아래 SKIP_VALUE_TABS 에 그런 탭 이름을 넣으면
     그 탭은 수식만 뽑고 값은 안 뽑는다.

   ── 쓰는 법 ──────────────────────────────────────────────────
   1) 요약 스프레드시트 상단 메뉴 [🧰 진단] → [요약 시트 구조 내보내기]
   2) 끝나면 만들어진 파일 이름이 창에 뜬다
   3) 그 이름을 Claude 에게 알려주면 Claude 가 드라이브에서 찾아 읽는다
   ================================================================ */

/** 값(글자)은 뽑지 않고 수식만 뽑을 탭 — 개인정보가 있는 탭 이름을 넣는다 */
var SKIP_VALUE_TABS = [];

/** 값을 훑을 범위 — 표 제목·머리글은 대개 이 안에 있다 */
var VALUE_SCAN_ROWS = 300;
var VALUE_SCAN_COLS = 25;      /* A~Y. Z 부터는 실려 들어온 로그라 건너뜀 */

/** 한 칸에서 가져올 글자 수 상한 (로그 JSON 같은 긴 값은 잘라 낸다) */
var VALUE_MAX_LEN = 120;

/** 수식을 훑을 때 한 번에 읽는 줄 수 — 시트가 길어도 버티게 나눠 읽는다 */
var FORMULA_CHUNK = 5000;

/* ================================================================
   내보내기
   ================================================================ */
function exportSummaryStructure() {
  var ss = SpreadsheetApp.getActive();
  var out = [];

  out.push('# ' + ss.getName());
  out.push('스프레드시트 ID: ' + ss.getId());
  out.push('뽑은 시각: ' + new Date());
  out.push('시간대: ' + ss.getSpreadsheetTimeZone());
  out.push('');

  var sheets = ss.getSheets();
  out.push('## 탭 목록 (' + sheets.length + '개)');
  for (var i = 0; i < sheets.length; i++) {
    out.push('  ' + (i + 1) + '. [' + sheets[i].getName() + '] ' +
             sheets[i].getLastRow() + '줄 × ' + sheets[i].getLastColumn() + '칸' +
             ' (틀 고정 ' + sheets[i].getFrozenRows() + '줄)');
  }
  out.push('');

  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    out.push('');
    out.push('================================================================');
    out.push('## 탭 [' + sh.getName() + ']');
    out.push('================================================================');

    var formulas = collectFormulas_(sh);
    out.push('');
    out.push('### 수식 (' + formulas.length + '개 자리)');
    if (!formulas.length) out.push('  (없음)');
    for (var f = 0; f < formulas.length; f++) out.push('  ' + formulas[f]);

    if (skipValues_(sh.getName())) {
      out.push('');
      out.push('### 글자 — 건너뜀 (SKIP_VALUE_TABS 에 지정된 탭)');
      continue;
    }

    var labels = collectLabels_(sh);
    out.push('');
    out.push('### 글자 (A1:' + colName_(VALUE_SCAN_COLS) + VALUE_SCAN_ROWS + ' 안의 채워진 칸)');
    if (!labels.length) out.push('  (없음)');
    for (var l = 0; l < labels.length; l++) out.push('  ' + labels[l]);
  }

  var text = out.join('\n');
  var name = '헬릭스 시트구조 ' + fmtDay_(new Date()) + '.txt';
  var file = DriveApp.createFile(name, text, MimeType.PLAIN_TEXT);

  var msg = '만들었습니다.\n\n파일 이름: ' + name +
            '\n크기: ' + Math.round(text.length / 1024) + 'KB' +
            '\n\n이 이름을 Claude 에게 알려주면 됩니다.\n\n' + file.getUrl();
  try {
    SpreadsheetApp.getUi().alert('시트 구조 내보내기', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    SpreadsheetApp.getActive().toast(name + ' 를 만들었습니다.', '시트 구조', 10);
  }
  return file.getId();
}

/* ================================================================
   수식 모으기 — 같은 수식이 아래로 이어지면 한 줄로 접는다
   ================================================================
   시트를 통째로 한 번에 읽으면 긴 탭에서 멈추므로 줄 단위로 나눠 읽는다.
   같은 모양의 수식이 여러 줄에 반복되는 경우(칸마다 복사해 둔 수식)는
   'AG2:AG40000 같은 수식' 처럼 접어서 파일이 부풀지 않게 한다. */
function collectFormulas_(sh) {
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  var out = [];
  if (lastRow < 1 || lastCol < 1) return out;

  var open = {};   /* 열 → {r1c1, a1, startRow, endRow} 이어지는 중인 수식 */

  function flush(col) {
    var o = open[col];
    if (!o) return;
    var where = o.startRow === o.endRow
      ? colName_(col) + o.startRow
      : colName_(col) + o.startRow + ':' + colName_(col) + o.endRow + ' (같은 수식 ' + (o.endRow - o.startRow + 1) + '줄)';
    out.push({ col: col, row: o.startRow, text: where + '  ' + o.a1 });
    delete open[col];
  }

  for (var start = 1; start <= lastRow; start += FORMULA_CHUNK) {
    var n = Math.min(FORMULA_CHUNK, lastRow - start + 1);
    var rng = sh.getRange(start, 1, n, lastCol);
    var a1 = rng.getFormulas();
    var r1c1 = rng.getFormulasR1C1();

    for (var i = 0; i < n; i++) {
      var row = start + i;
      for (var c = 0; c < lastCol; c++) {
        var col = c + 1;
        var key = r1c1[i][c];
        if (!key) { flush(col); continue; }

        var o = open[col];
        if (o && o.r1c1 === key && o.endRow === row - 1) { o.endRow = row; continue; }
        flush(col);
        open[col] = { r1c1: key, a1: a1[i][c], startRow: row, endRow: row };
      }
    }
  }
  for (var col in open) flush(Number(col));

  /* 사람이 보기 좋게 왼쪽 열부터, 같은 열 안에서는 위 줄부터 */
  out.sort(function (x, y) { return x.col !== y.col ? x.col - y.col : x.row - y.row; });
  var lines = [];
  for (var i = 0; i < out.length; i++) lines.push(out[i].text);
  return lines;
}

/* ================================================================
   글자 모으기 — 표 제목·머리글
   ================================================================ */
function collectLabels_(sh) {
  var rows = Math.min(VALUE_SCAN_ROWS, Math.max(sh.getLastRow(), 1));
  var cols = Math.min(VALUE_SCAN_COLS, Math.max(sh.getLastColumn(), 1));
  var vals = sh.getRange(1, 1, rows, cols).getDisplayValues();
  var out = [];

  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var v = String(vals[r][c] || '').trim();
      if (!v) continue;
      if (v.length > VALUE_MAX_LEN) v = v.slice(0, VALUE_MAX_LEN) + '…(잘림)';
      out.push(colName_(c + 1) + (r + 1) + '  ' + v.replace(/\n/g, ' ⏎ '));
    }
  }
  return out;
}

/* ================================================================
   잔심부름
   ================================================================ */
function skipValues_(name) {
  for (var i = 0; i < SKIP_VALUE_TABS.length; i++) if (SKIP_VALUE_TABS[i] === name) return true;
  return false;
}

/** 1 → A, 27 → AA */
function colName_(n) {
  var s = '';
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function fmtDay_(d) {
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
         ' ' + p(d.getHours()) + p(d.getMinutes());
}
