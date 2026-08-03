/* ================================================================
   HELIX AMC - GLOBAL 공지 팝업 (박스형 중앙 모달, 반응형)
   ----------------------------------------------------------------
   전체 페이지 공통 로드 (home / about / seocho bootstrap FILES 등록).
   노출 규칙: 한 번 뜨면 그 날에는 다시 안 뜸 → 날짜가 바뀌면 다시 1회 노출
   - 팝업이 화면에 뜬 그 순간 "오늘 봤음" 으로 기록 (localStorage, YYYY-M-D)
   - "닫기" / 우상단 X / 바깥 클릭 / ESC: 닫기만 담당 (기록은 이미 됨)

   ▼ 문구를 바꾸려면 아래 CONFIG 만 수정하면 됩니다.
   - title : 큰 제목 (빈 문자열이면 제목 줄 생략)
   - body  : 본문 (\n 로 줄바꿈 가능)
   ================================================================ */
(function () {
  'use strict';

  /* ▶ 팝업 ON/OFF 스위치 — 끄려면 false 로 변경 (홈페이지 리뉴얼 안내 재개) */
  var ENABLED = true;
  if (!ENABLED) return;

  var CONFIG = {
    title: '',
    body: '홈페이지 리뉴얼 중 입니다.'
  };

  /* "오늘 이미 봤음" 저장 키 (값: YYYY-M-D) */
  var SEEN_KEY = 'helixPopupSeenDate';

  /* 중복 주입 가드 */
  if (window.__helixPopupInit) return;
  window.__helixPopupInit = true;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* 오늘 이미 봤는지 확인 (localStorage 접근 실패 시 노출) */
  function seenToday() {
    try {
      return window.localStorage.getItem(SEEN_KEY) === todayStr();
    } catch (e) {
      return false;
    }
  }

  function markSeen() {
    try {
      window.localStorage.setItem(SEEN_KEY, todayStr());
    } catch (e) {}
  }

  function build() {
    if (seenToday()) return;
    if (document.querySelector('.helix-popup-overlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'helix-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var card = document.createElement('div');
    card.className = 'helix-popup-card';

    var closeX = document.createElement('button');
    closeX.className = 'helix-popup-close';
    closeX.setAttribute('type', 'button');
    closeX.setAttribute('aria-label', '닫기');
    closeX.innerHTML = '&times;';
    card.appendChild(closeX);

    var content = document.createElement('div');
    content.className = 'helix-popup-content';

    if (CONFIG.title) {
      var title = document.createElement('h2');
      title.className = 'helix-popup-title';
      title.textContent = CONFIG.title;
      content.appendChild(title);
    }

    var body = document.createElement('p');
    body.className = 'helix-popup-body';
    String(CONFIG.body).split('\n').forEach(function (line, i) {
      if (i > 0) body.appendChild(document.createElement('br'));
      body.appendChild(document.createTextNode(line));
    });
    content.appendChild(body);
    card.appendChild(content);

    /* 하단 바: 닫기 (노출 자체가 하루 1회라 "보지 않기" 버튼 불필요) */
    var bar = document.createElement('div');
    bar.className = 'helix-popup-bar';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'helix-popup-closebtn';
    closeBtn.setAttribute('type', 'button');
    closeBtn.textContent = '닫기';

    bar.appendChild(closeBtn);
    card.appendChild(bar);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    /* 화면에 올린 시점에 바로 "오늘 봤음" 기록 → 오늘 남은 방문엔 안 뜸 */
    markSeen();

    function destroy() {
      overlay.classList.remove('is-open');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 400);
    }

    function onKey(e) {
      if (e.key === 'Escape' || e.keyCode === 27) destroy();
    }

    closeBtn.addEventListener('click', destroy);
    closeX.addEventListener('click', destroy);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) destroy();
    });
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
