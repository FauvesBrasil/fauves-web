import HomePageSkeleton from "@/components/skeletons/HomePageSkeleton";
import AppShell from '@/components/AppShell';
import LocationSelector from '@/components/LocationSelector';
import SearchBar from '@/components/SearchBar';
import CategoryTags from '@/components/CategoryTags';
import StyleDiscovery from '@/components/StyleDiscovery';
import TrendingEvents from '@/components/TrendingEvents';
import FollowedArtists from '@/components/FollowedArtists';
import EventsGrid from '@/components/EventsGrid';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';
import EmptyStateOrganizerCTA from '@/components/EmptyStateOrganizerCTA';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from '@/context/LocationContext';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import EventSlider, { EventSliderSlide } from '@/components/EventSlider';
import { Loader2 } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import WeekendHighlights from '@/components/WeekendHighlights';
import TrendingHighlights from '@/components/TrendingHighlights';
import CategoryFilter from '@/components/CategoryFilter';
import LeadCapture from '@/components/LeadCapture';

// OBS: removido supabase e spinner não utilizados; carregamento é puramente via backend /events

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

type RawEvent = Event | Record<string, unknown>;

// Estado para mapear UF -> Nome do estado
const UF_TO_STATE_NAME: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

const Index = () => {
  const [sliderEvents, setSliderEvents] = useState<EventSliderSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationChanging, setLocationChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const prevUfRef = useRef<string | null>(null);

  // Keep hooks order stable: read location context here so it's not called conditionally later
  const { selectedUf } = useLocation();

  function buildErrorMessage(status?: number, detail?: string) {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> });
    const baseEnv = metaEnv.env?.VITE_API_BASE || metaEnv.env?.VITE_BACKEND_URL || 'https://fauves-backend-production.up.railway.app';
    const parts: string[] = [];
    if (status) parts.push(`HTTP ${status}`);
    if (detail) parts.push(detail);
    parts.push(`Verifique se VITE_API_BASE está configurado para o backend público (atual: ${baseEnv}).`);
    return 'Falha ao listar eventos: ' + parts.join(' | ');
  }

  const [categories, setCategories] = useState<any[]>([]);
  const [initialEvents, setInitialEvents] = useState<Event[]>([]); // For hero sections

  // Infinite scroll for main events grid
  const fetchEventsPage = useCallback(async (page: number) => {
    const ufParam = selectedUf ? `&uf=${selectedUf}` : '';
    const catParam = selectedCategory ? `&category=${selectedCategory}` : '';
    const response = await fetchApi(`/events?page=${page}&limit=20${ufParam}${catParam}`);
    if (!response.ok) throw new Error('Failed to fetch events');
    const data = await response.json();
    return {
      items: data.events || data || [], // Handle both formats if necessary
      hasMore: data.hasMore || false,
      total: data.total,
    };
  }, [selectedUf, selectedCategory]); // Reset pagination when UF or Category changes

  const {
    items: paginatedEvents,
    loading: loadingMore,
    hasMore,
    triggerRef,
    reset: resetPagination,
  } = useInfiniteScroll<Event>({
    fetchPage: fetchEventsPage,
    pageSize: 20,
  });

  // Reset pagination when UF or Category changes
  useEffect(() => {
    resetPagination();
  }, [selectedUf, selectedCategory, resetPagination]);

  // Load all initial data (events, categories, slides) in parallel to avoid waterfalls
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Build URLs
        const eventsUrl = selectedUf ? `/events?uf=${selectedUf}` : '/events';
        const slidesUrl = selectedUf ? `/api/slides?uf=${selectedUf}` : '/api/slides';
        const categoriesUrl = '/api/categories';

        const [rEvents, rCats, rSlides] = await Promise.all([
          fetchApi(eventsUrl, { headers: { 'Accept': 'application/json' } }),
          fetchApi(categoriesUrl),
          fetchApi(slidesUrl)
        ]);

        // 1. Process Categories
        if (rCats.ok) {
          try {
            const cData = await rCats.json();
            if (Array.isArray(cData)) {
              setCategories(cData.filter((c: any) => c.isActive));
            }
          } catch { }
        }

        // 2. Process Events
        let loadedEvents: Event[] = [];
        if (!rEvents.ok) {
          const detail = await (async () => { try { const j = await rEvents.json(); return j?.error || j?.message; } catch { return null; } })();
          setError(buildErrorMessage(rEvents.status, detail));
        } else {
          const data = await rEvents.json();
          if (Array.isArray(data)) {
            loadedEvents = data;
            setInitialEvents(data);
          } else {
            setError(buildErrorMessage(undefined, 'Resposta inesperada'));
          }
        }

        // 3. Process Slides (Manual + Auto-supplement)
        const MAX_SLIDES = 8;
        let finalSlides: EventSliderSlide[] = [];

        if (rSlides.ok) {
            try {
                const sData = await rSlides.json();
                if (Array.isArray(sData) && sData.length > 0) {
                    finalSlides = sData.map((slide: any) => ({
                        category: slide.title,
                        image: slide.imageUrl || '/no-image.svg',
                        id: slide.eventSlug || slide.id,
                        slug: slide.eventSlug || null,
                        date: slide.eventDate ? new Date(slide.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '',
                        linkUrl: slide.linkType === 'external' ? slide.linkUrl : null,
                        linkType: slide.linkType,
                        showTitle: slide.showTitle !== false,
                    }));
                }
            } catch { }
        }

        // Auto-supplement slides if needed
        if (finalSlides.length < MAX_SLIDES && loadedEvents.length > 0) {
            const getEventUf = (ev: any): string => {
                if (ev.locationUf) return String(ev.locationUf).toUpperCase();
                if (ev.uf) return String(ev.uf).toUpperCase();
                return '';
            };

            const sortedEvents = [...loadedEvents]
                .filter((ev: any) => ev.startDate)
                .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            const existingIds = new Set(finalSlides.map(s => s.id || s.slug));
            const slotsAvailable = MAX_SLIDES - finalSlides.length;

            const autoSlides: EventSliderSlide[] = sortedEvents
                .filter((ev: any) => !existingIds.has(ev.id) && !existingIds.has(ev.slug))
                .slice(0, slotsAvailable)
                .map((ev: any) => ({
                    category: ev.name,
                    image: ev.bannerUrl || ev.image || '/no-image.svg',
                    id: ev.id,
                    slug: ev.slug,
                    date: ev.startDate ? new Date(ev.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '',
                    linkType: 'event',
                }));

            finalSlides = [...finalSlides, ...autoSlides];
        }
        setSliderEvents(finalSlides);

      } catch (e: unknown) {
        let message: string | undefined = undefined;
        if (typeof e === 'object' && e !== null && 'message' in e) {
          const maybe = (e as { message?: unknown }).message;
          if (typeof maybe === 'string') message = maybe;
        }
        setError(buildErrorMessage(undefined, message || 'network error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedUf]); // Reload all when location changes

  if (loading) return <HomePageSkeleton />;

  // Loading especial para mudança de localização
  if (locationChanging) {
    const stateName = UF_TO_STATE_NAME[selectedUf] || selectedUf;
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Buscando eventos em <span className="text-orange-500 font-semibold">{stateName}</span>...
          </p>
        </div>
      </AppShell>
    );
  }

  // Helper to build a user-facing location string. Prefer structured fields (city/uf) when available
  function formatLocation(ev: Record<string, unknown>) {
    // helper to safely read nested string props
    const getStr = (obj: Record<string, unknown> | undefined, key: string) => {
      if (!obj) return undefined;
      const v = obj[key];
      return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };

    // Try explicit fields first
    const city = getStr(ev, 'locationCity') || (typeof ev.location === 'object' && ev.location ? getStr(ev.location as Record<string, unknown>, 'city') : undefined) || (typeof ev.locationDetails === 'object' && ev.locationDetails ? getStr(ev.locationDetails as Record<string, unknown>, 'city') : undefined) || getStr(ev, 'city');
    const uf = getStr(ev, 'locationUf') || (typeof ev.location === 'object' && ev.location ? getStr(ev.location as Record<string, unknown>, 'uf') : undefined) || (typeof ev.locationDetails === 'object' && ev.locationDetails ? getStr(ev.locationDetails as Record<string, unknown>, 'uf') : undefined) || getStr(ev, 'uf');
    if (city && uf) return `${city} - ${uf}`;
    // If the backend stored a composed string like 'Local será anunciado: City - UF', try to extract the part after ':'
    if (typeof ev.location === 'string') {
      const s = (ev.location as string).trim();
      if (!s) return '';
      if (s.includes('Local será anunciado')) {
        const parts = s.split(':').slice(1).join(':').trim();
        if (parts) return parts; // return only 'City - UF' when available
        return ''; // hide the editorial phrase from public UI
      }
      return s;
    }
    return '';
  }

  // Função para mapear eventos do Supabase para o formato que o EventsGrid espera
  const mapEvent = (ev: RawEvent) => {
    const r = ev as Record<string, unknown>;
    const startDate = typeof r.startDate === 'string' ? new Date(r.startDate) : null;

    return {
      id: typeof r.id === 'string' ? r.id : '',
      slug: typeof r.slug === 'string' ? r.slug : null,
      title: typeof r.name === 'string' ? r.name : 'Evento sem nome',
      date: startDate ? startDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }) : 'Data não informada',
      dateShort: startDate ? `${startDate.getDate().toString().padStart(2, '0')} ${startDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}` : 'Data não informada',
      location: formatLocation(r) || 'Local não informado',
      image: ((): string => {
        const maybeBanner = r.bannerUrl ?? r.banner ?? r.image;
        const candidate = typeof maybeBanner === 'string' ? maybeBanner : null;
        if (!candidate) return '/no-image.svg';
        if (candidate.startsWith('/uploads/')) return apiUrl(candidate);
        return candidate;
      })(),
      categories: (r.categories as any[]) || [],
      views: Number(r.views || 0),
      interests: Number(r.interests || 0),
    };
  };

  // Map paginated events for display
  const mappedPaginatedEvents = paginatedEvents.map(mapEvent);

  // Show all events (backend already filtered by UF if selectedUf is set)
  const allEvents = (initialEvents || []).map(mapEvent);
  const filteredEvents = allEvents;

  return (
    <AppShell hideSearchOnMobile={false}>
      {error && (
        <div className="mx-auto max-w-[1352px] px-6 pt-4 max-md:px-4 max-sm:px-4">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        </div>
      )}

      {/* Slider with skeleton loader to prevent CLS */}
      {!loading && sliderEvents.length > 0 && (
        <div className="w-full max-w-[1352px] mx-auto flex flex-col items-center py-6 overflow-x-hidden">
          <EventSlider slides={sliderEvents} />
        </div>
      )}

      <div className="max-w-[1352px] mx-auto px-0">
        {/* Seção: Descubra por Estilo */}
        {filteredEvents.length > 0 && (
          <StyleDiscovery
            events={initialEvents}
            selectedUf={selectedUf}
            categories={categories}
            useMockData={false}
          />
        )}

        {/* Seção: Eventos em Alta */}
        {filteredEvents.length > 0 && (
          <>
            <TrendingEvents
              events={initialEvents}
              selectedUf={selectedUf}
              useMockData={false}
            />

            <LeadCapture source="home" />
          </>
        )}

        {/* Seção: Artistas que Você Segue (só para logados) */}
        <FollowedArtists
          events={initialEvents}
          selectedUf={selectedUf}
          useMockData={false}
        />

        {/* Seção: O que fazer esse fim de semana */}
        <WeekendHighlights events={initialEvents} />

        {/* Link para o topo quando filtrar */}
        <main>
          <section className="px-6 md:px-[156px] max-md:px-5 max-sm:px-4 mb-4">
            <CategoryFilter 
              selectedSlug={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </section>

          {paginatedEvents.length > 0 ? (
            <>
              <EventsGrid
                title="Todos os eventos"
                events={mappedPaginatedEvents}
                size="large"
              />

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={triggerRef} className="flex justify-center py-8">
                  {loadingMore && (
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  )}
                </div>
              )}
            </>
          ) : (
            <section className="px-6 md:px-[156px] max-md:px-5 max-sm:px-4">
              <EmptyStateOrganizerCTA selectedUf={selectedUf} />
            </section>
          )}

          <Banner />
        </main>
      </div>
    </AppShell>
  );
};

export default Index;
