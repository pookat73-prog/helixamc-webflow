#!/usr/bin/env node
// Paired closed-state contracts: intentional interaction fixes must not change layout/content.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const output = process.env.HELIX_SCOPE_OUTPUT || path.join(repo, '.visual-results/scope');
const options = {
  ...(process.env.HELIX_INTERACTION_INPUT ? { inputRoot: path.resolve(process.env.HELIX_INTERACTION_INPUT) } : {}),
  extraRoots: (process.env.HELIX_INTERACTION_EXTRAS || '').split(',').filter(Boolean).map(p => path.resolve(p)),
};
const candidate = process.env.HELIX_SCOPE_OVERLAY || 'home/global/hamburger.css,home/global/hamburger.js,global/floating-cta.css,home/global/sections-animations.js';
const paths = (process.env.HELIX_SCOPE_PATHS || '/').split(',');
assert.ok(paths.every(p => ['/', '/discover-helix', '/services', '/faq', '/internal-medicine'].includes(p)), 'Unknown scope consumer');
const consumedPaths = (files, pathname) => files.split(',').filter(p => p && (pathname === '/' || !['home/global/buttons.js', 'home/global/sections-animations.js'].includes(p)));
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await pw.chromium.launch({ executablePath: process.env.HELIX_CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'], headless: true });
  const results = [];
  try {
    assertBrowser(browser);
    for (const pathname of paths) for (const [width, height] of [[1440, 900], [820, 1180], [390, 844]]) {
      const pair = { pathname, width, height };
      for (const version of ['original', 'candidate']) {
        process.env.HELIX_VISUAL_OVERLAY = consumedPaths(version === 'candidate' ? candidate : process.env.HELIX_SCOPE_BASE_OVERLAY || '', pathname).join(',');
        if (process.env.HELIX_SCOPE_BASE_ROOT) process.env.HELIX_VISUAL_OVERLAY_ROOT = version === 'candidate' ? repo : path.resolve(process.env.HELIX_SCOPE_BASE_ROOT);
        const context = await browser.newContext({ viewport: { width, height }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
        const pageOptions = process.env.HELIX_STRUCTURE_PAGE_INPUTS && pathname !== '/' ? { ...options, inputRoot: path.join(process.env.HELIX_STRUCTURE_PAGE_INPUTS, pathname.slice(1)) } : options;
        const network = await install(context, pageOptions), page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(network.origin + pathname, { waitUntil: 'domcontentloaded' });
        await page.locator('.hx-fcta-shell').waitFor({ state: 'visible' });
        await page.waitForTimeout(7500);
        await page.evaluate(() => document.fonts.ready);
        pair[version] = await page.evaluate(() => ({
          title: document.title, height: document.documentElement.scrollHeight,
          viewport: [innerWidth, innerHeight, document.documentElement.scrollWidth],
          policy: [document.documentElement, document.body].map(e => [getComputedStyle(e).overflowX, getComputedStyle(e).overflowY, getComputedStyle(e).transform]),
          headings: [...document.querySelectorAll('h1,h2')].map(e => e.textContent.trim()),
          links: [...document.querySelectorAll('a[href]')].map(e => [e.textContent.trim(), e.getAttribute('href')]),
          boxes: [...document.querySelectorAll('h1,h2,header,.hx-fcta-shell,.footer,.home_branch-card,.home_background_svicc')].map(e => {
            const r = e.getBoundingClientRect(), s = getComputedStyle(e);
            return { cls: e.className, box: r.toJSON(), display: s.display, visibility: s.visibility, fontFamily: s.fontFamily, fontWeight: s.fontWeight, fontSize: s.fontSize };
          }),
          counts: ['.hx-menu-overlay', '.hx-fcta-modal', '.helix-top-btn'].map(s => document.querySelectorAll(s).length),
        }));
        assert.deepEqual(errors, [], version + ' page errors');
        assert.deepEqual(network.audit.errors, [], version + ' network errors');
        assert.equal(network.audit.forwarded, 0);
        pair[version + 'Overlay'] = [...new Map(network.audit.overlays.map(x => [x.path, x])).values()];
        if (version === 'candidate') assert.ok(consumedPaths(candidate, pathname).every(p => pair[version + 'Overlay'].some(x => x.path === p)), 'Every claimed candidate file must be consumed');
        await context.close();
      }
      try { assert.deepEqual(pair.candidate, pair.original); pair.pass = true; }
      catch (e) { pair.pass = false; pair.error = e.message; }
      results.push(pair);
      fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
      console.log(pathname, width, pair.pass ? 'PASS unchanged geometry/content/policy' : 'FAIL ' + pair.error);
    }
  } finally { await browser.close(); }
  assert.ok(results.length === paths.length * 3 && results.every(r => r.pass), 'Unrelated closed-state contracts changed');
})().catch(e => { console.error(e); process.exitCode = 1; });
