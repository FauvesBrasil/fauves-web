import React, { useEffect, useState } from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useAuth } from '@/context/AuthContext';
import { Trash2, UserPlus } from 'lucide-react';
import AdicionarPessoaEquipeModal from '@/components/AdicionarPessoaEquipeModal';
import { fetchApi } from '@/lib/apiBase';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageLoadingWrapper } from '@/components/PageLoadingWrapper';

type FuncaoEvento = 'ADMIN' | 'MANAGER' | 'FINANCE' | 'VIEWER' | 'CHECKIN' | 'PROMOTER' | 'ORGANIZER' | 'SECURITY';
type NivelEquipe = 'socio' | 'gerente' | 'financeiro' | 'visualizacao' | 'checkin' | 'promoter';

const nivelParaFuncao: Record<NivelEquipe, FuncaoEvento> = {
  socio: 'ADMIN',
  gerente: 'MANAGER',
  financeiro: 'FINANCE',
  visualizacao: 'VIEWER',
  checkin: 'CHECKIN',
  promoter: 'PROMOTER',
};

interface TeamMember {
  userId: string;
  email: string;
  nome: string;
  funcao: FuncaoEvento;
  isOwner?: boolean;
  createdAt?: string;
}

const funcaoLabel: Record<FuncaoEvento, string> = {
  ADMIN: 'Socio',
  MANAGER: 'Gerente',
  FINANCE: 'Financeiro',
  VIEWER: 'Visualizacao',
  CHECKIN: 'Check-in',
  PROMOTER: 'Promoter',
  ORGANIZER: 'Organizador',
  SECURITY: 'Equipe',
};

