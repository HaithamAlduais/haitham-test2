/**
 * Predeploy script: copies server/ source into functions/server/
 * so Firebase Cloud Functions can access the Express app.
 *
 * Run automatically by `firebase deploy` via the predeploy hook.
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'server');
const dest = path.join(__dirname, '..', 'functions', 'server');

function copyDirSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    // Skip node_modules, .env files, service account keys, and temp files
    if (
      entry.name === 'node_modules' ||
      entry.name === 'package-lock.json' ||
      entry.name === 'package.json' ||
      entry.name.startsWith('.env') ||
      entry.name.includes('serviceAccountKey') ||
      entry.name.startsWith('tmpclaude-') ||
      entry.name === 'tests'
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean previous copy
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}

copyDirSync(src, dest);
console.log('✔ Copied server/ → functions/server/');
