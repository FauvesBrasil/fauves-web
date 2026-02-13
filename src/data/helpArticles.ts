export interface HelpCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    slug: string;
}

export interface HelpArticle {
    id: string;
    categoryId: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    popular?: boolean;
    tags?: string[];
}

export const helpCategories: HelpCategory[] = [
    {
        id: 'creating-event',
        name: 'Criando um evento',
        description: 'Aprenda a criar e configurar seu evento',
        icon: 'Calendar',
        slug: 'criando-evento'
    },
    {
        id: 'account',
        name: 'Sua conta',
        description: 'Gerencie seu perfil e configurações',
        icon: 'User',
        slug: 'sua-conta'
    },
    {
        id: 'marketing',
        name: 'Comercializando um evento',
        description: 'Divulgue e venda mais ingressos',
        icon: 'TrendingUp',
        slug: 'comercializando'
    },
    {
        id: 'payments',
        name: 'Pagamentos e impostos',
        description: 'Entenda pagamentos, taxas e saques',
        icon: 'DollarSign',
        slug: 'pagamentos'
    },
    {
        id: 'participants',
        name: 'Gerenciamento de participantes',
        description: 'Gerencie sua lista de participantes',
        icon: 'Users',
        slug: 'participantes'
    },
    {
        id: 'checkin',
        name: 'Check-in e cortesias',
        description: 'Faça check-in e emita cortesias',
        icon: 'CheckCircle',
        slug: 'checkin'
    },
    {
        id: 'reports',
        name: 'Relatórios e análises',
        description: 'Visualize dados e relatórios do evento',
        icon: 'BarChart3',
        slug: 'relatorios'
    }
];

