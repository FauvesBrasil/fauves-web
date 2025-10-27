import * as React from 'react';
import { Link } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import LocationSelector from '@/components/LocationSelector';
import SearchBar from '@/components/SearchBar';
import { useState, useEffect, useRef } from 'react';
import { getFirstName, getDisplayName } from '@/lib/user';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import RequireOrganization from './RequireOrganization';
import { useOrganization } from '@/context/OrganizationContext';
import { fetchApi, apiUrl } from '@/lib/apiBase';

const Header: React.FC = () => {
  const { isDark } = useTheme();
  const headerTextClass = isDark ? 'text-white' : 'text-[#091747]';
  const headerIconClass = isDark ? 'text-white' : 'text-[#091747]';
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { refresh, addOrganization } = useOrganization();

  // Notifications state & refs
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userButtonRef = useRef<HTMLButtonElement | null>(null);

  // Placeholder notifications (replace with real API integration later)
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; unread?: boolean }>>([
    { id: '1', text: 'Seu evento foi aprovado', unread: true },
    { id: '2', text: 'Nova venda de ingresso', unread: true },
    { id: '3', text: 'Lembrete: evento amanhã', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target) && userButtonRef.current && !userButtonRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target) && notifButtonRef.current && !notifButtonRef.current.contains(target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // profile load (if needed) - placeholder: keep as-is
  useEffect(() => {
    // Optionally fetch profile info here
  }, [user]);

  function fullImageUrl(url: string) {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return apiUrl + url;
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      void e;
    }
    setIsLoggingOut(false);
  }

  return (
  <header className="w-full flex items-center bg-background px-4 py-2 border-b border-border dark:border-[#161616] justify-between" style={{ boxSizing: 'border-box' }}>
      <div className="flex items-center gap-4">
    <Link to="/" className="flex items-center" aria-label="Ir para início">
      <LogoFauves width={80} className={`cursor-pointer ${isDark ? 'logo-fauves-white' : 'logo-fauves-mono'}`} />
    </Link>

        <div className="flex items-center gap-4 ml-10">
          <LocationSelector />
          <SearchBar />
        </div>
      </div>

      <nav className="flex items-center gap-6 max-md:gap-4">
    <Link to="/" className="max-sm:hidden">
      <button className={`${headerTextClass} text-sm font-bold max-md:text-xs hover:text-[#EF4118] focus:text-[#EF4118] transition-colors`}>Explorar</button>
    </Link>

    <Link to="/create-event">
      <button className={`${headerTextClass} text-sm font-bold max-md:text-xs hover:text-[#EF4118] focus:text-[#EF4118] transition-colors`}>Criar evento</button>
    </Link>

        {/* Theme toggle + user area grouped so internal spacing matches (gap-3) */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          {user ? (
            <div className="relative flex items-center gap-3">
            <div className="relative">
              <button ref={notifButtonRef} aria-label="Notificações" className="relative w-10 h-10 rounded-full flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-[#EF4118]/20" onClick={() => setShowNotif(v => !v)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={headerIconClass}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.435L4 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white rounded-full bg-red-500">{unreadCount}</span>}
              </button>

              <div ref={notifRef} className={ 'absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg border border-border z-50 flex flex-col text-foreground text-[14px] transition-all duration-200 ease-in-out ' + (showNotif ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none') } style={{ top: '40px' }}>
                <div className="px-4 py-3 border-b border-gray-100 font-bold">Notificações</div>
                <div className="max-h-56 overflow-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={'px-4 py-3 ' + (n.unread ? 'bg-card' : 'bg-accent') + ' hover:opacity-90'}>{n.text}</div>
                  ))}
                </div>
                <div className="px-4 py-2 text-center text-sm border-t border-gray-100"><Link to="/notifications" onClick={() => setShowNotif(false)} className="text-[#2A2AD7] font-bold">Ver todas</Link></div>
              </div>
            </div>

            <div className="relative">
                  <button ref={userButtonRef} className="flex items-center gap-2 bg-card rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-card/90" onClick={() => setShowDropdown(v => !v)} aria-haspopup="true" aria-expanded={showDropdown ? 'true' : 'false'}>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profile && typeof profile.photoUrl === 'string' && profile.photoUrl.length > 0 ? (
                    <img src={fullImageUrl(profile.photoUrl)} alt="avatar" className="w-8 h-8 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <span className={`${headerTextClass} text-xs font-semibold`}>{(getDisplayName(user, profile as Record<string, unknown>) || '?').substring(0,1).toUpperCase()}</span>
                  )}
                </div>

                <span className={`${headerTextClass} font-bold text-[15px] max-sm:hidden`}>{getFirstName(user, profile) || ''}</span>

                <span className="relative w-5 h-5 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className={(showDropdown ? 'opacity-0 rotate-45 scale-75' : 'opacity-100 rotate-0 scale-100') + ' absolute transition-all duration-300 ease-in-out ' + headerIconClass} style={{ left: 0, top: 0 }}><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className={(showDropdown ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-75') + ' absolute transition-all duration-300 ease-in-out ' + headerIconClass} style={{ left: 0, top: 0 }}><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
              </button>

              <div ref={dropdownRef} className={ 'absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border border-border z-50 flex flex-col text-foreground text-[15px] font-bold transition-all duration-300 ease-in-out ' + (showDropdown ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none') + ' max-sm:fixed max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:rounded-none max-sm:mt-0 max-sm:h-screen max-sm:z-[9999] max-sm:top-[56px]' } style={{ top: undefined }}>
                <Link to="/organizer-dashboard" className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100" onClick={() => setShowDropdown(false)}>Gerenciar meus eventos</Link>
                <Link to="/profile" className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100" onClick={() => setShowDropdown(false)}>Ingressos (4)</Link>
                <Link to="/profile" className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100" onClick={() => setShowDropdown(false)}>Seguindo (2)</Link>
                <Link to="/account-settings" className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100 block" onClick={() => setShowDropdown(false)}>Configurações de conta</Link>
                <button className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100 rounded-b-xl text-[#EF4118]" onClick={handleLogout}>{isLoggingOut ? <span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 text-[#EF4118]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg><span className="ml-2">Saindo...</span></span> : 'Sair'}</button>
              </div>
            </div>
          </div>
        ) : (
          <button className="w-[68px] h-[33px] flex items-center justify-center bg-[#0205D3] rounded-[95px] hover:bg-[#2A2AD7] transition-colors max-sm:w-auto max-sm:px-4 max-sm:h-9" onClick={() => setShowLogin(true)}>
            <span className="text-white text-center text-[15px] font-bold">Entrar</span>
          </button>
        )}
        </div>
      </nav>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />

      {showCreateOrg && (
        <RequireOrganization onCreated={(org) => {
          try {
            const createdObj = org?.organization || org || null;
            const createdId = createdObj?.id || createdObj?.organizationId || org?.id || org?.organizationId || null;
            const createdName = createdObj?.name || org?.name || '';
            const createdLogo = createdObj?.logoUrl || createdObj?.logo || org?.logoUrl || org?.logo || '';
            if (createdId) { try { addOrganization({ id: createdId, name: createdName, logoUrl: createdLogo }); } catch (_: unknown) { void _; } }
          } catch (e) { void e; }
          try { return refresh(); } catch (e) { void e; return Promise.resolve(); }
        }} onClose={() => setShowCreateOrg(false)} />
      )}
    </header>
  );
};

export default Header;

