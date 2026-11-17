const {chromium}=require('playwright');const fs=require('fs');const assert=require('assert/strict');const root=require('path').resolve(__dirname,'..')+'/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox'],proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
try{
for(const width of [1440,390]){
const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width,height:1000},reducedMotion:width===390?'reduce':'no-preference'});
await page.addInitScript(()=>{navigator.sendBeacon=()=>true;});
await page.route(/google-analytics|googletagmanager|script.google|ipify|facebook|tiktok|firebaseio/,r=>r.abort());
await page.route(/\/global\/(bootstrap|ga-inspector)\.js(?:\?|$)/,r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(root+'global/'+r.request().url().match(/(bootstrap|ga-inspector)\.js/)[0],'utf8')}));
await page.goto('https://www.helix-amc.com/diagnostic-imaging?ga-inspect=1',{waitUntil:'domcontentloaded'});
// A bare HTML layout can put the title over the menu. Stop before making a UI
// diagnosis if the published Webflow stylesheet was blocked or failed to load.
try{
 await page.waitForFunction(()=>{
  const links=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(el=>el.href.includes('/css/')&&el.href.includes('.webflow.'));
  return links.length>0&&links.every(el=>el.sheet&&!el.disabled);
 },null,{timeout:8000});
}catch{
 const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(els=>els.filter(el=>el.href.includes('.webflow.')).map(el=>({url:el.href,loaded:!!el.sheet})));
 throw new Error('Webflow 기본 스타일 로딩 실패 — 메뉴 클릭·화면 검증을 중단합니다. 검사환경의 허용 도메인과 네트워크를 확인하세요. '+JSON.stringify(styles));
}
await page.waitForTimeout(7000);
await page.addStyleTag({content:'#hx-gai-panel,#hx-gai-panel *{pointer-events:none!important}'});
await page.locator('#hx-gai-panel').evaluate(el=>{el.style.top='60px';el.style.bottom='auto'});
await page.locator('#hxFctaToggle').click();await page.waitForTimeout(500);
assert(await page.locator('#hxFctaSubmit').isVisible());
assert((await page.locator('.hx-gai-tag').allTextContents()).some(t=>t.includes('폼 제출')));
await page.locator('#hxFctaModalClose').click();
await page.locator('.menu-bar_mobile:visible').first().click();await page.waitForTimeout(500);
assert((await page.locator('.hx-gai-tag').allTextContents()).some(t=>t.includes('메뉴 닫기')));
await page.locator('.hx-menu-close').click();await page.waitForTimeout(500);
await page.screenshot({path:require('path').join(process.env.TMPDIR || '/tmp','imaging-measured-'+width+'.png')});
const result=await page.evaluate(()=>{
 window.__testClicks=[];const gtag=window.gtag;window.gtag=function(...args){if(args[0]==='event')window.__testClicks.push({name:args[1],params:args[2]});return gtag.apply(this,args)};
 document.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
 const controls=[...document.querySelectorAll(window.__helixImagingMeasure.selector)].filter(el=>!el.closest('#helix-noga-badge,[class*="hx-gai-"]')&&!el.disabled);
 const failures=[];
 for(const el of controls){window.__testClicks=[];el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const events=window.__testClicks.filter(e=>e.name==='diagnostic_imaging_click');if(events.length!==1)failures.push({tag:el.tagName,id:el.id,cls:el.className,count:events.length});else if(events[0].params.page!=='diagnostic_imaging'||/fbclid|utm_|PAZX|token=/.test(JSON.stringify(events[0]))) failures.push(events[0]);}
 const before=window.__testClicks.filter(e=>e.name==='diagnostic_imaging_click').length;window.__helixNoMeasure=true;controls[0].click();const excluded=window.__testClicks.filter(e=>e.name==='diagnostic_imaging_click').length===before;
 return {count:controls.length,failures,excluded,inspector:window.__helixGaInspectorInit,badges:document.querySelectorAll('.hx-gai-box').length,title:document.querySelector('.hx-gai-title')?.textContent};
});assert.deepEqual(result.failures,[]);assert(result.excluded);assert(result.inspector);assert(result.badges>0);assert(result.title.includes('diagnostic_imaging'));console.log(width,result);
await page.close();
}
}finally{await browser.close();}})();
