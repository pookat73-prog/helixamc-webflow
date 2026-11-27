const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { devices, webkit } = require('playwright');

const staging = 'https://helixanimalmedicalcenter.webflow.io';
const stagingRevision = 'f903360a2a13ea5878c417acc099373bca77d020';
const fixtures = [
  ['/', 'f1bcefbe1565038406abcd4a8266d82b76b5fb41', '6b80a19bd911d7e6cb414d68afa72ecfab8f163abdbb4bd1b89376ffa999b5a2'],
  ['/faq', 'a1fbbe0d0979d79860696c1f2c218916b51f221e', '6b80a19bd911d7e6cb414d68afa72ecfab8f163abdbb4bd1b89376ffa999b5a2'],
  ['/services', 'ea611f6adbb1b3abf0d7728867b331614db3574a', '6b80a19bd911d7e6cb414d68afa72ecfab8f163abdbb4bd1b89376ffa999b5a2'],
  ['/seocho', stagingRevision, 'da7204d9eb8e1c9f72658dc844f823b6f0bca1269b090c57591e4ee5c2c4d03d'],
];
const assets = new Map();

function get(url) {
  if (!assets.has(url)) {
    assets.set(url, fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) }).then(async response => ({
      status: response.status,
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      body: Buffer.from(await response.arrayBuffer()),
    })));
  }
  return assets.get(url);
}

function allowedStatic(url, kind) {
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  if (url.hostname === 'cdn.jsdelivr.net') {
    return /^\/gh\/pookat73-prog\/helixamc-webflow@[a-z0-9-]+\/[a-zA-Z0-9_/.-]+\.(js|css|html)$/.test(url.pathname) &&
      !url.pathname.includes('..') && !url.search;
  }
  if (url.hostname === 'cdn.prod.website-files.com') {
    return /^\/[a-f0-9]{24}\//.test(url.pathname) && ['script', 'stylesheet'].includes(kind);
  }
  if (url.hostname === 'cdnjs.cloudflare.com') {
    return /^\/ajax\/libs\/gsap\/[\d.]+\/(?:gsap|ScrollTrigger)\.min\.js$/.test(url.pathname);
  }
  if (url.hostname === 'd3e54v103j8qbb.cloudfront.net') return url.pathname.startsWith('/js/jquery-');
  return url.hostname === 'ajax.googleapis.com' && url.pathname.startsWith('/ajax/libs/webfont/');
}

async function paste(page, phone, value, expectedEvents) {
  await phone.fill('');
  await phone.focus();
  const clipboard = spawnSync('xclip', ['-selection', 'clipboard', '-in'], {
    input: value,
    stdio: ['pipe', 'ignore', 'ignore'],
    timeout: 4000,
  });
  assert.equal(clipboard.status, 0, 'X11 clipboard setup');
  await page.keyboard.press('Control+v');
  await page.waitForFunction(count => window.qaPastes.length === count, expectedEvents, { timeout: 4000 });
  const event = await page.evaluate(() => window.qaPastes.at(-1));
  assert.deepEqual(event, { trusted: true, text: value }, 'native WebKit clipboard event');
}

