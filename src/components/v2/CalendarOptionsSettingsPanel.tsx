import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, CalendarCheck, Check, ChevronDown, CircleCheck, Globe2, Hourglass, Sparkles, Trash2 } from 'lucide-react';
import { FauvesSwitch } from './FauvesSwitch';

type CalendarStatus = 'active' | 'coming-soon' | 'archived';
type Visibility = 'public' | 'private';

type Props = {
  calendarId?: string;
  isPersonal?: boolean;
  onOpenFauvesPlus: () => void;
  onRequestDelete: () => void;
};

const VISIBILITY_OPTIONS = [
  { value: 'public' as const, label: 'Público', description: 'Exibido em seu calendário e elegível para destaque.', icon: Globe2 },
  { value: 'private' as const, label: 'Privado', description: 'Não listado. Apenas pessoas com o link podem se inscrever.', icon: Sparkles },
];

const STATUS_OPTIONS: Array<{ value: CalendarStatus; label: string; description: string; cardDescription: string; color: string; icon: typeof CalendarCheck }> = [
  { value: 'active', label: 'Ativo', description: 'Torne o calendário ativo e permita que visitantes o sigam e enviem eventos.', cardDescription: 'O calendário está ativo e aceitando assinaturas e eventos.', color: '#58dc63', icon: CalendarCheck },
  { value: 'coming-soon', label: 'Em breve', description: "Exibe uma página provisória de 'em breve' que os visitantes podem seguir.", cardDescription: 'O calendário ainda não está ativo e uma página provisória é exibida. Os visitantes ainda podem segui-lo e enviar eventos.', color: '#f0bd51', icon: Hourglass },
  { value: 'archived', label: 'Arquivado', description: 'Arquive o calendário e impeça as pessoas de seguir ou enviar eventos.', cardDescription: 'O calendário está arquivado e não aceita mais assinaturas e eventos.', color: '#a1a1aa', icon: Archive },
];

