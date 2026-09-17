/* ================================================================
   GLOBAL BUTTON GLOW ANIMATION
   GSAP tween으로 box-shadow 직접 제어 (인라인 스타일 우선순위 보장)
   Dependencies: GSAP (already loaded via bootstrap)
   ================================================================ */

(function () {
  'use strict';

  function isPurple(el) {
    return el.classList.contains('bt-box-4');
  }

  /* SVICC 버튼 안쪽 링크의 실제 곡률을 글로우 래퍼에 그대로 복사.
     Webflow에서 버튼 곡률이 바뀌어도 box-shadow 귀퉁이가 어긋나지 않게 한다. */
  function syncPurpleRadius(el) {
    if (!isPurple(el)) return;
    var link = el.tagName === 'A' ? el : el.querySelector('a');
    if (!link || link === el) return;

    var radius = window.getComputedStyle(link);
    el.style.borderTopLeftRadius = radius.borderTopLeftRadius;
    el.style.borderTopRightRadius = radius.borderTopRightRadius;
    el.style.borderBottomRightRadius = radius.borderBottomRightRadius;
    el.style.borderBottomLeftRadius = radius.borderBottomLeftRadius;
  }

  function startGlow(el) {
    if (!window.gsap) return;

    syncPurpleRadius(el);

    /* 모바일(≤767px) 은 vw 단위가 너무 작아져 px 분기 —
       buttons.css 의 glowShimmer{Blue,Purple}Mobile 0%/100% 와 동일 값이라
       .is-looping 핸드오프 시 점프 없음. */
    var isMobile = window.innerWidth <= 767;
    var maxGlow;
    if (isPurple(el)) {
      maxGlow = isMobile
        ? '0 0 16px 6px rgba(85,40,170,1)'
        : '0 0 1.05vw 0.5vw rgba(85,40,170,1)';
    } else {
      maxGlow = isMobile
        ? '0 0 12px 4px rgba(0,117,214,1)'
        : '0 0 0.85vw 0.3vw rgba(0,117,214,1)';
    }

    /* Phase 1: 최고밝기 즉시 설정 */
    el.style.setProperty('box-shadow', maxGlow, 'important');

    /* Phase 2: 1.5초 홀드 후 CSS is-looping으로 핸드오프 */
    setTimeout(function () {
      el.style.removeProperty('box-shadow');
      el.classList.add('is-looping');
    }, 1500);
  }

  function initButtonGlow() {
    /* bt-box-1 은 section1.js 가, bt-box-2 는 sections-animations.js 가
       각자 페이드인 + 글로우 시퀀스를 통제하므로 여기서는 bt-box-3/4 만 담당 */
    var targets = document.querySelectorAll('.bt-box-3,.bt-box-4');
    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        if (el.hasAttribute('data-s1-ghost')) return;
        if (el.hasAttribute('data-s1-init'))  return;
        startGlow(el);
      });
    }, { threshold: 0.3 });

    targets.forEach(function (el) {
      if (el.hasAttribute('data-s1-ghost')) return;
      syncPurpleRadius(el);
      observer.observe(el);
    });

    window.addEventListener('resize', function () {
      targets.forEach(syncPurpleRadius);
    }, { passive: true });
  }

  /* SVICC CTA 클릭 추적: .bt-box-4 (또는 그 안의 a 태그) 클릭 시 GA4 이벤트 */
  function initSviccClickTracking() {
    document.querySelectorAll('.bt-box-4').forEach(function (el) {
      if (el.dataset.helixSviccTrack) return;
      el.dataset.helixSviccTrack = '1';
      el.addEventListener('click', function () {
        try {
          var device = window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop');
          var eventName = 'svicc_click_' + device;
          var anchor = el.tagName === 'A' ? el : el.querySelector('a');
          var href = anchor ? anchor.href : '';
          if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, {
              item_type: 'svicc_click',
              device: device,
              value: href,
              transport_type: 'beacon'
            });
          } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
            window.dataLayer.push({
              event: eventName,
              item_type: 'svicc_click',
              device: device,
              value: href
            });
          }
        } catch (err) {}
      });
    });
  }

  /* 히어로 메인 CTA 클릭 추적: .discover-helix_button (없으면 래퍼 .bt-box-1)
     클릭 시 GA4 이벤트. 글로우 로직(LOCKED)과 무관 — 클릭 측정만 별도로 붙임. */
  function initHeroCtaClickTracking() {
    /* 기본 버튼 컴포넌트를 본문에도 재사용하므로 Hero 래퍼 안만 집계. */
    var nodes = document.querySelectorAll('.bt-box-1 .discover-helix_button');
    if (!nodes.length) nodes = document.querySelectorAll('.bt-box-1');
    nodes.forEach(function (el) {
      if (el.dataset.helixHeroTrack) return;
      el.dataset.helixHeroTrack = '1';
      el.addEventListener('click', function () {
        try {
          var device = window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop');
          var eventName = 'hero_cta_click_' + device;
          var anchor = el.tagName === 'A' ? el : el.querySelector('a');
          var href = anchor ? anchor.href : '';
          var label = (el.innerText || '').trim().slice(0, 40);
          if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, {
              item_type: 'hero_cta_click',
              device: device,
              label: label,
              value: href,
              transport_type: 'beacon'
            });
          } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
            window.dataLayer.push({
              event: eventName,
              item_type: 'hero_cta_click',
              device: device,
              label: label,
              value: href
            });
          }
        } catch (err) {}
      });
    });
  }

  /* 홈 특화진료 CTA 클릭 추적: .bt-box-2 → /specialty-care.
     글로우는 sections-animations.js 가 통제 — 여긴 클릭 측정만 별도로 붙임. */
  function initSpecialtyCtaClickTracking() {
    document.querySelectorAll('.bt-box-2').forEach(function (el) {
      if (el.dataset.helixSpecialtyTrack) return;
      el.dataset.helixSpecialtyTrack = '1';
      el.addEventListener('click', function () {
        try {
          var device = window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop');
          var eventName = 'home_specialty_cta_click_' + device;
          var anchor = el.tagName === 'A' ? el : el.querySelector('a');
          var href = anchor ? anchor.href : '';
          var label = (el.innerText || '').trim().slice(0, 40);
          if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, {
              item_type: 'specialty_cta_click',
              page: 'home',
              device: device,
              label: label,
              value: href,
              transport_type: 'beacon'
            });
          } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
            window.dataLayer.push({
              event: eventName,
              item_type: 'specialty_cta_click',
              page: 'home',
              device: device,
              label: label,
              value: href
            });
          }
        } catch (err) {}
      });
    });
  }

  /* 홈 "우리 아이가 응급상황인가요?" 섹션 응급증상 CTA 클릭 추적: .bt-box-3
     (응급내원이 필요한 증상 CTA). 글로우는 sections-animations.js 가 통제 —
     여긴 클릭 측정만 별도로 붙임. */
  function initEmergencyCtaClickTracking() {
    document.querySelectorAll('.bt-box-3').forEach(function (el) {
      if (el.dataset.helixEmgTrack) return;
      el.dataset.helixEmgTrack = '1';
      el.addEventListener('click', function () {
        try {
          var device = window.HelixVP ? HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop');
          var eventName = 'emergency_symptom_cta_' + device;
          var anchor = el.tagName === 'A' ? el : el.querySelector('a');
          var href = anchor ? anchor.href : '';
          var label = (el.innerText || '').trim().slice(0, 40);
          if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, {
              item_type: 'emergency_symptom_cta',
              device: device,
              label: label,
              value: href,
              transport_type: 'beacon'
            });
          } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
            window.dataLayer.push({
              event: eventName,
              item_type: 'emergency_symptom_cta',
              device: device,
              label: label,
              value: href
            });
          }
        } catch (err) {}
      });
    });
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(function () {
    setTimeout(initButtonGlow, 100);
    setTimeout(initSviccClickTracking, 100);
    setTimeout(initHeroCtaClickTracking, 100);
    setTimeout(initSpecialtyCtaClickTracking, 100);
    setTimeout(initEmergencyCtaClickTracking, 100);
  });
})();

