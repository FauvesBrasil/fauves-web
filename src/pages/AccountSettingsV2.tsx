import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HeaderV2 from '../components/v2/HeaderV2';
import FooterV2 from '../components/v2/FooterV2';
import { useAuth } from '@/context/AuthContext';
import { fetchApi, apiUrl, resolveImageUrl } from '@/lib/apiBase';
import LoginModal from '@/components/LoginModal';

import displaySystem from '@/assets/display-system.jpg';
import displayLight from '@/assets/display-light.jpg';
import displayDark from '@/assets/display-dark.jpg';

/* ─── ICONS ─────────────────────────────────────────────────────────────── */
const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.857L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const YoutubeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const TikTokIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.57a8.16 8.16 0 0 0 4.77 1.52V6.65a4.85 4.85 0 0 1-1-.04z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const WebIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);
const ZoomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#2D8CFF">
    <path d="M4.5 8.25v7.5a3.75 3.75 0 0 0 3.75 3.75h7.5a3.75 3.75 0 0 0 3.75-3.75v-7.5A3.75 3.75 0 0 0 15.75 4.5h-7.5A3.75 3.75 0 0 0 4.5 8.25zm12 1.5 3 -2.25v9l-3 -2.25z"/>
  </svg>
);
const SolanaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor">
    <linearGradient id="sol1" gradientUnits="userSpaceOnUse" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientTransform="matrix(1 0 0 -1 0 314)">
      <stop offset="0" stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
    </linearGradient>
    <path fill="url(#sol1)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"/>
    <path fill="url(#sol1)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
    <path fill="url(#sol1)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
  </svg>
);
const EthIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#627EEA">
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const CalendarSyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    <path d="M17 16l-2 2 2 2"/><path d="M7 14l2-2-2-2"/>
  </svg>
);
const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);
const FingerprintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 17.5A17 17 0 0 1 4.17 12"/><path d="M20.04 12c0 2.5-.38 4.5-1 6.12"/><path d="M7 14a1 1 0 0 0 1-1 7 7 0 0 1 7-7"/><path d="M8.03 18A14 14 0 0 0 9.3 12a3 3 0 0 1 3-3"/><path d="M21.97 17a20 20 0 0 0 .03-5"/>
  </svg>
);
const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.88a16 16 0 0 0 6.29 6.29l.88-.88a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);



