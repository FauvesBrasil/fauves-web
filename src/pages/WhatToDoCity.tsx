import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock3, Landmark, MapPin, Plus, Rss, Search } from 'lucide-react';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import SubscribeControl from '@/components/v2/SubscribeControl';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useSEO } from '@/hooks/useSEO';
import { useTheme } from '@/context/ThemeContext';
import { EventSidePanel } from '@/components/v2/EventSidePanel';

type CityEvent = {
  id: string;
  name: string;
  slug?: string | null;
  startDate: string;
  location?: string | null;
  locationName?: string | null;
  venue?: string | null;
  locationCity?: string | null;
  locationUf?: string | null;
  bannerUrl?: string | null;
  banner?: string | null;
  image?: string | null;
  organization?: { name?: string | null } | null;
  price?: number | null;
};

const cityNames: Record<string, string> = {
  'sao-paulo': 'São Paulo', 'rio-de-janeiro': 'Rio de Janeiro', vitoria: 'Vitória',
  maceio: 'Maceió', belem: 'Belém', florianopolis: 'Florianópolis', goiania: 'Goiânia',
  cuiaba: 'Cuiabá', 'sao-luis': 'São Luís', bogota: 'Bogotá', medellin: 'Medellín',
  'buenos-aires': 'Buenos Aires',
};

const cityImages: Record<string, string> = {
  fortaleza: 'https://pub-5d5ce29d165a4389942365032d7efda5.r2.dev/cidades/fortaleza.png',
  bogota: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?q=85&w=2000&auto=format&fit=crop',
  'sao-paulo': 'https://visitesaopaulo.com/wp-content/uploads/2023/05/banner-i.jpg',
  'rio-de-janeiro': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=85&w=2000&auto=format&fit=crop',
  salvador: 'https://images.unsplash.com/photo-1591461537233-0443fe0364d0?q=85&w=2000&auto=format&fit=crop',
  curitiba: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=85&w=2000&auto=format&fit=crop',
};

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const displayCity = (slug: string) => cityNames[slug] || slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');

const formatCompactLocation = (event: CityEvent) => {
  const venue = (event.locationName || event.venue || event.location?.split(',')[0] || '').trim();
  const city = event.locationCity?.trim() || '';
  const uf = event.locationUf?.trim() || '';
  return [venue && normalize(venue) !== normalize(city) ? venue : '', [city, uf].filter(Boolean).join(' - ')].filter(Boolean).join(', ');
};

const formatDay = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date).replace('.', '');
};

const StickyEventDay: React.FC<{ date: Date }> = ({ date }) => {
  const markerRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setStuck((markerRef.current?.getBoundingClientRect().top || Infinity) <= 65));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div ref={markerRef} className={`city-event-day${stuck ? ' is-stuck' : ''}`}><i /><span className="city-event-day-pill"><strong>{formatDay(date)}</strong><span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)}</span></span></div>;
};

