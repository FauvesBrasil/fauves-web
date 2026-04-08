import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import EventsGrid from '@/components/EventsGrid';
import CategoryFilter from '@/components/CategoryFilter';
import EmptyStateOrganizerCTA from '@/components/EmptyStateOrganizerCTA';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import { Loader2 } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';


interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  image: string;
  locationCity?: string;
  locationUf?: string;
  slug?: string;
}

const EventsByCategory = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SEO dinâmico por categoria
  useSEO({
    title: category ? `Eventos de ${category.name} no Brasil` : undefined,
    description: category
      ? `Confira os melhores eventos de ${category.name} no Brasil. Compre ingressos online com segurança na Fauves.`
      : undefined,
    url: categorySlug ? `/eventos/${categorySlug}` : undefined,
  });


  useEffect(() => {
    const loadData = async () => {
      if (!categorySlug) return;
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch category details
        const catRes = await fetchApi(`/event-category/slug/${categorySlug}`);
        if (!catRes.ok) throw new Error('Categoria não encontrada');
        const catData = await catRes.json();
        if (!catData) throw new Error('Categoria não encontrada');
        setCategory(catData);

        // 2. Fetch events for this category
        const eventsRes = await fetchApi(`/events?category=${categorySlug}&limit=100`);
        if (!eventsRes.ok) throw new Error('Falha ao carregar eventos');
        const eventsData = await eventsRes.json();
        
        // The /events endpoint returns { events: [], total: 0, ... } or just [] 
        const items = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);
        
        // Map to format expected by EventsGrid
        const mapped = items.map((r: any) => ({
          id: r.id,
          title: r.name,
          date: r.startDate
            ? new Date(r.startDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })
            : 'Data a definir',
          location: (() => {
            const city = r.locationCity || '';
            const uf = r.locationUf || '';
            if (city && uf) return `${city} - ${uf}`;
            return r.location || 'Local a definir';
          })(),
          image: (() => {
            const candidate = r.image || r.bannerUrl || r.banner || '/no-image.svg';
            if (candidate.startsWith('/uploads/')) return apiUrl(candidate);
            return candidate;
          })(),
        }));

        setEvents(mapped);

        // SEO is managed by useSEO hook above

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categorySlug]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="mt-4 text-gray-500 animate-pulse">Carregando eventos...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !category) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <h1 className="text-2xl font-bold text-[#091747] mb-4">Ops! Página não encontrada</h1>
          <p className="text-gray-600 mb-8">Não conseguimos encontrar a categoria de eventos que você procurou.</p>
          <Link to="/" className="px-8 py-3 bg-[#091747] text-white font-bold rounded-xl hover:bg-orange-600 transition-all">
            Voltar para o início
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-950 min-h-screen">
        {/* Banner / Header SEO Section */}
        <section className="bg-slate-50 dark:bg-slate-900/50 py-16 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-[1352px] mx-auto text-left">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
              <Link to="/" className="hover:text-orange-600 transition-colors">Início</Link>
              <span>/</span>
              <span className="text-orange-600">Eventos de {category.name}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-black text-[#091747] dark:text-white mb-4 leading-tight">
              Eventos de {category.name} em Fortaleza
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Descubra os melhores eventos de {category.name} em Fortaleza. 
              Veja festas, shows e experiências atualizadas para você curtir o melhor da cidade.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-[156px] max-md:px-5 max-sm:px-4 py-8 bg-white dark:bg-slate-950">
          <CategoryFilter 
            selectedSlug={category.slug} 
            onSelect={() => {}} 
            navigateOnClick={true}
          />
        </section>

        <main className="py-4">
          {events.length > 0 ? (
            <EventsGrid 
              title={`Disponíveis em ${category.name}`} 
              events={events} 
              size="large" 
            />
          ) : (
            <div className="max-w-[1352px] mx-auto px-6 md:px-[156px] text-center py-20 bg-white dark:bg-slate-950">
              <div className="text-6xl mb-6">🗓️</div>
              <h2 className="text-2xl font-bold text-[#091747] dark:text-white mb-2">
                Nenhum evento de {category.name} encontrado no momento
              </h2>
              <p className="text-gray-500 mb-10 max-w-md mx-auto">
                No momento não temos eventos ativos nesta categoria em Fortaleza. 
                Fique de olho ou explore outras categorias!
              </p>
              
              <div className="mb-16">
                 <EmptyStateOrganizerCTA selectedUf="CE" />
              </div>

              <Link to="/" className="text-orange-600 font-bold hover:underline">
                Ver todos os eventos do site
              </Link>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
};

export default EventsByCategory;
