import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { List, Map as MapIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventSidePanel } from '@/components/v2/EventSidePanel';

// --- SVGS ---
const FAUVES_LOGO_SVG = (
  <svg width="60" height="26" viewBox="0 0 433 193" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M400.02 0L193.58 39.17L8.25 21.16L0 155.85L66.59 192.63L275.45 149.58L413.61 147.7L432.36 110.75L400.02 0ZM33.62 61.11C33.62 60.83 33.74 60.32 34.84 60.17C39.86 59.51 57.94 57.11 64.61 56.23C73.17 55.1 98.84 51.7 98.84 51.7L100.26 70.34L36.69 83.3L33.61 61.1L33.62 61.11ZM73.66 143.89L44.08 149.48C42.52 136.28 40.37 115.56 38.45 96.6C38.45 96.6 89.51 89.14 96.56 87.77C97.35 91.73 97.62 99 97.62 99C83.45 102.47 82.71 102.76 71.4 104.73C73.03 118.25 73.75 128.08 75.35 141.71C75.48 142.77 74.72 143.75 73.66 143.88V143.89ZM145.86 146.45C145.03 146.55 144.26 146.01 144.05 145.2C141.63 135.71 133.25 108.48 133.25 108.48C127.5 108.36 123.68 108.48 117.73 108.57C116.65 114.89 114.56 126.44 112.9 135.74L96.57 139.09C101.36 117.12 107.9 88.22 112.43 67.26C112.56 66.79 113.18 65.39 115.96 65.45L142.63 66.04C145.59 75.11 148.49 84.12 151.45 93.12C155.76 106.19 164.03 129.17 168.27 142.27L145.87 146.44L145.86 146.45ZM202.38 132.1C173.03 138.02 171.32 113.85 168.73 100.19C166.95 90.77 162.19 66.54 162.19 66.54C162.19 66.54 176.74 66.99 177.61 66.97C178.49 66.95 179.26 67.56 179.43 68.42C180.09 71.6 182.21 83.45 184.77 96.93C188.01 114.05 190.93 121.8 200.78 120.05C212.32 118 210.84 108.45 208.46 93.17C207.2 85.12 205.5 75.59 204.32 69.16L202.94 61.72L216.81 57.82L228.65 118.76C228.65 118.76 218.95 128.76 202.39 132.11L202.38 132.1ZM264.34 128.88L246.55 130.49C246.55 130.49 231.36 62.26 229.54 54.1L238.89 51.42C239.67 51.46 240.32 52.04 240.44 52.81C240.66 54.25 252.19 110.76 252.26 111.12C252.31 110.76 262.21 54.67 262.35 53.23C262.43 52.45 263.05 51.84 263.83 51.76L278.8 50.25C277.4 58.49 264.33 128.87 264.33 128.87L264.34 128.88ZM288.09 49.09C302.08 48.11 320.88 45.85 335.39 44.83L334.1 58.23C333.97 58.84 333.48 59.86 331.7 60.28L288.09 70.69C287.81 61.18 288.17 50.21 288.09 49.09ZM331.34 93L291.03 95.67L289.94 79.17L330.25 76.5L331.34 93ZM290.38 126.85C290.38 126.85 290.2 118.23 289.94 105.25C289.94 105.25 330.8 107.29 337.64 106.64C338.49 106.56 339.26 107.38 339.4 108.54L341 121.92C326 123.37 305.99 125.35 290.39 126.85H290.38ZM374.8 132.63L354.29 118.74C364.12 106.85 369.51 97.63 363.01 91.75C346.71 77.01 345.8 71.07 345.55 62.91C344.99 44.43 361.24 31.32 361.24 31.32L380.21 38.61C380.56 38.76 381.42 39.25 380.48 40.11H380.5C359.39 59.01 370.82 71.14 370.82 71.14C382.47 84.06 389.29 83.73 389.29 97.25C389.29 109.4 376.66 130.37 374.82 132.63H374.8Z" fill="currentColor" />
  </svg>
);

