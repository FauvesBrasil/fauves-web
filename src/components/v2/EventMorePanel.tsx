import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  MonitorUp,
  MousePointerClick,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/context/OrganizationContext';
import { CloneEventModal, type CloneEventOptions } from '@/components/v2/CloneEventModal';
import { CloneEventSuccessModal, type ClonedEventSummary } from '@/components/v2/CloneEventSuccessModal';

type EmbedType = 'button' | 'page';
type CloneFlowState =
  | { view: 'closed' }
  | { view: 'editing' }
  | { view: 'success'; events: ClonedEventSummary[] };

interface EventMorePanelProps {
  event: EventMoreData;
  onEventChange: (event: EventMoreData) => void;
}

interface EventMoreData {
  id?: string;
  _id?: string;
  slug?: string | null;
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  privacy?: string | null;
  organizationId?: string | null;
  organizerId?: string | null;
  image?: string | null;
  location?: string | null;
  locationAddress?: string | null;
  [key: string]: unknown;
}

const normalizeSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/-{2,}/g, '-')
  .replace(/^-+/, '')
  .slice(0, 60);

const readError = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({})) as { message?: string | string[]; error?: string };
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  return message || data?.error || fallback;
};

const SyntaxLine = ({ line }: { line: string }) => {
  const tokens = line.split(/("[^"]*"|<\/?[a-z]+|[a-z][a-z0-9-]*(?==))/gi);
  return (
    <div className="min-h-[20px]">
      {tokens.map((token, index) => {
        let className = 'text-zinc-300';
        if (/^"/.test(token)) className = 'text-[#8fc56b]';
        else if (/^<\/?[a-z]+/i.test(token)) className = 'text-[#f07178]';
        else if (/^[a-z][a-z0-9-]*$/i.test(token) && line.includes(`${token}=`)) className = 'text-[#e5a35b]';
        return <span key={`${token}-${index}`} className={className}>{token}</span>;
      })}
    </div>
  );
};

const EventMorePanel: React.FC<EventMorePanelProps> = ({ event, onEventChange }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orgs, selectedOrg } = useOrganization();
  const eventId = event?.id || event?._id;
  const [slug, setSlug] = React.useState(event?.slug || eventId || '');
  const [embedType, setEmbedType] = React.useState<EmbedType>('button');
  const [copyOk, setCopyOk] = React.useState(false);
  const [savingSlug, setSavingSlug] = React.useState(false);
  const [cloning, setCloning] = React.useState(false);
  const [cloneFlow, setCloneFlow] = React.useState<CloneFlowState>({ view: 'closed' });
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    setSlug(event?.slug || eventId || '');
  }, [event?.slug, eventId]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.fauves.com.br';
  const host = typeof window !== 'undefined' ? `${window.location.host}/` : 'app.fauves.com.br/';
  const effectiveSlug = event?.slug || slug || eventId;
  const publicUrl = `${origin}/${effectiveSlug}`;
  const scriptUrl = `${origin}/embed/checkout-button.js`;
  const buttonCode = `<a
  href="${publicUrl}"
  class="fauves-checkout--button"
  data-fauves-event-id="${eventId}"
>
  Cadastrar-se no Evento
</a>

<script src="${scriptUrl}" async></script>`;
  const pageCode = `<iframe
  src="${publicUrl}?embed=1"
  title="${String(event?.name || 'Evento').replace(/"/g, '&quot;')}"
  width="100%"
  height="720"
  loading="lazy"
  allow="payment"
  style="border:0;border-radius:12px"
></iframe>`;
  const embedCode = embedType === 'button' ? buttonCode : pageCode;

  const handleClone = async (options: CloneEventOptions) => {
    if (!eventId || cloning) return;
    setCloning(true);
    try {
      const response = await fetchApi(`/api/event/${eventId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error(await readError(response, 'Não foi possível clonar o evento.'));
      const data = await response.json() as { id?: string; event?: ClonedEventSummary; events?: ClonedEventSummary[] };
      const cloned = data?.event || data;
      if (!cloned?.id) throw new Error('A cópia foi criada, mas a resposta veio incompleta.');
      setCloneFlow({ view: 'success', events: data?.events?.length ? data.events : [cloned] });
    } catch (error: unknown) {
      toast({ title: 'Erro ao clonar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setCloning(false);
    }
  };

  const handleUpdateSlug = async () => {
    const normalized = normalizeSlug(slug).replace(/-+$/, '');
    if (normalized.length < 3) {
      toast({ title: 'URL inválida', description: 'Use pelo menos 3 letras ou números.', variant: 'destructive' });
      return;
    }
    setSavingSlug(true);
    try {
      const response = await fetchApi(`/api/event/${eventId}/slug`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: normalized }),
      });
      if (!response.ok) throw new Error(await readError(response, 'Não foi possível atualizar a URL.'));
      const data = await response.json() as { slug?: string; event?: EventMoreData };
      const savedSlug = data?.slug || data?.event?.slug || normalized;
      setSlug(savedSlug);
      onEventChange({ ...event, ...(data?.event || {}), slug: savedSlug });
      toast({ title: 'URL atualizada!', description: `${host}${savedSlug}` });
    } catch (error: unknown) {
      toast({ title: 'Erro ao atualizar URL', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSavingSlug(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopyOk(true);
      toast({ title: 'Código copiado!', description: 'Cole o trecho HTML no seu site.' });
      window.setTimeout(() => setCopyOk(false), 1800);
    } catch {
      toast({ title: 'Não foi possível copiar', description: 'Selecione o código e copie manualmente.', variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    if (!eventId || cancelling) return;
    setCancelling(true);
    try {
      const response = await fetchApi(`/api/event/${eventId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await readError(response, 'Não foi possível cancelar o evento.'));
      const data = await response.json().catch(() => ({})) as { ok?: boolean };
      if (data?.ok === false) throw new Error('Não foi possível cancelar o evento.');
      toast({ title: 'Evento cancelado', description: 'O evento foi removido da página pública e novas inscrições foram bloqueadas.' });
      setCancelOpen(false);
      navigate('/organizer-events', { replace: true });
    } catch (error: unknown) {
      toast({ title: 'Erro ao cancelar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="pb-10 text-left font-sans"
    >
      <style>{`
        .embed-choice.variant-color-embed {
          --variant-color: #ec4899;
          --variant-color-content: #ec4899;
          --variant-color-pale: rgba(236, 72, 153, 0.16);
          --variant-color-active: rgba(236, 72, 153, 0.30);
          --variant-color-glow-start: rgba(236, 72, 153, 0.06);
        }
        .embed-choice.is-selected .underlay { opacity: .82; }
        .embed-choice.is-selected .overlay { border-color: rgba(236, 72, 153, .30); }
        .embed-choice.is-selected .glow-wrapper { opacity: .52; }
        .embed-choice:hover .glow-wrapper { opacity: .72; }
        .embed-choice:hover .overlay { border-color: rgba(236, 72, 153, .38); }
        .dark .embed-choice.is-selected .underlay { opacity: .78; }
        .dark .embed-choice.is-selected .glow-wrapper { opacity: .42; }
        .dark .embed-choice:hover .glow-wrapper { opacity: .58; }
        .dark .embed-choice:hover .overlay { border-color: rgba(244, 114, 182, .30); }
        @media (prefers-reduced-motion: reduce) {
          .embed-choice, .embed-choice * { transition: none !important; }
        }
      `}</style>
      <section>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.025em] text-zinc-950 dark:text-zinc-50">Clonar Evento</h2>
        <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-600 dark:text-zinc-300">
          Crie um novo evento com as mesmas informações deste. Tudo, exceto a lista de convidados e as publicações do evento, será copiado.
        </p>
        <button
          type="button"
          onClick={() => setCloneFlow({ view: 'editing' })}
          disabled={cloning}
          className="mt-5 inline-flex h-[38px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-[16px] font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cloning ? <Loader2 size={17} className="animate-spin" /> : <Copy size={17} />}
          {cloning ? 'Clonando…' : 'Clonar Evento'}
        </button>
      </section>

      <CloneEventModal
        open={cloneFlow.view === 'editing'}
        event={event}
        organizations={orgs}
        fallbackOrganization={selectedOrg}
        loading={cloning}
        onClose={() => setCloneFlow({ view: 'closed' })}
        onConfirm={handleClone}
      />

      <CloneEventSuccessModal
        events={cloneFlow.view === 'success' ? cloneFlow.events : []}
        onClose={() => setCloneFlow({ view: 'closed' })}
        onOpenEvent={(clonedEventId) => navigate(`/event/manage/${clonedEventId}/overview`)}
      />

      <div className="my-8 border-t border-zinc-200 dark:border-white/10" />

      <section>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.025em] text-zinc-950 dark:text-zinc-50">Página do Evento</h2>
        <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-600 dark:text-zinc-300">
          Quando você escolher uma nova URL, a atual não funcionará mais. Não mude sua URL se você já compartilhou o evento.
        </p>

        <div className="mt-5 flex min-h-[49px] items-center justify-between gap-4 rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-2.5 dark:border-white/10 dark:bg-[#2b2c2e]">
          <p className="text-[14px] font-medium leading-5 text-zinc-600 dark:text-zinc-300">
            Escolha uma URL curta e fácil de compartilhar para este evento.
          </p>
          <button
            type="button"
            onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-200 px-3 text-[14px] font-semibold text-zinc-700 transition hover:bg-zinc-300 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
          >
            Ver página <ExternalLink size={13} />
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="event-public-slug" className="text-[14px] font-semibold text-zinc-600 dark:text-zinc-300">URL pública</label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex h-[38px] min-w-0 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-100 dark:border-white/10 dark:bg-[#202123]">
              <span className="flex items-center border-r border-zinc-300 px-3 text-[15px] font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-400">{host}</span>
              <input
                id="event-public-slug"
                value={slug}
                onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateSlug(); }}
                spellCheck={false}
                className="w-[180px] min-w-[120px] bg-transparent px-3 text-[15px] font-semibold text-zinc-900 outline-none focus:ring-0 dark:text-zinc-100"
              />
            </div>
            <button
              type="button"
              onClick={handleUpdateSlug}
              disabled={savingSlug || normalizeSlug(slug).replace(/-+$/, '') === event?.slug}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-lg bg-zinc-300 px-4 text-[15px] font-semibold text-zinc-800 transition hover:bg-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-500 dark:text-zinc-100 dark:hover:bg-zinc-400"
            >
              {savingSlug && <Loader2 size={15} className="animate-spin" />}
              Atualizar
            </button>
          </div>
        </div>
      </section>

      <div className="my-8 border-t border-zinc-200 dark:border-white/10" />

      <section>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.025em] text-zinc-950 dark:text-zinc-50">Incorporar Evento</h2>
        <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-600 dark:text-zinc-300">
          Tem seu próprio site? Incorpore o evento para que os visitantes saibam sobre ele.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <EmbedChoice
            active={embedType === 'button'}
            icon={<MousePointerClick size={20} />}
            label="Incorporar como Botão"
            onClick={() => setEmbedType('button')}
          />
          <EmbedChoice
            active={embedType === 'page'}
            icon={<MonitorUp size={20} />}
            label="Incorporar Página do Evento"
            onClick={() => setEmbedType('page')}
          />
        </div>

        <div className="mt-7">
          <p className="text-[16px] font-semibold leading-6 text-zinc-800 dark:text-zinc-100">Cole o seguinte trecho de código HTML na sua página:</p>
          <div className="relative mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-[#202224] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-3 top-3 z-10 inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-zinc-700/90 px-2.5 text-xs font-semibold text-zinc-100 shadow-lg transition hover:bg-zinc-600"
              aria-label="Copiar código HTML"
            >
              {copyOk ? <Check size={14} /> : <Copy size={14} />}
              {copyOk ? 'Copiado' : 'Copiar'}
            </button>
            <pre className="max-h-[300px] overflow-auto p-4 pr-20 font-mono text-[15px] font-medium leading-5">
              {embedCode.split('\n').map((line, index) => <SyntaxLine key={`${line}-${index}`} line={line} />)}
            </pre>
          </div>
        </div>

        {embedType === 'button' ? (
          <>
            <div className="mt-4">
              <p className="text-[16px] font-semibold leading-6 text-zinc-800 dark:text-zinc-100">Isso gera o seguinte botão. Clique nele para vê-lo em ação!</p>
              <div className="mt-4 flex min-h-[106px] items-center justify-center rounded-lg border border-zinc-300 bg-zinc-50 dark:border-white/10 dark:bg-transparent">
                <button
                  type="button"
                  onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                  className="rounded-full bg-white px-5 py-2.5 text-[16px] font-semibold text-zinc-950 shadow-sm transition hover:scale-[1.02]"
                >
                  Cadastrar-se no Evento
                </button>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-[16px] font-medium leading-6 text-zinc-700 dark:text-zinc-200">
              <p>Se quiser usar seu próprio estilo, remova a classe <code className="font-mono text-[14px]">fauves-checkout--button</code> do trecho acima.</p>
              <p>Adicione <code className="font-mono text-[14px]">data-fauves-coupon=&quot;CODE&quot;</code> para pré-aplicar um cupom, ou <code className="font-mono text-[14px]">data-fauves-utm-source=&quot;source&quot;</code> para identificar as inscrições.</p>
              <p>
                Para uso avançado, confira nossa{' '}
                <a href="/ajuda/organizador" target="_blank" rel="noreferrer" className="font-semibold text-pink-500 hover:underline">documentação <ExternalLink size={13} className="inline" /></a>.
              </p>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <p className="text-[16px] font-semibold leading-6 text-zinc-800 dark:text-zinc-100">Prévia da página incorporada</p>
            <div className="mt-4 flex min-h-[106px] items-center justify-center rounded-lg border border-zinc-300 dark:border-white/10">
              <button
                type="button"
                onClick={() => window.open(`${publicUrl}?embed=1`, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[15px] font-semibold text-zinc-950"
              >
                <ExternalLink size={16} /> Abrir prévia
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="my-8 border-t border-zinc-200 dark:border-white/10" />

      <section>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.025em] text-zinc-950 dark:text-zinc-50">Cancelar Evento</h2>
        <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-600 dark:text-zinc-300">
          Cancele este evento e remova-o da página pública. Esta ação não pode ser desfeita e novas inscrições serão bloqueadas.
        </p>
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="mt-5 inline-flex h-[38px] items-center gap-2 rounded-lg bg-[#ff2e39] px-3.5 text-[16px] font-semibold text-white transition hover:bg-red-600"
        >
          <Trash2 size={17} /> Cancelar Evento
        </button>
      </section>

      <AnimatePresence>
        {cancelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget && !cancelling) setCancelOpen(false); }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-event-title"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="w-full max-w-[390px] rounded-[18px] border border-white/[0.05] bg-[#1b1c1d] p-5 text-white shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                  <Trash2 size={24} />
                </div>
                <button type="button" onClick={() => setCancelOpen(false)} disabled={cancelling} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white" aria-label="Fechar">
                  <X size={15} />
                </button>
              </div>
              <h3 id="cancel-event-title" className="mt-4 text-[20px] font-bold tracking-[-0.02em]">Cancelar Evento</h3>
              <p className="mt-1 text-[14px] font-medium leading-5 text-zinc-300">
                Tem certeza que deseja cancelar o evento <strong className="text-white">{event?.name}</strong>? A página pública será removida imediatamente.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={handleCancel} disabled={cancelling} className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg bg-[#ff2e39] text-[15px] font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                  {cancelling && <Loader2 size={16} className="animate-spin" />}
                  {cancelling ? 'Cancelando…' : 'Cancelar evento'}
                </button>
                <button type="button" onClick={() => setCancelOpen(false)} disabled={cancelling} className="h-[38px] rounded-lg bg-white/10 text-[15px] font-semibold text-zinc-200 hover:bg-white/15">Voltar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const EmbedChoice = ({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    onMouseMove={(event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const glow = event.currentTarget.querySelector<HTMLElement>('.rich-button-glow-bg');
      if (!glow) return;
      const mask = `radial-gradient(160px at ${x}px ${y}px, rgb(255, 255, 255), rgba(255, 255, 255, 0))`;
      glow.style.maskImage = mask;
      glow.style.webkitMaskImage = mask;
    }}
    onMouseLeave={(event) => {
      const glow = event.currentTarget.querySelector<HTMLElement>('.rich-button-glow-bg');
      if (!glow) return;
      const mask = 'radial-gradient(160px at 0px 0px, rgb(255, 255, 255), rgba(255, 255, 255, 0))';
      glow.style.maskImage = mask;
      glow.style.webkitMaskImage = mask;
    }}
    aria-pressed={active}
    className={`embed-choice rich-button variant-color-embed min-h-[54px] cursor-pointer ${active ? 'is-selected' : ''}`}
  >
    <div className="underlay" />
    <div className="glow-wrapper">
      <div
        className="background rich-button-glow-bg"
        style={{
          maskImage: 'radial-gradient(160px at 0px 0px, rgb(255, 255, 255), rgba(255, 255, 255, 0))',
          WebkitMaskImage: 'radial-gradient(160px at 0px 0px, rgb(255, 255, 255), rgba(255, 255, 255, 0))',
        }}
      />
    </div>
    <div className="overlay" />
    <div className="content flex-1">
      <div className="icon">{icon}</div>
      <div className="min-w-0 flex-1 text-left">
        <div className="name truncate">{label}</div>
      </div>
      <span className={`mr-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-pink-500 text-white transition-all duration-200 ${active ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
        <Check size={12} strokeWidth={3} />
      </span>
    </div>
  </button>
);

export default EventMorePanel;
