import * as React from "react";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ChangeEmail from "./account/ChangeEmail";
import ChangePassword from "./account/ChangePassword";
import FacePass from "./account/FacePass";
import EmailPreferences from "./account/EmailPreferences";
import CloseAccount from "./account/CloseAccount";
import PersonalData from "./account/PersonalData";
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Bell, 
  Trash2, 
  IdCard, 
  MapPin, 
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Check
} from "lucide-react";
import AccountSettingsSkeleton from "@/components/skeletons/AccountSettingsSkeleton";
import { fetchApi, apiUrl } from "@/lib/apiBase";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";

const AccountSettings: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("Informações da conta");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    { label: "Informações da conta", icon: User },
    { label: "Alterar e-mail", icon: Mail },
    { label: "Senha", icon: Lock },
    { label: "FacePass", icon: ShieldCheck, alert: true },
    { label: "Preferências de e-mail", icon: Bell },
    { label: "Dados pessoais", icon: IdCard },
    { label: "Encerrar conta", icon: Trash2, danger: true },
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
        }
        setLoadingData(false);
        return;
      }
      setShowLogin(false);
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
      } catch (e) {
        if (!cancelled) setError('Falha de rede ao buscar dados da conta');
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [reloadKey, user, token]);

  if (loading || loadingData) return <AccountSettingsSkeleton />;

  // Helpers de máscara
  function onlyDigits(v: string) { return v.replace(/\D+/g,''); }
  function maskCPF(v: string) {
    const d = onlyDigits(v).slice(0,11);
    if (!d) return '';
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
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
      const data = await res.json();
      if (data.erro) throw new Error();
      setEditData((prev: any) => ({
        ...prev,
        address: `${data.logradouro || ''}`.trim(),
        city: data.localidade || '',
        state: data.uf || '',
        country: 'Brasil'
      }));
      setCepStatus('filled');
    } catch {
      setCepStatus('error');
    }
  }

  function fullImageUrl(u: string) {
    if (!u) return '';
    if (u.startsWith('http')) return u;
    return apiUrl(u.startsWith('/') ? u : '/' + u);
  }

  const cpfLocked = !!userData?.cpf;
  const addressLocked = !!(userData?.cep || userData?.address);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editData,
        cpf: unmask(editData.cpf),
        phone: unmask(editData.phone),
        cep: unmask(editData.cep),
      };
      const res = await fetchApi('/account-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'Erro ao salvar');
      } else {
        const data = await res.json();
        setUserData(data);
        window.dispatchEvent(new Event('profile-updated'));
        setError(null);
      }
    } catch {
      setError('Falha de rede ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const menuButtonClass = (item: any) => `
    w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300
    ${activeMenuItem === item.label 
      ? 'bg-[#2A2AD7] text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 translate-x-1' 
      : item.danger 
        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:translate-x-1'
        : 'text-[#091747] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:translate-x-1'
    }
  `;

  let MainContent;
  switch (activeMenuItem) {
    case "Informações da conta":
      MainContent = (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[#091747] dark:text-white tracking-tight mb-1">Configurações</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie suas informações pessoais e segurança</p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] rounded-full text-gray-500 uppercase tracking-wider">
              ID: {userData?.id?.slice(0, 8)}...
            </div>
          </div>

          {/* Section: Profile Photo */}
          <div className="bg-gray-50 dark:bg-[#121212] rounded-[24px] p-6 mb-8 border border-gray-100 dark:border-[#222]">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-[124px] h-[124px] rounded-full overflow-hidden border-4 border-white dark:border-[#1A1A1A] shadow-xl transition-transform group-hover:scale-105 duration-300">
                  {editData.photoUrl ? (
                    <img src={fullImageUrl(editData.photoUrl)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#F3F4FE] dark:bg-[#1A1A1A] flex items-center justify-center text-3xl font-bold text-[#2A2AD7]">
                      {editData.name?.charAt(0) || user?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => document.getElementById('photo-input')?.click()}
                  className="absolute bottom-1 right-1 w-10 h-10 bg-[#2A2AD7] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input 
                  id="photo-input" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingPhoto(true);
                    setUploadError(null);
                    try {
                      const form = new FormData(); form.append('file', file);
                      const res = await fetchApi('/api/upload?folder=avatars', { method: 'POST', body: form });
                      const d = await res.json();
                      if (d.url) setEditData(p => ({...p, photoUrl: d.url}));
                    } catch { setUploadError('Falha no upload'); }
                    finally { setUploadingPhoto(false); }
                  }}
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-[#091747] dark:text-white mb-1">Sua foto de perfil</h3>
                <p className="text-sm text-gray-500 mb-4">Recomendamos uma imagem quadrada de no mínimo 400x400px.</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <button 
                    onClick={() => document.getElementById('photo-input')?.click()}
                    className="text-xs font-bold px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-full hover:bg-gray-50 transition-colors"
                  >Alterar foto</button>
                  {editData.photoUrl && (
                    <button 
                      onClick={() => setEditData(p => ({...p, photoUrl: ''}))}
                      className="text-xs font-bold px-4 py-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >Remover</button>
                  )}
                </div>
                {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
              </div>
            </div>
          </div>

          {/* Section: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">Nome</label>
              <input 
                type="text" 
                value={editData.name} 
                onChange={e => setEditData({...editData, name: e.target.value})}
                className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">Sobrenome</label>
              <input 
                type="text" 
                value={editData.surname} 
                onChange={e => setEditData({...editData, surname: e.target.value})}
                className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">CPF</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={editData.cpf} 
                  disabled={cpfLocked}
                  onChange={e => setEditData({...editData, cpf: maskCPF(e.target.value)})}
                  className={`w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] outline-none transition-all font-medium ${cpfLocked ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7]'}`}
                />
                {cpfLocked && <ShieldCheck className="absolute right-5 top-4.5 w-5 h-5 text-green-500" />}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">WhatsApp / Celular</label>
              <input 
                type="text" 
                value={editData.phone} 
                onChange={e => setEditData({...editData, phone: maskPhone(e.target.value)})}
                className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Section: Address */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#091747] dark:text-white mb-6 ml-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2A2AD7]" /> Endereço residencial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">CEP</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={editData.cep} 
                    onChange={e => {
                      const m = maskCEP(e.target.value);
                      setEditData({...editData, cep: m});
                      if (m.length === 9) fetchCEP(m);
                    }}
                    className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
                  />
                  {cepStatus === 'loading' && <Loader2 className="absolute right-5 top-4.5 w-5 h-5 text-[#2A2AD7] animate-spin" />}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">Logradouro / Rua</label>
                <input 
                  type="text" 
                  value={editData.address} 
                  onChange={e => setEditData({...editData, address: e.target.value})}
                  className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">Cidade</label>
                <input 
                  type="text" 
                  value={editData.city} 
                  onChange={e => setEditData({...editData, city: e.target.value})}
                  className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">UF</label>
                <input 
                  type="text" 
                  value={editData.state} 
                  onChange={e => setEditData({...editData, state: e.target.value})}
                  className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#091747] dark:text-gray-400 ml-4 uppercase tracking-widest">Complemento</label>
                <input 
                  type="text" 
                  value={editData.complement} 
                  onChange={e => setEditData({...editData, complement: e.target.value})}
                  className="w-full h-14 px-6 rounded-full border border-gray-100 dark:border-[#222] bg-white dark:bg-[#1A1A1A] focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2A2AD7] outline-none transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl mb-6">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 h-14 px-10 rounded-full bg-[#2A2AD7] text-white font-extrabold shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-[#1e1eb8] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      );
      break;
    case "Alterar e-mail": MainContent = <ChangeEmail />; break;
    case "Senha": MainContent = <ChangePassword />; break;
    case "FacePass": MainContent = <FacePass />; break;
    case "Preferências de e-mail": MainContent = <EmailPreferences />; break;
    case "Encerrar conta": MainContent = <CloseAccount />; break;
    case "Dados pessoais": MainContent = <PersonalData />; break;
    default: MainContent = null;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0b0b0b] text-[#091747] dark:text-gray-100 selection:bg-indigo-100">
      <Header hideSearchOnMobile={true} />
      
      {/* Mobile Top Bar */}
      <div className="max-sm:flex hidden items-center justify-between px-6 py-4 bg-white dark:bg-[#0b0b0b] border-b border-gray-100 dark:border-[#1A1A1A] sticky top-0 z-40">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-sm tracking-tight capitalize">{activeMenuItem}</span>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100">
           <img src={fullImageUrl(userData?.photoUrl)} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] sm:hidden">
          <div className="absolute inset-0 bg-[#091747]/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white dark:bg-[#0b0b0b] shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6">
                <span className="text-xl font-black text-[#091747] dark:text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 px-4 space-y-2">
                {menuItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => { setActiveMenuItem(item.label); setMobileMenuOpen(false); }}
                    className={menuButtonClass(item)}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-bold text-sm">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto flex gap-8 px-6 py-10">
        {/* Desktop Sidebar */}
        <div className="hidden sm:block w-[320px] shrink-0">
          <div className="bg-white dark:bg-[#0d0d0d] rounded-[32px] p-6 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-[#1A1A1A] sticky top-28">
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-50 p-0.5">
                <img src={fullImageUrl(userData?.photoUrl)} alt="" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <p className="text-sm font-black text-[#091747] dark:text-white truncate max-w-[180px]">{userData?.name}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{userData?.role === 'organizer' ? 'Organizador' : 'Participante'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {menuItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => setActiveMenuItem(item.label)}
                  className={menuButtonClass(item)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </div>
                  {item.alert && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  {!item.alert && <ChevronRight className={`w-4 h-4 transition-opacity ${activeMenuItem === item.label ? 'opacity-100' : 'opacity-0'}`} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-[800px]">
          <div className="bg-white dark:bg-[#0d0d0d] rounded-[40px] p-10 max-sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-50 dark:border-[#1A1A1A] min-h-[600px]">
            {MainContent}
          </div>
        </div>
      </div>

      <LoginModal open={showLogin} onClose={() => { setShowLogin(false); setReloadKey(k => k + 1); }} />
    </div>
  );
};

export default AccountSettings;
