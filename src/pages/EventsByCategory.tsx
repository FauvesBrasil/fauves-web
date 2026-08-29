import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Baby,
  CalendarDays,
  Church,
  Dumbbell,
  Map as MapIcon,
  MicVocal,
  PartyPopper,
  Search,
  Trophy,
  Users,
} from 'lucide-react';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import SubscribeControl from '@/components/v2/SubscribeControl';
import { useSEO } from '@/hooks/useSEO';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useTheme } from '@/context/ThemeContext';

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  color?: string | null;
  description?: string | null;
  subscriberCount?: number;
};

type CategoryEvent = {
  id: string;
  name: string;
  slug?: string | null;
  startDate: string;
  endDate?: string | null;
  image?: string | null;
  location?: string | null;
  locationCity?: string | null;
  locationUf?: string | null;
};

type Organization = {
  id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  bio?: string | null;
  description?: string | null;
};

type MonthGroup = {
  key: string;
  label: string;
  events: CategoryEvent[];
};

const monthColors = ['#f7c928', '#f27b4b', '#61a5e5', '#9a79e8', '#5bb78d'];

const normalize = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const categoryIcon = (category?: Category | null): LucideIcon => {
  const value = normalize(`${category?.name || ''} ${category?.slug || ''}`);
  if (value.includes('esporte')) return Trophy;
  if (value.includes('festa') || value.includes('show')) return PartyPopper;
  if (value.includes('infantil') || value.includes('crianca')) return Baby;
  if (value.includes('religiao') || value.includes('espiritualidade')) return Church;
  if (value.includes('stand up') || value.includes('comedia')) return MicVocal;
  if (value.includes('fitness') || value.includes('academia')) return Dumbbell;
  return CalendarDays;
};

const categoryColor = (category?: Category | null) => {
  if (category?.color?.startsWith('#')) return category.color;
  const value = normalize(`${category?.name || ''} ${category?.slug || ''}`);
  if (value.includes('esporte')) return '#f26a2b';
  if (value.includes('festa') || value.includes('show')) return '#f5a000';
  if (value.includes('infantil')) return '#ed6aa6';
  if (value.includes('religiao')) return '#a994e8';
  if (value.includes('stand up')) return '#70b91b';
  return '#f1b800';
};

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
};

const formatEventRange = (event: CategoryEvent) => {
  const start = formatDate(event.startDate);
  const end = formatDate(event.endDate);
  return end && end !== start ? `${start} – ${end}` : start;
};

