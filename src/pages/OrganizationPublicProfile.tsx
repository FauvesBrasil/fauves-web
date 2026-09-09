import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiUrl, fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';
import HeaderV2 from '@/components/v2/HeaderV2';
import fauvesLogo from '@/assets/logo-fauves.svg';
import {
  Clock, MapPin, Rss, ArrowUpRight, Search, List, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Globe, Instagram, Linkedin, Twitter, Map as MapIcon
} from 'lucide-react';
import { useSEO, buildOrganizationJsonLd } from '@/hooks/useSEO';
import LoginModal from '@/components/LoginModal';
import CalendarPublicEventViews from '@/components/v2/CalendarPublicEventViews';
import CalendarEventSearchOverlay from '@/components/v2/CalendarEventSearchOverlay';
import CalendarIcalModal from '@/components/v2/CalendarIcalModal';
import CalendarAddEventMenu from '@/components/v2/CalendarAddEventMenu';
import CalendarExternalEventModal from '@/components/v2/CalendarExternalEventModal';
import { EventSidePanel } from '@/components/v2/EventSidePanel';
import LocationMapPreview from '@/components/v2/LocationMapPreview';
import { geocodeEventAddress, resolveEventAddress, resolveEventCoordinates } from '@/lib/eventLocation';

const CalendarMobileNav = ({ isDark, signedIn }: { isDark: boolean; signedIn: boolean }) => (
  <>
    <header className={`calendar-mobile-nav ${isDark ? 'is-dark' : 'is-light'}`}>
      <div className="calendar-mobile-nav-inner">
        <Link className="calendar-mobile-nav-logo" to="/" aria-label="Fauves">
          <img src={fauvesLogo} alt="Fauves" />
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/discover">Descobrir Eventos</Link>
          <Link className="calendar-mobile-nav-account" to={signedIn ? '/profile' : '/login'}>
            {signedIn ? 'Minha conta' : 'Entrar'}
          </Link>
        </nav>
      </div>
    </header>
    <style>{`
      .calendar-mobile-nav { display:none; }
      @media (max-width:820px) {
        .calendar-desktop-nav { display:none; }
        .calendar-mobile-nav { display:block; position:relative; z-index:40; height:52px; color:#fff; background:#131517; }
        .calendar-mobile-nav.is-light { color:#131517; background:#f7f8f9; }
        .calendar-mobile-nav-inner { display:flex; width:100%; height:52px; box-sizing:border-box; align-items:center; justify-content:space-between; padding:0 12px; }
        .calendar-mobile-nav-logo { display:flex; width:46px; height:28px; align-items:center; }
        .calendar-mobile-nav-logo img { display:block; width:46px; height:28px; object-fit:contain; }
        .calendar-mobile-nav nav { display:flex; align-items:center; gap:12px; }
        .calendar-mobile-nav nav a { color:inherit; text-decoration:none; font-size:13px; font-weight:600; line-height:1; white-space:nowrap; }
        .calendar-mobile-nav nav .calendar-mobile-nav-account { padding:9px 13px; border-radius:999px; background:rgba(255,255,255,.12); }
        .calendar-mobile-nav.is-light nav .calendar-mobile-nav-account { background:rgba(19,21,23,.08); }
      }
      @media (max-width:390px) {
        .calendar-mobile-nav nav { gap:8px; }
        .calendar-mobile-nav nav a { font-size:12px; }
      }
    `}</style>
  </>
);

// Helper to convert hex to HSL for dynamic theme-tinted backgrounds
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

