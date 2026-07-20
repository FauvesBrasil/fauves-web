import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsRight,
  ChevronUp,
  Copy,
  ExternalLink,
  Flag,
  Globe2,
  Instagram,
  Languages,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import { sanitizeRichHtml } from '@/lib/sanitizeHtml';
import EventRegistrationCard from './EventRegistrationCard';

interface EventSidePanelProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const first = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== '');

const socialUrl = (value: string | null | undefined, network?: 'instagram' | 'x' | 'linkedin') => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, '').replace(/^\//, '');
  if (network === 'instagram') return `https://instagram.com/${handle}`;
  if (network === 'x') return `https://x.com/${handle}`;
  if (network === 'linkedin') return `https://linkedin.com/${handle}`;
  return `https://${value}`;
};

const cleanHtml = (value: any) => {
  if (typeof value !== 'string') return '';
  return value.replace(/<p>\s*<\/p>/gi, '').replace(/&nbsp;/gi, ' ').trim();
};

const shortLocation = (event: any) => {
  const raw = first(event.locationName, event.venue?.name, event.displayLocation, event.locationAddress, event.fullLocation, event.location);
  const ignored = ['Local', 'Presencial', 'Evento online', 'Local será anunciado em breve'];
  const venue = raw && !ignored.includes(raw) ? String(raw).split(',')[0].trim() : '';
  const city = first(event.locationCity, event.city, event.venue?.city);
  const region = first(event.locationUf, event.state, event.region, event.locationCountry, event.country);
  const locality = [city, region].filter(Boolean).join(', ');
  const finalVenue = venue || locality || (event.location === 'Evento online' ? 'Evento online' : 'Local a definir');
  const rawFull = first(event.locationAddress, event.fullLocation, raw);
  const full = rawFull && !ignored.includes(String(rawFull).trim()) ? String(rawFull).trim() : locality;
  return {
    venue: finalVenue,
    locality: locality && locality.toLocaleLowerCase('pt-BR') !== finalVenue.toLocaleLowerCase('pt-BR') ? locality : '',
    full: full || '',
  };
};

