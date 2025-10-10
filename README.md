# Fauves Platform

Mono-repo contendo backend (NestJS + Prisma + PostgreSQL) e frontend (React + Vite + Tailwind) com ferramentas de marketing por e-mail (FauvesBoost) e módulos de eventos / ingressos.

## Sumário
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Configuração Rápida](#configuração-rápida)
- [Banco & Prisma](#banco--prisma)
- [Email Marketing / FauvesBoost](#email-marketing--fauvesboost)
  - [Fluxo de Listas e Assinantes](#fluxo-de-listas-e-assinantes)
  - [Endpoints API](#endpoints-api)
  - [Estados no Frontend](#estados-no-frontend)
- [Comandos Principais](#comandos-principais)
- [Qualidade / Dev Experience](#qualidade--dev-experience)
- [Próximos Passos Sugeridos](#próximos-passos-sugeridos)

## Arquitetura
```
root
 ├─ backend/      # NestJS + Prisma (API REST, modelos Event/Ticket/Order/Audit/EmailList)
 ├─ frontend/     # Vite + React (UI FauvesBoost, campanhas, listas, builder)
 └─ prisma (dentro de backend) # schema.prisma, migrations baseline
```

Componentes chave:
- Backend: API modular (ex: EmailListsModule) com Prisma Client direto
- Frontend: Página única de marketing (`MarketingTools.tsx`) com múltiplas sub-abas e fluxo de criação de campanhas
- Persistência: PostgreSQL (Supabase ou instância externa) gerenciada via Prisma Migrate

## Stack Tecnológica
Backend:
- NestJS (controllers/services simples – sem interceptors complexos ainda)
- Prisma ORM (v6) + PostgreSQL
- TypeScript

Frontend:
- React + Vite
- Tailwind CSS (classes utilitárias no JSX)
- Gerenciamento de estado local via hooks (useState/useEffect/useMemo)

Infra Dev:
- Scripts NPM padrão
- Rebaseline de migrations já executado (20251004)

## Estrutura de Pastas
```
backend/
  src/
    email-lists/               # Módulo de listas e assinantes
    app.module.ts
  prisma/
    schema.prisma              # Modelos (Event, Ticket, Order, EmailList, EmailSubscriber etc.)
    migrations/                # Baseline única init_rebaseline
frontend/
  src/pages/MarketingTools.tsx # UI principal FauvesBoost
```

## Configuração Rápida
1. Clonar repositório
2. Criar `.env` em `backend/` com `DATABASE_URL=postgres://...`
3. Backend:
   ```bash
   cd backend
   npm install
   npx prisma migrate deploy   # ou migrate dev se em desenvolvimento
   npm run start:dev
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Acessar frontend (normalmente http://localhost:5173) e backend (http://localhost:3000)

## Banco & Prisma
- Baseline atual: `20251004144456_init_rebaseline`
- Modelos novos de marketing: `EmailList`, `EmailSubscriber` com `status` (`ACTIVE` | `INACTIVE`)
- Relações principais: `EmailList 1--N EmailSubscriber`
- Campos relevantes: unique composto `@@unique([listId, email])`

Para reset (ambiente dev):
```bash
cd backend
npx prisma migrate reset --force
```

## Email Marketing / FauvesBoost
Funcionalidades implementadas:
- Criação de listas de assinantes
- Adição manual (single ou batch até 1000) com parsing e validação de e-mail
- Import mock a partir de eventos (gera e-mails fictícios)
- Remoção individual de assinante
- Remoção em massa com modal de confirmação
- Paginação, busca (contains), filtro por status (ACTIVE/INACTIVE/all)
- Toggle de status do assinante (ativo/inativo) com atualização otimista
- Export CSV (respeitando filtros)
- Auto-refresh (20s) enquanto aba de listas ativa
- Toasts com retry para falhas (add/remove/status/load)

### Fluxo de Listas e Assinantes
1. Usuário cria lista (modal) → lista fica selecionada
2. Adiciona assinantes (single / multi / import eventos / CSV mock futuro)
3. Gerencia status e remoções
4. Exporta CSV ou usa listas em campanhas futuras

### Endpoints API
Base: `/email-lists`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/email-lists` | Lista todas as listas (inclui assinantes embutidos para contagem) |
| POST | `/email-lists` | Cria nova lista `{ name }` |
| POST | `/email-lists/:id/subscribers` | Adiciona lote `{ emails: string[] }` (limite 1000) |
| DELETE | `/email-lists/:id/subscribers/:email` | Remove assinante por email |
| GET | `/email-lists/:id/subscribers` | Paginação/filtragem de assinantes (`page,pageSize,q,status`) |
| PATCH | `/email-lists/:id/subscribers/:subscriberId` | Altera status `{ status: ACTIVE|INACTIVE }` |
| DELETE | `/email-lists/:id/subscribers` | Remoção em massa `{ emails: string[] }` |
| GET | `/email-lists/:id/export` | CSV (filtros `q`, `status`) |

### Estados no Frontend (principais)
- `activeListView`, `subsItems`, `subsPage`, `subsStatus`, `subsSelected`, `autoRefreshEnabled`
- Sistema de toasts: mensagens + retry callback

## Comandos Principais
Backend:
```bash
npm run start:dev      # desenvolvimento
npm run test:e2e       # (existem testes básicos Nest)
```
Frontend:
```bash
npm run dev            # inicia Vite
```
Prisma:
```bash
npx prisma migrate dev --name <desc>
npx prisma studio
```

## Qualidade / Dev Experience
- TypeScript strictness moderada
- Atualizações otimistas com rollback em erro (remove/toggle/bulk)
- Debounce em busca de assinantes (400ms)
- Skeleton loaders para tabela
- Auto-refresh controlável

## Próximos Passos Sugeridos
1. Persistir preferências (pageSize, autoRefreshEnabled) em localStorage
2. Ordenação (email, createdAt, status)
3. Métricas de campanhas (abertura / clique reais) + modelos `EmailCampaign` futuros
4. Suporte real a upload CSV (parser + validações detalhadas)
5. Sistema de permissões / auth JWT (scopes organizador)
6. Logs de auditoria para alterações em listas
7. Rate limiting e proteção anti abuso (ex: criação massiva)
8. Email de confirmação / opt-in duplo (GDPR compliance futura)

## Licença
Projeto interno / proprietário (definir licença formal se necessário).

---
Gerado automaticamente como documentação inicial – ajuste conforme o produto evoluir.
