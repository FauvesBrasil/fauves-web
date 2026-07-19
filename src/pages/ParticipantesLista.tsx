import React, { useEffect, useState } from 'react';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, List, ListPlus, UploadCloud, Trash2, Users, MoreHorizontal, Pencil, Plus, X } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  quantity: number;
  checkedIn: number;
};

type GuestList = {
  id: string;
  name: string;
  updatedAt: string;
  guests: Guest[];
};

const initialLists: GuestList[] = [];


export default function ParticipantesLista() {
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

  // Funções auxiliares declaradas antes do uso
  const [lists, setLists] = React.useState<GuestList[]>(initialLists);
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null);
  const [createListOpen, setCreateListOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  const [addGuestOpen, setAddGuestOpen] = React.useState(false);
  const [guestTab, setGuestTab] = React.useState<'manual' | 'csv'>('manual');
  const [manualGuests, setManualGuests] = React.useState([{ firstName: '', lastName: '', quantity: 1 }]);
  const [editingList, setEditingList] = React.useState<GuestList | null>(null);
  const [editingListName, setEditingListName] = React.useState('');
  const [listPendingDeletion, setListPendingDeletion] = React.useState<GuestList | null>(null);
  const manualTotalGuests = manualGuests.reduce((acc, g) => acc + (Number(g.quantity) || 0), 0);
  const manualGuestsReady = manualGuests.filter((g) => g.firstName.trim());
  const canSubmitManual = manualGuestsReady.length > 0;
  const activeList = lists.find((l) => l.id === selectedListId) || null;

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


  // Funções auxiliares declaradas antes do uso
  function openEditListDialog(list: GuestList) {
    setEditingList(list);
    setEditingListName(list.name);
  }

  async function handleUpdateListName() {
    const updatedName = editingListName.trim();
    if (!editingList || !updatedName || !eventId) return;
    const res = await fetchApi(`/api/event/${eventId}/guest-lists/${editingList.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: updatedName })
    });
    if (res.ok) {
      setLists((prev) =>
        prev.map((list) =>
          list.id === editingList.id ? { ...list, name: updatedName, updatedAt: new Date().toISOString() } : list,
        ),
      );
      setEditingList(null);
      setEditingListName('');
    }
  }

  async function handleDeleteList() {
    if (!listPendingDeletion || !eventId) return;
    const res = await fetchApi(`/api/event/${eventId}/guest-lists/${listPendingDeletion.id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setLists((prev) => prev.filter((list) => list.id !== listPendingDeletion.id));
      if (selectedListId === listPendingDeletion.id) {
        setSelectedListId(null);
      }
      setListPendingDeletion(null);
    }
  }

  // Carregar listas do backend ao montar
  useEffect(() => {
    if (!eventId) return;
    fetchApi(`/api/event/${eventId}/guest-lists`).then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setLists(data);
      }
    });
  }, [eventId]);

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name || !eventId) return;
    const res = await fetchApi(`/api/event/${eventId}/guest-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      const created = await res.json();
      setLists((prev) => [...prev, { ...created, guests: [] }]);
      setNewListName('');
      setCreateListOpen(false);
    }
  };

  const handleAddManualRows = () => setManualGuests((prev) => [...prev, { firstName: '', lastName: '', quantity: 1 }]);

  const handleManualChange = (idx: number, key: keyof (typeof manualGuests)[0], value: string | number) => {
    setManualGuests((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));
  };

  const handleRemoveManualRow = (idx: number) => {
    setManualGuests((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleAddGuests = async () => {
    if (!activeList || !eventId) return;
    if (guestTab === 'manual') {
      const newGuests = manualGuests
        .filter((g) => g.firstName.trim())
        .map((g) => ({
          firstName: g.firstName.trim(),
          lastName: g.lastName.trim(),
          quantity: Number(g.quantity) || 1
        }));
      if (!newGuests.length) return;
      const res = await fetchApi(`/api/event/${eventId}/guest-lists/${activeList.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuests)
      });
      if (res.ok) {
        const created = await res.json();
        setLists((prev) =>
          prev.map((list) =>
            list.id === activeList.id
              ? { ...list, guests: [...list.guests, ...created], updatedAt: new Date().toISOString() }
              : list,
          ),
        );
      }
    }
    setManualGuests([{ firstName: '', lastName: '', quantity: 1 }]);
    setAddGuestOpen(false);
  };

  const handleRemoveGuest = async (guestId: string) => {
    if (!activeList || !eventId) return;
    const res = await fetchApi(`/api/event/${eventId}/guest-lists/${activeList.id}/guests/${guestId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setLists((prev) =>
        prev.map((list) =>
          list.id === activeList.id
            ? { ...list, guests: list.guests.filter((g) => g.id !== guestId), updatedAt: new Date().toISOString() }
            : list,
        ),
      );
    }
  };

  const renderListCards = () => {
    if (!lists.length) {
      return (
        <div className="space-y-4">
          <div className="text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            LISTA DE CONVIDADOS (0)
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-[#111111] dark:shadow-none">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-[#1a1a1a] dark:text-zinc-300">
              <List className="w-7 h-7" />
            </div>
            <div className="mt-6 text-lg font-semibold text-zinc-900 dark:text-white">Ainda não há lista de convidados</div>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Uma vez criada, sua lista de convidados aparecerá aqui
            </p>
            <button
              className="mt-6 text-sm font-semibold text-[#7C3AED] transition-colors hover:text-[#6C2BD9] dark:text-[#A78BFA] dark:hover:text-[#C4B5FD]"
              onClick={() => setCreateListOpen(true)}
            >
              Adicionar lista de convidados
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-md:space-y-3">
        <div className="text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400 max-md:hidden">
          LISTA DE CONVIDADOS ({lists.length})
        </div>
        {lists.map((list) => {
          const checked = list.guests.reduce((acc, g) => acc + g.checkedIn, 0);
          const total = list.guests.reduce((acc, g) => acc + g.quantity, 0);
          const percentage = total ? Math.min(100, Math.round((checked / total) * 100)) : 0;
          const formattedUpdatedAt = new Intl.DateTimeFormat("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(list.updatedAt));

          return (
            <div
              key={list.id}
              className="flex items-center gap-6 max-md:gap-3 rounded-2xl max-md:rounded-xl border border-zinc-200 bg-white p-5 max-md:p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-[#17171a]"
            >
              <div className="flex-1 min-w-0">
                <div className="text-lg max-md:text-base font-semibold text-zinc-900 dark:text-white truncate">{list.name}</div>
                <button
                  className="mt-1 flex items-center gap-1 text-sm max-md:text-xs font-semibold text-[#7C3AED] transition-colors hover:text-[#5b21b6] dark:text-[#C4B5FD] dark:hover:text-white"
                  onClick={() => setSelectedListId(list.id)}
                >
                  Ver lista de convidados <span aria-hidden="true">&rarr;</span>
                </button>
                <div className="mt-1 text-xs max-md:text-[11px] text-zinc-500 dark:text-zinc-400 max-md:truncate">
                  Última alteração feita no dia {formattedUpdatedAt}
                </div>
              </div>
              <div className="flex items-center gap-4 max-md:gap-3">
                <div className="text-right">
                  <div className="text-xs max-md:text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Check-in
                  </div>
                  <div className="text-2xl max-md:text-xl font-semibold text-zinc-900 dark:text-white">
                    {checked} / {total}
                  </div>
                  <div className="mt-2 h-1.5 w-16 max-md:w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9F7AEA]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-10 max-md:h-9 max-md:w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-white"
                      aria-label="Ações da lista"
                    >
                      <MoreHorizontal className="w-5 h-5 max-md:w-4 max-md:h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 border-zinc-200 bg-white p-1 shadow-lg dark:border-[#1F1F1F] dark:bg-[#1f1f22]"
                  >
                    <DropdownMenuItem
                      onSelect={() => openEditListDialog(list)}
                      className="flex items-center gap-2 text-sm text-zinc-700 focus:bg-zinc-100 dark:text-zinc-200 dark:focus:bg-[#2a2a2f]"
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setListPendingDeletion(list)}
                      className="flex items-center gap-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-[#2a1d1d]"
                    >
                      <Trash2 className="h-4 w-4" /> Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const renderGuestTable = () => {
    if (!activeList) return null;
    const guests = activeList.guests;
    const hasGuests = guests.length > 0;

    if (!hasGuests) {
      return (
        <div className="rounded-2xl max-md:rounded-xl border border-zinc-200 bg-white p-12 max-md:p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
          <div className="flex flex-col items-center gap-3 text-center text-zinc-500 dark:text-zinc-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-600 dark:text-zinc-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-white">Ainda não há convidados</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Uma vez criados, seus convidados aparecerão aqui
            </p>
            <button
              className="text-sm font-semibold text-[#7C3AED] transition-colors hover:text-[#5b21b6] dark:text-[#C4B5FD] dark:hover:text-white max-md:hidden"
              onClick={() => setAddGuestOpen(true)}
            >
              Adicionar convidado
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Desktop Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-[#111111] max-md:hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-[#1f1f22] dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3 text-left">Nome</th>
                <th className="px-6 py-3 text-left">Sobrenome</th>
                <th className="px-6 py-3 text-left"># Convidados</th>
                <th className="px-6 py-3 text-left">Checked in</th>
                <th className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className="border-t border-zinc-100 text-zinc-900 dark:border-[#1f1f1f] dark:text-white">
                  <td className="px-6 py-3">{guest.firstName}</td>
                  <td className="px-6 py-3">{guest.lastName}</td>
                  <td className="px-6 py-3">{guest.quantity}</td>
                  <td className="px-6 py-3">
                    {guest.checkedIn} / {guest.quantity}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleRemoveGuest(guest.id)}
                      className="text-zinc-500 transition-colors hover:text-red-500 dark:text-zinc-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="hidden max-md:block space-y-3">
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#17171a]"
            >
              {/* Header: Nome completo + Ação */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
                    {guest.firstName} {guest.lastName}
                  </h3>
                </div>
                <button
                  onClick={() => handleRemoveGuest(guest.id)}
                  className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600 transition dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Convidados
                  </div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {guest.quantity}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Check-in
                  </div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {guest.checkedIn} / {guest.quantity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // Renderizar lista ou detalhes
  return activeList ? (
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
        title="Lista de Convidados"
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
      <SidebarMenu className="max-md:hidden" />
      {eventId && (
        <div className="max-md:hidden">
          <EventDetailsSidebar
            eventIdOverride={eventId || null}
            panelRoute={eventId ? `/event/manage/${eventId}` : undefined}
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
      {/* ... resto do código para detalhes da lista */}
    </div>
  ) : (
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
        title="Lista de Convidados"
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
            panelRoute={eventId ? `/event/manage/${eventId}` : undefined}
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

      {/* Mobile Header - Lista principal */}
      {!selectedListId && (
        <div className="hidden max-md:block sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0b0b0b]">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Lista de convidados</h1>
          </div>
        </div>
      )}

      <OrganizerLayout>
        <div
          style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }}
          className="flex flex-col pl-8 pr-8 max-md:pl-0 max-md:pr-0 min-h-screen relative"
        >
          <div className="mt-24 max-md:mt-4 max-w-[800px] mx-auto w-full space-y-6 max-md:space-y-4 pb-24 max-md:pb-20 max-md:px-4">
            {!selectedListId ? (
              <>
                {/* Desktop Header */}
                <div className="flex items-center justify-between max-md:hidden">
                  <h1 className="text-3xl font-bold text-indigo-950 dark:text-white">Lista de convidados</h1>
                  <Button onClick={() => setCreateListOpen(true)} className="bg-[#7C3AED] hover:bg-[#6C2BD9]">
                    <ListPlus className="w-4 h-4 mr-2" /> Nova lista de convidados
                  </Button>
                </div>

                {/* Mobile Floating Button */}
                <Button
                  onClick={() => setCreateListOpen(true)}
                  className="hidden max-md:flex fixed bottom-6 right-4 z-20 h-14 w-14 rounded-full bg-[#7C3AED] p-0 shadow-lg hover:bg-[#6C2BD9]"
                >
                  <Plus className="h-6 w-6" />
                </Button>

                {renderListCards()}
              </>
            ) : (
              <>
                {/* Mobile Header - Detalhes da lista */}
                <div className="hidden max-md:block sticky top-0 -mx-4 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0b0b0b]">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <button
                      onClick={() => setSelectedListId(null)}
                      className="flex items-center justify-center w-10 h-10 rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{activeList?.name}</h1>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {activeList?.guests.length || 0} convidados
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Header */}
                <button className="flex items-center gap-2 text-sm text-zinc-500 max-md:hidden" onClick={() => setSelectedListId(null)}>
                  <ArrowLeft className="w-4 h-4" /> Todas as listas de convidados
                </button>
                <div className="flex items-center justify-between max-md:hidden">
                  <div>
                    <h1 className="text-3xl font-bold text-indigo-950 dark:text-white">{activeList?.name}</h1>
                    <div className="text-xs font-semibold tracking-[0.3em] text-zinc-500 mt-2 dark:text-zinc-400">
                      CONVIDADOS ({activeList?.guests.length || 0})
                    </div>
                  </div>
                  <Button className="bg-[#7C3AED] hover:bg-[#6C2BD9]" onClick={() => setAddGuestOpen(true)}>
                    <Users className="w-4 h-4 mr-2" /> Adicionar convidado
                  </Button>
                </div>

                {/* Mobile Floating Button */}
                <Button
                  onClick={() => setAddGuestOpen(true)}
                  className="hidden max-md:flex fixed bottom-6 right-4 z-20 h-14 w-14 rounded-full bg-[#7C3AED] p-0 shadow-lg hover:bg-[#6C2BD9]"
                >
                  <Plus className="h-6 w-6" />
                </Button>

                {renderGuestTable()}
              </>
            )}
          </div>
        </div>
      </OrganizerLayout>

      <Dialog open={createListOpen} onOpenChange={setCreateListOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova lista de convidados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da lista (ex: Lista VIP)" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
            <p className="text-xs text-zinc-500">VocÃª poderÃ¡ adicionar convidados manualmente ou via CSV depois.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateListOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateList} className="bg-[#7C3AED] hover:bg-[#6C2BD9]">Criar lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingList}
        onOpenChange={(open) => {
          if (!open) {
            setEditingList(null);
            setEditingListName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-white">
              Atualizar uma lista de convidados
            </DialogTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Adicione participantes ao seu evento sem afetar a quantidade de ingressos disponíveis ou a capacidade do
              evento.
            </p>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              Nome da lista
            </label>
            <Input
              placeholder="Nome da lista"
              value={editingListName}
              onChange={(e) => setEditingListName(e.target.value)}
              className="border border-[#C4B5FD] bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-[#7C3AED] dark:border-[#7C3AED] dark:bg-[#18181b] dark:text-white"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="w-full border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-[#2b2b30] dark:bg-[#1d1d21] dark:text-white dark:hover:bg-[#27272f] sm:w-auto"
              onClick={() => {
                setEditingList(null);
                setEditingListName('');
              }}
            >
              Voltar
            </Button>
            <Button
              onClick={handleUpdateListName}
              className="w-full bg-[#7C3AED] hover:bg-[#6C2BD9] sm:w-auto"
              disabled={!editingListName.trim()}
            >
              Atualizar lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!listPendingDeletion}
        onOpenChange={(open) => {
          if (!open) {
            setListPendingDeletion(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Deletar lista</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-500">
            Tem certeza que deseja deletar{' '}
            <span className="font-semibold text-zinc-900 dark:text-white">{listPendingDeletion?.name}</span>? Essa ação
            não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListPendingDeletion(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteList} className="bg-red-600 hover:bg-red-700">
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addGuestOpen} onOpenChange={setAddGuestOpen}>
        <DialogContent className="sm:max-w-[720px] overflow-hidden border border-zinc-200 bg-white p-0 dark:border-[#1f1f22] dark:bg-[#0f0f10]">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-[#1f1f22]">
            <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Novos convidados</DialogTitle>
            <DialogClose className="rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-[#1c1c22] dark:hover:text-white">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <Tabs value={guestTab} onValueChange={(val) => setGuestTab(val as 'manual' | 'csv')} className="w-full">
            <TabsList className="flex gap-8 border-b border-zinc-200 px-6 text-sm font-medium text-zinc-500 dark:border-[#1f1f22] dark:text-zinc-400">
              <TabsTrigger
                value="manual"
                className="relative -mb-[1px] pb-3 data-[state=active]:text-[#7C3AED] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-[#7C3AED]"
              >
                Manualmente
              </TabsTrigger>
              <TabsTrigger
                value="csv"
                className="relative -mb-[1px] pb-3 data-[state=active]:text-[#7C3AED] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-[#7C3AED]"
              >
                Importar arquivo CSV
              </TabsTrigger>
            </TabsList>
            <div className="px-6 py-6">
              <TabsContent value="manual" className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-[#2a2a30] dark:bg-[#17171b]">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-[#24242a]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#7C3AED] dark:bg-[#1f1f24]">
                        <List className="h-4 w-4" />
                      </div>
                      Total de convidados: {manualTotalGuests}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {manualGuests.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_120px_40px]">
                        <Input
                          placeholder="Nome"
                          value={row.firstName}
                          onChange={(e) => handleManualChange(idx, 'firstName', e.target.value)}
                          className="h-11 rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-[#7C3AED] dark:border-[#2a2a30] dark:bg-[#1b1b20] dark:text-white"
                        />
                        <Input
                          placeholder="Sobrenome"
                          value={row.lastName}
                          onChange={(e) => handleManualChange(idx, 'lastName', e.target.value)}
                          className="h-11 rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-[#7C3AED] dark:border-[#2a2a30] dark:bg-[#1b1b20] dark:text-white"
                        />
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => handleManualChange(idx, 'quantity', Number(e.target.value))}
                          className="h-11 rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-[#7C3AED] dark:border-[#2a2a30] dark:bg-[#1b1b20] dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveManualRow(idx)}
                          disabled={manualGuests.length === 1}
                          className="flex h-11 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:text-zinc-600 dark:text-zinc-500 dark:disabled:text-zinc-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddManualRows}
                      className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[#7C3AED] text-[#7C3AED] transition hover:bg-[#7C3AED] hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="csv">
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-zinc-500 dark:border-[#2d2d33] dark:bg-[#141419] dark:text-zinc-300">
                  <div className="flex flex-col items-center gap-3">
                    <UploadCloud className="w-10 h-10 text-[#7C3AED]" />
                    <div className="text-sm">Arraste seu arquivo CSV aqui</div>
                    <button className="text-sm font-semibold text-[#7C3AED] hover:text-[#5b21b6] dark:text-[#C4B5FD]">
                      Baixe um modelo
                    </button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="border-t border-zinc-200 px-6 py-4 dark:border-[#1f1f22]">
            <Button
              variant="outline"
              onClick={() => setAddGuestOpen(false)}
              className="border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-[#2b2b30] dark:bg-[#17171b] dark:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddGuests}
              className="bg-[#7C3AED] hover:bg-[#6C2BD9]"
              disabled={guestTab === 'manual' ? !canSubmitManual : true}
            >
              {guestTab === 'manual'
                ? `Adicionar ${manualTotalGuests} convidado${manualTotalGuests === 1 ? '' : 's'}`
                : 'Adicionar convidados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  // Funções auxiliares movidas para dentro do componente


  // ...
}






