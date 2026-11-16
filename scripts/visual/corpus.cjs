#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { repo } = require('./runtime.cjs');
const target = process.env.HELIX_VISUAL_TARGET || 'production';
assert.ok(['production', 'staging'].includes(target));
const root = path.resolve(process.env.HELIX_VISUAL_CORPUS || path.join(repo, '.visual-corpus'), target);
const pinned = path.join(repo, 'tests/visual/baselines', target, 'corpus-index.json');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
for (const [url, entry] of Object.entries(manifest.requests)) {
  assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  const bytes = fs.readFileSync(path.join(root, 'bodies', entry.sha256));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256, url);
  assert.equal(bytes.length, entry.bytes, url);
}
if (process.argv[2] === 'pin') {
  fs.mkdirSync(path.dirname(pinned), { recursive: true });
  fs.writeFileSync(pinned, JSON.stringify(manifest, null, 2) + '\n');
} else {
  assert.equal(process.argv[2], 'verify', 'Use pin (after capture review) or verify');
  assert.deepEqual(manifest, JSON.parse(fs.readFileSync(pinned)), 'Corpus does not match tracked references');
}
console.log(process.argv[2] + ': ' + Object.keys(manifest.requests).length + ' response hashes verified (' + target + ')');
