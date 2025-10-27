import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('api')
export class CollectionsController {
  constructor(private readonly prisma: PrismaService) {}
  private async ensureTables() {
    // Create tables if they don't exist (id provided by app)
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Collection" (
        "id" uuid PRIMARY KEY,
        "organizerId" uuid NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "bannerImage" text,
        "slug" text UNIQUE,
        "published" boolean DEFAULT false,
        "isDeleted" boolean DEFAULT false,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      );
    `);
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CollectionEvent" (
        "id" uuid PRIMARY KEY,
        "collectionId" uuid NOT NULL,
        "eventId" uuid NOT NULL,
        "createdAt" timestamptz DEFAULT now(),
        CONSTRAINT collection_event_unique UNIQUE ("collectionId", "eventId")
      );
    `);
    // Garantir coluna slug mesmo se a tabela já existia antes das alterações
    await this.prisma.$executeRawUnsafe(
      `ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "slug" text UNIQUE;`,
    );
    await this.prisma.$executeRawUnsafe(
      `ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "published" boolean DEFAULT false;`,
    );
  }

  private async getCollectionColumnTypes(): Promise<Record<string, string>> {
    try {
      const rows: any[] = await this.prisma
        .$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Collection'`;
      const map: Record<string, string> = {};
      rows.forEach((r) => (map[r.column_name] = r.data_type));
      return map;
    } catch {
      return {};
    }
  }

  private slugify(raw: string): string {
    return (
      (raw || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
        .substring(0, 60) || 'colecao'
    );
  }

  private async generateUniqueSlug(
    base: string,
    ignoreId?: string,
  ): Promise<string> {
    let candidate = base;
    let i = 2;
    while (true) {
      let rows: any[] = [];
      try {
        if (ignoreId) {
          rows = (await this.prisma
            .$queryRaw`SELECT "id" FROM "Collection" WHERE "slug" = ${candidate} AND "id" <> ${ignoreId}::uuid LIMIT 1`) as any;
        } else {
          rows = (await this.prisma
            .$queryRaw`SELECT "id" FROM "Collection" WHERE "slug" = ${candidate} LIMIT 1`) as any;
        }
      } catch (e: any) {
        // Se a coluna slug ainda não existir (migração antiga), tenta adicionar e continua
        if (
          String(e?.message || '').includes('column') &&
          String(e?.message || '').includes('slug')
        ) {
          try {
            await this.prisma.$executeRawUnsafe(
              `ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "slug" text UNIQUE;`,
            );
          } catch {}
          // Tenta novamente após adicionar
          continue;
        }
        throw e;
      }
      if (rows.length === 0) return candidate;
      candidate = `${base}-${i++}`;
    }
  }

  // Public fetch by slug (non-deleted)
  @Get('collections/slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    if (!slug) return { error: 'slug obrigatório' };
    await this.ensureTables();
    // Somente coleções publicadas e não deletadas
    const rows: any[] = await this.prisma
      .$queryRaw`SELECT * FROM "Collection" WHERE "slug" = ${slug} AND "isDeleted" = false AND "published" = true LIMIT 1`;
    return rows[0] || null;
  }

  // Debug: list raw Collection rows (development only)
  @Get('debug/collections')
  async debugListCollections() {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      return { error: 'not available in production' };
    }
    try {
      await this.ensureTables();
      const rows: any[] = await this.prisma.$queryRaw`
        SELECT "id", "organizerId", "title", "description", "bannerImage", "slug", "published", "isDeleted", "createdAt"
        FROM "Collection"
        ORDER BY "createdAt" DESC
        LIMIT 200
      `;
      return { ok: true, rows };
    } catch (e) {
      console.error('debug/collections error', e?.message || e);
      return { ok: false, error: String(e?.message || e) };
    }
  }

  // Debug: return DB host/name info (development only, non-sensitive)
  @Get('debug/db-info')
  async debugDbInfo() {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      return { error: 'not available in production' };
    }
    try {
      const raw = process.env.DATABASE_URL || '';
      if (!raw) return { ok: false, error: 'DATABASE_URL not set in env' };
      try {
        const u = new URL(raw);
        const host = u.hostname;
        const port = u.port || null;
        const pathname = (u.pathname || '').replace(/^\//, '') || null;
        return { ok: true, host, port, database: pathname };
      } catch (e) {
        // fallback: try to parse postgres style without protocol
        return { ok: true, raw: raw.slice(0, 200) };
      }
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
  }

  // List all collections across all organizations the user participates in
  // Support both styles: /api/collections/by-user/:userId and /api/collections/by-user?userId=...
  @Get('collections/by-user')
  async listCollectionsByUser(@Query('userId') userId?: string) {
    if (!userId) return [];
    // Delegate to the param-based implementation to avoid duplication
    return this.listCollectionsByUserParam(userId);
  }

  @Get('collections/by-user/:userId')
  async listCollectionsByUserParam(@Param('userId') userId: string) {
    if (!userId) return [];
    await this.ensureTables();
    try {
      // organizations via equipe + created
      const orgEquipe: any[] = await this.prisma
        .$queryRaw`SELECT DISTINCT "organizationId" FROM "organizationequipe" WHERE "userId"::text = ${userId}::text`;
      const orgCreated: any[] = await this.prisma
        .$queryRaw`SELECT "id" FROM "Organization" WHERE "createdBy"::text = ${userId}::text`;
      const orgIds = Array.from(
        new Set(
          [
            ...orgEquipe.map((r) => r.organizationId),
            ...orgCreated.map((r) => r.id),
          ].filter(Boolean),
        ),
      );
      if (!orgIds.length) return [];
      const now = new Date();
    // Construir lista dinâmica para IN. Detectar tipo da coluna organizerId
    // e escolher cast apropriado para evitar erros text = uuid.
    const colTypes2 = await this.getCollectionColumnTypes();
    const organizerColType = (colTypes2['organizerid'] || colTypes2['organizer_id'] || colTypes2['organizerId'] || '')?.toLowerCase();
    const organizationColType = (colTypes2['organizationid'] || colTypes2['organization_id'] || colTypes2['organizationId'] || '')?.toLowerCase();
    const useUuidCast = (organizerColType === 'uuid');
    const placeholderCast = useUuidCast ? '::uuid' : '::text';
    const placeholders = orgIds.map((_, i) => `$${i + 1}${placeholderCast}`).join(',');
      // Determine whether the Collection table has an organizationId column
      const colTypes = await this.getCollectionColumnTypes();
      const colsLower = Object.keys(colTypes || {}).map((k) => String(k).toLowerCase());
      const hasOrganizationIdCol = colsLower.includes('organizationid') || colsLower.includes('organization_id');
      // Usar queryRawUnsafe só para a parte do IN; parâmetros continuam separados
      // Para tolerar organizerId armazenado como uuid ou text, comparamos ambos: as text e como uuid
      // Repetimos os placeholders para passar os mesmos valores duas vezes (uma para each comparison)
      const orgCondition = hasOrganizationIdCol
        ? `(c."organizerId"${useUuidCast ? '' : '::text'} IN (${placeholders}) OR c."organizationId"${organizationColType === 'uuid' ? '' : '::text'} IN (${placeholders}))`
        : `(c."organizerId"${useUuidCast ? '' : '::text'} IN (${placeholders}))`;
      const baseSql = `SELECT c."id", c."title", c."description", c."bannerImage", c."organizerId", c."slug", c."published",
        o."name" as "organizerName", 
        COALESCE((SELECT COUNT(*) FROM "CollectionEvent" ce JOIN "event" e ON e."id" = ce."eventId" 
                  WHERE ce."collectionId" = c."id" AND (e."status" IS DISTINCT FROM 'deleted') AND e."startDate" >= $${orgIds.length * 2 + 1}),0) as "upcomingCount"
  FROM "Collection" c LEFT JOIN "Organization" o ON o."id" = c."organizerId" 
  WHERE c."isDeleted" = false AND ${orgCondition}
        ORDER BY c."createdAt" DESC`;
      // passamos orgIds twice to fill both sets of placeholders, then 'now' as last param
      // Pass the same orgIds values as parameters; placeholders in SQL are cast to text
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        baseSql,
        ...orgIds,
        ...orgIds,
        now,
      );
      console.log(
        '[collections/by-user] user',
        userId,
        'orgIds',
        orgIds.length,
        'collections',
        rows.length,
      );
      return rows || [];
    } catch (e) {
      console.error('[listCollectionsByUser] error', e);
      return [];
    }
  }

  // List collections for an organization with upcoming count
  @Get('organization/:id/collections')
  async listCollections(@Param('id') id: string) {
    if (!id) return [];
    try {
      await this.ensureTables();
      const now = new Date();
      // Log mínimo
      let orgExists = false;
      try {
        // Cast the parameter to text to avoid text = uuid operator errors when
        // the DB column type differs between deployments.
        const test: any[] = await this.prisma
          .$queryRaw`SELECT 1 FROM "Organization" WHERE "id"::text = ${id}::text LIMIT 1`;
        orgExists = test.length > 0;
      } catch {}
      // Tolerate organizerId stored as uuid or text: compare both text and uuid forms
      // Extra debug: detect whether organizationId column exists and count matching rows
  const colTypes = await this.getCollectionColumnTypes();
  const colsLower = Object.keys(colTypes || {}).map((k) => String(k).toLowerCase());
  const hasOrganizationIdCol = colsLower.includes('organizationid') || colsLower.includes('organization_id');
  const organizerColType = (colTypes['organizerid'] || colTypes['organizer_id'] || colTypes['organizerId'] || '')?.toLowerCase();
  const organizationColType = (colTypes['organizationid'] || colTypes['organization_id'] || colTypes['organizationId'] || '')?.toLowerCase();
      try {
        // Enforce strict organizationId equality: if the Collection table has an
        // organizationId column, only return rows where c."organizationId" = id.
        // If the column does not exist, return empty results (strict mode).
        if (!hasOrganizationIdCol) {
          console.debug('[collections:list] organizationId column missing, returning no collections for org', id);
          return [];
        }

        const cntRows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as cnt FROM "Collection" c
           WHERE ${organizationColType === 'uuid' ? `c."organizationId" = $1::uuid` : `c."organizationId"::text = $1::text`}`,
          id,
        );
        const cnt = cntRows?.[0]?.cnt ?? 0;
        console.debug('[collections:list] debug count matching collections for id', id, 'count=', cnt);

        const sql = `SELECT c."id", c."title", c."description", c."bannerImage", c."organizerId", c."slug", c."published",
                   o."name" AS "organizerName",
                   COALESCE((
                     SELECT COUNT(*) FROM "CollectionEvent" ce
                     JOIN "event" e ON e."id" = ce."eventId"
                     WHERE ce."collectionId" = c."id"
                       AND (e."status" IS DISTINCT FROM 'deleted')
                       AND e."startDate" >= $2
                   ), 0) AS "upcomingCount"
              FROM "Collection" c
         LEFT JOIN "Organization" o ON o."id" = c."organizerId"
           WHERE ${organizationColType === 'uuid' ? `c."organizationId" = $1::uuid` : `c."organizationId"::text = $1::text`} AND c."isDeleted" = false
             ORDER BY c."createdAt" DESC`;
        const rowsRes: any[] = await this.prisma.$queryRawUnsafe(sql, id, now);
        var rows = rowsRes;
      } catch (e) {
        console.debug('[collections:list] query failed', e?.message || e);
        return [];
      }
      console.log('[collections:list]', {
        orgId: id,
        count: rows.length,
        orgExists,
      });
      return rows || [];
    } catch (e) {
      console.error('Erro em /api/organization/:id/collections:', e);
      return [];
    }
  }

  // Debug endpoint: return detailed info for an organization collections query
  @Get('debug/organization/:id/collections')
  async debugListCollectionsForOrg(@Param('id') id: string) {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      return { error: 'not available in production' };
    }
    if (!id) return { ok: false, error: 'id required' };
    try {
      await this.ensureTables();
      const now = new Date();
      // Check org exists
      let orgExists = false;
      try {
        const test: any[] = await this.prisma.$queryRaw`SELECT 1 FROM "Organization" WHERE "id"::text = ${id}::text LIMIT 1`;
        orgExists = test.length > 0;
      } catch (e) {
        // ignore
      }
      const colTypes = await this.getCollectionColumnTypes();
      const colsLower = Object.keys(colTypes || {}).map((k) => String(k).toLowerCase());
      const hasOrganizationIdCol = colsLower.includes('organizationid') || colsLower.includes('organization_id');
      const organizationColType = (colTypes['organizationid'] || colTypes['organization_id'] || colTypes['organizationId'] || '')?.toLowerCase();
      if (!hasOrganizationIdCol) {
        // If organizationId column is missing, return empty result but still provide
        // a small sample of all collections for debugging.
        const all: any[] = await this.prisma.$queryRaw`SELECT * FROM "Collection" ORDER BY "createdAt" DESC LIMIT 200`;
        const totalAll = Array.isArray(all) ? all.length : 0;
        return { ok: true, orgId: id, orgExists, countMatching: 0, rows: [], totalAll, all };
      }
      const countRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as cnt FROM "Collection" c WHERE ${organizationColType === 'uuid' ? `c."organizationId" = $1::uuid` : `c."organizationId"::text = $1::text`}`,
        id,
      );
      const cnt = countRows?.[0]?.cnt ?? 0;
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT c.* FROM "Collection" c WHERE ${organizationColType === 'uuid' ? `c."organizationId" = $1::uuid` : `c."organizationId"::text = $1::text`} ORDER BY c."createdAt" DESC`,
        id,
      );
      // Also return all collections for manual comparison
      const all: any[] = await this.prisma.$queryRaw`SELECT * FROM "Collection" ORDER BY "createdAt" DESC LIMIT 200`;
      return { ok: true, orgId: id, orgExists, countMatching: cnt, rows, totalAll: all.length, all };
    } catch (e) {
      console.error('debug/organization collections error', e?.message || e);
      return { ok: false, error: String(e?.message || e) };
    }
  }

  // Create collection for organization
  @Post('organization/:id/collections')
  async createCollection(@Param('id') id: string, @Body() body: any) {
    await this.ensureTables();
    const { title, description, bannerImage, published } = body || {};
    if (!id || !title) return { error: 'organizerId e title são obrigatórios' };
    const cid = uuidv4();
    try {
      // Gerar slug único
      const baseSlug = this.slugify(title);
      const slug = await this.generateUniqueSlug(baseSlug);
      // Insert and set both organizerId and organizationId to the provided id
      // so newly-created collections are explicitly associated with the organization.
      await this.prisma.$executeRaw`
        INSERT INTO "Collection" ("id", "organizerId", "organizationId", "title", "description", "bannerImage", "slug", "published")
        VALUES (${cid}::uuid, ${id}::uuid, ${id}::uuid, ${title}, ${description ?? null}, ${bannerImage ?? null}, ${slug}, ${published === true})
      `;
      const row: any = await this.prisma
        .$queryRaw`SELECT "id", "title", "description", "bannerImage", "organizerId", "slug", "published" FROM "Collection" WHERE "id" = ${cid}::uuid`;
      // Verifica se a org existe
      let orgExists = false;
      try {
        // cast the parameter to text to avoid text = uuid operator errors
        const chk: any[] = await this.prisma
          .$queryRaw`SELECT 1 FROM "Organization" WHERE "id"::text = ${id}::text LIMIT 1`;
        orgExists = chk.length > 0;
      } catch {}
      console.log(
        '[createCollection] inserted',
        cid,
        'org',
        id,
        'title',
        title,
        'orgExists?',
        orgExists,
      );
      const collection = Array.isArray(row) ? row[0] : row;
      return (
        collection || {
          id: cid,
          title,
          description: description ?? null,
          bannerImage: bannerImage ?? null,
          organizerId: id,
        }
      );
    } catch (e: any) {
      console.error('Erro createCollection', e);
      return { error: 'Falha ao criar coleção', detail: e?.message };
    }
  }

  // Soft delete collection
  @Delete('collection/:id')
  async deleteCollection(@Param('id') id: string) {
    await this.ensureTables();
    if (!id) return { error: 'id é obrigatório' };
    await this.prisma
      .$executeRaw`UPDATE "Collection" SET "isDeleted" = true WHERE "id" = ${id}`;
    return { ok: true };
  }

  // Update (title/description/banner) collection
  @Post('collection/:id/update')
  async updateCollection(@Param('id') id: string, @Body() body: any) {
    await this.ensureTables();
    if (!id) return { error: 'id é obrigatório' };
    const { title, description, bannerImage, published } = body || {};
    let newSlug: string | null = null;
    if (title) {
      const candidate = this.slugify(title);
      newSlug = await this.generateUniqueSlug(candidate, id); // evitar conflito com a própria
    }
    await this.prisma
      .$executeRaw`UPDATE "Collection" SET "title" = COALESCE(${title ?? null}, "title"), "description" = ${description ?? null}, "bannerImage" = ${bannerImage ?? null}, "slug" = COALESCE(${newSlug}, "slug"), "published" = COALESCE(${published}, "published"), "updatedAt" = now() WHERE "id" = ${id}`;
    const row: any = await this.prisma
      .$queryRaw`SELECT * FROM "Collection" WHERE "id" = ${id}`;
    return { updated: true, collection: Array.isArray(row) ? row[0] : row };
  }

  // List events inside a collection
  @Get('collection/:id/events')
  async listCollectionEvents(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    await this.ensureTables();
    if (!id) return [];
    try {
      const lim = limit
        ? Math.min(Math.max(parseInt(limit, 10) || 0, 1), 100)
        : null;
      const off = offset ? Math.max(parseInt(offset, 10) || 0, 0) : 0;
      if (lim) {
        const rows: any[] = await this.prisma.$queryRaw`
          SELECT e."id", e."name", e."startDate" FROM "CollectionEvent" ce
          JOIN "event" e ON e."id" = ce."eventId"
          WHERE ce."collectionId" = ${id}::uuid
          ORDER BY e."startDate" ASC NULLS LAST
          LIMIT ${lim} OFFSET ${off}
        `;
        const totalRows: any[] = await this.prisma
          .$queryRaw`SELECT COUNT(*)::int as cnt FROM "CollectionEvent" ce WHERE ce."collectionId" = ${id}::uuid`;
        const total = totalRows?.[0]?.cnt || 0;
        const nextOffset = off + rows.length < total ? off + rows.length : null;
        return { items: rows || [], total, nextOffset };
      } else {
        const rows: any[] = await this.prisma.$queryRaw`
          SELECT e."id", e."name", e."startDate" FROM "CollectionEvent" ce
          JOIN "event" e ON e."id" = ce."eventId"
          WHERE ce."collectionId" = ${id}::uuid
          ORDER BY e."startDate" ASC NULLS LAST
        `;
        return rows || [];
      }
    } catch (e) {
      console.error('Erro listCollectionEvents', e);
      return [];
    }
  }

  // Toggle publish state (published = true/false)
  @Post('collection/:id/publish')
  async publishCollection(@Param('id') id: string, @Body() body: any) {
    await this.ensureTables();
    if (!id) return { error: 'id é obrigatório' };
    const { published } = body || {};
    if (typeof published !== 'boolean')
      return { error: 'published boolean é obrigatório' };
    try {
      await this.prisma
        .$executeRaw`UPDATE "Collection" SET "published" = ${published}, "updatedAt" = now() WHERE "id" = ${id}`;
      const row: any = await this.prisma
        .$queryRaw`SELECT * FROM "Collection" WHERE "id" = ${id}`;
      return { ok: true, collection: Array.isArray(row) ? row[0] : row };
    } catch (e: any) {
      return { error: 'Falha ao atualizar publish', detail: e?.message };
    }
  }

  // Add event to collection
  @Post('collection/:id/events')
  async addEventToCollection(@Param('id') id: string, @Body() body: any) {
    await this.ensureTables();
    const { eventId } = body || {};
    if (!id || !eventId)
      return { error: 'collectionId e eventId são obrigatórios' };
    try {
      const ceid = uuidv4();
      // Explicitly cast to uuid to avoid any DB type mismatch
      await this.prisma.$executeRaw`
        INSERT INTO "CollectionEvent" ("id", "collectionId", "eventId")
        VALUES (${ceid}::uuid, ${id}::uuid, ${eventId}::uuid)
        ON CONFLICT ("collectionId", "eventId") DO NOTHING
      `;
      return { ok: true };
    } catch (e) {
      console.error('Erro addEventToCollection', e?.message || e);
      return { error: 'Falha ao adicionar' };
    }
  }

  // Remove event from collection
  @Delete('collection/:id/events/:eventId')
  async removeEventFromCollection(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
  ) {
    await this.ensureTables();
    if (!id || !eventId) return { error: 'ids obrigatórios' };
    try {
      await this.prisma
        .$executeRaw`DELETE FROM "CollectionEvent" WHERE "collectionId" = ${id} AND "eventId" = ${eventId}`;
      return { ok: true };
    } catch (e) {
      console.error('Erro removeEventFromCollection', e);
      return { error: 'Falha ao remover' };
    }
  }
}
