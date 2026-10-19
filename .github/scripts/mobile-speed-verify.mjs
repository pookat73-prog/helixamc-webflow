import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require = createRequire('/tmp/helix-ci-audit/package.json');
const {chromium} = require('playwright');
const {PNG} = require('pngjs');
const {default: pixelmatch} = await import(pathToFileURL(require.resolve('pixelmatch')));
const out = path.resolve('audit-results');
fs.mkdirSync(out, {recursive: true});
const stageSha = 'f2587e94509629e6a2bb886cec9df87945b62d7d';
const originalSha = 'dd658beca05a584bdfeacf416184f7d1cd50f2f4';
const results = [];
const failures = [];
const browser = await chromium.launch({headless: true, args: ['--no-sandbox']});

async function snapshot(host, pageKey, width, variant) {
  const id = `${host === 'www.helix-amc.com' ? 'production' : 'staging'}-${pageKey}-${width}-${variant}`;
  const record = {id, host, pageKey, width, variant, errors: [], warnings: [], failedRequests: [], network: [], checks: {}, screenshots: {}};
  const context = await browser.newContext({viewport: {width, height: width === 390 ? 844 : 1000}, deviceScaleFactor: 1, locale: 'ko-KR', timezoneId: 'Asia/Seoul'});
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  page.on('pageerror', e => record.errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error') record.errors.push(m.text());
    if (m.type() === 'warning') record.warnings.push(m.text());
  });
  page.on('requestfailed', r => record.failedRequests.push({url: r.url(), error: r.failure()?.errorText}));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  const requests = new Map();
  cdp.on('Network.responseReceived', e => requests.set(e.requestId, {url: e.response.url, status: e.response.status, mimeType: e.response.mimeType, fromDiskCache: !!e.response.fromDiskCache}));
  cdp.on('Network.loadingFinished', e => {
    const r = requests.get(e.requestId);
    if (r) record.network.push({...r, encodedDataLength: e.encodedDataLength});
  });
  await page.addInitScript(() => {
    window.__auditLCP = [];
    try { new PerformanceObserver(list => list.getEntries().forEach(e => window.__auditLCP.push({time: e.startTime, size: e.size, url: e.url, tag: e.element?.tagName, className: e.element?.className}))).observe({type: 'largest-contentful-paint', buffered: true}); } catch {}
  });
  if (host.endsWith('.webflow.io')) {
    // Pin the same application commit in both visual comparison contexts.
    await page.route('https://api.github.com/repos/pookat73-prog/helixamc-webflow/git/ref/heads/staging*', r => r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ref: 'refs/heads/staging', object: {sha: stageSha}})}));
    if (variant === 'baseline') {
      const source = execFileSync('git', ['show', `${originalSha}:${pageKey}/bootstrap.js`], {encoding: 'utf8'});
      await page.route(/cdn\.jsdelivr\.net\/gh\/pookat73-prog\/helixamc-webflow@[^/]+\/(home|services)\/bootstrap\.js(?:\?|$)/, async route => {
        if (new URL(route.request().url()).pathname.endsWith(`/${pageKey}/bootstrap.js`)) await route.fulfill({status: 200, contentType: 'application/javascript', body: source});
        else await route.continue();
      });
    }
  }
  async function shot(label) {
    const file = `${id}-${label}.png`;
    await page.screenshot({path: path.join(out, file), animations: 'disabled'});
    record.screenshots[label] = file;
  }
  try {
    const url = `https://${host}${pageKey === 'home' ? '/' : '/services'}`;
    record.url = url;
    const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 90000});
    record.status = response?.status();
    if (!response?.ok()) throw Error(`HTTP ${response?.status()}`);
    await page.locator('#hxFctaToggle').waitFor({state: 'visible', timeout: 60000});
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 20000))]));
    await page.waitForTimeout(9000);
    record.layout = await page.evaluate(() => {
      const hero = document.querySelector('.blackframe_image-hero');
      const heading = document.querySelector('h1');
      const s = hero && getComputedStyle(hero);
      return {viewport: {width: innerWidth, height: innerHeight}, documentWidth: document.documentElement.scrollWidth, lcp: window.__auditLCP, hero: hero && {backgroundImage: s.backgroundImage, backgroundPosition: s.backgroundPosition, backgroundSize: s.backgroundSize, opacity: s.opacity, visibility: s.visibility, rect: hero.getBoundingClientRect().toJSON()}, heading: heading && {text: heading.innerText, rect: heading.getBoundingClientRect().toJSON()}, scripts: [...document.scripts].map(n => n.src).filter(Boolean)};
    });
    record.checks.horizontalOverflow = record.layout.documentWidth > width + 1;
    record.checks.inspectorRequested = record.layout.scripts.some(u => u.includes('/global/ga-inspector.js'));
    if (host.endsWith('.webflow.io')) {
      if (record.checks.inspectorRequested !== (variant === 'baseline')) throw Error('Unexpected normal-visit GA inspector request');
      if (!record.layout.scripts.some(u => u.includes(`@${stageSha}/`) || u.includes(`@${stageSha.slice(0, 10)}/`))) throw Error('Expected staging SHA was not loaded');
    }
    await shot('home');
    const burgers = page.locator('.menu-bar_mobile, .image-18');
    let burger = null;
    for (let i = 0; i < await burgers.count(); i++) {
      if (await burgers.nth(i).isVisible() && await burgers.nth(i).evaluate(el => !!el.__hxBurgerBound)) {burger = burgers.nth(i); break;}
    }
    if (!burger) throw Error('No visible bound menu trigger');
    await burger.click();
    await page.waitForFunction(() => document.querySelector('.hx-menu-overlay')?.getAttribute('aria-hidden') === 'false');
    await page.waitForTimeout(1100);
    record.checks.menuOpened = true;
    await shot('menu');
    await page.locator('.hx-menu-close').click();
    await page.waitForFunction(() => document.querySelector('.hx-menu-overlay')?.getAttribute('aria-hidden') === 'true');
    record.checks.menuClosed = true;
    await page.locator('#hxFctaToggle').click();
    if (await page.locator('#hxFctaFormBtn').isVisible().catch(() => false)) await page.locator('#hxFctaFormBtn').click();
    await page.waitForFunction(() => document.getElementById('hxFctaModal')?.getAttribute('aria-hidden') === 'false');
    await page.waitForTimeout(600);
    record.checks.consultationOpened = true;
    await shot('consultation');
    await page.locator('#hxFctaModalClose').click();
    await page.waitForFunction(() => document.getElementById('hxFctaModal')?.getAttribute('aria-hidden') === 'true');
    record.checks.consultationClosed = true;
  } catch (e) {
    record.failure = e.message;
    failures.push({id, reason: e.message});
    await shot('failure').catch(() => {});
  } finally {
    fs.writeFileSync(path.join(out, `${id}.json`), JSON.stringify(record, null, 2));
    results.push(record);
    console.log(JSON.stringify({id, checks: record.checks, failure: record.failure, errors: record.errors}));
    await context.close();
  }
}

