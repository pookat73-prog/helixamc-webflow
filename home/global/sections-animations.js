/* ================================================================
   SECTIONS 2-4 ANIMATIONS (실제 Webflow DOM 매핑)

   포함:
   - 섹션 2 헤딩 fade-in: 헬릭스 라인 소멸 직전 ScrollTrigger (top 58%)
   - 섹션 3 헤딩 fade-in: IntersectionObserver
   - 버튼 2 fade-in: 글로우 없음, opacity만 (ScrollTrigger)
   - 지그 라인 (섹션 2 버튼 → 섹션 3 헤딩): divider.js 동일 패턴
   - 섹션 4 카드 스태거 + SVICC 슬라이드 인
   - 복사 버튼 (.copy-text-button)
   - 전화 링크 (a[href^="tel:"]) + 주소 자동 복사

   의존성: GSAP 3.12.2 + ScrollTrigger
   ================================================================ */

(function () {
  'use strict';

  var DEBUG = /[?&]debug-sections=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[Sections]'].concat([].slice.call(arguments)));
  } : function () {};

  /* bt-box-2 보호: buttons.js와의 레이스 컨디션 방지
     (buttons.js 셀렉터에서 제거했지만 방어적으로 유지) */
  (function () {
    var b2 = document.querySelector('.bt-box-2');
    if (b2) b2.setAttribute('data-s2-init', '');
  }());

  /* 모바일(≤767px) 글로우 인라인 셋업 값 — buttons.css 의
     glowShimmerBlueMobile 0%/100% 와 정확히 동일해야 .is-looping 핸드오프
     시점에 점프 없음. ScrollTrigger 발사 시점에 평가해 리사이즈에도 적응. */
  function maxGlowBlue() {
    return window.innerWidth <= 767
      ? '0 0 12px 4px rgba(0,117,214,1)'
      : '0 0 0.85vw 0.3vw rgba(0,117,214,1)';
  }

  var initialized    = false;
  var zigInitialized = false;

  /* ============================================================
     fallbackCopy / flashSuccess (복사 버튼 헬퍼)
  ============================================================ */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function flashSuccess(btn, successText) {
    var original = btn.innerText;
    btn.innerText = successText;
    btn.classList.add('copy-success');
    setTimeout(function () {
      btn.innerText = original;
      btn.classList.remove('copy-success');
    }, 1800);
  }

  /* 화면에 실제로 렌더링되는지 확인 (display:none 부모 포함 거름) */
  function isVisible(el) {
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    /* offsetParent 가 null 인 경우: position:fixed 거나 display:none 조상.
       보수적으로 getComputedStyle 검사 */
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }

  /* ============================================================
     initSectionsOnce: 섹션 2-4 공통 초기화 (1회만 실행)

     데스크/모바일 듀얼 섹션 구조 대응:
     - 동일 클래스(.section2-heading, .bt-box-3, .home_background_svicc,
       .home_branch-card)가 데스크용·모바일용 섹션에 각각 존재
     - 각 헤딩/카드 컨테이너를 순회하며 자기 섹션 안의 짝(버튼/SVICC)을
       찾아 self-contained 트리거 생성 → 숨겨진 섹션은 스킵
  ============================================================ */
  function initSectionsOnce() {
    if (initialized) return true;
    if (typeof gsap === 'undefined' || !window.ScrollTrigger) {
      log('GSAP or ScrollTrigger not ready');
      return false;
    }

    try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}

    var headings = document.querySelectorAll('.section2-heading');
    log('headings found:', headings.length);

    /* ──────────────────────────────────────────────────────────
       헤딩 + 짝꿍 버튼 페어링 (엇박 0.15s)
       - 첫 번째 .section2-heading 은 섹션 2 → .bt-box-2 와 페어
       - 그 외(.section2-heading × N) 는 섹션 3 변주 → 각자 같은 section
         조상 안의 .bt-box-3 와 페어
       - display:none 섹션은 스킵
    ────────────────────────────────────────────────────────── */
    headings.forEach(function (heading, idx) {
      if (!isVisible(heading)) {
        log('heading[' + idx + '] hidden, skip');
        return;
      }

      var section = heading.closest('section') || heading.parentElement;
      var btnSelector = (idx === 0) ? '.bt-box-2' : '.bt-box-3';
      var btn = section ? section.querySelector(btnSelector) : null;
      if (btn && !isVisible(btn)) btn = null;

      ScrollTrigger.create({
        trigger: heading,
        start: 'top 65%',
        once: true,
        onEnter: function () {
          gsap.to(heading, { opacity: 1, duration: 0.7, ease: 'power2.out' });

          if (btn && !btn.classList.contains('is-looping')) {
            btn.style.setProperty('box-shadow', maxGlowBlue(), 'important');
            gsap.to(btn, {
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out',
              delay: 0.15,
              onComplete: function () {
                setTimeout(function () {
                  btn.style.removeProperty('box-shadow');
                  btn.classList.add('is-looping');
                }, 1500);
              }
            });
          }
          log('heading[' + idx + '] + ' + btnSelector + ' fade-in (btn=' + !!btn + ')');
        }
      });
    });

    /* ──────────────────────────────────────────────────────────
       섹션 4 카드 스태거 + SVICC 슬라이드 인
       - .home_branch-card 가 들어있는 section 마다 독립 timeline
       - 각 섹션 내부 카드 + 그 섹션의 .home_background_svicc 페어
       - 데스크용·모바일용 섹션 각자 자기 트리거로 발동, 숨겨진 쪽 스킵
    ────────────────────────────────────────────────────────── */
    var cardSections = new Set();
    document.querySelectorAll('.home_branch-card, .flex-block-22 > .div-block-151').forEach(function (card) {
      var sec = card.closest('section');
      if (sec) cardSections.add(sec);
    });

    var sec4Count = 0;
    cardSections.forEach(function (section) {
      if (!isVisible(section)) {
        log('card section hidden, skip');
        return;
      }
      sec4Count++;

      var cards = section.querySelectorAll('.home_branch-card, .flex-block-22 > .div-block-151');
      if (!cards.length) return;

      var cardContainer = section.querySelector('.flex-block-22') ||
                          section.querySelector('.flex-block-23') ||
                          cards[0].parentElement;

      /* once: true — helix-s1-done 이후 ScrollTrigger.refresh() 가 트리거를
         재평가할 때 카드가 깜빡 사라졌다 다시 페이드인되는 현상 방지. */
      var cardTL = gsap.timeline({
        scrollTrigger: {
          trigger: cardContainer,
          start: 'top 70%',
          toggleActions: 'play none none none',
          once: true
        }
      });

      /* 모바일은 1열 세로 스택이라 0.08s 는 너무 빠름 — 0.12s 로 늘려 리듬 강화 */
      var cardStagger = window.innerWidth <= 767 ? 0.12 : 0.08;

      cardTL.to(cards, {
        opacity: 1,
        y: 0,
        stagger: cardStagger,
        duration: 0.5,
        ease: 'power2.out'
      }, 0);

      cards.forEach(function (card, i) {
        cardTL.call(function () { card.classList.add('is-shadowed'); }, [], 0.15 + i * cardStagger);
      });

      var svicc = section.querySelector('.home_background_svicc');
      if (svicc) {
        cardTL.to(svicc, {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out'
        }, '-=0.3');
      }
      log('section card animation: cards=' + cards.length + ' svicc=' + !!svicc);
    });
    log('total visible card sections: ' + sec4Count);

    /* ──────────────────────────────────────────────────────────
       5. 복사 버튼 (.copy-text-button)
    ────────────────────────────────────────────────────────── */
    document.querySelectorAll('.copy-text-button').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var card = btn.closest('.home_branch-card');
        if (!card) return;

        var addrNodes = card.querySelectorAll('[class*="home_branch-card_address"]');
        var addr = Array.from(addrNodes)
          .map(function (n) { return (n.innerText || '').trim(); })
          .filter(Boolean)
          .join(' ');

        if (!addr) { log('address not found in card'); return; }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(function () {
            flashSuccess(btn, '복사완료');
            log('copied:', addr);
          }).catch(function () {
            fallbackCopy(addr);
            flashSuccess(btn, '복사완료');
          });
        } else {
          fallbackCopy(addr);
          flashSuccess(btn, '복사완료');
        }
      });
      btn.style.cursor = 'pointer';
    });

    /* ──────────────────────────────────────────────────────────
       6. 전화 링크 (a[href^="tel:"])
    ────────────────────────────────────────────────────────── */
    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var card = link.closest('.home_branch-card');
        if (!card) return;

        var addrNodes = card.querySelectorAll('[class*="home_branch-card_address"]');
        var addr = Array.from(addrNodes)
          .map(function (n) { return (n.innerText || '').trim(); })
          .filter(Boolean)
          .join(' ');

        if (addr) {
          e.preventDefault();
          var confirmed = confirm('전화로 연결하시겠습니까?\n주소도 자동으로 복사됩니다.');
          if (confirmed) {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(addr).catch(function () { fallbackCopy(addr); });
            } else {
              fallbackCopy(addr);
            }
            window.location.href = link.href;
          }
          log('tel + copy:', link.href, addr);
        }
      });
    });

    initialized = true;
    log('all sections initialized');
    return true;
  }

  /* ============================================================
     initZigLine: 지그 라인 (헬릭스 X + bt-box-2 바텀 → 섹션 3 헤딩 첫 글자 탑)
     Z형 2꺾임 곡선 SVG path + stroke-dashoffset 스크롤 연동

     경로 형태:
       구간1(수직 하강) → 꼭지점1(곡선) → 구간2(오른쪽 20° 대각선)
                        → 꼭지점2(곡선) → 구간3(수직 하강)
       구간1 : 구간3 = 1.5 : 1
  ============================================================ */
  function initZigLine() {
    if (zigInitialized) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    /* 모바일은 sec3 모바일 섹션이 따로 있어 지그 곡선 레이아웃 자체가
       어울리지 않음 — 데스크에서만 동작 */
    if (window.innerWidth <= 767) {
      log('zigLine: mobile viewport → skip');
      return;
    }

    /* 필요 요소 탐색 — 보이는 sec3 헤딩 중 첫 번째 픽업
       (데스크/모바일 듀얼 구조에서 인덱스 의존 제거) */
    var btn1     = document.querySelector('.discover-helix_button');
    var btn2     = document.querySelector('.bt-box-2');
    var headings = document.querySelectorAll('.section2-heading');
    var sec3Head = null;
    for (var i = 1; i < headings.length; i++) {
      if (isVisible(headings[i])) { sec3Head = headings[i]; break; }
    }

    if (!btn1 || !btn2 || !sec3Head) {
      log('zigLine: btn1=' + !!btn1 + ' btn2=' + !!btn2 + ' sec3Head=' + !!sec3Head + ' → skip');
      return;
    }

    /* 섹션3 헤딩 첫 글자 위치 측정 */
    function getFirstCharRect(el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        if (node.textContent.trim()) break;
      }
      if (!node) return null;
      var range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, 1);
      return range.getBoundingClientRect();
    }

    var charRect = getFirstCharRect(sec3Head);
    if (!charRect) {
      log('zigLine: sec3Head first char not found → skip');
      return;
    }

    /* ── 시작 / 끝 Y 좌표 계산 ──────────────────────────────── */
    var scrollY    = window.scrollY || window.pageYOffset;

    var btn1R      = btn1.getBoundingClientRect();
    var btn2R      = btn2.getBoundingClientRect();
    var startX     = btn1R.left + btn1R.width / 2;  /* 헬릭스 라인과 동일 X */
    var startY_abs = btn2R.bottom + scrollY;         /* bt-box-2 바텀 */

    /* 끝점 Y: 첫 글자 탑 - 0.5vw (없으면 sec3Head 탑 사용) */
    var halfVW   = window.innerWidth * 0.005;
    var endY_abs = charRect
      ? charRect.top + scrollY - halfVW
      : sec3Head.getBoundingClientRect().top + scrollY - halfVW;

    var H = endY_abs - startY_abs;
    if (H < 40) { log('zigLine: H too small → skip'); return; }

    /* ── Z형 기하학 (20° 각도 유지, 구간1:구간3 = 1.5:1) ── */
    /*   endX = 첫 글자 실제 X, Dx에 따라 구간2 늘어남        */
    var ang   = 20 * Math.PI / 180;
    var sin20 = Math.sin(ang);
    var cos20 = Math.cos(ang);
    var tan20 = Math.tan(ang);

    /* endX: 첫 글자('우')의 가로 중앙 → 구간3가 '우' 중앙에 위치 */
    var endX  = charRect
      ? charRect.left + charRect.width / 2
      : sec3Head.getBoundingClientRect().left;
    var Dx    = endX - startX;
    var absDx = Math.abs(Dx);
    var dir   = Dx >= 0 ? 1 : -1;

    /* 수평선 기준 20° 우하향 → diag_y = |Dx| * tan20 ≈ 0.364 * |Dx|
       (수직선 기준이면 diag_y ≈ 2.75|Dx|로 H 초과 → 직선 폴백) */
    var diag_y = absDx * tan20;
    var k      = (H - diag_y) / 2.5;  /* k>0이어야 Z형 가능 */

    var seg1 = 1.5 * k;
    var seg3 = k;

    log('zigLine H=' + H.toFixed(0) + ' Dx=' + Dx.toFixed(0) +
        ' diag_y=' + diag_y.toFixed(0) + ' k=' + k.toFixed(0) +
        ' seg1=' + seg1.toFixed(0) + ' seg3=' + seg3.toFixed(0));

    /* ── SVG 컨테이너 설정 ───────────────────────────────────── */
    var zigSvg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var zigPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    var navbar = document.querySelector('.w-nav') ||
                 document.querySelector('nav')    ||
                 document.querySelector('header') || null;
    var navZ = navbar ? parseInt(getComputedStyle(navbar).zIndex, 10) : NaN;
    var svgZ = (!isNaN(navZ) && navZ > 0) ? navZ - 1 : 999;

    zigSvg.style.cssText =
      'position:absolute;pointer-events:none;overflow:visible;z-index:' + svgZ + ';';
    zigPath.setAttribute('fill',             'none');
    zigPath.setAttribute('stroke',           '#0075d6');
    zigPath.setAttribute('stroke-width',     '1.3');
    zigPath.setAttribute('stroke-linecap',   'round');
    zigPath.setAttribute('stroke-linejoin',  'round');
    zigPath.setAttribute('shape-rendering',  'geometricPrecision');
    zigPath.setAttribute('class',            'helix-line-path');
    zigSvg.appendChild(zigPath);

    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(zigSvg);

    /* SVG: startX 와 endX 양방향 포괄 */
    var pad      = 20;
    var svgLeft  = Math.min(startX, endX) - pad;
    var svgWidth = absDx + pad * 2;
    var lineH    = H;

    zigSvg.style.left   = svgLeft + 'px';
    zigSvg.style.top    = startY_abs + 'px';
    zigSvg.style.width  = svgWidth + 'px';
    zigSvg.style.height = lineH + 'px';
    zigSvg.setAttribute('width',  svgWidth);
    zigSvg.setAttribute('height', Math.ceil(lineH));

    /* SVG 내부 좌표 */
    var relSX = startX - svgLeft;  /* 시작 X (SVG 기준) */
    var relEX = endX   - svgLeft;  /* 끝 X (SVG 기준) */

    /* ── 경로 빌드 ─────────────────────────────────────────── */
    function f(n) { return n.toFixed(2); }

    var diagLen = 0;
    var pathD;
    if (k <= 0) {
      /* 폴백: 단순 대각선 (diag_y >= H, 구간1/3 공간 없음) */
      log('zigLine: k<=0, simple diagonal fallback');
      pathD = ['M', f(relSX), '0', 'L', f(relEX), f(lineH)].join(' ');
    } else {
      diagLen = Math.sqrt(absDx * absDx + diag_y * diag_y);
      /* 곡률 r: 곡선 시작점을 꼭지점에서 더 멀리 → 더 유려한 곡선 */
      var r = Math.min(seg1 * 0.6, seg3 * 0.6, diagLen * 0.5);
      r = Math.max(r, 12);

      var bend1Y = seg1;
      var bend2Y = seg1 + diag_y;

      /* 수평선 기준 20° → 대각선 단위 벡터 = (cos20, sin20) */
      pathD = [
        'M',  f(relSX),                           '0',
        'L',  f(relSX),                           f(bend1Y - r),
        'Q',  f(relSX),                           f(bend1Y),
              f(relSX + dir * r * cos20),          f(bend1Y + r * sin20),
        'L',  f(relEX - dir * r * cos20),          f(bend2Y - r * sin20),
        'Q',  f(relEX),                           f(bend2Y),
              f(relEX),                           f(bend2Y + r),
        'L',  f(relEX),                           f(lineH)
      ].join(' ');
    }

    zigPath.setAttribute('d', pathD);

    var pathLength = zigPath.getTotalLength() || lineH;
    zigPath.setAttribute('stroke-dasharray',  '0 ' + pathLength);
    zigPath.setAttribute('stroke-dashoffset', '0');

    /* ── 비선형 tailProgress 맵핑 ────────────────────────────────
       사선의 path 길이는 길지만 세로 높이(diag_y)는 짧아
       선형 erase시 사선 구간이 시각적으로 빠르게 사라짐.
       사선 구간에 diagLen/diag_y 배의 rawProgress 윈도우를 할당해
       사선이 수직 구간과 비슷한 체감 속도로 지워지도록 보정.
    ── */
    var _p1  = seg1 / H;
    var _q1  = seg1 / pathLength;
    var _q2  = (seg1 + diagLen) / pathLength;
    /* 사선 구간 확장 배수: 최대 3배, 단 p2 가 0.92 초과 시 축소 */
    var _exp = (diagLen > 0 && diag_y > 0) ? Math.min(diagLen / diag_y, 3.0) : 1;
    var _p2  = Math.min(_p1 + _exp * (diag_y / H), 0.92);

    function remapTail(r) {
      if (k <= 0 || diagLen === 0) return r;
      if (r <= _p1) {
        return _p1 > 0 ? r * (_q1 / _p1) : 0;
      } else if (r <= _p2) {
        var t = (r - _p1) / (_p2 - _p1);
        return _q1 + t * (_q2 - _q1);
      } else {
        var t2 = (r - _p2) / (1 - _p2);
        return _q2 + t2 * (1 - _q2);
      }
    }
    log('zigLine remap: p1=' + _p1.toFixed(3) + ' p2=' + _p2.toFixed(3) +
        ' q1=' + _q1.toFixed(3) + ' q2=' + _q2.toFixed(3) + ' exp=' + _exp.toFixed(2));

    /* ── head / tail progress ───────────────────────────────── */
    var headProgress = 0;
    var tailProgress = 0;

    function applyDash() {
      if (!pathLength) return;
      var tail       = Math.min(tailProgress, headProgress);
      var visibleLen = (headProgress - tail) * pathLength;
      var dashOffset = -tail * pathLength;
      zigPath.setAttribute('stroke-dasharray',  visibleLen + ' ' + pathLength);
      zigPath.setAttribute('stroke-dashoffset', dashOffset);
    }

    /* 마커: bt-box-2 바텀 절대 좌표 (Draw 기준점) */
    var marker = document.createElement('div');
    marker.setAttribute('data-zig-marker', '1');
    marker.style.cssText =
      'position:absolute;top:' + startY_abs + 'px;left:0;' +
      'width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(marker);

    /* Draw: marker top → 뷰포트 center → sec3 헤딩 top 75% */
    ScrollTrigger.create({
      trigger: marker,
      start: 'top center',
      endTrigger: sec3Head,
      end: 'top 75%',
      scrub: true,
      markers: DEBUG,
      onUpdate: function (self) {
        headProgress = self.progress;
        applyDash();
      }
    });

    /* Erase: btn2 bottom이 헤더 하단에 가려지는 순간 꼬리 출발 (헬릭스 라인과 동일) */
    var navbarH    = (navbar && navbar.getBoundingClientRect().height) || 0;
    var eraseStart = 'bottom ' + (navbarH > 0 ? navbarH + 'px' : 'top');
    log('zigLine navbarH=' + navbarH + ' eraseStart="' + eraseStart + '"');
    ScrollTrigger.create({
      trigger: btn2,
      start: eraseStart,
      endTrigger: sec3Head,
      end: 'top 40%',
      scrub: true,
      markers: DEBUG,
      onUpdate: function (self) {
        tailProgress = remapTail(self.progress);
        applyDash();
      }
    });

    log('zigLine done, endX=' + endX.toFixed(0));
    zigInitialized = true;
  }

  /* ============================================================
     초기화 재시도
  ============================================================ */
  function retryInit() {
    var n  = 0;
    var iv = setInterval(function () {
      if (initSectionsOnce() || ++n >= 50) clearInterval(iv);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retryInit);
  } else {
    setTimeout(retryInit, 500);
  }

  window.addEventListener('load', retryInit);
  window.Webflow = window.Webflow || [];
  window.Webflow.push(retryInit);

  /* section1.js DOM 복원 완료 → ScrollTrigger 위치 재측정 + 지그 라인 초기화 */
  window.addEventListener('helix-s1-done', function () {
    setTimeout(function () {
      if (window.ScrollTrigger && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
        log('ScrollTrigger refreshed after helix-s1-done');
      }
      initZigLine();
    }, 100);
  });

  /* 폴백: section1이 없어도 load 후 1.5초 뒤 강제 refresh + 지그 라인 초기화 */
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (window.ScrollTrigger && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
        log('ScrollTrigger refreshed (fallback)');
      }
      if (!zigInitialized) initZigLine();
    }, 1500);
  });
})();
