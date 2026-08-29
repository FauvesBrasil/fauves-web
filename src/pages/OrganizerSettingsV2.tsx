import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TextLink from '@/components/TextLink';
import HeaderV2 from '@/components/v2/HeaderV2';
import SidebarMenu from '@/components/SidebarMenu';
import { useOrganization } from '@/context/OrganizationContext';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Share2, ExternalLink, PenLine, ImagePlus, Instagram, Youtube, MessageCircle, Info, QrCode, Lock, CheckCircle2, 
  Copy, Globe, Phone, Mail, MapPin, Star, UserCircle2, Calendar, Users, Newspaper, Wallet, BarChart3, Settings, 
  Plus, Check, Sparkles, TrendingUp, AlertTriangle, ArrowUpRight, Compass, ChevronRight, ArrowRight, X,
  Award, Download, MoreHorizontal, Search, SlidersHorizontal, Trash2, UserPlus,
  Gem, ChevronLeft, Gift, DollarSign, Clock, Ticket, FileText, Building2,
  Paintbrush, Tag, Code, Heart, Loader2, UserRoundMinus, UserRound,
  Sun, Moon, LayoutPanelTop, List, ChevronDown, KeyRound, Webhook, BadgeCheck
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import { useTheme } from '@/context/ThemeContext';
import { fetchApi, apiUrl, resolveImageUrl } from '@/lib/apiBase';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import { getOrganizationPath } from '@/lib/eventUrl';
import { EventSidePanel } from '@/components/v2/EventSidePanel';
import { CalendarPeoplePanel } from '@/components/v2/CalendarPeoplePanel';
import { CalendarNewslettersPanel } from '@/components/v2/CalendarNewslettersPanel';
import { CalendarPaymentsPanel } from '@/components/v2/CalendarPaymentsPanel';
import { CalendarInsightsPanel } from '@/components/v2/CalendarInsightsPanel';
import { CalendarDisplaySettingsPanel } from '@/components/v2/CalendarDisplaySettingsPanel';
import { CalendarOptionsSettingsPanel } from '@/components/v2/CalendarOptionsSettingsPanel';
import { FauvesSwitch } from '@/components/v2/FauvesSwitch';
import {
  CalendarEmbedLayout,
  CalendarEmbedPreview,
  CalendarEmbedTheme,
} from '@/components/v2/CalendarEmbedPreview';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import plusZeroFeeIllustration from '@/assets/plus-zero-fee.svg';
import plusWeeklyInvitesIllustration from '@/assets/plus-weekly-invites.svg';
import plusPrioritySupportIllustration from '@/assets/plus-priority-support.svg';
import plusApiAccessIllustration from '@/assets/plus-api-access.svg';
import plusSubscribeIllustration from '@/assets/plus-subscribe.svg';

const TAG_COLORS = [
  { name: 'Rosa', color: '#f23f92' },
  { name: 'Barney', color: '#bd40ef' },
  { name: 'Roxo', color: '#7040f4' },
  { name: 'Azul', color: '#2f80ed' },
  { name: 'Verde', color: '#4cc744' },
  { name: 'Amarelo', color: '#f4b83e' },
  { name: 'Laranja', color: '#ff7c43' },
  { name: 'Vermelho', color: '#ff4b4b' }
];

const DEFAULT_TIERS = [
  { name: 'Círculo Fundador', color: '#a855f7', priceType: 'Subscription', price: 'R$ 49/mês' },
  { name: 'Apoiador', color: '#9ca3af', priceType: 'Free', price: 'Grátis' },
  { name: 'VIP', color: '#f97316', priceType: 'OneTime', price: 'R$ 150' },
  { name: 'Premium', color: '#3b82f6', priceType: 'Subscription', price: 'R$ 29/mês' },
  { name: 'Acesso Total', color: '#22c55e', priceType: 'Free', price: 'Grátis' }
];

const sortOptionLabel: any = {
  nome: 'Nome',
  recent: 'Entrou recentemente',
  revenue: 'Receita',
  events: 'Eventos Cadastrados',
  checkin: 'Eventos com Check-in'
};

type CalendarAdmin = {
  userId: string;
  email: string;
  name: string;
  photoUrl?: string | null;
  role: string;
  isOwner: boolean;
  isCurrentUser: boolean;
  isPending: boolean;
};

type CalendarManagedTag = {
  id: string;
  type: 'event' | 'member';
  name: string;
  color: string;
  assignments: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

const splitAdminEmails = (value: string) => [
  ...new Set(
    value
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ),
];

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const readApiError = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => null);
  const message = data?.message || data?.error;
  return Array.isArray(message) ? message[0] || fallback : message || fallback;
};

