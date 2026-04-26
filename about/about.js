/* ================================================================
   HELIX AMC - ABOUT PAGE JS
   ================================================================ */

(function () {
  'use strict';

  var DEBUG = window.location.search.indexOf('debug-about=1') !== -1;
  function log() { if (DEBUG) console.log.apply(console, ['[About]'].concat(Array.prototype.slice.call(arguments))); }

  var VIDEO_URL = 'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/about/bg-video.mp4';

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

    setVideoSize();
    window.addEventListener('resize', setVideoSize);
  }

  /* ── 섹션 2 애니메이션 ── */
  function initSection2() {
    if (!window.gsap || !window.ScrollTrigger) {
      console.warn('[About] GSAP 또는 ScrollTrigger가 아직 로드되지 않았습니다.');
      return;
    }

    var cards = document.querySelectorAll('.about_contents_3-concept_q');
    if (!cards.length) { log('섹션 2 카드를 찾지 못했습니다.'); return; }

    log('섹션 2 카드', cards.length, '개 발견');

    cards.forEach(function (card, i) {
      var strategy   = card.querySelectorAll('.about_point-number_blue_whrite, .about_point-title_blue_whrite');
      var divider    = card.querySelector('.divider_blue_grad_no-spacing-1');
      var blurCircle = card.querySelector('.blur-circle-efect');
      var contentBox = card.querySelector('.about_three_contents-box');

      /* 카드별 초기 상태 */
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
        .to(divider,    { scaleX: 1,  duration: 1,   ease: 'power2.inOut' }, 0.3)
        .to(blurCircle, { opacity: 1, duration: 1.2, ease: 'power2.out' },   0.6)
        .to(contentBox, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.9);
    });
  }

  function init() {
    initBgVideo();
    initSection2();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
