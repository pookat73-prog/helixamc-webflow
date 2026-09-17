import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../home/global/coming-soon.js', import.meta.url), 'utf8');
const start = source.indexOf('  function measureQuickbar(bar) {');
const end = source.indexOf('  function mountQuickbar()', start);
assert.ok(start > 0 && end > start);
const measureSource = source.slice(start, end);
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }

function fixture({ hostname = 'helix-amc.com', excluded = false, qa = '', width = 1280 } = {}) {
  let now = 10000;
  const events = [];
  const listeners = {};
  const intervals = [];
  const links = ['phone_call:seocho', 'phone_call:ilsan', 'detail:svicc', 'detail:seocho', 'phone_call:seocho', 'detail:ilsan', 'phone_call:ilsan', 'detail:svicc'].map((key, index) => {
    const [action, branch] = key.split(':');
    const href = action === 'phone_call' ? (branch === 'seocho' ? 'tel:0221359119' : 'tel:0319787575') : (branch === 'svicc' ? 'https://www.svicc.co.kr/' : '/' + branch);
    return { index, nodeType: 1, action, branch, href, handlers: [],
      getAttribute: name => ({ 'data-qb-action': action, 'data-qb-branch': branch, href })[name],
      addEventListener(name, fn, capture) { this.handlers.push({ name, fn, capture }); },
      closest: () => null };
  });
  const state = { compact: width <= 767, clip: 0, opacity: '1', rect: { top: 576, bottom: 720, left: 0, right: width, width, height: 144 } };
  const on = (name, fn) => (listeners[name] ||= []).push(fn);
  const bar = { isConnected: true, querySelector: () => ({ getClientRects: () => state.compact ? [{}] : [] }), querySelectorAll: () => links, getBoundingClientRect: () => state.rect };
  const window = { innerWidth: width, innerHeight: 720, __helixNoMeasure: excluded, addEventListener: on,
    gtag: (...args) => events.push(args), HelixVP: { device: () => window.innerWidth <= 767 ? 'mobile' : 'desktop' } };
  const document = { hidden: false, addEventListener: on };
  const context = vm.createContext({ window, document, location: { hostname, search: qa }, Date: { now: () => now },
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: state.opacity, getPropertyValue: () => String(state.clip) }),
    setInterval: fn => intervals.push(fn) });
  vm.runInContext(measureSource, context);
  context.measureQuickbar(bar);
  return { state, events, links, window, document,
    init: () => context.measureQuickbar(bar),
    advance(ms) { now += ms; intervals.forEach(fn => fn()); },
    fire(name) { (listeners[name] || []).forEach(fn => fn()); },
    click(index, area = 'surface') {
      const link = links[index];
      const event = { target: area === 'surface' ? link : { nodeType: 1, closest: () => area === 'icon' ? {} : null }, stopped: false,
        stopImmediatePropagation() { this.stopped = true; } };
      link.handlers.forEach(({ fn }) => fn(event));
      return event;
    }
  };
}
const named = (f, name) => f.events.filter(e => e[1] === name);
test('all eight rendered-layout links: one event each, destination and branch intact', () => {
  const f = fixture(); f.init();
  f.links.forEach((link, index) => {
    const before = f.events.length;
    const event = f.click(index, index % 2 ? 'icon' : 'surface');
    assert.equal(f.events.length, before + 1);
    const [, name, p] = f.events.at(-1);
    assert.equal(name, `home_quickbar_${link.action}_${link.branch}`);
    assert.ok(name.length <= 40);
    assert.equal(p.link_url, link.href); assert.equal(p.page, 'home');
    assert.equal(p.section_key, 'quickbar'); assert.equal(p.device, 'desktop');
    assert.equal(event.stopped, link.action === 'phone_call');
    assert.equal(event.defaultPrevented, undefined);
    assert.equal(link.handlers.length, 1);
    assert.equal(link.handlers[0].capture, true);
  });
});
test('exposure after 1s; once per page even after return; delta-only dwell', () => {
  const f = fixture(); f.advance(999); assert.equal(f.events.length, 0);
  f.advance(1); assert.equal(named(f, 'home_quickbar_view').length, 1);
  f.advance(4000); f.state.rect.top = -200; f.state.rect.bottom = -56; f.fire('scroll');
  assert.equal(named(f, 'home_quickbar_dwell')[0][2].value, 5);
  f.fire('pagehide'); assert.equal(named(f, 'home_quickbar_dwell').length, 1);
  f.state.rect.top = 576; f.state.rect.bottom = 720; f.fire('pageshow'); f.advance(2000); f.fire('pagehide');
  assert.equal(named(f, 'home_quickbar_view').length, 1);
  assert.equal(named(f, 'home_quickbar_dwell')[1][2].value, 2);
});
test('hidden tab, header clipping and interrupted exposure are excluded', () => {
  const f = fixture(); f.advance(500); f.document.hidden = true; f.fire('visibilitychange'); f.advance(30000);
  assert.equal(named(f, 'home_quickbar_view').length, 0);
  f.document.hidden = false; f.fire('visibilitychange'); f.state.clip = 100; f.fire('scroll'); f.advance(2000);
  assert.equal(named(f, 'home_quickbar_view').length, 0);
  f.state.clip = 0; f.fire('scroll'); f.advance(1000);
  assert.equal(named(f, 'home_quickbar_view').length, 1);
});
test('idle capped at 60s; active input resumes without counting idle gap', () => {
  const f = fixture(); f.advance(90000);
  assert.equal(named(f, 'home_quickbar_dwell')[0][2].value, 60);
  f.advance(10000); f.fire('pointerdown'); f.advance(2000); f.fire('pagehide');
  assert.equal(named(f, 'home_quickbar_dwell')[1][2].value, 2);
});
test('resize uses rendered layout; prior dwell keeps prior device', () => {
  const f = fixture(); f.advance(3000); f.window.innerWidth = 390; f.state.compact = true;
  f.state.rect.width = 390; f.state.rect.right = 390; f.fire('resize'); f.advance(2000); f.click(4); f.fire('pagehide');
  const dwell = named(f, 'home_quickbar_dwell');
  assert.equal(dwell[0][2].layout, 'wide'); assert.equal(dwell[0][2].device, 'desktop');
  assert.equal(dwell[1][2].layout, 'compact'); assert.equal(dwell[1][2].device, 'mobile');
  assert.equal(dwell[1][2].value, 2);
  assert.equal(named(f, 'home_quickbar_phone_call_seocho')[0][2].layout, 'compact');
});
test('staging and operator exclusion: no events/listeners, QA cannot bypass', () => {
  for (const opts of [{ hostname: 'helixanimalmedicalcenter.webflow.io' }, { excluded: true }]) {
    const f = fixture({ ...opts, qa: '?qb-qa=desktop' }); f.advance(2000); f.click(0); f.fire('pagehide');
    assert.equal(f.events.length, 0); assert.equal(f.links[0].handlers.length, 0);
  }
});
test('bounded QA marker; no marker for normal visitors or arbitrary strings', () => {
  for (const [qa, expected] of [['?qb-qa=mobile', 'mobile'], ['?qb-qa=private-text', undefined], ['', undefined]]) {
    const f = fixture({ qa }); f.click(0);
    assert.equal(f.events[0][2].qa_test, expected);
    assert.equal(f.events[0][2].debug_mode, expected ? true : undefined);
    // Worst case session decoration: 11 session/UTM + 2 phone-conversion params.
    assert.ok(Object.keys(f.events[0][2]).length + 13 <= 25);
  }
});
test('phone event names inherit existing session phone-intent classification', () => {
  const session = readFileSync(new URL('../global/session.js', import.meta.url), 'utf8');
  const re = session.match(/type: 'phone',\s+re: (\/.*?\/) /)[1];
  const phoneRule = vm.runInNewContext(re);
  assert.ok(phoneRule.test('home_quickbar_phone_call_seocho'));
  assert.ok(phoneRule.test('home_quickbar_phone_call_ilsan'));
  assert.ok(!phoneRule.test('home_quickbar_detail_svicc'));
});
console.log(`${checks} quickbar measurement tests passed.`);
