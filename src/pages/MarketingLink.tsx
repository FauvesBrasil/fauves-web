import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useAuth } from '@/context/AuthContext';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/apiBase';
import { Eye, MoreHorizontal, Ticket, TrendingUp, Link2, Copy, QrCode, Trash2 } from 'lucide-react';

type TrackLink = { id: string; alias: string; url: string; views: number; sold: number; revenue: number };

export default function MarketingLink() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [alias, setAlias] = useState('');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<TrackLink[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [eventName, setEventName] = useState('Nome do evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');

  // Mobile menu states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);

  // Ticket types for completion status
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [eventSlug, setEventSlug] = useState<string | null>(null);

  // load event info only in event context
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const res = await fetchApi(`/api/event/${id}`);
        if (!res?.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Nome do evento');
        setEventSlug(ev?.slug || null);
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0, 5);
          setEventDate(`${datePart} às ${timePart}`);
        }
        setEventStatus(ev?.status === 'Publicado' ? 'Publicado' : 'Rascunho');
      } catch { }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // Load ticket types for completion status
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetchApi(`/api/ticket-type/event/${id}`);
        if (res?.ok && mounted) {
          const data = await res.json();
          setTicketTypes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        // ignore errors, keep empty array
      }
    })();
    return () => { mounted = false; };
  }, [id]);


  // Carregar links do backend
  useEffect(() => {
    if (!id) return;
    fetchApi(`/api/marketing-link/list?eventId=${id}`)
      .then(res => res.ok ? res.json() : [])
      .then(list => setLinks(Array.isArray(list) ? list : []));
  }, [id]);

  // generated preview
  useEffect(() => {
    // Use slug at root, ID under /event/
    const eventPath = eventSlug ? `/${eventSlug}` : (id ? `/event/${id}` : '');
    const base = `${window.location.origin}${eventPath}`;
    const source = alias.trim();
    setGenerated(base + (source ? `?utm_source=${encodeURIComponent(source)}` : `?utm_source=`));
  }, [alias, id, eventSlug]);

  function normalize(s: string) {
    return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  }
  function validateAlias(a: string) {
    const v = normalize(a || '');
    if (!v) return { ok: false, msg: 'Informe um nome para o link' };
    if (v.length < 3) return { ok: false, msg: 'Use 3-40 caracteres (letras, números, - ou _)' };
    if (links.find(l => l.alias === v)) return { ok: false, msg: 'Já existe um link com esse nome' };
    return { ok: true };
  }

  async function handleCreate() {
    const trimmed = normalize(alias);
    const v = validateAlias(trimmed);
    if (!v.ok) { toast({ variant: 'destructive' as any, title: 'Nome inválido', description: v.msg }); return; }
    const base = id ? `${window.location.origin}/event/${id}` : `${window.location.origin}/`;
    const url = `${base}?utm_source=${encodeURIComponent(trimmed)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: 'Link copiado', description: url });
    } catch { }
    // Criar no backend
    const res = await fetchApi(`/api/marketing-link/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id, alias: trimmed, url })
    });
    if (res.ok) {
      const created = await res.json();
      setLinks(prev => [created, ...prev]);
      setAlias(''); setCreateOpen(false);
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive' as any, title: 'Erro ao criar link', description: err?.error || 'Tente novamente' });
    }
  }

  function handleCopyRow(url: string) {
    try { navigator.clipboard.writeText(url); toast({ title: 'Link copiado', description: url }); } catch { }
    setActiveMenu(null);
  }
  async function handleDeleteRow(rowId: string) {
    const res = await fetchApi(`/api/marketing-link/${rowId}`, { method: 'DELETE' });
    if (res.ok) {
      setLinks(prev => prev.filter(l => l.id !== rowId));
    } else {
      toast({ variant: 'destructive' as any, title: 'Erro ao apagar link' });
    }
    setActiveMenu(null);
  }

  async function handleDownloadQr(url: string, alias: string) {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(url)}`;
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const dl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dl;
      a.download = `link-${alias || 'rastreamento'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dl);
      toast({ title: 'QR Code baixado' });
    } catch {
      toast({ variant: 'destructive' as any, title: 'Falha ao baixar QR Code' });
    } finally {
      setActiveMenu(null);
    }
  }

  const { totalLeft } = useLayoutOffsets();
  const totalSold = useMemo(() => links.reduce((acc, l) => acc + (Number(l.sold) || 0), 0), [links]);
  const totalRevenue = useMemo(() => links.reduce((acc, l) => acc + (Number(l.revenue) || 0), 0), [links]);

  return (
    <div className="bg-white dark:bg-[#0b0b0b] w-full">
      {/* Mobile Menus */}
      <MobileTopBar
        isOpen={mobileMenuOpen}
        onMenuOpen={() => setMobileMenuOpen(true)}
      />
      <MobileDrawerMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={location.pathname}
        user={user}
      />

      <EventMobileTopBar
        isOpen={eventMenuOpen}
        onMenuOpen={() => setEventMenuOpen(true)}
        title="Link Rastreamento"
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
      />
      <EventMobileDrawer
        isOpen={eventMenuOpen}
        onClose={() => setEventMenuOpen(false)}
        currentPath={location.pathname}
        eventId={id || ''}
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
        hasTickets={ticketTypes.length > 0}
        isPublished={eventStatus === 'Publicado'}
      />

      {/* Desktop Sidebars - Hidden on mobile */}
      <SidebarMenu className="max-md:hidden" />
      {id && (
        <div className="max-md:hidden">
          <EventDetailsSidebar
            eventName={eventName}
            eventDate={eventDate}
            eventStatus={eventStatus}
            onBack={() => navigate(-1)}
            onStatusChange={() => { }}
            onViewEvent={() => { if (id) navigate(`/event/${id}`); }}
            eventIdOverride={id || null}
            fixed
            fixedLeft={70}
            fixedWidth={300}
            fixedTop={0}
          />
        </div>
      )}
      <AppHeader />

      <OrganizerLayout>
        <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 max-md:pl-4 pr-8 max-md:pr-4 pb-16 max-md:pb-8 relative">
          <div className="mt-24 max-md:mt-[140px] max-w-[800px] max-md:max-w-full">
            <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-3 max-md:hidden">
              <h1 className="text-3xl max-sm:text-xl font-bold text-indigo-950 dark:text-white mb-3 max-sm:mb-0">Links Rastreáveis</h1>
              <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 max-sm:w-full max-sm:text-sm">Novo link rastreável</Button>
            </div>
            {/* Botão mobile only */}
            <div className="hidden max-md:block mb-4">
              <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 w-full text-sm">Novo link rastreável</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-sm:gap-3 mb-6 max-sm:mb-4 mt-2">
              <div className="rounded-xl max-sm:rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4 max-sm:p-3">
                <div className="text-xs max-sm:text-[10px] text-slate-500">QUANTIDADE VENDIDA</div>
                <div className="mt-1 flex items-center gap-2 text-xl max-sm:text-lg font-semibold text-slate-900 dark:text-white"><Ticket size={18} className="max-sm:w-4 max-sm:h-4" /> {totalSold}</div>
              </div>
              <div className="rounded-xl max-sm:rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4 max-sm:p-3">
                <div className="text-xs max-sm:text-[10px] text-slate-500">RECEITA</div>
                <div className="mt-1 flex items-center gap-2 text-xl max-sm:text-lg font-semibold text-slate-900 dark:text-white"><TrendingUp size={18} className="max-sm:w-4 max-sm:h-4" /> R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {links.length === 0 ? (
              <div className="rounded-xl max-sm:rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-10 max-sm:p-6 text-center">
                <div className="w-10 h-10 max-sm:w-8 max-sm:h-8 rounded-full bg-indigo-600/10 text-indigo-600 grid place-items-center mx-auto"><Link2 size={18} className="max-sm:w-4 max-sm:h-4" /></div>
                <div className="mt-3 text-lg max-sm:text-base font-semibold text-slate-900 dark:text-white">Sem link de rastreamento ainda</div>
                <div className="text-sm max-sm:text-xs text-slate-600 dark:text-slate-300">Rastreie o sucesso de seus e‑mails promocionais, folhetos, promoters e muito mais</div>
                <div className="mt-4"><Button onClick={() => setCreateOpen(true)} className="max-sm:text-sm">Adicionar novo link rastreável</Button></div>
              </div>
            ) : (
              <div className="rounded-xl max-sm:rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] divide-y divide-zinc-100 dark:divide-zinc-800">
                {links.map((link) => (
                  <div key={link.id} className="px-5 max-sm:px-3 py-4 max-sm:py-3 flex items-center gap-4 max-sm:gap-2 hover:bg-zinc-50 dark:hover:bg-[#191919] transition">
                    <div className="w-8 h-8 max-sm:w-6 max-sm:h-6 rounded-full bg-indigo-600/10 text-indigo-600 grid place-items-center"><Link2 size={16} className="max-sm:w-3 max-sm:h-3" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 dark:text-white font-medium max-sm:text-sm truncate">{link.alias}</div>
                      <div className="text-xs max-sm:text-[10px] text-slate-500 dark:text-slate-400">Event</div>
                    </div>
                    <div className="text-sm max-sm:text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 mr-4 max-sm:mr-2 max-sm:hidden"><Eye size={16} className="max-sm:w-3 max-sm:h-3" /> {link.views}</div>
                    <div className="text-sm max-sm:text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 mr-4 max-sm:mr-2"><Ticket size={16} className="max-sm:w-3 max-sm:h-3" /> <span className="max-sm:hidden">{link.sold}</span><span className="hidden max-sm:inline">{link.sold}</span></div>
                    <div className="text-sm max-sm:text-xs text-slate-900 dark:text-white font-medium mr-2 max-sm:hidden">R$ {Number(link.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="relative">
                      <button data-action-toggle className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]" onClick={() => setActiveMenu(link.id)}><MoreHorizontal size={18} /></button>
                      {activeMenu === link.id && (
                        <div data-action-menu className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-700 rounded-md shadow-md z-10 flex flex-col py-1">
                          <button type="button" className="px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-2 w-full" onClick={() => handleCopyRow(link.url)}><Copy size={14} /> Copiar link</button>
                          <button type="button" className="px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-2 w-full" onClick={() => handleDownloadQr(link.url, link.alias)}><QrCode size={14} /> QR Code</button>
                          <button type="button" className="px-3 py-2 text-sm text-left text-red-600 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-2 w-full" onClick={() => handleDeleteRow(link.id)}><Trash2 size={14} /> Apagar</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: criar link rastreável */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Novo link rastreável</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={alias} onChange={(e) => setAlias(normalize(e.target.value))} placeholder="Nome do seu link de rastreamento" className="dark:bg-[#121212] dark:border-zinc-800 dark:text-white" />
              {!!alias && (
                <div className="rounded-lg p-4 bg-violet-600/10 text-violet-800 dark:text-violet-200 border border-violet-600/20">
                  <div className="font-medium">Você está criando um link rastreável para um promoter?</div>
                  <div className="text-sm mt-1">Adicione pessoas diretamente à sua equipe que ajudem você a promover o evento: cupons automaticamente gerados, links rastreáveis personalizados e monitoramento detalhado de vendas. Essas pessoas podem acessar todas as informações relevantes diretamente do portal de promoters.</div>
                  <a className="text-violet-700 dark:text-violet-300 underline mt-2 inline-block" href={id ? `/gerenciar-equipe/${id}` : '/gerenciar-equipe'} target="_blank" rel="noreferrer">Adicionar promoters à minha equipe</a>
                </div>
              )}
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1a1a1a] p-4">
                <div className="font-medium text-slate-900 dark:text-white mb-1">Seu Link de Rastreamento</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">Você pode enviar este link para seus promoters ou usá‑lo para rastrear o desempenho de um newsletter, um post no Facebook e muito mais.</div>
                <Input value={generated} readOnly className="dark:bg-[#121212] dark:border-transparent dark:text-white" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!validateAlias(alias).ok}>Criar link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </OrganizerLayout>
    </div>
  );
}
