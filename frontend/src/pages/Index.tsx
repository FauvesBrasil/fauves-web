import * as React from 'react';
import HomePageSkeleton from "@/components/skeletons/HomePageSkeleton";
import AppShell from '@/components/AppShell';
import LocationSelector from '@/components/LocationSelector';
import SearchBar from '@/components/SearchBar';
import CategoryTags from '@/components/CategoryTags';
import EventsGrid from '@/components/EventsGrid';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import EventSlider, { EventSliderSlide } from '@/components/EventSlider';

// OBS: removido supabase e spinner não utilizados; carregamento é puramente via backend /events

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

type RawEvent = Event | Record<string, unknown>;

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [sliderEvents, setSliderEvents] = useState<EventSliderSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep hooks order stable: read location context here so it's not called conditionally later
  const { selectedUf } = useLocation();

  function buildErrorMessage(status?: number, detail?: string) {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> });
    const baseEnv = metaEnv.env?.VITE_API_BASE || metaEnv.env?.VITE_BACKEND_URL || '(não definido)';
    const parts: string[] = [];
    if (status) parts.push(`HTTP ${status}`);
    if (detail) parts.push(detail);
    parts.push(`Verifique se VITE_API_BASE está configurado para o backend público (atual: ${baseEnv}).`);
    return 'Falha ao listar eventos: ' + parts.join(' | ');
  }

  // Carrega eventos usando fetchApi centralizado (sem fallback localhost em produção)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchApi('/events', { headers: { 'Accept': 'application/json' } });
        if (!r.ok) {
          const detail = await (async () => { try { const j = await r.json(); return j?.error || j?.message; } catch { return null; } })();
          setError(buildErrorMessage(r.status, detail));
        } else {
          const data = await r.json();
          if (Array.isArray(data)) {
            setEvents(data);
            // filtra os 5 eventos mais próximos da data atual
            const now = new Date();
            const sorted = [...data].filter(ev => ev.startDate).sort((a, b) => {
              const da = new Date(a.startDate).getTime();
              const db = new Date(b.startDate).getTime();
              return da - db;
            });
            const slides: EventSliderSlide[] = sorted.slice(0, 5).map(ev => ({
              category: ev.name,
              image: ((): string => {
                const candidate = ev.bannerUrl || ev.image;
                if (!candidate) return '/no-image.svg';
                if (typeof candidate === 'string' && candidate.startsWith('/uploads/')) return apiUrl(candidate);
                return candidate;
              })(),
              id: ev.id,
              slug: ev.slug,
              date: ev.startDate ? new Date(ev.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '',
            }));
            setSliderEvents(slides);
          } else {
            setError(buildErrorMessage(undefined, 'Resposta inesperada'));
          }
        }
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
  }, []);

  if (loading) return <HomePageSkeleton />;

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
    return {
      id: typeof r.id === 'string' ? r.id : '',
      title: typeof r.name === 'string' ? r.name : 'Evento sem nome',
      date: typeof r.startDate === 'string' ? new Date(r.startDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }) : 'Data não informada',
      location: formatLocation(r) || 'Local não informado',
      image: ((): string => {
        const maybeBanner = r.bannerUrl ?? r.banner ?? r.image;
        const candidate = typeof maybeBanner === 'string' ? maybeBanner : null;
        if (!candidate) return '/no-image.svg';
        if (candidate.startsWith('/uploads/')) return apiUrl(candidate);
        return candidate;
      })(),
    };
  };

  // Mostrar todos os eventos sem filtro de data
  const allEvents = (events || []).map(mapEvent);
  // Filter events by selected UF if possible (assumes event.locationUf exists)
  const filteredEvents = selectedUf ? allEvents.filter(ev => {
    // try to match /UF or - UF patterns in the location string
    const loc = (ev.location || '').toUpperCase();
    if (!loc) return true;
    if (loc.includes(`/${selectedUf}`) || loc.includes(` ${selectedUf}`) || loc.includes(`- ${selectedUf}`)) return true;
    // fallback: if event has explicit uf field on original event object, match that (best-effort)
    return true; // keep all if we can't determine
  }) : allEvents;

  return (
    <AppShell>
      {error && (
        <div className="mx-auto max-w-[1352px] px-6 pt-4">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        </div>
      )}
      <EventSlider slides={sliderEvents} />
      <div className="max-w-[1352px] mx-auto">
        <main>
          <section className="px-[156px] py-5 max-md:p-5 max-sm:p-[15px]">
            <CategoryTags />
          </section>

          <EventsGrid
            title="Todos os eventos"
            events={filteredEvents}
            size="large"
          />

          <Banner />
        </main>
      </div>
    </AppShell>
  );
};

export default Index;