const formatEventDate = (event: any) => {
  const value = first(event.startDate, event.date, event.startsAt);
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatTimeRange = (event: any, start: Date | null) => {
  const explicit = first(event.time, event.timeLabel);
  if (explicit) return explicit;
  if (!start) return '';
  const startText = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const endValue = first(event.endDate, event.endsAt);
  if (!endValue) return startText;
  const end = new Date(endValue);
  if (Number.isNaN(end.getTime())) return startText;
  return `${startText} – ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatTimezone = (event: any, start: Date | null) => {
  const zone = first(event.timezone, event.timeZone);
  if (!zone) return first(event.utcOffset, event.timezoneLabel) || '';
  if (!String(zone).includes('/') || !start) return String(zone);
  try {
    const part = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, timeZoneName: 'shortOffset' })
      .formatToParts(start)
      .find((item) => item.type === 'timeZoneName');
    return part?.value || String(zone);
  } catch {
    return String(zone);
  }
};

const SocialLink = ({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) => {
  if (!href) return null;
  return (
    <a className="edm-icon-link edm-tooltip" data-tip={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {children}
    </a>
  );
};

const EventLocationMap = ({ latitude, longitude, isDark, accent }: { latitude: number; longitude: number; isDark: boolean; accent: string }) => (
  <MapContainer
    key={`${latitude}-${longitude}-${isDark ? 'dark' : 'light'}`}
    center={[latitude, longitude]}
    zoom={14}
    zoomControl={false}
    dragging={false}
    scrollWheelZoom={false}
    doubleClickZoom={false}
    attributionControl={false}
    style={{ width: '100%', height: '100%' }}
  >
    <TileLayer
      url={isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
    />
    <CircleMarker
      center={[latitude, longitude]}
      radius={7}
      pathOptions={{ color: '#fff', weight: 2, fillColor: accent, fillOpacity: 1 }}
    />
  </MapContainer>
);

export const EventSidePanel: React.FC<EventSidePanelProps> = ({
  event,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}) => {
  const { isDark } = useTheme();
  const { user, token, openLoginModal } = useAuth();
  const [fullEvent, setFullEvent] = React.useState<any>(null);
  const [organization, setOrganization] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);
  const [following, setFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [managementAccess, setManagementAccess] = React.useState<{ userId: string; eventIds: Set<string> } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const releaseScrollLock = acquireDocumentScrollLock();
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  React.useEffect(() => {
    setFullEvent(null);
    setOrganization(null);
    setCopied(false);
    scrollRef.current?.scrollTo({ top: 0 });
    const eventId = event?.id || event?._id;
    if (!isOpen || !eventId) return;
    let cancelled = false;
    fetchApi(`/api/event/${eventId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled && data) setFullEvent(data); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [event?.id, event?._id, isOpen]);

  const resolvedEvent = React.useMemo(() => ({ ...(event || {}), ...(fullEvent || {}) }), [event, fullEvent]);
  const eventOrganization = resolvedEvent.organization || resolvedEvent.organizer || null;
  const organizationId = first(eventOrganization?.id, resolvedEvent.organizationId, resolvedEvent.organizerId);
  const organizationSlug = first(eventOrganization?.slug, resolvedEvent.organizationSlug);

  React.useEffect(() => {
    if (!isOpen || (!organizationId && !organizationSlug)) return;
    let cancelled = false;
    const key = organizationId || organizationSlug;
    fetchApi(`/api/organization/${encodeURIComponent(key)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled && data) setOrganization(data); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [organizationId, organizationSlug, isOpen]);

  const org = React.useMemo(() => ({ ...(eventOrganization || {}), ...(organization || {}) }), [eventOrganization, organization]);
  const orgKey = first(org.id, organizationId, org.slug, organizationSlug);

  React.useEffect(() => {
    if (!isOpen || !token || !orgKey) {
      setFollowing(false);
      return;
    }
    let cancelled = false;
    fetchApi(`/api/organization/${encodeURIComponent(orgKey)}/follow`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled && data) setFollowing(Boolean(data.following)); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [orgKey, token, isOpen]);

  React.useEffect(() => {
    const userId = user?.id;
    if (!isOpen || !token || !userId) {
      setManagementAccess(null);
      return;
    }
    if (user.isAdmin) {
      setManagementAccess({ userId, eventIds: new Set(['*']) });
      return;
    }

    let cancelled = false;
    setManagementAccess(null);
    fetchApi(`/api/events/by-user?userId=${encodeURIComponent(userId)}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setManagementAccess({
          userId,
          eventIds: new Set(items.map((item: any) => String(first(item?.id, item?.eventId))).filter(Boolean)),
        });
      })
      .catch(() => {
        if (!cancelled) setManagementAccess({ userId, eventIds: new Set() });
      });
    return () => { cancelled = true; };
  }, [isOpen, token, user?.id, user?.isAdmin]);

  if (!event || !isOpen) return null;

  const title = first(resolvedEvent.name, resolvedEvent.title) || 'Evento';
  const slugOrId = first(resolvedEvent.slug, resolvedEvent.id, resolvedEvent._id);
  const managerEventId = first(resolvedEvent.id, resolvedEvent._id, event.id, event._id);
  const canManage = Boolean(
    user?.id
    && managementAccess?.userId === user.id
    && (managementAccess.eventIds.has('*') || managementAccess.eventIds.has(String(managerEventId))),
  );
  const canonicalPath = `/${slugOrId}`;
  const canonicalUrl = typeof window === 'undefined' ? canonicalPath : `${window.location.origin}${canonicalPath}`;
  const cover = resolveImageUrl(first(resolvedEvent.bannerUrl, resolvedEvent.banner, resolvedEvent.image, resolvedEvent.coverUrl));
  const orgName = first(org.name, resolvedEvent.organizerName, typeof resolvedEvent.organizers === 'string' ? resolvedEvent.organizers : null);
  const orgLogo = resolveImageUrl(first(org.logoUrl, resolvedEvent.organizerLogo));
  const orgPath = org.slug || org.id ? `/${org.slug || org.id}` : null;
  const startDate = formatEventDate(resolvedEvent);
  const location = shortLocation(resolvedEvent);
  const isOnline = resolvedEvent.location === 'Evento online' || resolvedEvent.locationType === 'online' || resolvedEvent.isOnline;
  const latitude = Number(first(resolvedEvent.locationLatitude, resolvedEvent.latitude, resolvedEvent.lat));
  const longitude = Number(first(resolvedEvent.locationLongitude, resolvedEvent.longitude, resolvedEvent.lng));
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0;
  const mapsQuery = hasCoordinates ? `${latitude},${longitude}` : location.full;
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` : null;
  const description = cleanHtml(resolvedEvent.description);
  const category = first(resolvedEvent.category?.name, resolvedEvent.category, resolvedEvent.categories?.[0]?.name);
  const externalUrl = first(
    resolvedEvent.externalUrl,
    resolvedEvent.buy_ticket_url,
    resolvedEvent.ticket_url,
    resolvedEvent.buyUrl,
    resolvedEvent.external_link,
  );
  const isExternal = Boolean(resolvedEvent.isExternal || externalUrl);
  const hosts = Array.isArray(resolvedEvent.hosts)
    ? resolvedEvent.hosts
    : Array.isArray(resolvedEvent.organizers)
      ? resolvedEvent.organizers
      : Array.isArray(resolvedEvent.organizerUsers)
        ? resolvedEvent.organizerUsers
        : [];
  const orgDescription = cleanHtml(first(org.bio, org.description));
  const contactEmail = first(resolvedEvent.contactEmail, org.showContactEmail !== false ? org.contactEmail : null);
  const accent = first(resolvedEvent.themeColor, org.themeColor) || '#ef4f9a';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const toggleFollow = async () => {
    if (!user || !token) {
      openLoginModal(window.location.pathname);
      return;
    }
    if (!orgKey || followLoading) return;
    setFollowLoading(true);
    try {
      const response = await fetchApi(`/api/organization/${encodeURIComponent(orgKey)}/follow`, {
        method: following ? 'DELETE' : 'POST',
      });
      if (response.ok) setFollowing((current) => !current);
    } finally {
      setFollowLoading(false);
    }
  };

  const openTranslation = () => {
    const url = `https://translate.google.com/translate?sl=auto&tl=pt&u=${encodeURIComponent(canonicalUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <>
        <style>{`
          .edm-backdrop { position:fixed; inset:0; z-index:1200; background:rgba(0,0,0,.56); backdrop-filter:blur(4px); }
          .edm-panel { --edm-bg:#fff; --edm-raised:#f1f2f3; --edm-soft:#f7f7f8; --edm-text:#151719; --edm-muted:#737577; --edm-border:rgba(19,21,23,.10); position:fixed; z-index:1201; top:12px; right:12px; bottom:12px; width:min(var(--fauves-side-panel-width,520px),calc(100vw - 24px)); display:flex; flex-direction:column; overflow:hidden; border:1px solid var(--edm-border); border-radius:var(--fauves-modal-radius,14px); background:var(--edm-bg); color:var(--edm-text); box-shadow:0 22px 64px rgba(0,0,0,.32); font-family:inherit; }
          .edm-panel.is-dark { --edm-bg:#181a1b; --edm-raised:#2b2d2f; --edm-soft:#222425; --edm-text:#f7f7f7; --edm-muted:#a0a2a4; --edm-border:rgba(255,255,255,.09); }
          .edm-toolbar { min-height:52px; flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:9px; padding:8px 11px; border-bottom:1px solid var(--edm-border); background:color-mix(in srgb,var(--edm-bg) 92%,transparent); backdrop-filter:blur(18px); }
          .edm-toolbar-group { min-width:0; display:flex; align-items:center; gap:6px; }
          .edm-button { min-height:34px; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:0 10px; border:0; border-radius:var(--fauves-control-radius,8px); background:var(--edm-raised); color:var(--edm-text); font:inherit; font-size:12px; font-weight:550; line-height:1; text-decoration:none; cursor:pointer; transition:background .16s ease,transform .16s ease,opacity .16s ease; }
          .edm-button:hover { background:color-mix(in srgb,var(--edm-raised) 84%,var(--edm-text) 16%); }
          .edm-button:active { transform:scale(.98); }
          .edm-button:disabled { opacity:.28; cursor:default; }
          .edm-icon-button { width:34px; padding:0; flex:0 0 auto; }
          .edm-scroll { flex:1; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:var(--edm-raised) transparent; }
          .edm-manage-bar { min-height:58px; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:10px 16px; background:color-mix(in srgb,var(--edm-accent) 18%,var(--edm-bg)); color:color-mix(in srgb,var(--edm-accent) 74%,var(--edm-text)); border-bottom:1px solid color-mix(in srgb,var(--edm-accent) 22%,transparent); }
          .edm-manage-copy { min-width:0; font-size:13px; font-weight:500; line-height:1.35; }
          .edm-manage-action { min-height:34px; flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; gap:5px; padding:0 13px; border-radius:999px; background:var(--edm-accent); color:#fff; font-size:12px; font-weight:650; line-height:1; text-decoration:none; box-shadow:0 7px 18px color-mix(in srgb,var(--edm-accent) 22%,transparent); transition:filter .16s ease,transform .16s ease; }
          .edm-manage-action:hover { filter:brightness(1.08); transform:translateY(-1px); }
          .edm-manage-action:active { transform:translateY(0) scale(.98); }
          .edm-content { padding:24px 24px 34px; }
          .edm-cover-wrap { position:relative; width:min(286px,100%); aspect-ratio:1; margin:7px auto 27px; }
          .edm-cover-glow { position:absolute; inset:7%; border-radius:14px; background:center/cover no-repeat; filter:blur(30px); opacity:.15; transform:scale(1.07); }
          .edm-cover { position:relative; width:100%; height:100%; display:grid; place-items:center; overflow:hidden; border:1px solid var(--edm-border); border-radius:11px; background:var(--edm-soft); box-shadow:0 14px 32px rgba(0,0,0,.2); }
          .edm-cover img { width:100%; height:100%; object-fit:cover; }
          .edm-cover-placeholder { color:var(--edm-muted); }
          .edm-title { margin:0 0 10px; font-size:1.625rem; line-height:1.14; letter-spacing:-.02em; font-weight:650; overflow-wrap:anywhere; }
          .edm-org-summary { width:fit-content; max-width:100%; display:flex; align-items:center; gap:8px; margin-bottom:21px; color:var(--edm-muted); font-size:14px; font-weight:500; text-decoration:none; transition:color .16s ease; }
          .edm-org-summary:hover { color:var(--edm-text); }
          .edm-avatar { width:24px; height:24px; display:grid; place-items:center; flex:0 0 auto; overflow:hidden; border:1px solid var(--edm-border); border-radius:7px; background:var(--edm-soft); font-size:10px; }
          .edm-avatar img { width:100%; height:100%; object-fit:cover; }
          .edm-info-list { display:grid; gap:14px; margin-bottom:23px; }
          .edm-info-row { display:grid; grid-template-columns:46px minmax(0,1fr); align-items:center; gap:12px; }
          .edm-info-icon { width:44px; height:44px; display:grid; place-items:center; overflow:hidden; border:1px solid var(--edm-border); border-radius:10px; background:transparent; color:var(--edm-muted); }
          .edm-calendar { align-content:stretch; padding:0; }
          .edm-calendar span:first-child { align-self:stretch; display:grid; place-items:center; background:var(--edm-raised); font-size:10px; font-weight:600; letter-spacing:.02em; text-transform:uppercase; }
          .edm-calendar span:last-child { display:grid; place-items:center; font-size:18px; font-weight:600; }
          .edm-info-primary { color:var(--edm-text); font-size:14px; font-weight:600; line-height:1.25; }
          .edm-info-secondary { margin-top:2px; color:var(--edm-muted); font-size:12px; font-weight:400; line-height:1.35; }
          .edm-location-link { color:var(--edm-text); text-decoration:none; transition:color .16s ease; }
          .edm-location-link:hover { color:var(--edm-accent); }
          .edm-registration { margin-bottom:27px; }
          .edm-external { padding:13px; border:1px solid var(--edm-border); border-radius:10px; background:var(--edm-soft); }
          .edm-external p { margin:0 0 10px; color:var(--edm-muted); font-size:12px; line-height:1.5; }
          .edm-primary-action { width:100%; background:var(--edm-text); color:var(--edm-bg); }
          .edm-section { margin-top:25px; }
          .edm-section-head { min-height:34px; display:flex; align-items:center; justify-content:space-between; gap:10px; padding-bottom:8px; border-bottom:1px solid var(--edm-border); color:var(--edm-muted); font-size:12px; font-weight:600; }
          .edm-description { padding-top:14px; color:var(--edm-text); font-size:14px; line-height:1.58; overflow-wrap:anywhere; }
          .edm-description p { margin:0 0 13px; }
          .edm-description p:last-child { margin-bottom:0; }
          .edm-description a { color:var(--edm-accent); }
          .edm-description ul,.edm-description ol { padding-left:22px; }
          .edm-icon-link { width:30px; height:30px; display:grid; place-items:center; border-radius:8px; color:var(--edm-muted); text-decoration:none; transition:color .16s ease,background .16s ease; }
          .edm-icon-link:hover { color:var(--edm-text); background:var(--edm-soft); }
          .edm-location-copy { padding:14px 0; }
          .edm-location-copy strong { display:block; font-size:15px; font-weight:600; }
          .edm-location-copy span { display:block; margin-top:3px; color:var(--edm-muted); font-size:13px; }
          .edm-map { position:relative; height:180px; overflow:hidden; border:1px solid var(--edm-border); border-radius:10px; background:var(--edm-soft); }
          .edm-map .leaflet-container { width:100%; height:100%; background:var(--edm-soft); }
          .edm-map-link { position:absolute; z-index:500; top:12px; left:12px; min-height:34px; display:inline-flex; align-items:center; gap:6px; padding:0 11px; border-radius:8px; background:rgba(9,10,11,.88); color:#fff; font-size:13px; font-weight:600; text-decoration:none; box-shadow:0 4px 14px rgba(0,0,0,.25); }
          .edm-presented { padding-top:14px; }
          .edm-presented-top { display:flex; align-items:center; gap:10px; }
          .edm-org-logo { width:40px; height:40px; display:grid; place-items:center; flex:0 0 auto; overflow:hidden; border:1px solid var(--edm-border); border-radius:8px; background:var(--edm-soft); font-weight:600; }
          .edm-org-logo img { width:100%; height:100%; object-fit:cover; }
          .edm-presented-label { color:var(--edm-muted); font-size:11px; font-weight:600; }
          .edm-presented-name { margin-top:2px; color:var(--edm-text); font-size:16px; font-weight:600; text-decoration:none; }
          .edm-follow { margin-left:auto; }
          .edm-org-description { margin:14px 0 9px; color:var(--edm-muted); font-size:13px; line-height:1.5; }
          .edm-socials { display:flex; align-items:center; gap:3px; }
          .edm-hosts { display:grid; gap:11px; padding-top:14px; }
          .edm-host { display:flex; align-items:center; gap:9px; min-width:0; font-size:13px; }
          .edm-host strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; }
          .edm-host-socials { margin-left:auto; display:flex; }
          .edm-support { display:grid; gap:7px; margin-top:25px; }
          .edm-support a { width:fit-content; color:var(--edm-muted); font-size:12px; font-weight:600; text-decoration:none; }
          .edm-support a:hover { color:var(--edm-text); }
          .edm-tag { width:fit-content; display:inline-flex; align-items:center; margin-top:22px; padding:6px 10px; border:1px solid var(--edm-border); border-radius:999px; color:var(--edm-muted); font-size:11px; font-weight:500; }
          .edm-tooltip { position:relative; }
          .edm-tooltip::after { content:attr(data-tip); position:absolute; z-index:4; left:50%; bottom:-42px; transform:translateX(-50%) translateY(-4px); max-width:250px; padding:7px 10px; border-radius:8px; background:#fff; color:#171717; box-shadow:0 7px 20px rgba(0,0,0,.24); font-size:12px; font-weight:500; line-height:1; white-space:nowrap; pointer-events:none; opacity:0; transition:opacity .12s ease,transform .12s ease; }
          .edm-tooltip:hover::after,.edm-tooltip:focus-visible::after { opacity:1; transform:translateX(-50%) translateY(0); }
          @media (max-width:640px) {
            .edm-panel { inset:0; width:100%; max-width:none; border-radius:0; border-left:0; border-right:0; }
            .edm-toolbar { padding:8px 10px; }
            .edm-toolbar .edm-button-label { display:none; }
            .edm-toolbar .edm-button { width:34px; padding:0; }
            .edm-manage-bar { min-height:56px; padding:9px 14px; gap:10px; }
            .edm-manage-copy { font-size:12px; }
            .edm-manage-action { min-height:34px; padding:0 12px; font-size:12px; }
            .edm-content { padding:22px 18px 32px; }
            .edm-cover-wrap { width:min(276px,100%); margin-top:2px; }
          }
        `}</style>

        <motion.button
          type="button"
          className="edm-backdrop"
          aria-label="Fechar detalhes do evento"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.aside
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${title}`}
          className={`edm-panel ${isDark ? 'is-dark' : ''}`}
          style={{ '--edm-accent': accent } as React.CSSProperties}
          initial={{ x: '105%' }}
          animate={{ x: 0 }}
          exit={{ x: '105%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        >
          <header className="edm-toolbar">
            <div className="edm-toolbar-group">
              <button type="button" className="edm-button edm-icon-button edm-tooltip" data-tip="Fechar" onClick={onClose} aria-label="Fechar">
                <ChevronsRight size={18} strokeWidth={2.5} />
              </button>
              <button type="button" className="edm-button edm-tooltip" data-tip={copied ? 'Link copiado' : 'Copiar link'} onClick={copyLink}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span className="edm-button-label">{copied ? 'Copiado' : 'Copiar Link'}</span>
              </button>
              <Link className="edm-button edm-tooltip" data-tip="Abrir página completa" to={canonicalPath} target="_blank">
                <span className="edm-button-label">Página do Evento</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="edm-toolbar-group">
              <button type="button" className="edm-button edm-icon-button edm-tooltip" data-tip="Evento anterior" disabled={!hasPrev} onClick={onPrev} aria-label="Evento anterior">
                <ChevronUp size={16} />
              </button>
              <button type="button" className="edm-button edm-icon-button edm-tooltip" data-tip="Próximo evento" disabled={!hasNext} onClick={onNext} aria-label="Próximo evento">
                <ChevronDown size={16} />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="edm-scroll">
            {canManage && managerEventId && (
              <div className="edm-manage-bar">
                <div className="edm-manage-copy">Você tem acesso de gerenciamento para este evento.</div>
                <Link
                  className="edm-manage-action"
                  to={`/event/manage/${managerEventId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Gerenciar ${title}`}
                >
                  Gerenciar <ArrowUpRight size={15} strokeWidth={2.4} />
                </Link>
              </div>
            )}
            <div className="edm-content">
              <div className="edm-cover-wrap">
                {cover && <div className="edm-cover-glow" style={{ backgroundImage: `url(${cover})` }} />}
                <div className="edm-cover">
                  {cover ? <img src={cover} alt={title} /> : <CalendarDays className="edm-cover-placeholder" size={58} strokeWidth={1.25} />}
                </div>
              </div>

              <h1 className="edm-title">{title}</h1>
              {orgName && (
                orgPath ? (
                  <Link className="edm-org-summary" to={orgPath}>
                    <span className="edm-avatar">{orgLogo ? <img src={orgLogo} alt="" /> : String(orgName).charAt(0)}</span>
                    <span>{orgName}</span>
                    <ChevronDown size={17} style={{ transform: 'rotate(-90deg)' }} />
                  </Link>
                ) : (
                  <div className="edm-org-summary">
                    <span className="edm-avatar">{orgLogo ? <img src={orgLogo} alt="" /> : String(orgName).charAt(0)}</span>
                    <span>{orgName}</span>
                  </div>
                )
              )}

              <div className="edm-info-list">
                {startDate && (
                  <div className="edm-info-row">
                    <div className="edm-info-icon edm-calendar">
                      <span>{`${startDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}.`}</span>
                      <span>{startDate.getDate()}</span>
                    </div>
                    <div>
                      <div className="edm-info-primary">{startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                      <div className="edm-info-secondary">{formatTimeRange(resolvedEvent, startDate)}{formatTimezone(resolvedEvent, startDate) ? ` ${formatTimezone(resolvedEvent, startDate)}` : ''}</div>
                    </div>
                  </div>
                )}

                <div className="edm-info-row">
                  <div className="edm-info-icon"><MapPin size={23} strokeWidth={2.1} /></div>
                  <div>
                    {mapsUrl && !isOnline ? (
                      <a className="edm-info-primary edm-location-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        {location.venue} <ArrowUpRight size={15} style={{ display: 'inline' }} />
                      </a>
                    ) : <div className="edm-info-primary">{location.venue}</div>}
                    {location.locality && <div className="edm-info-secondary">{location.locality}</div>}
                  </div>
                </div>
              </div>

              <div className="edm-registration">
                {isExternal && externalUrl ? (
                  <div className="edm-external">
                    <p>A inscrição deste evento é concluída no site oficial.</p>
                    <a className="edm-button edm-primary-action" href={externalUrl} target="_blank" rel="noopener noreferrer">
                      Ir para inscrição <ExternalLink size={16} />
                    </a>
                  </div>
                ) : <EventRegistrationCard event={resolvedEvent} compact />}
              </div>

              {description && (
                <section className="edm-section">
                  <div className="edm-section-head">
                    <span>Sobre o Evento</span>
                    <button type="button" className="edm-icon-link edm-tooltip" data-tip="Traduzir" onClick={openTranslation} aria-label="Traduzir">
                      <Languages size={19} />
                    </button>
                  </div>
                  <div className="edm-description" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(resolvedEvent.description) }} />
                </section>
              )}

              {!isOnline && location.full && (
                <section className="edm-section">
                  <div className="edm-section-head"><span>Localização</span></div>
                  <div className="edm-location-copy">
                    <strong>{location.venue}</strong>
                    {location.full !== location.venue && <span>{location.full}</span>}
                  </div>
                  {hasCoordinates && mapsUrl && (
                    <div className="edm-map">
                      <EventLocationMap latitude={latitude} longitude={longitude} isDark={isDark} accent={accent} />
                      <a className="edm-map-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">Maps <ExternalLink size={14} /></a>
                    </div>
                  )}
                </section>
              )}

              {orgName && (
                <section className="edm-section">
                  <div className="edm-presented">
                    <div className="edm-presented-top">
                      <div className="edm-org-logo">{orgLogo ? <img src={orgLogo} alt="" /> : String(orgName).charAt(0)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="edm-presented-label">Apresentado por</div>
                        {orgPath ? <Link className="edm-presented-name" to={orgPath}>{orgName}</Link> : <div className="edm-presented-name">{orgName}</div>}
                      </div>
                      {orgKey && (
                        <button type="button" className="edm-button edm-follow" disabled={followLoading} onClick={toggleFollow}>
                          {following ? 'Seguindo' : 'Seguir'}
                        </button>
                      )}
                    </div>
                    {orgDescription && <div className="edm-org-description" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(first(org.bio, org.description)) }} />}
                    <div className="edm-socials">
                      <SocialLink href={socialUrl(org.linkedin, 'linkedin')} label="LinkedIn"><Linkedin size={19} /></SocialLink>
                      <SocialLink href={socialUrl(org.instagram, 'instagram')} label="Instagram"><Instagram size={19} /></SocialLink>
                      <SocialLink href={socialUrl(first(org.site, org.website, org.websiteUrl))} label="Website"><Globe2 size={20} /></SocialLink>
                    </div>
                  </div>
                </section>
              )}

              {hosts.length > 0 && (
                <section className="edm-section">
                  <div className="edm-section-head"><span>Organizado por</span></div>
                  <div className="edm-hosts">
                    {hosts.map((host: any, index: number) => {
                      const hostName = first(host.name, host.user?.name, host.displayName);
                      if (!hostName) return null;
                      const hostImage = resolveImageUrl(first(host.photoUrl, host.imageUrl, host.avatarUrl, host.user?.photoUrl));
                      return (
                        <div className="edm-host" key={host.id || host.user?.id || `${hostName}-${index}`}>
                          <span className="edm-avatar">{hostImage ? <img src={hostImage} alt="" /> : String(hostName).charAt(0)}</span>
                          <strong>{hostName}</strong>
                          <div className="edm-host-socials">
                            <SocialLink href={socialUrl(host.instagram, 'instagram')} label={`Instagram de ${hostName}`}><Instagram size={18} /></SocialLink>
                            <SocialLink href={socialUrl(host.x, 'x')} label={`X de ${hostName}`}><span aria-hidden="true" style={{ fontWeight: 700 }}>𝕏</span></SocialLink>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="edm-support">
                {contactEmail && <a href={`mailto:${contactEmail}`}><Mail size={14} style={{ display: 'inline', marginRight: 7 }} />Contatar o Organizador</a>}
                <Link to={`/ajuda?event=${encodeURIComponent(slugOrId)}`}><Flag size={14} style={{ display: 'inline', marginRight: 7 }} />Denunciar Evento</Link>
              </div>
              {category && <div className="edm-tag"># {category}</div>}
            </div>
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
};
