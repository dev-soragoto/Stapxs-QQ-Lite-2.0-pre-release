#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit', cwd: root, shell: true });
}

try {
  // 1. build
  run('npm run build');

  // 2. collect files
  const files = [];
  const distIndex = path.join(root, 'dist', 'index.mjs');
  const rootIndex = path.join(root, 'index.mjs');
  let tempCopied = false;

  // The package expects index.mjs at the zip root. If build outputs to dist/, copy it to root temporarily.
  if (fs.existsSync(rootIndex)) {
    files.push('index.mjs');
  } else if (fs.existsSync(distIndex)) {
    // copy dist/index.mjs -> ./index.mjs temporarily
    fs.copyFileSync(distIndex, rootIndex);
    tempCopied = true;
    files.push('index.mjs');
  } else {
    console.error('Missing build output: neither index.mjs at project root nor dist/index.mjs');
    process.exit(1);
  }

  if (fs.existsSync(path.join(root, 'package.json'))) files.push('package.json');
  if (fs.existsSync(path.join(root, 'webui'))) files.push('webui');

  if (files.length === 0) {
    console.error('No files to zip');
    process.exit(1);
  }

  // 3. zip using system zip
  const out = path.join(root, 'napcat-plugin-ssqq.zip');
  // Remove existing zip
  try { if (fs.existsSync(out)) fs.unlinkSync(out); } catch (e) {}

  // Build zip command with quoted paths
  const quoted = files.map(p => `"${p}"`).join(' ');
  const cmd = `zip -r "${out}" ${quoted}`;
  run(cmd);

  // cleanup temporary index.mjs if we created it
  if (tempCopied) {
    try { fs.unlinkSync(rootIndex); } catch (e) { /* ignore */ }
  }

  console.log('\nCreated zip:', out);
} catch (e) {
  console.error('Error:', e && e.message ? e.message : e);
  process.exit(1);
}
