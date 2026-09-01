#!/usr/bin/env node
/* ================================================================
   페이지별 JSON-LD 구조화 데이터 (schema.org) 스니펫 생성기.

   입력: seocho/doctors/data/_all.json + 본 파일 상단의 HOSPITAL 상수
   출력: seo-snippets/<page>.html — 각각 `<script type="application/ld+json">`
         블록 + 숨김 폴백 텍스트.

   사용법:
     1) HOSPITAL 상수에서 변경 필요한 값 수정 (주소·시간·SNS 등)
     2) node scripts/build-seo.js
     3) seo-snippets/<page>.html 파일 내용을
        Webflow Designer → 해당 페이지 → Settings → Custom Code
        → Inside <head> tag 에 붙여넣기 → Publish

   대상 페이지:
     - home.html         → /
     - discover-helix.html → /discover-helix
     - seocho.html  → /seocho (의료진 24명 + 시설 — 핵심)
     - symptoms.html → /symptoms (응급증상, WIP)

   데이터 갱신 시 본 스크립트 재실행 → 변경된 페이지만 다시 복붙.
   ================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

/* ===================== 병원 정보 (수정 가능) ===================== */
const HOSPITAL = {
  nameKo: '헬릭스동물메디컬센터',
  nameEn: 'Helix Animal Medical Center',
  shortName: '헬릭스',
  origin: 'https://helix-amc.com',
  logo: 'https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/69d0b230b02c89db7a384990_%EC%9E%90%EC%82%B0%2025DVql.png',
  email: 'schelix@naver.com',
  phone: '+82-2-2135-9119',
  phoneDisplay: '02-2135-9119',
  representativeDirector: '황정연',
  sameAs: [
    'https://www.instagram.com/helix_amc/',
    'https://blog.naver.com/helix_amc',
    'https://map.naver.com/p/entry/place/36786130',
  ],
  /* 인증 */
  certifications: [
    { name: 'AAHA-KVMA 공동 인증 병원', issuer: 'AAHA · KVMA', year: null /* TODO */ },
  ],
};

/* 서초본원 — VeterinaryCare (LocalBusiness) */
const SEOCHO_BRANCH = {
  branchId: 'seocho',
  branchNameKo: '서초 본원',
  url: HOSPITAL.origin + '/seocho',
  address: {
    streetAddress: '신반포로 162, 르본시티 2층',
    addressLocality: '서초구',
    addressRegion: '서울특별시',
    postalCode: '06546',
    addressCountry: 'KR',
  },
  geo: null /* { lat: 37.xxxx, lng: 127.xxxx } — 알려주시면 추가 */,
  /* 진료시간 — 외래 09:00~21:00, 응급 21:00~익일09:00 (사실상 24h) */
  openingHours: [
    { dayOfWeek: ['Mo','Tu','We','Th','Fr','Sa','Su'], opens: '00:00', closes: '23:59', name: '연중무휴 24시간 (외래 09:00~21:00 / 야간응급 21:00~09:00)' },
  ],
  departments: [
    { id: 'im', nameKo: '내과', nameEn: 'Internal Medicine', groups: ['im-1','im-2'] },
    { id: 'sr', nameKo: '외과', nameEn: 'Surgery', groups: ['sr-1','sr-2'] },
    { id: 'di', nameKo: '영상의학과', nameEn: 'Diagnostic Imaging', groups: ['di-1','di-2','di-3'] },
    { id: 'is', nameKo: '인터벤션 센터', nameEn: 'Interventional Radiology', groups: ['is-1'] },
    { id: 'op', nameKo: '안과·치과', nameEn: 'Ophthalmology & Dentistry', groups: ['op'] },
    { id: 'em', nameKo: '응급의학과', nameEn: 'Emergency Medicine', groups: ['em-1'] },
    { id: 'gp', nameKo: '일반진료', nameEn: 'General Practice', groups: ['gp-2'] },
  ],
};