export function CalendarOptionsSettingsPanel({ calendarId, isPersonal = false, onOpenFauvesPlus, onRequestDelete }: Props) {
  const storageKey = `fauves-calendar-options-${calendarId || 'default'}`;
  const [visibility, setVisibility] = React.useState<Visibility>('public');
  const [publicGuestList, setPublicGuestList] = React.useState(true);
  const [collectFeedback, setCollectFeedback] = React.useState(false);
  const [status, setStatus] = React.useState<CalendarStatus>('active');
  const [visibilityOpen, setVisibilityOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [statusDraft, setStatusDraft] = React.useState<CalendarStatus>('active');
  const visibilityRef = React.useRef<HTMLDivElement>(null);
  const skipNextPersistenceRef = React.useRef(true);

  React.useEffect(() => {
    skipNextPersistenceRef.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setVisibility(saved.visibility === 'private' ? 'private' : 'public');
      setPublicGuestList(saved.publicGuestList ?? true);
      setCollectFeedback(saved.collectFeedback ?? false);
      setStatus(saved.status || 'active');
    } catch { /* storage unavailable */ }
  }, [storageKey]);

  React.useEffect(() => {
    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false;
      return;
    }
    try { localStorage.setItem(storageKey, JSON.stringify({ visibility, publicGuestList, collectFeedback, status })); } catch { /* storage unavailable */ }
  }, [collectFeedback, publicGuestList, status, storageKey, visibility]);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!visibilityRef.current?.contains(event.target as Node)) setVisibilityOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setVisibilityOpen(false); setStatusOpen(false); }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentStatus = STATUS_OPTIONS.find((option) => option.value === status) || STATUS_OPTIONS[0];
  const StatusIcon = currentStatus.icon;
  const openStatusModal = () => {
    setVisibilityOpen(false);
    setStatusDraft(status);
    setStatusOpen(true);
  };
  const secondaryButton = 'flex h-[31px] items-center gap-1.5 rounded-lg border-0 bg-white/[0.10] px-3 text-[14px] font-semibold text-zinc-400 transition-colors hover:bg-white/[0.15] hover:text-white';

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="pb-4 text-left">
      <section>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.02em] text-white">Padrões de Evento</h2>
        <p className="mt-0.5 text-[16px] font-medium leading-6 text-zinc-300">Configurações padrão para novos eventos criados neste calendário.</p>

        <div className="mt-5 overflow-visible rounded-xl border border-white/10 bg-[#202224]">
          <div className="flex min-h-[69px] items-center justify-between gap-4 px-4 py-3">
            <div><h3 className="text-[16px] font-semibold text-white">Visibilidade do Evento</h3><p className="mt-0.5 text-[14px] font-semibold text-zinc-500">Se os eventos são exibidos na página do calendário.</p></div>
            <div ref={visibilityRef} className="relative shrink-0">
              <button type="button" onClick={() => setVisibilityOpen((open) => !open)} aria-expanded={visibilityOpen} className={secondaryButton}>{VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.label}<ChevronDown size={14} /></button>
              <AnimatePresence>
                {visibilityOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: .97, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: .97, y: -4 }}
                    transition={{ duration: .16, ease: [0.22, 1, 0.36, 1] }}
                    className="fauves-floating-surface absolute right-0 top-[38px] z-40 w-[302px] origin-top-right rounded-xl border p-1.5 text-white"
                  >
                    {VISIBILITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const selected = visibility === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => { setVisibility(option.value); setVisibilityOpen(false); }}
                          className={`flex w-full items-start gap-3 rounded-lg border-0 px-2.5 py-2.5 text-left transition-colors ${selected ? 'bg-white/[0.07]' : 'bg-transparent hover:bg-white/[0.06]'}`}
                        >
                          <Icon size={17} className="mt-0.5 shrink-0 text-zinc-400" />
                          <span className="min-w-0 flex-1">
                            <strong className="block text-[14px] font-semibold text-white">{option.label}</strong>
                            <span className="mt-0.5 block text-[13px] font-medium leading-[18px] text-zinc-400">{option.description}</span>
                          </span>
                          {selected && <Check size={17} className="mt-1 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 py-3"><div><h3 className="text-[16px] font-semibold text-white">Lista Pública de Convidados</h3><p className="mt-0.5 text-[14px] font-semibold text-zinc-500">Se deve exibir a lista de convidados nas páginas de eventos.</p></div><FauvesSwitch checked={publicGuestList} onCheckedChange={setPublicGuestList} label="Lista pública de convidados" /></div>
          <div className="h-px bg-white/10" />
          <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 py-3"><div><h3 className="text-[16px] font-semibold text-white">Coletar Feedback</h3><p className="mt-0.5 text-[14px] font-semibold text-zinc-500">Envie um e-mail para os convidados após o evento para coletar feedback.</p></div><FauvesSwitch checked={collectFeedback} onCheckedChange={setCollectFeedback} label="Coletar feedback" /></div>
        </div>

        <p className="mt-4 max-w-[580px] text-[14px] font-medium leading-5 text-zinc-300">Alterar esses padrões não afeta os eventos existentes. Você sempre pode alterar essas configurações para cada evento individualmente.</p>
      </section>

      <div className="my-8 h-px bg-white/10" />

      <section>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.02em] text-white">Rastreamento</h2>
        <p className="mt-0.5 text-[16px] font-medium leading-6 text-zinc-300">Acompanhe inscrições em eventos e conversões de anúncios do Google ou Meta.</p>
        <div className="mt-5 flex min-h-[61px] items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3"><p className="max-w-[430px] text-[14px] font-semibold leading-5 text-zinc-300">Faça upgrade para o Fauves Plus para integrar com anúncios do Google ou Meta.</p><button type="button" onClick={onOpenFauvesPlus} className={`${secondaryButton} shrink-0`}>Saiba mais</button></div>
      </section>

      <div className="my-8 h-px bg-white/10" />

      <section>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.02em] text-white">Status do Calendário</h2>
        <p className="mt-0.5 text-[16px] font-medium leading-6 text-zinc-300">Marque o calendário como em breve ou arquive-o se não estiver mais ativo.</p>
        <div className="mt-5 rounded-xl border border-white/10 bg-[#202224] p-4">
          <div className="flex items-start gap-3"><StatusIcon size={20} style={{ color: currentStatus.color }} className="mt-0.5 shrink-0" /><div><h3 className="text-[16px] font-semibold" style={{ color: currentStatus.color }}>{currentStatus.label}</h3><p className="mt-1 text-[14px] font-semibold leading-5 text-zinc-300">{currentStatus.cardDescription}</p><button type="button" onClick={openStatusModal} aria-haspopup="dialog" className={`${secondaryButton} mt-3`}><Hourglass size={14} />Alterar Status</button></div></div>
        </div>
      </section>

      {!isPersonal && <><div className="my-6 h-px bg-white/10" /><button type="button" onClick={onRequestDelete} className="flex items-center gap-2 border-0 bg-transparent p-0 text-[14px] font-semibold text-red-400 transition-colors hover:text-red-300"><Trash2 size={15} />Excluir Calendário Permanentemente</button></>}

      <AnimatePresence>
        {statusOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .16 }}
            onMouseDown={() => setStatusOpen(false)}
            className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/65 p-3 font-sans backdrop-blur-[2px]"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-status-title"
              initial={{ opacity: 0, scale: .96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: .96, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 29 }}
              onMouseDown={(event) => event.stopPropagation()}
              className="fauves-modal-surface w-full max-w-[342px] rounded-[20px] border p-5 text-left text-white"
            >
              <div className="mb-[15px] grid h-14 w-14 place-items-center rounded-full bg-white/10 text-zinc-300">
                <CalendarCheck size={28} strokeWidth={1.7} />
              </div>
              <h3 id="calendar-status-title" className="text-[21px] font-bold leading-[27px] tracking-[-0.025em] text-white">Alterar Status</h3>
              <p className="mt-1 text-[14px] font-semibold leading-5 text-zinc-300">Escolha o status desejado para o calendário.</p>

              <div className="mt-4 space-y-2">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = statusDraft === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setStatusDraft(option.value)}
                      className={`flex min-h-[76px] w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color] ${selected ? 'border-white bg-white/[0.045]' : 'border-white/10 bg-transparent hover:border-white/25 hover:bg-white/[0.035]'}`}
                    >
                      {selected ? <CircleCheck size={17} className="mt-0.5 shrink-0 fill-white text-[#1c1d1e]" /> : <Icon size={17} className="mt-0.5 shrink-0 text-zinc-400" />}
                      <span className="min-w-0">
                        <strong className="block text-[16px] font-semibold leading-5 text-white">{option.label}</strong>
                        <span className="mt-1 block text-[13px] font-semibold leading-[18px] text-zinc-400">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => { setStatus(statusDraft); setStatusOpen(false); }}
                className="mt-4 flex h-[39px] w-full items-center justify-center rounded-lg border-0 bg-white text-[16px] font-medium text-[#17191b] transition-colors hover:bg-zinc-100"
              >
                Atualizar Status
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
