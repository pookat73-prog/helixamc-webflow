/* ================================================================
   HELIX AMC - ABOUT PAGE JS
   ================================================================
   FOUC 방지: ds-endendend 폰트 + 심볼 이미지 로드 완료 후 한꺼번에 표시.
   - document.fonts.ready 는 페이지 전체 폰트를 기다리므로 사용하지 않음
   - hero 에 실제 쓰이는 ds-endendend 만 fonts.load() 로 타게팅 */

(function () {
  'use strict';

  var READY_CLASS = 'helix-about-ready';
  var HERO_FONT   = 'ds-endendend';
  var root = document.documentElement;

  function reveal() {
    if (!root.classList.contains(READY_CLASS)) {
      root.classList.add(READY_CLASS);
    }
  }

  function whenHeroFontReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    /* regular + bold 둘 다 시도. 실패해도 reveal 막지 않음. */
    var loads = [
      document.fonts.load('1em "' + HERO_FONT + '"').catch(function () {}),
      document.fonts.load('700 1em "' + HERO_FONT + '"').catch(function () {})
    ];
    return Promise.all(loads);
  }

  function forceEagerSymbol() {
    var imgs = document.querySelectorAll('img.image-23');
    var promises = [];
    imgs.forEach(function (img) {
      try { img.loading = 'eager'; } catch (e) {}
      try { img.decoding = 'sync'; } catch (e) {}
      try { img.fetchPriority = 'high'; } catch (e) {}
      if (img.complete && img.naturalWidth > 0) return;
      promises.push(new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      }));
    });
    return Promise.all(promises);
  }

  function init() {
    Promise.all([whenHeroFontReady(), forceEagerSymbol()]).then(reveal);
    /* 안전 폴백: 2.5s 안에 어떤 이유로든 reveal 안 되면 강제 표시 */
    setTimeout(reveal, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