/* 일산 분원 — VeterinaryCare (LocalBusiness)

   ⚠️ 아래 세 가지는 **일부러 비워 뒀다.** 확정되기 전에 채우지 말 것.

   openingHours   일산 진료시간 미정. 지금 페이지에 적힌 시간은 서초 페이지를
                  복제하면서 딸려온 값이라 사실 확인 전이다. 틀린 진료시간을
                  구글에 보내면 새벽에 차 몰고 온 보호자가 닫힌 문 앞에 선다.
                  → 확정되면 SEOCHO_BRANCH.openingHours 와 같은 형태로 채운다.
   certifications 일산은 AAHA 인증 지점이 아니다(확인 완료). 병원 공통
                  인증(HOSPITAL.certifications)을 여기에 얹지 말 것.
   employee       일산 의료진은 인스타 공지로 안내할 예정이라 명단이 없다.
                  서초 의료진(_all.json)을 끌어다 쓰면 없는 사람이 이 지점에
                  있다고 구글에 알리는 셈이 된다. */
const ILSAN_BRANCH = {
  branchId: 'ilsan',
  branchNameKo: '일산 분원',
  url: HOSPITAL.origin + '/ilsan',
  phone: '+82-31-978-7575',
  phoneDisplay: '031-978-7575',
  address: {
    streetAddress: '중앙로 439',
    addressLocality: '고양시 덕양구',
    addressRegion: '경기도',
    postalCode: null /* 알려주시면 추가 */,
    addressCountry: 'KR',
  },
  geo: null /* 좌표 미지정 — 지도는 주소로 찾아간다(seocho.js 지오코딩 폴백) */,
  openingHours: null /* 위 주석 참고 — 미정 */,
  /* 네이버 지도 업체 페이지 (일산). 서초와 다른 번호다. */
  naverPlace: 'https://map.naver.com/p/entry/place/83218352',
};

/* ===================== 빌드 ===================== */

const ROOT = path.resolve(__dirname, '..');
const DOCTORS_JSON = path.join(ROOT, 'seocho', 'doctors', 'data', '_all.json');
const EMERGENCY_DIR = path.join(ROOT, 'emergency', 'data');
const FAQ_JSON = path.join(ROOT, 'faq', 'data', 'faq.json');
const OUT_DIR = path.join(ROOT, 'seo-snippets');

function loadFaq() {
  if (!fs.existsSync(FAQ_JSON)) return { disease: [], general: [] };
  const d = JSON.parse(fs.readFileSync(FAQ_JSON, 'utf8'));
  return { disease: d.disease || [], general: d.general || [] };
}

function loadEmergencyConditions() {
  if (!fs.existsSync(EMERGENCY_DIR)) return [];
  const files = fs.readdirSync(EMERGENCY_DIR).filter(f => f.endsWith('.json')).sort();
  return files.map(f => {
    const slug = f.replace(/\.json$/, '');
    const d = JSON.parse(fs.readFileSync(path.join(EMERGENCY_DIR, f), 'utf8'));
    return { slug, ...d };
  });
}

function loadDoctors() {
  const data = JSON.parse(fs.readFileSync(DOCTORS_JSON, 'utf8'));
  const flat = [];
  for (const [groupId, group] of Object.entries(data.groups || {})) {
    for (const slug of (group.order || [])) {
      const d = group.doctors && group.doctors[slug];
      if (d) flat.push({ ...d, _group: groupId });
    }
  }
  return flat;
}

function groupToDepartment(groupId) {
  return SEOCHO_BRANCH.departments.find(d => d.groups.includes(groupId)) || null;
}

function postalAddress(addr) {
  /* 값이 없는 칸은 아예 빼고 낸다. 빈 문자열/null 을 그대로 실으면 구글이
     "우편번호가 비어 있다" 로 읽는다 (일산 우편번호가 아직 미확인). */
  const out = { '@type': 'PostalAddress' };
  for (const k of ['streetAddress','addressLocality','addressRegion','postalCode','addressCountry']) {
    if (addr[k]) out[k] = addr[k];
  }
  return out;
}

