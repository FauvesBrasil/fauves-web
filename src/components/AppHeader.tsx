import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserDropdown from "@/components/UserDropdown";
import { useAuth } from "@/context/AuthContext";
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { useLocation } from 'react-router-dom';

import { useOrganization } from '@/context/OrganizationContext';
import { getFirstName } from '@/lib/user';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from '@/components/ui/sonner';
import RequireOrganization from './RequireOrganization';
import ProducerJourneyBadge from '@/components/ProducerJourneyBadge';
import { useFetchProducerJourney } from '@/hooks/useFetchProducerJourney';
import { fetchApi } from '@/lib/apiBase';

interface OrganizationOption { id: string; name: string; }

const OrganizationDropdown: React.FC = () => {
  const { isDark: orgIsDark } = useTheme();
  const orgHeaderTextClass = orgIsDark ? 'text-white' : 'text-[#091747]';
  const { orgs, selectedOrg, setSelectedOrgById, loading, error, refresh, addOrganization } = useOrganization();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
      if (panelRef.current && panelRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label = selectedOrg?.name || (loading ? 'Carregando...' : 'Organização');

  // Small avatar helper that shows the org logo if available, otherwise initials.
  const OrganizationAvatar: React.FC<{ org?: { id: string; name: string; logoUrl?: string } | null; sizeClass?: string }> = ({ org, sizeClass = 'w-8 h-8' }) => {
    const [errored, setErrored] = useState(false);
    useEffect(() => { setErrored(false); }, [org?.logoUrl]);
    if (loading) {
      return <div className={`${sizeClass} rounded-full bg-zinc-200 animate-pulse`} />;
    }
    if (org?.logoUrl && !errored) {
      return (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={org.logoUrl}
          onError={() => setErrored(true)}
          className={`${sizeClass} rounded-full object-cover`} />
      );
    }
    const initials = (org?.name || label || '').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div className={`${sizeClass} rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700`}>{initials}</div>
    );
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-[#F6F7F9] dark:bg-[#121212] rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-[#e9eaf0] dark:hover:bg-[#1A1A1A]"
      >
        <OrganizationAvatar org={selectedOrg} />
        <span className={`${orgHeaderTextClass} font-bold text-[15px] max-w-[140px] truncate`} title={label}>{loading ? 'Carregando...' : label}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={`ml-1 ${orgHeaderTextClass}`}><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div ref={panelRef} className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#242424] rounded-xl shadow-lg border border-blue-200 dark:border-[#1F1F1F] z-50 flex flex-col max-h-[320px] overflow-auto">
          <div className="px-5 pt-4 pb-2 text-[13px] font-semibold text-slate-500">Selecione a organização</div>
          {loading && (
            <div className="px-5 py-4 text-[14px] text-slate-500">Carregando...</div>
          )}
          {!loading && orgs.length === 0 && !error && (
            <div className="px-5 py-4 text-[14px] text-slate-500">Nenhuma organização</div>
          )}
          {error && (
            <div className="px-5 py-4 text-[13px] text-red-600">Erro: {error}</div>
          )}
          {/* fire a non-blocking toast on error once */}
          {error && (() => { try { toast.error('Erro ao carregar organizações'); } catch (e) { }; return null; })()}
          {Array.from(new Map(orgs.map(o => [o.id, o])).values()).map(o => {
            const active = selectedOrg?.id === o.id;
            return (
              <button
                key={o.id}
                className={`flex items-center gap-3 px-5 py-3 text-[14px] text-left hover:bg-blue-50 transition ${active ? 'bg-blue-50 font-semibold ' + orgHeaderTextClass : orgHeaderTextClass}`}
                onClick={() => { setSelectedOrgById(o.id); setOpen(false); }}
              >
                <OrganizationAvatar org={o} />
                <div className="flex-1 truncate" title={o.name}>{o.name}</div>
                {active && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-600"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </button>
            );
          })}
          <div className="border-t border-blue-100 mt-1" />
          <button
            className="flex items-center gap-2 px-5 py-3 text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-40"
            disabled={loading}
            onClick={() => {
              // close dropdown first, then open modal on next tick to avoid event/stacking conflicts
              setOpen(false);
              setTimeout(() => setShowCreateOrg(true), 0);
            }}
          >
            + Criar organização
          </button>
        </div>
      )}
      {/* Render the RequireOrganization modal outside the dropdown panel so it can mount
          even after the dropdown is closed. This avoids the case where setOpen(false)
          unmounts the panel before setShowCreateOrg(true) runs. */}
      {showCreateOrg && (
        <RequireOrganization
          onCreated={(org) => {
            // optimistic add to update dropdown immediately, then return refresh Promise so animation waits
            try {
              const createdObj = org?.organization || org || null;
              const createdId = createdObj?.id || createdObj?.organizationId || org?.id || org?.organizationId || null;
              const createdName = createdObj?.name || org?.name || '';
              const createdLogo = createdObj?.logoUrl || createdObj?.logo || org?.logoUrl || org?.logo || '';
              if (createdId) {
                try { addOrganization({ id: createdId, name: createdName, logoUrl: createdLogo }); } catch (_) { }
              }
            } catch (e) { /* ignore */ }
            try { return refresh(); } catch (e) { return Promise.resolve(); }
          }}
          onClose={() => setShowCreateOrg(false)}
        />
      )}
    </div>
  );
};

