import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function read(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`✓ ${label}`);
    return;
  }

  failures.push(detail ? `${label}: ${detail}` : label);
  console.error(`✗ ${label}`);
}

function includesAll(source, values) {
  return values.every((value) => source.includes(value));
}

function checkJavaScriptSyntax() {
  const output = execFileSync('git', ['ls-files', '-z', '--', '*.js', '*.mjs', '*.cjs'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const files = output.split('\0').filter(Boolean);
  const invalid = [];

  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      invalid.push(`${file}\n${(result.stderr || result.stdout || '').trim()}`);
    }
  }

  check(
    `추적 중인 JavaScript 문법 (${files.length}개)`,
    invalid.length === 0,
    invalid.join('\n')
  );
}

function checkAccessibilityLoaders() {
  const bootstraps = [
    'home/bootstrap.js',
    'about/bootstrap.js',
    'global/bootstrap.js',
    'seocho/bootstrap.js',
    'emergency/bootstrap.js',
    'services/bootstrap.js',
    'faq/bootstrap.js',
    'specialty/bootstrap.js'
  ];
  const missing = bootstraps.filter(
    (file) => !read(file).includes("'global/accessibility.js'")
  );

  check(
    '지원 페이지 bootstrap의 접근성 모듈 연결',
    missing.length === 0,
    `누락: ${missing.join(', ')}`
  );

  const hamburger = read('home/global/hamburger.js');
  check(
    '기존 방문자용 접근성 캐시 안전망',
    includesAll(hamburger, [
      'loadAccessibilityFallback',
      '/global/accessibility.js',
      'window.__helixAccessibilityInit'
    ])
  );

  const workflow = read('.github/workflows/webflow-deploy.yml');
  const workflowReferences = workflow.match(/global\/accessibility\.js/g) || [];
  check(
    '배포 워크플로의 접근성 파일 퍼지·예열 등록',
    workflowReferences.length >= 2,
    `등록 횟수: ${workflowReferences.length}`
  );
}

function checkAccessibilityContracts() {
  const accessibility = read('global/accessibility.js');

  check(
    '접근성 모듈 중복 실행 방지',
    includesAll(accessibility, [
      'if (window.__helixAccessibilityInit) return;',
      'window.__helixAccessibilityInit = true;'
    ])
  );

  check(
    '페이지별 제목 구조 보정 규칙',
    includesAll(accessibility, [
      "path === '/services'",
      "heading.textContent = '진료과목'",
      "path === '/specialty-care'",
      "replaceTag(document.querySelector('h2.spec-title'), 'h1')",
      "path === '/discover-helix'",
      "replaceTag(duplicateTitles[i], 'h2')"
    ])
  );

  check(
    '서초·일산 인증 이미지 대체 텍스트 규칙',
    includesAll(accessibility, [
      "src.indexOf('Facility%20Cert')",
      '응급·중환자 진료 시설 인증 배지',
      "src.indexOf('Cat-Friendly-Clinic')",
      '고양이 친화 병원 골드 등급 인증 배지',
      "path === '/ilsan'",
      "document.querySelector('img.hero15y-logo')",
      '헬릭스동물메디컬센터 일산 분원 15주년 로고'
    ])
  );

  const hamburger = read('home/global/hamburger.js');
  check(
    '햄버거 메뉴 dialog·버튼 ARIA 규칙',
    includesAll(hamburger, [
      'role="dialog" aria-modal="true" aria-hidden="true"',
      "btn.setAttribute('role', 'button')",
      "btn.setAttribute('tabindex', '0')",
      "btn.setAttribute('aria-label', '메뉴 열기')",
      "btn.setAttribute('aria-controls', 'hx-menu-overlay')",
      "btn.setAttribute('aria-expanded', 'false')",
      "overlay.setAttribute('aria-hidden', 'false')",
      "overlay.setAttribute('aria-hidden', 'true')"
    ])
  );
}

console.log('Helix site quality checks\n');
checkJavaScriptSyntax();
checkAccessibilityLoaders();
checkAccessibilityContracts();

if (failures.length > 0) {
  console.error(`\n${failures.length}개 검사 실패:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\n모든 검사 통과 (${passed}개)`);