function openingHoursSpec(hours) {
  return hours.map(h => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.dayOfWeek.map(d => ({
      Mo: 'https://schema.org/Monday', Tu: 'https://schema.org/Tuesday',
      We: 'https://schema.org/Wednesday', Th: 'https://schema.org/Thursday',
      Fr: 'https://schema.org/Friday', Sa: 'https://schema.org/Saturday',
      Su: 'https://schema.org/Sunday',
    }[d])),
    opens: h.opens,
    closes: h.closes,
    ...(h.name ? { name: h.name } : {}),
  }));
}

function physicianNode(doc) {
  const dept = groupToDepartment(doc._group);
  const isTechnician = /방사선사/.test(doc.title || '');
  const type = isTechnician ? 'Person' : 'Physician';
  const node = {
    '@type': type,
    '@id': `${SEOCHO_BRANCH.url}#doctor-${doc.slug}`,
    name: doc.name,
    jobTitle: doc.title,
    worksFor: { '@id': `${HOSPITAL.origin}/#org` },
    affiliation: { '@id': `${SEOCHO_BRANCH.url}#branch` },
  };
  if (doc.photo) node.image = doc.photo;
  if (dept) node.medicalSpecialty = dept.nameEn;
  if (Array.isArray(doc.education) && doc.education.length) {
    node.alumniOf = doc.education.map(e => ({ '@type': 'EducationalOrganization', name: e }));
  }
  if (Array.isArray(doc.memberships) && doc.memberships.length) {
    node.memberOf = doc.memberships.map(m => ({ '@type': 'Organization', name: m }));
  }
  const desc = [];
  if (Array.isArray(doc.career) && doc.career.length) desc.push('경력: ' + doc.career.join(' · '));
  if (Array.isArray(doc.activities) && doc.activities.length) desc.push('학술활동: ' + doc.activities.join(' · '));
  if (Array.isArray(doc.publications) && doc.publications.length) desc.push('논문: ' + doc.publications.join(' · '));
  if (Array.isArray(doc.lectures) && doc.lectures.length) desc.push('강의: ' + doc.lectures.join(' · '));
  if (desc.length) node.description = desc.join(' / ');
  return node;
}

function fallbackHtmlBlock(title, items) {
  const lis = items.map(t => `<li>${escapeHtml(t)}</li>`).join('');
  return `<div hidden aria-hidden="true" data-seo-fallback>
  <h2>${escapeHtml(title)}</h2>
  <ul>${lis}</ul>
</div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function wrapJsonLd(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  };
}

/* ===================== 페이지별 빌더 ===================== */

function buildHome() {
  const graph = [
    {
      '@type': 'MedicalOrganization',
      '@id': `${HOSPITAL.origin}/#org`,
      name: HOSPITAL.nameKo,
      alternateName: HOSPITAL.nameEn,
      url: HOSPITAL.origin,
      logo: HOSPITAL.logo,
      image: HOSPITAL.logo,
      telephone: HOSPITAL.phone,
      email: HOSPITAL.email,
      address: postalAddress(SEOCHO_BRANCH.address),
      sameAs: HOSPITAL.sameAs,
      medicalSpecialty: SEOCHO_BRANCH.departments.map(d => d.nameEn),
      department: SEOCHO_BRANCH.departments.map(d => ({
        '@type': 'MedicalSpecialty',
        name: d.nameKo,
        alternateName: d.nameEn,
      })),
      hasCredential: HOSPITAL.certifications.map(c => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'certification',
        name: c.name,
        recognizedBy: { '@type': 'Organization', name: c.issuer },
        ...(c.year ? { dateCreated: String(c.year) } : {}),
      })),
    },
    {
      '@type': 'WebSite',
      '@id': `${HOSPITAL.origin}/#website`,
      url: HOSPITAL.origin,
      name: HOSPITAL.nameKo,
      inLanguage: 'ko',
      publisher: { '@id': `${HOSPITAL.origin}/#org` },
    },
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': graph };
  const fallback = fallbackHtmlBlock('헬릭스동물메디컬센터 안내', [
    `상호: ${HOSPITAL.nameKo} (${HOSPITAL.nameEn})`,
    `대표원장: ${HOSPITAL.representativeDirector}`,
    `대표전화: ${HOSPITAL.phoneDisplay}`,
    `이메일: ${HOSPITAL.email}`,
    `주소: ${SEOCHO_BRANCH.address.addressRegion} ${SEOCHO_BRANCH.address.addressLocality} ${SEOCHO_BRANCH.address.streetAddress} (${SEOCHO_BRANCH.address.postalCode})`,
    `진료과: ${SEOCHO_BRANCH.departments.map(d=>d.nameKo).join(' · ')}`,
    `인증: ${HOSPITAL.certifications.map(c=>c.name).join(', ')}`,
    `진료시간: 외래 09:00~21:00 · 야간응급 21:00~익일 09:00 (연중무휴 24시간)`,
  ]);
  return wrapJsonLd(jsonld) + '\n' + fallback;
}

