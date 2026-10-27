import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const entry = read('home/bootstrap-v3.js');
const bootstrap = read('home/bootstrap.js');
const hero = read('home/section1/section1.js');
const sha = 'a'.repeat(40), published = 'b'.repeat(40), newest = 'c'.repeat(40);
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function fixture({ cachedAge, fresh = false, blockedStorage = false, hostname = 'www.helix-amc.com' } = {}) {
  const added = [], requests = [], events = {}, timers = new Map(), store = new Map();
  let now = 100000000, timerId = 0;
  if (cachedAge !== undefined) store.set('helix.sha.main', JSON.stringify({ sha, t: now - cachedAge }));
  const document = {
    currentScript: { src: `https://cdn.jsdelivr.net/gh/pookat73-prog/helixamc-webflow@${published}/home/bootstrap-v3.js` },
    readyState: 'loading',
    head: { appendChild(el) { added.push(el); } },
    documentElement: {},
    createElement: tag => ({ tag, style: {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: id => added.find(el => el.id === id),
    addEventListener(name, fn) { (events[name] ||= []).push(fn); }
  };
  const context = {
    document, location: { hostname, search: fresh ? '?fresh=1' : '' },
    localStorage: {
      getItem(k) { if (blockedStorage) throw Error('blocked'); return store.get(k); },
      setItem(k, v) { if (blockedStorage) throw Error('blocked'); store.set(k, v); },
      removeItem(k) { store.delete(k); }
    },
    Date: class extends Date { static now() { return now; } },
    console: { log() {}, warn() {} }, AbortController,
    setTimeout(fn, ms) { timers.set(++timerId, { fn, at: now + ms }); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, options) { return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })); }
  };
  context.window = context;
  return {
    context, added, requests, store, events,
    run(source) { vm.runInNewContext(source, context); },
    async tick(ms) { now += ms; for (const [id, t] of [...timers]) if (t.at <= now) { timers.delete(id); t.fn(); } await flush(); }
  };
}

for (const opts of [{}, { cachedAge: 700000 }, { cachedAge: 43200001 }, { blockedStorage: true }]) {
  const f = fixture(opts); f.run(entry);
  assert.equal(f.added.length, 0, 'do not load another version while lookup is pending');
  await f.tick(2000);
  const expected = opts.cachedAge === 700000 ? sha : published;
  assert.equal(f.context.__helixCommitSha, expected);
  assert(f.requests[0].options.signal.aborted);
  const count = f.added.length;
  f.requests[0].resolve({ ok: true, json: async () => ({ object: { sha: newest } }) }); await flush();
  assert.equal(f.added.length, count, 'late lookup must not inject a second version');
  assert(!f.store.get('helix.sha.main')?.includes(newest), 'late response must not poison next visit');
  assert(f.added.filter(e => e.as === 'style').every(e => e.href.includes('@' + expected + '/')));
}
console.log('✓ stalled lookup: first visit, recent/expired cache, blocked storage, abort, one immutable version');

{
  const f = fixture({ cachedAge: 1000 }); f.run(entry);
  assert.equal(f.requests.length, 0); assert.equal(f.context.__helixCommitSha, sha);
  const count = f.added.length; f.run(entry); assert.equal(f.added.length, count);
}
{
  const f = fixture({ cachedAge: 1000, fresh: true }); f.run(entry);
  f.requests[0].resolve({ ok: true, json: async () => ({ object: { sha: newest } }) }); await flush();
  await f.tick(2000); assert.equal(f.context.__helixCommitSha, newest);
  assert.equal(f.added.filter(e => e.tag === 'script').length, 1);
}
{
  const f = fixture({ hostname: 'helixanimalmedicalcenter.webflow.io' }); f.run(entry);
  assert(f.requests[0].url.includes('/heads/staging'));
  f.requests[0].resolve({ ok: false, status: 429, headers: { get: () => null } }); await flush();
  assert(f.store.has('helix.sha.staging.retryAt'));
  assert.equal(f.context.__helixCommitSha, published);
}
console.log('✓ cached/fresh visits, duplicate entry, staging isolation and rate-limit recovery');

