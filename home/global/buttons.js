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

  function startGlow(el) {
    if (!window.gsap) return;

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
      observer.observe(el);
    });
  }

  /* SVICC CTA 클릭 추적: .bt-box-4 (또는 그 안의 a 태그) 클릭 시 GA4 이벤트 */
  function initSviccClickTracking() {
    document.querySelectorAll('.bt-box-4').forEach(function (el) {
      if (el.dataset.helixSviccTrack) return;
      el.dataset.helixSviccTrack = '1';
      el.addEventListener('click', function () {
        try {
          var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
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
    var nodes = document.querySelectorAll('.discover-helix_button');
    if (!nodes.length) nodes = document.querySelectorAll('.bt-box-1');
    nodes.forEach(function (el) {
      if (el.dataset.helixHeroTrack) return;
      el.dataset.helixHeroTrack = '1';
      el.addEventListener('click', function () {
        try {
          var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
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

  /* 홈 "우리 아이가 응급상황인가요?" 섹션 응급증상 CTA 클릭 추적: .bt-box-3
     (응급내원이 필요한 증상 CTA). 글로우는 sections-animations.js 가 통제 —
     여긴 클릭 측정만 별도로 붙임. */
  function initEmergencyCtaClickTracking() {
    document.querySelectorAll('.bt-box-3').forEach(function (el) {
      if (el.dataset.helixEmgTrack) return;
      el.dataset.helixEmgTrack = '1';
      el.addEventListener('click', function () {
        try {
          var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
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
    setTimeout(initEmergencyCtaClickTracking, 100);
  });
})();
