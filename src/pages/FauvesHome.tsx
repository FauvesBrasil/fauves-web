import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ArrowUpRight,
  Baby,
  BrainCircuit,
  CalendarDays,
  CloudSun,
  Coins,
  Cpu,
  Dumbbell,
  Heart,
  MicVocal,
  Palette,
  PartyPopper,
  Sparkles,
  Trophy,
  Utensils,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import WebGLParticleField from '@/components/home/WebGLParticleField';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { getEventPath } from '@/lib/eventUrl';
import cover01 from '@/assets/covers/convites/e0d9e03b-63b3-452b-8899-3fc8f848a4bb.avif';
import cover02 from '@/assets/covers/convites/f24cbc77-91df-4aa8-ab88-c073cbe98ba5.avif';
import cover03 from '@/assets/covers/convites/2bd1bd20-c9c6-4df0-8bdd-66d155ce8641.avif';
import cover04 from '@/assets/covers/convites/fa42d434-933a-42cd-bddf-72125f5653a2.avif';
import cover05 from '@/assets/covers/convites/d606bd68-440e-41e7-9332-a5fd5de853d6.avif';
import cover06 from '@/assets/covers/convites/bd098b7b-aae7-495c-9b4d-2ff4c014a61e.avif';
import cover07 from '@/assets/covers/convites/7ff0a7f6-da93-4425-8a3e-ea56653e377c.avif';
import cover08 from '@/assets/covers/convites/74493868-517a-4b12-bdc4-9c587db93853.avif';
import cover09 from '@/assets/covers/convites/8a812f60-4f3c-4dbb-947c-d539f2590497.avif';
import cover10 from '@/assets/covers/convites/4cf89e56-ac78-4b9f-937f-2e56200d41ad.avif';
import cover11 from '@/assets/covers/convites/3dad6ca2-38bc-461a-b258-ca2ebcccbdce.avif';
import cover12 from '@/assets/covers/convites/f522deaf-7d86-4530-b741-d21f460f4052.avif';
import cover13 from '@/assets/covers/convites/d4f48662-93ec-4185-a4ab-b48c70195f55.avif';
import cover14 from '@/assets/covers/convites/ae9242dd-9e92-4cd6-ad14-d904f9189007.avif';

type HomeEvent = {
  id?: string;
  _id?: string;
  slug?: string;
  name?: string;
  bannerUrl?: string;
  banner?: string;
  image?: string;
};

type HomeOrganization = {
  id?: string;
  slug?: string;
  name?: string;
  logoUrl?: string;
  bio?: string;
  description?: string;
  themeColor?: string;
};

type HomeCategory = {
  id?: string | number;
  slug?: string;
  name?: string;
};

type CategoryVisual = {
  Icon: LucideIcon;
  color: string;
  keywords: string[];
};

type FloatingPlacement = {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  width: number;
  depth: number;
  rotate: number;
};

const fallbackCovers = [
  cover01, cover02, cover03, cover04, cover05, cover06, cover07,
  cover08, cover09, cover10, cover11, cover12, cover13, cover14,
];

const fallbackEvents: HomeEvent[] = fallbackCovers.map((image, index) => ({
  id: `home-event-${index}`,
  name: 'Descobrir eventos na Fauves',
  image,
}));

const fallbackCategories: HomeCategory[] = [
  { id: 'shows', name: 'Shows & Festas', slug: 'shows-festas' },
  { id: 'tech', name: 'Tecnologia', slug: 'tecnologia' },
  { id: 'food', name: 'Comida & Bebida', slug: 'comida-bebida' },
  { id: 'ai', name: 'IA', slug: 'ia' },
  { id: 'sports', name: 'Esportes', slug: 'esportes' },
  { id: 'comedy', name: 'Comédia', slug: 'comedia' },
  { id: 'family', name: 'Família', slug: 'familia' },
  { id: 'fitness', name: 'Fitness', slug: 'fitness' },
  { id: 'wellness', name: 'Bem-estar', slug: 'bem-estar' },
  { id: 'art', name: 'Arte & Cultura', slug: 'arte-cultura' },
  { id: 'business', name: 'Negócios', slug: 'negocios' },
  { id: 'climate', name: 'Clima', slug: 'clima' },
];

const fallbackOrganizations: HomeOrganization[] = [
  { id: 'fallback-1', name: 'Fauves Sessions', description: 'Experiências para viver e lembrar.', themeColor: '#5c73ff' },
  { id: 'fallback-2', name: 'Cultura em Movimento', description: 'Arte, música e encontros pela cidade.', themeColor: '#df4e9f' },
  { id: 'fallback-3', name: 'Comunidade Criativa', description: 'Ideias que aproximam pessoas.', themeColor: '#f07a31' },
  { id: 'fallback-4', name: 'Bem-estar Coletivo', description: 'Movimento, saúde e presença.', themeColor: '#55b89a' },
  { id: 'fallback-5', name: 'Tech Nordeste', description: 'Tecnologia feita em comunidade.', themeColor: '#5aa6dd' },
  { id: 'fallback-6', name: 'Noite Fauves', description: 'As melhores histórias começam aqui.', themeColor: '#9b6bea' },
];

