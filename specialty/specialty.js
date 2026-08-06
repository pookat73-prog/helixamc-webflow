/* ================================================================
   HELIX AMC — 특화진료(/specialty-care) 코멧 밑줄  v1.0
   specialty/bootstrap.js 가 로드. 짝: specialty/specialty.css

   하는 일
   -----------------------------------------------------------------
   항목(.hst-item-wrap)에 마우스를 올리면, 한글명(.spec-item-name) 바로
   아래 이미 있던 3px 틈으로 파란 선이 지나간다.
     · 머리가 먼저 뻗어나가고 꼬리가 뒤늦게 따라붙는 '코멧' 움직임
     · 머리가 끝에 닿는 순간 선 전체가 한 번 밝게 터지고(is-flash),
       380ms 뒤 은은한 밑줄로 가라앉는다
     · 마우스가 나가면 오른쪽 끝부터 되감기듯 지워진다

   ⚠ 글자는 1px 도 밀리지 않는다
     선은 CSS 에서 `position:absolute` 다. 자리를 차지하지 않고 이미 있던
     틈 위에 떠 있을 뿐이라, 항목 높이·간격·열 배치가 전혀 바뀌지 않는다.
     (사용자 지시: "글자 벌어지는 것 때문에 그러면 그냥 지금 간격에 밑줄을
      잘 낑겨서 한글 항목 아래에 위치해주면 된다")

   ⚠ 이 파일은 '선'만 담당한다
     설명·CTA 의 펼침/접힘은 specialty.css 의 :hover 규칙이 단독으로 한다.
     그래서 이 파일이 CDN 에서 못 와도 글이 안 갇힌다. 여기에 펼침 로직을
     옮기지 말 것.

   ⚠ 클래스 이름 주의 (v1.0 사고 재발 방지)
     항목 상자의 Webflow 클래스는 `HST-Item-Wrap` → 게시되면
     `.hst-item-wrap`. 예전 CSS 가 있지도 않은 `.spec-item-wrap` 을
     붙잡고 있어 PC 에서 설명이 통째로 안 보였다. Designer 에서 이 이름을
     바꾸면 여기와 specialty.css 두 곳을 같이 고쳐야 한다.
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixSpecialtyLineInit) return;
  window.__helixSpecialtyLineInit = true;

  var WRAP  = '.hst-item-wrap';
  var NAME  = '.spec-item-name';
  var LINE  = 'hx-spec-line';

  var DURATION   = 480;   /* 머리가 끝에 닿기까지(ms). CSS 펼침 .32s 와 어울리는 값 */
  var TAIL_LAG   = 170;   /* 꼬리가 머리를 뒤늦게 쫓는 시간차. 클수록 '기어가는' 느낌 */
  var FLASH_HOLD = 380;   /* 발광 유지 후 은은한 밑줄로 가라앉기까지 */
  var ERASE      = 300;   /* 마우스가 나갈 때 되감기는 시간 */

  /* 마우스가 없는 기기(휴대폰·태블릿)는 설명을 처음부터 펼쳐 두므로 선도 안 그린다.
     CSS 의 @media (hover:none) 과 판정을 일치시킨다. */
  function hasHover() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* easeOutCubic — 빠르게 튀어나갔다가 서서히 멈춤 */
  function ease(x) { return 1 - Math.pow(1 - x, 3); }

  /* 한글명의 '글자' 폭. 요소 상자 폭(열 전체)이 아니라 실제 글자가 차지한 폭을
     재야 밑줄이 이름 길이에 맞는다. 두 줄로 넘어가면 가장 넓은 줄 기준. */
  function textWidth(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var rects = range.getClientRects();
    var w = 0;
    for (var i = 0; i < rects.length; i++) w = Math.max(w, rects[i].width);
    range.detach && range.detach();
    if (!w) w = el.getBoundingClientRect().width;
    return Math.min(Math.round(w), Math.round(el.clientWidth) || w);
  }

  /* 꼬리(tail)~머리(head) 구간만 보이도록 clip-path 설정. 0~1 비율. */
  function applyClip(line, tail, head) {
    var left  = Math.max(0, Math.min(1, tail)) * 100;
    var right = (1 - Math.max(0, Math.min(1, head))) * 100;
    line.style.clipPath = 'inset(0 ' + right.toFixed(2) + '% 0 ' + left.toFixed(2) + '%)';
  }

  function setup(wrap) {
    var name = wrap.querySelector(NAME);
    if (!name) return null;

    var line = name.querySelector('.' + LINE);
    if (!line) {
      line = document.createElement('i');
      line.className = LINE;
      line.setAttribute('aria-hidden', 'true');
      name.appendChild(line);
    }

    var item = { wrap: wrap, name: name, line: line, raf: null, flashTimer: null };

    measure(item);
    bind(item);
    return item;
  }

  function measure(item) {
    item.line.style.width = textWidth(item.name) + 'px';
  }

  function stop(item) {
    if (item.raf) { cancelAnimationFrame(item.raf); item.raf = null; }
    clearTimeout(item.flashTimer);
  }

  function settle(item) {
    applyClip(item.line, 0, 1);            /* 선 전체가 보이는 상태로 정착 */
    item.line.classList.add('is-flash');
    item.flashTimer = setTimeout(function () {
      item.line.classList.remove('is-flash');   /* 강한 발광은 가라앉고 은은한 밑줄로 */
    }, FLASH_HOLD);
  }

  function draw(item) {
    stop(item);
    item.line.classList.add('is-on');
    item.line.classList.remove('is-flash');

    if (reducedMotion()) { settle(item); return; }

    applyClip(item.line, 0, 0);
    var start = performance.now();

    function frame(now) {
      var t = now - start;
      var head = ease(Math.min(Math.max(t / DURATION, 0), 1));
      var tail = ease(Math.min(Math.max((t - TAIL_LAG) / DURATION, 0), 1));
      applyClip(item.line, tail, head);

      if (t < DURATION) {
        item.raf = requestAnimationFrame(frame);
      } else {
        item.raf = null;
        settle(item);   /* 머리가 끝에 닿음 → 선 전체가 켜지며 한 번 터짐 */
      }
    }
    item.raf = requestAnimationFrame(frame);
  }

  function erase(item) {
    stop(item);
    item.line.classList.remove('is-flash');

    if (reducedMotion()) {
      item.line.classList.remove('is-on');
      applyClip(item.line, 0, 0);
      return;
    }

    var start = performance.now();

    function frame(now) {
      var t = now - start;
      var p = ease(Math.min(Math.max(t / ERASE, 0), 1));
      applyClip(item.line, 0, 1 - p);   /* 오른쪽 끝부터 되감기 */

      if (t < ERASE) {
        item.raf = requestAnimationFrame(frame);
      } else {
        item.raf = null;
        item.line.classList.remove('is-on');
        applyClip(item.line, 0, 0);
      }
    }
    item.raf = requestAnimationFrame(frame);
  }

  function bind(item) {
    item.wrap.addEventListener('mouseenter', function () { draw(item); });
    item.wrap.addEventListener('mouseleave', function () { erase(item); });
  }

  var items = [];

  function init() {
    if (!hasHover()) return;

    var wraps = document.querySelectorAll(WRAP);
    if (!wraps.length) {
      console.warn('[specialty] ' + WRAP + ' 요소를 못 찾음 — Webflow 에서 클래스 이름이 바뀌었는지 확인');
      return;
    }

    for (var i = 0; i < wraps.length; i++) {
      var it = setup(wraps[i]);
      if (it) items.push(it);
    }

    /* 폰트가 늦게 도착하면 글자 폭이 달라진다 → 도착 후 다시 잰다. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { items.forEach(measure); });
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { items.forEach(measure); }, 150);
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
