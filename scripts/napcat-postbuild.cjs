// napcat-postbuild.cjs
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const targetDir = path.resolve(__dirname, '../ssqq.napcat-plugin/webui/dist');
const indexHtml = path.join(distDir, 'index.html');

// 1. 直接替换 index.html 中所有 ./ 为 /plugin/napcat-plugin-ssqq/files/static/
if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, 'utf-8');
  html = html.replace(/\.\//g, '/plugin/napcat-plugin-ssqq/files/static/');
  // 插入 append-napcat-light.css 样式表
  const napcatCss = '<link rel="stylesheet" href="/plugin/napcat-plugin-ssqq/files/static/css/append-napcat-light.css">';
  // 在最后一个 .css 样式表后插入
  html = html.replace(/(<link[^>]+href="[^"]+\.css"[^>]*>)(?![\s\S]*<link[^>]+href="[^"]+\.css"[^>]*>)/, `$1\n    ${napcatCss}`);
  fs.writeFileSync(indexHtml, html, 'utf-8');
  console.log('index.html 路径直接替换完成，并插入 napcat 样式');
}

// 2. 复制 dist 到目标目录（完全覆盖）
function copyDir(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, targetDir);
console.log('dist 目录已复制到 ssqq.napcat-plugin/webui/dist');

// 3. 触发 ssqq.napcat-plugin 的 build:zip
const { execSync } = require('child_process');
try {
  execSync('yarn build:zip', {
    cwd: path.resolve(__dirname, '../ssqq.napcat-plugin'),
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: '/usr/bin:/bin:/usr/sbin:/sbin'
    }
  });
  console.log('ssqq.napcat-plugin build:zip 执行完成');
} catch (e) {
  console.error('ssqq.napcat-plugin build:zip 执行失败', e);
  process.exit(1);
}