// Mapped tabs helper matching tab IDs to URL pathnames
const TAB_PATH_MAP: Record<string, 'conta' | 'preferencias' | 'pagamento'> = {
  conta: 'conta',
  profile: 'conta',
  preferencias: 'preferencias',
  preferences: 'preferencias',
  pagamento: 'pagamento',
  payments: 'pagamento',
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const AccountSettingsV2: React.FC = () => {
  const { user, token, loading } = useAuth();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'conta' | 'preferencias' | 'pagamento'>('conta');
  const [showLogin, setShowLogin] = useState(false);

  // Sync tab state with URL params
  useEffect(() => {
    if (tabParam) {
      const normalized = tabParam.toLowerCase();
      if (TAB_PATH_MAP[normalized]) {
        setActiveTab(TAB_PATH_MAP[normalized]);
      }
    }
  }, [tabParam]);

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Social links
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  // Email
  const [emails, setEmails] = useState<{ address: string; primary: boolean }[]>([]);

  // Phone
  const [phone, setPhone] = useState('+55 98 99110 2121');

  // Devices
  const devices = [
    { id: '1', browser: 'Safari no macOS', location: 'Fortaleza, BR', isActive: true, date: '' },
    { id: '2', browser: 'Opera no Windows', location: 'Fortaleza, BR', isActive: false, date: 'Ativo 8 de jun.' },
  ];

  const [selectedTheme, setSelectedTheme] = useState<'sistema' | 'claro' | 'escuro'>('escuro');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [passwordEmailSending, setPasswordEmailSending] = useState(false);
  const [passwordEmailSent, setPasswordEmailSent] = useState(false);
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [organizations, setOrganizations] = useState<{ id: string; name: string; slug: string; logoUrl?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email Preferences (mapped to backend schema Boolean fields)
  // Default values can be set to true or false.
  const [prefs, setPrefs] = useState({
    // Eventos que você participa
    participante_novos_recursos: true, // Lembr. venda/novos rec.
    participante_guia_semanal: true,   // Lembretes de evento
    participante_info_adicional: true, // Transmissões do evento
    participante_amigos_eventos: true, // Atualizações do evento
    participante_organizador_novo: true, // Solicitações de feedback
    // Eventos que você organiza
    organizador_relatorio_vendas: true, // Inscrições de convidados
    organizador_lembretes: true,        // Respostas de feedback
    // Calendários que você gerencia
    organizador_confirmacoes: true,     // Novos membros / Submissões de eventos
  });

  // Track channels individually (Email, WhatsApp, Push) per preference key
  const [prefChannels, setPrefChannels] = useState<Record<string, { email: boolean; whatsapp: boolean; push: boolean }>>({
    participante_novos_recursos: { email: true, whatsapp: true, push: true },
    participante_guia_semanal: { email: true, whatsapp: true, push: true },
    participante_info_adicional: { email: true, whatsapp: true, push: true },
    participante_amigos_eventos: { email: true, whatsapp: false, push: true },
    participante_organizador_novo: { email: true, whatsapp: false, push: false },
    organizador_relatorio_vendas: { email: true, whatsapp: false, push: true },
    organizador_lembretes: { email: true, whatsapp: false, push: false },
    organizador_confirmacoes: { email: true, whatsapp: false, push: true },
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) setShowLogin(true);
  }, [user, loading]);

  useEffect(() => {
    if (!user || !token) return;
    
    // Fetch profile settings
    fetchApi('/account-settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const nameParts = (data.name || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || data.surname || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setPhotoUrl(data.photoUrl || '');
        setInstagram(data.instagram || '');
        setTwitter(data.twitter || '');
        setYoutube(data.youtube || '');
        setTiktok(data.tiktok || '');
        setLinkedin(data.linkedin || '');
        setWebsite(data.website || '');
        setPhone(data.phone || '');
        if (data.email) {
          setEmails([{ address: data.email, primary: true }]);
        }
        if (data.emailPreferences) {
          setPrefs(prev => ({
            ...prev,
            ...data.emailPreferences
          }));
        }
      })
      .catch(() => {});

    // Fetch organizations dynamically
    fetchApi('/api/organization/list', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setOrganizations(data);
        }
      })
      .catch(() => {});
  }, [user, token]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetchApi('/api/upload?folder=avatars', { method: 'POST', body: form });
      const d = await res.json();
      if (d.url) setPhotoUrl(d.url);
    } catch {}
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    await fetchApi('/account-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: `${firstName} ${lastName}`.trim(),
        username,
        bio,
        photoUrl,
        instagram,
        twitter,
        youtube,
        tiktok,
        linkedin,
        website,
        phone,
        emailPreferences: prefs
      }),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetPassword = async () => {
    const userEmail = user?.email;
    if (!userEmail) return;
    setPasswordEmailSending(true);
    try {
      await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      setPasswordEmailSent(true);
    } catch {}
    setPasswordEmailSending(false);
  };

  const resolvedPhoto = photoUrl ? (photoUrl.startsWith('http') ? photoUrl : apiUrl(photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl)) : '';

  /* ─── TABS ─────────────────────────────────────────────────────────────── */
  const TABS = [
    { id: 'conta', label: 'Conta' },
    { id: 'preferencias', label: 'Preferências' },
    { id: 'pagamento', label: 'Pagamento' },
  ] as const;

  /* ─── THIRD-PARTY CARD ──────────────────────────────────────────────────── */
  const ThirdPartyCard = ({ icon, name }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{name}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Não vinculado</div>
        </div>
      </div>
      <button style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
        <PlusIcon />
      </button>
    </div>
  );

  /* ─── SECURITY ROW ──────────────────────────────────────────────────────── */
  const SecurityRow = ({ icon, title, desc, btnLabel, btnVariant = 'ghost', onClick, btnDisabled, descStyle }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '2px', flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>{title}</div>
          <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)', ...descStyle }}>{desc}</div>
        </div>
      </div>
      <button 
        onClick={onClick}
        disabled={btnDisabled}
        style={{
          padding: '0.4rem 0.875rem',
          borderRadius: '0.375rem',
          fontSize: '13px',
          fontWeight: 500,
          cursor: btnDisabled ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          background: btnVariant === 'ghost' ? 'rgba(255,255,255,0.07)' : '#c8382e',
          border: btnVariant === 'ghost' ? '1px solid rgba(255,255,255,0.1)' : 'none',
          color: '#fff',
          transition: 'all 0.15s',
          opacity: btnDisabled ? 0.7 : 1,
        }}
      >
        {btnLabel}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#131517', color: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <HeaderV2 transparent={true} scrollTransition={false} />

      {/* Main container with padding-top to compensate for absolute/transparent header */}
      <div style={{ paddingTop: 'var(--page-top-spacing)' }}>
        
        {/* Sticky Header with Title and Tabs */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            width: '100%',
            background: isScrolled ? 'rgba(19, 21, 23, 0.9)' : 'transparent',
            backdropFilter: isScrolled ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ padding: isScrolled ? '12px 0 0 0' : '20px 0 0 0', transition: 'all 0.3s ease' }}>
              {/* Title Header */}
              <h1 style={{ 
                fontSize: isScrolled ? '20px' : '28px', 
                fontWeight: 600, 
                color: '#fff', 
                marginBottom: isScrolled ? '8px' : '16px',
                lineHeight: isScrolled ? '24px' : '33.6px',
                transition: 'all 0.3s ease'
              }}>
                Configurações
              </h1>
            </div>
          </div>

          {/* Tab line divider full width */}
          <div style={{ 
            width: '100%', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)', 
            marginBottom: isScrolled ? '0' : '2rem',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.5rem' }}>
              <div className="premium-tab-container !mb-0" style={{ display: 'flex', gap: '16px', marginBottom: '-1px' }}>
                {TABS.map(tab => (
                  <a
                    key={tab.id}
                    href="#"
                    className={`premium-tab ${activeTab === tab.id ? 'active' : ''}`}
                    style={{
                      fontSize: '16px',
                      color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                      textDecoration: 'none',
                      padding: '0px 4px 8px 4px',
                      display: 'block',
                      fontWeight: 500,
                      borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
                      transition: '0.3s ease'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(tab.id);
                      const targetPath = tab.id === 'conta' ? 'profile' : tab.id === 'preferencias' ? 'preferences' : 'payments';
                      navigate(`/account-settings/${targetPath}`);
                      if (isScrolled) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    {tab.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* ─── ABA CONTA ─────────────────────────────────────────────────── */}
        {activeTab === 'conta' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {/* SEU PERFIL */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '1.25rem' }}>Seu Perfil</h2>

              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {/* Left column: fields */}
                <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {/* Nome + Sobrenome */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Nome</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '9px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Sobrenome</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '9px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Nome de usuário</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <span style={{ padding: '9px 10px 9px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', padding: '9px 12px 9px 0' }}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Bio</label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Compartilhe um pouco sobre seu histórico e interesses."
                      rows={3}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '9px 12px', color: '#fff', fontSize: '13.5px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                    />
                  </div>
                </div>

                {/* Right column: photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '4px' }}>Foto de Perfil</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '76px', height: '76px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #e879a0, #f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {resolvedPhoto ? (
                        <img src={resolvedPhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '32px' }}>😊</span>
                      )}
                      {uploadingPhoto && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '2px solid #131517', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#131517' }}
                    >
                      <UploadIcon />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div style={{ marginTop: '1.375rem' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.625rem' }}>Links sociais</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <SocialRow icon={<InstagramIcon />} prefix="instagram.com/" value={instagram} onChange={setInstagram} placeholder="nome de usuário" />
                    <SocialRow icon={<XIcon />} prefix="x.com/" value={twitter} onChange={setTwitter} placeholder="nome de usuário" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <SocialRow icon={<YoutubeIcon />} prefix="youtube.com/@" value={youtube} onChange={setYoutube} placeholder="nome de usuário" />
                    <SocialRow icon={<TikTokIcon />} prefix="tiktok.com/@" value={tiktok} onChange={setTiktok} placeholder="nome de usuário" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <SocialRow icon={<LinkedInIcon />} prefix="linkedin.com" value={linkedin} onChange={setLinkedin} placeholder="/in/identificador" />
                    <SocialRow icon={<WebIcon />} prefix="" value={website} onChange={setWebsite} placeholder="Seu site" />
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div style={{ marginTop: '1.25rem' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1.125rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem', color: '#fff', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <SaveIcon />
                  {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar Alterações'}
                </button>
              </div>
            </section>

            {/* DIVIDER */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* E-MAILS */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff' }}>E-mails</h2>
                <button 
                  onClick={() => setShowAddEmailModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.3rem 0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', color: 'rgba(255,255,255,0.75)', fontSize: '12.5px', cursor: 'pointer' }}
                >
                  <PlusIcon /> Adicionar Email
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                Adicione e-mails adicionais para receber convites de eventos enviados para esses endereços.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                {(emails.length > 0 ? emails : [{ address: user?.email || 'levycamara@hotmail.com', primary: true }]).map((em, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem 1.125rem', borderBottom: i < emails.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>{em.address}</span>
                        {em.primary && (
                          <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: '100px', letterSpacing: '0.02em' }}>Principal</span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Este e-mail será compartilhado com os organizadores quando você se inscrever nos eventos deles.</p>
                    </div>
                    {!em.primary && (
                      <button style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', paddingLeft: '8px' }}><DotsIcon /></button>
                    )}
                    {em.primary && (
                      <button style={{ color: 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', cursor: 'pointer' }}><DotsIcon /></button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* NÚMERO DE CELULAR */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '0.375rem' }}>Número de celular</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                Gerencie o número de celular que você usa para fazer login no Luma e receber atualizações por SMS.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0 14px', color: 'rgba(255,255,255,0.85)', fontSize: '14px', height: '38px', boxSizing: 'border-box' }}>
                  <input
                    type="text"
                    value={(() => {
                      const clean = phone.replace(/\D/g, '');
                      // Remove prefixo 55 se o usuário digitou ou retornou do banco com ele
                      let digits = clean;
                      if (digits.startsWith('55') && digits.length > 10) {
                        digits = digits.substring(2);
                      }
                      if (digits.length === 0) return '';
                      if (digits.length <= 2) return `(${digits}`;
                      if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
                      return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
                    })()}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      // Limita a 11 dígitos (DD + 9 dígitos)
                      setPhone(val.slice(0, 11));
                    }}
                    placeholder="(99) 99999-9999"
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', width: '130px', padding: '9px 0' }}
                  />
                  <span style={{ fontSize: '18px', userSelect: 'none' }}>🇧🇷</span>
                </div>
                <button 
                  onClick={handleSave}
                  style={{ padding: '9px 1.125rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem', color: '#fff', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', height: '38px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {saving ? 'Salvando...' : 'Atualizar'}
                </button>
              </div>
              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.35)' }}>
                Para sua segurança, enviaremos um código para verificar qualquer alteração no seu número de celular.
              </p>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* SENHA E SEGURANÇA */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Senha e Segurança</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '0 1.125rem' }}>
                <SecurityRow 
                  icon={<KeyIcon />} 
                  title="Senha da conta" 
                  desc={passwordEmailSent ? "Por favor, siga as instruções no e-mail para concluir a definição da sua senha." : "Você não configurou uma senha para sua conta."} 
                  btnLabel={passwordEmailSending ? "Enviando..." : passwordEmailSent ? "Verifique seu e-mail" : "Definir Senha"}
                  btnDisabled={passwordEmailSending || passwordEmailSent}
                  onClick={handleResetPassword}
                  descStyle={passwordEmailSent ? { color: '#eab308' } : undefined}
                />
                <SecurityRow icon={<ShieldIcon />} title="Autenticação de Dois Fatores" desc="Adicione uma camada extra de segurança à sua conta." btnLabel="Ativar 2FA" />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}><FingerprintIcon /></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>Passkeys</div>
                      <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)' }}>Passkeys são uma forma segura e conveniente de fazer login.</div>
                    </div>
                  </div>
                  <button style={{ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', fontSize: '13px', fontWeight: 500, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Adicionar Passkey
                  </button>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* CONTAS DE TERCEIROS */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '0.375rem' }}>Contas de Terceiros</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                Vincule suas contas para fazer login no Luma e automatizar seus fluxos de trabalho.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                <ThirdPartyCard icon={<GoogleIcon />} name="Google" />
                <ThirdPartyCard icon={<AppleIcon />} name="Apple" />
                <ThirdPartyCard icon={<ZoomIcon />} name="Zoom" />
                <ThirdPartyCard icon={<SolanaIcon />} name="Solana" />
                <ThirdPartyCard icon={<EthIcon />} name="Ethereum" />
              </div>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* SINCRONIZAÇÃO */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Sincronização de Conta</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}><CalendarSyncIcon /></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>Sincronização de Calendário</div>
                      <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)' }}>Sincronize seus eventos do Luma com seu calendário do Google, Outlook ou Apple.</div>
                    </div>
                  </div>
                  <button style={{ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', fontSize: '13px', fontWeight: 500, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Adicionar assinatura iCal
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 1.125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}><GoogleIcon /></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>Sincronizar Contatos com o Google</div>
                      <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)' }}>Sincronize seus contatos do Gmail para convidá-los facilmente para seus eventos.</div>
                    </div>
                  </div>
                  <button style={{ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', fontSize: '13px', fontWeight: 500, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Ativar Sincronização
                  </button>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* DISPOSITIVOS ATIVOS */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '0.375rem' }}>Dispositivos Ativos</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                Você está atualmente conectado ao Luma nos seguintes dispositivos.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', overflow: 'hidden' }}>
                {devices.map((device, i) => (
                  <div key={device.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', borderBottom: i < devices.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)' }}><MonitorIcon /></div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{device.browser}</span>
                          {device.isActive && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '1px 7px', borderRadius: '100px' }}>Este Dispositivo</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          {device.date ? `${device.date} · ${device.location}` : device.location}
                        </div>
                      </div>
                    </div>
                    {!device.isActive && (
                      <button style={{ width: '28px', height: '28px', background: 'transparent', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* EXCLUIR CONTA */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '0.375rem' }}>Excluir Conta</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1.125rem' }}>
                Se você não quiser mais usar o Luma, pode excluir sua conta permanentemente.
              </p>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1.125rem', background: '#c8382e', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                <TrashIcon /> Excluir Minha Conta
              </button>
            </section>

          </div>
        )}

        {/* ─── ABA PREFERÊNCIAS ─────────────────────────────────────────────── */}
        {activeTab === 'preferencias' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Exibição */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '1.25rem' }}>Exibição</h2>
              
              {/* Theme cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {/* Sistema */}
                <div 
                  onClick={() => setSelectedTheme('sistema')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: selectedTheme === 'sistema' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border 0.2s ease'
                  }}
                  className="theme-card-preview"
                >
                  <div style={{ height: '70px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={displaySystem} 
                      alt="Sistema" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'filter 0.2s ease',
                        filter: selectedTheme === 'sistema' ? 'grayscale(0%)' : 'grayscale(100%)'
                      }} 
                      className="theme-card-img"
                    />
                  </div>
                  <div style={{ padding: '0.75rem 1rem', fontSize: '13px', fontWeight: 500, color: selectedTheme === 'sistema' ? '#fff' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Sistema</span>
                    {selectedTheme === 'sistema' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: '#fff' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Claro */}
                <div 
                  onClick={() => setSelectedTheme('claro')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: selectedTheme === 'claro' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border 0.2s ease'
                  }}
                  className="theme-card-preview"
                >
                  <div style={{ height: '70px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={displayLight} 
                      alt="Claro" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'filter 0.2s ease',
                        filter: selectedTheme === 'claro' ? 'grayscale(0%)' : 'grayscale(100%)'
                      }} 
                      className="theme-card-img"
                    />
                  </div>
                  <div style={{ padding: '0.75rem 1rem', fontSize: '13px', fontWeight: 500, color: selectedTheme === 'claro' ? '#fff' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Claro</span>
                    {selectedTheme === 'claro' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: '#fff' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Escuro */}
                <div 
                  onClick={() => setSelectedTheme('escuro')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: selectedTheme === 'escuro' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border 0.2s ease'
                  }}
                  className="theme-card-preview"
                >
                  <div style={{ height: '70px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={displayDark} 
                      alt="Escuro" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'filter 0.2s ease',
                        filter: selectedTheme === 'escuro' ? 'grayscale(0%)' : 'grayscale(100%)'
                      }} 
                      className="theme-card-img"
                    />
                  </div>
                  <div style={{ padding: '0.75rem 1rem', fontSize: '13px', fontWeight: 500, color: selectedTheme === 'escuro' ? '#fff' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Escuro</span>
                    {selectedTheme === 'escuro' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: '#fff' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Idioma */}
              <div style={{ maxWidth: '240px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Idioma</label>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.5rem',
                  padding: '9px 12px',
                  fontSize: '13.5px',
                  color: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}>
                  <span>Português (Brasil)</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* Notificações */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Notificações</h2>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', marginBottom: '1.5rem' }}>
                Escolha como você deseja ser notificado sobre atualizações, convites e assinaturas.
              </p>

              {/* Eventos que Você Participa */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'none', marginBottom: '8px' }}>Eventos que Você Participa</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  
                  {/* Row 1: Convites de Eventos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Convites de Eventos</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'convites' ? null : 'convites')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.participante_novos_recursos)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'convites' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_novos_recursos: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_novos_recursos: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.participante_novos_recursos.email && !prefChannels.participante_novos_recursos.whatsapp && !prefChannels.participante_novos_recursos.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.participante_novos_recursos.email && !prefChannels.participante_novos_recursos.whatsapp && !prefChannels.participante_novos_recursos.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.participante_novos_recursos.email && !prefChannels.participante_novos_recursos.whatsapp && !prefChannels.participante_novos_recursos.push && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.participante_novos_recursos.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_novos_recursos: { ...prev.participante_novos_recursos, email: nextEmail }
                              }));
                              setPrefs(prev => ({ ...prev, participante_novos_recursos: nextEmail || prefChannels.participante_novos_recursos.whatsapp || prefChannels.participante_novos_recursos.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_novos_recursos.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_novos_recursos.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.participante_novos_recursos.email && <span>✓</span>}
                          </div>

                          {/* WhatsApp option */}
                          <div 
                            onClick={() => {
                              const nextWa = !prefChannels.participante_novos_recursos.whatsapp;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_novos_recursos: { ...prev.participante_novos_recursos, whatsapp: nextWa }
                              }));
                              setPrefs(prev => ({ ...prev, participante_novos_recursos: prefChannels.participante_novos_recursos.email || nextWa || prefChannels.participante_novos_recursos.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_novos_recursos.whatsapp ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_novos_recursos.whatsapp ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>WhatsApp</span>
                            {prefChannels.participante_novos_recursos.whatsapp && <span>✓</span>}
                          </div>

                          {/* Push option */}
                          <div 
                            onClick={() => {
                              const nextPush = !prefChannels.participante_novos_recursos.push;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_novos_recursos: { ...prev.participante_novos_recursos, push: nextPush }
                              }));
                              setPrefs(prev => ({ ...prev, participante_novos_recursos: prefChannels.participante_novos_recursos.email || prefChannels.participante_novos_recursos.whatsapp || nextPush }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_novos_recursos.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_novos_recursos.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Notificação push</span>
                            {prefChannels.participante_novos_recursos.push && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Lembretes de Evento */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Lembretes de Evento</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'lembretes' ? null : 'lembretes')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.participante_guia_semanal)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'lembretes' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_guia_semanal: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_guia_semanal: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.participante_guia_semanal.email && !prefChannels.participante_guia_semanal.whatsapp && !prefChannels.participante_guia_semanal.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.participante_guia_semanal.email && !prefChannels.participante_guia_semanal.whatsapp && !prefChannels.participante_guia_semanal.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.participante_guia_semanal.email && !prefChannels.participante_guia_semanal.whatsapp && !prefChannels.participante_guia_semanal.push && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.participante_guia_semanal.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_guia_semanal: { ...prev.participante_guia_semanal, email: nextEmail }
                              }));
                              setPrefs(prev => ({ ...prev, participante_guia_semanal: nextEmail || prefChannels.participante_guia_semanal.whatsapp || prefChannels.participante_guia_semanal.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_guia_semanal.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_guia_semanal.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.participante_guia_semanal.email && <span>✓</span>}
                          </div>

                          {/* WhatsApp option */}
                          <div 
                            onClick={() => {
                              const nextWa = !prefChannels.participante_guia_semanal.whatsapp;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_guia_semanal: { ...prev.participante_guia_semanal, whatsapp: nextWa }
                              }));
                              setPrefs(prev => ({ ...prev, participante_guia_semanal: prefChannels.participante_guia_semanal.email || nextWa || prefChannels.participante_guia_semanal.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_guia_semanal.whatsapp ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_guia_semanal.whatsapp ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>WhatsApp</span>
                            {prefChannels.participante_guia_semanal.whatsapp && <span>✓</span>}
                          </div>

                          {/* Push option */}
                          <div 
                            onClick={() => {
                              const nextPush = !prefChannels.participante_guia_semanal.push;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_guia_semanal: { ...prev.participante_guia_semanal, push: nextPush }
                              }));
                              setPrefs(prev => ({ ...prev, participante_guia_semanal: prefChannels.participante_guia_semanal.email || prefChannels.participante_guia_semanal.whatsapp || nextPush }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_guia_semanal.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_guia_semanal.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Notificação push</span>
                            {prefChannels.participante_guia_semanal.push && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Transmissões do Evento */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7a2 2 0 0 0-2.45-1.45L11 8 1 5v14l10 3 12-3V7z"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Transmissões do Evento</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'transmissoes' ? null : 'transmissoes')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.participante_info_adicional)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'transmissoes' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_info_adicional: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_info_adicional: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.participante_info_adicional.email && !prefChannels.participante_info_adicional.whatsapp && !prefChannels.participante_info_adicional.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.participante_info_adicional.email && !prefChannels.participante_info_adicional.whatsapp && !prefChannels.participante_info_adicional.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.participante_info_adicional.email && !prefChannels.participante_info_adicional.whatsapp && !prefChannels.participante_info_adicional.push && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.participante_info_adicional.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_info_adicional: { ...prev.participante_info_adicional, email: nextEmail }
                              }));
                              setPrefs(prev => ({ ...prev, participante_info_adicional: nextEmail || prefChannels.participante_info_adicional.whatsapp || prefChannels.participante_info_adicional.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_info_adicional.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_info_adicional.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.participante_info_adicional.email && <span>✓</span>}
                          </div>

                          {/* WhatsApp option */}
                          <div 
                            onClick={() => {
                              const nextWa = !prefChannels.participante_info_adicional.whatsapp;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_info_adicional: { ...prev.participante_info_adicional, whatsapp: nextWa }
                              }));
                              setPrefs(prev => ({ ...prev, participante_info_adicional: prefChannels.participante_info_adicional.email || nextWa || prefChannels.participante_info_adicional.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_info_adicional.whatsapp ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_info_adicional.whatsapp ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>WhatsApp</span>
                            {prefChannels.participante_info_adicional.whatsapp && <span>✓</span>}
                          </div>

                          {/* Push option */}
                          <div 
                            onClick={() => {
                              const nextPush = !prefChannels.participante_info_adicional.push;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_info_adicional: { ...prev.participante_info_adicional, push: nextPush }
                              }));
                              setPrefs(prev => ({ ...prev, participante_info_adicional: prefChannels.participante_info_adicional.email || prefChannels.participante_info_adicional.whatsapp || nextPush }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_info_adicional.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_info_adicional.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Notificação push</span>
                            {prefChannels.participante_info_adicional.push && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Atualizações do Evento */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Atualizações do Evento</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'atualizacoes' ? null : 'atualizacoes')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.participante_amigos_eventos)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'atualizacoes' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '260px',
                          zIndex: 100,
                          padding: '6px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_amigos_eventos: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_amigos_eventos: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.participante_amigos_eventos.email && !prefChannels.participante_amigos_eventos.whatsapp && !prefChannels.participante_amigos_eventos.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.participante_amigos_eventos.email && !prefChannels.participante_amigos_eventos.whatsapp && !prefChannels.participante_amigos_eventos.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.participante_amigos_eventos.email && !prefChannels.participante_amigos_eventos.whatsapp && !prefChannels.participante_amigos_eventos.push && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.participante_amigos_eventos.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_amigos_eventos: { ...prev.participante_amigos_eventos, email: nextEmail }
                              }));
                              setPrefs(prev => ({ ...prev, participante_amigos_eventos: nextEmail || prefChannels.participante_amigos_eventos.whatsapp || prefChannels.participante_amigos_eventos.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_amigos_eventos.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_amigos_eventos.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.participante_amigos_eventos.email && <span>✓</span>}
                          </div>

                          {/* Push option */}
                          <div 
                            onClick={() => {
                              const nextPush = !prefChannels.participante_amigos_eventos.push;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_amigos_eventos: { ...prev.participante_amigos_eventos, push: nextPush }
                              }));
                              setPrefs(prev => ({ ...prev, participante_amigos_eventos: prefChannels.participante_amigos_eventos.email || prefChannels.participante_amigos_eventos.whatsapp || nextPush }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_amigos_eventos.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_amigos_eventos.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Notificação push</span>
                            {prefChannels.participante_amigos_eventos.push && <span>✓</span>}
                          </div>

                          {/* Info Text inside dropdown */}
                          <p style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.3)',
                            lineHeight: 1.4,
                            margin: '4px 6px',
                            fontWeight: 400
                          }}>
                            Se você desativar as atualizações por email, seu convite iCal pode ficar desatualizado.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Solicitações de Feedback */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Solicitações de Feedback</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'feedback' ? null : 'feedback')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.participante_organizador_novo)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'feedback' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_organizador_novo: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_organizador_novo: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.participante_organizador_novo.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.participante_organizador_novo.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.participante_organizador_novo.email && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.participante_organizador_novo.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_organizador_novo: { email: nextEmail, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_organizador_novo: nextEmail }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_organizador_novo.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_organizador_novo.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.participante_organizador_novo.email && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Eventos que Você Organiza */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'none', marginBottom: '8px' }}>Eventos que Você Organiza</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  
                  {/* Row 1: Inscrições de Convidados */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Inscrições de Convidados</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'inscricoes' ? null : 'inscricoes')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.organizador_relatorio_vendas)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'inscricoes' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_relatorio_vendas: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_relatorio_vendas: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.organizador_relatorio_vendas.email && !prefChannels.organizador_relatorio_vendas.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.organizador_relatorio_vendas.email && !prefChannels.organizador_relatorio_vendas.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.organizador_relatorio_vendas.email && !prefChannels.organizador_relatorio_vendas.push && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.organizador_relatorio_vendas.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_relatorio_vendas: { ...prev.organizador_relatorio_vendas, email: nextEmail }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_relatorio_vendas: nextEmail || prefChannels.organizador_relatorio_vendas.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.organizador_relatorio_vendas.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.organizador_relatorio_vendas.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.organizador_relatorio_vendas.email && <span>✓</span>}
                          </div>

                          {/* Push option */}
                          <div 
                            onClick={() => {
                              const nextPush = !prefChannels.organizador_relatorio_vendas.push;
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_relatorio_vendas: { ...prev.organizador_relatorio_vendas, push: nextPush }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_relatorio_vendas: prefChannels.organizador_relatorio_vendas.email || nextPush }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.organizador_relatorio_vendas.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.organizador_relatorio_vendas.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Notificação push</span>
                            {prefChannels.organizador_relatorio_vendas.push && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Respostas de Feedback */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Respostas de Feedback</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'feedback_resp' ? null : 'feedback_resp')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.organizador_lembretes)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'feedback_resp' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_lembretes: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_lembretes: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.organizador_lembretes.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.organizador_lembretes.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.organizador_lembretes.email && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.organizador_lembretes.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_lembretes: { email: nextEmail, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_lembretes: nextEmail }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.organizador_lembretes.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.organizador_lembretes.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.organizador_lembretes.email && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Calendários que Você Gerencia */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'none', marginBottom: '8px' }}>Calendários que Você Gerencia</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  
                  {/* Row 1: Novos Membros */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Novos Membros</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'novos_membros' ? null : 'novos_membros')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.organizador_confirmacoes)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'novos_membros' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_confirmacoes: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_confirmacoes: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.organizador_confirmacoes.email && !prefChannels.organizador_confirmacoes.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.organizador_confirmacoes.email && !prefChannels.organizador_confirmacoes.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.organizador_confirmacoes.email && !prefChannels.organizador_confirmacoes.push && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.organizador_confirmacoes.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_confirmacoes: { ...prev.organizador_confirmacoes, email: nextEmail }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_confirmacoes: nextEmail || prefChannels.organizador_confirmacoes.push }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.organizador_confirmacoes.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.organizador_confirmacoes.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.organizador_confirmacoes.email && <span>✓</span>}
                          </div>

                          {/* Push option */}
                          <div 
                            onClick={() => {
                              const nextPush = !prefChannels.organizador_confirmacoes.push;
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_confirmacoes: { ...prev.organizador_confirmacoes, push: nextPush }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_confirmacoes: prefChannels.organizador_confirmacoes.email || nextPush }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.organizador_confirmacoes.push ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.organizador_confirmacoes.push ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Notificação push</span>
                            {prefChannels.organizador_confirmacoes.push && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Submissões de Eventos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12h6" /><path d="M12 9v6" /></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Submissões de Eventos</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'submissoes' ? null : 'submissoes')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.organizador_confirmacoes)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'submissoes' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_confirmacoes: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_confirmacoes: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.organizador_confirmacoes.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.organizador_confirmacoes.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.organizador_confirmacoes.email && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.organizador_confirmacoes.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                organizador_confirmacoes: { email: nextEmail, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, organizador_confirmacoes: nextEmail }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.organizador_confirmacoes.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.organizador_confirmacoes.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.organizador_confirmacoes.email && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Luma */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'none', marginBottom: '8px' }}>Luma</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Atualizações de Produto</span>
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === 'luma_prod' ? null : 'luma_prod')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {Object.entries(prefChannels.participante_novos_recursos)
                            .filter(([_, active]) => active)
                            .map(([channel]) => channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Push')
                            .join(', ') || 'Desligado'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></svg>
                      </div>

                      {activeDropdown === 'luma_prod' && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          background: '#1c1d1f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '0.625rem',
                          width: '180px',
                          zIndex: 100,
                          padding: '4px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          {/* Desligado option */}
                          <div 
                            onClick={() => {
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_novos_recursos: { email: false, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_novos_recursos: false }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: !prefChannels.participante_novos_recursos.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !prefChannels.participante_novos_recursos.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Desligado</span>
                            {!prefChannels.participante_novos_recursos.email && <span>✓</span>}
                          </div>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                          {/* Email option */}
                          <div 
                            onClick={() => {
                              const nextEmail = !prefChannels.participante_novos_recursos.email;
                              setPrefChannels(prev => ({
                                ...prev,
                                participante_novos_recursos: { email: nextEmail, whatsapp: false, push: false }
                              }));
                              setPrefs(prev => ({ ...prev, participante_novos_recursos: nextEmail }));
                              setTimeout(handleSave, 100);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '13px',
                              borderRadius: '0.375rem',
                              color: prefChannels.participante_novos_recursos.email ? '#fff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: prefChannels.participante_novos_recursos.email ? 'rgba(255,255,255,0.06)' : 'transparent'
                            }}
                          >
                            <span>Email</span>
                            {prefChannels.participante_novos_recursos.email && <span>✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assinaturas e Seguidos */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'none', marginBottom: '8px' }}>Assinaturas e Seguidos</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  {/* Row 1 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Páginas de Descoberta do Luma</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer' }}>
                      <span>0 Página</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                  {/* Row 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Calendários</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', cursor: 'pointer' }}>
                      <span>0 Calendário</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ─── ABA PAGAMENTO ─────────────────────────────────────────────────── */}
        {activeTab === 'pagamento' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Métodos de Pagamento */}
            <section>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Métodos de Pagamento</h2>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>
                Seus métodos de pagamento salvos são criptografados e armazenados com segurança pelo Stripe.
              </p>
              
              <button style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#fff',
                color: '#131517',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Cartão
              </button>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* Fauves Plus */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff' }}>Fauves Plus</h2>
                <button style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.375rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}>
                  Saiba mais ↗
                </button>
              </div>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>
                Aproveite 0% de taxas de plataforma, limites maiores de convites e administradores, suporte prioritário e muito mais.
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                {/* Personal (Pessoal) is always shown at the top as every user has it */}
                <div 
                  onClick={() => window.location.href = '/personal/settings'}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 16px', 
                    borderBottom: (organizations.length > 0) ? '1px solid rgba(255,255,255,0.05)' : 'none', 
                    cursor: 'pointer' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt="Pessoal" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                        P
                      </div>
                    )}
                    <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Pessoal (Personal)</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.3)' }}><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                {organizations.map((org, index) => {
                  // Filter out "personal" duplicates from the dynamic list if present
                  if (org.slug === 'personal') return null;
                  return (
                    <div 
                      key={org.id}
                      onClick={() => window.location.href = `/calendar/manage/cal-${org.id}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '12px 16px', 
                        borderBottom: index < organizations.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', 
                        cursor: 'pointer' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {org.logoUrl ? (
                          <img src={org.logoUrl} alt={org.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                            {(org.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{org.name}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.3)' }}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  );
                })}
              </div>

              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                O Fauves Plus se aplica no nível do calendário. Escolha o calendário desejado acima para gerenciar sua assinatura do Fauves Plus.
              </p>
            </section>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />

            {/* Histórico de Pagamentos */}
            <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '2rem' }}>
              <div style={{ width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#fff' }}>Histórico de Pagamentos</h2>
              </div>
              
              {/* Payment empty state SVG */}
              <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', opacity: 0.75 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 341 340" style={{ width: '100%', height: '100%' }}>
                  <g filter="url(#PaymentDark_svg__a)"><rect width="206" height="10" x="68" fill="url(#PaymentDark_svg__b)" rx="4"></rect></g>
                  <g filter="url(#PaymentDark_svg__c)"><path fill="url(#PaymentDark_svg__d)" d="M80 0h181v211.52c0 .968 0 1.452-.202 1.72a1 1 0 0 1-.737.395c-.334.021-.738-.247-1.545-.782l-6.618-4.388c-.799-.529-1.199-.794-1.63-.897a2.5 2.5 0 0 0-1.161 0c-.431.103-.831.368-1.63.897l-5.566 3.69c-1.278.848-1.917 1.272-2.608 1.437a4 4 0 0 1-1.856 0c-.691-.165-1.33-.589-2.608-1.437l-5.566-3.69c-.799-.529-1.199-.794-1.63-.897a2.5 2.5 0 0 0-1.161 0c-.431.103-.831.368-1.63.897l-5.566 3.69c-1.278.848-1.917 1.272-2.608 1.437a4 4 0 0 1-1.856 0c-.691-.165-1.33-.589-2.608-1.437l-5.566-3.69c-.799-.529-1.199-.794-1.63-.897a2.5 2.5 0 0 0-1.161 0c-.431.103-.831.368-1.63.897l-5.566 3.69c-1.278.848-1.917 1.272-2.608 1.437a4 4 0 0 1-1.856 0c-.691-.165-1.33-.589-2.608-1.437l-5.566-3.69c-.799-.529-1.199-.794-1.63-.897a2.5 2.5 0 0 0-1.161 0c-.431.103-.831.368-1.63.897l-5.566 3.69c-1.278.848-1.917 1.272-2.608 1.437a4 4 0 0 1-1.856 0c-.691-.165-1.33-.589-2.608-1.437l-5.566-3.69c-.799-.529-1.199-.794-1.63-.897a2.5 2.5 0 0 0-1.161 0c-.431.103-.831.368-1.63.897l-5.566 3.69c-1.278.848-1.917 1.272-2.608 1.437a4 4 0 0 1-1.856 0c-.691-.165-1.33-.589-2.608-1.437l-5.566-3.69c-.799-.529-1.199-.794-1.63-.897a2.5 2.5 0 0 0-1.161 0c-.431.103-.831.368-1.63.897l-5.566 3.69c-1.278.848-1.917 1.272-2.608 1.437a4 4 0 0 1-1.856 0c-.691-.165-1.33-.589-2.609-1.437l-5.565-3.69c-.8-.529-1.199-.794-1.63-.897a2.5 2.5 0 0 0-1.16 0c-.432.103-.832.368-1.63.897l-6.619 4.388c-.807.535-1.21.803-1.545.782a1 1 0 0 1-.737-.395c-.202-.268-.202-.752-.202-1.72z"></path></g>
                  <path fill="url(#PaymentDark_svg__e)" fill-rule="evenodd" d="M90 28.4c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C93.04 22 94.16 22 96.4 22h89.2c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748c.436.856.436 1.976.436 4.216v1.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C188.96 36 187.84 36 185.6 36H96.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C90 32.96 90 31.84 90 29.6zm0 51c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C93.04 73 94.16 73 96.4 73h83.2c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748c.436.856.436 1.976.436 4.216v1.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C182.96 87 181.84 87 179.6 87H96.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C90 83.96 90 82.84 90 80.6zm.436-37.216C90 43.04 90 44.16 90 46.4v1.2c0 2.24 0 3.36.436 4.216a4 4 0 0 0 1.748 1.748C93.04 54 94.16 54 96.4 54h68.2c2.24 0 3.36 0 4.216-.436a4 4 0 0 0 1.748-1.748C171 50.96 171 49.84 171 47.6v-1.2c0-2.24 0-3.36-.436-4.216a4 4 0 0 0-1.748-1.748C167.96 40 166.84 40 164.6 40H96.4c-2.24 0-3.36 0-4.216.436a4 4 0 0 0-1.748 1.748M90 97.4c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C93.04 91 94.16 91 96.4 91h68.2c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748c.436.856.436 1.976.436 4.216v1.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748c-.856.436-1.976.436-4.216.436H96.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C90 101.96 90 100.84 90 98.6zm.654 42.876C90 141.56 90 143.24 90 146.6v37.8c0 3.36 0 5.04.654 6.324a6 6 0 0 0 2.622 2.622C94.56 194 96.24 194 99.6 194h141.8c3.36 0 5.04 0 6.324-.654a6 6 0 0 0 2.622-2.622c.654-1.284.654-2.964.654-6.324v-37.8c0-3.36 0-5.04-.654-6.324a6 6 0 0 0-2.622-2.622C246.44 137 244.76 137 241.4 137H99.6c-3.36 0-5.04 0-6.324.654a6 6 0 0 0-2.622 2.622M224 28.4c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C227.04 22 228.16 22 230.4 22h14.2c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748c.436.856.436 1.976.436 4.216v1.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C247.96 36 246.84 36 244.6 36h-14.2c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C224 32.96 224 31.84 224 29.6zm.436 46.784C224 76.04 224 77.16 224 79.4v1.2c0 2.24 0 3.36.436 4.216a4 4 0 0 0 1.748 1.748c.856.436 1.976.436 4.216.436h14.2c2.24 0 3.36 0 4.216-.436a4 4 0 0 0 1.748-1.748C251 83.96 251 82.84 251 80.6v-1.2c0-2.24 0-3.36-.436-4.216a4 4 0 0 0-1.748-1.748C247.96 73 246.84 73 244.6 73h-14.2c-2.24 0-3.36 0-4.216.436a4 4 0 0 0-1.748 1.748" clip-rule="evenodd"></path>
                  <g filter="url(#PaymentDark_svg__f)"><mask id="PaymentDark_svg__g" width="149" height="12" x="95" y="177" fill="#000" maskUnits="userSpaceOnUse"><path fill="#fff" d="M95 177h149v12H95z"></path><path fill-rule="evenodd" d="M97.707 178.293a1 1 0 1 0-1.414 1.414L99.586 183l-3.293 3.293a1 1 0 1 0 1.414 1.414l3.293-3.293 3.293 3.293a.999.999 0 1 0 1.414-1.414L102.414 183l3.293-3.293a.999.999 0 1 0-1.414-1.414L101 181.586zM112 186a1 1 0 0 0 0 2h130a1 1 0 0 0 0-2z" clip-rule="evenodd"></path></mask><path fill="#464646" fill-rule="evenodd" d="M97.707 178.293a1 1 0 1 0-1.414 1.414L99.586 183l-3.293 3.293a1 1 0 1 0 1.414 1.414l3.293-3.293 3.293 3.293a.999.999 0 1 0 1.414-1.414L102.414 183l3.293-3.293a.999.999 0 1 0-1.414-1.414L101 181.586zM112 186a1 1 0 0 0 0 2h130a1 1 0 0 0 0-2z" clip-rule="evenodd" shape-rendering="crispEdges"></path><path fill="#000" fill-opacity="0.05" d="m96.293 178.293.353.353zm1.414 0-.353.353zm-1.414 1.414-.354.354zM99.586 183l.353.354.354-.354-.354-.354zm-3.293 3.293-.354-.354zm0 1.414.353-.353zm1.414 0-.353-.353zm3.293-3.293.354-.353-.354-.354-.354.354zm3.293 3.293.353-.353zm1.414 0-.353-.353zM102.414 183l-.353-.354-.354.354.354.354zm3.293-3.293-.353-.353zm0-1.414-.353.353zm-1.414 0 .353.353zM101 181.586l-.354.353.354.354.354-.354zm-4.354-2.94a.5.5 0 0 1 .708 0l.707-.707a1.5 1.5 0 0 0-2.122 0zm0 .708a.5.5 0 0 1 0-.708l-.707-.707a1.5 1.5 0 0 0 0 2.122zm3.293 3.292-3.293-3.292-.707.707 3.293 3.293zm-3.293 4 3.293-3.292-.707-.708-3.293 3.293zm0 .708a.5.5 0 0 1 0-.708l-.707-.707a1.5 1.5 0 0 0 0 2.122zm.708 0a.5.5 0 0 1-.708 0l-.707.707a1.5 1.5 0 0 0 2.122 0zm3.292-3.293-3.292 3.293.707.707 3.293-3.293zm4 3.293-3.292-3.293-.708.707 3.293 3.293zm.708 0a.5.5 0 0 1-.708 0l-.707.707a1.5 1.5 0 0 0 2.122 0zm0-.708a.5.5 0 0 1 0 .708l.707.707a1.5 1.5 0 0 0 0-2.122zm-3.293-3.292 3.293 3.292.707-.707-3.293-3.293zm3.293-4-3.293 3.292.707.708 3.293-3.293zm0-.708a.5.5 0 0 1 0 .708l.707.707a1.5 1.5 0 0 0 0-2.122zm-.708 0a.5.5 0 0 1 .708 0l.707-.707a1.5 1.5 0 0 0-2.122 0zm-3.292 3.293 3.292-3.293-.707-.707-3.293 3.293zm-4-3.293 3.292 3.293.708-.707-3.293-3.293zM111.5 187a.5.5 0 0 1 .5-.5v-1a1.5 1.5 0 0 0-1.5 1.5zm.5.5a.5.5 0 0 1-.5-.5h-1a1.5 1.5 0 0 0 1.5 1.5zm130 0H112v1h130zm.5-.5a.5.5 0 0 1-.5.5v1a1.5 1.5 0 0 0 1.5-1.5zm-.5-.5a.5.5 0 0 1 .5.5h1a1.5 1.5 0 0 0-1.5-1.5zm-130 0h130v-1H112z" mask="url(#PaymentDark_svg__g)"></path></g>
                  <path fill="#fff" fill-opacity="0.1" fill-rule="evenodd" d="M72 1h198a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-9v1h9a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H72a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h8V9h-8a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3" clip-rule="evenodd"></path>
                  <defs>
                    <filter id="PaymentDark_svg__a" width="206" height="14" x="68" y="0" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="4"></feOffset><feGaussianBlur stdDeviation="5"></feGaussianBlur><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic"></feComposite><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"></feColorMatrix><feBlend in2="shape" result="effect1_innerShadow_7925_146259"></feBlend></filter>
                    <filter id="PaymentDark_svg__c" width="341" height="394.701" x="0" y="-1" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="2.767"></feOffset><feGaussianBlur stdDeviation="1.107"></feGaussianBlur><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0"></feColorMatrix><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_7925_146259"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="6.65"></feOffset><feGaussianBlur stdDeviation="2.66"></feGaussianBlur><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0503198 0"></feColorMatrix><feBlend in2="effect1_dropShadow_7925_146259" result="effect2_dropShadow_7925_146259"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="12.522"></feOffset><feGaussianBlur stdDeviation="5.009"></feGaussianBlur><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0417275 0"></feColorMatrix><feBlend in2="effect2_dropShadow_7925_146259" result="effect3_dropShadow_7925_146259"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="22.336"></feOffset><feGaussianBlur stdDeviation="8.935"></feGaussianBlur><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.035 0"></feColorMatrix><feBlend in2="effect3_dropShadow_7925_146259" result="effect4_dropShadow_7925_146259"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="41.778"></feOffset><feGaussianBlur stdDeviation="16.711"></feGaussianBlur><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0282725 0"></feColorMatrix><feBlend in2="effect4_dropShadow_7925_146259" result="effect5_dropShadow_7925_146259"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="100"></feOffset><feGaussianBlur stdDeviation="40"></feGaussianBlur><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0196802 0"></feColorMatrix><feBlend in2="effect5_dropShadow_7925_146259" result="effect6_dropShadow_7925_146259"></feBlend><feBlend in="SourceGraphic" in2="effect6_dropShadow_7925_146259" result="shape"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="-1"></feOffset><feGaussianBlur stdDeviation="2"></feGaussianBlur><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic"></feComposite><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"></feColorMatrix><feBlend in2="shape" result="effect7_innerShadow_7925_146259"></feBlend></filter>
                    <filter id="PaymentDark_svg__f" width="150" height="13" x="94.5" y="177.5" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset dy="1"></feOffset><feGaussianBlur stdDeviation="0.5"></feGaussianBlur><feComposite in2="hardAlpha" operator="out"></feComposite><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"></feColorMatrix><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_7925_146259"></feBlend><feBlend in="SourceGraphic" in2="effect1_dropShadow_7925_146259" result="shape"></feBlend></filter>
                    <linearGradient id="PaymentDark_svg__d" x1="170.5" x2="170.5" y1="0" y2="226" gradientUnits="userSpaceOnUse"><stop stop-color="#161616"></stop><stop offset="0.039" stop-color="#404040"></stop><stop offset="0.088" stop-color="#404040"></stop><stop offset="1" stop-color="#343434"></stop></linearGradient>
                    <linearGradient id="PaymentDark_svg__e" x1="170.5" x2="170.5" y1="22" y2="194" gradientUnits="userSpaceOnUse"><stop stop-color="#111"></stop><stop offset="1" stop-color="#1F1F1F"></stop></linearGradient>
                    <radialGradient id="PaymentDark_svg__b" cx="0" cy="0" r="1" gradientTransform="matrix(0 -10 132.598 0 171 10)" gradientUnits="userSpaceOnUse"><stop stop-color="#5B5B5B"></stop><stop offset="1" stop-color="#171717"></stop></radialGradient>
                  </defs>
                </svg>
              </div>

              <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Sem Pagamentos</span>
              <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.4)', maxWidth: '380px', lineHeight: 1.5 }}>
                Seus pagamentos aparecerão aqui. Para ver os pagamentos do Luma Plus, selecione o calendário correspondente na seção acima.
              </p>
            </section>
          </div>
        )}
      </div>

       </div> {/* End of main padding container */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .theme-card-preview:hover .theme-card-img {
          filter: grayscale(0%) !important;
        }
      `}</style>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />

      {/* Add Email Modal */}
      {showAddEmailModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
        }}>
          <div style={{
            background: '#18191b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.25rem',
            width: '380px',
            padding: '1.75rem',
            boxSizing: 'border-box',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowAddEmailModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            {/* Email Icon circle */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              color: '#fff'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem 0' }}>Adicionar E-mail</h3>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Adicione um e-mail adicional para receber convites de eventos enviados para esse endereço.
            </p>

            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
              Endereço de E-mail
            </label>

            {/* Input field */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newEmail = String(formData.get('email') || '').trim();
              if (newEmail && newEmail.includes('@')) {
                setEmails(prev => [...prev, { address: newEmail, primary: false }]);
                setShowAddEmailModal(false);
              }
            }}>
              <input
                type="email"
                name="email"
                required
                placeholder="you@email.com"
                autoFocus
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.625rem',
                  padding: '11px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '1.25rem',
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#fff',
                  color: '#131517',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  textAlign: 'center'
                }}
              >
                Adicionar Email
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsV2;

/* ─── SOCIAL ROW HELPER ─────────────────────────────────────────────────── */
const SocialRow = ({ icon, prefix, value, onChange, placeholder }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', overflow: 'hidden', flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', padding: '10px 0 10px 0', whiteSpace: 'nowrap', userSelect: 'none' }}>{prefix}</div>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '13px', padding: '10px 10px', flex: 1, minWidth: 0 }}
    />
  </div>
);
