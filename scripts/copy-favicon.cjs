const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../frontend/src/assets/favicon.jpg');
const destDir = path.resolve(__dirname, '../frontend/public');
const dest = path.join(destDir, 'favicon.jpg');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

fs.copyFileSync(src, dest);
console.log('Copied', src, '->', dest);
