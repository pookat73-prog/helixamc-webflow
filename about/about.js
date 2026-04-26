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
        s1Timeline.to(video, { opacity: 1, duration: 4.5, ease: 'power2.out' }, '>0.1');
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
      if (contentBox) gsap.set(contentBox, { opacity: 0, y: -24 });

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

  /* ── 서브헤더 활성 밑줄 ── */
  function initSubheaderNav() {
    var navItems = document.querySelectorAll('.subheader_click-area');
    if (!navItems.length) { log('서브헤더 메뉴를 찾지 못했습니다.'); return; }
    log('서브헤더 메뉴', navItems.length, '개 발견');

    /* href="#id" 기반으로 섹션 연결 */
    var pairs = [];
    navItems.forEach(function (item) {
      var href = item.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      var section = document.querySelector(href);
      if (section) pairs.push({ nav: item, section: section });
    });

    /* 클릭 → 즉시 활성 */
    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        navItems.forEach(function (n) { n.classList.remove('is-active'); });
        item.classList.add('is-active');
      });
    });

    if (!pairs.length) { log('연결된 섹션을 찾지 못했습니다. 섹션 ID 확인 필요.'); return; }

    /* 스크롤 → 뷰포트 40% 지점 기준으로 현재 섹션 판단 (올릴 때도 작동) */
    function updateActiveNav() {
      var scrollMid = window.scrollY + window.innerHeight * 0.4;
      var activeIndex = 0;
      for (var i = 0; i < pairs.length; i++) {
        var top = pairs[i].section.getBoundingClientRect().top + window.scrollY;
        if (scrollMid >= top) activeIndex = i;
      }
      navItems.forEach(function (n) { n.classList.remove('is-active'); });
      pairs[activeIndex].nav.classList.add('is-active');
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateActiveNav();
        ticking = false;
      });
    }, { passive: true });

    updateActiveNav();
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

  /* ── 섹션 5 페이드인 ── */
  function initSection5() {
    var section   = document.querySelector('.whiteframe_image');
    if (!section) { log('섹션 5(.whiteframe_image)를 찾지 못했습니다.'); return; }

    var dialogues = section.querySelectorAll('.about_dialogue');
    var nameBox   = section.querySelector('.about_contents_box_qqqq');
    if (!dialogues.length && !nameBox) { log('섹션 5 요소를 찾지 못했습니다.'); return; }
    log('섹션 5 초기화 — dialogue', dialogues.length, '개, nameBox:', !!nameBox);

    gsap.set(dialogues, { opacity: 0 });
    if (nameBox) gsap.set(nameBox, { opacity: 0 });

    if (!window.ScrollTrigger) { log('ScrollTrigger 없음, 섹션 5 건너뜀'); return; }

    ScrollTrigger.create({
      trigger: section,
      start: function () {
        var navItem = document.querySelector('.subheader_click-area');
        var subEl = navItem ? (navItem.closest('[class*="subheader"]') || navItem.parentElement) : null;
        if (!subEl) subEl = document.querySelector('.subheader');
        var offset = subEl ? subEl.getBoundingClientRect().bottom : 80;
        return 'top ' + offset + 'px';
      },
      once: true,
      onEnter: function () {
        log('섹션 5 트리거 발사');
        var tl = gsap.timeline({
          onComplete: function () {
            section.dispatchEvent(new CustomEvent('helix-s5-done'));
          }
        });
        dialogues.forEach(function (el, i) {
          tl.to(el, { opacity: 1, duration: 0.9, ease: 'power2.out' }, i * 0.8);
        });
        if (nameBox) tl.to(nameBox, { opacity: 1, duration: 0.8, ease: 'power2.out' }, dialogues.length * 0.8);
      }
    });
  }

  /* ── 섹션 5 라인들 ── */
  function initSection5Lines() {
    var section = document.querySelector('.whiteframe_image');
    if (!section) { log('섹션 5 라인: whiteframe_image 없음'); return; }

    if (window.getComputedStyle(section).position === 'static') {
      section.style.position = 'relative';
    }

    /* 좌표 디버그 오버레이 (?debug-lines=1) */
    if (window.location.search.indexOf('debug-lines=1') !== -1) {
      var label = document.createElement('div');
      label.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#0075d6;font:14px monospace;padding:6px 12px;border-radius:4px;z-index:99999;pointer-events:none;';
      document.body.appendChild(label);
      document.addEventListener('mousemove', function(e) {
        label.textContent = (e.clientX / window.innerWidth * 100).toFixed(1) + 'vw  |  ' + (e.clientY / window.innerHeight * 100).toFixed(1) + 'vh';
      });
    }

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
    section.insertBefore(svg, section.firstChild);

    var line1a = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    var line1b = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    var line2  = document.createElementNS('http://www.w3.org/2000/svg', 'line'); /* 사용자 라인 3 (←) */
    var line3v = document.createElementNS('http://www.w3.org/2000/svg', 'line'); /* 사용자 라인 2 (↓) */
    var line4v = document.createElementNS('http://www.w3.org/2000/svg', 'line'); /* 사용자 라인 4 (↑) */
    [line1a, line1b, line2, line3v, line4v].forEach(function (l) {
      l.setAttribute('stroke', '#0075d6');
      l.setAttribute('stroke-width', '1');
      l.setAttribute('stroke-linecap', 'round');
      svg.appendChild(l);
    });

    /* 길이 저장 (애니메이션용) */
    var L = { a: 0, b: 0, gap: 0, v2: 0, h3: 0, v4: 0 };
    var linesAnimated = false;

    function setHidden(el, len, dir) {
      /* dir: 1 = →↓ (positive dashoffset), -1 = ←↑ (negative dashoffset) */
      el.setAttribute('stroke-dasharray', len);
      el.setAttribute('stroke-dashoffset', dir * len);
    }

    /* el 내 특정 문자의 마지막 등장 위치 rect 반환 */
    function getLastCharRect(el, char) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var last = null, node;
      while ((node = walker.nextNode())) {
        var idx = node.textContent.lastIndexOf(char);
        if (idx !== -1) last = { node: node, idx: idx };
      }
      if (!last) return null;
      var range = document.createRange();
      range.setStart(last.node, last.idx);
      range.setEnd(last.node, last.idx + 1);
      return range.getBoundingClientRect();
    }

    function getCharRect(searchStr) {
      var dialogues = section.querySelectorAll('.about_dialogue');
      for (var i = 0; i < dialogues.length; i++) {
        var walker = document.createTreeWalker(dialogues[i], NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) {
          var idx = node.textContent.indexOf(searchStr);
          if (idx === -1) continue;
          var lastIdx = idx + searchStr.length - 1;
          var range = document.createRange();
          range.setStart(node, lastIdx);
          range.setEnd(node, lastIdx + 1);
          return range.getBoundingClientRect();
        }
      }
      return null;
    }

    function drawLines() {
      var sr  = section.getBoundingClientRect();
      var vw  = window.innerWidth / 100;
      var line1Y = null, line3Y = null;

      /* ── 라인 1 (→): "않는"의 "는" → 뷰포트 우측 17.5vw, 얼굴 구간 건너뜀 ── */
      var FACE_L = 62.2 * vw, FACE_R = 73.7 * vw;
      var cr = getCharRect('않는');
      if (cr) {
        var x1   = cr.right - sr.left + 0.5 * vw;
        line1Y   = cr.top + cr.height / 2 - sr.top;
        var x2   = window.innerWidth - sr.left - 17.5 * vw;
        var gapL = FACE_L - sr.left;
        var gapR = FACE_R - sr.left;
        line1a.setAttribute('x1', x1);   line1a.setAttribute('y1', line1Y);
        line1a.setAttribute('x2', gapL); line1a.setAttribute('y2', line1Y);
        line1b.setAttribute('x1', gapR); line1b.setAttribute('y1', line1Y);
        line1b.setAttribute('x2', x2);   line1b.setAttribute('y2', line1Y);
        L.a = gapL - x1; L.b = x2 - gapR; L.gap = gapR - gapL;
        if (!linesAnimated) { setHidden(line1a, L.a, 1); setHidden(line1b, L.b, 1); }
        log('라인1 y:', line1Y.toFixed(1));
      }

      /* ── 라인 3 (←): "nomal-parag" 마지막 '다' → '립' 바텀 y ── */
      var paragEl = section.querySelector('.nomal-parag');
      if (paragEl) {
        var daRect  = getLastCharRect(paragEl, '다');
        var ripRect = getLastCharRect(paragEl, '립');
        if (daRect && ripRect) {
          var lx1 = daRect.right  - sr.left + 0.5 * vw;
          line3Y  = ripRect.bottom - sr.top - 0.1 * vw;
          var lx2 = window.innerWidth - sr.left - 17.5 * vw;
          line2.setAttribute('x1', lx1); line2.setAttribute('y1', line3Y);
          line2.setAttribute('x2', lx2); line2.setAttribute('y2', line3Y);
          L.h3 = lx2 - lx1;
          if (!linesAnimated) setHidden(line2, L.h3, -1);
          log('라인3 y:', line3Y.toFixed(1));
        }
      }

      /* ── 라인 2 (↓): 라인1·3 사이, 위아래 0.5vw 간격 ── */
      if (line1Y !== null && line3Y !== null) {
        var vx  = window.innerWidth - sr.left - 17.0 * vw;
        var vy1 = line1Y + 0.5 * vw;
        var vy2 = line3Y - 0.5 * vw;
        line3v.setAttribute('x1', vx); line3v.setAttribute('y1', vy1);
        line3v.setAttribute('x2', vx); line3v.setAttribute('y2', vy2);
        L.v2 = vy2 - vy1;
        if (!linesAnimated) setHidden(line3v, L.v2, 1);
        log('라인2 x:', vx.toFixed(1));
      }
    }

    /* ── 라인 4 (↑): '헬' 좌측, viewport 44vh ~ 이미지 top -0.5vw — 스크롤마다 재계산 ── */
    var imgEl4   = section.querySelector('img[src*="69d48bdd4f64fe0069378849"]');
    var helRect4 = null;
    function drawLine4() {
      if (!helRect4) helRect4 = getLastCharRect(section, '헬');
      if (!imgEl4 || !helRect4) return;
      var sr4  = section.getBoundingClientRect();
      var ir4  = imgEl4.getBoundingClientRect();
      var vw4  = window.innerWidth / 100;
      var l4x  = helRect4.left - sr4.left;
      var l4y1 = window.innerHeight * 0.44 - sr4.top;
      var l4y2 = ir4.top - sr4.top - 0.5 * vw4;
      line4v.setAttribute('x1', l4x); line4v.setAttribute('y1', l4y1);
      line4v.setAttribute('x2', l4x); line4v.setAttribute('y2', l4y2);
      L.v4 = l4y2 - l4y1;
      if (linesAnimated) {
        /* 애니메이션 후: 좌표만 추적, 라인 항상 풀 표시 */
        line4v.setAttribute('stroke-dasharray', L.v4);
        line4v.setAttribute('stroke-dashoffset', 0);
      } else {
        setHidden(line4v, L.v4, -1);
      }
    }

    /* ── 애니메이션 시퀀스 (helix-s5-done 이벤트 대기) ── */
    section.addEventListener('helix-s5-done', function () {
      if (!window.gsap || linesAnimated) return;
      linesAnimated = true;

      /* 라인1: 일정 속도(→)로 1a → gap 건너뜀 → 1b */
      var totalL1 = L.a + L.gap + L.b;
      var D1 = 0.9;
      var t1a  = L.a   / totalL1 * D1;
      var tGap = L.gap / totalL1 * D1;
      var t1b  = L.b   / totalL1 * D1;

      var tl = gsap.timeline();
      /* 라인 1 → */
      tl.to(line1a, { attr: { 'stroke-dashoffset': 0 }, duration: t1a,  ease: 'expo.in' },  0);
      tl.to(line1b, { attr: { 'stroke-dashoffset': 0 }, duration: t1b,  ease: 'expo.out' }, t1a + tGap);
      /* 라인 2 ↓ */
      tl.to(line3v, { attr: { 'stroke-dashoffset': 0 }, duration: 0.45, ease: 'expo.inOut' }, '>');
      /* 라인 3 ← */
      tl.to(line2,  { attr: { 'stroke-dashoffset': 0 }, duration: 1.1,  ease: 'expo.inOut' }, '>0.2');
      /* 라인 4 ↑ */
      tl.to(line4v, { attr: { 'stroke-dashoffset': 0 }, duration: 0.65, ease: 'expo.inOut' }, '>');
    });

    window.addEventListener('load',   drawLines);
    window.addEventListener('resize', drawLines);
    window.addEventListener('scroll', drawLine4, { passive: true });
    drawLines();
    drawLine4();
  }

  function init() {
    initSection1();
    initBgVideo();
    initSection2();
    initSubheaderNav();
    initSection5();
    initSection5Lines();
    window.Webflow = window.Webflow || [];
    window.Webflow.push(function () { setTimeout(initButtonGlow, 100); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
