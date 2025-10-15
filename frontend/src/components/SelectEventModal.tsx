import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// Exemplo de eventos mockados
const mockEvents = [
  { id: 1, name: 'Menos é mais', date: '20 de jun. de 2024 • 16:00', img: null },
  { id: 2, name: 'Na Lapa', date: '16 de fev. de 2025 • 10:00', img: null },
  { id: 3, name: 'Na Lapa 2025', date: '11 de mai. de 2025 • 10:00', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=48&h=48' },
  { id: 4, name: 'Rave Vai Pra BC', date: '31 de out. de 2025 • 22:00', img: null },
];

export default function SelectEventModal({ open, onClose, onConfirm }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const filteredEvents = mockEvents.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const handleToggle = (id) => {
    setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]);
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent hideClose={false}>
        <div className="w-full max-w-md p-2 sm:p-6 space-y-4">
          <div className="flex gap-8 border-b mb-4">
            <button className="pb-3 text-base font-bold text-[#231942] border-b-2 border-[#6C63FF]">Eventos ({mockEvents.length})</button>
            <button className="pb-3 text-base font-bold text-[#6C63FF]">Selecionados ({selected.length})</button>
          </div>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar pelo nome do evento"
            className="mb-4"
          />
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="border border-dashed rounded-lg p-6 text-center text-[#231942] text-sm">Nenhum evento</div>
            ) : filteredEvents.map(ev => (
              <label key={ev.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-indigo-50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(ev.id)} onChange={() => handleToggle(ev.id)} />
                {ev.img ? <img src={ev.img} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"><span className="text-xs text-gray-500">IMG</span></div>}
                <div className="flex flex-col">
                  <span className="font-bold text-[#231942] text-sm">{ev.name}</span>
                  <span className="text-xs text-[#231942]">{ev.date}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-300 text-slate-600 hover:bg-zinc-100 text-sm font-medium">Cancelar</button>
            <button onClick={() => onConfirm(selected)} className="px-4 py-2 rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 text-sm font-semibold" disabled={selected.length === 0}>Executar relatório</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
