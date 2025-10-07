import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrgLogoUpload from "./OrgLogoUpload";

interface RequireOrganizationProps {
  onCreated: (org: any) => void;
  onClose?: () => void;
}

const RequireOrganization: React.FC<RequireOrganizationProps> = ({ onCreated, onClose }) => {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any|undefined>(undefined);
  const [logoFile, setLogoFile] = useState<File|null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  // Preview do logo
  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  };
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);
  const handleCreate = async () => {
    setLoading(true);
    setError("");
    if (user === undefined) {
      setError("Aguardando autenticação do usuário...");
      setLoading(false);
      return;
    }
    if (!user || !user.id) {
      setError("Usuário não autenticado. Faça login novamente.");
      setLoading(false);
      return;
    }
    if (!orgName.trim()) {
      setError("Nome da organização obrigatório");
      setLoading(false);
      return;
    }
    try {
      const attempt = async (url: string) => {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: orgName,
            userId: user.id,
            userEmail: user.email,
            userName: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name || user.email?.split('@')[0] || null,
          }),
        });
        return r;
      };
      let res = await attempt('/api/organization');
      if (!res.ok) {
        console.warn('[RequireOrganization] tentativa via proxy falhou status', res.status);
        try { res = await attempt('http://localhost:4000/api/organization'); } catch (e) { console.warn('[RequireOrganization] fallback direto falhou', e); }
      }
      if (res && res.ok) {
        const org = await res.json(); onCreated(org);
      } else if (res) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error || err?.message || 'Erro ao criar organização';
        const code = err?.code ? ` (code: ${err.code})` : '';
        setError(msg + code);
        console.warn('[RequireOrganization] erro criar organização', err);
      } else {
        setError('Falha de rede ao criar organização');
      }
    } catch (e: any) {
      setError("Erro de conexão ao criar organização");
    }
    setLoading(false);
  };
  if (user === undefined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-2xl p-8 min-w-[340px] flex flex-col items-center">
          <span className="text-indigo-900 text-lg font-semibold">Carregando autenticação...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F6F7F9]/90">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-8 flex flex-col items-center border border-[#E5E7EB]" style={{maxWidth: 420, minWidth: 340}}>
        <div className="w-full flex justify-end mb-2">
          {onClose && (
            <button
              type="button"
              className="text-[#2A2AD7] text-xl font-bold px-2 py-1 rounded hover:bg-[#F3F4FE] focus:outline-none"
              onClick={onClose}
              aria-label="Fechar modal"
            >
              ×
            </button>
          )}
        </div>
        <span className="text-[18px] font-bold text-[#091747] text-center mb-7 leading-snug" style={{lineHeight: 1.25}}>
          Crie o perfil da sua organização<br />antes de cadastrar seu evento.
        </span>
        <div className="flex items-center gap-4 w-full justify-center mb-7">
          <OrgLogoUpload logoUrl={logoUrl} onSelect={handleLogoSelect} />
          <Input
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="Nome da organização"
            className="flex-1 h-14 rounded-full border border-[#E5E7EB] bg-white px-6 text-base text-[#091747] font-medium shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-[#2A2AD7]"
            style={{maxWidth: 260, minWidth: 180}}
          />
        </div>
        {error && <div className="text-red-600 text-sm mb-2 text-center w-full">{error}</div>}
        <Button
          onClick={handleCreate}
          disabled={loading || !orgName.trim()}
          className="w-full mt-0 shadow bg-[#2A2AD7] hover:bg-[#1e1eb8] text-white font-bold rounded-full py-4 text-base text-center"
          style={{minHeight: 56, fontSize: 18, background:'#2A2AD7'}}
        >
          {loading ? "Criando..." : "Criar organização"}
        </Button>
      </div>
    </div>
  );
};
export default RequireOrganization;
