/* ================================================================
   HELIX AMC — 내과 섹션 2 헤드라인 하이라이트
   대상: #hx-im-intro 의 기존 About_Mini_Title 한 개
   ================================================================ */

(function () {
  'use strict';

  if (window.__hxImHeadlineHighlightInit) return;
  window.__hxImHeadlineHighlightInit = true;

  var EXPECTED = '정밀한 진단과 숙련된 의료진의 통찰, 그리고 보호자님과의 긴밀한 소통';
  var WORD_PATTERN = /진단|통찰|소통/g;
  var STYLE_ID = 'hx-im-headline-highlight-style';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#hx-im-intro .hx-im-highlight-word {',
      '  position: relative;',
      '  display: inline-block;',
      '  white-space: nowrap;',
      '  background-image: linear-gradient(rgba(0, 117, 214, 0.18), rgba(0, 117, 214, 0.18));',
      '  background-repeat: no-repeat;',
      '  background-position: left center;',
      '  background-size: 0% 0.9em;',
      '  transition: background-size 620ms cubic-bezier(0.4, 0, 0.2, 1);',
      '}',
      '#hx-im-intro .hx-im-highlight-word::after {',
      '  content: "";',
      '  position: absolute;',
      '  z-index: 1;',
      '  left: 0;',
      '  top: 50%;',
      '  width: 2px;',
      '  height: 0.9em;',
      '  border-radius: 1px;',
      '  background: #607d95;',
      '  opacity: 0;',
      '  pointer-events: none;',
      '  transform: translate(-100%, -50%);',
      '  transition: left 620ms cubic-bezier(0.4, 0, 0.2, 1), transform 620ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease;',
      '}',
      '#hx-im-intro .hx-im-highlight-word.is-current::after { opacity: 0.9; }',
      '#hx-im-intro .hx-im-highlight-word.is-moving::after { left: 100%; transform: translate(0, -50%); }',
      '#hx-im-intro .hx-im-highlight-word.is-filled { background-size: 100% 0.9em; }',
      '#hx-im-intro .hx-im-highlight-word.is-dimmed::after { opacity: 0.3; }',
      '@media (prefers-reduced-motion: reduce) {',
      '  #hx-im-intro .hx-im-highlight-word,',
      '  #hx-im-intro .hx-im-highlight-word::after { transition: none; animation: none; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function wrapTargetWords(heading) {
    var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    var words = [];
    nodes.forEach(function (node) {
      var text = node.nodeValue || '';
      var pattern = new RegExp(WORD_PATTERN.source, 'g');
      var match;
      var lastIndex = 0;
      var fragment = document.createDocumentFragment();

      while ((match = pattern.exec(text))) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        var word = document.createElement('span');
        word.className = 'hx-im-highlight-word';
        word.textContent = match[0];
        fragment.appendChild(word);
        words.push(word);
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex === 0) return;
      if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      node.parentNode.replaceChild(fragment, node);
    });

    return words;
  }

  function init() {
    var heading = document.querySelector('#hx-im-intro h2.about_mini_title.for-white-bg');
    if (!heading) return;

    var actual = (heading.textContent || '').replace(/\s+/g, ' ').trim();
    if (actual !== EXPECTED) return;

    var words = wrapTargetWords(heading);
    if (words.length !== 3) return;
    addStyles();

    var played = false;
    var observer = null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function showFinalState() {
      words.forEach(function (word) {
        word.classList.add('is-filled');
      });
      words[2].classList.add('is-current', 'is-moving', 'is-dimmed');
    }

    function play() {
      if (played) return;
      played = true;
      if (observer) observer.disconnect();
      if (reduceMotion.matches) {
        showFinalState();
        return;
      }

      var index = 0;
      function playNext() {
        var word = words[index];
        word.classList.add('is-current');
        window.setTimeout(function () {
            word.classList.add('is-moving', 'is-filled');
          window.setTimeout(function () {
            if (index === words.length - 1) {
              window.setTimeout(function () {
                word.classList.add('is-dimmed');
              }, 180);
              return;
            }
            word.classList.remove('is-current');
            index += 1;
            window.setTimeout(playNext, 180);
          }, 660);
        }, index === 0 ? 280 : 160);
      }
      playNext();
    }

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      play();
    } else {
      observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) play();
      }, { threshold: 0.1, rootMargin: '0px 0px -12% 0px' });
      observer.observe(heading);
    }

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', function (event) {
        if (event.matches) {
          played = true;
          if (observer) observer.disconnect();
          showFinalState();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();