function buildAbout() {
  const url = HOSPITAL.origin + '/discover-helix';
  const graph = [
    {
      '@type': 'AboutPage',
      '@id': url + '#page',
      url,
      name: '헬릭스동물메디컬센터 소개',
      inLanguage: 'ko',
      mainEntity: { '@id': `${HOSPITAL.origin}/#org` },
      isPartOf: { '@id': `${HOSPITAL.origin}/#website` },
    },
    {
      '@type': 'MedicalOrganization',
      '@id': `${HOSPITAL.origin}/#org`,
      name: HOSPITAL.nameKo,
      alternateName: HOSPITAL.nameEn,
      url: HOSPITAL.origin,
      logo: HOSPITAL.logo,
      telephone: HOSPITAL.phone,
      email: HOSPITAL.email,
      address: postalAddress(SEOCHO_BRANCH.address),
      sameAs: HOSPITAL.sameAs,
      founder: { '@type': 'Person', name: HOSPITAL.representativeDirector },
      employee: { '@type': 'Person', name: HOSPITAL.representativeDirector, jobTitle: '대표원장' },
      hasCredential: HOSPITAL.certifications.map(c => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'certification',
        name: c.name,
        recognizedBy: { '@type': 'Organization', name: c.issuer },
        ...(c.year ? { dateCreated: String(c.year) } : {}),
      })),
    },
    breadcrumb([
      { name: '홈', url: HOSPITAL.origin },
      { name: '헬릭스 소개', url },
    ]),
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': graph };
  const fallback = fallbackHtmlBlock('헬릭스 소개', [
    `${HOSPITAL.nameKo} (${HOSPITAL.nameEn})`,
    `대표원장: ${HOSPITAL.representativeDirector}`,
    `인증: ${HOSPITAL.certifications.map(c=>c.name).join(', ')}`,
    `진료과: ${SEOCHO_BRANCH.departments.map(d=>d.nameKo).join(' · ')}`,
  ]);
  return wrapJsonLd(jsonld) + '\n' + fallback;
}