for (const pageKey of ['home', 'services']) {
  for (const width of [390, 1440]) {
    await snapshot('helixanimalmedicalcenter.webflow.io', pageKey, width, 'baseline');
    await snapshot('helixanimalmedicalcenter.webflow.io', pageKey, width, 'candidate');
  }
}
for (const pageKey of ['home', 'services']) {
  for (const width of [390, 1440]) await snapshot('www.helix-amc.com', pageKey, width, 'current');
}

const comparisons = [];
for (const pageKey of ['home', 'services']) {
  for (const width of [390, 1440]) {
    const before = results.find(r => r.id === `staging-${pageKey}-${width}-baseline`);
    const after = results.find(r => r.id === `staging-${pageKey}-${width}-candidate`);
    const comparison = {pageKey, width, newErrors: after.errors.filter(e => !before.errors.includes(e)), screenshots: []};
    if (comparison.newErrors.length) failures.push({id: after.id, reason: 'new browser errors', errors: comparison.newErrors});
    if (after.layout && before.layout) {
      comparison.headingTextEqual = after.layout.heading?.text === before.layout.heading?.text;
      comparison.overflowEqual = after.checks.horizontalOverflow === before.checks.horizontalOverflow;
      comparison.heroBackgroundEqual = after.layout.hero?.backgroundImage === before.layout.hero?.backgroundImage;
      if (!comparison.headingTextEqual || !comparison.overflowEqual || !comparison.heroBackgroundEqual) failures.push({id: after.id, reason: 'layout/content mismatch'});
    }
    for (const label of ['home', 'menu', 'consultation']) {
      if (!before.screenshots[label] || !after.screenshots[label]) continue;
      const a = PNG.sync.read(fs.readFileSync(path.join(out, before.screenshots[label])));
      const b = PNG.sync.read(fs.readFileSync(path.join(out, after.screenshots[label])));
      if (a.width !== b.width || a.height !== b.height) {failures.push({id: after.id, reason: 'screenshot dimensions differ'}); continue;}
      const diff = new PNG({width: a.width, height: a.height});
      const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {threshold: 0.15});
      const ratio = pixels / (a.width * a.height);
      const filename = `diff-${pageKey}-${width}-${label}.png`;
      fs.writeFileSync(path.join(out, filename), PNG.sync.write(diff));
      comparison.screenshots.push({label, ratio, filename});
      if (ratio > 0.002) failures.push({id: after.id, reason: `${label} screenshot difference requires visual review`, ratio});
    }
    comparisons.push(comparison);
  }
}
await browser.close();
fs.writeFileSync(path.join(out, 'browser-summary.json'), JSON.stringify({date: new Date().toISOString(), browser: 'Playwright Chromium', stageSha, originalSha, results: results.map(({network, ...r}) => r), comparisons, failures}, null, 2));
if (failures.length) {console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1;}
