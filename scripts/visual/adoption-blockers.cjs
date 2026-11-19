#!/usr/bin/env node
// Additional blocker scopes derived from source21 adoption-assets (e7dd703c38d7a655a68a407f363acac2c451114321a4daf1c41dc350e70becd2).
// Original Git reproduction and real CDN observations stay separate; previous25/80 are unchanged.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const root = process.env.HELIX_ADOPTION_INPUTROOT, output = process.env.HELIX_ADOPTION_OUTPUT;
const profile = JSON.parse(fs.readFileSync(process.env.HELIX_ADOPTION_PROFILE));
assert.ok(root && output); assert.notEqual(process.env.HELIX_VISUAL_RECORD, '1');
const environment = process.env.HELIX_VISUAL_TARGET || 'production';
const unavailableOriginal = profile.unavailableOriginal?.[environment] || [];
const pages = profile.pages || ['home', 'discover-helix', 'services', 'faq', 'internal-medicine'];
const rows = [], save = () => fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ environment, profile, rows, pass: false }, null, 2));
const pathname = slug => slug === 'home' ? '/' : '/' + slug;
const refFor = slug => profile.pageRefs?.[slug] || (environment === 'staging' && slug === 'home' ? profile.stagingHome : profile.main);
async function wheel(page) { await page.mouse.move(8, 400); await page.mouse.wheel(0, 600); await page.waitForTimeout(400); return page.evaluate(() => scrollY); }
async function menu(page) {
  assert.equal(await page.locator('.hx-menu-overlay').count(), 1);
  const button = page.getByRole('button', { name: '메뉴 열기', exact: true }).filter({ visible: true }).first();
  await page.evaluate(() => scrollTo(0, 0)); await button.click(); await page.waitForTimeout(700);
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  if(profile.captureMenus)await staticMedia(page,()=>page.locator('.hx-menu-overlay').screenshot({path:path.join(output,(new URL(page.url()).pathname.replaceAll('/','')||'home')+'-'+page.viewportSize().width+'-candidate-menu.png'),animations:'disabled'}));
  const start = await page.evaluate(() => scrollY); assert.equal(await wheel(page), start, 'menu background wheel lock');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  assert.ok(await button.evaluate(e => document.activeElement === e), 'menu restores focus');
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.ok(await wheel(page) > start, 'menu releases background wheel');
  await page.evaluate(() => scrollTo(0, 0)); await button.click(); await page.waitForTimeout(400);
  await page.locator('.hx-menu-close').click(); await page.waitForTimeout(400);
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
}
async function form(page, checkPreserved) {
  await page.evaluate(() => scrollTo(0, 0)); await page.locator('.hx-fcta-form-btn').click(); await page.waitForTimeout(400);
  const start = await page.evaluate(() => scrollY); assert.equal(await wheel(page), start, 'form background wheel lock');
  if (checkPreserved) await checkPreserved();
  await page.locator('#hxFcta_owner').fill('검증용 입력');
  await page.locator('#hxFctaPrivacyMore').click(); assert.equal(await page.locator('#hxFctaPrivacyDetail').getAttribute('hidden'), null);
  await page.locator('#hxFctaPrivacyMore').click(); assert.notEqual(await page.locator('#hxFctaPrivacyDetail').getAttribute('hidden'), null);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  assert.ok(await page.locator('.hx-fcta-form-btn').evaluate(e => document.activeElement === e));
  assert.ok(await wheel(page) > start, 'form releases background wheel');
}
async function originalState(t,slug,width) {
  const page=t.page, state={};
  assert.equal(await page.locator('.hx-menu-overlay').count(),1);
  const button=page.getByRole('button',{name:'메뉴 열기',exact:true}).filter({visible:true}).first();
  await page.evaluate(()=>scrollTo(0,0));await button.click();await page.waitForTimeout(700);assert.equal(await button.getAttribute('aria-expanded'),'true');
  await staticMedia(page,()=>page.locator('.hx-menu-overlay').screenshot({path:path.join(output,slug+'-'+width+'-original-menu.png'),animations:'disabled'}));
  let start=await page.evaluate(()=>scrollY);state.menuWheelDelta=(await wheel(page))-start;
  await page.keyboard.press('Escape');await page.waitForTimeout(400);assert.equal(await button.getAttribute('aria-expanded'),'false');state.menuFocus=await button.evaluate(e=>document.activeElement===e);assert.ok(state.menuFocus);
  await page.evaluate(()=>scrollTo(0,0));start=await page.evaluate(()=>scrollY);state.closedMenuWheelDelta=(await wheel(page))-start;assert.ok(state.closedMenuWheelDelta>0);
  await page.evaluate(()=>scrollTo(0,0));await page.locator('.hx-fcta-form-btn').click();await page.waitForTimeout(400);
  start=await page.evaluate(()=>scrollY);state.formWheelDelta=(await wheel(page))-start;
  await page.locator('#hxFcta_owner').fill('검증용 입력');await page.locator('#hxFctaPrivacyMore').click();assert.equal(await page.locator('#hxFctaPrivacyDetail').getAttribute('hidden'),null);await page.locator('#hxFctaPrivacyMore').click();assert.notEqual(await page.locator('#hxFctaPrivacyDetail').getAttribute('hidden'),null);
  await page.keyboard.press('Escape');await page.waitForTimeout(400);state.formFocus=await page.locator('.hx-fcta-form-btn').evaluate(e=>document.activeElement===e);assert.ok(state.formFocus);
  await page.evaluate(()=>scrollTo(0,0));start=await page.evaluate(()=>scrollY);state.closedFormWheelDelta=(await wheel(page))-start;assert.ok(state.closedFormWheelDelta>0);
  state.baselineBehaviorOnly=true;state.bothBackgroundLocksObserved=state.menuWheelDelta===0&&state.formWheelDelta===0;return state;
}
async function contract(page) {
  return page.evaluate(() => ({
    title: document.title, height: document.documentElement.scrollHeight,
    viewport: [innerWidth, innerHeight, document.documentElement.scrollWidth],
    policy: [document.documentElement, document.body].map(e => [getComputedStyle(e).overflowX, getComputedStyle(e).overflowY, getComputedStyle(e).transform]),
    headings: [...document.querySelectorAll('h1,h2')].map(e => [e.textContent.trim(), ...['fontFamily','fontWeight','fontSize','lineHeight','letterSpacing'].map(k => getComputedStyle(e)[k])]),
    links: [...document.querySelectorAll('a[href]')].map(e => [e.textContent.trim(), e.getAttribute('href')]),
    fixed: [...document.querySelectorAll('header,.hx-fcta-shell')].map(e => ({ cls: e.className, rect: e.getBoundingClientRect().toJSON() })),
    counts: ['.hx-menu-overlay','.hx-fcta-modal','.helix-top-btn'].map(s => document.querySelectorAll(s).length),
  }));
}
// Same static-image precondition as form-label-wrap: rounded corners include the page video.
async function freezeMedia(page){return page.evaluate(async()=>{await document.fonts.ready;for(const a of document.getAnimations())if(a.effect.getTiming().iterations===Infinity){a.pause();a.currentTime=0;}for(const v of document.querySelectorAll('video')){v.pause();if(v.readyState>=2&&v.currentTime>.001)await new Promise((ok,no)=>{const t=setTimeout(()=>no(Error('Video seek did not settle')),5000);v.addEventListener('seeked',()=>{clearTimeout(t);ok();},{once:true});v.currentTime=0;});}await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return [...document.querySelectorAll('video')].map(v=>({time:v.currentTime,paused:v.paused,ready:v.readyState}));});}

