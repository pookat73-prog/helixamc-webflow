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

  /* 완료 화면 일러스트(정적 에셋). 진입점이 넘긴 커밋 SHA 가 있으면 그
     immutable 주소로, 없으면 호스트 기반 브랜치(@staging/@main)로 로드. */
  var ASSET_REF = window.__helixCommitSha ||
    (/\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main');
  var DONE_IMG  = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' +
                  ASSET_REF + '/global/cta-done.svg';
  /* 플로팅 토글 버튼 얼굴 — 상담 문의 일러스트(SVG). */
  var CONSULT_IMG = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@' +
                   ASSET_REF + '/global/cta-consult.svg';

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
          '<div class="hx-fcta-form__group">',
            '<label class="hx-fcta-form__label" for="hxFcta_owner">',
              '보호자님 성함<span aria-hidden="true">*</span></label>',
            '<input class="hx-fcta-form__input" id="hxFcta_owner" name="보호자성함"',
              ' type="text" placeholder="홍길동" required autocomplete="name">',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<label class="hx-fcta-form__label" for="hxFcta_phone">',
              '연락처<span aria-hidden="true">*</span></label>',
            '<input class="hx-fcta-form__input" id="hxFcta_phone" name="연락처"',
              ' type="tel" inputmode="numeric" maxlength="11" placeholder="01012345678"',
              ' required autocomplete="tel">',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<label class="hx-fcta-form__label" for="hxFcta_pet">반려동물 이름</label>',
            '<input class="hx-fcta-form__input" id="hxFcta_pet" name="반려동물이름"',
              ' type="text" placeholder="예) 초코">',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<p class="hx-fcta-form__label" id="hxFcta_species_label">종</p>',
            '<div class="hx-fcta-form__radio-group" role="radiogroup"',
              ' aria-labelledby="hxFcta_species_label">',
              '<label class="hx-fcta-form__radio-label">',
                '<input type="radio" name="종" value="강아지"> 강아지',
              '</label>',
              '<label class="hx-fcta-form__radio-label">',
                '<input type="radio" name="종" value="고양이"> 고양이',
              '</label>',
            '</div>',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<label class="hx-fcta-form__label" for="hxFcta_age">나이</label>',
            '<div class="hx-fcta-form__inline">',
              '<input class="hx-fcta-form__input" id="hxFcta_age" name="나이"',
                ' type="text" placeholder="예) 3살 / 6개월">',
              '<label class="hx-fcta-form__radio-label hx-fcta-form__age-unknown">',
                '<input type="checkbox" id="hxFcta_age_unknown"> 모름',
              '</label>',
            '</div>',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<p class="hx-fcta-form__label" id="hxFcta_sex_label">성별</p>',
            '<div class="hx-fcta-form__radio-group" role="radiogroup"',
              ' aria-labelledby="hxFcta_sex_label">',
              '<label class="hx-fcta-form__radio-label">',
                '<input type="radio" name="성별" value="남"> 남',
              '</label>',
              '<label class="hx-fcta-form__radio-label">',
                '<input type="radio" name="성별" value="여"> 여',
              '</label>',
              '<label class="hx-fcta-form__radio-label">',
                '<input type="radio" name="성별" value="중성화 남"> 중성화 남',
              '</label>',
              '<label class="hx-fcta-form__radio-label">',
                '<input type="radio" name="성별" value="중성화 여"> 중성화 여',
              '</label>',
            '</div>',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<label class="hx-fcta-form__label" for="hxFcta_condition">기저질환</label>',
            '<input class="hx-fcta-form__input" id="hxFcta_condition" name="기저질환"',
              ' type="text" placeholder="없으면 비워두세요">',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<label class="hx-fcta-form__label" for="hxFcta_symptom">증상</label>',
            '<textarea class="hx-fcta-form__textarea" id="hxFcta_symptom" name="증상"',
              ' placeholder="증상을 간단히 적어주세요" rows="3"></textarea>',
          '</div>',
          '<div class="hx-fcta-form__group">',
            '<div class="hx-fcta-form__privacy">',
              '<div class="hx-fcta-form__privacy-text">',
                '개인정보 수집·이용 동의<br><br>',
                '수집 항목: 보호자님 성함, 연락처, 반려동물 이름·종·나이·성별, 기저질환, 증상<br>',
                '수집 목적: 상담 신청 접수 및 회신<br>',
                '보유 기간: 상담 완료 후 1년<br>',
                '귀하는 개인정보 수집·이용을 거부할 권리가 있으며,',
                ' 거부 시 상담 신청이 제한될 수 있습니다.',
              '</div>',
              '<label class="hx-fcta-form__privacy-check">',
                '<input type="checkbox" id="hxFcta_privacy" name="개인정보동의" required>',
                '개인정보 수집·이용에 동의합니다<span aria-hidden="true"> (필수)</span>',
              '</label>',
            '</div>',
          '</div>',
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

  /* ── 나이 '모름' 체크 시 입력칸 비활성화 ── */
  var ageInput   = document.getElementById('hxFcta_age');
  var ageUnknown = document.getElementById('hxFcta_age_unknown');
  if (ageUnknown && ageInput) {
    ageUnknown.addEventListener('change', function () {
      ageInput.disabled = ageUnknown.checked;
      if (ageUnknown.checked) ageInput.value = '';
    });
  }

  /* ── 연락처: 숫자만, 최대 11자리 ── */
  var phoneInput = document.getElementById('hxFcta_phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
      if (phoneInput.value !== digits) phoneInput.value = digits;
    });
  }

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
    ga('cta_open', { source: 'floating_cta' });
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
      if (ageInput) ageInput.disabled = false;
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

  /* ── GA4 헬퍼 — 모든 상담 CTA 이벤트에 page 자동 부착 ── */
  function ga(eventName, params) {
    if (typeof window.gtag === 'function') {
      var p = params || {};
      p.page = CTA_PAGE;
      window.gtag('event', eventName, p);
    }
  }

  /* ── 전화 클릭 ── */
  callBtn.addEventListener('click', function () {
    ga('cta_call', { source: 'floating_cta' });
    closePanel();
  });

  /* ── 폼 열기 ── */
  formBtn.addEventListener('click', function () {
    closePanel();
    openModal();
    ga('cta_form_open', { source: 'floating_cta' });
  });

  /* ── 폼 제출 ── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* 필수 항목 검사 */
    var ownerVal   = document.getElementById('hxFcta_owner').value.trim();
    var phoneVal   = document.getElementById('hxFcta_phone').value.trim();
    var privacyEl  = document.getElementById('hxFcta_privacy');

    if (!ownerVal) {
      alert('보호자 이름을 입력해 주세요.');
      document.getElementById('hxFcta_owner').focus();
      return;
    }
    if (!phoneVal) {
      alert('연락처를 입력해 주세요.');
      document.getElementById('hxFcta_phone').focus();
      return;
    }
    if (!privacyEl.checked) {
      alert('개인정보 수집·이용에 동의해 주세요.');
      privacyEl.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '전송 중…';

    /* ── 마케팅 데시보드(Firebase leads)로도 한 부 적재 ──
       반려동물이름·성별·기저질환은 데시보드에 전용 칸이 없어
       증상(inquiry) 안에 괄호로 묶어 합쳐 넣는다. */
    try {
      var ageVal = document.getElementById('hxFcta_age_unknown').checked
        ? '모름'
        : document.getElementById('hxFcta_age').value.trim();

      var petName = document.getElementById('hxFcta_pet').value.trim();
      var sexVal  = (form.querySelector('input[name="성별"]:checked') || {}).value || '';
      var condVal = document.getElementById('hxFcta_condition').value.trim();
      var symptom = document.getElementById('hxFcta_symptom').value.trim();

      var extras = [];
      if (petName) extras.push('반려동물: ' + petName);
      if (sexVal)  extras.push('성별: ' + sexVal);
      if (condVal) extras.push('기저질환: ' + condVal);

      var inquiryText = symptom;
      if (extras.length) {
        inquiryText = (symptom ? symptom + '\n' : '') + '(' + extras.join(' / ') + ')';
      }

      var qp = new URLSearchParams(location.search);

      var lead = {
        name:         ownerVal,
        phone:        phoneVal,
        petType:      (form.querySelector('input[name="종"]:checked') || {}).value || '미선택',
        petBreed:     '',
        petAge:       ageVal,
        inquiry:      inquiryText,
        submittedAt:  new Date().toISOString(),
        userAgent:    navigator.userAgent,
        utm_source:   qp.get('utm_source')   || '',
        utm_medium:   qp.get('utm_medium')   || '',
        utm_campaign: qp.get('utm_campaign') || '',
        utm_content:  qp.get('utm_content')  || '',
        media:        '홈페이지'
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
      '연락처':       phoneVal,
      '반려동물이름': document.getElementById('hxFcta_pet').value.trim(),
      '종':           (form.querySelector('input[name="종"]:checked') || {}).value || '',
      '나이':         document.getElementById('hxFcta_age_unknown').checked
                        ? '모름'
                        : document.getElementById('hxFcta_age').value.trim(),
      '성별':         (form.querySelector('input[name="성별"]:checked') || {}).value || '',
      '기저질환':     document.getElementById('hxFcta_condition').value.trim(),
      '증상':         document.getElementById('hxFcta_symptom').value.trim(),
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
    ga('cta_form_submit', { source: 'floating_cta' });
  }

  } // end run()

})();