function buildSeocho(doctors) {
  const url = SEOCHO_BRANCH.url;
  const branchNode = {
    '@type': 'VeterinaryCare',
    '@id': url + '#branch',
    name: `${HOSPITAL.nameKo} ${SEOCHO_BRANCH.branchNameKo}`,
    alternateName: `${HOSPITAL.nameEn} Seocho Branch`,
    url,
    logo: HOSPITAL.logo,
    image: HOSPITAL.logo,
    telephone: HOSPITAL.phone,
    email: HOSPITAL.email,
    address: postalAddress(SEOCHO_BRANCH.address),
    ...(SEOCHO_BRANCH.geo ? {
      geo: { '@type': 'GeoCoordinates', latitude: SEOCHO_BRANCH.geo.lat, longitude: SEOCHO_BRANCH.geo.lng },
    } : {}),
    openingHoursSpecification: openingHoursSpec(SEOCHO_BRANCH.openingHours),
    parentOrganization: { '@id': `${HOSPITAL.origin}/#org` },
    sameAs: HOSPITAL.sameAs,
    medicalSpecialty: SEOCHO_BRANCH.departments.map(d => d.nameEn),
    department: SEOCHO_BRANCH.departments.map(d => ({
      '@type': 'MedicalSpecialty',
      '@id': url + `#dept-${d.id}`,
      name: d.nameKo,
      alternateName: d.nameEn,
    })),
    availableService: SEOCHO_BRANCH.departments.map(d => ({
      '@type': 'MedicalProcedure', name: d.nameKo, procedureType: d.nameEn,
    })),
    hasCredential: HOSPITAL.certifications.map(c => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certification',
      name: c.name,
    })),
    employee: doctors.map(d => ({ '@id': `${url}#doctor-${d.slug}` })),
  };

  const graph = [
    branchNode,
    ...doctors.map(physicianNode),
    breadcrumb([
      { name: '홈', url: HOSPITAL.origin },
      { name: '서초 본원', url },
    ]),
    {
      '@type': 'MedicalOrganization',
      '@id': `${HOSPITAL.origin}/#org`,
      name: HOSPITAL.nameKo,
      url: HOSPITAL.origin,
      logo: HOSPITAL.logo,
    },
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': graph };

  /* 숨김 폴백 — JSON-LD 안 보는 단순 fetcher 보호용 */
  const doctorLines = doctors.map(d => {
    const dept = groupToDepartment(d._group);
    const parts = [d.name, d.title];
    if (dept) parts.push(dept.nameKo);
    if (Array.isArray(d.education) && d.education[0]) parts.push(d.education[0]);
    return parts.filter(Boolean).join(' / ');
  });
  const fallback = fallbackHtmlBlock(
    `${HOSPITAL.nameKo} ${SEOCHO_BRANCH.branchNameKo} 의료진`,
    [
      `주소: ${SEOCHO_BRANCH.address.addressRegion} ${SEOCHO_BRANCH.address.addressLocality} ${SEOCHO_BRANCH.address.streetAddress} (${SEOCHO_BRANCH.address.postalCode})`,
      `전화: ${HOSPITAL.phoneDisplay}`,
      `진료시간: 외래 09:00~21:00 · 야간응급 21:00~익일 09:00 (연중무휴 24시간)`,
      `진료과: ${SEOCHO_BRANCH.departments.map(d=>d.nameKo).join(' · ')}`,
      ...doctorLines,
    ]
  );
  return wrapJsonLd(jsonld) + '\n' + fallback;
}

