import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage();
  await ctx.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html; charset=utf-8',body:'<section id="medical-team"><a id="reused-id" href="/doctors/isoyun">이소윤 상세보기</a></section><div class="helix-doctor-modal"><button class="helix-doctor-modal_close">닫기</button></div><footer><button data-measure-section="footer" aria-label="대표 인스타그램">SNS</button></footer><form><input value="PRIVATE_VALUE"><button>상담</button></form>'}):r.abort());
  await page.goto('https://www.helix-amc.com/seocho?private_query=SECRET');
  await page.evaluate(()=>{window.events=[];window.gtag=(...a)=>{if(a[0]==='event')window.events.push({event:a[1],params:a[2]});};document.addEventListener('click',e=>e.preventDefault());});
  for(const file of ['global/ga4-base.js','global/session.js'])await page.addScriptTag({content:readFileSync(file,'utf8')});
  await page.locator('#reused-id').click();
  let rows=await page.evaluate(()=>window.events);let click=rows.find(r=>r.event==='ui_click');
  assert.equal(click.params.link_text,'이소윤 상세보기');assert.equal(click.params.control_id,'reused-id');assert.equal(click.params.section_key,'medical-team');assert.equal(click.params.target_key,'isoyun');assert.equal(click.params.source_page,'/seocho');
  await page.evaluate(()=>{window.__helixDoctorContext={source_page:'/seocho',slug:'isoyun',content_view_id:'fixture-open-1'};history.pushState({},'', '/doctors/isoyun');});
  await page.locator('.helix-doctor-modal_close').click();rows=await page.evaluate(()=>window.events);click=rows.at(-1);assert.equal(click.params.source_page,'/seocho');assert.equal(click.params.section_key,'doctor-modal');assert.equal(click.params.content_view_id,'fixture-open-1');assert.equal(click.params.target_key,'isoyun');
  await page.locator('footer button').click();rows=await page.evaluate(()=>window.events);assert.equal(rows.at(-1).params.section_key,'footer');assert.equal(rows.at(-1).params.source_page,'/doctors/isoyun','modal context must not leak into unrelated controls');
  await page.locator('form button').click();rows=await page.evaluate(()=>window.events);assert.doesNotMatch(JSON.stringify(rows),/PRIVATE_VALUE|SECRET|private_query/);
  for(const row of rows)assert.ok(Object.keys(row.params).filter(k=>!['transport_type','event_callback','event_timeout','debug_mode','send_to'].includes(k)).length<=25,'GA4 limit');
  await page.goto('https://www.helix-amc.com/seocho?private_query=SECRET');
  await page.clock.install({time:new Date('2026-10-30T03:00:00Z')});
  await page.evaluate(()=>{
   document.querySelector('.helix-doctor-modal').remove();const button=document.querySelector('#reused-id');button.setAttribute('data-doctor-open','di-1/isoyun');button.setAttribute('data-doctor-name','이소윤');
   window.HELIX_DOCTOR_BUNDLE={groups:{'di-1':{doctors:{isoyun:{slug:'isoyun',name:'이소윤',title:'수의사'}}}}};window.events=[];window.gtag=(...a)=>{if(a[0]==='event')window.events.push({event:a[1],params:a[2]});};
  });
  for(const file of ['global/ga4-base.js','global/session.js','seocho/doctors/modal.js'])await page.addScriptTag({content:readFileSync(file,'utf8')});
  await page.locator('#reused-id').click();await page.waitForFunction(()=>window.__helixDoctorContext&&location.pathname==='/doctors/isoyun');await page.clock.runFor(100);
  const view=await page.evaluate(()=>window.__helixDoctorContext.content_view_id);await page.clock.fastForward(3000);await page.locator('.helix-doctor-modal_close').click();await page.waitForFunction(()=>window.__helixDoctorContext===null);rows=await page.evaluate(()=>window.events);
  for(const event of ['doctor_detail_read','doctor_detail_close']){const r=rows.find(r=>r.event===event);assert.ok(r,event);assert.equal(r.params.source_page,'/seocho');assert.equal(r.params.content_view_id,view);assert.equal(r.params.slug,'isoyun');assert.doesNotMatch(JSON.stringify(r),/SECRET|private_query/);}
  assert.ok(rows.find(r=>r.event==='doctor_detail_read').params.read_sec>=3);
  await page.locator('#reused-id').click();await page.waitForFunction(()=>window.__helixDoctorContext);assert.notEqual(await page.evaluate(()=>window.__helixDoctorContext.content_view_id),view);
  console.log(`PASS ${width}px public labels, reusable IDs, doctor targets, modal source, section, view id, privacy and GA4 limit`);await ctx.close();
 }
}finally{await browser.close();}
