import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const script = read('about/cert-modal/modal.js');
const source = JSON.parse(read('scripts/fixtures/cert-modal/source.json')).certificates;
assert(!/\bfetch\s*\(|createElement\(['"]iframe|contentDocument|cert-modal-frame/.test(script));
const counts = { aaha: 4, emergency: 4, cat: 3 };
const cards = [ ['aaha', 'ahha', '159'], ['emergency', 'veccs', '158'], ['cat', 'cfc', '157'] ];
const fixture = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>병원 소개 | 헬릭스</title>
<link rel="canonical" href="https://helix-amc.com/discover-helix"><style>body{margin:0;font-family:Arial,sans-serif}.intro{height:1000px}#cert{padding:20px}.about_grid-3-_mid-align{display:flex;gap:40px}.div-block-159,.div-block-158,.div-block-157{background:#dceafa;width:120px;height:120px}a{display:block}footer{height:1200px}</style>
<link rel="stylesheet" href="/about/cert-modal/modal.css"></head><body><div class="intro">병원 소개</div>
<section id="cert"><div class="about_grid-3-_mid-align">${cards.map(([key,cls,mark])=>`<div class="about_contents_box_${cls}" data-coming-soon="1"><div class="div-block-${mark}"></div><a href="${source[key].legacyPath}" target="_blank">${key} 상세</a></div>`).join('')}</div></section><footer>기존 페이지</footer>
<script>window.captured=[];window.readerStops=0;window.HelixMeasure={emit:(...args)=>captured.push(args),reader:()=>({stop:()=>readerStops++})};</script>
<script src="/home/global/coming-soon.js"></script><script src="/about/cert-modal/modal.js"></script></body></html>`;
const server = createServer((req,res)=>{
  const path = new URL(req.url,'http://localhost').pathname;
  if (path === '/discover-helix') {res.setHeader('content-type','text/html; charset=utf-8');res.end(req.url.includes('deleted-links=1')?fixture.replace(/href="\/(aaha-cert|emergency-cert|cat-cert)"/g,'href="#"'):fixture);}
  else if (['/about/cert-modal/modal.js','/about/cert-modal/modal.css','/home/global/coming-soon.js'].includes(path)) {
    res.setHeader('content-type',path.endsWith('.css')?'text/css':'text/javascript');res.end(read(path.slice(1)));
  } else {res.statusCode=404;res.end('Deleted certificate page');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
const screenshots = '/tmp/helix-cert-preview';mkdirSync(screenshots,{recursive:true});
let groups=0;
try {
  for (const size of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:768,height:900},{width:844,height:390}]) {
    const context = await browser.newContext({viewport:size});
    const requests=[],errors=[];
    await context.route('**/*',route=>{
      const u=new URL(route.request().url());
      if (u.origin!==origin) return route.abort();
      requests.push(u.pathname);return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/discover-helix?utm_source=check#cert');
    await page.waitForFunction(()=>window.__helixCertModalInit);
    const selector=size.width<=767?'.helix-cert-badges':'.about_grid-3-_mid-align';
    assert.equal(await page.locator('.helix-cert-badge').count(),3);
    let fixedPanel;
    for (const [key] of cards) {
      const data=source[key];
      const trigger=page.locator(`${selector} a[href*="cert=${key}"]`);
      assert.equal(await trigger.count(),1);
      assert.equal(await trigger.getAttribute('target'),null);
      await trigger.scrollIntoViewIfNeeded();
      const y=await page.evaluate(()=>scrollY);
      const before=await page.evaluate(()=>captured.length);
      await trigger.click();
      await page.locator('.helix-cert-modal.is-open').waitFor();
      const coverPanel=await page.locator('.helix-cert-modal__card').boundingBox();
      if (!fixedPanel) fixedPanel=coverPanel;
      for (const prop of ['x','y','width','height']) assert(Math.abs(coverPanel[prop]-fixedPanel[prop])<1, `${key}: 인증별 창 ${prop} 유지`);
      assert.equal(new URL(page.url()).searchParams.get('cert'),key);
      assert.equal(new URL(page.url()).searchParams.get('utm_source'),'check');
      assert.equal(await page.locator('#helix-cert-title').innerText(),data.subtitle);
      assert.equal(await page.locator('.helix-cert-modal__badge').getAttribute('src'),data.image);
      assert.equal(await page.locator('.helix-cert-modal__badge').getAttribute('alt'),data.imageAlt);
      assert.equal(await page.locator('.helix-cert-modal__dot').count(),counts[key]);
      assert.equal(await page.locator('.helix-cert-modal__body p').first().innerText(),data.description);
      assert(await page.locator('[data-prev]').isDisabled());
      assert(await page.locator('.intro').evaluate(el=>el.inert));
      const events=await page.evaluate(()=>captured.slice(-1));
      assert.equal(events[0][0],'cert_modal_open_'+(size.width<=767?'mobile':'desktop'));
      assert.equal(events[0][1].cert,data.legacyPath);
      assert.equal(events[0][1].page_location,origin+'/discover-helix?utm_source=check#cert');
      assert.equal(await page.evaluate(()=>captured.length),before+1);
      for (let i=0;i<data.slides.length;i++) {
        await page.locator('[data-next]').click();
        const slidePanel=await page.locator('.helix-cert-modal__card').boundingBox();
        for (const prop of ['x','y','width','height']) assert(Math.abs(slidePanel[prop]-fixedPanel[prop])<1, `${key}/${i}: 슬라이드별 창 ${prop} 유지`);
        assert.deepEqual(await page.locator('.helix-cert-modal__block h3').allTextContents(),data.slides[i].blocks.map(b=>b.title));
        assert.deepEqual(await page.locator('.helix-cert-modal__block p').allTextContents(),data.slides[i].blocks.map(b=>b.text));
        assert.equal(await page.locator('.helix-cert-modal__label').innerText(),data.slides[i].label);
        const layout=await page.evaluate(()=>{
          const card=document.querySelector('.helix-cert-modal__card'),body=document.querySelector('.helix-cert-modal__body');
          const r=card.getBoundingClientRect();
          return {within:r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,
            noOverflow:body.scrollWidth<=body.clientWidth+1,bodyHeight:body.clientHeight};
        });
        assert(layout.within,JSON.stringify({size,key,i,layout}));assert(layout.noOverflow);assert(layout.bodyHeight>25);
        const controlsFit=await page.evaluate(()=>{const panel=document.querySelector('.helix-cert-modal__card').getBoundingClientRect(), controls=document.querySelector('.helix-cert-modal__controls').getBoundingClientRect();return controls.top>=panel.top && controls.bottom<=panel.bottom+1;});
        assert(controlsFit,JSON.stringify({size,key,i}));
      }
      assert(await page.locator('[data-next]').isDisabled());
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('.helix-cert-modal__status').innerText(),`${counts[key]} / ${counts[key]}`);
      await page.keyboard.press('ArrowLeft');
      await page.locator('[data-slide="0"]').click();
      await page.locator('[data-close]').last().focus();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-next')),true);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-close')),true);
      await page.keyboard.press('Escape');await page.waitForURL('**/discover-helix?utm_source=check#cert');
      assert.equal(await page.locator('.helix-cert-modal.is-open').count(),0);
      await trigger.evaluate(el=>new Promise((resolve,reject)=>{let tries=0;const check=()=>document.activeElement===el?resolve():++tries>50?reject(new Error('포커스 복원 실패')):setTimeout(check,10);check();}));
      assert(Math.abs(await page.evaluate(()=>scrollY)-y)<2);
      assert.equal(await page.title(),'병원 소개 | 헬릭스');
      assert.equal(await page.locator('.intro').evaluate(el=>el.inert),false);
      const metrics=await page.evaluate(()=>captured.length);
      await page.goForward();await page.locator('.helix-cert-modal.is-open').waitFor();
      assert.equal(await page.evaluate(()=>captured.length),metrics);
      await page.goBack();await page.waitForFunction(()=>!document.querySelector('.helix-cert-modal.is-open'));
    }
    await page.goto(origin+'/discover-helix?cert=cat&utm_source=shared#cert');
    await page.locator('.helix-cert-modal.is-open').waitFor();
    assert.equal(await page.evaluate(()=>captured.length),0);
    await page.reload();await page.locator('.helix-cert-modal.is-open').waitFor();
    await page.locator('[data-close]').last().click();
    assert.equal(new URL(page.url()).searchParams.has('cert'),false);
    assert.equal(new URL(page.url()).searchParams.get('utm_source'),'shared');
    for (const [key] of cards) {
      await page.goto(origin+`/discover-helix?cert=${key}#cert`);
      await page.locator('.helix-cert-modal.is-open').waitFor();
      await page.screenshot({path:`${screenshots}/${key}-${size.width}.png`});
    }
    await page.goto(origin+'/discover-helix?cert=unknown#cert');
    assert.equal(await page.locator('.helix-cert-modal.is-open').count(),0);
    await page.addScriptTag({content:script});
    assert.equal(await page.locator('.helix-cert-badges').count(),1);
    assert.equal(await page.locator('iframe').count(),0);
    assert(requests.every(path=>!Object.values(source).some(d=>d.legacyPath===path)));
    assert.deepEqual(errors,[]);
    await context.close();groups++;
    console.log(`✓ ${size.width}×${size.height}: 원문/이미지·슬라이드·포커스·뒤로/앞으로·직접접속/새로고침·삭제된 페이지 요청 0`);
  }
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();await page.goto(origin+'/discover-helix');
  const link=page.locator('.about_grid-3-_mid-align a').first();
  const [tab]=await Promise.all([context.waitForEvent('page'),link.click({modifiers:['Control']})]);
  await tab.locator('.helix-cert-modal.is-open').waitFor();
  assert.equal(await page.locator('.helix-cert-modal.is-open').count(),0);
  await tab.close();
  await link.click();await page.locator('.helix-cert-modal.is-open').waitFor();
  await page.locator('.helix-cert-modal__backdrop').click({position:{x:2,y:2}});
  await page.waitForURL('**/discover-helix');
  await page.goto(origin+'/discover-helix?cert=aaha#cert');
  await page.locator('.helix-cert-modal.is-open').waitFor();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.helix-cert-modal.is-open').count(),1);
  assert.equal(await page.evaluate(()=>captured.length),0);
  await page.setViewportSize({width:1440,height:900});
  await page.goto(origin+'/discover-helix?deleted-links=1#cert');
  const repaired=page.locator('.about_grid-3-_mid-align a[href*="cert=aaha"]');
  await repaired.click();await page.locator('.helix-cert-modal.is-open').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('cert'),'aaha');
  await context.close();groups++;
  console.log('✓ 삭제 후 Webflow 링크 해제 복구·새 탭 공유·배경 닫기·PC→모바일 전환 시 중복 측정 없음');
  console.log(`인증 모달 검증 완료: ${groups}개 검사 그룹. 스크린샷: ${screenshots}`);
} finally { await browser.close();server.close(); }