const categoryVisuals: CategoryVisual[] = [
  { Icon: PartyPopper, color: '#ff9d18', keywords: ['show', 'festa', 'musica'] },
  { Icon: Cpu, color: '#5c82ff', keywords: ['tecnologia', 'tech', 'software'] },
  { Icon: Utensils, color: '#f39b13', keywords: ['comida', 'bebida', 'gastronomia', 'food'] },
  { Icon: BrainCircuit, color: '#e95d9e', keywords: ['inteligencia artificial', 'ia', 'ai'] },
  { Icon: Trophy, color: '#76b82a', keywords: ['esporte', 'corrida', 'sport'] },
  { Icon: MicVocal, color: '#b36ce2', keywords: ['comedia', 'comedy', 'stand up'] },
  { Icon: Baby, color: '#c56ee9', keywords: ['familia', 'infantil', 'crianca'] },
  { Icon: Dumbbell, color: '#43b7d8', keywords: ['fitness', 'academia', 'treino'] },
  { Icon: Heart, color: '#59bdad', keywords: ['bem-estar', 'bem estar', 'wellness'] },
  { Icon: Palette, color: '#d9b515', keywords: ['arte', 'cultura', 'design'] },
  { Icon: Coins, color: '#8d69ef', keywords: ['negocio', 'financa', 'crypto'] },
  { Icon: CloudSun, color: '#3ecb72', keywords: ['clima', 'natureza', 'sustentabilidade'] },
];

const floatingPlacements: FloatingPlacement[] = [
  { left: '6.5%', top: '6%', width: 142, depth: 0.72, rotate: -2 },
  { left: '20.5%', top: '12%', width: 150, depth: 0.44, rotate: 1.5 },
  { left: '39%', top: '-5%', width: 170, depth: 0.58, rotate: -1 },
  { right: '33%', top: '-4%', width: 154, depth: 0.4, rotate: 1.2 },
  { right: '16.5%', top: '5%', width: 142, depth: 0.7, rotate: -1.4 },
  { right: '4%', top: '29%', width: 154, depth: 0.5, rotate: 1.8 },
  { left: '4.5%', top: '30%', width: 126, depth: 0.48, rotate: -1.8 },
  { left: '11%', top: '48%', width: 188, depth: 0.78, rotate: 0.8 },
  { right: '22%', top: '49%', width: 142, depth: 0.55, rotate: -1.2 },
  { right: '2%', top: '51%', width: 132, depth: 0.68, rotate: 1.6 },
  { left: '26%', bottom: '-1%', width: 160, depth: 0.46, rotate: -1 },
  { left: '43%', bottom: '-10%', width: 178, depth: 0.62, rotate: 1.4 },
  { right: '27%', bottom: '-6%', width: 182, depth: 0.76, rotate: -1.3 },
  { left: '-3%', bottom: '-3%', width: 145, depth: 0.58, rotate: 1.5 },
];

const normalizeText = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const getCategoryVisual = (category: HomeCategory, index: number) => {
  const searchable = normalizeText(`${category.name || ''} ${category.slug || ''}`);
  const words = searchable.split(/[^a-z0-9]+/).filter(Boolean);
  return categoryVisuals.find(({ keywords }) => keywords.some((keyword) => (
    keyword.length <= 2 ? words.includes(keyword) : searchable.includes(keyword)
  ))) || categoryVisuals[index % categoryVisuals.length];
};

const getInitials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase();

const moveSpotlight = (event: ReactPointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
};

const eventImage = (event: HomeEvent, fallback: string) => resolveImageUrl(
  event.bannerUrl || event.banner || event.image,
) || fallback;

