import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function SatisfactionSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bannerOpen, setBannerOpen] = useState(true);
  const [activateOpen, setActivateOpen] = useState(false);

  const { totalLeft } = useLayoutOffsets();
  const eventId = id || null;
  const bannerKey = useMemo(() => `SAT_SURVEY_BANNER_HIDE_${eventId || 'global'}`, [eventId]);

  useEffect(() => { try { const h = localStorage.getItem(bannerKey); if (h === '1') setBannerOpen(false); } catch {} }, [bannerKey]);
  const dismissBanner = () => { setBannerOpen(false); try { localStorage.setItem(bannerKey, '1'); } catch {} };

  const TopicCard: React.FC<{ title: string; emoji: string }> = ({ title, emoji }) => (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-4 min-w-[180px]">
      <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">{emoji} {title} <span className="ml-auto text-xs text-slate-500">›</span></div>
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Sem dados 🥲</div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0b0b0b] w-full">
      <SidebarMenu />
      {eventId && (
        <EventDetailsSidebar eventIdOverride={eventId} onBack={() => navigate(-1)} fixed fixedLeft={70} fixedWidth={300} fixedTop={0} />
      )}
      <AppHeader />

      <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 pb-16 relative">
        <div className="mt-24 max-w-5xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-indigo-950 dark:text-white mb-3">Pesquisa de satisfação</h1>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setActivateOpen(true)}>Ativar pesquisa</Button>
          </div>

          {bannerOpen && (
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] mt-2">
              <button className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]" onClick={dismissBanner} aria-label="Fechar">×</button>
              <div className="p-8 bg-gradient-to-r from-indigo-600/15 to-fuchsia-600/15 dark:from-indigo-500/20 dark:to-fuchsia-500/20">
                <div className="text-xl font-semibold text-slate-900 dark:text-white">✨ Desbloqueie insights para aprimorar os eventos futuros:</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Recolha o feedback de participantes e tenha insights para tomar decisões a partir de dados para melhorar a experiência do evento como um todo</div>
                <a className="inline-flex items-center gap-2 mt-3 text-indigo-600 hover:underline" href="#" onClick={(e)=>e.preventDefault()}>Ver exemplo</a>
              </div>
              <div className="bg-black text-white">
                <div className="px-6 pt-4 pb-3 text-xs tracking-wide opacity-80">EXEMPLO DE BENEFÍCIO</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
                  <div className="p-6">
                    <div className="text-5xl font-extrabold">NPS</div>
                    <div className="mt-2 text-sm">Receba uma nota geral e comentários detalhados para cada tema.</div>
                  </div>
                  <div className="p-6">
                    <div className="text-5xl font-extrabold">Feedback</div>
                    <div className="mt-2 text-sm">Mapeie pontos fortes e de melhoria para as próximas edições.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Nota por tema</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <TopicCard title="Lineup" emoji="🎸" />
              <TopicCard title="Sound system" emoji="🔊" />
              <TopicCard title="Localização" emoji="📍" />
              <TopicCard title="Segurança" emoji="🛡️" />
              <TopicCard title="Acessibilidade" emoji="📌" />
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Comentários</div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6 text-center text-sm text-slate-500 dark:text-slate-300">Sem comentários por hora</div>
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-2"><span className="px-2 py-1 rounded bg-zinc-100 dark:bg-[#1a1a1a]">1</span> / 0</div>
          </div>
        </div>
      </div>

      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Ativar pesquisa</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Ao ativar, enviaremos a pesquisa de satisfação aos participantes após o evento para coletar NPS, comentários e notas por tema.
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setActivateOpen(false)}>Cancelar</Button>
            <Button onClick={() => setActivateOpen(false)}>Ativar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


