import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { fetchApi, apiUrl, resolveImageUrl } from '@/lib/apiBase';
import { useTheme } from '@/context/ThemeContext';
import HeaderV2 from '@/components/v2/HeaderV2';
import LocationMapPreview from '@/components/v2/LocationMapPreview';
import { MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_COLORS = [
  { name: 'gray',     value: '#939597' },
  { name: 'pink',     value: '#f31a7c' },
  { name: 'barney',   value: '#a855f7' },
  { name: 'purple',   value: '#7c3aed' },
  { name: 'blue',     value: '#3b82f6' },
  { name: 'green',    value: '#10b981' },
  { name: 'yellow',   value: '#fbbf24' },
  { name: 'orange',   value: '#f97316' },
  { name: 'red',      value: '#ef4444' },
];

const CreateOrganizationV2: React.FC = () => {
  const { isDark } = useTheme();
  useSEO({ title: 'Criar Calendário · Fauves' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--page-max-width', '840px');
    return () => { document.documentElement.style.removeProperty('--page-max-width'); };
  }, []);

  // Form State
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug]               = useState('');
  const [logoUrl, setLogoUrl]         = useState('');
  const [coverUrl, setCoverUrl]       = useState('');
  const [themeColor, setThemeColor]   = useState('#fbbf24');
  const [locationType, setLocationType] = useState<'city' | 'global'>('global');
  const [city, setCity]               = useState('');
  const [placeholderIndex]            = useState(() => Math.floor(Math.random() * 12) + 1);

  const logoInputRef  = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const nameRef       = useRef<HTMLTextAreaElement>(null);
  const descRef       = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textareas
  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', type === 'logo' ? 'avatars' : 'banners');
    try {
      const res  = await fetchApi(apiUrl('/api/upload'), { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        if (type === 'logo') setLogoUrl(data.url);
        else setCoverUrl(data.url);
        toast.success('Imagem carregada!');
      }
    } catch (e) {
      toast.error('Erro ao carregar imagem.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('O nome do calendário é obrigatório.'); return; }
    setLoading(true);
    try {
      const res = await fetchApi(apiUrl('/api/organization'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         name.trim(),
          bio:          description.trim(),
          slug:         slug || undefined,
          logoUrl:      logoUrl || `https://cdn.lu.ma/avatars-default/community_avatar_${placeholderIndex}.png`,
          coverUrl,
          themeColor,
          locationType,
          locationText: locationType === 'city' ? city : 'Global',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Calendário criado com sucesso!');
        navigate(`/${data.data?.slug || data.data?.id}`);
      } else {
        toast.error(data.message || 'Erro ao criar calendário.');
      }
    } catch (e) {
      toast.error('Erro inesperado ao criar calendário.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Design tokens ─────────────────────────────────────────────────────────
  const pageBg     = isDark ? '#1a1a1e' : '#f4f5f7';
  const cardBg     = isDark ? '#242428' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const textPrimary   = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? 'rgba(255,255,255,0.45)' : '#9ca3af';
  const textLabel     = isDark ? 'rgba(255,255,255,0.65)' : '#6b7280';
  const inputBg       = isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb';
  const inputBorder   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const dividerColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const coverBg       = isDark ? '#2e2e34' : '#e8eaed';
  const switcherBg    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const switcherActiveBg   = isDark ? 'rgba(255,255,255,0.15)' : '#ffffff';
  const switcherActiveColor= isDark ? '#ffffff' : '#111827';
  const switcherInactiveColor = isDark ? 'rgba(255,255,255,0.45)' : '#6b7280';

  return (
    <div
      className={`theme-root ${isDark ? 'dark dark-mode' : 'light'}`}
      style={{ background: pageBg, minHeight: '100vh', paddingBottom: '5rem' }}
    >
      <HeaderV2 transparent={true} fixed={true} />

      <main style={{ maxWidth: 840, margin: '0 auto', padding: 'var(--page-top-spacing) 16px 0' }}>

        {/* ── Page Title ── */}
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: textPrimary,
          letterSpacing: '-0.025em',
          marginBottom: '1.5rem',
          fontFamily: 'Inter, sans-serif',
        }}>
          Criar Calendário
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Card 1: Identidade ── */}
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '1rem',
            overflow: 'hidden',
          }}>
            {/* Cover area */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '28%', // ~3.5:1 ratio
                background: coverUrl
                  ? `url(${resolveImageUrl(coverUrl)}) center/cover`
                  : coverBg,
                cursor: 'pointer',
              }}
              onClick={() => coverInputRef.current?.click()}
            >
              {/* Alterar Capa button */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); coverInputRef.current?.click(); }}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: isDark ? 'rgba(40,40,46,0.85)' : 'rgba(255,255,255,0.85)',
                  color: isDark ? 'rgba(255,255,255,0.85)' : '#111827',
                  border: `1px solid ${cardBorder}`,
                  fontSize: 13,
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Alterar Capa
              </button>

              {/* Hidden cover input */}
              <input
                type="file"
                ref={coverInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover')}
              />
            </div>

            {/* Logo avatar — overlapping cover bottom edge */}
            <div style={{ padding: '0 20px', position: 'relative', marginTop: -32 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  border: `3px solid ${cardBg}`,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                }}
                onClick={() => logoInputRef.current?.click()}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: logoUrl
                      ? `url(${resolveImageUrl(logoUrl)}) center/cover`
                      : `url(https://cdn.lu.ma/avatars-default/community_avatar_${placeholderIndex}.png) center/cover`,
                  }}
                />
                {/* Upload overlay icon */}
                <div style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: isDark ? '#3a3a42' : '#ffffff',
                  border: `1.5px solid ${cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? 'rgba(255,255,255,0.8)' : '#374151'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <input
                  type="file"
                  ref={logoInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                />
              </div>
            </div>

            {/* Name & description inputs */}
            <div style={{ padding: '12px 20px 20px' }}>
              {/* Name */}
              <div style={{ borderBottom: `1px solid ${dividerColor}`, marginBottom: 4, paddingBottom: 4 }}>
                <textarea
                  ref={nameRef}
                  rows={1}
                  placeholder="Nome do Calendário"
                  value={name}
                  onChange={e => { setName(e.target.value); autoResize(e.target); }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: name ? textPrimary : textSecondary,
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    padding: 0,
                  }}
                />
              </div>

              {/* Description */}
              <textarea
                ref={descRef}
                rows={1}
                placeholder="Adicione uma descrição curta."
                value={description}
                onChange={e => { setDescription(e.target.value); autoResize(e.target); }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '0.9375rem',
                  color: description ? textLabel : textSecondary,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6,
                  overflow: 'hidden',
                  padding: 0,
                  marginTop: 4,
                }}
              />
            </div>
          </div>

          {/* ── Card 2: Personalização ── */}
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '1rem',
            padding: '20px 24px',
          }}>
            <h2 style={{
              fontSize: '1.0625rem',
              fontWeight: 700,
              color: textPrimary,
              marginBottom: '1.25rem',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.01em',
            }}>
              Personalização
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

              {/* Left: Color + URL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Color picker */}
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: textLabel, display: 'block', marginBottom: 10 }}>
                    Cor de destaque
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {PRESET_COLORS.map(c => {
                      const isSelected = themeColor === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setThemeColor(c.value)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: c.value,
                            border: isSelected ? `2px solid ${isDark ? '#ffffff' : '#111827'}` : '2px solid transparent',
                            padding: 0,
                            cursor: 'pointer',
                            outline: isSelected ? `2px solid ${c.value}` : 'none',
                            outlineOffset: 1,
                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                            transition: 'transform 0.15s ease, outline 0.15s ease',
                          }}
                        />
                      );
                    })}
                    {/* Custom color swatch */}
                    <div style={{ position: 'relative', width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer' }}>
                      <input
                        type="color"
                        value={PRESET_COLORS.some(c => c.value === themeColor) ? '#ffffff' : themeColor}
                        onChange={e => setThemeColor(e.target.value)}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 5 }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'conic-gradient(from 180deg, #ffadad, #ffd6a5, #fdffb6, #caffbf, #9bf6ff, #a0c4ff, #bdb2ff, #ffc6ff, #ffadad)',
                        border: `1px solid ${inputBorder}`,
                      }} />
                    </div>
                  </div>
                </div>

                {/* Public URL */}
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: textLabel, display: 'block', marginBottom: 8 }}>
                    URL pública
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                    <span style={{
                      padding: '8px 10px 8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: textSecondary,
                      whiteSpace: 'nowrap',
                      borderRight: `1px solid ${inputBorder}`,
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      fauves.com.br/
                    </span>
                    <input
                      type="text"
                      placeholder="meu-calendario"
                      value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        padding: '8px 14px',
                        fontSize: 13,
                        color: textPrimary,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Location */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: textLabel, display: 'block', marginBottom: 8 }}>
                  Localização
                </label>

                {/* Map preview box */}
                <div style={{
                  position: 'relative',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${inputBorder}`,
                  background: isDark ? '#1f1f27' : '#e8eaed',
                  height: 140,
                }}>
                  {/* Toggle buttons overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    display: 'flex',
                    background: isDark ? 'rgba(20,20,28,0.7)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 8,
                    padding: 2,
                    gap: 2,
                  }}>
                    {(['city', 'global'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLocationType(type)}
                        style={{
                          padding: '4px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: locationType === type ? switcherActiveBg : 'transparent',
                          color: locationType === type ? switcherActiveColor : switcherInactiveColor,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'all 0.15s ease',
                          boxShadow: locationType === type ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        }}
                      >
                        {type === 'city' ? 'Cidade' : 'Global'}
                      </button>
                    ))}
                  </div>

                  <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <LocationMapPreview query={locationType === 'city' ? city : undefined} isDark={isDark} accent={themeColor} />
                  </div>

                  {/* City input (when city mode) */}
                  {locationType === 'city' && (
                    <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: isDark ? 'rgba(20,20,28,0.85)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 10px', border: `1px solid ${inputBorder}` }}>
                        <MapPin size={13} style={{ color: textSecondary, flexShrink: 0, marginRight: 6 }} />
                        <input
                          type="text"
                          placeholder="Qual cidade?"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: textPrimary, width: '100%', fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Submit button ── */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 14,
              background: loading || !name.trim()
                ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)')
                : (isDark ? '#ffffff' : '#111827'),
              color: loading || !name.trim()
                ? textSecondary
                : (isDark ? '#111827' : '#ffffff'),
              border: 'none',
              fontSize: '0.9375rem',
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.01em',
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            )}
            {loading ? 'Criando...' : 'Criar Calendário'}
          </button>

        </form>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: ${textSecondary}; }
        input::placeholder { color: ${textSecondary}; }
      `}} />
    </div>
  );
};

export default CreateOrganizationV2;
