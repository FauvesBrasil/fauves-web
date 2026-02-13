import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GoogleAdsPixelModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}

export default function GoogleAdsPixelModal({ open, onClose, onSave }: GoogleAdsPixelModalProps) {
  const [eventType, setEventType] = useState<'single' | 'all'>('single');
  const [conversionId, setConversionId] = useState('');
  const [showDefaultEvent, setShowDefaultEvent] = useState(false);
  const [defaultEventAction, setDefaultEventAction] = useState('');
  const [defaultEventId, setDefaultEventId] = useState('');

  if (!open) return null;

  // DEBUG: Modal aberto
  console.log('GoogleAdsPixelModal aberto');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <div className="absolute top-1 left-1 text-xs text-red-600 font-bold">DEBUG: Modal Google Ads aberto</div>
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={onClose}>
          ×
        </button>
        <div className="flex items-center mb-4">
          <img src="https://www.gstatic.com/ads/logo/googleads_color_1x_web_32dp.png" alt="Google Ads" className="mr-2" />
          <span className="font-semibold text-lg">Google Ads</span>
          <a href="https://support.google.com/google-ads/answer/6095821?hl=pt-BR" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-blue-600 underline">Saiba mais</a>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Eventos <span title="Selecione se o pixel será disparado para este evento ou todos.">?</span></label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input type="radio" checked={eventType === 'single'} onChange={() => setEventType('single')} /> Este evento
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={eventType === 'all'} onChange={() => setEventType('all')} /> Todos os eventos
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">ID de conversão</label>
          <Input value={conversionId} onChange={e => setConversionId(e.target.value)} placeholder="ID de conversão" />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Evento de conversão</label>
          {showDefaultEvent && (
            <div className="border rounded p-3 mb-2">
              <label className="block text-xs mb-1">Ação Eventbrite</label>
              <select className="w-full mb-2" value={defaultEventAction} onChange={e => setDefaultEventAction(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="event_page">Página do evento</option>
                <option value="ticket_purchase">Compra de ingresso</option>
                <option value="checkout">Checkout</option>
              </select>
              <label className="block text-xs mb-1">ID de conversão</label>
              <Input value={defaultEventId} onChange={e => setDefaultEventId(e.target.value)} placeholder="por exemplo, XXXX" />
              <button className="text-xs text-red-500 mt-2" onClick={() => setShowDefaultEvent(false)}>REMOVER</button>
            </div>
          )}
          {!showDefaultEvent && (
            <button className="text-xs text-blue-600 underline" onClick={() => setShowDefaultEvent(true)}>
              + Adicionar evento padrão
            </button>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!conversionId} onClick={() => {
            onSave?.({ eventType, conversionId, defaultEventAction, defaultEventId });
            onClose();
          }}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}
