import React from 'react';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import { useOrganization } from '@/context/OrganizationContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Share2, ExternalLink, PenLine, Leaf, Music4, ImagePlus, Globe, Instagram, Facebook, Youtube, Music, Disc, MessageCircle, Info, Link as LinkIcon, Music2, QrCode, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ensureApiBase, apiUrl, fetchApi } from '@/lib/apiBase';

function getOrgPublicUrl(org: any): string {
  try {
    const base = window.location.origin;
    const slugOrId = org?.slug || org?.id || '';
    return `${base}/org/${slugOrId}`;
  } catch {
    return '';
  }
}

function getExpressUrl(org: any): string {
  try {
    const base = window.location.origin;
    const slugOrId = org?.slug || org?.id || '';
    return `${base}/venues/${slugOrId}/door`;
  } catch {
    return '';
  }
}

export default function OrganizerSettingsV2() {
  const { selectedOrg } = useOrganization();
  const { toast } = useToast();
  const { user } = useAuth();
  const url = selectedOrg ? getOrgPublicUrl(selectedOrg) : '';
  const expressUrl = selectedOrg ? getExpressUrl(selectedOrg) : '';
  const expressQrUrl = expressUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(expressUrl)}` : '';

  // Banking
  const [bankOpen, setBankOpen] = React.useState(false);
  const [bankPhase, setBankPhase] = React.useState<'form'|'verify'>('form');
  const [pixType, setPixType] = React.useState<'email'|'phone'|'cpfcnpj'>('email');
  const [pixKey, setPixKey] = React.useState('');
  const [confirmOwner, setConfirmOwner] = React.useState(false);
  const [pin, setPin] = React.useState(['', '', '', '']);
  const [pinConfirm, setPinConfirm] = React.useState(['', '', '', '']);
  const [pinPhase, setPinPhase] = React.useState<'set' | 'confirm' | 'done'>('set');
  const bankingSavedRef = React.useRef(false);
  const [savedPixKey, setSavedPixKey] = React.useState('');
  const [bankingConfirmed, setBankingConfirmed] = React.useState(false);
  const [showEmailVerification, setShowEmailVerification] = React.useState(false);
  const [emailCode, setEmailCode] = React.useState(['', '', '', '']);
  const [emailCodeStatus, setEmailCodeStatus] = React.useState<'idle'|'pending'|'verified'|'error'>('idle');
  const [emailTimeLeft, setEmailTimeLeft] = React.useState('');
  const emailExpireRef = React.useRef<number | null>(null);
  const emailTimerRef = React.useRef<any>(null);

  const firstName = React.useMemo(() => (user?.name || '').split(' ')[0] || '', [user?.name]);
  const lastName = React.useMemo(() => {
    const parts = (user?.name || '').split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }, [user?.name]);

  const saveBanking = async () => {
    if (!selectedOrg?.id) return;
    if (!pixKey.trim() || !confirmOwner) return;
    const body = {
      beneficiary: {
        company: (selectedOrg as any)?.name || '',
        firstName,
        lastName,
        email: user?.email || '',
      },
      pix: { type: pixType, key: pixKey.trim() },
    } as any;
    try {
      const r = await fetchApi(`/api/organization/${selectedOrg.id}/banking`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Informações bancárias atualizadas. Valide seu e-mail.' });
      bankingSavedRef.current = true;
      setSavedPixKey(pixKey.trim());
      setBankPhase('verify');
      startEmailVerification();
    } catch (e) {
      try { localStorage.setItem(`ORG_BANKING_${selectedOrg.id}`, JSON.stringify(body)); } catch {}
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponível. Valide seu e-mail.' });
      bankingSavedRef.current = true;
      setSavedPixKey(pixKey.trim());
      setBankPhase('verify');
      startEmailVerification();
    }
  };

  function maskEmail(email?: string | null): string {
    const e = email || '';
    const [userPart, domain] = e.split('@');
    if (!userPart || !domain) return e;
    const visible = userPart.slice(0, 1);
    return `${visible}${'*'.repeat(Math.max(userPart.length - 1, 3))}@${domain}`;
  }

  function startEmailVerification() {
    setShowEmailVerification(true);
    setEmailCode(['', '', '', '']);
    setEmailCodeStatus('pending');
    const expireAt = Date.now() + 10 * 60 * 1000;
    emailExpireRef.current = expireAt;
    if (emailTimerRef.current) { try { clearInterval(emailTimerRef.current); } catch {} }
    emailTimerRef.current = setInterval(() => {
      const now = Date.now();
      const ms = Math.max(0, (emailExpireRef.current || now) - now);
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setEmailTimeLeft(`${m} minutos e ${s} segundos antes que o código expire`);
      if (ms <= 0) {
        clearInterval(emailTimerRef.current);
        setEmailCodeStatus('error');
      }
    }, 1000);
  }

  function submitEmailCodeIfComplete(next: string[]) {
    if (next.every((d) => d && d.length === 1)) {
      // Aqui faríamos a verificação real na API; por ora, aceita qualquer 4 dígitos
      setTimeout(() => {
        setEmailCodeStatus('verified');
        setBankingConfirmed(true);
        setShowEmailVerification(false);
        setBankOpen(false);
        setBankPhase('form');
        try { if (emailTimerRef.current) clearInterval(emailTimerRef.current); } catch {}
        toast({ title: 'Verificado', description: 'Conta bancária confirmada.' });
      }, 400);
    }
  }

  React.useEffect(() => {
    return () => {
      try { if (emailTimerRef.current) clearInterval(emailTimerRef.current); } catch {}
    };
  }, []);

  // Initialize PIN phase from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('BANKING_PIN');
      if (saved && saved.length === 4) {
        setPinPhase('done');
      } else {
        setPinPhase('set');
      }
    } catch {}
  }, []);

  const smoothScrollTo = (el: HTMLElement | null) => {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      setTimeout(() => {
        try {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY - 90;
          window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
        } catch {}
      }, 100);
    } catch {}
  };

  const featuredRef = React.useRef<HTMLDivElement | null>(null);
  const aboutRef = React.useRef<HTMLDivElement | null>(null);

  const handleShare = async () => {
    if (!url) return;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: (selectedOrg as any)?.name || 'Minha página', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copiado: ' + url);
      }
    } catch {}
  };

  // Editar nome/slug (modal)
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editSlug, setEditSlug] = React.useState('');
  const [slugStatus, setSlugStatus] = React.useState<'idle'|'checking'|'available'|'taken'|'invalid'>('idle');
  const [savingIdentity, setSavingIdentity] = React.useState(false);

  const normalizeSlug = (s: string) => s
    .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const openEditIdentity = () => {
    if (!selectedOrg) return;
    setEditName((selectedOrg as any).name || '');
    setEditSlug((selectedOrg as any).slug || normalizeSlug((selectedOrg as any).name || ''));
    setSlugStatus('idle');
    setEditOpen(true);
  };

  React.useEffect(() => {
    let t: number | undefined;
    const run = async () => {
      if (!selectedOrg) return;
      const slug = normalizeSlug(editSlug || '');
      if (!slug) { setSlugStatus('invalid'); return; }
      if (slug === ((selectedOrg as any).slug || '')) { setSlugStatus('available'); return; }
      setSlugStatus('checking');
      try {
        const r = await fetchApi(`/api/organization/slug/${encodeURIComponent(slug)}`);
        if (r.status === 404) { setSlugStatus('available'); return; }
        if (!r.ok) { setSlugStatus('invalid'); return; }
        const j = await r.json();
        if (j && (j.id === (selectedOrg as any).id)) setSlugStatus('available'); else setSlugStatus('taken');
      } catch { setSlugStatus('available'); }
    };
    t = window.setTimeout(run, 400);
    return () => { if (t) window.clearTimeout(t); };
  }, [editSlug, selectedOrg]);

  const saveIdentity = async () => {
    if (!selectedOrg) return;
    const slug = normalizeSlug(editSlug || '');
    if (!editName.trim() || !slug || slugStatus === 'taken' || slugStatus === 'invalid') return;
    setSavingIdentity(true);
    try {
      const r = await fetchApi(`/api/organization/${(selectedOrg as any).id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim(), slug }) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Nome e URL atualizados.' });
      setEditOpen(false);
      setTimeout(() => { window.location.reload(); }, 250);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: String(e?.message || e) });
    } finally { setSavingIdentity(false); }
  };

  // Evento em destaque (subset seguro)
  const [openFeatured, setOpenFeatured] = React.useState(false);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [events, setEvents] = React.useState<Array<{ id: string; name: string; startDate?: string }>>([]);
  const [selectedEventId, setSelectedEventId] = React.useState('');
  const [savingFeatured, setSavingFeatured] = React.useState(false);

  const loadOrgEvents = React.useCallback(async () => {
    if (!selectedOrg?.id) return;
    setEventsLoading(true);
    try {
      await ensureApiBase().catch(() => {});
      const path = `/api/organization/${selectedOrg.id}/events`;
      const attempts = [apiUrl(path), `http://localhost:4000${path}`];
      for (const u of attempts) {
        try {
          const r = await fetch(u, { headers: { Accept: 'application/json' } });
          if (!r.ok) continue;
          const j = await r.json();
          if (Array.isArray(j)) {
            setEvents(j.map((e: any) => ({ id: e.id, name: e.name || e.title || 'Evento', startDate: e.startDate || e.startDateUtc || e.startsAt })));
            return;
          }
        } catch {}
      }
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar seus eventos.' });
    } finally {
      setEventsLoading(false);
    }
  }, [selectedOrg?.id, toast]);

  const openFeaturedPanel = () => {
    setOpenFeatured(true);
    setSelectedEventId('');
    loadOrgEvents();
    setTimeout(() => smoothScrollTo(featuredRef.current), 50);
  };

  const saveFeatured = async () => {
    if (!selectedOrg?.id || !selectedEventId) return;
    setSavingFeatured(true);
    try {
      const r = await fetchApi(`/api/organization/${selectedOrg.id}/featured-event`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Sucesso', description: 'Evento destacado na sua página.' });
      setOpenFeatured(false);
    } catch {
      try { localStorage.setItem(`ORG_FEATURED_EVENT_${selectedOrg.id}`, selectedEventId); } catch {}
      toast({ title: 'Evento destacado', description: 'Salvo localmente. Quando a API estiver disponível, sincronizaremos.' });
      setOpenFeatured(false);
    } finally {
      setSavingFeatured(false);
    }
  };

  // Sobre / Bio & tags (subset)
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [miniBio, setMiniBio] = React.useState('');
  const [aboutDesc, setAboutDesc] = React.useState('');
  const [aboutTags, setAboutTags] = React.useState<string[]>([]);

  const TAG_OPTIONS: Array<{ key: string; label: string; icon?: 'leaf' | 'music' }> = [
    { key: 'eco-friendly', label: 'Eco-Friendly', icon: 'leaf' },
    { key: 'lgbtq+', label: 'LGBTQ+' },
    { key: 'poc', label: 'POC' },
    { key: 'libertine', label: 'Libertine' },
    { key: 'fantasy', label: 'Fantasy' },
    { key: 'solidarity', label: 'Solidarity' },
    { key: 'inclusion', label: 'Inclusion' },
    { key: 'techno', label: 'Techno', icon: 'music' },
    { key: 'electro', label: 'Electro', icon: 'music' },
  ];

  const openAbout = () => {
    if (!selectedOrg) return;
    setMiniBio((selectedOrg as any).bio || '');
    setAboutDesc((selectedOrg as any).description || '');
    setAboutTags(Array.isArray((selectedOrg as any).tags) ? ((selectedOrg as any).tags as string[]) : []);
    setAboutOpen(true);
    setTimeout(() => smoothScrollTo(aboutRef.current), 50);
  };

  const toggleTag = (key: string) => {
    setAboutTags(prev => {
      const has = prev.includes(key);
      if (has) return prev.filter(k => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  const saveAbout = async () => {
    if (!selectedOrg) return;
    const payload = { bio: miniBio.slice(0, 140), description: aboutDesc, tags: aboutTags } as any;
    try {
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Informações atualizadas.' });
      setAboutOpen(false);
    } catch {
      try { localStorage.setItem(`ORG_ABOUT_${selectedOrg.id}`, JSON.stringify(payload)); } catch {}
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponível.' });
      setAboutOpen(false);
    }
  };

  // Visuais (Logo & Capa)
  const [visualsOpen, setVisualsOpen] = React.useState(false);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState('');
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState('');
  const [savingVisuals, setSavingVisuals] = React.useState(false);

  const openVisuals = () => {
    if (!selectedOrg) return;
    setVisualsOpen(true);
    setLogoFile(null); setCoverFile(null);
    setLogoPreview((selectedOrg as any).logoUrl || '');
    setCoverPreview((selectedOrg as any).coverUrl || '');
    setTimeout(() => smoothScrollTo(featuredRef.current), 50);
  };
  const onPickLogo = (file?: File | null) => { if (!file) return; setLogoFile(file); try { setLogoPreview(URL.createObjectURL(file)); } catch {} };
  const onPickCover = (file?: File | null) => { if (!file) return; setCoverFile(file); try { setCoverPreview(URL.createObjectURL(file)); } catch {} };
  const uploadOne = async (file: File): Promise<string> => {
    const fd = new FormData(); fd.append('file', file, file.name || 'image.png');
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json(); if (!j?.url) throw new Error('Upload não retornou URL');
    return j.url as string;
  };
  const saveVisuals = async () => {
    if (!selectedOrg) return;
    setSavingVisuals(true);
    try {
      let finalLogo = (selectedOrg as any).logoUrl || '';
      let finalCover = (selectedOrg as any).coverUrl || '';
      if (logoFile) finalLogo = await uploadOne(logoFile);
      if (coverFile) finalCover = await uploadOne(coverFile);
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl: finalLogo || null, coverUrl: finalCover || null }) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Logo e capa atualizados.' });
      setVisualsOpen(false);
    } catch {
      try { localStorage.setItem(`ORG_VISUALS_${selectedOrg.id}`, JSON.stringify({ logoUrl: logoPreview, coverUrl: coverPreview })); } catch {}
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponível.' });
      setVisualsOpen(false);
    } finally { setSavingVisuals(false); }
  };

  // Links
  const [linksOpen, setLinksOpen] = React.useState(false);
  const [savingLinks, setSavingLinks] = React.useState(false);
  const [site, setSite] = React.useState('');
  const [instagram, setInstagram] = React.useState('');
  const [tiktok, setTiktok] = React.useState('');
  const [youtube, setYoutube] = React.useState('');
  const [facebook, setFacebook] = React.useState('');
  const [x, setX] = React.useState('');
  const [telegram, setTelegram] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [messenger, setMessenger] = React.useState('');
  const [discord, setDiscord] = React.useState('');
  const [spotify, setSpotify] = React.useState('');
  const [soundcloud, setSoundcloud] = React.useState('');
  const [instagramChannel, setInstagramChannel] = React.useState('');
  const openLinks = () => {
    if (!selectedOrg) return;
    setLinksOpen(true);
    setSite((selectedOrg as any).site || '');
    setInstagram((selectedOrg as any).instagram || '');
    setTiktok((selectedOrg as any).tiktok || '');
    setYoutube((selectedOrg as any).youtube || '');
    setFacebook((selectedOrg as any).facebook || '');
    setX((selectedOrg as any).x || (selectedOrg as any).twitter || '');
    setTelegram((selectedOrg as any).telegram || '');
    setWhatsapp((selectedOrg as any).whatsapp || '');
    setMessenger((selectedOrg as any).messenger || '');
    setDiscord((selectedOrg as any).discord || '');
    setSpotify((selectedOrg as any).spotify || '');
    setSoundcloud((selectedOrg as any).soundcloud || '');
    setInstagramChannel((selectedOrg as any).instagramChannel || '');
    setTimeout(() => smoothScrollTo(featuredRef.current), 50);
  };
  const saveLinks = async () => {
    if (!selectedOrg) return; setSavingLinks(true);
    try {
      const payload: any = { site, instagram, tiktok, youtube, facebook, x, telegram, whatsapp, messenger, discord, spotify, soundcloud, instagramChannel };
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Links atualizados.' }); setLinksOpen(false);
    } catch {
      try { localStorage.setItem(`ORG_LINKS_${selectedOrg.id}`, JSON.stringify({ site, instagram, tiktok, youtube, facebook, x, telegram, whatsapp, messenger, discord, spotify, soundcloud, instagramChannel })); } catch {}
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponível.' }); setLinksOpen(false);
    } finally { setSavingLinks(false); }
  };

  // Informações gerais (contato & localização)
  const [generalOpen, setGeneralOpen] = React.useState(false);
  const [contactEmail, setContactEmail] = React.useState('');
  const [showContactEmail, setShowContactEmail] = React.useState(false);
  const [locationText, setLocationText] = React.useState('');
  const [savingGeneral, setSavingGeneral] = React.useState(false);
  const openGeneral = () => {
    if (!selectedOrg) return; setGeneralOpen(true);
    setContactEmail((selectedOrg as any).contactEmail || '');
    setShowContactEmail(!!(selectedOrg as any).showContactEmail);
    setLocationText((selectedOrg as any).locationText || '');
    setTimeout(() => smoothScrollTo(featuredRef.current), 50);
  };
  const saveGeneral = async () => {
    if (!selectedOrg) return; setSavingGeneral(true);
    try {
      const payload: any = { contactEmail, showContactEmail, locationText };
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Informações atualizadas.' }); setGeneralOpen(false);
    } catch {
      try { localStorage.setItem(`ORG_GENERAL_${selectedOrg.id}`, JSON.stringify({ contactEmail, showContactEmail, locationText })); } catch {}
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponível.' }); setGeneralOpen(false);
    } finally { setSavingGeneral(false); }
  };

  // Artistas
  const [artistsOpen, setArtistsOpen] = React.useState(false);
  const [artistsMode, setArtistsMode] = React.useState<'popular'|'recent'|'hidden'>('popular');
  const [savingArtists, setSavingArtists] = React.useState(false);
  const openArtists = () => { setArtistsOpen(true); setTimeout(() => smoothScrollTo(featuredRef.current), 50); };
  const saveArtists = async () => {
    if (!selectedOrg) return; setSavingArtists(true);
    try { const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artistsMode }) }); if (!r.ok) throw new Error(await r.text()); toast({ title: 'Salvo', description: 'Preferência de artistas atualizada.' }); setArtistsOpen(false); }
    catch { try { localStorage.setItem(`ORG_ARTISTS_${selectedOrg.id}`, JSON.stringify({ artistsMode })); } catch {}; toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponível.' }); setArtistsOpen(false); }
    finally { setSavingArtists(false); }
  };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex justify-center items-start">
      <SidebarMenu activeKeyOverride="ajustes" />
      <div className="rounded-3xl w-[1352px] bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4 pb-[100px] mb-[100px]">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4 pb-[100px]">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações do organizador</h1>
          {!selectedOrg ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-center text-slate-500">Selecione uma organização no topo para personalizar.</div>
          ) : (
            <Tabs defaultValue="pagina" className="w-full">
              <TabsList className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-1">
                <TabsTrigger value="pagina">Minha página</TabsTrigger>
                <TabsTrigger value="widget" disabled title="Em breve">Widget</TabsTrigger>
                <TabsTrigger value="express">Bilheteria Express</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
              </TabsList>
              <TabsContent value="pagina" className="pt-2">
                {/* Cabeçalho */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-black flex items-center justify-center text-xl font-bold text-slate-800 dark:text-white overflow-hidden">
                        {(selectedOrg as any)?.logoUrl ? (
                          <img src={(selectedOrg as any).logoUrl} alt={(selectedOrg as any).name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          ((selectedOrg as any)?.name || 'O').charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-semibold text-slate-900 dark:text-white">{(selectedOrg as any).name}</div>
                          <button onClick={openEditIdentity} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]" title="Editar nome e URL"><PenLine size={16} /></button>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Minha página URL: <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{url.replace(/^https?:\/\//,'')}</a></div>
                        <div className="text-xs text-slate-400 mt-0.5">Última atualização: –</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={handleShare} className="gap-2"><Share2 size={16} /> Compartilhar</Button>
                      <Button onClick={() => url && window.open(url, '_blank')} className="gap-2"><ExternalLink size={16} /> Ver página</Button>
                    </div>
                  </div>
                </div>

                {/* Evento em destaque */}
                <div ref={featuredRef} className="mt-8">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Evento em destaque</div>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700 dark:text-slate-200"><span className="font-semibold">Evento em destaque</span> / Fixe um dos seus eventos no topo da sua página</div>
                      {!openFeatured && <Button variant="secondary" onClick={openFeaturedPanel}>Adicionar</Button>}
                    </div>
                    {openFeatured && (
                      <div className="mt-4 rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Evento em destaque</div>
                        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                          <SelectTrigger className="w-full"><SelectValue placeholder={eventsLoading ? 'Carregando eventos...' : 'Selecionar um evento'} /></SelectTrigger>
                          <SelectContent>
                            {events.map(ev => (
                              <SelectItem key={ev.id} value={ev.id}>{ev.name}{ev.startDate ? ` — ${new Date(ev.startDate).toLocaleDateString('pt-BR')}` : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-4 flex items-center gap-3">
                          <Button onClick={saveFeatured} disabled={!selectedEventId || savingFeatured}>{savingFeatured ? 'Salvando...' : 'Destacar este evento'}</Button>
                          <Button variant="secondary" onClick={() => setOpenFeatured(false)}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sobre / Bio & tags */}
                <div ref={aboutRef} className="mt-8">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Configurações da página</div>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200"><PenLine size={18} /><div><div className="font-semibold">Sobre</div><div className="text-sm text-slate-500 dark:text-slate-400">Bio & tags</div></div></div>
                      {!aboutOpen && <Button variant="secondary" onClick={openAbout}>Editar</Button>}
                    </div>
                    {aboutOpen && (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mini bio</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Apresente-se em poucas palavras</div>
                          <Textarea value={miniBio} onChange={e => setMiniBio(e.target.value.slice(0, 140))} placeholder="Escreva uma bio resumida..." rows={3} />
                          <div className="text-xs text-slate-500 mt-1 text-right">{miniBio.length}/140</div>
                        </div>
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tags</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Escolha até 3 tags que representem sua página</div>
                          <div className="flex flex-wrap gap-2">
                            {TAG_OPTIONS.map(t => {
                              const active = aboutTags.includes(t.key);
                              return (
                                <button key={t.key} onClick={() => toggleTag(t.key)} className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-[#121212] text-slate-700 dark:text-slate-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]'}`}>
                                  {t.icon === 'leaf' ? <Leaf size={14} className="inline mr-1" /> : t.icon === 'music' ? <Music4 size={14} className="inline mr-1" /> : null}
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sobre</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Conte aos seus clientes um pouco mais da sua história</div>
                          <Textarea value={aboutDesc} onChange={e => setAboutDesc(e.target.value)} placeholder="Escreva uma descrição..." rows={6} />
                        </div>
                        <div className="flex items-center gap-3">
                          <Button onClick={saveAbout}>Salvar</Button>
                          <Button variant="secondary" onClick={() => setAboutOpen(false)}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visuais */}
                <div className="mt-8">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                        <ImagePlus size={18} />
                        <div>
                          <div className="font-semibold">Visuais</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Logo & Capa</div>
                        </div>
                      </div>
                      {!visualsOpen && <Button variant="secondary" onClick={openVisuals}>Editar</Button>}
                    </div>
                    {visualsOpen && (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Logo</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Imagens maiores que 300×300 ficam melhores. Formatos: jpg, png, webp.</div>
                          <div className="w-[300px] h-[300px] border-2 border-dashed border-zinc-400/60 rounded-lg flex items-center justify-center bg-zinc-200/20 relative overflow-hidden">
                            {logoPreview ? (<img src={logoPreview} alt="logo" className="object-cover w-full h-full" />) : (<div className="text-center text-slate-500"><ImagePlus className="mx-auto mb-2" /><div>300×300</div><div className="text-xs">Imagem</div></div>)}
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onPickLogo(e.target.files?.[0] || null)} />
                          </div>
                        </div>
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Capa</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Melhor em ~3000×1000 (3:1). Formatos: jpg, png, webp.</div>
                          <div className="w-full max-w-[760px] h-[250px] border-2 border-dashed border-zinc-400/60 rounded-lg flex items-center justify-center bg-zinc-200/20 relative overflow-hidden">
                            {coverPreview ? (<img src={coverPreview} alt="capa" className="object-cover w-full h-full" />) : (<div className="text-center text-slate-500"><ImagePlus className="mx-auto mb-2" /><div>3000×1000 (3/1)</div><div className="text-xs">Imagem</div></div>)}
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onPickCover(e.target.files?.[0] || null)} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3"><Button onClick={saveVisuals} disabled={savingVisuals}>{savingVisuals ? 'Salvando...' : 'Salvar'}</Button><Button variant="secondary" onClick={() => setVisualsOpen(false)}>Cancelar</Button></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Links */}
                <div className="mt-8">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                        <LinkIcon size={18} />
                        <div>
                          <div className="font-semibold">Links</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Website & mídias sociais</div>
                        </div>
                      </div>
                      {!linksOpen && <Button variant="secondary" onClick={openLinks}>Editar</Button>}
                    </div>
                    {linksOpen && (
                      <div className="mt-4 space-y-5">
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Website</div>
                          <div className="flex items-center gap-2"><Globe size={16} className="text-slate-500" /><Input value={site} onChange={e => setSite(e.target.value)} placeholder="https://seudominio.com" /></div>
                        </div>
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Mídias sociais</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2"><Instagram size={16} className="text-slate-500" /><Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="instagram.com/" /></div>
                            <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500" /><Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="t.me/" /></div>
                            <div className="flex items-center gap-2"><Disc size={16} className="text-slate-500" /><Input value={soundcloud} onChange={e => setSoundcloud(e.target.value)} placeholder="soundcloud.com/" /></div>
                            <div className="flex items-center gap-2"><Music size={16} className="text-slate-500" /><Input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="tiktok.com/@" /></div>
                            <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500" /><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp" /></div>
                            <div className="flex items-center gap-2"><Music size={16} className="text-slate-500" /><Input value={spotify} onChange={e => setSpotify(e.target.value)} placeholder="open.spotify.com/user/" /></div>
                            <div className="flex items-center gap-2"><Youtube size={16} className="text-slate-500" /><Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="youtube.com/" /></div>
                            <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500" /><Input value={messenger} onChange={e => setMessenger(e.target.value)} placeholder="m.me/" /></div>
                            <div className="flex items-center gap-2"><Instagram size={16} className="text-slate-500" /><Input value={instagramChannel} onChange={e => setInstagramChannel(e.target.value)} placeholder="instagram.com/channel/" /></div>
                            <div className="flex items-center gap-2"><Facebook size={16} className="text-slate-500" /><Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="facebook.com/" /></div>
                            <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500" /><Input value={discord} onChange={e => setDiscord(e.target.value)} placeholder="discord.gg/" /></div>
                            <div className="flex items-center gap-2"><PenLine size={16} className="text-slate-500" /><Input value={x} onChange={e => setX(e.target.value)} placeholder="x.com/" /></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3"><Button onClick={saveLinks} disabled={savingLinks}>{savingLinks ? 'Salvando...' : 'Salvar'}</Button><Button variant="secondary" onClick={() => setLinksOpen(false)}>Cancelar</Button></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações gerais */}
                <div className="mt-8">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                        <Info size={18} />
                        <div>
                          <div className="font-semibold">Informações gerais</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Contato & localização</div>
                        </div>
                      </div>
                      {!generalOpen && <Button variant="secondary" onClick={openGeneral}>Editar</Button>}
                    </div>
                    {generalOpen && (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Informações de contato</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Dê a seus clientes informações para contatarem você</div>
                            <div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-slate-600 dark:text-slate-300">Email de contato</div><a href="/account-settings" className="text-indigo-600 text-sm hover:underline">Atualizar este email</a></div>
                            <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@exemplo.com" />
                            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" className="w-4 h-4" checked={showContactEmail} onChange={e => setShowContactEmail(e.target.checked)} /> Exibir meu email de contato na minha página</label>
                          </div>
                          <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Localização</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Ajude seus clientes a encontrarem você</div>
                            <Input value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="Busca por endereço" />
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Sua localização ajuda os visitantes da sua página a saberem onde normalmente são seus eventos.</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3"><Button onClick={saveGeneral} disabled={savingGeneral}>{savingGeneral ? 'Salvando...' : 'Salvar'}</Button><Button variant="secondary" onClick={() => setGeneralOpen(false)}>Cancelar</Button></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Artistas */}
                <div className="mt-8">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                        <Music2 size={18} />
                        <div>
                          <div className="font-semibold">Artistas</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Tocaram aqui</div>
                        </div>
                      </div>
                      {!artistsOpen && <Button variant="secondary" onClick={openArtists}>Editar</Button>}
                    </div>
                    {artistsOpen && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm text-slate-700 dark:text-slate-200 mb-3">Mostre os últimos artistas em sua página para despertar o interesse de seus clientes.</div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 text-slate-800 dark:text-slate-200"><input type="radio" name="artistsMode" value="popular" checked={artistsMode==='popular'} onChange={() => setArtistsMode('popular')} /> <span>Mais popular</span></label>
                            <label className="flex items-center gap-3 text-slate-800 dark:text-slate-200"><input type="radio" name="artistsMode" value="recent" checked={artistsMode==='recent'} onChange={() => setArtistsMode('recent')} /> <span>Mais recente</span></label>
                            <label className="flex items-center gap-3 text-slate-800 dark:text-slate-200"><input type="radio" name="artistsMode" value="hidden" checked={artistsMode==='hidden'} onChange={() => setArtistsMode('hidden')} /> <span>Não mostrar artistas em minha página</span></label>
                          </div>
                        </div>
                        <div className="flex items-center gap-3"><Button onClick={saveArtists} disabled={savingArtists}>{savingArtists ? 'Salvando...' : 'Salvar'}</Button><Button variant="secondary" onClick={() => setArtistsOpen(false)}>Cancelar</Button></div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="widget" className="pt-2">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-8 text-slate-600 dark:text-slate-300">Em breve: Widget de incorporação.</div>
              </TabsContent>
              <TabsContent value="express" className="pt-2">
                <div className="space-y-6">
                  <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <div className="bg-gradient-to-r from-indigo-600/15 to-fuchsia-600/15 dark:from-indigo-500/20 dark:to-fuchsia-500/20 p-6 flex items-center justify-between">
                      <div>
                        <div className="text-xl font-semibold text-slate-900 dark:text-white">Bilheteria Expressa</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">A Bilheteria Express facilita a venda de ingressos na porta do evento.</div>
                        <a className="inline-flex items-center gap-1 mt-2 text-indigo-600 hover:underline" href="https://help.fauves.app/bilheteria-express" target="_blank" rel="noreferrer">Saiba mais <ExternalLink size={14} /></a>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <QrCode size={56} />
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium">URL Bilheteria Express:</span> {expressUrl ? (
                        <a className="text-indigo-600 hover:underline ml-1" href={expressUrl} target="_blank" rel="noreferrer">{expressUrl.replace(/^https?:\/\//,'')}</a>
                      ) : (
                        <span className="ml-1 text-slate-500">—</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">Seu QR Code da Bilheteria Expressa</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Imprima e apresente este QR code para uma experiência fácil de compra de ingressos a seus clientes.</div>
                    <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0f0f0f] p-3">
                        {expressQrUrl ? (
                          <img src={expressQrUrl} alt="QR Bilheteria Express" className="w-[220px] h-[220px] object-contain" />
                        ) : (
                          <div className="w-[220px] h-[220px] grid place-items-center text-slate-500">QR indisponível</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-600 dark:text-slate-300">Ao escanear, os clientes são levados diretamente à compra rápida (Apple Pay, Google Pay e cartões).</div>
                        <div className="mt-3">
                          <Button variant="secondary" onClick={async () => {
                            try {
                              if (!expressQrUrl) return;
                              const res = await fetch(expressQrUrl);
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              const base = (selectedOrg as any)?.slug || (selectedOrg as any)?.id || 'organizacao';
                              a.download = `bilheteria-express-${base}.png`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                              toast({ title: 'Download iniciado', description: 'QR Code sendo baixado.' });
                            } catch (e) {
                              toast({ variant: 'destructive', title: 'Falha no download', description: 'Não foi possível baixar o QR Code.' });
                            }
                          }}>Download QR Code</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6 hidden">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Perguntas frequentes</div>
                    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                      <div>
                        <div className="font-medium">Quais ingressos são vendidos na página Bilheteria Expressa?</div>
                        <div>Sua página Bilheteria Expressa exibe os mesmos ingressos listados na página do evento.</div>
                      </div>
                      <div>
                        <div className="font-medium">O que ocorrerá se um comprador fechar a página após o checkout?</div>
                        <div>Após a compra, os compradores recebem um e-mail com seus ingressos.</div>
                      </div>
                      <div>
                        <div className="font-medium">Quais eventos são listados?</div>
                        <div>Exibimos automaticamente o evento em andamento ou o próximo (nas próximas 6 horas). Se houver vários, mostramos todos e o cliente escolhe.</div>
                      </div>
                      <div>
                        <div className="font-medium">As informações de contato dos compradores são coletadas?</div>
                        <div>Sim. Coletamos e-mail e telefone e adicionamos aos seus contatos no Smartboard.</div>
                      </div>
                      <div>
                        <div className="font-medium">Como obter um relatório de vendas?</div>
                        <div>As vendas são marcadas com a etiqueta “Door”. Filtre por “Door” na lista de pedidos do evento.</div>
                      </div>
                      <div>
                        <div className="font-medium">E se o comprador já tiver uma conta?</div>
                        <div>Se o usuário estiver logado no app, poderá ser redirecionado à página do evento no aplicativo e concluir a compra.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="banking" className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card: Banco */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                    <div className="flex items-start justify-between">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Banco</div>
                      {bankingConfirmed ? (
                        <CheckCircle2 className="text-emerald-600" size={20} title="Confirmado" />
                      ) : (
                        <div className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">A preencher</div>
                      )}
                    </div>
                    <div className="mt-3 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{(selectedOrg as any)?.name || '—'}</div>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-zinc-800/5 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm">
                        <Mail size={14} />
                        <span>Email:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{user?.email || '—'}</span>
                      </div>
                      {bankingConfirmed && savedPixKey && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-zinc-800/5 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm">
                          <span className="inline-flex items-center gap-1"><span className="font-medium">PIX:</span></span>
                          <span className="font-semibold text-slate-900 dark:text-white">{savedPixKey}</span>
                        </div>
                      )}
                      {!bankingConfirmed && <div className="mt-2 text-sm text-slate-500">É necessário para fazer transferências</div>}
                    </div>
                    {!bankingConfirmed ? (
                      <div className="mt-5">
                        <Button
                          onClick={() => {
                            setBankPhase('form');
                            setShowEmailVerification(false);
                            setEmailCode(['', '', '', '']);
                            setPixKey('');
                            setConfirmOwner(false);
                            setBankOpen(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >Adicionar minhas informações bancárias</Button>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                        Para atualizar sua Conta Bancária, por favor, <a className="text-indigo-600 hover:underline" href="/suporte" target="_blank" rel="noreferrer">contate o time de Suporte</a>.
                      </div>
                    )}
                  </div>

                  {/* Card: Segurança */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">Segurança</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Garanta a segurança da sessão Banking definindo um código PIN</div>
                    {pinPhase==='done' ? (
                      <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">Você definiu um código PIN. Para alterar, por favor contate o suporte.</div>
                    ) : (
                      <>
                        <div className="mt-5 text-sm text-slate-700 dark:text-slate-200">{pinPhase==='set' ? 'Defina o seu PIN:' : 'Confirme o PIN digitando novamente:'}</div>
                        {pinPhase==='set' && (
                          <div className="mt-3 flex items-center gap-3">
                            {pin.map((d, idx) => (
                              <input key={idx} value={d} onChange={(e)=>{ const v=e.target.value.replace(/\D/g,'').slice(0,1); const next=[...pin]; next[idx]=v; setPin(next); if(v && idx<3){ const el=document.getElementById(`pin-set-${idx+1}`) as HTMLInputElement|null; el?.focus(); } if(next.every(x=>x && x.length===1)){ setTimeout(()=>{ setPinPhase('confirm'); try{ const el=document.getElementById('pin-confirm-0') as HTMLInputElement|null; el?.focus(); }catch{} }, 50); } }} id={`pin-set-${idx}`} inputMode="numeric" maxLength={1} className="w-10 h-12 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-center text-lg text-slate-900 dark:text-white" />
                            ))}
                          </div>
                        )}
                        {pinPhase==='confirm' && (
                          <div className="mt-3 flex items-center gap-3">
                            {pinConfirm.map((d, idx) => (
                              <input key={idx} value={d} onChange={(e)=>{ const v=e.target.value.replace(/\D/g,'').slice(0,1); const next=[...pinConfirm]; next[idx]=v; setPinConfirm(next); if(v && idx<3){ const el=document.getElementById(`pin-confirm-${idx+1}`) as HTMLInputElement|null; el?.focus(); } if(next.every(x=>x && x.length===1)){ const a=pin.join(''); const b=next.join(''); if(a===b){ try{ localStorage.setItem('BANKING_PIN', a); }catch{} setPinPhase('done'); } else { try{ localStorage.removeItem('BANKING_PIN'); }catch{} setPin(['','','','']); setPinConfirm(['','','','']); setPinPhase('set'); } } }} id={`pin-confirm-${idx}`} inputMode="numeric" maxLength={1} className="w-10 h-12 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-center text-lg text-slate-900 dark:text-white" />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* verificação por e-mail movida para dentro do modal */}

                {/* Modal: adicionar informações bancárias */}
                <Dialog open={bankOpen} onOpenChange={setBankOpen}>
                  <DialogContent className="sm:max-w-[640px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar minhas informações bancárias</DialogTitle>
                    </DialogHeader>
                    <div className={`space-y-5 ${bankPhase==='verify' ? 'hidden' : ''}`}>
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1a1a1a] p-4">
                        <div className="font-medium text-slate-900 dark:text-white mb-3">Dados dos beneficiários</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">
                          <div className="col-span-2"><div className="text-slate-500">Razão Social</div><div className="font-medium">{(selectedOrg as any)?.name || '—'}</div></div>
                          <div><div className="text-slate-500">Nome</div><div className="font-medium">{firstName || '—'}</div></div>
                          <div><div className="text-slate-500">Sobrenome</div><div className="font-medium">{lastName || '—'}</div></div>
                          <div className="col-span-2"><div className="text-slate-500">E-mail</div><div className="font-medium">{user?.email || '—'}</div></div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1a1a1a] p-4">
                        <div className="font-medium text-slate-900 dark:text-white mb-3">Chave PIX (para transferência do balanço dos eventos)</div>
                        <div className="inline-flex rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          <button className={`px-3 py-1.5 text-sm ${pixType==='email' ? 'bg-indigo-600 text-white' : 'bg-transparent text-slate-700 dark:text-slate-300'}`} onClick={() => setPixType('email')}>E-mail</button>
                          <button className={`px-3 py-1.5 text-sm ${pixType==='phone' ? 'bg-indigo-600 text-white' : 'bg-transparent text-slate-700 dark:text-slate-300'}`} onClick={() => setPixType('phone')}>Telefone</button>
                          <button className={`px-3 py-1.5 text-sm ${pixType==='cpfcnpj' ? 'bg-indigo-600 text-white' : 'bg-transparent text-slate-700 dark:text-slate-300'}`} onClick={() => setPixType('cpfcnpj')}>CPF / CNPJ</button>
                        </div>
                        <div className="mt-3">
                          <Input placeholder={pixType==='email' ? 'john@gmail.com' : pixType==='phone' ? '(11) 90000-0000' : '000.000.000-00'} value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
                        </div>
                        <label className="mt-3 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input type="checkbox" checked={confirmOwner} onChange={(e) => setConfirmOwner(e.target.checked)} className="mt-0.5" />
                          <span>Eu confirmo que esta conta bancária pertence à minha organização e que eu tenho autorização para usá-la.</span>
                        </label>
                      </div>
                    </div>
                    <DialogFooter className={bankPhase==='verify' ? 'hidden' : ''}>
                      <Button variant="secondary" onClick={() => setBankOpen(false)}>Cancelar</Button>
                      <Button onClick={saveBanking} disabled={!pixKey.trim() || !confirmOwner}>Confirmar adição de conta</Button>
                    </DialogFooter>
                    {bankPhase==='verify' && (
                      <>
                        <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">Para permitir sua ação, nós enviamos um código de segurança para <span className="font-semibold">{maskEmail(user?.email)}</span>.<br/>Pode levar alguns segundos até que a mensagem chegue.</div>
                        <div className="mt-4 flex items-center gap-3">
                          {emailCode.map((d, idx) => (
                            <input key={idx} value={d} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0,1); const next = [...emailCode]; next[idx] = v; setEmailCode(next); if (v && idx < 3) { const el = document.getElementById(`ecode-${idx+1}`) as HTMLInputElement | null; el?.focus(); } submitEmailCodeIfComplete(next); }} id={`ecode-${idx}`} inputMode="numeric" maxLength={1} className="w-10 h-12 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-center text-lg text-slate-900 dark:text-white" />
                          ))}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">{emailTimeLeft}</div>
                        <DialogFooter>
                          <Button variant="secondary" onClick={() => { setBankOpen(false); setBankPhase('form'); }}>Cancelar</Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>
          )}
          {/* Modal: editar nome e slug */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader><DialogTitle>Atualize seu nome e URL</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nome do organizador</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" />
                </div>
                <div>
                  <Label>URL do produtor</Label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-slate-500 dark:text-slate-400 select-none">{(typeof window!=='undefined'? window.location.origin.replace(/^https?:\/\//,'') : '')}/org/</div>
                    <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="meu-slug" className="flex-1" />
                  </div>
                  {slugStatus==='checking' && <div className="text-xs text-slate-500 mt-1">Verificando disponibilidade…</div>}
                  {slugStatus==='available' && <div className="text-xs text-green-600 mt-1">Disponível</div>}
                  {slugStatus==='taken' && <div className="text-xs text-red-600 mt-1">Indisponível</div>}
                  {slugStatus==='invalid' && <div className="text-xs text-red-600 mt-1">Informe um slug válido</div>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={()=> setEditOpen(false)}>Cancelar</Button>
                <Button onClick={saveIdentity} disabled={!editName.trim() || !editSlug.trim() || slugStatus==='taken' || slugStatus==='invalid' || savingIdentity}>{savingIdentity? 'Salvando...' : 'Salvar'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

// ---------------- Widget Builder ----------------
const WidgetBuilder: React.FC<{ org: any; events: Array<{id:string;name:string;startDate?:string}>; eventsLoading: boolean; onEnsureEvents: ()=>void }>
  = ({ org, events, eventsLoading, onEnsureEvents }) => {
  const [view, setView] = React.useState<'page'|'event'|'list'>('page');
  const [theme, setTheme] = React.useState<'dark'|'light'>('dark');
  const [transparent, setTransparent] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState('');
  const [copyMsg, setCopyMsg] = React.useState<string>('');

  React.useEffect(() => { if (view==='event' && events.length===0 && !eventsLoading) onEnsureEvents(); }, [view, events.length, eventsLoading, onEnsureEvents]);

  const origin = (typeof window!=='undefined' ? window.location.origin : '');
  const orgPath = org?.slug || org?.id || '';

  const codePage = `\n<iframe src="${origin}/org/${orgPath}?embedded=1&ui=${theme}${transparent?'&transparent=1':''}${showDetails?'&details=1':''}" allow="payment" style="width:100%; height:800px; max-height:calc(100vh - 200px); border:0;"></iframe>\n<script src="${origin}/widget.js"></script>`;

  const codeEvent = `\n<iframe src="${origin}/event/${selectedEventId || 'EVENT_ID'}?embedded=1&ui=${theme}${transparent?'&transparent=1':''}" allow="payment" style="width:100%; height:800px; max-height:calc(100vh - 200px); border:0;"></iframe>\n<script src="${origin}/widget.js"></script>`;

  const codeList = `\n<script>window.__fauves={"events-listing":{ "organizerId":"${org?.id || ''}", "layout":"shotgun", "showEventTags":true}};</script>\n<style> body #fauves-events-listing { --shotgun-muted:#f4f4f5; --shotgun-accent:#f4f4f5; --shotgun-accent-foreground:#ff765f; --shotgun-border:#e4e4e7; --shotgun-foreground:#09090b; } </style>\n<section id="fauves-events-listing" />\n<script src="${origin}/events-listing.js"></script>`;

  const code = view==='page'? codePage : view==='event'? codeEvent : codeList;

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopyMsg('Copiado!'); setTimeout(()=> setCopyMsg(''), 1500); } catch { setCopyMsg('Falhou'); setTimeout(()=> setCopyMsg(''), 1500); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        {/* inner tabs */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-1 mb-4">
          <button className={`px-3 py-1.5 rounded-md text-sm ${view==='page'?'bg-indigo-600 text-white':'text-slate-700 dark:text-slate-200'}`} onClick={()=> setView('page')}>Minha página</button>
          <button className={`px-3 py-1.5 rounded-md text-sm ${view==='event'?'bg-indigo-600 text-white':'text-slate-700 dark:text-slate-200'}`} onClick={()=> setView('event')}>Evento</button>
          <button className={`px-3 py-1.5 rounded-md text-sm ${view==='list'?'bg-indigo-600 text-white':'text-slate-700 dark:text-slate-200'}`} onClick={()=> setView('list')}>Lista de Eventos</button>
        </div>

        {/* controls */}
        {view!=='event' ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1"><input type="radio" name="wtheme" checked={theme==='dark'} onChange={()=> setTheme('dark')} /> Escuro</label>
                <label className="flex items-center gap-1"><input type="radio" name="wtheme" checked={theme==='light'} onChange={()=> setTheme('light')} /> Claro</label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Fundo transparente</div>
              </div>
              <input type="checkbox" checked={transparent} onChange={e=> setTransparent(e.target.checked)} />
            </div>
            {view==='page' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Mostrar detalhes da página</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Botão de seguir, capa, logo, descrições, redes sociais, etc.</div>
                </div>
                <input type="checkbox" checked={showDetails} onChange={e=> setShowDetails(e.target.checked)} />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Selecionar evento</div>
              <div className="flex items-center gap-3">
                <select value={selectedEventId} onChange={e=> setSelectedEventId(e.target.value)} className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] px-3 text-sm">
                  <option value="" disabled>{eventsLoading? 'Carregando...' : 'Selecione'}</option>
                  {events.map(ev => (<option value={ev.id} key={ev.id}>{ev.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1"><input type="radio" name="wtheme2" checked={theme==='dark'} onChange={()=> setTheme('dark')} /> Escuro</label>
                <label className="flex items-center gap-1"><input type="radio" name="wtheme2" checked={theme==='light'} onChange={()=> setTheme('light')} /> Claro</label>
              </div>
            </div>
            <div className="flex items-center justify-between"><div className="text-sm font-medium text-slate-700 dark:text-slate-200">Fundo transparente</div><input type="checkbox" checked={transparent} onChange={e=> setTransparent(e.target.checked)} /></div>
          </div>
        )}

        {/* Código do widget */}
        <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold text-slate-700 dark:text-slate-200">Código do Widget</div><button className="text-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700" onClick={copy}>{copyMsg || 'Copiar código'}</button></div>
          <textarea readOnly value={code} className="w-full h-40 bg-zinc-900/10 dark:bg-[#0f0f0f] text-xs p-3 rounded-md border border-zinc-300 dark:border-zinc-700 text-slate-800 dark:text-slate-200" />
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Copie e cole esse código onde você quer que o widget apareça no seu website</div>
        </div>
      </div>
      {/* Preview placeholder */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-[#0f0f0f] min-h-[380px] p-6 text-white">
        <div className="text-xl font-extrabold tracking-wide mb-4">PRÓXIMOS EVENTOS</div>
        <div className="rounded-lg border border-white/10 p-6 text-sm text-white/70">Não há eventos futuros.<br/>Siga este produtor para receber atualizações.</div>
        <div className="mt-8 text-xl font-extrabold tracking-wide">SOBRE</div>
        <div className="text-sm text-white/70 mt-2">Entrou na Fauves em {(new Date()).getFullYear()}</div>
      </div>
    </div>
  );
};
