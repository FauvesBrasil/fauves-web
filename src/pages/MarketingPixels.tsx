import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import { Button } from '@/components/ui/button';
import metaLogo from '@/assets/logo-meta.svg';
import googleAdsLogo from '@/assets/Google_Ads_icon.svg';
import gaLogo from '@/assets/google-analytics-4.svg';
import xLogo from '@/assets/x-2.svg';

export default function MarketingPixels(){
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventName, setEventName] = useState('Nome do evento');
  const [eventDate, setEventDate] = useState('Data não definida');
  const [eventStatus, setEventStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho');

  useEffect(() => {
    let mounted = true;
    async function load(){
      if (!id) return;
      try {
        const res = await fetch(`/api/event/${id}`);
        if (!res || !res.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Nome do evento');
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0,5);
          setEventDate(`${datePart} às ${timePart}`);
        }
        setEventStatus(ev?.status === 'Publicado' ? 'Publicado' : 'Rascunho');
      } catch(e) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const pixelTypes = [
  { key: 'x', title: 'Pixel do X', subtitle: 'Adicionar novo pixel', logo: xLogo },
    { key: 'meta', title: 'Pixel da Meta', subtitle: 'Adicionar novo pixel', logo: metaLogo },
    { key: 'ads', title: 'Google Ads', subtitle: 'Adicionar novo pixel', logo: googleAdsLogo },
    { key: 'ga', title: 'Google Analytics', subtitle: 'Adicionar novo pixel', logo: gaLogo },
  { key: 'img', title: 'Pixel de imagem simples', subtitle: 'Adicionar novo pixel', logo: undefined },
  ];

  // Modal state for adding a pixel
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);

  // Pixel do X form state
  const [x_scope, setXScope] = useState<'this'|'all'>('this');
  const [x_pageId, setXPageId] = useState('');
  const [x_positions, setXPositions] = useState<Array<{ action: string; conversionId: string }>>([]);

  // Pixel Meta form state
  const [meta_scope, setMetaScope] = useState<'this'|'all'>('this');
  const [meta_pixelId, setMetaPixelId] = useState('');
  const [meta_defaultEvents, setMetaDefaultEvents] = useState<Array<{ action: string; eventName: string }>>([]);

  // Google Ads form state
  const [ads_scope, setAdsScope] = useState<'this'|'all'>('this');
  const [ads_conversionId, setAdsConversionId] = useState('');
  const [ads_defaultEvents, setAdsDefaultEvents] = useState<Array<{ action: string; conversionId: string }>>([]);

  // Google Analytics form state
  const [ga_scope, setGaScope] = useState<'this'|'all'>('this');
  const [ga_measurementId, setGaMeasurementId] = useState('');

  // Pixel de imagem simples form state
  const [img_scope, setImgScope] = useState<'this'|'all'>('this');
  const [img_events, setImgEvents] = useState<Array<{ action: string; url: string }>>([]);

  function openModalFor(key: string){
    setModalType(key);
    setModalOpen(true);
    // reset form for Pixel do X
    if (key === 'x'){
      setXScope('this');
      setXPageId('');
      setXPositions([]);
    }
    if (key === 'meta'){
      setMetaScope('this');
      setMetaPixelId('');
      setMetaDefaultEvents([]);
    }
    if (key === 'ads'){
      setAdsScope('this');
      setAdsConversionId('');
      setAdsDefaultEvents([]);
    }
    if (key === 'ga'){
      setGaScope('this');
      setGaMeasurementId('');
    }
    if (key === 'img'){
      setImgScope('this');
      setImgEvents([{ action: 'event_page', url: '' }]);
    }
  }

  function addPosition(){
    setXPositions(prev => [...prev, { action: 'event_page', conversionId: '' }]);
  }

  function updatePosition(idx: number, patch: Partial<{ action: string; conversionId: string }>){
    setXPositions(prev => prev.map((p,i) => i === idx ? { ...p, ...patch } : p));
  }

  function removePosition(idx: number){
    setXPositions(prev => prev.filter((_,i) => i !== idx));
  }

  function handleSaveModal(){
    // For now persist to localStorage under 'pixels_demo' as an array
    try {
      const raw = localStorage.getItem('pixels_demo');
      const arr = raw ? JSON.parse(raw) : [];
      if (modalType === 'x'){
        arr.push({ type: 'x', scope: x_scope, pageId: x_pageId, positions: x_positions });
      } else if (modalType === 'meta') {
        arr.push({ type: 'meta', scope: meta_scope, pixelId: meta_pixelId, defaultEvents: meta_defaultEvents });
      } else if (modalType === 'ads') {
        arr.push({ type: 'ads', scope: ads_scope, conversionId: ads_conversionId, defaultEvents: ads_defaultEvents });
      } else if (modalType === 'ga') {
        arr.push({ type: 'ga', scope: ga_scope, measurementId: ga_measurementId });
      } else if (modalType === 'img') {
        arr.push({ type: 'img', scope: img_scope, events: img_events });
      }
      localStorage.setItem('pixels_demo', JSON.stringify(arr));
    } catch(e) { /* ignore */ }
    setModalOpen(false);
  }

  function addMetaDefaultEvent(){
    setMetaDefaultEvents(prev => [...prev, { action: 'event_page', eventName: '' }]);
  }

  function updateMetaDefaultEvent(idx: number, patch: Partial<{ action: string; eventName: string }>) {
    setMetaDefaultEvents(prev => prev.map((r,i) => i === idx ? { ...r, ...patch } : r));
  }

  function removeMetaDefaultEvent(idx: number){
    setMetaDefaultEvents(prev => prev.filter((_,i) => i !== idx));
  }

  function addAdsDefaultEvent(){
    setAdsDefaultEvents(prev => [...prev, { action: 'event_page', conversionId: '' }]);
  }
  function updateAdsDefaultEvent(idx: number, patch: Partial<{ action: string; conversionId: string }>) {
    setAdsDefaultEvents(prev => prev.map((r,i) => i === idx ? { ...r, ...patch } : r));
  }
  function removeAdsDefaultEvent(idx: number){
    setAdsDefaultEvents(prev => prev.filter((_,i) => i !== idx));
  }

  function addImgEvent(){
    setImgEvents(prev => [...prev, { action: 'event_page', url: '' }]);
  }
  function updateImgEvent(idx: number, patch: Partial<{ action: string; url: string }>) {
    setImgEvents(prev => prev.map((r,i) => i === idx ? { ...r, ...patch } : r));
  }
  function removeImgEvent(idx: number){
    setImgEvents(prev => prev.filter((_,i) => i !== idx));
  }

  const { totalLeft } = useLayoutOffsets();

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Fixed main sidebar */}
      <SidebarMenu />

      {/* Fixed event details sidebar */}
      <EventDetailsSidebar
        eventName={eventName}
        eventDate={eventDate}
        eventStatus={eventStatus}
        onBack={() => navigate(-1)}
        onStatusChange={() => {}}
        onViewEvent={() => { if (id) navigate(`/event/${id}`); }}
        eventIdOverride={id || null}
        fixed
        fixedLeft={70}
        fixedWidth={300}
        fixedTop={0}
      />

      {/* Global header (full width) */}
      <AppHeader />

      {/* Content with left margin for both sidebars */}
      <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col pl-8 pr-8 min-h-screen relative">
        <div className="mt-24 max-w-6xl">
          <h1 className="text-3xl font-bold text-indigo-950 mb-3">Pixels de rastreamento</h1>
          <p className="text-sm text-gray-600 mb-6">O rastreamento de pixels pode ajudar você a medir o impacto de seu marketing, publicidade e análise.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {pixelTypes.map(p => (
              <div key={p.key} onClick={() => openModalFor(p.key)} className="cursor-pointer border rounded-xl p-5 flex items-start gap-4 shadow-sm bg-white hover:shadow-md transition">
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center text-xl text-indigo-600">
                  {p.key === 'img' ? (
                    // inline target/ mira icon
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-700">
                      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 19v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M3 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  ) : (
                    p.logo ? <img src={p.logo} alt={p.title} className="w-6 h-6 object-contain" /> : p.key.toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{p.title}</div>
                  <div className="text-xs text-gray-500 mt-1">+ {p.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal */}
          {modalOpen && modalType === 'x' && (
            <div style={{ zIndex: 1000 }} className="fixed inset-0 flex items-center justify-center p-6 bg-black/40">
              <div className="w-full max-w-2xl bg-white rounded-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <img src={xLogo} alt="Pixel do X" className="w-6 h-6" />
                    <div className="font-semibold">Adicionar pixel</div>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-zinc-500">✕</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-auto">
                  <div className="mb-4">
                    <div className="text-sm font-medium">Eventos</div>
                    <div className="mt-3 flex gap-4">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="x_scope" checked={x_scope === 'this'} onChange={() => setXScope('this')} /> Este evento</label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="x_scope" checked={x_scope === 'all'} onChange={() => setXScope('all')} /> Todos os eventos</label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium">Pixel da página</div>
                    <div className="mt-2">
                      <input className="w-full border rounded px-3 py-3" placeholder="por exemplo, XXXXX" value={x_pageId} onChange={e => setXPageId(e.target.value)} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Posicionamento</div>
                      <button className="text-indigo-600 text-sm" onClick={addPosition}>+ Adicionar posicionamento</button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {x_positions.length === 0 && <div className="text-sm text-zinc-500">Nenhum posicionamento adicionado</div>}
                      {x_positions.map((p, idx) => (
                        <div key={idx} className="border rounded p-3">
                          <div className="mb-2 text-xs text-zinc-600">Ação Eventbrite</div>
                          <select className="w-full border rounded px-3 py-2 mb-2" value={p.action} onChange={e => updatePosition(idx, { action: e.target.value })}>
                            <option value="event_page">Página do evento</option>
                            <option value="ticket">Compra de ingresso</option>
                          </select>
                          <div className="text-xs text-zinc-600 mb-1">ID de conversão</div>
                          <input className="w-full border rounded px-3 py-2" placeholder="por exemplo, XXXX" value={p.conversionId} onChange={e => updatePosition(idx, { conversionId: e.target.value })} />
                          <div className="mt-2 text-right">
                            <button className="text-sm text-red-600" onClick={() => removePosition(idx)}>REMOVER</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 px-6 py-4 border-t">
                  <button className="px-4 py-2 rounded bg-zinc-50 text-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button className="px-4 py-2 rounded bg-indigo-600 text-white text-sm" onClick={handleSaveModal}>Salvar</button>
                </div>
              </div>
            </div>
          )}

          {/* Meta modal */}
          {modalOpen && modalType === 'meta' && (
            <div style={{ zIndex: 1000 }} className="fixed inset-0 flex items-center justify-center p-6 bg-black/40">
              <div className="w-full max-w-2xl bg-white rounded-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <img src={metaLogo} alt="Pixel da Meta" className="w-6 h-6" />
                    <div className="font-semibold">Adicionar pixel</div>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-zinc-500">✕</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-auto">
                  <div className="mb-4">
                    <div className="text-sm font-medium">Eventos</div>
                    <div className="mt-3 flex gap-4">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="meta_scope" checked={meta_scope === 'this'} onChange={() => setMetaScope('this')} /> Este evento</label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="meta_scope" checked={meta_scope === 'all'} onChange={() => setMetaScope('all')} /> Todos os eventos</label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium">ID de Pixel da Meta</div>
                    <div className="text-xs text-zinc-500 mt-1">Este é o ID exclusivo encontrado no código base do seu código Meta Pixel</div>
                    <div className="mt-2">
                      <input className="w-full border rounded px-3 py-3" placeholder="por exemplo, 1234567890" value={meta_pixelId} onChange={e => setMetaPixelId(e.target.value)} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Evento padrão</div>
                      <button className="text-indigo-600 text-sm" onClick={addMetaDefaultEvent}>+ Adicionar evento padrão</button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {meta_defaultEvents.length === 0 && <div className="text-sm text-zinc-500">Nenhum evento padrão adicionado</div>}
                      {meta_defaultEvents.map((r, idx) => (
                        <div key={idx} className="border rounded p-3">
                          <div className="mb-2 text-xs text-zinc-600">Ação Eventbrite</div>
                          <select className="w-full border rounded px-3 py-2 mb-2" value={r.action} onChange={e => updateMetaDefaultEvent(idx, { action: e.target.value })}>
                            <option value="event_page">Página do evento</option>
                            <option value="ticket">Compra de ingresso</option>
                          </select>
                          <div className="text-xs text-zinc-600 mb-1">Evento padrão</div>
                          <input className="w-full border rounded px-3 py-2" placeholder="Nome do evento padrão" value={r.eventName} onChange={e => updateMetaDefaultEvent(idx, { eventName: e.target.value })} />
                          <div className="mt-2 text-right">
                            <button className="text-sm text-red-600" onClick={() => removeMetaDefaultEvent(idx)}>REMOVER</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 px-6 py-4 border-t">
                  <button className="px-4 py-2 rounded bg-zinc-50 text-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button className="px-4 py-2 rounded bg-indigo-600 text-white text-sm" onClick={handleSaveModal}>Salvar</button>
                </div>
              </div>
            </div>
          )}

          {/* Google Ads modal */}
          {modalOpen && modalType === 'ads' && (
            <div style={{ zIndex: 1000 }} className="fixed inset-0 flex items-center justify-center p-6 bg-black/40">
              <div className="w-full max-w-2xl bg-white rounded-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <img src={googleAdsLogo} alt="Google Ads" className="w-6 h-6" />
                    <div className="font-semibold">Adicionar pixel Google Ads</div>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-zinc-500">✕</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-auto">
                  <div className="mb-4">
                    <div className="text-sm font-medium">Eventos</div>
                    <div className="mt-3 flex gap-4">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="ads_scope" checked={ads_scope === 'this'} onChange={() => setAdsScope('this')} /> Este evento</label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="ads_scope" checked={ads_scope === 'all'} onChange={() => setAdsScope('all')} /> Todos os eventos</label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium">ID de conversão</div>
                    <div className="mt-2">
                      <input className="w-full border rounded px-3 py-3" placeholder="ID de conversão" value={ads_conversionId} onChange={e => setAdsConversionId(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Evento padrão</div>
                      <button className="text-indigo-600 text-sm" onClick={addAdsDefaultEvent}>+ Adicionar evento padrão</button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {ads_defaultEvents.length === 0 && <div className="text-sm text-zinc-500">Nenhum evento padrão adicionado</div>}
                      {ads_defaultEvents.map((r, idx) => (
                        <div key={idx} className="border rounded p-3">
                          <div className="mb-2 text-xs text-zinc-600">Ação Eventbrite</div>
                          <select className="w-full border rounded px-3 py-2 mb-2" value={r.action} onChange={e => updateAdsDefaultEvent(idx, { action: e.target.value })}>
                            <option value="event_page">Página do evento</option>
                            <option value="ticket">Compra de ingresso</option>
                            <option value="checkout">Checkout</option>
                          </select>
                          <div className="text-xs text-zinc-600 mb-1">ID de conversão</div>
                          <input className="w-full border rounded px-3 py-2" placeholder="por exemplo, XXXX" value={r.conversionId} onChange={e => updateAdsDefaultEvent(idx, { conversionId: e.target.value })} />
                          <div className="mt-2 text-right">
                            <button className="text-sm text-red-600" onClick={() => removeAdsDefaultEvent(idx)}>REMOVER</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 px-6 py-4 border-t">
                  <button className="px-4 py-2 rounded bg-zinc-50 text-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button className="px-4 py-2 rounded bg-indigo-600 text-white text-sm" onClick={handleSaveModal}>Salvar</button>
                </div>
              </div>
            </div>
          )}

          {/* Google Analytics modal */}
          {modalOpen && modalType === 'ga' && (
            <div style={{ zIndex: 1000 }} className="fixed inset-0 flex items-center justify-center p-6 bg-black/40">
              <div className="w-full max-w-2xl bg-white rounded-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <img src={gaLogo} alt="Google Analytics" className="w-6 h-6" />
                    <div className="font-semibold">Adicionar pixel Google Analytics</div>
                    <a href="https://support.google.com/analytics/answer/9539598?hl=pt-BR" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-blue-600 underline">Saiba mais</a>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-zinc-500">✕</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-auto">
                  <div className="mb-4">
                    <div className="text-sm font-medium">Eventos</div>
                    <div className="mt-3 flex gap-4">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="ga_scope" checked={ga_scope === 'this'} onChange={() => setGaScope('this')} /> Este evento</label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="ga_scope" checked={ga_scope === 'all'} onChange={() => setGaScope('all')} /> Todos os eventos</label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium">ID de medição</div>
                    <div className="mt-2">
                      <input className="w-full border rounded px-3 py-3" placeholder="G-XXXXXXXXXX" value={ga_measurementId} onChange={e => setGaMeasurementId(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 px-6 py-4 border-t">
                  <button className="px-4 py-2 rounded bg-zinc-50 text-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button className="px-4 py-2 rounded bg-indigo-600 text-white text-sm" onClick={handleSaveModal}>Salvar</button>
                </div>
              </div>
            </div>
          )}

          {/* Pixel de imagem simples modal */}
          {modalOpen && modalType === 'img' && (
            <div style={{ zIndex: 1000 }} className="fixed inset-0 flex items-center justify-center p-6 bg-black/40">
              <div className="w-full max-w-2xl bg-white rounded-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2" stroke="#666" strokeWidth="1.5" /><path d="M12 3v2" stroke="#666" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 19v2" stroke="#666" strokeWidth="1.5" strokeLinecap="round" /><path d="M3 12h2" stroke="#666" strokeWidth="1.5" strokeLinecap="round" /><path d="M19 12h2" stroke="#666" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="12" r="7" stroke="#666" strokeWidth="1.2" /></svg></span>
                    <div className="font-semibold">Pixel de imagem simples</div>
                    <a href="https://support.google.com/google-ads/answer/7476276?hl=pt-BR" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-blue-600 underline">Saiba mais</a>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-zinc-500">✕</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-auto">
                  <div className="mb-4">
                    <div className="text-sm font-medium">Eventos</div>
                    <div className="mt-3 flex gap-4">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="img_scope" checked={img_scope === 'this'} onChange={() => setImgScope('this')} /> Este evento</label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="img_scope" checked={img_scope === 'all'} onChange={() => setImgScope('all')} /> Todos os eventos</label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-1">Evento de conversão</div>
                    <div className="text-xs text-zinc-600 mb-2">Adicione um evento de conversão selecionando em qual página você quer que seu pixel seja acionado e inserindo a URL no seu pixel de imagem. Essa URL sempre começa com https:// e deve ser uma URL completa entre aspas.</div>
                    <div className="mt-4 space-y-3">
                      {img_events.length === 0 && <div className="text-sm text-zinc-500">Nenhum evento adicionado</div>}
                      {img_events.map((r, idx) => (
                        <div key={idx} className="border rounded p-3">
                          <div className="mb-2 text-xs text-zinc-600">Ação Eventbrite</div>
                          <select className="w-full border rounded px-3 py-2 mb-2" value={r.action} onChange={e => updateImgEvent(idx, { action: e.target.value })}>
                            <option value="event_page">Página do evento</option>
                            <option value="ticket">Compra de ingresso</option>
                            <option value="checkout">Checkout</option>
                          </select>
                          <div className="text-xs text-zinc-600 mb-1">URL do pixel</div>
                          <input className="w-full border rounded px-3 py-2" placeholder="https://example.com/pixel.gif" value={r.url} onChange={e => updateImgEvent(idx, { url: e.target.value })} />
                          <div className="mt-2 text-right">
                            <button className="text-sm text-red-600" onClick={() => removeImgEvent(idx)}>REMOVER</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="text-xs text-blue-600 underline mt-2" onClick={addImgEvent}>+ Adicionar evento padrão</button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 px-6 py-4 border-t">
                  <button className="px-4 py-2 rounded bg-zinc-50 text-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button className="px-4 py-2 rounded bg-indigo-600 text-white text-sm" onClick={handleSaveModal}>Salvar</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-xl">
            <div className="px-6 py-3 border-b text-sm text-zinc-600 grid grid-cols-3">
              <div>Tipo de pixel</div>
              <div>Gatilho</div>
              <div>Eventos</div>
            </div>
            <div className="p-8 text-center text-sm text-zinc-500">Nenhum pixel de rastreamento configurado</div>
          </div>

          <div className="mt-6">
            <a className="inline-flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm text-zinc-700 border" href="#" onClick={(e) => { e.preventDefault(); window.open('https://help.example.com', '_blank'); }}>
              <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
              Saiba mais sobre pixels de rastreamento
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
