import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, X, MessageSquare, Calendar as CalendarIcon, User as UserIcon, ExternalLink } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

export default function SatisfactionSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { totalLeft } = useLayoutOffsets();

  const eventId = id || null;

  // Banner dismiss persistence
  const bannerKey = useMemo(() => `SAT_SURVEY_BANNER_HIDE_${eventId || 'global'}`,[eventId]);
  const [bannerOpen, setBannerOpen] = useState(true);
  useEffect(() => {
    try {
      const h = localStorage.getItem(bannerKey);
      if (h === '1') setBannerOpen(false);
    } catch {}
  }, [bannerKey]);
  const dismissBanner = () => {
    setBannerOpen(false);
    try { localStorage.setItem(bannerKey, '1'); } catch {}
  };

  // Activate survey modal
  const [activateOpen, setActivateOpen] = useState(false);
  const [eventEndText, setEventEndText] = useState<string | null>(null);

  // Topic details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<{ title: string; emoji: string } | null>(null);
  const openDetails = (title: string, emoji: string) => {
    setActiveTopic({ title, emoji });
    setDetailsOpen(true);
  };

  // Try to load event end date for the activation modal timing copy
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) { setEventEndText(null); return; }
      try {
        const r = await fetchApi(`/api/event/${id}`);
        if (!r?.ok) { setEventEndText(null); return; }
        const ev = await r.json();
        if (!mounted) return;
        const end = ev?.endDate || ev?.endsAt || ev?.dateEnd || ev?.end_time;
        if (!end) { setEventEndText(null); return; }
        const endDt = new Date(end);
        if (isNaN(endDt.getTime())) { setEventEndText(null); return; }
        const sendDt = new Date(endDt.getTime() + 34 * 60 * 60 * 1000);
        const text = sendDt.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        setEventEndText(text);
      } catch { setEventEndText(null); }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const TopicCard: React.FC<{ title: string; emoji: string }>
    = ({ title, emoji }) => (
    <button
      className="text-left rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4 min-w-[180px] hover:bg-zinc-50 dark:hover:bg-[#191919] transition"
      onClick={() => openDetails(title, emoji)}
    >
      <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
        <span>{emoji}</span>
        <span>{title}</span>
        <span className="ml-auto text-xs text-slate-500">ver detalhes</span>
      </div>
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Sem dados ainda</div>
    </button>
  );

  return (
    <div className="bg-white dark:bg-[#0b0b0b] w-full">
      <SidebarMenu />
      {eventId && (
        <EventDetailsSidebar
          eventIdOverride={eventId}
          onBack={() => navigate(-1)}
          fixed
          fixedLeft={70}
          fixedWidth={300}
          fixedTop={0}
        />
      )}
      <AppHeader />

      <div
        style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }}
        className="flex flex-col pl-8 pr-8 pb-16 relative"
      >
        <div className="mt-24 max-w-5xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Pesquisa de satisfação</h1>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setActivateOpen(true)}>
              Ativar pesquisa
            </Button>
          </div>

          {bannerOpen && (
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 mt-2">
              <button
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]"
                onClick={dismissBanner}
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-5">
                {/* Left: dark panel with copy */}
                <div className="bg-black text-white p-8 md:col-span-3">
                  <div className="text-xl font-semibold">✨ Desbloqueie insights para aprimorar os eventos futuros:</div>
                  <div className="text-sm text-zinc-300 mt-3">
                    Recolha o feedback de participantes e tenha insights para tomar decisões a partir de dados
                    para melhorar a experiência do evento como um todo
                  </div>
                  <div className="mt-5">
                    <Button
                      variant="secondary"
                      className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 gap-2"
                      onClick={() => openDetails('Lineup', '🎸')}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800">•</span>
                      Ver exemplo
                    </Button>
                  </div>
                </div>
                {/* Right: static artwork image (drop file at /public/img/nps-art.png) */}
                <div className="relative min-h-[180px] md:min-h-full bg-white md:col-span-2">
                  <img
                    src="/img/nps-art.png"
                    alt="NPS artwork"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e:any)=>{ e.currentTarget.style.display='none'; e.currentTarget.parentElement!.classList.add('bg-gradient-to-br','from-indigo-700','via-fuchsia-600','to-orange-500'); }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Notas por tema</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <TopicCard title="Lineup" emoji="🎸" />
              <TopicCard title="Sound system" emoji="🔊" />
              <TopicCard title="Localização" emoji="📍" />
              <TopicCard title="Segurança" emoji="🛡️" />
              <TopicCard title="Acessibilidade" emoji="♿" />
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Comentários</div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6 text-center text-sm text-slate-500 dark:text-slate-300">
              Sem comentários por enquanto
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-[#1a1a1a]">1</span> / 0
            </div>
          </div>
        </div>
      </div>

      {/* Ativar pesquisa */}
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Ativar pesquisa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* O que será enviado? */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <MessageSquare className="w-4 h-4" /> O que será enviado?
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Uma pesquisa com 3 pontos: satisfação como um todo, avaliações por temas e um comentário aberto.
              </div>
              <a
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm mt-2"
                href="#"
                onClick={(e)=>{ e.preventDefault(); setActivateOpen(false); openDetails('Lineup','🎸'); }}
              >
                Ver a pesquisa <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Nota: as pesquisas são anônimas e não são customizáveis no momento
              </div>
            </div>

            {/* Quando? */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <CalendarIcon className="w-4 h-4" /> Quando?
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {eventEndText
                  ? <>A pesquisa será enviada por email automaticamente em <span className="font-medium text-slate-900 dark:text-white">{eventEndText}</span>, sendo 34 horas após o encerramento do evento.</>
                  : <>A pesquisa será enviada por email automaticamente 34 horas após o encerramento do evento.</>}
              </div>
            </div>

            {/* Para quem? */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <UserIcon className="w-4 h-4" /> Para quem?
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Os participantes do seu evento (aqueles que tiveram os ingressos escaneados).
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setActivateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setActivateOpen(false)}>Ativar a pesquisa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhes da avaliação (Notas por tema) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Detalhes da avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Top card */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
              <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeTopic?.emoji}</span>
                <span>{activeTopic?.title || 'Tópico'}</span>
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">–</div>
              <div className="mt-2 flex items-center gap-1 text-amber-400">
                {[0,1,2,3,4].map((i) => (
                  <Star key={i} className="w-5 h-5" />
                ))}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sem respostas ainda</div>
            </div>

            {/* Areas for improvement */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
              <div className="text-base font-semibold text-slate-900 dark:text-white">Áreas para melhoria</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Feedback das pessoas que avaliaram o {activeTopic?.title?.toLowerCase() || 'tópico'} com 1 a 3 estrelas
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">0 respostas</div>

              <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  'Apresentação ruim 🥱',
                  'Não é minha vibe 🌌',
                  'Não consegui ver meu artista favorito 😬',
                  'O artista não foi 🎤',
                  'Outro'
                ].map((label) => (
                  <div key={label} className="py-2 flex items-center">
                    <div className="flex-1 text-sm text-slate-900 dark:text-slate-200">{label}</div>
                    <div className="w-10 text-right text-sm text-slate-500 dark:text-slate-400">0</div>
                    <div className="w-10 text-right text-sm text-slate-500 dark:text-slate-400">0%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

