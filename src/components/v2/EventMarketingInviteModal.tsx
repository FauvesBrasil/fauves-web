import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AtSign,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Mail,
  Search,
  Send,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';
import { getEventPath } from '@/lib/eventUrl';
import { useToast } from '@/hooks/use-toast';

type Contact = { email: string; name?: string | null };
type AudienceEvent = {
  id: string;
  name: string;
  startDate: string;
  count: number;
  contacts: Contact[];
};

type InviteAudience = {
  contacts: Contact[];
  events: AudienceEvent[];
};

type EventMarketingInviteModalProps = {
  open: boolean;
  event: { id?: string; name?: string; title?: string; slug?: string | null; startDate?: string } | null;
  eventId: string;
  organizationId?: string | null;
  onClose: () => void;
  onSent?: (count: number) => void;
};

const MAX_RECIPIENTS = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractEmails(value: string) {
  const matches = value.toLowerCase().match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi) || [];
  return Array.from(new Set(matches.map((email) => email.trim()).filter((email) => EMAIL_PATTERN.test(email))));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ContactAvatar({ contact, size = 30 }: { contact: Contact; size?: number }) {
  const label = (contact.name || contact.email).trim();
  const hue = Array.from(contact.email).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-[10px] font-bold text-white/90"
      style={{ width: size, height: size, background: `linear-gradient(145deg, hsl(${hue} 60% 68%), hsl(${(hue + 28) % 360} 55% 43%))` }}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function EventMarketingInviteModal({
  open,
  event,
  eventId,
  organizationId,
  onClose,
  onSent,
}: EventMarketingInviteModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [step, setStep] = React.useState<'select' | 'review'>('select');
  const [source, setSource] = React.useState<'suggestions' | 'emails' | 'all' | `event:${string}`>('suggestions');
  const [audience, setAudience] = React.useState<InviteAudience>({ contacts: [], events: [] });
  const [loadingAudience, setLoadingAudience] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [emailInput, setEmailInput] = React.useState('');
  const [manualEmails, setManualEmails] = React.useState<string[]>([]);
  const [selectedEmails, setSelectedEmails] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const eventName = event?.name || event?.title || 'este evento';
  const publicUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + getEventPath({ id: event?.id || eventId, slug: event?.slug });
  }, [event?.id, event?.slug, eventId]);

  React.useEffect(() => {
    if (!open || !organizationId || !eventId) return;
    let active = true;
    setLoadingAudience(true);
    fetchApi(`/api/organization/${organizationId}/campaigns/email/event/${eventId}/invite-audience`)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Não foi possível carregar os contatos');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setAudience({
          contacts: Array.isArray(data?.contacts) ? data.contacts : [],
          events: Array.isArray(data?.events) ? data.events : [],
        });
      })
      .catch((error) => {
        if (active) toast({ title: 'Contatos indisponíveis', description: error.message, variant: 'destructive' });
      })
      .finally(() => { if (active) setLoadingAudience(false); });
    return () => { active = false; };
  }, [eventId, open, organizationId, toast]);

  React.useEffect(() => {
    if (!open) return;
    setStep('select');
    setSource('suggestions');
    setQuery('');
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !sending) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open, sending]);

  const selectedSet = React.useMemo(() => new Set(selectedEmails), [selectedEmails]);
  const activeEvent = source.startsWith('event:')
    ? audience.events.find((item) => item.id === source.slice(6))
    : null;
  const availableContacts = source === 'emails'
    ? manualEmails.map((email) => ({ email }))
    : activeEvent?.contacts || audience.contacts;
  const visibleContacts = availableContacts.filter((contact) => {
    const search = query.trim().toLocaleLowerCase('pt-BR');
    return !search || `${contact.name || ''} ${contact.email}`.toLocaleLowerCase('pt-BR').includes(search);
  });

  const updateSelection = (emails: string[], selected: boolean) => {
    setSelectedEmails((current) => {
      const next = new Set(current);
      emails.forEach((email) => selected ? next.add(email) : next.delete(email));
      return Array.from(next).slice(0, MAX_RECIPIENTS);
    });
  };

  const addEmails = (raw: string) => {
    const emails = extractEmails(raw);
    if (!emails.length) {
      toast({ title: 'Nenhum e-mail válido', description: 'Confira o endereço informado.', variant: 'destructive' });
      return;
    }
    setManualEmails((current) => Array.from(new Set([...current, ...emails])).slice(0, MAX_RECIPIENTS));
    updateSelection(emails, true);
    setEmailInput('');
  };

  const importCsv = async (file?: File) => {
    if (!file) return;
    try {
      const emails = extractEmails(await file.text());
      if (!emails.length) throw new Error('O arquivo não contém e-mails válidos.');
      setManualEmails((current) => Array.from(new Set([...current, ...emails])).slice(0, MAX_RECIPIENTS));
      updateSelection(emails, true);
      setSource('emails');
      toast({ title: `${Math.min(emails.length, MAX_RECIPIENTS)} e-mail${emails.length === 1 ? '' : 's'} importado${emails.length === 1 ? '' : 's'}` });
    } catch (error: unknown) {
      toast({ title: 'Não foi possível importar o CSV', description: getErrorMessage(error, 'Confira o arquivo selecionado.'), variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(['email\ncontato@exemplo.com\n'], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'modelo-convites-fauves.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sendInvitations = async () => {
    if (!organizationId || !selectedEmails.length) return;
    setSending(true);
    try {
      const response = await fetchApi(`/api/organization/${organizationId}/campaigns/email/event/${eventId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: selectedEmails, message }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || 'Não foi possível enviar os convites.');
      toast({
        title: 'Convites de divulgação enviados!',
        description: `${result.sent || selectedEmails.length} destinatário${selectedEmails.length === 1 ? '' : 's'} recebeu o link para se cadastrar ou comprar ingresso.${result.failed ? ` ${result.failed} envio${result.failed === 1 ? '' : 's'} falhou${result.failed === 1 ? '' : 'ram'}.` : ''}`,
      });
      onSent?.(result.sent || selectedEmails.length);
      setSelectedEmails([]);
      setManualEmails([]);
      setEmailInput('');
      setMessage('');
      onClose();
    } catch (error: unknown) {
      toast({ title: 'Erro ao enviar convites', description: getErrorMessage(error, 'Tente novamente.'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-2 font-sans backdrop-blur-[2px] sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget && !sending) onClose(); }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketing-invite-title"
            initial={{ scale: 0.97, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 12 }}
            transition={{ duration: 0.2 }}
            className="flex h-[min(794px,calc(100vh-16px))] w-full max-w-[804px] flex-col overflow-hidden rounded-[18px] border border-white/[.08] bg-[#222323] text-white shadow-[0_28px_90px_rgba(0,0,0,.58)] sm:h-[min(794px,calc(100vh-32px))]"
          >
            <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/[.09] px-5">
              <div className="flex min-w-0 items-center gap-3">
                <h2 id="marketing-invite-title" className="truncate text-[16px] font-bold tracking-[-.02em]">Convidar Participantes</h2>
                {step === 'select' && (
                  <span className="hidden items-center gap-1.5 rounded-full border-2 border-white/[.13] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white/[.52] sm:flex">
                    <span className="h-3 w-3 rounded-full border-2 border-white/[.19]" />
                    {Math.max(0, MAX_RECIPIENTS - selectedEmails.length)} restantes
                  </span>
                )}
              </div>
              <button type="button" aria-label="Fechar" disabled={sending} onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full border-0 bg-white/[.09] text-white/[.62] transition hover:bg-white/[.14] hover:text-white disabled:opacity-40">
                <X size={16} />
              </button>
            </header>

            {step === 'select' ? (
              <>
                <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_1fr]">
                  <aside className="hidden min-h-0 overflow-y-auto border-r border-white/[.1] p-3 md:block">
                    <div className="space-y-1">
                      <SourceButton active={source === 'suggestions'} icon={<Sparkles size={16} />} label="Sugestões" onClick={() => { setSource('suggestions'); setQuery(''); }} />
                      <SourceButton active={source === 'emails'} icon={<AtSign size={17} />} label="Inserir E-mails" onClick={() => { setSource('emails'); setQuery(''); }} />
                    </div>
                    <div className="my-4 h-px bg-white/[.09]" />
                    <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-white/[.52]">Contatos do calendário</p>
                    <button type="button" onClick={() => { setSource('all'); setQuery(''); }} className={`mt-1 flex h-9 w-full items-center justify-between rounded-md px-2 text-[14px] font-semibold transition ${source === 'all' ? 'bg-white/[.1] text-white' : 'text-white/[.84] hover:bg-white/[.07]'}`}>
                      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/[.62]" />Todos</span>
                      <span className="text-white/[.5]">{audience.contacts.length}</span>
                    </button>
                    <div className="my-4 h-px bg-white/[.09]" />
                    <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-white/[.52]">Eventos</p>
                    <div className="mt-1 space-y-1">
                      {audience.events.map((pastEvent) => (
                        <button key={pastEvent.id} type="button" onClick={() => { setSource(`event:${pastEvent.id}`); setQuery(''); }} className={`w-full rounded-md px-2 py-2 text-left transition ${source === `event:${pastEvent.id}` ? 'bg-white/[.1]' : 'hover:bg-white/[.07]'}`}>
                          <strong className="block truncate text-[14px] leading-5 text-white/[.92]">{pastEvent.name}</strong>
                          <span className="block truncate text-[11px] font-medium text-white/[.5]">{new Date(pastEvent.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · {pastEvent.count} contato{pastEvent.count === 1 ? '' : 's'}</span>
                        </button>
                      ))}
                    </div>
                  </aside>

                  <main className="min-h-0 overflow-y-auto p-4 md:p-4">
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
                      <SourcePill active={source === 'suggestions'} label="Sugestões" onClick={() => setSource('suggestions')} />
                      <SourcePill active={source === 'emails'} label="E-mails" onClick={() => setSource('emails')} />
                      <SourcePill active={source === 'all'} label={`Todos (${audience.contacts.length})`} onClick={() => setSource('all')} />
                    </div>

                    {source === 'emails' ? (
                      <div>
                        <label className="mb-1.5 block text-[14px] font-semibold text-white/[.9]">Adicionar E-mails</label>
                        <div className="flex gap-2">
                          <input
                            value={emailInput}
                            onChange={(inputEvent) => setEmailInput(inputEvent.target.value)}
                            onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === 'Enter') { keyboardEvent.preventDefault(); addEmails(emailInput); } }}
                            placeholder="Cole ou insira e-mails aqui"
                            className="h-[38px] min-w-0 flex-1 rounded-[9px] border border-white/[.16] bg-[#171818] px-3 text-[14px] text-white outline-none placeholder:text-white/[.35] focus:border-white/[.48]"
                          />
                          <button type="button" onClick={() => addEmails(emailInput)} className="h-[38px] rounded-[9px] border-0 bg-white/[.12] px-4 text-[14px] font-bold text-white/[.88] hover:bg-white/[.17]">Adicionar</button>
                        </div>

                        {manualEmails.length > 0 && (
                          <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-white/[.1] bg-black/[.08] p-2">
                            {manualEmails.map((email) => (
                              <div key={email} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/[.05]">
                                <span className="truncate text-[13px] font-medium text-white/[.83]">{email}</span>
                                <button type="button" aria-label={`Remover ${email}`} onClick={() => { setManualEmails((current) => current.filter((item) => item !== email)); updateSelection([email], false); }} className="text-white/[.42] hover:text-[#ff7f99]"><X size={14} /></button>
                              </div>
                            ))}
                          </div>
                        )}

                        <label className="mb-1.5 mt-6 block text-[14px] font-semibold text-white/[.9]">Importar CSV</label>
                        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(inputEvent) => void importCsv(inputEvent.target.files?.[0])} />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(dragEvent) => dragEvent.preventDefault()}
                          onDrop={(dragEvent) => { dragEvent.preventDefault(); void importCsv(dragEvent.dataTransfer.files?.[0]); }}
                          className="flex h-40 w-full flex-col items-center justify-center rounded-[9px] border border-dashed border-white/[.14] bg-white/[.055] text-center transition hover:bg-white/[.075]"
                        >
                          <FileSpreadsheet size={30} className="mb-3 text-white/[.76]" />
                          <strong className="text-[16px] text-white/[.84]">Importar arquivo CSV</strong>
                          <span className="mt-1 text-[14px] font-medium text-white/[.62]">Solte o arquivo ou clique aqui para escolher.</span>
                        </button>
                        <button type="button" onClick={downloadTemplate} className="mt-3 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[14px] font-semibold text-white/[.55] hover:text-white/[.82]"><Download size={15} /> Baixar Modelo CSV</button>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[320px] flex-col">
                        <div className="relative">
                          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/[.38]" />
                          <input value={query} onChange={(inputEvent) => setQuery(inputEvent.target.value)} placeholder={activeEvent ? `Buscar em “${activeEvent.name}”` : 'Sugestões de Busca'} className="h-[40px] w-full rounded-[9px] border-0 bg-white/[.06] pl-10 pr-3 text-[14px] font-medium text-white outline-none placeholder:text-white/[.38] focus:ring-1 focus:ring-white/[.2]" />
                        </div>
                        {visibleContacts.length > 0 && (
                          <div className="mt-2 flex items-center justify-between border-b border-white/[.08] py-2 text-[13px] font-semibold text-white/[.56]">
                            <span>{selectedEmails.length} selecionado{selectedEmails.length === 1 ? '' : 's'}</span>
                            <button type="button" onClick={() => updateSelection(visibleContacts.map((contact) => contact.email), !visibleContacts.every((contact) => selectedSet.has(contact.email)))} className="border-0 bg-transparent text-white/[.68] hover:text-white">{visibleContacts.every((contact) => selectedSet.has(contact.email)) ? 'Limpar seleção' : 'Selecionar tudo'}</button>
                          </div>
                        )}
                        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                          {loadingAudience ? (
                            <div className="flex h-44 items-center justify-center text-[14px] text-white/[.48]"><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/[.2] border-t-white/[.75]" />Carregando contatos...</div>
                          ) : visibleContacts.length ? visibleContacts.map((contact) => {
                            const selected = selectedSet.has(contact.email);
                            return (
                              <button key={contact.email} type="button" onClick={() => updateSelection([contact.email], !selected)} className="flex w-full items-center justify-between rounded-lg border-0 bg-transparent px-2 py-2.5 text-left transition hover:bg-white/[.055]">
                                <span className="flex min-w-0 items-center gap-3"><ContactAvatar contact={contact} /><span className="min-w-0"><strong className="block truncate text-[14px] text-white/[.9]">{contact.name || contact.email}</strong>{contact.name && <span className="block truncate text-[12px] text-white/[.42]">{contact.email}</span>}</span></span>
                                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${selected ? 'border-white bg-white text-[#222323]' : 'border-white/[.16]'}`}>{selected && <Check size={13} strokeWidth={3} />}</span>
                              </button>
                            );
                          }) : (
                            <div className="flex h-48 flex-col items-center justify-center text-center">
                              <Mail size={28} className="mb-2 text-white/[.3]" />
                              <strong className="text-[14px] text-white/[.68]">Nenhum contato encontrado</strong>
                              <span className="mt-1 max-w-xs text-[12px] text-white/[.4]">Use “Inserir E-mails” para adicionar destinatários manualmente ou importar um CSV.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </main>
                </div>
                <footer className="flex h-[64px] shrink-0 items-center justify-between border-t border-white/[.09] px-4 sm:px-5">
                  <p className="hidden text-[12px] text-white/[.42] sm:block">Convite de divulgação — não gera ingresso ou cortesia.</p>
                  <button type="button" disabled={!selectedEmails.length} onClick={() => setStep('review')} className="ml-auto inline-flex h-10 items-center gap-1 rounded-[10px] border-0 bg-white px-4 text-[14px] font-semibold text-[#202121] transition hover:bg-white/[.88] disabled:cursor-not-allowed disabled:bg-white/[.08] disabled:text-white/[.22]">Próximo <ChevronRight size={16} /></button>
                </footer>
              </>
            ) : (
              <>
                <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr]">
                  <aside className="min-h-0 overflow-y-auto border-b border-white/[.1] p-4 md:border-b-0 md:border-r">
                    <p className="mb-3 text-[14px] font-semibold text-white/[.58]">Convidando {selectedEmails.length} pessoa{selectedEmails.length === 1 ? '' : 's'}</p>
                    <div className="space-y-1">
                      {selectedEmails.map((email) => <div key={email} className="flex min-w-0 items-center gap-3 rounded-lg py-1.5"><ContactAvatar contact={{ email }} size={27} /><span className="truncate text-[13px] font-semibold text-white/[.86]">{email}</span></div>)}
                    </div>
                  </aside>
                  <main className="min-h-0 overflow-y-auto p-5 md:p-6">
                    <div className="overflow-hidden rounded-[11px] border border-white/[.13]">
                      <div className="px-4 py-4 text-[16px] font-semibold text-white/[.94]">Olá! Você recebeu um convite para conhecer {eventName}.</div>
                      <textarea value={message} onChange={(textAreaEvent) => setMessage(textAreaEvent.target.value.slice(0, 2000))} placeholder="Adicione uma mensagem personalizada aqui..." className="h-28 w-full resize-none border-x-0 border-b border-t border-white/[.08] bg-white/[.055] px-4 py-3 text-[14px] leading-6 text-white outline-none placeholder:text-white/[.3]" />
                      <div className="px-4 py-4 text-[14px] font-semibold text-white/[.86]"><span className="mr-2 text-white/[.48]">Link do evento:</span><span className="break-all">{publicUrl.replace(/^https?:\/\//, '')}</span></div>
                    </div>
                    <div className="mt-5 flex items-start gap-3 border-b border-white/[.1] pb-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-white/[.1] text-white/[.72]"><Upload size={17} /></span>
                      <p className="text-[14px] font-semibold leading-5 text-white/[.88]">Enviaremos um link para a pessoa conhecer o evento e fazer a inscrição ou comprar o ingresso.</p>
                    </div>
                    <p className="mt-4 text-[13px] leading-5 text-white/[.5]">Este envio é apenas de marketing. Nenhuma vaga será reservada e nenhum ingresso de cortesia será criado.</p>
                  </main>
                </div>
                <footer className="flex h-[64px] shrink-0 items-center justify-between border-t border-white/[.09] px-4 sm:px-5">
                  <button type="button" disabled={sending} onClick={() => setStep('select')} className="inline-flex h-10 items-center gap-1 rounded-[9px] border-0 bg-white/[.1] px-3 text-[14px] font-semibold text-white/[.72] hover:bg-white/[.15] hover:text-white disabled:opacity-40"><ChevronLeft size={16} /> Voltar</button>
                  <button type="button" disabled={sending} onClick={() => void sendInvitations()} className="inline-flex h-10 items-center gap-2 rounded-[9px] border-0 bg-white px-4 text-[14px] font-semibold text-[#202121] hover:bg-white/[.88] disabled:opacity-50">{sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#202121]/30 border-t-[#202121]" /> : <Send size={16} />} {sending ? 'Enviando...' : 'Enviar Convites'}</button>
                </footer>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SourceButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex h-[38px] w-full items-center gap-2.5 rounded-md px-2 text-[14px] font-bold transition ${active ? 'bg-white/[.11] text-white' : 'text-white/[.68] hover:bg-white/[.07] hover:text-white/[.9]'}`}>{icon}{label}</button>;
}

function SourcePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${active ? 'border-white/[.18] bg-white/[.12] text-white' : 'border-white/[.1] text-white/[.55]'}`}>{label}</button>;
}
