import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import { useAuth } from '@/context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fullImageUrl(u?: string | null): string {
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return apiUrl(u);
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
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0, color: 'var(--tertiary-color-alpha, rgba(255, 255, 255, 0.45))' }}>
    <path fill="currentColor" fillRule="evenodd" d="M5.75 1.25a.75.75 0 1 0-1.5 0v.823l-.392.044c-.9.121-1.658.38-2.26.982s-.861 1.36-.982 2.26C.5 6.225.5 7.328.5 8.695v.11l.117 3.337c.121.9.38 1.658.982 2.26s1.36.861 2.26.982c.867.117 1.969.117 3.337.117h1.658l3.337-.117c.9-.121 1.658-.38 2.26-.982s.861-1.36.982-2.26c.117-.867.117-1.969.117-3.337v-.11l-.117-3.337c-.121-.9-.38-1.658-.982-2.26s-1.36-.861-2.26-.982l-.44-.048V1.25a.75.75 0 0 0-1.5 0v.756L8.853 2H7.195q-.78-.002-1.445.006zm4.5 3v-.744L8.798 3.5H7.25l-1.5.007v.743a.75.75 0 1 1-1.5 0v-.67l-.192.023c-.734.099-1.122.279-1.399.556s-.457.665-.556 1.399C2.002 6.313 2 7.315 2 8.75l.103 3.192c.099.734.279 1.122.556 1.399s.665.457 1.399.556c.755.101 1.756.103 3.192.103h1.548l3.192-.103c.734-.099 1.122-.279 1.399-.556s.457-.665.556-1.399c.102-.755.103-1.757.103-3.192l-.103-3.192c-.099-.734-.279-1.122-.556-1.399s-.665-.457-1.399-.556l-.241-.028v.675a.75.75 0 0 1-1.5 0zm-5 3.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0m0 3.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M8 8.5A.75.75 0 1 0 8 7a.75.75 0 1 0 0 1.5m.75 2.75a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M11.5 8.5a.75.75 0 1 0 0-1.5.75.75 0 1 0 0 1.5m.75 2.75a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0" />
  </svg>
);

