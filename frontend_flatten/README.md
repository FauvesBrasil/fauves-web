🦊 Fauves — Plataforma de Venda e Gestão de Ingressos

Fauves é uma plataforma moderna para gestão de eventos e venda de ingressos online, projetada para unir organização, tecnologia e experiência do usuário em um único ambiente digital.

Com foco em praticidade, o sistema permite que produtores criem eventos, gerenciem suas equipes e acompanhem em tempo real as vendas e o acesso do público.

🚀 Principais Funcionalidades

🎟️ Venda online de ingressos

Interface intuitiva e segura para compra.

Suporte a múltiplos tipos de ingressos (lote, área VIP, combos, etc).

🗓️ Gestão de eventos

Cadastro e edição de eventos com informações completas.

Controle de disponibilidade e monitoramento de vendas.

👥 Gestão de equipe e check-in (em desenvolvimento)

Acesso por função (admin, check-in, produtor).

Leitura de QR Code para validação de ingressos.

💳 Pagamentos integrados (em desenvolvimento)

Suporte planejado a gateways como Mercado Pago e Asaas.

🧩 Stack Tecnológica

Front-end:

React
 — estrutura base da aplicação

TypeScript
 — tipagem estática e segurança no código

Tailwind CSS
 — estilização rápida e consistente

Back-end:

Node.js
 — ambiente de execução JavaScript

Integrações planejadas com APIs de eventos e gateways de pagamento

💻 Como Rodar Localmente

Certifique-se de ter o Node.js e npm instalados.

# 1. Clone o repositório
git clone https://github.com/levycamara/FauvesBrasil/fauves-web.git

# 2. Acesse a pasta do projeto
cd fauves

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev


Acesse o projeto no navegador em http://localhost:5173 (ou a porta indicada no terminal).

🎨 Identidade Visual

A Fauves utiliza um design system próprio, com base em tons institucionais de azul e preto, reforçando a identidade moderna e premium da marca.

A interface é construída sobre componentes reutilizáveis e tokens de design para:

Cores semânticas (primária, sucesso, alerta, etc).

Espaçamentos e raios padronizados.

Sombras e estados de interação coerentes com o branding.

📦 Estrutura do Projeto
src/
 ├── components/     # Componentes reutilizáveis (botões, cards, modais, etc)
 ├── pages/          # Páginas principais da aplicação
 ├── layouts/        # Estrutura base de layout
 ├── hooks/          # Hooks e lógicas reutilizáveis
 ├── utils/          # Funções auxiliares
 └── assets/         # Imagens, ícones e fontes

🧠 Roadmap

✅ Base do site e layout responsivo

🕓 Integração de autenticação e painel do organizador

🚧 Leitor de QR Code para check-in de ingressos

🔜 Integração com gateway de pagamento

🔜 Dashboard com relatórios de vendas

🤝 Contribuição

Contribuições são bem-vindas!
Abra uma issue para sugestões, correções ou novas ideias.

🦊 Sobre a Fauves

A Fauves é uma marca voltada à inovação e experiência em entretenimento.
Nosso objetivo é transformar a forma como as pessoas compram, vendem e vivenciam eventos, com tecnologia e design que inspiram.

📄 Licença

Este projeto é de propriedade da Fauves.
Todos os direitos reservados.

Quer que eu inclua também badges (tipo os ícones do Node, React, status do projeto, etc) e um print ou banner no topo pra deixar visualmente mais impactante? Isso deixa o README com cara de projeto profissional de portfólio.

Você disse:
o frontend que é esse repositorio está assim:

O ChatGPT disse:

Perfeito 🔥 esse print ajuda muito!
Pelo que vejo, o seu repositório está bem estruturado e segue um padrão moderno com Vite + React + TypeScript — o que reforça que o README que veio do Lovable realmente não faz sentido.

Vamos atualizar ele para refletir exatamente o que está no seu diretório atual.
Abaixo está uma nova versão do README.md — pronta pra substituir o arquivo que está aí no repositório:

🦊 Fauves — Plataforma de Venda e Gestão de Ingressos

Fauves é uma plataforma completa para gestão e venda de ingressos online, desenvolvida com foco em performance, escalabilidade e uma experiência moderna para o usuário.

O projeto atual representa o frontend web da plataforma, criado com React, Vite e Tailwind CSS, e será futuramente integrado ao backend para controle de eventos, ingressos e validação de check-in.

🚀 Funcionalidades Atuais

🎟️ Interface para exibição e compra de ingressos

🗓️ Estrutura de páginas para listagem de eventos

🧩 Componentização reutilizável com Tailwind

🧠 Context API e Hooks para gerenciamento de estado

⚙️ Suporte a variáveis de ambiente (.env, .env.local)

🔧 Pronto para deploy com Nginx ou container Docker

🧩 Stack Tecnológica

React + Vite → Frontend rápido e modular

TypeScript → Tipagem estática e segurança no código

Tailwind CSS → Estilização ágil e consistente

Node.js / Nginx → Preparado para deploy em ambiente web

ESLint + Prettier → Padronização e qualidade de código

📁 Estrutura de Pastas
frontend/
 ├── public/                # Arquivos públicos (favicon, imagens estáticas)
 ├── src/
 │   ├── assets/            # Ícones, imagens e fontes
 │   ├── components/        # Componentes reutilizáveis
 │   ├── context/           # Contextos globais (ex: Auth, Theme)
 │   ├── hooks/             # Hooks customizados
 │   ├── lib/               # Funções auxiliares e integrações
 │   ├── pages/             # Páginas da aplicação
 │   ├── types/             # Tipos e interfaces TypeScript
 │   ├── App.tsx            # Componente raiz
 │   ├── main.tsx           # Ponto de entrada Vite/React
 │   └── index.css          # Estilos globais (Tailwind)
 ├── nginx.conf             # Configuração para deploy
 ├── .env / .env.local      # Variáveis de ambiente
 ├── package.json           # Dependências e scripts
 ├── tailwind.config.ts     # Configuração do Tailwind
 ├── tsconfig.json          # Configuração TypeScript
 └── README.md              # Documentação do projeto

💻 Como Rodar Localmente

Certifique-se de ter Node.js 18+ instalado.
Em seguida, execute os comandos abaixo:

# 1. Clone o repositório
git clone https://github.com/seuusuario/fauves-frontend.git

# 2. Acesse o diretório
cd fauves-frontend

# 3. Instale as dependências
npm install

# 4. Crie um arquivo .env (baseado em .env.example)
cp .env.example .env

# 5. Inicie o ambiente de desenvolvimento
npm run dev


Abra o navegador em http://localhost:5173
.

⚙️ Scripts Disponíveis
Comando	Descrição
npm run dev	Inicia o ambiente de desenvolvimento
npm run build	Gera a build de produção
npm run preview	Visualiza a build localmente
npm run lint	Analisa o código com ESLint
🧠 Roadmap

✅ Base de layout e design system

🚧 Integração com API de backend (eventos e ingressos)

🔜 Sistema de login e painel de organizador

🔜 Leitura de QR Code para check-in

🔜 Dashboard com métricas e relatórios

🌐 Deploy

O projeto pode ser publicado em qualquer serviço que suporte aplicações Node.js estáticas (como Vercel, Netlify ou Nginx).
Exemplo com Nginx incluído no arquivo nginx.conf.


🦊 Sobre a Fauves

A Fauves é uma marca voltada à inovação em entretenimento, conectando tecnologia, design e experiência.
Nosso objetivo é transformar a maneira como as pessoas compram, vendem e vivem eventos.

📄 Licença

Este projeto é de propriedade da Fauves.
Todos os direitos reservados.
