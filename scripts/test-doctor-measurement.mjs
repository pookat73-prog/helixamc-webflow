import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {build,ROOT} from './build-doctor-pages.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const legacyAssets=process.env.DOCTOR_LEGACY_ASSET_DIR;
const legacyGA4=process.env.DOCTOR_LEGACY_GA4_FILE?readFileSync(process.env.DOCTOR_LEGACY_GA4_FILE,'utf8'):'';
const out=mkdtempSync('/tmp/helix-doctor-measurement-');
const manifest=build({outDir:out,origin:'https://www.helix-amc.com',assetRef:'a'.repeat(40)});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:500}}),page=await context.newPage();
  await page.clock.install({time:new Date('2026-10-27T06:00:00Z')});
  await context.addInitScript(()=>{window.captured=[];window.gtag=(...args)=>window.captured.push(args);});
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='www.helix-amc.com'){
    if(legacyAssets&&/^\/__legacy\/(scroll-depth|page-time)\.js$/.test(u.pathname))return route.fulfill({contentType:'text/javascript',body:readFileSync(join(legacyAssets,u.pathname.split('/').pop()),'utf8')});
    const profile=manifest.pages.find(p=>p.path===u.pathname);
    if(profile)return route.fulfill({contentType:'text/html',body:readFileSync(join(out,u.pathname+'.html'),'utf8').replace('<head>','<head>'+(legacyGA4?'<script>'+legacyGA4+'</script>':'')+(legacyAssets?'<script defer src="/__legacy/scroll-depth.js"></script><script defer src="/__legacy/page-time.js"></script>':''))});
   }
   if(u.hostname==='cdn.jsdelivr.net'){
    const path=u.pathname.split('/').slice(4).join('/');
    if(/^(global\/[a-z0-9-]+\.js|seocho\/doctors\/modal\.(js|css))$/.test(path))return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:readFileSync(join(ROOT,path),'utf8')});
   }
   return route.abort(); // Every real GA4, sheet and pixel transport is blocked.
  });
  await page.goto('https://www.helix-amc.com/doctors/isoyun?qa-secret=DO_NOT_COLLECT&utm_source=fixture&utm_medium=fixture&utm_campaign=fixture&utm_term=fixture&utm_content=fixture');
  await page.waitForFunction(()=>window.__helixPageTimeInit&&window.__helixScrollDepthInit);
  const events=()=>page.evaluate(()=>window.captured.filter(a=>a[0]==='event').map(a=>({event:a[1],params:a[2]})));
  let pv=(await events()).filter(e=>e.event==='doctor_page_view');assert.equal(pv.length,1);assert.equal(pv[0].params.slug,'isoyun');
  await page.clock.fastForward(10000);
  if(legacyAssets)assert.equal(await page.evaluate(()=>window.__helixDoctorPageTimeIdentity),true);
  await page.evaluate(()=>{document.querySelector('.helix-doctor-modal_name').click();window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pagehide'));});
  let stays=(await events()).filter(e=>e.event==='doctor_time_on_page');assert.equal(stays.length,1);assert.equal(stays[0].params.active_sec,10);
  for(const key of ['slug','doctor','group','branch','view_type','page_location'])assert.ok(stays[0].params[key],key);
  assert.equal(stays[0].params.page_location,'https://www.helix-amc.com/doctors/isoyun');
  assert.equal(stays[0].params.view_type,'page');assert.ok(!JSON.stringify(stays).includes('DO_NOT_COLLECT'));
  assert.ok(Object.keys(stays[0].params).filter(k=>!['transport_type','event_callback','event_timeout','debug_mode','send_to'].includes(k)).length<=25);
  const panel=page.locator('[data-doctor-detail] .helix-doctor-modal_panel');
  assert.ok(await panel.evaluate(el=>el.scrollHeight>el.clientHeight));
  await panel.evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event('scroll'));});
  await page.clock.runFor(32);
  const depth=(await events()).filter(e=>e.event==='doctor_scroll_depth');assert.equal(depth.at(-1).params.percent_scrolled,100);assert.equal(depth.at(-1).params.slug,'isoyun');
  await page.addScriptTag({content:readFileSync(join(ROOT,'global/page-time.js'),'utf8')});
  await page.addScriptTag({content:readFileSync(join(ROOT,'global/scroll-depth.js'),'utf8')});
  assert.equal((await events()).filter(e=>e.event==='doctor_page_view').length,1);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.fastForward(120000);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.fastForward(5000);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  stays=(await events()).filter(e=>e.event==='doctor_time_on_page');assert.equal(stays.reduce((n,e)=>n+e.params.active_sec,0),15);
  await page.goto('https://www.helix-amc.com/doctors/jeonjonghyi');await page.clock.fastForward(3000);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  stays=(await events()).filter(e=>e.event==='doctor_time_on_page');assert.equal(stays.at(-1).params.slug,'jeonjonghyi');assert.equal(stays.at(-1).params.doctor,'전종희');
  await context.close();console.log(`PASS ${width}px direct entry identity, 25-param GA4 forwarding, delta-only stay, hidden time, internal scroll, duplicate init and doctor navigation`);
 }
}finally{await browser.close();rmSync(out,{recursive:true,force:true});}
