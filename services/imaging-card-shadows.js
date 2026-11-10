/* HELIX 영상의학과 섹션 2: 카드 그림자 1 → 2 엇박 점등. */
(function () {
  'use strict';
  if (window.__helixImagingCardShadowsInit) return;
  window.__helixImagingCardShadowsInit = true;

  var root = document.documentElement;
  var motionClass = 'hx-di-card-shadow-motion';
  var timers = [];
  var observer;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showStatic() {
    if (observer) observer.disconnect();
    timers.forEach(function (timer) { clearTimeout(timer); });
    root.classList.remove(motionClass);
  }

  function init() {
    /* The head loader opts in before the stylesheet is requested.
       A late module must not hide shadows already revealed by recovery. */
    if (!root.classList.contains(motionClass)) return;
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('#hx-di-principles .div-322 > .div-12')
    );
    if (cards.length !== 2 || reduceMotion.matches || !('IntersectionObserver' in window)) {
      showStatic();
      return;
    }

    var started = false;
    observer = new IntersectionObserver(function (entries) {
      if (started || !entries.some(function (entry) { return entry.isIntersecting; })) return;
      started = true;
      observer.disconnect();
      cards[0].classList.add('hx-di-shadow-lit');
      timers.push(setTimeout(function () {
        cards[1].classList.add('hx-di-shadow-lit');
      }, 180));
    }, {
      root: null,
      rootMargin: '0px 0px -35% 0px',
      threshold: .12
    });
    observer.observe(cards[0]);

    function motionChanged(event) {
      if (event.matches) showStatic();
    }
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionChanged);
    else if (reduceMotion.addListener) reduceMotion.addListener(motionChanged);
    window.__helixImagingCardShadowsReady = true;
  }

  function start() {
    try { init(); }
    catch (error) {
      showStatic();
      console.warn('[imaging-card-shadows] static fallback', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

/* 장비 사진: 섹션 윗변이 화면의 55% 지점까지 들어오면 한 번만 연다. */
(function () {
  'use strict';
  if (window.__helixImagingEquipmentInit) return;
  window.__helixImagingEquipmentInit = true;
  var root = document.documentElement;
  var observer;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showStatic() {
    if (observer) observer.disconnect();
    root.classList.add('hx-di-equipment-static');
  }

  function start() {
    try {
      if (!root.classList.contains('hx-di-card-shadow-motion')) return;
      var sections = document.querySelectorAll('#hx-di-page > section.di_eq');
      if (!sections.length || reduceMotion.matches || !('IntersectionObserver' in window)) {
        showStatic();
        return;
      }
      function observeSections() {
        if (observer) observer.disconnect();
        if (reduceMotion.matches || root.classList.contains('hx-di-equipment-static')) return;
        observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('hx-di-equipment-revealed');
            observer.unobserve(entry.target);
          });
        }, {
          root: null,
          /* IO의 % 여백은 화면 너비 기준이므로 높이로 px를 계산한다. */
          rootMargin: '0px 0px -' + Math.round(window.innerHeight * .45) + 'px 0px',
          threshold: 0
        });
        sections.forEach(function (section) {
          if (!section.classList.contains('hx-di-equipment-revealed')) observer.observe(section);
        });
      }
      observeSections();
      window.addEventListener('resize', observeSections, { passive: true });
      function motionChanged(event) {
        if (event.matches) showStatic();
      }
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionChanged);
      else if (reduceMotion.addListener) reduceMotion.addListener(motionChanged);
    } catch (error) {
      showStatic();
      console.warn('[imaging-equipment] static fallback', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
