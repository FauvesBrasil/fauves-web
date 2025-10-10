# Guia de Deploy Fauves Platform

## Visão Geral
Projeto dividido em dois serviços:
- Backend (NestJS + Prisma + Postgres)
- Frontend (Vite React + Nginx para produção)

Você pode implantar:
1. Tudo junto via Docker Compose (local ou VPS)
2. Backend em um serviço (Railway / Render / Fly.io) + Frontend (Vercel / Netlify)
3. Imagens Docker publicadas no GHCR (workflow CI incluso)

---
## 1. Docker Compose (Desenvolvimento / VPS simples)
Pré-requisitos: Docker + Docker Compose.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Ajuste DATABASE_URL e JWT_SECRET no backend/.env

docker compose build
docker compose up -d
```
Serviços expostos:
- Backend: http://localhost:4000/api/health
- Frontend: http://localhost:5173

Para logs:
```bash
docker compose logs -f backend
```
Para rodar migrações (se necessário manualmente):
```bash
docker compose exec backend npx prisma migrate deploy
```

---
## 2. Deploy Separado (Backend + Frontend)

### Backend (ex: Railway / Render)
Build Command:
```
npm install --legacy-peer-deps && npx prisma generate && npm run build
```
Start Command:
```
node dist/main.js
```
Variáveis obrigatórias:
- DATABASE_URL
- JWT_SECRET
- PORT (opcional, default 4000)

Defina healthcheck: `/api/health`.

### Frontend (ex: Vercel)
Build Command:
```
npm install --legacy-peer-deps && npm run build
```
Output Dir: `dist`
Env Vars:
- VITE_API_BASE=https://SEU_BACKEND_DOMAIN

Caso use domínio custom mude CORS no backend se necessário.

---
## 3. Imagens Docker (GHCR)
Workflow CI gera imagens `ghcr.io/<org>/fauves-backend:latest` e `fauves-frontend:latest` (branch main) se habilitado.

Para usar local sem rebuild:
```bash
docker pull ghcr.io/<org>/fauves-backend:latest
```

---
## 4. Banco de Dados / Prisma
Aplicar migrações ao subir produção:
```bash
npx prisma migrate deploy
```
Gerar client manual se precisar:
```bash
npx prisma generate
```
Seed opcional (se criado):
```bash
npm run seed
```

---
## 5. Variáveis de Ambiente (Resumo)
Backend:
- DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
- JWT_SECRET=chave-secreta
- NODE_ENV=production
- PORT=4000

Frontend:
- VITE_API_BASE=https://backend.dominio

---
## 6. Segurança / Produção
- Ajustar CORS no backend (origins confiáveis).
- Configurar HTTPS (Traefik, Caddy ou proxy gerenciado).
- Rotacionar JWT_SECRET periodicamente (planejar invalidation).
- Adicionar logs estruturados (ex: pino) futuramente.
- Implementar rate limiting se exposição pública ampla.

---
## 7. Próximos Passos (Roadmap Técnico)
- Helper de permissões (scoping por organização/evento).
- Feedback UI 403 e troca de organização.
- Testes e2e integrando login + cupons.
- Observabilidade (logs estruturados / métricas).
- CDN para assets e imagens de uploads.

---
## 8. Troubleshooting
| Problema | Causa Comum | Ação |
|----------|-------------|------|
| Frontend 404 ao recarregar rota | Falta de fallback SPA | Nginx conf com `try_files` já cobre; revise nginx.conf |
| API 503 intermitente | Backend ainda subindo ou porta errada | Verificar logs backend e variável VITE_API_BASE |
| Erro Prisma conexão | DATABASE_URL incorreta ou DB não pronto | Aguardar container db (depends_on) ou checar credenciais |
| Unauthorized (401) | Token ausente/expirado | Fazer login novamente e limpar localStorage |

---
## 9. Comandos Úteis
Ver containers:
```bash
docker compose ps
```
Rebuild forçando sem cache:
```bash
docker compose build --no-cache backend
```
Prisma studio (local):
```bash
docker compose exec backend npx prisma studio
```

---
## 10. Limpeza de Dados de Teste
Script criado em `backend/scripts/cleanup-test-data.mjs`:
```bash
node scripts/cleanup-test-data.mjs --dry
node scripts/cleanup-test-data.mjs
```

---
Ficou alguma dúvida de deploy? Abra uma issue ou peça suporte.