// --- Subcomponente: Modal de Identidade ---
const EditIdentityModal = ({ open, onOpenChange, initialName, initialSlug, onSave, loading }) => {
  const [name, setName] = React.useState(initialName);
  const [slug, setSlug] = React.useState(initialSlug);
  
  React.useEffect(() => {
    setName(initialName);
    setSlug(initialSlug);
  }, [initialName, initialSlug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181a1f] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Editar Nome & Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Nome do Calendário</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-[#121316] border-zinc-800 text-white" placeholder="Ex: Fauves Brasil" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">URL Personalizada (Slug)</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="bg-[#121316] border-zinc-800 text-white" placeholder="fauves-brasil" />
            <div className="text-[10px] text-zinc-500">Apenas letras, números e hífens.</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-[#252830]" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#2A2AD7] hover:bg-[#1e1eb8] text-white" onClick={() => onSave({ name, slug })} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function OrganizerSettingsV2() {
  const { selectedOrg, orgs, setSelectedOrgById, refresh: refreshOrganizations } = useOrganization();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { calendarId } = useParams<{ calendarId?: string }>();

  const [activeTab, setActiveTab] = React.useState('eventos');
  const primaryTabsRef = React.useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [extendedOrg, setExtendedOrg] = React.useState<any>(null);
  const [loadingFresh, setLoadingFresh] = React.useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 48);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const container = primaryTabsRef.current;
    if (!container || window.innerWidth > 767) return;
    const activeButton = container.querySelector<HTMLElement>(`[data-calendar-tab="${activeTab}"]`);
    if (!activeButton) return;
    const targetLeft = activeButton.offsetLeft - (container.clientWidth - activeButton.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [activeTab]);

  // Sync route calendarId param with OrganizationContext selectedOrg ID
  React.useEffect(() => {
    if (calendarId && orgs.length > 0) {
      const cleanId = calendarId.replace(/^cal-/, '');
      const matched = orgs.find(o => o.id === cleanId);
      if (matched && selectedOrg?.id !== cleanId) {
        setSelectedOrgById(cleanId);
      }
    }
  }, [calendarId, orgs, selectedOrg, setSelectedOrgById]);

  // Estados de Modais
  const [editModal, setEditModal] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [tempData, setTempData] = React.useState<any>({});
  const [events, setEvents] = React.useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [eventsTab, setEventsTab] = React.useState<'upcoming' | 'past'>('upcoming');
  const [eventTags, setEventTags] = React.useState<{ [key: string]: { id: string, name: string, color: string }[] }>({});
  const [activeTaggingEventId, setActiveTaggingEventId] = React.useState<string | null>(null);
  const [newTagName, setNewTagName] = React.useState('');
  const [tagCreationStep, setTagCreationStep] = React.useState<'input' | 'color'>('input');

  // Side Panel details state
  const [selectedPanelEvent, setSelectedPanelEvent] = React.useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);

  // Fetch full event details when an event is selected
  React.useEffect(() => {
    if (!selectedPanelEvent?.id) return;

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const r = await fetch(apiUrl(`/api/event/${selectedPanelEvent.id}`));
        if (r.ok) {
          const fullData = await r.json();
          if (isMounted) {
            setSelectedPanelEvent((prev: any) => {
              if (!prev) return prev;
              const fullId = fullData.id || fullData._id;
              if (prev.id !== fullId) return prev;

              const place = fullData.locationName || fullData.venue || (fullData.location && fullData.location.split(',')[0]) || '';
              const city = fullData.locationCity || fullData.locationDetails?.city || fullData.city || '';
              const uf = fullData.locationUf || fullData.locationDetails?.uf || fullData.uf || '';

              let displayLocation = prev.location;
              if (place && city && uf) displayLocation = `${place}, ${city} - ${uf}`;
              else if (place && city) displayLocation = `${place}, ${city}`;
              else if (city && uf) displayLocation = `${city} - ${uf}`;
              else if (place) displayLocation = place;

              const bestDescription = fullData.descriptionHtml || fullData.description || fullData.content || fullData.about || fullData.info || fullData.details || prev.description;

              return {
                ...prev,
                ...fullData,
                location: displayLocation,
                fullLocation: fullData.location || displayLocation,
                description: bestDescription,
                category: fullData.category || fullData.type || fullData.categoryName || prev.category,
                isExternal: !!(fullData.isExternal || fullData.externalUrl || fullData.external_url || fullData.registrationUrl || fullData.registration_url || fullData.ticketUrl || fullData.ticket_url || fullData.link || fullData.officialLink || fullData.registrationType === 'external'),
                externalUrl: fullData.externalUrl || fullData.external_url || fullData.registrationUrl || fullData.registration_url || fullData.ticketUrl || fullData.ticket_url || fullData.link || fullData.officialLink || ''
              };
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch event details", e);
      }
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [selectedPanelEvent?.id]);

  React.useEffect(() => {
    if (!activeTaggingEventId) return;
    const handleOutsideClick = () => {
      setActiveTaggingEventId(null);
      setNewTagName('');
      setTagCreationStep('input');
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeTaggingEventId]);

  // States for Members and Memberships
  const [membershipTiers, setMembershipTiers] = React.useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('fauves-membership-tiers');
      return saved ? JSON.parse(saved) : DEFAULT_TIERS;
    } catch {
      return DEFAULT_TIERS;
    }
  });

  const [members, setMembers] = React.useState<any[]>([]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortOption, setSortOption] = React.useState<'nome' | 'recent' | 'revenue' | 'events' | 'checkin'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = React.useState(false);
  const [activeFilterTier, setActiveFilterTier] = React.useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);

  // Modal States
  const [isCreateTierOpen, setIsCreateTierOpen] = React.useState(false);
  const [createTierStep, setCreateTierStep] = React.useState<1 | 2>(1);
  const [newTierName, setNewTierName] = React.useState('');
  const [newTierDescription, setNewTierDescription] = React.useState('');
  const [newTierColor, setNewTierColor] = React.useState('#a855f7');
  const [newTierRequiresApproval, setNewTierRequiresApproval] = React.useState(false);
  const [newTierPriceType, setNewTierPriceType] = React.useState<'Free' | 'OneTime' | 'Monthly' | 'Annual'>('Free');
  const [newTierPriceOneTime, setNewTierPriceOneTime] = React.useState(100);
  const [newTierPriceMonthly, setNewTierPriceMonthly] = React.useState(50);
  const [newTierPriceAnnual, setNewTierPriceAnnual] = React.useState(500);
  const [newTierHasAnnualPrice, setNewTierHasAnnualPrice] = React.useState(true);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = React.useState(false);
  const priceDropdownRef = React.useRef<HTMLDivElement>(null);

  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [newMemberName, setNewMemberName] = React.useState('');
  const [newMemberEmail, setNewMemberEmail] = React.useState('');
  const [newMemberTier, setNewMemberTier] = React.useState('');

  const [insightsPeriod, setInsightsPeriod] = React.useState('7days');
  const [showInsightsDropdown, setShowInsightsDropdown] = React.useState(false);
  const [feedbackFilter, setFeedbackFilter] = React.useState('Por Evento');
  const [showFeedbackDropdown, setShowFeedbackDropdown] = React.useState(false);
  const [searchParams] = useSearchParams();
  const subTabParam = searchParams.get('subTab');
  const [settingsSubTab, setSettingsSubTab] = React.useState(subTabParam || 'exibicao');
  const settingsSubTabsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (subTabParam) {
      setSettingsSubTab(subTabParam);
    }
  }, [subTabParam]);

  React.useEffect(() => {
    const container = settingsSubTabsRef.current;
    if (!container || activeTab !== 'configuracoes' || window.innerWidth > 767) return;
    const activeButton = container.querySelector<HTMLElement>(`[data-settings-subtab="${settingsSubTab}"]`);
    if (!activeButton) return;
    const targetLeft = activeButton.offsetLeft - (container.clientWidth - activeButton.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [activeTab, settingsSubTab]);

  const [isAddAdminOpen, setIsAddAdminOpen] = React.useState(false);
  const [admins, setAdmins] = React.useState<CalendarAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = React.useState(false);
  const [adminLoadError, setAdminLoadError] = React.useState('');
  const [adminEmails, setAdminEmails] = React.useState('');
  const [adminFormError, setAdminFormError] = React.useState('');
  const [addingAdmins, setAddingAdmins] = React.useState(false);
  const [removingAdminId, setRemovingAdminId] = React.useState<string | null>(null);
  const [calendarTags, setCalendarTags] = React.useState<CalendarManagedTag[]>([]);
  const [loadingCalendarTags, setLoadingCalendarTags] = React.useState(false);
  const [calendarTagLoadError, setCalendarTagLoadError] = React.useState('');
  const [isTagEditorOpen, setIsTagEditorOpen] = React.useState(false);
  const [tagEditorType, setTagEditorType] = React.useState<'event' | 'member'>('event');
  const [editingCalendarTag, setEditingCalendarTag] = React.useState<CalendarManagedTag | null>(null);
  const [calendarTagName, setCalendarTagName] = React.useState('');
  const [calendarTagColor, setCalendarTagColor] = React.useState(TAG_COLORS[TAG_COLORS.length - 1].color);
  const [calendarTagFormError, setCalendarTagFormError] = React.useState('');
  const [savingCalendarTag, setSavingCalendarTag] = React.useState(false);
  const [openCalendarTagMenuId, setOpenCalendarTagMenuId] = React.useState<string | null>(null);
  const [calendarTagPendingDelete, setCalendarTagPendingDelete] = React.useState<CalendarManagedTag | null>(null);
  const [deletingCalendarTag, setDeletingCalendarTag] = React.useState(false);
  const [embedTheme, setEmbedTheme] = React.useState<CalendarEmbedTheme>('system');
  const [embedLayout, setEmbedLayout] = React.useState<CalendarEmbedLayout>('cards');
  const [embedTagId, setEmbedTagId] = React.useState('all');
  const [embedFilterOpen, setEmbedFilterOpen] = React.useState(false);
  const [embedCopied, setEmbedCopied] = React.useState(false);
  const embedFilterRef = React.useRef<HTMLDivElement>(null);
  const [developerMenuOpen, setDeveloperMenuOpen] = React.useState(false);
  const [calendarIdCopied, setCalendarIdCopied] = React.useState(false);
  const [usageWeekOffset, setUsageWeekOffset] = React.useState(0);
  const [plusBillingCycle, setPlusBillingCycle] = React.useState<'monthly' | 'annual'>('monthly');
  const [isPlusCheckoutOpen, setIsPlusCheckoutOpen] = React.useState(false);
  const [plusCheckoutOrganizationId, setPlusCheckoutOrganizationId] = React.useState('');
  const [plusCalendarDropdownOpen, setPlusCalendarDropdownOpen] = React.useState(false);
  const [plusCouponOpen, setPlusCouponOpen] = React.useState(false);
  const [plusCouponCode, setPlusCouponCode] = React.useState('');
  const [plusCardNumber, setPlusCardNumber] = React.useState('');
  const [plusCardExpiry, setPlusCardExpiry] = React.useState('');
  const [plusCardCvc, setPlusCardCvc] = React.useState('');
  const [plusCheckoutError, setPlusCheckoutError] = React.useState('');
  const [orgName, setOrgName] = React.useState('Fauves');
  const [orgDesc, setOrgDesc] = React.useState('');

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!priceDropdownRef.current?.contains(event.target as Node)) setIsPriceDropdownOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPriceDropdownOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!embedFilterRef.current?.contains(event.target as Node)) setEmbedFilterOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEmbedFilterOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const saveTiers = (newTiers: any[]) => {
    setMembershipTiers(newTiers);
    try {
      localStorage.setItem('fauves-membership-tiers', JSON.stringify(newTiers));
    } catch (e) {
      console.error(e);
    }
  };

  const saveMembers = (newMembers: any[]) => {
    setMembers(newMembers);
    try {
      const targetId = calendarId ? calendarId.replace(/^cal-/, '') : selectedOrg?.id;
      if (targetId) localStorage.setItem(`fauves-calendar-members-${targetId}`, JSON.stringify(newMembers));
    } catch (e) {
      console.error(e);
    }
  };

  const hideCalendarMember = (member: any, action: 'removed' | 'blocked') => {
    const targetId = calendarId ? calendarId.replace(/^cal-/, '') : selectedOrg?.id;
    const key = String(member?.email || member?.id || '').toLowerCase();
    if (!key) return;
    setMembers((current) => current.filter((item) => String(item?.email || item?.id || '').toLowerCase() !== key));
    if (targetId) {
      try {
        const storageKey = `fauves-calendar-hidden-members-${targetId}`;
        const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
        localStorage.setItem(storageKey, JSON.stringify([...new Set([...current, key])]));
      } catch { /* storage unavailable */ }
    }
    toast({ title: action === 'blocked' ? 'Usuário bloqueado' : 'Usuário removido', description: `${member?.name || member?.email || 'O contato'} foi ${action === 'blocked' ? 'bloqueado' : 'removido'} do calendário.` });
  };
  
  // Calendário/Org atualizado ou o do contexto
  const org = extendedOrg?.id ? extendedOrg : selectedOrg;
  const targetOrganizationId = calendarId ? calendarId.replace(/^cal-/, '') : selectedOrg?.id;
  const isPersonalCalendar = Boolean(org?.isPersonal) || org?.bio === 'Esta é a sua organização padrão. Você pode editar o nome, a bio e a identidade visual nas configurações.';
  const calendarDisplayName = isPersonalCalendar ? 'Pessoal' : (org?.name || 'Carregando...');
  const orgUrl = org ? `${window.location.origin}${getOrganizationPath(org)}` : '';
  const plusCheckoutAmount = plusBillingCycle === 'annual' ? 3588 : 349;
  const plusCheckoutAmountLabel = plusCheckoutAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const plusCheckoutOrganization = orgs.find((item) => item.id === plusCheckoutOrganizationId) || org;
  const openPlusCheckout = () => {
    setPlusCheckoutOrganizationId(targetOrganizationId || selectedOrg?.id || '');
    setPlusCalendarDropdownOpen(false);
    setPlusCheckoutError('');
    setIsPlusCheckoutOpen(true);
  };
  const handlePlusCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    setPlusCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
    setPlusCheckoutError('');
  };
  const handlePlusCardExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPlusCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits);
    setPlusCheckoutError('');
  };
  const submitPlusCheckout = () => {
    const cardDigits = plusCardNumber.replace(/\D/g, '');
    const expiryDigits = plusCardExpiry.replace(/\D/g, '');
    if (!plusCheckoutOrganizationId) {
      setPlusCheckoutError('Selecione o calendário que receberá o Fauves Plus.');
      return;
    }
    if (cardDigits.length !== 16 || expiryDigits.length !== 4 || plusCardCvc.length < 3) {
      setPlusCheckoutError('Confira o número, a validade e o código de segurança do cartão.');
      return;
    }
    setPlusCheckoutError('');
    toast({
      title: 'Dados do pagamento validados',
      description: 'O checkout está pronto para ser conectado ao endpoint de assinaturas do Fauves Plus.',
    });
  };
  const embedEventTags = calendarTags.filter((tag) => tag.type === 'event');
  const selectedEmbedTag = embedEventTags.find((tag) => tag.id === embedTagId);
  const embedSource = React.useMemo(() => {
    if (!targetOrganizationId) return '';
    const params = new URLSearchParams({ theme: embedTheme, layout: embedLayout });
    if (embedTagId !== 'all') params.set('tag', embedTagId);
    return `${window.location.origin}/embed/calendar/cal-${targetOrganizationId}/events?${params.toString()}`;
  }, [targetOrganizationId, embedTheme, embedLayout, embedTagId]);
  const embedCode = `<iframe\n  src="${embedSource}"\n  width="600"\n  height="450"\n  frameborder="0"\n  style="border: 1px solid #bfcbda88; border-radius: 4px;"\n  allowfullscreen=""\n  aria-hidden="false"\n  tabindex="0"\n></iframe>`;

  React.useEffect(() => {
    if (embedTagId !== 'all' && !embedEventTags.some((tag) => tag.id === embedTagId)) {
      setEmbedTagId('all');
    }
  }, [embedEventTags, embedTagId]);

  const loadCalendarTags = React.useCallback(async () => {
    if (!targetOrganizationId) return;
    setLoadingCalendarTags(true);
    setCalendarTagLoadError('');
    try {
      const response = await fetchApi(`/api/organization/${targetOrganizationId}/tags`);
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível carregar as tags.'));
      }
      const data = await response.json();
      setCalendarTags(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setCalendarTagLoadError(error instanceof Error ? error.message : 'Não foi possível carregar as tags.');
    } finally {
      setLoadingCalendarTags(false);
    }
  }, [targetOrganizationId]);

  React.useEffect(() => {
    loadCalendarTags();
  }, [loadCalendarTags]);

  React.useEffect(() => {
    const assignedByEvent: Record<string, { id: string; name: string; color: string }[]> = {};
    calendarTags
      .filter((tag) => tag.type === 'event')
      .forEach((tag) => {
        (tag.assignments || []).forEach((eventId) => {
          assignedByEvent[eventId] = [
            ...(assignedByEvent[eventId] || []),
            { id: tag.id, name: tag.name, color: tag.color },
          ];
        });
      });
    setEventTags(assignedByEvent);
  }, [calendarTags]);

  const openCreateTagEditor = (type: 'event' | 'member') => {
    setTagEditorType(type);
    setEditingCalendarTag(null);
    setCalendarTagName('');
    setCalendarTagColor(type === 'event' ? TAG_COLORS[TAG_COLORS.length - 1].color : TAG_COLORS[0].color);
    setCalendarTagFormError('');
    setOpenCalendarTagMenuId(null);
    setIsTagEditorOpen(true);
  };

  const openEditTagEditor = (tag: CalendarManagedTag) => {
    setTagEditorType(tag.type);
    setEditingCalendarTag(tag);
    setCalendarTagName(tag.name);
    setCalendarTagColor(tag.color);
    setCalendarTagFormError('');
    setOpenCalendarTagMenuId(null);
    setIsTagEditorOpen(true);
  };

  const closeTagEditor = () => {
    if (savingCalendarTag) return;
    setIsTagEditorOpen(false);
    setEditingCalendarTag(null);
    setCalendarTagFormError('');
  };

  const handleSaveCalendarTag = async () => {
    if (!targetOrganizationId || savingCalendarTag) return;
    const name = calendarTagName.trim().replace(/\s+/g, ' ');
    if (!name) {
      setCalendarTagFormError('Informe um nome para a tag.');
      return;
    }

    setSavingCalendarTag(true);
    setCalendarTagFormError('');
    try {
      const path = editingCalendarTag
        ? `/api/organization/${targetOrganizationId}/tags/${editingCalendarTag.id}`
        : `/api/organization/${targetOrganizationId}/tags`;
      const response = await fetchApi(path, {
        method: editingCalendarTag ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!editingCalendarTag ? { type: tagEditorType } : {}),
          name,
          color: calendarTagColor,
        }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível salvar a tag.'));
      }
      const savedTag: CalendarManagedTag = await response.json();
      setCalendarTags((current) => editingCalendarTag
        ? current.map((tag) => tag.id === savedTag.id ? savedTag : tag)
        : [...current, savedTag]);
      setIsTagEditorOpen(false);
      setEditingCalendarTag(null);
      toast({
        title: editingCalendarTag ? 'Tag atualizada' : 'Tag criada',
        description: `${savedTag.name} está disponível neste calendário.`,
      });
    } catch (error: unknown) {
      setCalendarTagFormError(error instanceof Error ? error.message : 'Não foi possível salvar a tag.');
    } finally {
      setSavingCalendarTag(false);
    }
  };

  const handleDeleteCalendarTag = async () => {
    if (!targetOrganizationId || !calendarTagPendingDelete || deletingCalendarTag) return;
    setDeletingCalendarTag(true);
    try {
      const response = await fetchApi(
        `/api/organization/${targetOrganizationId}/tags/${calendarTagPendingDelete.id}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível excluir a tag.'));
      }
      const removedName = calendarTagPendingDelete.name;
      setCalendarTags((current) => current.filter((tag) => tag.id !== calendarTagPendingDelete.id));
      setCalendarTagPendingDelete(null);
      toast({ title: 'Tag excluída', description: `${removedName} foi removida do calendário.` });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir a tag',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    } finally {
      setDeletingCalendarTag(false);
    }
  };

  const setCalendarTagAssignment = React.useCallback(async (
    tag: CalendarManagedTag,
    targetId: string,
    assigned: boolean,
  ) => {
    if (!targetOrganizationId) throw new Error('Calendário não encontrado.');
    const response = await fetchApi(
      `/api/organization/${targetOrganizationId}/tags/${tag.id}/assignment`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, assigned }),
      },
    );
    if (!response.ok) {
      throw new Error(await readApiError(response, 'Não foi possível atualizar a tag.'));
    }
    const updatedTag: CalendarManagedTag = await response.json();
    setCalendarTags((current) => current.map((item) => item.id === updatedTag.id ? updatedTag : item));
    return updatedTag;
  }, [targetOrganizationId]);

  const createMemberCalendarTag = React.useCallback(async (name: string, color: string) => {
    if (!targetOrganizationId) throw new Error('Calendário não encontrado.');
    const existing = calendarTags.find((tag) =>
      tag.type === 'member' && tag.name.toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR'),
    );
    if (existing) return existing;

    const response = await fetchApi(`/api/organization/${targetOrganizationId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'member', name: name.trim(), color }),
    });
    if (!response.ok) {
      throw new Error(await readApiError(response, 'Não foi possível criar a tag.'));
    }
    const createdTag: CalendarManagedTag = await response.json();
    setCalendarTags((current) => [...current, createdTag]);
    return createdTag;
  }, [targetOrganizationId, calendarTags]);

  const createAndAssignEventTag = async (eventId: string, name: string, color: string) => {
    if (!targetOrganizationId) return;
    try {
      let tag = calendarTags.find((item) =>
        item.type === 'event' && item.name.toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR'),
      );
      if (!tag) {
        const createResponse = await fetchApi(`/api/organization/${targetOrganizationId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'event', name: name.trim(), color }),
        });
        if (!createResponse.ok) {
          throw new Error(await readApiError(createResponse, 'Não foi possível criar a tag.'));
        }
        tag = await createResponse.json();
        setCalendarTags((current) => [...current, tag as CalendarManagedTag]);
      }
      if (!tag) throw new Error('Não foi possível localizar a tag criada.');
      await setCalendarTagAssignment(tag, eventId, true);
      setActiveTaggingEventId(null);
      setNewTagName('');
      setTagCreationStep('input');
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível adicionar a tag',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    }
  };

  const removeEventTag = async (eventId: string, tagId: string) => {
    const tag = calendarTags.find((item) => item.id === tagId);
    if (!tag) return;
    try {
      await setCalendarTagAssignment(tag, eventId, false);
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível remover a tag',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    }
  };

  const assignExistingEventTag = async (eventId: string, tag: CalendarManagedTag) => {
    try {
      await setCalendarTagAssignment(tag, eventId, true);
      setActiveTaggingEventId(null);
      setNewTagName('');
      setTagCreationStep('input');
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível adicionar a tag',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    }
  };

  React.useEffect(() => {
    if (!isTagEditorOpen && !calendarTagPendingDelete) return;
    const releaseScrollLock = acquireDocumentScrollLock();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || savingCalendarTag || deletingCalendarTag) return;
      setIsTagEditorOpen(false);
      setEditingCalendarTag(null);
      setCalendarTagPendingDelete(null);
      setCalendarTagFormError('');
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isTagEditorOpen, calendarTagPendingDelete, savingCalendarTag, deletingCalendarTag]);

  const loadAdmins = React.useCallback(async () => {
    if (!targetOrganizationId) return;
    setLoadingAdmins(true);
    setAdminLoadError('');
    try {
      const response = await fetchApi(`/api/organization/${targetOrganizationId}/admins`);
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível carregar os administradores.'));
      }
      const data = await response.json();
      const list = (Array.isArray(data) ? data : []).map((admin: CalendarAdmin) => ({
        ...admin,
        photoUrl: admin.photoUrl ? resolveImageUrl(admin.photoUrl) : null,
      }));
      setAdmins(list);
    } catch (error: unknown) {
      setAdminLoadError(error instanceof Error ? error.message : 'Não foi possível carregar os administradores.');
    } finally {
      setLoadingAdmins(false);
    }
  }, [targetOrganizationId]);

  React.useEffect(() => {
    if (settingsSubTab === 'administradores') loadAdmins();
  }, [settingsSubTab, loadAdmins]);

  const closeAddAdminModal = () => {
    if (addingAdmins) return;
    setIsAddAdminOpen(false);
    setAdminEmails('');
    setAdminFormError('');
  };

  React.useEffect(() => {
    if (!isAddAdminOpen) return;
    const releaseScrollLock = acquireDocumentScrollLock();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !addingAdmins) {
        setIsAddAdminOpen(false);
        setAdminEmails('');
        setAdminFormError('');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAddAdminOpen, addingAdmins]);

  const handleAddAdmins = async () => {
    if (!targetOrganizationId || addingAdmins) return;
    const emails = splitAdminEmails(adminEmails);
    if (!emails.length || emails.some((email) => !isValidEmail(email))) {
      setAdminFormError('Revise os endereços e informe pelo menos um e-mail válido.');
      return;
    }

    setAddingAdmins(true);
    setAdminFormError('');
    try {
      const response = await fetchApi(`/api/organization/${targetOrganizationId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível adicionar os administradores.'));
      }
      const result = await response.json();
      await loadAdmins();
      setIsAddAdminOpen(false);
      setAdminEmails('');
      const addedCount = Array.isArray(result?.added) ? result.added.length : emails.length;
      const existingCount = Array.isArray(result?.existing) ? result.existing.length : 0;
      toast({
        title: addedCount === 0
          ? 'Nenhuma alteração'
          : addedCount === 1
            ? 'Administrador adicionado'
            : 'Administradores adicionados',
        description: addedCount === 0
          ? 'Todos os e-mails informados já fazem parte deste calendário.'
          : existingCount
          ? `${addedCount} adicionado(s). ${existingCount} já fazia(m) parte do calendário.`
          : `${addedCount} administrador(es) agora têm acesso ao calendário.`,
      });
    } catch (error: unknown) {
      setAdminFormError(error instanceof Error ? error.message : 'Não foi possível adicionar os administradores.');
    } finally {
      setAddingAdmins(false);
    }
  };

  const handleRemoveAdmin = async (admin: CalendarAdmin) => {
    if (!targetOrganizationId || (admin.isOwner && !admin.isCurrentUser) || removingAdminId) return;
    setRemovingAdminId(admin.userId);
    try {
      const response = await fetchApi(
        `/api/organization/${targetOrganizationId}/admins/${admin.userId}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Não foi possível remover o administrador.'));
      }
      if (admin.isCurrentUser) {
        await refreshOrganizations();
        navigate('/organizations');
        return;
      }
      setAdmins((current) => current.filter((item) => item.userId !== admin.userId));
      toast({
        title: 'Administrador removido',
        description: `${admin.name || admin.email} não tem mais acesso ao calendário.`,
      });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível concluir a ação',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    } finally {
      setRemovingAdminId(null);
    }
  };

  // Busca dados frescos da organizacao
  const fetchFresh = React.useCallback(async () => {
    const targetId = calendarId ? calendarId.replace(/^cal-/, '') : selectedOrg?.id;
    if (!targetId) return;
    setLoadingFresh(true);
    setLoadingEvents(true);
    try {
      const res = await fetchApi(`/api/organization/${targetId}`);
      const data = await res.json();
      if (!res.ok || !data?.id) {
        throw new Error(data?.message || data?.error || 'Calendário não encontrado');
      }
      setExtendedOrg(data);
      
      // Load events
      const eventsRes = await fetchApi(`/api/events/by-organization?orgId=${targetId}`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      }

      const contactsRes = await fetchApi(`/api/organization/${targetId}/contacts`);
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        const localMembers = (() => {
          try {
            return JSON.parse(localStorage.getItem(`fauves-calendar-members-${targetId}`) || '[]');
          } catch {
            return [];
          }
        })();
        const remoteMembers = (Array.isArray(contactsData) ? contactsData : []).map((member: any) => ({
          ...member,
          photoUrl: member.photoUrl ? resolveImageUrl(member.photoUrl) : null,
        }));
        const hiddenMembers = (() => {
          try { return new Set(JSON.parse(localStorage.getItem(`fauves-calendar-hidden-members-${targetId}`) || '[]')); }
          catch { return new Set(); }
        })();
        const combined = [...remoteMembers, ...(Array.isArray(localMembers) ? localMembers : [])]
          .filter((member: any) => !hiddenMembers.has(String(member.email || member.id || '').toLowerCase()));
        const unique = new Map(combined.map((member: any) => [(member.email || member.id || '').toLowerCase(), member]));
        setMembers(Array.from(unique.values()));
      }
    } catch {
      setExtendedOrg(null);
      toast({ variant: 'destructive', title: 'Falha ao carregar dados' }); 
    } finally { 
      setLoadingFresh(false); 
      setLoadingEvents(false);
    }
  }, [selectedOrg?.id, calendarId, toast]);

  React.useEffect(() => { fetchFresh(); }, [fetchFresh]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--page-max-width', '820px');
    return () => {
      document.documentElement.style.removeProperty('--page-max-width');
    };
  }, []);

  const saveGeneric = async (data: any) => {
    const targetId = calendarId ? calendarId.replace(/^cal-/, '') : selectedOrg?.id;
    if (!targetId) return;
    setSaving(true);
    try {
      const res = await fetchApi(`/api/organization/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message || 'Não foi possível salvar as alterações.');
      if (
        data.themeColor &&
        String(result?.data?.themeColor || '').toLowerCase() !== String(data.themeColor).toLowerCase()
      ) {
        throw new Error('A cor não foi confirmada pelo calendário. Tente novamente.');
      }
      if (result?.data?.id) setExtendedOrg((current: any) => ({ ...(current || {}), ...result.data }));
      toast({ title: 'Sucesso', description: 'Alterações salvas com sucesso.' });
      setEditModal(null);
      await fetchFresh();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível salvar as alterações.',
      });
      throw error;
    } finally { 
      setSaving(false); 
    }
  };

  const handleEdit = (id: string) => {
    setTempData({ ...org });
    setEditModal(id);
  };

  const copyCalendarIdentifier = async () => {
    const identifier = targetOrganizationId ? `cal-${targetOrganizationId}` : '';
    if (!identifier) return;
    try {
      await navigator.clipboard.writeText(identifier);
      setCalendarIdCopied(true);
      setDeveloperMenuOpen(false);
      window.setTimeout(() => setCalendarIdCopied(false), 1800);
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível copiar o ID do calendário' });
    }
  };

  if (!selectedOrg && !extendedOrg && !calendarId) {
    return <div className="p-12 text-center text-slate-500">Selecione uma organização...</div>;
  }

  const getCombinedTimeline = () => {
    const rawEvents = events;

    const list = rawEvents.map(e => {
      return {
        id: e.id,
        eventId: e.id,
        name: e.name || e.title || 'Evento',
        startDate: e.startDate,
        endDate: e.endDate,
        image: e.image || e.coverUrl || '',
        venue: e.locationCity
          ? `${e.locationCity}${e.locationUf ? `, ${e.locationUf}` : ''}`
          : e.venue || e.locationName || e.locationAddress || (e.location === 'Evento online' ? 'Online' : e.location) || 'Local não definido',
        location: e.location || e.locationAddress || '',
        attendeesCount: e.attendeesCount || e.soldCount || e.attendees || 0,
        type: 'organized'
      };
    });

    // Filter by upcoming vs past
    const now = new Date();
    const filtered = list.filter(item => {
      const startDate = item.startDate ? new Date(item.startDate) : null;
      const endDate = item.endDate ? new Date(item.endDate) : null;
      if (!startDate) return false;
      if (eventsTab === 'upcoming') {
        return (endDate || startDate) >= now;
      } else {
        return (endDate || startDate) < now;
      }
    });

    // Sort chronologically
    return filtered.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return eventsTab === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  };

  const groupTimelineByDay = (list: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    list.forEach(item => {
      if (!item.startDate) return;
      const d = new Date(item.startDate);
      const dateKey = d.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    return grouped;
  };

  return (
    <div className={`organizer-settings-page manage-theme-surface theme-root ${isDark ? 'dark dark-mode' : 'light'}`} style={{ minHeight: '100vh', background: isDark ? '#131517' : '#f7f8f9', color: isDark ? '#fff' : '#18181b', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Import the existing premium HeaderV2 directly inside layout instead of local stub */}
      <HeaderV2 transparent={true} scrollTransition={false} theme={isDark ? 'dark' : 'light'} />

      <div style={{ paddingTop: '3rem' }}>
        
        {/* Sticky Header with Title and Tabs matching the requested settings style */}
        <div
          className={`manage-sticky-tabs-header ${isHeaderScrolled ? 'is-scrolled' : ''}`}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            width: '100%',
            background: isHeaderScrolled ? (isDark ? 'rgba(19, 21, 23, 0.88)' : 'rgba(247,248,249,.9)') : 'transparent',
            backdropFilter: isHeaderScrolled ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: isHeaderScrolled ? 'blur(16px)' : 'none',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,.07)' : 'rgba(24,24,27,.1)'}`,
            marginBottom: '0.75rem',
            transition: 'background-color 220ms ease, backdrop-filter 220ms ease, -webkit-backdrop-filter 220ms ease'
          }}
        >
          <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 1rem' }}>
            <div className="manage-sticky-tabs-title-shell" style={{ padding: '20px 0 0 0' }}>
              <div className="manage-sticky-tabs-heading-row flex items-center justify-between mb-4">
                <div className="manage-sticky-tabs-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {!isPersonalCalendar && (org?.logoUrl ? (
                    <img
                      className="manage-sticky-tabs-avatar"
                      src={resolveImageUrl(org.logoUrl) || ''} 
                      alt={org.name}
                      style={{
                        width: '25px',
                        height: '25px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(24,24,27,.1)'}`
                      }}
                    />
                  ) : (
                    <div className="manage-sticky-tabs-avatar" style={{
                      width: '25px',
                      height: '25px',
                      borderRadius: '6px',
                      background: isDark ? 'rgba(255,255,255,.1)' : 'rgba(24,24,27,.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isDark ? 'rgba(255,255,255,.6)' : '#52525b'
                    }}>
                      {calendarDisplayName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  <h1 className="manage-sticky-tabs-title" style={{
                    fontSize: '28px', 
                    fontWeight: 600, 
                    color: isDark ? '#fff' : '#18181b',
                    lineHeight: '33.6px',
                    margin: 0
                  }}>
                    {calendarDisplayName}
                  </h1>
                </div>
                
                <button
                    type="button"
                    onClick={() => window.open(orgUrl, '_blank')}
                    className={`manage-sticky-tabs-external-action ${isDark
                      ? 'transition-all duration-300 text-[rgba(255,255,255,0.64)] hover:text-[rgb(19,21,23)] bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.64)]'
                      : 'transition-all duration-300 text-zinc-600 hover:text-zinc-950 bg-zinc-200/70 hover:bg-zinc-200'}`}
                    style={{
                        borderColor: 'rgba(0, 0, 0, 0)',
                        border: '1px solid rgba(0, 0, 0, 0)',
                        fontSize: '14px',
                        padding: '7px 10px',
                        height: '30px',
                        width: 'fit-content',
                        fontWeight: 500,
                        borderRadius: '8px',

                        whiteSpace: 'nowrap',
                        outlineOffset: '2px',
                        outline: 'rgba(0, 0, 0, 0) solid 2px',
                        justifyContent: 'center',
                        minWidth: '0px',
                        maxWidth: '100%',
                        position: 'relative',
                        alignItems: 'center',
                        display: 'flex',
                        cursor: 'pointer',
                        margin: '0px',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Apple Color Emoji', Inter, Roboto, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
                        lineHeight: '21px',
                        boxSizing: 'border-box'
                    }}
                >
                    <div style={{ textOverflow: 'ellipsis', margin: '-4px 0px', padding: '4px 0px', lineHeight: '14px', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Página do Calendário
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ strokeWidth: '2.5px', width: '.875rem', height: '14px', flexShrink: 0, display: 'block', verticalAlign: 'middle', boxSizing: 'border-box' }}>
                            <path d="M7 17 17 7M7 7h10v10" style={{ boxSizing: 'border-box' }}></path>
                        </svg>
                    </div>
                </button>
              </div>
            </div>

            {/* Abas Premium horizontais idênticas ao AccountSettingsV2 */}
            <div ref={primaryTabsRef} className="premium-tab-container !mb-0" style={{ display: 'flex', gap: '16px', marginBottom: '-1px' }}>
              {[
                { id: 'eventos', label: 'Eventos' },
                { id: 'pessoas', label: 'Pessoas' },
                { id: 'newsletters', label: 'Newsletters' },
                { id: 'pagamento', label: 'Pagamento' },
                { id: 'insights', label: 'Insights' },
                { id: 'configuracoes', label: 'Configurações' }
              ].map(tab => (
                <button
                  key={tab.id}
                  data-calendar-tab={tab.id}
                  className={`premium-tab ${activeTab === tab.id ? 'active' : ''}`}
                  style={{
                    fontSize: '16px',
                    color: activeTab === tab.id ? (isDark ? '#fff' : '#18181b') : (isDark ? 'rgba(255,255,255,.5)' : '#71717a'),
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    padding: '0px 4px 8px 4px',
                    display: 'block',
                    fontWeight: 500,
                    borderBottom: activeTab === tab.id ? `2px solid ${isDark ? '#fff' : '#18181b'}` : '2px solid transparent',
                    transition: '0.3s ease'
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Largura compartilhada com Eventos e Manage Event. */}
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0.75rem 1rem 5rem' }}>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* ─── TAB: EVENTOS (TOTALMENTE IDENTICO AO PRINT) ─── */}
            <TabsContent value="eventos" className="space-y-8 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Eventos</h2>
                  <span className="event-add-button-wrap">
                    <button
                      type="button"
                      onClick={() => navigate('/create')}
                      className="event-add-button"
                      aria-label="Adicionar Evento"
                      aria-describedby="add-event-tooltip"
                    >
                      <Plus size={14}/>
                    </button>
                    <span id="add-event-tooltip" role="tooltip" className="event-add-tooltip">Adicionar Evento</span>
                  </span>
                </div>
                
                {/* Round V2 Tab Period Switcher */}
                <div className="lux-button-switcher always" style={{ minWidth: 'auto', maxWidth: 'auto', '--option-length': 2 } as React.CSSProperties}>
                  <div className="segments">
                    <button
                      type="button"
                      onClick={() => setEventsTab('upcoming')}
                      className={`btn segment flex-center animated nodivider ${eventsTab === 'upcoming' ? 'selected' : ''}`}
                    >
                      <div>Próximos</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventsTab('past')}
                      className={`btn segment flex-center animated nodivider ${eventsTab === 'past' ? 'selected' : ''}`}
                    >
                      <div>Passado</div>
                    </button>
                    <div
                      className="slider animated"
                      style={{ left: `calc(100% / 2 * ${eventsTab === 'upcoming' ? 0 : 1})` }}
                    />
                  </div>
                </div>
              </div>

              {loadingEvents ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '2rem', animation: 'pulse 1.5s infinite linear' }}>
                      <div style={{ width: '5.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '40px' }} />
                        <div style={{ height: '24px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', width: '60px' }} />
                      </div>
                      <div style={{ flex: 1, height: '96px', background: '#1c1c1e', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const combinedTimeline = getCombinedTimeline();
                const groupedTimeline = groupTimelineByDay(combinedTimeline);
                
                if (Object.keys(groupedTimeline).length === 0) {
                  return (
                    <div className="calendar-empty-state">
                      <div className="calendar-empty-art" aria-hidden="true">
                        <svg viewBox="0 0 190 180" role="img">
                          <defs>
                            <linearGradient id="calendar-empty-surface" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0" stopColor="#343536" />
                              <stop offset="1" stopColor="#292a2b" />
                            </linearGradient>
                            <linearGradient id="calendar-empty-badge" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0" stopColor="#414243" />
                              <stop offset="1" stopColor="#313233" />
                            </linearGradient>
                          </defs>
                          <rect x="18" y="45" width="138" height="112" rx="17" fill="url(#calendar-empty-surface)" stroke="#414243" strokeWidth="1.5" />
                          <path d="M30 63h75" stroke="#151617" strokeWidth="12" strokeLinecap="round" opacity=".9" />
                          <rect x="33" y="84" width="36" height="17" rx="5" fill="#151617" />
                          <rect x="75" y="76" width="37" height="35" rx="5" fill="#151617" />
                          <rect x="33" y="117" width="36" height="35" rx="5" fill="#171819" />
                          <rect x="75" y="133" width="38" height="18" rx="5" fill="#171819" />
                          <rect x="118" y="112" width="37" height="35" rx="6" fill="#151617" />
                          <rect x="124" y="20" width="56" height="58" rx="20" fill="url(#calendar-empty-badge)" stroke="#48494a" />
                          <text x="152" y="62" textAnchor="middle" fill="#171819" fontSize="45" fontWeight="700" fontFamily="Inter, sans-serif">0</text>
                        </svg>
                      </div>
                      <h3>Nenhum Evento</h3>
                      <p>
                        {eventsTab === 'upcoming'
                          ? 'Este calendário não tem eventos futuros.'
                          : 'Este calendário não tem eventos passados.'
                        }
                      </p>
                      <button type="button" onClick={() => navigate('/create')} className="calendar-empty-add">
                        <Plus size={15} /> Adicionar Evento
                      </button>
                    </div>
                  );
                }

                const dateKeys = Object.keys(groupedTimeline).sort((a, b) => {
                  const [dayA, monthA, yearA] = a.split('/').map(Number);
                  const [dayB, monthB, yearB] = b.split('/').map(Number);
                  const timeA = new Date(yearA, monthA - 1, dayA).getTime();
                  const timeB = new Date(yearB, monthB - 1, dayB).getTime();
                  return eventsTab === 'upcoming' ? timeA - timeB : timeB - timeA;
                });

                return (
                  <div className="events-list">
                    {dateKeys.map((dateKey) => {
                      const groupItems = groupedTimeline[dateKey];
                      const d = new Date(groupItems[0].startDate);

                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);

                      const isToday = d.toDateString() === today.toDateString();
                      const isTomorrow = d.toDateString() === tomorrow.toDateString();

                      let groupName = '';
                      if (isToday) {
                        groupName = 'Hoje';
                      } else if (isTomorrow) {
                        groupName = 'Amanhã';
                      } else {
                        const day = d.getDate();
                        const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                        const month = monthNames[d.getMonth()];
                        groupName = `${day} de ${month}.`;
                      }

                      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();

                      return (
                        <div key={dateKey} className="events-group-row">

                          {/* Left Column: Date & Weekday (Left-aligned) */}
                          <div className="date-col">
                            <span className="date-main" style={{ color: '#fff' }}>{groupName}</span>
                            <span className="date-sub" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{weekday}</span>
                          </div>

                          {/* Timeline Bullet Dot */}
                          <div className="timeline-dot" />

                          {/* Right Column: Cards for this Day */}
                          <div className="cards-col">
                            {groupItems.map((item) => {
                              const dateObj = new Date(item.startDate);
                              const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    setSelectedPanelEvent(item);
                                    setIsPanelOpen(true);
                                  }}
                                  className="event-card-v2"
                                >
                                  {/* Top Row: Info (Left) & Cover (Right) */}
                                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>

                                    {/* Left Column: Text Info */}
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3125rem' }}>

                                      {/* Time above the title */}
                                      <div style={{
                                        fontSize: '0.9375rem',
                                        fontWeight: 500,
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        textAlign: 'left'
                                      }}>
                                        {timeStr}
                                      </div>

                                      {/* Título */}
                                      <h3 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 600,
                                        color: '#fff',
                                        margin: 0,
                                        lineHeight: 1.2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {item.name}
                                      </h3>

                                      {/* Location */}
                                      <p style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        <MapPin className="w-4 h-4 animate-none" style={{ strokeWidth: 1.5, color: 'rgba(255, 255, 255, 0.5)' }} />
                                        <span className="truncate">{item.venue}</span>
                                      </p>

                                      {/* Attendees */}
                                      <p style={{
                                        fontSize: '0.8125rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        margin: 0
                                      }}>
                                        <Users className="w-4 h-4" style={{ strokeWidth: 1.5, color: 'rgba(255, 255, 255, 0.5)' }} />
                                        <span>{item.attendeesCount > 0 ? `${item.attendeesCount} ${item.attendeesCount === 1 ? 'convidado' : 'convidados'}` : 'Nenhum convidado'}</span>
                                      </p>

                                      {/* Tags Row */}
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '0.25rem' }}>
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveTaggingEventId(item.eventId);
                                              setNewTagName('');
                                              setTagCreationStep('input');
                                            }}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              background: 'rgba(255, 255, 255, 0.06)',
                                              color: 'rgba(255, 255, 255, 0.64)',
                                              fontSize: '0.8125rem',
                                              fontWeight: 500,
                                              padding: '0.3125rem 0.625rem',
                                              borderRadius: '100px',
                                              border: '1px solid transparent',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s',
                                            }}
                                            className="hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
                                          >
                                            <Plus className="w-3.5 h-3.5" /> Adicionar Tag
                                          </button>
                                          
                                          {activeTaggingEventId === item.eventId && (
                                            <div 
                                              onClick={(e) => e.stopPropagation()}
                                              style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                marginTop: '6px',
                                                width: '220px',
                                                background: '#1c1c1e',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                padding: '8px',
                                                zIndex: 50,
                                                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                                textAlign: 'left'
                                              }}
                                            >
                                              {tagCreationStep === 'input' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                  <input
                                                    type="text"
                                                    placeholder="Adicionar nova tag"
                                                    value={newTagName}
                                                    onChange={(e) => setNewTagName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter' && newTagName.trim()) {
                                                        setTagCreationStep('color');
                                                      }
                                                    }}
                                                    autoFocus
                                                    style={{
                                                      width: '100%',
                                                      background: 'rgba(255,255,255,0.06)',
                                                      border: '1px solid rgba(255,255,255,0.1)',
                                                      borderRadius: '6px',
                                                      padding: '6px 10px',
                                                      fontSize: '13px',
                                                      color: '#fff',
                                                      outline: 'none'
                                                    }}
                                                  />
                                                  {calendarTags
                                                    .filter((tag) =>
                                                      tag.type === 'event' &&
                                                      !tag.assignments.includes(item.eventId) &&
                                                      (!newTagName.trim() || tag.name.toLocaleLowerCase('pt-BR').includes(newTagName.trim().toLocaleLowerCase('pt-BR'))),
                                                    )
                                                    .slice(0, 6)
                                                    .map((tag) => (
                                                      <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => void assignExistingEventTag(item.eventId, tag)}
                                                        className="flex h-8 w-full items-center gap-2 rounded-md border-0 bg-transparent px-2 text-left text-[13px] font-medium text-white hover:bg-white/[0.06]"
                                                      >
                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                        <span className="truncate">{tag.name}</span>
                                                      </button>
                                                    ))}
                                                  {newTagName.trim() && !calendarTags.some((tag) =>
                                                    tag.type === 'event' &&
                                                    tag.name.toLocaleLowerCase('pt-BR') === newTagName.trim().toLocaleLowerCase('pt-BR')
                                                  ) && (
                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                                                      <div style={{ fontSize: '13px', color: '#fff', padding: '4px 6px', fontWeight: 500 }}>
                                                        {newTagName}
                                                      </div>
                                                      <button
                                                        type="button"
                                                        onClick={() => setTagCreationStep('color')}
                                                        style={{
                                                          width: '100%',
                                                          textAlign: 'left',
                                                          background: 'transparent',
                                                          border: 'none',
                                                          color: 'rgba(255,255,255,0.8)',
                                                          padding: '6px 8px',
                                                          borderRadius: '6px',
                                                          fontSize: '12px',
                                                          cursor: 'pointer',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: '6px'
                                                        }}
                                                        className="hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                                                      >
                                                        <Plus className="w-3.5 h-3.5" /> Criar "{newTagName}"
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '4px 6px 8px 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Escolha a cor da tag
                                                  </div>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    {TAG_COLORS.map((c) => (
                                                      <button
                                                        key={c.name}
                                                        type="button"
                                                        onClick={() => void createAndAssignEventTag(item.eventId, newTagName, c.color)}
                                                        style={{
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: '8px',
                                                          background: 'transparent',
                                                          border: 'none',
                                                          color: '#fff',
                                                          width: '100%',
                                                          padding: '6px 8px',
                                                          borderRadius: '6px',
                                                          fontSize: '13px',
                                                          cursor: 'pointer',
                                                          textAlign: 'left'
                                                        }}
                                                        className="hover:bg-[rgba(255,255,255,0.06)]"
                                                      >
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                                                        {c.name}
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {(eventTags[item.eventId] || []).map((tag) => (
                                          <span
                                            key={tag.id}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              background: `${tag.color}26`, // 15% opacity
                                              color: tag.color,
                                              fontSize: '0.8125rem',
                                              fontWeight: 500,
                                              padding: '0.3125rem 0.625rem',
                                              borderRadius: '100px',
                                              border: `1px solid ${tag.color}33`,
                                            }}
                                          >
                                            {tag.name}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                void removeEventTag(item.eventId, tag.id);
                                              }}
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                background: 'transparent',
                                                border: 'none',
                                                padding: 0,
                                                color: 'inherit',
                                                cursor: 'pointer',
                                                opacity: 0.6
                                              }}
                                              className="hover:opacity-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Right Column: Cover Thumbnail */}
                                    <div className="event-card-cover">
                                      {item.image ? (
                                        <img src={resolveImageUrl(item.image) || undefined} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <Calendar className="w-8 h-8 text-neutral-300" />
                                      )}
                                    </div>

                                  </div>

                                  {/* Bottom Row: Status Badge/Button if confirmed or managed */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '0.25rem' }}>
                                    <span 
                                      className="manage-event-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/event/manage/${item.eventId}`);
                                      }}
                                    >
                                      Gerenciar Evento <ArrowRight />
                                    </span>
                                  </div>

                                </div>
                              );
                            })}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </TabsContent>
            
            <TabsContent value="pessoas" className="animate-in fade-in duration-200 text-left">
              <CalendarPeoplePanel
                isPersonal={isPersonalCalendar}
                members={members}
                tiers={membershipTiers}
                managedTags={calendarTags}
                onCreateManagedTag={createMemberCalendarTag}
                onSetManagedTagAssignment={setCalendarTagAssignment}
                onCreateTier={() => {
                  setNewTierName('');
                  setNewTierDescription('');
                  setNewTierColor('#ec4899');
                  setNewTierRequiresApproval(false);
                  setNewTierPriceType('Free');
                  setNewTierPriceOneTime(100);
                  setNewTierPriceMonthly(50);
                  setNewTierPriceAnnual(500);
                  setNewTierHasAnnualPrice(false);
                  setCreateTierStep(1);
                  setIsCreateTierOpen(true);
                }}
                onAddMembers={(newMembers) => {
                  const existingEmails = new Set(members.map((member) => String(member.email || '').toLowerCase()));
                  const additions = newMembers.filter((member) => !existingEmails.has(String(member.email || '').toLowerCase()));
                  saveMembers([...members, ...additions]);
                  toast({ title: 'Pessoas adicionadas', description: `${additions.length} contato(s) adicionado(s) ao calendário.` });
                }}
                onRemoveMember={(member) => hideCalendarMember(member, 'removed')}
                onBlockMember={(member) => hideCalendarMember(member, 'blocked')}
              />
            </TabsContent>

            {/* Implementação antiga mantida temporariamente fora da renderização */}
            {false && (
            <TabsContent value="pessoas" className="space-y-6 animate-in fade-in duration-200 text-left">
              {/* Seção de Assinaturas */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Assinaturas</h3>
                <button
                  type="button"
                  onClick={() => {
                    setNewTierName('');
                    setNewTierDescription('');
                    setNewTierColor('#ec4899');
                    setNewTierRequiresApproval(false);
                    setNewTierPriceType('Free');
                    setNewTierPriceOneTime(100);
                    setNewTierPriceMonthly(50);
                    setNewTierPriceAnnual(500);
                    setNewTierHasAnnualPrice(false);
                    setCreateTierStep(1);
                    setIsCreateTierOpen(true);
                  }}
                  className="fauves-button-secondary"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar
                </button>
              </div>

              {/* Memberships Dashed Box */}
              <div style={{
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>Memberships</h4>
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', margin: 0 }}>
                    Ofereça eventos e tipos de ingressos exclusivos para membros, configure níveis e venda assinaturas.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end', maxWidth: '400px' }}>
                  {membershipTiers.map((tier) => (
                    <span
                      key={tier.name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: `${tier.color}20`,
                        color: tier.color,
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        padding: '0.375rem 0.75rem',
                        borderRadius: '9999px',
                        border: `1px solid ${tier.color}30`
                      }}
                    >
                      <Award className="w-3.5 h-3.5" />
                      {tier.name}
                    </span>
                  ))}
                </div>
              </div>

              <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '1.5rem 0' }} />

              {/* Seção de Pessoas */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Pessoas</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewMemberName('');
                      setNewMemberEmail('');
                      setNewMemberTier(membershipTiers[0]?.name || '');
                      setIsAddMemberOpen(true);
                    }}
                    className="fauves-button-secondary"
                  >
                    <UserPlus className="w-4 h-4" /> Adicionar Pessoas
                  </button>

                  <button
                    type="button"
                    title="Exportar CSV"
                    onClick={() => {
                      const headers = 'Nome,Email,Assinatura,Data de Adesao\n';
                      const rows = members.map(m => `${m.name},${m.email},${m.tier},${m.joinedAt}`).join('\n');
                      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', 'calendar-members.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="fauves-button-secondary !px-2"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    className="fauves-button-secondary !px-2"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filtros e Busca */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Busca */}
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255, 255, 255, 0.4)' }} />
                  <input
                    type="text"
                    placeholder="Buscar"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '8px 12px 8px 36px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Filtrar por nível */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFilterDropdownOpen(!isFilterDropdownOpen);
                      setIsSortDropdownOpen(false);
                    }}
                    className="fauves-button-secondary"
                    style={activeFilterTier ? { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' } : {}}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {activeFilterTier ? `Plano: ${activeFilterTier}` : 'Filtrar'}
                  </button>

                  {isFilterDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '6px',
                      background: '#1c1c1e',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '4px',
                      zIndex: 100,
                      minWidth: '180px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilterTier(null);
                          setIsFilterDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: !activeFilterTier ? 'rgba(255,255,255,0.06)' : 'transparent',
                          border: 'none',
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                        className="hover:bg-[rgba(255,255,255,0.06)]"
                      >
                        Todos
                      </button>
                      {membershipTiers.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => {
                            setActiveFilterTier(t.name);
                            setIsFilterDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: activeFilterTier === t.name ? 'rgba(255,255,255,0.06)' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                          className="hover:bg-[rgba(255,255,255,0.06)]"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ordenacao */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSortDropdownOpen(!isSortDropdownOpen);
                      setIsFilterDropdownOpen(false);
                    }}
                    className="fauves-button-secondary"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {sortOptionLabel[sortOption]}
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>

                  {isSortDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '6px',
                      background: '#1c1c1e',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '4px',
                      zIndex: 100,
                      minWidth: '180px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}>
                      {Object.keys(sortOptionLabel).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSortOption(opt as any);
                            setIsSortDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: sortOption === opt ? 'rgba(255,255,255,0.06)' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                          className="hover:bg-[rgba(255,255,255,0.06)]"
                        >
                          <span>{sortOptionLabel[opt]}</span>
                          {sortOption === opt && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista ou Estado Vazio */}
              {(() => {
                const filteredMembers = members.filter(m => {
                  let matchesSearch = true;
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    matchesSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
                  }
                  let matchesFilter = true;
                  if (activeFilterTier) {
                    matchesFilter = m.tier === activeFilterTier;
                  }
                  return matchesSearch && matchesFilter;
                }).sort((a, b) => {
                  if (sortOption === 'nome') {
                    return a.name.localeCompare(b.name);
                  } else if (sortOption === 'recent') {
                    return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
                  } else if (sortOption === 'revenue') {
                    return b.revenue - a.revenue;
                  } else if (sortOption === 'events') {
                    return b.eventsCount - a.eventsCount;
                  } else if (sortOption === 'checkin') {
                    return b.checkedInCount - a.checkedInCount;
                  }
                  return 0;
                });

                if (filteredMembers.length === 0) {
                  return (
                    <div style={{
                      padding: '4rem 1.5rem',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px',
                      marginTop: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.4 }}>
                        <path d="M16 8H48V16C48 24.8 40.8 32 32 32C40.8 32 48 39.2 48 48V56H16V48C16 39.2 23.2 32 32 32C23.2 32 16 24.8 16 16V8Z" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="22" y1="16" x2="42" y2="16" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="22" y1="48" x2="42" y2="48" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" strokeLinecap="round"/>
                        <circle cx="32" cy="20" r="2.5" fill="rgba(255, 255, 255, 0.4)"/>
                        <circle cx="28" cy="16" r="2" fill="rgba(255, 255, 255, 0.3)"/>
                        <circle cx="36" cy="16" r="2" fill="rgba(255, 255, 255, 0.3)"/>
                        <circle cx="32" cy="44" r="3" fill="rgba(255, 255, 255, 0.4)"/>
                        <circle cx="30" cy="50" r="2.5" fill="rgba(255, 255, 255, 0.3)"/>
                        <circle cx="34" cy="50" r="2.5" fill="rgba(255, 255, 255, 0.3)"/>
                      </svg>
                      <h4 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Nenhum Contato</h4>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0, maxWidth: '320px' }}>
                        Quando pessoas forem adicionadas ao seu calendário, elas aparecerão aqui.
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ background: '#1a1c22', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '14px 16px' }}>Nome</th>
                            <th style={{ padding: '14px 16px' }}>Email</th>
                            <th style={{ padding: '14px 16px' }}>Assinatura</th>
                            <th style={{ padding: '14px 16px' }}>Receita</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right' }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map((m, idx) => {
                            const tierObj = membershipTiers.find(t => t.name === m.tier);
                            const color = tierObj ? tierObj.color : '#a855f7';
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#fff' }} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      background: `${color}25`,
                                      color: color,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}>
                                      {m.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                  {m.email}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: `${color}15`,
                                    color: color,
                                    padding: '3px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    border: `1px solid ${color}20`
                                  }}>
                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }} />
                                    {m.tier}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 16px', color: 'rgba(255, 255, 255, 0.8)' }}>
                                  {m.revenue > 0 ? `R$ ${m.revenue}` : '—'}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = members.filter(item => item !== m);
                                      saveMembers(updated);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'rgba(255, 255, 255, 0.4)',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      borderRadius: '4px'
                                    }}
                                    className="hover:text-red-500 hover:bg-[rgba(255,255,255,0.06)]"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>
            )}

            <TabsContent value="newsletters" className="animate-in fade-in duration-200">
              <CalendarNewslettersPanel
                calendarId={org?.id}
                calendarName={calendarDisplayName}
                calendarLogoUrl={isPersonalCalendar ? null : org?.logoUrl}
              />
            </TabsContent>

            <TabsContent value="pagamento" className="animate-in fade-in duration-200 text-left font-sans">
              <CalendarPaymentsPanel
                calendarId={org?.id}
                calendarName={calendarDisplayName}
                onOpenFauvesPlus={() => {
                  setSettingsSubTab('plus');
                  setActiveTab('configuracoes');
                }}
              />
            </TabsContent>

            {false && (
            <TabsContent value="pagamento" className="space-y-8 animate-in fade-in duration-200 text-left font-sans">
              {/* Venda de Ingressos */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Venda de Ingressos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stripe Account Connection */}
                  <div className="content-card rounded-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#635bff] flex items-center justify-center text-white flex-shrink-0 font-extrabold text-xs">
                          stripe
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Conta Stripe</h4>
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-1 text-xs leading-normal">
                        <p className="font-semibold text-zinc-355 dark:text-zinc-300">Conta conectada: Fauves</p>
                        <p className="text-zinc-500">Sua conta Stripe está ativa e aceitando pagamentos.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                      <button className="flex-1 fauves-button-secondary">
                        <span>Abrir Stripe</span>
                        <ArrowUpRight size={12} />
                      </button>
                      <button className="fauves-button-secondary !px-2">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Revenue metrics and Upgrade */}
                  <div className="content-card rounded-card flex flex-col justify-between min-h-[190px]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-550 dark:text-zinc-500">Todo o Tempo</span>
                        <div className="text-lg font-bold text-white mt-1">R$ 0</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-550 dark:text-zinc-500">Mês Passado</span>
                        <div className="text-lg font-bold text-white mt-1">R$ 0</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-550 dark:text-zinc-500">Ingressos Vendidos</span>
                        <div className="text-lg font-bold text-white mt-1">0</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-550 dark:text-zinc-500">Taxa da Plataforma</span>
                        <div className="text-lg font-bold text-white mt-1">0%</div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center">
                      <span className="text-[10px] text-zinc-500 mb-2">Isente a taxa da plataforma com o Fauves Plus.</span>
                      <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2 px-3 rounded-xl cursor-pointer transition-colors">
                        Faça upgrade para o Fauves Plus
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Cupons */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">Cupons</h3>
                    <p className="text-zinc-500 text-xs mt-1">Crie cupons que podem ser aplicados a qualquer evento gerenciado pelo seu calendário.</p>
                  </div>
                  <button className="fauves-button-secondary">
                    <Plus size={12} />
                    <span>Criar</span>
                  </button>
                </div>

                {/* Empty State: Sem Cupons */}
                <div className="content-card rounded-card mt-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900/50 flex items-center justify-center text-zinc-500 dark:text-zinc-600">
                    <Ticket size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300">Sem Cupons</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Você não configurou nenhum cupom.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Métodos de Pagamento */}
              <div>
                <h3 className="text-lg font-bold text-white">Métodos de Pagamento</h3>
                <p className="text-zinc-500 text-xs mt-1 mb-4">Escolha os métodos de pagamento aceitos para seus eventos e associações.</p>

                <div className="content-card rounded-card !p-0 divide-y divide-white/[0.04]">
                  {/* Row 1: Cards */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Cartões</span>
                        <div className="flex gap-1">
                          <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded font-mono text-[9px] font-bold">VISA</span>
                          <span className="px-1.5 py-0.5 bg-red-650/20 text-red-400 border border-red-500/20 rounded font-mono text-[9px] font-bold">MC</span>
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700/55 rounded font-mono text-[9px] font-bold"> Pay</span>
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-350 border border-zinc-700/55 rounded font-mono text-[9px] font-bold">G Pay</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 leading-normal">Os principais cartões de crédito e débito, Apple Pay e Google Pay são sempre aceitos.</p>
                    </div>
                    <span className="text-emerald-500 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                      ✓ Ativado
                    </span>
                  </div>

                  {/* Row 2: Solana */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Solana</span>
                        <span className="px-1.5 py-0.5 bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded font-mono text-[9px] font-bold">SOL</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 leading-normal">Por favor, verifique sua identidade para aceitar pagamentos em criptomoeda.</p>
                    </div>
                    <button className="fauves-button-secondary">
                      Verificar
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Faturamento & Imposto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faturamento */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-bold text-white">Faturamento</h3>
                    <button className="fauves-button-secondary h-[26px]">
                      <PenLine size={10} />
                      <span>Editar</span>
                    </button>
                  </div>
                  <p className="text-zinc-500 text-xs leading-normal mb-3">Suas informações de vendedor exibidas nas faturas dos convidados.</p>
                  
                  <div className="content-card rounded-card space-y-2.5 text-xs text-left">
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-zinc-500">Nome do Vendedor</span>
                      <span className="font-semibold text-white">Fauves</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span className="text-zinc-500">Endereço</span>
                      <span className="text-zinc-400">—</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Memo</span>
                      <span className="text-zinc-400">—</span>
                    </div>
                  </div>
                </div>

                {/* Imposto */}
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Imposto</h3>
                  <p className="text-zinc-500 text-xs leading-normal mb-3">Calcule e adicione impostos sobre os preços dos ingressos.</p>
                  
                  <div className="content-card rounded-card flex items-center justify-between gap-3 text-xs h-[106px] flex-row">
                    <span className="text-zinc-400 leading-normal">Atualize para o Fauves Plus para cobrar impostos.</span>
                    <button className="fauves-button-secondary flex-shrink-0">
                      Saiba mais
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Política de Reembolso */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <h3 className="text-base font-bold text-white">Política de Reembolso</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      A política de reembolso é exibida nas páginas do evento e na 
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-pink-500 hover:text-pink-650 hover:underline mx-1 transition-colors">
                        página de política de reembolso
                      </a>.
                    </p>
                  </div>
                  <button className="fauves-button-secondary">
                    <Plus size={12} />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Empty State: Nenhuma Política de Reembolso */}
                <div className="content-card rounded-card mt-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900/50 flex items-center justify-center text-zinc-550 dark:text-zinc-600">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300">Nenhuma Política de Reembolso</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Informe aos convidados qual é a sua política de reembolso.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Histórico de Vendas */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-white">Histórico de Vendas</h3>
                  <button className="fauves-button-secondary">
                    <Download size={12} />
                    <span>Baixar como CSV</span>
                  </button>
                </div>

                {/* Empty State: Nenhuma Transação */}
                <div className="content-card rounded-card flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900/50 flex items-center justify-center text-zinc-550 dark:text-zinc-600">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300">Nenhuma Transação</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Você não realizou nenhuma venda.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Histórico de Pagamentos */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-white">Histórico de Pagamentos</h3>
                  <button className="fauves-button-secondary">
                    <span>Gerenciar</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>

                {/* Empty State: Sem Pagamentos */}
                <div className="content-card rounded-card flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900/50 flex items-center justify-center text-zinc-550 dark:text-zinc-600">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300">Sem Pagamentos</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Não há pagamentos associados a este calendário.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            )}

            <TabsContent value="insights" className="animate-in fade-in duration-200 text-left font-sans">
              <CalendarInsightsPanel eventCount={events.length} contactCount={members.length} />
            </TabsContent>

            {false && (
            <TabsContent value="insights" className="space-y-8 animate-in fade-in duration-200 text-left font-sans">
              {/* Estatísticas Gerais */}
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                      <Calendar size={13} className="text-zinc-500" />
                      <span>Eventos</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">1</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">0 na semana passada</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                      <Ticket size={13} className="text-zinc-500" />
                      <span>Ingressos</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">0</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">0 na semana passada</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                      <Users size={13} className="text-zinc-500" />
                      <span>Contatos</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">0</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">0 na semana passada</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                      <DollarSign size={13} className="text-zinc-500" />
                      <span>Vendas</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">R$ 0,00</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">R$ 0,00 na semana passada</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-4 leading-normal">
                  <Info size={11} className="text-zinc-500 flex-shrink-0" />
                  <span>Apenas os eventos criados neste calendário são contabilizados nessas estatísticas.</span>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Visualizações de Página */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Visualizações de Página</h3>
                    <p className="text-zinc-500 text-xs mt-1">Veja as visualizações recentes da página do calendário.</p>
                  </div>
                  
                  {/* Dropdown de Período */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowInsightsDropdown(!showInsightsDropdown)}
                      className="fauves-button-secondary"
                    >
                      <Clock size={13} className="text-zinc-400" />
                      <span>
                        {insightsPeriod === '7days' && 'Últimos 7 dias'}
                        {insightsPeriod === '24hours' && 'Últimas 24 horas'}
                        {insightsPeriod === '30days' && 'Últimos 30 dias'}
                      </span>
                      <ChevronRight size={12} className="rotate-90 text-zinc-400" />
                    </button>

                    {showInsightsDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowInsightsDropdown(false)} />
                        <div className="fauves-floating-surface absolute right-0 top-full mt-1.5 border rounded-xl p-1.5 z-50 min-w-[160px]">
                          <button
                            type="button"
                            onClick={() => {
                              setInsightsPeriod('24hours');
                              setShowInsightsDropdown(false);
                            }}
                            className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${insightsPeriod === '24hours' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
                          >
                            Últimas 24 horas
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInsightsPeriod('7days');
                              setShowInsightsDropdown(false);
                            }}
                            className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${insightsPeriod === '7days' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
                          >
                            Últimos 7 dias
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInsightsPeriod('30days');
                              setShowInsightsDropdown(false);
                            }}
                            className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${insightsPeriod === '30days' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
                          >
                            Últimos 30 dias
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card do Gráfico e Detalhes */}
                <div className="content-card rounded-card !p-0 overflow-hidden">
                  {/* Top Area: Chart */}
                  <div className="p-5 border-b border-white/[0.04]">
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: '5 de jul., 00', views: 0 },
                            { name: '6 de jul., 00', views: 0 },
                            { name: '7 de jul., 00', views: 0 },
                            { name: '8 de jul., 00', views: 0 },
                            { name: '9 de jul., 23', views: 1 },
                            { name: '10 de jul., 05', views: 0 },
                            { name: '11 de jul., 00', views: 0 },
                          ]}
                          margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#52525b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            dy={10}
                            ticks={['5 de jul., 00', '7 de jul., 00', '9 de jul., 00', '11 de jul., 00']}
                          />
                          <YAxis 
                            stroke="#52525b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            domain={[0, 1]}
                            ticks={[0, 1]}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-[#121417] border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-xs shadow-xl text-left">
                                    <p className="font-semibold text-zinc-400">{payload[0].payload.name}</p>
                                    <p className="text-pink-500 font-bold mt-0.5">
                                      {payload[0].value} {payload[0].value === 1 ? 'visualização' : 'visualizações'}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                          />
                          <Bar 
                            dataKey="views" 
                            fill="#ec4899" 
                            radius={[3, 3, 0, 0]} 
                            barSize={6}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bottom Area: Metrics Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.04]">
                    {/* Left: Page Views & Traffic */}
                    <div className="p-5 space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-3">Visualizações de Página</h4>
                        <div className="flex gap-10">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">24 horas</span>
                            <span className="text-xl font-bold text-white mt-1 block">0</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">7 dias</span>
                            <span className="text-xl font-bold text-white mt-1 block">1</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">30 dias</span>
                            <span className="text-xl font-bold text-white mt-1 block">1</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-sm font-bold text-white mb-2">Tráfego ao vivo</h4>
                        <p className="text-xs font-semibold text-zinc-300">Nenhuma visualização de página na última hora.</p>
                        <p className="text-xs text-zinc-555 dark:text-zinc-500 mt-1 leading-normal">Comece a compartilhar seu link e você verá o tráfego em tempo real aqui.</p>
                      </div>
                    </div>

                    {/* Right: Sources & Cities */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-2">Fontes</h4>
                        <div className="flex justify-between items-center text-xs mt-1.5">
                          <span className="text-zinc-300 font-medium">Fauves</span>
                          <span className="text-white font-bold">100%</span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <h4 className="text-sm font-bold text-white mb-2">Cidades</h4>
                        <div className="flex justify-between items-center text-xs mt-1.5">
                          <span className="text-zinc-300 font-medium">Fortaleza, Ceará</span>
                          <span className="text-white font-bold">100%</span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/[0.04] mt-3">
                        <h4 className="text-sm font-bold text-white mb-1.5">Fontes UTM</h4>
                        <p className="text-xs text-zinc-555 dark:text-zinc-500 leading-relaxed">
                          Configure um link de rastreamento adicionando ?utm_source=nome-do-seu-link à sua URL.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.04] my-6" />

              {/* Feedback do Evento */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Feedback do Evento</h3>
                  
                  <div className="flex items-center gap-2">
                    {/* Dropdown Feedback */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
                        className="fauves-button-secondary"
                      >
                        <span>{feedbackFilter}</span>
                        <ChevronRight size={12} className="rotate-90 text-zinc-400" />
                      </button>

                      {showFeedbackDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowFeedbackDropdown(false)} />
                          <div className="fauves-floating-surface absolute right-0 top-full mt-1.5 border rounded-xl p-1.5 z-50 min-w-[140px]">
                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackFilter('Por Evento');
                                setShowFeedbackDropdown(false);
                              }}
                              className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${feedbackFilter === 'Por Evento' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
                            >
                              Por Evento
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackFilter('Por Série');
                                setShowFeedbackDropdown(false);
                              }}
                              className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${feedbackFilter === 'Por Série' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
                            >
                              Por Série
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <button className="fauves-button-secondary !px-2" title="Exportar Feedback">
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                {/* Empty State Feedback */}
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative mb-6">
                    {/* Background Card */}
                    <div className="w-[88px] h-[88px] rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col p-3 relative shadow-inner">
                      <div className="w-8 h-2 rounded bg-white/[0.2] mb-2.5" />
                      <div className="w-full h-8 rounded bg-white/[0.08] mb-3" />
                      {/* Grey stars row */}
                      <div className="flex gap-1 justify-center text-white/[0.15]">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/></svg>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/></svg>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/></svg>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/></svg>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/></svg>
                      </div>
                    </div>
                    {/* Floating Glowy Yellow Stars */}
                    <div className="absolute -top-3.5 -left-2 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-1 -right-3 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse" style={{ animationDelay: '300ms' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-base font-semibold text-white">Nenhum Feedback</h4>
                  <p className="text-xs text-zinc-500 mt-1">Nenhum feedback foi coletado para seus eventos.</p>
                </div>
              </div>
            </TabsContent>
            )}

            <TabsContent value="configuracoes" className="calendar-settings-tab-content animate-in fade-in duration-200 text-left font-sans">
              <div className="calendar-settings-layout relative mt-4 flex flex-col items-start gap-5 md:flex-row">
                {/* Left Column: Sticky Sidebar Menu */}
                <div ref={settingsSubTabsRef} role="tablist" aria-label="Configurações do calendário" className="calendar-settings-subtabs w-full shrink-0 space-y-1 md:sticky md:top-[124px] md:w-44">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('exibicao')}
                    role="tab"
                    aria-selected={settingsSubTab === 'exibicao'}
                    data-settings-subtab="exibicao"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'exibicao' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Paintbrush size={14} className="opacity-80" />
                    <span>Exibição</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('opcoes')}
                    role="tab"
                    aria-selected={settingsSubTab === 'opcoes'}
                    data-settings-subtab="opcoes"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'opcoes' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <SlidersHorizontal size={14} className="opacity-80" />
                    <span>Opções</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('administradores')}
                    role="tab"
                    aria-selected={settingsSubTab === 'administradores'}
                    data-settings-subtab="administradores"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'administradores' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Users size={14} className="opacity-80" />
                    <span>Administradores</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('tags')}
                    role="tab"
                    aria-selected={settingsSubTab === 'tags'}
                    data-settings-subtab="tags"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'tags' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Tag size={14} className="opacity-80" />
                    <span>Tags</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('incorporar')}
                    role="tab"
                    aria-selected={settingsSubTab === 'incorporar'}
                    data-settings-subtab="incorporar"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'incorporar' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Globe size={14} className="opacity-80" />
                    <span>Incorporar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('desenvolvedor')}
                    role="tab"
                    aria-selected={settingsSubTab === 'desenvolvedor'}
                    data-settings-subtab="desenvolvedor"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'desenvolvedor' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Code size={14} className="opacity-80" />
                    <span>Desenvolvedor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('limite')}
                    role="tab"
                    aria-selected={settingsSubTab === 'limite'}
                    data-settings-subtab="limite"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'limite' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Clock size={14} className="opacity-80" />
                    <span>Limite de Envio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('plus')}
                    role="tab"
                    aria-selected={settingsSubTab === 'plus'}
                    data-settings-subtab="plus"
                    className={`calendar-settings-subtab flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-[15px] font-semibold transition-colors ${settingsSubTab === 'plus' ? 'is-active text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Heart size={14} className="opacity-80" />
                    <span>Fauves Plus</span>
                  </button>
                </div>

                {/* Right Column: Scrollable Settings Forms */}
                <div className="calendar-settings-content min-w-0 flex-1 space-y-6">
                  {settingsSubTab === 'exibicao' && (
                    <CalendarDisplaySettingsPanel
                      calendar={org || {}}
                      isPersonal={isPersonalCalendar}
                      saving={saving}
                      onSave={saveGeneric}
                    />
                  )}

                  {false && settingsSubTab === 'exibicao' && (
                    <div className="space-y-6">
                      {/* Header Card (Cover & Avatar) */}
                      <div className="rounded-card overflow-hidden relative border border-white/[0.08] bg-white/[0.04] backdrop-blur-md shadow-sm">
                        {/* Cover Container */}
                        <div className="h-32 w-full bg-[#27272a] relative">
                          <button
                            type="button"
                            className="absolute top-4 right-4 fauves-button-secondary text-xs h-7 px-3 bg-white/[0.08] hover:bg-white/[0.12] text-zinc-300 font-bold border border-white/[0.04] rounded-lg"
                          >
                            Alterar Capa
                          </button>
                        </div>

                        {/* Absolute Overlapping Avatar (Calendar Logo) */}
                        <div className="absolute top-[96px] left-4 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#9afdc0] via-[#defd86] to-[#fcf47f] border-2 border-[#121417] flex items-center justify-center z-10 shadow-xl select-none">
                          {/* 8 Dots circle SVG representation */}
                          <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                            <circle cx="20" cy="8" r="2.5" fill="#131517" />
                            <circle cx="28.5" cy="11.5" r="2.5" fill="#131517" />
                            <circle cx="32" cy="20" r="2.5" fill="#131517" />
                            <circle cx="28.5" cy="28.5" r="2.5" fill="#131517" />
                            <circle cx="20" cy="32" r="2.5" fill="#131517" />
                            <circle cx="11.5" cy="28.5" r="2.5" fill="#131517" />
                            <circle cx="8" cy="20" r="2.5" fill="#131517" />
                            <circle cx="11.5" cy="11.5" r="2.5" fill="#131517" />
                          </svg>
                          {/* Pink Upload Badge */}
                          <div className="absolute bottom-[-3px] right-[-3px] w-5 h-5 bg-[#ec4899] text-white rounded-lg flex items-center justify-center shadow-md border border-[#121417] cursor-pointer hover:bg-[#db2777] transition-colors">
                            <ArrowUpRight size={10} className="stroke-[3px]" />
                          </div>
                        </div>

                        {/* Avatar Overlay & Title Area */}
                        <div className="px-4 pb-4 pt-9 relative text-left">
                          {/* Editable title input (looks like normal text) */}
                          <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="text-lg font-bold text-white bg-transparent border-0 outline-none p-0 focus:ring-0 focus:border-0 w-full placeholder-zinc-550 block font-sans"
                            placeholder="Nome do Calendário"
                          />

                          {/* Line Separator */}
                          <div className="border-b border-white/[0.08] my-2.5" />

                          {/* Editable description input */}
                          <input
                            type="text"
                            value={orgDesc}
                            onChange={(e) => setOrgDesc(e.target.value)}
                            className="text-xs text-zinc-400 bg-transparent border-0 outline-none p-0 focus:ring-0 focus:border-0 w-full placeholder-zinc-550 block font-sans"
                            placeholder="Adicione uma descrição curta."
                          />
                        </div>
                      </div>

                      {/* Personalização */}
                      <div className="content-card rounded-card space-y-5 text-left">
                        <h3 className="text-sm font-bold text-white">Personalização</h3>

                        {/* Cor de Destaque */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Cor de destaque</label>
                          <div className="flex flex-wrap gap-3 items-center">
                            {[
                              { color: '#ffffff', active: false },
                              { color: '#ec4899', active: false },
                              { color: '#a855f7', active: false },
                              { color: '#8b5cf6', active: false },
                              { color: '#3b82f6', active: true },
                              { color: '#22c55e', active: false },
                              { color: '#eab308', active: false },
                              { color: '#f97316', active: false },
                              { color: '#ef4444', active: false }
                            ].map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                style={{ backgroundColor: item.color }}
                                className={`w-6.5 h-6.5 rounded-full border-0 cursor-pointer transition-all transform hover:scale-105 ${item.active ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#131517]' : ''}`}
                              />
                            ))}
                            {/* Custom Color Wheel Button */}
                            <button
                              type="button"
                              className="w-6.5 h-6.5 rounded-full border-0 cursor-pointer bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 relative shadow-inner hover:scale-105 transition-transform"
                              title="Seletor de cor personalizada"
                            />
                          </div>
                        </div>

                        {/* URL Pública */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">URL pública</label>
                          <div className="flex rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c0c0e]/80 w-full max-w-[280px]">
                            <span className="bg-white/[0.04] text-zinc-400 text-xs px-3.5 py-2 border-r border-white/[0.08] font-medium flex items-center select-none font-sans">
                              lu.ma/
                            </span>
                            <input
                              type="text"
                              value="fauves"
                              readOnly
                              className="flex-1 bg-transparent px-3 py-2 text-xs font-semibold text-white focus:outline-none font-sans"
                            />
                          </div>
                        </div>

                        {/* Localização */}
                        <div className="space-y-2.5">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Localização</label>
                          
                          {/* Toggle Cidade/Global */}
                          <div className="flex p-0.5 bg-white/[0.03] border border-white/[0.04] rounded-xl w-fit items-center">
                            <button
                              type="button"
                              className="px-4 py-1.5 text-xs font-bold text-zinc-450 rounded-lg border-0 cursor-pointer hover:text-zinc-300 transition-colors bg-transparent"
                            >
                              Cidade
                            </button>
                            <button
                              type="button"
                              className="px-4 py-1.5 text-xs font-bold text-white bg-white/[0.12] rounded-lg border-0 cursor-pointer shadow-sm transition-colors"
                            >
                              Global
                            </button>
                          </div>

                          {/* Map Outline Container (Apple Maps Style) */}
                          <div className="h-44 rounded-xl border border-white/[0.06] overflow-hidden bg-[#1c1c1e] relative group flex items-center justify-center select-none">
                            {/* Grid/Dot representation */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                            
                            {/* Stylized dark maps continents illustration via background SVGs */}
                            <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22><path fill=%22%23ffffff%22 d=%22M150 100h200v100H150zm300 50h150v150H450zM200 250h150v80H200z%22/></svg>')] bg-cover" />
                            
                            {/* Custom geographic text labels matching screenshot */}
                            <span className="absolute top-10 left-[43%] text-[9px] font-bold text-zinc-600 tracking-[0.25em] font-sans">EUROPA</span>
                            <span className="absolute top-5 right-[33%] text-[9px] font-bold text-zinc-650 tracking-[0.25em] font-sans">ÁSIA</span>
                            <span className="absolute bottom-6 left-[38%] text-[9px] font-bold text-zinc-650 tracking-[0.25em] font-sans">ÁFRICA</span>

                            {/* Apple Maps and Legal footer overlays */}
                            <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold bg-zinc-950/40 px-2 py-0.5 rounded">
                              <span className="text-xs"></span>
                              <span className="font-bold">Mapas</span>
                              <span className="text-zinc-600 text-[9px] font-normal ml-1">Legal</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="content-card rounded-card space-y-4">
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase text-zinc-450">Links</h3>

                        <div className="space-y-3.5">
                          {/* Instagram */}
                          <div className="flex rounded-xl border border-white/[0.08] bg-zinc-950/80 items-center pl-3">
                            <Instagram size={14} className="text-zinc-500" />
                            <span className="text-zinc-400 text-xs px-2 py-2.5 font-medium select-none">
                              instagram.com/
                            </span>
                            <input
                              type="text"
                              value="fauvesbr"
                              readOnly
                              className="flex-1 bg-transparent px-1 text-xs font-semibold text-white focus:outline-none"
                            />
                          </div>

                          {/* Twitter / X */}
                          <div className="flex rounded-xl border border-white/[0.08] bg-zinc-950/80 items-center pl-3">
                            <Share2 size={14} className="text-zinc-500" />
                            <span className="text-zinc-400 text-xs px-2 py-2.5 font-medium select-none">
                              x.com/
                            </span>
                            <input
                              type="text"
                              value="fauves"
                              readOnly
                              className="flex-1 bg-transparent px-1 text-xs font-semibold text-white focus:outline-none"
                            />
                          </div>

                          {/* YouTube */}
                          <div className="flex rounded-xl border border-white/[0.08] bg-zinc-950/80 items-center pl-3">
                            <Youtube size={14} className="text-zinc-500" />
                            <span className="text-zinc-450 text-xs px-2 py-2.5 font-medium select-none">
                              youtube.com/@
                            </span>
                            <input
                              type="text"
                              placeholder="nome de usuário"
                              readOnly
                              className="flex-1 bg-transparent px-1 text-xs font-semibold text-zinc-500 focus:outline-none placeholder-zinc-650"
                            />
                          </div>

                          {/* TikTok */}
                          <div className="flex rounded-xl border border-white/[0.08] bg-zinc-950/80 items-center pl-3">
                            <Share2 size={14} className="text-zinc-500" />
                            <span className="text-zinc-450 text-xs px-2 py-2.5 font-medium select-none">
                              tiktok.com/@
                            </span>
                            <input
                              type="text"
                              placeholder="nome de usuário"
                              readOnly
                              className="flex-1 bg-transparent px-1 text-xs font-semibold text-zinc-500 focus:outline-none placeholder-zinc-650"
                            />
                          </div>

                          {/* LinkedIn */}
                          <div className="flex rounded-xl border border-white/[0.08] bg-zinc-950/80 items-center pl-3">
                            <Users size={14} className="text-zinc-500" />
                            <span className="text-zinc-400 text-xs px-2 py-2.5 font-medium select-none">
                              linkedin.com/
                            </span>
                            <input
                              type="text"
                              value="in/fauves"
                              readOnly
                              className="flex-1 bg-transparent px-1 text-xs font-semibold text-white focus:outline-none"
                            />
                          </div>

                          {/* Website */}
                          <div className="flex rounded-xl border border-white/[0.08] bg-zinc-950/80 items-center pl-3">
                            <Globe size={14} className="text-zinc-500" />
                            <input
                              type="text"
                              value="https://fauves.com.br"
                              readOnly
                              className="flex-1 bg-transparent px-3 py-2.5 text-xs font-semibold text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Compartilhamento */}
                      <div className="content-card rounded-card space-y-4">
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase text-zinc-450">Compartilhamento</h3>

                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-zinc-450 uppercase block">Imagem de Prévia Social</label>

                          <div className="border-2 border-dashed border-white/[0.08] rounded-2xl bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.04] transition-colors relative group min-h-[160px]">
                            <ImagePlus size={32} className="text-zinc-500 mb-3 group-hover:text-zinc-300 transition-colors" />
                            <span className="text-xs text-zinc-300 font-bold">Arraste & Solte ou Clique Aqui</span>
                            <div className="absolute bottom-3 right-3 p-1.5 bg-[#121417]/85 border border-white/[0.06] rounded-lg text-zinc-500">
                              <ImagePlus size={13} />
                            </div>
                          </div>

                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Você pode usar imagens de qualquer tamanho. Para melhores resultados, escolha uma proporção de aspecto próxima a 1,91:1.
                          </p>
                        </div>
                      </div>

                      {/* Floating Save Actions Bar */}
                      <div className="pt-2 flex justify-start">
                        <button className="bg-white hover:bg-white/90 text-[#121417] text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md border-0">
                          <Check size={14} className="stroke-[2.5px]" />
                          <span>Salvar Alterações</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'opcoes' && (
                    <CalendarOptionsSettingsPanel
                      calendarId={org?.id}
                      isPersonal={isPersonalCalendar}
                      onOpenFauvesPlus={() => setSettingsSubTab('plus')}
                      onRequestDelete={() => setEditModal('delete')}
                    />
                  )}

                  {false && settingsSubTab === 'opcoes' && (
                    <div className="space-y-6 text-left animate-in fade-in duration-250">
                      {/* Padrões de Evento Title Section */}
                      <div>
                        <h2 className="text-xl font-bold text-white leading-snug">Padrões de Evento</h2>
                        <p className="text-xs text-zinc-450 mt-1">Configurações padrão para novos eventos criados neste calendário.</p>
                      </div>

                      {/* Padrões de Evento Card */}
                      <div className="content-card rounded-card space-y-4">
                        {/* Visibilidade do Evento */}
                        <div className="flex justify-between items-center py-1">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white text-xs">Visibilidade do Evento</p>
                            <p className="text-zinc-500 text-[11px]">Se os eventos são exibidos na página do calendário.</p>
                          </div>
                          <button className="fauves-button-secondary text-xs flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg h-7 font-bold text-zinc-300">
                            <span>Público</span>
                            <ChevronRight size={10} className="rotate-90 text-zinc-400" />
                          </button>
                        </div>

                        <div className="border-t border-white/[0.04]" />

                        {/* Lista Pública de Convidados */}
                        <div className="flex justify-between items-center py-1">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white text-xs">Lista Pública de Convidados</p>
                            <p className="text-zinc-505 text-[11px]">Se deve exibir a lista de convidados nas páginas de eventos.</p>
                          </div>
                          {/* Toggle switch active (green) */}
                          <div className="w-10 h-5 bg-[#34c759] rounded-full p-0.5 flex items-center justify-end cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                          </div>
                        </div>

                        <div className="border-t border-white/[0.04]" />

                        {/* Coletar Feedback */}
                        <div className="flex justify-between items-center py-1">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white text-xs">Coletar Feedback</p>
                            <p className="text-zinc-505 text-[11px]">Envie um e-mail para os convidados após o evento para coletar feedback.</p>
                          </div>
                          {/* Toggle switch inactive (grey) */}
                          <div className="w-10 h-5 bg-[#27272a] rounded-full p-0.5 flex items-center justify-start cursor-pointer border border-[#3f3f46]">
                            <div className="w-4 h-4 bg-[#71717a] rounded-full shadow-md" />
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[95%]">
                        Alterar esses padrões não afeta os eventos existentes. Você sempre pode alterar essas configurações para cada evento individualmente.
                      </p>

                      <div className="border-t border-white/[0.04] my-6" />

                      {/* Rastreamento Section */}
                      <div>
                        <h2 className="text-xl font-bold text-white leading-snug">Rastreamento</h2>
                        <p className="text-xs text-zinc-400 mt-1">Acompanhe inscrições em eventos e conversões de anúncios do Google ou Meta.</p>
                      </div>

                      {/* Rastreamento Card */}
                      <div className="content-card rounded-card flex justify-between items-center p-4">
                        <p className="text-xs text-zinc-300 max-w-[70%] leading-relaxed font-semibold">
                          Faça upgrade para o Fauves Plus para integrar com anúncios do Google ou Meta.
                        </p>
                        <button className="fauves-button-secondary text-xs h-7 px-3 bg-white/[0.08] hover:bg-white/[0.12] text-zinc-300 font-bold border border-white/[0.04] rounded-lg">
                          Saiba mais
                        </button>
                      </div>

                      <div className="border-t border-white/[0.04] my-6" />

                      {/* Status do Calendário Section */}
                      <div>
                        <h2 className="text-xl font-bold text-white leading-snug">Status do Calendário</h2>
                        <p className="text-xs text-zinc-400 mt-1">Marque o calendário como em breve ou arquive-o se não estiver mais ativo.</p>
                      </div>

                      {/* Status do Calendário Card */}
                      <div className="content-card rounded-card space-y-4">
                        <div className="flex items-start gap-3">
                          {/* Green Calendar Icon container */}
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-500 text-xs">Ativo</p>
                            <p className="text-zinc-500 text-[11px] mt-0.5 leading-normal">
                              O calendário está ativo e aceitando assinaturas e envios de eventos.
                            </p>
                          </div>
                        </div>
                        <button className="fauves-button-secondary text-xs h-7 px-3 bg-white/[0.08] hover:bg-white/[0.12] text-zinc-300 font-bold border border-white/[0.04] rounded-lg flex items-center gap-1.5">
                          <SlidersHorizontal size={12} />
                          <span>Alterar Status</span>
                        </button>
                      </div>

                      <div className="border-t border-white/[0.04] my-6" />

                      {/* Excluir Calendário Permanentemente Button */}
                      <div className="pt-2 flex justify-start">
                        <button className="text-red-500 hover:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-0 bg-transparent">
                          <Trash2 size={14} />
                          <span>Excluir Calendário Permanentemente</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'administradores' && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="pb-4 text-left">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-[20px] font-bold leading-7 tracking-[-0.02em] text-white">Administradores</h2>
                        <button
                          type="button"
                          onClick={() => setIsAddAdminOpen(true)}
                          className="flex h-[31px] shrink-0 items-center gap-1.5 self-start rounded-lg border-0 bg-white/[0.10] px-3 text-[14px] font-semibold text-zinc-400 transition-colors hover:bg-white/[0.15] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                          <Plus size={14} strokeWidth={2} />
                          <span>Adicionar Admin</span>
                        </button>
                        </div>
                        <p className="mt-0.5 text-[16px] font-medium leading-6 text-zinc-300">Admins têm acesso total ao calendário e podem aprovar eventos.</p>
                      </div>

                      <div className="mt-5 overflow-visible rounded-xl border border-white/10 bg-[#202224]">
                        {loadingAdmins ? (
                          <div className="flex min-h-[69px] items-center justify-center text-zinc-500" role="status">
                            <Loader2 size={18} className="animate-spin" />
                            <span className="sr-only">Carregando administradores</span>
                          </div>
                        ) : adminLoadError ? (
                          <div className="flex min-h-[112px] flex-col items-center justify-center gap-3 px-6 py-5 text-center">
                            <p className="text-sm text-zinc-400">{adminLoadError}</p>
                            <button type="button" onClick={loadAdmins} className="text-sm font-semibold text-white underline underline-offset-4">
                              Tentar novamente
                            </button>
                          </div>
                        ) : admins.length === 0 ? (
                          <div className="px-6 py-8 text-center text-sm text-zinc-500">Nenhum administrador encontrado.</div>
                        ) : (
                          <div className="divide-y divide-white/10">
                            {admins.map((admin) => {
                              const actionLabel = admin.isCurrentUser
                                ? 'Sair'
                                : admin.isOwner
                                  ? 'Proprietário'
                                  : 'Remover';
                              const isRemoving = removingAdminId === admin.userId;
                              const isOnlyAdmin = admins.length === 1;
                              return (
                                <div key={admin.userId} className="flex min-h-[52px] items-center gap-3 px-4 py-2">
                                  {admin.photoUrl ? (
                                    <img src={admin.photoUrl} alt="" className="h-[22px] w-[22px] shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                                  ) : (
                                    <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-400 text-zinc-700 ring-1 ring-white/20">
                                      <UserRound size={12} strokeWidth={1.8} />
                                    </div>
                                  )}

                                  <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                    <span className="truncate text-[16px] font-semibold text-white">
                                      {admin.name?.trim().split(/\s+/)[0] || 'Anônimo'}
                                    </span>
                                    <span className="truncate text-[14px] font-semibold text-zinc-500">{admin.email}</span>
                                  </div>

                                  {isOnlyAdmin ? (
                                    <span className="h-8 w-8 shrink-0" aria-hidden="true" />
                                  ) : (
                                    <div className="group relative shrink-0">
                                      <button
                                        type="button"
                                        aria-label={actionLabel}
                                        disabled={(admin.isOwner && !admin.isCurrentUser) || Boolean(removingAdminId)}
                                        onClick={() => handleRemoveAdmin(admin)}
                                        className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-default disabled:opacity-55"
                                      >
                                        {isRemoving ? <Loader2 size={17} className="animate-spin" /> : <UserRoundMinus size={18} strokeWidth={1.8} />}
                                      </button>
                                      <span
                                        role="tooltip"
                                        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[13px] font-medium text-[#17191b] opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                      >
                                        {actionLabel}
                                        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {isAddAdminOpen && (
                        <div className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/65 p-3 font-sans backdrop-blur-[2px]" onMouseDown={closeAddAdminModal}>
                          <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="add-admin-title"
                            className="fauves-modal-surface relative w-full max-w-[342px] rounded-[20px] border p-5 text-left text-white shadow-[0_30px_90px_rgba(0,0,0,0.65)] animate-in fade-in zoom-in-95 duration-200"
                            onMouseDown={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={closeAddAdminModal}
                              disabled={addingAdmins}
                              aria-label="Fechar"
                              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                            >
                              <X size={20} />
                            </button>

                            <div className="mb-[15px] flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-zinc-300">
                              <div className="relative">
                                <UserCircle2 size={30} strokeWidth={1.7} />
                                <span className="absolute -bottom-1 -right-1 rounded-full bg-[#303235] p-1 ring-2 ring-[#1b1d1f]">
                                  <Settings size={11} className="text-zinc-300" />
                                </span>
                              </div>
                            </div>

                            <h3 id="add-admin-title" className="pr-10 text-[21px] font-bold leading-[27px] tracking-[-0.025em] text-white">Adicionar Administradores</h3>
                            <p className="mt-1 text-[14px] font-semibold leading-5 text-zinc-300">
                              Adicione administradores inserindo seus endereços de e-mail. Eles não precisam ter uma conta Fauves existente.
                            </p>

                            <div className="mt-4 w-full space-y-3">
                              <textarea
                                autoFocus
                                value={adminEmails}
                                onChange={(event) => {
                                  setAdminEmails(event.target.value);
                                  if (adminFormError) setAdminFormError('');
                                }}
                                onKeyDown={(event) => {
                                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') handleAddAdmins();
                                }}
                                rows={2}
                                placeholder="Cole ou insira e-mails aqui"
                                aria-describedby={adminFormError ? 'admin-email-error' : undefined}
                                className="min-h-[54px] w-full resize-none rounded-lg border border-white/10 bg-[#151719] px-3 py-2.5 text-[14px] font-semibold leading-5 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white/35"
                              />
                              {adminFormError && (
                                <p id="admin-email-error" role="alert" className="text-sm text-red-400">{adminFormError}</p>
                              )}
                              <button
                                type="button"
                                onClick={handleAddAdmins}
                                disabled={addingAdmins || !splitAdminEmails(adminEmails).length}
                                className="flex h-[39px] w-full items-center justify-center gap-2 rounded-lg border-0 bg-white px-4 text-[16px] font-medium text-[#17191b] transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {addingAdmins && <Loader2 size={18} className="animate-spin" />}
                                {addingAdmins ? 'Adicionando...' : 'Adicionar Administradores'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {settingsSubTab === 'tags' && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="pb-4 text-left">
                      {calendarTagLoadError && (
                        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
                          <p className="text-sm font-semibold text-red-300">{calendarTagLoadError}</p>
                          <button type="button" onClick={loadCalendarTags} className="shrink-0 border-0 bg-transparent text-sm font-semibold text-white hover:text-zinc-300">Tentar novamente</button>
                        </div>
                      )}

                      <section>
                        <div className="flex items-start justify-between gap-5">
                          <div className="min-w-0">
                            <h2 className="text-[20px] font-bold leading-7 text-white">Tags do Evento</h2>
                            <p className="mt-0.5 text-[16px] font-medium leading-6 text-zinc-300">Permite que visitantes filtrem eventos por categorias na página do calendário.</p>
                          </div>
                          <button type="button" onClick={() => openCreateTagEditor('event')} className="inline-flex h-[31px] shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.08] px-3 text-[14px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.12] hover:text-white">
                            <Plus size={14} /> Criar Tag
                          </button>
                        </div>

                        <div className="mt-5 overflow-visible rounded-xl border border-white/10 bg-[#202224]">
                          {loadingCalendarTags ? (
                            <div className="flex min-h-[56px] items-center gap-3 px-4"><span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" /><span className="h-4 w-24 animate-pulse rounded bg-white/10" /></div>
                          ) : calendarTags.filter((tag) => tag.type === 'event').length ? (
                            calendarTags.filter((tag) => tag.type === 'event').map((tag, index, list) => (
                              <div key={tag.id} className={`flex min-h-[56px] items-center justify-between gap-4 px-4 py-2 ${index < list.length - 1 ? 'border-b border-white/10' : ''}`}>
                                <div className="flex min-w-0 items-center gap-2.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} /><span className="truncate text-[16px] font-semibold text-white">{tag.name}</span></div>
                                <div className="flex shrink-0 items-center gap-3">
                                  <span className="text-[14px] font-semibold text-zinc-500">{tag.usageCount} {tag.usageCount === 1 ? 'Evento' : 'Eventos'}</span>
                                  <div className="relative">
                                    <button type="button" aria-label={`Ações para ${tag.name}`} onClick={() => setOpenCalendarTagMenuId((current) => current === tag.id ? null : tag.id)} className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-zinc-500 transition-colors hover:text-white"><MoreHorizontal size={18} /></button>
                                    {openCalendarTagMenuId === tag.id && (
                                      <><button type="button" aria-label="Fechar menu" className="fixed inset-0 z-10 cursor-default border-0 bg-transparent" onClick={() => setOpenCalendarTagMenuId(null)} /><div className="fauves-floating-surface absolute right-0 top-9 z-20 w-[154px] rounded-xl border p-1.5 shadow-2xl"><button type="button" onClick={() => openEditTagEditor(tag)} className="flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-lg border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-white hover:bg-white/[0.07]"><PenLine size={15} className="shrink-0 text-zinc-400" /> Editar Tag</button><button type="button" onClick={() => { setCalendarTagPendingDelete(tag); setOpenCalendarTagMenuId(null); }} className="flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-lg border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-white hover:bg-white/[0.07]"><Trash2 size={15} className="shrink-0 text-zinc-400" /> Excluir Tag</button></div></>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex min-h-[78px] items-center gap-3 px-4 py-3"><Tag size={25} className="shrink-0 text-zinc-600" /><div><p className="text-[15px] font-semibold text-zinc-400">Sem tags</p><p className="text-[14px] font-medium leading-5 text-zinc-500">Crie categorias para organizar e filtrar seus eventos.</p></div></div>
                          )}
                        </div>
                      </section>

                      <div className="my-8 border-t border-white/10" />

                      <section>
                        <div className="flex items-start justify-between gap-5">
                          <div className="min-w-0">
                            <h2 className="text-[20px] font-bold leading-7 text-white">Tags de Membros</h2>
                            <p className="mt-0.5 text-[16px] font-medium leading-6 text-zinc-300">Organize seu público com tags de membros. Essas tags são visíveis apenas para administradores.</p>
                          </div>
                          <button type="button" onClick={() => openCreateTagEditor('member')} className="inline-flex h-[31px] shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.08] px-3 text-[14px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.12] hover:text-white">
                            <Plus size={14} /> Criar Tag
                          </button>
                        </div>

                        <div className="mt-5 overflow-visible rounded-xl border border-white/10 bg-[#202224]">
                          {loadingCalendarTags ? (
                            <div className="flex min-h-[56px] items-center gap-3 px-4"><span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" /><span className="h-4 w-24 animate-pulse rounded bg-white/10" /></div>
                          ) : calendarTags.filter((tag) => tag.type === 'member').length ? (
                            calendarTags.filter((tag) => tag.type === 'member').map((tag, index, list) => (
                              <div key={tag.id} className={`flex min-h-[56px] items-center justify-between gap-4 px-4 py-2 ${index < list.length - 1 ? 'border-b border-white/10' : ''}`}>
                                <div className="flex min-w-0 items-center gap-2.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} /><span className="truncate text-[16px] font-semibold text-white">{tag.name}</span></div>
                                <div className="flex shrink-0 items-center gap-3">
                                  <span className="text-[14px] font-semibold text-zinc-500">{tag.usageCount} {tag.usageCount === 1 ? 'Membro' : 'Membros'}</span>
                                  <div className="relative">
                                    <button type="button" aria-label={`Ações para ${tag.name}`} onClick={() => setOpenCalendarTagMenuId((current) => current === tag.id ? null : tag.id)} className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-zinc-500 transition-colors hover:text-white"><MoreHorizontal size={18} /></button>
                                    {openCalendarTagMenuId === tag.id && (
                                      <><button type="button" aria-label="Fechar menu" className="fixed inset-0 z-10 cursor-default border-0 bg-transparent" onClick={() => setOpenCalendarTagMenuId(null)} /><div className="fauves-floating-surface absolute right-0 top-9 z-20 w-[154px] rounded-xl border p-1.5 shadow-2xl"><button type="button" onClick={() => openEditTagEditor(tag)} className="flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-lg border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-white hover:bg-white/[0.07]"><PenLine size={15} className="shrink-0 text-zinc-400" /> Editar Tag</button><button type="button" onClick={() => { setCalendarTagPendingDelete(tag); setOpenCalendarTagMenuId(null); }} className="flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-lg border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-white hover:bg-white/[0.07]"><Trash2 size={15} className="shrink-0 text-zinc-400" /> Excluir Tag</button></div></>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex min-h-[78px] items-center gap-3 px-4 py-3"><Tag size={25} className="shrink-0 text-zinc-600" /><div><p className="text-[15px] font-semibold text-zinc-400">Sem tags</p><p className="text-[14px] font-medium leading-5 text-zinc-500">Marque membros para organizá-los e se comunicar com eles.</p></div></div>
                          )}
                        </div>
                      </section>

                      <AnimatePresence>
                        {isTagEditorOpen && (
                          <motion.div className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/65 p-3 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={closeTagEditor}>
                            <motion.div role="dialog" aria-modal="true" aria-labelledby="tag-editor-title" className="fauves-modal-surface relative w-full max-w-[342px] rounded-[20px] border p-5 text-left text-white shadow-[0_30px_90px_rgba(0,0,0,0.65)]" initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.975, y: 6 }} onMouseDown={(event) => event.stopPropagation()}>
                              <div className="mb-[15px] flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-zinc-300"><Tag size={29} className="rotate-[18deg]" strokeWidth={1.8} /></div>
                              <h3 id="tag-editor-title" className="text-[21px] font-bold leading-7 text-white">{editingCalendarTag ? 'Editar Tag' : `Criar Tag de ${tagEditorType === 'event' ? 'Evento' : 'Membro'}`}</h3>
                              <p className="mt-2 text-[14px] font-medium leading-[21px] text-zinc-300">
                                {editingCalendarTag
                                  ? 'Atualize o nome ou a cor usada para identificar esta tag.'
                                  : tagEditorType === 'event'
                                    ? 'As tags de eventos permitem que os visitantes do calendário filtrem eventos por categoria.'
                                    : 'Tags de membros são visíveis apenas para administradores do calendário.'}
                              </p>
                              <div className="mt-5 space-y-4">
                                <div><label htmlFor="calendar-tag-name" className="mb-1.5 block text-[15px] font-semibold text-white">Nome</label><input id="calendar-tag-name" autoFocus maxLength={40} value={calendarTagName} onChange={(event) => { setCalendarTagName(event.target.value); if (calendarTagFormError) setCalendarTagFormError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') void handleSaveCalendarTag(); }} className="h-[38px] w-full rounded-lg border border-white bg-[#151719] px-3 text-[14px] font-semibold text-white outline-none transition-colors focus:border-white" /></div>
                                <div><span className="mb-2 block text-[15px] font-semibold text-zinc-300">Cor</span><div className="grid grid-cols-8 gap-2">{TAG_COLORS.map((option) => <button key={option.color} type="button" aria-label={option.name} title={option.name} onClick={() => setCalendarTagColor(option.color)} className="flex h-7 w-7 items-center justify-center rounded-full border-0 transition-transform hover:scale-105" style={{ backgroundColor: option.color }}>{calendarTagColor === option.color && <span className="h-3 w-3 rounded-full bg-white" />}</button>)}</div></div>
                                {calendarTagFormError && <p role="alert" className="text-sm font-medium text-red-400">{calendarTagFormError}</p>}
                                <button type="button" onClick={() => void handleSaveCalendarTag()} disabled={savingCalendarTag || !calendarTagName.trim()} className="flex h-[39px] w-full items-center justify-center gap-2 rounded-lg border-0 bg-white px-4 text-[16px] font-medium text-[#17191b] transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">{savingCalendarTag && <Loader2 size={17} className="animate-spin" />}{savingCalendarTag ? 'Salvando...' : editingCalendarTag ? 'Salvar' : 'Criar'}</button>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}

                        {calendarTagPendingDelete && (
                          <motion.div className="fixed inset-0 z-[100021] flex items-center justify-center bg-black/65 p-3 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !deletingCalendarTag && setCalendarTagPendingDelete(null)}>
                            <motion.div role="alertdialog" aria-modal="true" className="fauves-modal-surface w-full max-w-[342px] rounded-[20px] border p-5 text-left text-white shadow-[0_30px_90px_rgba(0,0,0,0.65)]" initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.975, y: 6 }} onMouseDown={(event) => event.stopPropagation()}>
                              <div className="mb-[15px] flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10 text-red-300"><Trash2 size={25} /></div>
                              <h3 className="text-[21px] font-bold leading-7">Excluir “{calendarTagPendingDelete.name}”?</h3>
                              <p className="mt-1.5 text-[14px] font-medium leading-5 text-zinc-400">A tag será removida de todos os {calendarTagPendingDelete.type === 'event' ? 'eventos' : 'membros'} em que estiver sendo usada.</p>
                              <div className="mt-5 flex gap-2"><button type="button" disabled={deletingCalendarTag} onClick={() => setCalendarTagPendingDelete(null)} className="h-[39px] flex-1 rounded-lg border border-white/10 bg-white/[0.06] text-[15px] font-semibold text-white hover:bg-white/[0.1] disabled:opacity-40">Cancelar</button><button type="button" disabled={deletingCalendarTag} onClick={() => void handleDeleteCalendarTag()} className="flex h-[39px] flex-1 items-center justify-center gap-2 rounded-lg border-0 bg-red-500 text-[15px] font-semibold text-white hover:bg-red-400 disabled:opacity-40">{deletingCalendarTag && <Loader2 size={16} className="animate-spin" />}Excluir</button></div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {settingsSubTab === 'incorporar' && (
                    <div className="space-y-5 text-left animate-in fade-in duration-250">
                      <div>
                        <h2 className="text-[20px] font-bold leading-7 text-white">Incorporar Eventos</h2>
                        <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-400">Tem seu próprio site? Incorpore seu calendário para compartilhar facilmente uma visualização ao vivo dos seus próximos eventos.</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#1c1e20] p-4 sm:p-5">
                        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-10 items-center rounded-xl bg-white/[0.07] p-1" role="group" aria-label="Tema do calendário incorporado">
                              {([
                                { value: 'system' as const, label: 'Automático', icon: <span className="flex h-[18px] w-[18px] overflow-hidden rounded-full border-2 border-current"><span className="h-full w-1/2 bg-current" /></span> },
                                { value: 'light' as const, label: 'Claro', icon: <Sun size={19} /> },
                                { value: 'dark' as const, label: 'Escuro', icon: <Moon size={19} /> },
                              ]).map((option) => (
                                <button key={option.value} type="button" title={option.label} aria-label={option.label} aria-pressed={embedTheme === option.value} onClick={() => setEmbedTheme(option.value)} className={`flex h-8 w-11 items-center justify-center rounded-lg border-0 transition-colors ${embedTheme === option.value ? 'bg-white/15 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}>{option.icon}</button>
                              ))}
                            </div>

                            <div className="flex h-10 items-center rounded-xl bg-white/[0.07] p-1" role="group" aria-label="Layout do calendário incorporado">
                              <button type="button" title="Cartões" aria-label="Layout em cartões" aria-pressed={embedLayout === 'cards'} onClick={() => setEmbedLayout('cards')} className={`flex h-8 w-11 items-center justify-center rounded-lg border-0 transition-colors ${embedLayout === 'cards' ? 'bg-white/15 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}><LayoutPanelTop size={19} /></button>
                              <button type="button" title="Lista" aria-label="Layout em lista" aria-pressed={embedLayout === 'list'} onClick={() => setEmbedLayout('list')} className={`flex h-8 w-11 items-center justify-center rounded-lg border-0 transition-colors ${embedLayout === 'list' ? 'bg-white/15 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}><List size={20} /></button>
                            </div>
                          </div>

                          <div ref={embedFilterRef} className="relative w-full lg:w-[250px]">
                            <button type="button" aria-haspopup="listbox" aria-expanded={embedFilterOpen} onClick={() => setEmbedFilterOpen((open) => !open)} className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-[#131517] px-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white/20">
                              <span className="truncate">{selectedEmbedTag?.name || 'Todos os Eventos'}</span><ChevronDown size={17} className={`shrink-0 text-zinc-500 transition-transform ${embedFilterOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {embedFilterOpen && (
                              <div role="listbox" className="fauves-floating-surface absolute right-0 top-12 z-30 w-full rounded-xl border p-1.5 shadow-2xl">
                                <button type="button" role="option" aria-selected={embedTagId === 'all'} onClick={() => { setEmbedTagId('all'); setEmbedFilterOpen(false); }} className={`flex h-10 w-full items-center justify-between rounded-lg border-0 px-3 text-left text-[15px] font-semibold text-white ${embedTagId === 'all' ? 'bg-white/[0.08]' : 'bg-transparent hover:bg-white/[0.06]'}`}><span>Todos os Eventos</span>{embedTagId === 'all' && <Check size={17} />}</button>
                                {embedEventTags.map((tag) => (
                                  <button key={tag.id} type="button" role="option" aria-selected={embedTagId === tag.id} onClick={() => { setEmbedTagId(tag.id); setEmbedFilterOpen(false); }} className={`flex h-10 w-full items-center justify-between rounded-lg border-0 px-3 text-left text-[15px] font-semibold text-white ${embedTagId === tag.id ? 'bg-white/[0.08]' : 'bg-transparent hover:bg-white/[0.06]'}`}><span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} /><span className="truncate">{tag.name}</span></span>{embedTagId === tag.id && <Check size={17} />}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <CalendarEmbedPreview
                          events={events}
                          tags={embedEventTags}
                          selectedTagId={embedTagId}
                          theme={embedTheme}
                          layout={embedLayout}
                          organizationName={org?.name || 'Organizador'}
                          organizationLogoUrl={org?.logoUrl || org?.image || org?.avatarUrl}
                          managerMode
                          minHeight={440}
                          onEventAction={(event) => navigate(`/event/manage/${event.id}`)}
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <div className="flex items-center justify-between gap-4">
                          <label className="block text-[16px] font-semibold text-zinc-300">Código para Copiar</label>
                          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(embedCode); setEmbedCopied(true); window.setTimeout(() => setEmbedCopied(false), 1800); } catch { toast({ variant: 'destructive', title: 'Não foi possível copiar o código' }); } }} className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-[13px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.09] hover:text-white">{embedCopied ? <Check size={15} /> : <Copy size={15} />}{embedCopied ? 'Copiado' : 'Copiar'}</button>
                        </div>
                        <pre className="max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-[#202224] p-4 font-mono text-[13px] leading-5"><code>
                          <span className="text-[#b7bec9]">&lt;</span><span className="text-[#f07178]">iframe</span>{'\n  '}
                          <span className="text-[#dfa15f]">src</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;{embedSource}&quot;</span>{'\n  '}
                          <span className="text-[#dfa15f]">width</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;600&quot;</span>{'\n  '}
                          <span className="text-[#dfa15f]">height</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;450&quot;</span>{'\n  '}
                          <span className="text-[#dfa15f]">frameborder</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;0&quot;</span>{'\n  '}
                          <span className="text-[#dfa15f]">style</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;<span className="text-[#b7bec9]">border: 1px solid #bfcbda88; border-radius: 4px;</span>&quot;</span>{'\n  '}
                          <span className="text-[#dfa15f]">allowfullscreen</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;&quot;</span>{'\n  '}
                          <span className="text-[#dfa15f]">aria-hidden</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;false&quot;</span>{'\n  '}
                          <span className="text-[#dfa15f]">tabindex</span><span className="text-[#b7bec9]">=</span><span className="text-[#91c46c]">&quot;0&quot;</span>{'\n'}
                          <span className="text-[#b7bec9]">&gt;&lt;/</span><span className="text-[#f07178]">iframe</span><span className="text-[#b7bec9]">&gt;</span>
                        </code></pre>
                        <p className="text-[14px] font-medium leading-5 text-zinc-500">Você pode alterar os atributos <code className="font-mono text-zinc-400">width</code> e <code className="font-mono text-zinc-400">height</code> acima para ajustar ao tamanho da sua página.</p>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'desenvolvedor' && (
                    <div className="animate-in fade-in duration-250 text-left">
                      <section>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-[20px] font-bold leading-7 text-white">Chaves de API</h2>
                            <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-400">Use a <span className="text-pink-400">Fauves API</span> ou integre com o Zapier.</p>
                          </div>
                          <div className="relative shrink-0">
                            <button type="button" aria-label="Mais opções de desenvolvedor" aria-expanded={developerMenuOpen} onClick={() => setDeveloperMenuOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-white/[0.08] text-zinc-400 transition-colors hover:text-white"><MoreHorizontal size={18} /></button>
                            {developerMenuOpen && (
                              <>
                                <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-10 cursor-default border-0 bg-transparent" onClick={() => setDeveloperMenuOpen(false)} />
                                <div className="fauves-floating-surface absolute right-0 top-11 z-20 w-[190px] rounded-xl border p-1.5 shadow-2xl">
                                  <button type="button" onClick={() => void copyCalendarIdentifier()} className="flex h-9 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-white hover:bg-white/[0.07]"><Copy size={15} className="text-zinc-400" />Copiar ID do calendário</button>
                                  <button type="button" onClick={() => { setDeveloperMenuOpen(false); setSettingsSubTab('plus'); }} className="flex h-9 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 text-left text-[14px] font-semibold text-white hover:bg-white/[0.07]"><Heart size={15} className="text-zinc-400" />Conhecer Fauves Plus</button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 flex min-h-[84px] items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.045] px-5 py-4">
                          <KeyRound size={34} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
                          <div className="min-w-0">
                            <p className="text-[16px] font-semibold leading-5 text-zinc-400">Nenhuma chave de API</p>
                            <p className="mt-1 text-[14px] font-medium leading-5 text-zinc-500">Faça upgrade para <button type="button" onClick={() => setSettingsSubTab('plus')} className="border-0 bg-transparent p-0 font-semibold text-pink-400 hover:text-pink-300">Fauves Plus</button> para criar chaves de API.</p>
                          </div>
                        </div>
                      </section>

                      <div className="my-7 border-t border-white/[0.08]" />

                      <section>
                        <h2 className="text-[20px] font-bold leading-7 text-white">Webhooks</h2>
                        <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-400">Receba notificações em tempo real sobre as atividades no seu calendário.</p>
                        <div className="mt-5 flex min-h-[84px] items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.045] px-5 py-4">
                          <Webhook size={34} strokeWidth={1.8} className="shrink-0 text-zinc-600" />
                          <div className="min-w-0">
                            <p className="text-[16px] font-semibold leading-5 text-zinc-400">Nenhum webhook</p>
                            <p className="mt-1 text-[14px] font-medium leading-5 text-zinc-500">Faça upgrade para <button type="button" onClick={() => setSettingsSubTab('plus')} className="border-0 bg-transparent p-0 font-semibold text-pink-400 hover:text-pink-300">Fauves Plus</button> para criar webhooks.</p>
                          </div>
                        </div>
                      </section>

                      <div className="mb-5 mt-7 border-t border-white/[0.08]" />
                      <div className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-zinc-500">
                        <span>ID do Calendário:</span>
                        <button type="button" title="Copiar ID do calendário" onClick={() => void copyCalendarIdentifier()} className="rounded-md border-0 bg-white/[0.09] px-2 py-1 font-mono text-[13px] text-zinc-400 transition-colors hover:bg-white/[0.13] hover:text-white">{calendarIdCopied ? 'Copiado!' : `cal-${targetOrganizationId || ''}`}</button>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'limite' && (
                    <div className="animate-in fade-in duration-250 text-left">
                      <h2 className="text-[20px] font-bold leading-7 text-white">Limite de Envio</h2>
                      <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-400">Seu calendário tem uma cota semanal para envio de convites e newsletters. Ela é redefinida toda segunda-feira.</p>

                      <div className="mt-5 flex flex-col gap-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-4 py-4 text-amber-300 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <BadgeCheck size={21} fill="currentColor" className="mt-0.5 shrink-0 text-amber-300" />
                          <div>
                            <p className="text-[16px] font-bold leading-5">Por favor, verifique seu calendário.</p>
                            <p className="mt-1 text-[14px] font-medium leading-5">Compartilhe informações sobre seu calendário para obter limites maiores de convites e newsletters.</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => toast({ title: 'Verificação do calendário', description: 'A solicitação de verificação será disponibilizada em breve.' })} className="flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-amber-300 bg-transparent px-3.5 text-[14px] font-bold text-amber-300 transition-colors hover:bg-amber-300/10 sm:self-center">Verificar <ArrowRight size={16} /></button>
                      </div>

                      <div className="mt-7">
                        <div className="flex items-end justify-between gap-4 text-zinc-500">
                          <p><span className="text-[28px] font-medium leading-none">0</span> <span className="text-[14px] font-semibold">Usados</span></p>
                          <p><span className="text-[28px] font-medium leading-none">15</span> <span className="text-[14px] font-semibold">/ 15 Restantes</span></p>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.09]"><div className="h-full w-0 rounded-full bg-pink-500" /></div>
                      </div>

                      <section className="mt-7">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-[16px] font-bold text-zinc-300">Uso</h3>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <button type="button" aria-label="Semana anterior" onClick={() => setUsageWeekOffset((offset) => offset - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-white/[0.07] transition-colors hover:bg-white/[0.11] hover:text-white"><ChevronLeft size={17} /></button>
                            <span className="min-w-[92px] text-center text-[14px] font-semibold">{usageWeekOffset === 0 ? 'Esta Semana' : usageWeekOffset === -1 ? 'Semana Passada' : `${Math.abs(usageWeekOffset)} semanas atrás`}</span>
                            <button type="button" aria-label="Próxima semana" disabled={usageWeekOffset === 0} onClick={() => setUsageWeekOffset((offset) => Math.min(0, offset + 1))} className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-white/[0.07] transition-colors hover:bg-white/[0.11] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={17} /></button>
                          </div>
                        </div>

                        <div className="mt-4 flex min-h-[88px] items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.045] px-5 py-4">
                          <Mail size={31} strokeWidth={1.7} className="shrink-0 text-zinc-600" />
                          <div>
                            <p className="text-[16px] font-semibold leading-5 text-zinc-400">Nenhum uso {usageWeekOffset === 0 ? 'esta semana' : 'nesta semana'}</p>
                            <p className="mt-1 text-[14px] font-medium leading-5 text-zinc-500">Você não enviou nada nesse período que conte para sua cota.</p>
                          </div>
                        </div>
                      </section>

                      <div className="my-7 text-zinc-700" aria-hidden="true"><svg width="92" height="10" viewBox="0 0 92 10" fill="none"><path d="M1 4.5c4.5 0 4.5 4 9 4s4.5-4 9-4 4.5 4 9 4 4.5-4 9-4 4.5 4 9 4 4.5-4 9-4 4.5 4 9 4 4.5-4 9-4 4.5 4 9 4 4.5-4 9-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></div>

                      <div className="space-y-4 text-[14px] font-medium leading-6 text-zinc-400">
                        <p>Apenas convites de eventos e newsletters enviados pela Fauves estão sujeitos à cota. Você sempre terá:</p>
                        <ul className="space-y-1.5">
                          <li className="flex items-start gap-2"><Check size={18} className="mt-0.5 shrink-0 text-zinc-300" /><span>Número ilimitado de convidados por evento</span></li>
                          <li className="flex items-start gap-2"><Check size={18} className="mt-0.5 shrink-0 text-zinc-300" /><span>Lembretes e posts ilimitados para os convidados do evento</span></li>
                        </ul>
                        <p>Newsletters agendadas contam para a cota da semana em que são enviadas.</p>
                      </div>

                      <div className="my-7 text-zinc-700" aria-hidden="true"><svg width="92" height="10" viewBox="0 0 92 10" fill="none"><path d="M1 4.5c4.5 0 4.5 4 9 4s4.5-4 9-4 4.5 4 9 4 4.5-4 9-4 4.5 4 9 4 4.5-4 9-4 4.5 4 9 4 4.5-4 9-4 4.5 4 9 4 4.5-4 9-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></div>

                      <section>
                        <h3 className="text-[20px] font-bold leading-7 text-white">Precisa de mais envios?</h3>
                        <p className="mt-1 text-[16px] font-medium leading-6 text-zinc-400">Seu calendário atualmente tem 15 envios por semana.</p>
                        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.035]">
                          <div className="flex items-center justify-between gap-4 px-4 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <BadgeCheck size={24} className="shrink-0 text-zinc-500" />
                              <div><p className="text-[16px] font-semibold text-white">Verificar Calendário</p><p className="mt-0.5 text-[14px] font-medium leading-5 text-zinc-500">Verifique para aumentar seu limite semanal para 500</p></div>
                            </div>
                            <button type="button" onClick={() => toast({ title: 'Verificação do calendário', description: 'A solicitação de verificação será disponibilizada em breve.' })} className="h-9 shrink-0 rounded-lg border-0 bg-white px-3.5 text-[14px] font-semibold text-[#17191b] transition-colors hover:bg-zinc-200">Verificar</button>
                          </div>
                          <div className="ml-[52px] border-t border-white/[0.09]" />
                          <div className="flex items-center justify-between gap-4 px-4 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <Sparkles size={24} className="shrink-0 text-zinc-500" />
                              <div><p className="text-[16px] font-semibold text-white">Faça upgrade para o Fauves Plus</p><p className="mt-0.5 text-[14px] font-medium leading-5 text-zinc-500">Tenha de 5.000 a 100.000 envios por semana</p></div>
                            </div>
                            <button type="button" onClick={() => setSettingsSubTab('plus')} className="h-9 shrink-0 rounded-lg border-0 bg-white px-3.5 text-[14px] font-semibold text-[#17191b] transition-colors hover:bg-zinc-200">Upgrade</button>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {settingsSubTab === 'plus' && (
                    <div className="calendar-plus-panel animate-in fade-in duration-250 overflow-hidden rounded-[14px] border border-white/[0.1] bg-[#1c1e20] text-left">
                      <div className="p-5">
                        <div className="calendar-plus-header flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold leading-5 text-zinc-500">Fazer upgrade para</p>
                            <h2 className="text-[22px] font-bold leading-7 text-[#EF4118]">Fauves Plus</h2>
                          </div>

                          <div className="calendar-plus-billing flex w-fit shrink-0 rounded-[10px] bg-white/[0.08] p-1" role="group" aria-label="Período de cobrança">
                            <button
                              type="button"
                              aria-pressed={plusBillingCycle === 'monthly'}
                              onClick={() => setPlusBillingCycle('monthly')}
                              className={`h-8 rounded-lg border-0 px-3.5 text-[13px] font-bold transition-colors ${plusBillingCycle === 'monthly' ? 'bg-white/[0.18] text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                              Mensal
                            </button>
                            <button
                              type="button"
                              aria-pressed={plusBillingCycle === 'annual'}
                              onClick={() => setPlusBillingCycle('annual')}
                              className={`h-8 rounded-lg border-0 px-3.5 text-[13px] font-bold transition-colors ${plusBillingCycle === 'annual' ? 'bg-white/[0.18] text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                              Anual
                            </button>
                          </div>
                        </div>

                        <div className="calendar-plus-price mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
                          <span className="text-[48px] font-medium leading-none tracking-[-0.04em] text-white sm:text-[54px]">R$ {plusBillingCycle === 'annual' ? '299' : '349'}</span>
                          {plusBillingCycle === 'annual' ? (
                            <div className="flex flex-col items-start gap-1 pb-0.5">
                              <span className="rounded-full bg-[#31C72D] px-2.5 py-0.5 text-[11px] font-bold leading-5 text-white">Economize 14%</span>
                              <span className="text-[14px] font-semibold leading-5 text-zinc-500">Por mês, cobrado anualmente</span>
                            </div>
                          ) : (
                            <span className="pb-0.5 text-[14px] font-semibold text-zinc-500">Por mês</span>
                          )}
                        </div>

                        <ul className="calendar-plus-features mt-6 space-y-2.5 text-[15px] font-semibold text-zinc-100">
                          <li className="flex items-center gap-2.5"><Check size={17} strokeWidth={2.4} className="shrink-0 text-[#EF4118]" />Sem taxas de plataforma</li>
                          <li className="flex items-center gap-2.5"><Check size={17} strokeWidth={2.4} className="shrink-0 text-[#EF4118]" />Suporte prioritário</li>
                          <li className="flex items-center gap-2.5"><Check size={17} strokeWidth={2.4} className="shrink-0 text-[#EF4118]" />5 administradores incluídos</li>
                        </ul>

                        <button
                          type="button"
                          onClick={openPlusCheckout}
                          className="calendar-plus-cta mt-6 flex h-11 w-full items-center justify-center rounded-[10px] border-0 bg-[#EF4118] px-5 text-[15px] font-bold text-white transition-colors hover:bg-[#D63814]"
                        >
                          Fazer upgrade para o Fauves Plus
                        </button>

                        <div className="mt-4 flex items-center justify-between gap-4 text-[13px] font-semibold">
                          <span className="text-zinc-500">Administradores adicionais</span>
                          <span className="shrink-0 text-zinc-200">R$ 59 / mês</span>
                        </div>
                      </div>

                      <div className="border-t border-white/[0.09] px-2 pb-2 pt-4">
                        <h3 className="px-3 pb-4 text-[16px] font-bold text-zinc-500">Benefícios do <span className="text-[#EF4118]">Fauves Plus</span></h3>
                        <div className="calendar-plus-benefits-grid grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-white/[0.08]">
                          <div className="calendar-plus-benefit relative flex min-h-[158px] flex-col justify-between overflow-hidden bg-[#222426] p-4">
                            <img src={plusZeroFeeIllustration} alt="" aria-hidden="true" className="h-[74px] w-[88px] max-w-none object-contain" />
                            <p className="mt-3 text-[14px] font-semibold leading-5 text-white"><span className="mr-1 text-zinc-600 line-through">5%</span> 0% de taxa de plataforma<sup className="ml-1 text-[9px] text-zinc-400">1</sup></p>
                          </div>

                          <div className="calendar-plus-benefit relative flex min-h-[158px] flex-col justify-between overflow-hidden bg-[#222426] p-4">
                            <img src={plusWeeklyInvitesIllustration} alt="" aria-hidden="true" className="h-[82px] w-[61px] max-w-none object-contain" />
                            <p className="mt-3 text-[14px] font-semibold leading-5 text-white"><span className="mr-1 text-zinc-600 line-through">500</span> 5.000 convites por semana<sup className="ml-1 text-[9px] text-zinc-400">2</sup></p>
                          </div>

                          <div className="calendar-plus-benefit relative flex min-h-[158px] flex-col justify-between overflow-hidden bg-[#222426] p-4">
                            <img src={plusPrioritySupportIllustration} alt="" aria-hidden="true" className="h-[80px] w-[87px] max-w-none object-contain" />
                            <p className="mt-3 text-[14px] font-semibold leading-5 text-white">Suporte prioritário</p>
                          </div>

                          <div className="calendar-plus-benefit relative flex min-h-[158px] flex-col justify-between overflow-hidden bg-[#222426] p-4">
                            <img src={plusApiAccessIllustration} alt="" aria-hidden="true" className="h-[78px] w-[78px] max-w-none object-contain" />
                            <p className="mt-3 text-[14px] font-semibold leading-5 text-white">Acesso à API + Zapier</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* MODAIS DE EDIÇÃO */}
            <EditIdentityModal open={editModal === 'identity'} onOpenChange={() => setEditModal(null)} initialName={org?.name} initialSlug={org?.slug} onSave={saveGeneric} loading={saving} />

            <AnimatePresence>
              {isPlusCheckoutOpen && (
                <motion.div
                  className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-[3px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setIsPlusCheckoutOpen(false);
                  }}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="plus-checkout-title"
                    initial={{ opacity: 0, scale: 0.975, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.985, y: 6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="relative my-auto max-h-[calc(100vh-24px)] w-[460px] max-w-full overflow-y-auto rounded-[15px] border border-white/[0.09] bg-[#181a1c]/[0.86] text-left text-white backdrop-blur-2xl"
                  >
                    <button
                      type="button"
                      aria-label="Fechar pagamento"
                      onClick={() => setIsPlusCheckoutOpen(false)}
                      className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-white"
                    >
                      <X size={14} />
                    </button>

                    <form onSubmit={(event) => { event.preventDefault(); submitPlusCheckout(); }}>
                      <div className="p-4">
                        <div className="flex items-center gap-2.5 pr-8">
                          <img src={plusSubscribeIllustration} alt="" aria-hidden="true" className="h-10 w-10 shrink-0" />
                          <h2 id="plus-checkout-title" className="text-[18px] font-bold leading-[22px] text-white">Faça upgrade para o Fauves Plus</h2>
                        </div>

                        <label htmlFor="plus-calendar" className="mt-4 block text-[12px] font-bold text-zinc-400">Selecionar calendário</label>
                        <div className="relative mt-1">
                          <button
                            id="plus-calendar"
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={plusCalendarDropdownOpen}
                            onClick={() => setPlusCalendarDropdownOpen((open) => !open)}
                            className="flex h-10 w-full items-center rounded-[9px] border border-white/[0.1] bg-black/20 py-0 pl-2.5 pr-9 text-left text-[13px] font-semibold text-white outline-none backdrop-blur-md transition-colors hover:bg-white/[0.045] focus:border-white/25"
                          >
                            <span className="mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#EF4118] text-white">
                              {plusCheckoutOrganization?.logoUrl ? <img src={resolveImageUrl(plusCheckoutOrganization.logoUrl) || ''} alt="" className="h-full w-full object-cover" /> : <Sparkles size={13} />}
                            </span>
                            <span className="truncate">{plusCheckoutOrganization?.name || 'Selecionar calendário'}</span>
                            <ChevronDown size={17} className={`absolute right-3.5 text-zinc-500 transition-transform ${plusCalendarDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {plusCalendarDropdownOpen && (
                            <>
                              <button type="button" aria-label="Fechar lista de calendários" className="fixed inset-0 z-20 cursor-default border-0 bg-transparent" onClick={() => setPlusCalendarDropdownOpen(false)} />
                              <div role="listbox" aria-label="Calendários" className="absolute left-0 right-0 top-[calc(100%+7px)] z-30 overflow-hidden rounded-xl border border-white/[0.11] bg-[#252729]/85 p-1.5 backdrop-blur-2xl">
                                {orgs.map((organization) => {
                                  const selected = organization.id === plusCheckoutOrganizationId;
                                  return (
                                    <button
                                      key={organization.id}
                                      type="button"
                                      role="option"
                                      aria-selected={selected}
                                      onClick={() => {
                                        setPlusCheckoutOrganizationId(organization.id);
                                        setPlusCalendarDropdownOpen(false);
                                        setPlusCheckoutError('');
                                      }}
                                      className={`flex h-10 w-full items-center rounded-lg border-0 px-2.5 text-left text-[14px] font-semibold transition-colors ${selected ? 'bg-white/[0.11] text-white' : 'bg-transparent text-zinc-300 hover:bg-white/[0.07] hover:text-white'}`}
                                    >
                                      <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#EF4118] text-white">
                                        {organization.logoUrl ? <img src={resolveImageUrl(organization.logoUrl) || ''} alt="" className="h-full w-full object-cover" /> : <Sparkles size={13} />}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate">{organization.name}</span>
                                      {selected && <Check size={15} className="ml-3 shrink-0 text-white" strokeWidth={2.5} />}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>

                        <fieldset className="mt-4">
                          <legend className="text-[12px] font-bold text-zinc-400">Frequência de cobrança</legend>
                          <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => setPlusBillingCycle('monthly')}
                              className={`relative min-h-[58px] rounded-[9px] border px-2.5 py-2 text-left transition-colors ${plusBillingCycle === 'monthly' ? 'border-white/40 bg-white/[0.09]' : 'border-white/[0.09] bg-white/[0.035] hover:border-white/20'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ${plusBillingCycle === 'monthly' ? 'bg-white text-[#181a1c]' : 'border border-zinc-600'}`}>{plusBillingCycle === 'monthly' && <Check size={12} strokeWidth={3} />}</span>
                                <span className="text-[13px] font-bold text-white">Mensal</span>
                              </div>
                              <p className="ml-[26px] text-[11px] font-semibold text-zinc-500">R$ 349/mês</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPlusBillingCycle('annual')}
                              className={`relative min-h-[58px] rounded-[9px] border px-2.5 py-2 text-left transition-colors ${plusBillingCycle === 'annual' ? 'border-white/40 bg-white/[0.09]' : 'border-white/[0.09] bg-white/[0.035] hover:border-white/20'}`}
                            >
                              <div className="flex items-center gap-2 pr-10">
                                <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${plusBillingCycle === 'annual' ? 'bg-white text-[#181a1c]' : 'border border-zinc-600'}`}>{plusBillingCycle === 'annual' && <Check size={12} strokeWidth={3} />}</span>
                                <span className="text-[13px] font-bold text-white">Anual</span>
                              </div>
                              <span className="absolute right-2 top-2 rounded-full bg-[#31C72D] px-1.5 py-0 text-[8px] font-bold leading-4 text-white">-14%</span>
                              <p className="ml-[26px] text-[11px] font-semibold text-zinc-400"><span className="mr-1 text-zinc-600 line-through">R$ 4.188</span> R$ 3.588/ano</p>
                            </button>
                          </div>
                        </fieldset>
                      </div>

                      <div className="border-t border-white/[0.08] p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                          <p><span className="text-[20px] font-semibold tracking-[-0.025em] text-white">{plusCheckoutAmountLabel}</span><span className="ml-1.5 text-[11px] font-semibold text-zinc-500">Hoje</span></p>
                          <button type="button" onClick={() => setPlusCouponOpen((open) => !open)} className="border-0 bg-transparent p-0 text-[12px] font-bold text-[#EF4118] hover:text-[#ff6745]">Adicionar cupom</button>
                        </div>

                        {plusCouponOpen && (
                          <div className="mt-3 flex gap-2">
                            <input value={plusCouponCode} onChange={(event) => setPlusCouponCode(event.target.value.toUpperCase())} placeholder="Código do cupom" className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.12] bg-black/20 px-3 text-[14px] font-semibold uppercase text-white outline-none backdrop-blur-md focus:border-white/30" />
                            <button type="button" onClick={() => toast({ title: plusCouponCode.trim() ? 'Cupom adicionado' : 'Informe um cupom', description: plusCouponCode.trim() ? 'O cupom será validado ao processar a assinatura.' : 'Digite o código antes de aplicar.' })} className="h-10 rounded-lg border border-white/[0.12] bg-white/[0.08] px-4 text-[13px] font-bold text-white hover:bg-white/[0.12]">Aplicar</button>
                          </div>
                        )}

                        <label htmlFor="plus-card-number" className="mt-3.5 block text-[12px] font-bold text-zinc-400">Cartão de crédito ou débito *</label>
                        <div className="mt-1 flex h-10 items-center overflow-hidden rounded-[9px] border border-white/[0.1] bg-black/20 backdrop-blur-md focus-within:border-white/25">
                          <div className="pl-3.5 text-zinc-600"><Wallet size={18} /></div>
                          <input
                            id="plus-card-number"
                            value={plusCardNumber}
                            onChange={(event) => handlePlusCardNumberChange(event.target.value)}
                            placeholder="Número do cartão"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[14px] font-semibold text-white outline-none placeholder:text-zinc-600"
                          />
                          <input
                            value={plusCardExpiry}
                            onChange={(event) => handlePlusCardExpiryChange(event.target.value)}
                            placeholder="MM / AA"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            className="h-full w-[76px] border-0 bg-transparent px-1.5 text-center text-[12px] font-semibold text-white outline-none placeholder:text-zinc-600"
                          />
                          <input
                            value={plusCardCvc}
                            onChange={(event) => { setPlusCardCvc(event.target.value.replace(/\D/g, '').slice(0, 4)); setPlusCheckoutError(''); }}
                            placeholder="CVC"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            type="password"
                            className="h-full w-[56px] border-0 bg-transparent px-1.5 text-center text-[12px] font-semibold text-white outline-none placeholder:text-zinc-600"
                          />
                        </div>

                        {plusCheckoutError && <p role="alert" className="mt-2 text-[13px] font-semibold text-red-400">{plusCheckoutError}</p>}

                        <button type="submit" className="mt-3 h-10 w-full rounded-[9px] border-0 bg-[#EF4118] text-[13px] font-bold text-white transition-colors hover:bg-[#D63814]">Pagar com cartão</button>
                        <button type="button" onClick={() => toast({ title: 'Apple Pay', description: 'Apple Pay estará disponível quando o checkout de assinaturas for conectado.' })} className="mt-2 h-10 w-full rounded-[9px] border-0 bg-white text-[16px] font-semibold text-black transition-colors hover:bg-zinc-200"><span className="mr-1 text-[19px]"></span>Pay</button>

                        <p className="mx-auto mt-2.5 max-w-[390px] text-center text-[10px] font-medium leading-[14px] text-zinc-500">Os pagamentos do Fauves Plus não são reembolsáveis. Você pode cancelar sua assinatura a qualquer momento.</p>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
            {isCreateTierOpen && (
              <motion.div
                className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => setIsCreateTierOpen(false)}
              >
                <motion.div
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.975, y: 7 }}
                  transition={{ type: 'spring', damping: 27, stiffness: 330 }}
                  className="bg-[#191a1b] text-white rounded-[18px] border border-white/[0.06] w-[342px] max-w-full flex flex-col shadow-2xl relative p-5"
                >
                  <AnimatePresence mode="wait" initial={false}>
                  {createTierStep === 1 ? (
                    /* STEP 1: Basic Information */
                    <motion.div key="membership-details" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.16, ease: 'easeOut' }}>
                      {/* Header */}
                      <div className="flex justify-between items-start w-full mb-3">
                        <div className="w-14 h-14 rounded-full bg-white/[0.09] border border-white/10 flex items-center justify-center text-zinc-200 shadow-sm shrink-0">
                          <Gem size={27} />
                        </div>
                        <button
                          type="button"
                          aria-label="Fechar"
                          onClick={() => setIsCreateTierOpen(false)}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-all border-0 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="text-left mb-3">
                        <h3 className="text-[21px] font-bold text-white tracking-tight">Criar Membership</h3>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-2">Nome</label>
                          <input
                            type="text"
                            placeholder="Membro Fundador"
                            value={newTierName}
                            onChange={e => setNewTierName(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm font-semibold placeholder-zinc-650 text-white focus:outline-none focus:border-zinc-700 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-2">Descrição</label>
                          <textarea
                            placeholder="Compartilhe os requisitos ou benefícios da associação..."
                            value={newTierDescription}
                            onChange={e => setNewTierDescription(e.target.value)}
                            rows={3}
                            className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm font-semibold placeholder-zinc-650 text-white focus:outline-none focus:border-zinc-700 transition-all resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-2">Cor</label>
                          <div className="flex gap-1.5 flex-wrap mt-2 items-center">
                            {[
                              '#ec4899', // Pink
                              '#a855f7', // Purple
                              '#6366f1', // Violet
                              '#3b82f6', // Blue
                              '#22c55e', // Green
                              '#eab308', // Yellow
                              '#f97316', // Orange
                              '#ef4444', // Red
                              'linear-gradient(45deg, #f43f5e, #3b82f6, #10b981)' // Rainbow
                            ].map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setNewTierColor(c)}
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: c,
                                  border: 'none',
                                  outline: 'none',
                                  cursor: 'pointer',
                                  boxShadow: newTierColor === c ? `0 0 0 2px #121417, 0 0 0 4px ${c.startsWith('linear') ? '#ec4899' : c}` : 'none',
                                  margin: '2px'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* STEP 2: Access & Pricing */
                    <motion.div key="membership-pricing" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16, ease: 'easeOut' }}>
                      {/* Header */}
                      <div className="flex items-center justify-between w-full mb-6 relative">
                        <button
                          type="button"
                          onClick={() => setCreateTierStep(1)}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer border-0"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <h3 className="text-lg font-bold text-white tracking-tight absolute left-1/2 transform -translate-x-1/2">
                          Acesso e Preços
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsCreateTierOpen(false)}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer border-0"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-4 text-left">
                        {/* Toggle switch: Requer Aprovação */}
                        <div className="flex items-center justify-between bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60 select-none">
                          <span className="text-zinc-300 text-xs font-bold">Requer Aprovação</span>
                          <FauvesSwitch checked={newTierRequiresApproval} onCheckedChange={setNewTierRequiresApproval} label="Requer aprovação para a assinatura" />
                        </div>

                        {/* Dropdown Select Prices */}
                        <div ref={priceDropdownRef} className="space-y-2 relative">
                          <label className="block text-xs font-bold text-zinc-300">Preços</label>
                          <button
                            type="button"
                            onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
                            className="w-full h-11 px-4 rounded-xl border border-zinc-800 bg-[#0d0e11] text-sm font-semibold text-white flex items-center justify-between cursor-pointer focus:outline-none focus:border-zinc-700 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              {newTierPriceType === 'Free' && <Gift className="w-4 h-4 text-zinc-400" />}
                              {newTierPriceType === 'OneTime' && <DollarSign className="w-4 h-4 text-zinc-400" />}
                              {newTierPriceType === 'Monthly' && <Calendar className="w-4 h-4 text-zinc-400" />}
                              {newTierPriceType === 'Annual' && <Calendar className="w-4 h-4 text-zinc-400" />}
                              <span>
                                {newTierPriceType === 'Free' && 'Gratuito'}
                                {newTierPriceType === 'OneTime' && 'Pagamento Único'}
                                {newTierPriceType === 'Monthly' && 'Assinatura Mensal'}
                                {newTierPriceType === 'Annual' && 'Assinatura Anual'}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 rotate-90 text-zinc-500" />
                          </button>
                          
                          <AnimatePresence>
                          {isPriceDropdownOpen && (
                            <motion.div
                              className="fauves-floating-surface absolute top-full left-0 w-full origin-top border rounded-xl mt-1.5 z-[9999] p-1 max-h-[220px] overflow-y-auto"
                              initial={{ opacity: 0, scale: 0.96, y: -6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.97, y: -4 }}
                              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                            >
                              {[
                                { key: 'Free', label: 'Gratuito', icon: <Gift className="w-4 h-4" /> },
                                { key: 'OneTime', label: 'Pagamento Único', icon: <DollarSign className="w-4 h-4" /> },
                                { key: 'Monthly', label: 'Assinatura Mensal', icon: <Calendar className="w-4 h-4" /> },
                                { key: 'Annual', label: 'Assinatura Anual', icon: <Calendar className="w-4 h-4" /> }
                              ].map(item => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => {
                                    setNewTierPriceType(item.key as any);
                                    setIsPriceDropdownOpen(false);
                                  }}
                                  className="w-full text-left bg-transparent text-white border-0 rounded-lg py-2.5 px-3 flex items-center justify-between cursor-pointer text-sm font-semibold hover:bg-zinc-800/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    {item.icon}
                                    <span>{item.label}</span>
                                  </div>
                                  {newTierPriceType === item.key && <Check className="w-4 h-4 text-white" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                          </AnimatePresence>
                        </div>

                        {/* Prices Input details */}
                        {newTierPriceType === 'OneTime' && (
                          <div className="flex items-center justify-between gap-4 mt-2">
                            <label className="text-xs font-bold text-zinc-300">Preço</label>
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 w-[160px]">
                              <input
                                type="text"
                                value={newTierPriceOneTime}
                                onChange={e => setNewTierPriceOneTime(Number(e.target.value.replace(/\D/g, '')))}
                                style={{
                                  flex: 1,
                                  background: 'transparent',
                                  border: 'none',
                                  outline: 'none',
                                  color: '#fff',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  textAlign: 'right',
                                  width: '100%',
                                  margin: 0,
                                  padding: 0,
                                  boxShadow: 'none'
                                }}
                                className="focus:ring-0 focus:outline-none"
                              />
                              <span className="text-zinc-500 text-xs font-bold pl-2 border-l border-zinc-800/60 select-none">BRL</span>
                            </div>
                          </div>
                        )}

                        {newTierPriceType === 'Monthly' && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between gap-4">
                              <label className="text-xs font-bold text-zinc-300">Por Mês</label>
                              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 w-[160px]">
                                <input
                                  type="text"
                                  value={newTierPriceMonthly}
                                  onChange={e => setNewTierPriceMonthly(Number(e.target.value.replace(/\D/g, '')))}
                                  style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textAlign: 'right',
                                    width: '100%',
                                    margin: 0,
                                    padding: 0,
                                    boxShadow: 'none'
                                  }}
                                  className="focus:ring-0 focus:outline-none"
                                />
                                <span className="text-zinc-500 text-xs font-bold pl-2 border-l border-zinc-800/60 select-none">BRL</span>
                              </div>
                            </div>

                            {newTierHasAnnualPrice && (
                              <div className="flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-bold text-zinc-300">Por Ano</label>
                                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 w-[160px]">
                                  <input
                                    type="text"
                                    value={newTierPriceAnnual}
                                    onChange={e => setNewTierPriceAnnual(Number(e.target.value.replace(/\D/g, '')))}
                                    style={{
                                      flex: 1,
                                      background: 'transparent',
                                      border: 'none',
                                      outline: 'none',
                                      color: '#fff',
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      textAlign: 'right',
                                      width: '100%',
                                      margin: 0,
                                      padding: 0,
                                      boxShadow: 'none'
                                    }}
                                    className="focus:ring-0 focus:outline-none"
                                  />
                                  <span className="text-zinc-500 text-xs font-bold pl-2 border-l border-zinc-800/60 select-none">BRL</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <button
                                type="button"
                                onClick={() => setNewTierHasAnnualPrice(!newTierHasAnnualPrice)}
                                className="text-xs text-zinc-400 hover:text-white font-bold cursor-pointer border-0 bg-transparent p-0 mt-1"
                              >
                                {newTierHasAnnualPrice ? '— Remover Preço Anual' : '+ Adicionar Preço Anual'}
                              </button>
                            </div>
                          </div>
                        )}

                        {newTierPriceType === 'Annual' && (
                          <div className="flex items-center justify-between gap-4 mt-2">
                            <label className="text-xs font-bold text-zinc-300">Preço Anual</label>
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 h-11 w-[160px]">
                              <input
                                type="text"
                                value={newTierPriceAnnual}
                                onChange={e => setNewTierPriceAnnual(Number(e.target.value.replace(/\D/g, '')))}
                                style={{
                                  flex: 1,
                                  background: 'transparent',
                                  border: 'none',
                                  outline: 'none',
                                  color: '#fff',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  textAlign: 'right',
                                  width: '100%',
                                  margin: 0,
                                  padding: 0,
                                  boxShadow: 'none'
                                }}
                                className="focus:ring-0 focus:outline-none"
                              />
                              <span className="text-zinc-500 text-xs font-bold pl-2 border-l border-zinc-800/60 select-none">BRL</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Submit/Next Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (createTierStep === 1) {
                        setCreateTierStep(2);
                      } else {
                        let priceStr = 'Grátis';
                        if (newTierPriceType === 'OneTime') {
                          priceStr = `R$ ${newTierPriceOneTime}`;
                        } else if (newTierPriceType === 'Monthly') {
                          priceStr = `R$ ${newTierPriceMonthly}/mês` + (newTierHasAnnualPrice ? ` ou R$ ${newTierPriceAnnual}/ano` : '');
                        } else if (newTierPriceType === 'Annual') {
                          priceStr = `R$ ${newTierPriceAnnual}/ano`;
                        }

                        const added = [
                          ...membershipTiers,
                          {
                            name: newTierName || 'Plano Sem Nome',
                            color: newTierColor,
                            priceType: newTierPriceType,
                            price: priceStr,
                            requiresApproval: newTierRequiresApproval,
                            description: newTierDescription
                          }
                        ];
                        saveTiers(added);
                        setIsCreateTierOpen(false);
                      }
                    }}
                    className="h-11 w-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl transition-all text-sm flex items-center justify-center border-0 cursor-pointer shadow-sm mt-6"
                  >
                    {createTierStep === 1 ? 'Próximo' : 'Criar'}
                  </button>
                </motion.div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Modal: Adicionar Membro */}
            {isAddMemberOpen && (
              <div
                className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
                onClick={() => setIsAddMemberOpen(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#121417] text-white rounded-2xl border border-zinc-800/80 w-[360px] max-w-full flex flex-col shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start w-full mb-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-200 shadow-sm shrink-0">
                      <UserPlus size={20} />
                    </div>
                    <button
                      type="button"
                      aria-label="Fechar"
                      onClick={() => setIsAddMemberOpen(false)}
                      className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-all border-0 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="text-left mb-5">
                    <h3 className="text-lg font-bold text-white tracking-tight">Adicionar Pessoa</h3>
                    <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                      {isPersonalCalendar
                        ? 'Adicione uma pessoa manualmente ao seu calendário.'
                        : 'Adicione uma pessoa manualmente e defina o plano de associação dela.'}
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">Nome</label>
                      <input
                        type="text"
                        placeholder="Ex: João Silva"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm font-semibold placeholder-zinc-650 text-white focus:outline-none focus:border-zinc-700 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="Ex: joao.silva@gmail.com"
                        value={newMemberEmail}
                        onChange={e => setNewMemberEmail(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm font-semibold placeholder-zinc-650 text-white focus:outline-none focus:border-zinc-700 transition-all"
                      />
                    </div>

                    {!isPersonalCalendar && <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">Plano de Assinatura (Membro de)</label>
                      <select
                        value={newMemberTier}
                        onChange={e => setNewMemberTier(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-800 bg-[#0d0e11] text-sm font-semibold text-white focus:outline-none focus:border-zinc-700 transition-all"
                      >
                        {membershipTiers.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!newMemberName.trim() || !newMemberEmail.trim()) return;
                      const activeTier = isPersonalCalendar ? '' : (newMemberTier || (membershipTiers[0]?.name || 'Acesso Total'));
                      const tierObj = membershipTiers.find(t => t.name === activeTier);
                      let revenueVal = 0;
                      if (tierObj?.priceType === 'Subscription' || tierObj?.priceType === 'OneTime') {
                        const parsed = parseFloat(tierObj.price.replace(/[^\d]/g, ''));
                        revenueVal = isNaN(parsed) ? 29 : parsed;
                      }
                      const added = [
                        ...members,
                        {
                          name: newMemberName,
                          email: newMemberEmail,
                          tier: isPersonalCalendar ? null : activeTier,
                          joinedAt: new Date().toISOString().split('T')[0],
                          revenue: revenueVal,
                          eventsCount: 0,
                          checkedInCount: 0
                        }
                      ];
                      saveMembers(added);
                      setIsAddMemberOpen(false);
                    }}
                    className="h-11 w-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl transition-all text-sm flex items-center justify-center border-0 cursor-pointer shadow-sm mt-6"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <Dialog open={editModal === 'about'} onOpenChange={() => setEditModal(null)}>
              <DialogContent className="bg-[#181a1f] border-zinc-800 text-white sm:max-w-[500px]">
                <DialogHeader><DialogTitle className="text-white text-xl">Sobre a Organização</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Descrição Curta (Bio)</Label>
                    <Input value={tempData.description || ''} onChange={e => setTempData({...tempData, description: e.target.value})} maxLength={120} className="bg-[#121316] border-zinc-800 text-white" placeholder="Uma frase que define você" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Bio Completa</Label>
                    <Textarea value={tempData.bio || ''} onChange={e => setTempData({...tempData, bio: e.target.value})} rows={4} className="bg-[#121316] border-zinc-800 text-white" placeholder="Conte mais sobre sua trajetória..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-[#252830]" onClick={() => setEditModal(null)}>Cancelar</Button>
                  <Button className="bg-[#2A2AD7] hover:bg-[#1e1eb8] text-white" onClick={() => saveGeneric({ bio: tempData.bio, description: tempData.description })} disabled={saving}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editModal === 'visuals'} onOpenChange={() => setEditModal(null)}>
              <DialogContent className="bg-[#181a1f] border-zinc-800 text-white">
                <DialogHeader><DialogTitle className="text-white text-xl">Identidade Visual</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="space-y-2">
                      <Label className="text-zinc-400">URL do Logo</Label>
                      <Input value={tempData.logoUrl || ''} onChange={e => setTempData({...tempData, logoUrl: e.target.value})} className="bg-[#121316] border-zinc-800 text-white" placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-zinc-400">URL da Capa</Label>
                      <Input value={tempData.coverUrl || ''} onChange={e => setTempData({...tempData, coverUrl: e.target.value})} className="bg-[#121316] border-zinc-800 text-white" placeholder="https://..." />
                   </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-[#252830]" onClick={() => setEditModal(null)}>Cancelar</Button>
                  <Button className="bg-[#2A2AD7] hover:bg-[#1e1eb8] text-white" onClick={() => saveGeneric({ logoUrl: tempData.logoUrl, coverUrl: tempData.coverUrl })} disabled={saving}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editModal === 'links'} onOpenChange={() => setEditModal(null)}>
              <DialogContent className="bg-[#181a1f] border-zinc-800 text-white">
                <DialogHeader><DialogTitle className="text-white text-xl">Redes Sociais</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                   <div className="space-y-2"><Label className="text-zinc-400">Instagram</Label><Input value={tempData.instagram || ''} onChange={e => setTempData({...tempData, instagram: e.target.value})} className="bg-[#121316] border-zinc-800 text-white" /></div>
                   <div className="space-y-2"><Label className="text-zinc-400">Website</Label><Input value={tempData.website || ''} onChange={e => setTempData({...tempData, website: e.target.value})} className="bg-[#121316] border-zinc-800 text-white" /></div>
                   <div className="space-y-2"><Label className="text-zinc-400">YouTube</Label><Input value={tempData.youtube || ''} onChange={e => setTempData({...tempData, youtube: e.target.value})} className="bg-[#121316] border-zinc-800 text-white" /></div>
                   <div className="space-y-2"><Label className="text-zinc-400">WhatsApp</Label><Input value={tempData.whatsapp || ''} onChange={e => setTempData({...tempData, whatsapp: e.target.value})} className="bg-[#121316] border-zinc-800 text-white" /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-[#252830]" onClick={() => setEditModal(null)}>Cancelar</Button>
                  <Button className="bg-[#2A2AD7] hover:bg-[#1e1eb8] text-white" onClick={() => saveGeneric({ instagram: tempData.instagram, website: tempData.website, youtube: tempData.youtube, whatsapp: tempData.whatsapp })} disabled={saving}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editModal === 'delete'} onOpenChange={() => setEditModal(null)}>
               <DialogContent className="bg-[#181a1f] border-zinc-800 text-white">
                  <DialogHeader><DialogTitle className="text-red-500 text-xl">Confirmar Exclusão</DialogTitle></DialogHeader>
                  <div className="py-4 text-sm text-zinc-400">Tem certeza que deseja excluir esta organização? Esta ação removerá permanentemente todos os acessos e configurações.</div>
                  <DialogFooter>
                     <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-[#252830]" onClick={() => setEditModal(null)}>Cancelar</Button>
                     <Button variant="destructive" onClick={async () => {
                        setSaving(true);
                        try {
                           await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'DELETE' });
                           toast({ title: 'Excluído' });
                           window.location.reload();
                        } catch { 
                          toast({ variant:'destructive', title: 'Falha' }); 
                        } finally { 
                          setSaving(false); 
                        }
                     }} disabled={saving}>Excluir permanentemente</Button>
                  </DialogFooter>
                </DialogContent>
            </Dialog>

          </Tabs>

          {/* Event Side Panel */}
          <EventSidePanel
            event={selectedPanelEvent}
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            hasNext={false}
            hasPrev={false}
          />

        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .calendar-settings-tab-content {
            margin-top: -24px !important;
          }

          .calendar-settings-layout {
            width: 100%;
            margin-top: 0 !important;
            gap: 24px !important;
          }

          .calendar-settings-subtabs {
            display: flex !important;
            width: calc(100% + 2rem) !important;
            max-width: none !important;
            min-height: 44px;
            margin: 0 -1rem !important;
            padding: 0 1rem;
            align-items: stretch;
            gap: 24px;
            overflow-x: auto;
            overflow-y: hidden;
            border-top: 1px solid rgba(255,255,255,.035);
            border-bottom: 1px solid rgba(255,255,255,.045);
            background: #202224;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
            touch-action: pan-x;
            -webkit-overflow-scrolling: touch;
          }

          .calendar-settings-subtabs::-webkit-scrollbar {
            display: none;
          }

          .calendar-settings-subtabs > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          .calendar-settings-subtab {
            display: inline-flex !important;
            width: auto !important;
            min-width: max-content;
            min-height: 44px;
            flex: 0 0 auto;
            align-items: center;
            gap: 0 !important;
            padding: 0 !important;
            color: rgba(255,255,255,.5) !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            line-height: 20px;
            white-space: nowrap;
          }

          .calendar-settings-subtab.is-active {
            color: #fff !important;
          }

          .calendar-settings-subtab > svg {
            display: none;
          }

          .calendar-settings-content {
            width: 100%;
          }

          .calendar-plus-header {
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
          }

          .calendar-plus-billing button {
            min-height: 36px;
          }

          .calendar-plus-cta {
            min-height: 44px;
            height: auto !important;
            padding-top: 11px !important;
            padding-bottom: 11px !important;
            line-height: 20px;
            text-align: center;
          }

          .calendar-plus-benefits-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .calendar-plus-benefit {
            min-width: 0;
          }

          .calendar-plus-benefit p {
            overflow-wrap: anywhere;
          }

          .organizer-settings-page.light .calendar-settings-subtabs {
            border-color: rgba(24,24,27,.08);
            background: #eceeef;
          }

          .organizer-settings-page.light .calendar-settings-subtab {
            color: #71717a !important;
          }

          .organizer-settings-page.light .calendar-settings-subtab.is-active {
            color: #18181b !important;
          }
        }

        @media (max-width: 359px) {
          .calendar-plus-header {
            flex-direction: column !important;
          }

          .calendar-plus-billing {
            width: 100% !important;
          }

          .calendar-plus-billing button {
            flex: 1 1 50%;
          }

          .calendar-plus-price > span:first-child {
            font-size: 42px !important;
          }
        }

        /* Fauves/Lux Button Switcher V2 styles */
        .lux-button-switcher {
          --border-radius: 0.75rem;
          --segment-bg-color: rgba(19, 21, 23, 0.04);
          --segment-slider-bg-color: #fff;
          --segment-color: rgba(19, 21, 23, 0.45);
          --segment-selected-color: #131517;
          --small-segment-gap: 2px;
          --small-segment-padding: 0.375rem 1rem;
          --small-segment-font-size: 0.8125rem;
          --slider-border-radius: calc(var(--border-radius) - var(--small-segment-gap));

          border-radius: var(--border-radius);
          background-color: var(--segment-bg-color);
          padding: var(--small-segment-gap);
          overflow: hidden;
          position: relative;
          display: inline-block;
        }

        .lux-button-switcher .segments {
          grid-template-columns: repeat(var(--option-length), minmax(0, 1fr));
          display: grid;
          position: relative;
          width: auto;
        }

        .lux-button-switcher .segment {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: var(--small-segment-font-size);
          padding: var(--small-segment-padding);
          color: var(--segment-color);
          border-radius: 0;
          justify-content: center;
          align-items: center;
          display: flex;
          position: relative;
          z-index: 2;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .lux-button-switcher .segment.selected {
          color: var(--segment-selected-color);
        }

        .lux-button-switcher .slider {
          pointer-events: none;
          background-color: var(--segment-slider-bg-color);
          width: calc(100% / var(--option-length));
          box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04);
          z-index: 1;
          height: 100%;
          position: absolute;
          top: 0;
          bottom: 0;
          border-radius: var(--slider-border-radius);
          transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .event-add-button-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .event-add-button {
          width: 24px;
          height: 24px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.48);
          background: rgba(255,255,255,.09);
          cursor: pointer;
          transition: color .16s ease, background-color .16s ease, transform .16s ease;
        }
        .event-add-button:hover,
        .event-add-button:focus-visible {
          color: #181a1c;
          background: rgba(255,255,255,.64);
        }
        .event-add-button:active { transform: scale(.94); }
        .event-add-button:focus-visible { outline: 2px solid rgba(255,255,255,.45); outline-offset: 2px; }
        .event-add-tooltip {
          position: absolute;
          z-index: 80;
          left: 50%;
          bottom: calc(100% + 9px);
          transform: translate(-50%, 4px) scale(.96);
          padding: 6px 10px;
          border-radius: 8px;
          color: #202224;
          background: #fff;
          box-shadow: 0 4px 14px rgba(0,0,0,.22);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.2;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity .14s ease, transform .14s ease, visibility .14s ease;
        }
        .event-add-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #fff;
        }
        .event-add-button-wrap:hover .event-add-tooltip,
        .event-add-button:focus-visible + .event-add-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, 0) scale(1);
        }

        .calendar-empty-state {
          min-height: 390px;
          padding: 39px 0 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .calendar-empty-art {
          width: 190px;
          height: 180px;
          margin-bottom: 22px;
          opacity: .76;
          filter: drop-shadow(0 18px 12px rgba(0,0,0,.20));
        }
        .calendar-empty-art svg { display: block; width: 100%; height: 100%; }
        .calendar-empty-state h3 {
          margin: 0;
          color: rgba(255,255,255,.58);
          font-size: 23px;
          font-weight: 650;
          line-height: 1.25;
          letter-spacing: -.02em;
        }
        .calendar-empty-state p {
          margin: 12px 0 0;
          color: rgba(255,255,255,.55);
          font-size: 16px;
          font-weight: 500;
          line-height: 1.4;
        }
        .calendar-empty-add {
          height: 31px;
          margin-top: 24px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0;
          border-radius: 8px;
          color: rgba(255,255,255,.66);
          background: rgba(255,255,255,.10);
          cursor: pointer;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          transition: color .16s ease, background-color .16s ease;
        }
        .calendar-empty-add:hover { color: #fff; background: rgba(255,255,255,.16); }

        .event-card-v2 {
          box-shadow: none !important;
          border: 1px solid rgba(19, 21, 23, 0.05) !important;
          background: #fff !important;
          transition: border-color .16s ease, background-color .16s ease !important;
        }

        .event-card-v2:hover {
          border-color: rgba(19, 21, 23, 0.16) !important;
          box-shadow: none !important;
        }

        .manage-event-btn {
          background: rgba(19, 21, 23, 0.04) !important;
          color: rgba(19, 21, 23, 0.64) !important;
          font-family: 'Inter', sans-serif !important;
          font-weight: 500 !important;
          font-size: 0.8125rem !important;
          padding: 0.3125rem 0.625rem !important;
          border-radius: 0.5rem !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.25rem !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer !important;
          text-decoration: none !important;
          border: 1px solid transparent !important;
        }
        .manage-event-btn:hover {
          background: rgba(19, 21, 23, 0.08) !important;
          color: rgba(19, 21, 23, 0.9) !important;
          border-color: rgba(19, 21, 23, 0.02) !important;
        }
        .manage-event-btn svg {
          width: 0.875rem !important;
          height: 0.875rem !important;
          stroke-width: 2 !important;
        }

        .organizer-avatar-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .organizer-avatar-container > div {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      filter 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .organizer-avatar-container:hover > div {
          transform: scale(1.1) !important;
          filter: brightness(1.05) !important;
        }

        .organizer-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%) scale(0.9);
          background: #131517;
          color: #fff;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 50;
        }
        .organizer-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 4px;
          border-style: solid;
          border-color: #131517 transparent transparent transparent;
        }
        .organizer-avatar-container:hover .organizer-tooltip {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }

        /* Responsive Event Card V2 Styling */
        .event-card-v2 {
          box-shadow: none !important;
          border: 1px solid rgba(19, 21, 23, 0.05) !important;
          background: #fff !important;
          border-radius: 0.75rem !important;
          padding: 0.75rem 0.75rem 0.75rem 1rem !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 0.625rem !important;
          cursor: pointer !important;
          transition: border-color .16s ease, background-color .16s ease !important;
        }

        .event-card-v2:hover {
          border-color: rgba(19, 21, 23, 0.16) !important;
          box-shadow: none !important;
          /* No translateY on hover */
        }

        .private-indicator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #ffe4e6;
          margin-right: 0.5rem;
        }

        .private-tooltip {
          position: absolute;
          top: -1.5rem;
          left: 0;
          background: rgba(19,21,23,0.9);
          color: #fff;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .private-indicator:hover .private-tooltip {
          opacity: 1;
        }

        .event-card-cover {
          width: 120px;
          height: 120px;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid rgba(19, 21, 23, 0.04);
          background: #f7f8f9;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1/1;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Unified Timeline Layout */
        .events-list {
          --timeline-title-width: 7rem;
          --timeline-column-gap: 4rem;
          position: relative;
          padding-left: 0;
        }
        .events-list::before {
          content: "";
          position: absolute;
          top: 0.75rem;
          bottom: 0;
          left: calc(var(--timeline-title-width) + var(--timeline-column-gap) / 2);
          border-left: .125rem dashed rgba(19, 21, 23, 0.08);
          z-index: 0;
        }

        /* Group row */
        .events-group-row {
          display: grid;
          grid-template-columns: var(--timeline-title-width) 1fr;
          gap: var(--timeline-column-gap);
          margin-bottom: 3rem;
          position: relative;
        }

        /* Left column for date & weekday */
        .date-col {
          width: var(--timeline-title-width);
          text-align: left;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding-top: 0.625rem; /* Aligns perfectly with the time inside the card */
          font-family: 'Inter', sans-serif;
          position: sticky;
          top: 100px;
          height: fit-content;
          align-self: start;
        }

          .date-main {
            font-size: 1rem; /* 16px */
            font-weight: 600;
            color: #131517;
            line-height: 1.2;
          }

          .date-sub {
            font-size: 1rem; /* 16px */
            font-weight: 400;
            color: rgba(19, 21, 23, 0.4);
            margin-top: 4px;
            text-transform: lowercase;
          }

        /* Timeline Dot */
        .timeline-dot {
          position: absolute;
          left: calc(var(--timeline-title-width) + var(--timeline-column-gap) / 2);
          top: 0.75rem; /* Align with card top padding */
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(19, 21, 23, 0.2);
          border: none;
          z-index: 10;
        }

        /* Right column for cards */
        .cards-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 0;
        }
        
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .events-list {
            --timeline-title-width: 4rem;
            --timeline-column-gap: 1.5rem;
          }
          .events-group-row {
            margin-bottom: 2rem;
          }
          .date-col {
            padding-top: 0.625rem;
          }
          .date-main {
            font-size: 14px;
            line-height: 1.2;
          }
          .date-sub {
            font-size: 11px;
            margin-top: 2px;
          }
          .timeline-dot {
            top: 1.875rem;
          }
          .event-card-v2 {
            padding: 0.625rem 0.625rem 0.625rem 0.75rem !important;
            gap: 0.625rem !important;
            border-radius: 0.625rem !important;
          }
          .event-card-cover {
            width: 80px;
            height: 80px;
            border-radius: 0.375rem;
          }
        }

        /* Dark Theme Overrides at the bottom of stylesheet to ensure priority */
        .theme-root.dark .event-card-v2 {
          background: #202224 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .theme-root.dark .event-card-v2:hover {
          border-color: rgba(255, 255, 255, 0.20) !important;
          background: #212325 !important;
          box-shadow: none !important;
        }
        .theme-root.dark .manage-event-btn {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }
        .theme-root.dark .manage-event-btn:hover {
          background: rgba(255, 255, 255, 0.12) !important;
        }
        .theme-root.dark .lux-button-switcher {
          --segment-bg-color: rgba(255, 255, 255, 0.06);
          --segment-slider-bg-color: rgba(255, 255, 255, 0.1);
          --segment-color: rgba(255, 255, 255, 0.5);
          --segment-selected-color: #ffffff;
        }
        .theme-root.dark .ticket-type-tag {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .theme-root.dark .events-list::before {
          border-left-color: rgba(255, 255, 255, 0.08) !important;
        }
        .theme-root.dark .timeline-dot {
          background: rgba(255, 255, 255, 0.25) !important;
        }
      `}</style>
    </div>
  );
}
