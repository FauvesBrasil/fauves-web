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
import { fetchApi } from '@/lib/apiBase';
import EventSlider, { EventSliderSlide } from '@/components/EventSlider';

// OBS: removido supabase e spinner não utilizados; carregamento é puramente via backend /events

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [sliderEvents, setSliderEvents] = useState<EventSliderSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function buildErrorMessage(status?: number, detail?: string) {
    const baseEnv = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_BACKEND_URL || '(não definido)';
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
              image: ev.bannerUrl || ev.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
              id: ev.id,
              slug: ev.slug,
            }));
            setSliderEvents(slides);
          } else {
            setError(buildErrorMessage(undefined, 'Resposta inesperada'));
          }
        }
      } catch (e:any) {
        setError(buildErrorMessage(undefined, e?.message || 'network error'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <HomePageSkeleton />;

  // Função para mapear eventos do Supabase para o formato que o EventsGrid espera
  const mapEvent = (ev: any) => ({
    id: ev.id || '',
    title: ev.name || 'Evento sem nome',
    date: ev.startDate ? new Date(ev.startDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }) : 'Data não informada',
    location: ev.location || 'Local não informado',
    image: ev.image && typeof ev.image === 'string' && ev.image.length > 5
      ? ev.image
      : 'https://via.placeholder.com/245x130?text=Sem+Imagem',
  });

  // Mostrar todos os eventos sem filtro de data
  const allEvents = (events || []).map(mapEvent);

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
            events={allEvents}
            size="large"
          />

          <Banner />
        </main>
      </div>
    </AppShell>
  );
};

export default Index;
