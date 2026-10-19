import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('/tmp/helix-ci-audit/package.json');
const {chromium}=require('playwright');
const target='https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6a45e8bd91b794ab174bf80a_%EB%82%B4%EA%B3%BC.jpg';
const candidate='https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@d6fc8c8d4a55d53f3be1a5f3cc26f148bd195b5b/assets/services/internal-medicine-q95.webp';
const css=`\n/* Isolated delivery probe: preserve native image geometry and variable gradient. */\n.dept_image_im {background-image:url("${candidate}") !important;}\n@media (max-width:479px){.dept-card-header_im {background-image:radial-gradient(circle farthest-side at 100% -15%,var(--투명) 36%,var(--메인-블랙) 60%),url("${candidate}") !important;}}\n`;
fs.mkdirSync('delivery-results',{recursive:true});
const report={candidate,css,time:new Date().toISOString(),visits:[]};
const res=await fetch(candidate);report.cdn={status:res.status,type:res.headers.get('content-type'),bytes:(await res.arrayBuffer()).byteLength};if(!res.ok||report.cdn.bytes!==620524)throw Error('Candidate CDN does not match');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const width of [390,1440])for(const variant of ['baseline','css-candidate']){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1});const page=await context.newPage();
 const record={width,variant,network:[],errors:[],failedRequests:[],stylesOverridden:0};report.visits.push(record);
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});const requests=new Map();
 cdp.on('Network.requestWillBeSent',e=>requests.set(e.requestId,{url:e.request.url,start:e.timestamp,receivedBytes:0}));
 cdp.on('Network.responseReceived',e=>Object.assign(requests.get(e.requestId)||{},{status:e.response.status,mimeType:e.response.mimeType}));
 cdp.on('Network.dataReceived',e=>{const r=requests.get(e.requestId);if(r)r.receivedBytes+=e.encodedDataLength;});
 cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)record.network.push({...r,finished:e.timestamp,encodedDataLength:e.encodedDataLength});});
 cdp.on('Network.loadingFailed',e=>{const r=requests.get(e.requestId);if(r)record.network.push({...r,failed:e.errorText,canceled:e.canceled});});
 page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());});page.on('requestfailed',r=>record.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 await page.route('**/*',async route=>{
  if(/\/services\/services\.css(?:\?|$)/.test(route.request().url())){const response=await route.fetch();let body=await response.text();if(variant==='css-candidate'){body+=css;record.stylesOverridden++;}await route.fulfill({response,body});}
  else await route.continue();
 });
 try{
  await page.goto('https://www.helix-amc.com/services',{waitUntil:'domcontentloaded',timeout:90000});await page.locator('#hxFctaToggle').waitFor({timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(9000);
  record.styles=await page.evaluate(()=>['.dept_image_im','.dept-card-header_im'].map(selector=>{const el=document.querySelector(selector);const s=getComputedStyle(el);return{selector,image:s.backgroundImage,position:s.backgroundPosition,size:s.backgroundSize,rect:el.getBoundingClientRect().toJSON()};}));
  await page.screenshot({path:`delivery-results/${width}-${variant}.png`,animations:'disabled'});
  record.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 }catch(e){record.failure=e.message;}finally{record.images=record.network.filter(r=>r.url===target||r.url===candidate);delete record.network;await context.close();}
}
await browser.close();fs.writeFileSync('delivery-results/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.visits.some(r=>r.failure))process.exitCode=1;
