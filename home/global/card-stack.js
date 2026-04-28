/* ================================================================
   STACKED CARD SWIPE — .white-frame_connect

   동작:
   - .white-frame_connect 카드들을 첫 번째 카드 자리에 사선으로 겹침
   - 드래그(터치/마우스)로 한 장씩 넘기기
   - 임계점 넘기면 카드가 옆으로 날아가고, 맨 뒤로 돌아옴 (무한 루프)
   - 임계점 못 넘기면 원위치로 스냅 백

   스택 시각:
   - top: 0deg / y=0 / scale=1
   - 뒤 카드: -4°, +4°, -4°… 번갈아 / y +8px·+16px… / scale 0.97·0.94…
   - 최대 4장 가시 (나머지는 hidden)

   디버그: ?debug-deck=1
   ================================================================ */

(function () {
  'use strict';

  /* 디버그: 항상 켜둠 (안정화 후 다시 ?debug-deck=1 게이트로 복원) */
  function log() {
    console.log.apply(console, ['[Deck]'].concat([].slice.call(arguments)));
  }

  var CARD_SELECTOR    = '.just-box_qqqqqqq';
  var SECTION_SELECTOR = '.white-frame_connect';      /* 각 카드를 감싸는 섹션 */
  var CARD_CLASS       = CARD_SELECTOR.replace(/^\./, '');
  /* 안전장치: 강제로 진단 모드 켜고 싶을 땐 URL 에 ?deck-dry=1 */
  var DRY_RUN          = /[?&]deck-dry=1/.test(location.search);
  var VISIBLE        = 4;        /* 동시에 보이는 카드 수 */
  var STACK_OFFSET_Y = 8;        /* 카드 간 y 오프셋 (px) — 촘촘하게 */
  var STACK_OFFSET_X = 8;        /* 카드 간 x 오프셋 (px) */
  var STACK_TILT     = 0;        /* 회전 없음 */
  var STACK_SCALE    = 0;        /* 스케일 변화 없음 */
  var FLY_THRESHOLD = 0.25;     /* 카드 너비의 25% 드래그 시 날아감 */
  var FLY_VELOCITY  = 0.45;     /* 또는 px/ms 임계 속도 */
  var FLY_DURATION  = 240;      /* 날아가는 시간 ms — 짧고 단정하게 */
  var SNAP_DURATION = 220;      /* 원위치 시간 ms */

  var initialized = false;

  function init() {
    if (initialized) return true;

    var cardsAll = document.querySelectorAll(CARD_SELECTOR);
    log('found ' + CARD_SELECTOR + ':', cardsAll.length);
    if (cardsAll.length < 2) {
      log('cards < 2, skip — selector may be wrong, or only one card exists');
      return false;
    }

    /* 각 카드의 부모 체인을 출력 (구조 진단) */
    Array.prototype.forEach.call(cardsAll, function (c, i) {
      var chain = [];
      var p = c.parentElement;
      var depth = 0;
      while (p && depth < 5) {
        chain.push(p.tagName + (p.className ? '.' + (p.className||'').split(' ').slice(0,2).join('.') : ''));
        p = p.parentElement;
        depth++;
      }
      log('  card[' + i + '] parents:', chain.join(' → '));
    });

    /* 공통 조상 찾기 — 모든 카드를 포함하는 최소 조상 */
    function findCommonAncestor(els) {
      if (!els.length) return null;
      var ancestors = [];
      var p = els[0];
      while (p) { ancestors.push(p); p = p.parentElement; }
      for (var i = 1; i < els.length; i++) {
        var found = null;
        var q = els[i];
        while (q) {
          if (ancestors.indexOf(q) >= 0) { found = q; break; }
          q = q.parentElement;
        }
        if (!found) return null;
        ancestors = ancestors.slice(ancestors.indexOf(found));
      }
      return ancestors[0];
    }
    var lca = findCommonAncestor(Array.prototype.slice.call(cardsAll));
    log('common ancestor:', lca ? lca.tagName + '.' + (lca.className||'').split(' ').slice(0,2).join('.') : 'NONE');

    /* 각 카드의 섹션 조상 수집 (.white-frame_connect) */
    var sections = [];
    Array.prototype.forEach.call(cardsAll, function (c) {
      var sec = c.closest(SECTION_SELECTOR);
      if (sec) sections.push(sec);
    });
    log('section ancestors found:', sections.length, '/', cardsAll.length);
    if (sections.length !== cardsAll.length) {
      log('⚠️ 카드마다 섹션 조상이 없음, ABORT');
      return true;
    }

    /* 첫 카드 + 사이즈 측정 */
    var firstCard = cardsAll[0];
    var rect = firstCard.getBoundingClientRect();
    var cardW = rect.width;
    var cardH = rect.height;
    log('first card size:', cardW + 'x' + cardH);
    if (!cardW || !cardH) {
      log('card size 0, retry later');
      return false;
    }

    /* 안전장치 */
    if (cardW > window.innerWidth * 0.8) {
      log('⚠️ card width > 80% viewport, ABORT');
      return true;
    }

    /* DRY RUN */
    if (DRY_RUN) {
      log('✅ DRY_RUN — DOM 변경 없음.');
      initialized = true;
      return true;
    }

    var siblings = Array.prototype.slice.call(cardsAll);

    /* deck host 생성: 첫 카드 위치(grid 안)에 삽입 */
    var firstGrid = firstCard.parentElement;  /* .grid2_none-spacing */
    var host = document.createElement('div');
    host.className = 'helix-deck-host';
    host.style.width   = cardW + 'px';
    /* 호스트 높이: 좌하단 카드 (y=maxIdx*OFFSET) + cardH 까지 + x 오프셋 만큼 너비 여유 */
    var maxIdxLocal = Math.min(VISIBLE - 1, siblings.length - 1);
    host.style.height  = (cardH + maxIdxLocal * STACK_OFFSET_Y) + 'px';
    host.style.width   = (cardW + maxIdxLocal * STACK_OFFSET_X) + 'px';
    host.style.margin  = '0 auto';
    host.style.display = 'block';

    firstGrid.insertBefore(host, firstCard);
    siblings.forEach(function (c, i) {
      /* 첫 카드 사이즈로 통일 (width + height) */
      c.style.width  = cardW + 'px';
      c.style.height = cardH + 'px';
      host.appendChild(c);

      /* 카드 배경 진단 — 투명이면 흰색 강제 (뒷카드 비침 방지) */
      var bg = window.getComputedStyle(c).backgroundColor;
      log('  card[' + i + '] computed bg:', bg);
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        c.style.backgroundColor = '#ffffff';
        log('    → 투명 감지, 흰색으로 강제 적용');
      }
    });

    /* 첫 섹션 외의 나머지 .white-frame_connect 섹션은 숨김 (페이지 짧아짐) */
    sections.forEach(function (sec, i) {
      if (i > 0) {
        sec.style.display = 'none';
        sec.setAttribute('data-deck-hidden', '1');
      }
    });
    log('hidden sections:', sections.length - 1);

    var deck = siblings.slice();

    /* 사선 방향: 맨 앞 카드(i=0)는 우하단, 뒤로 갈수록 좌상향
       host 정중앙 기준 대칭이 되도록 -maxIdx*OFFSET/2 만큼 shift
       → 맨 뒤 카드 좌측 = host 좌측, 맨 앞 카드 우측 = host 우측 */
    var maxIdx  = Math.min(VISIBLE - 1, deck.length - 1);
    var halfOffX = maxIdx * STACK_OFFSET_X / 2;
    var halfOffY = maxIdx * STACK_OFFSET_Y / 2;

    function applyTransforms(animate) {
      deck.forEach(function (card, i) {
        if (i >= VISIBLE) {
          card.style.opacity = '0';
          card.style.pointerEvents = 'none';
          card.style.transform =
            'translate(-50%, 0px) rotate(' +
            STACK_TILT + 'deg) scale(' + (1 - VISIBLE * STACK_SCALE) + ')';
          card.classList.remove('is-top');
          card.style.zIndex = String(deck.length - i);
          return;
        }

        /* i=0 (맨 앞) → 우하단 (+halfOff), i=maxIdx (맨 뒤) → 좌상단 (-halfOff) */
        var tilt  = STACK_TILT;
        var x     = (maxIdx - i) * STACK_OFFSET_X - halfOffX;
        var y     = (maxIdx - i) * STACK_OFFSET_Y - halfOffY;
        var scale = 1 - i * STACK_SCALE;
        var z     = deck.length - i;

        if (animate) {
          card.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease';
        } else {
          card.style.transition = '';
        }

        card.style.opacity       = '1';
        card.style.pointerEvents = (i === 0) ? 'auto' : 'none';
        card.style.zIndex        = String(z);
        card.style.transform =
          'translate(calc(-50% + ' + x + 'px), ' + y + 'px) rotate(' + tilt + 'deg) scale(' + scale + ')';

        if (i === 0) card.classList.add('is-top');
        else         card.classList.remove('is-top');
      });
    }

    applyTransforms(false);
    /* prepaint flicker guard 해제: 첫 섹션 노출 (about/bootstrap.js 참조) */
    if (sections[0]) sections[0].classList.add('helix-deck-ready');
    log('deck initialized:', deck.length, 'cards', cardW + 'x' + cardH);

    /* ──────────────────────────────────────────────────────────
       드래그 처리 (Pointer Events)
       Top 카드에만 부착. dragstart 차단으로 이미지 드래그 방지.
    ────────────────────────────────────────────────────────── */
    var drag = null;

    function onPointerDown(e) {
      var top = deck[0];
      if (!top || !top.contains(e.target) && e.target !== top) return;
      /* a/button 클릭은 드래그 막지 않음 */
      var interactive = e.target.closest && e.target.closest('a, button, [role="button"]');
      if (interactive) return;

      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startT: performance.now(),
        lastX: e.clientX,
        lastT: performance.now(),
        dx: 0,
        dy: 0,
        vx: 0
      };
      top.classList.add('is-dragging');
      try { top.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.startX;
      drag.dy = e.clientY - drag.startY;

      var now = performance.now();
      var dt  = now - drag.lastT;
      if (dt > 0) drag.vx = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = now;

      var top = deck[0];
      if (!top) return;
      /* 회전 제거 — 직선 슬라이드만 (대칭화: maxIdx*OFFSET/2 기준) */
      var baseX = halfOffX;
      var baseY = halfOffY;
      top.style.transition = 'none';
      top.style.transform =
        'translate(calc(-50% + ' + (baseX + drag.dx) + 'px), ' + (baseY + drag.dy) + 'px) rotate(' + STACK_TILT + 'deg) scale(1)';
    }

    function onPointerUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var top = deck[0];
      var dx  = drag.dx;
      var vx  = drag.vx;
      drag = null;
      if (top) {
        top.classList.remove('is-dragging');
        try { top.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      if (!top) return;

      var passDist = Math.abs(dx) > cardW * FLY_THRESHOLD;
      var passVel  = Math.abs(vx) > FLY_VELOCITY;
      if (passDist || passVel) {
        flyOut(top, dx >= 0 ? 1 : -1);
      } else {
        snapBack(top);
      }
    }

    function snapBack(card) {
      card.style.transition =
        'transform ' + SNAP_DURATION + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
      /* top 카드 원위치 = i=0 위치 (대칭화 후 +halfOff) — 우하단 */
      card.style.transform =
        'translate(calc(-50% + ' + halfOffX + 'px), ' +
        halfOffY + 'px) rotate(' +
        STACK_TILT + 'deg) scale(1)';
    }

    var cycling = false;
    function flyOut(card, dir) {
      if (cycling) return;
      cycling = true;

      /* 짧은 슬라이드(카드 폭의 18% 한도 80px) + 즉시 페이드아웃 */
      var flyX = dir * Math.min(cardW * 0.18, 80);
      card.style.transition =
        'transform ' + FLY_DURATION + 'ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease';
      card.style.transform =
        'translate(calc(-50% + ' + (halfOffX + flyX) + 'px), ' + halfOffY + 'px) rotate(' + STACK_TILT + 'deg) scale(1)';
      card.style.opacity = '0';

      /* 나머지 카드들은 한 단계 앞으로 promote (newIdx 작을수록 우하단) */
      var rest = deck.slice(1);
      rest.forEach(function (c, idx) {
        var newIdx = idx;  /* 새 인덱스 (i=0 부터) */
        var tilt = STACK_TILT;
        var nx   = (maxIdx - newIdx) * STACK_OFFSET_X - halfOffX;
        var ny   = (maxIdx - newIdx) * STACK_OFFSET_Y - halfOffY;
        var s    = 1 - newIdx * STACK_SCALE;
        c.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease';
        c.style.transform =
          'translate(calc(-50% + ' + nx + 'px), ' + ny + 'px) rotate(' + tilt + 'deg) scale(' + s + ')';
      });

      setTimeout(function () {
        /* deck 순환: top 을 맨 뒤로 보냄 */
        deck.push(deck.shift());

        /* 맨 뒤로 간 카드를 좌상단 hidden 위치에 즉시 (애니 없이) 이동 */
        var last = deck[deck.length - 1];
        last.style.transition = 'none';
        last.style.opacity    = '0';
        last.style.transform =
          'translate(-50%, 0px) rotate(' +
          STACK_TILT + 'deg) scale(' + (1 - VISIBLE * STACK_SCALE) + ')';

        /* 다음 frame 에서 정상 transform 재적용 (페이드인 자연스럽게) */
        requestAnimationFrame(function () {
          applyTransforms(true);
          cycling = false;
        });
      }, FLY_DURATION);
    }

    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup',   onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    /* 이미지/텍스트 드래그 ghost 방지 */
    host.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* 좌우 세모 화살표 — host 부모(grid) 안에 절대위치로 삽입.
       클릭 시 flyOut(◀ → 왼쪽 / ▶ → 오른쪽). */
    function makeArrow(dir) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'helix-deck-arrow helix-deck-arrow-' + (dir < 0 ? 'left' : 'right');
      btn.setAttribute('aria-label', dir < 0 ? '이전 카드' : '다음 카드');
      btn.innerHTML = dir < 0
        ? '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M16 4 L6 12 L16 20 Z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 4 L18 12 L8 20 Z"/></svg>';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var top = deck[0];
        if (top && !cycling) flyOut(top, dir);
      });
      return btn;
    }
    /* 화살표는 host 자식으로 두고 CSS 음수 left/right 로 host 바깥에 배치
       → 카드 영역(host 너비) 절대 침범 안 함 */
    var leftArrow  = makeArrow(-1);
    var rightArrow = makeArrow(+1);
    host.appendChild(leftArrow);
    host.appendChild(rightArrow);

    /* 리사이즈 시 host 크기 재측정 */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        /* deck[0]은 transform 적용 중이므로 임시 클리어 후 측정 */
        var saved = deck[0].style.transform;
        deck[0].style.transition = 'none';
        deck[0].style.transform  = 'translate(-50%, 0)';
        var r = deck[0].getBoundingClientRect();
        deck[0].style.transform  = saved;
        if (r.width && r.height) {
          cardW = r.width;
          cardH = r.height;
          host.style.width  = cardW + 'px';
          host.style.height = (cardH + (deck.length - 1) * STACK_OFFSET_Y) + 'px';
          applyTransforms(false);
        }
      }, 150);
    });

    initialized = true;
    return true;
  }

  /* 중복 retry 방지 — DOMContentLoaded/load/Webflow.push 가 각자 호출해도 interval 1개만 실행 */
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
