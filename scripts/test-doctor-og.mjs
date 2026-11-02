import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, cpSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build, ROOT, readDoctors } from './build-doctor-pages.mjs';

const scratch = mkdtempSync(join(tmpdir(), 'helix-doctor-og-'));
try {
  const manifest = build({outDir: join(scratch, 'actual')});
  const {doctors} = readDoctors();
  assert.equal(manifest.pages.length, 26);
  for (const page of manifest.pages) {
    const doctor = doctors.find(item => item.doctor.slug === page.slug).doctor;
    assert(doctor.photo, 'Current public doctors must retain their existing photo');
    assert.equal((page.head.match(/property="og:image"/g) || []).length, 1);
    assert.equal((page.head.match(/property="og:type"/g) || []).length, 1);
    assert(page.head.includes('<meta property="og:type" content="website">'));
    assert(page.head.includes('<meta property="og:image" content="' + doctor.photo.replaceAll('&', '&amp;') + '">'));
    assert(page.head.includes('<meta name="description" content="' + page.description + '">'));
    assert(page.head.includes('<link rel="canonical" href="' + page.canonical + '">'));
    assert(page.head.includes('<meta property="og:url" content="' + page.canonical + '">'));
  }
  // Future photo-less input must not acquire an invented common fallback.
  const fixture = join(scratch, 'fixture');
  mkdirSync(join(fixture, 'scripts'), {recursive: true});
  mkdirSync(join(fixture, 'seocho/doctors'), {recursive: true});
  cpSync(join(ROOT, 'scripts/build-doctor-pages.mjs'), join(fixture, 'scripts/build-doctor-pages.mjs'));
  cpSync(join(ROOT, 'scripts/doctor-photo-sources.cjs'), join(fixture, 'scripts/doctor-photo-sources.cjs'));
  cpSync(join(ROOT, 'seocho/doctors/photo-widths.json'), join(fixture, 'seocho/doctors/photo-widths.json'));
  cpSync(join(ROOT, 'seocho/doctors/data'), join(fixture, 'seocho/doctors/data'), {recursive: true});
  const first = doctors[0];
  const source = join(fixture, 'seocho/doctors/data', first.group, first.doctor.slug + '.json');
  const doc = JSON.parse(readFileSync(source, 'utf8'));
  delete doc.photo;
  writeFileSync(source, JSON.stringify(doc));
  const fixtureModule = await import(pathToFileURL(join(fixture, 'scripts/build-doctor-pages.mjs')));
  const noPhoto = fixtureModule.build({outDir: join(scratch, 'no-photo')}).pages.find(p => p.slug === first.doctor.slug);
  assert(!noPhoto.head.includes('property="og:image"'));
  assert(!noPhoto.head.includes('undefined'));
  doc.photo = 'https://cdn.example.test/photo?a=1&b="quoted"';
  writeFileSync(source, JSON.stringify(doc));
  const escaped = fixtureModule.build({outDir: join(scratch, 'escaped')}).pages.find(p => p.slug === first.doctor.slug);
  assert(escaped.head.includes('content="https://cdn.example.test/photo?a=1&amp;b=&quot;quoted&quot;"'));
  console.log('Doctor OG regression checks passed: 26 public profiles, no-photo input, escaped image URL.');
} finally {
  rmSync(scratch, {recursive: true, force: true});
}
