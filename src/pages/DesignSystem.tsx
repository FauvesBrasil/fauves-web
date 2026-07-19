import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Moon, Sun, Save, RefreshCw, Layers } from 'lucide-react';

export default function DesignSystemPage() {
  const [themeCss, setThemeCss] = useState('');
  const [indexCss, setIndexCss] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadCss();
  }, []);

  const loadCss = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/design-system/css');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThemeCss(data.themeCss || '');
          setIndexCss(data.indexCss || '');
          toast({ title: 'Design System carregado!' });
        } else {
          toast({ title: 'Erro ao ler arquivos de estilos', description: data.error, variant: 'destructive' });
        }
      }
    } catch (e) {
      toast({ title: 'Erro de comunicação', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchApi('/design-system/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeCss, indexCss }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast({ title: 'Estilos salvos com sucesso!', description: 'Os arquivos CSS locais foram atualizados automaticamente.' });
        } else {
          toast({ title: 'Falha ao salvar', description: data.error, variant: 'destructive' });
        }
      }
    } catch (e) {
      toast({ title: 'Erro ao enviar dados', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDark = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-black border-b border-neutral-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Layers className="text-violet-500 w-6 h-6 animate-pulse" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">V2 Design System Live Playground</h1>
            <p className="text-xs text-slate-400">Edite os tokens de design do Luma e veja o resultado em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDark} 
            className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 transition text-slate-300"
            title="Alternar preview Escuro/Claro"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={loadCss} 
            disabled={loading} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 transition text-sm disabled:opacity-50 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold transition text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar no Projeto
          </button>
        </div>
      </header>

      {/* Main Workspace split */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-69px)]">
        
        {/* Left pane: CSS Code Editors */}
        <div className="w-2/5 border-r border-neutral-800 bg-black flex flex-col overflow-y-auto">
          {/* Section: v2-luma-theme.css */}
          <div className="flex-1 flex flex-col border-b border-neutral-800">
            <div className="bg-neutral-900 px-4 py-2 text-xs font-semibold tracking-wider text-slate-400 border-b border-neutral-800 flex justify-between">
              <span>V2-LUMA-THEME.CSS (Tokens principais)</span>
              <span className="text-[10px] text-violet-400 font-mono">EDITÁVEL</span>
            </div>
            <textarea
              className="flex-1 w-full bg-black text-slate-300 font-mono text-xs p-4 outline-none resize-none focus:text-white"
              value={themeCss}
              onChange={(e) => setThemeCss(e.target.value)}
              placeholder="Carregando tokens..."
            />
          </div>

          {/* Section: index.css */}
          <div className="flex-1 flex flex-col">
            <div className="bg-neutral-900 px-4 py-2 text-xs font-semibold tracking-wider text-slate-400 border-b border-neutral-800 flex justify-between">
              <span>INDEX.CSS (Status HSL e classes de apoio)</span>
              <span className="text-[10px] text-violet-400 font-mono">EDITÁVEL</span>
            </div>
            <textarea
              className="flex-1 w-full bg-black text-slate-300 font-mono text-xs p-4 outline-none resize-none focus:text-white"
              value={indexCss}
              onChange={(e) => setIndexCss(e.target.value)}
              placeholder="Carregando index..."
            />
          </div>
        </div>

        {/* Right pane: Living Preview Components Grid */}
        <div className="w-3/5 p-8 bg-neutral-900 overflow-y-auto flex flex-col gap-8">
          <style>{themeCss}</style>
          <style>{indexCss}</style>

          {/* Inject style helper to emulate App and Header V2 layout rules correctly inside the container */}
          <style>{`
            .DS-preview-root {
              font-family: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", Inter, Roboto, "Segoe UI", sans-serif;
            }
            .DS-preview-root .lux-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: 500;
              white-space: nowrap;
              position: relative;
              transition: all 0.2s ease;
              text-decoration: none;
              cursor: pointer;
              min-width: 0;
              width: fit-content;
            }
            .DS-preview-root .lux-button.small {
              --height: 32px;
              --padding: 0 1rem;
              --size: 0.875rem;
              height: var(--height);
              padding: var(--padding);
              font-size: var(--size);
            }
            .DS-preview-root .lux-button.round {
              border-radius: 50px;
            }
            .DS-preview-root .lux-button.light.solid {
              background-color: rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              color: #ffffff;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .DS-preview-root .lux-button.light.solid:hover {
              background-color: rgba(255, 255, 255, 0.3);
            }
            
            /* Rich Button styling replicas */
            .DS-preview-root .rich-button {
              cursor: pointer;
              background: #1e1e24;
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 12px;
              padding: 12px 18px;
              display: inline-flex;
              align-items: center;
              gap: 12px;
              color: white;
              font-weight: 600;
              transition: all 0.2s;
            }
            .DS-preview-root .rich-button:hover {
              background: #2b2b35;
              transform: translateY(-1px);
            }
            .DS-preview-root .rich-button.variant-color-blue {
              border-color: rgba(59, 130, 246, 0.3);
            }
            
            /* Premium Tabs */
            .DS-preview-root .premium-tab-container {
              display: flex;
              gap: 16px;
              border-bottom: 1px solid rgba(19, 21, 23, 0.1);
              margin-bottom: 24px;
            }
            .DS-preview-root .dark .premium-tab-container {
              border-bottom-color: rgba(255, 255, 255, 0.08);
            }
            .DS-preview-root .premium-tab {
              padding: 8px 12px;
              font-size: 14px;
              font-weight: 500;
              color: var(--gray-60);
              cursor: pointer;
              position: relative;
              transition: color 0.2s;
              text-decoration: none;
            }
            .DS-preview-root .premium-tab.active {
              color: var(--primary-color);
              font-weight: 600;
            }
            .DS-preview-root .premium-tab.active::after {
              content: "";
              position: absolute;
              bottom: -1px;
              left: 0;
              right: 0;
              height: 2px;
              background-color: var(--primary-color);
            }
          `}</style>

          {/* Wrapper to inject theme variable wrapper classes */}
          <div className={`p-8 rounded-xl transition-colors duration-300 border ${darkMode ? 'dark bg-[#131517] border-neutral-800 text-white' : 'bg-[#f7f8f9] border-neutral-200 text-neutral-900'} luma-theme DS-preview-root`}>
            
            {/* Design System Preview Header */}
            <div className="border-b pb-6 mb-8 border-neutral-200 dark:border-neutral-800">
              <h2 className="text-3xl font-extrabold tracking-tight">Visual Preview (Luma V2 Parity)</h2>
              <p className="text-sm text-neutral-500 mt-1">Componentes fiéis ao estilo de produção atual do Fauves Luma V2.</p>
            </div>

            {/* Premium Nav Tabs */}
            <section className="mb-10">
              <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4">Abas de Navegação (.premium-tab)</h3>
              <div className="premium-tab-container">
                <span className="premium-tab active">Visão geral</span>
                <span className="premium-tab">Convidados</span>
                <span className="premium-tab">Cadastro</span>
                <span className="premium-tab">Blasts</span>
              </div>
            </section>

            {/* Typography Section */}
            <section className="mb-10">
              <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4">Tipografia</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-neutral-400 font-mono">Title XL / H1 (.event-title)</span>
                  <h1 className="text-3xl font-bold tracking-tight mt-1" style={{ color: 'var(--primary-color)' }}>O maior festival de música indie do Brasil</h1>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-mono">Body / Text Primary</span>
                  <p className="text-base text-primary mt-1">Este é o corpo de texto principal. Ele usa o token de cor primária e tipografia padrão do Luma.</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-mono">Body / Text Secondary</span>
                  <p className="text-sm text-secondary mt-1">Este é um texto secundário para legendas ou informações de menor peso visual.</p>
                </div>
              </div>
            </section>

            {/* Buttons Section */}
            <section className="mb-10">
              <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4">Botões e Ações</h3>
              <div className="flex flex-wrap gap-6 items-center">
                
                {/* Luma Hero/Sidebar Button */}
                <div>
                  <span className="block text-[10px] text-neutral-400 font-mono mb-1">.luma-sidebar-btn (Padrão V2)</span>
                  <button className="luma-sidebar-btn" style={{ width: 'auto', padding: '0.625rem 1.5rem' }}>Enviar Ingressos</button>
                </div>

                {/* Secondary Button */}
                <div>
                  <span className="block text-[10px] text-neutral-400 font-mono mb-1">.fauves-button-secondary</span>
                  <button className="fauves-button-secondary">Página do Evento</button>
                </div>

                {/* LUX Button Small Round */}
                <div>
                  <span className="block text-[10px] text-neutral-400 font-mono mb-1">.lux-button.small.round.light.solid</span>
                  <button className="lux-button small round light solid">Participar</button>
                </div>

                {/* Rich Button Dashboard */}
                <div>
                  <span className="block text-[10px] text-neutral-400 font-mono mb-1">.rich-button.variant-color-blue</span>
                  <button className="rich-button variant-color-blue">
                    <span>Convidar Convidados</span>
                  </button>
                </div>

                {/* Pill */}
                <div>
                  <span className="block text-[10px] text-neutral-400 font-mono mb-1">.luma-pill</span>
                  <button className="luma-pill">Folk & Blues</button>
                </div>

              </div>
            </section>

            {/* Cards & Containers Section */}
            <section className="mb-10">
              <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4">Card Timeline (.luma-card)</h3>
              <div className="max-w-[595px]">
                
                {/* Timeline Event Card - Faithful Clone of TimelineEventCard */}
                <div className="luma-card" style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ flex: 1, padding: '1rem 1.25rem', minWidth: 0 }}>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--gray-50)', fontWeight: 400, marginBottom: '0.25rem' }}>21:30</p>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--primary-color)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                      MouthGlow Experience
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--gray-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                        F
                      </div>
                      <span style={{ fontSize: '16px', color: 'var(--gray-70)', fontWeight: 400 }}>Por Fauves Produções</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '16px', color: 'var(--gray-50)', fontWeight: 400 }}>📍 Marina Park Hotel, Fortaleza - CE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="luma-pill">24 Participantes</span>
                    </div>
                  </div>
                  <div style={{ width: '100px', height: '100px', margin: '1rem', flexShrink: 0, borderRadius: '0.75rem', overflow: 'hidden', background: 'var(--gray-20)' }}>
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&auto=format&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>

              </div>
            </section>

            {/* Forms and Inputs Section */}
            <section className="mb-10">
              <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4">Campos de Entrada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">NOME DO EVENTO</label>
                  <input type="text" className="luma-input" placeholder="Ex: Show Acústico no Coreto" defaultValue="Fauves Festival V2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">E-MAIL DO PARTICIPANTE (.luma-sidebar-input)</label>
                  <input type="text" className="luma-sidebar-input" placeholder="Ex: nome@email.com" />
                </div>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
