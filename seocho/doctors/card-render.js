/* ================================================================
   HELIX AMC - 서초본원 의료진 카드 JSON 렌더러 (v1.1 — 프로필 사진 alt 대체텍스트 추가)

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
  function bundleUrl() {
    var t = Math.floor(Date.now() / 60000);
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
           '@' + getRef() + '/seocho/doctors/data/_all.json?t=' + t;
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

  /* 번들 한 방 로드 — 성공 시 39회 라운드트립 → 1회. 실패 시 개별 fetch 폴백.
     bootstrap.js 가 미리 fetch 해둔 promise (window.HELIX_DOCTOR_BUNDLE_PROMISE)
     가 있으면 그걸 채택해 추가 네트워크 0회. */
  var BUNDLE_PROMISE = null;
  function fetchBundle() {
    if (BUNDLE_PROMISE) return BUNDLE_PROMISE;
    var prefetched = window.HELIX_DOCTOR_BUNDLE_PROMISE;
    var src = prefetched ? prefetched.then(function (b) {
      if (!b || !b.groups) throw new Error('prefetched bundle empty');
      return b;
    }) : fetchJson(bundleUrl());
    BUNDLE_PROMISE = src.then(function (b) {
      if (!b || !b.groups) throw new Error('bundle malformed');
      /* 개별 doctor 캐시도 미리 채워 modal.js 가 즉시 사용 가능하게 */
      Object.keys(b.groups).forEach(function (g) {
        var grp = b.groups[g];
        if (!grp || !grp.doctors) return;
        Object.keys(grp.doctors).forEach(function (slug) {
          CACHE[g + '/' + slug] = Promise.resolve(grp.doctors[slug]);
        });
      });
      window.HELIX_DOCTOR_BUNDLE = b;
      return b;
    }).catch(function (e) {
      log('bundle load failed, fallback to per-file fetch:', e && e.message);
      BUNDLE_PROMISE = null; /* 폴백 모드에서 다시 시도 안 함 */
      return null;
    });
    return BUNDLE_PROMISE;
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
    /* 번들이 이미 와 있으면 거기서 즉시 */
    var b = window.HELIX_DOCTOR_BUNDLE;
    if (b && b.groups && b.groups[group] && Array.isArray(b.groups[group].order)) {
      return Promise.resolve(b.groups[group].order.map(function (s) { return { slug: s }; }));
    }
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

  function setImg(root, selector, url, alt) {
    var img = root.querySelector(selector);
    if (!img) return false;
    if (!url) {
      img.style.display = 'none';
      img.setAttribute('alt', '');
      return true;
    }
    img.src = sizedPhoto(url, 240);
    img.removeAttribute('srcset');
    img.style.display = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    /* 대체텍스트 — 스크린리더/SEO 용. 원장님 성함+직함으로 채움.
       alt 미전달 시에는 기존 값을 건드리지 않고 그대로 둔다. */
    if (typeof alt === 'string' && alt) img.setAttribute('alt', alt);
    return true;
  }

  /* 사진 대체텍스트 문구 — '이소윤 원장' 형태. 직함이 없으면 성함만. */
  function photoAlt(doctor) {
    if (!doctor || !doctor.name) return '';
    var name  = String(doctor.name).trim();
    var title = doctor.title ? String(doctor.title).trim() : '';
    return title ? name + ' ' + title : name;
  }

  /* 카드 표시용 학력 단순화 — 모달은 원본 그대로, 카드만 통일 표기로.
     JSON 의 education[0] 을 받아 'OO대학교 수의과대학 [학위] 졸업/수료' 패턴으로 압축.
     비수의 학과(방사선과·분자생명과학부 등) 는 그대로 통과. */
  function shortenEducation(s) {
    if (typeof s !== 'string' || !s) return s;
    /* 예외 (확정) — 김유진 '서울대학교 수의과대학 수의안과/치과학 석사' 는 원문 유지 */
    if (/수의안과\/치과학/.test(s)) return s;
    /* 방사선사 — '방사선과' 표기를 '방사선학과' 로 통일 */
    s = s.replace(/방사선과\s+졸업/, '방사선학과 졸업');
    if (!/수의|임상수의/.test(s)) return s;
    return s
      /* 수의과대학원 <세부전공>학 (석사|박사) → 수의과대학 (석사|박사) */
      .replace(/(\S*대학교)\s+수의과대학원\s+[가-힣A-Za-z]+학\s+(석사|박사)\s+(졸업|수료)/,
               '$1 수의과대학 $2 $3')
      /* 수의과대학 <세부전공>학 (석사|박사) → 수의과대학 (석사|박사)
         세부전공이 '수의외과학' 처럼 '수의' 로 시작하지 않고 '소동물내과학' 처럼
         다른 접두사여도, 또 '수의안과/치과학' 처럼 '/' 가 섞여 있어도 통일되게 잘라냄 */
      .replace(/수의과대학\s+[가-힣A-Za-z\/]+학\s+(석사|박사)/, '수의과대학 $1')
      /* '수의과대학' 이라는 단어 자체가 없고 학과명만 '수의XXX학' 인 경우
         (예: '건국대학교 수의영상진단과학 석사 졸업') 도 '수의과대학' 로 통일 */
      .replace(/(\S*대학교)\s+수의[가-힣A-Za-z]+학\s+(석사|박사)\s+(졸업|수료)/,
               '$1 수의과대학 $2 $3')
      /* 수의과대학 수의학과 졸업 → 수의과대학 졸업 */
      .replace(/수의과대학\s+수의학과\s+졸업/, '수의과대학 졸업')
      /* 임상수의학 (석사|박사) (졸업|수료)? → 수의과대학 ... */
      .replace(/(\S*대학교)\s+임상수의학\s+(석사|박사)(?:\s+(졸업|수료))?/,
               function (_, u, lvl, end) { return u + ' 수의과대학 ' + lvl + ' ' + (end || '졸업'); })
      /* 수의X학과 (석사|박사) (졸업|수료) → 수의과대학 ... */
      .replace(/(\S*대학교)\s+수의[가-힣A-Za-z]+학과\s+(석사|박사)\s+(졸업|수료)/,
               '$1 수의과대학 $2 $3')
      /* 수의X학과 졸업 → 수의과대학 졸업 */
      .replace(/(\S*대학교)\s+수의[가-힣A-Za-z]+학과\s+졸업/, '$1 수의과대학 졸업')
      /* 수의학과 (학사 )?졸업 → 수의과대학 졸업 */
      .replace(/(\S*대학교)\s+수의학과(?:\s+학사)?\s+졸업/, '$1 수의과대학 졸업')
      /* 수의과대학 (학사|학부) 졸업 → 수의과대학 졸업 */
      .replace(/수의과대학\s+(학사|학부)\s+졸업/, '수의과대학 졸업')
      /* 한주열: 동물병원 정형/신경외과 수련의 수료 → 동물병원 수련의 수료 */
      .replace(/동물병원\s+정형\/신경외과\s+수련의\s+수료/, '동물병원 수련의 수료')
      /* 성찬주: 수의학과 내과 박사 수료 → 수의과대학 박사 수료 */
      .replace(/(\S*대학교)\s+수의학과\s+내과\s+박사\s+수료/, '$1 수의과대학 박사 수료')
      /* 선두 연도(yyyy ) 제거 — 카드는 학교명부터 보여주기 위함 */
      .replace(/^\s*\d{4}\s+/, '')
      /* 최종 안전망 — 정규화 후 '...수의과대학 석사|박사' 로 끝나면 '졸업' 보강
         (예: 김유진 '서울대학교 수의과대학 수의안과/치과학 석사' → '졸업' 누락) */
      .replace(/(수의과대학\s+(석사|박사))\s*$/, '$1 졸업');
  }

  /* 카드 표시용 — 괄호( … ) 메타 정보 제거. 모달은 원본 그대로. */
  function stripParens(s) {
    if (typeof s !== 'string') return s;
    return s.replace(/\s*[\(（][^)）]*[\)）]\s*/g, ' ').replace(/\s+/g, ' ').trim();
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
    var firstEdu = shortenEducation((doctor.education && doctor.education[0]) || '');
    /* 이름 / 직책 — 데스크탑·모바일 셀렉터 다름 */
    if (isMobile) {
      setText(card, '.name_m1',      doctor.name);
      setText(card, '.job-title_m1', doctor.title);
      setText(card, '.ab_m1',        firstEdu);
    } else {
      setText(card, '.text-block-29', doctor.name);
      setText(card, '.text-block-30', doctor.title);
      setText(card, '.text-block-31', firstEdu);
      setImg (card, '.image-29',     doctor.photo, photoAlt(doctor));
    }

    /* 학회 1·2 — 양쪽 동일 (.flex-block-16 위치 기반).
       JSON 의 괄호 메타(예: "(2023~현)") 는 카드 표시에서 잘라냄 — 모달은 원본. */
    var memberships = doctor.memberships || [];
    setMembershipRow(card, 0, stripParens(memberships[0] || ''));
    setMembershipRow(card, 1, stripParens(memberships[1] || ''));

    /* 모달 트리거 attribute */
    setTriggerAttrs(card, group, doctor.slug);

    /* 방사선사 (di-3) 카드는 상세 모달 없음 — "+" 트리거 자체 숨김.
       클릭 불가 + 시각적으로도 안 보이게. */
    if (group === 'di-3') {
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
    /* 번들 1회 fetch → 모든 그룹이 그 결과를 공유. 폴백(번들 null)이어도
       renderGroup 안에서 fetchIndex 가 알아서 개별 fetch 로 떨어짐. */
    fetchBundle().then(function () {
      containers.forEach(renderGroup);
    });
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
