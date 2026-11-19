#!/usr/bin/env node
// Additional original-source placement evidence. No runtime or baseline changes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pw,repo,assertBrowser}=require('./runtime.cjs');const {install}=require('./network.cjs');
const input=process.env.HELIX_ADOPTION_INPUTROOT,output=process.env.HELIX_ADOPTION_OUTPUT;
assert.ok(input&&output);assert.equal(process.env.HELIX_VISUAL_RECORD,'0');
const rows=[];const save=pass=>fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({rows,pass,scope:'12 original Git-source vs actual candidate modal placements; not original CDN reachability',originalCDNVerified:false},null,2));
async function rects(page){return page.evaluate(()=>[...document.querySelectorAll('.hx-fcta-modal__box,.hx-fcta-modal__box *')].map(e=>({tag:e.tagName,cls:e.className,rect:e.getBoundingClientRect().toJSON()})));}
async function settle(page){await page.mouse.move(0,0);await page.evaluate(async()=>{await document.fonts.ready;const box=document.querySelector('.hx-fcta-modal__box');await Promise.all(document.getAnimations().filter(a=>a instanceof CSSTransition&&box.contains(a.effect.target)).map(a=>a.finished.catch(()=>{})));for(const a of document.getAnimations())if(a.effect.getTiming().iterations===Infinity){a.pause();a.currentTime=0;}for(const v of document.querySelectorAll('video')){v.pause();if(v.readyState>=2&&v.currentTime>.001)await new Promise((ok,no)=>{const t=setTimeout(()=>no(Error('Video seek did not settle')),5000);v.addEventListener('seeked',()=>{clearTimeout(t);ok();},{once:true});v.currentTime=0;});}await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});assert.equal(await page.locator('.hx-fcta-form__submit').evaluate(e=>e.matches(':hover')),false);}
(async()=>{fs.mkdirSync(output,{recursive:true});const b=await pw.chromium.launch({executablePath:process.env.HELIX_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});assertBrowser(b);try{
 for(const slug of['discover-helix','services','faq','internal-medicine'])for(const width of[390,820,1440]){
  const row={slug,width,states:{},onePixel:null};try{
   for(const version of['original','candidate']){
    const ctx=await b.newContext({viewport:{width,height:width===820?1180:width===390?844:900},locale:'ko-KR',timezoneId:'Asia/Seoul',serviceWorkers:'block'});const net=await install(ctx,{inputRoot:path.join(input,'staging',version,slug),extraRoots:[]}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{await page.goto(net.origin+'/'+slug,{waitUntil:'domcontentloaded'});await page.waitForTimeout(8000);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,0));await page.locator('.hx-fcta-form-btn').click();await page.waitForTimeout(450);await settle(page);const state=await rects(page);row.states[version]=state;
     await page.screenshot({path:path.join(output,slug+'-'+width+'-'+version+'-modal-viewport.png'),animations:'disabled',caret:'hide',scale:'css'});
     if(version==='candidate'){
      assert.deepEqual(state,row.states.original,'Every modal-node viewport coordinate and size must match original source');
      if(slug==='discover-helix'&&width===390){
       const prior=await page.locator('.hx-fcta-modal__box').evaluate(e=>{const before={value:e.style.getPropertyValue('translate'),priority:e.style.getPropertyPriority('translate')};e.style.setProperty('translate','1px 0','important');return before;});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const injected=await rects(page);assert.throws(()=>assert.deepEqual(injected,row.states.original));assert.equal(injected[0].rect.x-state[0].rect.x,1);
       await page.locator('.hx-fcta-modal__box').evaluate((e,p)=>{if(p.value)e.style.setProperty('translate',p.value,p.priority);else e.style.removeProperty('translate');},prior);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const restored=await rects(page);assert.deepEqual(restored,row.states.original);row.onePixel={detected:true,deltaX:1,onlyInjectedPropertyRestored:true,exactGeometryRestored:true};
      }
     }
     assert.deepEqual(errors,[]);assert.deepEqual(net.audit.errors,[]);assert.deepEqual(net.audit.overlays,[]);assert.equal(net.audit.forwarded,0);row[version+'Network']=net.audit;
    }finally{await ctx.close();}
   }
   row.pass=true;rows.push(row);save(false);console.log(slug,width,'PASS absolute modal geometry');
  }catch(e){row.pass=false;row.error=e.message;rows.push(row);save(false);throw e;}
 }
 save(true);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