export default function GerenciarEquipe() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showModal, setShowModal] = React.useState(false);

  // Event data for mobile menus
  const [eventName, setEventName] = useState('Evento');
  const [eventDate, setEventDate] = useState('Data nao definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);

  const [equipe, setEquipe] = useState<TeamMember[]>([]);
  const [loadingEquipe, setLoadingEquipe] = useState(false);
  const [erroEquipe, setErroEquipe] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<TeamMember | null>(null);

  // Load event details for mobile menus
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!eventId) return;
      try {
        const res = await fetchApi(`/api/event/${eventId}`);
        if (!res?.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Evento');
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0, 5);
          setEventDate(`${datePart} as ${timePart}`);
        }
        setEventStatus(ev?.status === 'Publicado' ? 'Publicado' : 'Rascunho');
      } catch { }
    }
    load();
    return () => { mounted = false; };
  }, [eventId]);

  useEffect(() => {
    let mounted = true;
    async function loadTickets() {
      if (!eventId) return;
      try {
        const res = await fetch(`/api/ticket-type/event/${eventId}`);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setTicketTypes(data || []);
      } catch {
        // ignore
      }
    }
    loadTickets();
    return () => { mounted = false; };
  }, [eventId]);

  const carregarEquipe = async () => {
    if (!eventId) return;
    setLoadingEquipe(true);
    setErroEquipe(null);
    try {
      const r = await fetchApi(`/api/event/${eventId}/team`);
      if (!r.ok) throw new Error('Falha ao carregar equipe');
      const data = await r.json();
      const items: TeamMember[] = (data?.items || data || []).map((m: any) => ({
        userId: m.userId,
        email: m.email || '',
        nome: m.name || m.email || 'Colaborador',
        funcao: m.funcao || 'VIEWER',
        isOwner: m.isOwner || false,
        createdAt: m.createdAt,
      }));
      setEquipe(items);
    } catch (e: any) {
      setErroEquipe(e?.message || 'Erro ao carregar equipe');
      setEquipe([]);
    } finally {
      setLoadingEquipe(false);
    }
  };

  useEffect(() => {
    carregarEquipe();
  }, [eventId]);

  const handleAddPessoa = async (pessoa: { email: string; nivel: NivelEquipe }) => {
    if (!eventId) return;
    const funcao = nivelParaFuncao[pessoa.nivel];
    try {
      const res = await fetchApi(`/api/event/${eventId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pessoa.email, funcao }),
      });
      if (!res.ok) throw new Error('Falha ao adicionar colaborador');
      await carregarEquipe();
    } catch (e: any) {
      setErroEquipe(e?.message || 'Erro ao adicionar colaborador');
    }
  };

  const handleRemover = async (userId: string) => {
    if (!eventId || !userId) return;
    try {
      const res = await fetchApi(`/api/event/${eventId}/team/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover colaborador');
      setEquipe(prev => prev.filter(m => m.userId !== userId));
    } catch (e: any) {
      setErroEquipe(e?.message || 'Erro ao remover colaborador');
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
      {/* Mobile Menus */}
      <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileDrawerMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={location.pathname}
        user={user}
      />

      <EventMobileTopBar onMenuOpen={() => setEventMenuOpen(true)} title="Gerenciar Equipe" />
      <EventMobileDrawer
        isOpen={eventMenuOpen}
        onClose={() => setEventMenuOpen(false)}
        currentPath={location.pathname}
        eventId={eventId || ''}
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
        hasTickets={ticketTypes.length > 0}
        isPublished={eventStatus === 'Publicado'}
      />

      {/* Desktop Sidebars - Hidden on mobile */}
      <div className="max-md:hidden">
        <SidebarMenu />
      </div>
      {eventId && (
        <div className="max-md:hidden">
          <EventDetailsSidebar
            eventIdOverride={eventId || null}
            panelRoute={eventId ? `/painel-evento/${eventId}` : undefined}
            fixed
            fixedLeft={70}
            fixedWidth={300}
            fixedTop={0}
            onBack={() => navigate('/organizer-events')}
          />
        </div>
      )}
      <div className="max-md:hidden">
        <AppHeader />
      </div>

      {/* Mobile Header */}
      <div className="hidden max-md:block sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0b0b0b]">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Gerenciar equipe</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Adicione pessoas ao evento</p>
        </div>
      </div>
      <OrganizerLayout>
        <PageLoadingWrapper loading={loadingEquipe} variant="table" minLoadTime={200}>
          <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 max-md:pl-0 max-md:pr-0 min-h-screen relative">
            <div className="mt-24 max-md:mt-0 max-w-[800px] mx-auto pb-24 max-md:pb-20 max-md:px-4 max-md:pt-12">
              {/* Desktop Header */}
              <div className="max-md:hidden">
                <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Gerenciar equipe</h1>
                <p className="text-gray-700 dark:text-slate-300 mb-6">Adicione pessoas ao gerenciamento do seu evento aqui na Fauves.</p>
              </div>

              {erroEquipe && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {erroEquipe}
                </div>
              )}

              {/* Desktop List */}
              <div className="border rounded-xl bg-white overflow-hidden dark:bg-[#242424] dark:border-[#1F1F1F] max-md:hidden">
                {loadingEquipe ? (
                  <div className="p-6 text-sm text-zinc-500">Carregando equipe...</div>
                ) : equipe.length === 0 ? (
                  <div className="p-6 text-sm text-zinc-500">Nenhum colaborador adicionado ainda.</div>
                ) : (
                  equipe.map((m) => {
                    const cannotRemove = m.isOwner || (user?.id && m.userId === user.id);
                    return (
                      <div key={m.userId} className="flex items-center gap-4 px-6 py-5 border-b last:border-b-0 dark:border-[#1F1F1F]">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                          {m.nome.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-indigo-950 dark:text-white">
                            {m.nome}
                            {m.isOwner && <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(Criador)</span>}
                          </span>
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 mt-1">
                            <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded dark:bg-[#1F1F1F] dark:text-slate-300">
                              {funcaoLabel[m.funcao] || m.funcao}
                            </span>
                          </span>
                          <span className="text-sm text-zinc-500 dark:text-slate-300">{m.email}</span>
                        </div>
                        <div className="ml-auto">
                          {!m.isOwner && (
                            <button
                              className={`text-zinc-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-500 ${cannotRemove ? 'opacity-40 cursor-not-allowed hover:text-zinc-500 dark:hover:text-slate-300' : ''}`}
                              onClick={() => !cannotRemove && setPendingRemoval(m)}
                              aria-label="Remover colaborador"
                              disabled={!!cannotRemove}
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mobile Cards */}
              <div className="hidden max-md:block space-y-3">
                {loadingEquipe ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#17171a] text-sm text-zinc-500">
                    Carregando equipe...
                  </div>
                ) : equipe.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#17171a] text-sm text-zinc-500">
                    Nenhum colaborador adicionado ainda.
                  </div>
                ) : (
                  equipe.map((m) => {
                    const cannotRemove = m.isOwner || (user?.id && m.userId === user.id);
                    return (
                      <div
                        key={m.userId}
                        className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#17171a]"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold flex-shrink-0">
                            {m.nome.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                              {m.nome}
                              {m.isOwner && <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(Criador)</span>}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{m.email}</p>
                          </div>
                          {!m.isOwner && (
                            <button
                              className={`flex items-center justify-center w-9 h-9 rounded-full text-zinc-500 transition dark:text-zinc-400 ${cannotRemove ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400'}`}
                              onClick={() => !cannotRemove && setPendingRemoval(m)}
                              aria-label="Remover colaborador"
                              disabled={!!cannotRemove}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="inline-flex items-center bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-[#1F1F1F] dark:text-slate-300">
                            {funcaoLabel[m.funcao] || m.funcao}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Floating Button */}
              <div className="fixed bottom-8 right-8 max-md:bottom-6 max-md:right-4 z-50 group flex items-center gap-3">
                <button
                  className="w-16 h-16 max-md:w-14 max-md:h-14 rounded-full bg-[#2A2AD7] shadow-lg flex items-center justify-center hover:bg-[#1E1EBE] transition-all"
                  aria-label="Adicionar pessoa a equipe"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  onClick={() => setShowModal(true)}
                >
                  <UserPlus className="w-8 h-8 max-md:w-6 max-md:h-6 text-white" />
                </button>
                <span className="absolute right-20 max-md:right-16 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1F1F1F] text-[#2A2AD7] dark:text-[#2A2AD7] font-bold px-4 py-2 rounded-xl shadow text-base max-md:text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap max-md:hidden">
                  Adicionar pessoa a equipe
                </span>
              </div>
              {showModal && (
                <AdicionarPessoaEquipeModal open={showModal} onClose={() => setShowModal(false)} onAdd={handleAddPessoa} />
              )}
              <ConfirmDialog
                open={!!pendingRemoval}
                onOpenChange={(open) => { if (!open) setPendingRemoval(null); }}
                title="Remover colaborador"
                description={`Deseja remover ${pendingRemoval?.nome || 'este colaborador'} da equipe?`}
                confirmText="Remover"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={() => {
                  if (pendingRemoval) {
                    handleRemover(pendingRemoval.userId);
                    setPendingRemoval(null);
                  }
                }}
              />
            </div>
          </div>
        </PageLoadingWrapper>
      </OrganizerLayout>
    </div>
  );
}
