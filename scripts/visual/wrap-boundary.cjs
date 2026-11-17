#!/usr/bin/env node
// D02: retain the actually pinned global policy and test an explicit component exception.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pw, repo, assertBrowser } = require('./runtime.cjs');
const { install } = require('./network.cjs');
const base = process.env.HELIX_STRUCTURE_BASE || 'dffc7405c96bfcf0549600aa5045c2e6dc82536f';
const output = process.env.HELIX_STRUCTURE_OUTPUT || path.join(repo, '.visual-results/wrap');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const target = 'html[data-wf-page="69d74a8ea2cac3ea9cfed34d"] #hx-im-process .sj_step_list';
const pages = ['/', '/discover-helix', '/services', '/faq', '/internal-medicine'];
const selected = (process.env.HELIX_STRUCTURE_PATHS || pages.join(',')).split(',');
assert.ok(selected.every(p => pages.includes(p)), 'Unknown consumer');
const widths = (process.env.HELIX_STRUCTURE_WIDTHS || '1440,820,390').split(',').map(Number);
assert.ok(widths.every(w => [1440, 820, 390].includes(w)), 'Unknown representative width');
(async () => {
  fs.mkdirSync(path.join(output, 'baseline/global'), { recursive: true });
  fs.writeFileSync(path.join(output, 'baseline/global/global.css'), execFileSync('git', ['show', base + ':global/global.css'], { cwd: repo }));
  const browser = await pw.chromium.launch({ executablePath: process.env.HELIX_CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    assertBrowser(browser);
    assert.ok(process.env.HELIX_INTERACTION_INPUT, 'Supply immutable current input');
    for (const width of widths) for (const pathname of selected) {
      const pair = { width, pathname };
      for (const version of ['original', 'candidate']) {
        process.env.HELIX_VISUAL_OVERLAY = 'global/global.css';
        process.env.HELIX_VISUAL_OVERLAY_ROOT = version === 'original' ? path.join(output, 'baseline') : repo;
        const context = await browser.newContext({ viewport: { width, height: width === 820 ? 1180 : width === 390 ? 844 : 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
        const pageInput = process.env.HELIX_STRUCTURE_PAGE_INPUTS && pathname !== '/' ? path.join(process.env.HELIX_STRUCTURE_PAGE_INPUTS, pathname.slice(1)) : process.env.HELIX_INTERACTION_INPUT;
        const network = await install(context, {
          inputRoot: path.resolve(pageInput),
          extraRoots: (process.env.HELIX_INTERACTION_EXTRAS || '').split(',').filter(Boolean).map(p => path.resolve(p)),
        });
        const page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(network.origin + pathname, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(7500);
        await page.evaluate(async () => { await document.fonts.ready; for (const a of document.getAnimations()) if (a.effect.getTiming().iterations === Infinity) { a.pause(); a.currentTime = 0; } });
        const natural = await page.evaluate(target => ({
          height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth,
          nodes: [...document.querySelectorAll('body,body *')].filter(e => e instanceof HTMLElement && e.getClientRects().length && !['SCRIPT', 'STYLE', 'LINK'].includes(e.tagName)).map(e => {
            const s = getComputedStyle(e), r = e.getBoundingClientRect();
            const exception = innerWidth <= 767 && (e.matches(target) || !!e.closest(target));
            return { tag: e.tagName, cls: e.className, text: e.children.length ? null : e.textContent, box: r.toJSON(), font: [s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight], wrap: exception ? 'explicit-mobile-component-exception' : s.overflowWrap, wordBreak: s.wordBreak, hyphens: s.hyphens, display: s.display, opacity: s.opacity };
          }),
          links: [...document.querySelectorAll('a[href]')].map(e => [e.textContent, e.getAttribute('href')]),
        }), target);
        pair[version] = { naturalSHA256: hash(JSON.stringify(natural)), nodeCount: natural.nodes.length, stress: [] };
        fs.writeFileSync(path.join(output, `${pathname.replaceAll('/', '') || 'home'}-${width}-${version}.json`), JSON.stringify(natural));
        if (pathname === '/internal-medicine') {
          // Synthetic payloads exercise the real component, leaving all published copy intact on disk.
          // A local monospace fixture avoids inventing unrecorded font-subset network responses.
          for (const [kind, text] of [['english', 'VeterinaryClinicalReference'.repeat(18)], ['url', 'https://example.invalid/' + 'abcdefghij'.repeat(45)], ['number', '1234567890'.repeat(45)], ['korean', '임상진료검사'.repeat(60)]]) for (const tag of ['direct', 'span', 'a']) {
            const stress = await page.locator(target).first().evaluate((e, { kind, text, tag }) => {
              e.style.fontFamily = 'monospace';
              e.style.fontSize = '12px';
              e.replaceChildren();
              const node = tag === 'direct' ? document.createTextNode(text) : document.createElement(tag);
              if (tag !== 'direct') { node.textContent = text; if (tag === 'a') node.setAttribute('href', '#fixture'); }
              e.appendChild(node);
              const range = document.createRange(); range.selectNodeContents(node);
              const box = e.getBoundingClientRect(), frame = e.closest('#hx-im-process').getBoundingClientRect(), rects = [...range.getClientRects()];
              // A flex item's min-content width may expand the item itself. Check
              // the allocated section/viewport as well as glyphs against the item.
              const overflow = box.right > Math.min(frame.right, innerWidth) + 1 || box.left < Math.max(frame.left, 0) - 1 || rects.some(r => r.right > box.right + 1 || r.left < box.left - 1);
              return { kind, tag, wrap: getComputedStyle(tag === 'direct' ? e : node).overflowWrap, overflow, lines: rects.length, box: box.toJSON(), frame: frame.toJSON(), textBounds: rects.map(r => r.toJSON()) };
            }, { kind, text, tag });
            fs.writeFileSync(path.join(output, 'last-stress.json'), JSON.stringify({ width, version, ...stress }, null, 2));
            const mobile = width <= 767;
            assert.equal(stress.overflow, !(mobile && version === 'candidate'), `${width}/${version}/${kind}/${tag}: original fails; scoped mobile exception contains every long token`);
            assert.equal(stress.wrap, mobile && version === 'candidate' ? 'anywhere' : 'normal');
            pair[version].stress.push(stress);
          }
          // The component exception survives a late re-injection of the exact pinned policy.
          const policy = fs.readFileSync(path.join(repo, 'global/word-wrap.css'), 'utf8');
          const pinned = network.audit.requests.find(x => x.repoPath === 'global/word-wrap.css');
          assert.equal(hash(policy), pinned.sha256, 'Late-order probe uses the actual immutable policy bytes');
          await page.addStyleTag({ content: policy });
          assert.equal(await page.locator(target).first().evaluate(e => getComputedStyle(e.firstElementChild).overflowWrap), version === 'candidate' && width <= 767 ? 'anywhere' : 'normal');
          pair[version].latePolicyOwnershipPreserved = true;
          // Same class outside the component must retain the global policy.
          const outside = await page.evaluate(() => {
            const e = document.createElement('div'); e.className = 'sj_step_list';
            e.innerHTML = '<span>ControlOutsideTheProcess</span>'; document.body.appendChild(e);
            return [getComputedStyle(e).overflowWrap, getComputedStyle(e.firstElementChild).overflowWrap];
          });
          assert.deepEqual(outside, ['normal', 'normal']);
          // Include exact b-1/b/b+1 checks in the actual DOM (no emulated mobile UA claim).
          if (width === 390) for (const boundary of [766, 767, 768]) {
            await page.setViewportSize({ width: boundary, height: 844 });
            const wrap = await page.locator(target).first().evaluate(e => getComputedStyle(e).overflowWrap);
            assert.equal(wrap, version === 'candidate' && boundary <= 767 ? 'anywhere' : 'normal');
            await page.waitForFunction(() => [...document.images].filter(img => {
              const r = img.getBoundingClientRect();
              return r.width && r.height && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
            }).every(img => img.complete), null, { timeout: 10000 });
          }
        }
        fs.writeFileSync(path.join(output, `${pathname.replaceAll('/', '') || 'home'}-${width}-${version}-network.json`), JSON.stringify(network.audit, null, 2));
        assert.deepEqual(errors, []);
        assert.deepEqual(network.audit.errors, []);
        assert.equal(network.audit.forwarded, 0);
        const policies = network.audit.requests.filter(x => x.repoPath === 'global/word-wrap.css');
        assert.ok(policies.length && policies.every(x => x.ref === '63812a31fe5c985de32e8c88b885a19de00f8f3e'), 'Keep actual immutable global policy');
        assert.ok(network.audit.overlays.some(x => x.path === 'global/global.css'), 'Candidate must actually load');
        pair[version].policy = policies;
        pair[version].overlay = network.audit.overlays.find(x => x.path === 'global/global.css');
        pair[version].networkErrors = network.audit.errors;
        await context.close();
      }
      assert.equal(pair.candidate.naturalSHA256, pair.original.naturalSHA256, 'Published content/layout/type outside the explicit wrap property must remain exact');
      results.push(pair);
      fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, selected, widths, results }, null, 2));
      console.log(width, pathname, 'PASS exact natural content/layout/type; long-token boundary checked when applicable');
    }
  } finally { delete process.env.HELIX_VISUAL_OVERLAY_ROOT; await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