async function staticMedia(page, check) {
  const prior = await page.evaluateHandle(() => ({
    animations: document.getAnimations().filter(a=>a.effect.getTiming().iterations===Infinity).map(a=>({a,time:a.currentTime,state:a.playState})),
    videos: [...document.querySelectorAll('video')].map(v=>({v,time:v.currentTime,paused:v.paused})),
  }));
  try {
    const media=await freezeMedia(page);
    assert.ok(media.every(v=>v.paused&&v.time<=.001),'Static PNG must use the same paused first media frame');
    return await check(media);
  } finally {
    await page.evaluate(async prior=>{
      for(const s of prior.animations){s.a.currentTime=s.time;if(s.state==='running')s.a.play();else if(s.state==='idle')s.a.cancel();else s.a.pause();}
      for(const s of prior.videos){s.v.currentTime=s.time;if(!s.paused)await s.v.play();}
    },prior);
    await prior.dispose();
  }
}
async function neutralFormPointer(page) {
  await page.mouse.move(0,0);
  await page.evaluate(async()=>{
    const box=document.querySelector('.hx-fcta-modal__box');
    await Promise.all(document.getAnimations().filter(a=>a instanceof CSSTransition&&box.contains(a.effect.target)).map(a=>a.finished.catch(()=>{})));
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  });
  assert.equal(await page.locator('.hx-fcta-form__submit').evaluate(e=>e.matches(':hover')),false,'Compare the same neutral pointer state; hover is tested separately');
}
async function modalContract(page) {
  return page.evaluate(()=>[...document.querySelectorAll('.hx-fcta-modal__box,.hx-fcta-modal__box *')].map(e=>({
    tag:e.tagName,cls:e.className,rect:e.getBoundingClientRect().toJSON(),
    css:Object.fromEntries([...getComputedStyle(e)].map(p=>[p,getComputedStyle(e).getPropertyValue(p)])),
  })));
}

