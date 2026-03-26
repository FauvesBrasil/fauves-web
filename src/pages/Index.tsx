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

  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingInitialEvents, setLoadingInitialEvents] = useState(true);

  // Load initial data (events, categories, slides) in parallel
  useEffect(() => {
    (async () => {
      try {
        setError(null);

        // Build URLs
        // We only need the first ~30 events for Trending/StyleDiscovery/Weekend
        const initialEventsUrl = `/api/event?limit=30${selectedUf ? `&uf=${selectedUf}` : ''}`;
        const slidesUrl = selectedUf ? `/api/slides?uf=${selectedUf}` : '/api/slides';
        const categoriesUrl = '/api/categories';

        // Fetch everything in parallel, but handle responses as they come
        const fetchSlides = async () => {
          try {
            const res = await fetchApi(slidesUrl);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                setSliderEvents(data.map((slide: any) => ({
                  category: slide.title,
                  image: slide.imageUrl || '/no-image.svg',
                  id: slide.eventSlug || slide.id,
                  slug: slide.eventSlug || null,
                  date: slide.eventDate ? new Date(slide.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '',
                  linkUrl: slide.linkType === 'external' ? slide.linkUrl : null,
                  linkType: slide.linkType,
                  showTitle: slide.showTitle !== false,
                })));
              }
            }
          } catch (e) { console.error('Error fetching slides:', e); }
        };

        const fetchCats = async () => {
          try {
            const res = await fetchApi(categoriesUrl);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                setCategories(data.filter((c: any) => c.isActive));
              }
            }
          } catch (e) { console.error('Error fetching categories:', e); }
        };

        const fetchInitialEvents = async () => {
          try {
            const res = await fetchApi(initialEventsUrl);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                setInitialEvents(data);
              }
            }
          } catch (e) { console.error('Error fetching initial events:', e); }
          setLoadingInitialEvents(false);
        };

        // Start all but categorize them
        await Promise.all([
          fetchSlides(),
          fetchCats(),
          fetchInitialEvents()
        ]);

      } catch (e) {
        console.error('Core loading failed:', e);
      } finally {
        setLoadingHero(false);
        setLoading(false); // Global legacy loading
      }
    })();
  }, [selectedUf]); // Reload all when location changes

  // Slicing logic: if hero is loaded, show the top. Else show global skeleton.
  if (loadingHero && sliderEvents.length === 0) return <HomePageSkeleton />;

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
      {sliderEvents.length > 0 && (
        <div className="w-full max-w-[1352px] mx-auto flex flex-col items-center py-6 overflow-x-hidden">
          <EventSlider slides={sliderEvents} />
        </div>
      )}

      <div className="max-w-[1352px] mx-auto px-0">
        {/* Seção: Descubra por Estilo */}
        {loadingInitialEvents ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>
        ) : initialEvents.length > 0 && (
          <StyleDiscovery
            events={initialEvents}
            selectedUf={selectedUf}
            categories={categories}
            useMockData={false}
          />
        )}

        {/* Seção: Eventos em Alta */}
        {!loadingInitialEvents && initialEvents.length > 0 && (
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
        {!loadingInitialEvents && (
          <FollowedArtists
            events={initialEvents}
            selectedUf={selectedUf}
            useMockData={false}
          />
        )}

        {/* Seção: O que fazer esse fim de semana */}
        {!loadingInitialEvents && <WeekendHighlights events={initialEvents} />}

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
