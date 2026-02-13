import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface CollectionData {
  id: string;
  title: string;
  description?: string | null;
  bannerImage?: string | null;
  organizerId: string;
  slug: string;
}
interface CollectionEventItem { id: string; name: string; startDate?: string; slug?: string | null; }
import { getEventPath } from '@/lib/eventUrl';

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric'}); } catch { return ''; }
};

const PublicCollection: React.FC = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [events, setEvents] = useState<CollectionEventItem[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const PAGE_SIZE = 12;
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true); setError('');
      try {
        const r = await fetch(`/api/collections/slug/${slug}`);
        if (!r.ok) { setError('Coleção não encontrada'); setLoading(false); return; }
        const c = await r.json();
        if (!c || !c.id) { setError('Coleção não encontrada'); setLoading(false); return; }
        setCollection(c);
        // First page (paginated endpoint)
        const ev = await fetch(`/api/collection/${c.id}/events?limit=${PAGE_SIZE}&offset=0`);
        if (ev.ok) {
          const list = await ev.json();
          if (Array.isArray(list)) {
            setEvents(list);
            setNextOffset(null);
          } else if (list && Array.isArray(list.items)) {
            setEvents(list.items);
            setNextOffset(list.nextOffset ?? null);
          }
        }
        // SEO meta tags
        try {
          document.title = `${c.title} | Fauves`;
          const setMeta = (name: string, content: string) => {
            if (!content) return;
            let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
            if (!tag) {
              tag = document.createElement('meta');
              tag.setAttribute('name', name);
              document.head.appendChild(tag);
            }
            tag.content = content;
          };
          setMeta('description', c.description || `Coleção de eventos: ${c.title}`);
          const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
          if (ogTitle) ogTitle.content = c.title;
          else {
            const m = document.createElement('meta'); m.setAttribute('property','og:title'); m.content = c.title; document.head.appendChild(m);
          }
          if (c.bannerImage) {
            let ogImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
            if (!ogImg) { ogImg = document.createElement('meta'); ogImg.setAttribute('property','og:image'); document.head.appendChild(ogImg); }
            ogImg.content = c.bannerImage;
          }
        } catch {}
      } catch (e:any) {
        setError('Falha ao carregar');
      } finally { setLoading(false); }
    };
    load();
  }, [slug]);

  const loadMore = async () => {
    if (!collection || nextOffset == null) return;
    try {
      const r = await fetch(`/api/collection/${collection.id}/events?limit=${PAGE_SIZE}&offset=${nextOffset}`);
      if (!r.ok) return;
      const json = await r.json();
      if (Array.isArray(json)) {
        setEvents(prev => [...prev, ...json]);
        setNextOffset(null);
      } else if (json && Array.isArray(json.items)) {
        setEvents(prev => [...prev, ...json.items]);
        setNextOffset(json.nextOffset ?? null);
      }
    } catch {}
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando…</div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-600">{error}<Link to="/" className="text-indigo-600">Voltar</Link></div>;
  if (!collection) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full h-56 bg-slate-100 flex items-center justify-center overflow-hidden">
        {collection.bannerImage ? (
          <img src={collection.bannerImage} alt={collection.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400 text-sm">Sem banner</div>
        )}
      </div>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{collection.title}</h1>
        {collection.description && (
          <p className="text-slate-600 leading-relaxed whitespace-pre-line mb-8">{collection.description}</p>
        )}
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Eventos</h2>
        {events.length === 0 ? (
          <div className="text-slate-400">Nenhum evento nesta coleção ainda.</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {events.map(ev => (
                <Link key={ev.id} to={getEventPath({ id: ev.id, slug: ev.slug })} className="rounded-xl border border-zinc-200 p-4 hover:shadow-sm transition bg-white">
                  <div className="text-slate-900 font-semibold mb-1 truncate" title={ev.name}>{ev.name}</div>
                  <div className="text-slate-500 text-xs">{formatDate(ev.startDate)}</div>
                </Link>
              ))}
            </div>
            {nextOffset != null && (
              <div className="mt-8 flex justify-center">
                <button onClick={loadMore} className="px-6 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Carregar mais</button>
              </div>
            )}
          </>
        )}
        <div className="mt-10">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Voltar para a página inicial</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicCollection;
