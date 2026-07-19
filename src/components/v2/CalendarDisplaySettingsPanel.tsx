import React from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, ImagePlus, Instagram, MapPin, Upload, X, Youtube } from 'lucide-react';
import { resolveImageUrl } from '@/lib/apiBase';
import ImagePickerModalV2, { CALENDAR_COVER_IMAGES } from './ImagePickerModalV2';

export type CalendarDisplayData = {
  id?: string;
  name?: string;
  bio?: string;
  slug?: string;
  logoUrl?: string;
  coverUrl?: string;
  instagram?: string;
  x?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  site?: string;
  locationText?: string;
  themeColor?: string;
};

type Props = {
  calendar: CalendarDisplayData;
  isPersonal?: boolean;
  saving?: boolean;
  onSave: (data: CalendarDisplayData) => Promise<void> | void;
};

const ACCENT_COLORS = ['#d1d5db', '#f58ab8', '#c96bf1', '#a78bfa', '#6fa6f8', '#72dc78', '#f2c86f', '#f69a73', '#ff716b', '#ff4b13'];

const CITY_SUGGESTIONS = [
  { name: 'Fortaleza', detail: 'Zone 1, Fortaleza - CE, Brasil' },
  { name: 'Fortaleza dos Nogueiras', detail: 'MA, Brasil' },
  { name: 'Fortaleza dos Valos', detail: 'RS, Brasil' },
  { name: 'Fortaleza de Minas', detail: 'MG, Brasil' },
  { name: 'Fortaleza do Tabocão', detail: 'Tabocão - TO, Brasil' },
  { name: 'São Paulo', detail: 'São Paulo - SP, Brasil' },
  { name: 'Rio de Janeiro', detail: 'Rio de Janeiro - RJ, Brasil' },
];

const readFile = (file: File, callback: (value: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result || ''));
  reader.readAsDataURL(file);
};

const CalendarMap = ({ city }: { city?: string }) => (
  <svg viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
    <rect width="900" height="260" fill="#191a1b" />
    {city ? <>
      <g fill="none" stroke="#333538" strokeWidth="2">
        <path d="M-20 45C130 95 180 15 335 65s235 0 350 44 180-30 250-20" />
        <path d="M50 245C150 170 245 210 320 130s180-75 265-8 185 15 345 70" />
        <path d="M110-20c35 95 80 110 145 155s130 38 180 145M630-20c-35 70-18 130 45 190s115 65 150 110" />
        <path d="M0 150h900M430 0v260M750 0v260" stroke="#292b2d" />
      </g>
      <g fill="#252729" stroke="#3b3d40"><path d="M0 0h310l-35 70-95 25-80-33z" /><path d="M610 0h290v90l-85 12-72-40-90 5z" /><path d="M0 205l130-35 120 90H0z" /></g>
      <circle cx="450" cy="118" r="7" fill="#171819" stroke="#8c8e91" strokeWidth="3" />
      <text x="463" y="122" fill="#9b9da0" fontSize="26" fontWeight="700">{city}</text>
      <text x="278" y="145" fill="#696b6e" fontSize="16" fontWeight="600">Caucaia</text>
      <text x="590" y="200" fill="#5c5e61" fontSize="15">Aquiraz</text>
    </> : <>
      <g fill="#343638" opacity=".9">
        <path d="M60 62l82-42 116 10 45 35-42 35-68-2-30 40-56-18-56-36z" />
        <path d="M248 137l52 22 24 72-38 48-28-74-31-35z" />
        <path d="M420 55l69-27 82 11 28 28-42 20-12 49-51 20-33-38-55-19z" />
        <path d="M482 141l78 9 45 59-39 66-69-18-24-70z" />
        <path d="M575 43l158-26 115 31-15 46-83 14-41 46-70-29-80-34z" />
        <path d="M756 178l76 4 42 45-57 31-78-20z" />
      </g>
      <g fill="#686a6d" fontSize="15" fontWeight="700" letterSpacing="7"><text x="423" y="55">EUROPA</text><text x="650" y="42">ÁSIA</text><text x="462" y="221">ÁFRICA</text></g>
    </>}
  </svg>
);