/* Care preparation guide v6 — Webflow-native home entry, staging integration. */
(function () {
  'use strict';

  function initCarePreparationGuide() {
    const section = document.getElementById('care-preparation');
    const openButton = section && section.querySelector('.hx-prep__open');
    if (!openButton || document.getElementById('hx-prep-guide')) return;

    // The entry section stays native to Webflow; only the approved guide is added.
    document.body.insertAdjacentHTML('beforeend', `<dialog class="hx-guide" id="hx-prep-guide" aria-labelledby="hx-guide-title" aria-describedby="hx-guide-intro">
    <div class="hx-guide__mobile-bar"><span>진료 준비 안내</span><button class="hx-guide__close hx-guide__mobile-close" aria-label="진료 준비 안내 닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <header class="hx-guide__header">
      <div class="hx-guide__heading">
        <div><p class="hx-guide__eyebrow">HELIX · 진료 준비 가이드</p><h2 id="hx-guide-title">진료를 이어가기 전,<br class="hx-mobile-only"> 이렇게 준비해 주세요.</h2><p id="hx-guide-intro">다니시던 병원의 진료를 바탕으로, 필요한 검사와 진료를 함께 준비합니다.</p></div>
        <button class="hx-guide__close" aria-label="진료 준비 안내 닫기" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      </div>
      <div class="hx-guide__branch-bar">
        <div class="hx-guide__branch-heading"><p class="hx-guide__branch-label" id="hx-branch-label">방문하실 지점을 선택해 주세요.</p><p class="hx-guide__branch-help">선택한 지점의 연락처와 주차 정보를 안내합니다.</p></div>
        <div class="hx-guide__branch-choice" role="group" aria-labelledby="hx-branch-label"><button type="button" data-branch="seocho" aria-pressed="true">서초 본원</button><button type="button" data-branch="ilsan" aria-pressed="false">일산 분원</button></div>
        <span class="hx-sr-only" id="hx-branch-status" role="status"></span>
      </div>
    </header>
    <div class="hx-guide__scroll">
      <ol class="hx-guide__steps">
        <li class="hx-guide__step">
          <span class="hx-guide__number" aria-hidden="true">01</span>
          <div class="hx-guide__step-body">
            <h3>다니시던 병원에 진료자료를 요청해 주세요.</h3>
            <p class="hx-guide__request-method">기존 병원에 전화하거나 방문해 아래 자료의 발급을 요청해 주세요.</p>
            <ul class="hx-guide__materials"><li>기존 진료기록</li><li>검사결과</li><li>영상자료</li><li>현재 복용약·처방내역</li></ul>
            <p class="hx-guide__original">영상자료는 처음부터 ‘원본 파일’로 요청해 주세요.</p>
            <p class="hx-guide__hint">준비가 어려운 자료는 헬릭스에 전화로 먼저 말씀해 주세요.</p>
          </div>
        </li>
        <li class="hx-guide__step" id="hx-prep-send" tabindex="-1">
          <span class="hx-guide__number" aria-hidden="true">02</span>
          <div class="hx-guide__step-body">
            <h3>방문 전, 전화 문의 후 이메일로 자료를 보내 주세요.</h3>
            <div class="hx-guide__call-line"><h4 class="hx-guide__contact-title">먼저, 전화로 방문 목적을 알려 주세요.</h4><p>다른 병원에서 진료 중인 점과 현재 상태, 헬릭스에서 받고자 하는 검사·진료를 말씀해 주세요.</p><a class="hx-guide__phone" data-branch-phone href="tel:0221359119"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-3 2c1.5 3 3 4.5 6 6l2-3 5 2v4c0 1-1 2-2 2C10 20 4 14 3 5c0-1 1-2 2-2Z"/></svg><span class="hx-guide__phone-caption">전화 문의</span><span data-phone-number>02-2135-9119</span></a></div>
            <div class="hx-guide__send-line">
            <h4 class="hx-guide__contact-title">다음, 이메일로 진료자료를 보내 주세요.</h4>
            <p>전화 안내에 따라 준비한 진료기록과 검사자료를 보내 주세요.</p>
            <div class="hx-guide__email" id="hx-seocho-mail">
              <div class="hx-guide__email-address"><span>자료 보내실 곳 · 서초 본원</span><button type="button" id="hx-copy-email" class="hx-guide__email-copy" aria-label="서초 본원 이메일 주소 복사: schelix@naver.com" title="이메일 주소를 누르면 복사됩니다"><span class="hx-guide__email-value">schelix@naver.com</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h12v13H8zM16 8V3H3v13h5"/></svg></button></div>
              <span class="hx-guide__copy-status" id="hx-copy-status" role="status"></span>
            </div>
            <div class="hx-guide__email hx-guide__email--unconfirmed" id="hx-ilsan-mail" hidden><div><span>일산 분원 자료 전달</span><p>자료를 받을 이메일 주소를 전화로 확인해 주세요.</p></div><a class="hx-guide__text-link" href="tel:0319787575">수신 주소 문의 ↗</a></div>
            </div>
          </div>
        </li>
        <li class="hx-guide__step">
          <span class="hx-guide__number" aria-hidden="true">03</span>
          <div class="hx-guide__step-body">
            <h3>방문 위치와 주차를 확인해 주세요.</h3>
            <div class="hx-guide__location"><div><button type="button" class="hx-guide__address-copy" id="hx-copy-address" title="주소를 누르면 복사됩니다" aria-label="서초 본원 주소 복사: 서울특별시 서초구 신반포로 162, 르본시티 2층"><span id="hx-branch-address">서울특별시 서초구 신반포로 162, 르본시티 2층</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h12v13H8zM16 8V3H3v13h5"/></svg></button><p class="hx-guide__address-status" id="hx-address-copy-status" role="status"></p><p class="hx-guide__parking"><span id="hx-branch-parking">르본시티 옆 지상주차장</span><strong id="hx-branch-parking-benefit">2시간 30분 무료</strong></p><p class="hx-guide__hint" id="hx-branch-parking-note" hidden></p></div><a id="hx-branch-detail" class="hx-guide__text-link" href="/seocho#map" aria-label="서초 본원 주차 안내 자세히 보기">자세히 보기</a></div>
          </div>
        </li>
      </ol>
      <section class="hx-guide__after" aria-labelledby="hx-after-title">
        <h3 id="hx-after-title">내원 후에는</h3>
        <div><p class="hx-guide__after-flow"><span>기존 검사자료 검토</span><span aria-hidden="true">→</span><span>필요한 추가 검사 안내</span><span aria-hidden="true">→</span><span>이후 진료계획 설명</span></p><p class="hx-guide__after-note">필요한 진료 이후에는 다니시던 병원에서 관리를 이어갈 수 있도록 안내합니다.</p></div>
      </section>
    </div>
    <footer class="hx-guide__footer"><p>필요한 안내로 바로 연결해 드립니다.</p><div class="hx-guide__actions"><a class="hx-guide__action hx-guide__action--primary" data-branch-phone href="tel:0221359119"><span data-footer-branch>서초</span> 전화 문의</a><button class="hx-guide__action" data-guide-action="send">자료 전달 방법</button><a class="hx-guide__action hx-guide__action--text" id="hx-branch-page" href="/seocho" aria-label="서초 본원 상세 페이지"><span class="hx-guide__action-label">지점 안내</span><span aria-hidden="true">→</span></a></div></footer>
  </dialog>`);
    const dialog = document.getElementById('hx-prep-guide');
    openButton.setAttribute('aria-haspopup', 'dialog');
    openButton.setAttribute('aria-controls', 'hx-prep-guide');
    const scrollArea = dialog.querySelector('.hx-guide__scroll');
    const guideHeader = dialog.querySelector('.hx-guide__header');
    // Use the shared gtag pipeline: session context and the raw-sheet mirror apply once.
    function guideContext(action, position, extra) {
      const selected = dialog.querySelector('[data-branch][aria-pressed="true"]');
      return Object.assign({
        page: 'home',
        section_key: 'care_preparation',
        item_type: action,
        branch: selected && selected.dataset.branch === 'ilsan' ? '일산' : '서초',
        device: window.HelixVP ? window.HelixVP.device() : (window.innerWidth <= 767 ? 'mobile' : 'desktop'),
        guide_position: position,
        guide_result: 'clicked',
        transport_type: 'beacon'
      }, extra || {});
    }
    function trackGuide(action, params) {
      if (/\.webflow\.io$/i.test(location.hostname) || window.__helixNoMeasure) return;
      try {
        if (params.conv === 1) {
          window.__helixActed = 1;
          window.__helixActedType = params.conv_type;
        }
        if (typeof window.gtag === 'function') window.gtag('event', 'care_guide_' + action, params);
      } catch (error) { /* Measurement must not interrupt the guide. */ }
    }
    // Capture before the shared tel handler stops bubbling. Its existing phone
    // event remains the conversion; this event records only the guide click position.
    dialog.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click', () => {
      const position = link.closest('.hx-guide__footer') ? 'footer_phone' :
        (link.closest('#hx-ilsan-mail') ? 'step_02_recipient' : 'step_02_phone');
      trackGuide('phone_click', guideContext('phone_click', position, {
        value: link.getAttribute('href'), conv: 0
      }));
    }, true));
    [document.getElementById('hx-branch-detail'), document.getElementById('hx-branch-page')].forEach(link => {
      link.addEventListener('click', () => {
        const action = link.id === 'hx-branch-detail' ? 'parking_click' : 'branch_click';
        trackGuide(action, guideContext(action, action === 'parking_click' ? 'step_03_parking' : 'footer_branch', {
          value: link.getAttribute('href')
        }));
      });
    });
    const mobileGuide = window.matchMedia('(max-width:767px), (max-width:1024px) and (max-height:600px)');
    function placeGuideHeader() {
      if (mobileGuide.matches) scrollArea.prepend(guideHeader);
      else dialog.insertBefore(guideHeader, scrollArea);
    }
    placeGuideHeader();
    mobileGuide.addEventListener('change', placeGuideHeader);
    let savedScroll = 0;
    let oldOverflow = '';
    function openGuide(event) {
      if (event) event.preventDefault();
      if (dialog.open) return;
      resetCopy();
      savedScroll = window.scrollY;
      oldOverflow = document.documentElement.style.overflowY;
      document.documentElement.style.overflowY = 'hidden';
      dialog.showModal();
      scrollArea.scrollTop = 0;
      const closeButton = [...dialog.querySelectorAll('.hx-guide__close')].find(el => el.getClientRects().length);
      closeButton?.focus({preventScroll:true});
      trackGuide('open', guideContext('open', 'home_section', {value: '진료 준비 안내 보기', guide_result: 'opened'}));
    }
    let closePosition = 'dialog';
    function closeGuide(position) { closePosition = position; dialog.close(); }
    openButton.addEventListener('click', openGuide);
    dialog.querySelectorAll('.hx-guide__close').forEach(button => button.addEventListener('click', () => {
      closeGuide(button.classList.contains('hx-guide__mobile-close') ? 'mobile_close' : 'header_close');
    }));
    dialog.addEventListener('cancel', () => { closePosition = 'escape'; });
    dialog.addEventListener('close', () => {
      trackGuide('close', guideContext('close', closePosition, {value: closePosition, guide_result: 'closed'}));
      closePosition = 'dialog';
      document.documentElement.style.overflowY = oldOverflow;
      window.scrollTo(0, savedScroll);
      openButton.focus({preventScroll:true});
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeGuide('backdrop');
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll('button,a[href],[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.querySelectorAll('[data-guide-action]').forEach(button => button.addEventListener('click', () => {
      const target = document.getElementById('hx-prep-send');
      target.scrollIntoView({behavior:'instant',block:'start'});
      target.focus({preventScroll:true});
      trackGuide('send_click', guideContext('send_click', 'footer_send', {value: '#hx-prep-send'}));
    }));
    const copyButton = document.getElementById('hx-copy-email');
    const copyStatus = document.getElementById('hx-copy-status');
    const addressCopyButton = document.getElementById('hx-copy-address');
    const addressCopyStatus = document.getElementById('hx-address-copy-status');
    const addressText = document.getElementById('hx-branch-address');
    function resetCopy() {
      copyButton.classList.remove('is-copied');
      copyStatus.textContent = '';
      addressCopyButton.classList.remove('is-copied');
      addressCopyStatus.textContent = '';
    }
    copyButton.addEventListener('click', async () => {
      const params = guideContext('email_copy', 'step_02_email', {value: 'schelix@naver.com'});
      try {
        await navigator.clipboard.writeText('schelix@naver.com');
        copyButton.classList.add('is-copied');
        copyStatus.textContent = '이메일 주소를 복사했습니다.';
        params.guide_result = 'success';
        params.conv = 1;
        params.conv_type = 'copy';
      } catch {
        copyStatus.textContent = '주소를 직접 선택해 복사해 주세요.';
        params.guide_result = 'failed';
        params.conv = 0;
      }
      trackGuide('email_copy', params);
    });
    addressCopyButton.addEventListener('click', async () => {
      const params = guideContext('address_copy', 'step_03_address', {value: addressText.textContent.trim()});
      try {
        await navigator.clipboard.writeText(params.value);
        addressCopyButton.classList.add('is-copied');
        addressCopyStatus.textContent = '주소를 복사했습니다.';
        params.guide_result = 'success';
        params.conv = 1;
        params.conv_type = 'copy';
      } catch {
        addressCopyStatus.textContent = '주소를 직접 선택해 복사해 주세요.';
        params.guide_result = 'failed';
        params.conv = 0;
      }
      trackGuide('address_copy', params);
    });
    // Only verified public contact values are included. No unconfirmed Kakao link.
    const branches = {
      seocho: {name:'서초 본원',short:'서초',phone:'02-2135-9119',tel:'0221359119',address:'서울특별시 서초구 신반포로 162, 르본시티 2층',parking:'르본시티 옆 지상주차장',parkingBenefit:'2시간 30분 무료',parkingNote:'',url:'/seocho#map'},
      ilsan: {name:'일산 분원',short:'일산',phone:'031-978-7575',tel:'0319787575',address:'경기도 고양시 덕양구 중앙로 439',parking:'건물 지하주차장',parkingBenefit:'무료 이용',parkingNote:'만차 시 건너편 서정마을 1·2공영주차장 이용 · 내원 시간 기준 주차비 전액 지원',url:'/ilsan#map'}
    };
    dialog.querySelectorAll('[data-branch]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.branch;
      const branch = branches[key];
      const wasSelected = button.getAttribute('aria-pressed') === 'true';
      dialog.querySelectorAll('[data-branch]').forEach(el => el.setAttribute('aria-pressed',String(el === button)));
      dialog.querySelectorAll('[data-branch-phone]').forEach(el => {
        el.href = 'tel:' + branch.tel;
        el.setAttribute('aria-label',branch.name + ' 전화 문의 ' + branch.phone);
      });
      dialog.querySelector('[data-phone-number]').textContent = branch.phone;
      dialog.querySelector('[data-footer-branch]').textContent = branch.short;
      document.getElementById('hx-seocho-mail').hidden = key !== 'seocho';
      document.getElementById('hx-ilsan-mail').hidden = key !== 'ilsan';
      document.getElementById('hx-branch-address').textContent = branch.address;
      addressCopyButton.setAttribute('aria-label',branch.name + ' 주소 복사: ' + branch.address);
      document.getElementById('hx-branch-parking').textContent = branch.parking;
      document.getElementById('hx-branch-parking-benefit').textContent = branch.parkingBenefit;
      document.getElementById('hx-branch-parking-note').textContent = branch.parkingNote;
      document.getElementById('hx-branch-parking-note').hidden = !branch.parkingNote;
      const detail = document.getElementById('hx-branch-detail');
      detail.href = branch.url;
      detail.setAttribute('aria-label',branch.name + ' 주차 안내 자세히 보기');
      const branchPage = document.getElementById('hx-branch-page');
      branchPage.href = branch.url.split('#')[0];
      branchPage.setAttribute('aria-label',branch.name + ' 상세 페이지');
      document.getElementById('hx-branch-status').textContent = branch.name + '의 연락처와 위치 안내로 변경했습니다.';
      resetCopy();
      trackGuide('branch_select', guideContext('branch_select', 'branch_selector', {
        value: key, guide_result: wasSelected ? 'unchanged' : 'changed'
      }));
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarePreparationGuide, { once: true });
  } else {
    initCarePreparationGuide();
  }
})();