{
  const f = fixture(); f.context.__helixHomeBootstrapRedirected = true;
  f.context.__helixCommitSha = sha; f.run(bootstrap);
  const scripts = () => f.added.filter(e => e.tag === 'script');
  assert.equal(scripts().length, 1, 'hero must wait for critical CSS');
  assert.equal(scripts()[0].async, true, 'ScrollTrigger download must not block hero');
  const critical = ['global/global.css', 'home/global/coming-soon.css', 'home/section1/section1.css', 'home/global/buttons.css'];
  for (const path of critical.slice(0, -1)) f.added.find(e => e.rel === 'stylesheet' && e.href.endsWith(path)).onload();
  await flush(); assert.equal(scripts().length, 1);
  const glowCss = f.added.find(e => e.rel === 'stylesheet' && e.href.endsWith(critical.at(-1)));
  glowCss.onerror();
  assert(f.added.some(e => e.href?.includes('@main/home/global/buttons.css')), 'CSS retry retains completion callback');
  f.added.find(e => e.href?.includes('@main/home/global/buttons.css')).onload(); await flush();
  assert.deepEqual(scripts().slice(1).map(e => e.src.split('@' + sha + '/')[1]),
    ['global/viewport-fix.js', 'global/viewport.js', 'home/global/coming-soon.js', 'home/section1/section1.js']);
  scripts().at(-1).onload();
  assert.equal(scripts().length, 5, 'auxiliary downloads must not delay DOMContentLoaded');
  f.context.document.readyState = 'interactive';
  for (const fn of f.events.DOMContentLoaded) fn();
  const urls = scripts().map(e => e.src);
  const pos = name => urls.findIndex(url => url.includes(name));
  assert(pos('measure-gate.js') < pos('ga4-base.js'));
  assert(pos('ga4-base.js') < pos('session.js'));
  assert(pos('session.js') < pos('sheet-log.js'));
  assert(pos('sheet-log.js') < pos('floating-cta.js'));
  assert(!urls.some(url => url.includes('ga-inspector.js')));
  assert.equal(f.requests.length, 0, 'entry ref must avoid duplicate API requests');
}
console.log('✓ critical CSS and retry gate, hero priority, DOM readiness, measurement ordering');

// Execute the real hero code with a ready slogan font and an unrelated font that
// never resolves. Fades must start after the existing probe and four stable frames.
{
  const f = fixture(), frames = [], fades = [], signals = [];
  const style = { setProperty() {}, removeProperty() {} };
  const slogan = { style, offsetWidth: 320, textContent: '헬릭스동물메디컬센터' };
  const probes = [];
  const body = { appendChild(p) { probes.push(p); p.parentNode = body; }, removeChild(p) { p.parentNode = null; } };
  Object.assign(f.context.document, {
    readyState: 'complete', body,
    querySelector: sel => sel === '.home_slogan' ? slogan : null,
    createElement: () => {
      const p = { style: {} };
      Object.defineProperty(p, 'offsetWidth', { get: () => p.style.cssText.includes('"HeroFont"') ? 200 : 100 });
      return p;
    },
    fonts: { load: async () => [], ready: new Promise(() => {}) }
  });
  Object.assign(f.context, {
    CustomEvent: class { constructor(type) { this.type = type; } },
    dispatchEvent(event) { signals.push({ type: event.type, fades: fades.length }); },
    gsap: { to(state, opts) { fades.push(opts); } },
    getComputedStyle: () => ({ fontFamily: 'HeroFont, sans-serif', fontWeight: '400', fontStyle: 'normal' }),
    performance: { now: () => 0 }, requestAnimationFrame: fn => frames.push(fn)
  });
  f.run(hero); await flush();
  assert.equal(fades.length, 0);
  frames.shift()(); // actual font probe
  for (let i = 0; i < 3; i++) frames.shift()();
  assert.equal(fades.length, 0, 'retain four stable frames');
  assert.equal(signals.length, 0, 'keep cover until font and layout checks pass');
  frames.shift()();
  assert.equal(fades.length, 1, 'unrelated font must not hold slogan until the 2s fallback');
  assert.equal(fades[0].duration, .8); assert.equal(fades[0].delay, .1);
  assert.deepEqual(signals, [{ type: 'helix-s1-ready', fades: 0 }], 'open cover before the content fades, not after completion');
  await f.tick(2000);
  assert.equal(signals.length, 1, 'fallback timer must not repeat readiness');
  assert(probes.every(p => !p.parentNode), 'font probes must be cleaned up');
}
console.log('✓ unrelated fonts cannot block hero; font probe, four stable frames and fade timing retained');

