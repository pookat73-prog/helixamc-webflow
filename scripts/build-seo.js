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

/* ===================== 빌드 ===================== */

const ROOT = path.resolve(__dirname, '..');
const DOCTORS_JSON = path.join(ROOT, 'seocho', 'doctors', 'data', '_all.json');
const EMERGENCY_DIR = path.join(ROOT, 'emergency', 'data');
const OUT_DIR = path.join(ROOT, 'seo-snippets');

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
  return {
    '@type': 'PostalAddress',
    streetAddress: addr.streetAddress,
    addressLocality: addr.addressLocality,
    addressRegion: addr.addressRegion,
    postalCode: addr.postalCode,
    addressCountry: addr.addressCountry,
  };
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

/* ===================== 실행 ===================== */

function main() {
  const doctors = loadDoctors();
  const conditions = loadEmergencyConditions();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const pages = {
    'home.html':              buildHome(),
    'discover-helix.html':    buildAbout(),
    'seocho.html':            buildSeocho(doctors),
    'symptoms.html':          buildEmergency(conditions),
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
  console.log(`\n총 의료진 ${doctors.length}명 · 응급증상 ${conditions.length}건 처리됨.`);
}

main();
