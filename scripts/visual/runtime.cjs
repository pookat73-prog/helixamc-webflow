const path = require('node:path');
const repo = path.resolve(__dirname, '../..');
// No fallback download or unpinned npx invocation. The Cloud image can supply this package.
const packageRoot = process.env.HELIX_PLAYWRIGHT_MODULE || path.dirname(require.resolve('playwright/package.json', { paths: [path.join(repo, 'tests/visual')] }));
if (require(path.join(packageRoot, 'package.json')).version !== '1.57.0') throw new Error('Use Playwright 1.57.0 for these references');
exports.pw = require(packageRoot + '/test');
exports.cli = require.resolve(packageRoot + '/cli');
exports.repo = repo;
exports.assertBrowser = browser => {
  const fs = require('node:fs');
  const assert = require('node:assert/strict');
  const expected = require(path.join(repo, 'tests/visual/baselines/production/provenance.json')).software;
  assert.equal(browser.version(), expected.chromium, 'Chromium differs from immutable reference environment');
  assert.equal(process.platform, 'linux', 'Use the reference OS; cross-platform captures are separate evidence');
  assert.equal(process.arch, 'x64', 'Use reference x86_64 architecture');
  const release = fs.readFileSync('/etc/os-release', 'utf8');
  assert.match(release, /^ID=debian$/m, 'Use reference Debian OS');
  assert.match(release, /^VERSION_ID="13"$/m, 'Use reference Debian 13');
};
