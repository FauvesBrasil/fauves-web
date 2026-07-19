import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { apiUrl } from '@/lib/apiBase';

interface SignInModalV2Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preventClose?: boolean;
  pageMode?: boolean;
  redirectPath?: string;
}

const LumaSignInStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
    .signin-theme-root-modal {
      --page-bg-color: transparent;
      --card-bg-color: #ffffff;
      --input-bg-color: #ffffff;
      --input-border-color: rgba(19, 21, 23, 0.16);
      --input-hover-bg-color: rgba(19, 21, 23, 0.04);
      --input-focus-bg-color: #ffffff;
      --border-radius: 12px;
      --divider-color: rgba(19, 21, 23, 0.08);
      --secondary-color: #8c8c8c;
      --opacity-light: rgba(19, 21, 23, 0.05);
      --opacity-second-light: rgba(19, 21, 23, 0.12);
      --text-main: #131517;
      --text-muted: rgba(19, 21, 23, 0.6);

      --primary-button-color: #ffffff;
      --primary-button-bg-color: #131517;
      --light-button-color: var(--text-main);
      --light-button-bg-color: rgba(19, 21, 23, 0.04);
      --input-border-thickness: 1px;
      --transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      --input-padding: 0.6rem 1rem;
      --input-font-size: 14.5px;
      --input-element-gap: 0.5rem;
      --input-height: 42px;
      --font-weight-medium: 500;

      color: var(--text-main) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      letter-spacing: -0.011em;
    }

    /* Proteção absoluta contra temas escuros herdados */
    .signin-theme-root-modal .onboarding-card {
      background: #ffffff !important;
      color: #131517 !important;
      --panel-padding: 1.25rem;
      padding: var(--panel-padding);
      border-radius: 1.25rem;
      flex: 1;
      width: 100%;
      max-width: 380px;
      height: fit-content;
      position: relative;
      overflow: visible;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08) !important;
    }
    
    .signin-theme-root-modal .onboarding-card.show-border:after {
      content: "";
      border: 1px solid rgba(19, 21, 23, 0.12) !important;
      pointer-events: none;
      border-radius: calc(1.25rem + 1px);
      position: absolute;
      top: -1px; bottom: -1px; left: -1px; right: -1px;
    }

    /* Animation Icon */
    .signin-theme-root-modal .icon-door {
      width: 4rem; height: 4rem;
      color: #131517 !important;
      background: rgba(19, 21, 23, 0.05) !important;
      border-radius: 1000px;
      justify-content: center;
      align-items: center;
      display: flex;
      margin-bottom: 1rem;
    }
    .signin-theme-root-modal .icon-door svg { width: 2.25rem; height: 2.25rem; }

    /* Inputs resilientes */
    .signin-theme-root-modal .lux-input {
      background: #ffffff !important;
      border: 1px solid rgba(19, 21, 23, 0.16) !important;
      border-radius: 12px !important;
      color: #131517 !important;
      padding: 0.75rem 1rem !important;
      width: 100% !important;
      font-size: 15px !important;
      outline: none !important;
      transition: all 0.2s !important;
    }
    .signin-theme-root-modal .lux-input:hover { background: rgba(19, 21, 23, 0.04) !important; }
    .signin-theme-root-modal .lux-input:focus { border-color: rgba(19, 21, 23, 0.4) !important; box-shadow: 0 0 0 3px rgba(19, 21, 23, 0.05) !important; }
    .signin-theme-root-modal .lux-input::placeholder { color: rgba(19, 21, 23, 0.4) !important; }
    
    .signin-theme-root-modal .lux-input-label {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: rgba(19, 21, 23, 0.6) !important;
      margin-bottom: 0.5rem !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }

    .signin-theme-root-modal .lux-link-btn {
      background: none !important;
      border: none !important;
      color: rgba(19, 21, 23, 0.6) !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      gap: 0.25rem !important;
      padding: 0 !important;
    }
    .signin-theme-root-modal .lux-link-btn:hover { color: #131517 !important; }

    /* Buttons Native */
    .signin-theme-root-modal .lux-button {
      font-weight: 500 !important;
      border-radius: 999px !important;
      white-space: nowrap !important;
      outline-offset: .125rem !important;
      outline: 2px solid transparent !important;
      justify-content: center !important;
      align-items: center !important;
      display: flex !important;
      min-width: 0 !important;
      max-width: 100% !important;
      position: relative !important;
      font-size: 14.5px !important;
      padding: 0.6rem 1rem !important;
      height: 42px !important;
      width: fit-content !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      cursor: pointer !important;
      background-color: transparent !important;
      border: 1px solid transparent !important;
      color: inherit !important;
      gap: 0.5rem !important;
    }

    .signin-theme-root-modal .lux-button.full-width { width: 100% !important; }

    .signin-theme-root-modal .lux-button.solid {
      border: 1px solid !important;
    }

    .signin-theme-root-modal .lux-button.primary.solid {
      color: #ffffff !important;
      background-color: #131517 !important;
      border-color: #131517 !important;
    }
    .signin-theme-root-modal .lux-button.primary:hover { opacity: 0.85 !important; }

    .signin-theme-root-modal .lux-button.light.solid {
      color: #131517 !important;
      background-color: rgba(19, 21, 23, 0.04) !important;
      border-color: transparent !important;
    }
    .signin-theme-root-modal .lux-button.light.solid:hover { background-color: rgba(19, 21, 23, 0.08) !important; }
    
    .signin-theme-root-modal .bottom-divider {
      margin: 1.5rem calc(-1 * var(--panel-padding)) 1.5rem !important;
      border-bottom: 1px solid rgba(19, 21, 23, 0.08) !important;
    }

    .signin-theme-root-modal .otp-box-container {
      display: flex !important;
      gap: 8px !important;
      justify-content: space-between !important;
      margin-bottom: 0.5rem !important;
    }
    .signin-theme-root-modal .otp-box {
      width: 46px !important;
      height: 52px !important;
      border: 1px solid rgba(19, 21, 23, 0.16) !important;
      border-radius: 12px !important;
      font-size: 22px !important;
      font-weight: 600 !important;
      text-align: center !important;
      background: transparent !important;
      color: #131517 !important;
      transition: all 0.2s !important;
      outline: none !important;
      padding: 0 !important;
    }
    .signin-theme-root-modal .otp-box:focus {
      border-color: rgba(19, 21, 23, 0.4) !important;
      box-shadow: 0 0 0 3px rgba(19, 21, 23, 0.05) !important;
    }

    .signin-theme-root-modal h3 {
      color: #131517 !important;
    }

    /* Dark, embedded version used by the dedicated sign-in page. */
    .signin-theme-root-modal.page-mode {
      position: relative !important;
      inset: auto !important;
      z-index: auto !important;
      width: 100% !important;
      padding: 0 !important;
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      color-scheme: dark !important;
      --text-main: #f8f8f8;
      --text-muted: rgba(255, 255, 255, 0.62);
      --input-bg-color: rgba(255, 255, 255, 0.035);
      --input-border-color: rgba(255, 255, 255, 0.16);
      --divider-color: rgba(255, 255, 255, 0.1);
    }

    .signin-theme-root-modal.page-mode .onboarding-card {
      max-width: 364px !important;
      padding: 20px !important;
      border-radius: 20px !important;
      background: rgba(47, 42, 44, 0.82) !important;
      color: #f8f8f8 !important;
      box-shadow: 0 28px 90px rgba(0, 0, 0, 0.3) !important;
      backdrop-filter: blur(24px) saturate(112%) !important;
      -webkit-backdrop-filter: blur(24px) saturate(112%) !important;
    }

    .signin-theme-root-modal.page-mode .onboarding-card.show-border:after {
      border-color: rgba(255, 255, 255, 0.16) !important;
      border-radius: 21px !important;
    }

    .signin-theme-root-modal.page-mode .icon-door {
      width: 64px !important;
      height: 64px !important;
      color: rgba(255, 255, 255, 0.82) !important;
      background: rgba(255, 255, 255, 0.09) !important;
      margin-bottom: 16px !important;
    }

    .signin-theme-root-modal.page-mode h3 {
      color: #ffffff !important;
      letter-spacing: -0.035em !important;
    }

    .signin-theme-root-modal.page-mode .lux-input {
      height: 40px !important;
      padding: 0 13px !important;
      border-radius: 10px !important;
      border-color: rgba(255, 255, 255, 0.17) !important;
      background: rgba(255, 255, 255, 0.025) !important;
      color: #ffffff !important;
    }
    .signin-theme-root-modal.page-mode .lux-input:hover {
      background: rgba(255, 255, 255, 0.055) !important;
    }
    .signin-theme-root-modal.page-mode .lux-input:focus {
      background: rgba(255, 255, 255, 0.06) !important;
      border-color: rgba(255, 255, 255, 0.42) !important;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.07) !important;
    }
    .signin-theme-root-modal.page-mode .lux-input::placeholder {
      color: rgba(255, 255, 255, 0.34) !important;
    }

    .signin-theme-root-modal.page-mode .lux-input-label,
    .signin-theme-root-modal.page-mode .lux-link-btn {
      color: rgba(255, 255, 255, 0.68) !important;
    }
    .signin-theme-root-modal.page-mode .lux-link-btn:hover {
      color: #ffffff !important;
    }

    .signin-theme-root-modal.page-mode .lux-button {
      height: 40px !important;
      border-radius: 9px !important;
    }
    .signin-theme-root-modal.page-mode .lux-button.primary.solid {
      color: #19191b !important;
      background: rgba(255, 255, 255, 0.96) !important;
      border-color: rgba(255, 255, 255, 0.96) !important;
    }
    .signin-theme-root-modal.page-mode .lux-button.primary:hover {
      opacity: 1 !important;
      background: #ffffff !important;
      transform: translateY(-1px);
    }
    .signin-theme-root-modal.page-mode .lux-button.light.solid {
      color: rgba(255, 255, 255, 0.76) !important;
      background: rgba(255, 255, 255, 0.09) !important;
      border-color: transparent !important;
    }
    .signin-theme-root-modal.page-mode .lux-button.light.solid:hover {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.14) !important;
    }
    .signin-theme-root-modal.page-mode .lux-button:disabled {
      cursor: not-allowed !important;
      opacity: 0.5 !important;
      transform: none !important;
    }

    .signin-theme-root-modal.page-mode .bottom-divider {
      border-color: rgba(255, 255, 255, 0.1) !important;
      margin-top: 16px !important;
      margin-bottom: 16px !important;
    }

    .signin-theme-root-modal.page-mode .otp-box {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.035) !important;
      border-color: rgba(255, 255, 255, 0.17) !important;
    }
    .signin-theme-root-modal.page-mode .otp-box:focus {
      border-color: rgba(255, 255, 255, 0.42) !important;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.07) !important;
    }

    @media (max-width: 480px) {
      .signin-theme-root-modal.page-mode .onboarding-card {
        max-width: 100% !important;
      }
    }

    `
  }} />
);

export default function SignInModalV2({
  open,
  onClose,
  onSuccess,
  preventClose = false,
  pageMode = false,
  redirectPath,
}: SignInModalV2Props) {
  const { requestOtp, loginWithOtp } = useAuth();

  const [credentialType, setCredentialType] = useState<'email' | 'phone'>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [securityCode, setSecurityCode] = useState('');

  const [step, setStep] = useState<'identify' | 'verify'>('identify');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      const newOtp = securityCode.padEnd(6, ' ').split('');
      for (let i = 0; i < pasted.length && index + i < 6; i++) {
        newOtp[index + i] = pasted[i];
      }
      setSecurityCode(newOtp.join('').trim());
      const nextIndex = Math.min(index + value.length, 5);
      otpRefs.current[nextIndex]?.focus();
      handleVerifySubmitDirect(newOtp.join('').trim());
      return;
    }

    const chars = securityCode.padEnd(6, ' ').split('');
    chars[index] = value || ' ';
    const newCode = chars.join('').trimEnd();
    setSecurityCode(newCode);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newCode.replace(/\s/g, '').length === 6) {
      handleVerifySubmitDirect(newCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, preventClose, onClose]);

  const handleIdentifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) return;
    setLoading(true); setErrorMsg('');
    try {
      const res = await requestOtp(emailOrPhone);
      if (res.success) {
        setStep('verify');
      } else {
        setErrorMsg(res.message || 'Erro ao processar solicitação.');
      }
    } catch {
      setErrorMsg('Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmitDirect = async (code: string) => {
    if (!code || code.length < 6) return;
    setLoading(true); setErrorMsg('');

    try {
      const res = await loginWithOtp(emailOrPhone, code);
      if (res.success) {
        onSuccess?.();
      } else {
        setErrorMsg(res.message || 'Código inválido ou expirado.');
        setSecurityCode('');
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      setErrorMsg('Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifySubmitDirect(securityCode);
  };

  const handleGoogleLogin = () => {
    const destination = redirectPath || '/events';
    try {
      window.sessionStorage.setItem('FAUVES_OAUTH_REDIRECT', destination);
    } catch { /* storage can be unavailable in private contexts */ }

    const oauthUrl = apiUrl('/api/auth/google');
    const width = 600;
    const height = 700;
    const left = Math.max(0, Math.round((window.screen.width - width) / 2));
    const top = Math.max(0, Math.round((window.screen.height - height) / 2));
    const popup = window.open(oauthUrl, 'fauves_oauth', `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`);

    if (!popup) {
      window.location.assign(oauthUrl);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup) return;
      if (event.data?.type !== 'fauves_oauth' || !event.data?.token) return;
      try {
        window.localStorage.setItem('AUTH_TOKEN_V1', event.data.token);
        window.sessionStorage.setItem('FAUVES_LOGIN_WELCOME_PENDING', 'true');
        window.sessionStorage.removeItem('FAUVES_OAUTH_REDIRECT');
      } catch { /* AuthProvider will still validate persisted auth when possible */ }
      window.removeEventListener('message', handleMessage);
      try { popup.close(); } catch { /* popup may already be closed */ }
      window.location.assign(destination);
    };

    window.addEventListener('message', handleMessage);

    const popupWatcher = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(popupWatcher);
      window.removeEventListener('message', handleMessage);
    }, 500);
  };

  if (!open) return null;

  return (
    <div 
      className={`${pageMode ? 'page-mode' : 'fixed inset-0 bg-black/60 backdrop-blur-[8px] z-[9999] p-4'} flex items-center justify-center signin-theme-root-modal`}
      data-theme-dark={pageMode ? 'true' : 'false'}
      style={{ colorScheme: pageMode ? 'dark' : 'light' }}
      onClick={(e) => { if (e.target === e.currentTarget && !preventClose) onClose(); }}
    >
      <LumaSignInStyles />
      
      <div className="onboarding-card show-border relative">
        {!preventClose && (
          <button 
            type="button"
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
          >
            <X size={20} />
          </button>
        )}

        <div className="icon-door" style={{ display: step === 'verify' ? 'none' : 'flex' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none">
            <defs>
              <path id="door-frame" d="M11.5 13.5C11.5 9.73 11.5 7.84 12.67 6.67C13.84 5.5 15.73 5.5 19.5 5.5C23.27 5.5 25.16 5.5 26.33 6.67C27.5 7.84 27.5 9.73 27.5 13.5C27.5 17.27 27.5 18.94 27.5 22.71C27.5 26.48 27.5 28.37 26.33 29.54C25.16 30.71 23.27 30.71 19.5 30.71C15.73 30.71 13.84 30.71 12.67 29.54C11.5 28.37 11.5 26.48 11.5 22.71C11.5 18.94 11.5 17.27 11.5 13.5Z" />
              <path id="door-anim" d="M17.5 13.90C17.5 12.28 17.40 10.62 18.56 9.37C19.12 8.77 19.91 8.41 21.51 7.70C23.70 6.71 24.80 6.21 25.68 6.46C27.5 6.97 27.5 9.80 27.5 11.57C27.5 22.5 27.5 13 27.5 24.68C27.5 26.45 27.68 28.44 26.52 29.90C25.84 30.75 24.78 31.23 22.65 32.18C21.41 32.74 19.40 34.04 18.14 32.87C17.5 32.28 17.5 31.14 17.5 28.85C17.5 16 17.5 27.5 17.5 13.90Z" />
            </defs>
            <use href="#door-anim" fill="currentColor" fillOpacity=".133" />
            <use href="#door-frame" fill="none" stroke="currentColor" strokeWidth="2" />
            <use href="#door-anim" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <AnimatePresence mode="wait">
          {step === 'identify' && (
            <motion.div key="step-identify" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.5rem', marginTop: 0 }}>Bem-vindo à Fauves</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>Por favor, faça login ou cadastre-se abaixo.</div>

              <form onSubmit={handleIdentifySubmit}>
                <label className="lux-input-label">
                  <span>{credentialType === 'email' ? 'Email' : 'Telefone'}</span>
                  <button
                    type="button"
                    className="lux-link-btn"
                    onClick={() => {
                      setCredentialType(credentialType === 'email' ? 'phone' : 'email');
                      setEmailOrPhone('');
                    }}
                  >
                    {credentialType === 'email' ? (
                      <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" fillRule="evenodd" d="M7.62 1.5h.76c.92 0 1.521.001 1.98.039.44.036.616.098.712.146.32.163.58.423.743.743.048.096.11.272.146.712C12 3.6 12 4.2 12 5.12v5.76c0 .92-.001 1.521-.039 1.98-.036.44-.098.616-.146.712a1.7 1.7 0 0 1-.743.743c-.096.048-.271.11-.712.146-.459.038-1.06.039-1.98.039h-.76c-.92 0-1.521-.001-1.98-.039-.44-.036-.616-.098-.712-.146a1.7 1.7 0 0 1-.743-.743c-.048-.096-.11-.271-.146-.712C4 12.4 4 11.8 4 10.88V5.12c0-.92.001-1.521.039-1.98.036-.44.098-.616.146-.712a1.7 1.7 0 0 1 .743-.743c.096-.048.272-.11.712-.146C6.1 1.5 6.7 1.5 7.62 1.5M2.5 5.12c0-1.792 0-2.688.349-3.373A3.2 3.2 0 0 1 4.247.35C4.932 0 5.827 0 7.62 0h.76c1.792 0 2.688 0 3.373.349a3.2 3.2 0 0 1 1.398 1.398c.349.685.349 1.58.349 3.373v5.76c0 1.792 0 2.688-.349 3.373a3.2 3.2 0 0 1-1.398 1.398C11.068 16 10.173 16 8.38 16h-.76c-1.792 0-2.688 0-3.373-.349a3.2 3.2 0 0 1-1.398-1.398c-.349-.685-.349-1.58-.349-3.373zM7 2.75a.75.75 0 0 0 0 1.5h2a.75.75 0 0 0 0-1.5z"></path></svg> Usar Telefone</>
                    ) : (
                      <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Usar Email</>
                    )}
                  </button>
                </label>
                <input
                  type={credentialType === 'email' ? 'email' : 'tel'}
                  className="lux-input"
                  placeholder={credentialType === 'email' ? 'voce@email.com' : '(00) 00000-0000'}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  required autoFocus
                />

                {errorMsg && (
                  <div style={{ color: '#ff4d4f', fontSize: '13px', textAlign: 'center', marginTop: '1rem', marginBottom: '-0.5rem' }}>
                    {errorMsg}
                  </div>
                )}

                <button type="submit" disabled={loading} className="lux-button primary solid full-width" style={{ marginTop: '1.5rem' }}>
                  {loading ? 'Carregando...' : (credentialType === 'email' ? 'Continuar com Email' : 'Continuar com Telefone')}
                </button>

                <div className="bottom-divider"></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <button type="button" className="lux-button light solid full-width" onClick={handleGoogleLogin}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16"><path fill="currentColor" d="M500 261.8C500 403.3 403.1 504 260 504 122.8 504 12 393.2 12 256S122.8 8 260 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C270.5 52.6 106.3 116.6 106.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H260v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4"></path></svg>
                    Entrar com o Google
                  </button>
                  <button type="button" className="lux-button light solid full-width" disabled title="Passkey estará disponível em breve">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M6.617 7.064a2.5 2.5 0 0 1-1.388-.406 3 3 0 0 1-1.014-1.102 3.2 3.2 0 0 1-.381-1.553 3.03 3.03 0 0 1 1.403-2.604A2.54 2.54 0 0 1 6.617 1q.747 0 1.377.392t1.015 1.07q.384.676.384 1.526 0 .864-.38 1.564a3 3 0 0 1-1.015 1.106 2.5 2.5 0 0 1-1.38.406Zm-4.636 6.424q-.57 0-.894-.253a.83.83 0 0 1-.322-.692q0-.675.407-1.41t1.168-1.38 1.842-1.052q1.08-.405 2.428-.406.937 0 1.747.209a6.8 6.8 0 0 1 1.468.553q.037.768.403 1.424t.996 1.073v1.934zm11.06-6.826q.614 0 1.124.3t.81.806q.3.504.3 1.12 0 .718-.425 1.286-.426.567-1.216.89l.893.893a.22.22 0 0 1 .074.158q0 .084-.059.142l-.916.901.652.652a.2.2 0 0 1 .066.147.2.2 0 0 1-.066.146l-1.098 1.099a.19.19 0 0 1-.143.062.2.2 0 0 1-.136-.062l-.586-.586a.35.35 0 0 1-.11-.242v-3.391a2.26 2.26 0 0 1-1.021-.824 2.2 2.2 0 0 1-.385-1.27q0-.617.3-1.121.3-.506.81-.806.509-.3 1.132-.3m-.008 1.025a.66.66 0 0 0-.487.201.66.66 0 0 0-.201.487q0 .285.205.488a.67.67 0 0 0 .483.201.67.67 0 0 0 .484-.201.66.66 0 0 0 .205-.488.66.66 0 0 0-.205-.487.67.67 0 0 0-.484-.201"></path></svg>
                    Entrar com Passkey
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div key="step-verify" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button type="button" onClick={() => setStep('identify')} className="lux-button light" style={{ width: '36px', height: '36px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', background: 'var(--input-bg-color)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '0.5rem', marginTop: 0 }}>Digite o Código</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Por favor, digite o código de 6 dígitos que enviamos para <strong>{emailOrPhone}</strong>.
              </div>

              <form onSubmit={handleVerifySubmit}>
                <div className="otp-box-container">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      className="otp-box"
                      value={securityCode[index] || ''}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingBottom: '1rem' }}>
                  <button type="button" className="lux-button light solid" style={{ background: 'var(--input-bg-color)', padding: '0.4rem 0.6rem', border: '1px solid var(--input-border-color)', borderRadius: '8px', gap: '0.4rem', color: 'var(--text-main)' }} onClick={() => navigator.clipboard.readText().then(t => handleOtpChange(0, t))}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Colar Código
                  </button>
                  <button type="button" className="lux-link-btn" style={{ fontWeight: 400 }}>Reenviar código em 58s</button>
                </div>

                {errorMsg && <div style={{ color: '#ff4d4f', fontSize: '13px', textAlign: 'center', marginBottom: '1rem' }}>{errorMsg}</div>}
                {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>Verificando...</div>}
                <button type="submit" disabled={loading || securityCode.trim().length < 6} style={{ display: 'none' }}>
                  Entrar
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