const eventLocation = (event: CategoryEvent) => {
  if (event.locationCity && event.locationUf) return `${event.locationCity}, ${event.locationUf}`;
  return event.locationCity || event.locationUf || event.location || '';
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const WorldMap: React.FC = () => (
  <svg className="category-world-map" viewBox="0 0 620 285" role="img" aria-label="Mapa-múndi">
    <defs>
      <pattern id="category-map-dots" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="2.4" fill="rgba(255,255,255,.18)" />
      </pattern>
    </defs>
    <path fill="url(#category-map-dots)" d="M31 58 76 36l64 5 47 25 34 43-16 29-29 5-18 38-24 18-11-33-27-13-19-32-40-16-18-26Z" />
    <path fill="url(#category-map-dots)" d="m191 171 34 12 27 31-5 35-22 31-14-42-20-34-17-19Z" />
    <path fill="url(#category-map-dots)" d="m287 60 38-26 75 4 39 23 55 1 62 26 41 4 18 29-37 21-58-3-35 21-35-10-21-28-29 2-14 26-18 42-23 43-31-15-18-47 10-36-21-19 7-25Z" />
    <path fill="url(#category-map-dots)" d="m515 206 37-12 39 18 11 28-28 18-45-8-20-24Z" />
    {[
      [108, 127], [146, 105], [185, 150], [221, 193], [327, 97], [352, 126], [390, 112], [426, 173], [483, 194], [543, 221],
    ].map(([x, y], index) => (
      <g transform={`translate(${x} ${y})`} key={index}>
        <path d="M0-12c-7 0-12 5-12 12 0 9 12 19 12 19S12 9 12 0C12-7 7-12 0-12Z" fill="rgba(255,255,255,.42)" />
        <circle r="4" fill="#151719" />
      </g>
    ))}
  </svg>
);

const EventsByCategory: React.FC = () => {
  const { isDark } = useTheme();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [events, setEvents] = useState<CategoryEvent[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSEO({
    title: category ? `${category.name} · Fauves` : 'Eventos por categoria · Fauves',
    description: category?.description || undefined,
    url: categorySlug ? `/eventos/${categorySlug}` : undefined,
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--page-max-width', '960px');
    return () => document.documentElement.style.removeProperty('--page-max-width');
  }, []);

  useEffect(() => {
    if (!categorySlug) return;

    const load = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const [categoriesResponse, eventsResponse, organizationsResponse] = await Promise.all([
          fetchApi('/api/categories'),
          fetchApi('/api/events'),
          fetchApi('/api/organization/featured'),
        ]);

        const categoriesData = await categoriesResponse.json();
        const eventsData = await eventsResponse.json();
        const organizationsData = await organizationsResponse.json();

        const matchedCategory = Array.isArray(categoriesData)
          ? categoriesData.find((item: Category) => item.slug === categorySlug)
          : null;

        if (!matchedCategory) {
          setNotFound(true);
          return;
        }

        setCategory(matchedCategory);
        setOrganizations(Array.isArray(organizationsData) ? organizationsData.slice(0, 2) : []);

        const publicEvents: CategoryEvent[] = Array.isArray(eventsData)
          ? eventsData
          : Array.isArray(eventsData?.events) ? eventsData.events : [];

        if (publicEvents.length === 0) {
          setEvents([]);
          return;
        }

        const eventIds = publicEvents.map((event) => event.id).join(',');
        const relationsResponse = await fetchApi(`/api/event-category/relations?eventIds=${encodeURIComponent(eventIds)}`);
        const relations = relationsResponse.ok ? await relationsResponse.json() : [];
        const categoryEventIds = new Set(
          Array.isArray(relations)
            ? relations.filter((relation: any) => relation.slug === categorySlug).map((relation: any) => relation.eventId)
            : [],
        );

        setEvents(
          publicEvents
            .filter((event) => categoryEventIds.has(event.id))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
        );
      } catch (error) {
        console.error('Error loading category page:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [categorySlug]);

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();

    events.forEach((event) => {
      const date = new Date(event.startDate);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
      const current = groups.get(key) || { key, label, events: [] };
      current.events.push(event);
      groups.set(key, current);
    });

    return Array.from(groups.values());
  }, [events]);

  const Icon = categoryIcon(category);
  const accent = categoryColor(category);
  const categoryImage = resolveImageUrl(category?.imageUrl);

  if (loading) {
    return (
      <div className={`category-page category-loading-page theme-root ${isDark ? 'dark dark-mode' : 'light'}`}>
        <HeaderV2 transparent fixed theme={isDark ? 'dark' : 'light'} contentMaxWidth="960px" explorarText="Descobrir Eventos" />
        <span className="category-loader" aria-label="Carregando" />
        <style>{categoryStyles}</style>
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className={`category-page category-loading-page theme-root ${isDark ? 'dark dark-mode' : 'light'}`}>
        <HeaderV2 transparent fixed theme={isDark ? 'dark' : 'light'} contentMaxWidth="960px" explorarText="Descobrir Eventos" />
        <span className="category-not-found">Categoria não encontrada.</span>
        <style>{categoryStyles}</style>
      </div>
    );
  }

  return (
    <div className={`category-page theme-root ${isDark ? 'dark dark-mode' : 'light'}`} style={{ '--category-accent': accent } as React.CSSProperties}>
      <HeaderV2 transparent fixed theme={isDark ? 'dark' : 'light'} contentMaxWidth="960px" explorarText="Descobrir Eventos" />

      <main className="category-container" data-header-align>
        <section className="category-hero">
          <div className="category-hero-copy">
            <h1>{category.name}</h1>
            <div className="category-stats">
              <span><CalendarDays size={16} />{formatNumber(events.length)} {events.length === 1 ? 'Evento' : 'Eventos'}</span>
              <span><Users size={16} />{formatNumber(category.subscriberCount || 0)} {(category.subscriberCount || 0) === 1 ? 'Assinante' : 'Assinantes'}</span>
            </div>
            {category.description && <p className="category-description">{category.description}</p>}
            <SubscribeControl scope={`category:${category.id}`} />
          </div>

          <div className="category-artwork" aria-hidden="true">
            <span className="category-artwork-icon"><Icon size={27} strokeWidth={1.8} /></span>
            <span className="category-artwork-circle">
              {categoryImage ? <img src={categoryImage} alt="" /> : <Icon size={116} strokeWidth={1.15} />}
            </span>
          </div>
        </section>

        <section className="category-section category-main-events" aria-labelledby="main-events-heading">
          <h2 id="main-events-heading">Próximos Eventos Principais</h2>

          {monthGroups.length > 0 ? (
            <div className="category-events-list">
              {monthGroups.map((group, groupIndex) => (
                <section className="category-month-group" key={group.key}>
                  <div className="category-month-heading">
                    <span style={{ background: monthColors[groupIndex % monthColors.length] }} />
                    {group.label}
                  </div>
                  {group.events.map((event) => {
                    const image = resolveImageUrl(event.image);
                    return (
                      <Link className="category-event-row" to={`/${event.slug || event.id}`} key={event.id}>
                        <span className="category-event-image">
                          {image ? <img src={image} alt="" /> : <CalendarDays size={21} />}
                        </span>
                        <span className="category-event-copy">
                          <strong>{event.name}</strong>
                        </span>
                        <span className="category-event-meta">
                          <span>{eventLocation(event)}</span>
                          <time>{formatEventRange(event)}</time>
                          <ArrowRight size={15} />
                        </span>
                      </Link>
                    );
                  })}
                </section>
              ))}
            </div>
          ) : (
            <p className="category-empty-state">Ainda não há eventos publicados nesta categoria.</p>
          )}
        </section>

        <section className="category-section" aria-labelledby="popular-calendars-heading">
          <h2 id="popular-calendars-heading">Calendários Populares</h2>
          <div className="category-calendar-grid">
            {organizations.map((organization) => {
              const logo = resolveImageUrl(organization.logoUrl);
              return (
                <Link className="category-calendar-card" to={`/${organization.slug || organization.id}`} key={organization.id}>
                  <div className="category-calendar-top">
                    <span className="category-calendar-logo">
                      {logo ? <img src={logo} alt="" /> : initials(organization.name)}
                    </span>
                    <span className="category-follow-button">Seguir</span>
                  </div>
                  <h3>{organization.name}</h3>
                  {(organization.bio || organization.description) && <p>{organization.bio || organization.description}</p>}
                </Link>
              );
            })}
            {organizations.length === 0 && <p className="category-empty-state">Nenhum calendário encontrado nesta categoria.</p>}
          </div>
        </section>

        <section className="category-section category-nearby" aria-labelledby="nearby-heading">
          <div className="category-nearby-main">
            <div className="category-nearby-heading">
              <h2 id="nearby-heading">Eventos Próximos</h2>
              <button type="button" aria-label="Buscar"><Search size={16} /></button>
            </div>
            <div className="category-map-empty">
              <WorldMap />
              <div className="category-map-empty-copy">
                <h3>Nenhum Evento por Perto</h3>
                <p>No momento, não há eventos relevantes perto de você. Você pode explorar todos os eventos no mapa.</p>
                <Link to="/discover"><MapIcon size={15} />Explorar Eventos</Link>
              </div>
            </div>
          </div>

          <aside className="category-subscribe-aside">
            <span className="category-aside-icon"><Icon size={25} strokeWidth={1.8} /></span>
            <h3>{category.name}</h3>
            <p>Assine para ficar por dentro dos últimos eventos, calendários e outras atualizações.</p>
            <SubscribeControl scope={`category:${category.id}`} compact />
          </aside>
        </section>
      </main>

      <FooterV2 maxWidth="960px" />
      <style>{categoryStyles}</style>
    </div>
  );
};

const categoryStyles = `
  .category-page {
    --footer-text-color: rgba(255, 255, 255, 0.48);
    --footer-hover-color: #fff;
    --footer-border-color: rgba(255, 255, 255, 0.09);
    --footer-social-color: rgba(255, 255, 255, 0.42);
    --footer-social-hover: #fff;
    --footer-logo-color: #fff;
    min-height: 100vh;
    color: #f5f5f5;
    background: #121416;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .category-container {
    width: min(100%, 960px);
    margin: 0 auto;
    padding: 126px 16px 0;
  }

  .category-hero {
    display: grid;
    min-height: 500px;
    grid-template-columns: 1fr 395px;
    align-items: center;
    gap: 80px;
    padding-bottom: 72px;
  }

  .category-hero-copy h1 {
    margin: 0 0 18px;
    color: #fff;
    font-size: 2.5rem;
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }

  .category-hero-copy { min-width: 0; }
  .category-hero-copy .subscribe-control { margin-top: 32px; }

  .category-stats {
    display: flex;
    align-items: center;
    gap: 17px;
    color: rgba(255, 255, 255, 0.84);
    font-size: 0.875rem;
    font-weight: 600;
  }

  .category-stats span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .category-stats svg {
    color: rgba(255, 255, 255, 0.5);
  }

  .category-description {
    max-width: 450px;
    margin: 22px 0 0;
    padding-top: 20px;
    color: rgba(255, 255, 255, 0.72);
    border-top: 1px solid rgba(255, 255, 255, 0.09);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.55;
  }

  .category-subscribe-form {
    display: flex;
    max-width: 320px;
    gap: 8px;
    margin-top: 32px;
  }

  .category-subscribe-form input {
    width: 100%;
    min-width: 0;
    height: 40px;
    padding: 0 16px;
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
    border: 0;
    border-radius: 999px;
    outline: none;
    font: inherit;
    font-size: 0.875rem;
  }

  .category-subscribe-form input::placeholder { color: rgba(255, 255, 255, 0.35); }
  .category-subscribe-form input:focus { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.22); }

  .category-subscribe-form button {
    height: 40px;
    padding: 0 18px;
    color: #17191b;
    background: #f7f7f7;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .category-artwork {
    position: relative;
    width: 395px;
    height: 395px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
  }

  .category-artwork-icon {
    position: absolute;
    z-index: 2;
    top: 18px;
    left: 18px;
    display: grid;
    width: 48px;
    height: 48px;
    place-items: center;
    color: var(--category-accent);
    background: color-mix(in srgb, var(--category-accent) 17%, transparent);
    border-radius: 50%;
  }

  .category-artwork-circle {
    position: absolute;
    top: 58px;
    left: 58px;
    display: grid;
    width: 278px;
    height: 278px;
    overflow: hidden;
    place-items: center;
    color: var(--category-accent);
    background: radial-gradient(circle at 48% 45%, color-mix(in srgb, var(--category-accent) 34%, #17191b), #17191b 72%);
    border-radius: 50%;
  }

  .category-artwork-circle img { width: 100%; height: 100%; object-fit: cover; }

  .category-section {
    padding: 34px 0 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.09);
  }

  .category-section > h2,
  .category-nearby-heading h2 {
    margin: 0 0 20px;
    color: #fff;
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .category-events-list {
    background: rgba(255, 255, 255, 0.055);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 13px;
  }

  .category-empty-state {
    margin: 0;
    padding: 22px;
    color: rgba(255,255,255,.48);
    background: rgba(255,255,255,.035);
    border: 1px dashed rgba(255,255,255,.1);
    border-radius: 12px;
    font-size: .875rem;
    line-height: 1.5;
  }

  .category-month-group { position: relative; }

  .category-month-heading {
    position: sticky;
    z-index: 8;
    top: 50px;
    display: flex;
    height: 40px;
    align-items: center;
    gap: 9px;
    padding: 0 18px;
    color: rgba(255, 255, 255, 0.48);
    background: #202224;
    border-radius: 12px 12px 0 0;
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: lowercase;
  }

  .category-month-group:not(:first-child) .category-month-heading { border-radius: 0; }
  .category-month-heading > span { width: 16px; height: 5px; border-radius: 999px; }

  .category-event-row {
    display: grid;
    min-height: 76px;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    align-items: center;
    gap: 13px;
    padding: 10px 18px;
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.015);
    transition: background 150ms ease;
  }

  .category-event-row:hover { background: rgba(255, 255, 255, 0.04); }

  .category-event-image {
    display: grid;
    width: 48px;
    height: 48px;
    overflow: hidden;
    place-items: center;
    color: rgba(255, 255, 255, 0.55);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 9px;
  }

  .category-event-image img { width: 100%; height: 100%; object-fit: cover; }
  .category-event-copy { min-width: 0; }

  .category-event-copy strong {
    display: block;
    overflow: hidden;
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-event-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    color: rgba(255, 255, 255, 0.48);
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .category-event-meta > span { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .category-event-meta time { white-space: nowrap; }

  .category-calendar-grid {
    display: grid;
    max-width: 640px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .category-calendar-card {
    min-height: 160px;
    padding: 14px;
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.055);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    transition: border-color 150ms ease;
  }

  .category-calendar-card:hover { border-color: rgba(255, 255, 255, 0.27); }
  .category-calendar-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 13px; }

  .category-calendar-logo {
    display: grid;
    width: 48px;
    height: 48px;
    overflow: hidden;
    place-items: center;
    color: rgba(255,255,255,.7);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 8px;
    font-size: .75rem;
    font-weight: 700;
  }

  .category-calendar-logo img { width: 100%; height: 100%; object-fit: cover; }

  .category-follow-button {
    padding: 7px 12px;
    color: rgba(255, 255, 255, 0.64);
    background: rgba(255, 255, 255, 0.09);
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .category-calendar-card h3 { margin: 0 0 5px; color: #fff; font-size: 1rem; font-weight: 600; }
  .category-calendar-card p { display: -webkit-box; margin: 0; overflow: hidden; color: rgba(255,255,255,.48); font-size: .8125rem; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }

  .category-nearby {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 48px;
    padding-bottom: 80px;
  }

  .category-nearby-heading { display: flex; align-items: center; justify-content: space-between; }
  .category-nearby-heading h2 { margin-bottom: 0; }
  .category-nearby-heading button { display: grid; width: 32px; height: 32px; place-items: center; color: rgba(255,255,255,.55); background: rgba(255,255,255,.08); border: 0; border-radius: 8px; }

  .category-map-empty { position: relative; min-height: 300px; margin-top: 18px; overflow: hidden; }
  .category-world-map { width: 100%; height: auto; opacity: .8; }
  .category-map-empty-copy { position: absolute; right: 16%; bottom: 5px; width: 330px; text-align: center; }
  .category-map-empty-copy h3 { margin: 0 0 8px; color: #fff; font-size: 1rem; font-weight: 600; }
  .category-map-empty-copy p { margin: 0 auto 18px; color: rgba(255,255,255,.48); font-size: .875rem; line-height: 1.5; }
  .category-map-empty-copy a { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; color: rgba(255,255,255,.9); background: rgba(255,255,255,.35); border-radius: 999px; font-size: .8125rem; font-weight: 600; text-decoration: none; }

  .category-subscribe-aside { padding-top: 2px; }
  .category-aside-icon { display: grid; width: 48px; height: 48px; place-items: center; color: #fff; background: var(--category-accent); border-radius: 50%; }
  .category-subscribe-aside h3 { margin: 18px 0 8px; color: #fff; font-size: 1rem; font-weight: 600; }
  .category-subscribe-aside p { margin: 0; color: rgba(255,255,255,.72); font-size: .8125rem; font-weight: 500; line-height: 1.55; }
  .category-subscribe-form.is-compact { display: grid; max-width: none; grid-template-columns: 1fr; gap: 8px; margin-top: 16px; }

  .category-loading-page { display: grid; min-height: 100vh; place-items: center; }
  .category-loader { width: 34px; height: 34px; border: 2px solid rgba(255,255,255,.12); border-top-color: #fff; border-radius: 50%; animation: category-spin .8s linear infinite; }
  .category-not-found { color: rgba(255,255,255,.58); font-size: .875rem; }
  .category-page.light {
    --footer-text-color:#71717a;
    --footer-hover-color:#18181b;
    --footer-border-color:rgba(24,24,27,.1);
    --footer-social-color:#71717a;
    --footer-social-hover:#18181b;
    --footer-logo-color:#18181b;
    color:#27272a;
    background:#f7f8f9;
  }
  .category-page.light .category-hero-copy h1,
  .category-page.light .category-section > h2,
  .category-page.light .category-nearby-heading h2,
  .category-page.light .category-event-copy strong,
  .category-page.light .category-calendar-card h3,
  .category-page.light .category-map-empty-copy h3,
  .category-page.light .category-subscribe-aside h3 { color:#18181b; }
  .category-page.light .category-stats { color:#3f3f46; }
  .category-page.light .category-stats svg,
  .category-page.light .category-description,
  .category-page.light .category-event-meta,
  .category-page.light .category-calendar-card p,
  .category-page.light .category-map-empty-copy p,
  .category-page.light .category-subscribe-aside p,
  .category-page.light .category-not-found { color:#71717a; }
  .category-page.light .category-description,
  .category-page.light .category-section { border-color:rgba(24,24,27,.1); }
  .category-page.light .category-artwork { border-color:rgba(24,24,27,.07); background:rgba(24,24,27,.05); }
  .category-page.light .category-events-list,
  .category-page.light .category-calendar-card { border-color:rgba(24,24,27,.1); background:#fff; }
  .category-page.light .category-month-heading { color:#71717a; background:#f1f1f2; }
  .category-page.light .category-event-row { background:#fff; }
  .category-page.light .category-event-row:hover { background:#f7f7f8; }
  .category-page.light .category-event-image,
  .category-page.light .category-calendar-logo { color:#71717a; border-color:rgba(24,24,27,.09); background:#f1f1f2; }
  .category-page.light .category-calendar-card:hover { border-color:rgba(24,24,27,.27); }
  .category-page.light .category-follow-button,
  .category-page.light .category-nearby-heading button { color:#52525b; background:rgba(24,24,27,.07); }
  .category-page.light .category-map-empty-copy a { color:#fff; background:#27272a; }
  .category-page.light .category-world-map path { fill:rgba(24,24,27,.13); }
  .category-page.light .category-loader { border-color:rgba(24,24,27,.12); border-top-color:#27272a; }
  .category-page.light .category-empty-state { color:#71717a; border-color:rgba(24,24,27,.12); background:rgba(24,24,27,.025); }
  @keyframes category-spin { to { transform: rotate(360deg); } }

  .category-page footer { margin-top: 0 !important; }

  @media (max-width: 860px) {
    .category-hero { grid-template-columns: 1fr 320px; gap: 40px; }
    .category-artwork { width: 320px; height: 320px; }
    .category-artwork-circle { top: 50px; left: 50px; width: 220px; height: 220px; }
    .category-event-meta > span { max-width: 150px; }
  }

  @media (max-width: 700px) {
    .category-container { padding: 92px 16px 0; }
    .category-hero { min-height: auto; grid-template-columns: 1fr; gap: 38px; padding-bottom: 56px; }
    .category-hero-copy h1 { font-size: 2rem; }
    .category-artwork { width: min(100%, 395px); height: auto; aspect-ratio: 1; }
    .category-artwork-circle { top: 15%; left: 15%; width: 70%; height: 70%; }
    .category-events-list { border-radius: 11px; }
    .category-event-row { grid-template-columns: 48px minmax(0, 1fr); }
    .category-event-meta { grid-column: 2; justify-content: flex-start; flex-wrap: wrap; gap: 7px 12px; padding-bottom: 4px; }
    .category-event-meta > span { max-width: 100%; }
    .category-calendar-grid { grid-template-columns: 1fr; }
    .category-nearby { grid-template-columns: 1fr; }
    .category-map-empty-copy { right: 50%; width: min(90%, 330px); transform: translateX(50%); }
    .category-subscribe-aside { max-width: 360px; }
    .category-subscribe-form input, .category-subscribe-form button { min-height: 44px; }
    .category-hero-copy .subscribe-control { max-width: 100%; }
    .category-hero-copy .subscribe-control form { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
    .category-hero-copy .subscribe-control input { min-width: 0; }
    .category-calendar-card { min-height: 150px; }
    .category-follow-button { min-height: 40px; display: inline-flex; align-items: center; }
    .category-nearby-heading button { width: 44px; height: 44px; }
  }

  @media (max-width: 430px) {
    .category-stats { align-items: flex-start; flex-direction: column; gap: 8px; }
    .category-subscribe-form { display: grid; grid-template-columns: 1fr; }
    .category-subscribe-form button { width: 100%; }
    .category-hero-copy .subscribe-control form { grid-template-columns: 1fr; }
    .category-hero-copy .subscribe-control-action { width: 100%; min-height: 44px; }
    .category-month-heading { top: 48px; }
    .category-event-row { min-height: 92px; padding: 12px; }
    .category-map-empty { min-height: 280px; }
    .category-map-empty-copy { bottom: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .category-page * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;

export default EventsByCategory;
