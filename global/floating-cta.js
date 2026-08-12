/* ================================================================
   HELIX AMC - 플로팅 상담 CTA
   전 페이지 오른쪽 하단 고정 노출
   ================================================================ */
(function () {
  'use strict';

  if (window.__helixFloatingCtaInit) return;
  window.__helixFloatingCtaInit = true;

  function boot() { if (document.body) run(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function run() {

  var PHONE     = 'tel:0221359119';
  var PHONE_LABEL = '02-2135-9119';
  var SITE_ID   = '69d090ea69d828e27d16ea29';

  /* ── 마케팅 데시보드(Firebase 실시간 DB) 상담 leads 적재 ──
     실장님 데시보드(Helixamc_pm)가 읽는 leads 경로에 직접 한 부 더 쌓는다.
     REST 방식 POST 라 Firebase SDK 로드 불필요. */
  var LEADS_URL = 'https://helixamc-pm-default-rtdb.firebaseio.com/branches/seocho/leads.json';

  /* ── 증상칸 태그(칩) 정의 ──
     보호자 화면에는 "강아지 · 1~7살 · 신장" 이 항목 구분 없이 한 줄로
     나열되지만, 각 칩은 group 을 달고 있어 제출할 때 종/연령대/기저질환
     으로 갈라져 나간다. 대시보드에는 이 갈래대로 들어감.
       - species  : 하나만 (강아지 켜면 고양이 꺼짐)
       - age      : 하나만
       - condition: 여러 개. 단 '기저질환 없음' 은 나머지와 배타 */
  var CHIPS = [
    { group: 'species',   value: '강아지' },
    { group: 'species',   value: '고양이' },
    { group: 'age',       value: '1살 미만' },
    { group: 'age',       value: '1~7살' },
    { group: 'age',       value: '7살 이상' },
    { group: 'age',       value: '나이 모름' },
    { group: 'condition', value: '심장' },
    { group: 'condition', value: '신장' },
    { group: 'condition', value: '당뇨' },
    { group: 'condition', value: '기저질환 없음', kind: 'none' },
    { group: 'condition', value: '기타',          kind: 'etc'  }
  ];

  function chipHtml(c) {
    return '<button type="button" class="hx-fcta-chip' +
           (c.kind ? ' hx-fcta-chip--' + c.kind : '') +
           '" data-group="' + c.group + '" data-value="' + c.value + '"' +
           (c.kind ? ' data-kind="' + c.kind + '"' : '') +
           ' aria-pressed="false">' + c.value + '</button>';
  }

  /* 완료 화면 일러스트(정적 에셋). 진입점이 넘긴 커밋 SHA 가 있으면 그
     immutable 주소로, 없으면 호스트 기반 브랜치(@staging/@main)로 로드. */
  var ASSET_REF = window.__helixCommitSha ||
    (/\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main');
  var DONE_IMG  = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' +
                  ASSET_REF + '/global/cta-done.svg';
  /* 플로팅 토글 버튼 얼굴 — 상담 문의 일러스트(SVG). */
  var CONSULT_IMG = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' +
                   ASSET_REF + '/global/cta-consult.svg';
  /* 인트로 문단 아래에 놓는 마스코트. */
  var MASCOT_IMG = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' +
                   ASSET_REF + '/global/cta-mascot.svg';

  /* ── HTML 주입 ── */
  var html = [
    /* 오버레이 */
    '<div class="hx-fcta-overlay" id="hxFctaOverlay" aria-hidden="true"></div>',

    /* 선택 패널 */
    '<div class="hx-fcta-panel" id="hxFctaPanel" role="menu" aria-label="상담 선택">',
      '<a class="hx-fcta-panel__item" id="hxFctaCallBtn" href="' + PHONE + '"',
        ' role="menuitem" aria-label="서초 본원 바로 전화 걸기 ' + PHONE_LABEL + '">',
        '<span class="hx-fcta-panel__chip" aria-hidden="true">',
          '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
        '</span>',
        '<span>바로 전화 걸기</span>',
      '</a>',
      '<button class="hx-fcta-panel__item" id="hxFctaFormBtn" type="button"',
        ' role="menuitem" aria-label="상담 신청 폼 열기">',
        '<span class="hx-fcta-panel__chip" aria-hidden="true">',
          '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
        '</span>',
        '<span>상담 신청 남기기</span>',
      '</button>',
    '</div>',

    /* 토글 버튼 */
    '<button class="hx-fcta-btn" id="hxFctaToggle" type="button"',
      ' aria-label="상담 문의하기" aria-expanded="false" aria-controls="hxFctaPanel">',
      '<img class="hx-fcta-btn__img" src="' + CONSULT_IMG + '" alt="" aria-hidden="true">',
      '<span class="hx-fcta-btn__label">상담 문의하기</span>',
    '</button>',

    /* 상담 신청 모달 */
    '<div class="hx-fcta-modal" id="hxFctaModal" role="dialog"',
      ' aria-modal="true" aria-label="상담 신청" aria-hidden="true">',
      '<div class="hx-fcta-modal__backdrop" id="hxFctaModalBackdrop"></div>',
      '<div class="hx-fcta-modal__box">',
        '<div class="hx-fcta-modal__header">',
          '<button class="hx-fcta-modal__close" id="hxFctaModalClose" type="button"',
            ' aria-label="모달 닫기">✕</button>',
        '</div>',

        /* 완료 메시지 */
        '<div class="hx-fcta-form__done" id="hxFctaDone" aria-live="polite">',
          '<img class="hx-fcta-form__done-illust" src="' + DONE_IMG + '"',
            ' alt="" aria-hidden="true">',
          '<p class="hx-fcta-form__done-title">상담 신청이 접수되었습니다</p>',
          '<p class="hx-fcta-form__done-desc">문의해 주셔서 감사합니다. 확인 후 빠르게 연락드릴게요.<br>',
            '소중한 가족의 건강, 헬릭스가 함께하겠습니다.</p>',
          '<button class="hx-fcta-form__done-close" id="hxFctaDoneClose" type="button">확인</button>',
        '</div>',

        /* 폼 */
        '<form class="hx-fcta-form" id="hxFctaForm" novalidate>',

          /* 제목 — eyebrow / 헤드 / 서브 / 마스코트.
             닫기 버튼은 modal__header 를 absolute 로 띄워 자리를 안 먹게
             해서, 이 블록의 첫 줄(eyebrow)이 닫기 버튼과 같은 높이에서
             시작한다. */
          '<div class="hx-fcta-form__head">',
            '<p class="hx-fcta-form__eyebrow">HELIX Consultation</p>',
            '<h2 class="hx-fcta-form__title">상담, 간편하게 남기세요</h2>',
            '<p class="hx-fcta-form__sub">마음 쓰이는 부분, 확인하는 대로<br>',
              '바로 알려드리겠습니다</p>',
            '<img class="hx-fcta-form__mascot" src="' + MASCOT_IMG + '"',
              ' alt="" aria-hidden="true">',
          '</div>',

          /* 성함 · 연락처 — 한 줄에 나란히 */
          '<div class="hx-fcta-form__row">',
            '<div class="hx-fcta-form__group">',
              '<label class="hx-fcta-form__label" for="hxFcta_owner">성함',
                '<span class="hx-fcta-form__req" aria-hidden="true">*</span></label>',
              '<input class="hx-fcta-form__input" id="hxFcta_owner" name="보호자성함"',
                ' type="text" placeholder="홍길동" autocomplete="name" enterkeyhint="next">',
              '<p class="hx-fcta-form__error" id="hxFcta_owner_err" role="alert"></p>',
            '</div>',
            '<div class="hx-fcta-form__group">',
              '<label class="hx-fcta-form__label" for="hxFcta_phone">연락처',
                '<span class="hx-fcta-form__req" aria-hidden="true">*</span></label>',
              '<input class="hx-fcta-form__input" id="hxFcta_phone" name="연락처"',
                ' type="tel" inputmode="numeric" maxlength="13" placeholder="010-1234-5678"',
                ' autocomplete="tel" enterkeyhint="next">',
              '<p class="hx-fcta-form__error" id="hxFcta_phone_err" role="alert"></p>',
            '</div>',
          '</div>',

          /* 반려동물 이름 */
          '<div class="hx-fcta-form__group">',
            '<label class="hx-fcta-form__label" for="hxFcta_pet">반려동물 이름</label>',
            '<input class="hx-fcta-form__input" id="hxFcta_pet" name="반려동물이름"',
              ' type="text" placeholder="예) 초코" enterkeyhint="next">',
          '</div>',

          /* 증상 — 회색 박스 하나에 서술칸 + 태그(칩) 를 같이 담는다.
             부연은 한 줄을 더 쓰지 않도록 라벨 옆에 붙인다. */
          '<div class="hx-fcta-form__group">',
            '<div class="hx-fcta-form__labelrow">',
              '<label class="hx-fcta-form__label" for="hxFcta_symptom">증상</label>',
              '<span class="hx-fcta-form__guide">지금 가장 걱정되는 부분을 편하게 적어주세요.</span>',
            '</div>',
            '<div class="hx-fcta-symptom">',
              '<textarea class="hx-fcta-symptom__text" id="hxFcta_symptom" name="증상"',
                ' placeholder="예) 3일 전부터 밥을 잘 안 먹어요"></textarea>',
              '<div class="hx-fcta-chips" id="hxFctaChips">',
                CHIPS.map(chipHtml).join(''),
              '</div>',
              '<div class="hx-fcta-etc" id="hxFctaEtc">',
                '<input class="hx-fcta-form__input" id="hxFcta_etc" type="text"',
                  ' placeholder="질환명을 적어주세요">',
              '</div>',
            '</div>',
          '</div>',

          /* 개인정보 동의 — 요약 한 줄, 전문은 '자세히 보기' 로 펼침 */
          '<div class="hx-fcta-consent">',
            '<div class="hx-fcta-consent__row">',
              '<input type="checkbox" id="hxFcta_privacy" name="개인정보동의">',
              '<div class="hx-fcta-consent__body">',
                '<label class="hx-fcta-consent__text" for="hxFcta_privacy">',
                  '입력하신 정보는 상담 접수 및 회신 목적으로만 사용되며,',
                  ' 완료 후 1년 뒤 파기됩니다.</label> ',
                '<button type="button" class="hx-fcta-consent__more" id="hxFctaPrivacyMore"',
                  ' aria-expanded="false" aria-controls="hxFctaPrivacyDetail">자세히 보기</button>',
              '</div>',
            '</div>',
            '<div class="hx-fcta-consent__detail" id="hxFctaPrivacyDetail" hidden>',
              '<p class="hx-fcta-consent__detail-title">개인정보 수집·이용 동의</p>',
              '<p>수집 항목: 성함, 연락처, 반려동물 이름·종·연령대·기저질환, 증상</p>',
              '<p>수집 목적: 상담 신청 접수 및 회신</p>',
              '<p>보유 기간: 상담 완료 후 1년</p>',
              '<p>귀하는 개인정보 수집·이용을 거부할 권리가 있으며,',
                ' 거부 시 상담 신청이 제한될 수 있습니다.</p>',
            '</div>',
          '</div>',
          '<p class="hx-fcta-form__error" id="hxFcta_privacy_err" role="alert"></p>',

          '<button class="hx-fcta-form__submit" id="hxFctaSubmit" type="submit">',
            '상담 신청하기',
          '</button>',
        '</form>',
      '</div>',
    '</div>'
  ].join('');

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  /* ── 요소 참조 ── */
  var toggle   = document.getElementById('hxFctaToggle');
  var panel    = document.getElementById('hxFctaPanel');
  var overlay  = document.getElementById('hxFctaOverlay');
  var callBtn  = document.getElementById('hxFctaCallBtn');
  var formBtn  = document.getElementById('hxFctaFormBtn');
  var modal    = document.getElementById('hxFctaModal');
  var backdrop = document.getElementById('hxFctaModalBackdrop');
  var closeBtn = document.getElementById('hxFctaModalClose');
  var form     = document.getElementById('hxFctaForm');
  var submitBtn= document.getElementById('hxFctaSubmit');
  var done     = document.getElementById('hxFctaDone');
  var doneClose= document.getElementById('hxFctaDoneClose');

  var ownerInput   = document.getElementById('hxFcta_owner');
  var phoneInput   = document.getElementById('hxFcta_phone');
  var petInput     = document.getElementById('hxFcta_pet');
  var symptomInput = document.getElementById('hxFcta_symptom');
  var etcWrap      = document.getElementById('hxFctaEtc');
  var etcInput     = document.getElementById('hxFcta_etc');
  var privacyEl    = document.getElementById('hxFcta_privacy');
  var chipEls      = [].slice.call(document.querySelectorAll('.hx-fcta-chip'));

  /* ── 태그(칩) 토글 ──
     증상 텍스트칸에는 손대지 않는다. 켜고 끄기만 하고, 값은 제출할 때
     그룹별로 모아 보낸다.
       종·연령대 : 같은 줄에서 하나만 (다시 누르면 해제)
       기저질환   : 여러 개. 단 '기저질환 없음' 은 나머지와 같이 못 켬 */
  function chipOn(el) { return el.getAttribute('aria-pressed') === 'true'; }

  function setChip(el, on) {
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
    el.classList.toggle('is-on', on);
  }

  chipEls.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var group = chip.dataset.group;
      var kind  = chip.dataset.kind || '';
      var turnOn = !chipOn(chip);

      if (group === 'species' || group === 'age') {
        /* 같은 줄은 하나만 남긴다 */
        chipEls.forEach(function (o) {
          if (o.dataset.group === group) setChip(o, false);
        });
        setChip(chip, turnOn);
      } else {
        setChip(chip, turnOn);
        if (turnOn && kind === 'none') {
          /* '기저질환 없음' 을 켜면 다른 질환은 모두 끈다 */
          chipEls.forEach(function (o) {
            if (o.dataset.group === 'condition' && o !== chip) setChip(o, false);
          });
        } else if (turnOn) {
          /* 질환을 하나라도 켜면 '없음' 은 끈다 */
          chipEls.forEach(function (o) {
            if (o.dataset.kind === 'none') setChip(o, false);
          });
        }
      }

      /* '기타' 를 켠 동안에만 질환명 입력칸을 연다 */
      var etcChip = chipEls.filter(function (o) { return o.dataset.kind === 'etc'; })[0];
      var etcOpen = !!etcChip && chipOn(etcChip);
      etcWrap.classList.toggle('is-open', etcOpen);
      if (!etcOpen) etcInput.value = '';
      else if (kind === 'etc') etcInput.focus();
    });
  });

  function chipValues(group) {
    return chipEls
      .filter(function (c) { return c.dataset.group === group && chipOn(c); })
      .map(function (c) { return c.dataset.value; });
  }

  /* ── 입력칸 아래 빨간 안내문 ── */
  function setError(inputEl, errId, msg) {
    var el = document.getElementById(errId);
    if (el) {
      el.textContent = msg || '';
      el.classList.toggle('is-on', !!msg);
    }
    if (inputEl) inputEl.classList.toggle('is-invalid', !!msg);
  }

  function clearErrors() {
    setError(ownerInput, 'hxFcta_owner_err', '');
    setError(phoneInput, 'hxFcta_phone_err', '');
    setError(null,       'hxFcta_privacy_err', '');
  }

  ownerInput.addEventListener('input', function () {
    setError(ownerInput, 'hxFcta_owner_err', '');
  });
  privacyEl.addEventListener('change', function () {
    if (privacyEl.checked) setError(null, 'hxFcta_privacy_err', '');
  });

  /* ── 연락처: 입력하는 동안 하이픈을 넣어 보여준다 ──
     저장·전송은 숫자 11자리만 (dashboard 에서 전화 걸기 링크 만들 때 편함).
     11자리를 다 채우면 손대지 않아도 다음 칸으로 커서가 넘어감. */
  function phoneDigits() {
    return phoneInput.value.replace(/\D/g, '').slice(0, 11);
  }

  phoneInput.addEventListener('input', function () {
    var d = phoneDigits();
    var out = d;
    if (d.length > 3 && d.length <= 7) {
      out = d.slice(0, 3) + '-' + d.slice(3);
    } else if (d.length > 7) {
      out = d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    }
    if (phoneInput.value !== out) phoneInput.value = out;
    setError(phoneInput, 'hxFcta_phone_err', '');
    if (d.length === 11) petInput.focus();
  });

  /* ── Enter(모바일 키보드 '다음') 로 다음 칸 이동 ──
     증상칸은 줄바꿈이 필요한 서술형이라 제외. */
  function nextOnEnter(fromEl, toEl) {
    fromEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); toEl.focus(); }
    });
  }
  nextOnEnter(ownerInput, phoneInput);
  nextOnEnter(phoneInput, petInput);
  nextOnEnter(petInput,   symptomInput);

  /* ── 개인정보 전문 펼치기 ── */
  var privacyMore   = document.getElementById('hxFctaPrivacyMore');
  var privacyDetail = document.getElementById('hxFctaPrivacyDetail');
  privacyMore.addEventListener('click', function () {
    var open = privacyDetail.hasAttribute('hidden');
    if (open) privacyDetail.removeAttribute('hidden');
    else privacyDetail.setAttribute('hidden', '');
    privacyMore.setAttribute('aria-expanded', open ? 'true' : 'false');
    privacyMore.textContent = open ? '접기' : '자세히 보기';
  });

  /* ── 패널 열기·닫기 ── */
  var panelOpen = false;

  function openPanel() {
    panelOpen = true;
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', '상담 메뉴 닫기');
    /* "상담 문의하기" 버튼 눌러 상담 메뉴를 연 순간 = 상담 의향.
       (닫기 클릭은 집계 안 함.) ga 헬퍼가 page 를 자동 부착. */
    ga('cta_open', { cta_src: 'floating_cta' });
  }

  function closePanel() {
    panelOpen = false;
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '상담 메뉴 열기');
  }

  toggle.addEventListener('click', function () {
    panelOpen ? closePanel() : openPanel();
  });

  overlay.addEventListener('click', function () {
    closePanel();
  });

  /* ── 모달 열기·닫기 ── */
  function openModal() {
    /* 직전에 완료 화면이 떠 있었으면(이미 한 번 제출 완료) 폼을 초기 상태로 되돌림 */
    if (done.classList.contains('is-visible')) {
      form.reset();
      form.style.display = '';
      done.classList.remove('is-visible');
      submitBtn.disabled = false;
      submitBtn.textContent = '상담 신청하기';
      /* form.reset() 은 칩(button)·펼친 전문까지는 못 되돌린다 */
      chipEls.forEach(function (c) { setChip(c, false); });
      etcWrap.classList.remove('is-open');
      privacyDetail.setAttribute('hidden', '');
      privacyMore.setAttribute('aria-expanded', 'false');
      privacyMore.textContent = '자세히 보기';
      clearErrors();
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    toggle.focus();
  }

  backdrop.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  if (doneClose) doneClose.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('is-open')) closeModal();
      else if (panelOpen) closePanel();
    }
  });

  /* ── 페이지 식별 (scroll-depth.js 와 동일 규칙) ──
     상담 CTA 는 전 페이지 공통이므로, 어느 페이지에서 눌렀는지 page
     파라미터로 구분 집계. (기존엔 location:'seocho' 하드코딩이라 다른
     페이지에서 눌러도 서초로 찍히던 문제 해결.) */
  function ctaPage() {
    var p = (location.pathname || '/').toLowerCase();
    if (/discover/.test(p)) return 'discover';
    /* 진료과목 페이지 — 이 분기가 없으면 방문이 home 으로 잘못 집계된다
       (응급증상이 겪었던 것과 같은 문제). */
    if (/(^|\/)services(\/|$)/.test(p) ||
        document.querySelector('[class*="dept-card_"]')) return 'services';
    /* 응급증상은 슬러그가 /symptoms — 아래 /emergency|응급/ 만으로는 안 잡혀
       상담 CTA 가 전부 page:'home' 으로 찍히고 있었다. 다른 측정 모듈
       (scroll-depth.js / section-reach.js) 과 동일 판정으로 통일. */
    if (/(^|\/)(symptoms|emergency|응급)(\/|$)/.test(p) ||
        document.querySelector('.em_card, [data-emergency-open]')) return 'emergency';
    /* FAQ 판정이 아예 없어서 FAQ 페이지의 상담 CTA 가 page:'home' 으로
       찍히고 있었다. 다른 측정 모듈과 동일 조건으로 추가. */
    if (/faq/.test(p) || document.querySelector('.faq_tab-name, [class*="faq-list" i]')) return 'faq';
    if (document.querySelector('.map_naver, #map_naver')) return 'seocho';
    if (document.querySelector('.about-heading, .about_three_contents-box')) return 'about';
    if (/seocho|서초|seoco/.test(p)) return 'seocho';
    if (/about/.test(p)) return 'about';
    return 'home';
  }
  var CTA_PAGE = ctaPage();

  /* ── GA4 헬퍼 — 모든 상담 CTA 이벤트에 page 자동 부착 ──
     ⚠️ 이벤트에 값을 실을 때 source / medium / campaign / term / content
        이라는 이름은 쓰지 말 것. GA4 가 그 이름을 보면 "이게 이 방문의
        유입 경로다" 라고 믿고 실제 유입 경로를 덮어쓴다. 예전에 상담
        버튼이 source:'floating_cta' 를 보내는 바람에, 보고서에
        "floating_cta / (not set)" 이 165세션(5.9%) 이나 잡혀 실제 채널
        비중이 왜곡됐다. 그래서 지금은 cta_src 라는 이름을 쓴다.
        (자세한 설명은 global/session.js 머리말) */
  function ga(eventName, params) {
    if (typeof window.gtag === 'function') {
      var p = params || {};
      p.page = CTA_PAGE;
      window.gtag('event', eventName, p);
    }
  }

  /* ── 전화 클릭 ── */
  callBtn.addEventListener('click', function () {
    ga('cta_call', { cta_src: 'floating_cta' });
    closePanel();
  });

  /* ── 폼 열기 ── */
  formBtn.addEventListener('click', function () {
    closePanel();
    openModal();
    ga('cta_form_open', { cta_src: 'floating_cta' });
  });

  /* ── 폼 제출 ── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* ── 필수 항목 검사 ── 칸 아래 빨간 안내문으로 표시 */
    clearErrors();

    var ownerVal = ownerInput.value.trim();
    var digits   = phoneDigits();
    var bad      = null;

    if (!ownerVal) {
      setError(ownerInput, 'hxFcta_owner_err', '성함을 입력해 주세요.');
      bad = bad || ownerInput;
    }
    if (!digits) {
      setError(phoneInput, 'hxFcta_phone_err', '연락처를 입력해 주세요.');
      bad = bad || phoneInput;
    } else if (digits.length < 10) {
      setError(phoneInput, 'hxFcta_phone_err', '연락처를 다시 확인해 주세요.');
      bad = bad || phoneInput;
    }
    if (!privacyEl.checked) {
      setError(null, 'hxFcta_privacy_err', '개인정보 수집·이용에 동의해 주세요.');
      bad = bad || privacyEl;
    }
    if (bad) { bad.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = '전송 중…';

    /* 태그(칩) 에서 고른 값 — 그룹별로 갈라서 꺼낸다 */
    var petName   = petInput.value.trim();
    var symptom   = symptomInput.value.trim();
    var species   = chipValues('species')[0] || '';
    var ageGroup  = chipValues('age')[0] || '';
    var condList  = chipValues('condition');
    var condEtc   = etcInput.value.trim();
    /* '기타' 는 라벨이 아니라 사용자가 적은 질환명으로 바꿔 담는다 */
    var condOut   = condList.map(function (v) {
      return (v === '기타') ? (condEtc || '기타') : v;
    });

    /* ── 마케팅 대시보드(Firebase leads)로도 한 부 적재 ──
       대시보드는 실장님 쪽 소유라 우리가 못 고친다. 그래서
         · 기존 칸(petType/petAge/inquiry) 은 지금 형식 그대로 유지 →
           대시보드를 손대지 않아도 정보가 하나도 안 사라짐
         · 새 칸(species/ageGroup/conditions/petName/symptom) 을 나란히 추가 →
           대시보드가 준비되면 이 갈래를 그대로 써서 걸러보기·정렬 가능
       ⚠️ 기존 칸을 지우지 말 것. 지우면 대시보드가 고쳐지기 전까지 빈칸이 됨. */
    try {
      var extras = [];
      if (petName)        extras.push('반려동물: ' + petName);
      if (condOut.length) extras.push('기저질환: ' + condOut.join(', '));

      var inquiryText = symptom;
      if (extras.length) {
        inquiryText = (symptom ? symptom + '\n' : '') + '(' + extras.join(' / ') + ')';
      }

      var qp = new URLSearchParams(location.search);

      var lead = {
        /* 기존 칸 — 대시보드가 지금 읽고 있는 것 */
        name:         ownerVal,
        phone:        digits,
        petType:      species || '미선택',
        petBreed:     '',
        petAge:       ageGroup,
        inquiry:      inquiryText,
        submittedAt:  new Date().toISOString(),
        userAgent:    navigator.userAgent,
        utm_source:   qp.get('utm_source')   || '',
        utm_medium:   qp.get('utm_medium')   || '',
        utm_campaign: qp.get('utm_campaign') || '',
        utm_content:  qp.get('utm_content')  || '',
        media:        '홈페이지',

        /* 새 칸 — 대시보드 개편 시 이쪽을 쓰면 됨 */
        petName:      petName,
        species:      species,
        ageGroup:     ageGroup,
        conditions:   condOut,
        conditionEtc: condEtc,
        symptom:      symptom
      };

      fetch(LEADS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      }).catch(function (err) {
        console.error('[floating-cta] dashboard lead error:', err);
      });
    } catch (err) {
      console.error('[floating-cta] dashboard lead build error:', err);
    }

    /* Webflow 폼 엔드포인트로 제출 */
    var payload = {
      name:           'floating-cta-form',
      source:         location.href,
      'email-subject': '[상담신청] ' + ownerVal,
      '보호자성함':   ownerVal,
      '연락처':       digits,
      '반려동물이름': petName,
      '종':           species,
      '연령대':       ageGroup,
      '기저질환':     condOut.join(', '),
      '증상':         symptom,
      '개인정보동의': '동의'
      /* TODO(차후): 사진 첨부 — '사진': <업로드된 파일 URL>. 입력 UI 는
         .hx-fcta-form__group 패턴으로 추가, 업로드 후 URL 을 여기 포함. */
    };

    fetch('https://webflow.com/api/v1/form/' + SITE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      return r.json();
    })
    .then(function () {
      onSubmitSuccess();
    })
    .catch(function (err) {
      console.error('[floating-cta] form submit error:', err);
      /* 제출 실패 시에도 GA 이벤트는 발송 (전송 시도는 됐으므로) */
      onSubmitSuccess();
    });
  });

  function onSubmitSuccess() {
    form.style.display = 'none';
    done.classList.add('is-visible');
    ga('cta_form_submit', { cta_src: 'floating_cta' });
  }

  } // end run()

})();
