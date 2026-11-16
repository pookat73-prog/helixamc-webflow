#!/usr/bin/env node
// User-result checks: wheel propagation, lock ownership, and breakpoint re-entry.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pw, repo } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const output = process.env.HELIX_INTERACTION_OUTPUT || path.join(repo, '.visual-results/interactions');
const widths = (process.env.HELIX_INTERACTION_WIDTHS || '1440,820,390').split(',').map(Number);
const options = {
  ...(process.env.HELIX_INTERACTION_INPUT ? { inputRoot: path.resolve(process.env.HELIX_INTERACTION_INPUT) } : {}),
  extraRoots: (process.env.HELIX_INTERACTION_EXTRAS || '').split(',').filter(Boolean).map(p => path.resolve(p)),
};
async function wheel(page, x = 8, y = 400) {
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(400);
  return page.evaluate(() => scrollY);
}
async function cards(page) {
  return page.evaluate(() => [...document.querySelectorAll('.home_branch-card,.flex-block-22 > .div-block-151,.home_background_svicc')]
    .filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none')
    .map(e => ({ cls: e.className, opacity: Number(getComputedStyle(e).opacity), box: e.getBoundingClientRect().toJSON() })));
}
async function reachCards(page) {
  const target = page.locator('.home_branch-card,.flex-block-22 > .div-block-151').filter({ visible: true }).first();
  await target.scrollIntoViewIfNeeded();
  await page.evaluate(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  await page.waitForTimeout(1200);
  return cards(page);
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await pw.chromium.launch({ executablePath: process.env.HELIX_CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: width === 820 ? 1180 : width <= 480 ? 844 : 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
      const network = await install(context, options), page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const row = { width, checks: {}, failures: [] };
      const check = (name, value, message) => { row.checks[name] = value; if (!value) row.failures.push(message || name); };
      try {
        await page.goto(network.origin, { waitUntil: 'domcontentloaded' });
        await page.locator('.hx-fcta-shell').waitFor({ state: 'visible' });
        await page.waitForTimeout(7000);
        await page.evaluate(() => scrollTo(0, 300));
        const burger = page.getByRole('button', { name: '메뉴 열기', exact: true }).filter({ visible: true }).first();
        await burger.click();
        await page.waitForTimeout(700);
        row.menuStart = await page.evaluate(() => scrollY);
        row.menuEnd = await wheel(page);
        check('menuBackgroundLocked', row.menuEnd === row.menuStart);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        check('menuFocusRestored', await burger.evaluate(e => document.activeElement === e));
        row.menuReleased = await wheel(page);
        check('menuScrollRestored', row.menuReleased > row.menuEnd);
        await page.locator('.hx-fcta-form-btn').click();
        await page.waitForTimeout(400);
        row.formStart = await page.evaluate(() => scrollY);
        row.formEnd = await wheel(page);
        check('formBackgroundLocked', row.formEnd === row.formStart);
        const box = page.locator('.hx-fcta-modal__box');
        const bounds = await box.boundingBox();
        const canScroll = await box.evaluate(e => e.scrollHeight > e.clientHeight);
        if (canScroll) {
          const oldTop = await box.evaluate(e => e.scrollTop);
          await wheel(page, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
          check('formInternalScroll', await box.evaluate(e => e.scrollTop) > oldTop);
          check('formInternalWheelKeepsBackground', await page.evaluate(() => scrollY) === row.formStart);
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        row.formReleased = await wheel(page);
        check('formScrollRestored', row.formReleased > row.formEnd);
        check('formFocusRestored', await page.locator('.hx-fcta-form-btn').evaluate(e => document.activeElement === e));
        // Two independent owners must not unlock one another.
        for (const firstClose of ['menu', 'form']) {
          await burger.click();
          await page.locator('.hx-fcta-form-btn').evaluate(e => e.click());
          await page.waitForTimeout(450);
          const start = await page.evaluate(() => scrollY);
          await page.locator(firstClose === 'menu' ? '.hx-menu-close' : '.hx-fcta-modal__close').evaluate(e => e.click());
          await page.waitForTimeout(400);
          check('overlapRetains-' + firstClose, await wheel(page) === start);
          await page.locator(firstClose === 'menu' ? '.hx-fcta-modal__close' : '.hx-menu-close').evaluate(e => e.click());
          await page.waitForTimeout(400);
          check('overlapReleases-' + firstClose, await wheel(page) > start);
        }
        row.coldCards = await reachCards(page);
        check('coldCardsVisible', row.coldCards.length >= 3 && row.coldCards.every(e => e.opacity === 1));
        if (width === 1440) {
          for (const nextWidth of [820, 1440, 390, 820, 1440]) {
            await page.setViewportSize({ width: nextWidth, height: nextWidth === 820 ? 1180 : 900 });
            await page.waitForTimeout(400);
            const state = await reachCards(page);
            (row.transitions ||= []).push({ width: nextWidth, cards: state });
            check('cardsAfter' + nextWidth + '-' + row.transitions.length, state.length >= 3 && state.every(e => e.opacity === 1));
          }
        }
        check('networkErrors', network.audit.errors.length === 0);
        check('pageErrors', errors.length === 0);
        check('zeroExternalRequests', network.audit.forwarded === 0);
        await page.screenshot({ path: path.join(output, width + '.png') });
      } catch (e) { row.failures.push(e.stack); }
      finally {
        row.network = network.audit; row.pageErrors = errors; results.push(row);
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ at: new Date().toISOString(), options, overlay: process.env.HELIX_VISUAL_OVERLAY || '', results }, null, 2));
        console.log(width, row.failures.length ? 'FAIL ' + row.failures.join(', ') : 'PASS');
        await context.close();
      }
    }
  } finally { await browser.close(); }
  assert.ok(results.length === widths.length && results.every(r => !r.failures.length), 'Interaction regression failed; see results.json');
})().catch(e => { console.error(e); process.exitCode = 1; });
