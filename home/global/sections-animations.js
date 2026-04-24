/* ================================================================
   SECTIONS 2-4 ANIMATIONS (실제 Webflow DOM 매핑)

   포함:
   - 섹션 2, 3 헤딩 fade-in (.section2-heading × 2)
   - 섹션 4 카드 스태거 + SVICC 슬라이드 인
   - 복사 버튼 (.copy-text-button)
   - 전화 링크 (a[href^="tel:"]) + 주소 자동 복사

   지그 라인(섹션 2→3)은 divider.js 패턴으로 별도 구현 예정

   의존성: GSAP 3.12.2 + ScrollTrigger
   ================================================================ */

(function () {
  'use strict';

  /* 진단 모드: 항상 콘솔 로그 출력 (어디서 막히는지 확인 후 나중에 끄기) */
  var log = function () {
    console.log.apply(console, ['[Sections]'].concat([].slice.call(arguments)));
  };

  var initialized = false;

  function initSectionsOnce() {
    if (initialized) return true;
    if (typeof gsap === 'undefined' || !window.ScrollTrigger) {
      log('GSAP or ScrollTrigger not ready. gsap=' + (typeof gsap) + ', ScrollTrigger=' + !!window.ScrollTrigger);
      return false;
    }

    try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}

    /* ============================================================
       1. 섹션 2, 3 헤딩 fade-in
          (섹션 2·3 둘 다 .section2-heading 클래스 사용)
       ============================================================ */
    var headings = document.querySelectorAll('.section2-heading');
    log('headings (.section2-heading) found:', headings.length);

    /* 폴백: .section2-heading이 없으면 h2, h3 시도 */
    if (!headings.length) {
      var altHeadings = document.querySelectorAll('[class*="section2"], [class*="section-2"], [class*="section_2"], [class*="section3"], [class*="section-3"], [class*="section_3"]');
      log('fallback heading candidates:', altHeadings.length);
      altHeadings.forEach(function (el) {
        log('  -', el.tagName, el.className);
      });
    }

    headings.forEach(function (h) {
      gsap.fromTo(h,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: h,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    /* ============================================================
       2. 섹션 4 카드 스태거 애니메이션
          .home_branch-card 들이 순차 페이드인
       ============================================================ */
    var cards = document.querySelectorAll('.home_branch-card');
    log('cards (.home_branch-card) found:', cards.length);

    /* 폴백: 카드 대체 선택자 탐지 */
    if (!cards.length) {
      var altCards = document.querySelectorAll('[class*="branch-card"], [class*="branch_card"], [class*="home_branch"]');
      log('fallback card candidates:', altCards.length);
      altCards.forEach(function (el) {
        log('  -', el.tagName, el.className);
      });
    }

    var cardContainer = document.querySelector('.flex-block-23') ||
                        document.querySelector('#animal-medical-center') ||
                        (cards.length ? cards[0].parentElement : null);
    log('cardContainer:', cardContainer ? cardContainer.tagName + '.' + cardContainer.className : 'null');

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

      /* SVICC 배경 슬라이드 인 (카드와 동시에 시작) */
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
    } else {
      log('cards animation SKIPPED - cards.length=' + cards.length + ', cardContainer=' + !!cardContainer);
    }

    /* ============================================================
       3. 복사 버튼 (.copy-text-button)
          같은 카드 내 .home_branch-card_address 요소들의 텍스트를 합쳐 복사
       ============================================================ */
    var copyBtns = document.querySelectorAll('.copy-text-button');
    log('copy buttons (.copy-text-button) found:', copyBtns.length);
    if (!copyBtns.length) {
      var altCopyBtns = document.querySelectorAll('[class*="copy"]');
      log('fallback copy button candidates:', altCopyBtns.length);
      altCopyBtns.forEach(function (el) { log('  -', el.tagName, el.className); });
    }
    copyBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var card = btn.closest('.home_branch-card');
        if (!card) return;

        /* 카드 내 모든 .home_branch-card_address 및 _address_b 텍스트 합치기 */
        var addrNodes = card.querySelectorAll('[class*="home_branch-card_address"]');
        var addr = Array.from(addrNodes)
          .map(function (n) { return (n.innerText || '').trim(); })
          .filter(Boolean)
          .join(' ');

        if (!addr) {
          log('address not found in card');
          return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(function () {
            flashSuccess(btn, '복사완료');
            log('copied:', addr);
          }).catch(function (err) {
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

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
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
       4. 전화 링크 (a[href^="tel:"])
          클릭 시 주소 자동 복사 + 전화 연결 확인
       ============================================================ */
    var telLinks = document.querySelectorAll('a[href^="tel:"]');
    log('tel links (a[href^="tel:"]) found:', telLinks.length);
    telLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var card = link.closest('.home_branch-card');
        if (!card) return; /* 카드 밖 링크는 기본 동작 유지 */

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
              navigator.clipboard.writeText(addr).catch(function () {
                fallbackCopy(addr);
              });
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

  /* 초기화 재시도 */
  function retryInit() {
    var n = 0;
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
})();
