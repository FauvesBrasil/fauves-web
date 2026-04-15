import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LogoFauves from '@/components/LogoFauves';
import { fetchApi } from '@/lib/apiBase';
import { Ticket, Calendar, Navigation, ArrowRight, Share2, HelpCircle } from 'lucide-react';

type DoorEvent = { 
  id: string; 
  name: string; 
  image?: string | null;
  startDate?: string | null; 
  startDateUtc?: string | null;
  location?: string | null;
};

const ExpressDoor: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = React.useState<any>(null);
  const [events, setEvents] = React.useState<DoorEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (!slug) { setError('Slug nao informado.'); return; }
      setLoading(true);
      setError('');
      try {
        const orgRes = await fetchApi(`/api/organization/slug/${encodeURIComponent(slug)}`);
        if (!orgRes.ok) throw new Error('Organizacao nao encontrada.');
        const orgData = await orgRes.json();
        if (!active) return;
        setOrg(orgData);

        try {
          const evRes = await fetchApi(`/api/organization/${orgData.id}/events`);
          if (evRes.ok) {
            const list = await evRes.json();
            if (Array.isArray(list)) setEvents(list);
          }
        } catch {}
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Nao foi possivel carregar a Bilheteria Express.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [slug]);

  const primaryEvent = React.useMemo(() => {
    if (!events.length) return null;
    const sorted = [...events].sort((a, b) => {
      const da = new Date(a.startDate || a.startDateUtc || '').getTime();
      const db = new Date(b.startDate || b.startDateUtc || '').getTime();
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return da - db;
    });
    return sorted[0];
  }, [events]);

  const goToTickets = (eventId: string) => navigate(`/select-tickets/${eventId}`);

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0c] text-white selection:bg-indigo-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-fuchsia-600/15 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate('/')} className="transition-transform active:scale-95">
            <LogoFauves width={100} />
          </button>
          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10" title="Ajuda">
              <HelpCircle className="h-5 w-5 text-zinc-400" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10" title="Compartilhar">
              <Share2 className="h-5 w-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-6 py-8 pb-24">
        {/* Header Section */}
        <div className="mb-8 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Bilheteria Express
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {org?.name || 'Carregando...'}
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md">
            Escolha seu evento e finalize sua compra na porta em poucos segundos.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm font-medium text-zinc-500">Buscando eventos disponiveis...</p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center shadow-xl backdrop-blur-md">
            <div className="text-red-400 font-semibold mb-2">Ops! Ocorreu um erro</div>
            <p className="text-sm text-zinc-400 mb-6">{error}</p>
            <Button variant="outline" className="border-zinc-800 text-zinc-300" onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        )}

        {!loading && !error && primaryEvent && (
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-zinc-900 shadow-2xl transition-all hover:shadow-indigo-500/10 hover:ring-1 hover:ring-white/10">
            {/* Event Image with Aspect Ratio */}
            <div className="relative aspect-video w-full overflow-hidden">
              <img 
                src={primaryEvent.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop"} 
                alt={primaryEvent.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              
              {/* Event Badge */}
              <div className="absolute left-6 top-6">
                <span className="rounded-xl bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md border border-white/10">
                  Evento Agora
                </span>
              </div>
            </div>

            {/* Event Info Card Content */}
            <div className="relative -mt-12 p-6 pt-0 sm:p-8 sm:pt-0">
              <div className="rounded-3xl border border-white/5 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-2xl">
                <h2 className="text-2xl font-bold text-white mb-4 line-clamp-2">
                  {primaryEvent.name}
                </h2>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(primaryEvent.startDate || primaryEvent.startDateUtc || '').toLocaleString('pt-BR', { 
                        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                      <Navigation className="h-4 w-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium truncate">
                      {primaryEvent.location || 'Local a definir'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button 
                    onClick={() => goToTickets(primaryEvent.id)} 
                    className="h-14 rounded-2xl bg-white text-lg font-bold text-black hover:bg-zinc-200 active:scale-95 transition-all w-full"
                  >
                    Comprar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/org/${slug}`)} 
                    className="h-14 rounded-2xl border-zinc-800 bg-transparent text-lg font-bold text-white hover:bg-white/5 active:scale-95 transition-all w-full"
                  >
                    Ver Programacao
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !primaryEvent && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 border border-white/5">
              <Ticket className="h-10 w-10 text-zinc-700" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Nenhum evento disponivel</p>
              <p className="text-zinc-500 text-sm">Nao encontramos ingressos para venda rapida no momento.</p>
            </div>
            <Button variant="link" onClick={() => navigate(`/org/${slug}`)} className="text-indigo-400">Ver pagina do produtor</Button>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation (Optionally for mobile fixed actions) */}
      {!loading && !error && primaryEvent && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden">
          <Button 
            onClick={() => goToTickets(primaryEvent.id)}
            className="h-14 w-[calc(100vw-3rem)] rounded-full bg-indigo-600 px-8 text-lg font-extrabold text-white shadow-2xl shadow-indigo-600/40 ring-4 ring-indigo-600/20 active:scale-95 transition-all"
          >
            GARANTIR INGRESSO
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpressDoor;
