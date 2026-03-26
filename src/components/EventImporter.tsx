import React, { useState, useEffect } from 'react';
import { Search, Loader2, Save, Link as LinkIcon, Calendar, MapPin, User, Image as ImageIcon, X, CheckIcon } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';
import { toast } from 'sonner';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

const BRAZIL_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

const UF_CAPITALS: Record<string, string> = {
  AC: 'Rio Branco', AL: 'Maceió', AP: 'Macapá', AM: 'Manaus',
  BA: 'Salvador', CE: 'Fortaleza', DF: 'Brasília', ES: 'Vitória',
  GO: 'Goiânia', MA: 'São Luís', MT: 'Cuiabá', MS: 'Campo Grande',
  MG: 'Belo Horizonte', PA: 'Belém', PB: 'João Pessoa', PR: 'Curitiba',
  PE: 'Recife', PI: 'Teresina', RJ: 'Rio de Janeiro', RN: 'Natal',
  RS: 'Porto Alegre', RO: 'Porto Velho', RR: 'Boa Vista', SC: 'Florianópolis',
  SP: 'São Paulo', SE: 'Aracaju', TO: 'Palmas'
};

interface EventImporterProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const EventImporter: React.FC<EventImporterProps> = ({ onSuccess, onClose }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'url' | 'edit'>('url');
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    locationUf: '',
    locationCity: '',
    producer: '',
    image: '',
    externalUrl: ''
  });

  const [existingOrgs, setExistingOrgs] = useState<any[]>([]);

  useEffect(() => {
    if (step === 'edit') {
      fetchApi('/api/admin/organizations?perPage=100')
        .then(res => res.json())
        .then(data => {
          if (data && data.organizations) setExistingOrgs(data.organizations);
        })
        .catch(() => {});
    }
  }, [step]);

  useEffect(() => {
    if (formData.locationUf && UF_CAPITALS[formData.locationUf] && !formData.locationCity) {
      setFormData(prev => ({ ...prev, locationCity: UF_CAPITALS[formData.locationUf] }));
    }
  }, [formData.locationUf]);

  const handleExtract = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetchApi(`/api/admin/event-importer/extract?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Erro ao extrair dados');
      
      const data = await res.json();
      
      setFormData({
        name: data.title || '',
        date: '',
        location: '',
        locationUf: 'CE', // Default to CE as requested context often focuses on Fortaleza
        locationCity: 'Fortaleza',
        producer: '',
        image: data.image || '',
        externalUrl: url
      });
      setStep('edit');
    } catch (error) {
      toast.error('Não foi possível extrair dados automaticamente. Preencha manualmente.');
      setFormData({ ...formData, externalUrl: url, locationUf: 'CE', locationCity: 'Fortaleza' });
      setStep('edit');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.date || !formData.producer || !formData.locationUf) {
      toast.error('Preencha os campos obrigatórios (Nome, Data, Produtora e Estado)');
      return;
    }
    setSaving(true);
    try {
      const res = await fetchApi('/api/admin/event-importer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Erro ao salvar evento');
      
      toast.success('Evento importado com sucesso!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar evento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-2xl w-full mx-auto animate-in fade-in zoom-in duration-200">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 m-0 text-base">
          <LinkIcon className="w-5 h-5 text-teal-500" />
          Importador de Eventos
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6">
        {step === 'url' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
              Cole o link de um evento externo para tentarmos extrair as informações automaticamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="https://www.sympla.com.br/evento/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3 h-11 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition text-sm"
                />
              </div>
              <button
                onClick={handleExtract}
                disabled={loading || !url}
                className="px-6 h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar Informações
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome do Evento *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Data e Hora *</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Produtora *</label>
                <div className="relative">
                  <input
                    type="text"
                    list="existing-orgs"
                    placeholder="Ex: Move Concerts"
                    value={formData.producer}
                    onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                    className="w-full px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <datalist id="existing-orgs">
                    {existingOrgs.map(org => <option key={org.id} value={org.name} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Local / Endereço</label>
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(val) => setFormData({ ...formData, location: val })}
                  placeholder="Arena Castelão ou Rua Exemplo, 123"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estado (UF) *</label>
                <select
                  value={formData.locationUf}
                  onChange={(e) => setFormData({ ...formData, locationUf: e.target.value })}
                  className="w-full px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {BRAZIL_UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cidade *</label>
                <input
                  type="text"
                  value={formData.locationCity}
                  onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
                  className="w-full px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-2 border-t border-slate-100 dark:border-slate-800 mt-2">
               <button
                onClick={() => setStep('url')}
                className="flex-1 px-4 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] px-6 h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white rounded-lg font-bold transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Evento Importado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventImporter;
