import * as React from "react";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ChangeEmail from "./account/ChangeEmail";
import ChangePassword from "./account/ChangePassword";
import FacePass from "./account/FacePass";
import EmailPreferences from "./account/EmailPreferences";
import CloseAccount from "./account/CloseAccount";
import PersonalData from "./account/PersonalData";
import { AlertTriangle } from "lucide-react";
import AccountSettingsSkeleton from "@/components/skeletons/AccountSettingsSkeleton";
import { fetchApi, apiUrl } from "@/lib/apiBase";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";

const AccountSettings: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("Informações da conta");
  const [userData, setUserData] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [cepStatus, setCepStatus] = useState<'idle'|'loading'|'error'|'filled'>('idle');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string|null>(null);
  const menuItems = [
    "Informações da conta",
  "Alterar e-mail",
  "Senha",
  "FacePass",
  "Preferências de e-mail",
  "Encerrar conta",
  "Dados pessoais"
  ];
  const { user, token, loading } = useAuth();
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingData(true);
      setError(null);
      if (!user || !token) {
        if (!loading) {
          setError('Usuário não autenticado');
          setShowLogin(true);
        } else {
          setShowLogin(false);
        }
        setLoadingData(false);
        return;
      } else {
        setShowLogin(false);
      }
      try { localStorage.setItem('userId', user.id); } catch {}
      try {
        const res = await fetchApi('/account-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          let msg = `Erro ao carregar (status ${res.status})`;
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
          } catch {}
          if (!cancelled) setError(msg);
        } else {
          const data = await res.json();
          if (!cancelled) {
            setUserData(data);
            setEditData({
              name: data.name || '',
              surname: data.surname || '',
              birth: data.birth ? data.birth.split('T')[0] : '',
                phone: maskPhone(data.phone || ''),
                cpf: maskCPF(data.cpf || ''),
                photoUrl: data.photoUrl || '',
                cep: maskCEP(data.cep || ''),
                address: data.address || '',
                complement: data.complement || '',
                city: data.city || '',
                state: data.state || '',
                country: data.country || ''
            });
          }
        }
      } catch (e: any) {
        if (!cancelled) setError('Falha de rede ao buscar dados da conta');
      } finally {
  if (!cancelled) setLoadingData(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [reloadKey, user, token]);

  if (loading || loadingData) return <AccountSettingsSkeleton />;
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0b0b] dark:text-white relative">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-start py-20 px-6">
          <div className="max-w-md w-full bg-white dark:bg-[#0b0b0b] border border-gray-200 dark:border-[#1F1F1F] rounded-xl shadow p-8 text-center">
            <p className="text-[#091747] dark:text-white font-semibold mb-2">Não foi possível carregar as configurações</p>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">{error}</p>
            {error === 'Usuário não autenticado' ? (
              <button
                onClick={() => setShowLogin(true)}
                className="bg-[#091747] text-white px-6 py-2 rounded font-medium hover:bg-[#2A2AD7] transition-colors"
              >Fazer login</button>
            ) : (
              <button
                onClick={() => { setError(null); setUserData(null); setReloadKey(k => k + 1); }}
                className="bg-[#2A2AD7] text-white px-6 py-2 rounded font-medium hover:bg-[#091747] transition-colors"
              >Tentar novamente</button>
            )}
          </div>
        </div>
        <LoginModal open={showLogin} onClose={() => { setShowLogin(false); setReloadKey(k => k + 1); }} />
      </div>
    );
  }
  if (!userData) return <AccountSettingsSkeleton />; // fallback segurança

  // Helpers de máscara / normalização
  function onlyDigits(v: string) { return v.replace(/\D+/g,''); }
  function maskCPF(v: string) {
    const d = onlyDigits(v).slice(0,11);
    if (!d) return '';
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  function maskCEP(v: string) {
    const d = onlyDigits(v).slice(0,8);
    if (d.length <=5) return d;
    return d.slice(0,5) + '-' + d.slice(5);
  }
  function maskPhone(v: string) {
    const d = onlyDigits(v).slice(0,11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }
  function unmask(v: string) { return onlyDigits(v); }

  async function fetchCEP(cepMasked: string) {
    const raw = unmask(cepMasked);
    if (raw.length !== 8) return;
    setCepStatus('loading');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      if (!res.ok) throw new Error('CEP lookup fail');
      const data = await res.json();
      if (data.erro) throw new Error('CEP não encontrado');
      setEditData((prev: any) => ({
        ...prev,
        address: `${data.logradouro || ''}`.trim(),
        city: data.localidade || '',
        state: data.uf || '',
        country: prev.country || 'Brasil'
      }));
      setCepStatus('filled');
    } catch (e) {
      setCepStatus('error');
    }
  }

  // Util para compor URL absoluta para imagens (caso backend esteja em outra origem)
  function fullImageUrl(u: string) {
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    // Se veio como /uploads/... prefixar com base detectada
    if (u.startsWith('/uploads/')) return apiUrl(u); // apiUrl já anexa base
    return u;
  }

  // Bloqueios
  const cpfLocked = !!userData?.cpf; // já salvo no banco
  const addressLocked = !!(userData?.cep || userData?.address || userData?.city || userData?.state || userData?.country);

  // Renderização dinâmica do conteúdo principal
  let MainContent;
  switch (activeMenuItem) {
    case "Informações da conta":
      MainContent = (
        <>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-[#091747] dark:text-white">Informações da conta</h1>
            <span className="text-sm text-[#091747] dark:text-white opacity-70">
              Conta criada em: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '--'}
            </span>
          </div>
          <hr className="my-6 border-gray-200" />
          {/* Foto do perfil */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[#091747] dark:text-white mb-3">Foto do perfil</h2>
            <div className="flex gap-6 items-center">
              <div
                className="relative group w-[140px] h-[140px] bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer transition-colors hover:border-[#2A2AD7]"
                onClick={() => document.getElementById('profile-photo-input')?.click()}
                onDragOver={(e)=>{e.preventDefault(); e.stopPropagation();}}
                onDrop={async (e)=>{
                    e.preventDefault(); e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    setUploadError(null);
                    if (!file.type.startsWith('image/')) { setUploadError('Arquivo não é imagem'); return; }
                    if (file.size > 5*1024*1024) { setUploadError('Tamanho máximo 5MB'); return; }
                    setUploadingPhoto(true);
                    try {
                      const form = new FormData(); form.append('file', file);
                      const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: form });
                      if (!res.ok) { let msg='Falha no upload'; try{const j=await res.json(); if(j?.error) msg=j.error;}catch{} setUploadError(msg); return; }
                      const data = await res.json();
                      if (data?.url) setEditData((p:any)=>({...p, photoUrl: data.url})); else setUploadError('Resposta inesperada');
                    } catch { setUploadError('Erro de rede no upload'); }
                    finally { setUploadingPhoto(false); }
                  }}
                >
                  {editData.photoUrl ? (
                    <img src={fullImageUrl(editData.photoUrl)} alt="avatar" className="w-full h-full object-cover" onError={(e)=>{(e.currentTarget as any).style.display='none'; setUploadError('Imagem não carregou (link inválido)');}} />
                  ) : (
                    <span className="text-xs text-gray-400 text-center px-2">Clique ou arraste uma imagem</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white text-xs transition-opacity">
                    {uploadingPhoto ? <span>Enviando...</span> : (
                      <>
                        <span className="font-medium">Alterar foto</span>
                        {editData.photoUrl && <button type="button" onClick={(e)=>{e.stopPropagation(); setEditData((p:any)=>({...p, photoUrl: ''}));}} className="px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded">Remover</button>}
                      </>
                    )}
                  </div>
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e)=>{
                      const file = e.target.files?.[0];
                      setUploadError(null);
                      if (!file) return;
                      if (!file.type.startsWith('image/')) { setUploadError('Arquivo não é imagem'); return; }
                      if (file.size > 5*1024*1024) { setUploadError('Tamanho máximo 5MB'); return; }
                      setUploadingPhoto(true);
                      try {
                        const form = new FormData(); form.append('file', file);
                        const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: form });
                        if (!res.ok) { let msg='Falha no upload'; try{const j=await res.json(); if(j?.error) msg=j.error;}catch{} setUploadError(msg); return; }
                        const data = await res.json();
                        if (data?.url) setEditData((p:any)=>({...p, photoUrl: data.url})); else setUploadError('Resposta inesperada');
                      } catch { setUploadError('Erro de rede no upload'); }
                      finally { setUploadingPhoto(false); if (e.target) e.target.value=''; }
                    }}
                  />
                </div>
                <p className="text-sm text-[#091747] dark:text-white opacity-80 max-w-[340px]">Clique ou arraste uma imagem quadrada. Máx 5MB. <a href="#" className="text-[#2A2AD7] underline">Saiba mais</a></p>
              </div>
              <div className="mt-3 min-h-[18px]">
                {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
                {!uploadError && editData.photoUrl && !uploadingPhoto && <span className="text-xs text-green-600">Foto pronta para salvar</span>}
              </div>
            </div>
            {/* Informações do usuário */}
            <h2 className="text-lg font-bold text-[#091747] dark:text-white mb-3 mt-8">Informações do usuário</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
              <input type="text" placeholder="Nome" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" />
              <input type="text" placeholder="Sobrenome" value={editData.surname} onChange={e => setEditData({ ...editData, surname: e.target.value })} className="col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <input type="date" placeholder="Nascimento" value={editData.birth} onChange={e => setEditData({ ...editData, birth: e.target.value })} className="col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" />
              <input type="text" placeholder="Celular" value={editData.phone} onChange={e => setEditData({ ...editData, phone: maskPhone(e.target.value) })} className="col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" />
            </div>
            <div className="mb-6">
              <input type="text" placeholder="CPF" value={editData.cpf} disabled={cpfLocked} onChange={e => setEditData({ ...editData, cpf: maskCPF(e.target.value) })} className={`w-full border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7] ${cpfLocked ? 'bg-gray-100 dark:bg-[#1F1F1F] cursor-not-allowed' : ''}`} />
              {cpfLocked && <p className="text-xs text-gray-500 mt-1">CPF já cadastrado e não pode ser alterado.</p>}
            </div>
            {/* Endereço */}
            <h2 className="text-lg font-bold text-[#091747] dark:text-white mb-3 mt-8">Endereço</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="relative col-span-1">
                <input type="text" placeholder="CEP" value={editData.cep} disabled={addressLocked}
                  onChange={e => {
                    const masked = maskCEP(e.target.value);
                    setEditData({ ...editData, cep: masked });
                    if (!addressLocked) {
                      const raw = unmask(masked);
                      if (raw.length === 8) fetchCEP(masked);
                    }
                  }}
                  className={`w-full border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7] ${addressLocked ? 'bg-gray-100 dark:bg-[#1F1F1F] cursor-not-allowed' : ''}`}
                />
                {cepStatus === 'loading' && <span className="absolute right-3 top-2 text-xs text-gray-500">Buscando...</span>}
                {cepStatus === 'error' && <span className="absolute right-3 top-2 text-xs text-red-500">CEP inválido</span>}
                {cepStatus === 'filled' && !addressLocked && <span className="absolute right-3 top-2 text-xs text-green-600">OK</span>}
              </div>
              <input type="text" placeholder="Endereço" value={editData.address} disabled={addressLocked} onChange={e => setEditData({ ...editData, address: e.target.value })} className={`col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7] ${addressLocked ? 'bg-gray-100 dark:bg-[#1F1F1F] cursor-not-allowed' : ''}`} />
            </div>
            <div className="mb-6">
              <input type="text" placeholder="Complemento" value={editData.complement} onChange={e => setEditData({ ...editData, complement: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <input type="text" placeholder="Cidade" value={editData.city} disabled={addressLocked} onChange={e => setEditData({ ...editData, city: e.target.value })} className={`col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7] ${addressLocked ? 'bg-gray-100 dark:bg-[#1F1F1F] cursor-not-allowed' : ''}`} />
              <input type="text" placeholder="Estado" value={editData.state} disabled={addressLocked} onChange={e => setEditData({ ...editData, state: e.target.value })} className={`col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7] ${addressLocked ? 'bg-gray-100 dark:bg-[#1F1F1F] cursor-not-allowed' : ''}`} />
              <input type="text" placeholder="País" value={editData.country} disabled={addressLocked} onChange={e => setEditData({ ...editData, country: e.target.value })} className={`col-span-1 border border-gray-300 rounded-lg px-4 py-2 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2A2AD7] ${addressLocked ? 'bg-gray-100 dark:bg-[#1F1F1F] cursor-not-allowed' : ''}`} />
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                //disabled={saving}
                className={`bg-[#2A2AD7] text-white font-bold px-8 py-3 rounded-lg text-lg shadow hover:bg-[#091747] transition-colors`}
                onClick={async () => {
                  setSaving(true);
                  if (!user || !token) { setError('Usuário não autenticado'); return; }
                  try { localStorage.setItem('userId', user.id); } catch {}
                  // Desfazer máscaras antes de enviar
                  const payload = {
                    ...editData,
                    cpf: unmask(editData.cpf),
                    phone: unmask(editData.phone),
                    cep: unmask(editData.cep),
                  };
                  console.log('[AccountSettings] Enviando payload para backend:', payload);
                  try {
                    const res = await fetchApi('/account-settings', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(payload)
                    });
                    let responseBody;
                    try { responseBody = await res.clone().json(); } catch { responseBody = null; }
                    console.log('[AccountSettings] Resposta do backend:', res.status, responseBody);
                    if (!res.ok) {
                      let msg = `Erro ao salvar (status ${res.status})`;
                      if (responseBody && responseBody.error) msg = responseBody.error;
                      setError(msg);
                    } else {
                      const data = responseBody;
                      console.log('[AccountSettings] Dados recebidos do backend:', data);
                      setUserData(data);
                      try { window.dispatchEvent(new Event('profile-updated')); } catch {}
                      // Reaplica máscaras após salvar / travar
                      setEditData((prev: any) => ({
                        ...prev,
                        cpf: maskCPF(data.cpf || prev.cpf || ''),
                        phone: maskPhone(data.phone || prev.phone || ''),
                        cep: maskCEP(data.cep || prev.cep || ''),
                      }));
                    }
                  } catch (err) {
                    setError('Falha de rede ao salvar');
                    console.error('[AccountSettings] Erro ao salvar:', err);
                  } finally {
                    setSaving(false);
                    console.log('Estado saving:', saving);
                  }
                }}
              >{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
        </>
      );
      break;
    case "Alterar e-mail":
      MainContent = (<><ChangeEmail /></>);
      break;
    case "Senha":
      MainContent = (<><ChangePassword /></>);
      break;
    case "FacePass":
      MainContent = (<><FacePass /></>);
      break;
    case "Preferências de e-mail":
      MainContent = (<><EmailPreferences /></>);
      break;
    case "Encerrar conta":
      MainContent = (<><CloseAccount /></>);
      break;
    case "Dados pessoais":
      MainContent = (<><PersonalData /></>);
      break;
    default:
      MainContent = null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0b] dark:text-white">
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-[280px] h-[100vh] bg-gray-50 dark:bg-[#0b0b0b] border-r border-gray-100 dark:border-[#1F1F1F] max-md:w-[250px] max-sm:hidden">
          <div className="flex flex-col">
            <div className="flex flex-col gap-11 items-start p-8 pt-5">
              {menuItems.map((item) => (
                <div key={item} className="flex justify-between items-center w-full">
                  <button
                    onClick={() => setActiveMenuItem(item)}
                    className={`w-full text-sm font-bold text-left px-3 py-2 rounded transition-colors ${
                      activeMenuItem === item
                        ? 'text-[#2A2AD7] dark:text-[#EF4118] bg-gray-100 dark:bg-[#242424]'
                        : 'text-[#091747] dark:text-white hover:text-[#2A2AD7] dark:hover:text-[#EF4118] hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                    }`}
                  >
                    {item}
                  </button>
                  {item === "FacePass" && (
                    <AlertTriangle className="w-4 h-4 text-[#F9C900] ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Conteúdo dinâmico */}
        <div className="flex-1 flex justify-center items-start py-12 px-8 bg-[#F8F7FA] dark:bg-[#0b0b0b]">
          <div className="w-full max-w-[700px] bg-white dark:bg-[#0b0b0b] rounded-3xl shadow-xl p-10 border border-gray-100 dark:border-[#1F1F1F]">
            {MainContent}
          </div>
        </div>
      </div>
      <LoginModal open={showLogin} onClose={() => { setShowLogin(false); setReloadKey(k => k + 1); }} />
    </div>
  );
};

export default AccountSettings;
