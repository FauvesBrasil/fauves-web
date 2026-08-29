import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronsRight, Users } from 'lucide-react';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import { EventSidePanel } from '@/components/v2/EventSidePanel';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fullImageUrl(u?: string | null): string {
  return resolveImageUrl(u) || '';
}

function getAvatarFallback(idOrEmail?: string | null): string {
  if (!idOrEmail) return '/avatars/avatar_1.avif';
  let sum = 0;
  for (let i = 0; i < idOrEmail.length; i++) sum += idOrEmail.charCodeAt(i);
  return `/avatars/avatar_${(sum % 47) + 1}.avif`;
}

function formatJoinDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function isUpcoming(event: any): boolean {
  const start = event.startDate || event.start_date || event.date;
  if (!start) return false;
  return new Date(start) >= new Date();
}

function formatEventDateLine(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const day = d.getDate();
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const year = d.getFullYear();
  const now = new Date();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (year !== now.getFullYear()) {
    return `${weekday}., ${day} de ${month}. de ${year}, ${time}`;
  }
  return `${weekday}., ${day} de ${month}., ${time}`;
}

// ─── CalendarIcon (SVG idêntico ao Luma) ─────────────────────────────────────
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0, color: 'var(--profile-subtle, #939597)' }}>
    <path fill="currentColor" fillRule="evenodd" d="M5.75 1.25a.75.75 0 1 0-1.5 0v.823l-.392.044c-.9.121-1.658.38-2.26.982s-.861 1.36-.982 2.26C.5 6.225.5 7.328.5 8.695v.11l.117 3.337c.121.9.38 1.658.982 2.26s1.36.861 2.26.982c.867.117 1.969.117 3.337.117h1.658l3.337-.117c.9-.121 1.658-.38 2.26-.982s.861-1.36.982-2.26c.117-.867.117-1.969.117-3.337v-.11l-.117-3.337c-.121-.9-.38-1.658-.982-2.26s-1.36-.861-2.26-.982l-.44-.048V1.25a.75.75 0 0 0-1.5 0v.756L8.853 2H7.195q-.78-.002-1.445.006zm4.5 3v-.744L8.798 3.5H7.25l-1.5.007v.743a.75.75 0 1 1-1.5 0v-.67l-.192.023c-.734.099-1.122.279-1.399.556s-.457.665-.556 1.399C2.002 6.313 2 7.315 2 8.75l.103 3.192c.099.734.279 1.122.556 1.399s.665.457 1.399.556c.755.101 1.756.103 3.192.103h1.548l3.192-.103c.734-.099 1.122-.279 1.399-.556s.457-.665.556-1.399c.102-.755.103-1.757.103-3.192l-.103-3.192c-.099-.734-.279-1.122-.556-1.399s-.665-.457-1.399-.556l-.241-.028v.675a.75.75 0 0 1-1.5 0zm-5 3.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0m0 3.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M8 8.5A.75.75 0 1 0 8 7a.75.75 0 1 0 0 1.5m.75 2.75a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M11.5 8.5a.75.75 0 1 0 0-1.5.75.75 0 1 0 0 1.5m.75 2.75a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0" />
  </svg>
);

