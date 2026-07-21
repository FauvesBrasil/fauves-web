import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  BrainCircuit,
  Baby,
  CalendarDays,
  Church,
  CloudSun,
  Coins,
  Cpu,
  Dumbbell,
  Heart,
  Leaf,
  MapPin,
  MicVocal,
  Palette,
  PartyPopper,
  Sparkles,
  Trophy,
  Utensils,
  Loader2,
} from 'lucide-react';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import { useSEO } from '@/hooks/useSEO';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useTheme } from '@/context/ThemeContext';

type CategoryVisual = {
  Icon: LucideIcon;
  color: string;
  keywords: string[];
};

const categoryVisuals: CategoryVisual[] = [
  { Icon: Cpu, color: '#f5aa00', keywords: ['tecnologia', 'tech', 'software'] },
  { Icon: Utensils, color: '#ec8e19', keywords: ['comida', 'bebida', 'gastronomia', 'food'] },
  { Icon: BrainCircuit, color: '#ef6aa5', keywords: ['inteligencia artificial', 'ia', 'ai'] },
  { Icon: Palette, color: '#b0ad36', keywords: ['arte', 'cultura', 'design'] },
  { Icon: CloudSun, color: '#68ae0d', keywords: ['clima', 'meio ambiente', 'sustentabilidade'] },
  { Icon: Trophy, color: '#f26a2b', keywords: ['esportes', 'sport'] },
  { Icon: Dumbbell, color: '#f05b23', keywords: ['fitness', 'academia', 'treino'] },
  { Icon: PartyPopper, color: '#f5a000', keywords: ['festa', 'show', 'musica'] },
  { Icon: Baby, color: '#ed6aa6', keywords: ['infantil', 'crianca', 'familia'] },
  { Icon: Church, color: '#a994e8', keywords: ['religiao', 'espiritualidade'] },
  { Icon: MicVocal, color: '#70b91b', keywords: ['stand up', 'comedia', 'comedy'] },
  { Icon: Heart, color: '#63b6c6', keywords: ['bem-estar', 'bem estar', 'wellness'] },
  { Icon: Coins, color: '#8857ff', keywords: ['crypto', 'financas', 'negocios'] },
  { Icon: Leaf, color: '#66b88f', keywords: ['natureza', 'ecologia'] },
];

const cityColors = ['#e4934d', '#ef7771', '#57a8d9', '#5f99d2', '#9e979d', '#9b7ae7'];

const normalizeText = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const slugify = (value: string) =>
  normalizeText(value)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const formatCount = (count: number) => new Intl.NumberFormat('pt-BR').format(count);

const getCategoryVisual = (category: any, index: number): CategoryVisual => {
  const searchable = normalizeText(`${category?.name || ''} ${category?.slug || ''}`);
  const words = searchable.split(/[^a-z0-9]+/).filter(Boolean);
  return categoryVisuals.find((visual) => visual.keywords.some((keyword) => (
    keyword.length <= 2 ? words.includes(keyword) : searchable.includes(keyword)
  )))
    || categoryVisuals[index % categoryVisuals.length]
    || { Icon: Sparkles, color: '#8b7aff', keywords: [] };
};