const OrganizationPublicProfile: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const { isDark } = useTheme();

  const [org, setOrg] = React.useState<any | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState<string>('00:00');
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [following, setFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [hasCalendarAdminAccess, setHasCalendarAdminAccess] = React.useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [calendarViewMode, setCalendarViewMode] = React.useState<'cards' | 'list'>('cards');
  const [listFilter, setListFilter] = React.useState<'upcoming' | 'past'>('upcoming');
  const [showEventSearch, setShowEventSearch] = React.useState(false);
  const [showIcalModal, setShowIcalModal] = React.useState(false);
  const [externalEventToEdit, setExternalEventToEdit] = React.useState<any | null>(null);
  const [selectedPanelEvent, setSelectedPanelEvent] = React.useState<any | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);

  const selectedPanelIndex = React.useMemo(() => {
    if (!selectedPanelEvent) return -1;
    return events.findIndex((ev: any) => ev.id === selectedPanelEvent.id);
  }, [selectedPanelEvent, events]);

  const handleNext = React.useCallback(() => {
    if (selectedPanelIndex >= 0 && selectedPanelIndex < events.length - 1) {
      setSelectedPanelEvent(events[selectedPanelIndex + 1]);
    }
  }, [selectedPanelIndex, events]);

  const handlePrev = React.useCallback(() => {
    if (selectedPanelIndex > 0) {
      setSelectedPanelEvent(events[selectedPanelIndex - 1]);
    }
  }, [selectedPanelIndex, events]);
  const [mapGeoCache, setMapGeoCache] = React.useState<Record<string, { lat: number; lng: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('fauves_geo_cache_v1') || '{}'); } catch { return {}; }
  });

  // Time tracker in BRT
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      setCurrentTime(new Intl.DateTimeFormat('pt-BR', options).format(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // SEO updates
  useSEO({
    title: org ? org.name : undefined,
    description: org ? (org.bio || org.description || `Confira os eventos de ${org.name} na Fauves.`) : undefined,
    image: org?.logoUrl || org?.coverUrl || undefined,
    url: org ? `/${org.slug || org.id}` : undefined,
    type: 'profile',
    jsonLd: org ? buildOrganizationJsonLd(org) : undefined,
  });

  React.useEffect(() => {
    if (!slugOrId) return;
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
        const endpoint = !isUUID
          ? apiUrl(`/api/organization/slug/${encodeURIComponent(slugOrId.toLowerCase())}`)
          : apiUrl(`/api/organization/${encodeURIComponent(slugOrId)}`);

        let res = await fetch(endpoint);

        if (!res.ok && !isUUID && res.status === 404) {
          res = await fetch(apiUrl(`/api/organization/${encodeURIComponent(slugOrId)}`));
        }

        if (!mounted) return;
        if (!res.ok) {
          setError(`Erro HTTP ${res.status}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrg(data);

        // Fetch events
        try {
          const evRes = await fetch(apiUrl(`/api/organization/${data.id}/events`));
          if (evRes.ok) {
            const ev = await evRes.json();
            if (mounted) setEvents(ev || []);
          }
        } catch (e) {
          console.error('Error fetching events:', e);
        }

        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Erro desconhecido');
        setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [slugOrId]);

  React.useEffect(() => {
    if (!org?.id || !token) return;
    fetch(apiUrl(`/api/organization/${org.id}/follow`), { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && setFollowing(Boolean(data.following)))
      .catch(() => undefined);
  }, [org?.id, token]);

  const handleFollow = async () => {
    if (!user || !token) { setShowLoginModal(true); return; }
    if (!org?.id || followLoading) return;
    setFollowLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/organization/${org.id}/follow`), {
        method: following ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setFollowing(!following);
    } finally {
      setFollowLoading(false);
    }
  };

  const isCreator = React.useMemo(() => {
    if (!user || !org) return false;
    return user.id === org.createdBy;
  }, [user, org]);

  React.useEffect(() => {
    let active = true;
    setHasCalendarAdminAccess(false);
    if (!user || !token || !org?.id || isCreator) return () => { active = false; };

    fetchApi(`/api/organization/${org.id}/admins`)
      .then(async (response) => response.ok ? response.json() : [])
      .then((admins) => {
        if (!active) return;
        setHasCalendarAdminAccess(
          Array.isArray(admins) && admins.some((admin: any) =>
            admin?.isCurrentUser || admin?.userId === user.id,
          ),
        );
      })
      .catch(() => active && setHasCalendarAdminAccess(false));

    return () => { active = false; };
  }, [isCreator, org?.id, token, user]);

  const canManageCalendar = isCreator || hasCalendarAdminAccess;

  const refreshCalendarEvents = React.useCallback(async () => {
    if (!org?.id) return;
    const response = await fetchApi(`/api/organization/${org.id}/events`);
    if (!response.ok) return;
    const data = await response.json();
    setEvents(Array.isArray(data) ? data : []);
  }, [org?.id]);

  const openCalendarEvent = React.useCallback((event: any) => {
    const externalUrl = event?.externalUrl || event?.externalLink;
    if ((event?.isExternal || externalUrl) && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelectedPanelEvent(event);
    setIsPanelOpen(true);
  }, []);

  const removeExternalEvent = React.useCallback(async (event: any) => {
    const response = await fetchApi(`/api/event/${event.id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) {
      toast({ title: 'Não foi possível remover o evento', variant: 'destructive' });
      return;
    }
    await refreshCalendarEvents();
    toast({ title: 'Evento removido do calendário' });
  }, [refreshCalendarEvents, toast]);

  // Public calendars always use the Fauves interface palette. Organization and
  // event accent colors belong to event pages and must not tint this entire view.
  const themeColor = '#2A2AD7';
  const hsl = hexToHsl(themeColor);
  const pageBg = isDark ? '#131517' : '#f7f8f9';
  const cardBg = isDark ? '#1b1d1f' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(19, 21, 23, 0.08)';

  const textPrimary = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.50)' : 'rgba(0, 0, 0, 0.50)';
  const textBody = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  const themedControlBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 21, 23, 0.05)';

  // Filter events based on upcoming / past toggle + search query
  const filteredEvents = React.useMemo(() => {
    const now = new Date();
    return events.filter(ev => {
      const eventDate = new Date(ev.startDate);
      const matchesFilter = listFilter === 'upcoming' ? eventDate >= now : eventDate < now;
      const matchesSelectedDate = !selectedDate || (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
      return matchesFilter && matchesSelectedDate;
    }).sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return listFilter === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  }, [events, listFilter, selectedDate]);

  React.useEffect(() => {
    if (!events.length) return;
    let cancelled = false;
    const geocodeMissingEvents = async () => {
      const nextCache = { ...mapGeoCache };
      for (const event of events) {
        const address = resolveEventAddress(event);
        const coordinates = resolveEventCoordinates(event);
        if (!address || (coordinates.lat !== null && coordinates.lng !== null) || nextCache[address]) continue;
        try {
          const result = await geocodeEventAddress(event);
          if (result) nextCache[address] = result;
        } catch { /* o preview continua disponível para os demais eventos */ }
      }
      if (!cancelled) {
        setMapGeoCache(nextCache);
        localStorage.setItem('fauves_geo_cache_v1', JSON.stringify(nextCache));
      }
    };
    void geocodeMissingEvents();
    return () => { cancelled = true; };
    // O cache é lido no início da execução e atualizado em lote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const calendarMapEvents = React.useMemo(() => events.map((event) => {
    const address = resolveEventAddress(event);
    const cached = address ? mapGeoCache[address] : null;
    const coordinates = resolveEventCoordinates(event);
    return {
      id: event.id,
      lat: coordinates.lat ?? cached?.lat ?? Number.NaN,
      lng: coordinates.lng ?? cached?.lng ?? Number.NaN,
    };
  }).filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng)), [events, mapGeoCache]);

  const eventTags = React.useMemo(() => {
    const counts = new Map<string, number>();
    filteredEvents.forEach((event) => {
      const categoryNames = Array.isArray(event.categories)
        ? event.categories.map((category: any) => typeof category === 'string' ? category : category?.name)
        : [];
      const labels = [...new Set([event.category, ...categoryNames].filter(Boolean))] as string[];
      labels.forEach((label) => counts.set(label, (counts.get(label) || 0) + 1));
    });
    return [...counts.entries()].slice(0, 6);
  }, [filteredEvents]);

  // Generate calendar days for sidebar
  const calendarDays = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const days: { day: number; currentMonth: boolean; hasEvent: boolean; isSelected: boolean; isToday: boolean; date: Date }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevTotalDays - i;
      days.push({ day, currentMonth: false, hasEvent: false, isSelected: false, isToday: false, date: new Date(year, month - 1, day) });
    }

    for (let i = 1; i <= totalDays; i++) {
      const hasEvent = events.some(ev => {
        const evDate = new Date(ev.startDate);
        return evDate.getFullYear() === year && evDate.getMonth() === month && evDate.getDate() === i;
      });
      const date = new Date(year, month, i);
      const isSelected = Boolean(selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === i);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;
      days.push({ day: i, currentMonth: true, hasEvent, isSelected, isToday, date });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, hasEvent: false, isSelected: false, isToday: false, date: new Date(year, month + 1, i) });
    }

    return days;
  }, [currentDate, events, selectedDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDate(null);
  };

  const returnToCurrentMonth = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(null);
  };

  const selectCalendarDate = (date: Date) => {
    if (selectedDate?.toDateString() === date.toDateString()) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(date);
    setListFilter(date < new Date(new Date().setHours(0, 0, 0, 0)) ? 'past' : 'upcoming');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDark ? '#121416' : '#f7f8f9',
        color: isDark ? '#f5f5f5' : '#1c1e21',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div className="calendar-desktop-nav"><HeaderV2 transparent={true} theme={isDark ? 'dark' : 'light'} blueGlow={false} /></div>
        <CalendarMobileNav isDark={isDark} signedIn={Boolean(user)} />
        <div style={{ height: '70px' }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer { 0%, 100% { opacity: .45 } 50% { opacity: .85 } }
          .skeleton-pulse { animation: shimmer 1.5s infinite ease-in-out; background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}; border-radius: 8px; }
        ` }} />
        <div style={{ maxWidth: '1056px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Capa/Banner placeholder */}
          <div className="skeleton-pulse" style={{ width: '100%', height: '280px', borderRadius: '16px' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px' }} className="profile-cols">
            {/* Left Column (Events/Calendar list) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="skeleton-pulse" style={{ height: '24px', width: '120px' }} />
                <div className="skeleton-pulse" style={{ height: '34px', width: '150px' }} />
              </div>
              <div className="skeleton-pulse" style={{ height: '140px', width: '100%', borderRadius: '12px' }} />
              <div className="skeleton-pulse" style={{ height: '140px', width: '100%', borderRadius: '12px' }} />
              <div className="skeleton-pulse" style={{ height: '140px', width: '100%', borderRadius: '12px' }} />
            </div>
            
            {/* Right Column (Sidebar details) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton-pulse" style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
              <div className="skeleton-pulse" style={{ height: '28px', width: '180px' }} />
              <div className="skeleton-pulse" style={{ height: '16px', width: '120px' }} />
              <div className="skeleton-pulse" style={{ height: '60px', width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#040815',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Calendário indisponível</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>O calendário solicitado não foi encontrado.</p>
        <Link to="/" style={{
          padding: '12px 24px',
          background: '#ffffff',
          color: '#040815',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: 600
        }}>
          Voltar ao Início
        </Link>
      </div>
    );
  }

  return (
    <div className={`calendar-public-profile ${isDark ? 'is-dark' : 'is-light'}`} style={{
      background: pageBg,
      color: textPrimary,
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      paddingBottom: '6rem',
      position: 'relative'
    }}>
      {/* ── App Header ── */}
      <div className="calendar-desktop-nav"><HeaderV2 transparent={true} fixed={false} theme={isDark ? 'dark' : 'light'} blueGlow={false} scrollTransition={false} /></div>
      <CalendarMobileNav isDark={isDark} signedIn={Boolean(user)} />

      {/* A capa começa logo abaixo do header, como na referência pública. */}
      <div className="calendar-header-gap" style={{ height: 36 }} />

      <main className="calendar-profile-shell" style={{ maxWidth: 820, boxSizing: 'border-box', margin: '0 auto', padding: '24px 24px 0', position: 'relative', zIndex: 2 }}>
        
        {/* ── Banner/Cover Container ── */}
        <div className={`calendar-profile-cover ${org.coverUrl ? 'has-cover' : 'no-cover'}`} style={{
          width: '100%',
          aspectRatio: '3.5',
          borderRadius: 12,
          overflow: 'hidden',
          background: org.coverUrl 
            ? `url(${resolveImageUrl(org.coverUrl)}) center/cover` 
            : `linear-gradient(135deg, ${themeColor}22 0%, ${isDark ? '#0c101b' : '#e4ebf5'} 100%)`,
          position: 'relative',
          border: `1px solid ${cardBorder}`
        }}>
          <div className="calendar-profile-cover-overlay" style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)'
          }} />
        </div>

        {/* ── Logo & Action Buttons Overlapping Row ── */}
        <div data-header-align className="profile-inner profile-overlap-row" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '0 35px',
          marginTop: -52,
          position: 'relative',
          zIndex: 10
        }}>
          {/* Logo */}
          <div className="calendar-profile-avatar" style={{
            width: 104,
            height: 104,
            borderRadius: 14,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `4px solid ${pageBg}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            {org.logoUrl ? (
              <img
                src={resolveImageUrl(org.logoUrl)}
                alt={org.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#040815' }}>
                {(org.name || 'F')[0]}
              </div>
            )}
          </div>

          <div className="calendar-profile-primary-actions">
            {/* Gerenciar Button (Calendar admins only) */}
            {canManageCalendar && (
              <button
                onClick={() => navigate(`/calendar/manage/${org.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 36,
                  padding: '8px 17px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: `1px solid ${themeColor}`,
                  color: themeColor,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)',
                  marginBottom: 4
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.56)`;
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = themeColor;
                }}
              >
                Gerenciar <ArrowUpRight size={15} />
              </button>
            )}
            {!canManageCalendar && (
              <button
                type="button"
                disabled={followLoading}
                onClick={handleFollow}
                className="calendar-follow-button"
                style={{ background: following ? themedControlBg : themeColor, color: following ? textPrimary : '#fff' }}
              >
                {following ? 'Seguindo' : 'Seguir'}
              </button>
            )}
            <Link className="calendar-profile-map-action" to={`/${org.slug || org.id}/map`} aria-label={`Abrir mapa de eventos de ${org.name}`}>
              <MapIcon size={16} />
            </Link>
          </div>
        </div>

        {/* ── Brand Header block ── */}
        <div className="profile-inner calendar-profile-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginTop: 12, padding: '0 35px' }}>
          <div>
            {/* Title */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: textPrimary,
              letterSpacing: '-0.025em',
              margin: '8px 0 0 0'
            }}>
              {org.name}
            </h1>

            {/* Current Time / Timezone */}
            <div className="calendar-profile-time" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              color: textSecondary,
              fontSize: 13,
              fontWeight: 500
            }}>
              <Clock size={14} />
              <span>Horários em BRT — {currentTime}</span>
            </div>

            {(org.bio || org.description) && (
              <p className="calendar-profile-description" style={{ maxWidth: 760, margin: '14px 0 0', color: textBody, fontSize: 14, lineHeight: 1.5 }}>
                {org.bio || org.description}
              </p>
            )}

            {/* Social Icons row */}
            <div className="calendar-profile-socials" style={{ display: 'flex', gap: 16, marginTop: 14, alignItems: 'center' }}>
              {org.instagram && (
                <a
                  href={`https://instagram.com/${org.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-tooltip calendar-social-link"
                  data-tooltip={`Instagram: @${org.instagram.replace('@', '')}`}
                  style={{ color: textSecondary, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = textSecondary}
                >
                  <Instagram size={17} />
                </a>
              )}
              {org.x && (
                <a
                  href={org.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-tooltip calendar-social-link"
                  data-tooltip="X"
                  style={{ color: textSecondary, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = textSecondary}
                >
                  <Twitter size={17} />
                </a>
              )}
              {org.linkedin && (
                <a
                  href={org.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-tooltip calendar-social-link"
                  data-tooltip="LinkedIn"
                  style={{ color: textSecondary, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = textSecondary}
                >
                  <Linkedin size={17} />
                </a>
              )}
              {org.site && (
                <a
                  href={org.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-tooltip calendar-social-link"
                  data-tooltip={org.site}
                  style={{ color: textSecondary, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = textSecondary}
                >
                  <Globe size={17} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="calendar-profile-divider" style={{
          border: 'none',
          borderBottom: `1px solid ${cardBorder}`,
          width: '100vw',
          margin: '22px 0 26px calc(50% - 50vw)'
        }} />

        {/* ── Two Columns Main Layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: 40,
          padding: '0 35px'
        }} className="profile-cols profile-inner">
          
          {/* ── Left Column: Events ── */}
          <div>
            <div className="calendar-events-heading" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 12
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                Eventos
              </h2>

              {/* View Switches Toolbar */}
              <div className="calendar-view-actions">
                <div className="calendar-mobile-create-actions">
                  <CalendarAddEventMenu
                    organization={org}
                    user={user}
                    canManage={canManageCalendar}
                    accentColor={themeColor}
                    onCreateNew={() => navigate(`/create?organizationId=${org.id}`)}
                    onAdded={refreshCalendarEvents}
                  />
                  <button
                    onClick={() => setShowIcalModal(true)}
                    data-tooltip="Adicionar assinatura iCal"
                    aria-label="Adicionar assinatura iCal"
                    className="calendar-tooltip calendar-ical-trigger"
                  >
                    <Rss size={14} />
                  </button>
                </div>
                <div className="calendar-view-switch" data-view={calendarViewMode}>
                  <button type="button" aria-label="Visualização em calendário" data-tooltip="Calendário" onClick={() => setCalendarViewMode('cards')} className={`calendar-tooltip ${calendarViewMode === 'cards' ? 'is-active' : ''}`}><CalendarIcon size={16} /></button>
                  <button type="button" aria-label="Visualização em lista" data-tooltip="Lista" onClick={() => setCalendarViewMode('list')} className={`calendar-tooltip ${calendarViewMode === 'list' ? 'is-active' : ''}`}><List size={17} /></button>
                </div>
                <button type="button" aria-label="Buscar" data-tooltip="Buscar" className="calendar-tooltip calendar-search-trigger" onClick={() => setShowEventSearch(true)}><Search size={17} /></button>
              </div>
            </div>

            {eventTags.length > 0 && (
              <div className="calendar-location-tags">
                {eventTags.map(([label]) => <span key={label}>{label}</span>)}
              </div>
            )}

            <CalendarPublicEventViews
              key={calendarViewMode}
              events={filteredEvents}
              variant={calendarViewMode}
              organization={org}
              canManage={canManageCalendar}
              accentColor={themeColor}
              cardBackground={cardBg}
              cardBorder={cardBorder}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              onEventClick={openCalendarEvent}
              onManage={(event) => navigate(`/event/manage/${event.id}`)}
              onEditExternal={setExternalEventToEdit}
              onRemoveExternal={(event) => void removeExternalEvent(event)}
            />
          </div>

          {/* ── Right Column: Sidebar ── */}
          <aside className="calendar-profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Create Event Row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <CalendarAddEventMenu
                  organization={org}
                  user={user}
                  canManage={canManageCalendar}
                  accentColor={themeColor}
                  onCreateNew={() => navigate(`/create?organizationId=${org.id}`)}
                  onAdded={refreshCalendarEvents}
                />
                <button
                  onClick={() => setShowIcalModal(true)}
                  data-tooltip="Adicionar assinatura iCal"
                  className="calendar-tooltip calendar-ical-trigger"
                  style={{
                    width: 34,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: themedControlBg,
                    border: 'none',
                    color: textPrimary,
                    cursor: 'pointer'
                  }}
                >
                  <Rss size={14} />
                </button>
              </div>

            {/* ── Sidebar Component 1: Mini Calendar ── */}
            <div style={{
              background: isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.72)',
              border: `1px solid ${cardBorder}`,
              borderRadius: 14,
              padding: 14,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)'
            }}>
              
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    color: textPrimary,
                    letterSpacing: '-0.01em'
                  }}>
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: textSecondary }}>
                    {currentDate.getFullYear()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <button
                    type="button"
                    aria-label="Mês anterior"
                    onClick={() => changeMonth(-1)}
                    style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', borderRadius: 7, color: textSecondary, cursor: 'pointer', padding: 0 }}
                  >
                    <ChevronLeft size={14} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    aria-label="Voltar para o mês atual"
                    title="Mês atual"
                    onClick={returnToCurrentMonth}
                    style={{ width: 22, height: 26, display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', padding: 0 }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: themeColor }} />
                  </button>
                  <button
                    type="button"
                    aria-label="Próximo mês"
                    onClick={() => changeMonth(1)}
                    style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', borderRadius: 7, color: textSecondary, cursor: 'pointer', padding: 0 }}
                  >
                    <ChevronRight size={14} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: textSecondary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <span>D</span>
                <span>S</span>
                <span>T</span>
                <span>Q</span>
                <span>Q</span>
                <span>S</span>
                <span>S</span>
              </div>

              {/* Grid Days */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '3px 2px',
                textAlign: 'center'
              }}>
                {calendarDays.map((cell, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!cell.currentMonth}
                    aria-label={`Filtrar eventos de ${cell.date.toLocaleDateString('pt-BR')}`}
                    onClick={() => cell.currentMonth && selectCalendarDate(cell.date)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      minHeight: 29,
                      justifyContent: 'center',
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      color: 'inherit',
                      cursor: cell.currentMonth ? 'pointer' : 'default'
                    }}
                  >
                    <span style={{
                      fontSize: 11,
                      fontWeight: cell.isSelected || cell.isToday || cell.hasEvent ? '700' : '550',
                      color: !cell.currentMonth
                        ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.15)')
                        : cell.isSelected
                          ? '#ffffff'
                          : cell.isToday
                            ? themeColor
                            : cell.hasEvent
                              ? textPrimary
                              : textSecondary,
                      width: 27,
                      height: 27,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: cell.isSelected ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.20)` : 'transparent',
                      boxShadow: cell.isSelected ? `inset 0 0 0 1px ${themeColor}70` : 'none',
                    }}>
                      {cell.day}
                    </span>

                    {/* Indicator dot under day if there's an event */}
                    {cell.hasEvent && (
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: cell.isSelected ? '#ffffff' : textSecondary
                      }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Filter Tabs */}
              <div style={{
                display: 'flex',
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: 9,
                padding: 2,
                marginTop: 13,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)'}`
              }}>
                <button
                  onClick={() => { setListFilter('upcoming'); setSelectedDate(null); }}
                  style={{
                    flex: 1,
                    minHeight: 31,
                    padding: '5px 0',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 650,
                    background: listFilter === 'upcoming' ? (isDark ? themedControlBg : '#ffffff') : 'transparent',
                    color: listFilter === 'upcoming' ? textPrimary : textSecondary,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    boxShadow: 'none'
                  }}
                >
                  Próximos
                </button>
                <button
                  onClick={() => { setListFilter('past'); setSelectedDate(null); }}
                  style={{
                    flex: 1,
                    minHeight: 31,
                    padding: '5px 0',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 650,
                    background: listFilter === 'past' ? (isDark ? themedControlBg : '#ffffff') : 'transparent',
                    color: listFilter === 'past' ? textPrimary : textSecondary,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    boxShadow: 'none'
                  }}
                >
                  Passado
                </button>
              </div>

            </div>

            {/* ── Sidebar Component 2: Map preview ── */}
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: 8,
              position: 'relative',
              overflow: 'hidden',
              height: 170
            }}>
              <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <LocationMapPreview locations={calendarMapEvents} isDark={isDark} accent={themeColor} />
              </div>
              <Link
                to={`/${org.slug || org.id}/map`}
                aria-label={`Abrir mapa de eventos de ${org.name}`}
                style={{ position: 'absolute', inset: 0, zIndex: 20 }}
              />

            </div>

          </aside>

        </div>

      </main>

      <CalendarEventSearchOverlay
        open={showEventSearch}
        events={events}
        organization={org}
        canManage={canManageCalendar}
        onClose={() => setShowEventSearch(false)}
        onEventClick={(event) => { setShowEventSearch(false); openCalendarEvent(event); }}
        onManage={(event) => { setShowEventSearch(false); navigate(`/event/manage/${event.id}`); }}
      />

      <CalendarIcalModal
        open={showIcalModal}
        organization={org}
        onClose={() => setShowIcalModal(false)}
        onCopied={() => toast({ title: 'URL do calendário copiada!' })}
      />

      <CalendarExternalEventModal
        event={externalEventToEdit}
        onClose={() => setExternalEventToEdit(null)}
        onSaved={refreshCalendarEvents}
      />

      <EventSidePanel
        event={selectedPanelEvent}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedPanelIndex >= 0 && selectedPanelIndex < events.length - 1}
        hasPrev={selectedPanelIndex > 0}
      />

      {showLoginModal && (
        <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => {}} />
      )}

      {/* Styled animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .calendar-follow-button {
          min-width: 78px;
          margin-bottom: 8px;
          padding: 9px 16px;
          border: 0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: filter .16s ease, transform .16s ease;
        }
        .calendar-follow-button:hover { filter: brightness(1.1); }
        .calendar-follow-button:active { transform: translateY(1px); }
        .calendar-follow-button:disabled { opacity: .6; cursor: wait; }
        .calendar-profile-primary-actions { display:flex; align-items:center; gap:6px; }
        .calendar-profile-map-action { display:none; width:32px; height:32px; place-items:center; border-radius:8px; color:rgba(255,255,255,.58); background:rgba(255,255,255,.075); text-decoration:none; }
        .calendar-location-tags { display:flex; flex-wrap:wrap; gap:6px; margin:-8px 0 22px; }
        .calendar-location-tags span { padding:5px 10px; border:1px solid rgba(255,255,255,.12); border-radius:999px; color:rgba(255,255,255,.72); font-size:11px; font-weight:600; line-height:1; }
        .calendar-view-actions { display:flex; align-items:center; gap:8px; }
        .calendar-mobile-create-actions { display:none; align-items:center; gap:6px; }
        .calendar-view-switch { position:relative; display:flex; align-items:center; padding:3px; border-radius:9px; background:rgba(255,255,255,.075); }
        .calendar-view-switch:before { content:''; position:absolute; top:3px; left:3px; width:32px; height:29px; border-radius:7px; background:rgba(255,255,255,.16); transform:translateX(0); transition:transform .24s cubic-bezier(.2,.75,.25,1),background-color .2s ease; }
        .calendar-view-switch[data-view='list']:before { transform:translateX(32px); }
        .calendar-view-switch button, .calendar-search-trigger, .calendar-ical-trigger { display:grid; place-items:center; border:0; color:rgba(255,255,255,.52); cursor:pointer; }
        .calendar-view-switch button { position:relative; z-index:1; width:32px; height:29px; border-radius:7px; background:transparent; transition:color .2s ease,transform .18s cubic-bezier(.2,.75,.25,1); }
        .calendar-view-switch button:hover { color:rgba(255,255,255,.86); }
        .calendar-view-switch button:active { transform:scale(.88); }
        .calendar-view-switch button.is-active { color:#fff; }
        .calendar-search-trigger, .calendar-ical-trigger { width:34px; height:34px; border-radius:9px; background:rgba(255,255,255,.075); }
        .calendar-search-trigger, .calendar-ical-trigger, .calendar-add-event-button { transition:color .2s ease,background-color .2s ease,transform .18s cubic-bezier(.2,.75,.25,1) !important; }
        .calendar-search-trigger:hover, .calendar-ical-trigger:hover { color:#171819; background:rgba(255,255,255,.72) !important; }
        .calendar-search-trigger:active, .calendar-ical-trigger:active, .calendar-add-event-button:active { transform:scale(.95); }
        .calendar-add-event-button:hover { color:#171819 !important; background:rgba(255,255,255,.72) !important; }
        .calendar-tooltip { position:relative; }
        .calendar-tooltip:before { content:attr(data-tooltip); position:absolute; left:50%; bottom:calc(100% + 10px); z-index:80; width:max-content; max-width:240px; padding:7px 10px; border-radius:8px; color:#171819; background:rgba(255,255,255,.96); backdrop-filter:blur(10px); box-shadow:0 8px 24px rgba(0,0,0,.18); font-size:12px; font-weight:500; line-height:1.2; pointer-events:none; visibility:hidden; opacity:0; transform:translate(-50%,7px) scale(.94); transform-origin:50% 100%; transition:opacity .18s ease,transform .22s cubic-bezier(.2,.8,.25,1),visibility 0s linear .22s; }
        .calendar-tooltip:after { content:''; position:absolute; left:50%; bottom:calc(100% + 5px); z-index:81; border:5px solid transparent; border-top-color:rgba(255,255,255,.96); pointer-events:none; visibility:hidden; opacity:0; transform:translateX(-50%) translateY(3px); transition:opacity .16s ease,transform .2s cubic-bezier(.2,.8,.25,1),visibility 0s linear .22s; }
        .calendar-tooltip:hover:before, .calendar-tooltip:hover:after { visibility:visible; opacity:1; transition-delay:.1s; }
        .calendar-tooltip:hover:before { transform:translate(-50%,0) scale(1); }
        .calendar-tooltip:hover:after { transform:translateX(-50%) translateY(0); }
        .calendar-social-link:before { bottom:calc(100% + 12px); }
        .calendar-public-profile.is-light .calendar-location-tags span { border-color:rgba(19,21,23,.12); color:rgba(19,21,23,.62); }
        .calendar-public-profile.is-light .calendar-view-switch,
        .calendar-public-profile.is-light .calendar-search-trigger,
        .calendar-public-profile.is-light .calendar-ical-trigger { background:rgba(19,21,23,.055); }
        .calendar-public-profile.is-light .calendar-view-switch:before { background:#fff; box-shadow:0 1px 4px rgba(19,21,23,.12); }
        .calendar-public-profile.is-light .calendar-view-switch button,
        .calendar-public-profile.is-light .calendar-search-trigger,
        .calendar-public-profile.is-light .calendar-ical-trigger { color:rgba(19,21,23,.5); }
        .calendar-public-profile.is-light .calendar-view-switch button.is-active { color:#131517; }
        .calendar-public-profile.is-light .calendar-profile-avatar { border-color:rgba(19,21,23,.1) !important; }
        .calendar-public-profile.is-light .calendar-profile-map-action { color:rgba(19,21,23,.52); background:rgba(19,21,23,.055); }
        @media (max-width: 1100px) {
          .profile-cols {
            grid-template-columns: minmax(0, 1fr) 272px !important;
            gap: 28px !important;
          }
          .profile-inner {
            padding-left: 28px !important;
            padding-right: 28px !important;
          }
        }
        @media (max-width: 820px) {
          .calendar-header-gap { display:none; height:0 !important; }
          .calendar-profile-shell {
            width:100%;
            max-width:820px;
            box-sizing:border-box;
            padding:0 16px !important;
          }
          .profile-inner {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .profile-cols {
            width:100%;
            min-width:0;
            max-width:100%;
            box-sizing:border-box;
            grid-template-columns: 1fr !important;
            gap:16px !important;
            padding-top:16px !important;
          }
          .profile-cols > * { min-width:0; max-width:100%; }
          .calendar-profile-cover {
            display:block;
            width:100%;
            height:auto;
            min-height:0;
            aspect-ratio:3.5 !important;
            border:0 !important;
            border-radius:12px !important;
            background-position:center !important;
            background-repeat:no-repeat !important;
            background-size:cover !important;
          }
          .calendar-profile-cover.no-cover { display:none; }
          .calendar-profile-cover-overlay { display:none; }
          .profile-overlap-row { min-height:70px; margin-top:-28px !important; margin-bottom:16px; align-items:center !important; }
          .calendar-profile-cover.no-cover + .profile-overlap-row { margin-top:16px !important; }
          .calendar-profile-avatar {
            width:64px !important;
            height:64px !important;
            box-sizing:content-box;
            border:3px solid #131517 !important;
            border-radius:11px !important;
            box-shadow: none !important;
          }
          .calendar-public-profile.is-light .calendar-profile-avatar { border-color:#f7f8f9 !important; }
          .calendar-profile-avatar > div { font-size:1.5rem !important; }
          .calendar-follow-button { min-width:66px; min-height:30px; margin-bottom:0; padding:7px 13px; border-radius:8px; font-size:14px; }
          .calendar-profile-primary-actions > button { margin-bottom:0 !important; min-height:30px !important; padding:7px 12px !important; font-size:13px !important; }
          .calendar-profile-map-action { display:grid; }
          .calendar-profile-brand { margin-top:0 !important; gap:8px !important; }
          .calendar-profile-brand > div { width:100%; min-width:0; }
          .calendar-profile-brand h1 { max-width:100%; overflow-wrap:anywhere; font-size:24px !important; font-weight:600 !important; line-height:1.2; letter-spacing:-.02em !important; margin:0 !important; }
          .calendar-profile-time { gap:7px !important; margin-top:8px !important; font-size:14px !important; line-height:1.4; }
          .calendar-profile-time svg { width:16px; height:16px; }
          .calendar-profile-description { max-width:100% !important; margin-top:16px !important; font-size:14px !important; line-height:1.5 !important; }
          .calendar-profile-socials { gap:10px !important; margin-top:12px !important; }
          .calendar-profile-divider { margin-top:24px !important; margin-bottom:0 !important; }
          .calendar-events-heading { flex-wrap:nowrap !important; gap:8px !important; margin-bottom:16px !important; }
          .calendar-events-heading h2 { flex:0 0 auto; font-size:20px !important; font-weight:600 !important; }
          .calendar-view-actions { width:auto; min-width:0; margin-left:auto; justify-content:flex-end; gap:5px; }
          .calendar-mobile-create-actions { display:flex; min-width:0; }
          .calendar-mobile-create-actions .cae-root { flex:0 1 auto; }
          .calendar-mobile-create-actions .cae-main { width:auto; height:30px; padding:0 10px; font-size:12px; white-space:nowrap; }
          .calendar-view-switch { padding:2px; }
          .calendar-view-switch button { width:30px; height:26px; }
          .calendar-view-switch:before { top:2px; left:2px; width:30px; height:26px; }
          .calendar-view-switch[data-view='list']:before { transform:translateX(30px); }
          .calendar-search-trigger, .calendar-ical-trigger { width:30px; height:30px; flex:0 0 30px; }
          .calendar-location-tags { display:none; }
          .calendar-social-link { display:grid; width:28px; height:28px; place-items:center; margin:-5px 0; }
          .calendar-profile-sidebar { display:none !important; }
          .calendar-tooltip:before, .calendar-tooltip:after { display: none; }
        }
        @media (max-width: 390px) {
          .calendar-mobile-create-actions .calendar-ical-trigger { display:none; }
          .calendar-mobile-create-actions .cae-main { padding:0 8px; }
        }
        @media (max-width: 350px) {
          .calendar-profile-shell { padding-left:12px !important; padding-right:12px !important; }
          .calendar-events-heading { align-items:flex-start !important; flex-wrap:wrap !important; }
          .calendar-view-actions { width:100%; }
        }
      ` }} />
    </div>
  );
};

export default OrganizationPublicProfile;
