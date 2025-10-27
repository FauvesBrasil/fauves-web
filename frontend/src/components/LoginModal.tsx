import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import LogoSquare from '@/assets/logo-square-fauves.svg?react';
import GoogleIco from '@/assets/googleico.svg?react';
import MailIco from '@/assets/mailico.svg?react';
import Guitarrista from '@/assets/guitarrista 1.svg?react';
import Vermelho3 from '@/assets/vermelho 3.svg?react';
import Raio1 from '@/assets/raio 1.svg?react';
import TextLink from './TextLink';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

  const WIDTH = 360;

  const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const nomeRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setError(null);
    setEmail('');
    setPassword('');
    setNome('');
    setSobrenome('');
    setTimeout(() => overlayRef.current?.focus(), 50);
  }, [open]);

  // Focus inputs when step changes (safe focus even when panels are transformed)
  useEffect(() => {
    if (!open) return;
    if (step === 1) {
      // small timeout so element is visible after transform
      setTimeout(() => emailRef.current?.focus(), 160);
    } else if (step === 2) {
      setTimeout(() => nomeRef.current?.focus(), 160);
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
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 320);
  };

  const doGoogle = async () => {
    alert('Login com Google ainda não implementado (placeholder)');
  };

  const submitLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (!ok) setError('Credenciais inválidas');
      else {
        onSuccess?.();
        handleClose();
      }
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally { setLoading(false); }
  };

  const submitSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!email || !password || !nome || !sobrenome) {
        setError('Preencha todos os campos');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, nome, sobrenome }) });
      if (!res.ok) {
        const txt = await res.text();
        setError('Falha ao criar conta: ' + txt);
      } else {
        setStep(1);
      }
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally { setLoading(false); }
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
      className={`fixed inset-0 flex items-center justify-center bg-black/40 ${isClosing ? 'pointer-events-none' : 'pointer-events-auto'}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{ zIndex: 9999 }}
    >
  <div className="relative w-[320px] sm:w-[520px] max-w-[95vw]">
        {/* floating guitarist only on initial step */}
        {step === 0 && (
          <Guitarrista className="pointer-events-none absolute right-10 -top-[140px] w-44 sm:w-52" style={{ zIndex: 3 }} />
        )}
        {step === 1 && (
          <Vermelho3 className="pointer-events-none absolute right-12 -top-[135px] w-44 sm:w-52" style={{ zIndex: 3 }} />
        )}
        {step === 2 && (
          /* decorative lightning on signup step */
          <Raio1 className="pointer-events-none absolute right-12 -top-[155px] w-28 sm:w-36" style={{ zIndex: 3 }} />
        )}
        <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-[#000000] to-[#000000] blur-[18px] opacity-10" style={{ zIndex: 1 }} />

        <div className={`relative bg-white rounded-2xl shadow-2xl p-4 overflow-hidden`} style={{ zIndex: 2 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {step !== 0 && (
                <button aria-label="Voltar" onClick={() => setStep(0)} className="p-1 rounded-md hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
              )}
              {/* title removed from top of modal as requested */}
            </div>
            <button aria-label="Fechar" onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-gray-100">
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>

          <div className="relative max-h-[80vh] overflow-auto">
            {step === 0 && (
              <div className="px-6 py-4">
                <div className="flex flex-col items-stretch h-full">
                  <div className="flex-1 flex flex-col justify-center items-start gap-6 text-left">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <LogoSquare className="w-12 h-12 block" />
                    </div>
                    <div className="text-slate-800 font-regular text-[22px]">Entre no ritmo.<br/>Entre na Fauves.</div>
                    <div className="w-full flex flex-col gap-3">
                      <button
                        onClick={doGoogle}
                        className="flex items-center gap-3 justify-center border border-slate-300 rounded-full h-12 px-4 bg-white hover:shadow-md transition w-full"
                      >
                        <GoogleIco className="w-5 h-5" />
                        <span className="font-medium">Continuar com o Google</span>
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-3 justify-center rounded-full h-12 px-4 bg-indigo-600 text-white hover:bg-indigo-700 transition w-full"
                      >
                        <MailIco className="w-5 h-5 stroke-white" />
                        <span className="font-medium">Continuar com o e-mail</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-10 text-[12px] text-slate-400 text-center">Ao continuar, você concorda com os Termos de uso e confirma que leu nossa Política de privacidade e cookies.<br/><br/>Este site é protegido por reCAPTCHA e sujeito à Política de privacidade e aos Termos de serviço do Google.</div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="px-6 py-4">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-start gap-8 mb-5">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <LogoSquare className="w-12 h-12 block" />
                    </div>
                    <div className="text-slate-800 font-regular text-[22px]">Olha quem tá de volta pro rolê.</div>
                  </div>

                  <form className="flex-1 flex flex-col justify-center gap-3 overflow-y-auto" onSubmit={submitLogin}>
                    <input
                      ref={emailRef}
                      type="email"
                      placeholder="Endereço de e-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-3 w-full"
                    />

                    <input
                      ref={passwordRef}
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-3 w-full"
                    />

                    <div className="w-full text-right mt-1">
                      <TextLink onClick={() => { /* TODO: forgot password flow */ }} className="text-sm">Esqueceu a senha?</TextLink>
                    </div>

                    {error && <div className="text-red-500 text-sm mt-1 text-center">{error}</div>}

                    <button type="submit" disabled={loading} className="mt-3 bg-[#6366F1] text-white py-3 rounded-full font-semibold hover:bg-[#4f46e5] transition w-full">
                      {loading ? (<Spinner className="h-5 w-5 text-white mx-auto" />) : 'Fazer login'}
                    </button>

                    <div className="mt-4 flex items-center gap-3">
                      <span className="flex-1 h-px bg-slate-200" />
                      <span className="text-sm text-slate-500">Ainda não tem conta?</span>
                      <span className="flex-1 h-px bg-slate-200" />
                    </div>

                    <div className="mb-5 text-center text-sm">
                        <TextLink onClick={() => setStep(2)} className="mb-0">Cria tua conta</TextLink>
                        <span className="text-slate-500 ml-0"> e vem curtir com a gente.</span>
                    </div>
                  </form>

                  <div className="pt-6 text-[12px] text-slate-400 text-center">Ao continuar, você concorda com os&nbsp;Termos de uso&nbsp;e confirma que leu nossa&nbsp;Política de privacidade e cookies.<br/><br/>Este site é protegido por reCAPTCHA e sujeito à&nbsp;Política de privacidade&nbsp;e aos&nbsp;Termos de serviço&nbsp;do Google.</div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="px-6 py-4">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-start gap-6 mb-5">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <LogoSquare className="w-12 h-12 block" />
                    </div>
                    <div className="text-slate-800 font-regular text-[22px]">Cria tua conta e vem curtir<br></br>com a gente.</div>
                  </div>

                  <form className="flex-1 flex flex-col gap-3 justify-center overflow-y-auto" onSubmit={submitSignup}>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <input ref={nomeRef} type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-3 w-full" />
                      <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={e => setSobrenome(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-3 w-full" />
                    </div>

                    <input type="email" placeholder="Endereço de e-mail" value={email} onChange={e => setEmail(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-3 w-full" />
                    <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-3 w-full" />

                    {/* password strength indicator */}
                    {step === 2 && (
                      (() => {
                        const s = calcPasswordStrength(password);
                        const pct = Math.round((s.score / 4) * 100);
                        return (
                          <div className="mt-2 w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="w-full mr-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className={`${s.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-xs w-16 text-right text-slate-600">{s.label}</div>
                            </div>
                            <div className="text-xs text-slate-400">Use no mínimo 8 caracteres, incluindo letras e números. Símbolos deixam a senha mais forte.</div>
                          </div>
                        );
                      })()
                    )}

                    {error && <div className="text-red-500 text-sm mt-1 text-center">{error}</div>}

                    <div className="flex items-start gap-3 mt-2">
                      <input id="marketing" type="checkbox" className="w-4 h-4 rounded border-gray-300 mt-1" />
                      <label htmlFor="marketing" className="text-sm text-slate-500">Sim, quero saber das ofertas e dos novos recursos. Sei que posso deixar de receber essas informações quando quiser.</label>
                    </div>

                    <button type="submit" disabled={loading} className="mt-4 bg-[#6366F1] text-white py-3 rounded-full font-semibold hover:bg-[#4f46e5] transition w-full">
                      {loading ? (<Spinner className="h-5 w-5 text-white mx-auto" />) : 'Criar conta'}
                    </button>

                    <div className="mt-6 flex items-center gap-3">
                      <span className="flex-1 h-px bg-slate-200" />
                      <span className="text-sm text-slate-500">Já tem uma conta?</span>
                      <span className="flex-1 h-px bg-slate-200" />
                    </div>

                    <div className="mt-0 text-center text-sm">
                      <TextLink onClick={() => setStep(1)}>Conecta</TextLink>
                      <span className="text-slate-500 ml-0"> aí e bora viver.</span>
                    </div>
                  </form>

                  <div className="pt-4 text-xs text-slate-400 text-center">Ao criar conta, você concorda com os Termos de uso e confirma que leu nossa Política de privacidade e cookies.</div>
                </div>
              </div>
            )}
          </div>

          {/* no pager dots: navigation is via buttons and back control to match Figma */}
        </div>
      </div>
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
