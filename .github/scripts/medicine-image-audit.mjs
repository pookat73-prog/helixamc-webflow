import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire('/tmp/helix-ci-audit/package.json');
const sharp=require('sharp');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const {default:pixelmatch}=await import(pathToFileURL(require.resolve('pixelmatch')));
const out='image-results';fs.mkdirSync(out,{recursive:true});
const url='https://cdn.prod.website-files.com/69d090ea69d828e27d16ea29/6a45e8bd91b794ab174bf80a_%EB%82%B4%EA%B3%BC.jpg';
const response=await fetch(url);if(!response.ok)throw Error('Original HTTP '+response.status);
const original=Buffer.from(await response.arrayBuffer());fs.writeFileSync(out+'/original.jpg',original);
const meta=await sharp(original).metadata();
const raw=await sharp(original).removeAlpha().raw().toBuffer();
const report={time:new Date().toISOString(),url,originalBytes:original.length,metadata:meta,encodings:[],visits:[],comparisons:[]};
const encoders=[['lossless.webp',()=>sharp(original).webp({lossless:true,effort:6}).toBuffer()],['quality95.webp',()=>sharp(original).webp({quality:95,effort:6}).toBuffer()],['quality90.webp',()=>sharp(original).webp({quality:90,effort:6}).toBuffer()]];
for(const [name,encode] of encoders){
  const data=await encode();fs.writeFileSync(out+'/'+name,data);
  const pixels=await sharp(data).removeAlpha().raw().toBuffer();
  let sum=0,max=0,different=0;for(let i=0;i<raw.length;i++){const d=Math.abs(raw[i]-pixels[i]);sum+=d*d;max=Math.max(max,d);if(d)different++;}
  report.encodings.push({name,bytes:data.length,saving:original.length-data.length,pixelsIdentical:raw.equals(pixels),psnr:sum?10*Math.log10(255*255/(sum/raw.length)):null,maxChannelDifference:max,differentChannels:different});
}
const lossless=report.encodings[0];
const candidate=lossless.saving>0?'lossless.webp':'quality95.webp';report.candidate=candidate;report.candidateIsLossless=candidate==='lossless.webp';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const width of [390,1440])for(const variant of ['baseline','candidate']){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1,locale:'ko-KR'});
 const page=await context.newPage();const record={width,variant,errors:[],warnings:[],failedRequests:[],replaced:0};
 page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());if(m.type()==='warning')record.warnings.push(m.text());});page.on('requestfailed',r=>record.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 // Route both variants to disable the browser cache equally; only image bytes differ.
 await page.route('**/*',async route=>{if(route.request().url()===url&&variant==='candidate'){record.replaced++;await route.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync(out+'/'+candidate)});}else await route.continue();});
 try{
  const res=await page.goto('https://www.helix-amc.com/services',{waitUntil:'domcontentloaded',timeout:90000});if(!res.ok())throw Error('Page HTTP '+res.status());
  await page.locator('#hxFctaToggle').waitFor({state:'visible',timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(7000);
  record.elements=await page.evaluate(()=>[...document.querySelectorAll('*')].filter(el=>getComputedStyle(el).backgroundImage.includes('6a45e8bd91b794ab174bf80a')).map(el=>{const s=getComputedStyle(el);return{className:el.className,backgroundImage:s.backgroundImage,backgroundPosition:s.backgroundPosition,backgroundSize:s.backgroundSize,display:s.display,rect:el.getBoundingClientRect().toJSON()};}));
  const visible=record.elements.filter(e=>e.rect.width>0&&e.rect.height>0);if(!visible.length)throw Error('No visible medicine background');
  const el=page.locator('.'+visible[0].className.trim().split(/\s+/).join('.')).first();await el.scrollIntoViewIfNeeded();await page.waitForTimeout(1500);
  await page.screenshot({path:`${out}/${width}-${variant}-page.png`,animations:'disabled'});await el.screenshot({path:`${out}/${width}-${variant}-image.png`,animations:'disabled'});
  record.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const burgers=page.locator('.menu-bar_mobile, .image-18');let burger;
  for(let i=0;i<await burgers.count();i++){if(await burgers.nth(i).isVisible()&&await burgers.nth(i).evaluate(el=>!!el.__hxBurgerBound)){burger=burgers.nth(i);break;}}
  if(!burger)throw Error('No bound menu');await burger.click();await page.locator('.hx-menu-overlay[aria-hidden="false"]').waitFor();await page.locator('.hx-menu-close').click();await page.locator('.hx-menu-overlay[aria-hidden="true"]').waitFor({state:'attached'});record.menu=true;
  await page.locator('#hxFctaToggle').click();if(await page.locator('#hxFctaFormBtn').isVisible().catch(()=>false))await page.locator('#hxFctaFormBtn').click();await page.locator('#hxFctaModal[aria-hidden="false"]').waitFor();await page.locator('#hxFctaModalClose').click();await page.locator('#hxFctaModal[aria-hidden="true"]').waitFor({state:'attached'});record.consultation=true;
  if(record.errors.length||record.overflow)throw Error('Browser errors or overflow');if(variant==='candidate'&&record.replaced===0)throw Error('Candidate not requested');
 }catch(e){record.failure=e.message;}finally{report.visits.push(record);await context.close();}
}
await browser.close();
for(const width of [390,1440])for(const scope of ['page','image']){
 const p=`${out}/${width}-baseline-${scope}.png`,q=`${out}/${width}-candidate-${scope}.png`;
 if(!fs.existsSync(p)||!fs.existsSync(q))continue;
 const a=PNG.sync.read(fs.readFileSync(p)),b=PNG.sync.read(fs.readFileSync(q));
 if(a.width!==b.width||a.height!==b.height){report.comparisons.push({width,scope,dimensionMismatch:true});continue;}
 const diff=new PNG({width:a.width,height:a.height});const count=pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:0.1});fs.writeFileSync(`${out}/${width}-${scope}-diff.png`,PNG.sync.write(diff));
 report.comparisons.push({width,scope,pixels:count,ratio:count/(a.width*a.height),rawEqual:a.data.equals(b.data)});
}
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(report.visits.some(r=>r.failure))process.exitCode=1;