// --- STYLES ---
const LumaStyle = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
    .tint-root {
      --primary-color: #131517;
      --secondary-color: #737577;
      --tertiary-color-alpha: rgba(115, 117, 119, 0.6);
      --divider-color: #ebeced;
      --brand-color: #f31a7c;
      --white: #fff;
      --white-thick-translucent: rgba(255, 255, 255, 0.8);
      --backdrop-blur: blur(12px);
    }
    
    .tint-root.dark {
      --primary-color: #ffffff;
      --secondary-color: #939597;
      --tertiary-color-alpha: rgba(255, 255, 255, 0.4);
      --divider-color: #2b2c30;
      --white: #131517;
      --white-thick-translucent: rgba(19, 21, 23, 0.8);
    }
    
    .tint-root.dark .date-header {
      background: var(--white) !important;
    }
    .tint-root.dark .date-header.stuck {
      background: var(--white-thick-translucent) !important;
    }
    .tint-root.dark .date-header .date {
      color: var(--primary-color) !important;
    }
    .tint-root.dark .date-header .weekday {
      color: var(--secondary-color) !important;
    }
    .tint-root.dark .event-row:hover {
      background: rgba(255, 255, 255, 0.04) !important;
    }
    .tint-root.dark .event-row.active {
      background: rgba(243, 26, 124, 0.15) !important;
    }
    .tint-root.dark .cover-image {
      background: rgba(255, 255, 255, 0.05) !important;
    }
    .tint-root.dark .event-title h3 {
      color: var(--primary-color) !important;
    }
    .tint-root.dark .event-time,
    .tint-root.dark .info {
      color: var(--secondary-color) !important;
    }
    .tint-root.dark .map-inner {
      background: #1c1c1e !important;
    }
    .tint-root.dark header {
      border-bottom-color: var(--divider-color) !important;
      background: var(--white) !important;
    }
    .tint-root.dark header a {
      color: var(--primary-color) !important;
    }
    .tint-root.dark header .gap-2 {
      background: rgba(255, 255, 255, 0.08) !important;
      color: var(--primary-color) !important;
    }

    
    .map-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background: var(--white);
    }

    header {
      padding: 0.5rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      flex-shrink: 0;
    }

    .flex-center { display: flex; align-items: center; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .fw-medium { font-weight: 500; }
    .text-ellipses { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .content { flex: 1; display: flex; overflow: hidden; position: relative; }
    
    .events-panel {
      width: 420px;
      height: 100%;
      border-right: 1px solid var(--divider-color);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .left-content { 
      flex: 1; 
      overflow-y: auto; 
      padding-bottom: 2rem; 
      position: relative;
      scrollbar-width: thin;
      scrollbar-color: rgba(0,0,0,0.1) transparent;
    }
    
    .left-content::-webkit-scrollbar {
      width: 4px;
    }
    .left-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .left-content::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
    }
    .left-content:hover::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
    }
    
    .section { position: relative; }
    
    .date-header {
      padding: .5rem 1rem;
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 10;
      transition: all 0.2s ease;
      border-bottom: 1px solid var(--divider-color);
    }
    .date-header.stuck {
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: .5rem 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .date-header .date { font-size: 1rem; font-weight: 600; color: #131517; }
    .date-header .weekday { font-size: 1rem; color: #737577; text-transform: lowercase; }

    .event-row {
      display: flex;
      padding: 0.75rem 1.25rem;
      gap: 1rem;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
    }
    .event-row:hover { background: #f7f8f9; }
    .event-row.active { background: #f4f3fe; }

    .cover-image {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f7f8f9;
    }
    .cover-image img { width: 100%; height: 100%; object-fit: cover; }

    .event-title h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0.25rem 0;
      line-height: 1.2;
      color: #131517;
    }

    .event-time { font-size: 0.8125rem; color: #737577; margin-bottom: 0.125rem; }
    .info { font-size: 0.8125rem; color: #737577; }
    
    .mapview { flex: 1; height: 100%; position: relative; }
    .map-inner { position: absolute; top: 0; left: 0; right: 0.75rem; bottom: 0.75rem; border-radius: 16px; overflow: hidden; background: #f9f5ed; border: 1px solid var(--divider-color); }

    .map-view-switch {
      display: none;
      align-items: center;
      gap: 2px;
      padding: 2px;
      border-radius: 10px;
      background: rgba(19, 21, 23, 0.07);
    }
    .map-view-switch button {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 8px;
      color: var(--secondary-color);
      background: transparent;
      cursor: pointer;
    }
    .map-view-switch button.is-active {
      color: var(--primary-color);
      background: var(--white);
      box-shadow: 0 1px 3px rgba(0,0,0,.1);
    }

    .apple-marker {
      width: 12px;
      height: 12px;
      background: #287eff;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .active-marker .apple-marker {
      background: #f31a7c;
      width: 16px;
      height: 16px;
      transform: scale(1.2);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    /* Event Detail Overlay Styles - Unified with EventSidePanel */
    .event-detail-panel {
      position: absolute;
      inset: 0;
      background: #fff;
      z-index: 100;
      display: flex;
      flex-direction: column;
    }
    
    .px-25 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
    .pb-2 { padding-bottom: 0.5rem !important; }
    .spread { justify-content: space-between; display: flex; }

    .lux-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border-radius: 10px;
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(.4,0,.2,1);
      cursor: pointer;
      border: 1px solid transparent;
      user-select: none;
      gap: 6px;
      text-decoration: none;
      line-height: 1.2;
    }
    .lux-button.small { height: 32px; padding: 0 12px; font-size: 13px; }
    .lux-button.medium { height: 40px; padding: 0 16px; font-size: 15px; }
    .lux-button.light.solid { color: #131517; background-color: #f2f2f2; }
    .lux-button.light.solid:hover { background-color: #e8e8e8; }
    .lux-button.primary.solid { color: #fff; background-color: #131517; }
    .lux-button.primary.solid:hover { opacity: 0.9; }
    .lux-button.round { border-radius: 100px; }
    .lux-button.icon-left { padding-left: 10px; }
    .lux-button.full-width { width: 100%; }

    .event-detail-panel .header {
      padding: 0.75rem 0.75rem 0.5rem;
      background: #fff;
      z-index: 10;
      border-bottom: 1px solid #ebeced;
    }
    .detail-content { flex: 1; overflow-y: auto; padding-bottom: 3rem; scrollbar-width: none; }
    .detail-content::-webkit-scrollbar { display: none; }
    
    .cover-wrapper { position: relative; padding: 1.5rem 1.5rem 1.25rem; display: flex; justify-content: center; }
    .cover-glow { 
      position: absolute; 
      width: 80%;
      height: 80%;
      filter: blur(40px); 
      opacity: 0.12; 
      z-index: 0; 
      border-radius: 24px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .main-cover { 
      position: relative; 
      width: 320px; 
      height: 320px; 
      min-height: 320px;
      border-radius: 12px; 
      overflow: hidden; 
      z-index: 1;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      background: #f7f8f9;
    }
    .main-cover img { width: 100%; height: 100%; object-fit: cover; }
    
    .detail-body { padding: 0 1.5rem 1.5rem; }
    .detail-title { 
      font-size: 32px; 
      font-weight: 700; 
      color: #131517; 
      line-height: 1.1; 
      margin-bottom: 0.75rem; 
      letter-spacing: -0.02em; 
    }
    
    .host-link { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; margin-bottom: 1rem; transition: opacity 0.2s; }
    .host-link:hover { opacity: 0.7; }
    .host-avatar { width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 1.5px solid #fff; box-shadow: 0 0 0 1px #eee; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .host-avatar img { width: 100%; height: 100%; object-fit: cover; }
    
    .meta-row { display: flex; gap: 1rem; margin-bottom: 0.75rem; align-items: center; }
    .meta-icon-box { 
      width: 40px; 
      height: 40px; 
      border-radius: 10px; 
      background: #f5f5f5; 
      display: flex; 
      flex-direction: column;
      align-items: center; 
      justify-content: center; 
      border: 1px solid #eee;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .meta-icon-circle {
      width: 40px; 
      height: 40px; 
      border-radius: 10px; 
      background: #f5f5f5; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      flex-shrink: 0;
      color: #131517;
      border: 1px solid #eee;
    }
    
    .external-card {
      background: #fcf9ed !important;
      border: 1px solid #f1e6c3 !important;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    
    .section-header {
      font-size: 11px;
      font-weight: 700;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 1.5rem 0 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
    }

    .base-11-card { background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(0, 0, 0, 0.08); backdrop-filter: blur(20px); border-radius: 16px; overflow: hidden; margin-bottom: 2rem; }
    .ticket-header { padding: 10px 16px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.1em; }
    .ticket-inner { padding: 16px; }

    .card-label { font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; margin-bottom: 0.75rem; margin-top: 2rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f0f0f0; }
    .spark-content { font-size: 15px; line-height: 1.6; color: #333; margin-top: 0.5rem; }

    @media (max-width: 720px) {
      .map-page { height: 100dvh; min-height: 100dvh; }
      .map-header {
        height: 60px !important;
        min-height: 60px;
        gap: 10px;
        padding: 8px 12px !important;
      }
      .map-header-brand { min-width: 0; gap: 8px !important; }
      .map-header-logo svg { width: 45px; height: auto; }
      .map-calendar-link {
        min-width: 0;
        max-width: min(46vw, 190px);
        height: 40px;
        padding: 0 10px !important;
      }
      .map-calendar-link .fw-medium { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .map-view-switch { display: flex; flex-shrink: 0; }
      .map-auth-action { display: none !important; }
      .content { width: 100%; }
      .events-panel,
      .mapview { width: 100%; min-width: 0; height: 100%; flex: 1 1 100%; border: 0; }
      .content[data-mobile-view='list'] .mapview,
      .content[data-mobile-view='map'] .events-panel { display: none; }
      .map-inner { inset: 0; border: 0; border-radius: 0; }
      .event-row { min-height: 104px; padding: 12px 16px; gap: 12px; }
      .cover-image { width: 72px; height: 72px; border-radius: 10px; }
      .event-title h3 { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
      .info { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .date-header { min-height: 44px; padding: 8px 16px; }
      .left-content { padding-bottom: max(24px, env(safe-area-inset-bottom)); }
      .leaflet-bottom { bottom: max(10px, env(safe-area-inset-bottom)); }
    }
  ` }} />
);

// --- LEAFLET ICONS ---
const BLUE_ICON = L.divIcon({
  className: 'custom-pin',
  html: '<div class="apple-marker"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const ACTIVE_ICON = L.divIcon({
  className: 'custom-pin active-marker',
  html: '<div class="apple-marker"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const StickyDateHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        // When sentinel is NOT intersecting and is above the threshold, we are stuck
        setIsStuck(!e.isIntersecting && e.boundingClientRect.top < 100);
      },
      { threshold: [0], rootMargin: '-48px 0px 0px 0px' } // Detect just below header
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} style={{ height: '1px', marginBottom: '-1px', pointerEvents: 'none' }} />
      <div className={`${className} ${isStuck ? 'stuck' : ''}`}>
        {children}
      </div>
    </>
  );
};

const MapController = ({ markers, selectedId, viewKey }: { markers: any[], selectedId: string | null, viewKey: string }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 250);
    
    if (selectedId) {
      const selected = markers.find(m => m.id === selectedId);
      if (selected && selected.lat && selected.lng) {
        map.setView([selected.lat, selected.lng], 15, { animate: true });
      }
    } else if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
    
    return () => clearTimeout(timer);
  }, [markers, selectedId, viewKey, map]);
  return null;
};

const FullMapPage: React.FC = () => {
  const { calendarSlug } = useParams<{ calendarSlug?: string }>();
  const { isDark } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout, openLoginModal } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [geoCache, setGeoCache] = useState<Record<string, { lat: number, lng: number }>>(() => {
    const saved = localStorage.getItem('fauves_geo_cache_v1');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        if (calendarSlug) {
          const organizationResponse = await fetchApi(`/api/organization/slug/${encodeURIComponent(calendarSlug)}`);
          if (!organizationResponse.ok) throw new Error('Calendário não encontrado');
          const organization = await organizationResponse.json();
          setCalendar(organization);
          const eventsResponse = await fetchApi(`/api/organization/${organization.id}/events`);
          const organizationEvents = await eventsResponse.json();
          setEvents(Array.isArray(organizationEvents) ? organizationEvents : []);
        } else {
          setCalendar(null);
          const response = await fetchApi('/api/events?limit=100');
          const data = await response.json();
          setEvents(Array.isArray(data) ? data : (data?.data || data?.events || []));
        }
      } catch (err) {
        console.error("Error fetching map events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [calendarSlug]);

  useEffect(() => {
    const process = async () => {
      const missing = events.filter(ev => {
        const addr = ev.location || ev.locationName || ev.locationAddress;
        const cached = addr ? geoCache[addr] : null;
        return !ev.locationLatitude && !ev.locationLongitude && !cached && addr;
      });
      for (const ev of missing) {
        const addr = ev.location || ev.locationName || ev.locationAddress;
        if (!addr) continue;
        try {
          const query = [addr, ev.locationCity, ev.locationUf].filter(Boolean).join(', ');
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const resData = await res.json();
          if (resData?.[0]) {
            const coords = { lat: parseFloat(resData[0].lat), lng: parseFloat(resData[0].lon) };
            const newCache = { ...geoCache, [addr]: coords };
            setGeoCache(newCache);
            localStorage.setItem('fauves_geo_cache_v1', JSON.stringify(newCache));
          }
          await new Promise(r => setTimeout(r, 1200));
        } catch (e) { }
      }
    };
    if (events.length > 0) process();
  }, [events, geoCache]);

  const mappedEvents = useMemo(() => {
    return events.map(ev => {
      const addr = ev.location || ev.locationName || ev.locationAddress;
      const cached = addr ? geoCache[addr] : null;
      return {
        ...ev,
        lat: Number(ev.locationLatitude || ev.latitude || ev.lat || cached?.lat),
        lng: Number(ev.locationLongitude || ev.longitude || ev.lng || cached?.lng),
        displayLocation: ev.locationName || ev.location || [ev.locationCity, ev.locationUf].filter(Boolean).join(' - ') || 'Local a definir',
        displayImage: ev.bannerUrl || ev.banner || ev.image || ev.coverUrl
      };
    }).filter(e => e.lat && e.lng);
  }, [events, geoCache]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, any[]> = {};
    mappedEvents.forEach(ev => {
      const dateKey = startOfDay(new Date(ev.startDate)).toISOString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(ev);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [mappedEvents]);

  const viewingEvent = useMemo(() => {
    return mappedEvents.find(e => e.id === viewingEventId);
  }, [mappedEvents, viewingEventId]);
  const viewingEventIndex = useMemo(
    () => mappedEvents.findIndex((event) => event.id === viewingEventId),
    [mappedEvents, viewingEventId],
  );

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return { main: 'Hoje', sub: format(d, 'eeee', { locale: ptBR }) };
    if (isTomorrow(d)) return { main: 'Amanhã', sub: format(d, 'eeee', { locale: ptBR }) };
    return { main: format(d, "d 'de' MMM", { locale: ptBR }), sub: format(d, 'eeee', { locale: ptBR }) };
  };

  return (
    <div className={`tint-root ${isDark ? 'dark dark-mode' : ''}`}>
      <LumaStyle />

      <div className="map-page">
        <header className="map-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f0f0', background: '#fff', position: 'relative', zIndex: 10 }}>
          <div className="map-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/" className="flex-center map-header-logo" aria-label="Fauves — página inicial" style={{ textDecoration: 'none', color: '#131517' }}>
              {FAUVES_LOGO_SVG}
            </Link>
            <Link className="flex-center gap-2 map-calendar-link" to={calendarSlug ? `/${calendarSlug}` : '/discover'} style={{ color: '#131517', textDecoration: 'none', background: '#f5f5f5', padding: '6px 12px', borderRadius: '8px' }}>
              {calendar?.logoUrl && <img alt="" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }} src={resolveImageUrl(calendar.logoUrl) || ''} />}
              <div className="fw-medium" style={{ fontSize: '13px' }}>{calendar?.name || 'Mapa de Eventos'}</div>
            </Link>
          </div>
          
          <div className="map-view-switch" role="group" aria-label="Visualização do mapa">
            <button type="button" className={mobileView === 'list' ? 'is-active' : ''} onClick={() => setMobileView('list')} aria-label="Ver lista" aria-pressed={mobileView === 'list'}><List size={18} /></button>
            <button type="button" className={mobileView === 'map' ? 'is-active' : ''} onClick={() => setMobileView('map')} aria-label="Ver mapa" aria-pressed={mobileView === 'map'}><MapIcon size={18} /></button>
          </div>

          <div className="map-auth-action" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!user ? (
              <Link to="/signin" className="btn lux-button flex-center small light solid round" style={{ textDecoration: 'none' }}>
                <div className="label">Entrar</div>
              </Link>
            ) : (
              <div style={{ position: 'relative' }}>
                <button 
                  className="tooltip-bottom" 
                  data-tooltip="Perfil" 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <img
                    src={user?.photoUrl || '/avatars/avatar_1.avif'}
                    alt="Avatar"
                    style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.05)', objectFit: 'cover' }}
                  />
                </button>
                
                {isProfileMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    border: '1px solid #f0f0f0',
                    minWidth: '200px',
                    overflow: 'hidden',
                    zIndex: 1000
                  }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{user?.name || 'Visitante'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{user?.email}</div>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                      <Link to="/dashboard" style={{ display: 'block', padding: '0.5rem 0.5rem', textDecoration: 'none', color: '#333', fontSize: '13px', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Painel do Organizador
                      </Link>
                      <button 
                        onClick={() => { setIsProfileMenuOpen(false); logout(); }}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem 0.5rem', color: '#dc2626', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', marginTop: '0.25rem' }} 
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} 
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="content" data-mobile-view={mobileView}>
          <div className="events-panel">
            <div className="left-content">
              {groupedEvents.map(([dateKey, items]) => {
                const label = getDateLabel(dateKey);
                return (
                  <div key={dateKey} className="section">
                    <StickyDateHeader className="date-header">
                      <div className="date fw-medium">{label.main}</div>
                      <div style={{ color: '#73757799', marginLeft: 4, marginRight: 4 }}>/</div>
                      <div className="weekday">{label.sub}</div>
                    </StickyDateHeader>
                    {items.map(event => (
                      <div
                        key={event.id}
                        className={`event-row ${selectedEventId === event.id ? 'active' : ''}`}
                        onClick={() => setViewingEventId(event.id)}
                        onMouseEnter={() => setSelectedEventId(event.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(keyboardEvent) => {
                          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                            keyboardEvent.preventDefault();
                            setViewingEventId(event.id);
                          }
                        }}
                      >
                        <div className="cover-image">
                          <img src={resolveImageUrl(event.displayImage) || 'https://via.placeholder.com/80x80'} alt={event.name} />
                        </div>
                        <div className="flex-1">
                          <div className="event-time">{format(new Date(event.startDate), 'HH:mm')}</div>
                          <div className="event-title"><h3>{event.name}</h3></div>
                          <div className="info">{event.displayLocation}</div>
                          {event._count?.tickets > 0 && (
                            <div style={{ color: '#3cbd2c', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                              {event._count?.tickets} ingressos disponíveis
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {loading && [1,2,3,4].map(i => (
                <div key={i} style={{ padding: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', background: '#f0f0f0', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '14px', width: '80%', background: '#f0f0f0', borderRadius: '6px', marginBottom: '6px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: '11px', width: '55%', background: '#f5f5f5', borderRadius: '4px', marginBottom: '4px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: '11px', width: '40%', background: '#f5f5f5', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  </div>
                </div>
              ))}
              {!loading && groupedEvents.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#737577' }}>Nenhum evento encontrado no mapa.</div>}
            </div>

            <EventSidePanel
              event={viewingEvent}
              isOpen={Boolean(viewingEvent)}
              onClose={() => setViewingEventId(null)}
              onNext={() => setViewingEventId(mappedEvents[viewingEventIndex + 1]?.id || null)}
              onPrev={() => setViewingEventId(mappedEvents[viewingEventIndex - 1]?.id || null)}
              hasNext={viewingEventIndex >= 0 && viewingEventIndex < mappedEvents.length - 1}
              hasPrev={viewingEventIndex > 0}
            />
          </div>

          <div className="mapview">
            <div className="map-inner">
              <MapContainer
                center={[-3.7319, -38.5267]}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                <TileLayer url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
                <ZoomControl position="bottomright" />
                {mappedEvents.map(event => (
                  <Marker
                    key={event.id}
                    position={[event.lat, event.lng]}
                    icon={selectedEventId === event.id ? ACTIVE_ICON : BLUE_ICON}
                    eventHandlers={{
                      click: () => {
                        setSelectedEventId(event.id);
                        setViewingEventId(event.id);
                        setMobileView('list');
                      }
                    }}
                  />
                ))}
                <MapController markers={mappedEvents} selectedId={selectedEventId} viewKey={mobileView} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullMapPage;
