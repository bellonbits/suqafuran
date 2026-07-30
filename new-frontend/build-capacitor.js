const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const destDir = path.join(__dirname, 'web');

// Create web directory
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
} else {
  fs.rmSync(destDir, { recursive: true });
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy everything from 'out' directory (Next.js static export)
if (fs.existsSync(outDir)) {
  copyDir(outDir, destDir);
  console.log('✓ Capacitor web build complete');
} else {
  console.error('✗ Error: ./out directory not found. Run "npm run build" first.');
  process.exit(1);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  fs.readdirSync(src).forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}
