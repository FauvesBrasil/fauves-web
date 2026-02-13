import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialSection?: 'checkin' | 'age' | 'parking';
}

const BomSaberHighlightsModal: React.FC<Props> = ({ open, onClose, onSave, initialSection }) => {
  const [checkinValue, setCheckinValue] = React.useState('30');
  const [checkinUnit, setCheckinUnit] = React.useState<'minutes'|'hours'>('minutes');
  const [ageOption, setAgeOption] = React.useState<'any'|'restricted'|'parent'>('any');
  const [selectedAge, setSelectedAge] = React.useState<number | null>(18);
  const [selectedParentAge, setSelectedParentAge] = React.useState<number | null>(18);
  const [parkingOption, setParkingOption] = React.useState<'free'|'paid'|'none'>('free');

  React.useEffect(() => {
    if (!open) return;
    // reset values when opened
    setCheckinValue('30');
    setCheckinUnit('minutes');
    setAgeOption('any');
    setParkingOption('free');
  }, [open]);

  // focus control for sections
  const checkinInputRef = React.useRef<HTMLInputElement|null>(null);
  React.useEffect(() => {
    if (!open) return;
    if (initialSection === 'checkin') {
      // focus the checkin input (Input forwards ref)
      setTimeout(() => checkinInputRef.current?.focus(), 60);
    }
    if (initialSection === 'age') {
      setAgeOption('restricted');
    }
    // parking needs no special handling
  }, [open, initialSection]);

  if (!open) return null;

  // inert main content while modal open
  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.setAttribute('inert', '');

  const handleSave = () => {
    onSave({ checkinValue, checkinUnit, ageOption, parkingOption, selectedAge, selectedParentAge });
    if (mainContent) mainContent.removeAttribute('inert');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-8 border border-[#E5E7EB] w-[920px] max-w-full">
        <div className="w-full flex justify-end mb-2">
          <button type="button" className="text-[#6B7280] text-xl px-2 py-1 rounded hover:bg-[#F3F4FE]" onClick={() => { if (mainContent) mainContent.removeAttribute('inert'); onClose(); }} aria-label="Fechar modal">×</button>
        </div>
        <h2 className="text-2xl font-bold text-[#091747] mb-6">Adicionar destaques sobre o seu evento</h2>

        <div className="mb-6">
          <div className="text-sm text-[#6B7280] mb-2">A que horas os participantes podem fazer o check-in antes do evento?</div>
          <div className="flex items-center gap-4">
            <Input value={checkinValue} onChange={e => setCheckinValue(e.target.value)} placeholder="Horas antes de o evento começar" className="w-[260px] h-12 rounded-full" />
            <div className="bg-[#F6F7FB] rounded-xl p-1 flex items-center">
              <button type="button" className={`px-4 py-2 rounded-md ${checkinUnit==='minutes' ? 'bg-[#3B5FFF] text-white' : 'text-[#6B7280]'}`} onClick={() => setCheckinUnit('minutes')}>Minutos</button>
              <button type="button" className={`px-4 py-2 rounded-md ${checkinUnit==='hours' ? 'bg-[#3B5FFF] text-white' : 'text-[#6B7280]'}`} onClick={() => setCheckinUnit('hours')}>Horas</button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-base font-bold text-[#091747] mb-3">Existe uma restrição de idade?</div>
          <div className="flex gap-4 mb-4">
            <button type="button" onClick={() => setAgeOption('any')} className={`px-6 py-4 rounded-xl border ${ageOption==='any' ? 'border-[#3B5FFF] bg-white font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>Todas as idades são permitidas</button>
            <button type="button" onClick={() => setAgeOption('restricted')} className={`px-6 py-4 rounded-xl border ${ageOption==='restricted' ? 'border-[#3B5FFF] bg-white font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>Há uma restrição de idade</button>
            <button type="button" onClick={() => setAgeOption('parent')} className={`px-6 py-4 rounded-xl border ${ageOption==='parent' ? 'border-[#3B5FFF] bg-white font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>É necessário pai ou responsável</button>
          </div>
          {ageOption === 'restricted' && (
            <div>
              <div className="text-sm text-[#6B7280] mb-3">Quais idades são permitidas?</div>
              <div className="flex flex-wrap gap-3 mb-3">
                {Array.from({length: 9}).map((_, i) => {
                  const age = 12 + i; // 12..20
                  const isSelected = selectedAge === age;
                  return (
                    <button key={age} type="button" onClick={() => { setSelectedAge(age); }} className={`px-4 py-2 text-sm rounded-xl border ${isSelected ? 'border-[#3B5FFF] bg-[#EEF2FF] font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>
                      Maiores de {age} anos
                    </button>
                  );
                })}
                <button type="button" onClick={() => setSelectedAge(21)} className={`px-4 py-2 text-sm rounded-xl border ${selectedAge === 21 ? 'border-[#3B5FFF] bg-[#EEF2FF] font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>
                  Maiores de 21 anos
                </button>
              </div>
            </div>
          )}
          {ageOption === 'parent' && (
            <div>
              <div className="text-sm text-[#6B7280] mb-3">Quais idades precisam de um pai ou responsável?</div>
              <div className="flex flex-wrap gap-3 mb-3">
                {[14,16,18,21].map(age => {
                  const isSelected = selectedParentAge === age;
                  return (
                    <button key={age} type="button" onClick={() => setSelectedParentAge(age)} className={`px-4 py-2 text-sm rounded-xl border ${isSelected ? 'border-[#3B5FFF] bg-[#EEF2FF] font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>
                      Menores de {age} anos
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="text-base font-bold text-[#091747] mb-3">Existe estacionamento no seu local?</div>
          <div className="flex gap-4">
            <button type="button" onClick={() => setParkingOption('free')} className={`px-6 py-4 rounded-xl border ${parkingOption==='free' ? 'border-[#3B5FFF] bg-white font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>Estacionamento gratuito</button>
            <button type="button" onClick={() => setParkingOption('paid')} className={`px-6 py-4 rounded-xl border ${parkingOption==='paid' ? 'border-[#3B5FFF] bg-white font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>Estacionamento pago</button>
            <button type="button" onClick={() => setParkingOption('none')} className={`px-6 py-4 rounded-xl border ${parkingOption==='none' ? 'border-[#3B5FFF] bg-white font-bold' : 'border-[#E5E7EB] bg-white text-[#091747]'}`}>Sem opções de estacionamento</button>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleSave} className="bg-[#EF6B2A] hover:bg-[#e05510] text-white font-bold rounded-full px-8 py-4">Adicionar ao evento</Button>
        </div>
      </div>
    </div>
  );
};

export default BomSaberHighlightsModal;
