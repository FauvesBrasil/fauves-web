import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LogoFauves from '@/components/LogoFauves';
import { fetchApi } from '@/lib/apiBase';

type DoorEvent = { id: string; name: string; startDate?: string | null; startDateUtc?: string | null };

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
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#f7f8ff] via-white to-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/22 via-fuchsia-500/16 to-orange-300/12 blur-3xl" />
        <div className="absolute top-10 left-[-10%] h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/14 via-cyan-400/12 to-transparent blur-3xl" />
        <div className="absolute bottom-[-7rem] right-[-5rem] h-72 w-72 rounded-full bg-gradient-to-tr from-purple-500/12 via-blue-500/14 to-sky-400/12 blur-3xl" />
      </div>
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <LogoFauves width={110} />
          </button>
          <Button variant="outline" size="sm" className="text-sm" onClick={() => window.open('https://help.fauves.app', '_blank')}>
            Ajuda
          </Button>
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-2xl shadow-indigo-100/70 backdrop-blur ring-1 ring-indigo-100/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bilheteria Express</div>
              <div className="text-xl font-bold text-slate-900 leading-tight">Compra rapida para {org?.name || slug}</div>
              <p className="text-sm text-slate-600">Escolha o evento e finalize em poucos cliques.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/org/${slug}`)}>Pagina do produtor</Button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {loading && <div className="text-sm text-slate-500">Carregando...</div>}
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            {!loading && !error && primaryEvent && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evento em destaque</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{primaryEvent.name}</div>
                {(primaryEvent.startDate || primaryEvent.startDateUtc) && (
                  <div className="text-sm text-slate-500">
                    {new Date(primaryEvent.startDate || primaryEvent.startDateUtc || '').toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => goToTickets(primaryEvent.id)} className="flex-1 sm:flex-none sm:px-6">Ir para ingressos</Button>
                  <Button variant="outline" onClick={() => navigate(`/org/${slug}`)} className="flex-1 sm:flex-none sm:px-6">Ver pagina completa</Button>
                </div>
              </div>
            )}

            {!loading && !error && !primaryEvent && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-5 text-sm text-slate-600 shadow-sm">
                Nenhum evento disponivel para compra rapida no momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpressDoor;
