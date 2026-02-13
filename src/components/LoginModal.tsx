import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/apiBase';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';
import LogoSquare from '@/assets/logo-square-fauves.svg?react';
import GoogleIco from '@/assets/googleico.svg?react';
import MailIco from '@/assets/mailico.svg?react';
const Guitarrista = React.lazy(() => import('@/assets/guitarrista 1.svg?react'));
const Vermelho3 = React.lazy(() => import('@/assets/vermelho 3.svg?react'));
const Raio1 = React.lazy(() => import('@/assets/raio 1.svg?react'));
import TextLink from './TextLink';
import { MultiStateButton } from './MultiStateButton';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmail?: string;
}

const WIDTH = 360;

const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSuccess, initialEmail }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const nomeRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setError(null);
    setEmail('');
    setPassword('');
    setNome('');
    setSobrenome('');
    // prefill email when provided (useful when opening from checkout)
    try {
      if (initialEmail) setEmail(initialEmail);
    } catch (e) { }
    // focus quickly when modal opens
    setTimeout(() => overlayRef.current?.focus(), 10);
  }, [open]);

  // Focus inputs when step changes (safe focus even when panels are transformed)
  useEffect(() => {
    if (!open) return;
    if (step === 1) {
      // small timeout so element is visible after transform
      setTimeout(() => emailRef.current?.focus(), 10);
    } else if (step === 2) {
      setTimeout(() => nomeRef.current?.focus(), 10);
    }
  }, [step, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleClose = () => {
    // trigger close state and remove quickly; keep small timeout for any CSS exit animation
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 120);
  };

  const doGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      // Open OAuth flow in a popup so user can finish Google consent without leaving the app
      const oauthUrl = apiUrl('/api/auth/google');
      const width = 600;
      const height = 700;
      const left = Math.max(0, Math.round((window.screen.width - width) / 2));
      const top = Math.max(0, Math.round((window.screen.height - height) / 2));
      const popup = window.open(oauthUrl, 'fauves_oauth', `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`);

      if (!popup) {
        // fallback to full redirect if popup blocked
        window.location.href = oauthUrl;
        return;
      }

      // Listen for postMessage from popup (oauth-callback.html)
      const handler = (ev: MessageEvent) => {
        try {
          if (!ev.data || ev.data.type !== 'fauves_oauth' || !ev.data.token) return;
          // Persist token and reload app so AuthProvider picks it up
          try { window.localStorage.setItem('AUTH_TOKEN_V1', ev.data.token); } catch (e) { }
          window.removeEventListener('message', handler);
          try { popup.close(); } catch (e) { }
          // reload to refresh auth state
          window.location.reload();
        } catch (e) {
          console.warn('oauth message handler error', e);
        }
      };
      window.addEventListener('message', handler);

      // Safety: if popup is closed without message, cleanup listener and stop loading
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          window.removeEventListener('message', handler);
          setLoading(false);
        }
      }, 500);
    } catch (err: any) {
      setError(String(err?.message || err));
      setLoading(false);
    }
  };

  const submitLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      throw new Error('Campos vazios');
    }
    const ok = await login(email, password);
    if (!ok) {
      throw new Error('Credenciais inválidas');
    }
    onSuccess?.();
    setTimeout(() => handleClose(), 1500);
  };

  const submitSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password || !nome || !sobrenome) {
      throw new Error('Campos vazios');
    }
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, nome, sobrenome }) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt);
    }
    setTimeout(() => setStep(1), 1500);
  };

  // simple password strength estimator
  const calcPasswordStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return { score: 0, label: 'Fraca', color: 'bg-red-500' };
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    // clamp 0..4
    score = Math.max(0, Math.min(4, score));
    let label = 'Fraca';
    let color = 'bg-red-500';
    if (score <= 1) { label = 'Fraca'; color = 'bg-red-500'; }
    else if (score === 2) { label = 'Média'; color = 'bg-yellow-400'; }
    else { label = 'Forte'; color = 'bg-emerald-500'; }
    return { score, label, color };
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      aria-modal
      role="dialog"
      className={`fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm ${isClosing ? 'pointer-events-none' : 'pointer-events-auto'} max-md:bg-black/70`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{ zIndex: 9999 }}
    >
      <div className="relative w-[320px] sm:w-[520px] max-w-[95vw] max-md:w-full max-md:h-full max-md:max-w-full">
        {/* floating guitarist only on initial step (lazy-loaded to avoid blocking modal mount) */}
        {step === 0 && (
          <React.Suspense fallback={null}>
            <Guitarrista className="pointer-events-none absolute right-10 -top-[140px] w-44 sm:w-52 max-md:hidden" style={{ zIndex: 3 }} />
          </React.Suspense>
        )}
        {step === 1 && (
          <React.Suspense fallback={null}>
            <Vermelho3 className="pointer-events-none absolute right-12 -top-[135px] w-44 sm:w-52 max-md:hidden" style={{ zIndex: 3 }} />
          </React.Suspense>
        )}
        {step === 2 && (
          /* decorative lightning on signup step */
          <React.Suspense fallback={null}>
            <Raio1 className="pointer-events-none absolute right-12 -top-[155px] w-28 sm:w-36 max-md:hidden" style={{ zIndex: 3 }} />
          </React.Suspense>
        )}
        <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-[#000000] to-[#000000] blur-[18px] opacity-10 max-md:hidden" style={{ zIndex: 1 }} />

        <div className={`relative bg-card dark:bg-[#0b0b0b] text-card-foreground rounded-2xl shadow-brand-lg p-4 max-md:p-0 overflow-hidden max-md:rounded-none max-md:h-full max-md:flex max-md:flex-col`} style={{ zIndex: 2 }}>
          {/* modal content */}
          <div className="flex items-center justify-between mb-2 max-md:mb-0 max-md:px-4 max-md:py-3 max-md:border-b max-md:border-border dark:max-md:border-[#1F1F1F]">
            <div className="flex items-center gap-3">
              {step !== 0 && (
                <button aria-label="Voltar" onClick={() => setStep(0)} className="p-1 rounded-md hover:bg-card dark:hover:bg-[#1a1a1a] max-md:p-2 max-md:hover:bg-gray-100 dark:max-md:hover:bg-[#242424] max-md:rounded-full">
                  <ArrowLeft className="w-5 h-5 max-md:w-6 max-md:h-6 text-muted-foreground dark:text-slate-400" />
                </button>
              )}
              {/* title removed from top of modal as requested */}
            </div>
            <button aria-label="Fechar" onClick={handleClose} className="w-10 h-10 max-md:w-12 max-md:h-12 flex items-center justify-center rounded-full text-muted-foreground dark:text-slate-400 hover:bg-card dark:hover:bg-[#1a1a1a] max-md:hover:bg-gray-100 dark:max-md:hover:bg-[#242424]">
              <span className="text-2xl max-md:text-3xl leading-none">×</span>
            </button>
          </div>

          <div className="relative">
            {step === 0 && (
              <div className="px-6 py-4">
                <div className="flex flex-col items-stretch h-full">
                  <div className="flex-1 flex flex-col justify-center items-start gap-6 text-left">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <LogoSquare className="w-12 h-12 block" />
                    </div>
                    <div className="text-card-foreground font-regular text-[22px]">Entre no ritmo.<br />Entre na Fauves.</div>
                    <div className="w-full flex flex-col gap-3">
                      <button
                        onClick={doGoogle}
                        className="flex items-center gap-3 justify-center border border-border rounded-full h-12 px-4 bg-brand-surface hover:shadow-brand-md transition w-full text-card-foreground"
                      >
                        <GoogleIco className="w-5 h-5" />
                        <span className="font-medium">Continuar com o Google</span>
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-3 justify-center rounded-full h-12 px-4 bg-brand-primary text-brand-primary-foreground hover:opacity-95 transition w-full"
                      >
                        <MailIco className="w-5 h-5 stroke-white" />
                        <span className="font-medium">Continuar com o e-mail</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-10 text-[12px] text-muted-foreground text-center">Ao continuar, você concorda com os Termos de uso e confirma que leu nossa Política de privacidade e cookies.<br /><br />Este site é protegido por reCAPTCHA e sujeito à Política de privacidade e aos Termos de serviço do Google.</div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="px-6 py-4 max-md:px-4 max-md:py-6 max-md:flex max-md:flex-col max-md:h-full">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-start gap-8 max-md:gap-6 mb-5 max-md:mb-6">
                    <div className="w-12 h-12 max-md:w-16 max-md:h-16 flex items-center justify-center">
                      <LogoSquare className="w-12 h-12 max-md:w-16 max-md:h-16 block" />
                    </div>
                    <div className="text-card-foreground dark:text-white font-regular text-[22px] max-md:text-[26px] max-md:leading-tight">Olha quem tá de volta pro rolê.</div>
                  </div>

                  <form className="flex-1 flex flex-col justify-center gap-3 max-md:gap-4" onSubmit={submitLogin}>
                    <input
                      ref={emailRef}
                      type="email"
                      placeholder="Endereço de e-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 max-md:py-4 max-md:text-base w-full"
                    />

                    <div className="relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 max-md:py-4 max-md:text-base w-full pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={0}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 m-0 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white focus:outline-none max-md:p-2 max-md:-mr-2"
                        style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <Eye size={22} className="max-md:w-6 max-md:h-6" /> : <EyeOff size={22} className="max-md:w-6 max-md:h-6" />}
                      </button>
                    </div>

                    <div className="w-full text-right mt-1 max-md:mt-2">
                      <TextLink onClick={() => setShowForgotPassword(true)} className="text-sm max-md:text-base">Esqueceu a senha?</TextLink>
                    </div>

                    <MultiStateButton
                      type="submit"
                      onClick={submitLogin}
                      idleText="Fazer login"
                      loadingText="Entrando..."
                      successText="Conectado!"
                      errorText="Falha no login"
                      className="mt-3 max-md:mt-4 w-full max-md:h-14"
                    />

                    <div className="mt-4 max-md:mt-6 flex items-center gap-3">
                      <span className="flex-1 h-px bg-border dark:bg-[#1F1F1F]" />
                      <span className="text-sm max-md:text-base text-muted-foreground dark:text-slate-400">Ainda não tem conta?</span>
                      <span className="flex-1 h-px bg-border dark:bg-[#1F1F1F]" />
                    </div>

                    <div className="mb-5 max-md:mb-6 text-center text-sm max-md:text-base">
                      <TextLink onClick={() => setStep(2)} className="mb-0">Cria tua conta</TextLink>
                      <span className="text-muted-foreground dark:text-slate-400 ml-0"> e vem curtir com a gente.</span>
                    </div>
                  </form>

                  <div className="pt-6 max-md:pt-4 text-[12px] max-md:text-[11px] text-muted-foreground dark:text-slate-400 text-center max-md:leading-relaxed">Ao continuar, você concorda com os&nbsp;Termos de uso&nbsp;e confirma que leu nossa&nbsp;Política de privacidade e cookies.<br /><br />Este site é protegido por reCAPTCHA e sujeito à&nbsp;Política de privacidade&nbsp;e aos&nbsp;Termos de serviço&nbsp;do Google.</div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="px-6 py-4 max-md:px-4 max-md:py-6 max-md:flex max-md:flex-col max-md:h-full">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-start gap-6 max-md:gap-5 mb-5 max-md:mb-6">
                    <div className="w-12 h-12 max-md:w-16 max-md:h-16 flex items-center justify-center">
                      <LogoSquare className="w-12 h-12 max-md:w-16 max-md:h-16 block" />
                    </div>
                    <div className="text-card-foreground dark:text-white font-regular text-[22px] max-md:text-[26px] max-md:leading-tight">Cria tua conta e vem curtir<br></br>com a gente.</div>
                  </div>

                  <form className="flex-1 flex flex-col gap-3 max-md:gap-4 justify-center" onSubmit={submitSignup}>
                    <div className="grid grid-cols-2 gap-3 max-md:gap-4 w-full">
                      <input ref={nomeRef} type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 max-md:py-4 max-md:text-base w-full" />
                      <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={e => setSobrenome(e.target.value)} className="border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 max-md:py-4 max-md:text-base w-full" />
                    </div>

                    <input type="email" placeholder="Endereço de e-mail" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 max-md:py-4 max-md:text-base w-full" />
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 max-md:py-4 max-md:text-base w-full pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white max-md:p-2 max-md:-mr-2"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <Eye size={22} className="max-md:w-6 max-md:h-6" /> : <EyeOff size={22} className="max-md:w-6 max-md:h-6" />}
                      </button>
                    </div>

                    {/* password strength indicator */}
                    {step === 2 && (
                      (() => {
                        const s = calcPasswordStrength(password);
                        const pct = Math.round((s.score / 4) * 100);
                        return (
                          <div className="mt-2 w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="w-full mr-3 bg-card rounded-full h-2 overflow-hidden">
                                <div className={`${s.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-xs w-16 text-right text-muted-foreground">{s.label}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">Use no mínimo 8 caracteres, incluindo letras e números. Símbolos deixam a senha mais forte.</div>
                          </div>
                        );
                      })()
                    )}

                    <AnimatedCheckbox
                      id="marketing"
                      checked={acceptMarketing}
                      onCheckedChange={setAcceptMarketing}
                      label="Sim, quero saber das ofertas e dos novos recursos. Sei que posso deixar de receber essas informações quando quiser."
                      className="mt-2"
                    />

                    <MultiStateButton
                      type="submit"
                      onClick={submitSignup}
                      idleText="Criar conta"
                      loadingText="Criando..."
                      successText="Conta criada!"
                      errorText="Erro ao criar"
                      className="mt-4 w-full"
                    />

                    <div className="mt-6 flex items-center gap-3">
                      <span className="flex-1 h-px bg-border" />
                      <span className="text-sm text-muted-foreground">Já tem uma conta?</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>

                    <div className="mt-0 text-center text-sm">
                      <TextLink onClick={() => setStep(1)}>Conecta</TextLink>
                      <span className="text-muted-foreground ml-0"> aí e bora viver.</span>
                    </div>
                  </form>

                  <div className="pt-4 text-xs text-muted-foreground text-center">Ao criar conta, você concorda com os Termos de uso e confirma que leu nossa Política de privacidade e cookies.</div>
                </div>
              </div>
            )}
          </div>

          {/* no pager dots: navigation is via buttons and back control to match Figma */}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      <style>{`
        .duration-520 { transition-duration: 520ms; }
        @keyframes panelIn {
          from { transform: translateY(-18px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoginModal;

/**
 * Prefetch decorative assets used by the login modal.
 * Call this from the login trigger (onMouseEnter/onFocus/onMouseDown) so
 * the browser begins loading large SVGs before the modal mounts — this
 * makes the modal paint faster and avoids waiting for SVG parsing.
 */
export const prefetchLoginModalAssets = () => {
  // dynamic imports start fetching the modules; we intentionally don't await
  // because we want to kick off the network request earlier.
  import('@/assets/guitarrista 1.svg?react').catch(() => { });
  import('@/assets/vermelho 3.svg?react').catch(() => { });
  import('@/assets/raio 1.svg?react').catch(() => { });
};
