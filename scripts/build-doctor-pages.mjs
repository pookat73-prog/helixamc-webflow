import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = join(ROOT, 'seocho/doctors/data');
export const GROUPS = [
  ['im-1', '내과'], ['im-2', '내과'], ['sr-1', '외과'], ['sr-2', '외과'],
  ['di-1', '영상의학과'], ['di-2', '영상의학과'], ['di-3', '영상의학과'],
  ['is-1', '인터벤션 센터'], ['op', '안과·치과'], ['gp-2', '진료과'], ['em-1', '응급의학과']
];
export const SECTIONS = [
  ['education', '학력'], ['career', '경력'], ['specialty', '세부 진료'],
  ['memberships', '학회 / 자격'], ['activities', '학술 활동'], ['lectures', '강의'], ['publications', '논문 / 저서']
];
export const ASSETS = [
  'global/measure-gate.js', 'global/ga4-base.js', 'global/session.js',
  'global/ga-inspector.js', 'global/sheet-log.js', 'global/scroll-depth.js', 'global/page-time.js'
];
export function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function readDoctors(dataDir = DATA) {
  const doctors = [], seen = new Set(), inputs = [];
  const read = name => {
    const raw = readFileSync(join(dataDir, name), 'utf8');
    inputs.push([name, raw]);
    return JSON.parse(raw);
  };
  for (const name of readdirSync(dataDir, {withFileTypes:true}).filter(d => d.isDirectory()).map(d => d.name)) {
    if (!GROUPS.some(([g]) => g === name)) throw new Error('분과 매핑 미확인: ' + name);
  }
  for (const [group, department] of GROUPS) {
    const index = read(group + '/_index.json');
    if (!Array.isArray(index)) throw new Error('공개 목록이 배열이 아님: ' + group);
    for (const entry of index) {
      if (entry.draft) continue;
      const slug = entry.slug;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') || seen.has(slug)) throw new Error('잘못되거나 중복된 slug: ' + slug);
      seen.add(slug);
      const doctor = read(group + '/' + slug + '.json');
      if (doctor.slug !== slug || !doctor.name?.trim()) throw new Error('의료진 연결 불일치: ' + slug);
      for (const [key] of SECTIONS) {
        if (doctor[key] !== undefined && (!Array.isArray(doctor[key]) || doctor[key].some(v => typeof v !== 'string'))) {
          throw new Error('이력 배열 형식 오류: ' + slug + '/' + key);
        }
      }
      doctors.push({group, department, doctor, path:'/doctors/' + slug});
    }
  }
  return {doctors, sourceHash:createHash('sha256').update(JSON.stringify(inputs)).digest('hex')};
}
export function directory(doctors) {
  return `<nav id="medical-team" class="helix-doctor-directory" aria-label="의료진별 전체 이력" data-doctor-directory>\n<h2>의료진별 전체 이력</h2>\n<ul>\n${doctors.map(({doctor:d, path}) => `<li><a href="${path}">${escape(d.name)}${d.title ? ' ' + escape(d.title) : ''}</a></li>`).join('\n')}\n</ul>\n</nav>`;
}
export function profileBody({doctor:d, group, department}, sourceHash) {
  const photo = d.photo ? `<div class="helix-doctor-modal_photo-wrap"><img class="helix-doctor-modal_photo" src="${escape(d.photo)}" alt="${escape([d.name,d.title].filter(Boolean).join(' '))}" width="120" height="120" decoding="async"></div>` : '';
  const sections = SECTIONS.filter(([key]) => d[key]?.length).map(([key,label]) => `<section class="helix-doctor-modal_section"><h2>${label}</h2><ul>${d[key].map(v => `<li>${escape(v)}</li>`).join('')}</ul></section>`).join('\n');
  return `<main class="helix-doctor-detail" data-doctor-detail data-doctor-slug="${escape(d.slug)}" data-doctor-name="${escape(d.name)}" data-doctor-group="${group}" data-doctor-source="${sourceHash}">
<a class="helix-doctor-detail_brand" href="/">헬릭스동물메디컬센터</a>
<nav class="helix-doctor-detail_breadcrumb" aria-label="현재 위치"><a href="/seocho">서초 본원</a><span aria-hidden="true">/</span><a href="/seocho#medical-team">의료진 안내</a><span aria-hidden="true">/</span><b aria-current="page">${escape(d.name)}</b></nav>
<article class="helix-doctor-detail_article">
<header class="helix-doctor-modal_header">${photo}<div class="helix-doctor-modal_meta">${d.title ? `<p class="helix-doctor-modal_title">${escape(d.title)}</p>` : ''}<h1 class="helix-doctor-modal_name">${escape(d.name)}</h1><p class="helix-doctor-detail_department">서초 본원 · ${escape(department)}</p></div></header>
${sections}
<footer class="helix-doctor-detail_back"><a class="helix-doctor-history-link" href="/seocho#medical-team">← 서초 의료진 안내로 돌아가기</a></footer>
</article></main>`;
}
export function build({outDir='/tmp/helix-doctor-preview', origin='https://helix-amc.com', assetRef=null} = {}) {
  if (!/^https:\/\/(www\.)?helix-amc\.com$/.test(origin)) throw new Error('확인 대상 대표 도메인만 허용');
  if (assetRef && !/^[0-9a-f]{40}$/.test(assetRef)) throw new Error('배포 자산은 전체 커밋 SHA 필요');
  outDir = resolve(outDir);
  if (outDir === ROOT || outDir.startsWith(DATA + '/')) throw new Error('원본 디렉터리에 출력할 수 없음');
  const {doctors, sourceHash} = readDoctors();
  // 재생성 때 삭제/휴직 처리된 페이지가 출력 폴더에 남는 것을 막는다.
  const oldManifest = join(outDir, 'manifest.json');
  if (existsSync(oldManifest)) {
    for (const old of JSON.parse(readFileSync(oldManifest)).pages || []) {
      if (/^\/doctors\/[a-z0-9-]+$/.test(old.path)) {
        rmSync(join(outDir, old.path.slice(1) + '.html'), {force:true});
        rmSync(join(outDir, 'fragments', old.path.split('/').pop() + '.html'), {force:true});
      }
    }
  }
  mkdirSync(join(outDir,'doctors'), {recursive:true});
  mkdirSync(join(outDir,'fragments'), {recursive:true});
  const base = assetRef ? `https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@${assetRef}/` : '/';
  const asset = path => base + path;
  const css = `<link rel="stylesheet" href="${asset('seocho/doctors/modal.css')}">`;
  const scripts = assetRef ? ASSETS.map(path => `<script defer src="${asset(path)}"></script>`).join('\n') : '';
  const manifest = {version:1, mode:assetRef ? 'release-candidate' : 'local-preview', origin, assetRef,
    sourceHash,
    cms:false, published:false, canonicalVerified:false, pages:[]};
  for (const item of doctors) {
    const {doctor:d, path, department} = item;
    const title = `${d.name}${d.title ? ' ' + d.title : ''} · ${department} | 헬릭스동물메디컬센터 서초 본원`;
    const description = `${d.name}${d.title ? ' ' + d.title : ''}의 소속 분과와 학력·이력 안내. 헬릭스동물메디컬센터 서초 본원 ${department}.`;
    const head = `<title>${escape(title)}</title>\n<meta name="description" content="${escape(description)}">\n<link rel="canonical" href="${origin + path}">\n<meta property="og:url" content="${origin + path}">\n<meta property="og:title" content="${escape(title)}">\n<meta property="og:description" content="${escape(description)}">\n${css}\n${scripts}`;
    const body = profileBody(item, sourceHash);
    writeFileSync(join(outDir,path.slice(1)+'.html'), `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n${head}</head><body>${body}</body></html>\n`);
    writeFileSync(join(outDir,'fragments',d.slug+'.html'),body+'\n');
    manifest.pages.push({slug:d.slug, name:d.name, group:item.group, path, title, description, canonical:origin+path, includeInSitemap:true, head, body});
  }
  writeFileSync(join(outDir,'fragments/seocho-links.html'),directory(doctors)+'\n');
  writeFileSync(join(outDir,'404.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>페이지를 찾을 수 없습니다 | 헬릭스</title>${css}</head><body><main class="helix-doctor-detail"><h1>페이지를 찾을 수 없습니다</h1><a href="/seocho#medical-team">서초 의료진 안내로 돌아가기</a></main></body></html>`);
  writeFileSync(join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = key => { const i=args.indexOf(key); return i<0 ? undefined : args[i+1]; };
  const m = build({outDir:option('--out'),origin:option('--origin'),assetRef:option('--asset-ref')});
  console.log(`의료진 ${m.pages.length}명 정적 HTML 생성 · ${m.mode} · ${m.sourceHash.slice(0,12)} · 외부 변경 없음`);
}
