import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EventCard from '@/components/EventCard';
import AppShell from '@/components/AppShell';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const navigate = useNavigate();

  useEffect(() => {
    // load categories once
    (async () => {
      try {
        const r = await fetch('/api/categories');
        if (!r.ok) return;
        const list = await r.json();
        if (Array.isArray(list)) setCategories(list.map((c: any) => ({ name: c.name, slug: c.slug })));
      } catch (e) {}
    })();

    let active = true;
    const fetchResults = async () => {
      // allow searching when there's a text query (>=2 chars)
      // or when the user selected a filter/category/date (q may be empty)
      const shouldSearch = (q && q.length >= 2) || filter || selectedCategory || selectedDate;
      if (!shouldSearch) { setEvents([]); return; }
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
        console.warn('search failed', e);
        setEvents([]);
      } finally { if (active) setLoading(false); }
    };
    fetchResults();
    return () => { active = false; };
  }, [q, filter, selectedCategory, selectedDate, sort]);

  return (
    <AppShell>
      <main className="max-w-[1200px] mx-auto px-6 py-8 pt-24">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm text-slate-500 font-semibold mb-2">Filtrar por</div>
                <div className="flex gap-3">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <button className="px-2 py-1 rounded border border-[#E9EAF0] flex items-center gap-2 text-sm">Categorias
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {categories.length === 0 ? (
                        <DropdownMenuItem>Nenhuma categoria</DropdownMenuItem>
                      ) : (
                        categories.map(c => (
                          <DropdownMenuItem key={c.slug || c.name} onSelect={() => {
                            setSelectedCategory(c.slug || c.name);
                            navigate(`/search?q=${encodeURIComponent(q || '')}&category=${encodeURIComponent(c.slug || c.name)}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`);
                          }}>{c.name}</DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => {
                        setSelectedCategory('');
                        navigate(`/search?q=${encodeURIComponent(q || '')}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`);
                      }}>Limpar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <button className="px-2 py-1 rounded border border-[#E9EAF0] flex items-center gap-2 text-sm">Data
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Escolha uma data</DropdownMenuLabel>
                      <div className="p-2">
                        <input type="date" value={selectedDate || ''} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        <div className="flex gap-2 mt-2">
                          <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm" onClick={() => {
                            navigate(`/search?q=${encodeURIComponent(q || '')}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}&date=${encodeURIComponent(selectedDate || '')}&sort=${encodeURIComponent(sort || '')}`);
                          }}>Aplicar</button>
                          <button className="px-3 py-1 rounded border" onClick={() => { setSelectedDate(''); navigate(`/search?q=${encodeURIComponent(q || '')}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`); }}>Limpar</button>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div>
                <div className="text-sm text-slate-500 font-semibold mb-2">Ordenar por</div>
                <Tabs value={sort} onValueChange={(v) => {
                  setSort(v);
                  navigate(`/search?q=${encodeURIComponent(q || '')}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ''}&sort=${encodeURIComponent(v)}`);
                }}>
                  <TabsList>
                    <TabsTrigger value="relevance">Relevância</TabsTrigger>
                    <TabsTrigger value="date">Data</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            {(() => {
                const makeClass = (key: string) => {
                const active = filter === key;
                return `px-3 py-1 rounded-full border text-sm ${active ? 'border-indigo-500 bg-indigo-50 text-[#2A2AD7] font-semibold' : 'border-[#E9EAF0] bg-white text-[#091747]'}`;
              };
              const toggle = (key: string) => {
                if (filter === key) navigate(`/search?q=${encodeURIComponent(q || '')}`);
                else navigate(`/search?q=${encodeURIComponent(q || '')}&filter=${encodeURIComponent(key)}`);
              };
              return (
                <div className="flex gap-3 flex-wrap">
                  <button className={makeClass('day')} onClick={() => toggle('day')}>Acontecendo hoje</button>
                  <button className={makeClass('weekend')} onClick={() => toggle('weekend')}>Esse final de semana</button>
                  <button className={makeClass('month')} onClick={() => toggle('month')}>Esse mês</button>
                </div>
              );
            })()}
          </div>
        </div>

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {events.length === 0 ? (
              <div className="text-slate-600">Nenhum resultado encontrado</div>
            ) : (
              events.map(ev => {
                const cardProps = {
                  id: ev.id || ev.slug || String(ev._id || ''),
                  slug: ev.slug || undefined,
                  image: ev.image || ev.bannerImage || ev.poster || '',
                  date: ev.startDate ? new Date(ev.startDate).toLocaleDateString('pt-BR') : (ev.date || ''),
                  title: ev.name || ev.title || ev.summary || 'Evento',
                  location: ev.city || ev.location || ev.venue || '',
                };
                return <EventCard key={cardProps.id} {...cardProps} />;
              })
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
};

export default SearchResults;
