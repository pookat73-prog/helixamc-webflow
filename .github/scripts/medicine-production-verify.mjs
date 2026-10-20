import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire('/tmp/helix-ci-audit/package.json');const {chromium}=require('playwright');const {PNG}=require('pngjs');const {default:pixelmatch}=await import(pathToFileURL(require.resolve('pixelmatch')));
const out='medicine-production-results';fs.mkdirSync(out,{recursive:true});
const newer='6ad6b0bad182f0e668c6e9fa',older='6a45e8bd91b794ab174bf80a';
const summary={time:new Date().toISOString(),visits:[],comparisons:[],failures:[]};const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const [pageKey,width] of [['services',390],['services',600],['services',850],['services',1440],['home',390],['home',1440]]){
 const id=`production-${pageKey}-${width}`;const r={id,pageKey,width,errors:[],warnings:[],failedRequests:[],network:[],checks:{}};summary.visits.push(r);
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1,locale:'ko-KR',timezoneId:'Asia/Seoul'});const page=await context.newPage();page.setDefaultTimeout(25000);
 page.on('pageerror',e=>r.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')r.errors.push(m.text());if(m.type()==='warning')r.warnings.push(m.text());});page.on('requestfailed',q=>r.failedRequests.push({url:q.url(),error:q.failure()?.errorText}));
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');const requests=new Map();cdp.on('Network.responseReceived',e=>requests.set(e.requestId,{url:e.response.url,status:e.response.status,mimeType:e.response.mimeType}));cdp.on('Network.loadingFinished',e=>{const q=requests.get(e.requestId);if(q)r.network.push({...q,encodedDataLength:e.encodedDataLength});});
 async function shot(label){await page.screenshot({path:`${out}/${id}-${label}.png`,animations:'disabled'});}
 try{
  const response=await page.goto('https://www.helix-amc.com'+(pageKey==='services'?'/services':'/'),{waitUntil:'domcontentloaded',timeout:90000});if(!response.ok())throw Error('HTTP '+response.status());await page.locator('#hxFctaToggle').waitFor({state:'visible',timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(8000);
  r.layout=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,ref:window.HELIX_REF,elements:['.dept_image_im','.dept-card-header_im','.blackframe_image-hero'].map(selector=>{const el=document.querySelector(selector);if(!el)return null;const s=getComputedStyle(el);return{selector,image:s.backgroundImage,position:s.backgroundPosition,size:s.backgroundSize,rect:el.getBoundingClientRect().toJSON()};}).filter(Boolean)}));
  r.checks.noOverflow=r.layout.documentWidth<=width+1;if(!r.checks.noOverflow)throw Error('Horizontal overflow');if(!r.layout.ref?.startsWith('a6c01054d0'))throw Error('Unexpected main code ref');
  if(pageKey==='services'){
   r.images=r.network.filter(q=>q.url.includes(newer)||q.url.includes(older));if(r.images.some(q=>q.url.includes(older)))throw Error('Old JPEG requested');
   const visible=r.layout.elements.some(e=>e.rect.width>0&&e.rect.height>0&&e.image.includes(newer));r.checks.optimizedImageVisible=visible;
   if(visible&&!r.images.some(q=>q.url.includes(newer)&&q.status===200&&q.encodedDataLength<622000))throw Error('Optimized image delivery missing or too large');
   if(width===390&&!r.layout.elements.find(e=>e.selector==='.dept-card-header_im')?.image.startsWith('radial-gradient('))throw Error('Portrait gradient missing');
  }else if(!r.layout.elements.some(e=>e.selector==='.blackframe_image-hero'&&e.image.includes('69e0c39b414cc720f7c6d7db')))throw Error('Home hero changed');
  await shot('page');
  const burgers=page.locator('.menu-bar_mobile,.image-18');let burger;
  for(let i=0;i<await burgers.count();i++){if(await burgers.nth(i).isVisible()&&await burgers.nth(i).evaluate(el=>{if(!el.__hxBurgerBound)return false;const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return !!hit&&(hit===el||el.contains(hit));})){burger=burgers.nth(i);break;}}
  if(!burger)throw Error('No clickable bound menu');await burger.click();await page.locator('.hx-menu-overlay[aria-hidden="false"]').waitFor();await page.waitForTimeout(1000);await shot('menu');await page.locator('.hx-menu-close').click();await page.waitForFunction(()=>document.querySelector('.hx-menu-overlay')?.getAttribute('aria-hidden')==='true');r.checks.menu=true;
  await page.locator('#hxFctaToggle').click();if(await page.locator('#hxFctaFormBtn').isVisible().catch(()=>false))await page.locator('#hxFctaFormBtn').click();await page.locator('#hxFctaModal[aria-hidden="false"]').waitFor();await page.waitForTimeout(600);await shot('consultation');await page.locator('#hxFctaModalClose').click();await page.waitForFunction(()=>document.querySelector('#hxFctaModal')?.getAttribute('aria-hidden')==='true');r.checks.consultation=true;
  if(r.errors.length)throw Error('Production console/page errors');
 }catch(e){r.failure=e.message;summary.failures.push({id,error:e.message});await shot('failure').catch(()=>{});}finally{fs.writeFileSync(`${out}/${id}.json`,JSON.stringify(r,null,2));console.log('PROD_VISIT '+JSON.stringify({id,checks:r.checks,images:r.images,errors:r.errors,warnings:r.warnings,failure:r.failure}));await context.close();}
}
await browser.close();
for(const r of summary.visits)for(const label of ['page','menu','consultation']){
 const before=r.pageKey==='services'?`/tmp/approved-staging/staging-${r.width}-candidate-${label}.png`:`/tmp/previous-main/production-home-${r.width}-post-${label==='page'?'home':label}.png`;
 const after=`${out}/${r.id}-${label}.png`;if(!fs.existsSync(before)||!fs.existsSync(after))continue;
 const a=PNG.sync.read(fs.readFileSync(before)),b=PNG.sync.read(fs.readFileSync(after));if(a.width!==b.width||a.height!==b.height){summary.failures.push({id:r.id,label,error:'Screenshot dimensions differ'});continue;}
 const diff=new PNG({width:a.width,height:a.height});const count=pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:0.1}),ratio=count/(a.width*a.height);summary.comparisons.push({id:r.id,label,pixels:count,ratio});fs.writeFileSync(`${out}/${r.id}-${label}-diff.png`,PNG.sync.write(diff));if(ratio>0.002)summary.failures.push({id:r.id,label,ratio});
}
fs.writeFileSync(`${out}/summary.json`,JSON.stringify(summary,null,2));console.log('PRODUCTION_SUMMARY '+JSON.stringify(summary));if(summary.failures.length)process.exitCode=1;