export const helpArticles: HelpArticle[] = [
    // Criando um evento
    {
        id: 'create-first-event',
        categoryId: 'creating-event',
        title: 'Como criar seu primeiro evento',
        slug: 'como-criar-primeiro-evento',
        summary: 'Passo a passo completo para criar e publicar seu primeiro evento na plataforma',
        popular: true,
        content: `
# Como criar seu primeiro evento

Criar um evento na plataforma é simples e rápido. Siga este guia passo a passo:

## 1. Acesse a área de criação

- Faça login na sua conta de organizador
- No menu lateral, clique em "Meus Eventos"
- Clique no botão "Criar Novo Evento"

## 2. Informações básicas

Preencha os dados essenciais do seu evento:

- **Nome do evento**: Escolha um nome atrativo e descritivo
- **Data e horário**: Defina quando seu evento acontecerá
- **Local**: Informe o endereço completo ou se é online
- **Descrição**: Conte aos participantes sobre o evento

## 3. Configure os ingressos

- Clique em "Adicionar Tipo de Ingresso"
- Defina o nome (ex: "Pista", "VIP", "Camarote")
- Estabeleça o preço e quantidade disponível
- Configure lotes com preços progressivos (opcional)

## 4. Adicione imagens

- Faça upload de uma imagem de capa atrativa
- Adicione fotos do local ou eventos anteriores
- Imagens de alta qualidade aumentam as vendas

## 5. Publique seu evento

- Revise todas as informações
- Clique em "Publicar Evento"
- Compartilhe o link nas redes sociais

**Dica**: Eventos com descrições completas e imagens de qualidade vendem até 3x mais!
    `
    },
    {
        id: 'ticket-types',
        categoryId: 'creating-event',
        title: 'Configurando tipos de ingresso',
        slug: 'configurando-tipos-ingresso',
        summary: 'Aprenda a criar diferentes tipos de ingresso e lotes para seu evento',
        popular: true,
        content: `
# Configurando tipos de ingresso

Os tipos de ingresso permitem oferecer diferentes experiências e preços para seu público.

## Tipos de ingresso

Você pode criar quantos tipos quiser:

- **Pista**: Ingresso básico
- **VIP**: Área exclusiva com benefícios
- **Camarote**: Experiência premium
- **Meia-entrada**: Para estudantes e idosos
- **Cortesia**: Ingressos gratuitos

## Configurando um tipo

1. Na edição do evento, vá em "Ingressos"
2. Clique em "Adicionar Tipo de Ingresso"
3. Preencha:
   - Nome do ingresso
   - Descrição dos benefícios
   - Preço
   - Quantidade disponível
   - Data de início/fim das vendas

## Lotes progressivos

Crie urgência com lotes de preços crescentes:

- **1º Lote**: R$ 50 (100 ingressos)
- **2º Lote**: R$ 70 (150 ingressos)
- **3º Lote**: R$ 90 (100 ingressos)

Quando um lote esgota, o próximo é ativado automaticamente.

## Meia-entrada

Para oferecer meia-entrada:

1. Crie um tipo de ingresso "Meia-entrada"
2. Defina o preço como 50% do ingresso inteiro
3. Na descrição, informe os documentos necessários
4. No dia do evento, valide os documentos no check-in
    `
    },
    {
        id: 'event-settings',
        categoryId: 'creating-event',
        title: 'Definindo data, local e capacidade',
        slug: 'definindo-data-local-capacidade',
        summary: 'Configure corretamente as informações de data, local e capacidade do evento',
        content: `
# Definindo data, local e capacidade

Configurações corretas garantem uma boa experiência para os participantes.

## Data e horário

- Escolha a data com antecedência para dar tempo de divulgação
- Defina horário de início e fim (opcional)
- Para eventos de múltiplos dias, configure cada data

## Local do evento

### Evento presencial

Informe o endereço completo:
- Rua, número, complemento
- Bairro, cidade, estado
- CEP
- Ponto de referência (opcional)

### Evento online

- Marque a opção "Evento Online"
- O link da transmissão pode ser enviado por e-mail
- Configure o link na área de "Detalhes do Evento"

## Capacidade

Defina a capacidade total considerando:

- Limite físico do espaço
- Regulamentações de segurança
- Conforto dos participantes

**Importante**: A capacidade total é a soma de todos os tipos de ingresso.
    `
    },
    {
        id: 'publishing-event',
        categoryId: 'creating-event',
        title: 'Publicando seu evento',
        slug: 'publicando-evento',
        summary: 'Entenda o processo de publicação e como tornar seu evento visível',
        content: `
# Publicando seu evento

Após criar e configurar seu evento, é hora de publicá-lo!

## Status do evento

Seu evento pode ter os seguintes status:

- **Rascunho**: Visível apenas para você
- **Publicado**: Visível para todos, vendas ativas
- **Pausado**: Visível mas vendas pausadas
- **Encerrado**: Evento finalizado

## Checklist antes de publicar

Verifique se você preencheu:

- ✅ Nome do evento
- ✅ Data e horário
- ✅ Local ou link online
- ✅ Descrição completa
- ✅ Imagem de capa
- ✅ Pelo menos um tipo de ingresso
- ✅ Conta bancária configurada

## Publicando

1. Revise todas as informações
2. Clique em "Publicar Evento"
3. Seu evento estará disponível imediatamente
4. Você receberá o link para compartilhar

## Após publicar

- Compartilhe nas redes sociais
- Envie para sua lista de contatos
- Configure pixels de rastreamento (opcional)
- Acompanhe as vendas no painel

**Dica**: Você pode editar o evento a qualquer momento, mesmo após publicado!
    `
    },

    // Sua conta
    {
        id: 'create-organizer-account',
        categoryId: 'account',
        title: 'Criando uma conta organizador',
        slug: 'criando-conta-organizador',
        summary: 'Aprenda a criar sua conta de organizador e começar a criar eventos',
        popular: true,
        content: `
# Criando uma conta organizador

Para criar eventos, você precisa de uma conta de organizador.

## Passo a passo

1. Acesse a página inicial
2. Clique em "Criar Eventos" ou "Área do Organizador"
3. Preencha seus dados:
   - Nome completo
   - E-mail
   - Senha segura
   - Telefone

4. Aceite os termos de uso
5. Clique em "Criar Conta"

## Verificação de e-mail

- Você receberá um e-mail de confirmação
- Clique no link para ativar sua conta
- Faça login com suas credenciais

## Completando seu perfil

Após criar a conta:

1. Acesse "Configurações"
2. Complete seu perfil:
   - Foto de perfil
   - Biografia
   - Redes sociais
   - Documento (CPF/CNPJ)

## Conta bancária

Para receber pagamentos:

1. Vá em "Configurações" > "Pagamentos"
2. Adicione sua conta bancária
3. Informe os dados corretamente
4. Aguarde a validação (até 48h)

**Importante**: Sem conta bancária configurada, você não poderá receber os valores das vendas.
    `
    },
    {
        id: 'profile-settings',
        categoryId: 'account',
        title: 'Gerenciando perfil e configurações',
        slug: 'gerenciando-perfil-configuracoes',
        summary: 'Personalize seu perfil e ajuste as configurações da conta',
        content: `
# Gerenciando perfil e configurações

Mantenha seu perfil atualizado para transmitir profissionalismo.

## Informações do perfil

Acesse "Configurações" > "Perfil" para editar:

- **Nome de exibição**: Como você aparece nos eventos
- **Foto**: Use uma imagem profissional
- **Biografia**: Conte sobre você ou sua empresa
- **Redes sociais**: Instagram, Facebook, site

## Configurações de notificações

Escolha quais notificações receber:

- Novas vendas
- Check-ins realizados
- Mensagens de participantes
- Atualizações da plataforma

Configure por:
- E-mail
- Push (navegador)
- SMS (opcional)

## Preferências

- **Idioma**: Português (BR)
- **Fuso horário**: Ajuste conforme sua região
- **Moeda**: Real (BRL)

## Segurança

- Altere sua senha regularmente
- Ative autenticação em dois fatores (2FA)
- Revise dispositivos conectados
- Configure perguntas de segurança
    `
    },

    // Marketing
    {
        id: 'share-event',
        categoryId: 'marketing',
        title: 'Compartilhando link do evento',
        slug: 'compartilhando-link-evento',
        summary: 'Aprenda as melhores formas de compartilhar e divulgar seu evento',
        popular: true,
        content: `
# Compartilhando link do evento

Divulgação é essencial para o sucesso do seu evento!

## Obtendo o link

1. Acesse seu evento no painel
2. Clique em "Compartilhar" ou copie o link da barra
3. O link tem o formato: \`fauves.com.br/e/seu-evento\`

## Redes sociais

### Instagram
- Publique nos Stories com link
- Crie posts no feed com chamadas atrativas
- Use o link na bio
- Faça reels sobre o evento

### Facebook
- Crie um evento no Facebook
- Compartilhe em grupos relacionados
- Faça posts patrocinados
- Use o Facebook Ads

### WhatsApp
- Envie para grupos e listas de transmissão
- Crie um grupo do evento
- Use status para divulgar

## E-mail marketing

- Envie para sua base de contatos
- Crie sequência de e-mails
- Inclua CTA claro para compra
- Acompanhe taxa de abertura

## Dicas de divulgação

- Comece a divulgar com antecedência
- Crie senso de urgência (últimos ingressos!)
- Mostre depoimentos de eventos anteriores
- Use imagens e vídeos de qualidade
- Faça parcerias com influenciadores
    `
    },
    {
        id: 'discount-coupons',
        categoryId: 'marketing',
        title: 'Criando cupons de desconto',
        slug: 'criando-cupons-desconto',
        summary: 'Use cupons de desconto para incentivar vendas e premiar participantes',
        content: `
# Criando cupons de desconto

Cupons são ótimas ferramentas de marketing e vendas.

## Tipos de cupons

- **Percentual**: 10%, 20%, 50% de desconto
- **Valor fixo**: R$ 10, R$ 20 de desconto
- **Frete grátis**: Para eventos com entrega física

## Criando um cupom

1. Acesse seu evento
2. Vá em "Marketing" > "Cupons"
3. Clique em "Criar Cupom"
4. Configure:
   - Código (ex: PROMO10, AMIGO20)
   - Tipo de desconto
   - Valor ou percentual
   - Data de validade
   - Limite de usos
   - Ingressos aplicáveis

## Estratégias de cupons

### Early bird
- Código: PRIMEIROLOTE
- 20% de desconto
- Válido nos primeiros 7 dias

### Indicação
- Código: AMIGO15
- 15% de desconto
- Para quem foi indicado

### Última hora
- Código: ULTIMAHORA
- 10% de desconto
- Última semana antes do evento

### Parceiros
- Crie códigos exclusivos para parceiros
- Rastreie vendas por código
- Ofereça comissão por venda

## Divulgando cupons

- Compartilhe nas redes sociais
- Envie por e-mail
- Dê para influenciadores
- Use em anúncios pagos
    `
    },

    // Pagamentos
    {
        id: 'how-payments-work',
        categoryId: 'payments',
        title: 'Como funcionam os pagamentos',
        slug: 'como-funcionam-pagamentos',
        summary: 'Entenda o fluxo de pagamentos, taxas e prazos de repasse',
        popular: true,
        content: `
# Como funcionam os pagamentos

Entenda todo o processo de pagamento na plataforma.

## Fluxo de pagamento

1. **Participante compra**: Paga com cartão ou PIX
2. **Processamento**: Gateway processa o pagamento
3. **Confirmação**: Ingresso é liberado
4. **Repasse**: Valor é repassado para você

## Métodos de pagamento

### Cartão de crédito
- Aprovação instantânea
- Parcelamento em até 12x
- Taxa de processamento aplicada

### PIX
- Aprovação em segundos
- Sem parcelamento
- Taxa menor que cartão

### Boleto (opcional)
- Aprovação em até 3 dias úteis
- Sem parcelamento
- Taxa fixa por boleto

## Prazos de repasse

- **PIX**: Disponível em 1 dia útil
- **Cartão à vista**: 14 dias
- **Cartão parcelado**: Conforme parcelas

## Saldo disponível

Acompanhe no painel:
- Total de vendas
- Valor disponível para saque
- Valor a receber
- Histórico de repasses
    `
    },
    {
        id: 'platform-fees',
        categoryId: 'payments',
        title: 'Taxas da plataforma',
        slug: 'taxas-plataforma',
        summary: 'Conheça as taxas cobradas e como elas são calculadas',
        content: `
# Taxas da plataforma

Transparência total sobre as taxas cobradas.

## Estrutura de taxas

### Taxa de serviço
- **Percentual**: 5% sobre o valor do ingresso
- **Quando**: Cobrada em cada venda
- **Inclui**: Uso da plataforma, suporte, infraestrutura

### Taxa de processamento
- **Cartão de crédito**: 3,5% + R$ 0,40
- **PIX**: 1,5%
- **Boleto**: R$ 2,50 fixo

## Exemplo de cálculo

Ingresso de R$ 100:

- Valor do ingresso: R$ 100,00
- Taxa de serviço (5%): R$ 5,00
- Taxa de processamento (3,5%): R$ 3,50
- **Você recebe**: R$ 91,50

## Quem paga as taxas?

Você pode escolher:

- **Organizador paga**: Valor deduzido do ingresso
- **Participante paga**: Adicionado no checkout

## Sem taxas escondidas

- Sem taxa de cadastro
- Sem mensalidade
- Sem taxa de saque
- Sem taxa de cancelamento

**Você só paga quando vende!**
    `
    },
    {
        id: 'requesting-withdrawal',
        categoryId: 'payments',
        title: 'Solicitando saques',
        slug: 'solicitando-saques',
        summary: 'Aprenda a solicitar o saque dos valores disponíveis',
        content: `
# Solicitando saques

Retire seus valores de forma simples e rápida.

## Requisitos para saque

- Conta bancária verificada
- Saldo disponível mínimo: R$ 10,00
- Evento não pode estar em disputa

## Como solicitar

1. Acesse "Financeiro" > "Saques"
2. Verifique o saldo disponível
3. Clique em "Solicitar Saque"
4. Informe o valor desejado
5. Confirme a conta bancária
6. Aguarde o processamento

## Prazos

- **Solicitação**: Até 2 dias úteis para análise
- **Transferência**: 1 a 3 dias úteis
- **Total**: Até 5 dias úteis

## Limites

- **Mínimo por saque**: R$ 10,00
- **Máximo por saque**: Saldo disponível
- **Frequência**: Sem limite de solicitações

## Acompanhamento

Veja o status do saque:
- **Solicitado**: Aguardando análise
- **Em processamento**: Sendo transferido
- **Concluído**: Valor na sua conta
- **Cancelado**: Houve algum problema

## Problemas com saque?

Se o saque não foi concluído:
- Verifique os dados bancários
- Confirme se a conta está ativa
- Entre em contato com o suporte
    `
    },

    // Participantes
    {
        id: 'participant-list',
        categoryId: 'participants',
        title: 'Visualizando lista de participantes',
        slug: 'visualizando-lista-participantes',
        summary: 'Acesse e gerencie a lista completa de participantes do evento',
        popular: true,
        content: `
# Visualizando lista de participantes

Gerencie todos os participantes do seu evento em um só lugar.

## Acessando a lista

1. Entre no painel do evento
2. Clique em "Participantes"
3. Veja a lista completa

## Informações disponíveis

Para cada participante:
- Nome completo
- E-mail
- Tipo de ingresso
- Status do pagamento
- Data da compra
- Check-in realizado

## Filtros e busca

### Buscar participante
- Por nome
- Por e-mail
- Por número do pedido

### Filtrar por
- Tipo de ingresso
- Status de pagamento
- Check-in (feito/não feito)
- Data de compra

## Ações disponíveis

- Ver detalhes do pedido
- Enviar e-mail individual
- Fazer check-in manual
- Cancelar ingresso (se necessário)
- Exportar dados

## Estatísticas

Veja no topo da página:
- Total de participantes confirmados
- Total de check-ins
- Taxa de comparecimento
- Ingressos por tipo
    `
    },
    {
        id: 'export-data',
        categoryId: 'participants',
        title: 'Exportando dados',
        slug: 'exportando-dados',
        summary: 'Exporte listas e relatórios em diferentes formatos',
        content: `
# Exportando dados

Exporte dados para análise externa ou backup.

## Formatos disponíveis

- **Excel (.xlsx)**: Ideal para análise
- **CSV (.csv)**: Compatível com qualquer sistema
- **PDF (.pdf)**: Para impressão

## O que pode ser exportado

### Lista de participantes
- Dados pessoais
- Tipo de ingresso
- Status de pagamento
- Check-in

### Relatório de vendas
- Vendas por dia
- Vendas por tipo de ingresso
- Vendas por origem

### Relatório financeiro
- Receita bruta
- Taxas
- Receita líquida
- Saques realizados

## Como exportar

1. Acesse a seção desejada
2. Clique em "Exportar"
3. Escolha o formato
4. Selecione os campos (opcional)
5. Clique em "Baixar"

## Dicas

- Exporte regularmente para backup
- Use Excel para criar gráficos
- CSV é melhor para importar em outros sistemas
- PDF é ideal para compartilhar com equipe
    `
    },

    // Check-in
    {
        id: 'participant-checkin',
        categoryId: 'checkin',
        title: 'Fazendo check-in de participantes',
        slug: 'fazendo-checkin-participantes',
        summary: 'Aprenda a fazer check-in no dia do evento',
        popular: true,
        content: `
# Fazendo check-in de participantes

O check-in confirma a presença do participante no evento.

## Métodos de check-in

### 1. QR Code (recomendado)
- Participante mostra QR code do ingresso
- Você escaneia com o celular
- Check-in instantâneo

### 2. Busca por nome
- Digite o nome do participante
- Selecione na lista
- Confirme o check-in

### 3. Busca por e-mail
- Digite o e-mail
- Confirme a identidade
- Faça o check-in

## Usando o app de check-in

1. Acesse "Check-in" no painel
2. Clique em "Iniciar Check-in"
3. Permita acesso à câmera
4. Aponte para o QR code
5. Confirme o check-in

## Validações

O sistema verifica:
- ✅ Ingresso válido
- ✅ Pagamento confirmado
- ✅ Não foi feito check-in antes
- ✅ Evento correto

## Check-in duplicado

Se o participante já fez check-in:
- Sistema alerta
- Mostra horário do primeiro check-in
- Você decide se permite entrada

## Modo offline

Para eventos sem internet:
- Ative modo offline antes
- Dados são sincronizados depois
- Check-ins ficam salvos localmente
    `
    },
    {
        id: 'issuing-courtesies',
        categoryId: 'checkin',
        title: 'Emitindo cortesias',
        slug: 'emitindo-cortesias',
        summary: 'Crie ingressos de cortesia para convidados especiais',
        content: `
# Emitindo cortesias

Cortesias são ingressos gratuitos para convidados, equipe ou parceiros.

## Como emitir

1. Acesse o painel do evento
2. Vá em "Cortesias"
3. Clique em "Emitir Cortesia"
4. Preencha:
   - E-mail do convidado
   - Tipo de ingresso
   - Observação (opcional)
5. Clique em "Emitir"

## O que acontece

- Convidado recebe e-mail com ingresso
- Ingresso tem QR code válido
- Aparece na lista de participantes
- Marcado como "Cortesia"

## Controle de cortesias

- Defina limite de cortesias por evento
- Veja quantas foram emitidas
- Rastreie quem emitiu cada cortesia
- Cancele cortesias se necessário

## Tipos de cortesia

### Equipe
- Para staff do evento
- Acesso total
- Identificação especial

### Imprensa
- Para jornalistas e fotógrafos
- Acesso para cobertura
- Pode ter restrições de área

### VIP
- Para convidados especiais
- Acesso premium
- Benefícios extras

## Relatório de cortesias

Veja:
- Total de cortesias emitidas
- Por tipo de ingresso
- Quem emitiu
- Status de check-in
    `
    },

    // Relatórios
    {
        id: 'event-dashboard',
        categoryId: 'reports',
        title: 'Dashboard do evento',
        slug: 'dashboard-evento',
        summary: 'Entenda as métricas e gráficos do painel do evento',
        popular: true,
        content: `
# Dashboard do evento

O dashboard mostra todas as métricas importantes do seu evento.

## Métricas principais

### Total de vendas
- Receita bruta total
- Número de ingressos vendidos
- Ticket médio

### Disponível para retirada
- Valor que você pode sacar
- Descontadas as taxas
- Atualizado em tempo real

### Ingressos por tipo
- Quantos vendidos de cada tipo
- Percentual de ocupação
- Valor gerado por tipo

### Vendas por origem
- Redes sociais
- Busca orgânica
- Links diretos
- Cupons de desconto

## Gráficos

### Vendas ao longo do tempo
- Veja o ritmo de vendas
- Identifique picos
- Planeje ações de marketing

### Taxa de conversão
- Visitantes vs compradores
- Abandono de carrinho
- Funil de vendas

## Ações rápidas

No dashboard você pode:
- Compartilhar evento
- Emitir cortesia
- Ver lista de participantes
- Acessar relatórios detalhados

## Atualizações

- Dados atualizados a cada 5 minutos
- Vendas aparecem instantaneamente
- Gráficos recalculados automaticamente
    `
    },
    {
        id: 'sales-reports',
        categoryId: 'reports',
        title: 'Relatórios de vendas',
        slug: 'relatorios-vendas',
        summary: 'Acesse relatórios detalhados de vendas e receita',
        content: `
# Relatórios de vendas

Analise suas vendas em detalhes.

## Tipos de relatórios

### Vendas por período
- Diário
- Semanal
- Mensal
- Personalizado

### Vendas por tipo de ingresso
- Quantidade vendida
- Receita gerada
- Ticket médio
- Taxa de ocupação

### Vendas por canal
- Redes sociais
- E-mail marketing
- Busca orgânica
- Anúncios pagos

## Métricas disponíveis

- **Receita bruta**: Total vendido
- **Receita líquida**: Após taxas
- **Ingressos vendidos**: Quantidade
- **Ticket médio**: Valor médio por venda
- **Taxa de conversão**: % de visitantes que compraram

## Filtros

Filtre por:
- Data
- Tipo de ingresso
- Método de pagamento
- Status do pedido
- Origem da venda

## Exportação

- Exporte em Excel, CSV ou PDF
- Escolha as colunas
- Aplique filtros antes de exportar
- Salve relatórios favoritos

## Comparações

Compare:
- Período atual vs anterior
- Este evento vs eventos passados
- Tipos de ingresso entre si
- Canais de venda
    `
    }
];

// Helper functions
export function getCategoryBySlug(slug: string): HelpCategory | undefined {
    return helpCategories.find(cat => cat.slug === slug);
}

export function getArticleBySlug(slug: string): HelpArticle | undefined {
    return helpArticles.find(article => article.slug === slug);
}

export function getArticlesByCategory(categoryId: string): HelpArticle[] {
    return helpArticles.filter(article => article.categoryId === categoryId);
}

export function getPopularArticles(limit: number = 5): HelpArticle[] {
    return helpArticles.filter(article => article.popular).slice(0, limit);
}

export function searchArticles(query: string): HelpArticle[] {
    const lowerQuery = query.toLowerCase();
    return helpArticles.filter(article =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.summary.toLowerCase().includes(lowerQuery) ||
        article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}
