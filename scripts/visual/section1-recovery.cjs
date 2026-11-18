#!/usr/bin/env node
// Actual archived GSAP recovery must finish the Hero, not merely occupy its guard.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {pw,repo,assertBrowser}=require('./runtime.cjs'),{install}=require('./network.cjs');
const base='3f73eca33bf11791b918f671f3af7a6e7b02179d',file='home/section1/section1.js';
const out=process.env.HELIX_STRUCTURE_OUTPUT||path.join(repo,'.visual-results/section1-recovery');
const files=['global/bootstrap.js','global/global.css','global/floating-cta.css','home/global/hamburger.css','home/global/hamburger.js','home/global/coming-soon.js','home/global/sections-animations.js','home/global/buttons.js',file];
const scenarios=(process.env.HELIX_S1_SCENARIOS||'normal,delay,transient,exhausted,after-head,permanent').split(',');
const widths=(process.env.HELIX_S1_WIDTHS||'1440,820,390').split(',').map(Number);
const gsapURL='https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const h=w=>w===820?1180:w===390?844:900;
async function snapshot(page){return page.evaluate(()=>{
 const sel=['header','.blackframe_image-hero','.home_slogan','.bt-box-1','#hx-hero-milestones','#hx-branch-quickbar','.hx-fcta-shell'];
 const hero=document.querySelector('.blackframe_image-hero'),slogan=document.querySelector('.home_slogan:not([data-s1-ghost])'),button=document.querySelector('.bt-box-1:not([data-s1-ghost])');
 if(!hero||!slogan||!button)return {available:false,t:performance.now(),claim:!!window.__HELIX_SECTION1_LOADED__,ready:document.documentElement.classList.contains('hx-home-ready'),events:window.__s1Trace.events,states:window.__s1Trace.states};
 const cs=getComputedStyle(slogan),family=cs.fontFamily.split(',')[0].trim().replace(/["']/g,'').toLowerCase();
 return {t:performance.now(),claim:!!window.__HELIX_SECTION1_LOADED__,ready:document.documentElement.classList.contains('hx-home-ready'),
  events:window.__s1Trace.events,states:window.__s1Trace.states,ghosts:document.querySelectorAll('[data-s1-ghost]').length,
  nested:hero.contains(slogan)&&hero.contains(button),loop:button.classList.contains('is-looping'),
  loadedFace:Array.from(document.fonts).some(f=>f.family.replace(/["']/g,'').toLowerCase()===family&&f.status==='loaded'),
  natural:sel.flatMap(s=>[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length&&!e.closest('[data-s1-ghost]')).map(e=>{const c=getComputedStyle(e);return {selector:s,text:e.textContent,box:e.getBoundingClientRect().toJSON(),type:[c.fontFamily,c.fontSize,c.fontWeight,c.lineHeight],opacity:c.opacity};}))};
 });}
async function expose(page){const result=[];for(const sel of ['.home_background_2',await page.evaluate(()=>innerWidth<=767)?'.home_background_3-mobile':'.home_background_3']){
 await page.locator(sel+' h2.home_title').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-innerHeight*.5));
 await page.waitForTimeout(2350);
 result.push(await page.locator(sel).evaluate(e=>{const heading=e.querySelector('h2.home_title'),b=e.querySelector('.bt-box-2,.bt-box-3');return {heading:getComputedStyle(heading).opacity,button:getComputedStyle(b).opacity,loop:b.classList.contains('is-looping')};}));
 }return result;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});for(const f of files){const p=path.join(out,'before',f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f===file?execFileSync('git',['show',base+':'+f],{cwd:repo}):fs.readFileSync(path.join(repo,f)));}
 const browser=await pw.chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});assertBrowser(browser);
 const result={base,source:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),testSHA256:hash(fs.readFileSync(__filename)),input:'Exact archived URLs; native failure/restoration is controlled input, no historical alias',results:[],pass:false};
 try{for(const width of widths)for(const scenario of scenarios){const repeats=process.env.HELIX_S1_REPEATS?Number(process.env.HELIX_S1_REPEATS):width!==820&&['normal','exhausted'].includes(scenario)?3:1;
 for(let repeat=0;repeat<repeats;repeat++){const pair={width,scenario,repeat};for(const version of ['original','candidate']){
 const dir=path.join(out,`${width}-${scenario}-${repeat}-${version}`);fs.mkdirSync(dir);
 process.env.HELIX_VISUAL_OVERLAY=files.join(',');process.env.HELIX_VISUAL_OVERLAY_ROOT=version==='original'?path.join(out,'before'):repo;
 const ctx=await browser.newContext({viewport:{width,height:h(width)},locale:'ko-KR',timezoneId:'Asia/Seoul',serviceWorkers:'block'});
 const net=await install(ctx,{inputRoot:process.env.HELIX_INTERACTION_INPUT,extraRoots:[...process.env.HELIX_INTERACTION_EXTRAS.split(','),...(process.env.HELIX_FIRSTPAINT_EXTRAS||'').split(',').filter(Boolean)]});
 const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.text().startsWith('[Section1]'))page.evaluate(text=>{window.__s1Trace.states.push({t:performance.now(),text});},m.text()).catch(()=>{});});
 const exhausted=['exhausted','after-head','permanent'].includes(scenario);
 const failed=exhausted?page.waitForEvent('console',{predicate:c=>c.text()==='[Section1] init failed after 40 retries',timeout:18000}):null;
 await ctx.addInitScript(({moduleSource,version})=>{
  window.DEBUG_SECTION1=true;
  const t=window.__s1Trace={events:[],states:[],frames:[],loads:[],listeners:[],ghostBirths:0,maxGhosts:0,fades:[],loops:[],phase:'cold',reentries:[]};
  const originalLog=console.log;console.log=function(...args){const line=args.join(' ');if(!t.reentries.length&&(version==='candidate'?line==='[Section1] state: running':line.startsWith('[Section1] selectors found:'))){t.reentries.push({t:performance.now(),guard:window.__HELIX_SECTION1_LOADED__,at:line,kind:'Controlled re-evaluation of exact module bytes while initialization starts'});(0,eval)(moduleSource);}return originalLog.apply(this,args);};
  const now=()=>performance.now();for(const name of ['helix-s1-ready','helix-s1-done'])window.addEventListener(name,()=>t.events.push({name,t:now(),ghosts:document.querySelectorAll('[data-s1-ghost]').length}));
  const add=document.addEventListener,remove=document.removeEventListener;
  document.addEventListener=function(name,fn,opt){if(fn?.name==='resumeAfterDependencyLoad')t.listeners.push({op:'add',name,t:now()});return add.call(this,name,fn,opt);};
  document.removeEventListener=function(name,fn,opt){if(fn?.name==='resumeAfterDependencyLoad')t.listeners.push({op:'remove',name,t:now()});return remove.call(this,name,fn,opt);};
  document.addEventListener('load',e=>{if(e.target.tagName==='SCRIPT')t.loads.push({url:e.target.src,t:now(),gsap:!!window.gsap});if(!window.gsap||gsap.__s1Instrumented)return;gsap.__s1Instrumented=true;const to=gsap.to;gsap.to=function(target,vars){if(target&&typeof target.v==='number'&&vars?.v===1){const complete=vars.onComplete;vars={...vars,onComplete:function(){t.fades.push({t:now(),ease:vars.ease,duration:vars.duration,delay:vars.delay,v:target.v});if(complete)complete.apply(this,arguments);}};}return to.call(this,target,vars);};},true);
  new MutationObserver(rs=>{for(const r of rs){for(const n of r.addedNodes||[]){if(n.nodeType===1&&n.hasAttribute('data-s1-ghost'))t.ghostBirths++;}if(r.type==='attributes'&&r.target.matches?.('.bt-box-1')&&r.target.classList.contains('is-looping'))t.loops.push({t:now()});}}).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  let last='';function frame(){if(t.stop)return;const s=document.querySelector('.home_slogan:not([data-s1-ghost])'),b=document.querySelector('.blackframe_image-hero');if(s&&b){const c=getComputedStyle(s),box=s.getBoundingClientRect(),state={phase:t.phase,ready:document.documentElement.classList.contains('hx-home-ready'),sloganOpacity:c.opacity,heroOpacity:getComputedStyle(b).opacity,width:box.width,height:box.height,font:c.fontFamily,ghosts:document.querySelectorAll('[data-s1-ghost]').length};t.maxGhosts=Math.max(t.maxGhosts,state.ghosts);const key=JSON.stringify(state);if(key!==last){t.frames.push({t:now(),...state});last=key;}}requestAnimationFrame(frame);}requestAnimationFrame(frame);
 },{moduleSource:fs.readFileSync(path.join(process.env.HELIX_VISUAL_OVERLAY_ROOT,file),'utf8'),version});
 let attempts=0,release,requested;const held=new Promise(r=>release=r),seen=new Promise(r=>requested=r);
 await ctx.route('**/*',async route=>{if(route.request().url()!==gsapURL)return route.fallback();attempts++;requested();if(scenario==='permanent'||['transient','exhausted','after-head'].includes(scenario)&&attempts===1)return route.abort('failed');if(scenario==='delay'&&attempts===1)await held;return route.fallback();});
 let beforeRestore=null,ownerFailure=null,final=null,trace=null,sections=null,transitions=[];
 try{
  await page.goto(net.origin,{waitUntil:'commit'});await seen;
  if(scenario==='delay'){await page.waitForTimeout(3000);beforeRestore=await snapshot(page);assert.equal(beforeRestore.events.length,0);assert.equal(beforeRestore.ready,false,'A pending parser/dependency is not firstpaint completion');release();}
  else release();
  if(scenario==='transient'){await page.waitForFunction(()=>window.__HELIX_SECTION1_LOADED__);await page.waitForTimeout(500);beforeRestore=await snapshot(page);assert.equal(beforeRestore.events.length,0);await page.addScriptTag({url:gsapURL});}
  if(exhausted){ownerFailure=(await failed).text();beforeRestore=await snapshot(page);assert.equal(beforeRestore.claim,true);assert.equal(beforeRestore.events.length,0);const url=await page.locator('script[src*="/home/section1/section1.js"]').first().getAttribute('src');await page.addScriptTag({url});await page.waitForTimeout(150);
   if(scenario==='after-head'||scenario==='permanent'){await page.waitForFunction(()=>document.documentElement.classList.contains('hx-home-ready'));await page.waitForTimeout(150);beforeRestore=await snapshot(page);}
   if(scenario!=='permanent'){await page.evaluate(()=>window.__s1Trace.phase='restore');await page.addScriptTag({url:gsapURL});}
  }
  const working=scenario!=='permanent'&&(!exhausted||version==='candidate');
  if(working){await page.waitForFunction(()=>window.__s1Trace.events.filter(e=>e.name==='helix-s1-done').length===1);await page.locator('.bt-box-1.is-looping').waitFor();await page.waitForFunction(()=>document.documentElement.classList.contains('hx-home-ready'));}
  else await page.waitForTimeout(2800);
  await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);final=await snapshot(page);
  const ownURL=await page.locator('script[src*="/home/section1/section1.js"]').first().getAttribute('src');
  for(let i=0;i<2;i++)await page.addScriptTag({url:ownURL});await page.waitForTimeout(200);
  const duplicate=await snapshot(page);assert.deepEqual(duplicate.events,final.events,'Repeated module execution must not replay Hero events');
  await page.screenshot({path:path.join(dir,'final.png')});
  if(scenario!=='permanent'){sections=await expose(page);if(working||scenario==='exhausted')assert.ok(sections.every(s=>s.heading==='1'&&s.button==='1'&&s.loop));}
  if(working&&['normal','exhausted'].includes(scenario)&&repeat===0){for(const next of width===1440?[390,820,1440]:width===390?[820,1440,390]:[390,1440,820]){await page.setViewportSize({width:next,height:h(next)});await page.waitForTimeout(650);const section=await expose(page),s=await snapshot(page);assert.equal(s.events.length,2);assert.equal(s.ghosts,0);assert.equal(s.nested,true);assert.ok(section.every(x=>x.button==='1'&&x.loop));transitions.push({width:next,events:s.events,sections:section,zigPaths:await page.locator('svg .helix-line-path').count()});assert.ok(transitions.at(-1).zigPaths>0);}}
  trace=await page.evaluate(()=>{window.__s1Trace.stop=true;return window.__s1Trace;});
  fs.writeFileSync(path.join(dir,'attempt.json'),JSON.stringify({beforeRestore,ownerFailure,final,duplicate,sections,transitions,trace,errors,network:net.audit},null,2));
  assert.equal(final.claim,true);assert.equal(final.ghosts,0);assert.equal(final.nested,true);
  assert.equal(final.events.filter(e=>e.name==='helix-s1-ready').length,working?1:0);
  assert.equal(final.events.filter(e=>e.name==='helix-s1-done').length,working?1:0);
  if(working){assert.equal(trace.reentries.length,1);assert.equal(trace.reentries[0].guard,true);assert.equal(final.loop,true);assert.equal(final.loadedFace,true);assert.ok(final.natural.filter(n=>['.blackframe_image-hero','.home_slogan','.bt-box-1'].includes(n.selector)).every(n=>n.opacity==='1'));assert.ok(trace.ghostBirths<=2);assert.ok(trace.maxGhosts<=2);const fade=trace.fades.find(f=>f.ease==='expo.out');assert.ok(fade&&trace.loops.length===1&&trace.loops[0].t-fade.t>=1490,'Actual Hero fade then 1.5s hold then single loop');
   const visible=trace.frames.filter(f=>f.ready&&f.phase==='restore');if(scenario==='after-head'){const exposed=visible.filter(f=>Number(f.heroOpacity)>.99);assert.ok(exposed.length&&exposed.every(f=>Number(f.sloganOpacity)>.99),'Late recovery must expose the real slogan with its background, not leave a newly blank slogan');assert.equal(new Set(exposed.map(f=>JSON.stringify([f.width,f.height,f.font]))).size,1,'Actual exposed typography remains stable through recovery');}
   if(version==='candidate'){assert.ok(trace.states.some(s=>s.text==='[Section1] state: running'));assert.ok(trace.states.some(s=>s.text==='[Section1] state: complete'));}
  }
  if(exhausted&&version==='candidate'){assert.equal(trace.listeners.filter(l=>l.op==='add').length,1);assert.equal(trace.listeners.filter(l=>l.op==='remove').length,scenario==='permanent'?0:1);assert.ok(trace.states.some(s=>s.text==='[Section1] state: failed'));}
  assert.deepEqual(errors,[]);assert.deepEqual(net.audit.errors,[]);assert.equal(net.audit.forwarded,0);assert.equal(attempts,['normal','delay','permanent'].includes(scenario)?1:2,'Only fixture restoration may request GSAP again');
  pair[version]={beforeRestore,ownerFailure,final,sections,transitions,trace,network:net.audit,sourceSHA256:hash(fs.readFileSync(path.join(process.env.HELIX_VISUAL_OVERLAY_ROOT,file))),attempts,working,pass:true};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(pair[version],null,2));
  console.log(width,scenario,repeat,version,working?'actual Hero complete':'actual Hero incomplete, explicit failure');
 }catch(e){fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({message:e.message,beforeRestore,ownerFailure,final,sections,transitions,trace,errors,network:net.audit},null,2));throw e;}
 finally{release();await ctx.close();}
 }if(['normal','delay','transient'].includes(scenario))assert.deepEqual(pair.candidate.final.natural,pair.original.final.natural,'Unrelated final layout and typography must remain exact');
 const golden=result.results.find(p=>p.width===width&&p.scenario==='normal');if(golden&&scenario!=='permanent')assert.deepEqual(pair.candidate.final.natural,golden.original.final.natural,'Recovered Hero and neighboring layout match the original normal contract');
 pair.pass=true;result.results.push(pair);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
 }}}finally{delete process.env.HELIX_VISUAL_OVERLAY_ROOT;await browser.close();}
 result.pass=true;fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
