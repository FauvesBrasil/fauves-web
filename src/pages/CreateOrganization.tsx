import * as React from "react";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import OrgLogoUpload from "@/components/OrgLogoUpload";
import { useOrganization } from '@/context/OrganizationContext';

const CreateOrganization: React.FC = () => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoUrl, setLogoUrl] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string| null>(null);
  const [success, setSuccess] = React.useState<string| null>(null);

  const { refresh, addOrganization } = useOrganization();

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const userId = localStorage.getItem('userId') || '';
      let finalLogoUrl = "";
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile, logoFile.name || 'logo.png');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error('Erro ao enviar imagem: ' + errText);
        }
        const data = await uploadRes.json();
        if (!data.url) throw new Error('Upload não retornou URL');
        finalLogoUrl = data.url;
      }
      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, userId, logoUrl: finalLogoUrl })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const backendMsg = (data && (data.error || data.message)) ? `: ${data.error || data.message}` : '';
        throw new Error('Erro ao criar organização' + backendMsg);
      }
      setSuccess('Organização criada!');
      // Se backend retornou a org criada, adicione-a diretamente no contexto para evitar refetch completo
      if (data && (data.id || data.organizationId)) {
        const created = data.id ? data : (data.organization || data);
        try { addOrganization({ id: created.id || created.organizationId, name: created.name || name, logoUrl: created.logoUrl || created.logo || '' }); } catch(e) {}
      } else {
        try { await refresh(); } catch (e) { /* não bloquear o usuário se refresh falhar */ }
      }
      setName("");
      setDescription("");
      setLogoFile(null);
      setLogoUrl("");
    } catch (e: any) {
      setError(e.message || 'Falha ao criar organização');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex">
      <SidebarMenu />
      <div className="flex-1 flex flex-col ml-[350px]">
        <AppHeader />
        <div className="flex flex-col gap-6 items-start px-8 mt-24 w-full max-w-[800px]">
          <h1 className="text-2xl font-bold text-[#091747]">Criar organização</h1>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 w-full flex flex-col gap-4">
            <label className="text-sm font-bold text-[#091747]">Nome</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da organização" />
            <label className="text-sm font-bold text-[#091747] mt-4">Descrição</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Fale um pouco sobre a organização" />
            <label className="text-sm font-bold text-[#091747] mt-4">Logo</label>
            <div className="flex items-center gap-4">
              <OrgLogoUpload onSelect={file => { setLogoFile(file); setLogoUrl(URL.createObjectURL(file)); }} logoUrl={logoUrl} />
              {logoUrl && (
                <img src={logoUrl} alt="Preview" className="w-12 h-12 object-cover rounded-full border" />
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button className="bg-[#2A2AD7] text-white" onClick={save} disabled={saving || name.trim().length === 0}>
                {saving ? 'Salvando...' : 'Criar organização'}
              </Button>
            </div>
            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganization;
