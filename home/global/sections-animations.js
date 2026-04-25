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

  /* ============================================================
     initSectionsOnce: 섹션 2-4 공통 초기화 (1회만 실행)
  ============================================================ */
  function initSectionsOnce() {
    if (initialized) return true;
    if (typeof gsap === 'undefined' || !window.ScrollTrigger) {
      log('GSAP or ScrollTrigger not ready');
      return false;
    }

    try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}

    var headings = document.querySelectorAll('.section2-heading');
    var sec2Head = headings[0] || null;
    var sec3Head = headings[1] || null;
    log('headings found:', headings.length);

    /* ──────────────────────────────────────────────────────────
       1. 섹션 2 헤딩 + 버튼 2 공동 트리거 (엇박 0.15s)
          헤딩: sec2Head top 15% 도달 시 즉시 0.7s ease-out 페이드인
          버튼: 헤딩 시작 0.15s 후 0.4s ease-out 페이드인 + 후광
    ────────────────────────────────────────────────────────── */
    var btn2 = document.querySelector('.bt-box-2');
    if (sec2Head) {
      ScrollTrigger.create({
        trigger: sec2Head,
        start: 'top 15%',
        once: true,
        onEnter: function () {
          /* 헤딩 페이드인 */
          gsap.to(sec2Head, { opacity: 1, duration: 0.7, ease: 'power2.out' });

          /* 버튼2: 최고밝기 즉시 준비 → 0.15s 후 페이드인 → 1.5s 홀드 → is-looping */
          if (btn2) {
            btn2.style.setProperty('box-shadow', '0 0 2.6vw 0.9vw rgba(0,117,214,1)', 'important');
            gsap.to(btn2, {
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out',
              delay: 0.15,
              onComplete: function () {
                setTimeout(function () {
                  btn2.style.removeProperty('box-shadow');
                  btn2.classList.add('is-looping');
                }, 1500);
              }
            });
          }
          log('sec2 heading + btn2 fade-in (엇박 0.15s)');
        }
      });
    }

    /* ──────────────────────────────────────────────────────────
       2. 섹션 3 헤딩 fade-in (IntersectionObserver 유지)
    ────────────────────────────────────────────────────────── */
    if (sec3Head) {
      var io3 = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          sec3Head.style.transition = 'opacity 0.9s ease';
          sec3Head.style.opacity    = '1';
          io3.disconnect();
        }
      }, { threshold: 0.15 });
      io3.observe(sec3Head);
    }

    /* ──────────────────────────────────────────────────────────
       4. 섹션 4 카드 스태거 애니메이션
    ────────────────────────────────────────────────────────── */
    var cards = document.querySelectorAll('.home_branch-card');
    var cardContainer = document.querySelector('.flex-block-23') ||
                        document.querySelector('#animal-medical-center') ||
                        (cards.length ? cards[0].parentElement : null);

    if (cards.length && cardContainer) {
      var cardTL = gsap.timeline({
        scrollTrigger: {
          trigger: cardContainer,
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      });

      cardTL.to(cards, {
        opacity: 1,
        y: 0,
        stagger: 0.25,
        duration: 0.8,
        ease: 'power2.out'
      })
      .to(cards, {
        boxShadow: '0 10px 30px rgba(0, 117, 214, 0.15)',
        stagger: 0.25,
        duration: 0.6
      }, '<0.3');

      var svicc = document.querySelector('.home_background_svicc');
      if (svicc) {
        cardTL.to(svicc, {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power2.out'
        }, '-=0.5');
      }
      log('cards animation: ' + cards.length + ' cards, svicc=' + !!svicc);
    }

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

    /* 필요 요소 탐색 */
    var btn1     = document.querySelector('.discover-helix_button');
    var btn2     = document.querySelector('.bt-box-2');
    var headings = document.querySelectorAll('.section2-heading');
    var sec3Head = headings[1] || null;

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

    /* ── 시작 / 끝 좌표 계산 ─────────────────────────────────── */
    var scrollY    = window.scrollY || window.pageYOffset;

    var btn1R      = btn1.getBoundingClientRect();
    var btn2R      = btn2.getBoundingClientRect();
    var startX     = btn1R.left + btn1R.width / 2;           /* 헬릭스 라인과 동일 X */
    var startY_abs = btn2R.bottom + scrollY;                  /* bt-box-2 바텀 */

    var halfVW  = window.innerWidth * 0.005;                  /* 0.5vw */
    var endX    = charRect.left;                              /* 첫 글자 X */
    var endY_abs = charRect.top + scrollY - halfVW;           /* 첫 글자 탑 - 0.5vw */

    var H  = endY_abs - startY_abs;
    var Dx = endX - startX;

    log('zigLine startX=' + startX.toFixed(0) + ' startY=' + startY_abs.toFixed(0) +
        ' endX=' + endX.toFixed(0) + ' endY=' + endY_abs.toFixed(0) +
        ' H=' + H.toFixed(0) + ' Dx=' + Dx.toFixed(0));

    if (H <= 20) { log('zigLine: H too small → skip'); return; }

    /* ── Z형 경로 기하학 계산 ────────────────────────────────── */
    var ang  = 20 * Math.PI / 180;
    var sin20 = Math.sin(ang);   /* ≈ 0.342 */
    var cos20 = Math.cos(ang);   /* ≈ 0.940 */
    var tan20 = Math.tan(ang);   /* ≈ 0.364 */

    /* 대각선 구간의 수직 성분 (Dx가 만드는 20° 기울기의 높이) */
    var diag_y   = Math.abs(Dx) / tan20;
    var validZ   = (Math.abs(Dx) > 1 && diag_y < H - 20);

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
    zigPath.setAttribute('fill',            'none');
    zigPath.setAttribute('stroke',          '#0075d6');
    zigPath.setAttribute('stroke-width',    '1');
    zigPath.setAttribute('stroke-linecap',  'round');
    zigPath.setAttribute('stroke-linejoin', 'round');
    zigPath.setAttribute('class',           'helix-line-path');
    zigSvg.appendChild(zigPath);

    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(zigSvg);

    /* SVG는 경로 전체를 포함하도록 크기 설정 */
    var pad      = 32;
    var svgLeft  = Math.min(startX, endX) - pad;
    var svgWidth = Math.abs(Dx) + pad * 2;
    var lineH    = H;

    zigSvg.style.left   = svgLeft + 'px';
    zigSvg.style.top    = startY_abs + 'px';
    zigSvg.style.width  = svgWidth + 'px';
    zigSvg.style.height = lineH + 'px';
    zigSvg.setAttribute('width',  svgWidth);
    zigSvg.setAttribute('height', Math.ceil(lineH));

    /* SVG 내부 좌표 (SVG 뷰포트 기준) */
    var relSX = startX - svgLeft;   /* 시작점 X (상대) */
    var relEX = endX   - svgLeft;   /* 끝점 X (상대) */

    /* ── Z형 경로 빌드 ───────────────────────────────────────── */
    var pathD;
    if (validZ) {
      var k    = (H - diag_y) / 2.5;
      var seg1 = 1.5 * k;            /* 구간1 길이 */
      var seg3 = k;                  /* 구간3 길이 */

      /* 곡률 반경: 작은 구간의 35%, 최소 6px, 대각선 30% 이하 */
      var diagLen = Math.sqrt(Dx * Dx + diag_y * diag_y);
      var r = Math.min(seg1 * 0.35, seg3 * 0.35, diagLen * 0.30);
      r = Math.max(r, 6);

      var dir  = Dx >= 0 ? 1 : -1;   /* 수평 방향 */
      var sx20 = dir * sin20;

      /* SVG 내부 꼭지점 Y */
      var bend1Y = seg1;
      var bend2Y = seg1 + diag_y;

      /*
         M  relSX, 0                          ← 시작
         L  relSX, (bend1Y - r)               ← 구간1 직선
         Q  relSX, bend1Y,                    ← 꼭지점1 곡선 제어점
            (relSX + r*sx20), (bend1Y + r*cos20)
         L  (relEX - r*sx20), (bend2Y - r*cos20)  ← 구간2 직선
         Q  relEX, bend2Y,                    ← 꼭지점2 곡선 제어점
            relEX, (bend2Y + r)
         L  relEX, lineH                      ← 구간3 직선
      */
      pathD = [
        'M',  f(relSX),              '0',
        'L',  f(relSX),              f(bend1Y - r),
        'Q',  f(relSX),              f(bend1Y),
              f(relSX + r * sx20),   f(bend1Y + r * cos20),
        'L',  f(relEX - r * sx20),   f(bend2Y - r * cos20),
        'Q',  f(relEX),              f(bend2Y),
              f(relEX),              f(bend2Y + r),
        'L',  f(relEX),              f(lineH)
      ].join(' ');
    } else {
      /* 폴백: 직선 (Dx≈0 또는 대각선이 너무 길 때) */
      pathD = 'M ' + f(relSX) + ' 0 L ' + f(relEX) + ' ' + f(lineH);
    }

    function f(n) { return n.toFixed(2); }

    zigPath.setAttribute('d', pathD);

    var pathLength = zigPath.getTotalLength() || lineH;
    zigPath.setAttribute('stroke-dasharray',  '0 ' + pathLength);
    zigPath.setAttribute('stroke-dashoffset', '0');

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

    /* Erase: btn2 bottom → 뷰포트 top → sec3 헤딩 top center
       scrub:2 = 꼬리가 머리를 느리게 따라잡는 효과 */
    ScrollTrigger.create({
      trigger: btn2,
      start: 'bottom top',
      endTrigger: sec3Head,
      end: 'top center',
      scrub: 2,
      markers: DEBUG,
      onUpdate: function (self) {
        tailProgress = self.progress;
        applyDash();
      }
    });

    log('zigLine Z-shape, H=' + H.toFixed(0) +
        ' Dx=' + Dx.toFixed(0) + (validZ ? ' seg1=' + seg1.toFixed(0) : ' fallback'));
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