async function verify(browser, [path, expectedRef, expectedHash]) {
  const url = staging + path;
  const html = await get(url);
  assert.equal(html.status, 200, 'official stage HTML');
  const ctx = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', reducedMotion: 'reduce' });
  const writes = [];
  const cta = [];
  await ctx.routeWebSocket('**/*', route => route.close());
  await ctx.addInitScript(() => {
    navigator.sendBeacon = () => false;
    window.open = () => null;
  });
  await ctx.route('**/*', async route => {
    const request = route.request();
    const target = new URL(request.url());
    if (request.method() !== 'GET') {
      writes.push(request.method() + ':' + target.hostname);
      return route.abort();
    }
    if (target.href === url && request.resourceType() === 'document') return route.fulfill(html);
    if (target.origin + target.pathname === 'https://api.github.com/repos/pookat73-prog/helixamc-webflow/git/ref/heads/staging') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ object: { sha: stagingRevision } }) });
    }
    if (!allowedStatic(target, request.resourceType())) return route.abort();
    try {
      const asset = await get(target.href);
      if (asset.status === 200 && target.pathname.endsWith('/global/floating-cta.js')) {
        cta.push([target.pathname.match(/@([^/]+)/)?.[1], createHash('sha256').update(asset.body).digest('hex')]);
      }
      return await route.fulfill({ ...asset, headers: { 'access-control-allow-origin': '*' } });
    } catch {
      return route.abort().catch(() => {});
    }
  });
  const page = await ctx.newPage();
  const active = () => page.evaluate(() => document.activeElement.id);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 24000 });
    const toggle = page.locator('#hxFctaToggle');
    const close = page.locator('#hxFctaModalClose');
    const modal = page.locator('#hxFctaModal');
    const phone = page.locator('#hxFcta_phone');
    const error = page.locator('#hxFcta_phone_err');
    const form = page.locator('#hxFctaForm');
    await toggle.tap({ timeout: 20000 });
    assert.deepEqual(cta, [[expectedRef, expectedHash]], 'published fixed CTA bytes');
    assert.equal(await page.locator('.hx-fcta-form__phone-prefix').textContent(), '010-');
    assert.equal(await phone.getAttribute('maxlength'), null, 'no native pre-validation truncation');

    await page.evaluate(() => {
      window.qaPastes = [];
      document.querySelector('#hxFcta_phone').addEventListener('paste', event => {
        window.qaPastes.push({ trusted: event.isTrusted, text: event.clipboardData.getData('text/plain') });
      });
      window.qaMockPhones = [];
      const fetchBeforeTest = window.fetch;
      window.fetch = (input, options) => {
        const target = new URL(typeof input === 'string' ? input : input.url, location.href);
        if (/(?:firebaseio\.com|firebasedatabase\.app)$/.test(target.hostname)) {
          if (String(options?.method).toUpperCase() === 'POST') {
            window.qaMockPhones.push(JSON.parse(options.body).phone);
          }
          return Promise.reject(new Error('Synthetic reservation transport blocked'));
        }
        return fetchBeforeTest.call(window, input, options);
      };
    });
    await page.locator('#hxFcta_owner').fill('Synthetic QA');
    await page.locator('#hxFcta_privacy').check();

    await phone.pressSequentially('0112000');
    assert.equal(await phone.inputValue(), '0112-000');
    assert.equal(await active(), 'hxFcta_phone');
    await phone.pressSequentially('0');
    assert.equal(await phone.inputValue(), '0112-0000');
    assert.equal(await active(), 'hxFcta_memo');
    await form.evaluate(node => node.requestSubmit());
    await page.waitForFunction(() => !document.querySelector('#hxFctaSubmit').disabled);
    assert.deepEqual(await page.evaluate(() => window.qaMockPhones), ['01001120000']);

    await paste(page, phone, '010-0000-0000', 1);
    assert.equal(await phone.inputValue(), '0000-0000');
    assert.equal(await active(), 'hxFcta_memo');
    await form.evaluate(node => node.requestSubmit());
    await page.waitForFunction(() => !document.querySelector('#hxFctaSubmit').disabled);
    const validPhones = ['01001120000', '01000000000'];
    assert.deepEqual(await page.evaluate(() => window.qaMockPhones), validPhones);

    for (const [index, invalid] of ['011-0000-0000', '010-0000-00000', '010-0000-000'].entries()) {
      await paste(page, phone, invalid, index + 2);
      assert.equal(await phone.inputValue(), invalid);
      assert.ok((await error.textContent()).includes('010'));
      await form.evaluate(node => node.requestSubmit());
      assert.equal(await active(), 'hxFcta_phone');
      assert.deepEqual(await page.evaluate(() => window.qaMockPhones), validPhones);
    }

    await close.tap();
    assert.equal(await modal.getAttribute('aria-hidden'), 'true');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    await toggle.tap();
    assert.equal(await modal.getAttribute('aria-hidden'), 'false');
    assert.equal(await form.count(), 1);
    assert.equal(await active(), 'hxFctaModalClose');
    await phone.fill('');
    assert.equal(await error.textContent(), '');
    assert.deepEqual(writes, [], 'no browser network writes');
    console.log(JSON.stringify({ path, mode: 'WebKit iPhone 13 profile', sixChecks: 'pass', trustedPastes: 4,
      validMockPayloads: 2, invalidMockPayloads: 0, externalWrites: 0 }));
  } finally {
    await ctx.close();
  }
}

(async () => {
  const browser = await webkit.launch({ headless: false });
  try {
    console.log('WebKit ' + browser.version() + ' | iPhone 13 profile | Synthetic data');
    for (const entry of fixtures) {
      try {
        await verify(browser, entry);
      } catch (error) {
        console.error(entry[0] + ': ' + error.stack);
        process.exitCode = 1;
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
