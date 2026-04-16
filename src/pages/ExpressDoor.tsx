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

  const handleHelp = () => {
    window.open('https://help.fauves.app', '_blank');
  };

  const handleShare = async () => {
    const url = window.location.origin + `/venues/${slug}/door`;
    const shareData = {
      title: `Bilheteria Express - ${org?.name || 'Fauves'}`,
      text: `Compre ingressos rapidamente para os eventos de ${org?.name || 'Fauves'}`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copiado para a area de transferencia!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

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
            <LogoFauves width={100} variant="white" />
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleHelp}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition-all" 
              title="Ajuda"
            >
              <HelpCircle className="h-5 w-5 text-zinc-400" />
            </button>
            <button 
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition-all" 
              title="Compartilhar"
            >
              <Share2 className="h-5 w-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-6 py-8 pb-24">
        {/* Header Section */}
        <div className="mb-10 space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Venda Rapida na Porta
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {org?.name || 'Bilheteria'}
          </h1>
          <p className="text-zinc-500 text-sm italic">Selecione o evento para continuar</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm font-medium text-zinc-500">Buscando eventos...</p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center shadow-xl backdrop-blur-md">
            <div className="text-red-400 font-semibold mb-2">Ops! Ocorreu um erro</div>
            <p className="text-sm text-zinc-400 mb-6">{error}</p>
            <Button variant="outline" className="border-zinc-800 text-zinc-300" onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {events.map((event) => (
              <div 
                key={event.id}
                className="group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 shadow-xl transition-all hover:bg-zinc-900 hover:ring-1 hover:ring-indigo-500/50"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail Image */}
                  <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-44">
                    <img 
                      src={event.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop"} 
                      alt={event.name}
                      className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent sm:bg-gradient-to-r" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.startDate || event.startDateUtc || '').toLocaleString('pt-BR', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                      <h2 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors">
                        {event.name}
                      </h2>
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Navigation className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <Button 
                        onClick={() => goToTickets(event.id)} 
                        className="h-12 w-full rounded-2xl bg-white text-sm font-bold text-black hover:bg-zinc-200 active:scale-[0.98] transition-all"
                      >
                        COMPRAR INGRESSOS
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 border border-white/5">
              <Ticket className="h-10 w-10 text-zinc-700" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Nenhum evento disponivel</p>
              <p className="text-zinc-500 text-sm">Nao encontramos ingressos para venda rapida no momento.</p>
            </div>
            <Button variant="link" onClick={() => navigate(`/org/${slug}`)} className="text-indigo-400 font-bold mt-4">Página do produtor</Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExpressDoor;
