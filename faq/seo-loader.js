/* ================================================================
   HELIX AMC — FAQ 페이지 SEO 구조화데이터(JSON-LD) 주입기.

   왜 head freeform 로더가 아니라 이 파일인가:
     다른 SEO 페이지(홈·소개·서초·응급)는 각 페이지 head 에 심은 작은
     로더가 seo-snippets/<page>.html 을 fetch 해 JSON-LD 를 head 에 주입한다.
     FAQ 페이지는 Webflow 커스텀코드 쓰기(freeform/설정 API)가 이 사이트에서
     406 으로 막혀 있어 head 로더를 새로 넣을 수 없다. 대신 이미 head 에
     살아있는 bootstrap 로더의 FILES 목록에 본 파일을 얹어 동일한 주입을 수행.
     → 로직·데이터는 여전히 GitHub + jsDelivr, Webflow 는 안 건드림.

   메커니즘:
     - bootstrap.js 가 먼저 window.HELIX_REF(해석된 커밋 SHA)를 세팅한다.
       그 immutable SHA 로 seo-snippets/faq.html 을 fetch → jsDelivr @branch
       엣지 캐시 staleness 원천 회피. (head 로더가 폴백했으면 REF 는
       'staging'/'main' 브랜치명 → 워크플로우가 그 캐시를 퍼지)
     - innerHTML 로 파싱된 <script> 는 실행되지 않으므로, JSON-LD 의
       textContent 만 복사해 새 script 노드로 head 에 주입 (Google 렌더 시 읽음).
   ================================================================ */

(function () {
  'use strict';

  if (window.__helixFaqSeoInit) return;
  window.__helixFaqSeoInit = true;

  var OWNER = 'pookat73-prog';
  var REPO  = 'helixamc-webflow';
  var ref = window.HELIX_REF ||
    (/\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main');

  var url = 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
            '@' + ref + '/seo-snippets/faq.html';

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
