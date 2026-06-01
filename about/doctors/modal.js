/* ================================================================
   HELIX AMC — 의료진 상세 모달 (about/doctors/modal.js)
   ----------------------------------------------------------------
   사용법 (Webflow 측):
     의료진 프로필 카드 컴포넌트 안의 "상세보기" 버튼에 다음 속성:
       data-doctor-open="<slug>"          (필수)
       data-doctor-group="<group-id>"     (선택, 카드 부모 컨테이너에
                                           data-doctor-group 이 있으면 생략 가능)

     또는 결합형:
       data-doctor-open="<group>/<slug>"

   데이터 위치:
     about/doctors/data/<group>.json
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

  /* group → Promise<{slug: data}> 캐시. 같은 그룹 두 번째 클릭부터 즉시 응답. */
  var groupCache = {};
  var modalEl = null;
  var lastFocus = null;

  function getRef() {
    /* about/bootstrap.js 가 fetch 후 window.HELIX_REF 에 10자 SHA 를 셋팅.
       SHA 가 있으면 immutable URL 로 데이터도 fetch → 캐시 꼬임 0.
       부트스트랩이 fallback 한 경우(@main/@staging) 도 그대로 따라감. */
    if (window.HELIX_REF) return window.HELIX_REF;
    return /\.webflow\.io$/i.test(location.hostname) ? 'staging' : 'main';
  }

  function dataUrl(group) {
    var t = Math.floor(Date.now() / 60000); /* 60s 버킷 — 브라우저 캐시 살짝 깸 */
    return 'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO +
           '@' + getRef() + '/about/doctors/data/' + group + '.json?t=' + t;
  }

  function fetchGroup(group) {
    if (groupCache[group]) return groupCache[group];
    var url = dataUrl(group);
    log('fetching group', group, url);
    var p = fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (arr) {
        if (!Array.isArray(arr)) throw new Error('expected array');
        var map = {};
        arr.forEach(function (d) {
          if (d && typeof d.slug === 'string') map[d.slug] = d;
        });
        log('group loaded', group, 'count=' + Object.keys(map).length);
        return map;
      })
      .catch(function (err) {
        warn('group load failed:', group, err && err.message);
        delete groupCache[group]; /* 재시도 가능하도록 캐시 무효화 */
        return {};
      });
    groupCache[group] = p;
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
            '<img class="helix-doctor-modal_photo" alt="" />' +
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

  function render(data) {
    var m = ensureModal();
    var img = m.querySelector('.helix-doctor-modal_photo');
    if (data.photo) {
      img.src = data.photo;
      img.alt = data.name || '';
    } else {
      img.removeAttribute('src');
      img.alt = '';
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
    fetchGroup(group).then(function (map) {
      var data = map[slug];
      if (!data) {
        warn('slug not found in group:', group, slug, '— available:', Object.keys(map));
        /* 그래도 모달은 열어서 "정보 없음" 표시 — 사용자가 빈 화면 보고 당황 안 하도록 */
        data = { name: slug, title: '', intro: '상세 정보 준비 중입니다.' };
      }
      open(data);
    });
  });

  log('ready (ref=' + getRef() + ')');
})();
