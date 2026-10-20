import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('/tmp/helix-ci-audit/package.json');const {chromium}=require('playwright');
const out='medicine-staging-results';fs.mkdirSync(out,{recursive:true});const results=[];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const host of ['helixanimalmedicalcenter.webflow.io','www.helix-amc.com']){
 const context=await browser.newContext({viewport:{width:600,height:1000},deviceScaleFactor:1});const page=await context.newPage();const r={host,errors:[],checks:{}};results.push(r);page.on('pageerror',e=>r.errors.push(e.message));
 try{
  await page.goto('https://'+host+'/services',{waitUntil:'domcontentloaded',timeout:90000});await page.locator('#hxFctaToggle').waitFor({timeout:60000});await page.waitForTimeout(8000);
  r.candidates=await page.locator('.menu-bar_mobile,.image-18').evaluateAll(els=>els.map(el=>{const s=getComputedStyle(el),b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{className:el.className,bound:!!el.__hxBurgerBound,rect:b.toJSON(),pointerEvents:s.pointerEvents,hit:hit?.outerHTML.slice(0,800),hittable:!!hit&&(hit===el||el.contains(hit)),parent:el.parentElement.outerHTML.slice(0,1200)};}));
  let index=r.candidates.findIndex(c=>c.bound&&c.hittable&&c.rect.width>0&&c.rect.height>0);
  if(index<0)throw Error('No directly hittable bound menu trigger at 600px');
  await page.locator('.menu-bar_mobile,.image-18').nth(index).click();await page.locator('.hx-menu-overlay[aria-hidden="false"]').waitFor();r.checks.menuOpened=true;await page.screenshot({path:out+'/'+host+'-600-menu.png'});await page.locator('.hx-menu-close').click();await page.waitForFunction(()=>document.querySelector('.hx-menu-overlay')?.getAttribute('aria-hidden')==='true');r.checks.menuClosed=true;
  await page.locator('#hxFctaToggle').click();if(await page.locator('#hxFctaFormBtn').isVisible().catch(()=>false))await page.locator('#hxFctaFormBtn').click();await page.locator('#hxFctaModal[aria-hidden="false"]').waitFor();r.checks.consultationOpened=true;await page.screenshot({path:out+'/'+host+'-600-consultation.png'});await page.locator('#hxFctaModalClose').click();r.checks.consultationClosed=true;
 }catch(e){r.failure=e.message;}finally{await context.close();console.log('LANDSCAPE '+JSON.stringify(r));fs.writeFileSync(out+'/landscape-menu.json',JSON.stringify(results,null,2));}
}
await browser.close();if(results.some(r=>r.failure))process.exitCode=1;
