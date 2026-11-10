/* Live regression: HELIX_UI_OVERRIDE=1 previews local shared UI on published pages. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const override = process.env.HELIX_UI_OVERRIDE === '1';
const origin = process.env.HELIX_UI_ORIGIN || 'https://helixanimalmedicalcenter.webflow.io';
const output = process.env.HELIX_UI_REPORT || '/tmp/helix-common-ui/candidate';
const paths = (process.env.HELIX_UI_PATHS || '/,/discover-helix,/seocho,/ilsan,/services,/specialty-care,/symptoms,/faq,/internal-medicine,/surgery,/diagnostic-imaging').split(',');
const allowed = new Set(['www.helix-amc.com','helix-amc.com','helixanimalmedicalcenter.webflow.io','cdn.jsdelivr.net','api.github.com','cdn.prod.website-files.com','cdnjs.cloudflare.com','d3e54v103j8qbb.cloudfront.net','ajax.googleapis.com','fonts.googleapis.com','fonts.gstatic.com','use.typekit.net','p.typekit.net','s3.amazonaws.com']);
(async () => {
  fs.mkdirSync(output, {recursive:true});
  const args = ['--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'];
  // Trust only the configured Cloud proxy's certificate key when needed.
  if (process.env.HELIX_PROXY_SPKI) args.push('--ignore-certificate-errors-spki-list=' + process.env.HELIX_PROXY_SPKI);
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args,proxy:process.env.HTTPS_PROXY ? {server:process.env.HTTPS_PROXY} : undefined});
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(() => { window.__helixNoMeasure = true; });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!allowed.has(url.hostname)) return route.abort();
    if (override && /\/helixamc-webflow@[^/]+\/(global\/bootstrap.js|global\/top-button.js|services\/services.css)$/.test(url.pathname)) {
      const relative = url.pathname.split(/helixamc-webflow@[^/]+\//)[1];
      return route.fulfill({contentType:relative.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync(path.join(root, relative),'utf8')});
    }
    if (override && request.isNavigationRequest() && request.frame() === request.frame().page().mainFrame()) {
      const response = await route.fetch();
      const entry = fs.readFileSync(path.join(root,'docs/shared-ui-site-footer.html'),'utf8').replace(/HELIX_SHARED_UI_(?:MAIN|STAGING)_SHA/g,'d4227152b49391b0d3ef0956125273139837e05d');
      const html = await response.text();
      assert.ok(html.includes('<!-- HELIX shared mobile consultation:'), 'Existing footer must match before override');
      return route.fulfill({response,body:html.replace(/<!-- HELIX shared mobile consultation:[\s\S]*?<\/script>/,entry)});
    }
    return route.continue();
  });
  const results = [];
  let next = 0;
  async function worker() {
    while (next < paths.length) {
      const pathname = paths[next++], page = await context.newPage();
      const errors = [];
      page.on('pageerror',e=>errors.push(e.message));
      try {
        const response = await page.goto(origin+pathname+'?fresh=1',{waitUntil:'load',timeout:60000});
        assert.equal(response.status(),200);
        if (pathname.startsWith('/doctors/')) {
          await page.locator('.helix-doctor-modal_panel').waitFor();
          assert.equal(await page.locator('[data-modal-close]').getAttribute('href'),'/seocho#medical-team');
          assert.equal(await page.locator('.hx-fcta-shell,.hx-menu-overlay,.helix-top-btn').count(),0);
          results.push({pathname,doctorModal:true,errors});
          console.log('PASS doctor modal',pathname);
          continue;
        }
        await page.locator('.hx-fcta-shell').waitFor({state:'visible',timeout:25000});
        await page.locator('.helix-top-btn').waitFor({state:'attached',timeout:20000});
        await page.waitForFunction(()=>window.__HELIX_FOOTER_INIT__ && window.__helixHamburgerInit);
        for (const [width,height] of [[1440,900],[390,844]]) {
          await page.setViewportSize({width,height});
          await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
          await page.waitForTimeout(350);
          assert.equal(await page.locator('.hx-fcta-shell').count(),1,'one CTA');
          assert.equal(await page.locator('.helix-top-btn').count(),1,'one top button');
          assert.equal(await page.locator('.hx-menu-overlay').count(),1,'one menu');
          const header = page.locator('header.header,header.header_mobile').filter({visible:true}).first();
          assert.equal(await header.evaluate(e=>getComputedStyle(e).position),'fixed','fixed header');
          assert.equal(await page.locator('#hxFctaCallBtn').getAttribute('href'),'tel:0221359119');
          if (await page.locator('#hxFctaToggle').isVisible()) {
            await page.locator('#hxFctaToggle').click();
            await page.waitForFunction(()=>document.querySelector('#hxFctaModal').getAttribute('aria-hidden')==='false');
            await page.keyboard.press('Escape');
            await page.waitForFunction(()=>document.querySelector('#hxFctaModal').getAttribute('aria-hidden')==='true');
          } else {
            // The emergency page deliberately substitutes its two-branch call card.
            assert.equal(pathname,'/symptoms');
            assert.ok(await page.locator('.helix-branch-cta.is-mounted').isVisible());
            for (const [branch,number] of [['seocho','02-2135-9119'],['ilsan','031-978-7575']]) {
              const dialogPromise = page.waitForEvent('dialog');
              const clickPromise = page.locator('.helix-branch-cta [data-branch="'+branch+'"] [data-action="call"]').click();
              const dialog = await dialogPromise;
              assert.ok(dialog.message().includes(number));
              await dialog.dismiss();
              await clickPromise;
            }
          }
          const burger = page.locator('.menu-bar_mobile,.image-18').filter({visible:true}).first();
          await burger.click();
          await page.waitForFunction(()=>document.body.classList.contains('hx-menu-open'));
          await page.keyboard.press('Escape');
          await page.waitForFunction(()=>!document.body.classList.contains('hx-menu-open'));
          const canShowTop = await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight >= Math.min(600,Math.max(360,document.documentElement.scrollHeight*0.16)));
          let geometry = null;
          if (canShowTop) {
            await page.evaluate(()=>window.scrollTo({top:700,behavior:'instant'}));
            await page.locator('.helix-top-btn').waitFor({state:'visible'});
            geometry = await page.evaluate(()=>{
              const top=document.querySelector('.helix-top-btn').getBoundingClientRect(),cta=document.querySelector('.hx-fcta-shell').getBoundingClientRect();
              const branch=document.querySelector('.helix-branch-cta.is-mounted');const active=cta.width?cta:branch.getBoundingClientRect();
              return {top:{x:top.x,y:top.y,bottom:top.bottom,right:top.right},cta:{x:active.x,y:active.y,bottom:active.bottom},width:innerWidth,height:innerHeight};
            });
            assert.ok(geometry.top.x>=0 && geometry.top.right<=width+1 && geometry.top.y>=0 && geometry.top.bottom<=geometry.cta.y+1,JSON.stringify(geometry));
            await page.locator('.helix-top-btn').click();
            await page.waitForFunction(()=>scrollY<=5);
            await page.waitForTimeout(350);
          } else {
            assert.equal(await page.locator('.helix-top-btn').getAttribute('aria-hidden'),'true','short page needs no top button');
          }
          await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
          await page.waitForTimeout(400);
          if (canShowTop) await page.waitForFunction(()=>{const t=document.querySelector('.helix-top-btn').getBoundingClientRect(),f=document.querySelector('.footer').getBoundingClientRect();return document.querySelector('.helix-top-btn').getAttribute('aria-hidden')==='false' && t.bottom<=f.top+1;});
          const footer = page.locator('.footer');
          assert.equal(await footer.count(),1);
          assert.ok(await footer.locator('.footer-email-clickable').count(),'email copy binding');
          const overlap = await page.evaluate(()=>{
            const t=document.querySelector('.helix-top-btn').getBoundingClientRect(),f=document.querySelector('.footer').getBoundingClientRect();
            return {buttonBottom:t.bottom,footerTop:f.top};
          });
          if (canShowTop) assert.ok(overlap.buttonBottom<=overlap.footerTop+1,JSON.stringify(overlap));
          await page.screenshot({path:path.join(output,pathname.replaceAll('/','_')+'-'+width+'.png')});
          results.push({pathname,width,geometry,overlap,errors:[...errors]});
          console.log('PASS',pathname,width);
        }
      } catch (error) {
        results.push({pathname,error:error.message,errors});
        console.error('FAIL',pathname,error.stack);
        const debug = await page.evaluate(()=>{
          const selectors=['.helix-top-btn','.hx-fcta-shell','#hxFctaToggle','.footer'];
          return {y:scrollY,height:document.documentElement.scrollHeight,root:document.documentElement.className,items:selectors.map(selector=>{const e=document.querySelector(selector);if(!e)return {selector};const s=getComputedStyle(e);const rules=[];for(const sheet of document.styleSheets){try{for(const r of sheet.cssRules){if(r.selectorText && e.matches(r.selectorText))rules.push(r.cssText);if(r.cssRules)for(const c of r.cssRules){if(c.selectorText && e.matches(c.selectorText))rules.push(r.conditionText+':'+c.cssText)}}}catch(_){}}return {selector,box:e.getBoundingClientRect().toJSON(),style:e.getAttribute('style'),class:e.className,display:s.display,visibility:s.visibility,position:s.position,bottom:s.bottom,rules}})};
        });
        fs.writeFileSync(path.join(output,'debug'+pathname.replaceAll('/','_')+'.json'),JSON.stringify(debug,null,2));
        await page.screenshot({path:path.join(output,'FAIL'+pathname.replaceAll('/','_')+'.png')}).catch(()=>{});
      } finally {
        fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({origin,override,results},null,2));
        await page.close();
      }
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  await browser.close();
  if (results.some(r=>r.error || r.errors.length)) process.exitCode=1;
})();