// ─── Event Row (pixel-fiel ao Luma) ──────────────────────────────────────────
const EventRow = ({ event, hostAvatarSrc }: { event: any; hostAvatarSrc: string }) => {
  const start = event.startDate || event.start_date || event.date;
  const dateStr = formatEventDateLine(start);
  const imgSrc = fullImageUrl(event.image || event.bannerUrl || event.coverUrl);
  const rawAddress = event.location || '';
  const parts = rawAddress.split(',');
  const venue = event.locationName || event.venue || (parts.length > 0 ? parts[0].trim() : '');
  const slug = event.shortId || event.slug || event.id;
  const orgName = event.organization?.name || event.org?.name || event.organizerName || event.hostName || '';

  return (
    <div className="profile-event-row">
      {/* Link invisível cobrindo toda a área */}
      <Link to={`/e/${slug}`} aria-label={event.name} className="profile-event-link" />

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
            <Calendar style={{ width: 24, height: 24, color: 'var(--tertiary-color-alpha, rgba(255,255,255,0.2))' }} />
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
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ style }: { style?: React.CSSProperties }) => (
  <div className="profile-skeleton" style={style} />
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const PublicUserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const upcomingEvents = events.filter(isUpcoming);
  const pastEvents = events.filter(e => !isUpcoming(e));

  const displayName = profileUser
    ? (profileUser.name
      ? `${profileUser.name}${profileUser.surname ? ' ' + profileUser.surname : ''}`
      : (profileUser.nome || profileUser.full_name || 'Usuário'))
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
      <div style={{ minHeight: '100vh', background: 'var(--primary-bg-color, #0d0d0d)', color: 'var(--primary-color, #fff)', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <HeaderV2 transparent scrollTransition={false} />
        <div style={{ paddingTop: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '120px 24px 80px' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--card-bg-color, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ width: 40, height: 40, color: 'var(--tertiary-color-alpha, rgba(255,255,255,0.15))' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Perfil não encontrado</h1>
          <p style={{ color: 'var(--tertiary-color-alpha, rgba(255,255,255,0.4))', fontSize: 14, margin: 0 }}>Este usuário não existe ou o link está incorreto.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--tertiary-color-alpha, rgba(255,255,255,0.4))', fontSize: 14, cursor: 'pointer' }}>
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--primary-bg-color, #0d0d0d)', color: 'var(--primary-color, #fff)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header transparente — sem background */}
      <HeaderV2 transparent scrollTransition={false} />

      <style>{`
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
            border: 0.5px solid var(--divider-color, rgba(255, 255, 255, 0.15));
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
        }

        .profile-name {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: var(--primary-color, #ffffff);
            line-height: 1.2;
        }

        /* Data de Entrada */
        .profile-join-date {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--secondary-color-alpha, rgba(255, 255, 255, 0.79));
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
            color: var(--primary-color, #ffffff);
        }

        .profile-stat-label {
            color: var(--tertiary-color-alpha, rgba(255, 255, 255, 0.5));
        }

        /* Divisor */
        .profile-divider {
            border: none;
            border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.08));
            margin: 0 0 28px;
        }

        /* Listas de Eventos */
        .profile-section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--secondary-color-alpha, rgba(255, 255, 255, 0.85));
            margin-bottom: 4px;
        }

        /* Event Row Card */
        .profile-event-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            margin: 0 -12px; /* puxa para alinhar a margem do hover */
            position: relative;
            cursor: pointer;
            border-radius: 10px;
            transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s;
        }
        .profile-event-row:hover {
            background-color: var(--card-bg-color, rgba(255, 255, 255, 0.04));
            transform: translateY(-1px);
        }

        .profile-event-link {
            position: absolute;
            inset: 0;
            z-index: 2;
        }

        .profile-event-cover-wrapper {
            width: 90px;
            height: 90px;
            border-radius: 8px;
            overflow: hidden;
            flex-shrink: 0;
            background: var(--bg-opacity-8, rgba(255, 255, 255, 0.06));
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.04));
            transition: transform 0.2s;
        }
        .profile-event-row:hover .profile-event-cover-wrapper {
            transform: scale(1.02);
        }

        .profile-event-cover {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
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
            color: var(--secondary-color-alpha, rgba(255, 255, 255, 0.45));
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .profile-event-title {
            margin: 0 0 4px;
            font-size: 15px;
            font-weight: 600;
            color: var(--primary-color, #ffffff);
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
            background: rgba(255, 255, 255, 0.1);
        }

        .profile-event-host-name {
            font-size: 13px;
            color: var(--secondary-color-alpha, rgba(255, 255, 255, 0.45));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .profile-event-venue {
            font-size: 13px;
            color: var(--tertiary-color-alpha, rgba(255, 255, 255, 0.3));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Skeletons */
        .profile-skeleton {
            background: var(--bg-opacity-8, rgba(255, 255, 255, 0.06));
            border-radius: 8px;
            animation: profile-pulse 1.5s ease-in-out infinite;
        }
        @keyframes profile-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ paddingTop: 72, paddingBottom: 80 }}>
        <div className="profile-content-container">

          {/* ── Banner próprio perfil ───────────────────────────────────────── */}
          {isOwnProfile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 24,
              padding: '10px 16px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'rgba(165,180,252,1)' }}>
                👤 É assim que o seu perfil aparece para outras pessoas
              </p>
              <button
                onClick={() => navigate('/account-settings')}
                style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: 'rgba(165,180,252,1)', cursor: 'pointer', whiteSpace: 'nowrap', padding: 0 }}
              >
                Editar perfil
              </button>
            </div>
          )}

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
              <div className="profile-section-title">
                Organizando
              </div>
              <div>
                {upcomingEvents.map(ev => (
                  <EventRow key={ev.id} event={ev} hostAvatarSrc={avatarSrc} />
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
                  <EventRow key={ev.id} event={ev} hostAvatarSrc={avatarSrc} />
                ))}
              </div>
            </div>
          )}

          {/* ── Empty ────────────────────────────────────────────────────────── */}
          {!loading && events.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              {firstName} ainda não organizou nenhum evento.
            </div>
          )}

        </div>
      </div>

      <FooterV2 maxWidth="680px" />
    </div>
  );
};

export default PublicUserProfile;
