import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(process.argv[2] || new URL('../home/global/footer.js', import.meta.url), 'utf8');
// Run the complete production script with local DOM/clipboard/analytics doubles.
// No network APIs are provided: fixtures cannot send production telemetry.
function fixture({ width = 1280, transport = 'gtag', clipboard = 'success', throws = false } = {}) {
  const events = [], copied = [], opened = [], intervals = [], scrolls = [];
  let fallback = 0, toast;
  function element(text = '') {
    const attrs = {}, listeners = {}, classes = new Set();
    return {
      dataset: {}, style: {}, innerText: text, textContent: text,
      childNodes: [{ nodeType: 3, textContent: text }], offsetParent: {},
      classList: { add: x => classes.add(x), remove: x => classes.delete(x) },
      setAttribute: (k, v) => { attrs[k] = v; }, getAttribute: k => attrs[k],
      hasAttribute: k => k in attrs, addEventListener: (k, fn) => { listeners[k] = fn; },
      select() {}, getBoundingClientRect: () => ({ left: 0 }),
      fire(type, key) { listeners[type]?.({ key, preventDefault() {}, stopPropagation() {} }); }
    };
  }
  const email = element('hello@example.test'), logo = element(), instagram = element(), blog = element();
  blog.getBoundingClientRect = () => ({ left: 10 });
  const footer = {
    querySelector: () => ({ querySelectorAll: () => [instagram, blog] }),
    querySelectorAll: selector => selector === 'img' ? [logo, instagram, blog] : selector === 'a[href]' ? [] : [email]
  };
  const document = {
    readyState: 'complete', addEventListener() {},
    querySelector: selector => selector === 'section.footer' ? footer : null,
    getElementById: () => toast,
    createElement: tag => { const el = element(); if (tag === 'div') toast = el; return el; },
    body: { appendChild() {}, removeChild() {} },
    createTreeWalker: () => ({ nextNode: () => null }),
    execCommand(command) { assert.equal(command, 'copy'); fallback++; return true; }
  };
  const window = { innerWidth: width, addEventListener() {}, open: (...args) => opened.push(args), scrollTo: x => scrolls.push(x) };
  const record = event => { if (throws) throw Error('analytics unavailable'); events.push(JSON.parse(JSON.stringify(event))); };
  if (transport === 'gtag') {
    window.gtag = (kind, event, params) => { assert.equal(kind, 'event'); record({ event, ...params }); };
    window.dataLayer = { push() { throw Error('gtag must take priority'); } };
  } else if (transport === 'dataLayer') window.dataLayer = { push: record };
  const navigator = clipboard === 'missing' ? {} : { clipboard: { writeText(text) {
    copied.push(text);
    return clipboard === 'denied' ? Promise.reject(Error('clipboard denied')) : Promise.resolve();
  } } };
  const location = { search: '', pathname: '/about' };
  const context = vm.createContext({ window, document, navigator, location, console: { log() {} }, NodeFilter: { SHOW_TEXT: 4 },
    setInterval(fn) { intervals.push(fn); return intervals.length; }, clearInterval() {}, setTimeout() {}, clearTimeout() {} });
  vm.runInContext(source, context);
  intervals[0]();
  vm.runInContext(source, context); // duplicate load guard
  assert.equal(intervals.length, 1);
  return { email, logo, instagram, blog, events, copied, opened, scrolls, location,
    get fallback() { return fallback; }, get toast() { return toast; } };
}

async function settle() { for (let i = 0; i < 5; i++) await Promise.resolve(); }
let cases = 0;
for (const width of [390, 1280]) {
  const device = width === 390 ? 'mobile' : 'desktop';
  for (const transport of ['gtag', 'dataLayer', 'none']) {
    for (const clipboard of ['success', 'denied', 'missing']) {
      const f = fixture({ width, transport, clipboard });
      f.email.fire('click'); await settle();
      assert.equal(f.toast.textContent, '복사완료 · hello@example.test');
      assert.equal(f.fallback, clipboard === 'success' ? 0 : 1);
      assert.deepEqual(f.copied, clipboard === 'missing' ? [] : ['hello@example.test']);
      assert.equal(f.events.length, transport === 'none' ? 0 : 1);
      if (transport !== 'none') assert.deepEqual(f.events[0], {
        event: 'copy_email_' + device, item_type: 'footer_email', page: 'about',
        source_page: '/about', section_key: 'footer', target_type: 'email', target_key: 'official-email',
        device, value: 'hello@example.test'
      });
      cases++;
    }
    const f = fixture({ width, transport });
    f.email.fire('keydown', 'Escape'); await settle();
    assert.equal(f.copied.length, 0);
    for (const key of ['Enter', ' ']) { f.email.fire('keydown', key); await settle(); }
    assert.equal(f.copied.length, 2);
    assert.equal(f.events.length, transport === 'none' ? 0 : 2);
    f.instagram.fire('click'); f.blog.fire('keydown', 'Enter');
    assert.deepEqual(f.opened.map(x => x[0]), ['https://www.instagram.com/helix_amc/', 'https://blog.naver.com/helix_amc']);
    if (transport !== 'none') for (const [i, key] of ['instagram', 'blog'].entries()) {
      assert.equal(f.events[i + 2].event, 'sns_click_' + key + '_' + device);
      assert.equal(f.events[i + 2].target_type, 'sns');
      assert.equal(f.events[i + 2].target_key, 'official-' + key);
    }
    f.logo.fire('click'); assert.equal(f.location.href, '/');
    f.location.pathname = '/'; f.logo.fire('keydown', 'Enter'); assert.equal(f.scrolls.length, 1);
    cases++;
  }
  for (const transport of ['gtag', 'dataLayer']) {
    const f = fixture({ width, transport, throws: true });
    f.email.fire('click'); await settle();
    assert.equal(f.toast.textContent, '복사완료 · hello@example.test');
    assert.equal(f.copied.length, 1);
    cases++;
  }
}
console.log(`PASS footer email: ${cases} cases; mobile/desktop, gtag/dataLayer/absent/throwing analytics, clipboard success/denied/fallback, keyboard, duplicate load, SNS and logo`);
