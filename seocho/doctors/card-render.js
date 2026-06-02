/* ================================================================
   HELIX AMC - 서초본원 의료진 카드 JSON 렌더러 (v1.0)

   동작: 페이지 안에 [data-doctor-group="<group-id>"] 속성이 박힌
        컨테이너를 찾고, 안에 [data-doctor-template] 가 박힌 카드를
        템플릿으로 삼아, 그 그룹의 JSON 데이터로 카드 인스턴스를
        동적으로 복제·삽입.

   데이터: seocho/doctors/data/<group>/_index.json   (slug 표시 순서)
          seocho/doctors/data/<group>/<slug>.json    (개별 상세)

   페이지에 [data-doctor-group] 컨테이너가 없으면 zero overhead.
   Phase 1 시점엔 컨테이너가 아직 없어 사실상 no-op — Phase 2 에서
   Designer 가 컨테이너에 속성 박으면 그때부터 동작.

   클래스 매핑 (Webflow Designer 의 style name → 렌더 클래스):
     데스크탑 Profile Card:
       .image-29        프로필 사진 (img)
       .text-block-29   이름
       .text-block-30   직책
       .text-block-31   학력
       .flex-block-16   학회 1줄 / 학회 2줄 (각 줄 안 .text-block-32)
       .link-block-2    상세이력 트리거 (data-doctor-open/group 보유)

     모바일 Profile Card_M1:
       .name_m1         이름
       .job-title_m1    직책
       .ab_m1           학력
       .flex-block-16   학회 1줄 / 학회 2줄
                          1줄: .text-block-32
                          2줄: .jh2_m1
       .link-block-2    상세이력 트리거
   ================================================================ */

