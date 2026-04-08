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
import { LogIn, Monitor, Loader2, UserX } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

export default function ParticipantesCheckin() {
  const { totalLeft } = useLayoutOffsets();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Event data for mobile menus
  const [eventName, setEventName] = useState('Evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);

  // Participants data from API
  interface Participant {
    id: string;
    nome: string;
    email: string;
    ingresso: string;
    used: boolean;
  }
  const [participantes, setParticipantes] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  // Load tickets/participants from database
  useEffect(() => {
    let mounted = true;
    async function loadParticipantes() {
      if (!eventId) return;
      setLoading(true);
      try {
        // Load tickets
        const ticketsRes = await fetchApi(`/api/ticket/event/${eventId}`);
        if (!ticketsRes?.ok) return;
        const tickets = await ticketsRes.json();
        if (!mounted) return;

        // Map tickets to participants format
        const mapped: Participant[] = tickets.map((t: any) => ({
          id: t.id,
          nome: t.user?.name || t.guestName || 'Participante',
          email: t.user?.email || t.guestEmail || '-',
          ingresso: t.ticketType?.name || t.ticketTypeName || 'Ingresso',
          used: t.used || false
        }));
        setParticipantes(mapped);
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadParticipantes();
    return () => { mounted = false; };
  }, [eventId]);

  const total = participantes.length;
  const checkedCount = participantes.filter(p => p.used).length;

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
          setEventDate(`${datePart} às ${timePart}`);
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
      } catch (e) {
        // ignore
      }
    }
    loadTickets();
    return () => { mounted = false; };
  }, [eventId]);

  const handleCheckin = async (ticketId: string) => {
    // TODO: Call API to mark ticket as used
    // For now, assume success in frontend state
    setParticipantes(prev => prev.map(p =>
      p.id === ticketId ? { ...p, used: true } : p
    ));

    try {
      // Basic implementation of check-in call if needed here or just rely on scanner
      // await fetchApi('/api/ticket/checkin', { method: 'POST', body: JSON.stringify({ code: ticketId }) });
    } catch (e) { }
  };

  const handleCancelCheckin = async (ticketId: string) => {
    // TODO: Call API to unmark ticket as used
    setParticipantes(prev => prev.map(p =>
      p.id === ticketId ? { ...p, used: false } : p
    ));
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
      {/* Mobile Menus */}
      <MobileTopBar
        onMenuOpen={() => setMobileMenuOpen(true)}
      />
      <MobileDrawerMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={location.pathname}
        user={user}
      />

      <EventMobileTopBar
        onMenuOpen={() => setEventMenuOpen(true)}
        title="Check-in"
      />
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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Check-in</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Faça check-in dos participantes</p>
        </div>
      </div>
      <OrganizerLayout>
        <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 max-md:pl-0 max-md:pr-0 min-h-screen relative">
          <div className="mt-24 max-md:mt-4 max-w-7xl mx-auto pb-8 max-md:pb-6 max-md:px-4">
            {/* Desktop Header */}
            <div className="max-md:hidden">
              <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Check-in</h1>
              <p className="text-gray-700 dark:text-slate-300 mb-6">Faça check-in dos participantes usando seu nome</p>
            </div>
            <div className="w-full h-2 bg-zinc-200 dark:bg-[#1F1F1F] rounded mb-2 relative">
              <div className="h-2 bg-green-400 rounded" style={{ width: `${(checkedCount / total) * 100}%` }}></div>
              <div className="absolute right-0 -top-6 text-sm max-md:text-xs font-semibold text-zinc-700 dark:text-slate-300">{checkedCount} / {total}</div>
            </div>

            {/* Desktop Controls */}
            <div className="flex items-center justify-between mb-4 max-md:hidden">
              <input type="text" placeholder="Digite o Nome do participante" className="border rounded-lg px-4 py-2 text-sm w-72 dark:bg-[#121212] dark:border-transparent dark:text-white" />
              <div className="flex gap-2">
                <button className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2"><LogIn size={16} /> App Check-in</button>
                <button className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2"><Monitor size={16} /> Web Check-in</button>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="hidden max-md:flex flex-col gap-3 mb-4">
              <input type="text" placeholder="Digite o Nome do participante" className="border rounded-lg px-4 py-2.5 text-sm w-full dark:bg-[#121212] dark:border-zinc-700 dark:text-white" />
              <div className="flex gap-2">
                <button className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"><LogIn size={16} /> App</button>
                <button className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"><Monitor size={16} /> Web</button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 dark:text-slate-400">Carregando participantes...</p>
              </div>
            ) : participantes.length === 0 ? (
              /* Empty State */
              <div className="rounded-2xl border border-zinc-200 dark:border-[#1F1F1F] bg-white dark:bg-[#121212] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                  <UserX className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-indigo-950 dark:text-white mb-2">Nenhum participante encontrado</h3>
                <p className="text-sm text-zinc-500 dark:text-slate-400 max-w-sm">
                  Este evento ainda não possui ingressos vendidos. Quando os participantes comprarem ingressos, eles aparecerão aqui.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="border rounded-xl overflow-hidden bg-white dark:bg-[#242424] dark:border-[#1F1F1F] max-md:hidden">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-700 dark:bg-[#1F1F1F] dark:text-slate-300">
                        <th className="px-6 py-3 text-left">Nome do participante</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">Tipo do ingresso</th>
                        <th className="px-6 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantes.map((p) => (
                        <tr key={p.id} className="border-t dark:border-[#1F1F1F]">
                          <td className="px-6 py-3 dark:text-white">{p.nome}</td>
                          <td className="px-6 py-3 dark:text-white">{p.email}</td>
                          <td className="px-6 py-3 dark:text-white">{p.ingresso}</td>
                          <td className="px-6 py-3">
                            {p.used ? (
                              <span className="inline-flex items-center text-green-600 dark:text-[#64CB9E] font-semibold gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-green-600 dark:text-[#64CB9E]"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <button className="text-xs text-zinc-500 dark:text-slate-300 hover:underline ml-2" onClick={() => handleCancelCheckin(p.id)}>
                                  Cancelar
                                </button>
                              </span>
                            ) : (
                              <button className="text-indigo-700 dark:text-indigo-300 font-semibold hover:underline" onClick={() => handleCheckin(p.id)}>
                                Check-in
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="hidden max-md:block space-y-3">
                  {participantes.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#17171a]"
                    >
                      {/* Header: Nome + Status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{p.nome}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{p.email}</p>
                        </div>
                        <div>
                          {p.used ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center text-green-600 dark:text-[#64CB9E] font-semibold gap-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-600 dark:text-[#64CB9E]"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </span>
                              <button
                                className="text-xs text-zinc-500 dark:text-slate-300 hover:underline"
                                onClick={() => handleCancelCheckin(p.id)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                              onClick={() => handleCheckin(p.id)}
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                          Tipo do ingresso
                        </div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {p.ingresso}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </OrganizerLayout>
    </div>
  );
}