const WhatToDoCity: React.FC = () => {
  const { isDark } = useTheme();
  const { citySlug: legacyCitySlug, slugOrId } = useParams<{ citySlug?: string; slugOrId?: string }>();
  const citySlug = legacyCitySlug || slugOrId || '';
  const cityName = displayCity(citySlug);
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsPanelOpen(true);
  };

  const currentIndex = useMemo(() => {
    if (!selectedEvent) return -1;
    return events.findIndex((ev) => ev.id === selectedEvent.id);
  }, [selectedEvent, events]);

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < events.length - 1) {
      setSelectedEvent(events[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedEvent(events[currentIndex - 1]);
    }
  };

  useSEO({
    title: `Eventos em ${cityName} · Fauves`,
    description: `Descubra os próximos eventos em ${cityName}.`,
    url: `/${citySlug}`,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchApi('/api/events?limit=200');
        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : [];
        setEvents(list.filter((event: CityEvent) => normalize(event.locationCity || '') === normalize(cityName))
          .filter((event: CityEvent) => new Date(event.startDate).getTime() >= Date.now())
          .sort((a: CityEvent, b: CityEvent) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
      } catch (error) {
        console.error('Error loading city events:', error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [cityName]);

  const groups = useMemo(() => {
    const result = new Map<string, CityEvent[]>();
    events.forEach((event) => {
      const key = new Date(event.startDate).toDateString();
      result.set(key, [...(result.get(key) || []), event]);
    });
    return Array.from(result.entries());
  }, [events]);

  const heroImage = cityImages[citySlug] || `https://images.unsplash.com/featured/?${encodeURIComponent(cityName)},city,skyline`;

  return (
    <div className={`city-events-page theme-root ${isDark ? 'dark dark-mode' : 'light'}`}>
      <HeaderV2 transparent fixed theme="dark" blueGlow={false} contentMaxWidth="928px" />

      <section className="city-events-hero" style={{ '--city-image': `url("${heroImage}")` } as React.CSSProperties}>
        <div className="city-events-photo" />
        <div className="city-events-hero-shade" />
        <div className="city-events-hero-content" data-header-align>
          <span className="city-events-icon"><Landmark size={25} strokeWidth={1.6} /></span>
          <p>O que está acontecendo em</p>
          <h1>{cityName}</h1>
          <span className="city-events-time"><Clock3 size={15} /> Horário local</span>
          <div className="city-events-rule" />
          <p className="city-events-description">Descubra eventos, encontros e experiências acontecendo em {cityName}.</p>
          <SubscribeControl scope={`city:${citySlug}`} />
        </div>
      </section>

      <main className="city-events-main">
        <section className="city-events-list-column">
          <header className="city-events-list-header">
            <h2>Eventos</h2>
            <div>
              <Link className="v2-secondary-action" to="/create"><Plus size={14} />Enviar Evento</Link>
              <button className="city-square-button" type="button" aria-label="Feed"><Rss size={15} /></button>
              <button className="city-square-button" type="button" aria-label="Buscar"><Search size={15} /></button>
            </div>
          </header>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer { 0%, 100% { opacity: .45 } 50% { opacity: .85 } }
                .skeleton-pulse { animation: shimmer 1.5s infinite ease-in-out; background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}; border-radius: 8px; }
              ` }} />
              <div className="skeleton-pulse" style={{ height: '140px', width: '100%', borderRadius: '12px' }} />
              <div className="skeleton-pulse" style={{ height: '140px', width: '100%', borderRadius: '12px' }} />
              <div className="skeleton-pulse" style={{ height: '140px', width: '100%', borderRadius: '12px' }} />
            </div>
          ) : groups.length ? groups.map(([key, group]) => {
            const date = new Date(group[0].startDate);
            return <section className="city-event-group" key={key}>
              <StickyEventDay date={date} />
              <div className="city-event-cards">{group.map((event) => {
                const image = resolveImageUrl(event.bannerUrl || event.banner || event.image);
                const location = formatCompactLocation(event);
                return <div className="city-event-card" onClick={() => handleEventClick(event)} key={event.id} style={{ cursor: 'pointer' }}>
                  <div className="city-event-copy">
                    <time>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.startDate))}</time>
                    <h3>{event.name}</h3>
                    {event.organization?.name && <p>{event.organization.name}</p>}
                    {location && <p className="city-event-location" title={location}><MapPin size={15} /><span>{location}</span></p>}
                    {event.price != null && event.price > 0 && <small>R$ {event.price.toLocaleString('pt-BR')}</small>}
                  </div>
                  <span className="city-event-image">{image ? <img src={image} alt="" /> : <Landmark size={28} />}</span>
                </div>;
              })}</div>
            </section>;
          }) : <p className="city-events-empty">Nenhum evento próximo em {cityName}.</p>}
        </section>

        <aside className="city-events-aside">
          <span className="city-events-aside-icon"><Landmark size={24} /></span>
          <h3>{cityName}</h3>
          <p>Receba novidades sobre os próximos eventos em {cityName}.</p>
          <SubscribeControl scope={`city:${citySlug}`} compact />
          <div className="city-events-map"><MapPin size={27} /><strong>{cityName}</strong></div>
        </aside>
      </main>

      <EventSidePanel
        event={selectedEvent}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={currentIndex >= 0 && currentIndex < events.length - 1}
        hasPrev={currentIndex > 0}
      />

      <FooterV2 maxWidth="928px" />
      <style>{cityStyles}</style>
    </div>
  );
};

const cityStyles = `
  .city-events-page { min-height: 100vh; overflow-x: hidden; color: #f5f5f5; background: #121416; font-family: Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
  .city-events-hero { position: relative; height: 770px; overflow: hidden; }
  .city-events-photo { position: absolute; inset: 0; background-image: var(--city-image); background-position: center; background-size: cover; }
  .city-events-hero-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(70,50,28,.82) 0%, rgba(70,50,28,.64) 42%, rgba(20,20,20,.08) 72%); }
  .city-events-hero-content { position: relative; display: flex; width: min(100% - 32px, 928px); height: 100%; margin: 0 auto; flex-direction: column; align-items: flex-start; justify-content: center; }
  .city-events-icon,.city-events-aside-icon { display:grid; width:48px; height:48px; place-items:center; border:1px solid rgba(255,255,255,.18); border-radius:50%; background:rgba(255,255,255,.12); }
  .city-events-hero-content > p:first-of-type { margin:28px 0 3px; color:rgba(255,255,255,.62); font-size:1.65rem; font-weight:500; }
  .city-events-hero h1 { margin:0; color:#fff; font-size:3.25rem; font-weight:600; letter-spacing:-.035em; }
  .city-events-time { display:flex; align-items:center; gap:7px; margin-top:17px; color:rgba(255,255,255,.62); font-size:.875rem; font-weight:500; }
  .city-events-rule { width:465px; height:1px; margin:28px 0 25px; background:rgba(255,255,255,.18); }
  .city-events-description { width:min(465px,100%); margin:0 0 29px; color:rgba(255,255,255,.88); font-size:.9375rem; font-weight:500; line-height:1.55; }
  .city-events-hero .subscribe-control { max-width:160px; }
  .city-events-hero .subscribe-control-action { width:160px; }
  .city-events-main { display:grid; width:min(100% - 32px,928px); margin:0 auto; padding:42px 0 80px; grid-template-columns:minmax(0,620px) 260px; gap:48px; }
  .city-events-list-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:27px; }
  .city-events-list-header h2 { margin:0; font-size:1.25rem; font-weight:600; }
  .city-events-list-header > div { display:flex; gap:5px; }
  .city-square-button { display:grid; width:31px; height:31px; padding:0; place-items:center; border:0; border-radius:8px; color:rgba(255,255,255,.58); background:rgba(255,255,255,.08); cursor:pointer; }
  .city-square-button:hover { color:#fff; background:rgba(255,255,255,.12); }
  .city-event-group { position:relative; padding-left:25px; margin-bottom:20px; }
  .city-event-group::before { content:''; position:absolute; top:8px; bottom:-21px; left:5px; border-left:2px dashed rgba(255,255,255,.10); }
  .city-event-day { position:sticky; top:64px; z-index:4; display:flex; width:max-content; max-width:100%; align-items:center; margin:0 0 16px -8px; padding:4px 8px; border-radius:999px; transition:background-color .16s ease,box-shadow .16s ease,backdrop-filter .16s ease; }
  .city-event-day.is-stuck { background:rgba(35,37,39,.78); box-shadow:0 1px 0 rgba(255,255,255,.08); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); }
  .city-event-day-pill { display:flex; align-items:baseline; gap:5px; min-width:0; }
  .city-event-day i { position:absolute; left:-20px; top:11px; width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.4); }
  .city-event-day.is-stuck i { opacity:0; }
  .city-event-day strong { color:#f5f5f5; font-size:.875rem; font-weight:600; }
  .city-event-day-pill > span { color:rgba(255,255,255,.45); font-size:.8125rem; }
  .city-event-cards { display:grid; gap:15px; }
  .city-event-card { display:flex; min-height:150px; padding:13px; justify-content:space-between; gap:18px; border:1px solid rgba(255,255,255,.075); border-radius:12px; color:inherit; background:#202224; text-decoration:none; transition:border-color .16s ease; }
  .city-event-card:hover { border-color:rgba(255,255,255,.24); }
  .city-event-copy { min-width:0; flex:1 1 auto; overflow:hidden; }
  .city-event-copy time { color:rgba(255,255,255,.48); font-size:.875rem; font-weight:600; }
  .city-event-copy h3 { margin:8px 0 9px; color:#fff; font-size:1.05rem; font-weight:600; line-height:1.3; }
  .city-event-copy p { display:flex; align-items:center; gap:6px; margin:5px 0; overflow:hidden; color:rgba(255,255,255,.48); font-size:.8125rem; font-weight:500; text-overflow:ellipsis; white-space:nowrap; }
  .city-event-location svg { flex:0 0 auto; }
  .city-event-location span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .city-event-copy small { display:inline-block; margin-top:8px; padding:3px 7px; border-radius:4px; color:#84da91; background:rgba(39,153,61,.18); font-size:.7rem; font-weight:600; }
  .city-event-image { display:grid; width:120px; height:120px; flex:0 0 120px; overflow:hidden; place-items:center; border-radius:8px; color:rgba(255,255,255,.28); background:#181a1c; }
  .city-event-image img { width:100%; height:100%; object-fit:cover; }
  .city-events-aside { padding-top:0; }
  .city-events-aside-icon { color:#fff; background:#d98445; border:0; }
  .city-events-aside h3 { margin:18px 0 8px; font-size:1rem; font-weight:600; }
  .city-events-aside > p { margin:0 0 17px; color:rgba(255,255,255,.7); font-size:.8125rem; font-weight:500; line-height:1.5; }
  .city-events-map { display:flex; height:260px; margin-top:32px; align-items:center; justify-content:center; gap:6px; border-radius:10px; color:rgba(255,255,255,.45); background:radial-gradient(circle at 60% 35%,rgba(255,255,255,.09),transparent 28%),repeating-linear-gradient(35deg,#292b2d 0 2px,#222426 2px 14px); }
  .city-events-empty { padding:25px; border:1px solid rgba(255,255,255,.07); border-radius:12px; color:rgba(255,255,255,.48); background:#202224; font-size:.875rem; }
  .city-events-loader { display:block; width:30px; height:30px; margin:80px auto; border:2px solid rgba(255,255,255,.12); border-top-color:#fff; border-radius:50%; animation:city-spin .8s linear infinite; }
  .city-events-page.light {
    --footer-text-color:#71717a;
    --footer-hover-color:#18181b;
    --footer-border-color:rgba(24,24,27,.1);
    --footer-social-color:#71717a;
    --footer-social-hover:#18181b;
    --footer-logo-color:#18181b;
    color:#27272a;
    background:#f7f8f9;
  }
  .city-events-page.light .city-events-list-header h2,
  .city-events-page.light .city-event-day strong,
  .city-events-page.light .city-event-copy h3,
  .city-events-page.light .city-events-aside h3 { color:#18181b; }
  .city-events-page.light .city-square-button { color:#71717a; background:rgba(24,24,27,.07); }
  .city-events-page.light .city-square-button:hover { color:#18181b; background:rgba(24,24,27,.11); }
  .city-events-page.light .city-event-group::before { border-left-color:rgba(24,24,27,.11); }
  .city-events-page.light .city-event-day.is-stuck { background:rgba(247,248,249,.84); box-shadow:0 1px 0 rgba(24,24,27,.1); }
  .city-events-page.light .city-event-day i { background:rgba(24,24,27,.35); }
  .city-events-page.light .city-event-day-pill > span,
  .city-events-page.light .city-event-copy time,
  .city-events-page.light .city-event-copy p,
  .city-events-page.light .city-events-aside > p { color:#71717a; }
  .city-events-page.light .city-event-card,
  .city-events-page.light .city-events-empty {
    border-color:rgba(24,24,27,.1);
    background:#fff;
  }
  .city-events-page.light .city-event-card:hover { border-color:rgba(24,24,27,.27); }
  .city-events-page.light .city-event-image { color:#a1a1aa; background:#f1f1f2; }
  .city-events-page.light .city-events-map {
    color:#71717a;
    background:radial-gradient(circle at 60% 35%,rgba(255,255,255,.9),transparent 28%),repeating-linear-gradient(35deg,#e4e4e7 0 2px,#eeeeef 2px 14px);
  }
  .city-events-page.light .city-events-empty { color:#71717a; }
  .city-events-page.light .city-events-loader { border-color:rgba(24,24,27,.12); border-top-color:#27272a; }
  @keyframes city-spin { to { transform:rotate(360deg); } }
  @media(max-width:760px){
    .city-events-hero{height:620px}.city-events-hero-content>p:first-of-type{font-size:1.25rem}.city-events-hero h1{font-size:2.5rem}.city-events-rule{width:100%}
    .city-events-main{grid-template-columns:1fr}.city-events-aside{display:none}.city-events-list-header{align-items:flex-start}.city-event-image{width:88px;height:88px;flex-basis:88px}
  }
`;

export default WhatToDoCity;
