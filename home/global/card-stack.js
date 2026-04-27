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

  var CARD_SELECTOR = '.just-box_qqqqqqq';
  var CARD_CLASS    = CARD_SELECTOR.replace(/^\./, '');  /* classList.contains 용 */
  var DRY_RUN       = /[?&]deck-dry=1/.test(location.search) || true;  /* 진단 모드: DOM 안 건드림. 안정화 후 false */
  var VISIBLE       = 4;        /* 동시에 보이는 카드 수 */
  var STACK_OFFSET  = 8;        /* 카드 간 y 오프셋 (px) */
  var STACK_TILT    = 4;        /* 카드 간 회전 (deg, 좌우 번갈아) */
  var STACK_SCALE   = 0.03;     /* 카드 간 scale 감소량 */
  var FLY_THRESHOLD = 0.25;     /* 카드 너비의 25% 드래그 시 날아감 */
  var FLY_VELOCITY  = 0.45;     /* 또는 px/ms 임계 속도 */
  var FLY_DURATION  = 380;      /* 날아가는 시간 ms */
  var SNAP_DURATION = 260;      /* 원위치 시간 ms */

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

    /* 첫 카드의 부모 = 카드들이 흐르는 컨테이너 (가정) */
    var firstCard = cardsAll[0];
    var parent    = firstCard.parentElement;
    if (!parent) return false;
    log('first card parent:', parent.tagName, '.' + (parent.className || '').split(' ').join('.'));

    /* 같은 부모 안의 카드만 묶음 — 새 전략에선 cardsAll 전체 사용 */
    var siblings = Array.prototype.slice.call(cardsAll);
    log('using all ' + siblings.length + ' cards (cross-parent)');

    /* 카드 사이즈 측정 (첫 카드 기준) */
    var rect = firstCard.getBoundingClientRect();
    var cardW = rect.width;
    var cardH = rect.height;
    log('first card size:', cardW + 'x' + cardH);
    if (!cardW || !cardH) {
      log('card size 0, retry later');
      return false;
    }

    /* 안전장치: 카드 너비가 viewport의 80% 이상이면 풀너비 섹션 가능성
       전체 페이지 레이아웃 깨질 수 있어서 중단 */
    if (cardW > window.innerWidth * 0.8) {
      log('⚠️ card width > 80% of viewport (' + cardW + 'px) — likely full-width section, ABORT to protect layout');
      return true;  /* return true → retry 안 함 (영구 중단) */
    }

    /* DRY RUN: 진단만 하고 끝 */
    if (DRY_RUN) {
      log('✅ DRY_RUN — DOM 변경 없음. 위 로그 확인 후 안전하면 DRY_RUN=false 로 전환');
      log('   카드' + siblings.length + '장, ' + cardW + 'x' + cardH + ', 부모: ' + parent.tagName + '.' + (parent.className||'').split(' ').join('.'));
      initialized = true;
      return true;
    }

    /* deck host 생성: 부모 안에 첫 카드 위치에 삽입 */
    var host = document.createElement('div');
    host.className = 'helix-deck-host';
    host.style.width  = cardW + 'px';
    host.style.height = (cardH + (siblings.length - 1) * STACK_OFFSET) + 'px';
    host.style.display = 'block';

    /* 첫 카드 위치에 host 삽입 후 모든 카드를 host 안으로 이동
       카드마다 width/height 명시(부모 flex/grid 사이징 영향 차단) */
    parent.insertBefore(host, firstCard);
    siblings.forEach(function (c) {
      c.style.width  = cardW + 'px';
      c.style.height = cardH + 'px';
      c.style.display = 'block';
      host.appendChild(c);
    });

    /* deck order: 화면상 맨 위에 보이는 게 [0] */
    var deck = siblings.slice();

    function applyTransforms(animate) {
      deck.forEach(function (card, i) {
        if (i >= VISIBLE) {
          card.style.opacity = '0';
          card.style.pointerEvents = 'none';
          card.style.transform = 'translate(-50%, 0) scale(' + (1 - VISIBLE * STACK_SCALE) + ')';
          card.classList.remove('is-top');
          card.style.zIndex = String(deck.length - i);
          return;
        }

        /* 사선: 짝수번째 좌측 -tilt, 홀수번째 우측 +tilt (top 은 0) */
        var tilt;
        if (i === 0) tilt = 0;
        else tilt = (i % 2 === 1) ? -STACK_TILT : STACK_TILT;

        var y     = i * STACK_OFFSET;
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
          'translate(-50%, ' + y + 'px) rotate(' + tilt + 'deg) scale(' + scale + ')';

        if (i === 0) card.classList.add('is-top');
        else         card.classList.remove('is-top');
      });
    }

    applyTransforms(false);
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
      /* 드래그 거리에 비례해 회전 (최대 ±18°) */
      var rot = Math.max(-18, Math.min(18, drag.dx / cardW * 30));
      top.style.transition = 'none';
      top.style.transform =
        'translate(calc(-50% + ' + drag.dx + 'px), ' + drag.dy + 'px) rotate(' + rot + 'deg) scale(1)';
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
      card.style.transform = 'translate(-50%, 0) rotate(0deg) scale(1)';
    }

    var cycling = false;
    function flyOut(card, dir) {
      if (cycling) return;
      cycling = true;

      var flyX = dir * (cardW * 1.6 + 200);
      var flyR = dir * 28;
      card.style.transition =
        'transform ' + FLY_DURATION + 'ms cubic-bezier(0.55, 0, 0.7, 0.2), opacity 220ms ease ' + (FLY_DURATION - 220) + 'ms';
      card.style.transform =
        'translate(calc(-50% + ' + flyX + 'px), 40px) rotate(' + flyR + 'deg) scale(0.95)';
      card.style.opacity = '0';

      /* 나머지 카드들은 한 단계 위로 promote */
      var rest = deck.slice(1);
      rest.forEach(function (c, idx) {
        var newIdx = idx;
        var tilt;
        if (newIdx === 0) tilt = 0;
        else tilt = (newIdx % 2 === 1) ? -STACK_TILT : STACK_TILT;
        var y = newIdx * STACK_OFFSET;
        var s = 1 - newIdx * STACK_SCALE;
        c.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease';
        c.style.transform =
          'translate(-50%, ' + y + 'px) rotate(' + tilt + 'deg) scale(' + s + ')';
      });

      setTimeout(function () {
        /* deck 순환: top 을 맨 뒤로 보냄 */
        deck.push(deck.shift());

        /* 맨 뒤로 간 카드를 시각적으로 deck 마지막 위치로 즉시 (애니 없이) 이동 */
        var last = deck[deck.length - 1];
        last.style.transition = 'none';
        last.style.opacity    = '0';
        var lastIdx = deck.length - 1;
        var hideIdx = Math.min(lastIdx, VISIBLE);
        var tilt2;
        if (hideIdx === 0) tilt2 = 0;
        else tilt2 = (hideIdx % 2 === 1) ? -STACK_TILT : STACK_TILT;
        last.style.transform =
          'translate(-50%, ' + (hideIdx * STACK_OFFSET) + 'px) rotate(' + tilt2 + 'deg) scale(' + (1 - hideIdx * STACK_SCALE) + ')';

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
          host.style.height = (cardH + (deck.length - 1) * STACK_OFFSET) + 'px';
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
