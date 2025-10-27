const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orgId = process.argv[2] || '9110ff78-d453-4461-aa72-eb987374658a';

async function main() {
  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId } }).catch(() => null);
    const orgExists = !!org;

      // Use raw queries with explicit ::text casts to avoid operator mismatches
      const rows = await prisma.$queryRaw`
        SELECT * FROM "Collection" c
        WHERE c."organizationId"::text = ${orgId}::text
        ORDER BY c."createdAt" DESC
      `;
      const cntRows = await prisma.$queryRaw`
        SELECT COUNT(*)::int as cnt FROM "Collection" c WHERE c."organizationId"::text = ${orgId}::text
      `;
      const totalAllRows = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM "Collection"`;
      const totalAll = totalAllRows?.[0]?.cnt ?? null;

    const out = {
      ok: true,
      orgId,
      orgExists,
      countMatching: Array.isArray(rows) ? rows.length : 0,
      rows: rows || [],
      totalAll,
      all: rows || [],
    };

    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('erro', e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