// ─── Event Row (pixel-fiel ao Luma) ──────────────────────────────────────────
const EventRow = ({ event, hostAvatarSrc, hostName, onClick }: { event: any; hostAvatarSrc: string; hostName: string; onClick: () => void }) => {
  const start = event.startDate || event.start_date || event.date;
  const dateStr = formatEventDateLine(start);
  const imgSrc = fullImageUrl(event.image || event.bannerUrl || event.coverUrl);
  const rawAddress = event.location || '';
  const parts = rawAddress.split(',');
  const venue = event.locationName || event.venue || (parts.length > 0 ? parts[0].trim() : '');
  const orgName = event.organization?.name || event.org?.name || event.organizationName || event.organizerName || event.hostName || hostName;

  return (
    <button type="button" className="profile-event-row" onClick={onClick} aria-label={`Abrir detalhes de ${event.name}`}>
      {/* Cover image — 90x90 retangular com bordas arredondadas */}
      <div className="profile-event-cover-wrapper">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={event.name}
            width={90}
            height={90}
            className="profile-event-cover"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar style={{ width: 24, height: 24, color: 'var(--profile-subtle, #939597)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="profile-event-info">
        {/* Data */}
        <div className="profile-event-date">
          {dateStr}
        </div>

        {/* Título */}
        <h3 className="profile-event-title">
          {event.name}
        </h3>

        {/* Organizador */}
        {orgName && (
          <div className="profile-event-host-row">
            {/* Mini avatar do host */}
            <div className="profile-event-host-avatar">
              {hostAvatarSrc && (
                <img src={hostAvatarSrc} alt="" width={14} height={14} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <span className="profile-event-host-name">
              Por {orgName}
            </span>
          </div>
        )}

        {/* Venue */}
        {venue && (
          <div className="profile-event-venue">
            {venue}
          </div>
        )}
      </div>
    </button>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ style }: { style?: React.CSSProperties }) => (
  <div className="profile-skeleton" style={style} />
);

const ProfileEventsPanel = ({
  open,
  detailOpen,
  events,
  displayName,
  avatarSrc,
  onClose,
  onSelect,
}: {
  open: boolean;
  detailOpen: boolean;
  events: any[];
  displayName: string;
  avatarSrc: string;
  onClose: () => void;
  onSelect: (event: any) => void;
}) => {
  React.useEffect(() => {
    if (!open) return;
    const releaseScrollLock = acquireDocumentScrollLock();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !detailOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [detailOpen, onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="profile-events-panel-backdrop"
            aria-label="Fechar lista de eventos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="profile-events-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Eventos organizados por ${displayName}`}
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
          >
            <header className="profile-events-panel-toolbar">
              <button type="button" onClick={onClose} className="profile-events-panel-close" aria-label="Fechar">
                <ChevronsRight size={21} strokeWidth={2.5} />
              </button>
              <strong>Eventos</strong>
            </header>
            <div className="profile-events-panel-scroll">
              <div className="profile-events-panel-owner">
                <img src={avatarSrc} alt="" />
                <span>{displayName}</span>
                <h2>Organizando</h2>
              </div>
              <div className="profile-events-panel-list">
                {events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    hostAvatarSrc={avatarSrc}
                    hostName={displayName}
                    onClick={() => onSelect(event)}
                  />
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const PublicUserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { isDark } = useTheme();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [eventsPanelOpen, setEventsPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [panelEventList, setPanelEventList] = useState<any[]>([]);

  const isOwnProfile = !!(currentUser && userId && currentUser.id === userId);

  useEffect(() => {
    // Aguarda o auth terminar de carregar antes de decidir se é "not found"
    if (!userId || authLoading) return;

    // Reseta estado a cada tentativa
    setNotFound(false);

    if (isOwnProfile && currentUser) {
      setProfileUser({
        name: currentUser.name,
        email: currentUser.email,
        photoUrl: currentUser.photoUrl,
        id: currentUser.id,
      });
    }

    (async () => {
      setLoading(true);
      try {
        const userRes = await fetchApi(`/api/users/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfileUser(userData.user || userData);
        } else if (!isOwnProfile) {
          setNotFound(true);
          return;
        }
        const evRes = await fetchApi(`/api/events/by-user?userId=${userId}&include=organization`);
        if (evRes.ok) {
          const evData = await evRes.json();
          const arr = Array.isArray(evData) ? evData : (evData.items || evData.events || []);
          setEvents(arr);
        }
      } catch {
        if (!isOwnProfile) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, isOwnProfile, authLoading]);

  const eventTimestamp = (event: any) => new Date(event.startDate || event.start_date || event.date || 0).getTime();
  const upcomingEvents = events.filter(isUpcoming).sort((a, b) => eventTimestamp(a) - eventTimestamp(b));
  const pastEvents = events.filter(e => !isUpcoming(e)).sort((a, b) => eventTimestamp(b) - eventTimestamp(a));
  const visibleUpcomingEvents = upcomingEvents.slice(0, 4);
  const selectedEventIndex = selectedEvent
    ? panelEventList.findIndex((event) => event.id === selectedEvent.id)
    : -1;

  const openEvent = (event: any, sourceEvents: any[]) => {
    setPanelEventList(sourceEvents);
    setSelectedEvent(event);
  };

  const moveSelectedEvent = (offset: number) => {
    const next = panelEventList[selectedEventIndex + offset];
    if (next) setSelectedEvent(next);
  };

  const profileBaseName = profileUser?.name || profileUser?.nome || profileUser?.full_name || '';
  const profileSurname = profileUser?.surname || '';
  const displayName = profileBaseName
    ? (profileSurname && !profileBaseName.toLocaleLowerCase('pt-BR').endsWith(profileSurname.toLocaleLowerCase('pt-BR'))
      ? `${profileBaseName} ${profileSurname}`
      : profileBaseName)
    : 'Usuário';
  const firstName = displayName.split(' ')[0];
  const avatarSrc =
    fullImageUrl(profileUser?.photoUrl || profileUser?.photo || profileUser?.avatarUrl) ||
    getAvatarFallback(profileUser?.email || userId);
  const joinDate = formatJoinDate(profileUser?.createdAt || profileUser?.created_at);
  const hostedCount = events.length;
  const participatedCount: number | null = profileUser?.participatedCount ?? profileUser?.attendedCount ?? null;

  // ─── Not found ──────────────────────────────────────────────────────────────
  if (!loading && notFound) {
    return (
      <div className="luma-theme" style={{ minHeight: '100vh', background: 'var(--primary-bg-color)', color: 'var(--primary-color)', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <HeaderV2 transparent scrollTransition={false} theme={isDark ? 'dark' : 'light'} blueGlow={false} />
        <div style={{ paddingTop: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '120px 24px 80px' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--card-bg-color, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ width: 40, height: 40, color: 'var(--tertiary-color)' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Perfil não encontrado</h1>
          <p style={{ color: 'var(--secondary-color)', fontSize: 14, margin: 0 }}>Este usuário não existe ou o link está incorreto.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--secondary-color)', fontSize: 14, cursor: 'pointer' }}>
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="luma-theme public-profile-page" style={{ minHeight: '100vh', background: 'var(--primary-bg-color)', color: 'var(--profile-text)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header transparente — sem background */}
      <HeaderV2 transparent scrollTransition={false} theme={isDark ? 'dark' : 'light'} blueGlow={false} />

      <style>{`
        .public-profile-page {
            --profile-text: #212325;
            --profile-muted: #737577;
            --profile-subtle: #939597;
            --profile-divider: #ebeced;
            --profile-raised: #f7f8f9;
        }
        .dark .public-profile-page {
            --profile-text: #ffffff;
            --profile-muted: #939597;
            --profile-subtle: #737577;
            --profile-divider: #262626;
            --profile-raised: rgba(255,255,255,.06);
        }

        /* Container Principal */
        .profile-content-container {
            max-width: 40rem; /* 640px como no dump */
            margin: 0 auto;
            padding: 3rem 1.25rem 2rem;
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        }

        /* Cabeçalho do Perfil (Hero) */
        .profile-top-section {
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        @media (max-width: 640px) {
            .profile-content-container {
                padding: 28px 16px 20px;
            }
            .profile-top-section {
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 1.25rem;
            }
        }

        /* Wrapper do Avatar */
        .profile-avatar-wrapper {
            flex-shrink: 0;
            position: relative;
            border-radius: 50%;
            overflow: hidden;
            width: 112px;
            height: 112px;
            box-shadow: var(--shadow-xs, 0 1px 4px rgba(0,0,0,0.1));
            border: 1px solid var(--profile-divider);
            transition: transform 0.3s ease;
        }
        .profile-avatar-wrapper:hover {
            transform: scale(1.03);
        }

        .profile-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        /* Bloco de Informações */
        .profile-info-block {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.5rem;
            flex: 1;
            min-width: 0;
            padding-top: 8px;
        }
        @media (max-width: 640px) {
            .profile-info-block {
                align-items: center;
            }
            .profile-stats-container { justify-content: center; flex-wrap: wrap; row-gap: 6px; }
        }

        .profile-name {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: var(--profile-text);
            line-height: 1.2;
        }

        /* Data de Entrada */
        .profile-join-date {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--profile-muted);
            font-size: 13px;
        }

        /* Estatísticas */
        .profile-stats-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 2px;
        }

        .profile-stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            white-space: nowrap;
        }

        .profile-stat-num {
            font-weight: 600;
            color: var(--profile-text);
        }

        .profile-stat-label {
            color: var(--profile-muted);
        }

        /* Divisor */
        .profile-divider {
            border: none;
            border-top: 1px solid var(--profile-divider);
            margin: 0 0 28px;
        }

        /* Listas de Eventos */
        .profile-section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--profile-text);
            margin-bottom: 4px;
        }

        /* Event Row Card */
        .profile-event-row {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            margin: 0;
            position: relative;
            cursor: pointer;
            border: 0;
            border-radius: 0;
            background: transparent;
            color: inherit;
            font: inherit;
            text-align: left;
        }
        .profile-event-row:focus-visible {
            outline: 2px solid #2A2AD7;
            outline-offset: 4px;
            border-radius: 8px;
        }

        .profile-event-cover-wrapper {
            width: 90px;
            height: 90px;
            border-radius: 8px;
            overflow: hidden;
            flex-shrink: 0;
            background: var(--profile-raised);
            border: 1px solid var(--profile-divider);
            position: relative;
            z-index: 0;
            transform: translateZ(0);
            transform-origin: center;
            transition: transform .22s cubic-bezier(.2,.75,.2,1), box-shadow .22s ease, border-color .22s ease;
        }
        .profile-event-row:hover .profile-event-cover-wrapper {
            z-index: 2;
            transform: translateY(-2px) scale(1.055);
            border-color: color-mix(in srgb, var(--profile-text) 18%, var(--profile-divider));
            box-shadow: 0 12px 25px rgba(0,0,0,.16);
        }

        .profile-event-cover {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: none;
        }

        .profile-event-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .profile-event-date {
            font-size: 13px;
            color: var(--profile-muted);
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .profile-event-title {
            margin: 0 0 4px;
            font-size: 15px;
            font-weight: 600;
            color: var(--profile-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Organizador (Host) */
        .profile-event-host-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 2px;
        }

        .profile-event-host-avatar {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            background: var(--profile-raised);
        }

        .profile-event-host-name {
            font-size: 13px;
            color: var(--profile-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .profile-event-venue {
            font-size: 13px;
            color: var(--profile-subtle);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Skeletons */
        .profile-skeleton {
            background: var(--profile-raised);
            border-radius: 8px;
            animation: profile-pulse 1.5s ease-in-out infinite;
        }
        @keyframes profile-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        .profile-section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 4px;
        }
        .profile-section-heading .profile-section-title { margin-bottom: 0; }
        .profile-see-all {
            border: 0;
            background: transparent;
            color: var(--profile-muted);
            padding: 4px 0;
            font: inherit;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: color .16s ease;
        }
        .profile-see-all:hover { color: var(--profile-text); }

        .profile-events-panel-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1180;
            border: 0;
            background: rgba(0,0,0,.56);
            backdrop-filter: blur(4px);
        }
        .profile-events-panel {
            --pep-bg: #fff;
            --pep-border: rgba(19,21,23,.1);
            --profile-text: #212325;
            --profile-muted: #737577;
            --profile-subtle: #939597;
            --profile-divider: #ebeced;
            --profile-raised: #f7f8f9;
            position: fixed;
            z-index: 1181;
            top: 12px;
            right: 12px;
            bottom: 12px;
            width: min(var(--fauves-side-panel-width, 520px), calc(100vw - 24px));
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid var(--pep-border);
            border-radius: var(--fauves-modal-radius, 14px);
            background: var(--pep-bg);
            color: var(--profile-text);
            box-shadow: 0 22px 64px rgba(0,0,0,.32);
        }
        .dark .profile-events-panel {
            --pep-bg: #181a1b;
            --pep-border: rgba(255,255,255,.09);
            --profile-text: #f7f7f7;
            --profile-muted: #a0a2a4;
            --profile-subtle: #737577;
            --profile-divider: rgba(255,255,255,.09);
            --profile-raised: rgba(255,255,255,.06);
            color: var(--profile-text);
        }
        .profile-events-panel-toolbar {
            min-height: 52px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 11px;
            border-bottom: 1px solid var(--pep-border);
        }
        .profile-events-panel-close {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border: 0;
            border-radius: var(--fauves-control-radius, 8px);
            background: rgba(127,127,127,.13);
            color: inherit;
            cursor: pointer;
        }
        .profile-events-panel-toolbar strong { font-size: 13px; font-weight: 600; }
        .profile-events-panel-scroll { flex: 1; overflow: auto; padding: 22px 20px 30px; }
        .profile-events-panel-owner {
            padding-bottom: 20px;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--pep-border);
        }
        .profile-events-panel-owner img {
            width: 56px;
            height: 56px;
            display: block;
            margin-bottom: 12px;
            border-radius: 50%;
            object-fit: cover;
        }
        .profile-events-panel-owner span {
            display: block;
            color: color-mix(in srgb, currentColor 58%, transparent);
            font-size: 13px;
        }
        .profile-events-panel-owner h2 { margin: 2px 0 0; font-size: 18px; font-weight: 650; }
        .profile-events-panel-list .profile-event-row { padding: 8px 0; }
        .profile-events-panel-list .profile-event-cover-wrapper { width: 78px; height: 78px; }
        @media (max-width: 640px) {
            .profile-events-panel { inset: 0; width: 100%; border: 0; border-radius: 0; }
            .profile-events-panel-scroll { padding: 22px 18px 30px; }
            .profile-events-panel-toolbar { min-height: 60px; padding-top: max(8px, env(safe-area-inset-top)); }
            .profile-events-panel-close { width: 44px; height: 44px; }
            .profile-event-row { min-height: 96px; }
            .profile-see-all { min-height: 44px; padding: 8px 0; }
        }
        @media (max-width: 380px) {
            .profile-event-cover-wrapper { width: 76px; height: 76px; }
            .profile-event-title { white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        }
      `}</style>

      <div style={{ paddingTop: 72, paddingBottom: 80 }}>
        <div className="profile-content-container">

          {/* ── Profile Hero ────────────────────────────────────────────────── */}
          {loading ? (
            <div className="profile-top-section">
              <Skeleton style={{ width: 112, height: 112, borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                <Skeleton style={{ width: 140, height: 22 }} />
                <Skeleton style={{ width: 180, height: 14 }} />
                <Skeleton style={{ width: 160, height: 14 }} />
              </div>
            </div>
          ) : (
            <div className="profile-top-section">
              {/* Avatar 112px — idêntico ao Luma */}
              <div className="profile-avatar-wrapper">
                <img
                  src={avatarSrc}
                  alt={`Foto de perfil de ${firstName}`}
                  className="profile-avatar-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getAvatarFallback(profileUser?.email || userId);
                  }}
                />
              </div>

              {/* Info */}
              <div className="profile-info-block">
                <h1 className="profile-name">
                  {displayName}
                </h1>

                {/* Join date */}
                {joinDate && (
                  <div className="profile-join-date">
                    <CalendarIcon />
                    <span>Entrou em {joinDate}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="profile-stats-container">
                  {hostedCount > 0 && (
                    <div className="profile-stat-item">
                      <span className="profile-stat-num">{hostedCount}</span>
                      <span className="profile-stat-label">Hospedado{hostedCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {participatedCount !== null && (
                    <div className="profile-stat-item">
                      <span className="profile-stat-num">{participatedCount}</span>
                      <span className="profile-stat-label">Participou</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <hr className="profile-divider" />

          {/* ── Skeleton eventos ─────────────────────────────────────────────── */}
          {loading && (
            <div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0' }}>
                  <Skeleton style={{ width: 90, height: 90, flexShrink: 0, borderRadius: 8 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton style={{ width: 160, height: 12, borderRadius: 4 }} />
                    <Skeleton style={{ width: 220, height: 16, borderRadius: 4 }} />
                    <Skeleton style={{ width: 120, height: 12, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Organizando ──────────────────────────────────────────────────── */}
          {!loading && upcomingEvents.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div className="profile-section-heading">
                <div className="profile-section-title">Organizando</div>
                <button type="button" className="profile-see-all" onClick={() => setEventsPanelOpen(true)}>
                  Ver tudo
                </button>
              </div>
              <div>
                {visibleUpcomingEvents.map(ev => (
                  <EventRow key={ev.id} event={ev} hostAvatarSrc={avatarSrc} hostName={displayName} onClick={() => openEvent(ev, upcomingEvents)} />
                ))}
              </div>
            </div>
          )}

          {/* ── Eventos Passados ─────────────────────────────────────────────── */}
          {!loading && pastEvents.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              {upcomingEvents.length > 0 && (
                <hr className="profile-divider" />
              )}
              <div className="profile-section-title">
                Eventos Passados
              </div>
              <div style={{ opacity: 0.8 }}>
                {pastEvents.map(ev => (
                  <EventRow key={ev.id} event={ev} hostAvatarSrc={avatarSrc} hostName={displayName} onClick={() => openEvent(ev, pastEvents)} />
                ))}
              </div>
            </div>
          )}

          {/* ── Empty ────────────────────────────────────────────────────────── */}
          {!loading && events.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--profile-subtle)', fontSize: 14 }}>
              {firstName} ainda não organizou nenhum evento.
            </div>
          )}

        </div>
      </div>

      <FooterV2 maxWidth="680px" />

      <ProfileEventsPanel
        open={eventsPanelOpen}
        detailOpen={Boolean(selectedEvent)}
        events={upcomingEvents}
        displayName={displayName}
        avatarSrc={avatarSrc}
        onClose={() => setEventsPanelOpen(false)}
        onSelect={(event) => openEvent(event, upcomingEvents)}
      />

      <EventSidePanel
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        onNext={() => moveSelectedEvent(1)}
        onPrev={() => moveSelectedEvent(-1)}
        hasNext={selectedEventIndex >= 0 && selectedEventIndex < panelEventList.length - 1}
        hasPrev={selectedEventIndex > 0}
      />
    </div>
  );
};

export default PublicUserProfile;
