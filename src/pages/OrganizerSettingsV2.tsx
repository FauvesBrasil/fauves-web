import React from 'react';
import TextLink from '@/components/TextLink';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { useOrganization } from '@/context/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Share2, ExternalLink, PenLine, Leaf, Music4, ImagePlus, Globe, Instagram, Facebook, Youtube, Music, Disc, MessageCircle, Info, Link as LinkIcon, Music2, QrCode, Mail, Lock, CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ensureApiBase, apiUrl, fetchApi } from '@/lib/apiBase';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import { getOrganizationPath } from '@/lib/eventUrl';

function getOrgPublicUrl(org: any): string {
  try {
    const base = window.location.origin;
    const path = getOrganizationPath(org);
    return path ? `${base}${path}` : '';
  } catch {
    return '';
  }
}

function getExpressUrl(org: any): string {
  try {
    const base = window.location.origin;
    const slugOrId = org?.slug || '';
    return slugOrId ? `${base}/venues/${slugOrId}/door` : '';
  } catch {
    return '';
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} as ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}


type OrganizerTabKey = 'pagina' | 'express' | 'banking';

export default function OrganizerSettingsV2() {
  const { selectedOrg, orgs, setSelectedOrgById } = useOrganization();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados para menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Estado para modal de confirmacao de exclusao
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  // Estado para loading e erro da exclusao
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  // Funcao para excluir organizacao
  async function handleDeleteOrg() {
    if (!selectedOrg?.id) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errText = await res.text();
        setDeleteError('Erro ao excluir: ' + errText);
        setDeleteLoading(false);
        return;
      }
      // Atualiza o estado local, exibe toast e limpa selecao
      toast({ title: 'Organizacao excluida', description: 'A organizacao foi removida com sucesso.', variant: 'default' });
      // Aqui voce pode atualizar o contexto ou redirecionar
      window.location.reload();
    } catch (e) {
      setDeleteError('Erro ao excluir.');
    } finally {
      setDeleteLoading(false);
    }
  }
  // Estado local para dados completos da organização (garantindo updateAt)
  const [extendedOrg, setExtendedOrg] = React.useState<any | null>(null);

  const [orgUrl, setOrgUrl] = React.useState('');
  const [copyingUrl, setCopyingUrl] = React.useState(false);
  const [derivedSlug, setDerivedSlug] = React.useState('');

  // Garantir que exibimos a URL com slug, buscando do backend para ter dados frescos (slug, updatedAt)
  React.useEffect(() => {
    const buildUrl = async () => {
      if (!selectedOrg) { setOrgUrl(''); setExtendedOrg(null); return; }

      // Sempre buscar dados atualizados
      try {
        const res = await fetchApi(`/api/organization/${selectedOrg.id}`);
        if (res.ok) {
          const org = await res.json();
          setExtendedOrg(org);
        }
      } catch (e) {
        // Silently fail or handle error appropriately if needed
      }
    };
    buildUrl();
  }, [selectedOrg]);

  // Atualizar URLs e Slug baseado no extendedOrg ou selectedOrg
  React.useEffect(() => {
    const org = extendedOrg || selectedOrg;
    if (!org) {
      setOrgUrl('');
      setDerivedSlug('');
      return;
    }

    // Calcular path
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    let path = getOrganizationPath(org);

    setOrgUrl(path ? `${base}${path}` : '');

    // Extrair slug
    if (org.slug) {
      setDerivedSlug(org.slug);
    } else {
      // Tentar extrair da URL se não tiver no objeto
      try {
        if (path) {
          const match = path.match(/\/org\/([^\/?#]+)/);
          if (match?.[1]) { setDerivedSlug(match[1]); }
        }
      } catch { }
    }
  }, [selectedOrg, extendedOrg]);

  React.useEffect(() => {
    if (extendedOrg) {
      setEfiAccountStatus(extendedOrg.efiAccountStatus || 'NONE');
      setEfiOnboardingStep(extendedOrg.efiOnboardingStep || 'START');
      setEfiOnboardingData(extendedOrg.efiOnboardingData || null);

      if (extendedOrg.bankingInfo) {
        try {
          const info = typeof extendedOrg.bankingInfo === 'string' ? JSON.parse(extendedOrg.bankingInfo) : extendedOrg.bankingInfo;
          if (info.pix && info.pix.key) {
            setSavedPixKey(info.pix.key);
            setPixKey(info.pix.key);
            setPixType(info.pix.type || 'email');
            setBankingConfirmed(true);
            setConfirmOwner(true);
          }
        } catch (e) {
          // Silently fail
        }
      }
    }
  }, [extendedOrg]);

  const displayOrg = extendedOrg || selectedOrg;
  const lastUpdated = displayOrg ? formatDateTime(displayOrg.updatedAt || displayOrg.createdAt) : '-';
  const hasOrgSlug = !!derivedSlug;
  const expressUrl = derivedSlug ? getExpressUrl({ ...displayOrg, slug: derivedSlug }) : '';
  const expressQrUrl = expressUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(expressUrl)}` : '';

  const publicPathDisplay = derivedSlug ? `/org/${derivedSlug}` : 'Defina uma URL publica';
  const expressDisplay = expressUrl ? expressUrl.replace(/^https?:\/\//, '') : '';

  const copyOrgPublicUrl = async () => {
    if (!orgUrl) return;
    try {
      setCopyingUrl(true);
      await navigator.clipboard.writeText(orgUrl);
      toast({ title: 'Copiado', description: 'URL da pagina do organizador copiada.' });
    } catch {
      toast({ variant: 'destructive', title: 'Nao foi possivel copiar', description: orgUrl });
    } finally {
      setCopyingUrl(false);
    }
  };

  // Banking
  const [bankOpen, setBankOpen] = React.useState(false);
  const [bankPhase, setBankPhase] = React.useState<'form' | 'verify'>('form');
  const [pixType, setPixType] = React.useState<'email' | 'phone' | 'cpfcnpj'>('email');
  const [pixKey, setPixKey] = React.useState('');
  const [confirmOwner, setConfirmOwner] = React.useState(false);
  const [pin, setPin] = React.useState(['', '', '', '']);
  const [pinConfirm, setPinConfirm] = React.useState(['', '', '', '']);
  const [pinPhase, setPinPhase] = React.useState<'set' | 'confirm' | 'done'>('set');
  const bankingSavedRef = React.useRef(false);
  const [savedPixKey, setSavedPixKey] = React.useState('');
  const [bankingConfirmed, setBankingConfirmed] = React.useState(false);
  const [pinAuth, setPinAuth] = React.useState(['', '', '', '']);
  const [pinAuthError, setPinAuthError] = React.useState('');

  // Efí Onboarding States
  const [efiAccountStatus, setEfiAccountStatus] = React.useState<string>('NONE');
  const [efiOnboardingStep, setEfiOnboardingStep] = React.useState<string>('START');
  const [efiOnboardingData, setEfiOnboardingData] = React.useState<any>(null);
  
  const [onboardingType, setOnboardingType] = React.useState<'individual' | 'legal'>('individual');
  const [onboardingTaxId, setOnboardingTaxId] = React.useState('');
  const [onboardingPhone, setOnboardingPhone] = React.useState('');
  const [submittingOnboarding, setSubmittingOnboarding] = React.useState(false);

  const firstName = React.useMemo(() => (user?.name || '').split(' ')[0] || '', [user?.name]);
  const lastName = React.useMemo(() => {
    const parts = (user?.name || '').split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }, [user?.name]);

  const getStoredPin = () => {
    try {
      const saved = localStorage.getItem('BANKING_PIN');
      return saved && saved.length === 4 ? saved : '';
    } catch {
      return '';
    }
  };

  const saveBanking = async () => {
    if (!selectedOrg?.id) return;
    if (pinPhase !== 'done') {
      toast({ variant: 'destructive', title: 'Defina seu PIN primeiro', description: 'Crie e confirme um PIN em Seguranca para habilitar o Banking.' });
      return;
    }
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
      toast({ title: 'Salvo', description: 'Informacoes bancarias atualizadas. Confirme com seu PIN.' });
      bankingSavedRef.current = true;
      setSavedPixKey(pixKey.trim());
      setBankPhase('verify');
      setPinAuth(['', '', '', '']);
      setPinAuthError('');
    } catch (e) {
      try { localStorage.setItem(`ORG_BANKING_${selectedOrg.id}`, JSON.stringify(body)); } catch { }
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponivel. Confirme com seu PIN.' });
      bankingSavedRef.current = true;
      setSavedPixKey(pixKey.trim());
      setBankPhase('verify');
      setPinAuth(['', '', '', '']);
      setPinAuthError('');
    }
  };

  const handlePinVerification = (next: string[]) => {
    const code = next.join('');
    if (code.length < 4) return;
    const savedPin = getStoredPin();
    if (!savedPin) {
      toast({ variant: 'destructive', title: 'Defina seu PIN primeiro', description: 'Crie e confirme um PIN em Seguranca para habilitar o Banking.' });
      setBankPhase('form');
      setBankOpen(false);
      return;
    }
    if (code === savedPin) {
      setBankingConfirmed(true);
      setBankOpen(false);
      setBankPhase('form');
      setPinAuth(['', '', '', '']);
      setPinAuthError('');
      toast({ title: 'Verificado', description: 'Conta bancaria confirmada via PIN.' });
    } else {
      setPinAuthError('PIN incorreto. Tente novamente.');
      setTimeout(() => {
        setPinAuth(['', '', '', '']);
        const el = document.getElementById('pin-auth-0') as HTMLInputElement | null;
        el?.focus();
      }, 150);
    }
  };

  React.useEffect(() => {
    if (bankPhase === 'verify') {
      setTimeout(() => {
        const el = document.getElementById('pin-auth-0') as HTMLInputElement | null;
        el?.focus();
      }, 120);
    }
  }, [bankPhase]);

  // Initialize PIN phase from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('BANKING_PIN');
      if (saved && saved.length === 4) {
        setPinPhase('done');
      } else {
        setPinPhase('set');
      }
    } catch { }
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
        } catch { }
      }, 100);
    } catch { }
  };

  const featuredRef = React.useRef<HTMLDivElement | null>(null);
  const aboutRef = React.useRef<HTMLDivElement | null>(null);

  const handleShare = async () => {
    const url = orgUrl;
    if (!url) return;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: (selectedOrg as any)?.name || 'Minha pagina', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copiado', description: 'URL do organizador copiada.' });
      }
    } catch { }
  };

  // Editar nome/slug (modal)
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editSlug, setEditSlug] = React.useState('');
  const [slugStatus, setSlugStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
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
      await ensureApiBase().catch(() => { });
      const path = `/api/organization/${selectedOrg.id}/events`;
      const res = await fetchApi(path, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const j = await res.json();
        if (Array.isArray(j)) {
          setEvents(j.map((e: any) => ({ id: e.id, name: e.name || e.title || 'Evento', startDate: e.startDate || e.startDateUtc || e.startsAt })));
          return;
        }
      }
      toast({ variant: 'destructive', title: 'Erro', description: 'Nao foi possivel carregar seus eventos.' });
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
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredEventId: selectedEventId }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Sucesso', description: 'Evento destacado na sua pagina.' });
      setOpenFeatured(false);
      // Refresh local state
      setTimeout(() => window.location.reload(), 500);
    } catch {
      try { localStorage.setItem(`ORG_FEATURED_EVENT_${selectedOrg.id}`, selectedEventId); } catch { }
      toast({ title: 'Evento destacado', description: 'Salvo localmente. Quando a API estiver disponivel, sincronizaremos.' });
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
    const payload = { 
      bio: miniBio.slice(0, 140), 
      description: aboutDesc, 
      tags: JSON.stringify(aboutTags) 
    } as any;
    try {
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Informacoes atualizadas.' });
      setAboutOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch {
      try { localStorage.setItem(`ORG_ABOUT_${selectedOrg.id}`, JSON.stringify(payload)); } catch { }
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponivel.' });
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
  const onPickLogo = (file?: File | null) => { if (!file) return; setLogoFile(file); try { setLogoPreview(URL.createObjectURL(file)); } catch { } };
  const onPickCover = (file?: File | null) => { if (!file) return; setCoverFile(file); try { setCoverPreview(URL.createObjectURL(file)); } catch { } };
  const uploadOne = async (file: File): Promise<string> => {
    const fd = new FormData(); fd.append('file', file, file.name || 'image.png');
    const r = await fetchApi('/api/upload', { method: 'POST', body: fd });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json(); if (!j?.url) throw new Error('Upload Nao retornou URL');
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
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl: finalLogo || null, coverUrl: finalCover || null }) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Logo e capa atualizados.' });
      setVisualsOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch {
      try { localStorage.setItem(`ORG_VISUALS_${selectedOrg.id}`, JSON.stringify({ logoUrl: logoPreview, coverUrl: coverPreview })); } catch { }
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponivel.' });
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
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Links atualizados.' }); setLinksOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch {
      try { localStorage.setItem(`ORG_LINKS_${selectedOrg.id}`, JSON.stringify({ site, instagram, tiktok, youtube, facebook, x, telegram, whatsapp, messenger, discord, spotify, soundcloud, instagramChannel })); } catch { }
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponivel.' }); setLinksOpen(false);
    } finally { setSavingLinks(false); }
  };

  // Informacoes gerais (contato & localizacao)
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
      const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Salvo', description: 'Informacoes atualizadas.' }); setGeneralOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch {
      try { localStorage.setItem(`ORG_GENERAL_${selectedOrg.id}`, JSON.stringify({ contactEmail, showContactEmail, locationText })); } catch { }
      toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponivel.' }); setGeneralOpen(false);
    } finally { setSavingGeneral(false); }
  };

  // Artistas
  const [artistsOpen, setArtistsOpen] = React.useState(false);
  const [artistsMode, setArtistsMode] = React.useState<'popular' | 'recent' | 'hidden'>('popular');
  const [savingArtists, setSavingArtists] = React.useState(false);
  const openArtists = () => { setArtistsOpen(true); setTimeout(() => smoothScrollTo(featuredRef.current), 50); };
  const saveArtists = async () => {
    if (!selectedOrg) return; setSavingArtists(true);
    try { const r = await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artistsMode }) }); if (!r.ok) throw new Error(await r.text()); toast({ title: 'Salvo', description: 'Preferencia de artistas atualizada.' }); setArtistsOpen(false); }
    catch { try { localStorage.setItem(`ORG_ARTISTS_${selectedOrg.id}`, JSON.stringify({ artistsMode })); } catch { }; toast({ title: 'Salvo localmente', description: 'Sincronizaremos quando a API estiver disponivel.' }); setArtistsOpen(false); }
    finally { setSavingArtists(false); }
  };

  function DangerZone({ onDelete }) {
    return (
      <>
        <div className="mt-10 p-5 rounded-xl border border-red-200 bg-red-50/40 dark:bg-[#2a0909]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col text-left">
            <div className="text-base font-semibold text-red-600 dark:text-red-300 mb-2">Excluir organizacao</div>
            <div className="text-xs text-red-600 dark:text-red-300">Esta acao a permanente e Nao pode ser desfeita.</div>
            {deleteError && <div className="text-xs text-red-500 mt-2">{deleteError}</div>}
          </div>
          <Button onClick={() => setShowDeleteModal(true)} className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md shadow-sm w-full sm:w-auto" style={{ fontSize: 15, minHeight: 40 }} disabled={deleteLoading}>
            {deleteLoading ? 'Excluindo...' : 'Excluir organizacao'}
          </Button>
        </div>
        {/* Modal de confirmacao */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmar exclusao</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">Tem certeza que deseja excluir esta organizacao? Essa acao Nao pode ser desfeita.</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="px-4 py-2">Cancelar</Button>
              <Button onClick={() => { setShowDeleteModal(false); onDelete(); }} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700" disabled={deleteLoading}>
                {deleteLoading ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const [activeTab, setActiveTab] = React.useState<OrganizerTabKey>('pagina');
  const handleTabChange = (value: string) => {
    setActiveTab(value as OrganizerTabKey);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-white dark:from-[#050505] dark:via-[#0b0b0b] dark:to-[#0d0d0d]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 via-fuchsia-500/15 to-orange-400/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-4rem] h-64 w-64 rounded-full bg-gradient-to-tr from-blue-500/12 via-indigo-500/10 to-sky-400/10 blur-3xl" />
      </div>
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

      <SidebarMenu activeKeyOverride="ajustes" />
      <div className="relative w-full lg:pl-24">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-14 lg:px-8">
          <AppHeader />
          <div className="space-y-6 pt-4 mt-10">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-[#0f0f0f]/80 sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-56 bg-gradient-to-l from-indigo-500/10 via-fuchsia-500/10 to-transparent blur-2xl" />
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 text-lg font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-900/30 dark:text-white shrink-0">
                    {(selectedOrg as any)?.logoUrl ? (
                      <img src={(selectedOrg as any).logoUrl} alt={(selectedOrg as any).name} className="h-full w-full object-cover" />
                    ) : (
                      ((selectedOrg as any)?.name || 'O').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-100">Ajustes do organizador</div>
                    <div className="mt-0 sm:mt-2 flex items-center gap-2">
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-3xl truncate">{(selectedOrg as any)?.name || 'Escolha uma organizacao'}</h1>
                      {selectedOrg && (
                        <button onClick={openEditIdentity} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 dark:border-zinc-700 dark:bg-[#1a1a1a] dark:text-slate-200 dark:hover:border-indigo-700 shrink-0" title="Editar nome e URL">
                          <PenLine size={16} />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-snug">Centralize a personalização da página pública, canais e bilheteria.</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-[#1a1a1a] dark:text-slate-200">Atualizado: {lastUpdated}</span>
                      {hasOrgSlug ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"><CheckCircle2 size={14} /> Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"><Info size={14} /> Defina URL</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Button variant="outline" size="sm" onClick={copyOrgPublicUrl} disabled={!orgUrl || copyingUrl} className="bg-white/70 backdrop-blur dark:bg-transparent w-full sm:w-auto">
                    <Copy size={16} className="mr-1" /> {copyingUrl ? 'Copiando...' : 'Copiar'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleShare} disabled={!orgUrl} className="gap-2 w-full sm:w-auto">
                    <Share2 size={16} /> Compartilhar
                  </Button>
                  <Button size="sm" onClick={() => orgUrl && window.open(orgUrl, '_blank')} disabled={!orgUrl} className="gap-2 col-span-2 sm:col-span-1 w-full sm:w-auto">
                    <ExternalLink size={16} /> Ver página
                  </Button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white/90 p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#111]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Página pública</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{publicPathDisplay}</div>
                    {hasOrgSlug && <CheckCircle2 className="text-emerald-500" size={18} />}
                  </div>
                  <div className="mt-1 flex items-center gap-2 break-all text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex-1">{orgUrl ? orgUrl.replace(/^https?:\/\//, '') : 'Defina um endereco para compartilhar.'}</span>
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 dark:border-zinc-700 dark:bg-[#1a1a1a] dark:text-slate-200 dark:hover:border-indigo-700" onClick={copyOrgPublicUrl} disabled={!orgUrl}>
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white/90 p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#111]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bilheteria express</div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{expressDisplay || 'Defina uma URL publica para ativar'}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-900/30" disabled={!expressUrl} onClick={() => expressUrl && window.open(expressUrl, '_blank')}>
                      <ExternalLink size={14} className="mr-1" /> Abrir
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-900/30" disabled={!expressUrl} onClick={async () => {
                      try {
                        if (!expressUrl) return;
                        await navigator.clipboard.writeText(expressUrl);
                        toast({ title: 'Copiado', description: 'Link da Bilheteria Express copiado.' });
                      } catch {
                        toast({ variant: 'destructive', title: 'Falha ao copiar' });
                      }
                    }}>
                      <Copy size={14} className="mr-1" /> Copiar
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white/90 p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-[#111]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Segurança</div>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {bankingConfirmed ? <CheckCircle2 className="text-emerald-500" size={18} /> : <Lock className="text-amber-500" size={18} />}
                    {bankingConfirmed ? 'Banking confirmado' : 'Banking pendente'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Proteja seus dados bancários com PIN antes de salvar.</div>
                  <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300" onClick={() => setActiveTab('banking')}>
                    Ir para Banking
                  </button>
                </div>
              </div>
            </div>
            {!selectedOrg ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-8 text-center text-slate-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-[#0f0f0f] max-sm:p-5 max-sm:text-sm">Selecione uma organizacao no topo para personalizar.</div>
            ) : (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
                <TabsList className="flex w-full flex-wrap gap-2 h-auto rounded-xl bg-white/80 p-1 shadow-sm ring-1 ring-zinc-200 backdrop-blur dark:bg-[#111] dark:ring-zinc-800">
                  <TabsTrigger value="pagina" className="flex-1 min-w-[140px] rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white dark:text-slate-200">
                    Minha página
                  </TabsTrigger>
                  <TabsTrigger value="express" className="flex-1 min-w-[160px] rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white dark:text-slate-200">
                    Bilheteria Express
                  </TabsTrigger>
                  <TabsTrigger value="banking" className="flex-1 min-w-[140px] rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white dark:text-slate-200">
                    Banking
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pagina" className="pt-2">
                  {/* Evento em destaque */}
                  <div ref={featuredRef} className="mt-8 max-sm:mt-6">
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 max-sm:text-xs">Evento em destaque</div>
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-700 dark:text-slate-200"><span className="font-semibold">Evento em destaque</span> / Fixe um dos seus eventos no topo da sua pagina</div>
                        {!openFeatured && <Button variant="secondary" onClick={openFeaturedPanel}>Adicionar</Button>}
                      </div>
                      {openFeatured && (
                        <div className="mt-4 rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Evento em destaque</div>
                          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                            <SelectTrigger className="w-full"><SelectValue placeholder={eventsLoading ? 'Carregando eventos...' : 'Selecionar um evento'} /></SelectTrigger>
                            <SelectContent>
                              {events.map(ev => (
                                <SelectItem key={ev.id} value={ev.id}>{ev.name}{ev.startDate ? ` - ${new Date(ev.startDate).toLocaleDateString('pt-BR')}` : ''}</SelectItem>
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
                            <Textarea value={aboutDesc} onChange={e => setAboutDesc(e.target.value)} placeholder="Escreva uma descricao..." rows={6} />
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
                  <div className="mt-8 max-sm:mt-6">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 max-sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                          <ImagePlus size={18} className="max-sm:w-4 max-sm:h-4" />
                          <div>
                            <div className="font-semibold max-sm:text-sm">Visuais</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 max-sm:text-xs">Logo & Capa</div>
                          </div>
                        </div>
                        {!visualsOpen && <Button variant="secondary" onClick={openVisuals} className="max-sm:text-xs max-sm:h-8">Editar</Button>}
                      </div>
                      {visualsOpen && (
                        <div className="mt-4 space-y-4">
                          {/* Logo e Capa lado a lado em desktop */}
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Logo - Quadrado compacto */}
                            <div className="flex-shrink-0 w-full md:w-auto flex flex-col items-center md:items-start">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 self-start">Logo</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">300x300 • jpg, png, webp</div>
                              <div className="w-[120px] h-[120px] border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 relative overflow-hidden group cursor-pointer hover:border-indigo-400 transition-colors">
                                {logoPreview ? (
                                  <>
                                    <img src={logoPreview} alt="logo" className="object-cover w-full h-full" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-white text-xs font-medium">Alterar</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center text-slate-400">
                                    <ImagePlus className="mx-auto w-6 h-6 mb-1" />
                                    <div className="text-[10px]">Logo</div>
                                  </div>
                                )}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onPickLogo(e.target.files?.[0] || null)} />
                              </div>
                            </div>

                            {/* Capa - Proporção 3:1 compacta */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Capa</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Proporção 3:1 • jpg, png, webp</div>
                              <div className="w-full max-w-[360px] md:max-w-full h-[100px] border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 relative overflow-hidden group cursor-pointer hover:border-indigo-400 transition-colors">
                                {coverPreview ? (
                                  <>
                                    <img src={coverPreview} alt="capa" className="object-cover w-full h-full" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-white text-xs font-medium">Alterar</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center text-slate-400">
                                    <ImagePlus className="mx-auto w-6 h-6 mb-1" />
                                    <div className="text-[10px]">Banner 3:1</div>
                                  </div>
                                )}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onPickCover(e.target.files?.[0] || null)} />
                              </div>
                            </div>
                          </div>

                          {/* Botões */}
                          <div className="flex items-center gap-2 pt-1">
                            <Button size="sm" onClick={saveVisuals} disabled={savingVisuals}>
                              {savingVisuals ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setVisualsOpen(false)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="mt-8 max-sm:mt-6">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 max-sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                          <LinkIcon size={18} className="max-sm:w-4 max-sm:h-4" />
                          <div>
                            <div className="font-semibold max-sm:text-sm">Links</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 max-sm:text-xs">Website & mídias sociais</div>
                          </div>
                        </div>
                        {!linksOpen && <Button variant="secondary" onClick={openLinks} className="max-sm:text-xs max-sm:h-8">Editar</Button>}
                      </div>
                      {linksOpen && (
                        <div className="mt-4 space-y-5 max-sm:space-y-4">
                          <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4 max-sm:p-3">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 max-sm:text-xs">Website</div>
                            <div className="flex items-center gap-2"><Globe size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={site} onChange={e => setSite(e.target.value)} placeholder="https://seudominio.com" className="max-sm:text-sm" /></div>
                          </div>
                          <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4 max-sm:p-3">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 max-sm:text-xs">mídias sociais</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-sm:gap-2">
                              <div className="flex items-center gap-2"><Instagram size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="instagram.com/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="t.me/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><Disc size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={soundcloud} onChange={e => setSoundcloud(e.target.value)} placeholder="soundcloud.com/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><Music size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="tiktok.com/@" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><Music size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={spotify} onChange={e => setSpotify(e.target.value)} placeholder="open.spotify.com/user/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><Youtube size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="youtube.com/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={messenger} onChange={e => setMessenger(e.target.value)} placeholder="m.me/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><Instagram size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={instagramChannel} onChange={e => setInstagramChannel(e.target.value)} placeholder="instagram.com/channel/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><Facebook size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="facebook.com/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><MessageCircle size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={discord} onChange={e => setDiscord(e.target.value)} placeholder="discord.gg/" className="max-sm:text-sm" /></div>
                              <div className="flex items-center gap-2"><PenLine size={16} className="text-slate-500 max-sm:w-4 max-sm:h-4" /><Input value={x} onChange={e => setX(e.target.value)} placeholder="x.com/" className="max-sm:text-sm" /></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 max-sm:flex-col"><Button onClick={saveLinks} disabled={savingLinks} className="max-sm:w-full max-sm:text-xs">{savingLinks ? 'Salvando...' : 'Salvar'}</Button><Button variant="secondary" onClick={() => setLinksOpen(false)} className="max-sm:w-full max-sm:text-xs">Cancelar</Button></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informacoes gerais */}
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
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Dê a seus clientes Informações para contatarem você</div>
                              <div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-slate-600 dark:text-slate-300">Email de contato</div><a href="/account-settings" className="text-indigo-600 text-sm hover:underline">Atualizar este email</a></div>
                              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@exemplo.com" />
                              <AnimatedCheckbox
                                checked={showContactEmail}
                                onCheckedChange={setShowContactEmail}
                                label="Exibir meu email de contato na minha pagina"
                                className="mt-3"
                              />
                            </div>
                            <div className="rounded-lg bg-zinc-50 dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-700 p-4">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">localização</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Ajude seus clientes a encontrarem você</div>
                              <Input value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="Busca por endereco" />
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
                              <label className="flex items-center gap-3 text-slate-800 dark:text-slate-200"><input type="radio" name="artistsMode" value="popular" checked={artistsMode === 'popular'} onChange={() => setArtistsMode('popular')} /> <span>Mais popular</span></label>
                              <label className="flex items-center gap-3 text-slate-800 dark:text-slate-200"><input type="radio" name="artistsMode" value="recent" checked={artistsMode === 'recent'} onChange={() => setArtistsMode('recent')} /> <span>Mais recente</span></label>
                              <label className="flex items-center gap-3 text-slate-800 dark:text-slate-200"><input type="radio" name="artistsMode" value="hidden" checked={artistsMode === 'hidden'} onChange={() => setArtistsMode('hidden')} /> <span>Nao mostrar artistas em minha pagina</span></label>
                            </div>
                          </div>
                          <div className="flex items-center gap-3"><Button onClick={saveArtists} disabled={savingArtists}>{savingArtists ? 'Salvando...' : 'Salvar'}</Button><Button variant="secondary" onClick={() => setArtistsOpen(false)}>Cancelar</Button></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <DangerZone onDelete={handleDeleteOrg} />

                </TabsContent>
                <TabsContent value="express" className="pt-2">
                  <div className="space-y-6">
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      <div className="bg-gradient-to-r from-indigo-600/15 to-fuchsia-600/15 dark:from-indigo-500/20 dark:to-fuchsia-500/20 p-6 flex items-center justify-between">
                        <div>
                          <div className="text-xl font-semibold text-slate-900 dark:text-white">Bilheteria Expressa</div>
                          <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">A Bilheteria Express facilita a venda de ingressos na porta do evento.</div>
                          <TextLink
                            href="https://fauves.com.br/ajuda"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1"
                          >
                            Saiba mais <ExternalLink size={14} />
                          </TextLink>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <QrCode size={56} />
                        </div>
                      </div>
                      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium">URL Bilheteria Express:</span> {expressUrl ? (
                          <TextLink
                            href={expressUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1"
                          >
                            {expressUrl.replace(/^https?:\/\//, '')}
                          </TextLink>
                        ) : (
                          <span className="ml-1 text-slate-500">-</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">Seu QR Code da Bilheteria Expressa</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Imprima e apresente este QR code para uma experiência fácil de compra de ingressos a seus clientes.</div>
                      <div className="mt-5 flex flex-col sm:flex-row items-center sm:items-center gap-6">
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0f0f0f] p-3 mx-auto sm:mx-0">
                          {expressQrUrl ? (
                            <img src={expressQrUrl} alt="QR Bilheteria Express" className="w-[220px] h-[220px] object-contain" />
                          ) : (
                            <div className="w-[220px] h-[220px] grid place-items-center text-slate-500">QR indisponivel</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-600 dark:text-slate-300">Ao escanear, os clientes sao levados diretamente a compra rápida (Apple Pay, Google Pay e cartoes).</div>
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
                                toast({ variant: 'destructive', title: 'Falha no download', description: 'Nao foi possivel baixar o QR Code.' });
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
                          <div className="font-medium">O que ocorrera se um comprador fechar a página após o checkout?</div>
                          <div>Após a compra, os compradores recebem um e-mail com seus ingressos.</div>
                        </div>
                        <div>
                          <div className="font-medium">Quais eventos são listados?</div>
                          <div>Exibimos automaticamente o evento em andamento ou o próximo (nas próximas 6 horas). Se houver varios, mostramos todos e o cliente escolhe.</div>
                        </div>
                        <div>
                          <div className="font-medium">As Informações de contato dos compradores são coletadas?</div>
                          <div>Sim. Coletamos e-mail e telefone e adicionamos aos seus contatos no Smartboard.</div>
                        </div>
                        <div>
                          <div className="font-medium">Como obter um relatório de vendas?</div>
                          <div>As vendas são marcadas com a etiqueta Door. Filtre por Door na lista de pedidos do evento.</div>
                        </div>
                        <div>
                          <div className="font-medium">E se o comprador já tiver uma conta?</div>
                          <div>Se o usuário estiver logado no app, podera ser redirecionado a página do evento no aplicativo e concluir a compra.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="banking" className="pt-2">
                  <div className="space-y-6">
                    {efiAccountStatus === 'NONE' || efiAccountStatus === 'REJECTED' ? (
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-8 text-white">
                          <h2 className="text-2xl font-bold">Ative sua Conta Digital Efí</h2>
                          <p className="mt-2 text-indigo-100 max-w-lg">
                            Transforme sua organização em um negócio profissional. Receba pagamentos via Pix e Cartão com split automático e gerencie seu saldo sem sair da Fauves.
                          </p>
                          <div className="mt-6 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium">
                              <CheckCircle2 size={16} /> Split Automático
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium">
                              <CheckCircle2 size={16} /> Saques Instantâneos
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium">
                              <CheckCircle2 size={16} /> White Label
                            </div>
                          </div>
                        </div>

                        <div className="p-8">
                          <div className="max-w-2xl mx-auto space-y-6">
                            <div className="flex items-center gap-4 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 w-fit">
                              <button 
                                onClick={() => setOnboardingType('individual')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${onboardingType === 'individual' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500'}`}
                              >
                                Pessoa Física
                              </button>
                              <button 
                                onClick={() => setOnboardingType('legal')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${onboardingType === 'legal' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500'}`}
                              >
                                Empresa (CNPJ)
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold">{onboardingType === 'individual' ? 'CPF' : 'CNPJ'}</Label>
                                <Input 
                                  value={onboardingTaxId} 
                                  onChange={e => setOnboardingTaxId(e.target.value)}
                                  placeholder={onboardingType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold">Telefone de Contato</Label>
                                <Input 
                                  value={onboardingPhone} 
                                  onChange={e => setOnboardingPhone(e.target.value)}
                                  placeholder="(00) 00000-0000"
                                />
                              </div>
                            </div>

                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 bg-zinc-50 dark:bg-[#1a1a1a]">
                              <h3 className="font-semibold mb-4">Dados da Organização</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                                <div>
                                  <div className="font-medium text-zinc-900 dark:text-white">Razão Social / Nome</div>
                                  <div>{selectedOrg?.name}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-zinc-900 dark:text-white">Email Vinculado</div>
                                  <div>{user?.email}</div>
                                </div>
                              </div>
                            </div>

                            <Button 
                              size="lg" 
                              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:scale-[1.02] transition-transform shadow-lg"
                              disabled={submittingOnboarding || !onboardingTaxId || !onboardingPhone}
                              onClick={async () => {
                                setSubmittingOnboarding(true);
                                try {
                                  const res = await fetchApi(`/api/organization/${selectedOrg.id}/onboarding`, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                      type: onboardingType,
                                      taxId: onboardingTaxId,
                                      phone: onboardingPhone,
                                      name: selectedOrg.name,
                                      email: user?.email
                                    })
                                  });
                                  if (res.ok) {
                                    setEfiAccountStatus('PENDING');
                                    toast({ title: 'Solicitação Enviada!', description: 'Seus dados estão sendo processados pela Efí Bank.' });
                                  } else {
                                    throw new Error('Falha ao enviar onboarding');
                                  }
                                } catch (e) {
                                  toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível iniciar o onboarding.' });
                                } finally {
                                  setSubmittingOnboarding(false);
                                }
                              }}
                            >
                              {submittingOnboarding ? 'Processando...' : 'Criar minha Conta Digital'}
                            </Button>
                            
                            <p className="text-center text-xs text-zinc-500 max-w-md mx-auto">
                              Ao clicar em "Criar minha Conta Digital", você declara estar de acordo com os termos de uso e política de privacidade da Efí Bank.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : efiAccountStatus === 'PENDING' ? (
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-12 text-center">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                          <Info size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sua conta está em análise</h2>
                        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                          A Efí Bank está verificando seus dados. Esse processo costuma levar de 1 a 3 dias úteis. Você receberá uma notificação assim que for aprovado.
                        </p>
                        <Button variant="outline" className="mt-8" onClick={() => window.location.reload()}>
                          Atualizar Status
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status da Conta Digital */}
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6 shadow-sm overflow-hidden relative group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 size={80} />
                          </div>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                              <CheckCircle2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold">Conta Digital Ativa</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-100 dark:border-zinc-800">
                              <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">ID da Conta</div>
                              <div className="font-mono text-sm break-all">{displayOrg?.efiAccountId || '---'}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-100 dark:border-zinc-800">
                                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Status</div>
                                <div className="text-emerald-600 font-bold">Aprovada</div>
                              </div>
                              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-100 dark:border-zinc-800">
                                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Taxa Fauves</div>
                                <div className="font-bold">{displayOrg?.platformFeePercent || 15}%</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-8">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/dashboard/financas')}>
                              Ir para meu Financeiro
                            </Button>
                          </div>
                        </div>

                        {/* Card: Segurança */}
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                              <Lock size={24} />
                            </div>
                            <h3 className="text-lg font-bold">Segurança (PIN)</h3>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">O código PIN protege suas operações de saque e transferência.</p>
                          
                          {pinPhase === 'done' ? (
                            <div className="p-8 text-center bg-zinc-50 dark:bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                              <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500" />
                              <div className="text-sm font-semibold">PIN Configurado</div>
                              <p className="text-xs text-zinc-500 mt-1">Para sua segurança, PINs só podem ser alterados via suporte.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {pinPhase === 'set' ? 'Defina seu código de 4 dígitos:' : 'Confirme seu código:'}
                              </div>
                              <div className="flex items-center gap-3 justify-center py-4">
                                {(pinPhase === 'set' ? pin : pinConfirm).map((d, idx) => (
                                  <input 
                                    key={idx} 
                                    id={`${pinPhase === 'set' ? 'pin-set' : 'pin-confirm'}-${idx}`}
                                    value={d} 
                                    onChange={(e) => { 
                                      const v = e.target.value.replace(/\D/g, '').slice(0, 1); 
                                      const next = pinPhase === 'set' ? [...pin] : [...pinConfirm]; 
                                      next[idx] = v; 
                                      if (pinPhase === 'set') setPin(next); else setPinConfirm(next);
                                      if (v && idx < 3) document.getElementById(`${pinPhase === 'set' ? 'pin-set' : 'pin-confirm'}-${idx + 1}`)?.focus(); 
                                      if (next.every(x => x)) {
                                        if (pinPhase === 'set') {
                                          setTimeout(() => { setPinPhase('confirm'); }, 200);
                                        } else {
                                          if (pin.join('') === next.join('')) {
                                            localStorage.setItem('BANKING_PIN', pin.join(''));
                                            setPinPhase('done');
                                            toast({ title: 'PIN Configurado!', description: 'Sua conta está agora mais segura.' });
                                          } else {
                                            setPinConfirm(['', '', '', '']);
                                            toast({ variant: 'destructive', title: 'PIN não confere', description: 'Tente novamente.' });
                                          }
                                        }
                                      }
                                    }} 
                                    inputMode="numeric" 
                                    maxLength={1} 
                                    className="w-12 h-14 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-transparent text-center text-xl font-bold focus:border-indigo-500 focus:outline-none transition-colors" 
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                      <div className="text-sm text-slate-500 dark:text-slate-400 select-none">{(typeof window !== 'undefined' ? window.location.origin.replace(/^https?:\/\//, '') : '')}/org/</div>
                      <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="meu-slug" className="flex-1" />
                    </div>
                    <div>
                      {slugStatus === 'checking' && <div className="text-xs text-slate-500 mt-1">Verificando disponibilidade</div>}
                      {slugStatus === 'available' && <div className="text-xs text-green-600 mt-1">Disponível</div>}
                      {slugStatus === 'taken' && <div className="text-xs text-red-600 mt-1">Indisponível</div>}
                      {slugStatus === 'invalid' && <div className="text-xs text-red-600 mt-1">Informe um slug válido</div>}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
                  <Button onClick={saveIdentity} disabled={!editName.trim() || !editSlug.trim() || slugStatus === 'taken' || slugStatus === 'invalid' || savingIdentity}>{savingIdentity ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
// ---------------- Widget Builder ----------------
const WidgetBuilder: React.FC<{ org: any; events: Array<{ id: string; name: string; startDate?: string }>; eventsLoading: boolean; onEnsureEvents: () => void }>
  = ({ org, events, eventsLoading, onEnsureEvents }) => {
    const [view, setView] = React.useState<'page' | 'event' | 'list'>('page');
    const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
    const [transparent, setTransparent] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);
    const [selectedEventId, setSelectedEventId] = React.useState('');
    const [copyMsg, setCopyMsg] = React.useState<string>('');

    React.useEffect(() => { if (view === 'event' && events.length === 0 && !eventsLoading) onEnsureEvents(); }, [view, events.length, eventsLoading, onEnsureEvents]);

    const origin = (typeof window !== 'undefined' ? window.location.origin : '');
    const orgPath = org?.slug || org?.id || '';

    const codePage = `\n<iframe src="${origin}/org/${orgPath}?embedded=1&ui=${theme}${transparent ? '&transparent=1' : ''}${showDetails ? '&details=1' : ''}" allow="payment" style="width:100%; height:800px; max-height:calc(100vh - 200px); border:0;"></iframe>\n<script src="${origin}/widget.js"></script>`;

    const codeEvent = `\n<iframe src="${origin}/event/${selectedEventId || 'EVENT_ID'}?embedded=1&ui=${theme}${transparent ? '&transparent=1' : ''}" allow="payment" style="width:100%; height:800px; max-height:calc(100vh - 200px); border:0;"></iframe>\n<script src="${origin}/widget.js"></script>`;

    const codeList = `\n<script>window.__fauves={"events-listing":{"organizerId":"${org?.id || ''}", "layout":"shotgun", "showEventTags":true}};</script>\n<style> body #fauves-events-listing {--shotgun - muted:#f4f4f5; --shotgun-accent:#f4f4f5; --shotgun-accent-foreground:#ff765f; --shotgun-border:#e4e4e7; --shotgun-foreground:#09090b; } </style>\n<section id="fauves-events-listing" />\n<script src="${origin}/events-listing.js"></script>`;

    const code = view === 'page' ? codePage : view === 'event' ? codeEvent : codeList;

    const copy = async () => {
      try { await navigator.clipboard.writeText(code); setCopyMsg('Copiado!'); setTimeout(() => setCopyMsg(''), 1500); } catch { setCopyMsg('Falhou'); setTimeout(() => setCopyMsg(''), 1500); }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {/* inner tabs */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-1 mb-4">
            <button className={`px-3 py-1.5 rounded-md text-sm ${view === 'page' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => setView('page')}>Minha pagina</button>
            <button className={`px-3 py-1.5 rounded-md text-sm ${view === 'event' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => setView('event')}>Evento</button>
            <button className={`px-3 py-1.5 rounded-md text-sm ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => setView('list')}>Lista de Eventos</button>
          </div>

          {/* controls */}
          {view !== 'event' ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Escuro</label>
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme" checked={theme === 'light'} onChange={() => setTheme('light')} /> Claro</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Fundo transparente</div>
                </div>
                <AnimatedCheckbox
                  checked={transparent}
                  onCheckedChange={setTransparent}
                  label=""
                />
              </div>
              {view === 'page' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Mostrar detalhes da pagina</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Botao de seguir, capa, logo, descricoes, redes sociais, etc.</div>
                  </div>
                  <input type="checkbox" checked={showDetails} onChange={e => setShowDetails(e.target.checked)} />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5 space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Selecionar evento</div>
                <div className="flex items-center gap-3">
                  <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] px-3 text-sm">
                    <option value="" disabled>{eventsLoading ? 'Carregando...' : 'Selecione'}</option>
                    {events.map(ev => (<option value={ev.id} key={ev.id}>{ev.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme2" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Escuro</label>
                  <label className="flex items-center gap-1"><input type="radio" name="wtheme2" checked={theme === 'light'} onChange={() => setTheme('light')} /> Claro</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Fundo transparente</div>
                <AnimatedCheckbox
                  checked={transparent}
                  onCheckedChange={setTransparent}
                  label=""
                />
              </div>
            </div>
          )}

          {/* Codigo do widget */}
          <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] p-5">
            <div className="flex items-center justify-between mb-2"><div className="font-semibold text-slate-700 dark:text-slate-200">Codigo do Widget</div><button className="text-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700" onClick={copy}>{copyMsg || 'Copiar Codigo'}</button></div>
            <textarea readOnly value={code} className="w-full h-40 bg-zinc-900/10 dark:bg-[#0f0f0f] text-xs p-3 rounded-md border border-zinc-300 dark:border-zinc-700 text-slate-800 dark:text-slate-200" />
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Copie e cole esse Codigo onde voce quer que o widget apareca no seu website</div>
          </div>
        </div>
        {/* Preview placeholder */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-[#0f0f0f] min-h-[380px] p-6 text-white">
          <div className="text-xl font-extrabold tracking-wide mb-4">PROXIMOS EVENTOS</div>
          <div className="rounded-lg border border-white/10 p-6 text-sm text-white/70">Nao ha eventos futuros.<br />Siga este produtor para receber atualizacoes.</div>
          <div className="mt-8 text-xl font-extrabold tracking-wide">SOBRE</div>
          <div className="text-sm text-white/70 mt-2">Entrou na Fauves em {(new Date()).getFullYear()}</div>
        </div>
      </div>
    );
  };













