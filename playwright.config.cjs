const path = require('node:path');
const { pw: { defineConfig }, repo } = require('./scripts/visual/runtime.cjs');
const { viewports } = require('./scripts/visual/matrix.cjs');
const target = process.env.HELIX_VISUAL_TARGET || 'production';
if (!['production', 'staging'].includes(target)) throw new Error('Invalid visual target');
module.exports = defineConfig({
  testDir: './tests/visual',
  fullyParallel: false, workers: 1, retries: 0, maxFailures: 1, timeout: 120000,
  forbidOnly: true,
  outputDir: path.join(repo, '.visual-results', target),
  snapshotPathTemplate: '{testDir}/baselines/' + target + '/{projectName}/{arg}{ext}',
  reporter: [['line'], ['json', { outputFile: '.visual-results/' + target + '/results.json' }]],
  expect: { timeout: 15000, toHaveScreenshot: { threshold: 0.2, maxDiffPixels: 100, animations: 'disabled', caret: 'hide', scale: 'css' } },
  use: { browserName: 'chromium', locale: 'ko-KR', timezoneId: 'Asia/Seoul',
    deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'no-preference',
    serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.HELIX_CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage', ...(process.env.HELIX_PROXY_SPKI ? ['--ignore-certificate-errors-spki-list=' + process.env.HELIX_PROXY_SPKI] : [])],
      ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) },
  },
  projects: viewports.map(({ name, width, height }) => ({ name, use: { viewport: { width, height } } })),
});
