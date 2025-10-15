Este repositório contém workflows GitHub Actions para build e deploy automáticos.

Workflows criados:
- .github/workflows/deploy-frontend.yml — build do `frontend` e deploy para Vercel
- .github/workflows/deploy-backend.yml — build do `backend` e deploy para Railway

Secrets necessários (Settings → Secrets → Actions):
- VERCEL_TOKEN — token da conta Vercel
- VERCEL_ORG_ID — ID da organização Vercel
- VERCEL_PROJECT_ID — ID do projeto Vercel
- RAILWAY_API_KEY — API key do Railway
- RAILWAY_PROJECT_ID (opcional) — ID do projeto Railway para `railway link`
- PROD_URL (opcional) — URL pública do production (ex: https://app.fauves.com.br). Se definido, o workflow fará checagem em `/api/health` após deploy.
 - SLACK_WEBHOOK_URL (opcional) — webhook do Slack para enviar notificações quando a checagem falhar.

Como usar
1. Adicione os secrets no GitHub do repositório.
2. Faça um push para `main` (ou `master`) — os workflows serão disparados.
3. Verifique Actions -> clique nas runs para ver logs.

Notas
- Os workflows rodarão em pushes para as branches `main` e `master`.
- O workflow do backend usa o Railway CLI (instalado no job). Se sua conta Railway requer configuração extra, ajuste o workflow conforme necessário.
- Por segurança, não coloque tokens diretamente no repositório.

Se quiser, eu posso:
- Incluir passo para invalidar cache CDN (Vercel) ou notificar Slack após deploy.
- Automatizar variáveis de ambiente no Railway via API/CLI (precisa de permissões adicionais).

Se preferir que eu gere também o patch para remover o wrapper `dist/main.js` automaticamente após validação, me diga e eu adiciono um job de cleanup que roda apenas quando o deploy for bem-sucedido.

Smoke tests
- Após o deploy (e após `/api/health` retornar OK) os workflows executam um POST rápido em `/api/auth/register` com e-mail fake para checar o fluxo de registro. A resposta 2xx indica OK; 409 (usuário já existe) também é aceita como OK. Em falha, o workflow marca o job como failed e envia notificação para o `SLACK_WEBHOOK_URL` (se configurado).