export function CalendarDisplaySettingsPanel({ calendar, isPersonal = false, saving = false, onSave }: Props) {
  const storageKey = `fauves-calendar-display-${calendar.id || 'default'}`;
  const [draft, setDraft] = React.useState<CalendarDisplayData>({ ...calendar, x: calendar.x || calendar.twitter || '' });
  const [coverPickerOpen, setCoverPickerOpen] = React.useState(false);
  const [accentColor, setAccentColor] = React.useState(calendar.themeColor || '#ff4b13');
  const [locationMode, setLocationMode] = React.useState<'city' | 'global'>(calendar.locationText ? 'city' : 'global');
  const [locationQuery, setLocationQuery] = React.useState(calendar.locationText || '');
  const [locationFocused, setLocationFocused] = React.useState(false);
  const [socialPreview, setSocialPreview] = React.useState('');
  const [linkedin, setLinkedin] = React.useState('');
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const socialInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDraft({ ...calendar, x: calendar.x || calendar.twitter || '' });
    setLocationMode(calendar.locationText ? 'city' : 'global');
    setLocationQuery(calendar.locationText || '');
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setAccentColor(calendar.themeColor || saved.accentColor || '#ff4b13');
      setSocialPreview(saved.socialPreview || '');
      setLinkedin(saved.linkedin || '');
      if (saved.locationMode) setLocationMode(saved.locationMode);
    } catch { /* storage unavailable */ }
  }, [calendar, storageKey]);

  const suggestions = locationQuery.trim().length > 1
    ? CITY_SUGGESTIONS.filter((city) => city.name.toLocaleLowerCase('pt-BR').includes(locationQuery.toLocaleLowerCase('pt-BR')))
    : [];
  const coverUrl = resolveImageUrl(draft.coverUrl) || CALENDAR_COVER_IMAGES[0] || '';
  const logoUrl = resolveImageUrl(draft.logoUrl);

  const save = async () => {
    try {
      await onSave({
        name: draft.name?.trim(),
        bio: draft.bio?.trim(),
        slug: draft.slug?.trim(),
        logoUrl: draft.logoUrl,
        coverUrl: draft.coverUrl,
        instagram: draft.instagram?.trim(),
        x: draft.x?.trim(),
        youtube: draft.youtube?.trim(),
        tiktok: draft.tiktok?.trim(),
        site: draft.site?.trim(),
        locationText: locationMode === 'city' ? locationQuery.trim() : '',
        themeColor: accentColor,
      });
      try { localStorage.setItem(storageKey, JSON.stringify({ accentColor, socialPreview, linkedin, locationMode })); } catch { /* storage unavailable */ }
    } catch {
      // O fluxo pai já exibe o erro e a preferência local não deve substituir um salvamento rejeitado.
    }
  };

  const linkRow = (icon: React.ReactNode, prefix: string, field: 'instagram' | 'x' | 'youtube' | 'tiktok', placeholder = 'nome de usuário') => (
    <div className="flex h-[38px] max-w-[355px] items-center">
      <span className="grid w-9 shrink-0 place-items-center text-zinc-500">{icon}</span>
      <span className="flex h-full shrink-0 items-center rounded-l-lg bg-white/[0.11] px-3 text-[14px] font-semibold text-zinc-300">{prefix}</span>
      <input value={draft[field] || ''} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} placeholder={placeholder} className="h-full min-w-0 flex-1 rounded-r-lg border border-white/10 bg-[#151617] px-3 text-[14px] font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-white/35" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-4 text-left">
      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-[#202224]">
        <div className="relative h-[202px] bg-[#191a1c]">
          {coverUrl && <img src={coverUrl} alt="Capa do calendário" className="h-full w-full object-cover" />}
          <button type="button" onClick={() => setCoverPickerOpen(true)} className="absolute right-2 top-2 h-9 rounded-lg border-0 bg-[#5b5c70]/90 px-3 text-[14px] font-bold text-zinc-300 backdrop-blur transition-colors hover:bg-[#696a7d] hover:text-white">Alterar Capa</button>
        </div>

        {!isPersonal && <div className="absolute left-4 top-[134px] h-[69px] w-[69px] rounded-xl border-[3px] border-[#202224] bg-[#ff4b13] shadow-lg">
          {logoUrl ? <img src={logoUrl} alt="Logo do calendário" className="h-full w-full rounded-[9px] object-cover" /> : <div className="grid h-full place-items-center text-[13px] font-black text-white">FAUVES</div>}
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) readFile(file, (logo) => setDraft({ ...draft, logoUrl: logo })); }} />
          <button type="button" onClick={() => logoInputRef.current?.click()} aria-label="Alterar logo" className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#202224] bg-white p-0 text-[#202224] hover:bg-zinc-200"><Upload size={12} strokeWidth={2.5} /></button>
        </div>}

        <div className={`px-4 pb-4 ${isPersonal ? 'pt-4' : 'pt-[15px]'}`}>
          <input value={draft.name || ''} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Nome do calendário" className={`${isPersonal ? '' : 'mt-1'} h-9 w-full border-0 bg-transparent p-0 text-[24px] font-bold tracking-[-0.025em] text-white outline-none`} />
          <div className="my-2 h-px bg-white/10" />
          <input value={draft.bio || ''} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} placeholder="Adicione uma descrição curta." className="h-7 w-full border-0 bg-transparent p-0 text-[16px] font-semibold text-zinc-100 outline-none placeholder:text-zinc-600" />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#202224] p-4">
        <h2 className="text-[18px] font-bold text-white">Personalização</h2>
        <label className="mb-3 mt-4 block text-[14px] font-semibold text-zinc-300">Cor de destaque</label>
        <div className="flex flex-wrap items-center gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Usar cor ${color}`}
              aria-pressed={accentColor.toLowerCase() === color}
              onClick={() => setAccentColor(color)}
              style={{
                backgroundColor: color,
                boxShadow: accentColor.toLowerCase() === color
                  ? `0 0 0 2px #202224, 0 0 0 4px ${color}`
                  : 'none',
              }}
              className="h-5 w-5 rounded-full border-0 p-0 transition-transform hover:scale-110"
            />
          ))}
          <label className="relative h-6 w-6 cursor-pointer rounded-full bg-[conic-gradient(red,#ff0,#0f0,#0ff,#00f,#f0f,red)]" aria-label="Escolher uma cor personalizada">
            <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          </label>
        </div>

        <label className="mb-2 mt-5 block text-[14px] font-semibold text-zinc-300">URL pública</label>
        <div className="flex h-[38px] max-w-[352px] overflow-hidden rounded-lg border border-white/10 bg-[#151617]"><span className="flex items-center bg-white/[0.09] px-3 text-[14px] font-semibold text-zinc-400">fauves.com.br/</span><input value={draft.slug || ''} onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="min-w-0 flex-1 bg-transparent px-3 text-[14px] font-semibold text-white outline-none" /></div>

        <label className="mb-2 mt-6 block text-[14px] font-semibold text-zinc-300">Localização</label>
        <div className="relative h-[160px] rounded-lg border border-white/[0.06]">
          <div className="absolute inset-0 overflow-hidden rounded-lg"><CalendarMap city={locationMode === 'city' && locationQuery ? locationQuery : undefined} /><div className="absolute inset-0 bg-black/10" /></div>
          <div className="absolute left-2 top-2 z-10 flex rounded-lg bg-[#2a2b2d]/90 p-0.5 backdrop-blur"><button type="button" onClick={() => setLocationMode('city')} className={`h-9 rounded-md border-0 px-3 text-[14px] font-semibold ${locationMode === 'city' ? 'bg-white/20 text-white' : 'bg-transparent text-zinc-400'}`}>Cidade</button><button type="button" onClick={() => { setLocationMode('global'); setLocationFocused(false); }} className={`h-9 rounded-md border-0 px-3 text-[14px] font-semibold ${locationMode === 'global' ? 'bg-white/20 text-white' : 'bg-transparent text-zinc-400'}`}>Global</button></div>
          {locationMode === 'city' && <div className="absolute bottom-2 left-2 right-2 z-20"><div className="relative"><MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={locationQuery} onFocus={() => setLocationFocused(true)} onBlur={() => window.setTimeout(() => setLocationFocused(false), 100)} onChange={(event) => { setLocationQuery(event.target.value); setLocationFocused(true); }} placeholder="Escolha uma cidade" className="h-[38px] w-full rounded-lg border border-white/10 bg-[#131416]/95 pl-9 pr-9 text-[16px] font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-white/35" />{locationQuery && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setLocationQuery('')} aria-label="Limpar localização" className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border-0 bg-white/15 p-0 text-zinc-400"><X size={13} /></button>}</div></div>}
          {locationMode === 'city' && locationFocused && suggestions.length > 0 && <div className="absolute left-2 right-2 top-[156px] z-50 overflow-hidden rounded-lg border border-white/10 bg-[#2a2b2d] p-1 shadow-2xl">{suggestions.slice(0, 5).map((city) => <button key={`${city.name}-${city.detail}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setLocationQuery(city.name); setLocationFocused(false); }} className="flex min-h-[48px] w-full items-center gap-3 rounded-md border-0 bg-transparent px-2.5 text-left hover:bg-white/[0.07]"><MapPin size={16} className="shrink-0 text-zinc-500" /><span><strong className="block text-[14px] text-white">{city.name}</strong><span className="text-[13px] font-medium text-zinc-400">{city.detail}</span></span></button>)}</div>}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#202224] p-4">
        <h2 className="text-[18px] font-bold text-white">Links</h2>
        <div className="mt-4 space-y-2">{linkRow(<Instagram size={16} />, 'instagram.com/', 'instagram')}{linkRow(<span className="text-[17px]">𝕏</span>, 'x.com/', 'x')}{linkRow(<Youtube size={16} />, 'youtube.com/@', 'youtube')}{linkRow(<span className="text-[15px] font-bold">♪</span>, 'tiktok.com/@', 'tiktok')}<div className="flex h-[38px] max-w-[355px] items-center"><span className="grid w-9 shrink-0 place-items-center text-[12px] font-bold text-zinc-500">in</span><span className="flex h-full items-center rounded-l-lg bg-white/[0.11] px-3 text-[14px] font-semibold text-zinc-300">linkedin.com</span><input value={linkedin} onChange={(event) => setLinkedin(event.target.value)} placeholder="/in/nome" className="h-full min-w-0 flex-1 rounded-r-lg border border-white/10 bg-[#151617] px-3 text-[14px] font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-white/35" /></div><div className="flex h-[38px] max-w-[355px] items-center"><span className="grid w-9 shrink-0 place-items-center text-zinc-500"><Globe size={16} /></span><input value={draft.site || ''} onChange={(event) => setDraft({ ...draft, site: event.target.value })} placeholder="https://seusite.com.br" className="h-full min-w-0 flex-1 rounded-lg border border-white/10 bg-[#151617] px-3 text-[14px] font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-white/35" /></div></div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#202224] p-4">
        <h2 className="text-[18px] font-bold text-white">Compartilhamento</h2>
        <label className="mb-2 mt-4 block text-[14px] font-semibold text-zinc-300">Imagem de Prévia Social</label>
        <input ref={socialInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) readFile(file, setSocialPreview); }} />
        <button type="button" onClick={() => socialInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) readFile(file, setSocialPreview); }} className="relative flex min-h-[294px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border-0 bg-white/[0.10] text-zinc-500 transition-colors hover:bg-white/[0.13]">{socialPreview ? <img src={socialPreview} alt="Prévia social" className="absolute inset-0 h-full w-full object-cover" /> : <><ImagePlus size={78} strokeWidth={1.5} /><strong className="mt-5 text-[16px] text-zinc-500">Arraste &amp; Solte ou Clique Aqui</strong></>}<span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg bg-white text-[#202224]"><ImagePlus size={16} /></span></button>
        <p className="mt-2 text-[13px] font-medium leading-5 text-zinc-500">Você pode usar imagens de qualquer tamanho. Para melhores resultados, escolha uma proporção de aspecto próxima a 1,91:1.</p>
      </section>

      <button type="button" disabled={saving || !draft.name?.trim()} onClick={save} className="flex h-[38px] items-center gap-2 rounded-lg border-0 bg-white px-4 text-[16px] font-medium text-[#171819] transition-colors hover:bg-zinc-100 disabled:opacity-40"><Check size={17} />{saving ? 'Salvando...' : 'Salvar Alterações'}</button>

      <ImagePickerModalV2 isOpen={coverPickerOpen} onClose={() => setCoverPickerOpen(false)} onSelect={(url) => setDraft({ ...draft, coverUrl: url.startsWith('/') ? `${window.location.origin}${url}` : url })} variant="calendar" />
    </motion.div>
  );
}
