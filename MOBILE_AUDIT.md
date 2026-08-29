# Auditoria mobile — Fauves

Última atualização: 25 de agosto de 2026.

## Legenda

- [x] Revisada, corrigida e validada nesta etapa
- [ ] Ainda não auditada de ponta a ponta no mobile
- ↪ Alias ou redirecionamento; herda a página de destino

As páginas marcadas foram compiladas em produção e verificadas em viewports de 320×700 e 375×812. A auditoria considera largura do documento, alinhamento, legibilidade, áreas de toque, navegação, menu, conteúdo e elementos flutuantes.

Na segunda etapa, as páginas de categoria, evento, organização, artista e mapa foram validadas com dados reais da API local. A lista autenticada foi validada no estado de acesso e teve sua linha do tempo responsiva revisada; o perfil de usuário também foi conferido em seu estado público de erro.

Na terceira etapa, o fluxo comercial foi validado com evento e sessão temporária reais, incluindo seleção com total fixo, identificação, revisão em Pix e cartão, falhas da API, cancelamento e expiração. Nenhuma cobrança ou transação financeira real foi executada.

Na quarta etapa, o fluxo pós-compra e de conta foi validado nos estados visitante e autenticado, incluindo redirecionamentos de acesso, recuperação de senha, ingressos, pedidos, notificações, preferências e métodos de pagamento. Os estados autenticados usaram dados locais simulados exclusivamente para inspeção visual; nenhum dado real de usuário foi alterado.

## Base compartilhada

- [x] Header público e autenticado (`HeaderV2`)
- [x] Menu mobile, bloqueio de scroll e navegação por teclado
- [x] Footer, navegação institucional e CTA
- [x] Aviso global de conexão
- [x] Logotipo responsivo compartilhado
- [x] Headers internos sticky de conta, calendário e gerenciamento do evento

## Institucional e descoberta

- [x] `/` — Home
- [x] `/discover` — Descobrir
- [x] `/v2/discover` — Descobrir (alias visual)
- [x] `/pricing` — Preços
- [x] `/ajuda` — Central de Ajuda
- [x] `/ajuda/:categorySlug` — Categoria de ajuda
- [x] `/ajuda/artigo/:slug` — Artigo de ajuda
- [x] `/ajuda/organizador` — Ajuda para organizadores
- [x] `/ajuda/organizador/categoria/:slug` — Categoria para organizadores
- [x] `/ajuda/organizador/artigo/:slug` — Artigo para organizadores
- [x] `/termos-de-uso` — Termos de Uso
- [x] `/politica-de-privacidade` — Política de Privacidade
- [x] `/seguranca` — Segurança
- [x] `/dmca` — Direitos Autorais / DMCA
- [ ] `/v2` — Home/índice V2
- [ ] `/quem-somos` — Quem Somos
- [ ] `/how-it-works` — Como Funciona
- [ ] `/carreiras` — Carreiras
- [ ] `/lei-da-meia-entrada` — Lei da Meia-Entrada
- [x] `/eventos/:categorySlug` — Eventos por categoria
- [x] `/map` e `/:calendarSlug/map` — Mapa
- ↪ `/v2/map`
- ↪ `/o-que-fazer-em/:citySlug`

## Experiência pública de eventos

- [x] `/events` — Lista de eventos
- [x] `/event/:slugOrId` e `/v2/event/:slugOrId` — Página do evento
- [x] `/:slugOrId` — Evento, organização ou cidade por slug
- [x] `/organizations` — Calendários
- [x] `/artista/:slugOrId` — Artista
- [x] `/u/:userId` — Perfil público
- ↪ `/user/:userId`
- [ ] `/colecoes/:slug` — Coleção pública
- ↪ `/org/:slugOrId` e `/organization/:slugOrId`
- [ ] `/search` — Busca
- [ ] `/embed/calendar/:calendarId/events` — Calendário incorporado
- [ ] `/after-event/:id` — Pesquisa pública pós-evento
- ↪ `/responder-pesquisa/:id`
- [ ] `/venues/:slug/door` — Portaria expressa

## Acesso, conta e suporte

