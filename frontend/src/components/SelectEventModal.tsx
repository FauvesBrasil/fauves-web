import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/context/OrganizationContext';

// Exemplo de eventos mockados
const mockEvents = [
  { id: 1, name: 'Menos é mais', date: '20 de jun. de 2024 • 16:00', img: null },
  { id: 2, name: 'Na Lapa', date: '16 de fev. de 2025 • 10:00', img: null },
  { id: 3, name: 'Na Lapa 2025', date: '11 de mai. de 2025 • 10:00', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=48&h=48' },
  { id: 4, name: 'Rave Vai Pra BC', date: '31 de out. de 2025 • 22:00', img: null },
];

export default function SelectEventModal({ open, onClose, onConfirm }) {
  const { selectedOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  useEffect(() => {
    // reset selection / search when modal opens
    if (open) {
      setSearch('');
      setSelectedId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Load events scoped to the currently selected organization
    const abort = { ok: false } as any;
    (async () => {
      setLoading(true);
      try {
        if (!selectedOrg?.id) {
          setEvents([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/organization/${selectedOrg.id}/events`);
        if (!res.ok) { setEvents([]); setLoading(false); return; }
        const list = await res.json();
        if (!abort.ok) setEvents(Array.isArray(list) ? list : []);
      } catch (e) {
        setEvents([]);
      } finally { if (!abort.ok) setLoading(false); }
    })();
    return () => { abort.ok = true; };
  }, [open, selectedOrg?.id]);

  const filteredEvents = events.filter(e => (e.name || e.title || '').toLowerCase().includes(search.toLowerCase()));

  const handleConfirm = () => {
    if (!selectedId) return onConfirm([]);
    // keep onConfirm contract as array for compatibility; single-selection enforced
    const selectedEv = events.find(e => String(e.id) === String(selectedId));
    // call onConfirm with the id array and also pass the selected event object as a second arg
    // (callsites that only expect the ids will ignore the extra param)
    onConfirm([String(selectedId)], selectedEv ? { id: selectedEv.id, name: selectedEv.name || selectedEv.title } : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent hideClose={false}>
        <div className="w-full max-w-md p-2 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b mb-4 pb-3">
            <h3 className="text-lg font-bold">Eventos</h3>
            <div className="text-sm text-zinc-500">{selectedOrg ? selectedOrg.name : 'Selecione uma organização'}</div>
          </div>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar pelo nome do evento"
            className="mb-4"
          />
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-zinc-500">Carregando eventos…</div>
            ) : !selectedOrg ? (
              <div className="border border-dashed rounded-lg p-6 text-center text-[#231942] text-sm">Selecione uma organização no cabeçalho para listar eventos.</div>
            ) : filteredEvents.length === 0 ? (
              <div className="border border-dashed rounded-lg p-6 text-center text-[#231942] text-sm">Nenhum evento encontrado</div>
            ) : filteredEvents.map(ev => (
              <label key={ev.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-indigo-50 cursor-pointer">
                <input type="radio" name="select-event" checked={String(selectedId) === String(ev.id)} onChange={() => setSelectedId(ev.id)} />
                {ev.image || ev.img ? <img src={ev.image || ev.img} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"><span className="text-xs text-gray-500">IMG</span></div>}
                <div className="flex flex-col">
                  <span className="font-bold text-[#231942] text-sm">{ev.name || ev.title}</span>
                  <span className="text-xs text-[#231942]">{ev.date || ev.startsAt || ''}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-300 text-slate-600 hover:bg-zinc-100 text-sm font-medium">Cancelar</button>
            <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 text-sm font-semibold" disabled={!selectedId}>Executar relatório</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