const AppHeader: React.FC<{ className?: string }> = ({ className }) => {
  // Theme toggle and notifications for AppHeader
  const { isDark } = useTheme();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifButtonRef = useRef<HTMLButtonElement | null>(null);

  // Notifications from API
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; link?: string; isRead?: boolean; createdAt?: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { selectedOrg } = useOrganization();

  // Fetch producer journey data
  const { data: journeyData, loading: loadingJourney } = useFetchProducerJourney(selectedOrg?.id);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target) && notifButtonRef.current && !notifButtonRef.current.contains(target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Load notifications from API
  useEffect(() => {
    if (!user?.id || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const loadNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.id, token]);

  // Mark notification as read
  const markAsRead = async (notifId: string) => {
    try {
      if (!token) return;

      await fetch(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const { totalLeft, detailWidth } = useLayoutOffsets();
  const location = useLocation();
  const pathname = location.pathname || '';
  const isEventFlow = [
    '/create-event',
    '/create-tickets',
    '/publish-details',
    '/painel-evento',
  ].some(p => pathname.startsWith(p));

  const userName = getFirstName(user) || 'Visitante';
  const userEmail = user?.email || "";

  const internalPad = 20;
  const dynamicStyle: React.CSSProperties = { paddingLeft: totalLeft + internalPad };

  // For panel-evento/analytics, the sidebar is fixedTop=0 (full height) and has zIndex=30.
  // The header (zIndex 10) will be visually behind the sidebar on the left.
  // However, we apply paddingLeft (totalLeft) to the header content, so the Org Selector (if visible)
  // would be right of the sidebar. But standard layout (SatisfactionSurvey) typically hides Org Selector
  // when a detail sidebar is present to reduce clutter.
  // We rely on default behavior: detailWidth > 0 -> HIDE Org Selector.
  const headerZ = 10;

  const headerTextClass = isDark ? 'text-white' : 'text-[#091747]';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [mobileMenuOpen]);
  return (
    <>
      <div style={{ ...dynamicStyle, zIndex: headerZ, pointerEvents: 'auto' }} className={`flex absolute top-0 left-0 w-full items-center pr-5 py-4 bg-white dark:bg-[#0b0b0b] border-b border-solid border-zinc-100 dark:border-[#161616] h-[60px] max-md:relative max-md:flex-wrap max-md:gap-4 max-md:px-5 max-md:py-4 max-md:w-full max-sm:hidden transition-all duration-200 ${className || ''}`}>
        {/* Left: apenas seletor de organização (oculto quando existe sidebar de detalhe) */}
        <div className="flex items-center gap-4 flex-1 min-w-[240px]">
          {/* mobile hamburger - visible only on small screens */}
          <button
            aria-label="Abrir menu"
            onClick={() => setMobileMenuOpen(true)}
            className="block md:hidden mr-2 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={headerTextClass}><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          {/* Hide organization selector when a detail sidebar exists or within creation flows */}
          {(detailWidth === 0 && !isEventFlow) && <OrganizationDropdown />}

          {/* Producer Journey Badge - always visible in organizer context unless sidebar present? */}
          {/* Standard behavior: hide if detail sidebar exists to keep header clean */}
          {(detailWidth === 0 && !isEventFlow) && <ProducerJourneyBadge {...journeyData} loading={loadingJourney} />}
        </div>
        {/* Right: Criar evento + UserDropdown */}
        <div className="flex items-center gap-6 justify-end flex-1 min-w-[300px]">
          {/* 'Criar evento' placed to the left of the icon group so icons sit next to the user dropdown */}
          <div className={`text-sm font-bold ${headerTextClass} cursor-pointer hover:text-indigo-700 transition-colors max-sm:hidden`} onClick={() => navigate('/create-event')}>Criar evento</div>

          {/* Group icons to match spacing in Header.tsx */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative flex items-center gap-3">
              {/* Notifications button (match Header styling) */}
              <div className="relative">
                <button ref={notifButtonRef} aria-label="Notificações" className="relative w-10 h-10 rounded-full flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-[#EF4118]/20" onClick={() => setShowNotif(v => !v)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={headerTextClass}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.435L4 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white rounded-full bg-red-500">{unreadCount}</span>}
                </button>

                <div ref={notifRef} className={'absolute right-0 mt-2 w-80 bg-white dark:bg-[#242424] rounded-xl shadow-lg border border-zinc-100 dark:border-[#1F1F1F] z-50 flex flex-col text-slate-900 dark:text-white text-[14px] transition-all duration-200 ease-in-out ' + (showNotif ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none')} style={{ top: '40px' }}>
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-[#333] font-bold flex items-center justify-between">
                    <span>Notificações</span>
                    {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} não lidas</span>}
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={'px-4 py-3 cursor-pointer transition-colors ' + (!n.isRead ? 'bg-indigo-50 dark:bg-indigo-900/20' : '') + ' hover:bg-gray-50 dark:hover:bg-[#333]'}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n.id);
                            if (n.link) {
                              setShowNotif(false);
                              window.location.href = n.link;
                            }
                          }}
                        >
                          <div className="font-semibold text-sm">{n.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 text-center text-sm border-t border-gray-100 dark:border-[#333]"><a href="/notifications" onClick={() => setShowNotif(false)} className="text-[#2A2AD7] font-bold">Ver todas</a></div>
                </div>
              </div>

              <UserDropdown userName={userName} userEmail={userEmail} />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile side drawer menu */}
      <div aria-hidden={!mobileMenuOpen} className={`fixed inset-0 z-40 ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0b0b0b] border-r dark:border-[#1F1F1F] shadow-lg transform transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} ref={mobileMenuRef}>
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-[#161616]">
            <div className="flex items-center gap-3">
              <img src="/assets/logo-square-fauves-blue.svg" alt="Fauves" className="w-8 h-8" />
              <div className={`font-bold ${headerTextClass}`}>Menu</div>
            </div>
            <button aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={headerTextClass}><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <nav className="p-4">
            {/* replicate core menu items from SidebarMenu */}
            <ul className="flex flex-col gap-2">
              <li><button className="w-full text-left px-3 py-2 rounded hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]" onClick={() => { setMobileMenuOpen(false); navigate('/organizer-dashboard'); }}>Painel</button></li>
              <li><button className="w-full text-left px-3 py-2 rounded hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]" onClick={() => { setMobileMenuOpen(false); navigate('/organizer-events'); }}>Eventos</button></li>
              <li><button className="w-full text-left px-3 py-2 rounded hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]" onClick={() => { setMobileMenuOpen(false); navigate('/organizer-orders'); }}>Pedidos</button></li>
              {/* Marketing page removed */}
              <li><button className="w-full text-left px-3 py-2 rounded hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]" onClick={() => { setMobileMenuOpen(false); navigate('/organizer-reports'); }}>Relatórios</button></li>
              <li><button className="w-full text-left px-3 py-2 rounded hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]" onClick={() => { setMobileMenuOpen(false); navigate('/organizer-finances'); }}>Finanças</button></li>
              <li><button className="w-full text-left px-3 py-2 rounded hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]" onClick={() => { setMobileMenuOpen(false); navigate('/organizer-settings'); }}>Ajustes</button></li>
            </ul>
          </nav>
        </div>
        {/* backdrop */}
        <div className={`fixed inset-0 bg-black/30 transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileMenuOpen(false)} />
      </div>
    </>
  );
};

export default AppHeader;
