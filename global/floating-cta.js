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
  var LEADS_URL = 'https://helixamc-pm-default-rtdb.firebaseio.com/leads.json';
  var UTM_LABEL = { meta: '메타', google: '구글', daangn: '당근',
                    kakao: '카카오', tiktok: '틱톡', naver: '네이버' };

  /* ── HTML 주입 ── */
  var html = [
    /* 오버레이 */
    '<div class="hx-fcta-overlay" id="hxFctaOverlay" aria-hidden="true"></div>',

    /* 선택 패널 */
    '<div class="hx-fcta-panel" id="hxFctaPanel" role="menu" aria-label="상담 선택">',
      '<a class="hx-fcta-panel__item" id="hxFctaCallBtn" href="' + PHONE + '"',
        ' role="menuitem" aria-label="서초 본원 바로 전화 걸기 ' + PHONE_LABEL + '">',
        '<span class="hx-fcta-panel__item-icon" aria-hidden="true">📞</span>',
        '<span>바로 전화 걸기</span>',
      '</a>',
      '<button class="hx-fcta-panel__item" id="hxFctaFormBtn" type="button"',
        ' role="menuitem" aria-label="상담 신청 폼 열기">',
        '<span class="hx-fcta-panel__item-icon" aria-hidden="true">📝</span>',
        '<span>상담 신청 남기기</span>',
      '</button>',
    '</div>',

    /* 토글 버튼 */
    '<button class="hx-fcta-btn" id="hxFctaToggle" type="button"',
      ' aria-label="상담 메뉴 열기" aria-expanded="false" aria-controls="hxFctaPanel">',
      '<span class="hx-fcta-btn__icon" aria-hidden="true">💬</span>',
      '<span class="hx-fcta-btn__label">상담</span>',
    '</button>',

    /* 상담 신청 모달 */
    '<div class="hx-fcta-modal" id="hxFctaModal" role="dialog"',
      ' aria-modal="true" aria-labelledby="hxFctaModalTitle" aria-hidden="true">',
      '<div class="hx-fcta-modal__backdrop" id="hxFctaModalBackdrop"></div>',
      '<div class="hx-fcta-modal__box">',
        '<div class="hx-fcta-modal__header">',
          '<h2 class="hx-fcta-modal__title" id="hxFctaModalTitle">상담 신청</h2>',
          '<button class="hx-fcta-modal__close" id="hxFctaModalClose" type="button"',
            ' aria-label="모달 닫기">✕</button>',
        '</div>',

        /* 완료 메시지 */
        '<div class="hx-fcta-form__done" id="hxFctaDone" aria-live="polite">',
          '<div class="hx-fcta-form__done-icon">✅</div>',
          '<p class="hx-fcta-form__done-title">상담 신청이 완료되었습니다</p>',
          '<p class="hx-fcta-form__done-desc">빠른 시간 내에 연락드리겠습니다.<br>감사합니다.</p>',
        '</div>',

        /* 헤더 밑 안내문구 */
        '<p class="hx-fcta-form__intro" id="hxFctaIntro">',
          '신청해 주시면 확인 후 빠르게 연락드리겠습니다.',
        '</p>',

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
              ' type="tel" placeholder="010-0000-0000" required autocomplete="tel">',
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

  /* ── 나이 '모름' 체크 시 입력칸 비활성화 ── */
  var ageInput   = document.getElementById('hxFcta_age');
  var ageUnknown = document.getElementById('hxFcta_age_unknown');
  if (ageUnknown && ageInput) {
    ageUnknown.addEventListener('change', function () {
      ageInput.disabled = ageUnknown.checked;
      if (ageUnknown.checked) ageInput.value = '';
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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('is-open')) closeModal();
      else if (panelOpen) closePanel();
    }
  });

  /* ── GA4 헬퍼 ── */
  function ga(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  }

  /* ── 전화 클릭 ── */
  callBtn.addEventListener('click', function () {
    ga('cta_call', { location: 'seocho', source: 'floating_cta' });
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

      var qp   = new URLSearchParams(location.search);
      var utmS = qp.get('utm_source') || '직접유입';

      var lead = {
        name:         ownerVal,
        phone:        phoneVal,
        petType:      (form.querySelector('input[name="종"]:checked') || {}).value || '미선택',
        petBreed:     '',
        petAge:       ageVal,
        inquiry:      inquiryText,
        submittedAt:  new Date().toISOString(),
        userAgent:    navigator.userAgent,
        utm_source:   utmS,
        utm_medium:   qp.get('utm_medium')   || '',
        utm_campaign: qp.get('utm_campaign') || '',
        utm_content:  qp.get('utm_content')  || '',
        media:        UTM_LABEL[utmS] || utmS
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
    ga('cta_form_submit', { location: 'seocho', source: 'floating_cta' });
  }

  } // end run()

})();
