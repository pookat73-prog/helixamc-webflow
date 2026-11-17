#!/usr/bin/env node
// D05 one-property contract: form width must not share its owner with the phone action.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const base = process.env.HELIX_STRUCTURE_BASE || '67c3c75310edcdd3960c795dd59f86180379db54';
const output = process.env.HELIX_STRUCTURE_OUTPUT || path.join(repo, '.visual-results/form-width');
const before = execFileSync('git', ['show', base + ':global/floating-cta.css'], { cwd: repo, encoding: 'utf8' });
const after = fs.readFileSync(path.join(repo, 'global/floating-cta.css'), 'utf8');
const fix = fs.readFileSync(path.join(repo, 'global/floating-cta-mobile-fix.css'), 'utf8');
const widths = [320,359,360,361,390,479,480,766,767,768,820,990,991,992,1279,1280,1440,1920];
const modes = ['', 'hx-fcta-mobile-bar', 'hx-fcta-overlap-fix', 'hx-fcta-overlap-fix hx-fcta-page-home', 'hx-fcta-mobile-bar hx-fcta-overlap-fix', 'legacy'];
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await pw.chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const cases = [], edits = [];
  try {
    assertBrowser(browser);
    const source = await browser.newContext({ viewport: { width:1440,height:900 }, serviceWorkers:'block' });
    const net = await install(source, { inputRoot:path.resolve(process.env.HELIX_INTERACTION_INPUT) });
    const live = await source.newPage(), errors=[];
    live.on('pageerror', e => errors.push(e.message));
    await live.goto(net.origin, { waitUntil:'domcontentloaded' });
    await live.locator('.hx-fcta-shell').waitFor(); await live.waitForTimeout(7500);
    const html = await live.locator('.hx-fcta-shell').evaluate(e => e.outerHTML);
    assert.deepEqual(errors,[]);assert.deepEqual(net.audit.errors,[]);assert.equal(net.audit.forwarded,0);
    fs.writeFileSync(path.join(output,'source.json'),JSON.stringify({html,requests:net.audit.requests},null,2));
    await source.close();
    const context=await browser.newContext({locale:'ko-KR',timezoneId:'Asia/Seoul',serviceWorkers:'block'});
    await context.route('**/*',r=>r.abort());const page=await context.newPage();
    for(const width of widths){await page.setViewportSize({width,height:900});for(const mode of modes){
      const legacy=mode==='legacy',markup=legacy?'<div class="hx-fcta-shell"><button class="hx-fcta-btn">상담</button><button class="hx-fcta-call-btn">레거시 상담</button></div>':html;
      const pair=[],png=[];
      for(const [version,css] of [['original',before],['candidate',after]]){
        await page.setContent('<!doctype html><html class="'+(legacy?'':mode)+'"><head><style>'+css+'</style><style>'+fix+'</style></head><body><main id="adjacent">Unrelated normal content</main>'+markup+'</body></html>');
        await page.evaluate(async()=>{await document.fonts.ready;for(const a of document.getAnimations()){a.pause();a.currentTime=0;}});
        pair.push(await page.evaluate(()=>[...document.querySelectorAll('html,body,main,.hx-fcta-shell,.hx-fcta-shell *')].flatMap(e=>['','::before','::after'].map(pseudo=>{const s=getComputedStyle(e,pseudo||null);return{tag:e.tagName,cls:e.getAttribute('class')||'',pseudo,rect:pseudo?null:e.getBoundingClientRect().toJSON(),css:Object.fromEntries([...s].map(p=>[p,s.getPropertyValue(p)]))};}))));
        png.push(await page.screenshot({animations:'disabled',caret:'hide',scale:'css'}));
        if([1440,820,390].includes(width)){
          const edit=await page.evaluate(()=>{
            const form=document.querySelector('.hx-fcta-form-btn'),phone=document.querySelector('.hx-fcta-phone-btn'),other=document.querySelector('#adjacent');
            const sample=()=>({adjacent:other.getBoundingClientRect().toJSON(),phone:phone&&phone.getBoundingClientRect().width,form:form&&form.getBoundingClientRect().width});
            const before=sample();const rule=[...document.styleSheets[0].cssRules].find(r=>r.selectorText==='.hx-fcta-shell .hx-fcta-form-btn'&&r.style.position==='relative');
            if(!rule)throw Error('Canonical form rule missing');rule.style.width='90%';return{before,after:sample()};
          });
          fs.writeFileSync(path.join(output,'last-edit.json'),JSON.stringify({width,mode,version,...edit},null,2));
          assert.deepEqual(edit.after.adjacent,edit.before.adjacent);assert.equal(edit.after.phone,edit.before.phone);
          const owns=!legacy&&version==='candidate'&&(width>767||!mode.includes('hx-fcta-mobile-bar')&&!mode.includes('hx-fcta-overlap-fix'));
          if(owns)assert.ok(edit.after.form<edit.before.form,'Canonical form width edit must reach its own action');
          else assert.equal(edit.after.form,edit.before.form,'Variants, legacy and old masked edits stay independent');
          edits.push({width,mode:mode||'floating',version,...edit});
        }
      }
      assert.deepEqual(pair[1],pair[0],`${width}/${mode}: whole component styles/geometry changed`);assert.ok(png[0].equals(png[1]),`${width}/${mode}: pixels changed`);
      const phone=pair[1].find(x=>!x.pseudo&&x.cls.includes('hx-fcta-phone-btn')&&!x.cls.includes('__'));
      if(!legacy)assert.equal(phone.css['min-height'],width>767?'56px':mode.includes('hx-fcta-mobile-bar')?'48px':'54px');
      cases.push({width,mode:mode||'floating',equal:true,phoneMinHeight:phone?.css['min-height']||null});
    }}
    const owners=await page.evaluate(()=>{const out=[];function walk(rs,condition=''){for(const r of rs){if(r.selectorText?.split(',').map(x=>x.trim()).includes('.hx-fcta-shell .hx-fcta-form-btn')&&r.style.width)out.push([condition,r.style.width]);if(r.cssRules)walk(r.cssRules,r.conditionText||condition);}}walk(document.styleSheets[0].cssRules);return out;});
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({base,cases,edits,owners},null,2));
    assert.deepEqual(owners,[['','100%']],'One canonical owner for base form width; variants remain separate');
    await context.close();console.log('PASS',cases.length,'exact paired states;',edits.length,'controlled edits; phone/adjacent/variants preserved');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