const FauvesHome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const [heroEffectActive, setHeroEffectActive] = useState(false);
  const [heroEffect, setHeroEffect] = useState(0);
  const [events, setEvents] = useState<HomeEvent[]>(fallbackEvents);
  const [organizations, setOrganizations] = useState<HomeOrganization[]>(fallbackOrganizations);
  const [categories, setCategories] = useState<HomeCategory[]>(fallbackCategories);

  useSEO({
    title: 'Fauves · Eventos que deixam marca',
    description: 'Crie eventos, venda ingressos e transforme encontros em experiências inesquecíveis com a Fauves.',
  });

  useEffect(() => {
    if (!authLoading && user) navigate('/events', { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const loadHomeContent = async () => {
      const [eventsResult, organizationsResult, categoriesResult] = await Promise.allSettled([
        fetchApi('/events?page=1&limit=18&uf=CE&include=organization'),
        fetchApi('/api/organization/featured'),
        fetchApi('/api/categories'),
      ]);

      if (eventsResult.status === 'fulfilled' && eventsResult.value.ok) {
        const payload = await eventsResult.value.json();
        const nextEvents = Array.isArray(payload) ? payload : payload.events;
        if (Array.isArray(nextEvents) && nextEvents.length > 0) setEvents(nextEvents);
      }

      if (organizationsResult.status === 'fulfilled' && organizationsResult.value.ok) {
        const payload = await organizationsResult.value.json();
        if (Array.isArray(payload) && payload.length > 0) setOrganizations(payload);
      }

      if (categoriesResult.status === 'fulfilled' && categoriesResult.value.ok) {
        const payload = await categoriesResult.value.json();
        if (Array.isArray(payload) && payload.length > 0) setCategories(payload);
      }
    };

    void loadHomeContent();
  }, []);

  const floatingEvents = useMemo(() => Array.from({ length: floatingPlacements.length }, (_, index) => (
    events[index % events.length] || fallbackEvents[index]
  )), [events]);

  const startCreating = () => navigate('/create');

  const moveHero = (event: ReactPointerEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    hero.style.setProperty('--orb-x', `${x}px`);
    hero.style.setProperty('--orb-y', `${y}px`);
    hero.style.setProperty('--hero-shift-x', `${((x / rect.width) - 0.5) * -18}px`);
    hero.style.setProperty('--hero-shift-y', `${((y / rect.height) - 0.5) * -14}px`);
  };

  const showHeroEffect = (event: ReactPointerEvent<HTMLButtonElement>) => {
    moveHero(event);
    setHeroEffect((current) => (current + 1) % 3);
    setHeroEffectActive(true);
  };

  if (authLoading || user) return <div className="min-h-[100svh] bg-[#141516]" />;

  return (
    <div className="fauves-home min-h-[100svh] overflow-x-hidden bg-[#141516] text-white selection:bg-[#6f6cff] selection:text-white">
      <HeaderV2
        transparent
        fixed
        theme="dark"
        scrollTransition={false}
        blueGlow={false}
        contentMaxWidth="1500px"
        explorarText="Descobrir eventos"
      />

      <header className="home-mobile-header" aria-label="Navegação principal">
        <Link className="home-mobile-brand" to="/" aria-label="Fauves — página inicial">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 0c0 8.84-7.16 16-16 16 8.84 0 16 7.16 16 16 0-8.84 7.16-16 16-16C23.16 16 16 8.84 16 0Z" />
          </svg>
        </Link>
        <Link className="home-mobile-login" to="/signin">Entrar</Link>
      </header>

      <main>
        <section
          ref={heroRef}
          className="home-hero"
          data-effect={heroEffect}
          data-effect-active={heroEffectActive}
          onPointerMove={moveHero}
        >
          <WebGLParticleField className="home-webgl-canvas" active={heroEffectActive} />
          <div className="home-theme-orb" aria-hidden="true" />
          <div className="home-hero-vignette" aria-hidden="true" />

          <div className="home-floating-events" aria-hidden="true">
            {floatingEvents.map((event, index) => {
              const placement = floatingPlacements[index];
              const fallback = fallbackCovers[index % fallbackCovers.length];
              const eventId = event.id || event._id;
              const href = eventId ? getEventPath({ id: eventId, slug: event.slug }) : '/discover';
              const style = {
                left: placement.left,
                right: placement.right,
                top: placement.top,
                bottom: placement.bottom,
                width: `${placement.width}px`,
                '--depth': placement.depth,
                '--poster-rotate': `${placement.rotate}deg`,
                '--poster-delay': `${index * -0.47}s`,
              } as CSSProperties;

              return (
                <div className="home-poster-slot" style={style} key={`${eventId || 'fallback'}-${index}`}>
                  <motion.div
                    className="home-poster-entry"
                    initial={{ opacity: 0, scale: 0.72, y: 24, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.65, delay: 0.18 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link className="home-poster" to={href} tabIndex={-1}>
                      <img src={eventImage(event, fallback)} alt="" loading={index < 8 ? 'eager' : 'lazy'} />
                    </Link>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <motion.div
            className="home-hero-copy"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1>
              <span>Eventos que deixam marca</span>
              <strong>começam aqui.</strong>
            </h1>
            <p>
              Da primeira ideia ao último aplauso, a Fauves deixa cada etapa mais simples para você criar experiências inesquecíveis.
            </p>
            <div className="home-hero-actions">
              <button
                type="button"
                className="home-create-button"
                onClick={startCreating}
                onPointerEnter={showHeroEffect}
                onPointerMove={moveHero}
                onPointerLeave={() => setHeroEffectActive(false)}
                onFocus={() => setHeroEffectActive(true)}
                onBlur={() => setHeroEffectActive(false)}
              >
                Crie seu primeiro evento
              </button>
              <Link className="home-discover-link" to="/discover">
                Descobrir eventos <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </section>

        <section id="explorar" className="home-explore" aria-label="Descubra a Fauves">
          <div className="home-explore-block">
            <div className="home-section-heading">
              <span>Comunidades</span>
              <h2>
                <span className="home-heading-desktop">Calendários para acompanhar</span>
                <span className="home-heading-mobile">Explore comunidades</span>
              </h2>
              <Link to="/organizations">Ver todos <ArrowUpRight size={14} /></Link>
            </div>
            <div className="home-calendar-grid">
              {organizations.slice(0, 8).map((organization, index) => {
                const name = organization.name || 'Calendário Fauves';
                const accent = /^#[0-9a-f]{6}$/i.test(organization.themeColor || '')
                  ? organization.themeColor
                  : ['#5c73ff', '#df4e9f', '#f07a31', '#55b89a'][index % 4];
                const logo = resolveImageUrl(organization.logoUrl);
                const destination = organization.slug || organization.id;

                return (
                  <Link
                    to={destination ? `/${destination}` : '/organizations'}
                    className="home-glow-card home-calendar-card"
                    onPointerMove={moveSpotlight}
                    style={{ '--card-accent': accent } as CSSProperties}
                    key={organization.id || `${name}-${index}`}
                  >
                    <span className="home-card-glow" aria-hidden="true" />
                    <span className="home-calendar-logo" style={{ backgroundColor: `${accent}1f`, color: accent }}>
                      {logo ? <img src={logo} alt="" /> : getInitials(name)}
                    </span>
                    <strong>{name}</strong>
                    <small>{organization.bio || organization.description || 'Descubra novos encontros e experiências.'}</small>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="home-explore-block">
            <div className="home-section-heading">
              <span>Descobrir</span>
              <h2>Explorar por categoria</h2>
            </div>
            <div className="home-category-grid">
              {categories.slice(0, 12).map((category, index) => {
                const visual = getCategoryVisual(category, index);
                const { Icon } = visual;
                return (
                  <Link
                    to={`/eventos/${category.slug || category.id}`}
                    className="home-glow-card home-category-card"
                    onPointerMove={moveSpotlight}
                    style={{ '--card-accent': visual.color } as CSSProperties}
                    key={category.id || category.slug || `${category.name}-${index}`}
                  >
                    <span className="home-card-glow" aria-hidden="true" />
                    <Icon size={25} strokeWidth={1.75} style={{ color: visual.color }} />
                    <strong>{category.name || 'Eventos'}</strong>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="comece-agora" className="home-ending">
          <WebGLParticleField className="home-ending-canvas" mode="footer" active />
          <div className="home-ending-grid" aria-hidden="true" />
          <div className="home-ending-cta">
            <span><Sparkles size={16} /> O próximo encontro</span>
            <h2>Sua próxima memória<br /><strong>inesquecível está esperando.</strong></h2>
            <div>
              <Link to="/discover">Descobrir eventos</Link>
              <Link to="/create">Criar evento</Link>
            </div>
          </div>
          <FooterV2 maxWidth="960px" variant="home" />
        </section>
      </main>

      <style>{`
        .fauves-home {
          --footer-text-color: rgba(255,255,255,.46);
          --footer-hover-color: #fff;
          --footer-border-color: rgba(255,255,255,.1);
          --footer-social-color: rgba(255,255,255,.42);
          --footer-social-hover: #fff;
          --footer-logo-color: #fff;
          --cta-gradient-start: #6877ff;
          --cta-gradient-end: #ff6635;
          background: #141516;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow-x: clip;
        }

        .home-mobile-header { display: none; }
        .home-heading-mobile { display: none; }

        .home-hero {
          --orb-x: 50%;
          --orb-y: 48%;
          --hero-shift-x: 0px;
          --hero-shift-y: 0px;
          position: relative;
          min-height: max(760px, 100svh);
          overflow: visible;
          isolation: isolate;
          background: #141516;
        }

        .home-webgl-canvas,
        .home-ending-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .home-webgl-canvas { z-index: 0; opacity: .5; }
        .home-hero-vignette {
          position: absolute;
          z-index: 1;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at center, rgba(20,21,22,.04) 0 22%, rgba(20,21,22,.22) 48%, rgba(20,21,22,.88) 100%),
            linear-gradient(to bottom, rgba(20,21,22,.15), transparent 20%, transparent 76%, #141516 100%);
        }

        .home-theme-orb {
          position: absolute;
          z-index: 1;
          left: var(--orb-x);
          top: var(--orb-y);
          width: min(82vw, 920px);
          aspect-ratio: 1;
          pointer-events: none;
          overflow: hidden;
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%) scale(.18);
          transition: left 100ms linear, top 100ms linear, opacity 320ms ease, transform 680ms cubic-bezier(.16,1,.3,1);
          box-shadow: inset 0 0 80px rgba(255,255,255,.12), 0 32px 120px rgba(0,0,0,.38);
        }

        .home-hero[data-effect-active="true"] .home-theme-orb {
          opacity: .94;
          transform: translate(-50%, -50%) scale(1);
        }

        .home-hero[data-effect="0"] .home-theme-orb {
          background:
            radial-gradient(circle at 73% 28%, #ffd924 0 10%, transparent 31%),
            radial-gradient(circle at 25% 28%, #c727f2 0 18%, transparent 47%),
            linear-gradient(135deg, #4148e8, #ef47ae 48%, #f1781d 72%, #ffd425);
        }

        .home-hero[data-effect="1"] .home-theme-orb {
          background:
            repeating-conic-gradient(from 12deg, transparent 0 2.5deg, rgba(90,115,255,.85) 3deg, rgba(239,65,24,.7) 3.6deg, transparent 4.4deg 8deg),
            #08090c;
          animation: home-orb-warp 5.5s ease-in-out infinite alternate;
        }

        .home-hero[data-effect="2"] .home-theme-orb {
          background:
            radial-gradient(circle at 20% 30%, rgba(255,255,255,.3) 0 3px, transparent 4px),
            radial-gradient(circle at 72% 24%, rgba(255,215,60,.75) 0 4px, transparent 5px),
            radial-gradient(circle at 68% 74%, rgba(255,255,255,.22) 0 3px, transparent 4px),
            linear-gradient(145deg, #ff5074, #e7305c 55%, #f0441b);
          background-size: 98px 98px, 140px 140px, 118px 118px, auto;
          animation: home-orb-pulse 5s ease-in-out infinite alternate;
        }

        .home-floating-events { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
        .home-poster-slot {
          position: absolute;
          aspect-ratio: 1;
          pointer-events: auto;
          transform: translate3d(calc(var(--hero-shift-x) * var(--depth)), calc(var(--hero-shift-y) * var(--depth)), 0);
          transition: transform 180ms ease-out;
        }

        .home-poster-entry { width: 100%; height: 100%; }

        .home-poster {
          display: block;
          width: 100%;
          height: 100%;
          padding: 8px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 17px;
          background: rgba(80,80,84,.48);
          box-shadow: 0 18px 38px rgba(0,0,0,.42), inset 0 1px 1px rgba(255,255,255,.28);
          animation: home-poster-float 6.4s ease-in-out var(--poster-delay) infinite alternate;
          transform: rotate(var(--poster-rotate));
          transition: border-color 220ms ease, box-shadow 220ms ease, filter 220ms ease;
        }

        .home-poster img { width: 100%; height: 100%; border-radius: 11px; object-fit: cover; }
        .home-poster:hover {
          z-index: 4;
          border-color: rgba(255,255,255,.46);
          box-shadow: 0 28px 56px rgba(0,0,0,.55), 0 0 0 1px rgba(111,108,255,.22);
          filter: saturate(1.08) brightness(1.04);
        }

        .home-hero-copy {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 50%;
          width: min(92vw, 760px);
          translate: -50% -48%;
          text-align: center;
        }

        .home-hero-copy h1 { margin: 0; font-size: clamp(3.25rem, 5vw, 5.1rem); font-weight: 500; line-height: .94; letter-spacing: -.06em; }
        .home-hero-copy h1 span,
        .home-hero-copy h1 strong { display: block; }
        .home-hero-copy h1 span { white-space: nowrap; }
        .home-hero-copy h1 strong {
          padding-bottom: .08em;
          font-weight: 650;
          background: linear-gradient(96deg, #775cff 2%, #cf36b2 38%, #f05267 64%, #ffb21a 98%);
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
        }

        .home-hero-copy > p { max-width: 510px; margin: 30px auto 0; color: rgba(255,255,255,.56); font-size: 1rem; font-weight: 550; line-height: 1.55; }
        .home-hero-actions { display: flex; align-items: center; flex-direction: column; gap: 12px; margin-top: 30px; }
        .home-create-button {
          min-height: 46px;
          padding: 0 21px;
          border: 1px solid rgba(255,255,255,.55);
          border-radius: 999px;
          background: #fff;
          color: #161718;
          box-shadow: 0 14px 34px rgba(0,0,0,.32);
          font-size: .9rem;
          font-weight: 750;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .home-create-button:hover { transform: translateY(-2px); box-shadow: 0 18px 45px rgba(0,0,0,.42); }
        .home-discover-link { display: inline-flex; align-items: center; gap: 7px; color: rgba(255,255,255,.54); font-size: .86rem; font-weight: 650; transition: color 160ms ease, gap 160ms ease; }
        .home-discover-link:hover { gap: 11px; color: #fff; }

        .home-explore { position: relative; isolation: isolate; width: min(100% - 40px, 960px); margin: 0 auto 150px; padding-top: 160px; }
        .home-explore::before {
          position: absolute;
          z-index: 0;
          left: 50%;
          top: 0;
          width: 100vw;
          height: 240px;
          translate: -50% 0;
          content: '';
          pointer-events: none;
          background: linear-gradient(to bottom, rgba(20,21,22,0), rgba(20,21,22,.78) 50%, #141516 82%);
        }
        .home-explore-block { position: relative; z-index: 1; }
        .home-explore-block + .home-explore-block { margin-top: 94px; }
        .home-section-heading { position: relative; margin-bottom: 22px; }
        .home-section-heading > span { display: block; margin-bottom: 8px; color: #7a77ff; font-size: .7rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
        .home-section-heading h2 { margin: 0; color: rgba(255,255,255,.94); font-size: 1.35rem; font-weight: 700; letter-spacing: -.025em; }
        .home-section-heading > a { position: absolute; right: 0; bottom: 1px; display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,.42); font-size: .78rem; font-weight: 650; }
        .home-section-heading > a:hover { color: #fff; }

        .home-calendar-grid,
        .home-category-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; }
        .home-glow-card {
          --spot-x: 50%;
          --spot-y: 50%;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.075);
          border-radius: 14px;
          background: rgba(255,255,255,.052);
          box-shadow: inset 0 1px rgba(255,255,255,.02);
          transition: border-color 230ms ease, box-shadow 230ms ease;
        }
        .home-glow-card::after {
          position: absolute;
          z-index: 3;
          inset: -1px;
          padding: 1px;
          content: '';
          pointer-events: none;
          border-radius: inherit;
          background: radial-gradient(170px circle at var(--spot-x) var(--spot-y), color-mix(in srgb, var(--card-accent) 90%, white), transparent 72%);
          opacity: 0;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          transition: opacity 230ms ease;
        }
        .home-card-glow { position: absolute !important; z-index: -1 !important; inset: 0; background: radial-gradient(260px circle at var(--spot-x) var(--spot-y), color-mix(in srgb, var(--card-accent) 20%, transparent), transparent 70%); opacity: 0; transition: opacity 230ms ease; }
        .home-glow-card:hover { z-index: 2; border-color: color-mix(in srgb, var(--card-accent) 35%, rgba(255,255,255,.1)); box-shadow: 0 17px 42px rgba(0,0,0,.24); }
        .home-glow-card:hover::after,
        .home-glow-card:hover .home-card-glow { opacity: 1; }
        .home-glow-card:focus-visible { outline: 2px solid var(--card-accent); outline-offset: 3px; }

        .home-calendar-card { display: flex; min-height: 156px; flex-direction: column; padding: 16px; }
        .home-calendar-card > * { position: relative; z-index: 1; }
        .home-calendar-logo { display: flex; width: 44px; height: 44px; align-items: center; justify-content: center; margin-bottom: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); border-radius: 11px; font-size: .78rem; font-weight: 800; }
        .home-calendar-logo img { width: 100%; height: 100%; object-fit: cover; }
        .home-calendar-card strong { overflow: hidden; color: rgba(255,255,255,.94); font-size: .88rem; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
        .home-calendar-card small { display: -webkit-box; margin-top: 6px; overflow: hidden; color: rgba(255,255,255,.48); font-size: .78rem; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }

        .home-category-card { display: flex; min-height: 112px; flex-direction: column; justify-content: space-between; padding: 16px; }
        .home-category-card > svg,
        .home-category-card > strong { position: relative; z-index: 1; }
        .home-category-card strong { color: rgba(255,255,255,.94); font-size: .9rem; line-height: 1.2; }

        .home-ending { position: relative; min-height: 530px; overflow: hidden; border-top: 1px solid rgba(255,255,255,.035); background: #121314; isolation: isolate; }
        .home-ending-canvas { z-index: 0; opacity: .78; }
        .home-ending-grid {
          position: absolute;
          z-index: 0;
          inset: 0;
          opacity: .22;
          background-image: radial-gradient(circle, rgba(255,255,255,.27) 1px, transparent 1.35px);
          background-size: 12px 12px;
          mask-image: linear-gradient(to bottom, transparent 2%, #000 24%, #000 100%);
        }
        .home-ending-cta { position: relative; z-index: 1; display: flex; min-height: 390px; align-items: center; justify-content: center; flex-direction: column; padding: 70px 20px 54px; text-align: center; }
        .home-ending-cta > span { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 17px; color: rgba(255,255,255,.5); font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
        .home-ending-cta h2 { margin: 0; color: rgba(255,255,255,.96); font-size: clamp(2.25rem, 4vw, 3.8rem); font-weight: 550; line-height: 1.05; letter-spacing: -.05em; }
        .home-ending-cta h2 strong { color: transparent; font-weight: 650; background: linear-gradient(95deg, #845eff, #d736ae 40%, #f15464 68%, #ffa921); background-clip: text; -webkit-background-clip: text; }
        .home-ending-cta > div { display: flex; gap: 10px; margin-top: 28px; }
        .home-ending-cta a { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; padding: 0 18px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; background: rgba(255,255,255,.07); color: #fff; font-size: .84rem; font-weight: 700; backdrop-filter: blur(12px); transition: transform 180ms ease, background 180ms ease, border-color 180ms ease; }
        .home-ending-cta a:first-child { border-color: rgba(255,255,255,.65); background: rgba(255,255,255,.95); color: #151617; }
        .home-ending-cta a:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.55); background: rgba(255,255,255,.13); }
        .home-ending-cta a:first-child:hover { background: #fff; }
        .home-ending .footer-v2 { position: relative; z-index: 2; margin-top: 0 !important; }

        @keyframes home-poster-float {
          from { transform: translate3d(0,-4px,0) rotate(var(--poster-rotate)); }
          to { transform: translate3d(0,8px,0) rotate(calc(var(--poster-rotate) * -0.35)); }
        }
        @keyframes home-orb-warp {
          from { background-position: 0 0; filter: hue-rotate(-8deg) saturate(1.1); }
          to { background-position: 30px -22px; filter: hue-rotate(12deg) saturate(1.35); }
        }
        @keyframes home-orb-pulse {
          from { filter: saturate(1) hue-rotate(-3deg); }
          to { filter: saturate(1.35) hue-rotate(8deg); }
        }

        @media (max-width: 1180px) {
          .home-poster-slot:nth-child(2),
          .home-poster-slot:nth-child(5),
          .home-poster-slot:nth-child(9),
          .home-poster-slot:nth-child(11) { display: none; }
          .home-hero-copy { width: min(90vw, 700px); }
        }

        @media (max-width: 820px) {
          .home-hero { min-height: 860px; }
          .home-hero-copy { top: 46%; width: min(90vw, 640px); }
          .home-hero-copy h1 { font-size: clamp(3rem, 9vw, 4.8rem); }
          .home-hero-copy h1 span { white-space: normal; }
          .home-poster-slot { transform: scale(.78) translate3d(calc(var(--hero-shift-x) * var(--depth)), calc(var(--hero-shift-y) * var(--depth)), 0); }
          .home-poster-slot:nth-child(3),
          .home-poster-slot:nth-child(4),
          .home-poster-slot:nth-child(10),
          .home-poster-slot:nth-child(12) { display: none; }
          .home-calendar-grid {
            grid-template-columns: none;
            grid-auto-columns: min(72vw, 280px);
            grid-auto-flow: column;
            overflow-x: auto;
            padding-bottom: 12px;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            overscroll-behavior-inline: contain;
          }
          .home-calendar-grid::-webkit-scrollbar { display: none; }
          .home-calendar-card { scroll-snap-align: start; }
          .home-category-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .home-explore { padding-top: 130px; }
        }

        @media (max-width: 560px) {
          .fauves-home > .luma-nav-v2 { display: none !important; }
          .home-mobile-header {
            position: absolute;
            z-index: 20;
            top: 0;
            left: 0;
            display: flex;
            width: 100%;
            min-height: calc(72px + env(safe-area-inset-top));
            align-items: center;
            justify-content: space-between;
            padding: calc(18px + env(safe-area-inset-top)) 18px 10px;
            pointer-events: none;
          }
          .home-mobile-header > * { pointer-events: auto; }
          .home-mobile-brand {
            display: grid;
            width: 44px;
            height: 44px;
            place-items: center;
            color: rgba(255,255,255,.5);
          }
          .home-mobile-brand svg { width: 25px; height: 25px; fill: currentColor; }
          .home-mobile-login {
            display: inline-flex;
            min-height: 40px;
            align-items: center;
            justify-content: center;
            padding: 0 17px;
            border: 1px solid rgba(255,255,255,.035);
            border-radius: 999px;
            background: rgba(255,255,255,.075);
            color: rgba(255,255,255,.72);
            font-size: .9rem;
            font-weight: 600;
            text-decoration: none;
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }

          .home-hero { min-height: 900px; }
          .home-theme-orb { width: 145vw; }
          .home-webgl-canvas { opacity: .25; }
          .home-hero-copy {
            top: calc(150px + env(safe-area-inset-top));
            width: min(calc(100% - 32px), 390px);
            translate: -50% 0;
          }
          .home-hero-copy h1 { font-size: clamp(2.35rem, 11.8vw, 2.95rem); line-height: 1.01; letter-spacing: -.052em; }
          .home-hero-copy h1 strong { white-space: nowrap; }
          .home-hero-copy > p { max-width: 360px; margin-top: 24px; padding: 0 6px; font-size: .96rem; font-weight: 500; line-height: 1.55; }
          .home-hero-actions { gap: 14px; margin-top: 25px; }
          .home-create-button { min-height: 48px; padding-inline: 22px; font-size: .94rem; }
          .home-discover-link { min-height: 34px; font-size: .91rem; }

          .home-poster-slot { top: auto !important; bottom: auto !important; transform: none; }
          .home-poster-slot:nth-child(-n+5) { display: block; }
          .home-poster-slot:nth-child(n+6) { display: none; }
          .home-poster-slot:nth-child(1) { left: -56px !important; right: auto !important; top: 574px !important; width: 166px !important; }
          .home-poster-slot:nth-child(2) { left: 50% !important; right: auto !important; top: 510px !important; width: 170px !important; transform: translateX(-50%); }
          .home-poster-slot:nth-child(3) { left: auto !important; right: -58px !important; top: 548px !important; width: 164px !important; }
          .home-poster-slot:nth-child(4) { left: 31px !important; right: auto !important; top: 684px !important; width: 166px !important; }
          .home-poster-slot:nth-child(5) { left: auto !important; right: 17px !important; top: 652px !important; width: 176px !important; }
          .home-poster { padding: 6px; border-radius: 18px; }
          .home-poster img { border-radius: 13px; }

          .home-explore { width: min(100% - 32px, 960px); margin: 0 auto 82px; padding-top: 72px; }
          .home-explore::before { height: 150px; }
          .home-explore-block + .home-explore-block { margin-top: 72px; }
          .home-section-heading { margin-bottom: 19px; }
          .home-section-heading > span { display: none; }
          .home-section-heading h2 { font-size: 1.28rem; letter-spacing: -.02em; }
          .home-heading-desktop { display: none; }
          .home-heading-mobile { display: inline; }
          .home-section-heading > a { display: none; }
          .home-calendar-grid {
            width: calc(100% + 32px);
            grid-auto-columns: min(64vw, 258px);
            gap: 12px;
            margin-inline: -16px;
            padding-inline: 16px;
          }
          .home-category-grid { gap: 12px 10px; }
          .home-calendar-card { min-height: 150px; padding: 16px; }
          .home-calendar-logo { margin-bottom: 17px; }
          .home-calendar-card strong { font-size: .93rem; }
          .home-calendar-card small { font-size: .81rem; }
          .home-category-card { min-height: 108px; padding: 15px; border-radius: 13px; }
          .home-category-card strong { font-size: .94rem; }

          .home-ending { min-height: 520px; }
          .home-ending-cta { min-height: 350px; padding: 64px 16px 42px; }
          .home-ending-cta > span { display: none; }
          .home-ending-cta h2 {
            color: transparent;
            font-size: clamp(1.8rem, 8.6vw, 2.2rem);
            font-weight: 650;
            line-height: 1.12;
            letter-spacing: -.04em;
            background: linear-gradient(95deg, #a74fec, #dd37a7 34%, #f15464 61%, #ffa921);
            background-clip: text;
            -webkit-background-clip: text;
          }
          .home-ending-cta h2 strong { font-weight: inherit; background: none; }
          .home-ending-cta > div { margin-top: 27px; }
          .home-ending-cta a { min-height: 44px; padding-inline: 17px; font-size: .89rem; }
          .home-ending-cta > div { flex-wrap: wrap; justify-content: center; }
        }

        @media (max-width: 360px) {
          .home-hero { min-height: 850px; }
          .home-hero-copy { top: calc(140px + env(safe-area-inset-top)); }
          .home-poster-slot:nth-child(1) { top: 545px !important; width: 150px !important; }
          .home-poster-slot:nth-child(2) { top: 500px !important; width: 154px !important; }
          .home-poster-slot:nth-child(3) { top: 530px !important; width: 150px !important; }
          .home-poster-slot:nth-child(4) { top: 648px !important; width: 152px !important; }
          .home-poster-slot:nth-child(5) { top: 625px !important; width: 158px !important; }
          .home-explore { padding-top: 62px; }
        }

        @media (hover: none), (pointer: coarse) {
          .home-poster-slot { pointer-events: none; }
          .home-card-glow,
          .home-glow-card::after { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .fauves-home *,
          .fauves-home *::before,
          .fauves-home *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
          .home-poster-slot { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default FauvesHome;
