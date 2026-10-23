import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { build, readDoctors, GROUPS, SECTIONS, escape, ROOT } from './build-doctor-pages.mjs';

const out=mkdtempSync(join(tmpdir(),'helix-doctor-check-'));
const checks=[];
function check(name, fn) { fn();checks.push(name); }
const manifest=build({outDir:out});
const {doctors,sourceHash}=readDoctors();
check('공개 목록과 번들 일치; 휴직/목록 제외 대상은 미생성',()=>{
  const bundle=JSON.parse(readFileSync(join(ROOT,'seocho/doctors/data/_all.json')));
  const keys=Object.entries(bundle.groups).flatMap(([group,v])=>v.order.map(slug=>group+'/'+slug));
  assert.deepEqual(doctors.map(d=>d.group+'/'+d.doctor.slug).sort(),keys.sort());
  for (const d of doctors) assert.deepEqual(d.doctor,bundle.groups[d.group].doctors[d.doctor.slug]);
  assert(!doctors.some(d=>['eomharim','guhaein'].includes(d.doctor.slug)));
});
check('전체 원본 HTML·고유 제목·대표 주소·이력·내부 링크',()=>{
  assert.equal(new Set(manifest.pages.map(p=>p.title)).size,doctors.length);
  const links=readFileSync(join(out,'fragments/seocho-links.html'),'utf8');
  for (const p of manifest.pages) {
    const html=readFileSync(join(out,p.path.slice(1)+'.html'),'utf8');
    assert(html.includes(`<title>${escape(p.title)}</title>`));
    assert(html.includes(`<link rel="canonical" href="${p.canonical}">`));
    assert(html.includes(`data-doctor-source="${sourceHash}"`));
    assert(links.includes(`href="${p.path}"`));
    const {doctor:d}=doctors.find(d=>d.path===p.path);
    for (const [key] of SECTIONS) for (const value of d[key]||[]) assert(html.includes(`<li>${escape(value)}</li>`));
    assert(!html.includes('application/ld+json')); // 기존 구조화 데이터 정책을 별도로 변경하지 않는다.
    assert(!html.includes('googletagmanager.com')); // 로컬 검토에는 실제 측정 로더 없음.
  }
});
check('배포 후보는 전체 SHA 자산; 새 본문은 JS fetch와 무관',()=>{
  const m=build({outDir:out,assetRef:'a'.repeat(40)});
  assert(m.pages.every(p=>p.head.includes('@'+'a'.repeat(40)+'/')));
  assert.equal(m.published,false);assert.equal(m.canonicalVerified,false);
  assert.throws(()=>build({outDir:out,assetRef:'main'}));
});
check('휴직·삭제 후 재생성 시 이전 출력 제거; 중복 slug·연결 오류 차단',()=>{
  writeFileSync(join(out,'doctors/stale.html'),'obsolete');
  const previous=JSON.parse(readFileSync(join(out,'manifest.json')));previous.pages.push({path:'/doctors/stale'});
  writeFileSync(join(out,'manifest.json'),JSON.stringify(previous));
  build({outDir:out});
  assert.throws(()=>readFileSync(join(out,'doctors/stale.html')));
  const data=join(out,'data');
  for(const [group] of GROUPS){mkdirSync(join(data,group),{recursive:true});writeFileSync(join(data,group,'_index.json'),'[]');}
  writeFileSync(join(data,'im-1/_index.json'),'[{"slug":"same"}]');
  writeFileSync(join(data,'im-1/same.json'),'{"slug":"same","name":"검증용"}');
  writeFileSync(join(data,'im-2/_index.json'),'[{"slug":"same"}]');
  assert.throws(()=>readDoctors(data),/중복/);
  writeFileSync(join(data,'im-2/_index.json'),'[]');
  writeFileSync(join(data,'im-1/same.json'),'{"slug":"different","name":"검증용"}');
  assert.throws(()=>readDoctors(data),/불일치/);
});
console.log('정적 검증 통과: '+checks.length+'개 검사 그룹 / '+doctors.length+'명');

