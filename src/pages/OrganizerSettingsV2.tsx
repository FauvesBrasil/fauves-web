import React from 'react';
import TextLink from '@/components/TextLink';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import { useOrganization } from '@/context/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Share2, ExternalLink, PenLine, Leaf, Music4, ImagePlus, Globe, Instagram, Facebook, Youtube, Music, Disc, MessageCircle, Info, Link as LinkIcon, Music2, QrCode, Lock, CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ensureApiBase, fetchApi } from '@/lib/apiBase';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import { getOrganizationPath } from '@/lib/eventUrl';

// --- Helpers ---
function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} as ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function getExpressUrl(org: any): string {
  try {
    const base = window.location.origin;
    const slugOrId = org?.slug || org?.id || '';
    return slugOrId ? `${base}/venues/${slugOrId}/door` : '';
  } catch {
    return '';
  }
}

// --- Componente Widget Builder ---
const WidgetBuilder: React.FC<{ org: any; events: Array<{ id: string; name: string; startDate?: string }>; eventsLoading: boolean; onEnsureEvents: () => void }>
  = ({ org, events, eventsLoading, onEnsureEvents }) => {
    const [view, setView] = React.useState<'page' | 'event' | 'list'>('page');
    const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
    const [transparent, setTransparent] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);
    const [selectedEventId, setSelectedEventId] = React.useState('');
    const [copyMsg, setCopyMsg] = React.useState<string>('');

    React.useEffect(() => { if (view === 'event' && events.length === 0 && !eventsLoading) onEnsureEvents(); }, [view, events.length, eventsLoading, onEnsureEvents]);

    const origin = (typeof window !== 'undefined' ? window.location.origin : '');
    const orgPath = org?.slug || org?.id || '';

    const codePage = `\n<iframe src="${origin}/org/${orgPath}?embedded=1&ui=${theme}${transparent ? '&transparent=1' : ''}${showDetails ? '&details=1' : ''}" allow="payment" style="width:100%; height:800px; max-height:calc(100vh - 200px); border:0;"></iframe>\n<script src="${origin}/widget.js"></script>`;
    const codeEvent = `\n<iframe src="${origin}/event/${selectedEventId || 'EVENT_ID'}?embedded=1&ui=${theme}${transparent ? '&transparent=1' : ''}" allow="payment" style="width:100%; height:800px; max-height:calc(100vh - 200px); border:0;"></iframe>\n<script src="${origin}/widget.js"></script>`;
    const codeList = `\n<script>window.__fauves={"events-listing":{"organizerId":"${org?.id || ''}", "layout":"shotgun", "showEventTags":true}};</script>\n<style> body #fauves-events-listing {--shotgun-muted:#f4f4f5; --shotgun-accent:#f4f4f5; --shotgun-accent-foreground:#ff765f; --shotgun-border:#e4e4e7; --shotgun-foreground:#09090b; } </style>\n<section id="fauves-events-listing" />\n<script src="${origin}/events-listing.js"></script>`;

    const code = view === 'page' ? codePage : view === 'event' ? codeEvent : codeList;

    const copy = async () => {
      try { await navigator.clipboard.writeText(code); setCopyMsg('Copiado!'); setTimeout(() => setCopyMsg(''), 1500); } catch { setCopyMsg('Falhou'); setTimeout(() => setCopyMsg(''), 1500); }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-1 mb-4">
            <button className={`px-3 py-1.5 rounded-md text-sm ${view === 'page' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => setView('page')}>Minha pagina</button>
            <button className={`px-3 py-1.5 rounded-md text-sm ${view === 'event' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => setView('event')}>Evento</button>
            <button className={`px-3 py-1.5 rounded-md text-sm ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => setView('list')}>Lista de Eventos</button>
          </div>

          {view !== 'event' ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Escuro</label>
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme" checked={theme === 'light'} onChange={() => setTheme('light')} /> Claro</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Fundo transparente</div>
                <AnimatedCheckbox checked={transparent} onCheckedChange={setTransparent} label="" />
              </div>
              {view === 'page' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Mostrar detalhes da pagina</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Botao de seguir, capa, logo, descricoes, redes sociais, etc.</div>
                  </div>
                  <input type="checkbox" checked={showDetails} onChange={e => setShowDetails(e.target.checked)} />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Selecionar evento</div>
                <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] px-3 text-sm">
                  <option value="" disabled>{eventsLoading ? 'Carregando...' : 'Selecione'}</option>
                  {events.map(ev => (<option value={ev.id} key={ev.id}>{ev.name}</option>))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme2" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Escuro</label>
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme2" checked={theme === 'light'} onChange={() => setTheme('light')} /> Claro</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Fundo transparente</div>
                <AnimatedCheckbox checked={transparent} onCheckedChange={setTransparent} label="" />
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Codigo do Widget</div>
              <button className="text-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700" onClick={copy}>{copyMsg || 'Copiar Codigo'}</button>
            </div>
            <textarea readOnly value={code} className="w-full h-40 bg-zinc-900/10 dark:bg-[#0f0f0f] text-xs p-3 rounded-md border border-zinc-300 dark:border-zinc-700 text-slate-800 dark:text-slate-200" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-[#0f0f0f] min-h-[380px] p-6 text-white">
          <div className="text-xl font-extrabold tracking-wide mb-4">PROXIMOS EVENTOS</div>
          <div className="rounded-lg border border-white/10 p-6 text-sm text-white/70">Nao ha eventos futuros.<br />Siga este produtor para receber atualizacoes.</div>
          <div className="mt-8 text-xl font-extrabold tracking-wide">SOBRE</div>
          <div className="text-sm text-white/70 mt-2">Entrou na Fauves em {(new Date()).getFullYear()}</div>
        </div>
      </div>
    );
  };

// --- Subcomponente Danger Zone ---
function DangerZone({ onDelete, deleteLoading, deleteError, showDeleteModal, setShowDeleteModal }) {
  return (
    <>
      <div className="mt-10 p-5 rounded-xl border border-red-200 bg-red-50/40 dark:bg-[#2a0909]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col text-left">
          <div className="text-base font-semibold text-red-600 dark:text-red-300 mb-2">Excluir organizacao</div>
          <div className="text-xs text-red-600 dark:text-red-300">Esta acao a permanente e Nao pode ser desfeita.</div>
          {deleteError && <div className="text-xs text-red-500 mt-2">{deleteError}</div>}
        </div>
        <Button onClick={() => setShowDeleteModal(true)} className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md shadow-sm w-full sm:w-auto" disabled={deleteLoading}>
          {deleteLoading ? 'Excluindo...' : 'Excluir organizacao'}
        </Button>
      </div>
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Confirmar exclusao</DialogTitle></DialogHeader>
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">Tem certeza que deseja excluir esta organizacao? Essa acao Nao pode ser desfeita.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button onClick={() => { setShowDeleteModal(false); onDelete(); }} className="bg-red-600 text-white hover:bg-red-700" disabled={deleteLoading}>
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type OrganizerTabKey = 'pagina' | 'express' | 'banking';

export default function OrganizerSettingsV2() {
  const { selectedOrg, orgs, setSelectedOrgById } = useOrganization();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<OrganizerTabKey>('pagina');
  
  // Estados de Organizacao
  const [extendedOrg, setExtendedOrg] = React.useState<any | null>(null);
  const [orgUrl, setOrgUrl] = React.useState('');
  const [copyingUrl, setCopyingUrl] = React.useState(false);
  const [derivedSlug, setDerivedSlug] = React.useState('');

  // Estados de Exclusão
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  // Estados de Edição de Identidade
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editSlug, setEditSlug] = React.useState('');
  const [slugStatus, setSlugStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [savingIdentity, setSavingIdentity] = React.useState(false);

  // Estados Efí Bank
  const [efiAccountStatus, setEfiAccountStatus] = React.useState<string>('NONE');
  const [onboardingType, setOnboardingType] = React.useState<'individual' | 'legal'>('individual');
  const [onboardingTaxId, setOnboardingTaxId] = React.useState('');
  const [onboardingPhone, setOnboardingPhone] = React.useState('');
  const [submittingOnboarding, setSubmittingOnboarding] = React.useState(false);

  // Estados PIN / Segurança
  const [pin, setPin] = React.useState(['', '', '', '']);
  const [pinConfirm, setPinConfirm] = React.useState(['', '', '', '']);
  const [pinPhase, setPinPhase] = React.useState<'set' | 'confirm' | 'done'>('set');
  const [bankingConfirmed, setBankingConfirmed] = React.useState(false);

  // Busca dados frescos da organizacao
  React.useEffect(() => {
    if (!selectedOrg) { setOrgUrl(''); setExtendedOrg(null); return; }
    fetchApi(`/api/organization/${selectedOrg.id}`).then(res => res.json()).then(setExtendedOrg).catch(() => {});
  }, [selectedOrg]);

  // Atualiza URLs dinâmicas
  React.useEffect(() => {
    const org = extendedOrg || selectedOrg;
    if (!org) return;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const path = getOrganizationPath(org);
    setOrgUrl(path ? `${base}${path}` : '');
    setDerivedSlug(org.slug || '');
    if (org.efiAccountStatus) setEfiAccountStatus(org.efiAccountStatus);
  }, [selectedOrg, extendedOrg]);

  // PIN check
  React.useEffect(() => {
    const saved = localStorage.getItem('BANKING_PIN');
    if (saved && saved.length === 4) setPinPhase('done');
  }, []);

  const lastUpdated = extendedOrg ? formatDateTime(extendedOrg.updatedAt || extendedOrg.createdAt) : '-';
  const expressUrl = derivedSlug ? getExpressUrl({ ...selectedOrg, slug: derivedSlug }) : '';
  const expressQrUrl = expressUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(expressUrl)}` : '';

  const normalizeSlug = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const openEditIdentity = () => {
    setEditName(selectedOrg?.name || '');
    setEditSlug(selectedOrg?.slug || '');
    setEditOpen(true);
  };

  const saveIdentity = async () => {
    if (!selectedOrg || !editName.trim() || !editSlug.trim()) return;
    setSavingIdentity(true);
    try {
      const res = await fetchApi(`/api/organization/${selectedOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), slug: normalizeSlug(editSlug) })
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Sucesso', description: 'Identidade atualizada.' });
      setEditOpen(false);
      window.location.reload();
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar' });
    } finally { setSavingIdentity(false); }
  };

  const handleDeleteOrg = async () => {
    if (!selectedOrg?.id) return;
    setDeleteLoading(true);
    try {
      const res = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Excluída', description: 'Organização removida.' });
      window.location.reload();
    } catch { setDeleteError('Falha ao excluir.'); } finally { setDeleteLoading(false); }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-white dark:from-[#050505] dark:via-[#0b0b0b] dark:to-[#0d0d0d]">
      <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileDrawerMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentPath={location.pathname} organizations={orgs} selectedOrg={selectedOrg} selectOrganization={setSelectedOrgById} user={user} />
      <SidebarMenu activeKeyOverride="ajustes" />

      <div className="relative w-full lg:pl-24">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-14 lg:px-8">
          <AppHeader />
          <div className="space-y-6 pt-4 mt-10">
            {/* Cabecalho de Status */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 px-7 py-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-[#0f0f0f]/80">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl border bg-indigo-50 flex items-center justify-center overflow-hidden">
                    {(selectedOrg as any)?.logoUrl ? <img src={(selectedOrg as any).logoUrl} className="h-full w-full object-cover" /> : <div className="text-xl font-bold text-indigo-700">O</div>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h1 className="text-3xl font-bold">{selectedOrg?.name || 'Selecione uma organização'}</h1>
                       <button onClick={openEditIdentity} className="p-1.5 hover:bg-zinc-100 rounded-md"><PenLine size={16} /></button>
                    </div>
                    <div className="text-sm text-slate-500">Última atualização: {lastUpdated}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(orgUrl); toast({title:'Copiado'}); }} disabled={!orgUrl}><Copy size={16} className="mr-1"/> Link</Button>
                   <Button size="sm" onClick={() => window.open(orgUrl, '_blank')} disabled={!orgUrl}><ExternalLink size={16} className="mr-1"/> Ver Página</Button>
                </div>
              </div>
            </div>

            {selectedOrg ? (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6 bg-white dark:bg-[#111] p-1 rounded-xl ring-1 ring-zinc-200">
                  <TabsTrigger value="pagina">Minha Página</TabsTrigger>
                  <TabsTrigger value="express">Bilheteria Express</TabsTrigger>
                  <TabsTrigger value="banking">Banking</TabsTrigger>
                </TabsList>

                <TabsContent value="pagina" className="space-y-6">
                   <WidgetBuilder org={selectedOrg} events={[]} eventsLoading={false} onEnsureEvents={() => {}} />
                   <DangerZone onDelete={handleDeleteOrg} deleteError={deleteError} deleteLoading={deleteLoading} showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} />
                </TabsContent>

                <TabsContent value="express">
                  <div className="rounded-xl border border-zinc-200 bg-white dark:bg-[#121212] p-8 text-center">
                    <QrCode size={64} className="mx-auto mb-4 text-indigo-600" />
                    <h3 className="text-xl font-bold">Venda na Porta</h3>
                    <p className="text-slate-500 mb-6">QR Code para acesso rápido à compra de ingressos.</p>
                    {expressQrUrl && <img src={expressQrUrl} className="mx-auto w-48 h-48 border rounded-xl p-2 mb-4" />}
                    <Button variant="outline" onClick={() => window.open(expressUrl, '_blank')}>Abrir URL Express</Button>
                  </div>
                </TabsContent>

                <TabsContent value="banking">
                   {efiAccountStatus === 'NONE' || efiAccountStatus === 'REJECTED' ? (
                     <div className="rounded-2xl border bg-white dark:bg-[#121212] overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-8 text-white">
                           <h2 className="text-2xl font-bold">Ative sua Conta Digital Efí</h2>
                           <p className="opacity-90">Receba via Pix e Cartão com split automático.</p>
                        </div>
                        <div className="p-8 space-y-6 max-w-xl mx-auto">
                           <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                              <button onClick={() => setOnboardingType('individual')} className={`flex-1 py-2 rounded-md ${onboardingType === 'individual' ? 'bg-white shadow-sm' : ''}`}>CPF</button>
                              <button onClick={() => setOnboardingType('legal')} className={`flex-1 py-2 rounded-md ${onboardingType === 'legal' ? 'bg-white shadow-sm' : ''}`}>CNPJ</button>
                           </div>
                           <Input value={onboardingTaxId} onChange={e => setOnboardingTaxId(e.target.value)} placeholder={onboardingType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'} />
                           <Input value={onboardingPhone} onChange={e => setOnboardingPhone(e.target.value)} placeholder="(00) 00000-0000" />
                           <Button className="w-full h-12 bg-indigo-600" onClick={async () => {
                              setSubmittingOnboarding(true);
                              try {
                                 const res = await fetchApi(`/api/organization/${selectedOrg.id}/onboarding`, {
                                    method: 'POST',
                                    body: JSON.stringify({ type: onboardingType, taxId: onboardingTaxId, phone: onboardingPhone })
                                 });
                                 if (res.ok) { setEfiAccountStatus('PENDING'); toast({title:'Enviado'}); }
                              } catch { toast({variant:'destructive', title:'Falha'}); } finally { setSubmittingOnboarding(false); }
                           }} disabled={submittingOnboarding}>{submittingOnboarding ? 'Enviando...' : 'Criar Conta'}</Button>
                        </div>
                     </div>
                   ) : efiAccountStatus === 'PENDING' ? (
                     <div className="p-12 text-center bg-white dark:bg-[#121212] rounded-2xl border">
                        <Info size={48} className="mx-auto mb-4 text-amber-500 animate-pulse" />
                        <h2 className="text-xl font-bold">Conta em Análise</h2>
                        <p className="text-slate-500">A Efí Bank está processando seus dados (1-3 dias).</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border shadow-sm">
                           <div className="flex items-center gap-2 mb-4 text-emerald-600"><CheckCircle2 /> <span className="font-bold">Conta Ativa</span></div>
                           <div className="text-sm font-mono bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border">{selectedOrg?.id}</div>
                           <Button className="w-full mt-6" onClick={() => navigate('/dashboard/financas')}>Ver Financeiro</Button>
                        </div>
                        <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border shadow-sm">
                           <h3 className="font-bold flex items-center gap-2 mb-2"><Lock size={18}/> Segurança (PIN)</h3>
                           {pinPhase === 'done' ? (
                             <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100">
                                <CheckCircle2 className="mx-auto text-emerald-500 mb-2" />
                                <div className="text-sm font-semibold">PIN Configurado</div>
                             </div>
                           ) : (
                             <div className="space-y-4">
                                <div className="text-xs text-slate-500">Crie um PIN de 4 dígitos para operações bancárias.</div>
                                <div className="flex gap-2 justify-center">
                                   {(pinPhase === 'set' ? pin : pinConfirm).map((d, i) => (
                                      <input key={i} value={d} onChange={(e) => {
                                         const v = e.target.value.replace(/\D/g,'').slice(0,1);
                                         const next = pinPhase === 'set' ? [...pin] : [...pinConfirm];
                                         next[i] = v;
                                         if (pinPhase === 'set') setPin(next); else setPinConfirm(next);
                                         if (v && i < 3) (e.target.nextSibling as HTMLElement)?.focus();
                                         if (next.every(x => x)) {
                                            if (pinPhase === 'set') setPinPhase('confirm');
                                            else if (pin.join('') === next.join('')) { localStorage.setItem('BANKING_PIN', pin.join('')); setPinPhase('done'); toast({title:'PIN OK'}); }
                                            else { setPinConfirm(['','','','']); toast({variant:'destructive', title:'Não confere'}); }
                                         }
                                      }} className="w-10 h-12 border-2 rounded-lg text-center font-bold" maxLength={1} />
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                   )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="p-12 text-center text-slate-500 border-2 border-dashed rounded-2xl">Aguardando seleção...</div>
            )}

            {/* Modal de Identidade */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>Editar Nome & URL</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" />
                  <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="Slug" />
                </div>
                <DialogFooter>
                   <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
                   <Button onClick={saveIdentity} disabled={savingIdentity}>{savingIdentity ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
