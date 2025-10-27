import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/apiBase';
// Removido: GoogleAdsPixelModal

export default function MarketingLink(){
  const { id } = useParams();
  const navigate = useNavigate();

  const [alias, setAlias] = useState('');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<Array<any>>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCreateBelow, setShowCreateBelow] = useState(false);
  const [eventName, setEventName] = useState('Nome do evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');
  // removed Google Ads modal state

  // load event info
  useEffect(() => {
    let mounted = true;
    async function load(){
      if (!id) return;
      try {
        const res = await fetchApi(`/api/event/${id}`);
        if (!res || !res.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Nome do evento');
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0,5);
          setEventDate(`${datePart} às ${timePart}`);
        } else {
          setEventDate('Data não definida');
        }
        setEventStatus(ev?.status === 'Publicado' ? 'Publicado' : 'Rascunho');
      } catch(e) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // load persisted links
  useEffect(() => {
    try {
      const raw = localStorage.getItem('marketing_links');
      if (raw) setLinks(JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }, []);

  // update generated preview when alias or id changes
  useEffect(() => {
    const base = id ? `${window.location.origin}/event/${id}` : `${window.location.origin}/`;
    setGenerated(base + (alias ? `?aff=${encodeURIComponent(alias)}` : ''));
  }, [alias, id]);

  // persist links whenever they change
  useEffect(() => {
    try { localStorage.setItem('marketing_links', JSON.stringify(links)); } catch (e) {}
  }, [links]);

  // close actions menu when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!activeMenu) return;
      const target = e.target as HTMLElement;
      if (!target.closest('[data-action-menu]') && !target.closest('[data-action-toggle]')) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [activeMenu]);

  function validateAlias(a: string){
    if (!a || a.trim().length === 0) return { ok: false, msg: 'Informe um nome para o link' };
    if (!/^[a-zA-Z0-9_-]{3,40}$/.test(a)) return { ok: false, msg: 'Use 3-40 caracteres, apenas letras, números, - ou _' };
    if (links.find(l => l.alias === a)) return { ok: false, msg: 'Já existe um link com esse nome' };
    return { ok: true };
  }

  async function handleCreate(){
    const trimmed = alias.trim();
    const v = validateAlias(trimmed);
    if (!v.ok) {
      alert(v.msg);
      return;
    }
    const base = id ? `${window.location.origin}/event/${id}` : `${window.location.origin}/`;
    const url = `${base}${trimmed ? `?aff=${encodeURIComponent(trimmed)}` : ''}`;

    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch(e) { }

    const idForRow = trimmed || `link_${Date.now()}`;
    const next = [{ id: idForRow, alias: trimmed, url, views: 0, sold: 0, revenue: 0 }, ...links];
    setLinks(next);
    setAlias('');
    setShowCreateBelow(false);
  }

  function handleCopyRow(url: string){
    try { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch(e) {}
    setActiveMenu(null);
  }

  function handleDeleteRow(rowId: string){
    const next = links.filter(l => l.id !== rowId);
    setLinks(next);
    setActiveMenu(null);
  }

  const { totalLeft } = useLayoutOffsets();

  return (
  <div className="min-h-screen bg-white dark:bg-[#0b0b0b] w-full">
      {/* Fixed main sidebar */}
      <SidebarMenu />

      {/* Fixed event details sidebar (registered with LayoutOffsets) */}
      <EventDetailsSidebar
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
        onBack={() => navigate(-1)}
        onStatusChange={() => {}}
        onViewEvent={() => { if (id) navigate(`/event/${id}`); }}
        eventIdOverride={id || null}
        fixed
        fixedLeft={70}
        fixedWidth={300}
        fixedTop={0}
      />

      {/* Global header (full width) */}
      <AppHeader />

      {/* Content with left margin for both sidebars */}
      <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 min-h-screen relative">
        <div className="mt-24 max-w-4xl">
          <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Link de Rastreamento</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">Use links personalizados para monitorar o sucesso de seus e-mails promocionais, folhetos e muito mais.</p>

          {/* removed Google Ads Pixel button (not needed) */}

          {links.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 dark:bg-[#242424] dark:border-[#1F1F1F]">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Utilize o campo a seguir para criar um novo link de rastreamento:</h2>

              <label className="block text-sm mb-2 dark:text-slate-300">Nome Do Seu Link De Rastreamento:</label>
              <Input value={alias} onChange={e => setAlias((e.target as HTMLInputElement).value)} placeholder="affiliate1" className="mb-3 dark:bg-[#121212] dark:border-transparent dark:text-white" />
              <div className="text-xs text-gray-500 dark:text-slate-300 mb-4">São permitidos apenas letras e números. (Exemplos: comprasespecial, apenasmembros, dc121232, etc.)</div>

              <label className="block text-sm mb-2 dark:text-slate-300">Enviar Este Link Para Seus AFILIADOS:</label>
              <div className="flex gap-2 items-center">
                <Input value={generated} readOnly className="flex-1 dark:bg-[#121212] dark:border-transparent dark:text-white" />
                <Button onClick={() => { navigator.clipboard?.writeText(generated); setCopied(true); setTimeout(() => setCopied(false), 1500); }} variant="ghost">{copied ? 'Copiado' : 'Copiar'}</Button>
              </div>

              <div className="mt-6">
                <Button onClick={handleCreate}>Criar Link</Button>
              </div>

              <div className="mt-6 text-sm text-gray-600 dark:text-slate-300 inline-flex items-center gap-2"><svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> <a className="text-indigo-700 underline dark:text-white" href="https://help.example.com">Learn more about tracking links</a></div>
            </div>
          ) : (
            <>
              <div className="bg-white border border-zinc-200 rounded-xl p-6 dark:bg-[#242424] dark:border-[#1F1F1F]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold dark:text-white">Ver</div>
                  <div>
                    <select className="border rounded px-3 py-2 dark:bg-[#121212] dark:border-transparent dark:text-white">
                      <option>Todos</option>
                      <option>Ontem</option>
                      <option>Últimos 7 dias</option>
                      <option>Este mês</option>
                    </select>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-zinc-500 border-b dark:text-slate-300 dark:border-[#1F1F1F]">
                      <th className="py-3">Nome Do Link</th>
                      <th className="py-3">Visualizações de página</th>
                      <th className="py-3">Ingressos Vendidos</th>
                      <th className="py-3">Vendas</th>
                      <th className="py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map(link => (
                      <tr key={link.id} className="border-b hover:bg-gray-50 dark:border-[#1F1F1F] dark:hover:bg-[#1F1F1F]">
                        <td className="py-3"><a className="text-indigo-700 underline dark:text-white" href={link.url} target="_blank" rel="noreferrer">{link.alias}</a></td>
                        <td className="py-3 dark:text-slate-300">{link.views}</td>
                        <td className="py-3 dark:text-slate-300">{link.sold}</td>
                        <td className="py-3 dark:text-slate-300">R${String(link.revenue.toFixed(2)).replace('.',',')}</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center relative overflow-visible">
                            <button data-action-toggle onClick={() => setActiveMenu(link.id)} className="px-3 py-2 border rounded dark:text-white">Ações rápidas...</button>
                            {activeMenu === link.id && (
                              <div data-action-menu className="absolute right-0 mt-10 w-48 bg-white border rounded shadow z-50 pointer-events-auto dark:bg-[#242424] dark:border-[#1F1F1F]">
                                <div className="p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1F1F1F]" onClick={() => handleCopyRow(link.url)}>Copiar link</div>
                                <div className="p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">Relatório de links de rastreamento</div>
                                <div className="p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1F1F1F] text-red-600" onClick={() => handleDeleteRow(link.id)}>Apagar link</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 flex gap-3 items-center">
                  <Button onClick={() => { setShowCreateBelow(true); setActiveMenu(null); }}>Criar novo</Button>
                </div>

                {showCreateBelow && (
                  <div className="mt-6 border-t pt-6 dark:border-[#1F1F1F]">
                    <h3 className="text-lg font-semibold mb-3 dark:text-white">Criar link</h3>
                    <label className="block text-sm mb-2 dark:text-slate-300">Nome Do Seu Link De Rastreamento:</label>
                    <Input value={alias} onChange={e => setAlias((e.target as HTMLInputElement).value)} placeholder="affiliate1" className="mb-3 dark:bg-[#121212] dark:border-transparent dark:text-white" />
                    <div className="text-xs text-gray-500 dark:text-slate-300 mb-4">São permitidos apenas letras e números.</div>
                    <div className="flex gap-2 items-center mb-4">
                      <Input value={generated} readOnly className="flex-1 dark:bg-[#121212] dark:border-transparent dark:text-white" />
                      <Button onClick={() => { navigator.clipboard?.writeText(generated); setCopied(true); setTimeout(() => setCopied(false), 1500); }} variant="ghost">{copied ? 'Copiado' : 'Copiar'}</Button>
                    </div>
                    <div>
                      <Button onClick={handleCreate}>Criar Link</Button>
                      <Button variant="ghost" onClick={() => setShowCreateBelow(false)} className="ml-3">Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
  {/* Removido: GoogleAdsPixelModal */}
    </div>
  );
}

