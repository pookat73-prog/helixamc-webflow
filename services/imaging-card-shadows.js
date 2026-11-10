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

/* 유산 결론: 첫 문장 900ms → 500ms 호흡 → 다음 문장 900ms. */
(function () {
  'use strict';
  if (window.__helixImagingLegacyStatementInit) return;
  window.__helixImagingLegacyStatementInit = true;
  var groups = [], animations = [], observer, played = false, active = false;
  var viewportWidth = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function showAll() {
    if (observer) observer.disconnect();
    groups.forEach(function (group) {
      group.classList.remove('hx-di-legacy-statement-ready');
      group.setAttribute('data-hx-di-statement', 'done');
    });
    animations.forEach(function (animation) { animation.cancel(); });
    animations = [];
    active = false;
  }
  function play(group) {
    if (played || !group.offsetWidth) return;
    played = true; active = true;
    observer.disconnect();
    group.setAttribute('data-hx-di-statement', 'playing');
    var headings = group.querySelectorAll(':scope > h2');
    headings.forEach(function (heading, index) {
      animations.push(heading.animate([
        { opacity: 0, transform: 'scale(.95)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { duration: 900, delay: index * 1400, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' }));
    });
    animations[animations.length - 1].finished.then(showAll).catch(function () {});
  }
  function skipped() {
    if (played) return;
    if (groups.some(function (group) { return group.offsetWidth && group.getBoundingClientRect().bottom <= 0; })) {
      played = true;
      showAll();
    }
  }
  function observe() {
    if (observer) observer.disconnect();
    var width = document.documentElement.clientWidth;
    if (played || reduceMotion.matches) {
      if (active && (reduceMotion.matches || width !== viewportWidth)) showAll();
      viewportWidth = width;
      return;
    }
    viewportWidth = width;
    observer = new IntersectionObserver(function (entries) {
      try {
        entries.forEach(function (entry) { if (entry.isIntersecting) play(entry.target); });
        skipped();
      } catch (error) { played = true; showAll(); }
    }, { rootMargin: '0px 0px -' + Math.round(window.innerHeight * .45) + 'px 0px', threshold: 0 });
    groups.forEach(function (group) { observer.observe(group); });
  }
  function start() {
    try {
      if (reduceMotion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
      groups = Array.prototype.slice.call(document.querySelectorAll(
        '#hx-di-page > .for-di-legacy-desktop .div-340, #hx-di-page > .whiteframe_open.for-m .div-340'
      )).filter(function (group) { return group.querySelectorAll(':scope > h2').length === 2; });
      groups.forEach(function (group) {
        group.classList.add('hx-di-legacy-statement-ready');
        group.setAttribute('data-hx-di-statement', 'ready');
      });
      observe();
      skipped();
      window.addEventListener('resize', observe, { passive: true });
      window.addEventListener('scroll', skipped, { passive: true });
      function motionChanged(event) { if (event.matches) { played = true; showAll(); } }
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionChanged);
      else if (reduceMotion.addListener) reduceMotion.addListener(motionChanged);
      window.__helixImagingLegacyStatementReady = true;
    } catch (error) {
      played = true; showAll();
      console.warn('[imaging-legacy-statement] static fallback', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

/* 유산의 세 문구: 한 줄이 사라진 뒤 400ms 여유, 0→1600→3200ms. */
(function () {
  'use strict';
  if (window.__helixImagingLegacyHighlightInit) return;
  window.__helixImagingLegacyHighlightInit = true;
  var groups = [], observer, active = null, played = false;
  var viewportWidth = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function stop() {
    if (observer) observer.disconnect();
    groups.forEach(function (group) {
      group.classList.remove('hx-di-legacy-playing');
      group.setAttribute('data-hx-di-legacy-highlight', 'done');
    });
    active = null;
  }
  function play(group) {
    if (played || reduceMotion.matches || !group.offsetWidth) return;
    played = true;
    active = group;
    observer.disconnect();
    group.setAttribute('data-hx-di-legacy-highlight', 'playing');
    group.classList.add('hx-di-legacy-playing');
  }
  function observe() {
    if (observer) observer.disconnect();
    var width = document.documentElement.clientWidth;
    if (played || reduceMotion.matches) {
      /* 모바일 주소창에 따른 높이 변화는 재생을 끊지 않는다. */
      if (active && (reduceMotion.matches || width !== viewportWidth)) stop();
      viewportWidth = width;
      return;
    }
    viewportWidth = width;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.target.offsetWidth) play(entry.target);
      });
    }, { rootMargin: '0px 0px -' + Math.round(window.innerHeight * .45) + 'px 0px', threshold: 0 });
    groups.forEach(function (group) { observer.observe(group); });
  }
  function start() {
    try {
      if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
      groups = Array.prototype.slice.call(document.querySelectorAll(
        '#hx-di-page > .for-di-legacy-desktop .div-339, #hx-di-page > .whiteframe_open.for-m .div-339'
      )).filter(function (group) { return group.querySelectorAll(':scope > p').length === 3; });
      groups.forEach(function (group) {
        var paragraphs = group.querySelectorAll(':scope > p');
        paragraphs.forEach(function (paragraph, index) {
          var span = document.createElement('span');
          span.className = 'hx-di-legacy-marker';
          span.style.setProperty('--hx-di-marker-delay', (index * 1600) + 'ms');
          while (paragraph.firstChild) span.appendChild(paragraph.firstChild);
          paragraph.appendChild(span);
        });
        group.setAttribute('data-hx-di-legacy-highlight', 'ready');
        group.addEventListener('animationend', function (event) {
          if (event.animationName === 'hxDiLegacyMarker' && event.target === paragraphs[2].firstElementChild) stop();
        });
      });
      observe();
      window.addEventListener('resize', observe, { passive: true });
      function motionChanged(event) { if (event.matches) { played = true; stop(); } }
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionChanged);
      else if (reduceMotion.addListener) reduceMotion.addListener(motionChanged);
      window.__helixImagingLegacyHighlightReady = true;
    } catch (error) {
      stop();
      console.warn('[imaging-legacy-highlight] static fallback', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

/* 촬영·마취 관리: 각 영역이 충분히 진입하면 파란 선만 독립적으로 그린다. */
(function () {
  'use strict';
  if (window.__helixImagingSafetyLinesInit) return;
  window.__helixImagingSafetyLinesInit = true;
  var root = document.documentElement;
  var observer;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showStatic() {
    if (observer) observer.disconnect();
    root.classList.add('hx-di-safety-lines-static');
  }
  function start() {
    try {
      if (!root.classList.contains('hx-di-card-shadow-motion')) return;
      var blocks = document.querySelectorAll('#hx-di-safety .div-325 > .div-321');
      if (!blocks.length || reduceMotion.matches || !('IntersectionObserver' in window)) {
        showStatic();
        return;
      }
      function observeBlocks() {
        if (observer) observer.disconnect();
        if (reduceMotion.matches || root.classList.contains('hx-di-safety-lines-static')) return;
        observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('hx-di-line-drawn');
            observer.unobserve(entry.target);
          });
        }, {
          root: null,
          rootMargin: '0px 0px -' + Math.round(window.innerHeight * .45) + 'px 0px',
          threshold: 0
        });
        blocks.forEach(function (block) {
          if (!block.classList.contains('hx-di-line-drawn')) observer.observe(block);
        });
      }
      observeBlocks();
      window.addEventListener('resize', observeBlocks, { passive: true });
      function motionChanged(event) { if (event.matches) showStatic(); }
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionChanged);
      else if (reduceMotion.addListener) reduceMotion.addListener(motionChanged);
    } catch (error) {
      showStatic();
      console.warn('[imaging-safety-lines] static fallback', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

/* 판독 프로세스: 1은 고정, 2→3→4→5가 한 번 펼쳐진 뒤 진행선만 스크롤한다. */
(function () {
  'use strict';
  if (window.__helixImagingWorkflowInit) return;
  window.__helixImagingWorkflowInit = true;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stack, rows, line, observer, resizeObserver;
  var started = false, finished = false, disabled = false;
  var animations = [], timers = [], frame = 0;
  var lineTop = 0, lineHeight = 0;

  function clearMotion() {
    animations.forEach(function (animation) { animation.cancel(); });
    timers.forEach(function (timer) { clearTimeout(timer); });
    animations = []; timers = [];
    if (rows) rows.forEach(function (row) {
      row.style.removeProperty('transform');
      row.classList.remove('hx-di-step-stacked');
    });
  }
  function staticFallback() {
    disabled = true;
    if (observer) observer.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
    clearMotion();
    if (rows) rows.forEach(function (row) { row.style.removeProperty('z-index'); });
    if (line) line.remove();
    if (stack) stack.classList.remove('hx-di-workflow-motion');
  }
  function measureLine() {
    var bounds = stack.getBoundingClientRect();
    var first = rows[0].querySelector('.div-319').getBoundingClientRect();
    var last = rows[rows.length - 1].querySelector('.div-319').getBoundingClientRect();
    lineTop = first.top + first.height / 2 - bounds.top;
    lineHeight = last.top + last.height / 2 - bounds.top - lineTop;
    line.style.left = (first.left + first.width / 2 - bounds.left - line.offsetWidth / 2) + 'px';
    line.style.top = lineTop + 'px';
    line.style.height = Math.max(0, lineHeight) + 'px';
  }
  function drawProgress() {
    if (!finished || disabled || lineHeight <= 0) return;
    var start = stack.getBoundingClientRect().top + lineTop;
    var progress = Math.max(0, Math.min(1, (window.innerHeight * .55 - start) / lineHeight));
    line.style.transform = 'scaleY(' + progress + ')';
  }
  function finish() {
    clearMotion();
    finished = true;
    stack.setAttribute('data-hx-di-unfold', 'open');
    measureLine();
    drawProgress();
  }
  function open(animate) {
    if (started || disabled) return;
    started = true;
    if (observer) observer.disconnect();
    stack.setAttribute('data-hx-di-unfold', 'opening');
    if (!animate) { finish(); return; }
    var lastAnimation;
    rows.forEach(function (row, index) {
      if (!index) return;
      var delay = (index - 1) * 90;
      var animation = row.animate([
        { transform: row.style.transform },
        { transform: 'translateY(0px) scaleY(1)' }
      ], { duration: 800, delay: delay, easing: 'cubic-bezier(.76, 0, .18, 1)', fill: 'both' });
      animations.push(animation);
      lastAnimation = animation;
      /* 번호와 본문은 서로 겹치는 구간을 지난 뒤 함께 드러낸다. */
      timers.push(setTimeout(function () { row.classList.remove('hx-di-step-stacked'); }, delay + 600));
    });
    lastAnimation.finished.then(finish).catch(function () {});
  }
  function observeEntry() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) open(true);
    }, { rootMargin: '0px 0px -' + Math.round(window.innerHeight * .45) + 'px 0px', threshold: 0 });
    observer.observe(rows[0]);
  }
  function layout() {
    if (disabled) return;
    if (started) { finish(); return; }
    rows.forEach(function (row) { row.style.removeProperty('transform'); });
    measureLine();
    var top = rows[0].getBoundingClientRect().top;
    rows.forEach(function (row, index) {
      row.style.zIndex = String(rows.length + 1 - index);
      if (!index) return;
      var offset = top - row.getBoundingClientRect().top + index * 10;
      var scale = Math.min(1, rows[0].offsetHeight / row.offsetHeight);
      row.style.transform = 'translateY(' + offset + 'px) scaleY(' + scale + ')';
      row.classList.add('hx-di-step-stacked');
    });
    stack.setAttribute('data-hx-di-unfold', 'stacked');
    observeEntry();
    tick();
  }
  function tick() {
    frame = 0;
    if (disabled) return;
    try {
      var first = rows[0].getBoundingClientRect();
      /* 빠른 스크롤·중간 위치 재방문으로 첫 카드를 건너뛰어도 본문을 복구한다. */
      if (!started && first.top < window.innerHeight * .55) open(first.bottom > 0);
      drawProgress();
    } catch (error) { staticFallback(); }
  }
  function requestTick() {
    if (!frame && !disabled) frame = requestAnimationFrame(tick);
  }
  function start() {
    try {
      stack = document.querySelector('#hx-di-workflow .div-328');
      if (!stack || reduceMotion.matches || !('IntersectionObserver' in window) || !stack.animate) return;
      rows = Array.prototype.slice.call(stack.querySelectorAll(':scope > .di-ref-step'));
      if (rows.length !== 5 || rows.some(function (row) { return !row.querySelector('.div-319'); })) return;
      stack.classList.add('hx-di-workflow-motion');
      line = document.createElement('span');
      line.className = 'hx-di-workflow-line';
      line.setAttribute('aria-hidden', 'true');
      stack.prepend(line);
      layout();
      window.addEventListener('scroll', requestTick, { passive: true });
      window.addEventListener('resize', layout, { passive: true });
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(layout);
        resizeObserver.observe(stack);
      }
      function motionChanged(event) { if (event.matches) staticFallback(); }
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionChanged);
      else if (reduceMotion.addListener) reduceMotion.addListener(motionChanged);
      window.__helixImagingWorkflowReady = true;
    } catch (error) {
      staticFallback();
      console.warn('[imaging-workflow] static fallback', error);
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
