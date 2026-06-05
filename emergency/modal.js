/* ================================================================
   HELIX AMC — 응급 증상 상세 모달 (emergency/modal.js)
   ----------------------------------------------------------------
   사용법 (Webflow 측):
     증상 카드/블록의 트리거 요소에 다음 속성:
       data-emergency-open="<slug>"   (필수)

   데이터 위치:
     emergency/data/<slug>.json
       → 객체. 스키마:
         {
           "title":   "<태그/카테고리 표시 — 선택>",
           "name":    "<증상 이름>",
           "intro":   "<한 줄 요약 — 선택>",
           "urgency": "high" | "mid" | "low" (선택, 헤더 배지 색)
           "sections": [
             { "label": "이런 증상이라면",      "items": ["...","..."] },
             { "label": "집에서 응급 대처",    "items": ["..."] },
             { "label": "바로 병원에 와야 할 신호", "items": ["..."] }
           ]
         }

   페이지에 [data-emergency-open] 이 하나도 없으면 모달 코드는 listen
   만 걸고 아무 동작 안 함 (zero overhead).
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixEmergencyModalInit) return;
  window.__helixEmergencyModalInit = true;

  var DEBUG = /[?&]debug-emergency=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    var args = ['[emergency-modal]'].concat([].slice.call(arguments));
    try { console.log.apply(console, args); } catch (e) {}
  }
  function warn() {
    var args = ['[emergency-modal]'].concat([].slice.call(arguments));
    try { console.warn.apply(console, args); } catch (e) {}
  }

  var OWNER = 'pookat73-prog';
  var REPO  = 'helixamc-webflow';

  var dataCache = {};
  var modalEl = null;
  var lastFocus = null;

  function getRef() {
    if (window.HELIX_REF) return window.HELIX_REF;
    return /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  }

  function dataUrl(slug) {
    var t = Math.floor(Date.now() / 60000);
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
           '@' + getRef() + '/emergency/data/' + slug + '.json?t=' + t;
  }

  function fetchSymptom(slug) {
    if (dataCache[slug]) return dataCache[slug];
    var url = dataUrl(slug);
    log('fetching', slug, url);
    var p = fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (!d || typeof d !== 'object') throw new Error('expected object');
        return d;
      })
      .catch(function (err) {
        warn('load failed:', slug, err && err.message);
        delete dataCache[slug];
        return null;
      });
    dataCache[slug] = p;
    return p;
  }

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'helix-emergency-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'helix-emergency-modal-name');
    modalEl.innerHTML =
      '<div class="helix-emergency-modal_backdrop" data-modal-close="1" aria-hidden="true"></div>' +
      '<div class="helix-emergency-modal_panel" role="document">' +
        '<button type="button" class="helix-emergency-modal_close" aria-label="닫기" data-modal-close="1">×</button>' +
        '<div class="helix-emergency-modal_header">' +
          '<div class="helix-emergency-modal_title"></div>' +
          '<h2 class="helix-emergency-modal_name" id="helix-emergency-modal-name"></h2>' +
          '<div class="helix-emergency-modal_intro"></div>' +
        '</div>' +
        '<div class="helix-emergency-modal_body"></div>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-modal-close]')) close();
    });
    return modalEl;
  }

  function buildSection(label, items) {
    if (!Array.isArray(items) || !items.length) return null;
    var sec = document.createElement('section');
    sec.className = 'helix-emergency-modal_section';
    if (label) {
      var h = document.createElement('h3');
      h.textContent = label;
      sec.appendChild(h);
    }
    var ul = document.createElement('ul');
    items.forEach(function (s) {
      if (s == null) return;
      var li = document.createElement('li');
      li.textContent = String(s);
      ul.appendChild(li);
    });
    if (!ul.childNodes.length) return null;
    sec.appendChild(ul);
    return sec;
  }

  function render(data) {
    var m = ensureModal();
    var panel = m.querySelector('.helix-emergency-modal_panel');

    m.querySelector('.helix-emergency-modal_title').textContent = data.title || '';
    m.querySelector('.helix-emergency-modal_name').textContent  = data.name  || '';
    m.querySelector('.helix-emergency-modal_intro').textContent = data.intro || '';

    panel.classList.remove('urgency-high', 'urgency-mid', 'urgency-low');
    if (data.urgency === 'high' || data.urgency === 'mid' || data.urgency === 'low') {
      panel.classList.add('urgency-' + data.urgency);
    }

    var body = m.querySelector('.helix-emergency-modal_body');
    body.innerHTML = '';
    if (Array.isArray(data.sections)) {
      data.sections.forEach(function (sec) {
        if (!sec) return;
        var el = buildSection(sec.label, sec.items);
        if (el) body.appendChild(el);
      });
    }

    if (panel) panel.scrollTop = 0;
  }

  function open(data) {
    var m = ensureModal();
    render(data);
    lastFocus = document.activeElement;
    document.documentElement.classList.add('helix-emergency-modal-open');
    document.body.classList.add('helix-emergency-modal-open');
    m.style.display = 'flex';
    requestAnimationFrame(function () {
      m.classList.add('is-open');
      var closeBtn = m.querySelector('.helix-emergency-modal_close');
      if (closeBtn) {
        try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); }
      }
    });
  }

  function close() {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;
    modalEl.classList.remove('is-open');
    document.documentElement.classList.remove('helix-emergency-modal-open');
    document.body.classList.remove('helix-emergency-modal-open');
    setTimeout(function () {
      if (modalEl && !modalEl.classList.contains('is-open')) {
        modalEl.style.display = '';
      }
    }, 320);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
    lastFocus = null;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
      e.preventDefault();
      close();
    }
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target && e.target.closest && e.target.closest('[data-emergency-open]');
    if (!trigger) return;

    var slug = (trigger.getAttribute('data-emergency-open') || '').trim();
    if (!slug) return;
    e.preventDefault();

    log('click open', slug);
    fetchSymptom(slug).then(function (data) {
      if (!data) {
        data = {
          name: slug,
          title: '',
          intro: '상세 정보 준비 중입니다.'
        };
      }
      open(data);
    });
  });

  log('ready (ref=' + getRef() + ')');
})();
