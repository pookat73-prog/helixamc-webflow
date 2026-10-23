import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const buttons = readFileSync(new URL('../home/global/buttons.js', import.meta.url), 'utf8');
const source = buttons.slice(buttons.indexOf('/* Home FAQ entries'), buttons.indexOf('/* Care preparation guide'));
function fixture({ path = '/', hostname = 'helix-amc.com', excluded = false, width = 1280 } = {}) {
  const events = [], listeners = [];
  const location = { pathname: path, hostname, origin: 'https://' + hostname, href: 'https://' + hostname + path };
  const window = { innerWidth: width, __helixNoMeasure: excluded, gtag: (...args) => events.push(args) };
  const context = vm.createContext({ window, location, URL, document: { addEventListener: (name, fn) => listeners.push(fn) } });
  vm.runInContext(source, context);
  vm.runInContext(source, context);
  return { events, listeners, window, click(id, href = '/faq') {
    const link = { id, href: new URL(href, location.href).href };
    const event = { target: { closest: () => link }, preventDefault() { throw Error('navigation changed'); }, stopPropagation() { throw Error('propagation changed'); } };
    listeners.forEach(fn => fn(event));
  } };
}
for (const width of [390, 1280]) {
  const f = fixture({ width });
  assert.equal(f.listeners.length, 1, 'reload must not double bind');
  f.click('home-faq'); f.click('');
  assert.equal(f.events.length, 2);
  assert.deepEqual(f.events.map(e => e[2].section_key), ['care_preparation', 'footer']);
  for (const [kind, name, params] of f.events) {
    assert.equal(kind, 'event'); assert.equal(name, 'home_faq_click');
    assert.equal(params.page, 'home'); assert.equal(params.device, width === 390 ? 'mobile' : 'desktop');
    assert.equal(params.link_url, '/faq'); assert.equal(params.transport_type, 'beacon');
  }
  f.click('home-faq', '/faq?private=value');
  assert.equal(f.events.at(-1)[2].link_url, '/faq', 'query values must not be recorded');
  const count = f.events.length;
  f.click('home-faq', 'https://other.example/faq'); f.click('home-faq', '/seocho');
  assert.equal(f.events.length, count, 'unrelated destinations excluded');
  f.window.__helixNoMeasure = true; f.click('home-faq');
  assert.equal(f.events.length, count, 'exclusion checked at click time');
}
for (const options of [{ hostname: 'helixanimalmedicalcenter.webflow.io' }, { path: '/faq' }, { excluded: true }]) {
  const f = fixture(options); f.click('home-faq'); assert.equal(f.events.length, 0);
}
const f = fixture(); f.window.gtag = () => { throw Error('analytics unavailable'); };
assert.doesNotThrow(() => f.click('home-faq'));
console.log('PASS home FAQ: both positions, desktop/mobile, single binding, destinations, exclusions and native navigation');
