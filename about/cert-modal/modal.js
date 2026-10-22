/* HELIX AMC — 인증 상세 모달 v4.0
 * 내용은 2026-10-22 게시 원문을 보존. Webflow 상세 페이지/iframe/fetch 의존 없음.
 * 공유 주소: /discover-helix?cert=aaha|emergency|cat#cert
 * 기존 자산 파일을 그대로 사용해 로더 FILES 변경 없이 반영한다.
 */
(function () {
  'use strict';
  if (window.__helixCertModalInit) return;
  window.__helixCertModalInit = true;

  var DATA = {
  "aaha": {
    "title": "AAHA Accreditation",
    "subtitle": "미국동물병원협회 인증",
    "tag": "AAHA",
    "organization": "American Animal Hospital Association",
    "description": "북미 수의학계 최고 권위의 동물병원 인증 기관입니다. 국제 표준을 기준으로 시설, 장비, 의료 프로토콜 전반을 평가하며, 전 세계 수의료계에서 가장 신뢰받는 인증 중 하나입니다.",
    "image": "https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/69d7088bfcd2341cef7e0c25_Accredited_TagC_Color_web.webp",
    "imageAlt": "AAHA 공식 인증 뱃지 — 미국동물병원협회",
    "slides": [
      {
        "label": "Why?",
        "blocks": [
          {
            "title": "국내 단 0.16%, 헬릭스 서초본원",
            "text": "북미 동물병원의 단 12~15%만이 통과하는 심사입니다. 국내 약 5,500개 동물병원 중 이 기준을 통과한 곳은 헬릭스를 포함해 단 9곳, 약 0.16%에 불과합니다. 두 숫자가 이 인증의 무게를 말해줍니다."
          },
          {
            "title": "900번의 검증 마취·감염·통증·회복 등",
            "text": "마취 안전 관리, 감염 예방, 통증 완화 케어 등 반려동물의 생명과 직결되는 900여 항목을 국제 표준 가이드라인에 따라 검증합니다. 시설과 장비를 갖추는 것만으로는 부족합니다. 의료진의 프로토콜 숙지 수준, 처치 전후 환자 모니터링 체계, 응급 상황 대응 매뉴얼까지 실제 운용 역량 전반이 평가 대상입니다."
          }
        ]
      },
      {
        "label": "How?",
        "blocks": [
          {
            "title": "결과가 아닌, 과정으로 증명합니다",
            "text": "AAHA 기준은 무엇을 치료했느냐가 아니라 어떻게 치료했느냐를 봅니다. 마취 전 환자 상태 평가, 수술 중 활력징후 모니터링, 회복 단계별 통증 관리까지 치료가 이루어지는 모든 과정이 체계적으로 관리되어야 합니다. 헬릭스가 지키는 것은 그 기준입니다."
          },
          {
            "title": "미·한 수의사협회 공동 정기 재검증",
            "text": "AAHA-KVMA 공동 인증은 취득으로 끝나지 않습니다. 세계 유일의 동물병원 인증 기관 AAHA의 글로벌 스탠더드와 대한수의사회(KVMA)의 국내 환경 최적화 기준이 결합된 이 인증은, 매년 양 기관의 공동 재평가를 통해 유지됩니다. 병원이 어디에 있든 동일한 국제 기준으로 관리되는 구조입니다."
          }
        ]
      },
      {
        "label": "What?",
        "blocks": [
          {
            "title": "준비된 병원만 통과한, 도입 초기 인증",
            "text": "2023년 AAHA-KVMA 업무 협약 체결 이후, 2024년 3개소 시범 인증, 2025년 4월 본 사업 전환 후 5개소 선정에 이어 헬릭스동물메디컬센터 서초본원은 2025년 9월 국내 9번째로 공동 인증을 획득했습니다. 도입 초기 단계에서 선정된 병원이라는 것 자체가 헬릭스의 준비 수준을 말해줍니다."
          }
        ]
      }
    ],
    "legacyPath": "/aaha-cert"
  },
  "emergency": {
    "title": "VECCS Facility Accreditation",
    "subtitle": "응급·중환자 의료 시설 인증",
    "tag": "VECCS",
    "organization": "Veterinary Emergency and Critical Care Society",
    "description": "응급 의학과 중환자 의학을 전문으로 다루는 국제 수의학회입니다. 병원의 응급 대응 역량을 인력, 장비, 프로토콜 세 축으로 심사해 등급을 부여하며, 응급 의료 분야에서 가장 널리 통용되는 시설 인증 체계입니다.",
    "image": "https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6a6adba21396ad08ee6818a8_Facility%20Cert%20-%20Level%202%20-%205x5%20Window%20Sticker%20December%202028.jpg",
    "imageAlt": "VECCS 응급·중환자 의료 시설 인증 레벨 2 뱃지",
    "slides": [
      {
        "label": "What?",
        "blocks": [
          {
            "title": "Level 2, 상급 응급 의료 시설",
            "text": "단지 24시간 문을 여는 것은 레벨 2의 기준이 되지 않습니다. 정밀한 응급 처치와 고도의 집중 치료가 동시에 가능한 상급 응급 의료 시설임을 증명하는 등급입니다."
          },
          {
            "title": "국제 학회가 정한 응급 기준",
            "text": "VECCS는 응급과 중환자 의학만을 다루는 국제 학회입니다. 학회가 정한 시설 인증 기준은 병원이 무엇을 갖추었는지를 넘어, 그것을 실제로 운용할 수 있는지를 봅니다."
          }
        ]
      },
      {
        "label": "How?",
        "blocks": [
          {
            "title": "세 가지 요건을 모두 충족해야 합니다",
            "text": "숙련된 수의사의 상시 상주와 전문 보조 인력 팀 구성, 인공호흡기와 실시간 모니터링 장비 등 중환자 관리 설비 완비, 표준화된 응급 프로토콜 운영과 정기적인 CPR·위기 관리 교육까지. 세 가지 요건을 모두 충족해야만 레벨 2 인증이 부여됩니다."
          },
          {
            "title": "사람이 아니라 체계로 대응합니다",
            "text": "응급 대응의 질이 그날 당직의 경험에 좌우되어서는 안 됩니다. 도착 즉시 이루어지는 중증도 분류, 처치 단계별 기록, 인수인계 절차까지 표준화해 누가 당직이든 동일한 수준의 처치가 이루어지도록 관리합니다."
          }
        ]
      },
      {
        "label": "Whenever.",
        "blocks": [
          {
            "title": "결정적인 순간",
            "text": "응급은 예고 없이 찾아옵니다. 환자의 생명이 시간에 달린 그 순간에도 헬릭스는 이미 준비되어 있습니다. VECCS 레벨 2 인증은 우리가 그 순간을 감당할 수 있다는 증명입니다."
          }
        ]
      }
    ],
    "legacyPath": "/emergency-cert"
  },
  "cat": {
    "title": "Cat Friendly Clinic GOLD",
    "subtitle": "고양이 친화 진료소 인증 골드",
    "organization": "Cat Friendly Clinic",
    "description": "세계적인 고양이 의학 권위 기관 ISFM(International Society of Feline Medicine)이 부여하는 고양이 친화 진료소 인증입니다. 시설과 장비는 물론 의료진의 고양이 핸들링 역량까지 종합적으로 평가하며, 브론즈·실버·골드 세 등급으로 나뉩니다.",
    "image": "https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6a6adba829b87a7c2a76feb7_Cat-Friendly-Clinic-GOLD26-logo-AW_1.png",
    "imageAlt": "Cat Friendly Clinic 골드 인증 로고",
    "slides": [
      {
        "label": "Why?",
        "blocks": [
          {
            "title": "고양이만을 위한 기준, 헬릭스",
            "text": "국제고양이수의학회(ISFM)가 병원의 진료 환경 전반을 심사해 부여하는 인증입니다. 고양이는 낯선 냄새와 소리, 좁은 이동장에 특히 예민하게 반응하는 동물입니다. 대기 공간부터 진료 절차, 입원 환경까지 고양이의 스트레스를 낮추도록 설계되었는지를 기준으로 평가합니다."
          },
          {
            "title": "GOLD 등급, 가장 엄격한 기준을 통과",
            "text": "CFC(Cat Friendly Clinic) 인증은 브론즈·실버·골드 세 등급으로 나누며, 헬릭스는 이 중 최고 등급인 GOLD를 획득했습니다. 고양이 전용 대기 공간과 이동장 배치, 페로몬 안정화, 저자극 핸들링 프로토콜 등 진료 전 과정에서 고양이의 불안을 최소화하는 환경을 갖추었는지가 심사 대상입니다."
          }
        ]
      },
      {
        "label": "How?",
        "blocks": [
          {
            "title": "진단보다 먼저, 안정을 살핍니다",
            "text": "CFC 기준은 무엇을 치료했느냐가 아니라 고양이가 병원에 머무는 순간순간을 어떻게 다뤘느냐를 봅니다. 이동장에서 진료대까지의 동선, 개와 분리된 대기·입원 공간, 최소한의 억제로 이루어지는 핸들링까지 — 진료의 전 과정이 고양이의 심리적 안정을 우선하도록 설계되어야 합니다. 헬릭스가 지키는 것은 그 기준입니다."
          },
          {
            "title": "국제 학회의 정기 재평가",
            "text": "CFC 인증은 취득으로 끝나지 않습니다. ISFM은 정기적인 재평가를 통해 병원이 고양이 친화적 진료 환경을 지속적으로 유지하고 있는지 확인합니다. 인증은 순간의 심사가 아니라, 유지되는 기준입니다."
          }
        ]
      }
    ],
    "legacyPath": "/cat-cert",
    "tag": "CFC GOLD"
  }
};
  var ABOUT_PATH = '/discover-helix';
  var LOGO = 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/' +
    '69d700bcc34b330ceea4724c_%EC%A1%B0%ED%95%A9%ED%98%95%20%EB%A1%9C%EA%B3%A02-p-500.webp';
  var overlay, body, dots, prev, next, status;
  var currentKey = null, currentIdx = 0, reader = null, base = null;
  var background = [], lastFocus = null, closingHistory = false;
  var routeOwner = 'cert-' + Date.now() + '-' + Math.random();

  function keyForPath(path) {
    var aliases = { '/cert-aaha': 'aaha', '/yiryojin': 'aaha',
      '/yiryojin-copy': 'emergency', '/yiryojin-copy-2': 'cat' };
    path = path.replace(/\/$/, '');
    return Object.keys(DATA).filter(function (key) { return DATA[key].legacyPath === path; })[0] || aliases[path] || null;
  }
  function certUrl(key) { return ABOUT_PATH + '?cert=' + key + '#cert'; }
  function routeKey() {
    if (location.pathname.replace(/\/$/, '') !== ABOUT_PATH) return null;
    var key = new URL(location.href).searchParams.get('cert');
    return Object.prototype.hasOwnProperty.call(DATA, key) ? key : null;
  }
  function linkKey(a) {
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (_) { return null; }
    if (u.origin !== location.origin) return null;
    var key = keyForPath(u.pathname);
    if (!key && u.pathname.replace(/\/$/, '') === ABOUT_PATH) {
      key = u.searchParams.get('cert');
    }
    return Object.prototype.hasOwnProperty.call(DATA, key) ? key : null;
  }
  function escape(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function remember() {
    if (base) return;
    base = { url: location.pathname + location.search + location.hash, title: document.title,
      x: window.scrollX, y: window.scrollY };
    lastFocus = document.activeElement;
  }
  function emit(name, params) {
    if (window.HelixMeasure) { window.HelixMeasure.emit(name, params); return; }
    if (window.__helixNoMeasure || /\.webflow\.io$/i.test(location.hostname) ||
        /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, params));
    } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push(Object.assign({ event: name }, params));
    }
  }
  function stopReader() { if (reader) { reader.stop(); reader = null; } }
  function build() {
    overlay = document.createElement('div');
    overlay.className = 'helix-cert-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'helix-cert-title');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<div class="helix-cert-modal__backdrop" data-close></div>' +
      '<div class="helix-cert-modal__card">' +
        '<button type="button" class="helix-cert-modal__close" data-close aria-label="인증 상세 닫기">×</button>' +
        '<header class="helix-cert-modal__header">' +
          '<div><p class="helix-cert-modal__tag"></p><h2 id="helix-cert-title"></h2>' +
          '<p class="helix-cert-modal__english" lang="en"></p></div>' +
          '<img class="helix-cert-modal__badge" alt=""></header>' +
        '<div class="helix-cert-modal__body" tabindex="0" role="region" aria-label="인증 상세 내용"></div>' +
        '<footer class="helix-cert-modal__controls">' +
          '<button type="button" class="helix-cert-modal__nav" data-prev aria-label="이전 슬라이드">‹</button>' +
          '<div class="helix-cert-modal__dots" role="group" aria-label="슬라이드 선택"></div>' +
          '<span class="helix-cert-modal__status" aria-live="polite" aria-atomic="true"></span>' +
          '<button type="button" class="helix-cert-modal__nav" data-next aria-label="다음 슬라이드">›</button>' +
        '</footer></div>';
    document.body.appendChild(overlay);
    body = overlay.querySelector('.helix-cert-modal__body');
    dots = overlay.querySelector('.helix-cert-modal__dots');
    prev = overlay.querySelector('[data-prev]');
    next = overlay.querySelector('[data-next]');
    status = overlay.querySelector('.helix-cert-modal__status');
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
      else if (e.target.closest('[data-prev]')) go(currentIdx - 1);
      else if (e.target.closest('[data-next]')) go(currentIdx + 1);
      else if (e.target.closest('[data-slide]')) go(Number(e.target.closest('[data-slide]').dataset.slide));
    });
  }
  function open(key, fromHistory, trigger) {
    if (!Object.prototype.hasOwnProperty.call(DATA, key) || closingHistory) return;
    var originalLocation = location.href;
    remember();
    if (trigger) lastFocus = trigger;
    if (!overlay) build();
    if (!currentKey) {
      background = Array.prototype.map.call(document.body.children, function (el) {
        var saved = { el: el, inert: el.inert };
        if (el !== overlay) el.inert = true;
        return saved;
      });
    }
    stopReader();
    currentKey = key;
    var cert = DATA[key];
    overlay.querySelector('.helix-cert-modal__tag').textContent = cert.tag;
    overlay.querySelector('#helix-cert-title').textContent = cert.subtitle;
    overlay.querySelector('.helix-cert-modal__english').textContent = cert.title;
    var img = overlay.querySelector('.helix-cert-modal__badge');
    img.src = cert.image;
    img.alt = cert.imageAlt;
    dots.innerHTML = [cert.title].concat(cert.slides.map(function (s) { return s.label; }))
      .map(function (label, i) {
        return '<button type="button" class="helix-cert-modal__dot" data-slide="' + i +
          '" aria-label="' + (i + 1) + '. ' + escape(label) + '"></button>';
      }).join('');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('helix-cert-modal-open');
    if (!fromHistory) {
      var url = new URL(location.href);
      url.pathname = ABOUT_PATH;
      url.searchParams.set('cert', key);
      url.hash = 'cert';
      var state = Object.assign({}, history.state || {});
      state.helixCertModal = { owner: routeOwner, key: key };
      history.pushState(state, '', url.pathname + url.search + url.hash);
      var device = window.HelixVP ? window.HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop');
      emit('cert_modal_open_' + device, { item_type: 'cert_modal', page: 'discover',
        cert: cert.legacyPath, device: device, page_location: originalLocation });
    }
    document.title = cert.subtitle + ' | 헬릭스동물메디컬센터';
    go(0, true);
    overlay.querySelector('[data-close]').focus({ preventScroll: true });
  }
  function close(fromHistory) {
    if (!currentKey) return;
    var state = history.state && history.state.helixCertModal;
    if (!fromHistory && state && state.owner === routeOwner) {
      if (!closingHistory) { closingHistory = true; history.back(); }
      return;
    }
    if (!fromHistory) {
      // 직접 접속/새로고침: 외부 유입 기록을 건드리지 않고 인증 선택만 해제한다.
      var url = new URL(location.href);
      url.searchParams.delete('cert');
      url.hash = 'cert';
      var nextState = Object.assign({}, history.state || {});
      delete nextState.helixCertModal;
      history.replaceState(nextState, '', url.pathname + url.search + url.hash);
    }
    stopReader();
    emit('cert_modal_close', { cert: DATA[currentKey].legacyPath, slide_index: currentIdx + 1 });
    currentKey = null;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('helix-cert-modal-open');
    background.forEach(function (item) { item.el.inert = item.inert; });
    background = [];
    if (base) {
      document.title = base.title;
      var focus = lastFocus, x = base.x, y = base.y;
      function restorePosition() {
        if (currentKey) return;
        if (focus && focus.isConnected) focus.focus({ preventScroll: true });
        window.scrollTo(x, y);
      }
      restorePosition();
      // 브라우저의 popstate 후 포커스/스크롤 복원이 끝난 다음 다시 맞춘다.
      setTimeout(restorePosition, 0);
    }
    base = null;
    lastFocus = null;
  }
  function go(idx, initial) {
    if (!currentKey) return;
    var cert = DATA[currentKey], count = cert.slides.length + 1;
    if (idx < 0 || idx >= count || (!initial && idx === currentIdx)) return;
    var previous = currentIdx;
    stopReader();
    currentIdx = idx;
    var slide = cert.slides[idx - 1];
    body.innerHTML = idx === 0
      ? '<section><h3 class="helix-cert-modal__organization" lang="en">' + escape(cert.organization) +
        '</h3><p>' + escape(cert.description) + '</p></section>'
      : '<section><p class="helix-cert-modal__label" lang="en">' + escape(slide.label) + '</p>' +
        slide.blocks.map(function (block) {
          return '<div class="helix-cert-modal__block"><h3>' + escape(block.title) + '</h3><p>' +
            escape(block.text) + '</p></div>';
        }).join('') + '</section>';
    body.insertAdjacentHTML('beforeend', '<img class="helix-cert-modal__logo" src="' + LOGO +
      '" alt="헬릭스동물메디컬센터 로고">');
    body.scrollTop = 0;
    Array.prototype.forEach.call(dots.children, function (dot, i) {
      dot.classList.toggle('is-active', i === idx);
      if (i === idx) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    // 비활성화되는 이전/다음 버튼에 키보드 포커스가 남지 않게 한다.
    if ((idx === 0 && document.activeElement === prev) ||
        (idx === count - 1 && document.activeElement === next)) dots.children[idx].focus();
    prev.disabled = idx === 0;
    next.disabled = idx === count - 1;
    status.textContent = (idx + 1) + ' / ' + count;
    if (!initial) emit('cert_modal_slide', { cert: cert.legacyPath, slide_index: idx + 1,
      previous_index: previous + 1, total: count });
    if (window.HelixMeasure) reader = window.HelixMeasure.reader('cert_modal_read', {
      cert: cert.legacyPath, slide_index: idx + 1 });
  }
  var CERTS = [
    { card: '.about_contents_box_ahha',  mark: '.div-block-159',
      slug: '/aaha-cert',      tag: 'AAHA',      kr: '미국동물병원협회' },
    { card: '.about_contents_box_veccs', mark: '.div-block-158',
      slug: '/emergency-cert', tag: 'VECCS',     kr: '응급·중환자 케어' },
    { card: '.about_contents_box_cfc',   mark: '.div-block-157',
      slug: '/cat-cert',       tag: 'CFC GOLD',  kr: '고양이 친화 진료소' }
  ];

  function buildMobileBadges() {
    var section = document.getElementById('cert');
    if (!section) return;
    /* 중복 생성 방지 — MutationObserver 나 재호출로 두 번 들어올 수 있음 */
    if (section.querySelector('.helix-cert-badges')) return;

    var grid = section.querySelector('.about_grid-3-_mid-align');
    var wrap = document.createElement('div');
    wrap.className = 'helix-cert-badges';

    var built = 0;
    CERTS.forEach(function (cert) {
      var card = section.querySelector(cert.card);
      if (!card) return;
      var mark = card.querySelector(cert.mark);
      if (!mark) return;

      /* 슬러그는 카드 안 "+" 버튼의 실제 href 를 우선 사용 —
         Webflow 에서 페이지 슬러그를 바꿔도 배지가 따라감. */
      var href = cert.slug;
      var plus = card.querySelector('a[href]');
      if (plus) {
        try {
          var u = new URL(plus.href, location.href);
          if (u.origin === location.origin && isDetailPath(u.pathname)) href = u.pathname;
        } catch (_) {}
      }

      var a = document.createElement('a');
      a.className = 'helix-cert-badge';
      a.href = certUrl(keyForPath(href));
      a.setAttribute('aria-label', cert.kr + ' ' + cert.tag + ' 인증 상세 보기');
      /* coming-soon.js 토스트가 가로채지 않도록 면제 표시 (markExempt 와 동일) */
      a.setAttribute('data-coming-soon-exempt', '1');

      var markWrap = document.createElement('span');
      markWrap.className = 'helix-cert-badge__markwrap';

      var markClone = mark.cloneNode(false);
      markClone.classList.add('helix-cert-badge__mark');
      /* 원본에 IX2 등이 박아둔 인라인 크기/투명도는 배지에선 방해만 됨 */
      markClone.removeAttribute('data-w-id');
      markClone.style.removeProperty('opacity');
      markClone.style.removeProperty('width');
      markClone.style.removeProperty('height');
      markWrap.appendChild(markClone);

      var tag = document.createElement('span');
      tag.className = 'helix-cert-badge__tag';
      tag.textContent = cert.tag;

      var kr = document.createElement('span');
      kr.className = 'helix-cert-badge__kr';
      kr.textContent = cert.kr;

      a.appendChild(markWrap);
      a.appendChild(tag);
      a.appendChild(kr);
      wrap.appendChild(a);
      built++;
    });

    if (!built) return;
    if (grid && grid.parentNode) grid.parentNode.insertBefore(wrap, grid.nextSibling);
    else section.appendChild(wrap);
  }

  function markExempt() {
    CERTS.forEach(function (cert) {
      var card = document.querySelector('#cert ' + cert.card);
      var plus = card && card.querySelector('a');
      if (plus) plus.setAttribute('href', certUrl(keyForPath(cert.slug)));
    });
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var key = linkKey(a);
      if (!key) return;
      a.setAttribute('href', certUrl(key));
      a.removeAttribute('target');
      a.setAttribute('data-coming-soon-exempt', '1');
      a.setAttribute('aria-haspopup', 'dialog');
    });
  }
  function isDetailPath(path) { return !!keyForPath(path); }
  function attach() {
    markExempt();
    buildMobileBadges();
    var mo = new MutationObserver(function () { markExempt(); buildMobileBadges(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 5000);
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      var key = a && linkKey(a);
      if (!key) return;
      e.preventDefault();
      e.stopPropagation();
      open(key, false, a);
    }, true);
    document.addEventListener('keydown', function (e) {
      if (!currentKey) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(currentIdx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(currentIdx + 1); }
      else if (e.key === 'Tab') {
        var focusable = Array.prototype.slice.call(overlay.querySelectorAll('button:not(:disabled), [tabindex="0"]'));
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('popstate', function () {
      closingHistory = false;
      var key = routeKey();
      if (key) open(key, true);
      else close(true);
    });
    var key = routeKey();
    if (key) open(key, true);
  }
  // 이전 상세페이지는 삭제 전까지 새 공유 주소로 연결한다. 본문은 읽어오지 않는다.
  var legacy = keyForPath(location.pathname);
  if (legacy) { location.replace(certUrl(legacy)); return; }
  if (location.pathname.replace(/\/$/, '') !== ABOUT_PATH) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();
