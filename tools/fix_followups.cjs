// Follow-up fixer for specific issues detected after initial mojibake cleanup
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'frontend/src/pages/MarketingTools.tsx');
if (fs.existsSync(file)) {
  let src = fs.readFileSync(file, 'utf8');

  // Normalize duplicated/broken formatDate definition into a single clean version
  src = src.replace(/const\s+formatDate\s*=\s*\(iso\?:string\|null\)=>\s*\{[^\n]*\n/g,
    "const formatDate = (iso?:string|null)=> { if(!iso) return '--'; try { return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});} catch { return '--'; } };\n");
  // Also handle single-line corrupted variant
  src = src.replace(/const\s+formatDate\s*=\s*\(iso\?:string\|null\)=>\s*\{[^}]*\};\s*try\s*\{[^}]*\}\s*catch\s*\{[^}]*\}\s*};/g,
    "const formatDate = (iso?:string|null)=> { if(!iso) return '--'; try { return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});} catch { return '--'; } };");

  // Fix SidebarMenu prop value corruption
  src = src.replace(/activeKeyOverride=\"marketing--/g, 'activeKeyOverride="marketing"');

  // Ensure no stray -- remains right before tag close
  src = src.replace(/--\s*(\/>)/g, '" $1');

  fs.writeFileSync(file, src, 'utf8');
  console.log('Patched follow-ups in frontend MarketingTools.tsx');
}