if (process.env.DOCTOR_BROWSER_TEST === '1') {
  const require=createRequire(import.meta.url);
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const base=process.env.DOCTOR_PREVIEW_URL || 'http://127.0.0.1:4173';
  const records=[];
  try {
    const rawLinks=await (await fetch(base+'/seocho')).text();
    for (const d of doctors) assert(rawLinks.includes(`href="${d.path}"`));
    for(const path of ['/doctors/not-a-doctor','/doctors/eomharim','/doctors/guhaein','/doctors/','/doctors/isoyun/unknown']) {
      assert.equal((await fetch(base+path)).status,404,path);
    }
    records.push('없는 주소·휴직·목록 제외 주소 HTTP 404');
    for(const width of [1440,390]) {
      const context=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:false});
      await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
      const page=await context.newPage();
      for(const item of doctors) {
        const response=await page.goto(base+item.path);assert.equal(response.status(),200);
        assert.equal(await page.locator('h1').innerText(),item.doctor.name);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),manifest.origin+item.path);
        assert.equal(await page.title(),manifest.pages.find(p=>p.path===item.path).title);
        assert.deepEqual(await page.locator('article li').allTextContents(),SECTIONS.flatMap(([key])=>item.doctor[key]||[]));
        assert(await page.locator('[data-doctor-detail]').isVisible());
        assert(await page.locator('.helix-doctor-modal-direct[role="dialog"]').isVisible());
        assert.equal(await page.locator('.helix-doctor-modal_close').getAttribute('href'),'/seocho#medical-team');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      }
      await page.goto(base+'/doctors/isoyun');
      await page.screenshot({path:`/tmp/helix-doctor-preview/detail-${width}.png`,fullPage:true});
      await context.close();
      records.push(`${width}px: 전체 ${doctors.length}명 JS 비활성 본문·HTTP·제목·대표 주소·가로 넘침 검사`);
    }
    for(const width of [1440,390]) {
      const context=await browser.newContext({viewport:{width,height:900}});
      // 가상 운영 도메인에 로컬 응답을 제공하고 모든 외부 통신을 차단. 실제 이벤트 전송 없음.
      const events=[],errors=[];
      await context.exposeBinding('captureDoctorEvent',(_source,args)=>events.push(args));
      await context.addInitScript(()=>{
        window.gtag=(...args)=>window.captureDoctorEvent(args);
        // Older Webflow templates may still contain default membership text.
        document.addEventListener('DOMContentLoaded',()=>{
          document.querySelectorAll('[data-doctor-template] .text-block-32, [data-doctor-template] .jh2_m1').forEach(el=>{el.textContent='어디어디 정회원';});
        });
      });
      await context.route('**/*',async route=>{
        const u=new URL(route.request().url());
        if(u.hostname!=='helix-amc.com' && u.origin!==new URL(base).origin) return route.abort();
        const r=await fetch(base+u.pathname+u.search);
        await route.fulfill({status:r.status,headers:{'content-type':r.headers.get('content-type')||'text/html'},body:Buffer.from(await r.arrayBuffer())});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.goto('https://helix-amc.com/seocho');
      await page.waitForFunction(()=>document.querySelectorAll('[data-doctor-slug]').length===52);
      assert.equal(await page.locator('[data-doctor-slug][aria-hidden="true"]').count(),0);
      for(const text of await page.locator('[data-doctor-slug]').allTextContents()) assert(!text.includes('어디어디 정회원'));
      await page.evaluate(()=>{window.__helixNoMeasure=false;});
      const view=width===390?'.preview-mobile':'.preview-desktop';
      for(const item of doctors.filter(d=>d.group!=='di-3')) {
        const link=page.locator(`${view} [data-doctor-slug="${item.doctor.slug}"] [data-doctor-open]`);
        assert.equal(await link.getAttribute('href'),item.path);
        const before=events.length;
        await link.scrollIntoViewIfNeeded();
        const savedScroll=await page.evaluate(()=>scrollY);
        await link.click();await page.locator('.helix-doctor-modal.is-open').waitFor();
        await page.waitForURL('**'+item.path);
        assert.equal(await page.locator('#helix-doctor-modal-name').innerText(),item.doctor.name);
        assert.deepEqual(await page.locator('.helix-doctor-modal_body li').allTextContents(),SECTIONS.flatMap(([key])=>item.doctor[key]||[]));
        assert.equal(await page.locator('[data-doctor-page-link]').count(),0);
        assert.equal(await page.locator('.preview-shell').count(),1); // 원래 문서를 유지하고 URL만 변경.
        await page.waitForTimeout(20);
        assert.equal(events.length,before+1);
        assert.equal(events.at(-1)[1],'seocho_doctor_detail_'+(width===390?'mobile':'desktop'));
        await page.keyboard.press('Escape');
        await page.waitForURL('**/seocho');
        assert.equal(await link.evaluate(el=>document.activeElement===el),true);
        await page.waitForTimeout(340);
        assert(Math.abs(await page.evaluate(()=>scrollY)-savedScroll)<2);
      }
      assert.equal(await page.locator(`${view} [data-doctor-slug="gimyunji"] [data-doctor-open]`).count(),0);
      // 새 탭 첫 탐색은 Chromium의 가상 외부 도메인 라우팅 제한을 피하고 실제 로컬 서버에서 검증.
      await page.goto(base+'/seocho');
      await page.waitForFunction(()=>document.querySelectorAll('[data-doctor-slug]').length===52);
      const first=page.locator(`${view} [data-doctor-slug="isoyun"] [data-doctor-open]`);
      const before=events.length;
      const [newTab]=await Promise.all([context.waitForEvent('page'),first.click({modifiers:['Control']})]);
      await newTab.waitForURL('**/doctors/isoyun');await newTab.waitForLoadState();assert.equal(new URL(newTab.url()).pathname,'/doctors/isoyun');
      assert.equal(events.length,before);assert.equal(await page.locator('.helix-doctor-modal.is-open').count(),0);await newTab.close();
      await page.goto('https://helix-amc.com/seocho');
      await page.waitForFunction(()=>document.querySelectorAll('[data-doctor-slug]').length===52);
      await page.evaluate(()=>{window.__helixNoMeasure=false;});
      await first.click();await page.locator('.helix-doctor-modal.is-open').waitFor();
      await page.locator('.helix-doctor-modal_close').click();await page.waitForURL('**/seocho');await page.waitForTimeout(340);
      await first.click();await page.locator('.helix-doctor-modal.is-open').waitFor();
      await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.helix-doctor-modal')).opacity)>0.99);
      await page.screenshot({path:`/tmp/helix-doctor-preview/modal-${width}.png`,fullPage:false});
      await page.waitForURL('**/doctors/isoyun');
      const beforeHistory=events.length;
      await page.goBack();await page.waitForURL('**/seocho');
      assert.equal(await page.locator('.helix-doctor-modal.is-open').count(),0);
      assert.equal(await page.title(),'서초 의료진 · 로컬 검토본 | 헬릭스');
      await page.goForward();await page.locator('.helix-doctor-modal.is-open').waitFor();
      assert.equal(new URL(page.url()).pathname,'/doctors/isoyun');
      assert.equal(events.length,beforeHistory);
      assert((await page.title()).includes('이소윤'));
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://helix-amc.com/doctors/isoyun');
      await page.reload();assert.equal(await page.locator('h1').innerText(),'이소윤');
      assert(await page.locator('.helix-doctor-modal-direct').isVisible());
      assert.equal(events.filter(e=>e[1]==='doctor_full_history_click').length,0);
      await page.keyboard.press('Escape');await page.waitForURL('**/seocho#medical-team');
      await page.goto('https://helix-amc.com/doctors/isoyun');
      await page.locator('.helix-doctor-modal_close').click();await page.waitForURL('**/seocho#medical-team');
      assert(await page.locator('[data-doctor-directory]').isVisible());
      await page.goto('https://helix-amc.com/doctors/isoyun');
      const analytics=readFileSync(join(ROOT,'global/scroll-depth.js'),'utf8');
      await page.addScriptTag({content:analytics});await page.addScriptTag({content:analytics});
      await page.waitForTimeout(20);
      const pv=events.filter(e=>e[1]==='doctor_page_view');assert.equal(pv.length,1);
      assert.equal(pv[0][2].slug,'isoyun');assert.equal(pv[0][2].view_type,'page');
      assert.equal(events.filter(e=>e[1]==='home_page_view'||e[1]==='seocho_page_view').length,0);
      assert.deepEqual(errors,[]);await context.close();
      records.push(`${width}px: 24명 주소 동반 모달·새 탭·닫기/포커스·뒤로/앞으로·새로고침·직접 접속 모달·이벤트 중복 없음`);
    }
    // staging/operator gates: browser mocks only, no GA4 scripts or requests.
    for(const hostname of ['preview.webflow.io','helix-amc.com']) {
      const context=await browser.newContext();
      await context.route('**/*',async route=>route.fulfill({contentType:'text/html',body:readFileSync(join(out,'doctors/isoyun.html'),'utf8').replace(/<script[\s\S]*?<\/script>/g,'')}));
      const page=await context.newPage();await page.goto('https://'+hostname+'/doctors/isoyun');
      await page.evaluate(block=>{window.__calls=[];window.gtag=(...args)=>window.__calls.push(args);window.__helixNoMeasure=block;},hostname==='helix-amc.com');
      await page.addScriptTag({content:readFileSync(join(ROOT,'global/scroll-depth.js'),'utf8')});
      assert.equal(await page.evaluate(()=>window.__calls.length),0);await context.close();
    }
    records.push('스테이징·운영자 측정 제외');
    writeFileSync('/tmp/helix-doctor-preview/validation.json',JSON.stringify({staticChecks:checks,browserChecks:records,doctors:doctors.length,published:false,limitations:['운영 원본 HTML/응답/이미지 통신은 미검증','Webflow 실제 페이지 생성 전; 운영 시각 회귀와 검색 설정은 스테이징에서 확인']},null,2));
    console.log(records.join('\n'));
  } finally { await browser.close(); }
}
rmSync(out,{recursive:true,force:true});
