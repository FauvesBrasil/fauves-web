# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4d0050a1-59de-4360-9a8b-7fd04f79f2ce

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4d0050a1-59de-4360-9a8b-7fd04f79f2ce) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Design System & Layout Padrões

### AppShell
`AppShell` centraliza o layout base (Header, Footer, `<main>`). Use-o para todas as páginas padrão:

```tsx
import AppShell from '@/components/AppShell';

export default function Page() {
	return (
		<AppShell>
			<div>Conteúdo</div>
		</AppShell>
	);
}
```

Variantes planejadas: `default | checkout | dashboard | marketing` (atualmente `checkout` reserva apenas possíveis ajustes e omite footer se necessário).

Props:
- `variant` (string) – altera comportamento visual.
- `noHeader` / `noFooter` – removem seções quando necessário (ex: landing hero full-screen).

### Design Tokens
Tokens são definidos em `src/index.css` via CSS custom properties e expostos ao Tailwind por `tailwind.config.ts`.

Principais grupos adicionados:
- Cores semânticas: `--brand-primary`, `--brand-accent`, `--brand-warn`, `--brand-success`, `--brand-info`.
- Superfícies e foregrounds: `--brand-surface`, `--brand-primary-foreground`.
- Raios: `--brand-radius-xs|sm|md|lg|pill`.
- Sombras: `--brand-shadow-sm|md|lg`.

Uso em classe Tailwind (mapping extend):
- `bg-brand-primary`, `text-brand-primary-foreground`
- `bg-brand-accent` / `text-brand-accent-foreground`
- `text-brand-warn`, `text-brand-success`, `text-brand-info`
- `rounded-brand-md`, `rounded-brand-pill`
- `shadow-brand-md`

Exemplo de botão semântico:
```tsx
<button className="px-4 py-2 rounded-brand-pill bg-brand-primary text-brand-primary-foreground shadow-brand-sm hover:shadow-brand-md transition">
	Ação
</button>
```

### Convenções de Cores
Evitar hex solto (`#2A2AD7`, `#091747`). Use classes de token. Se um tom não existe, adicionar primeiro como token (CSS var + config) antes de usar.

### Espaçamento
Usar escala Tailwind padrão (2, 4, 6, 8...). Se surgir padrão repetido que não existe (ex: 18px), avaliar ajustar design ou criar utilidade custom só se realmente necessário.

### Componentização Gradual
Componentes planejados (não implementados ainda):
- `StatusBadge` (cores derivadas de tokens: success, warn, info)
- `ProgressBar` (usa brand-primary e surface)
- `SectionCard` (container com padding padrão, `rounded-brand-lg`, `shadow-brand-sm`)

### Página de Checkout
Layout 50/50: coluna esquerda scroll (`overflow-y-auto`), coluna direita fixa para ação. Branding mantém `bg-brand-primary` (atualmente valor aproximação do azul institucional). Futuras alterações do tom atualizam sem mudar classes.

### Estratégia de Dark Mode
Tokens também possuem valores ajustados dentro de `.dark` em `index.css`. Ao trocar `class="dark"` no `<html>` ou `<body>`, componentes trocam esquema automaticamente.

### Extensão de Tokens Futuras
- Tipografia semântica (ex: `--font-size-title-lg`)
- Z-index escala (`--z-overlay`, `--z-toast`)
- Animações padrão (`--dur-fast`, `--easing-standard`)

## Boas Práticas de Contribuição Visual
1. Antes de introduzir nova cor verifique se pode derivar de existente.
2. Prefira tokens semânticos (ex: `bg-brand-warn`) a nomes puramente descritivos de cor.
3. Não espalhar `style={{ color: '#...' }}` – usar classes.
4. Ajustes de layout cross-page devem ocorrer no `AppShell`.
5. Evitar duplicar wrappers de largura; usar `container` do Tailwind ou wrapper central já existente.

## Próximos Passos Recomendados
- Migrar cores hard-coded restantes (Header, modais, badges).
- Criar componentes auxiliares listados.
- Documentar tokens finais no Storybook (se adicionado futuramente) ou MDX.

---

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4d0050a1-59de-4360-9a8b-7fd04f79f2ce) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
