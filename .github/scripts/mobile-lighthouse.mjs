import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require = createRequire('/tmp/helix-ci-audit/package.json');
const {chromium} = require('playwright');
const {default: lighthouse} = await import(pathToFileURL(require.resolve('lighthouse')));
const chromeLauncher = await import(pathToFileURL(require.resolve('chrome-launcher')));
const out = path.resolve('audit-results');
fs.mkdirSync(out, {recursive: true});
const summary = [];
for (const pageKey of ['home', 'services']) {
  for (let run = 1; run <= 3; run++) {
    const url = 'https://www.helix-amc.com' + (pageKey === 'home' ? '/' : '/services');
    const chrome = await chromeLauncher.launch({chromePath: chromium.executablePath(), chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']});
    try {
      const result = await lighthouse(url, {port: chrome.port, output: ['json', 'html'], onlyCategories: ['performance'], logLevel: 'error', maxWaitForLoad: 90000});
      const lhr = result.lhr;
      const id = `${pageKey}-mobile-${run}`;
      fs.writeFileSync(path.join(out, `${id}.lighthouse.json`), JSON.stringify(lhr));
      fs.writeFileSync(path.join(out, `${id}.lighthouse.html`), result.report[1]);
      const record = {pageKey, run, url, fetchTime: lhr.fetchTime, version: lhr.lighthouseVersion, score: lhr.categories.performance.score, runtimeError: lhr.runtimeError, warnings: lhr.runWarnings, settings: lhr.configSettings, environment: lhr.environment, metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'total-byte-weight'].map(k => [k, {value: lhr.audits[k]?.numericValue, unit: lhr.audits[k]?.numericUnit, display: lhr.audits[k]?.displayValue}]))};
      summary.push(record);
      fs.writeFileSync(path.join(out, 'lighthouse-summary.json'), JSON.stringify(summary, null, 2));
      console.log(JSON.stringify(record));
    } catch (e) {
      summary.push({pageKey, run, url, error: e.message});
      fs.writeFileSync(path.join(out, 'lighthouse-summary.json'), JSON.stringify(summary, null, 2));
      console.error(`${pageKey} run ${run}: ${e.message}`);
    } finally {await chrome.kill();}
  }
}
if (summary.some(r => r.error || r.runtimeError)) process.exitCode = 1;
