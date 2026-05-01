/* ================================================================
   HELIX AMC - ABOUT PAGE JS
   ================================================================
   FOUC 방지: 폰트 + 심볼 이미지 로드 완료 후 한 번에 표시.
   .image-23 의 loading="lazy" 를 eager 로 강제하여 늦게 뜨는 깜빡임 제거. */

(function () {
  'use strict';

  var READY_CLASS = 'helix-about-ready';
  var root = document.documentElement;

  function reveal() {
    if (!root.classList.contains(READY_CLASS)) {
      root.classList.add(READY_CLASS);
    }
  }

  function forceEagerSymbol() {
    var imgs = document.querySelectorAll('img.image-23');
    var promises = [];
    imgs.forEach(function (img) {
      try { img.loading = 'eager'; } catch (e) {}
      try { img.decoding = 'sync'; } catch (e) {}
      if (img.complete && img.naturalWidth > 0) return;
      promises.push(new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      }));
    });
    return Promise.all(promises);
  }

  function whenFontsReady() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready;
    }
    return Promise.resolve();
  }

  function init() {
    Promise.all([whenFontsReady(), forceEagerSymbol()]).then(reveal);
    /* 안전 폴백: 2.5s 안에 어떤 이유로든 reveal 안 되면 강제 표시 */
    setTimeout(reveal, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
