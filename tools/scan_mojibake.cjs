// Scan repo for common mojibake artifacts and print file:line
const fs = require('fs');
const path = require('path');

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.css']);
const badPatterns = [/Ã/g, /â/g, /�/g];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      yield* walk(p);
    } else if (exts.has(path.extname(entry.name))) {
      yield p;
    }
  }
}

for (const file of walk(process.cwd())) {
  const txt = fs.readFileSync(file, 'utf8');
  if (badPatterns.some((re) => re.test(txt))) {
    const lines = txt.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (badPatterns.some((re) => re.test(line))) {
        console.log(`${file}:${i + 1}: ${line}`);
      }
    });
  }
}

