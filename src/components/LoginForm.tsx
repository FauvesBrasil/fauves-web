import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const [showPassword, setShowPassword] = useState(false);
  const { login, loading, token } = useAuth();
  const [email, setEmail] = useState('dev@example.com');
  const [password, setPassword] = useState('dev123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const ok = await login(email, password);
    if (!ok) setError('Falha no login'); else if (onSuccess) onSuccess();
    setSubmitting(false);
  };

  if (loading) return <div>Carregando...</div>;
  if (token) return <div className="text-sm text-gray-600">Já autenticado</div>;

  return (
    <form onSubmit={handle} className="space-y-3 p-4 border rounded max-w-sm">
      <div className="text-lg font-medium">Login</div>
      <label className="block text-sm">
        <span>Email</span>
        <input className="mt-1 w-full border px-2 py-1 rounded" value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
      </label>
      <label className="block text-sm relative">
        <span>Senha</span>
        <input
          className="mt-1 w-full border px-2 py-1 rounded pr-10"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-2 top-7 text-gray-500 hover:text-gray-700"
          style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer'}}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? <Eye size={22} /> : <EyeOff size={22} />}
        </button>
      </label>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button disabled={submitting} className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50">{submitting? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
};
