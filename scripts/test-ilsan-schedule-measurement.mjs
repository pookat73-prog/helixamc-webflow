import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const file = readFileSync(new URL('../seocho/seocho.js', import.meta.url), 'utf8');
const start = file.indexOf('/* 일산 진료 소식 외부 링크');
assert.ok(start > 0);
const source = file.slice(start, file.indexOf('\n})();', start) + 6);
const sheet = readFileSync(new URL('../global/sheet-log.js', import.meta.url), 'utf8');

function fixture({ width = 1280, pathname = '/ilsan', hostname = 'www.helix-amc.com', excluded = false, search = '' } = {}) {
  const events = [], handlers = [], requests = [];
  const location = { hostname, pathname, search, href: `https://${hostname}${pathname}${search}` };
  const window = { innerWidth: width, __helixNoMeasure: excluded,
    gtag: (kind, name, params) => events.push({ kind, name, params }) };
  const context = vm.createContext({ window, location, URL, Blob, console,
    document: { addEventListener: (type, fn) => handlers.push(fn) },
    sessionStorage: { getItem: () => '0' },
    navigator: { sendBeacon: (url, body) => { requests.push({ url, body }); return true; } } });
  vm.runInContext(sheet, context);
  function init() { vm.runInContext(source, context); }
  init();
  function click({ section = 'hero', href = 'https://www.instagram.com/helixamc_ilsan/', footer = false, matched = true } = {}) {
    const link = { href, closest: sel => sel === '#intro' ? (section === 'hero' ? {} : null) : (footer ? {} : null) };
    const event = { target: { closest: () => matched ? link : null },
      preventDefault: () => assert.fail('must preserve navigation'),
      stopPropagation: () => assert.fail('must preserve propagation') };
    handlers.forEach(fn => fn(event));
  }
  return { window, events, handlers, requests, init, click };
}

test('desktop hero and 390px doctors: one GA call and one raw payload per click, including repeated initialization', async () => {
  for (const [width, section, device] of [[1280, 'hero', 'desktop'], [390, 'doctors', 'mobile']]) {
    const f = fixture({ width }); f.init();
    assert.equal(f.handlers.length, 1);
    const href = 'https://www.instagram.com/helixamc_ilsan/?utm_source=website';
    f.click({ section, href }); await Promise.resolve();
    assert.equal(f.events.length, 1); assert.equal(f.requests.length, 1);
    const event = f.events[0];
    assert.equal(event.name, 'ilsan_schedule_link_click_' + device);
    assert.equal(event.params.section, section); assert.equal(event.params.value, href);
    assert.equal(event.params.page, 'ilsan'); assert.equal(event.params.branch, '일산');
    assert.equal(event.params.device, device); assert.equal(event.params.qa_test, undefined);
    const payload = JSON.parse(await f.requests[0].body.text());
    assert.equal(payload.event_name, event.name); assert.equal(payload.value, href);
    assert.equal(payload.params.section, section);
    f.click({ section }); await Promise.resolve();
    assert.equal(f.events.length, 2); assert.equal(f.requests.length, 2);
  }
});

test('footer, unrelated links, other accounts and other pages never emit the dedicated event', () => {
  const f = fixture();
  for (const options of [{ footer: true }, { matched: false },
    { href: 'https://www.instagram.com/helix_amc/' },
    { href: 'https://example.com/helixamc_ilsan/' },
    { href: 'javascript:alert(1)' }]) f.click(options);
  assert.equal(f.events.length, 0);
  const other = fixture({ pathname: '/seocho' }); other.click();
  assert.equal(other.handlers.length, 0); assert.equal(other.events.length, 0);
});

test('staging and operator exclusions cannot be bypassed by QA; runtime exclusion is respected', async () => {
  for (const options of [{ hostname: 'helixanimalmedicalcenter.webflow.io' }, { excluded: true }]) {
    const f = fixture({ ...options, search: '?ilsan-schedule-qa=mobile' });
    f.click(); await Promise.resolve();
    assert.equal(f.events.length, 0); assert.equal(f.requests.length, 0);
  }
  const f = fixture(); f.window.__helixNoMeasure = true; f.click();
  assert.equal(f.events.length, 0);
});

test('bounded QA marker reaches GA and raw payload, without marking normal traffic', async () => {
  const f = fixture({ width: 390, search: '?ilsan-schedule-qa=mobile' });
  f.click({ section: 'doctors' }); await Promise.resolve();
  assert.equal(f.events[0].params.qa_test, 'mobile');
  assert.equal(f.events[0].params.debug_mode, true);
  const payload = JSON.parse(await f.requests[0].body.text());
  assert.equal(payload.params.qa_test, 'mobile');
  const invalid = fixture({ search: '?ilsan-schedule-qa=mobile-extra' }); invalid.click();
  assert.equal(invalid.events[0].params.qa_test, undefined);
});

test('inspector registers both Ilsan buttons even with operator exclusion; no new measurement calls', () => {
  const inspector = readFileSync(new URL('../global/ga-inspector.js', import.meta.url), 'utf8');
  const marker = inspector.indexOf('  /* ── 클릭 직후');
  assert.ok(marker > 0);
  // Read the real registry and its predicates, without starting the overlay UI.
  const registry = inspector.slice(0, marker) + '\nwindow.testTargets = TARGETS;\n})();';
  function targets({ pathname = '/ilsan', hostname = 'www.helix-amc.com', search = '?ga-inspect=1' } = {}) {
    const window = { __helixNoMeasure: true, gtag: () => assert.fail('display registration must not send events') };
    const location = { pathname, hostname, search, href: `https://${hostname}${pathname}${search}` };
    vm.runInNewContext(registry, { window, location, URL, console, document: { querySelector: () => null } });
    return (window.testTargets || []).filter(t => t.event.startsWith('ilsan_schedule_link_click_'));
  }
  const registered = targets();
  assert.deepEqual(Array.from(registered, t => t.sel), ['#intro a[href]', '#vets a.vets-cta-button[href]']);
  for (const t of registered) {
    const link = { href: 'https://www.instagram.com/helixamc_ilsan/?utm_source=website', closest: () => null };
    assert.equal(t.match(link), true);
    assert.equal(t.match({ ...link, closest: () => ({}) }), false);
    assert.equal(t.match({ ...link, href: 'https://www.instagram.com/helix_amc/' }), false);
  }
  for (const options of [{ pathname: '/seocho' }, { pathname: '/ilsan/other' },
    { hostname: 'helixanimalmedicalcenter.webflow.io' }, { search: '' }]) {
    assert.equal(targets(options).length, 0);
  }
});
