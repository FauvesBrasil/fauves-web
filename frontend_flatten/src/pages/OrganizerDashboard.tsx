import * as React from "react";
import OrganizerEditDrawer from '@/components/OrganizerEditDrawer';
import { useAuth } from "@/context/AuthContext";
import { ensureApiBase, apiUrl } from '@/lib/apiBase';
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HelpCircle, Calendar, Ticket, Bell, Users, Settings, LogOut, Repeat2, User as UserIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import logoSquare from "@/assets/logo-square-fauves-blue.svg";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import NextEventCardSkeleton from "../components/skeletons/NextEventCardSkeleton";
import OrgProfileCardSkeleton from "../components/skeletons/OrgProfileCardSkeleton";
import { useOrganization } from '@/context/OrganizationContext';
import RequireOrganization from '@/components/RequireOrganization';
interface UserDropdownProps {
  userName: string;
  userEmail: string;
}

function UserDropdown({ userName, userEmail }: UserDropdownProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="flex items-center gap-2 bg-[#F6F7F9] rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-[#e9eaf0]"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gray-300">
              <div className="w-full h-full rounded-full bg-gray-300"></div>
            </AvatarFallback>
          </Avatar>
        </div>
  <span className="text-[#091747] font-bold text-[15px]">{userName}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="ml-1 text-[#091747]">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-blue-200 z-50 flex flex-col text-[#091747] text-[15px] font-bold">
          <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 rounded-t-xl text-[#091747]" onClick={() => navigate("/")}> 
            <Repeat2 className="w-5 h-5" />
            Mudar para participante
          </button>
          <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 border-t border-blue-100 text-[#091747]">
            <UserIcon className="w-5 h-5" />
            Configurações da conta
          </button>
          <button className="flex flex-col items-start gap-1 px-5 py-4 hover:bg-blue-50 border-t border-blue-100 rounded-b-xl text-[#EF4118]" onClick={handleLogout}>
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Sair
            </span>
            <span className="text-xs text-[#091747] font-normal mt-1">{userEmail}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const OrganizerDashboard = () => {
  // Estado para Drawer de edição igual ao OrganizerSettingsPage
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const openEditDrawer = () => {
    if (orgInfo && orgInfo.id) {
      setForm({ ...orgInfo });
      setDrawerOpen(true);
    } else {
      setSaveError('Selecione uma organização válida para editar.');
    }
  };
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      let logoUrl = form.logoUrl;
      if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('data:image')) {
        const arr = logoUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        const file = new Blob([u8arr], { type: mime });
        const formData = new FormData();
        formData.append('file', file, 'logo.png');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          logoUrl = data.url;
        } else {
          setSaveError('Erro ao enviar imagem');
          setSaving(false);
          return;
        }
      }
      const payload = { ...form, logoUrl };
      if (!form || !form.id) {
        setSaveError('Organização não definida. Tente novamente ou selecione uma organização.');
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/organization/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>null);
        setSaveError(data?.error || data?.message || 'Erro ao salvar organização');
        setSaving(false);
        return;
      }
      setDrawerOpen(false);
      await ensureApiBase();
      if (selectedOrg) {
        const org = await fetch(apiUrl(`/api/organization/${selectedOrg.id}`)).then(r => r.json());
        setOrgInfo(org);
      }
    } catch (e: any) {
      setSaveError(e?.message || 'Erro ao salvar organização');
      setSaving(false);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrg, loading: loadingOrgs, orgs, refresh } = useOrganization();
  const { user } = useAuth();
  const [nextEvent, setNextEvent] = React.useState<any>(null);
  const [orgInfo, setOrgInfo] = React.useState<any>(null);
  const [orgEventCount, setOrgEventCount] = React.useState<number>(0);
  const [loadingEvent, setLoadingEvent] = React.useState(false);
  const [loadingOrg, setLoadingOrg] = React.useState(false);

  // Reage à troca de organização selecionada
  React.useEffect(() => {
    let cancelled = false;
    const loadOrgScopedData = async () => {
      setNextEvent(null);
      setOrgInfo(null);
      setOrgEventCount(0);
      if (!selectedOrg) return;
      setLoadingOrg(true);
      setLoadingEvent(true);
      try {
        await ensureApiBase();
        const attempt = async (paths: string[]) => {
          for (const p of paths) {
            try {
              const r = await fetch(p, { headers: { 'Accept': 'application/json' } });
              if (r.ok) return await r.json();
            } catch { }
          }
          return null;
        };
        const baseUrls = (path: string) => {
          const arr: string[] = [apiUrl(path)];
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('eventsApiBase') : null;
            if (stored) arr.push(`${stored.replace(/\/$/, '')}${path}`);
          arr.push(`http://localhost:4000${path}`);
          return arr;
        };
        const org = await attempt(baseUrls(`/api/organization/${selectedOrg.id}`));
        if (!cancelled && org) setOrgInfo(org);
        const countData = await attempt(baseUrls(`/api/organization/${selectedOrg.id}/events/count`));
        if (!cancelled && countData && typeof countData.count === 'number') setOrgEventCount(countData.count);
        const next = await attempt(baseUrls(`/api/organization/${selectedOrg.id}/events/next`));
        if (!cancelled && next && next.id) setNextEvent(next);
        (window as any).__dbgDashboardOrgData = { org, countData, next };
      } finally {
        if (!cancelled) { setLoadingOrg(false); setLoadingEvent(false); }
      }
    };
    loadOrgScopedData();
    return () => { cancelled = true; };
  }, [selectedOrg?.id]);
  const userName = user?.name ? user.name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : "Visitante");
  const userEmail = user?.email || "";
  // Modal para criar organização se não houver nenhuma
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const modalAutoOpenedRef = useRef(false);

  // Auto-open RequireOrganization modal when authenticated user has no orgs
  useEffect(() => {
    try {
      if (!user || !user.email) return;
      if (loadingOrgs) return;
      const hasOrgs = Array.isArray(orgs) && orgs.length > 0;
      if (!hasOrgs && !modalAutoOpenedRef.current) {
        console.debug('[OrganizerDashboard] No organizations found for user, opening RequireOrganization modal');
        modalAutoOpenedRef.current = true;
        setShowCreateOrgModal(true);
      }
      if (hasOrgs) modalAutoOpenedRef.current = false;
    } catch (e) {
      console.warn('[OrganizerDashboard] auto-open org modal effect failed', e);
    }
  }, [user, loadingOrgs, orgs]);

  return (
    <div className="relative min-h-screen w-full bg-white flex justify-center items-start">
      {/* When modal is open, show a simple translucent cover; keep detailed skeleton only when modal is NOT open */}
      {(!loadingOrgs && Array.isArray(orgs) && orgs.length === 0 && user && !showCreateOrgModal) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white">
          <div className="w-full max-w-4xl p-6">
            <div className="mb-6">
              <div className="text-2xl font-bold text-center text-slate-900">Crie o perfil da sua organização</div>
              <div className="text-sm text-center text-slate-600 mt-2">Você precisa de uma organização para acessar o painel de organizador.</div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <OrgProfileCardSkeleton />
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <NextEventCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      )}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40">
          <div className="w-full h-full" aria-hidden="true" />
        </div>
      )}
      <SidebarMenu />
      <div className="rounded-3xl h-[852px] w-[1352px] bg-white max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 items-start left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:px-0 max-md:py-5 max-md:w-full max-sm:px-0 max-sm:py-4">
          <div className="mb-6 text-4xl font-bold text-slate-900 max-sm:text-3xl">Olá, {userName}!</div>
          {showCreateOrgModal && (
            <RequireOrganization
              onCreated={(org) => {
                // Return the refresh() Promise so RequireOrganization animation waits for context update
                try { return refresh(); } catch (e) { return Promise.resolve(); }
              }}
              onClose={() => setShowCreateOrgModal(false)}
            />
          )}
          <div className="flex gap-5 items-start w-full max-md:flex-col max-md:gap-5">
            <div className="flex flex-col gap-5 items-start max-w-[900px] w-full">
              {/* Próximo evento estilizado ou card de criação */}
              {loadingEvent ? (
                <NextEventCardSkeleton />
              ) : nextEvent ? (
                (() => {
                  const startDate = new Date(nextEvent.startDate);
                  const now = new Date();
                  const diffDays = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000*60*60*24)));
                  // Fases: até 15 dias = 1 azul, 15 a 6 = 2 azuis, 5 ou menos = 3 azuis
                  let fase = 1;
                  if (diffDays <= 5) fase = 3;
                  else if (diffDays <= 15) fase = 2;
                  // Card clicável
                  return (
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 w-full flex flex-col gap-6 shadow-sm">
                      <div className="text-2xl font-bold text-[#091747] mb-2">
                        Seu próximo evento acontecerá daqui a <span className="text-[#2A2AD7]">{diffDays} {diffDays === 1 ? 'dia' : 'dias'}</span>
                      </div>
                      <div
                        className="flex items-center bg-[#F6F7FB] rounded-xl px-6 py-5 gap-6 cursor-pointer hover:shadow-md transition"
                        onClick={() => navigate(`/painel-evento/${nextEvent.id}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex flex-col items-center justify-center w-16">
                          <div className="text-[15px] font-bold text-[#EF4118] uppercase mb-0 leading-none">
                            {startDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-3xl font-bold text-[#091747] leading-none">
                            {startDate.getDate().toString().padStart(2, '0')}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="font-bold text-lg text-[#091747]">{nextEvent.name}</div>
                          <div className="text-sm text-[#091747]">Inicia {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                          <div className="text-xs text-[#EF4118] font-bold mt-1">À venda</div>
                        </div>
                        <div className="flex flex-col items-end min-w-[120px]">
                          <div className="text-lg font-bold text-[#091747]">0 / 100</div>
                          <div className="text-xs text-[#091747]">Ingressos vendidos</div>
                        </div>
                        <span className="ml-4 text-[#091747] text-2xl font-bold">&gt;</span>
                      </div>
                      {/* Fases do evento dinâmicas */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-[#091747]">Fase do evento</span>
                          <HelpCircle className="w-4 h-4 text-[#A0A3BD]" />
                        </div>
                        <div className="flex items-center gap-0 w-full">
                          <div className="flex-1 flex flex-col items-center">
                            <div className={`h-1 w-full rounded-t-full ${fase >= 1 ? 'bg-[#2A2AD7]' : 'bg-[#E5E7EB]'}`} />
                            <span className={`text-xs font-bold mt-2 ${fase >= 1 ? 'text-[#2A2AD7]' : 'text-[#A0A3BD]'}`}>Compra antecipada</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <div className={`h-1 w-full rounded-t-full ${fase >= 2 ? 'bg-[#2A2AD7]' : 'bg-[#E5E7EB]'}`} />
                            <span className={`text-xs font-bold mt-2 ${fase >= 2 ? 'text-[#2A2AD7]' : 'text-[#A0A3BD]'}`}>Quase lá</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <div className={`h-1 w-full rounded-t-full ${fase === 3 ? 'bg-[#2A2AD7]' : 'bg-[#E5E7EB]'}`} />
                            <span className={`text-xs font-bold mt-2 ${fase === 3 ? 'text-[#2A2AD7]' : 'text-[#A0A3BD]'}`}>Última chamada</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col gap-4 items-center px-10 py-16 bg-gray-50 rounded-xl w-full max-md:px-5 max-md:py-10 max-md:w-full max-sm:px-4 max-sm:py-8">
                  <div className="text-lg font-bold text-center text-slate-900 max-sm:text-base">Crie seu evento</div>
                  <div className="text-sm text-center text-slate-700 w-full max-md:w-full max-md:max-w-[400px] max-sm:text-sm">Adicionar todos os detalhes do seu evento, criar novos ingressos e configurar eventos recorrentes</div>
                  <Button
                    className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[45px] w-[120px] rounded-md"
                    onClick={() => navigate("/create-event")}
                  >
                    Criar evento
                  </Button>
                </div>
              )}
              {/* Help Section */}
              <Card className="p-5 bg-white rounded-xl border border-solid border-zinc-200 w-full">
                <CardContent className="p-0">
                  <div className="flex flex-col gap-1.5 items-start mb-4 w-full">
                    <div className="text-2xl font-bold text-slate-800 max-sm:text-2xl">Como podemos ajudar?</div>
                    <div className="text-base text-indigo-700 cursor-pointer hover:text-indigo-800 transition-colors">Ir para Central de Ajuda</div>
                  </div>
                  <div className="flex gap-6 items-center max-md:flex-wrap max-md:gap-4 max-sm:flex-col max-sm:gap-4">
                    {[
                      "Criando um evento",
                      "Sua conta",
                      "Comercializando um evento",
                      "Pagamentos e impostos"
                    ].map((title, index) => (
                      <div key={index} className="flex flex-col gap-4 items-center px-7 py-6 bg-white rounded-xl border border-solid border-zinc-200 h-[140px] w-[156px] max-md:w-[calc(50%_-_7.5px)] max-sm:p-5 max-sm:w-full cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-[43px] h-[43px] bg-blue-50 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-indigo-200 rounded-full"></div>
                        </div>
                        <div className="text-sm font-bold text-center text-slate-800 w-[100px]">{title}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Right Section - Profile Card */}
            <div className="h-[283px] w-[259px] max-md:w-full">
              {loadingOrg ? (
                <OrgProfileCardSkeleton />
              ) : (
              <Card className="flex flex-col justify-between p-5 bg-white rounded-xl border border-solid border-zinc-200 h-[283px] w-[259px] max-md:w-full">
                <CardContent className="p-0">
                  {selectedOrg ? (
                    orgInfo ? (
                      <div className="flex flex-col gap-3 items-start">
                        {orgInfo.logoUrl ? (
                          <img src={orgInfo.logoUrl} alt="Logo da organização" className="w-[50px] h-[50px] rounded-full object-cover" />
                        ) : (
                          <Avatar className="w-[50px] h-[50px]">
                            <AvatarFallback className="bg-gray-300">
                              <div className="w-full h-full rounded-full bg-gray-300"></div>
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="text-2xl font-bold text-slate-900 max-sm:text-2xl">{orgInfo.name || selectedOrg.name}</div>
                        <div className="flex gap-5 items-center max-sm:flex-col max-sm:gap-2.5 max-sm:items-start">
                          <a href={orgInfo.publicUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-base text-indigo-700 cursor-pointer hover:text-indigo-800 transition-colors">Ver página</a>
                          <button type="button" className="text-base text-indigo-700 cursor-pointer hover:text-indigo-800 transition-colors" onClick={openEditDrawer}>Editar</button>
                          <OrganizerEditDrawer
                            open={drawerOpen}
                            onOpenChange={setDrawerOpen}
                            org={orgInfo}
                            isNew={false}
                            onSave={handleSave}
                            saving={saving}
                            saveError={saveError}
                            form={form}
                            setForm={setForm}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 items-start">
                        <div className="text-sm text-slate-900">Carregando informações da organização...</div>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col gap-3 items-start">
                      <div className="text-sm text-slate-900">Nenhuma organização selecionada.</div>
                      {(!loadingOrgs && orgs.length === 0) && (
                        <Button
                          className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[38px] px-3 rounded-md"
                          onClick={() => navigate("/criar-organizacao")}
                        >
                          Criar organização
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col items-start mt-8">
                    <div className="text-base font-bold text-slate-900">{orgEventCount}</div>
                    <div className="text-sm text-slate-900">Total de eventos</div>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default OrganizerDashboard;
