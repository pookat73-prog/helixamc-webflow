/* ================================================================
   HELIX AMC — FAQ 콘텐츠 캐주얼 복사 방지 (억지력).

   목적: 일반 방문자가 FAQ 질문·답변을 드래그 선택 / 우클릭 / Ctrl+C 로
   손쉽게 퍼가는 것을 막는다. 단, AI·검색봇은 원본 HTML(+JSON-LD 스키마)을
   그대로 읽으므로 영향 없음 (이건 의도된 것 — AI 는 봐야 함).

   ⚠ 한계(정직하게): 소스 보기·개발자도구·JS 비활성화·화면 캡처+OCR 로는
   우회 가능. 완전 차단이 아니라 캐주얼 복붙 억지력.

   범위: FAQ '내용' 컨테이너에만 적용. 헤더·푸터·플로팅 CTA·전화번호 복사
   버튼 등 페이지의 다른 기능은 건드리지 않는다 (이벤트 위임으로 스코프).

   클립보드 API(navigator.clipboard.writeText) 로 동작하는 복사 버튼은
   'copy' 이벤트를 발생시키지 않으므로 정상 동작 — 사용자의 드래그 복사만 막힘.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqProtect) return;
  window.__helixFaqProtect = true;

  /* FAQ 내용 컨테이너 셀렉터 (질환용 카드 + 일반용 목록 모두) */
  var SEL = [
    '[class*="faq-list" i]',
    '[class*="faq_box" i]',
    '[class*="faq_qa" i]',
    '[class*="faq_answer" i]',
    '[class*="faq-q" i]',
    '[class*="faq-a" i]'
  ].join(',');

  /* 1) 텍스트 선택 비활성화 (내용 영역만) */
  var style = document.createElement('style');
  style.textContent =
    SEL.split(',').map(function (s) { return s + ',' + s + ' *'; }).join(',') +
    '{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;' +
    '-webkit-touch-callout:none;}' +
    /* 이미지 드래그 저장 억지 */
    SEL.split(',').map(function (s) { return s + ' img'; }).join(',') +
    '{-webkit-user-drag:none;user-drag:none;}';
  (document.head || document.documentElement).appendChild(style);

  /* 2) 우클릭 메뉴 / 복사 / 잘라내기 / 드래그 / 선택시작 — 내용 영역에서만 차단 */
  function inFaq(t) {
    return !!(t && t.closest && t.closest(SEL));
  }
  ['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (inFaq(e.target)) e.preventDefault();
    }, true);
  });
})();
