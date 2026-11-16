const fs = require('node:fs');
const { pw: { test, expect } } = require('../../scripts/visual/runtime.cjs');
const { pages } = require('../../scripts/visual/matrix.cjs');
const { install } = require('../../scripts/visual/network.cjs');
const selected = process.env.HELIX_VISUAL_PAGES?.split(',') || pages.map(p => p.id);
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(i => {
      const r = i.getBoundingClientRect();
      return r.width && r.height && r.bottom > 0 && r.top < innerHeight && getComputedStyle(i).visibility !== 'hidden';
    }).map(i => i.decode().catch(() => {})));
  });
  await expect.poll(() => page.evaluate(() => {
    if (!window.gsap) return 0;
    const nodes = [...document.querySelectorAll('.home_branch-card,.home_background_svicc')].filter(e => {
      const r = e.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight && r.bottom > 0;
    });
    return window.gsap.getTweensOf(nodes, true).filter(t => t.repeat() !== -1).length;
  }), { timeout: 15000, message: 'Visible branch card entrance must finish naturally' }).toBe(0);
  // Observe geometry rather than assuming networkidle (persistent UI timers exist).
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('h1,h2,header,.hx-fcta-shell')].map(e => {
    const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
  })), { timeout: 15000 }).not.toEqual([]);
  let previous = '', stable = 0;
  for (let i = 0; i < 30 && stable < 3; i++) {
    const current = await page.evaluate(() => JSON.stringify([document.documentElement.scrollHeight, ...[...document.querySelectorAll('h1,h2,header,.hx-fcta-shell')].map(e => {
      const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10));
    })]));
    stable = current === previous ? stable + 1 : 0; previous = current;
    await page.waitForTimeout(200);
  }
  expect(stable, 'Layout must settle before capture').toBe(3);
}
async function shot(page, name) {
  await settle(page);
  // Finish finite CSS transitions; normalize only continuous animation phases.
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll('video')].filter(v => {
      const r = v.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight && r.bottom > 0;
    }).map(async v => {
      v.pause();
      if (v.currentTime > 0.001) await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Video did not seek to reference frame')), 5000);
        v.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
        v.currentTime = 0;
      });
    }));
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getTiming().iterations === Infinity) { animation.pause(); animation.currentTime = 0; }
    }
  });
  await expect(page).toHaveScreenshot(name + '.png');
}
for (const item of pages.filter(p => selected.includes(p.id))) {
  test(item.id + ' baseline', async ({ page, context, browser }, info) => {
    const network = await install(context), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      // Synthetic collector probe proves routing before opening the public page.
      await page.goto('about:blank');
      await page.evaluate(() => fetch('https://www.google-analytics.com/g/collect?helix_visual_probe=1', { mode: 'no-cors' }).catch(() => {}));
      expect(network.audit.blocked.some(x => x.url.includes('helix_visual_probe=1'))).toBe(true);
      const response = await page.goto(network.origin + item.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
      expect(response.status()).toBe(200);
      await expect(page.locator('.hx-fcta-shell')).toBeVisible({ timeout: 45000 });
      await expect(page.locator('h1').filter({ visible: true }).first()).toBeVisible();
      await page.waitForTimeout(6500); // Existing finite hero/hold sequence runs normally first.
      await shot(page, item.id + '-hero');
      if (item.id === 'home') {
        const burger = page.getByRole('button', { name: '메뉴 열기', exact: true }).filter({ visible: true }).first();
        await burger.click();
        await expect(page.locator('#hx-menu-overlay')).toHaveAttribute('aria-hidden', 'false');
        await shot(page, 'home-menu');
        await page.keyboard.press('Escape');
        await expect(page.locator('#hx-menu-overlay')).toHaveAttribute('aria-hidden', 'true');
        await page.locator('.hx-fcta-form-btn').click();
        await expect(page.locator('#hxFctaModal')).toBeVisible();
        await shot(page, 'home-reservation');
        await page.keyboard.press('Escape');
        await expect(page.locator('#hxFctaModal')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.locator('#hxFctaModal')).toHaveCSS('opacity', '0');
        await expect(page.locator('#hxFctaModal')).toHaveCSS('pointer-events', 'none');
        await expect(page.locator('.hx-fcta-form-btn')).toBeFocused();
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(1500);
        await shot(page, 'home-footer');
        expect(await page.locator('a[href^="tel:"]').count()).toBeGreaterThan(0);
      }
      if (item.id === 'about') {
        await page.evaluate(() => window.scrollTo(0, 1800));
        await page.waitForTimeout(1500);
        await shot(page, 'about-scrolled');
      }
      if (item.id === 'faq' || item.id === 'internal') {
        const region = page.locator(item.id === 'faq' ? '.faq-list' : '.sj_step_list').filter({ visible: true }).first();
        await expect(region).toBeVisible();
        await region.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);
        if (item.id === 'internal' && info.project.name !== 'mobile') {
          await expect(page.locator('#hx-im-process')).toHaveAttribute('data-hx-im-motion', 'complete', { timeout: 20000 });
        }
        await shot(page, item.id + '-content');
      }
      const state = await page.evaluate(() => ({
        title: document.title, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, meta: document.querySelector('meta[name="viewport"]')?.content },
        fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => ({ family: f.family, weight: f.weight })),
        fontErrors: [...document.fonts].filter(f => f.status === 'error').map(f => ({ family: f.family, weight: f.weight })),
        styles: [...document.querySelectorAll('link[rel=stylesheet]')].map(e => e.href),
        overflow: [document.documentElement, document.body].map(e => ({ tag: e.tagName, x: getComputedStyle(e).overflowX, y: getComputedStyle(e).overflowY, width: e.scrollWidth })),
        brokenImages: [...document.images].filter(i => {
          const r = i.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && (!i.complete || !i.naturalWidth);
        }).map(i => i.currentSrc || i.src),
        headingText: [...document.querySelectorAll('h1,h2')].map(e => e.textContent.trim()),
      }));
      expect(state.fonts.length, 'Web fonts must load').toBeGreaterThan(0);
      expect(state.fontErrors, 'Failed web fonts cannot become a reference').toEqual([]);
      expect(state.brokenImages).toEqual([]);
      expect(network.audit.errors).toEqual([]);
      expect(errors, 'Uncaught browser errors').toEqual([]);
      if (process.env.HELIX_VISUAL_RECORD !== '1') expect(network.audit.forwarded, 'Replay must make zero external requests').toBe(0);
      const stateJson = JSON.stringify({ browser: browser.version(), project: info.project.name, ...state }, null, 2);
      fs.writeFileSync(info.outputPath('state.json'), stateJson);
      await info.attach('state', { body: stateJson, contentType: 'application/json' });
    } finally {
      await info.attach('network', { body: JSON.stringify({ ...network.audit, pageErrors: errors }, null, 2), contentType: 'application/json' });
      fs.writeFileSync(info.outputPath('network.json'), JSON.stringify({ ...network.audit, pageErrors: errors }, null, 2));
    }
  });
}