async function open(browser, slug, width, version) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 820 ? 1180 : width === 390 ? 844 : 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
  const net = await install(ctx, { inputRoot: path.join(root, environment, version, slug), extraRoots: [] }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (slug === 'home') await ctx.addInitScript(() => {
    window.__adoptionHero = [];
    for (const name of ['helix-s1-ready','helix-s1-done']) window.addEventListener(name,()=>window.__adoptionHero.push(name));
  });
  return { ctx, net, page, errors };
}
function clean(t, slug, version) {
  assert.deepEqual(t.errors, []); assert.deepEqual(t.net.audit.errors, []); assert.equal(t.net.audit.forwarded, 0); assert.deepEqual(t.net.audit.overlays, []);
  if (version === 'candidate') {
    const runtime = t.net.audit.requests.filter(r => r.repoPath && r.ref === refFor(slug));
    for (const p of ['global/bootstrap.js', 'home/global/hamburger.js', 'home/global/hamburger.css']) assert.ok(runtime.some(r => r.repoPath === p), 'Actual selected path not consumed: ' + p);
    assert.ok(runtime.some(r => r.repoPath === ({home:'home', 'discover-helix':'about'}[slug] || slug) + '/bootstrap.js'), 'Actual producer not consumed');
  }
}
async function navigate(t, slug) { await t.page.goto(t.net.origin + pathname(slug), { waitUntil: 'domcontentloaded' }); await t.page.waitForTimeout(8000); await t.page.evaluate(() => document.fonts.ready); }
async function fault(browser, slug, asset, scenario) {
  const t = await open(browser, slug, 1440, 'candidate'), {ctx,page} = t, requests = [], api = [], audit = { slug, asset, scenario, ref:refFor(slug) };
  let finishProducer; const failed = new Promise(r => finishProducer = r);
  await ctx.addInitScript(() => {
    window.__adoptionNative = []; window.__adoptionLoad = null; window.__adoptionSharedBoot = null; window.__adoptionClaims = 0;
    let claim; Object.defineProperty(window, '__helixHamburgerInit', { configurable:true, get:()=>claim, set:v=>{claim=v;if(v)window.__adoptionClaims++;} });
    window.addEventListener('load',()=>window.__adoptionLoad=performance.now(),{once:true});
    const remove = Document.prototype.removeEventListener;
    Document.prototype.removeEventListener = function(type,fn,opts){if(type==='error' && fn && fn.name==='rememberMenuResult')window.__adoptionSharedBoot=performance.now();return remove.call(this,type,fn,opts);};
    for(const kind of ['load','error'])document.addEventListener(kind,e=>{const url=e.target.src||e.target.href||'';if(/\/home\/global\/hamburger\.(?:css|js)(?:[?#]|$)/.test(url))window.__adoptionNative.push({kind,url,shared:e.target.hasAttribute('data-helix-shared-ui'),at:performance.now()});},true);
  });
  if (scenario === 'late-api') {
    assert.equal(environment, 'staging');
    let pending; const entered = new Promise(r => pending = r); audit.pending = entered;
    await ctx.route(u=>u.hostname==='api.github.com'&&u.pathname.endsWith('/git/ref/heads/staging'),async r=>{const n=api.push(r.request().url());if(n===1)await page.waitForFunction(()=>document.readyState==='complete');else if(n===2)await entered;return r.fallback();});
    audit.entered = pending;
  } else if (scenario !== 'pending') {
    await ctx.route(u=>u.pathname.endsWith('/global/bootstrap.js')&&u.pathname.includes('@'+refFor(slug)+'/'),async r=>{await failed;return r.fallback();});
  }
  await ctx.route(u=>u.pathname.endsWith('/home/global/hamburger.'+asset), async r=>{
    const n=requests.push({url:r.request().url(),at:Date.now()});
    if (scenario==='late-api' && n===1) {
      audit.entered(); await page.waitForFunction(()=>window.__adoptionSharedBoot!==null);
      audit.precondition=await page.evaluate(kind=>({ready:document.readyState,load:window.__adoptionLoad,boot:window.__adoptionSharedBoot,tags:[...document.querySelectorAll(kind==='css'?'link[rel="stylesheet"][href*="/home/global/hamburger.css"]':'script[src*="/home/global/hamburger.js"]')].map(e=>({url:e.src||e.href,shared:e.hasAttribute('data-helix-shared-ui'),sheet:!!e.sheet}))}),asset);
    }
    if(scenario==='pending'&&n===1){await page.waitForTimeout(10000);audit.pendingRequests=requests.length;}
    const limit=scenario==='once'?1:scenario==='pending'?0:scenario==='permanent'?Infinity:2;
    if(n<=limit){if(n===(scenario==='once'?1:2))finishProducer();return r.abort('failed');}return r.fallback();
  });
  try {
    await navigate(t,slug); if(scenario==='pending')await page.waitForTimeout(4500);
    audit.requests=requests; audit.api=api; audit.menus=await page.locator('.hx-menu-overlay').count();
    audit.state=await page.evaluate(()=>({claim:window.__helixHamburgerInit,ready:window.__helixHamburgerReady,claims:window.__adoptionClaims,native:window.__adoptionNative}));
    assert.ok(requests.length<=4,'bounded producer2 + shared2');
    if(scenario==='permanent') { assert.equal(requests.length,4); assert.ok(asset==='css'||audit.menus===0); audit.classification='unavailable: permanent native failure, not recovery success'; }
    else {
      await menu(page); assert.equal(audit.state.claims,1); assert.equal(audit.state.ready,true);
      if(scenario==='pending'){assert.equal(audit.pendingRequests,1);assert.equal(requests.length,1);}
      if(scenario==='late-api'){assert.equal(api.length,2);assert.equal(audit.precondition.ready,'complete');assert.ok(audit.precondition.boot>=audit.precondition.load);assert.equal(audit.precondition.tags[0].shared,false);assert.equal(requests.length,3);}
      audit.classification='functional recovery';
    }
    assert.deepEqual(t.errors,[]);assert.deepEqual(t.net.audit.errors,[]);assert.deepEqual(t.net.audit.overlays,[]);assert.equal(t.net.audit.forwarded,0);
    audit.network=t.net.audit; delete audit.entered;delete audit.pending;audit.pass=true;rows.push(audit);save();console.log(slug,asset,scenario,'PASS',requests.length);
  } catch(error) {
    audit.error=error.message;audit.requests=requests;audit.network=t.net.audit;
    delete audit.entered;delete audit.pending;rows.push(audit);save();throw error;
  } finally {await ctx.unrouteAll({behavior:'ignoreErrors'});await ctx.close();}
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});process.env.HELIX_VISUAL_OVERLAY='';
  const b=await pw.chromium.launch({executablePath:process.env.HELIX_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});assertBrowser(b);
  try {
    for(const slug of pages)for(const width of (profile.widths||[1440,820,390])) {
      const row={kind:'actual-HTML-selected-assets',slug,width,sourceClassification:profile.sourceClassification}, shots=[];
      const originalAvailable = !unavailableOriginal.some(x => x.slug === slug);
      for(const version of originalAvailable ? ['original','candidate'] : ['candidate']){
        const t=await open(b,slug,width,version);
        try{
          await navigate(t,slug);row[version]=await contract(t.page);
          if(profile.captureFullPage)await staticMedia(t.page,()=>t.page.screenshot({path:path.join(output,slug+'-'+width+'-'+version+'-full.png'),fullPage:true,animations:'disabled',caret:'hide',scale:'css'}));
          // Compare the same initial interaction history in both versions.
          // Menu/wheel/viewport tests run afterwards and retain a separate
          // whole-form CSS/geometry invariant, rather than compare moving page
          // pixels just outside a fractional modal screenshot boundary.
          await t.page.evaluate(()=>scrollTo(0,0));await t.page.locator('.hx-fcta-form-btn').click();await t.page.waitForTimeout(450);
          let beforeForm;
          shots.push(await staticMedia(t.page,async media=>{
            row[version+'MediaAtPNG']=media;await neutralFormPointer(t.page);beforeForm=await modalContract(t.page);
            return t.page.locator('.hx-fcta-modal__box').screenshot({path:path.join(output,slug+'-'+width+'-'+version+'.png'),animations:'disabled',caret:'hide',scale:'css'});
          }));
          await t.page.keyboard.press('Escape');await t.page.waitForTimeout(400);
          if(version==='original'&&profile.observeOriginalFunctions)row.originalFunctionalState=await originalState(t,slug,width);
          if(version==='candidate') {
            await menu(t.page);
            if (slug === 'home' && profile.heroSignalsRequired!==false) {
              await t.page.waitForFunction(()=>window.__adoptionHero.includes('helix-s1-done'));
              for (const next of width===1440?[390,820,1440]:width===390?[820,1440,390]:[390,1440,820]) {
                await t.page.setViewportSize({width:next,height:next===820?1180:next===390?844:900});await t.page.waitForTimeout(700);
                assert.deepEqual(await t.page.evaluate(()=>window.__adoptionHero),['helix-s1-ready','helix-s1-done']);
                assert.equal(await t.page.locator('[data-s1-ghost]').count(),0);
                assert.ok(await t.page.locator('.bt-box-1.is-looping').count());
                assert.ok(await t.page.locator('svg .helix-line-path').count());
              }
            }
            await form(t.page,async()=>staticMedia(t.page,async()=>{
              await neutralFormPointer(t.page);const afterForm=await modalContract(t.page);
              fs.writeFileSync(path.join(output,slug+'-'+width+'-form-isolation.json'),JSON.stringify({beforeForm,afterForm},null,2));
              assert.deepEqual(afterForm,beforeForm,'Menu and reverse viewport transitions must preserve every form-node computed style and geometry');
              row.formIsolation=true;
            }));
            // A repeated actual common entry must respect initialized owners.
            const before=await t.page.locator('.hx-menu-overlay').count();
            await t.page.evaluate(src=>{const s=document.createElement('script');s.src=src;document.head.appendChild(s);},'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@'+refFor(slug)+'/global/bootstrap.js');
            await t.page.waitForTimeout(400);assert.equal(await t.page.locator('.hx-menu-overlay').count(),before);
          }
          clean(t,slug,version);row[version+'Network']=t.net.audit;
        }finally{await t.ctx.close();}
      }
      if (originalAvailable) {
        assert.deepEqual(row.candidate,row.original,'published content/typography/layout policy preserved');
        assert.ok(shots[0].equals(shots[1]),'Form box PNG must be byte-identical; no baseline or threshold update');
      } else row.unverified = unavailableOriginal.find(x=>x.slug===slug);
      row.pass=true;rows.push(row);save();console.log(slug,width,originalAvailable?'PASS matched source layout/form PNG + candidate functions; source classification retained':'PASS candidate functions; original comparison BLOCKED');
    }
    if(!profile.normalOnly)for(const slug of pages)for(const asset of ['js','css'])for(const scenario of ['once','twice'])await fault(b,slug,asset,scenario);
    if(!profile.normalOnly)for(const asset of ['js','css'])for(const scenario of ['pending','permanent'])await fault(b,'faq',asset,scenario);
    if(!profile.normalOnly&&environment==='staging')for(const asset of ['js','css'])await fault(b,'faq',asset,'late-api');
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({environment,profile,rows,pass:unavailableOriginal.length===0,verifiedContractsPass:true,scopeSource:profile.sourceClassification,actualCDNOriginalCoverage:profile.actualCDNOriginalCoverage===true,unavailableOriginal,coverage:'Explicit profile page/width scope; Git-source original comparisons are not public CDN reachability; original comparison and exact modal PNG only where original assets are available (explicit blockers otherwise); real immutable asset bindings; menu/form wheel, Escape/focus; actual Home ready/done and reverse transitions; five producer CSS/JS native bounded failures; ten-second pending; permanent failure explicitly unavailable; duplicate entry. Static modal PNG uses the existing paused first media frame; no mask/tolerance change. No runtime overlays or historical-response substitution.'},null,2));
  }finally{await b.close();}
})().catch(e=>{save();console.error(e);process.exitCode=1;});
