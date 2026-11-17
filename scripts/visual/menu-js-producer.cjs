#!/usr/bin/env node
// Replay a real page owner whose first native JS error precedes shared entry.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const{pw,repo,assertBrowser}=require('./runtime.cjs'),{install}=require('./network.cjs');
const base=process.env.HELIX_STRUCTURE_BASE||'db1c0344387440a93d4c7a740b65809e0a29eac6',out=process.env.HELIX_STRUCTURE_OUTPUT||path.join(repo,'.visual-results/menu-js-producer');
const files=['global/bootstrap.js','global/global.css','global/floating-cta.css','home/global/hamburger.css','home/global/hamburger.js'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const producerOriginal=execFileSync('git',['show',base+':services/bootstrap.js'],{cwd:repo,encoding:'utf8'}),producerCandidate=fs.readFileSync(path.join(repo,'services/bootstrap.js'),'utf8');
const fn=s=>s.slice(s.indexOf('  function injectJs('),s.indexOf('  function loadFile('));
(async()=>{fs.mkdirSync(out,{recursive:true});for(const f of files){const p=path.join(out,'baseline',f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f==='global/bootstrap.js'?execFileSync('git',['show',base+':'+f],{cwd:repo}):fs.readFileSync(path.join(repo,f)));}
const input=path.resolve(process.env.HELIX_STRUCTURE_PAGE_INPUTS+'/services'),manifest=JSON.parse(fs.readFileSync(path.join(input,'manifest.json')));
// Keep historical replay explicit. New validation can supply a separately
// captured CURRENT branch response; it never replaces the historical corpus.
let derived,fallbackFixture;
if(process.env.HELIX_CURRENT_FALLBACK_INPUT){
 derived=path.resolve(process.env.HELIX_CURRENT_FALLBACK_INPUT);
 const fixture=JSON.parse(fs.readFileSync(path.join(derived,'manifest.json'))),url='https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/home/global/hamburger.js',entry=fixture.requests[url];
 assert.ok(entry?.capturedAt&&entry.status===200);const bytes=fs.readFileSync(path.join(derived,'bodies',entry.sha256));assert.equal(hash(bytes),entry.sha256);
 fallbackFixture={kind:'actual CURRENT branch capture; not historical response reconstruction',url,SHA256:entry.sha256,capturedAt:entry.capturedAt,syntheticAlias:false};
}else{
// The historical corpus has no successful @main JS fallback response. Model
// that response explicitly from an existing archived immutable body, never a
// new live download, and keep its derivation separate from the raw corpus.
const alias='https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@main/home/global/hamburger.js';
assert.ok(!manifest.requests[alias]);
const archived=Object.entries(manifest.requests).find(([u])=>/@ba91d70d93f8a1b54ca499b0ca942c0710d025e7\/home\/global\/hamburger\.js$/.test(u));assert.ok(archived);
const fallbackBytes=fs.readFileSync(path.join(input,'bodies',archived[1].sha256));assert.equal(hash(fallbackBytes),archived[1].sha256);
derived=path.join(out,'derived-js-fallback');fs.mkdirSync(path.join(derived,'bodies'),{recursive:true});fs.writeFileSync(path.join(derived,'bodies',archived[1].sha256),fallbackBytes);fs.writeFileSync(path.join(derived,'manifest.json'),JSON.stringify({schema:1,target:'production',requests:{[alias]:archived[1]}}));
fallbackFixture={kind:'synthetic URL alias to archived immutable response; not historical branch-response evidence',fromURL:archived[0],fromSHA256:archived[1].sha256,toURL:alias,latestNetworkResponseUsed:false};
}
const browser=await pw.chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),results=[];
try{assertBrowser(browser);for(const owner of(process.env.HELIX_JS_OWNERS||'pinned,current').split(','))for(const width of(process.env.HELIX_JS_WIDTHS||'1440,390').split(',').map(Number))for(const scenario of(process.env.HELIX_JS_SCENARIOS||'normal,once,twice,permanent').split(','))for(const version of(process.env.HELIX_JS_VERSIONS||'original,candidate').split(',')){
const sharedCandidate=version==='candidate'||version==='shared-only',ownerCandidate=version==='candidate'||version==='producer-only';
process.env.HELIX_VISUAL_OVERLAY=files.join(',');process.env.HELIX_VISUAL_OVERLAY_ROOT=sharedCandidate?repo:path.join(out,'baseline');
const ctx=await browser.newContext({viewport:{width,height:900},locale:'ko-KR',timezoneId:'Asia/Seoul',serviceWorkers:'block'}),net=await install(ctx,{inputRoot:input,extraRoots:[...(process.env.HELIX_INTERACTION_EXTRAS||'').split(',').filter(Boolean).map(p=>path.resolve(p)),derived]}),page=await ctx.newPage(),requests=[],errors=[],owners=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
await ctx.addInitScript(()=>{window.__menuJsNative=[];for(const type of['error','load'])document.addEventListener(type,e=>{if(e.target instanceof HTMLScriptElement&&/\/home\/global\/hamburger\.js(?:[?#]|$)/.test(e.target.src))window.__menuJsNative.push({type,url:e.target.src,sharedAlready:!!window.__helixSharedUiInit,phase:document.readyState,errorURL:e.target.getAttribute('data-helix-menu-js-error')});},true);});
// Reorder only response delivery. The failure is a real browser resource error,
// not a dispatched synthetic event or an invented timeout recovery policy.
await ctx.route(u=>u.pathname.endsWith('/global/bootstrap.js'),async route=>{await page.waitForFunction(()=>window.__menuJsNative.length>0);return route.fallback();});
await ctx.route(u=>u.pathname.endsWith('/services/bootstrap.js'),async route=>{const url=route.request().url().split('?')[0],entry=manifest.requests[url];assert.ok(entry,'The actual requested immutable producer must be in the corpus');const original=fs.readFileSync(path.join(input,'bodies',entry.sha256),'utf8');assert.equal(hash(original),entry.sha256);assert.ok(original.includes(fn(producerOriginal)),'Only the exact producer function may be patched in the actual pinned input');const text=owner==='current'?(ownerCandidate?producerCandidate:producerOriginal):(ownerCandidate?original.replace(fn(producerOriginal),fn(producerCandidate)):original);owners.push({url,inputSHA256:entry.sha256,owner,version,servedSHA256:hash(text),patchOnlyInjectJs:owner==='pinned'});return route.fulfill({status:200,contentType:'application/javascript',body:text});});
await ctx.route(u=>u.pathname.endsWith('/home/global/hamburger.js'),async route=>{const index=requests.push(route.request().url()),fail=scenario==='permanent'||scenario==='twice'&&index<=2||scenario==='once'&&index===1;return fail?route.abort('failed'):route.fallback();});
await page.goto(net.origin+'/services',{waitUntil:'domcontentloaded'});await page.waitForTimeout(8000);await page.evaluate(()=>document.fonts.ready);
const state=await page.evaluate(()=>({events:window.__menuJsNative,menus:document.querySelectorAll('.hx-menu-overlay').length,cta:document.querySelectorAll('.hx-fcta-shell').length,initialized:!!window.__helixHamburgerInit,tags:[...document.querySelectorAll('script[src]')].filter(e=>/\/home\/global\/hamburger\.js(?:[?#]|$)/.test(e.src)).map(e=>({url:e.src,shared:e.hasAttribute('data-helix-shared-ui'),failedURL:e.getAttribute('data-helix-menu-js-error')}))}));
fs.writeFileSync(path.join(out,'last-attempt.json'),JSON.stringify({owner,width,scenario,version,state,requests,owners,errors,network:net.audit},null,2));
assert.ok(owners.length);assert.ok(state.events.length);assert.equal(state.events[0].sharedAlready,false,'First native completion must precede actual shared entry');
const healthy=scenario==='normal'||scenario==='once'||scenario==='twice'&&ownerCandidate,count=scenario==='normal'?1:scenario==='once'?2:!ownerCandidate?2:scenario==='twice'?3:4;
assert.equal(requests.length,count,'The page owner keeps its fallback; shared rescue is bounded');assert.equal(state.menus,healthy?1:0);assert.equal(state.initialized,healthy);assert.equal(state.cta,1);
assert.equal(state.tags.filter(t=>!t.shared).length,scenario==='normal'?1:ownerCandidate?(scenario==='once'?1:0):2,'Only a new producer retires its own native-failed tags; shared never removes foreign tags');
if(version==='candidate'&&scenario!=='normal'){assert.ok(state.tags.filter(t=>!t.shared&&t.failedURL).every(t=>t.failedURL===t.url));if(scenario==='twice'||scenario==='permanent')assert.ok(/@[0-9a-f]{40}\//.test(requests[2]));if(scenario==='permanent')assert.equal(requests[2],requests[3]);}
if(healthy){const b=page.getByRole('button',{name:'메뉴 열기',exact:true}).filter({visible:true}).first();await b.click();assert.equal(await b.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await b.getAttribute('aria-expanded'),'false');}
const n=requests.length;await page.addScriptTag({content:fs.readFileSync(path.join(repo,'global/bootstrap.js'),'utf8')});await page.waitForTimeout(600);assert.equal(requests.length,n);assert.equal(await page.locator('.hx-menu-overlay').count(),state.menus);assert.deepEqual(errors,[]);assert.deepEqual(net.audit.errors,[]);assert.equal(net.audit.forwarded,0);
assert.ok(files.filter(f=>healthy||f!=='home/global/hamburger.js').every(f=>net.audit.overlays.some(x=>x.path===f)));
results.push({owner,width,scenario,version,state,requests,owners,network:net.audit,pageErrors:errors,pass:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({base,fallbackFixture,claim:'Isolated paired source candidate; pinned-owner hunk and current owner both replayed. Fallback evidence kind is explicit above: current real response or historical synthetic control, never interchangeable. Public pin not replaced; deployment reach unverified.',results},null,2));console.log(owner,width,scenario,version,healthy?'PASS':'DEFECT_OR_BOUNDED_FAILURE',requests.length,state.menus);await ctx.close();
}}finally{delete process.env.HELIX_VISUAL_OVERLAY_ROOT;await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
