/* ================================================================
   YEAR-BADGE CARD NAV — .just-box_qqqqqqq

   동작:
   - 카드들을 가로 스크롤 컨테이너에 깔고 scroll-snap 으로 한 장씩 정착
   - 컨테이너 아래 연도 뱃지 한 줄 (중앙정렬)
   - IntersectionObserver 가 화면 중앙에 가장 잘 맞춰진 카드를 감지 → 그 뱃지 active
   - 뱃지 클릭 → 해당 카드로 smooth scrollIntoView
   - 데스크톱: 트랙패드/휠/뱃지 클릭으로 이동
   - 모바일: 터치 스와이프 → scroll-snap 자연 정착

   디버그: ?debug-deck=1
   ================================================================ */

(function () {
  'use strict';

  var DEBUG = /[?&]debug-deck=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    console.log.apply(console, ['[CardNav]'].concat([].slice.call(arguments)));
  }

  var CARD_SELECTOR    = '.just-box_qqqqqqq';
  var SECTION_SELECTOR = '.white-frame_connect';

  var initialized = false;

  function extractYear(card) {
    var t = (card.textContent || '').replace(/\s+/g, ' ');
    var m = t.match(/\b(19\d{2}|20\d{2})\b/);
    return m ? m[1] : null;
  }

  function init() {
    if (initialized) return true;

    var cardsAll = document.querySelectorAll(CARD_SELECTOR);
    log('found', CARD_SELECTOR, cardsAll.length);
    if (cardsAll.length < 2) {
      log('cards < 2, skip');
      return false;
    }

    var firstCard = cardsAll[0];
    var rect = firstCard.getBoundingClientRect();
    var cardW = rect.width;
    var cardH = rect.height;
    if (!cardW || !cardH) {
      log('card size 0, retry later');
      return false;
    }
    log('card size:', cardW + 'x' + cardH);

    var firstGrid = firstCard.parentElement;
    if (!firstGrid) return false;

    /* 첫 섹션 외 나머지 .white-frame_connect 섹션은 숨김 (카드 모음을 한 자리에 통합) */
    var sections = [];
    Array.prototype.forEach.call(cardsAll, function (c) {
      var sec = c.closest(SECTION_SELECTOR);
      if (sec) sections.push(sec);
    });
    if (sections.length === cardsAll.length) {
      sections.forEach(function (sec, i) {
        if (i > 0) {
          sec.style.display = 'none';
          sec.setAttribute('data-deck-hidden', '1');
        }
      });
      log('hidden sibling sections:', sections.length - 1);
    }

    /* viewport(가로 스크롤) > track(가로 flex) 구조 만들고 첫 카드 자리에 삽입 */
    var viewport = document.createElement('div');
    viewport.className = 'helix-card-viewport';

    var track = document.createElement('div');
    track.className = 'helix-card-track';
    viewport.appendChild(track);

    firstGrid.insertBefore(viewport, firstCard);

    var allCards = Array.prototype.slice.call(cardsAll);
    allCards.forEach(function (c) {
      c.style.width  = cardW + 'px';
      c.style.height = cardH + 'px';
      c.classList.add('helix-card-item');
      track.appendChild(c);
    });

    /* 연도 뱃지 네비 */
    var nav = document.createElement('div');
    nav.className = 'helix-year-nav';

    var badges = allCards.map(function (card, i) {
      var year = extractYear(card);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'helix-year-badge';
      b.textContent = year || String(i + 1);
      b.setAttribute('data-index', String(i));
      if (year) b.setAttribute('aria-label', year + '년 카드');
      b.addEventListener('click', function () {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      nav.appendChild(b);
      return b;
    });
    firstGrid.appendChild(nav);
    log('badges:', badges.map(function (b) { return b.textContent; }).join(' '));

    /* track 양쪽 패딩으로 첫/마지막 카드도 중앙 정착 가능하게 */
    function setSidePadding() {
      var vw = viewport.clientWidth;
      var pad = Math.max((vw - cardW) / 2, 0);
      track.style.paddingLeft  = pad + 'px';
      track.style.paddingRight = pad + 'px';
    }
    setSidePadding();

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setSidePadding, 120);
    });

    /* IntersectionObserver — 가장 잘 보이는 카드의 뱃지 active */
    function setActive(idx) {
      badges.forEach(function (b, i) {
        b.classList.toggle('is-active', i === idx);
      });
      allCards.forEach(function (c, i) {
        c.classList.toggle('is-current', i === idx);
      });
    }

    var ratios = new Array(allCards.length).fill(0);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var idx = allCards.indexOf(e.target);
        if (idx < 0) return;
        ratios[idx] = e.intersectionRatio;
      });
      var bestIdx = 0;
      var best = -1;
      for (var i = 0; i < ratios.length; i++) {
        if (ratios[i] > best) { best = ratios[i]; bestIdx = i; }
      }
      setActive(bestIdx);
    }, {
      root: viewport,
      threshold: [0, 0.25, 0.5, 0.6, 0.75, 0.9, 1]
    });

    allCards.forEach(function (c) { io.observe(c); });
    setActive(0);

    initialized = true;
    log('initialized — cards:', allCards.length);
    return true;
  }

  var retrying = false;
  function retry() {
    if (retrying || initialized) return;
    retrying = true;
    var n = 0;
    var iv = setInterval(function () {
      if (init() || ++n >= 30) {
        clearInterval(iv);
        retrying = false;
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retry);
  } else {
    setTimeout(retry, 300);
  }
  window.addEventListener('load', retry);
  window.Webflow = window.Webflow || [];
  window.Webflow.push(retry);
})();
