#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {pw,repo,assertBrowser}=require('./runtime.cjs'),{install}=require('./network.cjs');
const base=process.env.HELIX_STRUCTURE_BASE||'7f4cb178d8b37bbef927f2cd49ea0d5b9e1eab8b';
const output=process.env.HELIX_STRUCTURE_OUTPUT||path.join(repo,'.visual-results/heading-lifecycle');
const files=['home/global/sections-animations.js','home/global/buttons.js','global/global.css','global/floating-cta.css','home/global/hamburger.css','home/global/hamburger.js'];
(async()=>{fs.mkdirSync(output,{recursive:true});for(const f of files){const p=path.join(output,'baseline',f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f.endsWith('/sections-animations.js')?execFileSync('git',['show',base+':'+f],{cwd:repo}):fs.readFileSync(path.join(repo,f)));}
 const browser=await pw.chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];
 try{assertBrowser(browser);for(const start of [1440,820,390]){
 const pair={start,target:start<=767?1440:390};
 for(const version of (process.env.HELIX_LIFECYCLE_VERSIONS||'original,candidate').split(',')){
  process.env.HELIX_VISUAL_OVERLAY=files.join(',');process.env.HELIX_VISUAL_OVERLAY_ROOT=version==='original'?path.join(output,'baseline'):repo;
  const context=await browser.newContext({viewport:{width:start,height:900},locale:'ko-KR',timezoneId:'Asia/Seoul',reducedMotion:start===820?'reduce':'no-preference',serviceWorkers:'block'});
  const network=await install(context,{inputRoot:path.resolve(process.env.HELIX_INTERACTION_INPUT),extraRoots:(process.env.HELIX_INTERACTION_EXTRAS||'').split(',').filter(Boolean).map(p=>path.resolve(p))});
  await context.addInitScript(()=>{
    window.__headingEvents=[];window.__heroDone=0;window.addEventListener('helix-s1-done',()=>window.__heroDone++);
    window.__headingRecord=(e,action)=>window.__headingEvents.push({t:performance.now(),section:e.closest('section')?.className,action,visible:!!e.getClientRects().length,opacity:getComputedStyle(e).opacity});
    const set=CSSStyleDeclaration.prototype.setProperty,remove=CSSStyleDeclaration.prototype.removeProperty;
    for(const [name,original] of [['setProperty',set],['removeProperty',remove]])CSSStyleDeclaration.prototype[name]=function(prop){if(prop==='box-shadow'){const e=[...document.querySelectorAll('.bt-box-2,.bt-box-3')].find(e=>e.style===this);if(e)window.__headingRecord(e,name==='setProperty'?'set':'remove');}return original.apply(this,arguments);};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(network.origin,{waitUntil:'domcontentloaded'});await page.waitForTimeout(7500);
  const targetSection=start<=767?'home_background_3':'home_background_3-mobile',initialSection=start<=767?'home_background_3-mobile':'home_background_3';
  const cold=await page.locator('.'+targetSection+' .bt-box-3').evaluate(e=>({rendered:!!e.getClientRects().length,loop:e.classList.contains('is-looping'),opacity:getComputedStyle(e).opacity}));assert.equal(cold.rendered,false);
  await page.evaluate(()=>{const to=gsap.to;gsap.to=function(target,vars){if(target instanceof Element&&target.matches('.bt-box-2,.bt-box-3')){const done=vars.onComplete;vars={...vars,onComplete:function(){window.__headingRecord(target,'fadeComplete');if(done)done.apply(this,arguments);}};}return to.call(this,target,vars);};});
  const enter=async(section,width)=>{await page.evaluate(()=>scrollTo(0,0));await page.setViewportSize({width,height:900});await page.waitForTimeout(650);await page.locator('.'+section+' .home_title').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-innerHeight*.5));await page.waitForTimeout(2700);};
  await enter(targetSection,pair.target);
  const firstCount=await page.evaluate(section=>window.__headingEvents.filter(e=>e.section===section).length,targetSection);
  await page.evaluate(()=>scrollTo(0,0));await page.setViewportSize({width:start,height:900});await page.waitForTimeout(400);await enter(targetSection,pair.target);
  const reentryCount=await page.evaluate(section=>window.__headingEvents.filter(e=>e.section===section).length,targetSection);assert.equal(reentryCount,firstCount,'Exposed heading does not replay on a warm round trip');
  // The initially visible but unentered copy must survive being hidden before first entry.
  await enter(initialSection,start);
  await page.evaluate(async()=>{await document.fonts.ready;for(const a of document.getAnimations())if(a.effect.getTiming().iterations===Infinity){a.pause();a.currentTime=0;}});
  const row=await page.evaluate(()=>({events:window.__headingEvents,heroDone:window.__heroDone,final:[...document.querySelectorAll('.bt-box-1,.bt-box-2,.bt-box-3,.bt-box-4')].filter(e=>e.getClientRects().length).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{cls:e.className,text:e.textContent,opacity:s.opacity,shadow:s.boxShadow,animation:s.animation,width:r.width,height:r.height};})}));
  row.cold=cold;row.errors=errors;row.networkErrors=network.audit.errors;row.warmExtra=reentryCount-firstCount;
  fs.writeFileSync(path.join(output,`attempt-${start}-${version}.json`),JSON.stringify({...row,network:network.audit},null,2));
  assert.deepEqual(errors,[]);assert.deepEqual(network.audit.errors,[]);assert.equal(network.audit.forwarded,0);assert.ok(row.heroDone>0);
  const visible=row.events.filter(e=>e.section===targetSection&&e.visible);
  if(version==='candidate'){
   assert.equal(cold.loop,false,'Never-exposed hidden copy must not start its loop');assert.equal(row.events.filter(e=>e.section===targetSection&&!e.visible&&e.action==='set').length,0);
   for(const section of [targetSection,initialSection]){const e=row.events.filter(e=>e.section===section&&e.visible),set=e.filter(x=>x.action==='set'),release=e.filter(x=>x.action==='remove'),fade=e.find(x=>x.action==='fadeComplete');assert.equal(set.length,1,'One first-visible start');assert.equal(release.length,1,'One first-visible handoff');assert.ok(fade&&release[0].t-fade.t>=1490,'Visible fade completes before1.5s hold');}
  }else{assert.equal(cold.loop,true,'Original hidden copy starts early');assert.equal(visible.filter(e=>e.action==='set').length,0,'Original skips its visible entrance');}
  pair[version]=row;console.log(start,version,'PASS hidden loop',cold.loop,'visible target starts',visible.filter(e=>e.action==='set').length);await context.close();
 }
 if(pair.original&&pair.candidate)assert.deepEqual(pair.candidate.final,pair.original.final,'All visible button final styles/geometry preserved');results.push(pair);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({base,results},null,2));
 }}finally{delete process.env.HELIX_VISUAL_OVERLAY_ROOT;await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