- [x] `/signin` e `/login` — Entrar
- [x] `/reset-password` — Redefinir senha
- [x] `/profile` — Perfil, ingressos e pedidos
- [x] `/notifications` — Notificações
- [x] `/account-settings` e `/account-settings/:tab` — Configurações da conta
- ↪ `/v2/account-settings` e `/v2/account-settings/:tab`
- [ ] `/ajuda/tickets` — Chamados
- [ ] `/ajuda/tickets/novo` — Novo chamado
- [ ] `/ajuda/tickets/:id` — Detalhe do chamado

## Compra e ingressos

- [x] `/select-tickets/:eventId` — Seleção de ingressos
- [x] `/checkout` — Checkout
- [x] `/checkout/review` — Revisão
- [x] `/checkout/pix` — Pagamento Pix
- [x] `/checkout/canceled` — Compra cancelada
- [x] `/checkout/success` — Compra concluída

## Área do organizador

- [ ] `/create` e `/events/create` — Criar evento
- [ ] `/create-tickets` — Criar ingressos
- [ ] `/publish-details` — Publicação
- [ ] `/organizer-events` — Eventos do organizador
- ↪ `/organizer-dashboard`
- [ ] `/organizer-orders` — Pedidos
- [ ] `/calendar/manage/:calendarId` e `/organizer-settings` — Configurações
- [ ] `/event/manage/:id` e `/event/manage/:id/:tab` — Painel do evento
  - [x] Visão geral mobile — header sticky, abas, ações rápidas, card do evento e convites
  - [x] Ações rápidas mobile — carrossel horizontal em Visão geral, Convidados e Cadastro
  - [x] Cadastro mobile — perguntas responsivas, Web3, perguntas personalizadas e e-mail de cadastro
- [ ] `/event/manage/:id/analytics` — Analytics do evento
- [ ] `/ingressos-emitidos/:eventId` — Ingressos emitidos
- [ ] `/organizations/create-calendar` — Criar calendário
- ↪ `/organizations/create-organization`
- [ ] `/jornada-produtor` e `/producer-journey-demo` — Jornada do produtor
- [ ] `/organizer-reports` — Relatórios
- [ ] `/organizer-reports/orders` — Relatório de pedidos
- [ ] `/organizer-reports/sales` — Relatório de vendas
- [ ] `/organizer-finances` e `/organizer-finances/:eventId` — Financeiro
- [ ] `/participantes/pedidos/:eventId` — Pedidos de participantes
- [ ] `/participantes/lista/:eventId` — Lista de participantes
- [ ] `/participantes/checkin/:eventId` — Check-in
- [ ] `/gerenciar-equipe/:eventId` — Equipe
- [ ] `/marketing/link-rastreamento` e `/marketing/link-rastreamento/:id`
- [ ] `/marketing/pixels` e `/marketing/pixels/:id`
- [ ] `/marketing/embaixadores` e `/marketing/embaixadores/:id`
- [ ] `/marketing/cupons` e `/marketing/cupons/:id`
- [ ] `/pesquisa-satisfacao` e `/pesquisa-satisfacao/:id`

## Administração

- [ ] `/admin/users` e `/admin/users/:userId`
- [ ] `/admin/organizations` e `/admin/organizations/:orgId`
- [ ] `/admin/artists`
- [ ] `/admin/events` e `/admin/events/:eventId`
- [ ] `/admin/categories`
- [ ] `/admin/slides`
- [ ] `/admin/orders` e `/admin/order/:orderId`
- [ ] `/admin/leads`
- [ ] `/admin/helpdesk`
- [ ] `/admin/helpdesk/tickets` e `/admin/helpdesk/tickets/:id`
- [ ] `/admin/helpdesk/live-chat`
- [ ] `/admin/helpdesk/knowledge-base`
- [ ] `/admin/helpdesk/knowledge-base/categories`
- [ ] `/admin/helpdesk/knowledge-base/articles`
- [ ] `/admin/helpdesk/knowledge-base/articles/novo`
- [ ] `/admin/helpdesk/knowledge-base/articles/:id`
- [ ] `/admin/reports`
- [ ] `/admin/analytics`
- [ ] `/admin/team`
- [ ] `/admin/settings`
- [ ] `/admin/emails`, `/admin/emails/new` e `/admin/emails/:id`
- [ ] `/admin/announcements`, `/admin/announcements/new` e `/admin/announcements/:id/edit`

## Rotas internas de desenvolvimento

- [ ] `/design-system`
- [ ] `/test-supabase`
- [ ] Fallback `*` — Página não encontrada