(function () {
  'use strict';

  var DEBUG = /[?&]debug-doctors=1\b/.test(location.search);
  function log()  { if (DEBUG) try { console.log.apply(console, ['[CardRender]'].concat([].slice.call(arguments))); } catch (e) {} }
  function warn() { try { console.warn.apply(console, ['[CardRender]'].concat([].slice.call(arguments))); } catch (e) {} }

  var OWNER = 'pookat73-prog';
  var REPO  = 'helixamc-webflow';

  function getRef() { return (window.HELIX_REF || 'main'); }
  function dataUrl(group, slug) {
    var t = Math.floor(Date.now() / 60000);
    var file = slug ? (group + '/' + slug + '.json') : (group + '/_index.json');
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
           '@' + getRef() + '/seocho/doctors/data/' + file + '?t=' + t;
  }

  /* group + slug → Promise<doctor data> 캐시.
     modal.js 도 같은 캐시 키를 쓸 수 있도록 window 에 노출. */
  var CACHE = (window.HELIX_DOCTOR_CACHE = window.HELIX_DOCTOR_CACHE || {});

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }
  function fetchDoctor(group, slug) {
    var key = group + '/' + slug;
    if (CACHE[key]) return CACHE[key];
    var p = fetchJson(dataUrl(group, slug)).catch(function (e) {
      delete CACHE[key];
      throw e;
    });
    CACHE[key] = p;
    return p;
  }
  function fetchIndex(group) {
    return fetchJson(dataUrl(group, null));
  }

  /* ---- 카드 내부 노드 채우기 ---- */

  function setText(root, selector, value, opts) {
    var el = root.querySelector(selector);
    if (!el) return false;
    if (value == null || value === '') {
      if (opts && opts.hideEmpty) el.style.display = 'none';
      else el.textContent = '';
      return true;
    }
    el.textContent = value;
    el.style.display = '';
    return true;
  }

  /* Webflow CDN ?w=N 리사이즈 (다른 도메인은 통과).
     카드 썸네일은 보통 표시 폭 ~200~300px 라 480 정도면 retina 까지 충분. */
  function sizedPhoto(url, basePx) {
    if (!url || typeof url !== 'string') return url;
    if (!/website-files\.com|webflow\.com/i.test(url)) return url;
    if (/[?&]w=\d+/.test(url)) return url;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round((basePx || 240) * dpr);
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'w=' + w;
  }

  function setImg(root, selector, url) {
    var img = root.querySelector(selector);
    if (!img) return false;
    if (!url) {
      img.style.display = 'none';
      return true;
    }
    img.src = sizedPhoto(url, 240);
    img.removeAttribute('srcset');
    img.style.display = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    return true;
  }

  function setMembershipRow(root, rowIndex, text) {
    /* .flex-block-16 첫 번째 = 학회 1줄, 두 번째 = 학회 2줄. */
    var rows = root.querySelectorAll('.flex-block-16');
    var row = rows[rowIndex];
    if (!row) return false;
    /* 데스크탑/모바일 둘 다 .text-block-32 / .jh2_m1 후보 */
    var textNode =
        row.querySelector('.text-block-32') ||
        row.querySelector('.jh2_m1');
    if (!textNode) return false;
    if (!text) {
      row.style.display = 'none';
      return true;
    }
    textNode.textContent = text;
    row.style.display = '';
    return true;
  }

  function setTriggerAttrs(root, group, slug) {
    /* .link-block-2 가 모달 트리거 (상세이력 / +버튼) — data-doctor-open, group 박힘 */
    var link = root.querySelector('.link-block-2') ||
               root.querySelector('[data-doctor-open]');
    if (link) {
      link.setAttribute('data-doctor-open',  slug);
      link.setAttribute('data-doctor-group', group);
    }
    /* 컨테이너 자체에도 group 정보 유지 (모달 조상 탐색용 안전망) */
  }

  function fillCard(card, group, doctor, isMobile) {
    /* 이름 / 직책 — 데스크탑·모바일 셀렉터 다름 */
    if (isMobile) {
      setText(card, '.name_m1',      doctor.name);
      setText(card, '.job-title_m1', doctor.title);
      setText(card, '.ab_m1',        (doctor.education && doctor.education[0]) || '');
    } else {
      setText(card, '.text-block-29', doctor.name);
      setText(card, '.text-block-30', doctor.title);
      setText(card, '.text-block-31', (doctor.education && doctor.education[0]) || '');
      setImg (card, '.image-29',     doctor.photo);
    }

    /* 학회 1·2 — 양쪽 동일 (.flex-block-16 위치 기반) */
    var memberships = doctor.memberships || [];
    setMembershipRow(card, 0, memberships[0] || '');
    setMembershipRow(card, 1, memberships[1] || '');

    /* 모달 트리거 attribute */
    setTriggerAttrs(card, group, doctor.slug);

    /* 방사선사 (di-3) 카드 + 메인(프로덕션) 도메인은 상세 모달 없음 —
       "+" 트리거 자체 숨김. 클릭 불가 + 시각적으로도 안 보이게.
       메인은 모달 리뉴얼 검증 끝나기 전까지 트리거 비활성. 스테이징(*.webflow.io)
       에서만 트리거 노출. */
    var isStaging = /\.webflow\.io$/i.test(location.hostname);
    if (group === 'di-3' || !isStaging) {
      var trig = card.querySelector('.link-block-2');
      if (trig) {
        trig.style.display = 'none';
        trig.removeAttribute('data-doctor-open');
        trig.removeAttribute('data-doctor-group');
      }
    }

    /* 컨테이너 내부 카드의 추가 식별자 */
    card.setAttribute('data-doctor-slug', doctor.slug);
    card.removeAttribute('data-doctor-template');
    card.removeAttribute('hidden');
    card.style.display = '';
  }

  /* ---- 그룹 컨테이너 처리 ---- */

  function findTemplate(container) {
    /* 우선순위 1: 컨테이너의 직접 자식 중 [data-doctor-template] 마커
       (deep querySelector 쓰면 컴포넌트 안 깊은 곳의 marker 도 잡혀서
       wrapper 가 아니라 안쪽 카드가 템플릿이 될 수 있음 — 직접 자식만 검사). */
    var c = container.firstElementChild;
    while (c) {
      if (c.hasAttribute && c.hasAttribute('data-doctor-template')) return c;
      c = c.nextElementSibling;
    }
    /* 우선순위 2: 컨테이너의 첫 element 자식 (Webflow Component Instance 의
       root attribute 가 publish 시 항상 propagate 되진 않음 — 마커 의존 X). */
    c = container.firstElementChild;
    while (c) {
      /* <a> 는 카드 트리거 링크일 수 있으니 건너뜀 */
      if (c.tagName !== 'A' && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE') return c;
      c = c.nextElementSibling;
    }
    return null;
  }

  function renderGroup(container) {
    var group = container.getAttribute('data-doctor-group');
    if (!group) return;
    /* 이미 렌더 끝난 컨테이너는 건너뜀 (재진입 방지) */
    if (container.__helixDoctorRendered) return;
    container.__helixDoctorRendered = true;

    var template = findTemplate(container);
    if (!template) {
      warn('group', group, '템플릿 카드를 찾을 수 없음 — skip');
      return;
    }

    /* 모바일/데스크탑 구분 — 템플릿 클래스 검사 */
    var isMobile =
      template.classList && (
        template.classList.contains('profile-card-_m1') ||
        !!template.querySelector('.name_m1')
      );

    log('rendering group', group, isMobile ? '(mobile)' : '(desktop)');

    /* 템플릿 자체는 안 보이게 (남아 있어도 무해하도록) */
    template.style.display = 'none';
    template.setAttribute('aria-hidden', 'true');

    fetchIndex(group).then(function (entries) {
      if (!Array.isArray(entries)) {
        warn('group', group, '_index.json 이 배열이 아님');
        return;
      }
      var slugs = entries
        .filter(function (e) { return e && e.slug && !e.draft; })
        .map(function (e) { return e.slug; });

      log(group, 'slugs:', slugs);

      /* 병렬 fetch 후 _index.json 순서대로 append */
      return Promise.all(slugs.map(function (slug) {
        return fetchDoctor(group, slug).catch(function (e) {
          warn('failed', group, slug, e && e.message);
          return null;
        });
      })).then(function (docs) {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < docs.length; i++) {
          var doc = docs[i];
          if (!doc) continue;
          var card = template.cloneNode(true);
          fillCard(card, group, doc, isMobile);
          frag.appendChild(card);
        }
        container.appendChild(frag);
        /* seocho.css 가 :not([data-doctor-ready]) 로 invisible 시켜둠 — 렌더 끝나면 reveal */
        container.setAttribute('data-doctor-ready', '');
        log(group, 'rendered', docs.filter(Boolean).length, 'cards');
      });
    }).catch(function (e) {
      /* 실패해도 사용자가 빈 화면 보지 않게 reveal */
      container.setAttribute('data-doctor-ready', '');
      warn('group', group, 'render failed', e && e.message);
    });
  }

  function start() {
    /* `[data-doctor-group]` 는 카드 트리거 링크 (<a>) 에도 박혀 있음 — 컴포넌트
       prop 으로 Link Block 의 attribute 에 바인딩되기 때문. 컨테이너만 잡으려고
       block 류만 통과시킴. */
    var containers = document.querySelectorAll(
      'div[data-doctor-group], section[data-doctor-group], main[data-doctor-group]'
    );
    if (!containers.length) { log('no container — idle'); return; }
    log('found', containers.length, 'container(s)');
    containers.forEach(renderGroup);
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
