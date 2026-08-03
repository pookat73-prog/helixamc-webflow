/* ================================================================
   HELIX AMC — 의료진 상세 모달 (seocho/doctors/modal.js)
   ----------------------------------------------------------------
   사용법 (Webflow 측):
     의료진 프로필 카드 컴포넌트 안의 "상세보기" 버튼에 다음 속성:
       data-doctor-open="<slug>"          (필수)
       data-doctor-group="<group-id>"     (선택, 카드 부모 컨테이너에
                                           data-doctor-group 이 있으면 생략 가능)

     또는 결합형:
       data-doctor-open="<group>/<slug>"

   데이터 위치:
     seocho/doctors/data/<group>.json
       → 배열, 각 객체는 schema.json 참고
     모달 콘텐츠 (학술/경력 등) 가 아직 채워지지 않은 사람은 객체에
     해당 필드를 비워두면 그 섹션은 자동 숨김.

   페이지에 [data-doctor-open] 이 하나도 없으면 모달 코드는 listen
   만 걸고 아무 동작 안 함 (zero overhead).
   ================================================================ */

(function () {
  'use strict';

  /* 중복 주입 가드 — 디자이너 라이브 프리뷰 등에서 중복 로드 가능성 */
  if (window.__helixDoctorModalInit) return;
  window.__helixDoctorModalInit = true;

  var DEBUG = /[?&]debug-doctors=1/.test(location.search);
  function log() {
    if (!DEBUG) return;
    var args = ['[doctor-modal]'].concat([].slice.call(arguments));
    try { console.log.apply(console, args); } catch (e) {}
  }
  function warn() {
    var args = ['[doctor-modal]'].concat([].slice.call(arguments));
    try { console.warn.apply(console, args); } catch (e) {}
  }

  var OWNER = 'pookat73-prog';
  var REPO  = 'helixamc-webflow';

  /* "group/slug" → Promise<data> 캐시. 같은 의료진 두 번째 클릭부터 즉시. */
  var doctorCache = {};
  var modalEl = null;
  var lastFocus = null;

  function getRef() {
    /* seocho/bootstrap.js 가 fetch 후 window.HELIX_REF 에 10자 SHA 를 셋팅.
       SHA 가 있으면 immutable URL 로 데이터도 fetch → 캐시 꼬임 0.
       부트스트랩이 fallback 한 경우(@main/@staging) 도 그대로 따라감. */
    if (window.HELIX_REF) return window.HELIX_REF;
    return /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  }

  function doctorUrl(group, slug) {
    var t = Math.floor(Date.now() / 60000); /* 60s 버킷 — 브라우저 캐시 살짝 깸 */
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
           '@' + getRef() + '/seocho/doctors/data/' + group + '/' + slug + '.json?t=' + t;
  }

  function fetchDoctor(group, slug) {
    var key = group + '/' + slug;
    if (doctorCache[key]) return doctorCache[key];
    /* card-render.js 가 미리 받아둔 번들에 있으면 즉시 반환 (네트워크 0회) */
    var shared = window.HELIX_DOCTOR_CACHE && window.HELIX_DOCTOR_CACHE[key];
    if (shared) { doctorCache[key] = shared; return shared; }
    var bundle = window.HELIX_DOCTOR_BUNDLE;
    if (bundle && bundle.groups && bundle.groups[group] &&
        bundle.groups[group].doctors && bundle.groups[group].doctors[slug]) {
      var p0 = Promise.resolve(bundle.groups[group].doctors[slug]);
      doctorCache[key] = p0;
      return p0;
    }
    var url = doctorUrl(group, slug);
    log('fetching', key, url);
    var p = fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (!d || typeof d !== 'object') throw new Error('expected object');
        log('loaded', key, d.name);
        return d;
      })
      .catch(function (err) {
        warn('load failed:', key, err && err.message);
        delete doctorCache[key]; /* 재시도 가능하도록 캐시 무효화 */
        return null;
      });
    doctorCache[key] = p;
    return p;
  }

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'helix-doctor-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'helix-doctor-modal-name');
    modalEl.innerHTML =
      '<div class="helix-doctor-modal_backdrop" data-modal-close="1" aria-hidden="true"></div>' +
      '<div class="helix-doctor-modal_panel" role="document">' +
        '<button type="button" class="helix-doctor-modal_close" aria-label="닫기" data-modal-close="1">×</button>' +
        '<div class="helix-doctor-modal_header">' +
          '<div class="helix-doctor-modal_photo-wrap">' +
            '<img class="helix-doctor-modal_photo" alt="" loading="eager" decoding="async" fetchpriority="high" />' +
          '</div>' +
          '<div class="helix-doctor-modal_meta">' +
            '<div class="helix-doctor-modal_title"></div>' +
            '<h2 class="helix-doctor-modal_name" id="helix-doctor-modal-name"></h2>' +
            '<div class="helix-doctor-modal_intro"></div>' +
          '</div>' +
        '</div>' +
        '<div class="helix-doctor-modal_body"></div>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-modal-close]')) close();
    });
    return modalEl;
  }

  function buildSection(title, items) {
    if (!Array.isArray(items) || !items.length) return null;
    var sec = document.createElement('section');
    sec.className = 'helix-doctor-modal_section';
    var h = document.createElement('h3');
    h.textContent = title;
    var ul = document.createElement('ul');
    items.forEach(function (s) {
      if (s == null) return;
      var li = document.createElement('li');
      li.textContent = String(s); /* HTML 회피 — XSS 방지 */
      ul.appendChild(li);
    });
    if (!ul.childNodes.length) return null;
    sec.appendChild(h);
    sec.appendChild(ul);
    return sec;
  }

  /* Webflow CDN (cdn.prod.website-files.com 등) 은 ?w=N 리사이즈 지원.
     원본이 수 MB 인 사진을 240px 슬롯에 그대로 받으면 모달 뜬 뒤 사진 자리가
     한참 빈 채로 남는 문제 해결용. 다른 도메인은 그대로 통과. */
  function sizedPhoto(url) {
    if (!url || typeof url !== 'string') return url;
    if (!/website-files\.com|webflow\.com/i.test(url)) return url;
    if (/[?&]w=\d+/.test(url)) return url; /* 이미 사이즈 지정돼 있음 */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(240 * dpr); /* 슬롯 120px × 2 retina */
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'w=' + w;
  }

  function render(data) {
    var m = ensureModal();
    var panel = m.querySelector('.helix-doctor-modal_panel');
    var img = m.querySelector('.helix-doctor-modal_photo');
    /* 사진은 선택. 빈 값이면 photo-wrap 통째로 숨겨 헤더가 텍스트만으로
       자연스럽게 정렬되게 함 (회색 빈 박스 보이는 사고 방지). */
    if (data.photo) {
      img.src = sizedPhoto(data.photo);
      img.alt = data.name || '';
      panel.classList.remove('has-no-photo');
    } else {
      img.removeAttribute('src');
      img.alt = '';
      panel.classList.add('has-no-photo');
    }
    m.querySelector('.helix-doctor-modal_title').textContent = data.title || '';
    m.querySelector('.helix-doctor-modal_name').textContent  = data.name  || '';
    m.querySelector('.helix-doctor-modal_intro').textContent = data.intro || '';

    var body = m.querySelector('.helix-doctor-modal_body');
    body.innerHTML = '';
    /* 섹션 라벨 → 데이터 키. 키가 없거나 빈 배열이면 그 섹션 자동 생략. */
    var sections = [
      ['학력',       data.education],
      ['경력',       data.career],
      ['세부 진료',  data.specialty],
      ['학회 / 자격', data.memberships],
      ['학술 활동',  data.activities],
      ['강의',       data.lectures],
      ['논문 / 저서', data.publications]
    ];
    sections.forEach(function (pair) {
      var sec = buildSection(pair[0], pair[1]);
      if (sec) body.appendChild(sec);
    });

    /* 패널 스크롤 위치 초기화 — 직전에 다른 의료진 열어 스크롤 내려둔 경우 보정 */
    var panel = m.querySelector('.helix-doctor-modal_panel');
    if (panel) panel.scrollTop = 0;
  }

  function open(data) {
    var m = ensureModal();
    render(data);
    lastFocus = document.activeElement;
    document.documentElement.classList.add('helix-doctor-modal-open');
    document.body.classList.add('helix-doctor-modal-open');
    /* display:none → flex 토글 후 다음 프레임에 .is-open 부여해야
       opacity / transform 트랜지션이 정상 발사. */
    m.style.display = 'flex';
    requestAnimationFrame(function () {
      m.classList.add('is-open');
      var closeBtn = m.querySelector('.helix-doctor-modal_close');
      if (closeBtn) {
        try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); }
      }
    });
  }

  function close() {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;
    modalEl.classList.remove('is-open');
    document.documentElement.classList.remove('helix-doctor-modal-open');
    document.body.classList.remove('helix-doctor-modal-open');
    /* 트랜지션 끝난 뒤 display:none 으로 복귀 — 백그라운드 인터랙션 차단 해제 */
    setTimeout(function () {
      if (modalEl && !modalEl.classList.contains('is-open')) {
        modalEl.style.display = '';
      }
    }, 320);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
    lastFocus = null;
  }

  /* ── ESC 닫기 ─────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
      e.preventDefault();
      close();
    }
  });

  /* ── 클릭한 버튼이 속한 카드의 의료진 한글 이름 ──────────────
     카드 이름 요소는 데스크탑 .text-block-29 / 모바일 .name_m1
     (card-render.js 의 매핑과 동일). 버튼에서 위로 한 단계씩 올라가며
     찾되, 이름 요소가 2개 이상 잡히는 조상은 카드 경계를 넘어선 것
     (여러 카드를 감싼 리스트)이므로 그 순간 포기한다 — 안 그러면 남의
     이름이 붙는다. 못 찾으면 빈 문자열, slug 는 그대로 남으므로 무해. */
  function doctorNameNear(trigger) {
    var node = trigger;
    for (var i = 0; i < 6 && node; i++) {
      if (node.querySelectorAll) {
        var hits = node.querySelectorAll('.text-block-29, .name_m1');
        if (hits.length > 1) return '';            /* 카드 밖까지 올라옴 */
        if (hits.length === 1) {
          var t = (hits[0].innerText || hits[0].textContent || '').trim();
          if (t) return t;
        }
      }
      node = node.parentElement;
    }
    return '';
  }

  /* ── 클릭 위임: 페이지에 동적으로 카드 추가돼도 자동 대응 ─── */
  document.addEventListener('click', function (e) {
    var trigger = e.target && e.target.closest && e.target.closest('[data-doctor-open]');
    if (!trigger) return;

    var raw = trigger.getAttribute('data-doctor-open') || '';
    if (!raw) return;
    e.preventDefault();

    var group = trigger.getAttribute('data-doctor-group');
    var slug  = raw;

    /* 결합형 지원: data-doctor-open="im-1/gimtaeseong" */
    if (!group && raw.indexOf('/') >= 0) {
      var parts = raw.split('/');
      group = parts[0];
      slug  = parts.slice(1).join('/');
    }

    /* 부모 컨테이너에서 그룹 찾기 (CMS Collection List 컨테이너 패턴) */
    if (!group) {
      var groupHost = trigger.closest('[data-doctor-group]');
      if (groupHost) group = groupHost.getAttribute('data-doctor-group');
    }

    if (!group) {
      warn('no group resolved for slug:', slug, '— add data-doctor-group on button or ancestor');
      return;
    }
    if (!slug) {
      warn('no slug after parsing:', raw);
      return;
    }

    log('click open', group + '/' + slug);

    /* GA4 — 의료진 상세보기(+) 클릭. 어느 분과(group) 의 누구(slug) 를 열었는지
       집계. 모달만 열리고 페이지 이동은 없어 일반 gtag 로 충분. */
    (function () {
      var device = window.innerWidth <= 767 ? 'mobile' : 'desktop';
      var payload = {
        item_type: 'doctor_detail_open',
        branch: '서초',
        device: device,
        group: group,
        slug: slug,
        /* 한글 이름도 같이 — slug 만 보내면 시트에서 'gimtaeseong' 처럼 찍혀
           누구인지 바로 안 보인다. 상세 데이터(fetchDoctor)는 이 시점엔 아직
           안 왔으므로, 이미 화면에 그려져 있는 카드의 이름 텍스트를 읽는다. */
        doctor: doctorNameNear(trigger)
      };
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'seocho_doctor_detail_' + device, payload);
        } else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
          payload.event = 'seocho_doctor_detail_' + device;
          window.dataLayer.push(payload);
        }
      } catch (e) {}
    })();

    fetchDoctor(group, slug).then(function (data) {
      if (!data) {
        /* 그래도 모달은 열어서 "정보 없음" 표시 — 빈 화면 보고 당황 안 하도록.
           파일 자체가 없거나(404) 네트워크 실패 모두 동일 처리. */
        data = {
          name: slug,
          title: '',
          intro: '상세 정보 준비 중입니다.'
        };
      }
      open(data);
    });
  });

  log('ready (ref=' + getRef() + ')');
})();
