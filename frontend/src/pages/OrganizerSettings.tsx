import React, { useEffect, useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrgLogoUpload from '@/components/OrgLogoUpload';

interface EditOrgModalProps {
  org: any;
  open: boolean;
  onClose: () => void;
  onUpdated: (org: any) => void;
  onDeleted: (orgId: string) => void;
}

const EditOrgModal: React.FC<EditOrgModalProps> = ({ org, open, onClose, onUpdated, onDeleted }) => {
  // Reset loading/error e campos ao abrir/fechar ou trocar org
  useEffect(() => {
    setName(org?.name || '');
    setLogoUrl(org?.logoUrl || '');
    setLogoFile(null);
    setDescription(org?.description || '');
    setError('');
    setLoading(false);
  }, [org, open]);
  const [name, setName] = useState(org?.name || '');
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl || '');
  const [logoFile, setLogoFile] = useState<File|null>(null);
  const [description, setDescription] = useState(org?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
  setName(org?.name || '');
  setLogoUrl(org?.logoUrl || '');
  setLogoFile(null);
  setDescription(org?.description || '');
  setError('');
  setLoading(false);
  }, [org, open]);

  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    console.log('handleSave chamado');
    setLoading(true);
    setError('');
    if (!org || !org.id) {
      setError('Organização não definida. Tente novamente ou selecione uma organização.');
      setLoading(false);
      return;
    }
    let finalLogoUrl = logoUrl;
    try {
      // Upload da imagem, se houver
      if (logoFile) {
        console.log('Preparando upload do arquivo:', logoFile);
        const formData = new FormData();
        formData.append('file', logoFile, logoFile.name || 'logo.png');
        console.log('Enviando fetch para /api/upload...');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        console.log('Resposta upload:', uploadRes);
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          console.error('Erro upload:', errText);
          setError('Erro ao enviar imagem: ' + errText);
          setLoading(false);
          return;
        }
        const data = await uploadRes.json();
        console.log('Dados upload:', data);
        if (!data.url) {
          console.error('Upload não retornou URL:', data);
          setError('Upload não retornou URL');
          setLoading(false);
          return;
        }
        finalLogoUrl = data.url;
      } else {
        console.warn('Nenhum arquivo selecionado para upload. Usando logoUrl existente:', logoUrl);
      }
    } catch (e: any) {
      console.error('Catch upload:', e);
      setError(e?.message || 'Erro ao enviar imagem');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/organization/${org.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logoUrl: finalLogoUrl, description }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Erro PUT:', errText);
        setError('Falha ao atualizar organização: ' + errText);
        setLoading(false);
        return;
      }
      const updated = await res.json();
      onUpdated(updated);
      setLoading(false);
      onClose();
    } catch (e: any) {
      console.error('Catch PUT:', e);
      setError(e?.message || 'Erro ao salvar organização');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta organização?')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/organization/${org.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir organização');
      onDeleted(org.id);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Erro ao excluir');
    }
    setLoading(false);
  };

  if (!open) return null;
  // Adiciona 'inert' ao fundo da página quando o modal está aberto
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    if (open) {
      mainContent.setAttribute('inert', '');
    } else {
      mainContent.removeAttribute('inert');
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-xl px-8 py-8 flex flex-col items-center border border-[#E5E7EB] dark:border-[#1F1F1F]" style={{maxWidth: 420, minWidth: 340}}>
        <div className="w-full flex justify-end mb-2">
          <button type="button" className="text-[#2A2AD7] dark:text-white text-xl font-bold px-2 py-1 rounded hover:bg-[#F3F4FE] dark:hover:bg-[#111827] focus:outline-none" onClick={onClose} aria-label="Fechar modal">×</button>
        </div>
        <span className="text-[18px] font-bold text-[#091747] dark:text-white text-center mb-7 leading-snug">Editar organização</span>
        <div className="flex items-center gap-4 w-full justify-center mb-7">
          <OrgLogoUpload logoUrl={logoUrl} onSelect={handleLogoSelect} />
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da organização" className="flex-1 h-14 rounded-full border border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#242424] px-6 text-base text-[#091747] dark:text-white font-medium shadow-sm focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500 focus:border-[#2A2AD7]" style={{maxWidth: 260, minWidth: 180}} />
        </div>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição da organização" className="w-full h-14 rounded-full border border-[#E5E7EB] dark:border-[#1F1F1F] bg-white dark:bg-[#242424] px-6 text-base text-[#091747] dark:text-white font-medium shadow-sm focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500 focus:border-[#2A2AD7] mb-4" />
  {error && <div className="text-red-600 text-sm mb-2 text-center w-full">{error}</div>}
  {!logoFile && <div className="text-yellow-600 text-xs mb-2 text-center w-full">Nenhuma imagem nova selecionada. O logo atual será mantido.</div>}
        <Button onClick={handleSave} disabled={loading || !name.trim()} className="w-full mt-0 shadow bg-[#2A2AD7] hover:bg-[#1e1eb8] text-white font-bold rounded-full py-4 text-base text-center" style={{minHeight: 56, fontSize: 18, background:'#2A2AD7'}}>
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
        <Button onClick={handleDelete} disabled={loading} className="w-full mt-4 shadow bg-[#EF4118] hover:bg-[#d12c0f] text-white font-bold rounded-full py-4 text-base text-center" style={{minHeight: 56, fontSize: 18}}>
          Excluir organização
        </Button>
      </div>
    </div>
  );
};

export default EditOrgModal;
