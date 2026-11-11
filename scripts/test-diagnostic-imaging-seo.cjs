const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);
const remote = new Map();
const root = path.resolve(__dirname, '..');
const candidate = process.argv.includes('--candidate');
const base = 'https://helixanimalmedicalcenter.webflow.io';
const files = ['global/bootstrap.js', 'services/dept-nav.js', 'seo-snippets/diagnostic-imaging.html', 'seo-snippets/services.html'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    for (const [name, width, height, reducedMotion] of [['desktop', 1440, 1000, 'no-preference'], ['mobile', 390, 844, 'reduce']]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
      // Chromium does not inherit this environment's proxy CA store. Use curl's
      // configured proxy and CA trust for public HTTPS responses; execute the
      // resulting unchanged responses in Chromium. Never disable TLS checks.
      await context.route(/^https?:/, async route => {
        const url = route.request().url();
        const suffix = new URL(url).pathname.split(/@[^/]+\//)[1];
        if (candidate && url.includes('cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@') && files.includes(suffix)) {
          return route.fulfill({ status: 200, contentType: suffix.endsWith('.js') ? 'application/javascript' : 'text/html', body: fs.readFileSync(path.join(root, suffix)), headers: { 'access-control-allow-origin': '*' } });
        }
        try {
          if (!remote.has(url)) remote.set(url, run('curl', ['-fsSL', '--max-time', '40', url], { encoding: 'buffer', maxBuffer: 30 * 1024 * 1024 }).then(x => x.stdout));
          const body = await remote.get(url);
          const type = route.request().resourceType();
          const contentType = { document: 'text/html', stylesheet: 'text/css', script: 'application/javascript', font: 'font/woff2' }[type] || (/\.svg(?:[?]|$)/.test(url) ? 'image/svg+xml' : /\.webp(?:[?]|$)/.test(url) ? 'image/webp' : /api.github.com/.test(url) ? 'application/json' : 'application/octet-stream');
          await route.fulfill({ status: 200, contentType, body, headers: { 'access-control-allow-origin': '*' } });
        } catch (error) { await route.abort(); }
      });
      const page = await context.newPage();
      await page.goto(base + '/diagnostic-imaging?fresh=1', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForSelector('#helix-diagnostic-imaging-schema', { state: 'attached', timeout: 30000 });
      const state = await page.evaluate(() => {
        const schemas = [...document.querySelectorAll('#helix-diagnostic-imaging-schema')];
        return { title: document.title, description: document.querySelector('meta[name="description"]')?.content,
          canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(x => x.href),
          h1: [...document.querySelectorAll('h1')].map(x => x.textContent.trim()),
          overflow: document.documentElement.scrollWidth > innerWidth,
          schemaCount: schemas.length, schema: JSON.parse(schemas[0].textContent),
          alts: ['6aed5edae0c6bdf582d7a91e', '6aec0e58c5701aa99afaa44b', '6aec0fe85e1dd5f74676c6bb'].map(id => document.querySelector('img[src*="' + id + '"]')?.alt),
          ogImage: document.querySelector('meta[property="og:image"]')?.content,
        };
      });
      assert.equal(state.schemaCount, 1);
      assert.deepEqual(state.h1, ['영상의학과']);
      assert.equal(state.overflow, false);
      assert.deepEqual(state.canonical, ['https://helix-amc.com/diagnostic-imaging']);
      assert(state.alts.every(Boolean));
      const graph = state.schema['@graph'];
      const service = graph.find(x => x['@type'] === 'Service');
      assert.equal(service.provider['@id'], 'https://helix-amc.com/seocho#branch');
      assert(graph.find(x => x['@type'] === 'BreadcrumbList').itemListElement.some(x => x.item === 'https://helix-amc.com/services'));
      const ids = new Set(graph.map(x => x['@id']));
      (function check(x) { if (!x || typeof x !== 'object') return; if (x['@id']) assert(ids.has(x['@id']), 'Unresolved entity ' + x['@id']); Object.values(x).forEach(v => typeof v === 'object' && check(v)); })(graph);
      if (!candidate) { assert(state.title.includes('CT·MRI·초음파')); assert(state.ogImage); }
      await page.screenshot({ path: '/tmp/helix-imaging-' + (candidate ? 'candidate-' : 'staging-') + name + '.png', fullPage: true });
      await page.goto(base + '/services?fresh=1', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => document.querySelectorAll('a.dept-card_di[href="/diagnostic-imaging"]').length === 3);
      assert.equal(await page.locator('#helix-diagnostic-imaging-schema').count(), 0, 'Schema must be scoped to imaging page');
      const link = page.locator('a.dept-card_di:visible').first();
      await link.click();
      await page.waitForURL('**/diagnostic-imaging');
      console.log(name + ': schema, canonical, headings, alt text, layout, page scope and card navigation passed');
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
