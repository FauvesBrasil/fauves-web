import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AtSign,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleX,
  FileSpreadsheet,
  Hourglass,
  ListFilter,
  UsersRound,
  X,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';

type BulkStatus = 'confirmed' | 'declined' | 'pending' | 'waitlist';
type Step = 'choose' | 'csv' | 'manual' | 'confirm';

type Props = {
  open: boolean;
  guestEmails: string[];
  onClose: () => void;
  onSubmit: (emails: string[], status: BulkStatus, notify: boolean, message: string) => Promise<number>;
};

const statusOptions: Array<{ value: BulkStatus; label: string; icon: React.ReactNode }> = [
  { value: 'confirmed', label: 'Confirmado(a)', icon: <CheckCircle2 size={16} /> },
  { value: 'declined', label: 'Não vai', icon: <CircleX size={16} /> },
  { value: 'pending', label: 'Pendente', icon: <Hourglass size={16} /> },
  { value: 'waitlist', label: 'Na lista de espera', icon: <ListFilter size={16} /> },
];

function parseEmailList(value: string) {
  const matches = value.toLowerCase().match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi) || [];
  return Array.from(new Set(matches.map(email => email.trim())));
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Não foi possível atualizar os convidados.';
}

export default function BulkGuestStatusModal({ open, guestEmails, onClose, onSubmit }: Props) {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [step, setStep] = React.useState<Step>('choose');
  const [entrySource, setEntrySource] = React.useState<'csv' | 'manual'>('manual');
  const [emails, setEmails] = React.useState<string[]>([]);
  const [draftEmail, setDraftEmail] = React.useState('');
  const [status, setStatus] = React.useState<BulkStatus | ''>('');
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [notify, setNotify] = React.useState(true);
  const [message, setMessage] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const knownEmails = React.useMemo(() => new Set(guestEmails.map(email => email.toLowerCase())), [guestEmails]);
  const matchedEmails = emails.filter(email => knownEmails.has(email));
  const unmatchedCount = Math.max(0, emails.length - matchedEmails.length);

  React.useEffect(() => {
    if (!open) return;
    setStep('choose');
    setEntrySource('manual');
    setEmails([]);
    setDraftEmail('');
    setStatus('');
    setStatusOpen(false);
    setNotify(true);
    setMessage('');
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open, saving]);

  const commitEmails = (value: string) => {
    const parsed = parseEmailList(value);
    const next = Array.from(new Set([...emails, ...parsed]));
    if (parsed.length) {
      setEmails(next);
      setDraftEmail('');
    }
    return next;
  };

  const importCsv = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseEmailList(await file.text());
      if (!parsed.length) throw new Error('O arquivo não contém e-mails válidos.');
      setEmails(parsed);
      toast({ title: `${parsed.length} e-mail${parsed.length === 1 ? '' : 's'} importado${parsed.length === 1 ? '' : 's'}` });
    } catch (error: unknown) {
      toast({ title: 'Não foi possível importar o CSV', description: errorMessage(error), variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const goToConfirm = () => {
    const next = commitEmails(draftEmail);
    if (!next.length) {
      toast({ title: 'Informe pelo menos um e-mail válido', variant: 'destructive' });
      return;
    }
    setStep('confirm');
  };

  const submit = async () => {
    if (!status || !matchedEmails.length) return;
    setSaving(true);
    try {
      await onSubmit(emails, status, notify, message);
      onClose();
    } catch (error: unknown) {
      toast({ title: 'Erro ao atualizar convidados', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`manage-theme-surface ${isDark ? 'dark dark-mode' : 'light'}`}>
      <AnimatePresence>
        {open && <>
          <motion.button type="button" aria-label="Fechar" onClick={() => !saving && onClose()} className="fixed inset-0 z-[10030] cursor-default bg-black/70 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <div className="pointer-events-none fixed inset-0 z-[10031] grid place-items-center p-3">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="bulk-guest-modal-title"
              initial={{ opacity: 0, y: 10, scale: .985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 7, scale: .985 }}
              transition={{ duration: .18 }}
              className="pointer-events-auto relative w-full max-w-[352px] rounded-[17px] border border-white/[.07] bg-[#222323] p-5 text-white shadow-[0_22px_60px_rgba(0,0,0,.52)]"
            >
              {step === 'choose' ? <>
                <button type="button" aria-label="Fechar" onClick={onClose} className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full bg-white/[.09] text-white/[.55] hover:text-white"><X size={18} /></button>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white/[.1] text-white/[.72]"><UsersRound size={29} /></div>
                <h2 id="bulk-guest-modal-title" className="mt-4 text-[22px] font-semibold text-white/[.94]">Atualizar Convidados</h2>
                <p className="mt-2 text-[15px] font-medium leading-[21px] text-white/[.72]">Se você tem uma lista de convidados para os quais gostaria de atualizar o status, pode fazer isso abaixo.</p>
                <div className="mt-4 space-y-2.5">
                  <button type="button" onClick={() => { setEntrySource('csv'); setStep('csv'); }} className="flex w-full items-center gap-3 rounded-[9px] border border-white/[.12] bg-white/[.055] px-4 py-3 text-left hover:bg-white/[.08]"><FileSpreadsheet size={23} className="text-white/[.62]" /><span><strong className="block text-[16px] text-white/[.92]">Importar CSV</strong><span className="text-[14px] font-medium text-white/[.5]">Solte um arquivo CSV de e-mails</span></span></button>
                  <button type="button" onClick={() => { setEntrySource('manual'); setStep('manual'); }} className="flex w-full items-center gap-3 rounded-[9px] border border-white/[.12] bg-white/[.055] px-4 py-3 text-left hover:bg-white/[.08]"><AtSign size={23} className="text-white/[.62]" /><span><strong className="block text-[16px] text-white/[.92]">Inserir Manualmente</strong><span className="text-[14px] font-medium text-white/[.5]">Cole ou insira uma lista de e-mails</span></span></button>
                </div>
              </> : <>
                <ModalHeader title={step === 'confirm' ? 'Confirmar Atualização' : 'Atualizar Convidados'} onBack={() => setStep(step === 'confirm' ? entrySource : 'choose')} onClose={onClose} />

                {step === 'csv' && <>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => void importCsv(event.target.files?.[0])} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void importCsv(event.dataTransfer.files?.[0]); }} className="mt-4 flex h-[166px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed border-white/[.16] bg-white/[.055] px-6 text-center hover:bg-white/[.075]">
                    <FileSpreadsheet size={31} className="mb-3 text-white/[.72]" />
                    <strong className="text-[16px] text-white/[.78]">Importar Arquivo CSV</strong>
                    <span className="mt-1 text-[14px] font-semibold leading-5 text-white/[.65]">Solte o arquivo ou clique aqui para escolher o arquivo.</span>
                    {emails.length > 0 && <span className="mt-2 text-[12px] font-semibold text-[#77d86b]">{emails.length} e-mail{emails.length === 1 ? '' : 's'} pronto{emails.length === 1 ? '' : 's'}</span>}
                  </button>
                  <button type="button" disabled={!emails.length} onClick={() => setStep('confirm')} className="mt-4 h-10 w-full rounded-[8px] bg-white text-[16px] font-semibold text-[#202121] disabled:bg-white/[.12] disabled:text-white/[.3]">Continuar</button>
                </>}

                {step === 'manual' && <>
                  <p className="mt-4 text-[14px] font-semibold leading-[21px] text-white/[.76]">Dica: Você pode colar vários e-mails em um único campo, separados por vírgula ou espaço.</p>
                  <div className="mt-4 overflow-hidden rounded-[8px] border border-white/[.12] bg-[#171818]">
                    {emails.map(email => <div key={email} className="flex h-10 items-center border-b border-white/[.09] px-3"><span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white/[.9]">{email}</span><button type="button" aria-label={`Remover ${email}`} onClick={() => setEmails(current => current.filter(item => item !== email))} className="ml-2 text-white/[.48] hover:text-white"><X size={15} /></button></div>)}
                    <input
                      value={draftEmail}
                      onChange={event => setDraftEmail(event.target.value)}
                      onPaste={event => { const pasted = event.clipboardData.getData('text'); if (parseEmailList(pasted).length) { event.preventDefault(); commitEmails(pasted); } }}
                      onKeyDown={event => { if (event.key === 'Enter' || event.key === ',' || event.key === ';') { event.preventDefault(); commitEmails(draftEmail); } }}
                      onBlur={() => commitEmails(draftEmail)}
                      placeholder="Email"
                      className="h-10 w-full border-0 bg-transparent px-3 text-[14px] font-medium text-white outline-none placeholder:text-white/[.32]"
                    />
                  </div>
                  <div className="h-32" />
                  <button type="button" disabled={!emails.length && !parseEmailList(draftEmail).length} onMouseDown={event => event.preventDefault()} onClick={goToConfirm} className="h-10 w-full rounded-[8px] bg-white text-[16px] font-semibold text-[#202121] disabled:bg-white/[.12] disabled:text-white/[.3]">Continuar</button>
                </>}

                {step === 'confirm' && <>
                  <div className="mt-4 rounded-[9px] border border-white/[.1] bg-white/[.055] p-3">
                    <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[.09] text-white/[.58]"><UsersRound size={17} /></span><span className="min-w-0"><strong className="block text-[13px] text-white/[.52]">Atualizando {matchedEmails.length} Pessoa{matchedEmails.length === 1 ? '' : 's'}</strong><span className="block truncate text-[13px] font-semibold text-white/[.9]">{matchedEmails.join(' e ') || 'Nenhum convidado encontrado'}</span></span></div>
                    {unmatchedCount > 0 && <p className="mt-3 border-t border-white/[.09] pt-3 text-[12px] font-medium leading-4 text-white/[.52]">{unmatchedCount} e-mail{unmatchedCount === 1 ? '' : 's'} sem correspondência será{unmatchedCount === 1 ? '' : 'ão'} ignorado{unmatchedCount === 1 ? '' : 's'}.</p>}
                  </div>
                  <label className="mt-4 block text-[14px] font-semibold text-white/[.76]">Alterar status para:</label>
                  <div className="relative mt-2">
                    <button type="button" onClick={() => setStatusOpen(value => !value)} className="flex h-10 w-full items-center justify-between rounded-[8px] border border-white/[.12] bg-[#171818] px-3 text-[14px] font-semibold text-white/[.84]"><span className={status ? '' : 'text-white/[.35]'}>{statusOptions.find(option => option.value === status)?.label || 'Escolha o novo status'}</span><ChevronDown size={16} className="text-white/[.42]" /></button>
                    <AnimatePresence>{statusOpen && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 top-[calc(100%+5px)] z-30 w-full rounded-[8px] border border-white/[.12] bg-[#252626] p-1 shadow-2xl">
                      {statusOptions.map(option => <button key={option.value} type="button" onClick={() => { setStatus(option.value); setStatusOpen(false); }} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[14px] font-semibold text-white/[.9] hover:bg-white/[.08]"><span className="text-white/[.55]">{option.icon}</span>{option.label}{status === option.value && <Check size={14} className="ml-auto" />}</button>)}
                    </motion.div>}</AnimatePresence>
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-white/[.86]"><input type="checkbox" checked={notify} onChange={event => setNotify(event.target.checked)} className="h-5 w-5 rounded accent-white" />Notificar Convidados</label>
                  <textarea value={message} onChange={event => setMessage(event.target.value.slice(0, 1000))} placeholder="Adicione uma mensagem personalizada opcional..." className="mt-3 h-20 w-full resize-none rounded-[8px] border border-white/[.12] bg-[#171818] p-3 text-[14px] leading-5 text-white outline-none placeholder:text-white/[.32]" />
                  <p className="mt-2 text-[12px] font-medium leading-4 text-white/[.45]">Qualquer mensagem especificada nos e-mails de cadastro sempre será incluída.</p>
                  <button type="button" disabled={saving || !status || !matchedEmails.length} onClick={() => void submit()} className="mt-4 h-10 w-full rounded-[8px] bg-white text-[15px] font-semibold text-[#202121] disabled:bg-white/[.12] disabled:text-white/[.3]">{saving ? 'Atualizando…' : 'Atualizar Convidados'}</button>
                </>}
              </>}
            </motion.section>
          </div>
        </>}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function ModalHeader({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) {
  return <header className="flex items-center justify-between"><button type="button" aria-label="Voltar" onClick={onBack} className="grid h-8 w-8 place-items-center rounded-full bg-white/[.09] text-white/[.55] hover:text-white"><ChevronLeft size={18} /></button><h2 id="bulk-guest-modal-title" className="text-[16px] font-semibold text-white/[.94]">{title}</h2><button type="button" aria-label="Fechar" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/[.09] text-white/[.55] hover:text-white"><X size={18} /></button></header>;
}
