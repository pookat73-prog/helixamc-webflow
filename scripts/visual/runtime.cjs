const path = require('node:path');
const repo = path.resolve(__dirname, '../..');
// No fallback download or unpinned npx invocation. The Cloud image can supply this package.
const packageRoot = process.env.HELIX_PLAYWRIGHT_MODULE || path.dirname(require.resolve('playwright/package.json', { paths: [path.join(repo, 'tests/visual')] }));
if (require(path.join(packageRoot, 'package.json')).version !== '1.57.0') throw new Error('Use Playwright 1.57.0 for these references');
exports.pw = require(packageRoot + '/test');
exports.cli = require.resolve(packageRoot + '/cli');
exports.repo = repo;
