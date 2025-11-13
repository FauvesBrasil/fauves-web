// Utility to normalize mojibake and small UI issues in MarketingTools files
// Run with: node tools/fix_mojibake.cjs

const fs = require('fs');
const path = require('path');

const targets = [
  'frontend/src/pages/MarketingTools.tsx',
  'src/pages/MarketingTools.tsx',
];

const replacements = [
  [/C�digo/g, 'Código'],
  [/CA3digo/g, 'Código'],
  [/obrigatA3rio/g, 'obrigatório'],
  [/invA�lido/g, 'inválido'],
  [/jA�/g, 'já'],
  [/Sugestao/g, 'Sugestão'],
  [/NA�o/g, 'Não'],
  [/nA�o/g, 'não'],
  [/UsuA�rio/g, 'Usuário'],
  [/vA�rias/g, 'várias'],
  [/pA�blico/g, 'público'],
  [/LanA.?ar anA�ncio pago/g, 'Lançar anúncio pago'],
  [/anA�ncios/g, 'anúncios'],
  [/excluA-do/g, 'excluído'],
  [/excluA-da/g, 'excluída'],
  [/InformA�oes bA�sicas/g, 'Informações básicas'],
  [/ConteA�do/g, 'Conteúdo'],
  [/EndereA.?o de e-mail de resposta \*/g, 'Endereço de e-mail de resposta *'],
  [/EndereA.?o/g, 'Endereço'],
  [/RodapAc/g, 'Rodapé'],
  [/PaA-s/g, 'País'],
  [/OpA.?A�es de estilo \(placeholder\)/g, 'Opções de estilo (placeholder)'],
  [/destinatA�rios/g, 'destinatários'],
  [/A�oes/g, 'Ações'],
  [/Evento \/ C�digo/g, 'Evento / Código'],
  [/Evento \/ CA3digo/g, 'Evento / Código'],
  [/�?"/g, '--'],
];

for (const rel of targets) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, 'utf8');

  for (const [from, to] of replacements) {
    src = src.replace(from, to);
  }

  // Fix toast icons: error/success marker
  src = src.replace(/\{t\.type===\'error\'\?\s*'[^']*'\s*:\s*'[^']*'\}/g, "{t.type==='error'? '!':'✓'}");

  // Fix toast close button content (keep aria-label="Fechar")
  src = src.replace(/aria-label=\"Fechar\">[^<]*<\/button>/g, 'aria-label="Fechar">x</button>');

  // Fix usos string in coupons table if present
  src = src.replace(/const\s+usos\s*=\s*`\/`;/g, "const usos = `${used}/${max!=null ? max : '-'}`;");

  // Fix janela join arrow corruption
  src = src.replace(/\.join\('\s*[^']*\s*'\)/g, ".join(' - ')");

  // Fix specific 'Campanha agendada' message corruption
  src = src.replace(/Campanha agendada[^']*e-mails enfileirados/g, 'Campanha agendada — e-mails enfileirados');

  fs.writeFileSync(file, src, 'utf8');
  console.log(`Patched ${rel}`);
}