function buildIlsan() {
  const B = ILSAN_BRANCH;
  const branchNode = {
    '@type': 'VeterinaryCare',
    '@id': B.url + '#branch',
    name: `${HOSPITAL.nameKo} ${B.branchNameKo}`,
    alternateName: `${HOSPITAL.nameEn} Ilsan Branch`,
    url: B.url,
    logo: HOSPITAL.logo,
    image: HOSPITAL.logo,
    telephone: B.phone,
    email: HOSPITAL.email,
    address: postalAddress(B.address),
    ...(B.geo ? {
      geo: { '@type': 'GeoCoordinates', latitude: B.geo.lat, longitude: B.geo.lng },
    } : {}),
    /* 진료시간이 확정되기 전엔 이 칸 자체를 내보내지 않는다 (위 주석 참고) */
    ...(B.openingHours ? { openingHoursSpecification: openingHoursSpec(B.openingHours) } : {}),
    parentOrganization: { '@id': `${HOSPITAL.origin}/#org` },
    /* 인스타·블로그는 병원 공통, 네이버 플레이스는 지점별로 다르다 */
    sameAs: HOSPITAL.sameAs.filter(u => !/map\.naver\.com/.test(u)).concat([B.naverPlace]),
  };

  const graph = [
    branchNode,
    breadcrumb([
      { name: '홈', url: HOSPITAL.origin },
      { name: B.branchNameKo, url: B.url },
    ]),
    {
      '@type': 'MedicalOrganization',
      '@id': `${HOSPITAL.origin}/#org`,
      name: HOSPITAL.nameKo,
      url: HOSPITAL.origin,
      logo: HOSPITAL.logo,
    },
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': graph };

  /* 숨김 폴백 — 확정된 사실만 적는다. 진료시간·인증·의료진은 넣지 않는다. */
  const a = B.address;
  const fallback = fallbackHtmlBlock(
    `${HOSPITAL.nameKo} ${B.branchNameKo}`,
    [
      `주소: ${a.addressRegion} ${a.addressLocality} ${a.streetAddress}`,
      `전화: ${B.phoneDisplay}`,
    ]
  );
  return wrapJsonLd(jsonld) + '\n' + fallback;
}

function conditionNode(url, c) {
  const node = {
    '@type': 'MedicalCondition',
    '@id': `${url}#condition-${c.slug}`,
    name: c.name,
    code: { '@type': 'MedicalCode', codingSystem: 'helix-emergency', codeValue: c.slug },
  };
  if (Array.isArray(c.highlights) && c.highlights.length) {
    node.possibleTreatment = c.highlights.map(t => ({
      '@type': 'MedicalTherapy', name: t,
    }));
  }
  if (Array.isArray(c.catNotes) && c.catNotes.length) {
    node.signOrSymptom = c.catNotes.map(s => ({
      '@type': 'MedicalSignOrSymptom', name: s,
    }));
  }
  return node;
}

function buildEmergency(conditions) {
  const url = HOSPITAL.origin + '/symptoms';
  const graph = [
    {
      '@type': 'MedicalWebPage',
      '@id': url + '#page',
      url,
      name: '응급증상 안내',
      inLanguage: 'ko',
      about: { '@id': `${HOSPITAL.origin}/#org` },
      mainContentOfPage: { '@type': 'WebPageElement', cssSelector: 'main' },
      isPartOf: { '@id': `${HOSPITAL.origin}/#website` },
      audience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
      lastReviewed: new Date().toISOString().slice(0, 10),
      mainEntity: conditions.map(c => ({ '@id': `${url}#condition-${c.slug}` })),
    },
    {
      '@type': 'EmergencyService',
      '@id': url + '#emergency',
      name: `${HOSPITAL.nameKo} ${SEOCHO_BRANCH.branchNameKo} 야간응급진료`,
      provider: { '@id': SEOCHO_BRANCH.url + '#branch' },
      telephone: HOSPITAL.phone,
      areaServed: { '@type': 'AdministrativeArea', name: '서울특별시 및 수도권' },
      hoursAvailable: [
        { '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => 'https://schema.org/' + ({Mo:'Monday',Tu:'Tuesday',We:'Wednesday',Th:'Thursday',Fr:'Friday',Sa:'Saturday',Su:'Sunday'}[d])),
          opens: '21:00', closes: '09:00',
          name: '야간응급 (외래 종료 후 다음 날 외래 시작까지)',
        },
      ],
      description: '응급진료 24시간 연중무휴 · 야간응급진료 21:00~익일 09:00 · 외래진료 09:00~21:00',
    },
    ...conditions.map(c => conditionNode(url, c)),
    breadcrumb([
      { name: '홈', url: HOSPITAL.origin },
      { name: '응급증상', url },
    ]),
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': graph };
  const fallbackItems = [
    `응급 전화: ${HOSPITAL.phoneDisplay}`,
    `야간응급: 매일 21:00 ~ 익일 09:00`,
    `외래: 매일 09:00 ~ 21:00`,
    `위치: ${SEOCHO_BRANCH.address.addressRegion} ${SEOCHO_BRANCH.address.addressLocality} ${SEOCHO_BRANCH.address.streetAddress}`,
    '',
    '응급증상 안내 (병원 도착 전 대처 요령):',
    ...conditions.map(c => {
      const sx = (c.catNotes || []).join(', ');
      const tx = (c.highlights || []).join(', ');
      return `· ${c.name}${sx ? ' — 증상: ' + sx : ''}${tx ? ' / 대처: ' + tx : ''}`;
    }),
  ];
  const fallback = fallbackHtmlBlock('야간응급 안내', fallbackItems);
  return wrapJsonLd(jsonld) + '\n' + fallback;
}

/* 진료과목(/services) — 페이지에 노출되는 5개 진료과 카드 (제목 + 설명).
   dept 상세 페이지가 발행된 경우에만 url 연결(미발행은 생략). */
const SERVICES_DEPTS = [
  { nameKo: '내과',     nameEn: 'Internal Medicine',  desc: '다양한 전신 질환을 아우르는 환자 맞춤형 진료',           slug: 'naegwa',            published: true  },
  { nameKo: '외과',     nameEn: 'Surgery',            desc: '표준화된 프로토콜로 안정성을 높인 고난도 수술',           slug: 'oegwa',             published: false },
  { nameKo: '영상의학과', nameEn: 'Diagnostic Imaging',  desc: '안전한 마취와 첨단 장비로 완성하는 정밀 진단',            slug: 'yeongsangyihaggwa', published: false },
  { nameKo: '안과',     nameEn: 'Ophthalmology',      desc: '미세 검진과 빠른 판단을 통한 전신 질환 가능성 판별',        slug: 'angwa',             published: false },
  { nameKo: '치과',     nameEn: 'Dentistry',          desc: '구조·염증·통증까지 살피는 대체 불가한 치아의 안전한 진료',   slug: 'cigwa',             published: false },
];

function buildServices() {
  const url = HOSPITAL.origin + '/services';
  const listId = url + '#dept-list';

  const graph = [
    {
      '@type': 'MedicalWebPage',
      '@id': url + '#page',
      url,
      name: '진료과목',
      inLanguage: 'ko',
      description: '헬릭스동물메디컬센터의 진료과목 안내 — 내과·외과·영상의학과·안과·치과 전문 진료.',
      about: { '@id': `${HOSPITAL.origin}/#org` },
      isPartOf: { '@id': `${HOSPITAL.origin}/#website` },
      mainEntity: { '@id': listId },
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
    {
      '@type': 'ItemList',
      '@id': listId,
      name: '진료과목',
      numberOfItems: SERVICES_DEPTS.length,
      itemListElement: SERVICES_DEPTS.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'MedicalProcedure',
          name: d.nameKo,
          alternateName: d.nameEn,
          description: d.desc,
          ...(d.published ? { url: `${HOSPITAL.origin}/${d.slug}` } : {}),
        },
      })),
    },
    breadcrumb([
      { name: '홈', url: HOSPITAL.origin },
      { name: '진료과목', url },
    ]),
    {
      '@type': 'MedicalOrganization',
      '@id': `${HOSPITAL.origin}/#org`,
      name: HOSPITAL.nameKo,
      url: HOSPITAL.origin,
      logo: HOSPITAL.logo,
      medicalSpecialty: SERVICES_DEPTS.map(d => d.nameEn),
    },
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': graph };

  const fallback = fallbackHtmlBlock('헬릭스동물메디컬센터 진료과목', [
    `${HOSPITAL.nameKo} 진료과목 안내`,
    ...SERVICES_DEPTS.map(d => `${d.nameKo}(${d.nameEn}) — ${d.desc}`),
  ]);
  return wrapJsonLd(jsonld) + '\n' + fallback;
}

