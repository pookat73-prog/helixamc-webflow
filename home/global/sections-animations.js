/* ================================================================
   SECTIONS 2-4 ANIMATIONS (섹션 2~4 전체 애니메이션)

   포함 사항:
   - 섹션 2 헤딩 fade-in
   - 섹션 2-3 지그 라인 (draw + erase)
   - 섹션 4 카드 스태거 애니메이션
   - 복사/전화 기능

   의존성: GSAP 3.12.2 + ScrollTrigger
   ================================================================ */

(function () {
  'use strict';

  var DEBUG = /[?&]debug-sections=1/.test(location.search);
  var log = DEBUG ? function () {
    console.log.apply(console, ['[Sections]'].concat([].slice.call(arguments)));
  } : function () {};

  function initSectionsOnce() {
    if (typeof gsap === 'undefined' || !window.gsap.timeline) {
      log('GSAP or ScrollTrigger not ready');
      return false;
    }

    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
      log('ScrollTrigger already registered');
    }

    /* ============================================================
       섹션 2 헤딩 페이드인
       ============================================================ */
    var sec2Head = document.querySelector('.section2_heading') ||
                   document.querySelector('[class*="section2"][class*="heading"]');
    if (sec2Head) {
      gsap.from(sec2Head, {
        opacity: 0,
        ease: 'power2.out',
        duration: 0.8,
        scrollTrigger: {
          trigger: sec2Head,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });
      log('sec2 heading animation added');
    }

    /* ============================================================
       섹션 2-3 지그 라인 (strokeDashoffset)
       ============================================================ */
    var btn2 = document.querySelector('.bt-box-2');
    var sec3Head = document.querySelector('.section3_heading') ||
                   document.querySelector('[class*="section3"][class*="heading"]');

    if (btn2 && sec3Head) {
      var zigPath = document.querySelector('.zig-line-path');
      if (zigPath) {
        var pathLen = zigPath.getTotalLength() || 2000;
        zigPath.setAttribute('stroke-dasharray', pathLen + ' ' + pathLen);
        zigPath.setAttribute('stroke-dashoffset', pathLen);

        var zigTL = gsap.timeline({
          scrollTrigger: {
            trigger: btn2,
            start: 'bottom bottom',
            endTrigger: sec3Head,
            end: 'center center',
            scrub: true
          }
        });

        zigTL.to(zigPath, { strokeDashoffset: 0, ease: 'none' })
             .to(zigPath, { strokeDashoffset: -pathLen, ease: 'power1.inOut' }, '>-30%');
        log('zig line animation added');
      }
    }

    /* ============================================================
       섹션 4 카드 애니메이션 (fade-in + translateY + shadow)
       ============================================================ */
    var cardContainer = document.querySelector('.home_contents_3_qq') ||
                        document.querySelector('[class*="section4"]') ||
                        document.querySelector('[class*="branch"]');

    if (cardContainer) {
      var cards = cardContainer.querySelectorAll('.home_branch-card');
      var bgSvicc = document.querySelector('.home_background_svicc');

      if (cards.length > 0) {
        var cardTL = gsap.timeline({
          scrollTrigger: {
            trigger: cardContainer,
            start: 'top 70%'
          }
        });

        cardTL.to(cards, {
          opacity: 1,
          y: 0,
          stagger: 0.3,
          duration: 0.8,
          ease: 'power2.out'
        })
        .to(cards, {
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          stagger: 0.3
        }, '<0.2');

        if (bgSvicc) {
          cardTL.to(bgSvicc, {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power2.out'
          }, '-=0.5');
        }

        log('section4 card animation added');
      }
    }

    /* ============================================================
       복사 버튼 기능
       ============================================================ */
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var card = this.closest('.home_branch-card');
        if (!card) return;

        var addrEl = card.querySelector('.address-text');
        var addr = addrEl ? addrEl.innerText : '';

        if (!addr) {
          log('address-text not found in card');
          return;
        }

        navigator.clipboard.writeText(addr).then(function () {
          var originalText = btn.innerText;
          btn.innerText = '복사완료';
          btn.classList.add('copy-success');

          setTimeout(function () {
            btn.innerText = originalText;
            btn.classList.remove('copy-success');
          }, 2000);

          log('copied:', addr);
        }).catch(function (err) {
          console.warn('[Sections] clipboard write failed:', err);
        });
      });
    });

    /* ============================================================
       전화 기능
       ============================================================ */
    document.querySelectorAll('.tel-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        var telNum = this.innerText.replace(/-/g, '');
        var card = this.closest('.home_branch-card');
        var addr = card ? (card.querySelector('.address-text')?.innerText || '') : '';

        if (!telNum) {
          log('tel number not found');
          return;
        }

        if (addr && confirm('전화로 연결하시겠습니까? 주소가 자동으로 복사됩니다.')) {
          navigator.clipboard.writeText(addr);
          window.location.href = 'tel:' + telNum;
        } else if (!addr && confirm('전화로 연결하시겠습니까?')) {
          window.location.href = 'tel:' + telNum;
        }

        log('tel clicked:', telNum);
      });
    });

    log('all sections initialized');
    return true;
  }

  /* 초기화 재시도 로직 */
  function retryInit() {
    var n = 0;
    var iv = setInterval(function () {
      if (initSectionsOnce() || ++n >= 50) {
        clearInterval(iv);
      }
    }, 100);
  }

  /* DOMContentLoaded / load 이후 실행 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retryInit);
  } else {
    setTimeout(retryInit, 500);
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(retryInit);
})();
