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

      var scrollY       = window.scrollY || window.pageYOffset;
      var containerBottom = container.getBoundingClientRect().bottom + scrollY;

      video.style.top    = '';
      video.style.height = (subheaderTop - headerBottom) + 'px';
      video.style.bottom = (containerBottom - subheaderTop) + 'px';
      log('영상 height:', video.style.height, 'bottom:', video.style.bottom);
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

    var strategy   = '.about_point-number_blue_whrite, .about_point-title_blue_whrite';
    var titleBox   = '.about_contents_3-concept_q';
    var divider    = '.divider_blue_grad_no-spacing-1';
    var blurCircle = '.blur-circle-efect';
    var contentBox = '.about_three_contents-box';

    /* 요소 존재 확인 */
    if (!document.querySelector('.about_point-number_blue_whrite')) {
      log('섹션 2 요소를 찾지 못했습니다. 클래스명을 확인해 주세요.');
      return;
    }

    /* 초기 상태 — 모두 보이지 않게 */
    gsap.set([strategy, titleBox, blurCircle], { opacity: 0 });
    gsap.set(contentBox, { opacity: 0, y: 24 });
    gsap.set(divider, { scaleX: 0, transformOrigin: 'left center' });

    log('섹션 2 초기화 완료');

    /* 스크롤 트리거 타임라인 — 0.3초 간격 엇박자 */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: strategy,
        start: 'top 75%',
        onEnter: function () { log('섹션 2 트리거 발동'); }
      }
    });

    tl.to(strategy,   { opacity: 1, duration: 1,   ease: 'power2.out' },   0)
      .to(titleBox,   { opacity: 1, duration: 1,   ease: 'power2.out' },   0.3)
      .to(divider,    { scaleX: 1,  duration: 1,   ease: 'power2.inOut' }, 0.6)
      .to(blurCircle, { opacity: 1, duration: 1.2, ease: 'power2.out' },   0.9)
      .to(contentBox, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 1.2);
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
