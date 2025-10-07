import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Plus } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface CollectionDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  organizationOptions: { id: string; name: string }[];
  initialData?: {
    id: string;
    title: string;
    description?: string | null;
    bannerImage?: string | null;
    organizerId?: string | null;
  } | null;
  onClose: () => void;
  onSaved: (collection: any) => void;
  onDelete?: (id: string) => Promise<void>;
  loadEvents?: (collectionId: string) => Promise<any[]>;
  allUserEvents?: { id: string; name: string; startDate?: string }[];
  onAddEvent?: (collectionId: string, eventId: string) => Promise<void>;
  onRemoveEvent?: (collectionId: string, eventId: string) => Promise<void>;
}

const CollectionDrawer: React.FC<CollectionDrawerProps> = ({
  open,
  mode,
  organizationOptions,
  initialData,
  onClose,
  onSaved,
  onDelete,
  loadEvents,
  allUserEvents,
  onAddEvent,
  onRemoveEvent,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orgId, setOrgId] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [published, setPublished] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setErrorMsg('');
      setSuccessMsg('');
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setOrgId(initialData.organizerId || organizationOptions[0]?.id || '');
        if (initialData.bannerImage) setBannerPreview(initialData.bannerImage);
        setPublished((initialData as any).published === true);
      } else {
        setTitle('');
        setDescription('');
        setOrgId(organizationOptions[0]?.id || '');
        setBannerFile(null);
        setBannerPreview('');
        setPublished(false);
      }
      if (mode === 'edit' && initialData?.id && loadEvents) {
        setEventsLoading(true);
        loadEvents(initialData.id).then(list => setEvents(list || [])).finally(()=> setEventsLoading(false));
      } else {
        setEvents([]);
      }
    }
  }, [open, initialData, mode, organizationOptions, loadEvents]);

  if (!open) return null;

  const disabled = loading || !title.trim() || !orgId;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBannerFile(f);
    setBannerPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (disabled) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let uploadedUrl: string | undefined = initialData?.bannerImage || undefined;
      if (bannerFile) {
        try {
          const fd = new FormData();
            fd.append('file', bannerFile);
            // endpoint esperado: /api/upload (baseado no upload.controller.ts) -> deve retornar algo tipo { url: "..." }
            const up = await fetch('/api/upload', { method: 'POST', body: fd });
            if (up.ok) {
              const upJson = await up.json();
              uploadedUrl = upJson?.url || upJson?.path || uploadedUrl;
            } else {
              console.warn('[CollectionDrawer] upload falhou, usando preview local');
              uploadedUrl = bannerPreview;
            }
        } catch (e) {
          console.warn('[CollectionDrawer] upload erro, fallback preview', e);
          uploadedUrl = bannerPreview;
        }
      }
      let res: Response;
      const payload = { title: title.trim(), description: description.trim() || null, bannerImage: uploadedUrl, published };
      if (mode === 'create') {
        res = await fetch(`/api/organization/${orgId}/collections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`/api/collection/${initialData?.id}/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      let json: any = null;
      try { json = await res.json(); } catch(_) {}
      if (!res.ok) {
        console.error('[CollectionDrawer] create/update failed', { status: res.status, json });
        setErrorMsg(`Falha ao salvar (HTTP ${res.status}). ${json?.error || json?.message || ''}`.trim());
        return;
      }
      if (mode === 'create') {
        // Aceitar vários formatos: {id,..} ou {collection:{id,..}}
        const created = json?.id ? json : (json?.collection?.id ? json.collection : null);
        if (created?.id) {
          // Garantir organizerId no objeto para listagem posterior
            if (!created.organizerId) created.organizerId = orgId;
          onSaved(created);
          setSuccessMsg('Coleção criada.');
        } else {
          console.error('[CollectionDrawer] Unexpected create payload', json);
          setErrorMsg(`Resposta inesperada do servidor na criação. Payload: ${JSON.stringify(json)}`);
        }
      } else {
        const updated = json?.updated ? (json.collection || json) : null;
        if (updated?.id) {
          if (!updated.organizerId) updated.organizerId = initialData?.organizerId || orgId;
          if (typeof updated.published === 'boolean') setPublished(updated.published);
          onSaved(updated);
          setSuccessMsg('Alterações salvas.');
        } else {
          console.error('[CollectionDrawer] Unexpected update payload', json);
          setErrorMsg(`Não foi possível atualizar (payload inesperado). Payload: ${JSON.stringify(json)}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSelf = async () => {
    if (!initialData?.id || !onDelete) return;
    if (!confirm('Excluir esta coleção?')) return;
    await onDelete(initialData.id);
    onClose();
  };

  const attachEvent = async (eventId: string) => {
    if (!initialData?.id || !onAddEvent) return;
    setAdding(eventId);
    try {
      await onAddEvent(initialData.id, eventId);
      // reload events
      if (loadEvents) {
        const list = await loadEvents(initialData.id);
        setEvents(list || []);
      }
    } finally { setAdding(null); }
  };

  const detachEvent = async (eventId: string) => {
    if (!initialData?.id || !onRemoveEvent) return;
    setRemoving(eventId);
    try {
      await onRemoveEvent(initialData.id, eventId);
      if (loadEvents) {
        const list = await loadEvents(initialData.id);
        setEvents(list || []);
      }
    } finally { setRemoving(null); }
  };

  const selectedEventIds = new Set(events.map(e => e.id));
  const addableEvents = (allUserEvents || []).filter(e => !selectedEventIds.has(e.id));

  const formatEventDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const day = d.toLocaleDateString('pt-BR', { day: '2-digit' });
      const mon = d.toLocaleDateString('pt-BR', { month: 'short' });
      const year = d.getFullYear();
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      return `${day} ${mon} ${year} às ${hh}:${mm}`;
    } catch (_) { return ''; }
  };

  return (
    <Drawer open={open} onOpenChange={(o)=>{ if(!o) onClose(); }}>
      <DrawerContent>
        <DrawerHeader className="p-6 pb-2 border-b border-gray-100 text-left">
          <DrawerTitle className="text-xl font-bold text-indigo-950">
            {mode === 'create' ? 'Criar coleção' : 'Gerenciar coleção'}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          {/* Banner uploader */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-indigo-950">Imagem (opcional)</label>
            <div className="w-full h-40 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden hover:border-indigo-200 transition-colors">
              {bannerPreview ? (
                <img src={bannerPreview} alt="banner" className="object-cover w-full h-full" />
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer text-sm text-indigo-700 gap-1 font-medium">
                  <Upload size={22} />
                  <span>Carregar imagem</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
                </label>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-indigo-950">Nome da coleção</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Programação 2026" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-indigo-950">Organizador</label>
            <select value={orgId} onChange={e=>setOrgId(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
              {organizationOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-indigo-950">Resumo (opcional)</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Descrição breve sobre o agrupamento de eventos." className="w-full min-h-[110px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
          </div>
          <div className="flex items-center justify-between gap-4 bg-indigo-50/40 border border-indigo-100 rounded-lg px-4 py-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-indigo-950">Publicar coleção</div>
              <div className="text-[11px] text-indigo-600 mt-0.5">Coleções publicadas ficam acessíveis via link público.</div>
            </div>
            <button
              type="button"
              onClick={()=> setPublished(p=>!p)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${published ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${published ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {errorMsg && (
            <div className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="text-sm text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {successMsg}
            </div>
          )}
          {mode === 'edit' && (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-indigo-950">Eventos em sua coleção</div>
              {eventsLoading ? (
                <div className="text-sm text-slate-500">Carregando eventos…</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {(allUserEvents || []).map(ev => {
                    const included = selectedEventIds.has(ev.id);
                    const busyAdd = adding === ev.id;
                    const busyRemove = removing === ev.id;
                    return (
                      <div
                        key={ev.id}
                        className="group flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-md bg-gray-200 flex-shrink-0" />
                          <div className="flex flex-col leading-tight min-w-0">
                            <div className="text-[13px] font-semibold text-indigo-950 truncate" title={ev.name}>{ev.name}</div>
                            {ev.startDate && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{formatEventDate(ev.startDate)}</div>
                            )}
                          </div>
                        </div>
                        <button
                          disabled={busyAdd || busyRemove}
                          onClick={() => included ? detachEvent(ev.id) : attachEvent(ev.id)}
                          className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${included ? 'border-transparent text-indigo-900 hover:text-red-600' : 'border-indigo-500 text-indigo-600 hover:bg-indigo-600 hover:text-white'} disabled:opacity-50`}
                          title={included ? 'Remover do agrupamento' : 'Adicionar ao agrupamento'}
                        >
                          {(busyAdd || busyRemove) ? (
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-indigo-300 border-t-transparent animate-spin" />
                          ) : included ? (
                            <Trash2 size={18} />
                          ) : (
                            <Plus size={16} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                  {(allUserEvents || []).length === 0 && (
                    <>
                      <div className="text-sm text-slate-500">Você ainda não possui eventos elegíveis.</div>
                      {/* Static mock examples for visual layout */}
                      <div className="mt-3 space-y-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="flex items-center justify-between border border-dashed border-indigo-200 rounded-lg px-4 py-3 bg-indigo-50/40">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-200 to-indigo-300 flex items-center justify-center text-[11px] font-semibold text-indigo-700">{i}</div>
                              <div className="flex flex-col leading-tight min-w-0">
                                <div className="text-[13px] font-semibold text-indigo-900 truncate" title={`Exemplo Evento ${i}`}>Exemplo Evento {i}</div>
                                <div className="text-[11px] text-indigo-600 mt-0.5">12 Out 2025 às 20:0{i}</div>
                              </div>
                            </div>
                            <button disabled className="flex items-center justify-center w-8 h-8 rounded-full border border-indigo-300 text-indigo-400 cursor-not-allowed" title="Exemplo estático">+</button>
                          </div>
                        ))}
                        <div className="text-[11px] text-indigo-500 pt-1">Exemplos estáticos apenas para visual. Cadastre eventos para começar.</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <DrawerFooter className="flex flex-row gap-4 justify-between p-6 border-t border-gray-100">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 font-medium" disabled={loading} onClick={onClose}>Cancelar</Button>
          </DrawerClose>
          <Button
            className="flex-1 bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white font-bold"
            onClick={save}
            disabled={disabled || loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DrawerFooter>
        {mode==='edit' && onDelete && (
          <div className="px-6 pb-4 -mt-2">
            <button onClick={deleteSelf} type="button" className="text-xs font-medium text-red-600 hover:text-red-700">Excluir coleção</button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CollectionDrawer;
