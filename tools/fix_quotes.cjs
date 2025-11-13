// Quick fixer to revert accidental -- replacements back to quotes in TSX attributes
const fs = require('fs');
const path = require('path');

const targets = [
  'frontend/src/pages/MarketingTools.tsx',
  'src/pages/MarketingTools.tsx',
];

for (const rel of targets) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, 'utf8');

  // Restore attribute quote starts (e.g., className=--... -> className="...")
  src = src.replace(/=--/g, '="');

  // Restore attribute quote ends (e.g., ...-->)
  src = src.replace(/-->/g, '">');

  fs.writeFileSync(file, src, 'utf8');
  console.log(`Repaired quotes in ${rel}`);
}

