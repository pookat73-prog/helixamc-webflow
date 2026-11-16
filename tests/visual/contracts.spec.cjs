const fs = require('node:fs');
const path = require('node:path');
const { pw: { test, expect } } = require('../../scripts/visual/runtime.cjs');
const { install } = require('../../scripts/visual/network.cjs');
const selected = process.env.HELIX_VISUAL_PAGES?.split(',');
function css(network, file) {
  if ((process.env.HELIX_VISUAL_OVERLAY || '').split(',').includes(file)) {
    return fs.readFileSync(path.join(process.env.HELIX_VISUAL_OVERLAY_ROOT || require('../../scripts/visual/runtime.cjs').repo, file), 'utf8');
  }
  const refs = {
    'global/global.css': '68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d',
    'home/global/sections-animations.css': '68aaaa4f5e73661b3cfbb9e5efabb37b2d4c1f2d',
    'global/word-wrap.css': '63812a31fe5c985de32e8c88b885a19de00f8f3e',
  };
  const entries = Object.entries(network.manifest.requests).filter(([u]) => new URL(u).pathname.endsWith('@' + refs[file] + '/' + file));
  if (entries.length !== 1) throw new Error('Expected one frozen CSS revision for ' + file + '; found ' + entries.length);
  return fs.readFileSync(path.join(network.root, 'bodies', entries[0][1].sha256), 'utf8');
}
if (!selected || selected.includes('home')) test('D01 known overflow conflict (desired contract)', async ({ page, context }) => {
  const network = await install(context);
  await page.setContent('<!doctype html><html><body><h1>Overflow contract</h1></body></html>');
  await page.addStyleTag({ content: css(network, 'global/global.css') });
  await expect(page.locator('body')).toHaveCSS('overflow-x', 'clip', { timeout: 1000 });
  await page.addStyleTag({ content: css(network, 'home/global/sections-animations.css') });
  test.fail(true, 'D01: home section CSS still overrides the document clip policy. Reference capture is not design approval.');
  await expect(page.locator('body')).toHaveCSS('overflow-x', 'clip', { timeout: 1000 });
});
if (!selected || selected.includes('internal')) test('D02 known long-text exception conflict (desired contract)', async ({ page, context }) => {
  const network = await install(context);
  // The published policy overrides a local exception irrespective of selector specificity.
  await page.setContent('<!doctype html><html><body><div id="process"><p class="long-text">LongUnbrokenVeterinaryReferenceStringForWrapping</p></div></body></html>');
  await page.addStyleTag({ content: '#process .long-text { overflow-wrap:anywhere; width:80px; }' });
  await expect(page.locator('.long-text')).toHaveCSS('overflow-wrap', 'anywhere', { timeout: 1000 });
  await page.addStyleTag({ content: css(network, 'global/word-wrap.css') });
  test.fail(true, 'D02: frozen global !important policy defeats a local anywhere exception; actual user-facing defect is unconfirmed.');
  await expect(page.locator('.long-text')).toHaveCSS('overflow-wrap', 'anywhere', { timeout: 1000 });
});
