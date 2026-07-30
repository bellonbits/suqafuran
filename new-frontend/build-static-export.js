#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.join(__dirname, 'out');
const NEXT_DIR = path.join(__dirname, '.next');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SERVER_DIR = path.join(NEXT_DIR, 'server', 'app');
const STATIC_DIR = path.join(NEXT_DIR, 'static');

// Create out directory
if (fs.existsSync(OUT_DIR)) {
  execSync(`rm -rf ${OUT_DIR}`);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('📦 Building static export for Capacitor...');

// Copy .next/server/app (exported HTML pages)
if (fs.existsSync(SERVER_DIR)) {
  console.log('  ✓ Copying HTML pages from .next/server/app');
  execSync(`cp -r "${SERVER_DIR}"/* "${OUT_DIR}"`);
}

// Copy .next/static (CSS, JS chunks)
if (fs.existsSync(STATIC_DIR)) {
  console.log('  ✓ Copying static assets from .next/static');
  const outStaticDir = path.join(OUT_DIR, '_next', 'static');
  fs.mkdirSync(outStaticDir, { recursive: true });
  execSync(`cp -r "${STATIC_DIR}"/* "${outStaticDir}"`);
}

// Copy public assets (images, icons, etc)
if (fs.existsSync(PUBLIC_DIR)) {
  console.log('  ✓ Copying public assets');
  const files = fs.readdirSync(PUBLIC_DIR);
  for (const file of files) {
    if (file === '.DS_Store' || file === 'index.html') continue;
    const src = path.join(PUBLIC_DIR, file);
    const dest = path.join(OUT_DIR, file);
    if (fs.statSync(src).isDirectory()) {
      execSync(`cp -r "${src}" "${dest}"`);
    } else {
      execSync(`cp "${src}" "${dest}"`);
    }
  }
}

// Ensure index.html exists
const indexPath = path.join(OUT_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.log('  ✓ Creating index.html entry point');
  const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#ffffff">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Suqafuran">
  <title>Suqafuran - Africa's Marketplace</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="manifest" href="/manifest.json">
</head>
<body>
  <div id="__next"></div>
  <script type="module" src="/_next/static/chunks/main.js"></script>
</body>
</html>`;
  fs.writeFileSync(indexPath, indexContent);
}

console.log(`\n✅ Static export ready in: ./out/`);
console.log(`📊 Files: ${execSync(`find ${OUT_DIR} -type f | wc -l`).toString().trim()}`);
