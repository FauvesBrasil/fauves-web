/**
 * IndexV2 – Clone fiel do Luma city-page com branding Fauves
 * 
 * Design tokens originais do Luma (luma.com):
 *   --max-width: 820px
 *   --font: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", Inter, Roboto, ...
 *   --white-thick-translucent: rgba(255,255,255,.867)
 *   --translucent-bg-color: rgba(255,255,255,.533)
 *   --backdrop-blur: blur(16px)
 *   --page-bg-color: #f7f8f9   (--gray-10)
 *   --primary-color: #131517   (--black)
 *   --card-bg-color: rgba(255,255,255,.8)
 *   --card-border-color: white
 *   --card-hover-border-color: rgba(19,21,23,.16)
 *   --font-weight-bold: 600
 *   --font-weight-medium: 500
 *   --font-size-xl: 1.25rem
 *   --large-border-radius: 1rem
 */

import { useSEO } from '@/hooks/useSEO';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import SubscribeControl from '@/components/v2/SubscribeControl';
import AppShell from '@/components/AppShell';
import { EventSidePanel } from '@/components/v2/EventSidePanel';
import EventImage from '@/components/EventImage';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useLocation } from '@/context/LocationContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper for Apple-style blue dot markers
const createBlueDotIcon = () => L.divIcon({
  className: 'luma-map-marker',
  html: `<div style="background-color: #2A2AD7; width: 10px; height: 10px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></div>`,
  iconSize: [15, 15],
  iconAnchor: [7.5, 7.5]
});

