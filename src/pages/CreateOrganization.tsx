import * as React from "react";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CreateOrganization: React.FC = () => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string| null>(null);
  const [success, setSuccess] = React.useState<string| null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const userId = localStorage.getItem('userId') || '';
      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, userId })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const backendMsg = (data && (data.error || data.message)) ? `: ${data.error || data.message}` : '';
        throw new Error('Erro ao criar organização' + backendMsg);
      }
      console.log('[CreateOrganization] criada', data);
      setSuccess('Organização criada!');
      setName("");
      setDescription("");
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
            <div className="flex justify-end mt-4">
              <Button className="bg-[#2A2AD7] text-white" onClick={save} disabled={saving || !name}>
                {saving ? 'Salvando...' : 'Salvar'}
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
