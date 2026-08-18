/* ================================================================
   HELIX AMC — FAQ 전용 GA4 측정 (질환 + 일반 공통)

   FAQ 페이지의 실제 사용자 행동을 측정한다. 기존 상호작용 코드
   (faq-stack.js / faq-general.js / filter.js) 는 손대지 않고, 문서
   '캡처 단계' 클릭 위임으로 측정만 얹는다.
     · 질환 카드의 '자세히' 인디케이터가 stopPropagation() 을 호출하므로
       버블 위임으론 클릭을 못 받는다 → 캡처 단계(addEventListener 3번째
       인자 true)로 받고, setTimeout(0) 으로 토글이 끝난 뒤의 상태를 읽는다.

   측정 이벤트 (page='faq', device 자동):
     ① faq_tab_select   질환↔일반 탭 전환        { tab: disease|general }
     ② faq_filter_select 질환 필터 칩 선택        { filter_group, filter_value }
     ③ faq_filter_reset  질환 필터 그룹 초기화     { filter_group }
     ④ faq_open          FAQ 항목 펼침(질환/일반)  { category, question }
     ⑤ faq_page_nav      페이지 이동(질환/일반)    { category, page_label }

   스테이징(*.webflow.io) 은 global/ga4-base.js 가 window.gtag 를 no-op
   stub 으로 정의해 두므로, 여기서 별도 도메인 게이트 없이도 측정이
   조용히 무시된다(정식 GA4 데이터 오염 방지 — CLAUDE.md 도메인 게이트 참조).

   디버그: URL 에 ?debug-faq-ga=1
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqGaInit) return;
  window.__helixFaqGaInit = true;

  var DEBUG = /[?&]debug-faq-ga=1\b/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[FAQ-GA]'].concat(Array.prototype.slice.call(arguments)));
  }

  function device() { return window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop'); }

  /* 다른 모듈(scroll-depth/seocho)과 동일한 전송 규약:
     gtag 있으면 gtag('event', ...), 없으면 dataLayer.push 폴백. */
  function send(eventName, params) {
    try {
      var base = { item_type: params.item_type, page: 'faq', device: device() };
      for (var k in params) { if (params.hasOwnProperty(k)) base[k] = params[k]; }
      if (typeof window.gtag === 'function') {
        base.transport_type = 'beacon';
        window.gtag('event', eventName, base);
      } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        base.event = eventName;
        window.dataLayer.push(base);
      }
      log('sent', eventName, base);
    } catch (e) { log('send error', e); }
  }

  /* GA 라벨용 질문 텍스트 추출 — 제목 우선, 공백 정리 후 120자 컷 */
  function questionText(item) {
    if (!item) return '';
    var el = item.querySelector('.helix-gfaq-qtext')            // 일반 카드 질문
          || item.querySelector('[class*="faq-q" i]:not([class*="faq_qa" i])')
          || item.querySelector('h1,h2,h3,h4,h5,h6')
          || item;
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.length > 120) t = t.slice(0, 117) + '…';
    return t;
  }

  /* ── ① 탭 전환 (질환 ↔ 일반) ─────────────────────────────────────
     질환 탭 링크의 안쪽 글자 요소가 .faq_tab-name (filter.js 와 동일 판별). */
  function diseaseTabLink() {
    var n = document.querySelector('.faq_tab-name');
    return (n && n.closest) ? n.closest('.w-tab-link') : null;
  }
  function currentTab() {
    var t = diseaseTabLink();
    if (!t) return null;
    return t.classList.contains('w--current') ? 'disease' : 'general';
  }
  var lastTab = null;
  function checkTab() {
    var now = currentTab();
    if (!now) return;
    if (lastTab === null) { lastTab = now; return; }   // 초기 상태는 기록만
    if (now !== lastTab) {
      lastTab = now;
      send('faq_tab_select', { item_type: 'tab', tab: now, value: now });
    }
  }

  /* ── ②/③ 필터 칩 (질환 전용) ─────────────────────────────────────
     그룹 라벨(SPECIES/FIELD) 은 filter.js 와 동일하게 '문서 순서상 칩묶음
     직전의 라벨' 로 판별. 일반 탭 칩묶음은 라벨이 없어 자동 제외된다. */
  function chipGroup(chip) {
    var opts = chip.closest('[class*="faq-filter-opts" i]');
    if (!opts) return null;
    var seq = document.querySelectorAll('[class*="faq-filter-label" i],[class*="faq-filter-opts" i]');
    var lastLabel = null;
    for (var i = 0; i < seq.length; i++) {
      var el = seq[i];
      if (/faq-filter-label/i.test(el.className || '')) lastLabel = el;
      else if (el === opts) break;
    }
    if (!lastLabel) return null;
    var t = (lastLabel.textContent || '').toUpperCase();
    if (t.indexOf('SPECIES') >= 0) return 'species';
    if (t.indexOf('FIELD') >= 0) return 'field';
    return null;
  }
  function chipValue(chip) {
    var t = chip.textContent || '';
    var num = chip.querySelector('[class*="faq-num" i]');
    if (num && num.textContent) t = t.replace(num.textContent, '');
    return t.replace(/\s+/g, ' ').trim();
  }

  /* ── 통합 클릭 위임 (캡처 단계) ──────────────────────────────────
     캡처 단계라 어떤 자식이 stopPropagation 을 해도 문서에서 먼저 받는다.
     펼침/전환은 다른 모듈이 처리하므로, 상태 판정은 setTimeout(0) 으로
     그 처리가 끝난 뒤에 읽는다. */
  function onCaptureClick(e) {
    var tgt = e.target;
    if (!tgt || !tgt.closest) return;

    // 탭 전환 — Webflow 가 .w--current 를 옮긴 뒤 재판정
    if (tgt.closest('.w-tab-link')) {
      setTimeout(checkTab, 0);
      setTimeout(checkTab, 90);
    }

    // 필터 초기화 칩
    var reset = tgt.closest('[class*="faq-chip_reset" i]');
    if (reset) {
      var g = chipGroup(reset) || 'all';
      send('faq_filter_reset', { item_type: 'filter', filter_group: g, value: g });
      return;
    }

    // 필터 선택 칩 (reset 제외)
    var chip = tgt.closest('[class*="faq-chip" i]');
    if (chip && !/faq-chip_reset/i.test(chip.className || '')) {
      var grp = chipGroup(chip);
      if (grp) {   // species/field 로 해석되는 질환 필터만
        var val = chipValue(chip);
        // 켜져 있던 걸 다시 눌러 끄는 경우는 제외(선택된 상태만 측정)
        setTimeout(function () {
          var on = chip.classList.contains('is-on') || chip.getAttribute('aria-pressed') === 'true';
          if (on) send('faq_filter_select', { item_type: 'filter', filter_group: grp, filter_value: val, value: val });
        }, 0);
      }
      return;
    }

    // 페이지 이동 (질환/일반 공통 .faq-page-btn — 숫자/‹/› 버튼)
    var pageBtn = tgt.closest('[class*="faq-page-btn" i]');
    if (pageBtn && !pageBtn.disabled) {
      var lblEl = pageBtn.querySelector('[class*="faq-page-lbl" i]');
      var label = ((lblEl ? lblEl.textContent : pageBtn.textContent) || '').trim();
      var sec = pageBtn.closest('section');
      var cat = (sec && sec.querySelector('[class*="faq_box" i]')) ? 'disease' : 'general';
      send('faq_page_nav', { item_type: 'pagination', category: cat, page_label: label, value: label });
      return;
    }

    // FAQ 항목 펼침 — 질환: '자세히' 인디케이터 / 일반: 질문 행
    var dInd = tgt.closest('[class*="helix-faq-indicator" i]');   // 질환 카드
    if (dInd) {
      var dItem = dInd.closest('[class*="helix-faq-item" i]') || dInd.closest('[class*="faq_q" i]');
      setTimeout(function () {
        if (dItem && dItem.classList.contains('is-open')) {
          send('faq_open', { item_type: 'faq', category: 'disease', question: questionText(dItem), value: 'disease' });
          readStart('disease', questionText(dItem));
        } else {
          readEnd();          // 접은 것 — 여기까지 읽은 시간 회수
        }
      }, 0);
      return;
    }
    var gRow = tgt.closest('[class*="helix-gfaq-q" i]');          // 일반 질문 행
    if (gRow) {
      if (tgt.closest('a, button')) return;   // 링크/버튼 클릭은 펼침이 아님
      var gItem = gRow.closest('[class*="helix-gfaq-item" i]');
      setTimeout(function () {
        if (gItem && gItem.classList.contains('is-open')) {
          send('faq_open', { item_type: 'faq', category: 'general', question: questionText(gItem), value: 'general' });
          readStart('general', questionText(gItem));
        } else {
          readEnd();
        }
      }, 0);
      return;
    }
  }

  /* ── 읽은 시간 ────────────────────────────────────────────────
     이 페이지는 탭·필터로 내용이 갈아끼워지는 구조라 '스크롤로 어디까지
     읽었나' 가 의미가 없다. 대신 "어떤 질문을 펼쳐서 얼마나 읽었나" 가
     실제 신호다 — 오래 읽힌 질문은 잘 쓰인 답변이고, 열자마자 접힌
     질문은 답이 부실하거나 제목이 오해를 부른다는 뜻.

     펼쳤다 2초 안에 접으면 잘못 눌렀다고 보고 기록하지 않는다.
     다른 질문을 펼치면 이전 질문의 시간이 먼저 회수된다(아코디언). */
  var READ_MIN_MS = 2000;
  var readFrom = 0, readCat = '', readQ = '';

  function readStart(cat, q) {
    readEnd();                 // 앞서 열려 있던 질문 정산 후 새로 시작
    readFrom = Date.now();
    readCat = cat; readQ = q;
  }

  function readEnd() {
    if (!readFrom) return;
    var ms = Date.now() - readFrom;
    var cat = readCat, q = readQ;
    readFrom = 0; readCat = ''; readQ = '';
    if (ms < READ_MIN_MS) return;
    send('faq_read', {
      item_type: 'faq_read',
      category: cat,
      question: q,
      read_sec: Math.round(ms / 1000),
      value: Math.round(ms / 1000)
    });
  }

  /* 펼쳐둔 채 페이지를 떠나거나 탭을 돌리는 경우도 회수 */
  window.addEventListener('pagehide', readEnd);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) readEnd();
  });

  function start() {
    document.addEventListener('click', onCaptureClick, true);   // 캡처 단계
    // 초기 탭 상태 기록(늦은 렌더 대비 몇 차례) — 전환 감지 기준점
    checkTab();
    var n = 0;
    var iv = setInterval(function () { checkTab(); if (++n >= 12) clearInterval(iv); }, 500);
    log('FAQ GA 측정 준비 완료');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