/* ─── LUMA DESIGN TOKENS ────────────────────────────────────────────────── */
const luma = {
  font: `-apple-system, BlinkMacSystemFont, "Apple Color Emoji", Inter, Roboto, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
  black: '#131517',
  gray10: '#f7f8f9',
  gray20: '#ebeced',
  gray30: '#dee0e2',
  gray60: '#939597',
  purple40: '#7b49ff',
  whiteThickTranslucent: 'rgba(255,255,255,.867)',
  whiteTranslucent: 'rgba(255,255,255,.533)',
  whiteOpacity25: 'rgba(255,255,255,.25)',
  blackOpacity8: 'rgba(19,21,23,.08)',
  blackOpacity16: 'rgba(19,21,23,.16)',
  backdropBlur: 'blur(16px)',
};

// Helper component to auto-center map on markers
const ChangeMapView = ({ markers }: { markers: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 250);
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
    }
    return () => clearTimeout(timer);
  }, [markers, map]);
  return null;
};

/* ─── MOCK DATA ─────────────────────────────────────────────────────────── */
const mockEvents = [
  {
    group: 'Hoje',
    weekday: 'sexta-feira',
    events: [
      {
        id: 'e1', time: '21:30',
        title: 'MouthGlow Experience',
        organizers: 'Por Fauves Produções',
        location: 'Marina Park Hotel',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&auto=format&q=80',
        attendees: 24, waitlist: false,
        avatars: ['https://i.pravatar.cc/32?img=1', 'https://i.pravatar.cc/32?img=2', 'https://i.pravatar.cc/32?img=3'],
      },
      {
        id: 'e2', time: '23:00',
        title: 'Sunset Beats Sessions',
        organizers: 'Por DJ Marcus & Crew',
        location: 'Praia do Futuro',
        image: 'https://images.unsplash.com/photo-1501386761578-eaa54b8910e2?w=200&h=200&fit=crop&auto=format&q=80',
        attendees: 124, waitlist: true,
        avatars: ['https://i.pravatar.cc/32?img=4', 'https://i.pravatar.cc/32?img=5', 'https://i.pravatar.cc/32?img=6', 'https://i.pravatar.cc/32?img=7'],
      },
    ],
  },
  {
    group: '28 de abr.',
    weekday: 'segunda-feira',
    events: [
      {
        id: 'e3', time: '23:59',
        title: 'Techno Underground Session',
        organizers: 'Por Complexo Armazém',
        location: 'Complexo Armazém, Fortaleza',
        image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=200&h=200&fit=crop&auto=format&q=80',
        attendees: 89, waitlist: false,
        avatars: ['https://i.pravatar.cc/32?img=8', 'https://i.pravatar.cc/32?img=9'],
      },
    ],
  },
  {
    group: '5 de mai.',
    weekday: 'terça-feira',
    events: [
      {
        id: 'e4', time: '20:30',
        title: 'Jazz Lounge Experience',
        organizers: 'Por Blue Note Fortaleza',
        location: 'The Blue Note Special, Meireles',
        image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=200&h=200&fit=crop&auto=format&q=80',
        attendees: 12, waitlist: false,
        avatars: ['https://i.pravatar.cc/32?img=10', 'https://i.pravatar.cc/32?img=11', 'https://i.pravatar.cc/32?img=12'],
      },
    ],
  },
];

/** Componente para detectar quando um elemento fica "sticky" */
const StickyDatePill = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [isStuck, setIsStuck] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setIsStuck(e.intersectionRatio < 1),
      { threshold: [1], rootMargin: '-11px 0px 0px 0px' }
    );
    const current = ref.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div ref={ref} className={`${className} ${isStuck ? 'stuck' : ''}`}>
      {children}
    </div>
  );
};

/* ─── TIMELINE EVENT CARD ───────────────────────────────────────────────── */
const TimelineEventCard = ({ event }: { event: any }) => {
  const { isDark } = useTheme();
  const textColor = isDark ? '#ffffff' : luma.black;
  const mutedTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(19, 21, 23, 0.5)';
  const subTextColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(19, 21, 23, 0.4)';
  const avatarBorderColor = isDark ? '#1e1f22' : '#fff';

  return (
    <div className="luma-card" style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ flex: 1, padding: '1rem 1.25rem', minWidth: 0 }}>
        <p style={{ fontSize: '0.9375rem', color: subTextColor, fontWeight: 400, marginBottom: '0.25rem' }}>{event.time}</p>
        <h3 style={{ fontSize: '20px', fontWeight: 600, color: textColor, lineHeight: 1.3, marginBottom: '0.5rem' }}>{event.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
          <span style={{ display: 'flex' }}>
            {event.organizerLogo ? (
              <img src={event.organizerLogo.startsWith('http') ? event.organizerLogo : apiUrl(event.organizerLogo)} alt="" style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${avatarBorderColor}`, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : luma.gray20, color: mutedTextColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                {event.organizers.charAt(0)}
              </div>
            )}
          </span>
          <span style={{ fontSize: '16px', color: mutedTextColor, fontWeight: 400 }}>Por {event.organizers}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: event.attendees > 0 ? '0.75rem' : 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={subTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 21s-8-7.5-8-12.5a8 8 0 1 1 16 0C20 13.5 12 21 12 21z" />
            <circle cx="12" cy="8.5" r="2.5" />
          </svg>
          <span style={{ fontSize: '16px', color: subTextColor, fontWeight: 400 }}>{event.location}</span>
        </div>
        {event.attendees > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {event.avatars.slice(0, 5).map((a: string, i: number) => (
                <img key={i} src={a} alt="" style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${avatarBorderColor}`, marginLeft: i > 0 ? '-5px' : 0, objectFit: 'cover' }} />
              ))}
            </span>
            {event.attendees > 5 && <span style={{ fontSize: '0.8125rem', color: subTextColor }}>+{event.attendees - 5}</span>}
          </div>
        )}
      </div>
      <div style={{ width: '100px', height: '100px', margin: '1rem', flexShrink: 0, borderRadius: '0.75rem', overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.05)' : luma.gray20 }}>
        <EventImage event={event} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    </div>
  );
};



/* ─── COMPONENT ──────────────────────────────────────────────────────────── */
const IndexV2 = () => {
  const { isDark } = useTheme();
  const { selectedUf } = useLocation();
  const locationLabel = selectedUf ? ` em ${selectedUf}` : ' em Fortaleza';
  const { user, logout } = useAuth();

  useSEO({
    title: `Eventos${locationLabel} · Fauves`,
    description: `Descubra os melhores eventos${locationLabel}.`
  });

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsPanelOpen(true);
  };

  // Fetching logic from Railway
  const fetchEventsPage = useCallback(async (page: number) => {
    const ufParam = selectedUf ? `&uf=${selectedUf}` : '&uf=CE'; // Default to CE for this landing
    const response = await fetchApi(`/events?page=${page}&limit=20${ufParam}&include=organization`);
    if (!response.ok) throw new Error('Failed to fetch events');
    const data = await response.json();
    return {
      items: data.events || data || [],
      hasMore: data.hasMore || false,
      total: data.total,
    };
  }, [selectedUf]);

  const {
    items: paginatedEvents,
    loading: loadingMore,
    hasMore,
    triggerRef,
    reset: resetPagination,
  } = useInfiniteScroll<any>({
    fetchPage: fetchEventsPage,
    pageSize: 20,
  });

  // ── GEOCODING ENGINE ───────────────────────────────────────────────────
  // Cache address -> coords to avoid repeated API calls
  const [geoCache, setGeoCache] = useState<Record<string, { lat: number, lng: number }>>(() => {
    try {
      const saved = localStorage.getItem('fauves_geo_cache_v1');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // Track geocoding in progress to avoid duplicate requests
  const pendingRequests = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('fauves_geo_cache_v1', JSON.stringify(geoCache));
  }, [geoCache]);

  useEffect(() => {
    const missing = paginatedEvents.filter(ev => {
      const hasCoords = (ev.locationLatitude && ev.locationLongitude) || (ev.latitude && ev.longitude);
      const addr = ev.location || ev.locationName || ev.venue;
      return !hasCoords && addr && !geoCache[addr] && !pendingRequests.current.has(addr);
    });

    if (missing.length === 0) return;

    // Process sequentially with delay to respect OSM rate limits (1 req/sec)
    let isMounted = true;
    const processMissing = async () => {
      for (const ev of missing) {
        if (!isMounted) break;
        const addr = ev.location || ev.locationName || ev.venue;
        if (!addr || geoCache[addr] || pendingRequests.current.has(addr)) continue;

        pendingRequests.current.add(addr);
        try {
          // Search with city context for better accuracy
          const query = `${addr}, ${ev.city || 'Fortaleza'}, ${ev.uf || 'CE'}, Brasil`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'FauvesPlatform/1.0' }
          });
          const data = await res.json();
          if (data && data[0]) {
            const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            if (isMounted) {
              setGeoCache(prev => ({ ...prev, [addr]: result }));
            }
          }
          // Delay to respect rate limit
          await new Promise(r => setTimeout(r, 1200));
        } catch (e) {
          console.error("Geocoding error for", addr, e);
        } finally {
          pendingRequests.current.delete(addr);
        }
      }
    };

    processMissing();
    return () => { isMounted = false; };
  }, [paginatedEvents, geoCache]);

  useEffect(() => {
    resetPagination();
  }, [selectedUf, resetPagination]);

  // 1. Map all events first with the resilient logic (DRY - keep it consistent)
  const allMappedEvents = useMemo(() => {
    const mapped = paginatedEvents.map(ev => {
      const d = new Date(ev.startDate);
      const addr = ev.location || ev.locationName || ev.venue;
      const cached = (addr && geoCache[addr]) ? geoCache[addr] : null;

      // Smart location formatting: "Place, City - UF"
      const place = ev.locationName || ev.venue || (ev.location && ev.location.split(',')[0]) || '';
      const city = ev.locationCity || ev.locationDetails?.city || ev.city || '';
      const uf = ev.locationUf || ev.locationDetails?.uf || ev.uf || '';

      let displayLocation = 'Local a definir';
      if (place && city && uf) displayLocation = `${place}, ${city} - ${uf}`;
      else if (place && city) displayLocation = `${place}, ${city}`;
      else if (city && uf) displayLocation = `${city} - ${uf}`;
      else if (place) displayLocation = place;
      else if (ev.location) displayLocation = ev.location.split(',')[0];

      return {
        id: ev.id || ev._id,
        slug: ev.slug,
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        title: ev.name,
        description: ev.description || ev.descriptionHtml || ev.content || ev.about || ev.info || ev.details || '',
        organizers: ev.organizer || ev.organizerName || ev.organizationName || ev.organization?.name || 'Organização',
        organizerLogo: ev.organizerLogo || ev.organizationLogo || ev.logo || ev.organization?.logoUrl || ev.organization?.logo || null,
        location: displayLocation,
        date: ev.startDate,
        isExternal: !!(ev.isExternal || ev.externalUrl || ev.external_url || ev.registrationUrl || ev.registration_url || ev.ticketUrl || ev.ticket_url || ev.link || ev.officialLink || ev.registrationType === 'external'),
        externalUrl: ev.externalUrl || ev.external_url || ev.registrationUrl || ev.registration_url || ev.ticketUrl || ev.ticket_url || ev.link || ev.officialLink || '',
        image: ev.bannerUrl || ev.banner || ev.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        attendees: Math.floor(Math.random() * 50),
        waitlist: false,
        avatars: ['https://i.pravatar.cc/32?img=1', 'https://i.pravatar.cc/32?img=2'],
        artists: ev.artists || [],
        category: ev.category || ev.type || ev.categoryName || 'Geral',
        fullLocation: ev.location || displayLocation,
        lat: ev.locationLatitude ? parseFloat(ev.locationLatitude) : (ev.latitude ? parseFloat(ev.latitude) : (ev.lat ? parseFloat(ev.lat) : (ev.locationDetails?.lat ? parseFloat(ev.locationDetails.lat) : (ev.locationDetails?.latitude ? parseFloat(ev.locationDetails.latitude) : (cached ? cached.lat : null))))),
        lng: ev.locationLongitude ? parseFloat(ev.locationLongitude) : (ev.longitude ? parseFloat(ev.longitude) : (ev.lng ? parseFloat(ev.lng) : (ev.locationDetails?.lng ? parseFloat(ev.locationDetails.lng) : (ev.locationDetails?.longitude ? parseFloat(ev.locationDetails.longitude) : (cached ? cached.lng : null)))))
      };
    });

    // Sort chronologically: Oldest (today) at the top (index 0), Future at the bottom
    return [...mapped].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [paginatedEvents]);

  // 2. De-duplicate
  const uniqueEvents = useMemo(() => {
    return Array.from(new Map(allMappedEvents.map(e => [e.id, e])).values());
  }, [allMappedEvents]);

  // 3. Group them for the timeline display
  const eventGroups = useMemo(() => {
    const map: Record<string, any> = {};
    const groups: any[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    uniqueEvents.forEach(ev => {
      const d = new Date(ev.date);
      const dateKey = d.toDateString();

      if (!map[dateKey]) {
        let groupName = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        if (dateKey === today.toDateString()) groupName = 'Hoje';
        else if (dateKey === tomorrow.toDateString()) groupName = 'Amanhã';

        map[dateKey] = {
          group: groupName,
          weekday: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
          events: []
        };
        groups.push(map[dateKey]);
      }
      map[dateKey].events.push(ev);
    });

    return groups;
  }, [uniqueEvents]);

  const currentIndex = useMemo(() => {
    if (!selectedEvent) return -1;
    return uniqueEvents.findIndex(ev => ev.id === selectedEvent.id);
  }, [selectedEvent, uniqueEvents]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < uniqueEvents.length - 1;

  const handleNext = useCallback(() => {
    if (hasNext) setSelectedEvent(uniqueEvents[currentIndex + 1]);
  }, [hasNext, currentIndex, uniqueEvents]);

  const handlePrev = useCallback(() => {
    if (hasPrev) setSelectedEvent(uniqueEvents[currentIndex - 1]);
  }, [hasPrev, currentIndex, uniqueEvents]);

  // Fetch full event details when an event is selected to get 'isExternal' and other detailed fields
  useEffect(() => {
    if (!selectedEvent?.id) return;

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const r = await fetch(apiUrl(`/api/event/${selectedEvent.id}`));
        if (r.ok) {
          const fullData = await r.json();
          console.log("DEBUG - Event full data:", fullData);
          if (isMounted) {
            // Update selected event with full data, preserving the mapped fields we already have
            setSelectedEvent(prev => {
              if (!prev) return prev;
              const fullId = fullData.id || fullData._id;
              if (prev.id !== fullId) return prev;

              // Apply same smart location logic on detailed data
              const place = fullData.locationName || fullData.venue || (fullData.location && fullData.location.split(',')[0]) || '';
              const city = fullData.locationCity || fullData.locationDetails?.city || fullData.city || '';
              const uf = fullData.locationUf || fullData.locationDetails?.uf || fullData.uf || '';

              let displayLocation = prev.location; // Keep what we had as fallback
              if (place && city && uf) displayLocation = `${place}, ${city} - ${uf}`;
              else if (place && city) displayLocation = `${place}, ${city}`;
              else if (city && uf) displayLocation = `${city} - ${uf}`;
              else if (place) displayLocation = place;

              // Very aggressive description detection
              const bestDescription = fullData.descriptionHtml || fullData.description || fullData.content || fullData.about || fullData.info || fullData.details || prev.description;

              return {
                ...prev,
                ...fullData,
                location: displayLocation,
                fullLocation: fullData.location || displayLocation,
                description: bestDescription,
                category: fullData.category || fullData.type || fullData.categoryName || prev.category,
                isExternal: !!(fullData.isExternal || fullData.externalUrl || fullData.external_url || fullData.registrationUrl || fullData.registration_url || fullData.ticketUrl || fullData.ticket_url || fullData.link || fullData.officialLink || fullData.registrationType === 'external'),
                externalUrl: fullData.externalUrl || fullData.external_url || fullData.registrationUrl || fullData.registration_url || fullData.ticketUrl || fullData.ticket_url || fullData.link || fullData.officialLink || ''
              };
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch event details", e);
      }
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [selectedEvent?.id]);

  return (
    <AppShell hideSearchOnMobile={false} noHeader={true} noFooter={true}>
      {/* ── Google Fonts + V2 scoped reset ──────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .luma-v2 * {
          font-family: ${luma.font};
          box-sizing: border-box;
        }
        .luma-v2 a { text-decoration: none; color: inherit; }

        /* LUX Button System from Luma */
        .lux-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          white-space: nowrap;
          position: relative;
          transition: all 0.2s ease;
          text-decoration: none;
          cursor: pointer;
          min-width: 0;
          width: fit-content;
        }

        .lux-button.small {
          --height: 32px;
          --padding: 0 1rem;
          --size: 0.875rem;
          height: var(--height);
          padding: var(--padding);
          font-size: var(--size);
        }

        .lux-button.round {
          border-radius: 50px; /* Estilo App iOS em vez de Pill */
        }

        .lux-button.light.solid {
          background-color: rgba(255, 255, 255, 0.2);
          backdrop-filter: ${luma.backdropBlur};
          -webkit-backdrop-filter: ${luma.backdropBlur};
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .lux-button.light.solid:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .lux-button .label {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Os estilos do Header (nav, luma-nav-link, lux-menu etc) agora residem no HeaderV2.tsx */

        /* Main Content Layout — Luma Standard */
        .main-content-wrapper {
          display: flex;
          flex-direction: row-reverse;
          gap: 3rem;
          margin: 0 auto;
          padding: 2.5rem 1rem 0;
          position: relative;
        }

        .zm-container {
          max-width: 900px; /* Acomodando card de ~595px + gap + sidebar */
          margin: 0 auto;
        }

        .right-panel {
          width: 260px;
          flex-shrink: 0;
          position: sticky;
          top: 2.5rem;
          align-self: flex-start; /* Garante que o sticky funcione em flex */
          height: fit-content;
        }

        .events.flex-1 {
          flex: 1;
          min-width: 595px; /* Card size conforme solicitado */
          position: relative;
        }

        /* Timeline Dashed Line */
        .events-list {
          position: relative;
          padding-left: 1.5rem;
        }
        .events-list::before {
          content: "";
          position: absolute;
          left: 4.5px;
          top: 0.75rem;
          bottom: 0;
          border-left: 1.5px dashed rgba(19,21,23,.12);
          z-index: 0;
        }
        
        .info-card .title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
          color: ${luma.black};
        }

        .info-card .desc {
          font-size: 1rem;
          color: rgba(19,21,23,.4);
          line-height: 1.4;
        }

        .discover-page-color-icon img {
          width: 48px;
          height: 48px;
        }

        /* Hero email input */
        .luma-hero-input {
          flex: 1;
          background: rgba(19,21,23,.2);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 50px; /* iOS Style */
          padding: 0.5rem 1rem;
          font-size: 1rem;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
          min-width: 0;
        }
        .luma-hero-input::placeholder { color: rgba(255,255,255,.4); }
        .luma-hero-input:focus { border-color: rgba(255,255,255,.5); }

        /* Hero subscribe button */
        .luma-hero-btn {
          background: ${luma.whiteThickTranslucent};
          backdrop-filter: ${luma.backdropBlur};
          -webkit-backdrop-filter: ${luma.backdropBlur};
          color: ${luma.black};
          font-weight: 600;
          font-size: 1rem;
          padding: 0.5rem 1.125rem;
          border-radius: 50px; /* iOS style */
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .luma-hero-btn:hover { background: rgba(255,255,255,.95); }

        /* Estilos de transição e mapas */
        .search-avatar {
          width: 24px;
          height: 24px;
          margin-right: 0.75rem;
        }
        .search-avatar.circle { border-radius: 50%; }

        /* Calendar mini-icon */
        .event-cal {
          width: 32px;
          height: 34px;
          border-radius: 6px;
          border: 1px solid rgba(19,21,23,.1);
          background: #fff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }
        .event-month {
          background: #f5f6f7;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 0;
          text-align: center;
          color: rgba(19,21,23,.4);
          border-bottom: 1px solid rgba(19,21,23,.05);
        }
        .event-date {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: #131517;
        }

        /* Event card */
        .luma-card {
          background: ${luma.whiteThickTranslucent};
          border: 1px solid rgba(255,255,255,1);
          border-radius: 12px; /* iOS style */
          display: flex;
          align-items: stretch;
          transition: border-color 0.2s cubic-bezier(.4,0,.2,1),
                      box-shadow 0.2s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
          text-decoration: none;
          cursor: pointer;
        }
        .luma-card:hover {
          border-color: ${luma.blackOpacity16};
          box-shadow: 0px 28px 17px rgba(0,0,0,.004),0px 12px 12px rgba(0,0,0,.01),0px 3px 7px rgba(0,0,0,.01);
        }

        /* Sidebar email input */
        .luma-sidebar-input {
          width: 100%;
          border: 1px solid ${luma.gray30};
          border-radius: 50px; /* iOS Style */
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          color: ${luma.black};
          outline: none;
          background: #fff;
          transition: border-color 0.2s;
        }
        .luma-sidebar-input::placeholder { color: rgba(19,21,23,.32); }
        .luma-sidebar-input:focus { border-color: ${luma.black}; }

        /* Sidebar subscribe button */
        .luma-sidebar-btn {
          width: 100%;
          background: #212325;
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 50px; /* iOS Style */
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .luma-sidebar-btn:hover { background: #333537; }

        /* Date section send-event button */
        .luma-send-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          border: 1px solid ${luma.blackOpacity16};
          border-radius: 10px; /* iOS-like */
          padding: 0.3125rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(19,21,23,.64);
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .luma-send-btn:hover { background: rgba(19,21,23,.04); }

        .luma-icon-btn {
          width: 2.125rem;
          height: 2.125rem;
          border-radius: 10px; /* iOS-like */
          border: 1px solid ${luma.blackOpacity16};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(19,21,23,.48);
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }
        .luma-icon-btn:hover { background: rgba(19,21,23,.04); }

        /* Luma Tooltip implementation */
        [data-tooltip] {
          position: relative;
        }
        [data-tooltip]::before {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%) translateY(5px);
          background: #131517;
          color: white;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          z-index: 1000;
        }
        /* Tooltip arrow */
        [data-tooltip]::after {
          content: "";
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%) translateY(5px);
          border: 6px solid transparent;
          border-top-color: #131517;
          opacity: 0;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          pointer-events: none;
          z-index: 1000;
        }
        [data-tooltip]:hover::before,
        [data-tooltip]:hover::after {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        /* Tooltip variant for top-edge elements (shows below) */
        .tooltip-bottom::before {
          bottom: auto !important;
          top: 125% !important;
          transform: translateX(-50%) translateY(-5px) !important;
        }
        .tooltip-bottom::after {
          bottom: auto !important;
          top: 110% !important;
          transform: translateX(-50%) translateY(-5px) !important;
          border-top-color: transparent !important;
          border-bottom-color: #131517 !important;
        }
        /* Notification Menu */
        .lux-menu-wrapper {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.2);
          overflow: visible;
        }
        .notification-container {
          min-height: 300px;
          padding: 2.5rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .empty-state h3 {
          margin: 1rem 0 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: rgba(19,21,23,.4);
        }
        .empty-state p {
          font-size: 0.9375rem;
          color: rgba(19,21,23,.3);
          line-height: 1.4;
        }
        .moon-icon {
          color: rgba(19,21,23,.2);
          display: flex;
          justify-content: center;
        }
        .lux-menu-arrow {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid rgba(255,255,255,0.85);
          top: -8px;
          right: 12px;
        }

        /* Waitlist pill */
        .luma-waitlist-pill {
          font-size: 0.75rem;
          font-weight: 500;
          color: #5b29df;
          background: rgba(104,47,255,.133);
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
        }

        /* Sticky Date Header */
        .luma-date-pill {
          position: sticky;
          top: 10px; /* Respiro do topo */
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.3125rem 1rem 0.3125rem 0.375rem;
          margin-left: -1.84375rem; /* Alinhamento milimétrico agora */
          background: transparent;
          border: 1px solid transparent;
          border-radius: 999px;
          transition: all 0.25s cubic-bezier(.4,0,.2,1);
        }

        .luma-date-pill.stuck {
          background: rgba(247, 248, 249, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }

        .luma-date-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(19,21,23,.25);
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .footer-nav-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(19,21,23,.4);
          transition: color 0.15s;
          text-decoration: none;
        }
        .footer-nav-link:hover {
          color: #131517;
        }

        /* Dark Theme Overrides */
        .luma-v2.dark {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .luma-v2.dark .luma-card {
          background: hsl(var(--card)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .luma-v2.dark .luma-card h3 {
          color: hsl(var(--foreground)) !important;
        }
        .luma-v2.dark .luma-card p,
        .luma-v2.dark .luma-card span {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .luma-v2.dark .luma-card svg {
          stroke: rgba(255, 255, 255, 0.4) !important;
        }
        .luma-v2.dark .luma-date-pill {
          color: hsl(var(--foreground)) !important;
        }
        .luma-v2.dark .luma-date-pill.stuck {
          background: rgba(19, 21, 23, 0.75) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .luma-v2.dark .luma-date-dot {
          background: rgba(255, 255, 255, 0.4) !important;
        }
        .luma-v2.dark .footer-nav-link {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .luma-v2.dark .footer-nav-link:hover {
          color: #ffffff !important;
        }
        .luma-v2.dark .tab:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        .luma-v2.dark .tab.selected {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .luma-v2.dark .info-card .title {
          color: #ffffff !important;
        }
        .luma-v2.dark .info-card .desc {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .luma-v2.dark .luma-sidebar-input {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .luma-v2.dark .luma-sidebar-input::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .luma-v2.dark .luma-sidebar-input:focus {
          border-color: #ffffff !important;
        }
        .luma-v2.dark .luma-sidebar-btn {
          background-color: #ffffff !important;
          color: #131517 !important;
        }
        .luma-v2.dark .luma-sidebar-btn:hover {
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
         .luma-v2.dark .events-list::before {
          border-left-color: rgba(255, 255, 255, 0.15) !important;
        }

        .luma-v2.dark .luma-send-btn {
          border-color: rgba(255, 255, 255, 0.25) !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }
        .luma-v2.dark .luma-send-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .luma-v2.dark .luma-icon-btn {
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .luma-v2.dark .luma-icon-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>

      <div className={`luma-v2 ${isDark ? 'dark dark-mode' : ''}`} style={{ minHeight: '100vh', background: isDark ? 'hsl(var(--background))' : luma.gray10, color: isDark ? 'hsl(var(--foreground))' : luma.black }}>

        {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
        <HeaderV2 transparent theme="dark" blueGlow={false} />

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        {/* Luma: full-bleed, height ~560px, city photo + dark left gradient */}
        <div style={{ position: 'relative', width: '100%', height: '700px', minHeight: '700px', maxHeight: '800px', overflow: 'hidden' }}>
          {/* City photograph */}
          <img
            src="https://pub-5d5ce29d165a4389942365032d7efda5.r2.dev/cidades/fortaleza.png"
            alt="Fortaleza, CE"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          {/*
            Luma gradient: dark left that fades to right.
            "from-black/75 via-black/55 to-black/10" 
          */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,.78) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.12) 100%)',
          }} />

          {/* Hero text content — Perfectly aligned with zm-container edge */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center',
            padding: '0 1.25rem',
          }}>
            <div data-header-align style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ maxWidth: '465px' }}> {/* Luma Info Box width */}

                {/* City icon — Circular background */}
                <div style={{
                  width: '3.25rem', height: '3.25rem', borderRadius: '40%', /* Squircle style */
                  background: 'rgba(255,255,255,.2)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-8-7.5-8-12.5a8 8 0 1 1 16 0C20 13.5 12 21 12 21z" />
                    <circle cx="12" cy="8.5" r="2.5" />
                  </svg>
                </div>

                {/* "O que está acontecendo em" */}
                <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '28px', fontWeight: 400, marginBottom: '0.25rem', lineHeight: 1.2 }}>
                  O que está acontecendo em
                </p>
                {/* City name — Luma Style */}
                <h1 style={{ color: '#fff', fontSize: '52px', fontWeight: 500, lineHeight: 1.1, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                  Fortaleza, CE
                </h1>

                {/* Description */}
                <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '16px', lineHeight: 1.5, marginBottom: '2rem' }}>
                  Em Fortaleza, os eventos vão de festas na beira-mar a encontros de tecnologia
                  e cultura. Encontre shows, meetups e experiências únicas da cidade.
                </p>

                {/* Email subscribe row */}
                <SubscribeControl scope="city:fortaleza-ce" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area — Following Luma DOM structure */}
        <div className="main-content-wrapper zm-container" style={{ paddingBottom: '100px' }}>

          {/* RIGHT PANEL (Sidebar) — Visually Right, DOM First */}
          <aside className="right-panel">
            <div className="info-card">
              <div className="discover-page-color-icon">
                <img src="https://images.lumacdn.com/discovery/rio-icon.png" alt="Icon" />
              </div>
              <div className="title">Fortaleza, CE</div>
              <div className="desc">
                Descubra os eventos mais quentes em Fortaleza e seja notificado de novos eventos antes que esgotem.
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <SubscribeControl scope="city:fortaleza-ce" compact />
              </div>
            </div>

            {/* Real Interactive Map Area - Now as a Button to Full Map */}
            <Link to="/map" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ marginTop: '1.5rem', borderRadius: '1rem', overflow: 'hidden', border: isDark ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${luma.gray20}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', cursor: 'pointer' }}>

                <div style={{ width: '260px', height: '260px', pointerEvents: 'none' }}>
                  {(() => {
                    const mapEvents = uniqueEvents.filter(e => e.lat && e.lng);

                    // Base Fortaleza coords if no events
                    let centerLat = -3.7319;
                    let centerLng = -38.5267;

                    if (mapEvents.length > 0) {
                      centerLat = mapEvents[0].lat;
                      centerLng = mapEvents[0].lng;
                    }

                    return (
                      <MapContainer
                        center={[centerLat, centerLng] as [number, number]}
                        zoom={12}
                        style={{ width: '100%', height: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                        dragging={false}
                        touchZoom={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                      >
                        <TileLayer
                          url={isDark 
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          }
                        />
                        <ChangeMapView markers={mapEvents.map(e => [e.lat, e.lng] as [number, number])} />
                        {mapEvents.map(e => (
                          <Marker
                            key={e.id}
                            position={[e.lat, e.lng] as [number, number]}
                            icon={createBlueDotIcon()}
                            eventHandlers={{
                              click: () => handleEventClick(e)
                            }}
                          />
                        ))}
                      </MapContainer>
                    );
                  })()}

                  {/* Floating Map Label */}
                  <div style={{
                    position: 'absolute', bottom: '52px', left: '12px', zIndex: 1000,
                    background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: 600, color: luma.black,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none'
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2A2AD7' }} />
                    {uniqueEvents.filter(e => e.lat && e.lng).length} Locais
                  </div>
                </div>
                <div style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${luma.gray20}`, background: '#fff', position: 'relative', zIndex: 1000 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="" style={{ width: 10, height: 10, opacity: 0.5 }} />
                    <span style={{ fontSize: '0.75rem', color: 'rgba(19,21,23,.6)', fontWeight: 600 }}>Mapas</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(19,21,23,.4)' }}>Legal</span>
                </div>
              </div>
            </Link>
          </aside>

          {/* EVENTS LIST (Left side visual) */}
          <div className="events flex-1">
            <div className="page-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: isDark ? '#ffffff' : luma.black, margin: 0 }}>Eventos</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="luma-send-btn" data-tooltip="Enviar um novo evento">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <line x1="5.5" y1="1" x2="5.5" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Enviar Evento
                </button>
                <button className="luma-icon-btn" data-tooltip="Feed RSS">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="6.18" cy="17.82" r="2.18" />
                    <path d="M4 11.64a9.36 9.36 0 0 1 9.36 9.36M4 5a17 17 0 0 1 17 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <button className="luma-icon-btn" data-tooltip="Buscar eventos">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Event groups */}
            <div className="events-list">
              {eventGroups.map((group, idx) => (
                <div key={idx} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  {/* Date header - Sticky Pill */}
                  <StickyDatePill className="luma-date-pill">
                    <span className="luma-date-dot" />
                    <span style={{ fontSize: '1rem', color: isDark ? '#ffffff' : luma.black }}>
                      <strong style={{ fontWeight: 600 }}>{group.group}</strong>
                      {' '}
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(19,21,23,.4)', fontWeight: 400 }}>{group.weekday}</span>
                    </span>
                  </StickyDatePill>

                  {/* Cards */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {group.events.map((ev: any) => (
                      <div key={ev.id} onClick={() => handleEventClick(ev)}>
                        <TimelineEventCard event={ev} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={triggerRef} style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <div style={{ color: 'rgba(19,21,23,.4)', fontSize: '0.875rem' }}>Carregando mais eventos...</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <FooterV2 maxWidth="980px" />

        {/* SearchModal agora reside no HeaderV2 */}
      </div>
      <EventSidePanel
        event={selectedEvent}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={hasNext}
        hasPrev={hasPrev}
      />
    </AppShell>
  );
};

export default IndexV2;
