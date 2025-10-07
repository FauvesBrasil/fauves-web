import React from 'react';
import { supabase } from '../lib/supabaseClient';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const [isClosing, setIsClosing] = React.useState(false);

  // Fecha com animação suave
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400); // tempo igual ao da animação
  };
  // Fecha apenas se clicar no overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const [isSignup, setIsSignup] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [nome, setNome] = React.useState('');
  const [sobrenome, setSobrenome] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  // Simples verificador de força
  function getPasswordStrength(pw: string) {
    if (!pw) return { label: '', value: 0, color: '#e5e7eb' };
    if (pw.length < 6) return { label: 'Fraca', value: 33, color: '#ef4444' };
    if (/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(pw)) return { label: 'Forte', value: 100, color: '#22c55e' };
    if (pw.length >= 8) return { label: 'Média', value: 66, color: '#eab308' };
    return { label: 'Fraca', value: 33, color: '#ef4444' };
  }

  if (!open) return null;
  return (
    <>
      {/* Overlay escurecido com fade */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fadeIn flex items-center justify-center"
        onClick={e => {
          if (e.target === e.currentTarget) handleClose();
        }}
        style={{ animation: 'fadeIn 0.4s' }}
      >
        <div
          className={`relative bg-white rounded-[20px] shadow-2xl drop-shadow-2xl p-8 w-[340px] flex flex-col gap-5 ${isClosing ? 'animate-slideUpOut' : 'animate-slideDown'}`}
          style={{ minWidth: 300, animation: `${isClosing ? 'slideUpOut' : 'slideDown'} 0.4s cubic-bezier(.4,0,.2,1)` }}
        >
        <h2 className="text-xl font-bold text-[#091747] mb-2">{isSignup ? 'Criar conta' : 'Entrar'}</h2>
        <form
          className="flex flex-col gap-4"
          onSubmit={async e => {
            e.preventDefault();
            setError(null);
            setSuccess(null);
            setLoading(true);
            if (!email || !password || (isSignup && (!nome || !sobrenome))) {
              setError('Preencha todos os campos.');
              setLoading(false);
              return;
            }
            if (isSignup) {
              // Signup flow
              const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    nome,
                    sobrenome,
                  },
                },
              });
              if (signUpError) {
                setError(signUpError.message);
              } else {
                setSuccess('Conta criada! Verifique seu e-mail para ativar.');
                setEmail('');
                setPassword('');
                setNome('');
                setSobrenome('');
              }
            } else {
              // Login flow
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (signInError) {
                setError(signInError.message);
              } else {
                setSuccess('Login realizado com sucesso!');
                setEmail('');
                setPassword('');
                handleClose();
              }
            }
            setLoading(false);
          }}
        >
          {/* Formulário restaurado sem animação */}
          <input
            type="email"
            placeholder="E-mail"
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#091747]"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Nome"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#091747]"
                autoComplete="given-name"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
              <input
                type="text"
                placeholder="Sobrenome"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#091747]"
                autoComplete="family-name"
                value={sobrenome}
                onChange={e => setSobrenome(e.target.value)}
              />
            </>
          )}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              className="border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#091747] w-full"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              tabIndex={0}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 m-0 text-gray-400 hover:text-[#091747] focus:outline-none"
              style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {!showPassword ? (
                // Ícone simples de olho aberto
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // Ícone simples de olho cortado
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19.125c-5.25 0-9.75-3-12-7.5a10.05 10.05 0 014.185-4.285" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.634 6.634A9.966 9.966 0 0112 4.875c5.25 0 9.75 3 12 7.5a9.97 9.97 0 01-4.198 4.291" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>
          {isSignup && (
            <div className="flex flex-col gap-1 mt-[-8px] mb-2">
              <span className="text-xs text-gray-500">Segurança da senha:</span>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${getPasswordStrength(password).value}%`,
                    background: getPasswordStrength(password).color,
                  }}
                />
              </div>
              <span
                className="text-xs font-bold transition-colors duration-500"
                style={{ color: getPasswordStrength(password).color }}
              >
                {getPasswordStrength(password).label}
              </span>
            </div>
          )}
          {error && <div className="text-red-500 text-sm font-bold mt-1">{error}</div>}
          {success && <div className="text-green-500 text-sm font-bold mt-1">{success}</div>}
          <button
            type="submit"
            className="bg-[#091747] text-white font-bold rounded-lg py-2 mt-2 hover:bg-[#2A2AD7] transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {isSignup ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
        <div className="flex flex-col gap-2 mt-2">
          {!isSignup && (
            <button
              type="button"
              className="text-sm text-[#2A2AD7] hover:underline text-left"
              onClick={() => alert('Recuperação de senha')}
            >
              Esqueci a senha
            </button>
          )}
          <button
            type="button"
            className={`text-sm ${isSignup ? 'text-[#091747]' : 'text-[#EF4118]'} hover:underline text-left`}
            onClick={() => setIsSignup(s => !s)}
          >
            {isSignup ? 'Já tenho uma conta' : 'Criar conta'}
          </button>
        </div>
        <button
          type="button"
          className="absolute top-3 right-4 text-xl text-gray-400 hover:text-[#EF4118]"
          onClick={handleClose}
          aria-label="Fechar"
        >
          ×
        </button>
        </div>
      </div>
      {/* Keyframes para animação */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUpOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-60px); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LoginModal;