function buildFaq(faq) {
  const url = HOSPITAL.origin + '/faq';

  /* 질환 FAQ: 요약(항상 노출) + 상세(펼침) 를 이어 붙여 완결된 답변으로.
     일반 FAQ: 답변 그대로. 두 목록 모두 페이지에 실제 노출되는 텍스트라
     Google FAQPage 가시성 요건 충족. */
  const diseaseQAs = (faq.disease || []).map(x => ({
    q: x.q,
    a: [x.summary, x.detail].filter(Boolean).join('\n\n'),
    id: x.id,
  }));
  const generalQAs = (faq.general || []).map(x => ({ q: x.q, a: x.a, id: x.id }));
  const allQAs = diseaseQAs.concat(generalQAs).filter(qa => qa.q && qa.a);

  const faqNode = {
    '@type': 'FAQPage',
    '@id': url + '#faqpage',
    url,
    name: '자주 묻는 질문 (FAQ)',
    inLanguage: 'ko',
    isPartOf: { '@id': `${HOSPITAL.origin}/#website` },
    about: { '@id': `${HOSPITAL.origin}/#org` },
    /* 질문마다 앵커(#id)를 달아 개별 인용·직접 링크가 가능하게 함
       (본문 페이지의 각 질문 카드에도 같은 id 를 DOM id 로 심어 둠). */
    mainEntity: allQAs.map(qa => ({
      '@type': 'Question',
      '@id': qa.id ? `${url}#${qa.id}` : undefined,
      url: qa.id ? `${url}#${qa.id}` : undefined,
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a },
    })),
  };

  const graph = [
    faqNode,
    breadcrumb([
      { name: '홈', url: HOSPITAL.origin },
      { name: '자주 묻는 질문', url },
    ]),
    {
      '@type': 'MedicalOrganization',
      '@id': `${HOSPITAL.origin}/#org`,
      name: HOSPITAL.nameKo,
      url: HOSPITAL.origin,
      logo: HOSPITAL.logo,
    },
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': graph };

  const fallback = fallbackHtmlBlock(
    `${HOSPITAL.nameKo} 자주 묻는 질문`,
    allQAs.map(qa => `Q. ${qa.q} — A. ${qa.a.replace(/\s*\n\s*/g, ' ')}`)
  );
  return wrapJsonLd(jsonld) + '\n' + fallback;
}

