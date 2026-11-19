#!/usr/bin/env node
// Actual HTTP-captured candidate assets; private head selection is the only normal input change.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const root = process.env.HELIX_ADOPTION_INPUTROOT, output = process.env.HELIX_ADOPTION_OUTPUT;
const profile = JSON.parse(fs.readFileSync(process.env.HELIX_ADOPTION_PROFILE));
assert.ok(root && output); assert.notEqual(process.env.HELIX_VISUAL_RECORD, '1');
const environment = process.env.HELIX_VISUAL_TARGET || 'production';
const pages = ['home', 'discover-helix', 'services', 'faq', 'internal-medicine'];
const rows = [], save = () => fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ environment, profile, rows, pass: false }, null, 2));
const pathname = slug => slug === 'home' ? '/' : '/' + slug;
const refFor = slug => environment === 'staging' && slug === 'home' ? profile.stagingHome : profile.main;
async function wheel(page) { await page.mouse.move(8, 400); await page.mouse.wheel(0, 600); await page.waitForTimeout(400); return page.evaluate(() => scrollY); }
async function menu(page) {
  assert.equal(await page.locator('.hx-menu-overlay').count(), 1);
  const button = page.getByRole('button', { name: '메뉴 열기', exact: true }).filter({ visible: true }).first();
  await page.evaluate(() => scrollTo(0, 0)); await button.click(); await page.waitForTimeout(700);
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  const start = await page.evaluate(() => scrollY); assert.equal(await wheel(page), start, 'menu background wheel lock');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  assert.ok(await button.evaluate(e => document.activeElement === e), 'menu restores focus');
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.ok(await wheel(page) > start, 'menu releases background wheel');
  await page.evaluate(() => scrollTo(0, 0)); await button.click(); await page.waitForTimeout(400);
  await page.locator('.hx-menu-close').click(); await page.waitForTimeout(400);
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
}
async function form(page) {
  await page.evaluate(() => scrollTo(0, 0)); await page.locator('.hx-fcta-form-btn').click(); await page.waitForTimeout(400);
  const start = await page.evaluate(() => scrollY); assert.equal(await wheel(page), start, 'form background wheel lock');
  await page.locator('#hxFcta_owner').fill('검증용 입력');
  await page.locator('#hxFctaPrivacyMore').click(); assert.equal(await page.locator('#hxFctaPrivacyDetail').getAttribute('hidden'), null);
  await page.locator('#hxFctaPrivacyMore').click(); assert.notEqual(await page.locator('#hxFctaPrivacyDetail').getAttribute('hidden'), null);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  assert.ok(await page.locator('.hx-fcta-form-btn').evaluate(e => document.activeElement === e));
  assert.ok(await wheel(page) > start, 'form releases background wheel');
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
async function open(browser, slug, width, version) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 820 ? 1180 : width === 390 ? 844 : 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
  const net = await install(ctx, { inputRoot: path.join(root, environment, version, slug), extraRoots: [] }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
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
      audit.precondition=await page.evaluate(()=>({ready:document.readyState,load:window.__adoptionLoad,boot:window.__adoptionSharedBoot,tags:[...document.querySelectorAll('script[src*="/home/global/hamburger.js"]')].map(e=>({shared:e.hasAttribute('data-helix-shared-ui')}))}));
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
  } finally {await ctx.unrouteAll({behavior:'ignoreErrors'});await ctx.close();}
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});process.env.HELIX_VISUAL_OVERLAY='';
  const b=await pw.chromium.launch({executablePath:process.env.HELIX_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});assertBrowser(b);
  try {
    for(const slug of pages)for(const width of [1440,820,390]) {
      const row={kind:'actual-HTML-selected-assets',slug,width}, shots=[];
      for(const version of ['original','candidate']){
        const t=await open(b,slug,width,version);
        try{
          await navigate(t,slug);row[version]=await contract(t.page);
          if(version==='candidate')await menu(t.page);
          await t.page.evaluate(()=>scrollTo(0,0));await t.page.locator('.hx-fcta-form-btn').click();await t.page.waitForTimeout(450);
          shots.push(await t.page.locator('.hx-fcta-modal__box').screenshot({path:path.join(output,slug+'-'+width+'-'+version+'.png'),animations:'disabled',caret:'hide',scale:'css'}));
          await t.page.keyboard.press('Escape');await t.page.waitForTimeout(400);
          if(version==='candidate'){
            await form(t.page);
            // A repeated actual common entry must respect initialized owners.
            const before=await t.page.locator('.hx-menu-overlay').count();
            await t.page.evaluate(src=>{const s=document.createElement('script');s.src=src;document.head.appendChild(s);},'https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@'+refFor(slug)+'/global/bootstrap.js');
            await t.page.waitForTimeout(400);assert.equal(await t.page.locator('.hx-menu-overlay').count(),before);
          }
          clean(t,slug,version);row[version+'Network']=t.net.audit;
        }finally{await t.ctx.close();}
      }
      assert.deepEqual(row.candidate,row.original,'published content/typography/layout policy preserved');
      assert.ok(shots[0].equals(shots[1]),'Form box PNG must be byte-identical; no baseline or threshold update');
      row.pass=true;rows.push(row);save();console.log(slug,width,'PASS paired published layout/form PNG + candidate functions');
    }
    for(const slug of pages)for(const asset of ['js','css'])for(const scenario of ['once','twice'])await fault(b,slug,asset,scenario);
    for(const asset of ['js','css'])for(const scenario of ['pending','permanent'])await fault(b,'faq',asset,scenario);
    if(environment==='staging')await fault(b,'faq','js','late-api');
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({environment,profile,rows,pass:true,coverage:'15 current-HTML pairs; published modal PNG identity; real immutable asset bindings; candidate menu/form wheel, Escape/focus; five producer CSS/JS native bounded failures; ten-second pending; permanent failure explicitly unavailable; duplicate entry. No runtime overlays or historical-response substitution.'},null,2));
  }finally{await b.close();}
})().catch(e=>{save();console.error(e);process.exitCode=1;});
