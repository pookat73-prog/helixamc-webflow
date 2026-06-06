#!/usr/bin/env node
/* ================================================================
   seocho/doctors/data/<group>/_index.json + <slug>.json 들을 하나의
   번들 파일 seocho/doctors/data/_all.json 로 합쳐 jsDelivr 라운드트립
   을 39회 → 1회 로 줄임. 카드 첫 노출 지연 ~2초 → ~0.4초.

   포맷:
     {
       "version": 1,
       "groups": {
         "<group>": {
           "order": ["<slug>", ...],         // _index.json 의 slug 배열 (draft 제외)
           "doctors": { "<slug>": { ...개별 JSON 그대로... } }
         },
         ...
       }
     }

   워크플로우 (.github/workflows/webflow-deploy.yml) 가 push 마다 본
   스크립트를 실행해 _all.json 을 재생성. 사용자는 평소처럼 개별
   <slug>.json 만 수정/추가/삭제하면 됨.
   ================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'seocho', 'doctors', 'data');
const OUT  = path.join(ROOT, '_all.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function listGroupDirs() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
}

function buildGroup(group) {
  const dir = path.join(ROOT, group);
  const indexPath = path.join(dir, '_index.json');
  if (!fs.existsSync(indexPath)) {
    console.warn('[build-doctors] skip ' + group + ' — no _index.json');
    return null;
  }
  const entries = readJson(indexPath);
  if (!Array.isArray(entries)) {
    console.warn('[build-doctors] skip ' + group + ' — _index.json not array');
    return null;
  }
  const order = entries
    .filter(e => e && e.slug && !e.draft)
    .map(e => e.slug);

  const doctors = {};
  for (const slug of order) {
    const p = path.join(dir, slug + '.json');
    if (!fs.existsSync(p)) {
      console.warn('[build-doctors] missing ' + group + '/' + slug + '.json');
      continue;
    }
    doctors[slug] = readJson(p);
  }
  return { order, doctors };
}

function build() {
  const out = { version: 1, groups: {} };
  const groups = listGroupDirs();
  let totalDoctors = 0;
  for (const g of groups) {
    const built = buildGroup(g);
    if (!built) continue;
    out.groups[g] = built;
    totalDoctors += Object.keys(built.doctors).length;
  }
  fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
  const bytes = fs.statSync(OUT).size;
  console.log('[build-doctors] wrote ' + OUT);
  console.log('[build-doctors] groups=' + groups.length + ' doctors=' + totalDoctors + ' size=' + bytes + 'B');
}

build();
