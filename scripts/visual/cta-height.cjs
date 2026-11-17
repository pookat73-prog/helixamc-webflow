#!/usr/bin/env node
// D05: compare every computed declaration and pixel for the actual shell and legacy DOM.
// Baseline is an explicit Git revision, never an updated screenshot or live fallback.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const base = process.env.HELIX_STRUCTURE_BASE || 'dffc7405c96bfcf0549600aa5045c2e6dc82536f';
const output = process.env.HELIX_STRUCTURE_OUTPUT || path.join(repo, '.visual-results/cta-height');
const file = 'global/floating-cta.css';
const before = execFileSync('git', ['show', base + ':' + file], { cwd: repo, encoding: 'utf8' });
const after = fs.readFileSync(path.join(repo, file), 'utf8');
const mobileFix = fs.readFileSync(path.join(repo, 'global/floating-cta-mobile-fix.css'), 'utf8');
const widths = [320, 359, 360, 361, 390, 479, 480, 766, 767, 768, 820, 990, 991, 992, 1279, 1280, 1440, 1920];
const modes = ['', 'hx-fcta-mobile-bar', 'hx-fcta-overlap-fix', 'hx-fcta-overlap-fix hx-fcta-page-home', 'hx-fcta-mobile-bar hx-fcta-overlap-fix', 'legacy'];
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await pw.chromium.launch({ executablePath: process.env.HELIX_CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    assertBrowser(browser);
    assert.ok(process.env.HELIX_INTERACTION_INPUT, 'Supply immutable current input');
    process.env.HELIX_VISUAL_OVERLAY = '';
    const source = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const network = await install(source, {
      inputRoot: path.resolve(process.env.HELIX_INTERACTION_INPUT),
      extraRoots: (process.env.HELIX_INTERACTION_EXTRAS || '').split(',').filter(Boolean).map(p => path.resolve(p)),
    });
    const live = await source.newPage();
    const errors = [];
    live.on('pageerror', e => errors.push(e.message));
    await live.goto(network.origin, { waitUntil: 'domcontentloaded' });
    await live.locator('.hx-fcta-shell').waitFor();
    await live.waitForTimeout(7500);
    const html = await live.locator('.hx-fcta-shell').evaluate(e => e.outerHTML);
    assert.deepEqual(errors, []);
    assert.deepEqual(network.audit.errors, []);
    assert.equal(network.audit.forwarded, 0);
    fs.writeFileSync(path.join(output, 'source.json'), JSON.stringify({ base, html, requests: network.audit.requests }, null, 2));
    await source.close();
    const context = await browser.newContext({ locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const mode of modes) {
        const legacy = mode === 'legacy';
        const markup = legacy ? '<div class="hx-fcta-shell"><button class="hx-fcta-btn"><span class="hx-fcta-btn__img">상담 신청</span></button></div>' : html;
        const pair = [];
        const images = [];
        for (const css of [before, after]) {
          await page.setContent('<!doctype html><html class="' + (legacy ? '' : mode) + '"><head><meta charset="utf-8"><style>' + css + '</style><style>' + mobileFix + '</style></head><body>' + markup + '</body></html>');
          await page.evaluate(async () => {
            await document.fonts.ready;
            for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; }
          });
          pair.push(await page.evaluate(() => [...document.querySelectorAll('html,body,.hx-fcta-shell,.hx-fcta-shell *')].flatMap(e => ['', '::before', '::after'].map(pseudo => {
            const s = getComputedStyle(e, pseudo || null);
            return { tag: e.tagName, cls: e.getAttribute('class') || '', pseudo, box: !pseudo ? e.getBoundingClientRect().toJSON() : null, css: Object.fromEntries([...s].map(p => [p, s.getPropertyValue(p)])) };
          }))));
          images.push(await page.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css' }));
        }
        assert.deepEqual(pair[1], pair[0], `${width}/${mode}: computed style or geometry changed`);
        assert.ok(images[0].equals(images[1]), `${width}/${mode}: component pixels changed`);
        const form = pair[1].find(x => !x.pseudo && x.cls.includes('hx-fcta-form-btn'));
        const expected = width <= 767 ? mode.includes('hx-fcta-mobile-bar') ? '44px' : '28px' : '38px';
        if (!legacy) assert.equal(form.css['min-height'], expected, 'Preserve final variant height');
        results.push({ width, mode: mode || 'floating', equalStylesAndPixels: true, minHeight: form?.css['min-height'] || null });
      }
    }
    const owners = await page.evaluate(() => {
      const rules = [];
      function walk(list, condition = '') {
        for (const r of list) {
          if (r.selectorText === '.hx-fcta-shell .hx-fcta-form-btn' && r.style.minHeight) rules.push([condition, r.style.minHeight]);
          if (r.cssRules) walk(r.cssRules, r.conditionText || condition);
        }
      }
      walk(document.styleSheets[0].cssRules);
      return rules;
    });
    assert.deepEqual(owners, [['', '38px'], ['(max-width: 767px)', '28px']], 'One base/mobile owner; variant ownership stays separate');
    await context.close();
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, cases: results.length, owners, results }, null, 2));
    console.log('PASS', results.length, 'paired component states: exact CSS/geometry/pixels, base/mobile single owner');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
