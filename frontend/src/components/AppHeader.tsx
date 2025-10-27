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
    const initials = (org?.name || label || '').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
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
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={`ml-1 ${orgHeaderTextClass}`}><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
          {error && (() => { try { toast.error('Erro ao carregar organizações'); } catch(e){}; return null; })()}
            {Array.from(new Map(orgs.map(o=> [o.id, o])).values()).map(o => {
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-600"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                try { addOrganization({ id: createdId, name: createdName, logoUrl: createdLogo }); } catch(_) {}
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

const AppHeader: React.FC = () => {
  // Theme toggle and notifications for AppHeader
  const { isDark } = useTheme();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifButtonRef = useRef<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; unread?: boolean }>>([
    { id: '1', text: 'Bem-vindo à Fauves!', unread: true },
    { id: '2', text: 'Seu perfil foi atualizado', unread: false },
  ]);
  const unreadCount = notifications.filter(n => n.unread).length;

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
  const navigate = useNavigate();
  const { user } = useAuth();
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
  // When a detail sidebar is present or we're inside event flow pages, lower the header z-index
  // so the sidebar can sit above the header and not be visually covered.
  const headerZ = (detailWidth > 0 || isEventFlow) ? 5 : 10;
  const headerTextClass = isDark ? 'text-white' : 'text-[#091747]';
  return (
    <div style={{ ...dynamicStyle, zIndex: headerZ, pointerEvents: 'auto' }} className={`flex absolute top-0 left-0 w-full items-center pr-5 py-4 bg-white dark:bg-[#0b0b0b] border-b border-solid border-zinc-100 dark:border-[#161616] h-[60px] max-md:relative max-md:flex-wrap max-md:gap-4 max-md:px-5 max-md:py-4 max-md:w-full max-sm:px-4 max-sm:py-2.5 transition-all duration-200`}>
      {/* Left: apenas seletor de organização (oculto quando existe sidebar de detalhe) */}
      <div className="flex items-center gap-4 flex-1 min-w-[240px]">
        {/* Hide organization selector when a detail sidebar exists or when we're inside event flows */}
        {detailWidth === 0 && !isEventFlow && <OrganizationDropdown />}
      </div>
      {/* Right: Criar evento + UserDropdown */}
      <div className="flex items-center gap-6 justify-end flex-1 min-w-[300px]">
        {/* 'Criar evento' placed to the left of the icon group so icons sit next to the user dropdown */}
        <div className={`text-sm font-bold ${headerTextClass} cursor-pointer hover:text-indigo-700 transition-colors`} onClick={() => navigate('/create-event')}>Criar evento</div>

        {/* Group icons to match spacing in Header.tsx */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="relative flex items-center gap-3">
            {/* Notifications button (match Header styling) */}
            <div className="relative">
              <button ref={notifButtonRef} aria-label="Notificações" className="relative w-10 h-10 rounded-full flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-[#EF4118]/20" onClick={() => setShowNotif(v => !v)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={headerTextClass}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.435L4 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white rounded-full bg-red-500">{unreadCount}</span>}
              </button>

              <div ref={notifRef} className={ 'absolute right-0 mt-2 w-72 bg-white dark:bg-[#242424] rounded-xl shadow-lg border border-zinc-100 dark:border-[#1F1F1F] z-50 flex flex-col text-slate-900 dark:text-white text-[14px] transition-all duration-200 ease-in-out ' + (showNotif ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none') } style={{ top: '40px' }}>
                <div className="px-4 py-3 border-b border-gray-100 font-bold">Notificações</div>
                <div className="max-h-48 overflow-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 ${n.unread ? 'bg-zinc-50' : ''} hover:opacity-90`}>{n.text}</div>
                  ))}
                </div>
                <div className="px-4 py-2 text-center text-sm border-t border-gray-100"><a href="/notifications" onClick={() => setShowNotif(false)} className="text-[#2A2AD7] font-bold">Ver todas</a></div>
              </div>
            </div>

            <UserDropdown userName={userName} userEmail={userEmail} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
