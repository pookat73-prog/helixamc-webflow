/* ================================================================
   HELIX AMC — 진료과목(services) 페이지 SEO 구조화데이터(JSON-LD) 주입기.

   FAQ 페이지와 동일 방식: Webflow 커스텀코드 쓰기가 이 사이트에서 막혀 있어
   head 로더 대신 services/bootstrap.js 의 FILES 로 주입기를 얹는다.
   → 로직·데이터는 GitHub + jsDelivr, Webflow 는 안 건드림.

   메커니즘:
     - services/bootstrap.js 가 window.HELIX_REF(해석된 커밋 SHA)를 세팅한다.
       그 immutable SHA 로 seo-snippets/services.html 을 fetch → 캐시 staleness 회피.
     - JSON-LD 의 textContent 만 새 script 노드로 head 에 주입 (Google 렌더 시 읽음).
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixServicesSeoInit) return;
  window.__helixServicesSeoInit = true;

  var OWNER = 'pookat73-prog';
  var REPO  = 'helixamc-webflow';
  var ref = window.HELIX_REF ||
    (/\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main');

  var url = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
            '@' + ref + '/seo-snippets/services.html';

  fetch(url)
    .then(function (r) { return r.ok ? r.text() : ''; })
    .then(function (html) {
      if (!html) return;
      var box = document.createElement('div');
      box.innerHTML = html;
      var nodes = box.querySelectorAll('script[type="application/ld+json"]');
      for (var i = 0; i < nodes.length; i++) {
        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.textContent = nodes[i].textContent;
        document.head.appendChild(s);
      }
    })
    .catch(function () {});
})();
