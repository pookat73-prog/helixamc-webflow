const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { repo } = require('./runtime.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const target = process.env.HELIX_VISUAL_TARGET || 'production';
const origins = { production: 'https://www.helix-amc.com', staging: 'https://helixanimalmedicalcenter.webflow.io' };
const allowed = new Set(['www.helix-amc.com', 'helixanimalmedicalcenter.webflow.io', 'helix-amc.com', 'api.github.com', 'cdn.jsdelivr.net', 'cdn.prod.website-files.com', 's3.amazonaws.com', 'ajax.googleapis.com', 'cdnjs.cloudflare.com', 'd3e54v103j8qbb.cloudfront.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'use.typekit.net']);
const telemetry = /google-analytics|googletagmanager|googleadservices|doubleclick|facebook|tiktok|script\.google|firebase|firestore|p\.typekit\.net|api\.ipify\.org|\/g\/collect|\/collect(?:\?|$)/i;
const root = path.resolve(process.env.HELIX_VISUAL_CORPUS || path.join(repo, '.visual-corpus'), target);
const manifestFile = path.join(root, 'manifest.json');
const record = process.env.HELIX_VISUAL_RECORD === '1';
const keyFor = raw => {
  const u = new URL(raw);
  if (['cdn.jsdelivr.net', 'api.github.com'].includes(u.hostname)) {
    for (const k of ['t', '_', 'fresh']) u.searchParams.delete(k);
  }
  return u.href;
};
async function install(context) {
  if (!record && !fs.existsSync(manifestFile)) throw new Error('Frozen corpus missing: ' + manifestFile + '. Restore the matching archive; capture is a separate review operation.');
  fs.mkdirSync(path.join(root, 'bodies'), { recursive: true });
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile)) : { schema: 1, target, requests: {} };
  assert.equal(manifest.target, target);
  const audit = { target, mode: record ? 'capture' : 'offline-replay', forwarded: 0, cacheHits: 0, blocked: [], errors: [], overlays: [], requests: [] };
  const overlay = (process.env.HELIX_VISUAL_OVERLAY || '').split(',').filter(Boolean);
  for (const p of overlay) assert.ok(/^(home|global|about|services|faq|internal-medicine)\/[\w./-]+\.(css|js|json)$/.test(p) && !p.includes('..'), 'Invalid overlay path');
  let active = 0;
  const queue = [];
  async function limited(fn) {
    if (active >= 2) await new Promise(resolve => queue.push(resolve));
    active++;
    try { return await fn(); } finally { active--; queue.shift()?.(); }
  }
  const pending = new Map();
  await context.addInitScript(() => { window.__helixNoMeasure = true; });
  await context.route('**/*', async route => {
    const request = route.request(), raw = request.url(), u = new URL(raw);
    const excluded = telemetry.test(raw) || u.hostname === 'oapi.map.naver.com';
    if (!allowed.has(u.hostname) && !excluded) audit.errors.push({ url: raw, error: 'Unexpected resource host; add an evidence-backed rule before capture' });
    if (request.method() !== 'GET' || excluded || !allowed.has(u.hostname) || ['websocket', 'eventsource'].includes(request.resourceType())) {
      audit.blocked.push({ url: raw, method: request.method() });
      return route.fulfill({ status: 204, body: '' });
    }
    const key = keyFor(raw);
    try {
      let entry = manifest.requests[key];
      if (!entry) {
        assert.ok(record, 'Unrecorded request (network disabled): ' + key);
        if (!pending.has(key)) pending.set(key, limited(async () => {
          audit.forwarded++;
          // Store complete media once; range fragments are not a replayable video corpus.
          const headers = { ...request.headers() };
          delete headers.range;
          const response = await route.fetch({ headers, timeout: 45000, maxRetries: 0 });
          assert.equal(response.status(), 200, 'HTTP ' + response.status() + ' ' + key);
          const bytes = await response.body();
          const entry = { sha256: hash(bytes), bytes: bytes.length, contentType: response.headers()['content-type'] || 'application/octet-stream', capturedAt: new Date().toISOString() };
          fs.writeFileSync(path.join(root, 'bodies', entry.sha256), bytes);
          manifest.requests[key] = entry;
          fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
          return entry;
        }));
        entry = await pending.get(key);
      } else audit.cacheHits++;
      let bytes = fs.readFileSync(path.join(root, 'bodies', entry.sha256));
      assert.equal(hash(bytes), entry.sha256, 'Corrupt corpus ' + key);
      const match = u.hostname === 'cdn.jsdelivr.net' && u.pathname.match(/^\/gh\/pookat73-prog\/helixamc-webflow@([^/]+)\/(.+)$/);
      if (match && overlay.includes(match[2])) {
        bytes = fs.readFileSync(path.join(process.env.HELIX_VISUAL_OVERLAY_ROOT || repo, match[2]));
        audit.overlays.push({ path: match[2], originalRef: match[1], sha256: hash(bytes) });
      }
      audit.requests.push({ url: key, sha256: hash(bytes), repoPath: match ? match[2] : null, ref: match ? match[1] : null });
      await route.fulfill({ status: 200, headers: { 'content-type': entry.contentType, 'access-control-allow-origin': '*' }, body: bytes });
    } catch (e) {
      audit.errors.push({ url: key, error: e.message });
      await route.abort('failed');
    }
  });
  return { audit, manifest, root, origin: origins[target] };
}
exports.install = install;
