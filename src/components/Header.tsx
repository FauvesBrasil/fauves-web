import * as React from 'react';
import { Link } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import LocationSelector from '@/components/LocationSelector';
import SearchBar from '@/components/SearchBar';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFirstName, getDisplayName } from '@/lib/user';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import RequireOrganization from './RequireOrganization';
import { useOrganization } from '@/context/OrganizationContext';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import UserDropdown from '@/components/UserDropdown';

interface HeaderProps {
  hideSearchOnMobile?: boolean;
  hideSearchBar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ hideSearchOnMobile = true, hideSearchBar = false }) => {
  const { isDark } = useTheme();
  const headerTextClass = isDark ? 'text-white' : 'text-[#091747]';
  const headerIconClass = isDark ? 'text-white' : 'text-[#091747]';
  const { user, logout, token, loading: authLoading, isLoginModalOpen, openLoginModal } = useAuth();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [mobileSearchActive, setMobileSearchActive] = useState(false);
  const { refresh, addOrganization } = useOrganization();
  const [ticketsCount, setTicketsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Notifications state & refs
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifButtonRef = useRef<HTMLButtonElement | null>(null);

  // Notifications from API
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; link?: string; isRead?: boolean; createdAt?: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open login modal if ?login=true and user is not authenticated
  useEffect(() => {
    if (searchParams.get('login') === 'true' && !user && !authLoading) {
      const redirect = searchParams.get('redirect') || undefined;
      openLoginModal(redirect);
      
      // Clean up the URL after opening the modal
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('login');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, user, authLoading, setSearchParams, openLoginModal]);

  const redirectPath = searchParams.get('redirect') || undefined;

  // Load notifications from API
  useEffect(() => {
    if (!user?.id || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const loadNotifications = async () => {
      try {
        const res = await fetchApi('/api/notifications?limit=5', {
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
    // Refresh notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.id, token]);

  // Mark notification as read
  const markAsRead = async (notifId: string) => {
    try {
      if (!token) return;

      await fetchApi(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  // profile load (if needed) - placeholder: keep as-is
  const userName = getFirstName(user) || 'Visitante';
  const userEmail = user?.email || "";

  return (
    <header className="sticky top-0 z-[9999] w-full bg-background px-4 py-2 border-b border-border dark:border-[#161616] overflow-visible max-md:fixed max-md:left-0 max-md:right-0" style={{ boxSizing: 'border-box' }}>
      {/* Top row: logo + nav (compact) */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center" aria-label="Ir para início">
            <LogoFauves width={80} className={`cursor-pointer ${isDark ? 'logo-fauves-white' : 'logo-fauves-mono'}`} />
          </Link>

          {/* Desktop only: show selectors inline next to logo */}
          <div className="hidden md:flex items-center gap-4 ml-10">
            <LocationSelector />
            {!hideSearchBar && <SearchBar />}
          </div>
        </div>

        <nav className="flex items-center gap-6 max-md:gap-4">
          <Link to="/" className="max-sm:hidden">
            <button className={`${headerTextClass} text-sm font-bold max-md:text-xs hover:text-[#EF4118] focus:text-[#EF4118] transition-colors`}>Explorar</button>
          </Link>

          <Link to="/create-event" className="max-sm:hidden">
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={headerIconClass}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.435L4 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white rounded-full bg-red-500">{unreadCount}</span>}
                  </button>

                  <div
                    ref={notifRef}
                    className={
                      'fixed left-0 right-0 top-[64px] bottom-auto max-h-[80vh] bg-card shadow-lg border-b border-border z-40 flex flex-col text-foreground text-[14px] transition-all duration-200 ease-in-out overflow-hidden ' +
                      'md:absolute md:top-full md:left-auto md:right-0 md:bottom-auto md:w-80 md:mt-2 md:max-h-[500px] md:rounded-xl md:border md:shadow-xl ' +
                      (showNotif ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none')
                    }
                  >
                    <div className="px-4 py-3 border-b border-border font-bold flex items-center justify-between bg-card shrink-0">
                      <span>Notificações</span>
                      {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} não lidas</span>}
                    </div>

                    <div className="overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                          Nenhuma notificação
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {notifications.map(n => (
                            <div
                              key={n.id}
                              className={'px-4 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-0 ' + (!n.isRead ? 'bg-accent/50' : 'bg-card') + ' hover:bg-accent/30'}
                              onClick={() => {
                                if (!n.isRead) markAsRead(n.id);
                                if (n.link) {
                                  setShowNotif(false);
                                  window.location.href = n.link;
                                }
                              }}
                            >
                              <div className="font-semibold text-sm mb-0.5">{n.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-2.5 text-center text-sm border-t border-border bg-muted/30 shrink-0">
                      <Link to="/notifications" onClick={() => setShowNotif(false)} className="text-[#2A2AD7] dark:text-[#4D4DFF] font-bold hover:underline">
                        Ver todas
                      </Link>
                    </div>
                  </div>
                </div>

                <UserDropdown 
                  userName={userName} 
                  userEmail={userEmail} 
                  ticketsCount={ticketsCount} 
                />
              </div>
            ) : (
              <button className="w-[68px] h-[33px] flex items-center justify-center bg-[#0205D3] rounded-[95px] hover:bg-[#2A2AD7] transition-colors max-sm:w-auto max-sm:px-4 max-sm:h-9" onClick={() => openLoginModal()}>
                <span className="text-white text-center text-[15px] font-bold">Entrar</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Divider + second row: Location selector and SearchBar (mobile only) */}
      {!hideSearchOnMobile && !hideSearchBar && (
        <div className="hidden max-sm:block w-full border-t border-border dark:border-[#161616] mt-2 pt-3">
          <div className="flex items-center gap-4 px-[0px]">
            <div className={`transition-all duration-200 ease-in-out flex-shrink-0 overflow-visible ${mobileSearchActive ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none' : 'max-w-[220px] opacity-100 translate-x-0'}`}>
              <div className="w-full">
                <LocationSelector mobile />
              </div>
            </div>
            <div className="flex-1 transition-all duration-200 transform" style={{ transform: mobileSearchActive ? 'scaleX(1.02)' : 'none' }}>
              <SearchBar mobile onMobileFocus={() => setMobileSearchActive(true)} onMobileBlur={() => setMobileSearchActive(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Global LoginModal is now rendered in App.tsx */}

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

