import React, { useState } from 'react';

const niveis = [
  { key: 'socio', label: 'Sócio', desc: 'Pode visualizar e gerenciar todo o evento' },
  { key: 'gerente', label: 'Gerente', desc: 'Gerencia tudo menos a conta bancária para repasses' },
  { key: 'financeiro', label: 'Financeiro', desc: 'Visualiza as informações financeiras do evento' },
  { key: 'visualizacao', label: 'Visualização', desc: 'Visualiza tudo mas não pode editar nada' },
  { key: 'checkin', label: 'Check-in', desc: 'Acessa apenas a área de Check-in' },
];

export default function AdicionarPessoaEquipeModal({ open, onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [nivel, setNivel] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        <button className="absolute top-4 left-4 text-zinc-400 hover:text-zinc-700 text-xl" onClick={onClose}>&times;</button>
        <div className="flex flex-col items-center mb-6">
          <span className="text-4xl mb-2">🧑‍💼</span>
          <h2 className="text-2xl font-bold text-indigo-950 mb-2">Adicionar pessoa</h2>
        </div>
        <label className="block text-sm font-semibold mb-2">E-mail do colaborador</label>
        <input
          type="email"
          className="w-full border rounded-lg px-4 py-4 mb-6 text-sm"
          placeholder="pessoa@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3">Defina um nível de acesso</label>
          <div className="flex flex-col gap-2">
            {niveis.map(n => (
              <button
                key={n.key}
                type="button"
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${nivel === n.key ? 'border-indigo-700 bg-indigo-50' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}
                onClick={() => setNivel(n.key)}
              >
                <span className={`w-5 h-5 min-w-[20px] min-h-[20px] rounded-full border flex items-center justify-center ${nivel === n.key ? 'border-indigo-700' : 'border-zinc-300'} bg-white`}>
                  {nivel === n.key ? <span className="w-3 h-3 rounded-full bg-indigo-700" /> : null}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold text-indigo-950 leading-tight">{n.label}</span>
                  <span className="text-xs text-zinc-500 leading-tight mt-1">{n.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <button
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-3 rounded-xl text-base mt-2"
          disabled={!email || !nivel}
          onClick={() => { onAdd?.({ email, nivel }); onClose(); }}
        >
          Adicionar colaborador
        </button>
      </div>
    </div>
  );
}