/* ===================== 실행 ===================== */

function main() {
  const doctors = loadDoctors();
  const conditions = loadEmergencyConditions();
  const faq = loadFaq();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const pages = {
    'home.html':              buildHome(),
    'discover-helix.html':    buildAbout(),
    'seocho.html':            buildSeocho(doctors),
    'ilsan.html':             buildIlsan(),
    'symptoms.html':          buildEmergency(conditions),
    'faq.html':               buildFaq(faq),
    'services.html':          buildServices(),
  };

  for (const [file, content] of Object.entries(pages)) {
    const header = `<!--
  자동 생성됨 — scripts/build-seo.js
  대상 페이지: /${file.replace('.html','')}
  Webflow Designer → Page Settings → Custom Code → Inside <head> tag 에 통째로 붙여넣기.
  데이터 변경 시: 본 스크립트 재실행 → 새 파일 내용으로 교체 → Publish.
-->\n`;
    fs.writeFileSync(path.join(OUT_DIR, file), header + content + '\n');
    console.log(`✓ seo-snippets/${file} (${Buffer.byteLength(content, 'utf8')} bytes)`);
  }
  const faqCount = (faq.disease || []).length + (faq.general || []).length;
  console.log(`\n총 의료진 ${doctors.length}명 · 응급증상 ${conditions.length}건 · FAQ ${faqCount}문항 처리됨.`);
}

main();
