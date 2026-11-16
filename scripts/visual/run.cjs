#!/usr/bin/env node
const { spawnSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { cli, repo } = require('./runtime.cjs');
const { pages, select } = require('./matrix.cjs');
const args = process.argv.slice(2), command = args.shift();
if (!['capture', 'test', 'list'].includes(command)) {
  console.error('Usage: node scripts/visual/run.cjs capture|test|list [--pages=home,about] [--changed-from=REF] [--project=pc]');
  process.exit(2);
}
const env = { ...process.env };
const forward = [];
for (const arg of args) {
  if (arg.startsWith('--pages=')) env.HELIX_VISUAL_PAGES = arg.slice(8);
  else if (arg.startsWith('--changed-from=')) {
    const files = execFileSync('git', ['diff', '--name-only', arg.slice(15), '--'], { cwd: repo, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const unsupported = files.filter(f => /\.(css|js|json|html)$/.test(f) &&
      !/^(home|global|about|services|faq|internal-medicine|scripts|tests)\//.test(f) && f !== 'playwright.config.cjs');
    if (unsupported.length) throw new Error('Add page coverage before claiming candidate verification: ' + unsupported.join(', '));
    env.HELIX_VISUAL_PAGES = select(files).join(',');
    // Only explicit runtime files change. Unknown/new loader URLs still fail closed.
    env.HELIX_VISUAL_OVERLAY = files.filter(f => /^(home|global|about|services|faq|internal-medicine)\/.*\.(css|js|json)$/.test(f)).join(',');
    if (!env.HELIX_VISUAL_PAGES) { console.log('No visual consumer changed; browser tests not selected.'); process.exit(0); }
  } else if (arg.startsWith('--project=')) forward.push(arg);
  else { console.error('Unknown option: ' + arg); process.exit(2); }
}
if (env.HELIX_VISUAL_PAGES && env.HELIX_VISUAL_PAGES.split(',').some(id => !pages.some(p => p.id === id))) throw new Error('Unknown page selection');
if (command === 'capture' && env.HELIX_VISUAL_OVERLAY) throw new Error('Capture cannot accept candidate overlays');
env.HELIX_VISUAL_RECORD = command === 'capture' ? '1' : '0';
if (command === 'test') {
  const verify = spawnSync(process.execPath, [path.join(__dirname, 'corpus.cjs'), 'verify'], { cwd: repo, env, stdio: 'inherit' });
  if (verify.status !== 0) process.exit(verify.status ?? 1);
}
const cliArgs = [cli, 'test', '--config', 'playwright.config.cjs', ...forward,
  command === 'capture' ? '--update-snapshots=all' : '--update-snapshots=none', ...(command === 'list' ? ['--list'] : [])];
const result = spawnSync(process.execPath, cliArgs, { cwd: repo, env, stdio: 'inherit' });
if (result.status === 0 && command === 'test' && env.HELIX_VISUAL_OVERLAY) {
  const exercised = new Set();
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, e.name);
      if (e.isDirectory()) walk(file);
      else if (e.name === 'network.json') JSON.parse(fs.readFileSync(file)).overlays.forEach(x => exercised.add(x.path));
    }
  };
  walk(path.join(repo, '.visual-results', env.HELIX_VISUAL_TARGET || 'production'));
  const missing = env.HELIX_VISUAL_OVERLAY.split(',').filter(p => p && !exercised.has(p));
  if (missing.length) { console.error('Candidate files were never exercised: ' + missing.join(', ')); process.exit(1); }
}
process.exit(result.status ?? 1);
