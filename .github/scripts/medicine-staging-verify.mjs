import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire('/tmp/helix-ci-audit/package.json');
const {chromium}=require('playwright');const {PNG}=require('pngjs');
const {default:pixelmatch}=await import(pathToFileURL(require.resolve('pixelmatch')));
const old='https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6a45e8bd91b794ab174bf80a_%EB%82%B4%EA%B3%BC.jpg';
const newer='https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6ad6b0bad182f0e668c6e9fa_%EB%82%B4%EA%B3%BC-%EC%A0%84%EB%8B%AC%EC%B5%9C%EC%A0%81%ED%99%94-q95-20261019.webp';
const out='medicine-staging-results';fs.mkdirSync(out,{recursive:true});
const summary={time:new Date().toISOString(),old,newer,visits:[],comparisons:[],failures:[]};
const img=await fetch(newer);const bytes=Buffer.from(await img.arrayBuffer());summary.asset={status:img.status,bytes:bytes.length};if(!img.ok||bytes.length!==620524)throw Error('Uploaded asset differs');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
async function visit(width,variant,host='helixanimalmedicalcenter.webflow.io'){
 const id=`${host.startsWith('www')?'production':'staging'}-${width}-${variant}`;const record={id,width,variant,host,errors:[],warnings:[],failedRequests:[],network:[],restoredRules:0,checks:{}};summary.visits.push(record);
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1,locale:'ko-KR',timezoneId:'Asia/Seoul'});const page=await context.newPage();page.setDefaultTimeout(25000);
 page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());if(m.type()==='warning')record.warnings.push(m.text());});page.on('requestfailed',r=>record.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');const req=new Map();cdp.on('Network.responseReceived',e=>req.set(e.requestId,{url:e.response.url,status:e.response.status,mimeType:e.response.mimeType}));cdp.on('Network.loadingFinished',e=>{const r=req.get(e.requestId);if(r)record.network.push({...r,encodedDataLength:e.encodedDataLength});});
 const cssBodies=new Map();
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(route.request().isNavigationRequest()&&url===`https://${host}/services`){
   const response=await route.fetch();let html=await response.text();
   for(const tag of [...html.matchAll(/<link\b[^>]*>/g)].map(x=>x[0])){
    const href=tag.match(/href="([^"]+)"/)?.[1];if(!href||!href.includes('cdn.prod.website-files.com')||!href.includes('.css'))continue;
    const res=await fetch(href);let body=await res.text();if(variant==='baseline'){record.restoredRules+=body.split(newer).length-1;body=body.split(newer).join(old);}cssBodies.set(href,body);
    // Test-only restored CSS needs its matching integrity digest. Preserve SRI verification.
    const digest='sha384-'+createHash('sha384').update(body).digest('base64');html=html.replace(tag,tag.replace(/integrity="[^"]*"/,`integrity="${digest}"`));
   }
   await route.fulfill({response,body:html});
  }else if(cssBodies.has(url)){const body=cssBodies.get(url);fs.writeFileSync(`${out}/${id}-${record.cssFiles||0}.css`,body);record.cssFiles=(record.cssFiles||0)+1;await route.fulfill({status:200,contentType:'text/css',body});}
  else await route.continue();
 });
 async function shot(label){await page.screenshot({path:`${out}/${id}-${label}.png`,animations:'disabled'});}
 try{
  const response=await page.goto(`https://${host}/services`,{waitUntil:'domcontentloaded',timeout:90000});if(!response.ok())throw Error('Page HTTP '+response.status());await page.locator('#hxFctaToggle').waitFor({state:'visible',timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(8000);
  record.layout=await page.evaluate(()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,elements:['.dept_image_im','.dept-card-header_im'].map(selector=>{const el=document.querySelector(selector);const s=getComputedStyle(el);return{selector,backgroundImage:s.backgroundImage,backgroundPosition:s.backgroundPosition,backgroundSize:s.backgroundSize,backgroundRepeat:s.backgroundRepeat,rect:el.getBoundingClientRect().toJSON()};})}));
  record.checks.noOverflow=record.layout.docWidth<=width+1;if(!record.checks.noOverflow)throw Error('Horizontal overflow');
  const expected=variant==='baseline'||host.startsWith('www')?old:newer;const unwanted=expected===old?newer:old;
  const images=record.network.filter(r=>r.url===old||r.url===newer);record.images=images;
  const visibleImage=record.layout.elements.some(e=>e.rect.width>0&&e.rect.height>0&&e.backgroundImage.includes(expected));
  if(visibleImage&&!images.some(r=>r.url===expected&&r.status===200))throw Error('Expected visible image missing');if(images.some(r=>r.url===unwanted))throw Error('Unexpected image downloaded');if(variant==='baseline'&&!record.restoredRules)throw Error('Baseline CSS not restored');record.checks.imageDisplayed=visibleImage;
  if(width===390&&!record.layout.elements[1].backgroundImage.startsWith('radial-gradient('))throw Error('Mobile gradient missing');
  await shot('page');
  const burgers=page.locator('.menu-bar_mobile,.image-18');let burger;for(let i=0;i<await burgers.count();i++){if(await burgers.nth(i).isVisible()&&await burgers.nth(i).evaluate(el=>!!el.__hxBurgerBound)){burger=burgers.nth(i);break;}}if(!burger)throw Error('No bound menu trigger');await burger.click();await page.locator('.hx-menu-overlay[aria-hidden="false"]').waitFor();await page.waitForTimeout(1000);await shot('menu');await page.locator('.hx-menu-close').click();await page.waitForFunction(()=>document.querySelector('.hx-menu-overlay')?.getAttribute('aria-hidden')==='true');record.checks.menu=true;
  await page.locator('#hxFctaToggle').click();if(await page.locator('#hxFctaFormBtn').isVisible().catch(()=>false))await page.locator('#hxFctaFormBtn').click();await page.locator('#hxFctaModal[aria-hidden="false"]').waitFor();await page.waitForTimeout(600);await shot('consultation');await page.locator('#hxFctaModalClose').click();await page.waitForFunction(()=>document.querySelector('#hxFctaModal')?.getAttribute('aria-hidden')==='true');record.checks.consultation=true;
  if(record.errors.length)throw Error('Browser errors');
 }catch(e){record.failure=e.message;summary.failures.push({id,error:e.message});await shot('failure').catch(()=>{});}finally{fs.writeFileSync(`${out}/${id}.json`,JSON.stringify(record,null,2));console.log(JSON.stringify({id,failure:record.failure,images:record.images,checks:record.checks}));await context.close();}
}
for(const width of [390,600,850,1440])for(const variant of ['baseline','candidate'])await visit(width,variant);
for(const width of [390,1440])await visit(width,'unchanged','www.helix-amc.com');
await browser.close();
for(const width of [390,600,850,1440])for(const label of ['page','menu','consultation']){
 const aPath=`${out}/staging-${width}-baseline-${label}.png`,bPath=`${out}/staging-${width}-candidate-${label}.png`;if(!fs.existsSync(aPath)||!fs.existsSync(bPath))continue;
 const a=PNG.sync.read(fs.readFileSync(aPath)),b=PNG.sync.read(fs.readFileSync(bPath));if(a.width!==b.width||a.height!==b.height){summary.failures.push({width,label,error:'dimensions differ'});continue;}
 const diff=new PNG({width:a.width,height:a.height});const count=pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:0.1});const ratio=count/(a.width*a.height);summary.comparisons.push({width,label,pixels:count,ratio,rawEqual:a.data.equals(b.data)});fs.writeFileSync(`${out}/diff-${width}-${label}.png`,PNG.sync.write(diff));if(ratio>0.002)summary.failures.push({width,label,ratio});
}
fs.writeFileSync(`${out}/summary.json`,JSON.stringify(summary,null,2));console.log('STAGING_SUMMARY '+JSON.stringify(summary));if(summary.failures.length)process.exitCode=1;
