import * as React from "react";
import { useAuth } from '@/context/AuthContext';

const ChangeEmail: React.FC = () => {
  const [editing, setEditing] = React.useState(false);
  const { user } = useAuth();
  const [email, setEmail] = React.useState(user?.email || '');
  const [newEmail, setNewEmail] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  const [success, setSuccess] = React.useState<string|null>(null);

  React.useEffect(() => {
    setEmail(user?.email || '');
  }, [user]);

  async function handleSave() {
    setError(null); setSuccess(null);
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Digite um e-mail válido.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/account-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      if (!res.ok) {
        let msg = `Erro ao salvar (status ${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        setError(msg);
        setSaving(false);
        return;
      }
      setEmail(newEmail);
      setEditing(false);
      setSuccess('E-mail alterado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Falha de rede ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-[#091747] dark:text-white mb-2">Alterar e-mail</h1>
      <hr className="my-6 border-gray-200" />

      <div className="mb-6">
        <h2 className="text-base font-bold text-[#091747] dark:text-white mb-2">Endereço de e-mail da conta</h2>

        {!editing ? (
          <span className="text-base text-[#091747] dark:text-white">{email}</span>
        ) : (
          <input
            type="email"
            className={`border px-4 py-2 text-base w-full rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
            value={newEmail}
            onChange={e => { setNewEmail(e.target.value); setError(null); }}
            placeholder="Novo e-mail"
            disabled={saving}
            autoFocus
          />
        )}
      </div>

      {!editing ? (
        <button type="button" className="bg-[#2A2AD7] text-white font-bold px-6 py-2 rounded-lg text-base shadow hover:bg-[#091747] transition-colors" onClick={() => { setEditing(true); setNewEmail(email); setError(null); }}>
          Alterar
        </button>
      ) : (
        <div className="flex gap-3">
          <button type="button" className="bg-[#2A2AD7] text-white font-bold px-6 py-2 rounded-lg text-base shadow hover:bg-[#091747] transition-colors flex items-center justify-center" disabled={saving} onClick={handleSave}>
            {saving ? <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : null}
            Salvar
          </button>
          <button type="button" className="bg-gray-200 text-[#091747] dark:text-white font-bold px-6 py-2 rounded-lg text-base shadow hover:bg-gray-300 transition-colors" disabled={saving} onClick={() => { setEditing(false); setError(null); }}>
            Cancelar
          </button>
        </div>
      )}

      {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
      {success && <div className="text-green-600 mt-2 text-sm">{success}</div>}
    </>
  );
};

export default ChangeEmail;

