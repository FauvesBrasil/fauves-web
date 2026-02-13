import React from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { ensureApiBase, apiUrl } from '@/lib/apiBase';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';

interface EventRow {
  id: string;
  name: string;
  startDate?: string | null;
  image?: string | null;
  status?: string | null;
  published?: boolean | null;
  availableBalance?: number;
  grossRevenue?: number;
  totalWithdrawn?: number;
}

const formatDateTimePt = (iso?: string | null) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

export default function OrganizerFinances() {
  const { selectedOrg, orgs, setSelectedOrgById } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = React.useState<EventRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [filter, setFilter] = React.useState<'active' | 'inactive'>('active');
  const [search, setSearch] = React.useState('');
  const LIMIT = 4;

  // Estados para menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const fetchEvents = React.useCallback(async (pageNum: number, append = false) => {
    if (!selectedOrg?.id) {
      setEvents([]);
      setTotal(0);
      setHasMore(false);
      return;
    }

    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      await ensureApiBase().catch(() => { });
      const path = `/api/organization/${selectedOrg.id}/events?page=${pageNum}&limit=${LIMIT}`;
      const url = apiUrl(path);

      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error('Failed to fetch events');

      const data = await r.json();
      const loadedEvents = data.events || [];

      const mapped: EventRow[] = loadedEvents.map((e: any) => ({
        id: e.id,
        name: e.name || e.title || 'Evento',
        startDate: e.startDate || e.startDateUtc || e.startsAt || null,
        image: e.image || e.bannerImage || e.coverUrl || null,
        status: e.status || null,
        published: typeof e.isPublished === 'boolean' ? e.isPublished : (e.privacy ? e.privacy === 'public' : null),
        availableBalance: 0,
        grossRevenue: 0,
        totalWithdrawn: 0,
      }));

      // Fetch financial data for each event
      const token = localStorage.getItem('AUTH_TOKEN_V1') || localStorage.getItem('token');
      if (token) {
        await Promise.all(
          mapped.map(async (ev) => {
            try {
              const finUrl = apiUrl(`/api/organization/event/${ev.id}/financial`);
              const finRes = await fetch(finUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              if (finRes.ok) {
                const finData = await finRes.json();
                if (finData.ok && finData.financial) {
                  ev.availableBalance = finData.financial.availableForWithdrawal || 0;
                  ev.grossRevenue = finData.financial.grossRevenue || 0;
                  ev.totalWithdrawn = finData.financial.totalWithdrawn || 0;
                }
              }
            } catch (err) {
              console.error(`Failed to fetch financial for event ${ev.id}:`, err);
            }
          })
        );
      }

      if (append) {
        setEvents(prev => [...prev, ...mapped]);
      } else {
        setEvents(mapped);
      }

      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error('[OrganizerFinances] Error fetching events:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedOrg?.id, LIMIT]);

  React.useEffect(() => {
    fetchEvents(1, false);
  }, [selectedOrg?.id, fetchEvents]);

  const isActive = (e: EventRow) => {
    // Check status first (priority)
    const s = (e.status || '').toUpperCase();
    if (['ACTIVE', 'PUBLISHED', 'OPEN'].includes(s)) return true;
    if (['ENCERRADO', 'DRAFT', 'CLOSED', 'ARCHIVED', 'CANCELLED'].includes(s)) return false;

    // Check published status
    if (e.published === false) return false;

    // Check date (active if future or within last 24h)
    if (e.startDate) {
      const eventTime = new Date(e.startDate).getTime();
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24h ago
      return eventTime >= cutoff;
    }

    // Default: published events are active
    return e.published === true;
  };

  const activeCount = events.filter(isActive).length;
  const inactiveCount = events.length - activeCount;

  const filtered = events.filter(e => (filter === 'active' ? isActive(e) : !isActive(e)))
    .filter(e => !search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <OrganizerLayout>
      <div className="relative min-h-screen w-full bg-transparent dark:bg-[#0b0b0b] dark:text-white">
        {/* Mobile Menu */}
        <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <MobileDrawerMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          organizations={orgs}
          selectedOrg={selectedOrg}
          selectOrganization={setSelectedOrgById}
          user={user}
        />

        <SidebarMenu activeKeyOverride="financas" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <AppHeader />
          <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto mt-16 px-2 max-md:mt-10 max-sm:mt-6">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white max-sm:text-2xl">Finanças</h1>
            {/* Cards de resumo */}
            <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
              {/* Saldo Disponível */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#121212] p-6 max-sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Saldo Disponível</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 max-sm:text-2xl">
                  {events.reduce((sum, ev) => sum + (ev.availableBalance || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pronto para saque
                </div>
              </div>

              {/* Receita Total */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6 max-sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Receita Total</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white max-sm:text-2xl">
                  {events.reduce((sum, ev) => sum + (ev.grossRevenue || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Vendas brutas</div>
              </div>

              {/* Já Sacado */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-[#121212] p-6 max-sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Já Sacado</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-500 max-sm:text-2xl">
                  {events.reduce((sum, ev) => sum + (ev.totalWithdrawn || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Transferido para você
                </div>
              </div>
            </div>

            {/* Barra de ações e busca */}
            <div className="flex items-center justify-between gap-4 mt-4 max-sm:flex-col max-sm:gap-3">
              <div className="flex items-center gap-6">
                <div className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">EVENTOS</div>
                <div className="flex items-center gap-4 text-sm max-sm:gap-3 max-sm:text-xs">
                  <button onClick={() => setFilter('active')} className={`text-slate-700 dark:text-slate-200 ${filter === 'active' ? 'font-semibold' : ''}`}>Ativo <span className="ml-1 px-1.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs max-sm:px-1 max-sm:text-[10px]">{activeCount}</span></button>
                  <button onClick={() => setFilter('inactive')} className={`text-slate-700 dark:text-slate-200 ${filter === 'inactive' ? 'font-semibold' : ''}`}>Inativo <span className="ml-1 px-1.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs max-sm:px-1 max-sm:text-[10px]">{inactiveCount}</span></button>
                </div>
              </div>
              <div className="flex items-center gap-3 max-sm:w-full">
                <button className="h-10 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] text-sm font-semibold text-slate-700 dark:text-white flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Ações
                </button>
                <div className="relative max-sm:flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar evento..." className="h-10 w-72 pl-10 pr-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] text-sm text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all max-sm:w-full" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-16 text-center max-sm:p-8 max-sm:text-sm">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-16 flex flex-col items-center justify-center text-center max-sm:p-8">
                <div className="text-lg font-semibold text-slate-900 dark:text-white max-sm:text-base">Sem eventos {filter === 'active' ? 'ativos' : 'inativos'}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-sm:text-xs">Eventos {filter === 'active' ? 'ativos' : 'inativos'} aparecerão aqui</div>
                {filter === 'active' && <a href="/create-event" className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-800 max-sm:text-xs">Criar um evento</a>}
              </div>
            ) : (
              <>
                {/* Desktop layout */}
                <div className="mt-4 space-y-4 max-sm:hidden">
                  {filtered.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/organizer-finances/${ev.id}`)}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] overflow-hidden flex cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#191919] transition"
                      role="button"
                      aria-label={`Abrir finanças de ${ev.name}`}
                    >
                      <div className="w-56 h-40 bg-zinc-200 dark:bg-[#1f1f1f] flex-shrink-0">
                        {ev.image ? <img src={ev.image} alt={ev.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 p-5 grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-2">
                          <div className="text-lg font-semibold text-slate-900 dark:text-white">{ev.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{formatDateTimePt(ev.startDate)}</div>
                        </div>
                        <div className="text-center col-span-1">
                          <div className="text-[11px] tracking-widest text-slate-500 dark:text-slate-400 mb-1">RECEITA BRUTA</div>
                          <div className="text-base font-semibold text-slate-900 dark:text-white">
                            {(ev.grossRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                        <div className="text-center col-span-1">
                          <div className="text-[11px] tracking-widest text-slate-500 dark:text-slate-400 mb-1">JÁ SACADO</div>
                          <div className="text-base font-semibold text-blue-600 dark:text-blue-500">
                            {(ev.totalWithdrawn || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                        <div className="text-right col-span-1">
                          <div className="text-[11px] tracking-widest text-slate-500 dark:text-slate-400 mb-1">DISPONÍVEL</div>
                          <div className={`text-lg font-bold ${(ev.availableBalance || 0) > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-600'}`}>
                            {(ev.availableBalance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          {(ev.availableBalance || 0) === 0 && (ev.totalWithdrawn || 0) > 0 && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tudo sacado</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile layout */}
                <div className="hidden max-sm:flex flex-col gap-4 mt-4">
                  {filtered.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/organizer-finances/${ev.id}`)}
                      className="rounded-xl border border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#242424] overflow-hidden cursor-pointer hover:shadow-md transition"
                      role="button"
                      aria-label={`Abrir finanças de ${ev.name}`}
                    >
                      {/* Imagem */}
                      <div className="w-full h-32 bg-zinc-200 dark:bg-[#1f1f1f]">
                        {ev.image ? <img src={ev.image} alt={ev.name} className="w-full h-full object-cover" /> : null}
                      </div>

                      {/* Conteúdo */}
                      <div className="p-4 flex flex-col gap-3">
                        {/* Nome e data */}
                        <div>
                          <div className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2">{ev.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDateTimePt(ev.startDate)}</div>
                        </div>

                        {/* Grid de valores */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                          <div>
                            <div className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">RECEITA BRUTA</div>
                            <div className="text-base font-bold text-slate-900 dark:text-white">
                              {(ev.grossRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">JÁ SACADO</div>
                            <div className="text-base font-bold text-blue-600 dark:text-blue-500">
                              {(ev.totalWithdrawn || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                        </div>

                        {/* Disponível em destaque */}
                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400 font-semibold">DISPONÍVEL PARA SAQUE</div>
                            <div className={`text-xl font-bold ${(ev.availableBalance || 0) > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-600'}`}>
                              {(ev.availableBalance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                          {(ev.availableBalance || 0) === 0 && (ev.totalWithdrawn || 0) > 0 && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">✓ Tudo sacado</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More button */}
                {hasMore && !loading && filtered.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => fetchEvents(page + 1, true)}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-white dark:bg-[#121212] border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold text-slate-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 max-sm:border-[#E5E7EB] max-sm:dark:border-[#1F1F1F] max-sm:bg-white max-sm:dark:bg-[#242424]"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Carregando...
                        </>
                      ) : (
                        <>
                          Carregar mais
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
}
