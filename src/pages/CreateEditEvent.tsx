import RequireOrganization from "@/components/RequireOrganization";
import { useUserOrganizations } from "@/hooks/useUserOrganizations";
import * as React from "react";
import SidebarMenu from "@/components/SidebarMenu";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, Calendar, Upload, ExternalLink, ChevronDown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import CreateEditEventSkeleton from "@/components/skeletons/CreateEditEventSkeleton";
import StepFlowOverlay from "@/components/overlays/StepFlowOverlay";
import { apiUrl } from "@/lib/apiBase";

interface UserDropdownProps {
  userName: string;
  userEmail: string;
}

function UserDropdown({ userName, userEmail }: UserDropdownProps) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // ...dropdown logic...
  return null;
}

// Lista de UFs do Brasil
const BRAZIL_UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO"
];

function CreateEditEvent() {
  const location = useLocation();
  const eventId = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("eventId");
  }, [location.search]);
  const [flowVisible, setFlowVisible] = useState(false);
  const [flowStep, setFlowStep] = useState<1 | 2 | 3>(1);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const { orgs, loading: orgsLoading, refetch } = useUserOrganizations(!eventId);
  const [orgCreated, setOrgCreated] = useState(false);
  // Banner preview state
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apenas faz preview local ao selecionar
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerUrl(URL.createObjectURL(file));
  };

  const [eventName, setEventName] = useState("");
  const [eventSubtitle, setEventSubtitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(false);
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: eventDescription,
    onUpdate: ({ editor }) => {
      setEventDescription(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'w-full min-h-[120px] border border-[#E5E7EB] rounded-xl p-4 text-base text-[#091747] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200',
      },
    },
  });
  const [selectedLocation, setSelectedLocation] = useState<
    "Local" | "Evento online" | "Local será anunciado em breve"
  >("Local");
  // Campos de localização
  const [locationAddress, setLocationAddress] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [tbdUf, setTbdUf] = useState("");
  const [tbdCity, setTbdCity] = useState("");
  const [locErrors, setLocErrors] = useState<{ url?: string; tbd?: string }>({});
  const [eventStatus, setEventStatus] = useState<"Rascunho" | "Publicado">("Rascunho");
  const [user, setUser] = useState<any>(null);
  // Organizações do usuário logado
  const organizerOptions = orgs && orgs.length > 0 ? orgs.map(org => ({
    id: org.id,
    name: org.name,
    avatar: org.logoUrl || null,
  })) : [];
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [organizerDropdownOpen, setOrganizerDropdownOpen] = useState(false);

  // Seleciona a primeira organização automaticamente ao carregar
  useEffect(() => {
    if (!selectedOrganizer && organizerOptions.length > 0) {
      setSelectedOrganizer(organizerOptions[0]);
    }
  }, [organizerOptions, selectedOrganizer]);
  const navigate = useNavigate();

  // Data e hora do evento
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const pad = (n: number) => n.toString().padStart(2, '0');
  const currentTime = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState(currentTime);
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState(currentTime);

  // Prefill when editing an existing event
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      setIsLoadingEvent(true);
      setEventLoadError(null);
      try {
  const res = await fetch(apiUrl(`/api/event/${eventId}`));
        if (!res.ok) {
          const msg = res.status === 404 ? 'Evento não encontrado.' : `Falha ao carregar evento (HTTP ${res.status})`;
          setEventLoadError(msg);
          return;
        }
        const ev = await res.json();
        setEventName(ev.name || "");
        setEventSubtitle(ev.subtitle || "");
        setEventDescription(ev.description || "");
        const loc = (ev.location as typeof selectedLocation) || "Local";
        setSelectedLocation(loc);
        // Prefill location details by type
        if (loc === "Local") {
          const addr = ev.locationDetails?.address ?? ev.locationAddress;
          setLocationAddress(addr || "");
          setOnlineUrl("");
          setTbdUf("");
          setTbdCity("");
        } else if (loc === "Evento online") {
          const url = ev.locationDetails?.url ?? ev.onlineUrl;
          setOnlineUrl(url || "");
          setLocationAddress("");
          setTbdUf("");
          setTbdCity("");
        } else if (loc === "Local será anunciado em breve") {
          const uf = ev.locationDetails?.uf ?? ev.locationUf;
          const city = ev.locationDetails?.city ?? ev.locationCity;
          setTbdUf(uf || "");
          setTbdCity(city || "");
          setLocationAddress("");
          setOnlineUrl("");
        }
        if (ev.startDate) {
          const d = new Date(ev.startDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mi = String(d.getMinutes()).padStart(2, '0');
          setStartDate(`${yyyy}-${mm}-${dd}`);
          setStartTime(`${hh}:${mi}`);
        }
        if (ev.endDate) {
          const d = new Date(ev.endDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mi = String(d.getMinutes()).padStart(2, '0');
          setEndDate(`${yyyy}-${mm}-${dd}`);
          setEndTime(`${hh}:${mi}`);
        }
        if (ev.image) setBannerUrl(ev.image);
        if (typeof ev.isPublished === 'boolean') setEventStatus(ev.isPublished ? 'Publicado' : 'Rascunho');
        if (ev.organizerId && organizerOptions.length) {
          const found = organizerOptions.find(o => o.id === ev.organizerId);
          if (found) setSelectedOrganizer(found as any);
        }
      } catch (_) {
        setEventLoadError('Erro inesperado ao carregar evento.');
      } finally {
        setIsLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [eventId, organizerOptions.length]);

  const handleSaveDraft = async () => {
    if (!selectedOrganizer || !selectedOrganizer.id) {
      alert('Crie ou selecione uma organização antes de salvar o evento.');
      return;
    }
    // Validação rápida de localização antes de exibir overlay
    const newErrors: { url?: string; tbd?: string } = {};
    if (selectedLocation === "Evento online") {
      if (!onlineUrl || !/^https?:\/\//i.test(onlineUrl)) {
        newErrors.url = "Informe uma URL válida começando com http:// ou https://";
      }
    } else if (selectedLocation === "Local será anunciado em breve") {
      if (!tbdUf || !tbdCity.trim()) {
        newErrors.tbd = "Informe Estado (UF) e Cidade";
      }
    }
    setLocErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return; // não prossegue se houver erro
    }
    // Show overlay while creating the event
    setFlowVisible(true);
    setFlowStep(1);
    // Monta datas ISO
    const startISO = startDate && startTime ? `${startDate}T${startTime}:00` : '';
    const endISO = endDate && endTime ? `${endDate}T${endTime}:00` : '';
    const isEditing = !!eventId;
    try {
      if (isEditing) {
        // Update existing event with optional banner file
        const formData = new FormData();
        formData.append('subtitle', eventSubtitle);
        formData.append('description', eventDescription);
        formData.append('location', selectedLocation);
        if (selectedLocation === 'Local' && locationAddress) {
          formData.append('locationAddress', locationAddress);
        }
        if (selectedLocation === 'Evento online' && onlineUrl) {
          formData.append('onlineUrl', onlineUrl);
        }
        if (selectedLocation === 'Local será anunciado em breve') {
          if (tbdUf) formData.append('tbdUf', tbdUf);
          if (tbdCity) formData.append('tbdCity', tbdCity);
        }
        if (selectedOrganizer?.id) formData.append('organizerId', String(selectedOrganizer.id));
        formData.append('startDate', startISO);
        formData.append('endDate', endISO || '');
        if (bannerFile) formData.append('banner', bannerFile);
        const response = await fetch(apiUrl(`/api/event/${eventId}`), {
          method: 'PUT',
          body: formData,
        });
        if (response.ok) {
          setFlowStep(2);
          navigate(`/create-tickets?eventId=${eventId}`, { state: { stepFlow: { visible: true, step: 2 } } });
        } else {
          alert('Erro ao atualizar evento.');
        }
      } else {
        // Create new event with optional banner upload
        const formData = new FormData();
        formData.append('title', eventName);
        formData.append('subtitle', eventSubtitle);
        formData.append('description', eventDescription);
        formData.append('location', selectedLocation);
        if (selectedLocation === 'Local' && locationAddress) {
          formData.append('locationAddress', locationAddress);
        }
        if (selectedLocation === 'Evento online' && onlineUrl) {
          formData.append('onlineUrl', onlineUrl);
        }
        if (selectedLocation === 'Local será anunciado em breve') {
          if (tbdUf) formData.append('tbdUf', tbdUf);
          if (tbdCity) formData.append('tbdCity', tbdCity);
        }
        formData.append('organizerId', selectedOrganizer?.id?.toString());
        try {
          const { data: udata } = await supabase.auth.getUser();
          const uid = udata?.user?.id;
          if (uid) formData.append('userId', uid);
        } catch {}
        formData.append('startDate', startISO);
        if (endISO) formData.append('endDate', endISO);
        if (bannerFile) {
          formData.append('banner', bannerFile);
        }
        const response = await fetch(apiUrl("/api/event"), {
          method: "POST",
          body: formData,
        });
        let data: any = null;
        let rawText: string | null = null;
        try { data = await response.json(); } catch { try { rawText = await response.text(); } catch {} }
        if (response.ok && data && !data.error) {
          const newId = data.id || data.eventId;
          if (newId) {
            setFlowStep(2);
            navigate(`/create-tickets?eventId=${newId}`, { state: { stepFlow: { visible: true, step: 2 } } });
          } else {
            alert("Evento salvo, mas não foi possível obter o ID do evento.");
          }
        } else {
          console.warn('[CreateEvent] resposta não OK', { status: response.status, data, rawText });
          // Construir payload JSON para fallback
          const jsonPayload: any = {
            title: eventName,
            subtitle: eventSubtitle,
            description: eventDescription,
            location: selectedLocation,
            organizerId: selectedOrganizer?.id?.toString(),
            startDate: startISO,
            endDate: endISO || undefined,
          };
          if (selectedLocation === 'Local') jsonPayload.locationAddress = locationAddress || null;
          if (selectedLocation === 'Evento online') jsonPayload.onlineUrl = onlineUrl || null;
          if (selectedLocation === 'Local será anunciado em breve') { jsonPayload.tbdUf = tbdUf || null; jsonPayload.tbdCity = tbdCity || null; }
          try { const { data: udata } = await supabase.auth.getUser(); const uid = udata?.user?.id; if (uid) jsonPayload.userId = uid; } catch {}
          try {
            const alt = await fetch(apiUrl('/api/event/json'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jsonPayload) });
            let altData: any = null; let altRaw: string | null = null; try { altData = await alt.json(); } catch { try { altRaw = await alt.text(); } catch {} }
            if (alt.ok && altData && !altData.error) {
              const newId = altData.id || altData.eventId; if (newId) { setFlowStep(2); navigate(`/create-tickets?eventId=${newId}`, { state: { stepFlow: { visible: true, step: 2 } } }); return; }
            } else {
              const msg2 = altData?.error || altData?.message || altRaw || `Falha ao salvar (HTTP ${alt.status})`;
              const hintPart = altData?.hint ? `\nHint: ${altData.hint}` : '';
              const codePart = altData?.code ? ` (code ${altData.code})` : '';
              const metaPart = altData?.meta ? `\nMeta: ${typeof altData.meta === 'string' ? altData.meta : JSON.stringify(altData.meta)}` : '';
              alert('Erro ao salvar evento (fallback): ' + msg2 + codePart + hintPart + metaPart);
              console.warn('[CreateEvent] erro fallback', { altData, altRaw, status: alt.status });
            }
          } catch (fbErr) {
            console.warn('[CreateEvent] fallback json exception', fbErr);
          }
          const msg = data?.error || data?.message || rawText || `Falha ao salvar (HTTP ${response.status})`;
          const hintPart2 = data?.hint ? `\nHint: ${data.hint}` : '';
          const codePart2 = data?.code ? ` (code ${data.code})` : '';
          const metaPart2 = data?.meta ? `\nMeta: ${typeof data.meta === 'string' ? data.meta : JSON.stringify(data.meta)}` : '';
          alert('Erro ao salvar evento: ' + msg + codePart2 + hintPart2 + metaPart2);
          console.warn('[CreateEvent] erro final', { data, rawText });
        }
      }
    } catch (error) {
      alert("Erro de conexão ao salvar evento.");
    } finally {
      // If navigation didn't happen (error), hide overlay
      setTimeout(() => setFlowVisible(false), 300);
    }
  };

  const handleSetSelectedLocation = (
    type: "Local" | "Evento online" | "Local será anunciado em breve"
  ) => {
    setSelectedLocation(type);
    // Limpa erros e campos não usados no novo contexto
    setLocErrors({});
    if (type === "Local") {
      setOnlineUrl("");
      setTbdUf("");
      setTbdCity("");
    } else if (type === "Evento online") {
      setLocationAddress("");
      setTbdUf("");
      setTbdCity("");
    } else {
      // Local será anunciado em breve
      setLocationAddress("");
      setOnlineUrl("");
    }
  };

  const creatingNew = !eventId; // Only enforce org checks when creating a new event
  const showRequireOrg = creatingNew && (!orgs || orgs.length === 0) && !orgCreated;
  // Only block with skeleton while creating a new event and still checking orgs
  if (creatingNew && orgsLoading) return <CreateEditEventSkeleton />;

  return (
    <>
  <div className="min-h-screen w-full bg-white flex relative">
        <SidebarMenu />
        <div className="fixed top-0 left-[70px] h-screen z-10">
          <EventDetailsSidebar
            eventName={eventName || "Nome do evento"}
            eventDate={(() => {
              if (!startDate) return "";
              const [yyyy, mm, dd] = startDate.split("-");
              const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
              const dia = dd;
              const mes = meses[parseInt(mm, 10) - 1];
              const ano = yyyy;
              let hora = startTime;
              if (hora && hora.length >= 5) hora = hora.slice(0, 5);
              return `${dia} ${mes} ${ano}${hora ? ` às ${hora}` : ''}`;
            })()}
            eventStatus={eventStatus}
            onBack={() => navigate("/organizer-dashboard")}
            onStatusChange={setEventStatus}
            onViewEvent={() => {
              // Handle view event action
              console.log("View event clicked");
            }}
          />
        </div>
        <div className="flex-1 flex flex-col ml-[350px]">
          <div className="w-full">
            <AppHeader />
          </div>
          <div className="flex flex-col items-left py-10 ml-20 mt-20">
            {eventLoadError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                {eventLoadError}
              </div>
            )}
            {/* mt-8 adiciona espaçamento para não ficar colado no header */}
            <form id="create-edit-event-form" className="w-full max-w-[800px] flex flex-col gap-8" onSubmit={e => { e.preventDefault(); handleSaveDraft(); }}>
              {/* Banner */}
              <div className="bg-[#F6F5FA] rounded-2xl border border-[#E5E7EB] flex flex-col items-center mb-2" style={{padding: 0}}>
                <div className="w-full" style={{minHeight: 350}}>
                  {bannerUrl ? (
                    <div className="w-full h-[350px] rounded-2xl overflow-hidden group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img src={bannerUrl} alt="Banner do evento" className="w-full h-full object-cover" style={{display: 'block'}} />
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="flex items-center justify-center w-14 h-14 rounded-full bg-white/80">
                          <Upload className="w-8 h-8 text-[#2A2AD7]" />
                        </span>
                        <span className="mt-4 text-base font-bold text-white text-center drop-shadow">Enviar outra imagem</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-[350px]">
                      <button
                        type="button"
                        className="flex flex-col items-center justify-center bg-white rounded-xl shadow p-8 transition-all hover:shadow-lg"
                        style={{ minWidth: 200, minHeight: 180, borderRadius: 20, border: '1px solid #E5E7EB' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className="flex items-center justify-center w-14 h-14 rounded-full" style={{ background: '#F3F4FE' }}>
                          <Upload className="w-8 h-8 text-[#2A2AD7]" />
                        </span>
                        <span className="mt-4 text-base font-bold text-[#091747] text-center">Carregar<br/>imagem</span>
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                </div>
              </div>
              {/* Visão geral do evento */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-7">
                <div className="font-bold text-2xl text-[#091747] mb-2">Visão geral do evento</div>
                <div className="flex flex-col gap-2">
                  <label className="block text-base font-bold text-[#091747]">Nome do evento</label>
                  <span className="block text-sm text-[#091747] mb-1">Seja claro e descritivo, com um título que diga às pessoas do que se trata seu evento.</span>
                  <Input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Nome do evento" required className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747]" />
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <label className="block text-base font-bold text-[#091747]">Subtítulo</label>
                  <span className="block text-sm text-[#091747] mb-1">Chame a atenção das pessoas com uma breve descrição sobre seu evento. Os participantes verão isso na parte superior da página do evento. (máximo de 140 caracteres) <span className='underline cursor-pointer'>Ver exemplos</span></span>
                  <Input value={eventSubtitle} onChange={e => setEventSubtitle(e.target.value)} placeholder="Subtítulo" maxLength={140} className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747]" />
                </div>
              </div>
              {/* Data e localização */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-7">
                <div className="font-bold text-2xl text-[#091747] mb-2">Data e localização</div>
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="font-bold text-base text-[#091747] mb-3">Data e hora</div>
                    <div className="flex gap-4 w-full">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={e => {
                          setStartDate(e.target.value);
                          if (endDate < e.target.value) setEndDate(e.target.value);
                        }}
                        required
                        placeholder="Data de início"
                        min={today}
                        className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747] flex-1 min-w-[140px]"
                      />
                      <Input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        required
                        placeholder="Hora de início"
                        min={startDate === today ? currentTime : undefined}
                        className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747] flex-1 min-w-[140px]"
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={e => {
                          setEndDate(e.target.value);
                          if (e.target.value < startDate) setStartDate(e.target.value);
                        }}
                        placeholder="Data de término"
                        min={startDate}
                        className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747] flex-1 min-w-[140px]"
                      />
                      <Input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        placeholder="Hora de término"
                        min={endDate === startDate ? startTime : undefined}
                        className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747] flex-1 min-w-[140px]"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-base text-[#091747] mb-2">Localização</div>
                       <div className="flex gap-2 bg-[#F6F7FB] rounded-xl p-2 mx-auto justify-center w-auto min-w-[150px]">
                         <button
                           type="button"
                           className={`px-5 py-2 min-w-[64px] rounded-xl font-bold text-[14px] transition-all whitespace-nowrap ${selectedLocation === 'Local' ? 'bg-white text-[#091747] shadow-sm' : 'bg-transparent text-[#091747]/70'}`}
                           onClick={() => handleSetSelectedLocation('Local')}
                         >
                           Local
                         </button>
                         <button
                           type="button"
                           className={`px-5 py-2 min-w-[64px] rounded-xl font-bold text-[14px] transition-all whitespace-nowrap ${selectedLocation === 'Evento online' ? 'bg-white text-[#091747] shadow-sm' : 'bg-transparent text-[#091747]/70'}`}
                           onClick={() => handleSetSelectedLocation('Evento online')}
                         >
                           Evento online
                         </button>
                         <button
                           type="button"
                           className={`px-5 py-2 min-w-[64px] rounded-xl font-bold text-[14px] transition-all whitespace-nowrap ${selectedLocation === 'Local será anunciado em breve' ? 'bg-white text-[#091747] shadow-sm' : 'bg-transparent text-[#091747]/70'}`}
                           onClick={() => handleSetSelectedLocation('Local será anunciado em breve')}
                         >
                           Local será anunciado em breve
                         </button>
                       </div>
                       {/* Inputs dependentes do tipo de localização */}
                       {selectedLocation === 'Local' && (
                         <div className="mt-4 space-y-3">
                           <Input
                             value={locationAddress}
                             onChange={e => setLocationAddress(e.target.value)}
                             placeholder="Endereço completo (rua, número, cidade, UF)"
                             className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747] w-full"
                           />
                           {locationAddress.trim().length > 3 && (
                             <div className="w-full h-64 rounded-xl overflow-hidden border border-[#E5E7EB]">
                               <iframe
                                 title="Mapa do local"
                                 width="100%"
                                 height="100%"
                                 loading="lazy"
                                 referrerPolicy="no-referrer-when-downgrade"
                                 src={`https://maps.google.com/maps?q=${encodeURIComponent(locationAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                               />
                             </div>
                           )}
                           <div className="text-sm text-[#6B7280]">O mapa é uma prévia baseada no endereço digitado.</div>
                         </div>
                       )}
                       {selectedLocation === 'Evento online' && (
                         <div className="mt-4 space-y-2">
                           <Input
                             value={onlineUrl}
                             onChange={e => setOnlineUrl(e.target.value)}
                             placeholder="Link da transmissão (https://...)"
                             className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747] w-full"
                           />
                           {(locErrors.url || (onlineUrl && !/^https?:\/\//i.test(onlineUrl))) ? (
                             <div className="text-xs text-red-600">{locErrors.url || 'Informe uma URL válida começando com http:// ou https://'}</div>
                           ) : onlineUrl ? (
                             <div className="text-xs text-[#6B7280]">Este link será exibido aos participantes após a compra/inscrição.</div>
                           ) : null}
                         </div>
                       )}
                       {selectedLocation === 'Local será anunciado em breve' && (
                         <div className="mt-4 space-y-3">
                           <div className="text-sm text-[#374151]">O local será anunciado em breve.</div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div>
                               <Select value={tbdUf} onValueChange={setTbdUf}>
                                 <SelectTrigger className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747]">
                                   <SelectValue placeholder="Estado (UF)" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   {BRAZIL_UFS.map(uf => (
                                     <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>
                             <div>
                               <Input
                                 value={tbdCity}
                                 onChange={e => setTbdCity(e.target.value)}
                                 placeholder="Cidade"
                                 className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-6 text-base text-[#091747] w-full"
                               />
                             </div>
                           </div>
                           {locErrors.tbd ? (
                             <div className="text-xs text-red-600">{locErrors.tbd}</div>
                           ) : (
                             <div className="text-xs text-[#6B7280]">Defina ao menos Estado e Cidade para facilitar a indexação no site.</div>
                           )}
                         </div>
                       )}
                  </div>
                </div>
              </div>
              {/* Sobre este evento */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-5">
                <div className="font-bold text-2xl text-[#091747] mb-2">Sobre este evento</div>
                <span className="block text-base text-[#091747] mb-2">Use esta seção para fornecer mais detalhes sobre seu evento. Você pode incluir coisas que se deve saber, informações sobre o local, estacionamento, opções de acessibilidade – qualquer coisa que ajude as pessoas a saber o que esperar.</span>
                {/* Toolbar do editor rich text */}
                {editor && (
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <button type="button" className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-[#2A2AD7] text-white' : 'bg-[#F3F4FE] text-[#091747]'}`} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
                    <button type="button" className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-[#2A2AD7] text-white' : 'bg-[#F3F4FE] text-[#091747]'}`} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
                    <button type="button" className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-[#2A2AD7] text-white' : 'bg-[#F3F4FE] text-[#091747]'}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lista</button>
                    <button type="button" className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-[#2A2AD7] text-white' : 'bg-[#F3F4FE] text-[#091747]'}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Lista</button>
                    <button type="button" className={`px-2 py-1 rounded ${editor.isActive('link') ? 'bg-[#2A2AD7] text-white' : 'bg-[#F3F4FE] text-[#091747]'}`} onClick={() => {
                      const url = window.prompt('URL do link');
                      if (url) editor.chain().focus().setLink({ href: url }).run();
                    }}>Link</button>
                    <button type="button" className={`px-2 py-1 rounded ${editor.isActive('image') ? 'bg-[#2A2AD7] text-white' : 'bg-[#F3F4FE] text-[#091747]'}`} onClick={() => {
                      const url = window.prompt('URL da imagem');
                      if (url) editor.chain().focus().setImage({ src: url }).run();
                    }}>Imagem</button>
                  </div>
                )}
                <EditorContent editor={editor} />
              </div>
              {/* Organizador */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-5">
                <div className="font-bold text-2xl text-[#091747] mb-2">Organizador</div>
                <span className="block text-base text-[#091747] mb-4">Selecione aqui o seu perfil de organizador que será responsável pela realização deste evento.</span>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 text-base font-bold text-[#091747] flex items-center justify-between cursor-pointer"
                    onClick={() => setOrganizerDropdownOpen((open) => !open)}
                    disabled={organizerOptions.length === 0}
                  >
                    <span className="flex items-center gap-3">
                      {selectedOrganizer && selectedOrganizer.avatar ? (
                        <img src={selectedOrganizer.avatar} alt={selectedOrganizer.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-[#F3F4FE] flex items-center justify-center text-[#2A2AD7] font-bold text-lg">
                          {selectedOrganizer ? selectedOrganizer.name[0] : '?'}
                        </span>
                      )}
                      {selectedOrganizer ? selectedOrganizer.name : 'Nenhuma organização disponível'}
                    </span>
                    <ChevronDown className="text-[#091747] text-2xl" />
                  </button>
                  {organizerDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 overflow-hidden">
                      {organizerOptions.map(org => (
                        <button
                          key={org.id}
                          type="button"
                          className={`w-full flex items-center gap-3 px-5 py-3 text-base font-bold text-left ${selectedOrganizer && selectedOrganizer.id === org.id ? 'bg-[#F3F4FE] text-[#2A2AD7]' : 'text-[#091747] hover:bg-[#F6F7FB]'}`}
                          onClick={() => {
                            setSelectedOrganizer(org);
                            setOrganizerDropdownOpen(false);
                          }}
                        >
                          {org.avatar ? (
                            <img src={org.avatar} alt={org.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-[#F3F4FE] flex items-center justify-center text-[#2A2AD7] font-bold text-lg">
                              {org.name[0]}
                            </span>
                          )}
                          {org.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-5 py-3 text-base font-bold text-[#2A2AD7] hover:bg-[#F6F7FB] border-t border-[#E5E7EB]"
                        onClick={() => {
                          setOrganizerDropdownOpen(false);
                          setShowCreateOrgModal(true);
                        }}
                      >
                        <span className="w-8 h-8 rounded-full bg-[#F3F4FE] flex items-center justify-center text-[#2A2AD7] font-bold text-lg">+</span>
                        + criar uma organização
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Espaço para não cobrir conteúdo pelo botão fixo */}
              <div className="h-24" />
            </form>
          </div>
        </div>
      </div>
      {/* Step flow overlay */}
      <StepFlowOverlay visible={flowVisible} activeStep={flowStep} subtitle={flowStep === 1 ? "Criando evento…" : flowStep === 2 ? "Indo para criação de ingressos…" : undefined} />
      {showRequireOrg && (
        <RequireOrganization onCreated={async () => {
          setOrgCreated(true);
          if (refetch) await refetch();
        }} />
      )}
      {/* Modal de criar organização manual, pode ser fechado */}
      {showCreateOrgModal && (
        <RequireOrganization
          onCreated={async () => {
            setOrgCreated(true);
            setShowCreateOrgModal(false);
            if (refetch) await refetch();
          }}
          onClose={() => setShowCreateOrgModal(false)}
        />
      )}
      {/* Botão fixo Salvar e continuar */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          type="submit"
          form="create-edit-event-form"
          className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[45px] w-[180px] rounded-md shadow-lg"
        >
          Salvar e continuar
        </Button>
      </div>
    </>
  );
}
export default CreateEditEvent;

