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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function buildErrorMessage(primary: string, fallback: string | null, e1: any, e2: any) {
    const parts: string[] = [];
    const norm = (e: any) => e?.name === 'AbortError' ? 'timeout' : (e?.message || e?.toString?.() || 'erro desconhecido');
    parts.push(`Falha ao buscar eventos em ${primary}: ${norm(e1)}`);
    if (fallback && e2) parts.push(`Fallback ${fallback} falhou: ${norm(e2)}`);
    parts.push('Verifique se o backend está na porta correta (ex: 4000) ou ajuste VITE_BACKEND_URL.');
    return parts.join(' | ');
  }

  // Carrega eventos do backend (estratégia resiliente com fallback mesmo se VITE_BACKEND_URL estiver incorreta)
  useEffect(() => {
    let backendEnv = (import.meta as any).env?.VITE_BACKEND_URL || '';
    // Se a env apontar para localhost em porta diferente da 4000, ignorar para evitar tentativas desnecessárias
    if (backendEnv && /^(https?:\/\/)?localhost:(\d+)/i.test(backendEnv)) {
      const portMatch = backendEnv.match(/localhost:(\d+)/i);
      const port = portMatch ? portMatch[1] : '';
      if (port && port !== '4000') {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Index] Ignorando VITE_BACKEND_URL porque porta != 4000:', backendEnv);
        }
        backendEnv = '';
      }
    }
    const backendPort = (import.meta as any).env?.VITE_BACKEND_PORT || '4000';
    const base = backendEnv ? backendEnv.replace(/\/$/, '') : '';
    // Tentar reaproveitar uma URL previamente validada (persistida em localStorage)
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('eventsApiBase') : null;
    const primaryUrl = stored ? `${stored.replace(/\/$/, '')}/events` : (base ? `${base}/events` : '/events');
    const fallbackUrl = `http://localhost:${backendPort}/events`;

    const fetchWithTimeout = async (url: string, ms: number) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
        if (!res.ok) {
          const err: any = new Error(`HTTP ${res.status}`);
          err.status = res.status;
          err.url = url;
          throw err;
        }
        return await res.json();
      } finally {
        clearTimeout(timer);
      }
    };

    (async () => {
      let firstError: any = null;
      try {
        if (process.env.NODE_ENV !== 'production') console.log('[Index] Fetch eventos', primaryUrl);
        const data = await fetchWithTimeout(primaryUrl, 8000);
        if (!Array.isArray(data)) throw new Error('Formato inesperado');
        setEvents(data);
        // Persistir base funcional (se não é a rota relativa '/events')
        if (!primaryUrl.startsWith('/events')) {
          const baseOk = primaryUrl.replace(/\/events$/, '');
          try { window.localStorage.setItem('eventsApiBase', baseOk); } catch {}
        }
      } catch (err:any) {
        firstError = err;
        // Tentar fallback em qualquer erro: se primary era relativo (/events) e deu 500 (proxy) ou se era URL absoluta
        if (primaryUrl !== '/events' || backendEnv || primaryUrl === '/events') {
          try {
            if (process.env.NODE_ENV !== 'production') console.warn('[Index] Fallback eventos', fallbackUrl, 'motivo:', err?.message || err);
            const data2 = await fetchWithTimeout(fallbackUrl, 6000);
            if (!Array.isArray(data2)) throw new Error('Formato inesperado');
            setEvents(data2);
            setError(null);
            try { window.localStorage.setItem('eventsApiBase', `http://localhost:${backendPort}`); } catch {}
            return;
          } catch (e2:any) {
            const msg = buildErrorMessage(primaryUrl, fallbackUrl, firstError, e2);
            setError(msg);
            setEvents([]);
          }
        }
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
      <div className="max-w-[1352px] mx-auto">
        <main>
          <section className="relative px-[156px] py-5 max-md:p-5 max-sm:p-[15px]">
            <div className="flex items-center gap-4 max-md:flex-col max-md:items-start">
              <h1 className="text-[#091747] text-[18px] font-bold whitespace-nowrap max-sm:text-[14px]">
                Melhores eventos em
              </h1>
              <LocationSelector />
              <div className="flex-1">
                <SearchBar />
              </div>
            </div>
          </section>

          <section className="px-[156px] py-0 max-md:p-5 max-sm:p-[15px]">
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
