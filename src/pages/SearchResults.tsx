import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EventCard from '@/components/EventCard';
import AppShell from '@/components/AppShell';
import SearchBar from '@/components/SearchBar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, Filter, ChevronDown } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults: React.FC = () => {
  const params = useQuery();
  const q = params.get('q') || '';
  const filter = params.get('filter') || '';
  const categoryParam = params.get('category') || '';
  const dateParam = params.get('date') || '';
  const sortParam = params.get('sort') || '';
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; slug?: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedDate, setSelectedDate] = useState<string>(dateParam);
  const [sort, setSort] = useState<string>(sortParam || 'relevance');
  const [localSearchTerm, setLocalSearchTerm] = useState(q);
  const navigate = useNavigate();

  // SEO dinâmico: title muda conforme o termo buscado
  useSEO({
    title: q ? `Resultados para "${q}"` : 'Buscar Eventos',
    description: q
      ? `Encontre eventos relacionados a "${q}" na Fauves. Shows, festas, festivais e muito mais.`
      : 'Busque por shows, festas, festivais e eventos em todo o Brasil na Fauves.',
    noIndex: true, // páginas de busca geralmente não devem ser indexadas
  });


  useEffect(() => {
    // load categories once
    (async () => {
      try {
        const r = await fetch('/api/categories');
        if (!r.ok) return;
        const list = await r.json();
        if (Array.isArray(list)) setCategories(list.map((c: any) => ({ name: c.name, slug: c.slug })));
      } catch (e) { }
    })();

    let active = true;
    const fetchResults = async () => {
      // allow searching when there's a text query (>=2 chars)
      // or when the user selected a filter/category/date (q may be empty)
      const shouldSearch = (q && q.length >= 2) || filter || selectedCategory || selectedDate;
      if (!shouldSearch) {
        setEvents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const norm = q.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        let url = `/api/search?term=${encodeURIComponent(q)}&term_norm=${encodeURIComponent(norm)}`;
        if (filter) url += `&filter=${encodeURIComponent(filter)}`;
        if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
        if (selectedDate) url += `&date=${encodeURIComponent(selectedDate)}`;
        if (sort) url += `&sort=${encodeURIComponent(sort)}`;
        const r = await fetch(url);
        if (!r.ok) { setEvents([]); setLoading(false); return; }
        const data = await r.json();
        if (!active) return;
        setEvents(data.events || []);
      } catch (e) {
        setEvents([]);
      } finally { if (active) setLoading(false); }
    };
    fetchResults();
    return () => { active = false; };
  }, [q, filter, selectedCategory, selectedDate, sort]);

  // Sync local search term with URL param
  useEffect(() => {
    setLocalSearchTerm(q);
  }, [q]);

  const buildUrl = (params: Record<string, string>) => {
    const base = `/search?q=${encodeURIComponent(q || '')}`;
    const urlParams = new URLSearchParams();
    if (q) urlParams.set('q', q);
    if (params.filter) urlParams.set('filter', params.filter);
    if (params.category || selectedCategory) urlParams.set('category', params.category || selectedCategory);
    if (params.date || selectedDate) urlParams.set('date', params.date || selectedDate);
    if (params.sort || sort) urlParams.set('sort', params.sort || sort);
    return `/search?${urlParams.toString()}`;
  };

  const toggleFilter = (key: string) => {
    if (filter === key) {
      navigate(buildUrl({ category: selectedCategory, date: selectedDate, sort }));
    } else {
      navigate(buildUrl({ filter: key, category: selectedCategory, date: selectedDate, sort }));
    }
  };

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

  // Helper to build proper API URL for images
  function apiUrl(path: string): string {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> });
    const base = metaEnv.env?.VITE_API_BASE || metaEnv.env?.VITE_BACKEND_URL || 'https://fauves-backend-production.up.railway.app';
    return `${base}${path}`;
  }

  // Map event from API to EventCard format (same as home page)
  const mapEvent = (ev: any) => {
    const r = ev as Record<string, unknown>;
    const startDate = typeof r.startDate === 'string' ? new Date(r.startDate) : null;

    return {
      id: typeof r.id === 'string' ? r.id : '',
      slug: typeof r.slug === 'string' ? r.slug : undefined,
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
    };
  };

  return (
    <AppShell hideSearchBar>
      <main className="max-w-[1352px] mx-auto px-[156px] py-8 pt-8 pb-16 max-md:px-5 max-sm:px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#091747] dark:text-white mb-2">
            {q ? `Resultados para "${q}"` : 'Buscar Eventos'}
          </h1>
          {!loading && events.length > 0 && (
            <p className="text-slate-600 dark:text-slate-400">
              {events.length} {events.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
            </p>
          )}
        </div>

        {/* Search Bar Section */}
        <div className="mb-6">
          <SearchBar fullWidth />
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Left side - Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${filter === 'day'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => toggleFilter('day')}
              >
                Acontecendo hoje
              </button>
              <button
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${filter === 'weekend'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => toggleFilter('weekend')}
              >
                Esse final de semana
              </button>
              <button
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${filter === 'month'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => toggleFilter('month')}
              >
                Esse mês
              </button>
            </div>

            {/* Right side - Filters & Sort */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white flex items-center gap-2 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors">
                    <Filter className="w-4 h-4" />
                    {selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name || 'Categoria' : 'Categoria'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filtrar por categoria</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.length === 0 ? (
                    <DropdownMenuItem disabled>Nenhuma categoria</DropdownMenuItem>
                  ) : (
                    categories.map(c => (
                      <DropdownMenuItem
                        key={c.slug || c.name}
                        onSelect={() => {
                          setSelectedCategory(c.slug || c.name);
                          navigate(buildUrl({ filter, category: c.slug || c.name, date: selectedDate, sort }));
                        }}
                      >
                        {c.name}
                      </DropdownMenuItem>
                    ))
                  )}
                  {selectedCategory && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedCategory('');
                          navigate(buildUrl({ filter, category: '', date: selectedDate, sort }));
                        }}
                      >
                        Limpar filtro
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Date Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white flex items-center gap-2 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors">
                    <Calendar className="w-4 h-4" />
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : 'Data'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Escolha uma data</DropdownMenuLabel>
                  <div className="p-3">
                    <input
                      type="date"
                      value={selectedDate || ''}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                        onClick={() => {
                          navigate(buildUrl({ filter, category: selectedCategory, date: selectedDate, sort }));
                        }}
                      >
                        Aplicar
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setSelectedDate('');
                          navigate(buildUrl({ filter, category: selectedCategory, date: '', sort }));
                        }}
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <div className="h-6 w-px bg-gray-200" />
              <Tabs
                value={sort}
                onValueChange={(v) => {
                  setSort(v);
                  navigate(buildUrl({ filter, category: selectedCategory, date: selectedDate, sort: v }));
                }}
              >
                <TabsList>
                  <TabsTrigger value="relevance">Relevância</TabsTrigger>
                  <TabsTrigger value="date">Data</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory || selectedDate || filter) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Filtros ativos:</span>
              {filter && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                  {filter === 'day' && 'Hoje'}
                  {filter === 'weekend' && 'Final de semana'}
                  {filter === 'month' && 'Este mês'}
                  <button
                    onClick={() => navigate(buildUrl({ category: selectedCategory, date: selectedDate, sort }))}
                    className="ml-1 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                  {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      navigate(buildUrl({ filter, category: '', date: selectedDate, sort }));
                    }}
                    className="ml-1 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedDate && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                  {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  <button
                    onClick={() => {
                      setSelectedDate('');
                      navigate(buildUrl({ filter, category: selectedCategory, date: '', sort }));
                    }}
                    className="ml-1 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 p-3 bg-white dark:bg-[#1F1F1F] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-sm animate-pulse">
                <div className="w-full aspect-[2/1] bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {q
                ? `Não encontramos eventos para "${q}". Tente ajustar os filtros ou buscar por outros termos.`
                : 'Digite o que você procura ou selecione alguns filtros para encontrar eventos.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map(ev => {
              const cardProps = mapEvent(ev);
              return <EventCard key={cardProps.id} {...cardProps} />;
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
};

export default SearchResults;