const quickbarSource = read('home/global/coming-soon.js').split('/* Home branch quick access. Preserve the existing SVG / animation algorithms. */')[1];
assert(quickbarSource);
for (const pending of [false, true]) {
  const elements = new Map(), listeners = {}, domListeners = {}, classes = new Set(), timers = [];
  let bars = 0;
  const on = (target, name, fn) => (target[name] ||= []).push(fn);
  const preload = { sheet: null, addEventListener() { throw Error('must not wait on preload'); } };
  const failed = { sheet: null, addEventListener() {} };
  const sheetListeners = {};
  const loaded = { sheet: pending ? null : {}, addEventListener: (type, fn) => on(sheetListeners, type, fn) };
  const parent = {};
  const insert = el => { elements.set(el.id, el); if (el.id === 'hx-branch-quickbar') bars++; };
  const slogan = { parentElement: parent, insertAdjacentElement: (_, el) => insert(el) };
  const button = { parentElement: parent };
  const specialty = {};
  const hero = { nextElementSibling: specialty, setAttribute() {}, insertAdjacentElement: (_, el) => insert(el) };
  const document = {
    readyState: 'loading', documentElement: { classList: { add: name => classes.add(name) } },
    getElementById: id => elements.get(id),
    querySelector: sel => ({ '.home_slogan': slogan, '.bt-box-1': button, '.blackframe_image-hero': hero,
      '.home_background_2': specialty, 'link[href*="home/global/coming-soon.css"]': preload })[sel] || null,
    querySelectorAll: sel => sel === 'link[rel="stylesheet"][href*="home/global/coming-soon.css"]' ? [failed, loaded] : [],
    createElement: () => ({ setAttribute() {}, style: { setProperty() {} }, getBoundingClientRect: () => ({ top: 600, height: 144 }) }),
    addEventListener: (type, fn) => on(domListeners, type, fn)
  };
  const window = { addEventListener: (type, fn) => on(listeners, type, fn) };
  vm.runInNewContext(quickbarSource, { document, window, location: { hostname: 'test.webflow.io', pathname: '/' },
    setTimeout: fn => timers.push(fn), requestAnimationFrame() {} });
  assert.equal(bars, 0, 'wait for document nodes');
  document.readyState = 'interactive';
  for (const fn of domListeners.DOMContentLoaded) fn();
  assert(elements.has('hx-hero-milestones'), 'milestones must exist before hero measurement');
  if (pending) {
    assert.equal(bars, 0, 'do not mount unstyled quickbar');
    loaded.sheet = {};
    for (const fn of sheetListeners.load) fn();
  }
  assert.equal(bars, 1, 'preload and failed original must not hide the styled quickbar');
  assert.equal(classes.size, 0, 'mounting alone must not open first-paint cover');
  for (const fn of listeners['helix-s1-ready']) fn();
  assert(classes.has('hx-home-ready'), 'open immediately after font/layout readiness');
  for (const fn of listeners['helix-s1-done']) fn();
  for (const fn of timers) fn();
  assert.equal(bars, 1, 'readiness, completion and fallback must never duplicate quickbar');
}
console.log('✓ quickbar: preload exclusion, failed CSS retry, CSS wait, early layout, readiness cover and duplicate guards');
