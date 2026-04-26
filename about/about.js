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
    var container = document.querySelector('.About_Background');
    if (!container) {
      log('About_Background 요소를 찾지 못했습니다.');
      return;
    }

    var video = document.createElement('video');
    video.src        = VIDEO_URL;
    video.autoplay   = true;
    video.muted      = true;
    video.playsInline = true;
    video.loop       = false;
    video.className  = 'about-bg-video';

    container.insertBefore(video, container.firstChild);
    log('배경 영상 삽입 완료');
  }

  /* ── 섹션 2 애니메이션 ── */
  function initSection2() {
    if (!window.gsap || !window.ScrollTrigger) {
      console.warn('[About] GSAP 또는 ScrollTrigger가 아직 로드되지 않았습니다.');
      return;
    }

    var strategy   = '.Concept_QQ';           /* STRATEGY 텍스트        */
    var titleBox   = '.Concept_Q';            /* 우 하단 둥글린 제목 박스  */
    var divider    = '.Divider_Blue_Grad_No'; /* 그라데이션 밑줄          */
    var blurCircle = '.Blur';                 /* 블러 원                 */
    var contentBox = '.About_Three_Contents'; /* 본문 텍스트 박스         */

    /* 요소 존재 확인 */
    if (!document.querySelector(strategy)) {
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
