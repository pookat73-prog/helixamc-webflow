#!/usr/bin/env node
// D07: an invisible device copy moving in the DOM must not disable another section's button.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const base = process.env.HELIX_STRUCTURE_BASE || 'dffc7405c96bfcf0549600aa5045c2e6dc82536f';
const output = process.env.HELIX_STRUCTURE_OUTPUT || path.join(repo, '.visual-results/heading-boundary');
const files = ['global/global.css', 'global/floating-cta.css', 'home/global/hamburger.css', 'home/global/hamburger.js', 'home/global/buttons.js', 'home/global/sections-animations.js'];
(async () => {
  fs.mkdirSync(output, { recursive: true });
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(output, 'baseline', file)), { recursive: true });
    fs.writeFileSync(path.join(output, 'baseline', file), file.endsWith('/sections-animations.js') ? execFileSync('git', ['show', base + ':' + file], { cwd: repo }) : fs.readFileSync(path.join(repo, file)));
  }
  const browser = await pw.chromium.launch({ executablePath: process.env.HELIX_CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    assertBrowser(browser);
    for (const width of [1440, 820, 390]) for (const version of (process.env.HELIX_ORDER_VERSIONS || 'original,candidate').split(',')) {
      assert.ok(['original', 'candidate'].includes(version));
      process.env.HELIX_VISUAL_OVERLAY = files.join(',');
      process.env.HELIX_VISUAL_OVERLAY_ROOT = version === 'original' ? path.join(output, 'baseline') : repo;
      const context = await browser.newContext({ viewport: { width, height: width === 820 ? 1180 : width === 390 ? 844 : 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
      const network = await install(context, { inputRoot: path.resolve(process.env.HELIX_INTERACTION_INPUT), extraRoots: (process.env.HELIX_INTERACTION_EXTRAS || '').split(',').filter(Boolean).map(p => path.resolve(p)) });
      await context.addInitScript(() => {
        window.__headingWrites = [];
        const set = CSSStyleDeclaration.prototype.setProperty;
        CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
          if (name === 'box-shadow') {
            const e = [...document.querySelectorAll('.bt-box-2,.bt-box-3')].find(e => e.style === this);
            if (e) window.__headingWrites.push({ cls: e.className, visible: !!e.getClientRects().length, stack: new Error().stack });
          }
          return set.apply(this, arguments);
        };
        document.addEventListener('DOMContentLoaded', () => {
          const second = document.querySelector('section.home_background_2');
          const copy = document.querySelector(innerWidth <= 767 ? 'section.home_background_3' : 'section.home_background_3-mobile');
          if (!second || !copy || copy.getClientRects().length) { window.__headingFixture = { error: 'Expected hidden device copy' }; return; }
          const sample = () => [...document.querySelectorAll('section')].filter(e => e.getClientRects().length).map(e => [e.className, e.getBoundingClientRect().toJSON()]);
          const before = sample();
          second.parentNode.insertBefore(copy, second);
          window.__headingFixture = { hiddenCopy: copy.className, before, after: sample() };
        }, { once: true });
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(network.origin, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(7500);
      await page.locator('.home_background_2 .home_title').evaluate(e => scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * .5));
      await page.waitForTimeout(2600);
      const row = await page.evaluate(() => ({ fixture: window.__headingFixture, writes: window.__headingWrites, button: { loop: document.querySelector('.bt-box-2').classList.contains('is-looping'), opacity: getComputedStyle(document.querySelector('.bt-box-2')).opacity } }));
      fs.writeFileSync(path.join(output, 'attempt-'+width+'-'+version+'.json'), JSON.stringify({...row, errors, network:network.audit},null,2));
      assert.ok(!row.fixture.error, 'Actual hidden copy must be present');
      assert.deepEqual(row.fixture.after, row.fixture.before, 'Moving a hidden copy must preserve all visible section geometry');
      const writes = row.writes.filter(e => e.visible && e.cls.includes('bt-box-2'));
      assert.equal(writes.length, version === 'candidate' ? 1 : 0, 'An unrelated hidden heading order must not disable bt2 control');
      assert.equal(row.button.loop, version === 'candidate', 'Actual section button receives its loop only after the ownership fix');
      assert.deepEqual(errors, []); assert.deepEqual(network.audit.errors, []); assert.equal(network.audit.forwarded, 0);
      assert.ok(files.every(f => network.audit.overlays.some(x => x.path === f)), 'All runtime candidates consumed');
      results.push({ width, version, ...row, errors, networkErrors: network.audit.errors });
      fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, results }, null, 2));
      console.log(width, version, 'PASS', 'visible geometry unchanged, bt2 writes', writes.length, 'loop', row.button.loop);
      await context.close();
    }
  } finally { delete process.env.HELIX_VISUAL_OVERLAY_ROOT; await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
