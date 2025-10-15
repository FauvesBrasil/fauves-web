import * as React from 'react';
import { Button } from './ui/button';

export default function ProgramacaoExamplesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[900px] max-w-[95%] bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-[#1A1145]">Exemplos de Programação</h3>
            <p className="text-sm text-[#6B7280] mt-1">Escolha um layout para adicionar à sua página de evento.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-[#6B7280]">×</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {/* Example 1 - Card carousel */}
          <div className="border rounded-xl overflow-hidden">
            <img src="/public/examples/programacao1.jpg" alt="Programacao exemplo 1" className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="text-sm text-[#6B7280]">Carousel de destaques</div>
              <div className="font-bold text-lg text-[#1A1145] mt-2">The Echo — Headliner</div>
              <p className="text-sm text-[#6B7280] mt-2">Mostre seus principais nomes em cartões com imagens e descrições curtas.</p>
            </div>
          </div>
          {/* Example 2 - Speakers list */}
          <div className="border rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="text-sm text-[#6B7280]">Lista de palestrantes</div>
              <div className="font-bold text-lg text-[#1A1145] mt-2">Speakers</div>
              <div className="mt-4 space-y-4">
                <div className="p-3 rounded-lg bg-[#F7F5FF]">Maria Torres — Keynote</div>
                <div className="p-3 rounded-lg bg-white">Joe Michaels — Networking</div>
                <div className="p-3 rounded-lg bg-white">Tim Nichols — AI</div>
              </div>
            </div>
          </div>
          {/* Example 3 - Featured speaker + details */}
          <div className="border rounded-xl overflow-hidden">
            <img src="/public/examples/programacao3.jpg" alt="Programacao exemplo 3" className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="text-sm text-[#6B7280]">Destaque com detalhe</div>
              <div className="font-bold text-lg text-[#1A1145] mt-2">Maria Torres — Keynote</div>
              <p className="text-sm text-[#6B7280] mt-2">Card maior com foto, descrição completa e links sociais.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="px-6 py-2">Fechar</Button>
        </div>
      </div>
    </div>
  );
}
