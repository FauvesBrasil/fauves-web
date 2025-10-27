// Script para adicionar coluna organizationId (se não existir) e popular com organizerId
// Uso: NODE_ENV=development node backend/scripts/backfill-collection-organizationId.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando backfill de organizationId em Collection');
  try {
    console.log('Adicionando coluna organizationId se não existir...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "organizationId" uuid;');

    const beforeRows = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as cnt FROM "Collection" WHERE "organizationId" IS NULL;');
    const before = beforeRows?.[0]?.cnt ?? -1;
    console.log(`Coleções sem organizationId antes do backfill: ${before}`);

    if (before > 0) {
      console.log('Aplicando backfill: copiando organizerId -> organizationId onde aplicável...');
      const updated = await prisma.$executeRawUnsafe(`
        UPDATE "Collection"
        SET "organizationId" = "organizerId"
        WHERE "organizationId" IS NULL AND "organizerId" IS NOT NULL;
      `);
      console.log('Update SQL executado. Resultado retornado pelo driver:', updated);
    } else {
      console.log('Nenhum registro a ser atualizado. Pulando UPDATE.');
    }

    const afterRows = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as cnt FROM "Collection" WHERE "organizationId" IS NULL;');
    const after = afterRows?.[0]?.cnt ?? -1;
    console.log(`Coleções sem organizationId após o backfill: ${after}`);

  const sample = await prisma.$queryRawUnsafe('SELECT "id", "organizerId", "organizationId", "title" FROM "Collection" ORDER BY "createdAt" DESC LIMIT 20;');
    console.log('Amostra (últimas 20 coleções):');
    console.table(sample.map(r => ({ id: r.id, organizerId: r.organizerId, organizationId: r.organizationId, title: r.title })));

    console.log('Backfill concluído. Revise os resultados e, se estiver tudo bem, considere aplicar constraints (NOT NULL) no schema.');
  } catch (e) {
    console.error('Erro durante o backfill:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
