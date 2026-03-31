import * as React from "react";
import OrganizerEditDrawer from '@/components/OrganizerEditDrawer';
import { useAuth } from "@/context/AuthContext";
import { getFirstName, getDisplayName } from '@/lib/user';
import { fetchApi, apiUrl } from '@/lib/apiBase';
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HelpCircle, Calendar, Ticket, Bell, Users, Settings, LogOut, Repeat2, User as UserIcon } from "lucide-react";
import * as LucideIcons from 'lucide-react';
import { useState, useRef, useEffect } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import { OrganizerLayout } from "@/components/OrganizerLayout";
import NextEventCardSkeleton from "../components/skeletons/NextEventCardSkeleton";
import OrgProfileCardSkeleton from "../components/skeletons/OrgProfileCardSkeleton";
import { useOrganization } from '@/context/OrganizationContext';
import RequireOrganization from '@/components/RequireOrganization';
import ProducerJourneyCard from '@/components/ProducerJourneyCard';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import { AnnouncementsSection } from '@/components/AnnouncementsSection';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <button className="flex flex-col items-start gap-1 px-5 py-4 hover:bg-blue-50 border-t border-blue-100 rounded-b-xl text-[#EF4118]" onClick={() => setShowLogoutModal(true)}>
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Sair
            </span>
            <span className="text-xs text-[#091747] font-normal mt-1">{userEmail}</span>
          </button>
        </div>
      )}
      {/* Modal de confirmação de logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-w-sm w-full">
            <div className="text-lg font-bold mb-2 text-[#091747]">Deseja realmente sair?</div>
            <div className="text-sm text-[#091747] mb-6">Você será desconectado da sua conta.</div>
            <div className="flex gap-4 w-full justify-center">
              <button
                className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-base px-6 py-2 rounded-lg border border-indigo-600 bg-white"
                onClick={() => setShowLogoutModal(false)}
              >
                <span className="relative z-10">Cancelar</span>
                <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
              </button>
              <button
                className="relative inline-flex items-center font-semibold text-white bg-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-base px-6 py-2 rounded-lg"
                onClick={async () => { setShowLogoutModal(false); await handleLogout(); }}
              >
                <span className="relative z-10">Sair</span>
                <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
              </button>
            </div>
          </div>
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

  // Estados para menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openEditDrawer = () => {
    const target = orgInfo || selectedOrg;
    if (target && target.id) {
      setForm({ ...target });
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
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        const file = new Blob([u8arr], { type: mime });
        const formData = new FormData();
        formData.append('file', file, 'logo.png');
        const uploadRes = await fetchApi('/api/upload', {
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
      const res = await fetchApi(`/api/organization/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error || data?.message || 'Erro ao salvar organização');
        setSaving(false);
        return;
      }
      setDrawerOpen(false);
      if (selectedOrg) {
        const res = await fetchApi(`/api/organization/${selectedOrg.id}`);
        if (res.ok) {
          const org = await res.json();
          setOrgInfo(org);
        }
      }
    } catch (e: any) {
      setSaveError(e?.message || 'Erro ao salvar organização');
      setSaving(false);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrg, loading: loadingOrgs, orgs, refresh, addOrganization, setSelectedOrgById, hasAttemptedRefresh } = useOrganization();
  const { user, refreshUser } = useAuth();

  // Ensure we fetch authoritative user data from the server on mount so
  // profile changes made server-side (name, etc.) are picked up without
  // requiring the user to re-login. This calls the `refreshUser` exposed by
  // AuthContext which fetches /api/auth/me if a token exists.
  React.useEffect(() => {
    if (typeof refreshUser !== 'function') return;
    let cancelled = false;
    (async () => {
      try {
        await refreshUser();
      } catch (err) {
        // Non-fatal: log and continue. We don't want to crash the dashboard if
        // the call fails (network, 401, etc.).
        // eslint-disable-next-line no-console
        console.warn('[OrganizerDashboard] refreshUser failed', err);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshUser]);
  const [nextEvent, setNextEvent] = React.useState<any>(null);
  const [nextEventStats, setNextEventStats] = React.useState<{ sold: number; capacity: number } | null>(null);
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
        // Load all data in parallel
        const [orgRes, countRes, nextRes] = await Promise.all([
          fetchApi(`/api/organization/${selectedOrg.id}`),
          fetchApi(`/api/organization/${selectedOrg.id}/events/count`),
          fetchApi(`/api/organization/${selectedOrg.id}/events/next`)
        ]);

        if (!cancelled && orgRes.ok) {
          const org = await orgRes.json();
          setOrgInfo(org);
        }

        if (!cancelled && countRes.ok) {
          const countData = await countRes.json();
          if (typeof countData.count === 'number') setOrgEventCount(countData.count);
        }

        if (!cancelled && nextRes.ok) {
          const next = await nextRes.json();
          if (next && next.id) {
            setNextEvent(next);
            // Fetch ticket stats for this event
            try {
              const [ticketTypesRes, ordersRes] = await Promise.all([
                fetchApi(`/api/ticket-type/event/${next.id}`),
                user?.id ? fetchApi(`/api/orders?eventId=${next.id}&userId=${user.id}&limit=1000`) : null
              ]);

              let capacity = 0;
              let sold = 0;

              if (ticketTypesRes.ok) {
                const types = await ticketTypesRes.json();
                capacity = Array.isArray(types) ? types.reduce((acc: number, t: any) => acc + (Number(t.maxQuantity) || 0), 0) : 0;
              }

              // Count sold tickets from PAID orders participantsCount
              if (ordersRes && ordersRes.ok) {
                const ordersData = await ordersRes.json();
                const orders = ordersData.items || [];
                // Filter client-side to ensure only orders from THIS event
                const eventOrders = orders.filter((o: any) => o.eventId === next.id);
                const paidOrders = eventOrders.filter((o: any) => o.paymentStatus === 'PAID');
                sold = paidOrders.reduce((acc: number, o: any) => acc + (Number(o.participantsCount) || 0), 0);
              }

              setNextEventStats({ sold, capacity });
            } catch (e) {
              console.error('Failed to fetch event stats:', e);
            }
          }
        }

        (window as any).__dbgDashboardOrgData = { orgRes, countRes, nextRes };
      } finally {
        if (!cancelled) { setLoadingOrg(false); setLoadingEvent(false); }
      }
    };
    loadOrgScopedData();
    return () => { cancelled = true; };
  }, [selectedOrg?.id]);
  // compute a normalized display name (prefer first name, fall back to display name)
  const _rawName = (getFirstName(user) || getDisplayName(user) || 'Visitante') as string;
  // extract a single token and normalize capitalization
  const _token = String(_rawName).trim().split(/[\s._\-+@]/)[0] || 'Visitante';
  const userName = _token.charAt(0).toUpperCase() + _token.slice(1).toLowerCase();
  // Time-based greeting (Bom dia / Boa tarde / Boa noite) with emoji
  const [greetingText, greetingEmoji] = React.useMemo(() => {
    try {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return ['Bom dia', '🌤️'];
      if (hour >= 12 && hour < 18) return ['Boa tarde', '☀️'];
      return ['Boa noite', '🌖'];
    } catch (e) {
      return ['Olá', ''];
    }
  }, []);
  const userEmail = user?.email || "";
  // Modal para criar organização se não houver nenhuma
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const modalAutoOpenedRef = useRef(false);

  // Auto-open RequireOrganization modal when authenticated user has no orgs
  useEffect(() => {
    try {
      if (!user || !user.email) return;
      if (loadingOrgs) return;
      if (!hasAttemptedRefresh) return; // Aguarda pelo menos uma tentativa de carregamento
      
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
  }, [user, loadingOrgs, orgs, hasAttemptedRefresh]);

  // Fetch help categories for organizer
  const [helpCategories, setHelpCategories] = useState<any[]>([]);
  const [loadingHelp, setLoadingHelp] = useState(true);

  useEffect(() => {
    const loadHelp = async () => {
      try {
        const res = await fetchApi('/api/help/categories?audience=organizer');
        if (res.ok) {
          const data = await res.json();
          // Take top 4 categories
          setHelpCategories(data.slice(0, 4));
        }
      } catch (e) {
        console.error('Failed to load help categories', e);
      } finally {
        setLoadingHelp(false);
      }
    };
    loadHelp();
  }, []);

  const confettiCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // Card visual
  React.useEffect(() => {
    if (nextEvent) {
      const startDate = new Date(nextEvent.startDate);
      const endDate = nextEvent.endDate ? new Date(nextEvent.endDate) : null;
      const now = new Date();
      const isPast = endDate ? now > endDate : now > startDate;
      const isRecentPast = isPast && endDate && ((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)) <= 2;
      if (isRecentPast) {
        // Adiciona delay de 2 segundos para mostrar confetes
        const timer = setTimeout(() => setShowConfetti(true), 2000);
        return () => clearTimeout(timer);
      } else {
        setShowConfetti(false);
      }
    } else {
      setShowConfetti(false);
    }
  }, [nextEvent]);

  React.useEffect(() => {
    if (!showConfetti) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const DPR = Math.max(1, window.devicePixelRatio || 1);
    function resize() {
      const parent = canvas.parentElement as HTMLElement | null;
      if (!parent) return;
      canvas.width = Math.floor(parent.clientWidth * DPR);
      canvas.height = Math.floor(parent.clientHeight * DPR);
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    type Particle = { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; vr: number };
    const colors = ['#FF7A00', '#FFD700', '#2AD2D7', '#7C3AED', '#FF4D6D', '#33CC66'];
    const particles: Particle[] = [];
    const count = 80;
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) - (Math.PI / 2);
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * (w * 0.5),
        y: h * 0.15 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
      });
    }
    const gravity = 0.12;
    const drag = 0.998;
    const start = performance.now();
    const duration = 2500; // ms
    function render(now: number) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let p of particles) {
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= 0.999;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (elapsed < duration || particles.some(p => p.y < h + 50)) {
        raf = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    raf = requestAnimationFrame(render);
    const cleanupTimeout = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, duration + 500);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      clearTimeout(cleanupTimeout);
      try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch (e) { /**/ }
    };
  }, [showConfetti]);

  return (
    <OrganizerLayout>
      <div className="relative min-h-screen w-full bg-transparent dark:bg-[#0b0b0b] dark:text-white">
        {/* Show modal backdrop when modal is open */}
        {showCreateOrgModal && (
          <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40">
            <div className="w-full h-full" aria-hidden="true" />
          </div>
        )}

        {/* Mobile Menu */}
        <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <MobileDrawerMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
          organizations={orgs}
          selectedOrg={selectedOrg}
          selectOrganization={setSelectedOrgById}
          user={user}
        />

        <SidebarMenu />
        <div className="relative w-full lg:pl-24">
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
            <AppHeader />
            <div className="flex flex-col gap-6 items-start w-full mt-16">
              <div className="mb-6 text-4xl font-bold text-slate-900 dark:text-white max-sm:text-3xl">{greetingText}, {userName}! <span className="ml-2">{greetingEmoji}</span></div>
              {showCreateOrgModal && (
                <RequireOrganization
                  onCreated={async (org) => {
                    console.log('[OrganizerDashboard] Organization created, calling refresh:', org?.id);
                    try {
                      // Add organization directly to context first
                      if (org?.id && org?.name) {
                        addOrganization({
                          id: org.id,
                          name: org.name,
                          logoUrl: org.logoUrl || null
                        });
                      }
                      // Then refresh to sync with backend
                      await refresh();
                      console.log('[OrganizerDashboard] Refresh completed successfully');
                    } catch (e) {
                      console.error('[OrganizerDashboard] Refresh failed but organization was created:', e);
                      // Don't throw error - organization was created successfully
                    }
                  }}
                  onClose={() => setShowCreateOrgModal(false)}
                />
              )}
              <div className="flex gap-5 items-start w-full max-md:flex-col max-md:gap-5">
                {/* Card de Organização - apenas mobile, aparece no topo */}
                <div className="hidden max-sm:block w-full mb-2">
                  {loadingOrg ? (
                    <OrgProfileCardSkeleton />
                  ) : (
                    <Card className="flex flex-col justify-between p-4 bg-white dark:bg-[#242424] rounded-xl border border-solid border-zinc-200 dark:border-[#1F1F1F] w-full">
                      <CardContent className="p-0">
                        {selectedOrg ? (
                          orgInfo ? (
                            <div className="flex flex-col gap-3 items-start">
                              <div className="flex items-center gap-3 w-full">
                                {orgInfo.logoUrl ? (
                                  <img src={orgInfo.logoUrl} alt="Logo da organização" className="w-[50px] h-[50px] rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <Avatar className="w-[50px] h-[50px] flex-shrink-0">
                                    <AvatarFallback className="bg-gray-300">
                                      <div className="w-full h-full rounded-full bg-gray-300"></div>
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="text-xl font-bold text-slate-900 dark:text-white flex-1 truncate">{orgInfo.name || selectedOrg.name}</div>
                              </div>
                              <div className="flex gap-4 items-center w-full">
                                <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={() => window.open(orgInfo.publicUrl || '#', '_blank')}>
                                  <span className="relative z-10">Ver página</span>
                                  <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                  <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                </button>
                                <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={() => navigate('/organizer-settings')}>
                                  <span className="relative z-10">Editar</span>
                                  <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                  <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                </button>
                              </div>
                              <div className="flex gap-6 items-center w-full pt-2 border-t border-gray-200 dark:border-[#1F1F1F]">
                                <div className="flex flex-col items-start">
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">{orgEventCount}</div>
                                  <div className="text-xs text-slate-900 dark:text-slate-300">Total de eventos</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3 items-start">
                              {selectedOrg ? (
                                <>
                                  <div className="flex items-center gap-3 w-full">
                                    {selectedOrg.logoUrl ? (
                                      <img src={selectedOrg.logoUrl} alt="Logo da organização" className="w-[50px] h-[50px] rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                      <Avatar className="w-[50px] h-[50px] flex-shrink-0">
                                        <AvatarFallback className="bg-gray-300">
                                          <div className="w-full h-full rounded-full bg-gray-300"></div>
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div className="text-xl font-bold text-slate-900 dark:text-white flex-1 truncate">{selectedOrg.name}</div>
                                  </div>
                                  <div className="flex gap-4 items-center w-full">
                                    <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={() => window.open((orgInfo && (orgInfo.publicUrl as string)) || selectedOrg.site || '#', '_blank')}>
                                      <span className="relative z-10">Ver página</span>
                                      <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                      <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                    </button>
                                    <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={() => navigate('/organizer-settings')}>
                                      <span className="relative z-10">Editar</span>
                                      <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                      <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                    </button>
                                  </div>
                                  {loadingOrg ? (
                                    <div className="text-sm text-slate-700 dark:text-slate-300">Carregando informações detalhadas...</div>
                                  ) : null}
                                </>
                              ) : (
                                <div className="text-sm text-slate-900 dark:text-white">Carregando informações da organização...</div>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col gap-3 items-start">
                            <div className="text-sm text-slate-900 dark:text-white">Nenhuma organização selecionada.</div>
                            {(!loadingOrgs && orgs.length === 0) && (
                              <Button
                                className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[38px] px-3 rounded-md"
                                onClick={() => setShowCreateOrgModal(true)}
                              >
                                Criar organização
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex flex-col gap-5 items-start max-w-[900px] w-full">
                  {/* Próximo evento estilizado ou card de criação */}
                  {loadingEvent ? (
                    <NextEventCardSkeleton />
                  ) : nextEvent ? (
                    (() => {
                      const startDate = new Date(nextEvent.startDate);
                      const endDate = nextEvent.endDate ? new Date(nextEvent.endDate) : null;
                      const now = new Date();
                      const diffDays = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                      const isToday = startDate.toDateString() === now.toDateString();
                      const isLive = now >= startDate && (!endDate || now <= endDate);
                      const isPast = endDate ? now > endDate : now > startDate;
                      const isRecentPast = isPast && endDate && ((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)) <= 2;

                      // Se o evento terminou há mais de 2 dias, mostrar card de criar evento
                      if (isPast && !isRecentPast) {
                        return (
                          <div className="flex flex-col gap-4 items-center px-10 py-16 bg-gray-50 dark:bg-[#121212] rounded-xl w-full max-md:px-5 max-md:py-10 max-md:w-full max-sm:px-4 max-sm:py-8">
                            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                            <div className="text-2xl max-sm:text-xl font-bold text-[#091747] dark:text-white text-center">Crie seu próximo evento</div>
                            <div className="text-base max-sm:text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                              Comece a planejar seu próximo evento e alcance ainda mais pessoas com a plataforma Fauves.
                            </div>
                            <Button
                              onClick={() => navigate('/create-event')}
                              className="relative inline-flex items-center px-6 py-3 max-sm:px-5 max-sm:py-2.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg mt-4"
                            >
                              Criar novo evento
                            </Button>
                          </div>
                        );
                      }

                      let message = '';
                      if (isLive) message = 'Seu próximo evento está acontecendo';
                      else if (isToday) message = 'Seu próximo evento acontecerá HOJE';
                      else if (diffDays > 0) message = `Seu próximo evento acontecerá daqui a ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                      else if (isRecentPast) message = 'Seu último evento foi um sucesso!';

                      // Card visual
                      return (
                        <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-8 max-sm:p-5 w-full flex flex-col gap-6 max-sm:gap-4 shadow-sm relative">
                          {message === 'Seu último evento foi um sucesso!' && showConfetti && (
                            <canvas ref={confettiCanvasRef} className="absolute left-0 top-0 w-full h-full pointer-events-none z-10" style={{ height: '100%', width: '100%' }} />
                          )}
                          <div className="text-2xl max-sm:text-lg font-bold text-[#091747] dark:text-white mb-2 max-sm:mb-1 flex items-center gap-3">
                            {message}
                            {isLive && (
                              <span className="relative inline-block ml-2">
                                <span className="relative flex items-center justify-center w-6 h-6">
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="animate-pulse-ring block w-6 h-6 rounded-full bg-green-400 opacity-60" />
                                  </span>
                                  <span className="relative z-10 block w-4 h-4 rounded-full bg-green-500 shadow-lg animate-pulse-custom" />
                                </span>
                              </span>
                            )}
                          </div>
                          <style>{`
                        @keyframes pulse-custom {
                          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
                          70% { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
                          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
                        }
                        .animate-pulse-custom {
                          animation: pulse-custom 1.2s infinite cubic-bezier(.4,0,.6,1);
                        }
                        @keyframes pulse-ring {
                          0% { transform: scale(1); opacity: 0.6; }
                          50% { transform: scale(1.8); opacity: 0.2; }
                          100% { transform: scale(2.2); opacity: 0; }
                        }
                        .animate-pulse-ring {
                          animation: pulse-ring 1.2s infinite cubic-bezier(.4,0,.6,1);
                        }
                      `}</style>
                          <div
                            className="flex items-start bg-[#F6F7FB] dark:bg-[#1A1A1A] rounded-xl px-6 max-sm:px-4 py-5 max-sm:py-4 gap-6 max-sm:gap-3 cursor-pointer hover:shadow-md transition"
                            onClick={() => navigate(`/painel-evento/${nextEvent.id}`)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex flex-col items-center justify-center w-16 max-sm:w-12 flex-shrink-0">
                              <div className="text-[15px] max-sm:text-xs font-bold text-[#EF4118] uppercase mb-0 leading-none">
                                {startDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                              </div>
                              <div className="text-3xl max-sm:text-2xl font-bold text-[#091747] dark:text-white leading-none">
                                {startDate.getDate().toString().padStart(2, '0')}
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-1 max-sm:gap-0.5">
                              <div className="font-bold text-lg max-sm:text-base text-[#091747] dark:text-white">{nextEvent.name}</div>
                              <div className="text-sm max-sm:text-xs text-[#EF4118] font-bold">
                                {nextEventStats ? `${nextEventStats.sold} / ${nextEventStats.capacity} ingressos vendidos` : '0 / 0 ingressos vendidos'}
                              </div>
                            </div>
                            <span className="ml-2 max-sm:flex-shrink-0 text-[#091747] dark:text-white text-2xl max-sm:text-xl font-bold">&gt;</span>
                          </div>
                          {/* Fases do evento dinâmicas - escondidas se evento está acontecendo ou se foi sucesso */}
                          {!(isLive || (message === 'Seu último evento foi um sucesso!')) && (
                            <div className="mt-4 max-sm:hidden">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-[#091747] dark:text-white">Fase do evento</span>
                                <HelpCircle className="w-4 h-4 text-[#A0A3BD]" />
                              </div>
                              <div className="flex items-center gap-0 w-full">
                                <div className="flex-1 flex flex-col items-center">
                                  <div className={`h-1 w-full rounded-t-full ${diffDays > 15 ? 'bg-[#2A2AD7]' : 'bg-[#E5E7EB]'}`} />
                                  <span className={`text-xs font-bold mt-2 ${diffDays > 15 ? 'text-[#2A2AD7]' : 'text-[#A0A3BD]'} dark:text-slate-400`}>Compra antecipada</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                  <div className={`h-1 w-full rounded-t-full ${diffDays <= 15 && diffDays > 5 ? 'bg-[#2A2AD7]' : 'bg-[#E5E7EB]'}`} />
                                  <span className={`text-xs font-bold mt-2 ${diffDays <= 15 && diffDays > 5 ? 'text-[#2A2AD7]' : 'text-[#A0A3BD]'} dark:text-slate-400`}>Quase lá</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                  <div className={`h-1 w-full rounded-t-full ${diffDays <= 5 ? 'bg-[#2A2AD7]' : 'bg-[#E5E7EB]'}`} />
                                  <span className={`text-xs font-bold mt-2 ${diffDays <= 5 ? 'text-[#2A2AD7]' : 'text-[#A0A3BD]'} dark:text-slate-400`}>Última chamada</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col gap-4 items-center px-10 py-16 bg-gray-50 dark:bg-[#121212] rounded-xl w-full max-md:px-5 max-md:py-10 max-md:w-full max-sm:px-4 max-sm:py-8">
                      <div className="text-lg font-bold text-center text-slate-900 dark:text-white max-sm:text-base">Crie seu evento</div>
                      <div className="text-sm text-center text-slate-700 dark:text-slate-300 w-full max-md:w-full max-md:max-w-[400px] max-sm:text-sm">Adicionar todos os detalhes do seu evento, criar novos ingressos e configurar eventos recorrentes</div>
                      <Button
                        className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[45px] w-[120px] rounded-md"
                        onClick={() => navigate("/create-event")}
                      >
                        Criar evento
                      </Button>
                    </div>
                  )}

                  {/* Announcements Section */}
                  <AnnouncementsSection />

                  {/* Help Section */}
                  <Card className="p-5 max-sm:p-4 bg-white dark:bg-[#242424] rounded-xl border border-solid border-zinc-200 dark:border-[#1F1F1F] w-full">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-1.5 items-start mb-4 max-sm:mb-3 w-full">
                        <div className="text-2xl max-sm:text-xl font-bold text-slate-800 dark:text-white">Como podemos ajudar?</div>
                        <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-base max-sm:text-sm mb-1" onClick={() => navigate('/ajuda/organizador')}>
                          <span className="relative z-10">Ir para Central de Ajuda</span>
                          <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                          <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-2 gap-4 w-full">
                        {loadingHelp ? (
                          // Skeleton loading
                          [1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl h-[140px] max-sm:h-[120px]"></div>
                          ))
                        ) : helpCategories.length > 0 ? (
                          helpCategories.map((cat, index) => {
                            // Dynamically get the icon component
                            const IconComponent = (LucideIcons as any)[cat.icon] || LucideIcons.HelpCircle;

                            return (
                              <div key={cat.id || index}
                                onClick={() => navigate(`/ajuda/organizador?category=${cat.id}`)}
                                className="flex flex-col gap-4 max-sm:gap-3 items-center px-4 py-6 max-sm:py-5 bg-white dark:bg-[#242424] rounded-xl border border-solid border-zinc-200 dark:border-[#1F1F1F] h-[140px] max-sm:h-[120px] cursor-pointer hover:shadow-md transition-shadow group">
                                <div className="w-[43px] h-[43px] max-sm:w-[36px] max-sm:h-[36px] bg-blue-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <IconComponent className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="text-sm max-sm:text-xs font-bold text-center text-slate-800 dark:text-white w-full line-clamp-2 px-1">
                                  {cat.name}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          // Fallback to static if no categories found
                          <div className="col-span-4 text-gray-500 text-sm py-4 text-center">Nenhuma categoria de ajuda encontrada.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Right Section - Profile Card + Producer Journey */}
                <div className="flex flex-col gap-4 w-[259px] max-md:w-full">
                  <div className="h-[283px] w-[259px] max-md:w-full max-sm:hidden">
                    {loadingOrg ? (
                      <OrgProfileCardSkeleton />
                    ) : (
                      <Card className="flex flex-col justify-between p-5 bg-white dark:bg-[#242424] rounded-xl border border-solid border-zinc-200 dark:border-[#1F1F1F] h-[283px] w-[259px] max-md:w-full">
                        <CardContent className="p-0">
                          {selectedOrg ? (
                            orgInfo ? (
                              <div className="flex flex-col gap-3 max-sm:gap-2 items-start">
                                {orgInfo.logoUrl ? (
                                  <img src={orgInfo.logoUrl} alt="Logo da organização" className="w-[50px] h-[50px] max-sm:w-[40px] max-sm:h-[40px] rounded-full object-cover" />
                                ) : (
                                  <Avatar className="w-[50px] h-[50px] max-sm:w-[40px] max-sm:h-[40px]">
                                    <AvatarFallback className="bg-gray-300">
                                      <div className="w-full h-full rounded-full bg-gray-300"></div>
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="text-2xl max-sm:text-xl font-bold text-slate-900 dark:text-white">{orgInfo.name || selectedOrg.name}</div>
                                <div className="flex gap-5 max-sm:gap-2 items-center max-sm:flex-col max-sm:items-start max-sm:w-full">
                                  <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={() => window.open(orgInfo.publicUrl || '#', '_blank')}>
                                    <span className="relative z-10">Ver página</span>
                                    <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                    <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                  </button>
                                  <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={() => navigate('/organizer-settings')}>
                                    <span className="relative z-10">Editar</span>
                                    <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                    <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                  </button>
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
                                {/* If selector already provided a lightweight selectedOrg, show it as a fallback while the full orgInfo loads */}
                                {selectedOrg ? (
                                  <>
                                    {selectedOrg.logoUrl ? (
                                      <img src={selectedOrg.logoUrl} alt="Logo da organização" className="w-[50px] h-[50px] max-sm:w-[40px] max-sm:h-[40px] rounded-full object-cover" />
                                    ) : (
                                      <Avatar className="w-[50px] h-[50px] max-sm:w-[40px] max-sm:h-[40px]">
                                        <AvatarFallback className="bg-gray-300">
                                          <div className="w-full h-full rounded-full bg-gray-300"></div>
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div className="text-2xl max-sm:text-xl font-bold text-slate-900 dark:text-white">{selectedOrg.name}</div>
                                    <div className="flex gap-5 max-sm:gap-2 items-center max-sm:flex-col max-sm:items-start max-sm:w-full">
                                      <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={() => window.open((orgInfo && (orgInfo.publicUrl as string)) || selectedOrg.site || '#', '_blank')}>
                                        <span className="relative z-10">Ver página</span>
                                        <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                        <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                      </button>
                                      <button type="button" className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-sm" onClick={openEditDrawer}>
                                        <span className="relative z-10">Editar</span>
                                        <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                                        <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                                      </button>
                                      <OrganizerEditDrawer
                                        open={drawerOpen}
                                        onOpenChange={setDrawerOpen}
                                        org={orgInfo || selectedOrg}
                                        isNew={false}
                                        onSave={handleSave}
                                        saving={saving}
                                        saveError={saveError}
                                        form={form}
                                        setForm={setForm}
                                      />
                                    </div>
                                    {loadingOrg ? (
                                      <div className="text-sm text-slate-700 dark:text-slate-300">Carregando informações detalhadas...</div>
                                    ) : null}
                                  </>
                                ) : (
                                  <div className="text-sm text-slate-900">Carregando informações da organização...</div>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="flex flex-col gap-3 items-start">
                              <div className="text-sm text-slate-900 dark:text-white">Nenhuma organização selecionada.</div>
                              {(!loadingOrgs && orgs.length === 0) && (
                                <Button
                                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[38px] px-3 rounded-md"
                                  onClick={() => setShowCreateOrgModal(true)}
                                >
                                  Criar organização
                                </Button>
                              )}
                            </div>
                          )}
                          <div className="flex flex-col items-start mt-8 max-sm:mt-4">
                            <div className="text-base max-sm:text-sm font-bold text-slate-900 dark:text-white">{orgEventCount}</div>
                            <div className="text-sm max-sm:text-xs text-slate-900 dark:text-slate-300">Total de eventos</div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
}
export default OrganizerDashboard;
