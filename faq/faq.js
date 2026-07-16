/* ================================================================
   HELIX AMC — FAQ 자세히보기 / 간략히보기 토글 (v9 — 튜닝 패널)

   Webflow 실제 구조 (컴포넌트):
   - FAQ_QA (faq_qa)          : 질문 카드 + 요약(faq-a). 내부 .faq-more 링크 2개
   - FAQ_Answer AI (faq_answer-ai) : 상세 답변(펼침부분). 내부:
       · FAQ_Line (faq_line)   = 구분선
       · faq-a_Full (faq-a_full) = 상세 문단

   펼침 연출
   - 영역(높이) 즉시 열림
   - 구분선: 가운데→양쪽, "아주 천천히 기다가 끝에서 팍" (극단 easeIn)
   - 문단: 선이 거의 다 그어질 때 등장 + "쫀득하게"(살짝 튕겨 안착, easeOutBack)
   접힘: 역순(문단 → 선 → 높이)

   요약(faq-a)은 항상 표시. JS 실패 시 전부 표시.

   디버그 로그:  URL 에 ?debug-faq=1
   튜닝 패널:    URL 에 ?faq-tune=1  (실사용에선 안 뜸)
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqInit) return;
  window.__helixFaqInit = true;

  var DEBUG = /[?&]debug-faq=1\b/.test(location.search);
  var TUNE  = /[?&]faq-tune=1\b/.test(location.search);
  function log() {
    if (!DEBUG && !TUNE) return;
    console.log.apply(console, ['[FAQ v9]'].concat(Array.prototype.slice.call(arguments)));
  }

  var QA_SEL   = '[class*="faq_qa" i]';
  var ANS_SEL  = '[class*="faq_answer" i]';
  var MORE_SEL = '[class*="faq-more" i]';
  var LINE_SEL = '[class*="faq_line" i]';

  /* ── 조절 가능한 값(초 단위) — 패널이 이 객체를 실시간 수정 ──────── */
  /* 사용자 이징 도구가 뽑은 멀티포인트 linear() 스플라인 — 선/문단 따로 관리. */
  var LINE_SPLINE = 'linear(0 0.0%, 0.0034 11.4%, 0.0117 21.6%, 0.0249 30.7%, 0.0428 38.8%, 0.0654 45.9%, 0.0925 52.1%, 0.124 57.5%, 0.1598 62.1%, 0.1998 65.9%, 0.2439 69.0%, 0.2919 71.5%, 0.3438 73.5%, 0.3994 74.9%, 0.4587 75.8%, 0.5215 76.4%, 0.5876 76.6%, 0.6518 76.8%, 0.7087 77.1%, 0.759 77.6%, 0.8029 78.3%, 0.841 79.2%, 0.8738 80.2%, 0.9015 81.4%, 0.9247 82.7%, 0.9438 84.3%, 0.9593 86.0%, 0.9716 87.9%, 0.9811 90.0%, 0.9882 92.2%, 0.9935 94.6%, 0.9972 97.2%, 1 100.0%)';
  var TEXT_SPLINE = 'linear(0 0.0%, 0.0024 9.8%, 0.0081 18.4%, 0.0172 25.9%, 0.0299 32.4%, 0.0465 38.0%, 0.0672 42.8%, 0.092 46.9%, 0.1213 50.3%, 0.1553 53.2%, 0.1941 55.6%, 0.2379 57.7%, 0.2869 59.5%, 0.3413 61.1%, 0.4013 62.7%, 0.4672 64.2%, 0.539 65.8%, 0.6101 67.6%, 0.6735 69.3%, 0.7298 71.1%, 0.7794 72.9%, 0.8226 74.8%, 0.86 76.7%, 0.8919 78.6%, 0.9186 80.6%, 0.9408 82.7%, 0.9587 84.9%, 0.9727 87.2%, 0.9833 89.5%, 0.991 92.0%, 0.996 94.5%, 0.9989 97.2%, 1 100.0%)';
  /* linear() 미지원 브라우저(구형 사파리·인앱 웹뷰 등) 폴백 — 창→팍→안착 근사.
     미지원 시 linear() 는 트랜지션 값 전체를 무효화해 "즉시 튐"을 유발하므로 필수. */
  var SPLINE_FB = 'cubic-bezier(0.85, 0, 0.4, 1)';
  var SUPPORTS_LINEAR = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0 0%, 1 100%)'));
  var LINE_EASE = SUPPORTS_LINEAR ? LINE_SPLINE : SPLINE_FB;
  var TEXT_EASE = SUPPORTS_LINEAR ? TEXT_SPLINE : SPLINE_FB;
  if (!SUPPORTS_LINEAR) console.info('[FAQ] linear() 미지원 브라우저 → cubic-bezier 폴백 사용');

  var CFG = (window.HELIX_FAQ_CFG = {
    heightDur:  0.5,                                  // 영역 열림 (이징=선과 동일)
    lineDur:    0.5,                                  // 선 그리는 시간
    lineEase:   LINE_EASE,                            // 선 곡선 (미지원 시 폴백)
    textDelay:  0.18,                                 // 선·문단 따딱, 살짝 지연 (180ms)
    textDur:    0.5,                                  // 문단 슬라이드 시간
    fadeDur:    0.2,                                   // 문단 페이드인 시간 (슬라이드와 별개, 확!)
    textSlide:  3,                                    // 문단 아주 살짝 둥실
    textEase:   TEXT_EASE,                            // 문단 슬라이드(이동) 곡선
    fadeEase:   'cubic-bezier(0.977, -0.001, 1, 0.696)', // 문단 페이드인(opacity) 곡선 (별개)
    // 접힘(역순)
    cTextDur:   0.22,
    cLineDelay: 0.13,
    cLineDur:   0.4,
    cHeightDelay: 0.24,
    cHeightDur: 0.42
  });

  var LINE_EASE_PRESETS = {
    '커스텀 스플라인(현재)': LINE_SPLINE,
    '천천히→팍→안착':       'cubic-bezier(0.85, 0, 0.4, 1)',
    '팍(끝빠름·안착없음)':  'cubic-bezier(0.85, 0, 0.92, 0.06)',
    '부드럽게':             'cubic-bezier(0.16, 1, 0.3, 1)'
  };
  var TEXT_EASE_PRESETS = {
    '문단 커스텀(현재)':  TEXT_SPLINE,
    '부드럽게':         'cubic-bezier(0.16, 1, 0.3, 1)',
    '쫀득(튕김)':       'cubic-bezier(0.34, 1.7, 0.5, 1)',
    '천천히':           'cubic-bezier(0.4, 0, 0.2, 1)'
  };

  /* 영역 열림 이징 = 선 이징(선과 동일) */
  function tOpen(a)  { return 'max-height ' + CFG.heightDur + 's ' + CFG.lineEase; }
  function tLine()   { return 'transform ' + CFG.lineDur + 's ' + CFG.lineEase; }
  /* 페이드인(opacity)과 슬라이드인(transform) 곡선 분리 */
  function tText()   { return 'opacity ' + CFG.fadeDur + 's ' + CFG.fadeEase + ', transform ' + CFG.textDur + 's ' + CFG.textEase; }

  function showEl(el) { if (el) el.style.removeProperty('display'); }
  function hideEl(el) { if (el) el.style.setProperty('display', 'none', 'important'); }

  function parts(a) {
    return {
      line: a.querySelector(LINE_SEL),
      text: a.querySelector('[class*="faq-a_full" i]') || a.querySelector('[class*="faq_fa" i]') || a.querySelector('p')
    };
  }

  function primeClosed(p) {
    if (p.line) { p.line.style.transition = 'none'; p.line.style.transitionDelay = '0s'; p.line.style.transformOrigin = 'center'; p.line.style.transform = 'scaleX(0)'; }
    if (p.text) { p.text.style.transition = 'none'; p.text.style.transitionDelay = '0s'; p.text.style.opacity = '0'; p.text.style.transform = 'translateY(' + CFG.textSlide + 'px)'; }
  }

  function closeAnswer(a, instant) {
    if (!a) return;
    a.__open = false;
    a.style.overflow = 'hidden';
    var p = parts(a);
    if (instant) {
      a.style.transition = 'none'; a.style.transitionDelay = '0s';
      a.style.maxHeight = '0px';
      primeClosed(p);
      void a.offsetHeight;
      return;
    }
    a.style.transition = 'none'; a.style.transitionDelay = '0s';
    a.style.maxHeight = a.scrollHeight + 'px';
    void a.offsetHeight;
    // 역순: 문단 → 선 → 높이
    if (p.text) {
      p.text.style.transition = 'opacity ' + CFG.cTextDur + 's ease, transform ' + (CFG.cTextDur + 0.05) + 's cubic-bezier(0.5,0,0.75,0)';
      p.text.style.transitionDelay = '0s';
      p.text.style.opacity = '0';
      p.text.style.transform = 'translateY(' + CFG.textSlide + 'px)';
    }
    if (p.line) {
      p.line.style.transition = 'transform ' + CFG.cLineDur + 's cubic-bezier(0.6,0,0.9,0.2)';
      p.line.style.transitionDelay = CFG.cLineDelay + 's';
      p.line.style.transform = 'scaleX(0)';
    }
    a.style.transition = 'max-height ' + CFG.cHeightDur + 's cubic-bezier(0.7,0,0.84,0)';
    a.style.transitionDelay = CFG.cHeightDelay + 's';
    a.style.maxHeight = '0px';
  }

  function openAnswer(a) {
    if (!a) return;
    a.__open = true;
    showEl(a);
    a.style.overflow = 'hidden';
    var p = parts(a);

    a.style.transition = 'none'; a.style.transitionDelay = '0s';
    a.style.maxHeight = '0px'; a.style.opacity = '1';
    primeClosed(p);
    void a.offsetHeight;

    // 영역(흰 공간)은 클릭 즉시 통째로 확보 — 높이 애니 없음
    a.style.maxHeight = 'none';

    // 확보된 공간 안에서 선·문단 모션 시작
    if (p.line) {
      p.line.style.transition = tLine();
      p.line.style.transitionDelay = '0s';
      p.line.style.transform = 'scaleX(1)';
    }
    if (p.text) {
      p.text.style.transition = tText();
      p.text.style.transitionDelay = CFG.textDelay + 's';
      p.text.style.opacity = '1';
      p.text.style.transform = 'translateY(0)';
    }
  }

  function findLinks(qa) {
    var ls = qa.querySelectorAll(MORE_SEL);
    var expand = null, collapse = null;
    for (var i = 0; i < ls.length; i++) {
      var t = (ls[i].textContent || '').replace(/\s+/g, '');
      if (!expand && /자세히/.test(t)) expand = ls[i];
      else if (!collapse && /간략/.test(t)) collapse = ls[i];
    }
    if (!expand && ls[0]) expand = ls[0];
    if (!collapse && ls[1]) collapse = ls[1];
    return { expand: expand, collapse: collapse };
  }

  function answerFor(qa) {
    var flat = Array.prototype.slice.call(document.querySelectorAll(QA_SEL + ',' + ANS_SEL));
    var i = flat.indexOf(qa);
    for (var j = i + 1; j < flat.length; j++) {
      if (flat[j].matches(ANS_SEL)) return flat[j];
      if (flat[j].matches(QA_SEL)) break;
    }
    return null;
  }

  function setState(it, open, instant) {
    it.open = open;
    if (open) { openAnswer(it.answer); hideEl(it.expand); showEl(it.collapse); }
    else      { closeAnswer(it.answer, instant); showEl(it.expand); hideEl(it.collapse); }
    if (it.expand) it.expand.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  var ITEMS = [];

  function process() {
    var qas = document.querySelectorAll(QA_SEL);
    var fresh = 0;
    for (var i = 0; i < qas.length; i++) {
      var qa = qas[i];
      if (qa.__faqItem) {
        var ex = qa.__faqItem;
        if (ex.answer && !ex.open && ex.answer.style.maxHeight !== '0px') {
          closeAnswer(ex.answer, true); showEl(ex.expand); hideEl(ex.collapse);
        }
        continue;
      }
      var lk = findLinks(qa);
      var it = { qa: qa, answer: answerFor(qa), expand: lk.expand, collapse: lk.collapse, open: false };
      qa.__faqItem = it; ITEMS.push(it); fresh++;
      (function (item) {
        if (item.expand) item.expand.addEventListener('click', function (e) { e.preventDefault(); setState(item, true); });
        if (item.collapse) item.collapse.addEventListener('click', function (e) { e.preventDefault(); setState(item, false); });
      })(it);
      setState(it, false, true);
    }
    if (fresh) log('신규 처리', fresh, '개 / 총', qas.length, '개');
    return qas.length;
  }

  function start() {
    process();
    try {
      var mo = new MutationObserver(function () {
        if (mo.__t) return;
        mo.__t = setTimeout(function () { mo.__t = null; process(); }, 80);
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    var n = 0;
    var iv = setInterval(function () { process(); if (++n >= 12) clearInterval(iv); }, 500);
    if (TUNE) buildPanel();
  }

  /* ── 튜닝 패널 (?faq-tune=1) ─────────────────────────────────── */
  function buildPanel() {
    if (document.getElementById('faq-tune-panel')) return;
    var css = '#faq-tune-panel{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:280px;'
      + 'background:#0d1117;color:#e6edf3;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;'
      + 'border:1px solid #30363d;border-radius:10px;padding:12px 14px;box-shadow:0 8px 30px rgba(0,0,0,.5)}'
      + '#faq-tune-panel h4{margin:0 0 8px;font-size:13px;color:#58a6ff}'
      + '#faq-tune-panel label{display:block;margin:9px 0 2px;color:#8b949e}'
      + '#faq-tune-panel .row{display:flex;align-items:center;gap:8px}'
      + '#faq-tune-panel input[type=range]{flex:1}'
      + '#faq-tune-panel .val{width:52px;text-align:right;color:#e6edf3;font-variant-numeric:tabular-nums}'
      + '#faq-tune-panel select{width:100%;background:#161b22;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:3px}'
      + '#faq-tune-panel .btns{display:flex;gap:6px;margin-top:10px}'
      + '#faq-tune-panel button{flex:1;background:#238636;color:#fff;border:0;border-radius:6px;padding:6px;cursor:pointer;font-size:12px}'
      + '#faq-tune-panel button.sec{background:#21262d;border:1px solid #30363d}'
      + '#faq-tune-panel textarea{width:100%;height:74px;margin-top:8px;background:#161b22;color:#7ee787;'
      + 'border:1px solid #30363d;border-radius:6px;font:11px/1.4 ui-monospace,monospace;padding:6px;resize:none}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var box = document.createElement('div'); box.id = 'faq-tune-panel';
    function sliderRow(key, label, min, max, step, unit) {
      return '<label>' + label + '</label><div class="row">'
        + '<input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + CFG[key] + '">'
        + '<span class="val" data-v="' + key + '">' + CFG[key] + unit + '</span></div>';
    }
    function selRow(key, label, presets) {
      var opts = '';
      for (var name in presets) opts += '<option value="' + presets[name] + '"' + (presets[name] === CFG[key] ? ' selected' : '') + '>' + name + '</option>';
      return '<label>' + label + '</label><select data-k="' + key + '">' + opts + '</select>';
    }
    box.innerHTML = '<h4>FAQ 펼침 튜닝</h4>'
      + sliderRow('lineDur',   '선 시간',        0.2, 1.5, 0.05, 's')
      + selRow('lineEase',     '선 이징', LINE_EASE_PRESETS)
      + sliderRow('textDelay', '문단 딜레이(선 뒤)', 0, 1.2, 0.02, 's')
      + sliderRow('textDur',   '문단 시간',      0.2, 1.2, 0.05, 's')
      + sliderRow('textSlide', '문단 이동거리',  0, 40, 1, 'px')
      + selRow('textEase',     '문단 이징(쫀득)', TEXT_EASE_PRESETS)
      + sliderRow('heightDur', '영역 열림',      0.2, 1, 0.05, 's')
      + '<div class="btns"><button data-act="play">▶ 미리보기</button>'
      + '<button class="sec" data-act="copy">값 복사</button></div>'
      + '<textarea readonly data-out></textarea>';
    document.body.appendChild(box);

    var out = box.querySelector('[data-out]');
    function refreshOut() {
      var names = { lineEase: LINE_EASE_PRESETS, textEase: TEXT_EASE_PRESETS };
      function nameOf(key) { var m = names[key]; for (var n in m) if (m[n] === CFG[key]) return n; return CFG[key]; }
      out.value =
        '선 시간 ' + CFG.lineDur + 's / 이징 ' + nameOf('lineEase') + '\n' +
        '문단 딜레이 ' + CFG.textDelay + 's / 시간 ' + CFG.textDur + 's\n' +
        '문단 이동 ' + CFG.textSlide + 'px / 이징 ' + nameOf('textEase') + '\n' +
        '영역 열림 ' + CFG.heightDur + 's';
    }
    refreshOut();

    var first = ITEMS[0];
    function preview() {
      if (!first) return;
      setState(first, false, true);
      setTimeout(function () { setState(first, true); }, 60);
    }

    box.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      var v = e.target.value;
      CFG[k] = (e.target.type === 'range') ? parseFloat(v) : v;
      var span = box.querySelector('[data-v="' + k + '"]');
      if (span) span.textContent = CFG[k] + (k === 'textSlide' ? 'px' : 's');
      refreshOut();
      preview();
    });
    box.addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'play') preview();
      if (act === 'copy') { out.select(); try { document.execCommand('copy'); } catch (x) {} e.target.textContent = '복사됨!'; setTimeout(function(){ e.target.textContent='값 복사'; }, 1200); }
    });
    log('튜닝 패널 활성 — ?faq-tune=1');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
