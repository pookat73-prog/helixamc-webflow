const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.HELIX_PLAYWRIGHT_MODULE || 'playwright-core');
const repo = require('node:path').resolve(__dirname, '..');
const live = process.env.HELIX_IM_LIVE === '1';
const source = fs.readFileSync(repo+'/internal-medicine/bootstrap.js','utf8');
const addition = source.slice(source.indexOf('/* HELIX_IM_CARE_AC_START'),source.indexOf('/* HELIX_IM_CARE_AC_END */')+'/* HELIX_IM_CARE_AC_END */'.length);
const out = process.env.HELIX_IM_REPORT_DIR || '/tmp/helix-im-care-report';
fs.mkdirSync(out,{recursive:true});
const matrix = [[1920,1080],[1800,1000],[1600,900],[1440,900],[1280,800],[1024,768],[820,1180],[768,1024],[740,430],[667,375],[568,320],[430,932],[390,844],[360,800],[320,568],[1799,1000],[991,900],[992,900],[767,1024],[768,767],[479,320],[480,320],[767,430]];
const captures = new Set([1920,1440,820,390,740,320]);
const allowed = ['helixanimalmedicalcenter.webflow.io','www.helix-amc.com','helix-amc.com','api.github.com','cdn.jsdelivr.net','cdn.prod.website-files.com','s3.amazonaws.com'];
(async () => {
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],proxy:process.env.HTTPS_PROXY ? {server:process.env.HTTPS_PROXY} : undefined});
  try {
    const context = await browser.newContext({viewport:{width:1920,height:1080}});
    await context.addInitScript(() => {window.__helixNoMeasure=true;});
    await context.route('https://**/*',async route=>{
      const url = new URL(route.request().url());
      if (!allowed.includes(url.hostname)) return route.abort();
      try {
        const response = await route.fetch({timeout:25000});
        if (!live && /\/internal-medicine\/bootstrap\.js/.test(url.pathname)) {
          const body = (await response.text()).replace(/\/\* HELIX_IM_CARE_AC_START[\s\S]*?\/\* HELIX_IM_CARE_AC_END \*\//, '');
          return route.fulfill({response,body});
        }
        await route.fulfill({response});
      }
      catch(error){await route.abort();}
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    const url = 'https://helixanimalmedicalcenter.webflow.io/internal-medicine?codex-review=im-ac';
    const response = await page.goto(url,{waitUntil:'domcontentloaded'});
    const markup = await response.text();
    await page.waitForTimeout(1500);
    const original = await page.evaluate(markup=>{
      const sourceDocument = new DOMParser().parseFromString(markup,'text/html');
      const text=e=>{const c=e.cloneNode(true);c.querySelectorAll('[aria-hidden="true"],.hx-c2-sample-source-hidden').forEach(x=>x.remove());return c.textContent.replace(/\s+/g,' ').trim()};
      return [...sourceDocument.querySelectorAll('section[id="hx-im-areas"] article.hx-c2-type-card')].map(c=>({number:text(c.querySelector('.hx-c2-refined-index')), title:text(c.querySelector('.hx-c2-refined-title')),items:[...c.querySelectorAll('.hx-c2-disease-item')].map(text), lead:c.querySelector('.hx-c2-scope-lead')?.textContent,procedures:[...c.querySelectorAll('.hx-c2-refined-treatment')].map(text),links:[...c.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}));
    },markup);
    const outsideSnapshot = () => page.evaluate(()=>[...document.body.children].filter(e=>!e.matches('[id="hx-im-areas"], [data-hx-im-care-source], script,style,link')).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,font:getComputedStyle(e).fontFamily,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor})));
    const before = await outsideSnapshot();
    if (!live) await page.addScriptTag({content:addition});
    await page.waitForTimeout(150);
    const after = await outsideSnapshot();
    assert.deepEqual(after,before,'Unrelated sections must retain their own geometry and styles');
    assert.equal(await page.locator('.hx-im-care-card').count(),6);
    for(let i=0;i<6;i++){
      const actual=await page.locator('.hx-im-care-full').nth(i).innerText();
      for(const text of [original[i].title,...original[i].items,...original[i].procedures]) assert.ok(actual.includes(text),'Missing full card copy: '+text);
    }
    assert.equal(await page.locator('.hx-im-care-grid [data-hx-im-link-pending]').count(),5);
    assert.equal(await page.locator('.hx-im-care-grid .hx-im-care-center').getAttribute('href'),original[5].links.find(href=>href.startsWith('https://')));
    async function captureGrid(file) {
      const headers = page.locator('body > header,.hx-fcta-shell');
      const styles = await headers.evaluateAll(nodes=>nodes.map(node=>{const style=node.getAttribute('style');node.style.setProperty('display','none','important');return style}));
      try { await page.locator('.hx-im-care-grid').screenshot({path:out+'/'+file}); }
      finally { await headers.evaluateAll((nodes,styles)=>nodes.forEach((node,i)=>{if(styles[i]===null)node.removeAttribute('style');else node.setAttribute('style',styles[i])}),styles); }
    }
    const rows=[];
    for(const [width,height] of matrix){
      await page.setViewportSize({width,height});
      await page.waitForTimeout(100);
      const row=await page.evaluate(()=>{
        const grid=document.querySelector('.hx-im-care-grid'),cards=[...grid.children],compact=innerWidth<=767;
        const clips=[...grid.querySelectorAll(compact?'.hx-im-care-primary,.hx-im-care-department':'.hx-im-care-title,.hx-im-care-content,.hx-im-care-footer-inner')].filter(e=>e.scrollWidth>e.clientWidth+1 || e.scrollHeight>e.clientHeight+1).map(e=>({class:e.className,text:e.textContent}));
        return {viewport:[innerWidth,innerHeight],width:grid.getBoundingClientRect().width,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,cardWidths:cards.map(c=>c.getBoundingClientRect().width),cardHeights:cards.map(c=>c.getBoundingClientRect().height),compact,clips,font:getComputedStyle(cards[0]).fontFamily,titleY:[...grid.querySelectorAll('.hx-im-care-title')].map(e=>e.getBoundingClientRect().y-e.closest('article').getBoundingClientRect().y),contentY:[...grid.querySelectorAll('.hx-im-care-content')].map(e=>e.getBoundingClientRect().y-e.closest('article').getBoundingClientRect().y),footerY:[...grid.querySelectorAll('.hx-im-care-footer:not([hidden])')].map(e=>e.getBoundingClientRect().y-e.closest('article').getBoundingClientRect().y)};
      });
      rows.push(row);
      assert.ok(Math.max(...row.cardWidths)-Math.min(...row.cardWidths)<1,JSON.stringify(row));
      assert.ok(Math.max(...row.cardHeights)-Math.min(...row.cardHeights)<1,JSON.stringify(row));
      assert.equal(row.clips.length,0,JSON.stringify(row));
      const expected=width>=1800 && row.width>=1128?3:width<=767 && width>=480 && width>height && row.width>=470?3:2;
      assert.equal(row.columns,expected,JSON.stringify(row));
      if(!row.compact){
        assert.ok(Math.max(...row.contentY)-Math.min(...row.contentY)<1,JSON.stringify(row));
        assert.ok(Math.max(...row.footerY)-Math.min(...row.footerY)<1,JSON.stringify(row));
      }
      if(captures.has(width)){
        await captureGrid('cards-'+width+'.png');
      }
      console.log('viewport passed',width,height,row.columns,row.cardHeights[0]);
    }
    fs.writeFileSync(out+'/viewport-results.json',JSON.stringify({mode:live?'staging':'local override',original,rows,unrelatedSectionsUnchanged:true,pageErrors:errors},null,2));
    console.log('matrix passed');
    await page.setViewportSize({width:1920,height:1080});
    await page.locator('.hx-im-care-grid').evaluate(e=>e.parentElement.style.width='1100px');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.hx-im-care-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2,'Wide screen with insufficient content width keeps two columns');
    await page.locator('.hx-im-care-grid').evaluate(e=>e.parentElement.style.width='');
    await page.setViewportSize({width:390,height:844});
    const buttons=page.locator('.hx-im-care-short');
    const modalResults=[];
    for(let i=0;i<6;i++){
      await buttons.nth(i).click();
      await page.waitForTimeout(50);
      assert.equal(await page.locator('#hx-im-care-dialog').evaluate(e=>e.open),true);
      const actual=await page.locator('.hx-im-care-dialog-body').innerText();
      for(const text of original[i].items.concat(original[i].procedures).concat(original[i].lead?[original[i].lead]:[])) assert.ok(actual.includes(text),`Missing modal copy: ${text}`);
      assert.equal(await page.evaluate(()=>document.activeElement.className),'hx-im-care-close');
      assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
      const y=await page.evaluate(()=>parseFloat(document.body.style.top));
      if(i===3) await page.screenshot({path:out+'/modal-390.png'});
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.closest('dialog')?.open),true);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.className),'hx-im-care-close');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(50);
      assert.equal(await page.locator('#hx-im-care-dialog').evaluate(e=>e.open),false);
      assert.equal(await buttons.nth(i).evaluate(e=>e===document.activeElement),true);
      assert.ok(Math.abs((await page.evaluate(()=>window.scrollY))+y)<2,'Scroll position restored');
      modalResults.push({number:original[i].number,copy:true,focusReturn:true,scrollReturn:true,escape:true});
    }
    await buttons.nth(0).click();
    await page.locator('.hx-im-care-close').click();
    await page.waitForTimeout(50);
    assert.equal(await page.locator('#hx-im-care-dialog').evaluate(e=>e.open),false);
    await buttons.nth(1).click();
    await page.mouse.click(4,4);
    await page.waitForTimeout(50);
    assert.equal(await page.locator('#hx-im-care-dialog').evaluate(e=>e.open),false,'Backdrop closes');
    await buttons.nth(3).click();
    await page.setViewportSize({width:740,height:430});
    await page.waitForTimeout(100);
    await page.screenshot({path:out+'/modal-740.png'});
    assert.ok(await page.locator('.hx-im-care-dialog-scroll').evaluate(e=>e.scrollHeight>e.clientHeight),'Landscape body scrolls');
    await page.locator('.hx-im-care-dialog-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);
    assert.ok(await page.locator('.hx-im-care-close').isVisible());
    await page.setViewportSize({width:768,height:1024});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#hx-im-care-dialog').evaluate(e=>e.open),false,'Close when full details become visible');
    const zoom=[];
    for(const [width,height] of [[1920,1080],[1440,900],[820,1180],[390,844],[320,568],[568,320]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      await page.waitForTimeout(100);
      const result=await page.evaluate(()=>{
        const cards=[...document.querySelectorAll('.hx-im-care-card')];
        const clips=[];
        cards.forEach(card=>{
          const bounds=card.getBoundingClientRect(),walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
          let text;
          while(text=walker.nextNode()){
            const range=document.createRange();range.selectNodeContents(text);
            for(const r of range.getClientRects())if(r.width>0 && (r.left<bounds.left-1 || r.right>bounds.right+1 || r.top<bounds.top-1 || r.bottom>bounds.bottom+1))clips.push({text:text.textContent,rect:r.toJSON(),card:bounds.toJSON()});
          }
        });
        return {viewport:[innerWidth,innerHeight],columns:getComputedStyle(document.querySelector('.hx-im-care-grid')).gridTemplateColumns,heights:cards.map(e=>e.getBoundingClientRect().height),clips};
      });
      assert.equal(result.clips.length,0,JSON.stringify(result));
      assert.ok(Math.max(...result.heights)-Math.min(...result.heights)<1);
      zoom.push(result);
      if(width===390)await captureGrid('cards-390-text-200.png');
      if(width<=767){
        await buttons.nth(3).click();
        const enlargedModal=await page.locator('.hx-im-care-dialog-scroll').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight}));
        assert.ok(enlargedModal.height>40,'Enlarged modal still has a usable reading area');
        await page.locator('.hx-im-care-dialog-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);
        const close=await page.locator('.hx-im-care-close').boundingBox();
        assert.ok(close.y>=0 && close.y+close.height<=height,'Close remains reachable while enlarged text scrolls');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(30);
      }
      await page.evaluate(()=>document.documentElement.style.fontSize='');
    }
    fs.writeFileSync(out+'/interaction-results.json',JSON.stringify({modalResults,backdrop:true,closeButton:true,landscapeScroll:true,rotation:true,zoom},null,2));
    console.log('interaction and zoom passed');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
