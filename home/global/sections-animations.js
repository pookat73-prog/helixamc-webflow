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
       1. 섹션 2 헤딩 fade-in
          헬릭스 라인 erase end: sec2Head top 40%
          → 그보다 약간 앞인 top 58%에서 fade-in 시작 (ease-out)
    ────────────────────────────────────────────────────────── */
    if (sec2Head) {
      ScrollTrigger.create({
        trigger: sec2Head,
        start: 'top 58%',
        once: true,
        onEnter: function () {
          gsap.to(sec2Head, { opacity: 1, duration: 0.9, ease: 'power2.out' });
          log('sec2 heading fade-in');
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
       3. 버튼 2 fade-in (글로우 없음, opacity만)
    ────────────────────────────────────────────────────────── */
    var btn2 = document.querySelector('.bt-box-2');
    if (btn2) {
      ScrollTrigger.create({
        trigger: btn2,
        start: 'top 75%',
        once: true,
        onEnter: function () {
          gsap.to(btn2, { opacity: 1, duration: 0.8, ease: 'expo.out' });
          log('btn2 fade-in');
        }
      });
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
     initZigLine: 지그 라인 (bt-box-2 바텀 → 섹션 3 헤딩 탑)
     divider.js 동일 패턴, stroke-dashoffset 스크롤 연동
  ============================================================ */
  function initZigLine() {
    if (zigInitialized) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    var btn2 = document.querySelector('.bt-box-2');
    var headings  = document.querySelectorAll('.section2-heading');
    var sec3Head  = headings[1] || null;

    if (!btn2 || !sec3Head) {
      log('zigLine: btn2=' + !!btn2 + ' sec3Head=' + !!sec3Head + ' → skip');
      return;
    }

    /* SVG 생성 */
    var zigSvg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var zigPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    var navbar = document.querySelector('.w-nav') ||
                 document.querySelector('nav')    ||
                 document.querySelector('header') ||
                 null;
    var navZ = navbar ? parseInt(getComputedStyle(navbar).zIndex, 10) : NaN;
    var svgZ = (!isNaN(navZ) && navZ > 0) ? navZ - 1 : 999;

    zigSvg.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;overflow:visible;z-index:' + svgZ + ';';

    zigPath.setAttribute('fill',            'none');
    zigPath.setAttribute('stroke',          '#0075d6');
    zigPath.setAttribute('stroke-width',    '1');
    zigPath.setAttribute('stroke-linecap',  'round');
    zigPath.setAttribute('class',           'helix-line-path');
    zigSvg.appendChild(zigPath);

    if (getComputedStyle(document.body).position === 'static') {
      document.body.style.position = 'relative';
    }
    document.body.appendChild(zigSvg);

    /* 위치 측정 */
    var scrollY      = window.scrollY || window.pageYOffset;
    var bR           = btn2.getBoundingClientRect();
    var btn2Bot_abs  = bR.bottom + scrollY;
    var lineX        = bR.left + bR.width / 2;

    var s3R          = sec3Head.getBoundingClientRect();
    var s3Top_abs    = s3R.top + scrollY;

    log('zigLine btn2Bot_abs=' + btn2Bot_abs.toFixed(0) +
        ' s3Top_abs=' + s3Top_abs.toFixed(0));

    /* SVG 크기 / 경로 설정 */
    var lineH     = Math.max(1, s3Top_abs - btn2Bot_abs);
    var AMPLITUDE = 14;
    var svgW      = AMPLITUDE * 2 + 4;
    var relCx     = AMPLITUDE + 2;

    zigSvg.style.left   = (lineX - svgW / 2) + 'px';
    zigSvg.style.top    = btn2Bot_abs + 'px';
    zigSvg.style.width  = svgW + 'px';
    zigSvg.style.height = lineH + 'px';
    zigSvg.setAttribute('width',  svgW);
    zigSvg.setAttribute('height', Math.ceil(lineH));

    zigPath.setAttribute('d',
      'M ' + relCx.toFixed(2) + ' 0 L ' + relCx.toFixed(2) + ' ' + lineH.toFixed(2));

    var pathLength = zigPath.getTotalLength() || lineH;
    zigPath.setAttribute('stroke-dasharray',  '0 ' + pathLength);
    zigPath.setAttribute('stroke-dashoffset', '0');

    /* head / tail progress */
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

    /* 마커: btn2 바텀 절대 좌표 (Draw 기준점) */
    var marker = document.createElement('div');
    marker.setAttribute('data-zig-marker', '1');
    marker.style.cssText =
      'position:absolute;top:' + btn2Bot_abs + 'px;left:0;' +
      'width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(marker);

    /* Draw: marker top이 뷰포트 center → sec3 헤딩 top 75% */
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

    /* Erase: btn2 bottom이 뷰포트 top 도달 → sec3 헤딩 top center
       scrub:2 = 2초 지연으로 꼬리가 머리를 느리게 따라잡는 효과 */
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

    log('zigLine initialized, lineH=' + lineH.toFixed(0));
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
