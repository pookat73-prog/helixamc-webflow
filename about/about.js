/* ================================================================
   HELIX AMC - ABOUT PAGE JS
   ================================================================ */

(function () {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug-about=1') !== -1;
  function log() { if (DEBUG) console.log.apply(console, ['[About]'].concat(Array.prototype.slice.call(arguments))); }

  var VIDEO_URL = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/about/bg-video.mp4';
  var s1Timeline = null;

  /* ── 섹션 1 헤드/서브헤드 페이드인 ── */
  function initSection1() {
    if (!window.gsap) return;

    var heading    = document.querySelector('.section2-heading');
    var subheading = document.querySelector('.about_contents_sub-title');
    if (!heading && !subheading) { log('섹션 1 헤드 요소를 찾지 못했습니다.'); return; }

    if (heading)    gsap.set(heading,    { opacity: 0 });
    if (subheading) gsap.set(subheading, { opacity: 0 });

    s1Timeline = gsap.timeline({ delay: 0.3 });
    if (heading)    s1Timeline.to(heading,    { opacity: 1, duration: 1, ease: 'power2.out' }, 0);
    if (subheading) s1Timeline.to(subheading, { opacity: 1, duration: 1, ease: 'power2.out' }, 0.3);
    /* 영상 페이드인은 window.load 후 initBgVideo에서 타임라인에 추가 */
  }

  /* ── 섹션 1 배경 영상 ── */
  function initBgVideo() {
    var container = document.querySelector('.about_background');
    if (!container) {
      log('about_background 요소를 찾지 못했습니다.');
      return;
    }

    var video = document.createElement('video');
    video.src         = VIDEO_URL;
    video.autoplay    = true;
    video.muted       = true;
    video.playsInline = true;
    video.loop        = false;
    video.className   = 'about-bg-video';
    container.insertBefore(video, container.firstChild);

    function setVideoSize() {
      var header    = document.querySelector('header') || document.querySelector('.header');
      var subheader = document.querySelector('.subheader') || document.querySelector('.about_contents_sub-title');
      if (!header || !subheader) { log('헤더 또는 서브헤더 요소를 찾지 못했습니다.'); return; }

      var scrollY        = window.scrollY || window.pageYOffset;
      var headerBottom   = header.getBoundingClientRect().bottom + scrollY;
      var subheaderTop   = subheader.getBoundingClientRect().top  + scrollY;
      var containerTop   = container.getBoundingClientRect().top  + scrollY;

      var videoHeight     = subheaderTop - headerBottom;
      var containerHeight = container.getBoundingClientRect().height;

      video.style.bottom = '';
      video.style.height = videoHeight + 'px';
      video.style.top    = (containerHeight - videoHeight) + 'px';
      log('영상 height:', videoHeight, 'top:', video.style.top);
    }

    video.style.opacity = '0';
    window.addEventListener('load', function () {
      setVideoSize();
      /* 섹션 1 타임라인 맨 마지막에 영상 페이드인 추가 */
      if (s1Timeline && window.gsap) {
        s1Timeline.to(video, { opacity: 1, duration: 0.8, ease: 'power2.out' }, '>0.1');
      } else {
        video.style.opacity = '1';
      }
    });
    window.addEventListener('resize', setVideoSize);
  }

  /* ── 섹션 2 애니메이션 ── */
  function initSection2() {
    if (!window.gsap || !window.ScrollTrigger) {
      console.warn('[About] GSAP 또는 ScrollTrigger가 아직 로드되지 않았습니다.');
      return;
    }

    var cards = document.querySelectorAll('.about_contents_3-concept');
    if (!cards.length) { log('섹션 2 카드를 찾지 못했습니다.'); return; }

    log('섹션 2 카드', cards.length, '개 발견');

    cards.forEach(function (card, i) {
      var titleBox   = card.querySelector('.about_contents_3-concept_q');
      var strategy   = card.querySelectorAll('.about_point-number_blue_whrite, .about_point-title_blue_whrite');
      var divider    = card.querySelector('.divider_blue_grad_no-spacing-1');
      var blurCircle = card.querySelector('.blur-circle-efect');
      var contentBox = card.querySelector('.about_three_contents-box');

      /* 카드별 초기 상태 */
      if (titleBox)   gsap.set(titleBox,   { opacity: 0 });
      gsap.set(strategy, { opacity: 0 });
      if (divider)    gsap.set(divider,    { scaleX: 0, transformOrigin: 'left center' });
      if (blurCircle) gsap.set(blurCircle, { opacity: 0 });
      if (contentBox) gsap.set(contentBox, { opacity: 0, y: 24 });

      /* 카드별 독립 ScrollTrigger */
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 75%',
          onEnter: function () { log('카드', i + 1, '트리거'); }
        }
      });

      tl.to(strategy,   { opacity: 1, duration: 1,   ease: 'power2.out' },   0)
        .to(titleBox,   { opacity: 1, duration: 1,   ease: 'power2.out' },   0.3)
        .to(divider,    { scaleX: 1,  duration: 1,   ease: 'power2.inOut' }, 0.6)
        .to(blurCircle, { opacity: 1, duration: 1.2, ease: 'power2.out' },   0.9)
        .to(contentBox, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 1.2);
    });
  }

  /* ── 버튼 글로우 (블루/퍼플) ── */
  function initButtonGlow() {
    var blueButtons   = document.querySelectorAll('.cta_seocho_button, .cta-style');
    var purpleButtons = document.querySelectorAll('.link-block');

    if (!blueButtons.length && !purpleButtons.length) { log('버튼을 찾지 못했습니다.'); return; }
    log('블루버튼', blueButtons.length, '개 / 퍼플버튼', purpleButtons.length, '개 발견');

    function makeGlowObserver(color) {
      var maxGlow = color === 'purple'
        ? '0 0 0.6vw 0.18vw rgba(85,40,170,0.90), 0 0 8.0vw 0.15vw rgba(85,40,170,0.30)'
        : '0 0 0.6vw 0.18vw rgba(0,117,214,0.90), 0 0 8.0vw 0.15vw rgba(0,117,214,0.30)';

      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          obs.unobserve(el);
          el.style.setProperty('box-shadow', maxGlow, 'important');
          setTimeout(function () {
            el.style.removeProperty('box-shadow');
            el.classList.add('is-looping');
          }, 1500);
        });
      }, { threshold: 0.3 });
      return obs;
    }

    var blueObs   = makeGlowObserver('blue');
    var purpleObs = makeGlowObserver('purple');

    blueButtons.forEach(function (el) { blueObs.observe(el); });
    purpleButtons.forEach(function (el) { purpleObs.observe(el); });
  }

  function init() {
    initSection1();
    initBgVideo();
    initSection2();
    window.Webflow = window.Webflow || [];
    window.Webflow.push(function () { setTimeout(initButtonGlow, 100); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