const eventBelongsToCategory = (event: any, category: any) => {
  const categoryKeys = [category?.id, category?.slug, category?.name]
    .filter(Boolean)
    .map(normalizeText);

  const eventKeys = [
    event?.categoryId,
    event?.category?.id,
    event?.category?.slug,
    event?.category?.name,
    event?.category,
    ...(Array.isArray(event?.categories)
      ? event.categories.flatMap((item: any) => [item?.id, item?.slug, item?.name, item])
      : []),
  ]
    .filter((item) => typeof item === 'string' || typeof item === 'number')
    .map(normalizeText);

  return categoryKeys.some((key) => eventKeys.includes(key));
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const DiscoverV2: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  useSEO({ title: 'Descobrir eventos · Fauves' });

  const [events, setEvents] = useState<any[]>([]);
  const [featuredOrgs, setFeaturedOrgs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [followingOrgIds, setFollowingOrgIds] = useState<Set<string>>(new Set());
  const [followLoadingIds, setFollowLoadingIds] = useState<Set<string>>(new Set());

  // Load followed organizations
  useEffect(() => {
    if (!user) {
      setFollowingOrgIds(new Set());
      return;
    }
    const loadFollowing = async () => {
      try {
        const response = await fetchApi('/api/organization/following');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setFollowingOrgIds(new Set(data.map((org: any) => org.id)));
          }
        }
      } catch (error) {
        console.error('Error loading following organizations:', error);
      }
    };
    void loadFollowing();
  }, [user]);

  const handleFollowClick = async (e: React.MouseEvent, organizationId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      navigate('/login?redirect=/discover');
      return;
    }

    const isFollowing = followingOrgIds.has(organizationId);
    const method = isFollowing ? 'DELETE' : 'POST';

    setFollowLoadingIds((prev) => {
      const next = new Set(prev);
      next.add(organizationId);
      return next;
    });

    try {
      const response = await fetchApi(`/api/organization/${organizationId}/follow`, {
        method,
      });
      if (response.ok) {
        setFollowingOrgIds((prev) => {
          const next = new Set(prev);
          if (isFollowing) {
            next.delete(organizationId);
          } else {
            next.add(organizationId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(organizationId);
        return next;
      });
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--page-max-width', '840px');
    return () => document.documentElement.style.removeProperty('--page-max-width');
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetchApi('/api/events');
        const data = await response.json();
        if (Array.isArray(data)) setEvents(data);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    const loadFeatured = async () => {
      try {
        const response = await fetchApi('/api/organization/featured');
        const data = await response.json();
        if (Array.isArray(data)) setFeaturedOrgs(data);
      } catch (error) {
        console.error('Error loading featured organizations:', error);
      } finally {
        setLoadingOrgs(false);
      }
    };

    const loadCategories = async () => {
      try {
        const response = await fetchApi('/api/categories');
        const data = await response.json();
        if (Array.isArray(data)) setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    void Promise.all([loadEvents(), loadFeatured(), loadCategories()]);
  }, []);

  const categoryCounts = useMemo(
    () => new Map(categories.map((category) => [category.id || category.slug, events.filter((event) => eventBelongsToCategory(event, category)).length])),
    [categories, events],
  );

  const stateLocations = useMemo(() => {
    const stateNames = Array.from(new Set(events.map((event) => event.locationUf).filter(Boolean))).sort() as string[];

    return stateNames.map((uf) => {
      const cities = new Map<string, number>();

      events
        .filter((event) => event.locationUf === uf)
        .forEach((event) => {
          const city = event.locationCity || 'Outras cidades';
          cities.set(city, (cities.get(city) || 0) + 1);
        });

      return {
        uf,
        cities: Array.from(cities.entries())
          .map(([name, count]) => ({ name, count, slug: slugify(name) }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      };
    });
  }, [events]);

  useEffect(() => {
    if (stateLocations.length === 0) return;
    if (!stateLocations.some((state) => state.uf === selectedState)) {
      setSelectedState(stateLocations[0].uf);
    }
  }, [selectedState, stateLocations]);

  const currentStateData = stateLocations.find((state) => state.uf === selectedState);

  return (
    <div className={`discover-v2-page theme-root ${isDark ? 'dark dark-mode' : 'light'}`}>
      <HeaderV2
        transparent
        fixed
        theme={isDark ? 'dark' : 'light'}
        contentMaxWidth="840px"
        explorarText="Descobrir Eventos"
      />

      <main className="discover-v2-container" data-header-align>
        <header className="discover-v2-hero">
          <h1>Descobrir Eventos</h1>
          <p>
            Explore eventos populares perto de você, navegue por categoria ou confira alguns dos ótimos calendários da comunidade.
          </p>
        </header>

        <section className="discover-v2-section" aria-labelledby="categories-heading">
          <div className="discover-v2-section-heading">
            <h2 id="categories-heading">Explorar por Categoria</h2>
          </div>

          <div className="discover-v2-category-grid">
            {categories.map((category, index) => {
              const { Icon, color } = getCategoryVisual(category, index);
              const count = categoryCounts.get(category.id || category.slug) || 0;

              return (
                <Link
                  key={category.id || category.slug || category.name}
                  className="discover-v2-category-card"
                  to={`/eventos/${category.slug}`}
                >
                  <span className="discover-v2-category-icon" style={{ color }}>
                    <Icon size={27} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="discover-v2-category-copy">
                    <strong>{category.name}</strong>
                    <small>{formatCount(count)} {count === 1 ? 'Evento' : 'Eventos'}</small>
                  </span>
                </Link>
              );
            })}

            {loadingCategories && Array.from({ length: 6 }, (_, index) => (
              <div className="discover-v2-skeleton discover-v2-skeleton-category" key={index} />
            ))}
          </div>

          {!loadingCategories && categories.length === 0 && (
            <div className="discover-v2-empty">Nenhuma categoria encontrada.</div>
          )}
        </section>

        <section className="discover-v2-section discover-v2-section-divided" aria-labelledby="calendars-heading">
          <div className="discover-v2-section-heading">
            <h2 id="calendars-heading">Calendários em Destaque</h2>
          </div>

          <div className="discover-v2-calendar-grid">
            {featuredOrgs.slice(0, 9).map((organization, index) => {
              const logo = resolveImageUrl(organization.logoUrl);
              const organizationName = organization.name || 'Calendário Fauves';
              const isFollowing = followingOrgIds.has(organization.id);

              return (
                <Link
                  className="discover-v2-calendar-card"
                  key={organization.id || organization.slug || index}
                  to={`/${organization.slug || organization.id}`}
                >
                  <div className="discover-v2-calendar-topline">
                    <span className="discover-v2-calendar-logo">
                      {logo ? (
                        <img src={logo} alt="" />
                      ) : (
                        <span>{getInitials(organizationName)}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className={`discover-v2-open-pill ${isFollowing ? 'is-following' : ''}`}
                      onClick={(e) => handleFollowClick(e, organization.id)}
                      disabled={followLoadingIds.has(organization.id)}
                    >
                      {followLoadingIds.has(organization.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin inline-block" />
                      ) : isFollowing ? (
                        'Seguindo'
                      ) : (
                        'Seguir'
                      )}
                    </button>
                  </div>
                  <h3>{organizationName}</h3>
                  <p>{organization.bio || organization.description || 'Calendário de eventos na Fauves.'}</p>
                </Link>
              );
            })}

            {loadingOrgs && Array.from({ length: 6 }, (_, index) => (
              <div className="discover-v2-skeleton discover-v2-skeleton-calendar" key={index} />
            ))}
          </div>

          {!loadingOrgs && featuredOrgs.length === 0 && (
            <div className="discover-v2-empty">Nenhum calendário em destaque no momento.</div>
          )}
        </section>

        <section className="discover-v2-section discover-v2-section-divided" aria-labelledby="local-heading">
          <div className="discover-v2-section-heading discover-v2-local-heading">
            <h2 id="local-heading">Explore Eventos Locais</h2>
          </div>

          {stateLocations.length > 0 && (
            <div className="discover-v2-tabs" role="tablist" aria-label="Estados com eventos">
              {stateLocations.map((state) => (
                <button
                  key={state.uf}
                  type="button"
                  role="tab"
                  aria-selected={selectedState === state.uf}
                  className={selectedState === state.uf ? 'is-active' : ''}
                  onClick={() => setSelectedState(state.uf)}
                >
                  {state.uf}
                </button>
              ))}
            </div>
          )}

          <div className="discover-v2-city-grid">
            {currentStateData?.cities.map((city, index) => (
              <Link className="discover-v2-city-card" to={`/${city.slug}`} key={city.slug}>
                <span className="discover-v2-city-icon" style={{ background: cityColors[index % cityColors.length] }}>
                  <MapPin size={19} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span>
                  <strong>{city.name}</strong>
                  <small>{formatCount(city.count)} {city.count === 1 ? 'Evento' : 'Eventos'}</small>
                </span>
              </Link>
            ))}

            {loadingEvents && Array.from({ length: 5 }, (_, index) => (
              <div className="discover-v2-skeleton discover-v2-skeleton-city" key={index} />
            ))}
          </div>

          {!loadingEvents && stateLocations.length === 0 && (
            <div className="discover-v2-empty discover-v2-empty-local">
              <CalendarDays size={21} aria-hidden="true" />
              <span>Nenhum estado com eventos no momento.</span>
            </div>
          )}
        </section>
      </main>

      <FooterV2 maxWidth="840px" />

      <style>{`
        .discover-v2-page {
          --footer-text-color: rgba(255, 255, 255, 0.48);
          --footer-hover-color: #ffffff;
          --footer-border-color: rgba(255, 255, 255, 0.09);
          --footer-social-color: rgba(255, 255, 255, 0.42);
          --footer-social-hover: #ffffff;
          --footer-logo-color: #ffffff;
          min-height: 100vh;
          overflow-x: hidden;
          color: #f5f5f5;
          background: #121416;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .discover-v2-container {
          width: min(100%, 840px);
          margin: 0 auto;
          padding: var(--page-top-spacing) 24px 0;
        }

        .discover-v2-hero {
          margin-bottom: 48px;
        }

        .discover-v2-hero h1 {
          margin: 0 0 12px;
          color: #fff;
          font-size: 2rem;
          font-weight: 600;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .discover-v2-hero p {
          max-width: 650px;
          margin: 0;
          color: rgba(255, 255, 255, 0.62);
          font-size: 1.125rem;
          line-height: 1.5;
        }

        .discover-v2-section {
          margin-bottom: 64px;
        }

        .discover-v2-section-divided {
          margin-top: 0;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.09);
        }

        .discover-v2-section-heading {
          display: flex;
          margin-bottom: 20px;
        }

        .discover-v2-section-heading h2 {
          margin: 0;
          color: #fff;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .discover-v2-category-grid,
        .discover-v2-calendar-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .discover-v2-category-card {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 66px;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          overflow: hidden;
          color: inherit;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          transition: border-color 150ms ease;
        }

        .discover-v2-category-card:hover {
          border-color: rgba(255, 255, 255, 0.28);
        }

        .discover-v2-category-icon {
          display: grid;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          place-items: center;
          border-radius: 0;
        }

        .discover-v2-category-copy {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
        }

        .discover-v2-category-copy strong,
        .discover-v2-city-card strong {
          overflow: hidden;
          color: rgba(255, 255, 255, 0.94);
          font-size: 0.9375rem;
          font-weight: 600;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .discover-v2-category-copy small,
        .discover-v2-city-card small {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.43);
          font-size: 0.8125rem;
          font-weight: 500;
        }

        .discover-v2-calendar-card {
          display: flex;
          min-width: 0;
          min-height: 154px;
          flex-direction: column;
          padding: 14px;
          color: inherit;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          transition: border-color 150ms ease;
        }

        .discover-v2-calendar-card:hover {
          border-color: rgba(255, 255, 255, 0.28);
        }

        .discover-v2-calendar-topline {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 13px;
        }

        .discover-v2-calendar-logo {
          display: grid;
          width: 48px;
          height: 48px;
          overflow: hidden;
          place-items: center;
          color: rgba(255, 255, 255, 0.72);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.055));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .discover-v2-calendar-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .discover-v2-open-pill {
          padding: 7px 12px;
          color: rgba(255, 255, 255, 0.66);
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.035);
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 600;
          transition: color 160ms ease, background 160ms ease;
        }

        .discover-v2-open-pill:hover {
          color: #18191b;
          background: rgba(255, 255, 255, 0.78);
        }

        button.discover-v2-open-pill {
          cursor: pointer;
          outline: none;
        }

        .discover-v2-open-pill.is-following {
          color: #fff !important;
          background: #27993d !important;
          border-color: transparent !important;
        }

        .discover-v2-open-pill.is-following:hover {
          background: #208033 !important;
          color: #fff !important;
        }

        .discover-v2-calendar-card h3 {
          margin: 0 0 5px;
          overflow: hidden;
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .discover-v2-calendar-card p {
          display: -webkit-box;
          margin: 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.46);
          font-size: 0.875rem;
          line-height: 1.45;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .discover-v2-local-heading {
          margin-bottom: 13px;
        }

        .discover-v2-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          padding-bottom: 2px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .discover-v2-tabs::-webkit-scrollbar {
          display: none;
        }

        .discover-v2-tabs button {
          flex: 0 0 auto;
          padding: 7px 11px;
          color: rgba(255, 255, 255, 0.43);
          background: transparent;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          font: inherit;
          font-size: 0.76rem;
          font-weight: 620;
          transition: color 160ms ease, background 160ms ease;
        }

        .discover-v2-tabs button:hover,
        .discover-v2-tabs button.is-active {
          color: rgba(255, 255, 255, 0.86);
          background: rgba(255, 255, 255, 0.09);
        }

        .discover-v2-city-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px 16px;
        }

        .discover-v2-city-card {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 11px;
          padding: 8px;
          color: inherit;
          text-decoration: none;
          border-radius: 10px;
          transition: background 150ms ease;
        }

        .discover-v2-city-card:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .discover-v2-city-card > span:last-child {
          display: flex;
          min-width: 0;
          flex-direction: column;
        }

        .discover-v2-city-icon {
          display: grid;
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          place-items: center;
          color: #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.07) inset;
        }

        .discover-v2-empty {
          grid-column: 1 / -1;
          padding: 22px;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.035);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 0.84rem;
          text-align: center;
        }

        .discover-v2-empty-local {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .discover-v2-skeleton {
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 12px;
        }

        .discover-v2-skeleton::after {
          position: absolute;
          inset: 0;
          content: '';
          background: linear-gradient(100deg, transparent 15%, rgba(255, 255, 255, 0.075) 50%, transparent 85%);
          transform: translateX(-100%);
          animation: discover-shimmer 1.45s infinite;
        }

        .discover-v2-skeleton-category { height: 66px; }
        .discover-v2-skeleton-calendar { height: 154px; }
        .discover-v2-skeleton-city { height: 56px; }

        .discover-v2-page.light {
          --footer-text-color: #71717a;
          --footer-hover-color: #18181b;
          --footer-border-color: rgba(24,24,27,.1);
          --footer-social-color: #71717a;
          --footer-social-hover: #18181b;
          --footer-logo-color: #18181b;
          color: #27272a;
          background: #f7f8f9;
        }
        .discover-v2-page.light .discover-v2-hero h1,
        .discover-v2-page.light .discover-v2-section-heading h2,
        .discover-v2-page.light .discover-v2-category-copy strong,
        .discover-v2-page.light .discover-v2-city-card strong,
        .discover-v2-page.light .discover-v2-calendar-card h3 { color: #18181b; }
        .discover-v2-page.light .discover-v2-hero p,
        .discover-v2-page.light .discover-v2-category-copy small,
        .discover-v2-page.light .discover-v2-city-card small,
        .discover-v2-page.light .discover-v2-calendar-card p { color: #71717a; }
        .discover-v2-page.light .discover-v2-section-divided { border-top-color: rgba(24,24,27,.1); }
        .discover-v2-page.light .discover-v2-category-card,
        .discover-v2-page.light .discover-v2-calendar-card {
          border-color: rgba(24,24,27,.1);
          background: #fff;
        }
        .discover-v2-page.light .discover-v2-category-card:hover,
        .discover-v2-page.light .discover-v2-calendar-card:hover { border-color: rgba(24,24,27,.28); }
        .discover-v2-page.light .discover-v2-calendar-logo {
          color: #52525b;
          border-color: rgba(24,24,27,.1);
          background: linear-gradient(145deg,#f4f4f5,#e4e4e7);
        }
        .discover-v2-page.light .discover-v2-open-pill {
          color: #52525b;
          border-color: rgba(24,24,27,.06);
          background: #f1f1f2;
        }
        .discover-v2-page.light .discover-v2-open-pill:hover { color: #fff; background: #18181b; }
        .discover-v2-page.light .discover-v2-tabs button { color: #71717a; }
        .discover-v2-page.light .discover-v2-tabs button:hover,
        .discover-v2-page.light .discover-v2-tabs button.is-active { color: #18181b; background: rgba(24,24,27,.07); }
        .discover-v2-page.light .discover-v2-city-card:hover { background: rgba(24,24,27,.045); }
        .discover-v2-page.light .discover-v2-empty {
          color: #71717a;
          border-color: rgba(24,24,27,.13);
          background: #fff;
        }
        .discover-v2-page.light .discover-v2-skeleton {
          border-color: rgba(24,24,27,.06);
          background: rgba(24,24,27,.06);
        }
        .discover-v2-page.light .discover-v2-skeleton::after {
          background: linear-gradient(100deg,transparent 15%,rgba(255,255,255,.6) 50%,transparent 85%);
        }

        @keyframes discover-shimmer {
          to { transform: translateX(100%); }
        }

        .discover-v2-page footer {
          margin-top: 62px !important;
        }

        @media (max-width: 820px) {
          .discover-v2-category-grid,
          .discover-v2-calendar-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .discover-v2-city-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .discover-v2-container {
            padding: var(--page-top-spacing-mobile) 16px 0;
          }

          .discover-v2-hero {
            margin-bottom: 38px;
          }

          .discover-v2-hero h1 {
            font-size: 2rem;
          }

          .discover-v2-category-grid,
          .discover-v2-calendar-grid {
            grid-template-columns: 1fr;
          }

          .discover-v2-calendar-card {
            min-height: 146px;
          }

          .discover-v2-city-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .discover-v2-section-heading {
            align-items: center;
          }

          .discover-v2-page footer > div:first-of-type {
            align-items: flex-start !important;
            gap: 18px;
          }
        }

        @media (max-width: 390px) {
          .discover-v2-city-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .discover-v2-page * {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DiscoverV2;
