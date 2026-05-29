/* ================================================================
   HELIX AMC - GLOBAL 공지 팝업 (중앙 모달)
   ----------------------------------------------------------------
   전체 페이지 공통 로드 (home / about / seocho bootstrap FILES 등록).
   매 방문마다 노출 (세션/쿠키 저장 안 함).

   ▼ 문구를 바꾸려면 아래 CONFIG 만 수정하면 됩니다.
   - title : 큰 제목 (빈 문자열이면 제목 줄 생략)
   - body  : 본문 (\n 로 줄바꿈 가능)
   - button: 닫기 버튼 라벨
   닫기: 버튼 / 우상단 X / 바깥 영역 클릭 / ESC
   ================================================================ */
(function () {
  'use strict';

  var CONFIG = {
    title: '',
    body: '홈페이지 리뉴얼 중 입니다.',
    button: '확인'
  };

  /* 중복 주입 가드 */
  if (window.__helixPopupInit) return;
  window.__helixPopupInit = true;

  function build() {
    if (document.querySelector('.helix-popup-overlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'helix-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var card = document.createElement('div');
    card.className = 'helix-popup-card';

    var close = document.createElement('button');
    close.className = 'helix-popup-close';
    close.setAttribute('type', 'button');
    close.setAttribute('aria-label', '닫기');
    close.innerHTML = '&times;';
    card.appendChild(close);

    if (CONFIG.title) {
      var title = document.createElement('h2');
      title.className = 'helix-popup-title';
      title.textContent = CONFIG.title;
      card.appendChild(title);
    }

    var body = document.createElement('p');
    body.className = 'helix-popup-body';
    String(CONFIG.body).split('\n').forEach(function (line, i) {
      if (i > 0) body.appendChild(document.createElement('br'));
      body.appendChild(document.createTextNode(line));
    });
    card.appendChild(body);

    var btn = document.createElement('button');
    btn.className = 'helix-popup-btn';
    btn.setAttribute('type', 'button');
    btn.textContent = CONFIG.button;
    card.appendChild(btn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

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

    close.addEventListener('click', destroy);
    btn.addEventListener('click', destroy);
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
