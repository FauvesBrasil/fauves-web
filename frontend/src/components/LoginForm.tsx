import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export const LoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
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
      <label className="block text-sm">
        <span>Senha</span>
        <input className="mt-1 w-full border px-2 py-1 rounded" value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
      </label>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button disabled={submitting} className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50">{submitting? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
};
