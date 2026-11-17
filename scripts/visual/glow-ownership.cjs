#!/usr/bin/env node
// Observe real runtime writes/timers; a class-name/source-text test cannot detect this race.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const base = process.env.HELIX_STRUCTURE_BASE || 'dffc7405c96bfcf0549600aa5045c2e6dc82536f';
const output = process.env.HELIX_STRUCTURE_OUTPUT || path.join(repo, '.visual-results/glow');
const files = ['home/global/hamburger.css', 'home/global/hamburger.js', 'global/floating-cta.css', 'home/global/sections-animations.js', 'home/global/buttons.js'];
function observe() {
  window.__glowEvents = [];
  window.__heroDone = 0;
  window.addEventListener('helix-s1-done', () => window.__heroDone++);
  const selector = '.bt-box-1,.bt-box-2,.bt-box-3,.bt-box-4';
  const find = test => [...document.querySelectorAll(selector)].find(test);
  window.__recordGlow = (e, action, extra = {}) => {
    window.__glowEvents.push({ t: performance.now(), index: [...document.querySelectorAll(selector)].indexOf(e), cls: e.className, action, inline: e.style.boxShadow, opacity: getComputedStyle(e).opacity, visible: !!e.getClientRects().length, stack: new Error().stack, ...extra });
  };
  const set = CSSStyleDeclaration.prototype.setProperty;
  const remove = CSSStyleDeclaration.prototype.removeProperty;
  const add = DOMTokenList.prototype.add;
  CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
    const e = name === 'box-shadow' && find(e => e.style === this);
    if (e) window.__recordGlow(e, 'set', { value, priority });
    return set.apply(this, arguments);
  };
  CSSStyleDeclaration.prototype.removeProperty = function (name) {
    const e = name === 'box-shadow' && find(e => e.style === this);
    if (e) window.__recordGlow(e, 'remove');
    return remove.apply(this, arguments);
  };
  DOMTokenList.prototype.add = function (...args) {
    if (args.includes('is-looping')) {
      const e = find(e => e.classList === this);
      if (e) window.__recordGlow(e, 'loop');
    }
    return add.apply(this, args);
  };
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const baselineRoot = path.join(output, 'baseline');
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(baselineRoot, file)), { recursive: true });
    // Isolate this cause: both sides retain the already accepted fixes and D05.
    fs.writeFileSync(path.join(baselineRoot, file), file.endsWith('/buttons.js') ? execFileSync('git', ['show', base + ':' + file], { cwd: repo }) : fs.readFileSync(path.join(repo, file)));
  }
  const browser = await pw.chromium.launch({ executablePath: process.env.HELIX_CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    assertBrowser(browser);
    assert.ok(process.env.HELIX_INTERACTION_INPUT, 'Supply immutable current input');
    for (const width of [1440, 820, 390]) for (const scenario of ['normal-warm', 'fast-reduced-delayed']) {
      const pair = { width, scenario };
      for (const version of ['original', 'candidate']) {
        process.env.HELIX_VISUAL_OVERLAY = files.join(',');
        process.env.HELIX_VISUAL_OVERLAY_ROOT = version === 'original' ? baselineRoot : repo;
        const context = await browser.newContext({ viewport: { width, height: width === 820 ? 1180 : width === 390 ? 844 : 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', reducedMotion: scenario.startsWith('fast') ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
        const network = await install(context, {
          inputRoot: path.resolve(process.env.HELIX_INTERACTION_INPUT),
          extraRoots: (process.env.HELIX_INTERACTION_EXTRAS || '').split(',').filter(Boolean).map(p => path.resolve(p)),
        });
        let delayed = 0;
        if (scenario.startsWith('fast')) await context.route(/buttons\.css|sections-animations\.css|\.(?:woff2?|otf)(?:\?|$)/, async route => { delayed++; await new Promise(resolve => setTimeout(resolve, 1200)); await route.fallback(); });
        await context.addInitScript(observe);
        const page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(network.origin, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(7500);
        await page.evaluate(() => {
          const to = gsap.to;
          gsap.to = function (target, vars) {
            if (target instanceof Element && target.matches('.bt-box-1,.bt-box-2,.bt-box-3,.bt-box-4')) {
              const done = vars.onComplete;
              vars = { ...vars, onComplete: function () { window.__recordGlow(target, 'fadeComplete'); if (done) done.apply(this, arguments); } };
            }
            return to.call(this, target, vars);
          };
        });
        const enter = async selector => {
          await page.locator(selector).filter({ visible: true }).first().evaluate(e => {
            const heading = e.closest('section')?.querySelector('.home_title') || e;
            scrollTo(0, heading.getBoundingClientRect().top + scrollY - innerHeight * .5);
          });
        };
        if (scenario.startsWith('normal')) { await enter('.bt-box-2'); await page.waitForTimeout(2400); }
        await enter('.bt-box-3');
        if (scenario.startsWith('fast')) {
          await page.waitForTimeout(150);
          await page.evaluate(() => scrollTo(0, 0));
          await page.waitForTimeout(150);
          await enter('.bt-box-3');
        }
        await page.waitForTimeout(2600);
        if (scenario.startsWith('normal')) { await enter('.bt-box-4'); await page.waitForTimeout(2000); }
        const beforeReentry = await page.evaluate(() => window.__glowEvents.length);
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(150);
        await enter('.bt-box-3');
        await page.waitForTimeout(1700);
        await page.evaluate(async () => { await document.fonts.ready; for (const a of document.getAnimations()) if (a.effect.getTiming().iterations === Infinity) { a.pause(); a.currentTime = 0; } });
        const row = await page.evaluate(() => ({ events: window.__glowEvents, heroDone: window.__heroDone, final: [...document.querySelectorAll('.bt-box-1,.bt-box-2,.bt-box-3,.bt-box-4')].filter(e => e.getClientRects().length).map(e => {
          const s = getComputedStyle(e), r = e.getBoundingClientRect();
          return { cls: e.className, text: e.textContent, inline: e.style.boxShadow, opacity: s.opacity, shadow: s.boxShadow, animation: s.animation, radius: s.borderRadius, width: r.width, height: r.height };
        }) }));
        row.reentryWrites = row.events.length - beforeReentry;
        row.delayed = delayed;
        row.errors = errors;
        row.networkErrors = network.audit.errors;
        row.overlays = [...new Map(network.audit.overlays.map(x => [x.path, x])).values()];
        assert.deepEqual(errors, []);
        assert.deepEqual(network.audit.errors, []);
        assert.equal(network.audit.forwarded, 0);
        assert.equal(row.overlays.length, files.length, 'All candidate assets must be consumed');
        assert.ok(row.heroDone > 0, 'Hero lifecycle still completes');
        assert.equal(row.reentryWrites, 0, 'Warm reentry must not schedule another glow');
        const events = row.events.filter(e => e.visible && e.cls.includes('bt-box-3'));
        row.bt3 = Object.fromEntries(['set', 'remove', 'loop', 'fadeComplete'].map(action => [action, events.filter(e => e.action === action)]));
        const fade = row.bt3.fadeComplete.at(-1), release = row.bt3.remove[0];
        assert.ok(fade && release, 'Visible bt3 sequence must actually execute');
        row.holdMS = release.t - fade.t;
        row.singleOwner = row.bt3.set.length === 1 && row.bt3.remove.length === 1 && row.bt3.loop.length === 1 && row.holdMS >= 1490;
        if (version === 'candidate') {
          assert.ok(row.singleOwner, 'bt3 has one controller and >=1.5s hold after fade (10ms scheduling tolerance)');
          assert.ok(row.bt3.set.every(e => e.stack.includes('sections-animations.js')), 'Section owns bt3');
          assert.ok(!events.some(e => e.stack.includes('buttons.js')), 'No generic glow controller touches bt3');
        } else assert.ok(!row.singleOwner, 'Original conflict must be reproduced');
        pair[version] = row;
        await context.close();
      }
      assert.deepEqual(pair.candidate.final, pair.original.final, 'All visible button final geometry/text/glow/loop are preserved');
      results.push(pair);
      fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, results }, null, 2));
      console.log(width, scenario, 'PASS original race -> single owner; hold', Math.round(pair.original.holdMS), '->', Math.round(pair.candidate.holdMS));
    }
  } finally { delete process.env.HELIX_VISUAL_OVERLAY_ROOT; await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
