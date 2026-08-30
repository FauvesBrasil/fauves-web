import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Loader2, MapPin, Video } from 'lucide-react';
import { fetchApi } from '../../lib/apiBase';
import { ProviderConnectModal } from './ProviderConnectModal';

export interface LocationData {
    type: string;
    name?: string;
    address?: string;
    city?: string;
    uf?: string;
    latitude?: number;
    longitude?: number;
    url?: string;
}

interface LuxLocationPickerProps {
    value: LocationData;
    onChange: (data: LocationData) => void;
}

interface GeocodeResult {
    place_id: number;
    name?: string;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        state_code?: string;
    };
}

const BRAZILIAN_STATES: Record<string, string> = {
    Acre: 'AC', Alagoas: 'AL', Amapá: 'AP', Amazonas: 'AM', Bahia: 'BA', Ceará: 'CE',
    'Distrito Federal': 'DF', 'Espírito Santo': 'ES', Goiás: 'GO', Maranhão: 'MA',
    'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG', Pará: 'PA',
    Paraíba: 'PB', Paraná: 'PR', Pernambuco: 'PE', Piauí: 'PI', 'Rio de Janeiro': 'RJ',
    'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS', Rondônia: 'RO', Roraima: 'RR',
    'Santa Catarina': 'SC', 'São Paulo': 'SP', Sergipe: 'SE', Tocantins: 'TO',
};

const resultTitle = (result: GeocodeResult) => result.name || result.display_name.split(',')[0]?.trim();

export const LuxLocationPicker: React.FC<LuxLocationPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<GeocodeResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [providerModal, setProviderModal] = useState<'Zoom' | 'Google Meet' | null>(null);
    const [isDark, setIsDark] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (!isOpen) return;
        setIsDark(document.documentElement.classList.contains('dark') || document.querySelector("[data-theme-dark='true']") !== null);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) window.setTimeout(() => inputRef.current?.focus(), 50);
        else {
            setSearch('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const query = search.trim();
        if (!isOpen || query.length < 3 || /^https?:\/\//i.test(query)) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        const requestId = ++requestIdRef.current;
        const timer = window.setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetchApi(`/api/geocode/search?q=${encodeURIComponent(query)}`);
                const data = response.ok ? await response.json() : [];
                if (requestId === requestIdRef.current) setResults(Array.isArray(data) ? data : []);
            } catch {
                if (requestId === requestIdRef.current) setResults([]);
            } finally {
                if (requestId === requestIdRef.current) setIsSearching(false);
            }
        }, 350);

        return () => window.clearTimeout(timer);
    }, [isOpen, search]);

    const handleSelectAddress = (address: string, result?: GeocodeResult) => {
        const city = result?.address?.city || result?.address?.town || result?.address?.village || result?.address?.municipality;
        const rawState = result?.address?.state_code?.replace(/^BR-/, '') || result?.address?.state || '';
        const uf = rawState.length === 2 ? rawState.toUpperCase() : BRAZILIAN_STATES[rawState];
        const latitude = result ? Number(result.lat) : undefined;
        const longitude = result ? Number(result.lon) : undefined;
        onChange({
            type: 'Local',
            name: result ? resultTitle(result) : address.split(',')[0]?.trim(),
            address,
            city,
            uf,
            latitude: Number.isFinite(latitude) ? latitude : undefined,
            longitude: Number.isFinite(longitude) ? longitude : undefined,
        });
        setIsOpen(false);
    };

    const handleSelectVirtual = (url: string) => {
        onChange({ type: 'Virtual', url });
        setIsOpen(false);
    };

    const displayTitle = value.type ? (value.type === 'Virtual' ? value.url : value.name || value.address) : 'Adicionar Local do Evento';
    const displaySubtitle = value.type === 'Local' && value.name !== value.address ? value.address : value.type === 'Virtual' ? value.url : null;

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="meta-row" onClick={() => setIsOpen(true)}>
                <div className="meta-icon"><MapPin size={18} strokeWidth={2} /></div>
                <div className="meta-content">
                    <div className="meta-title">{displayTitle}</div>
                    {displaySubtitle && <div className="meta-subtitle">{displaySubtitle}</div>}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}
                        className={`fauves-floating-surface location-dropdown absolute top-0 left-0 w-full z-50 rounded-[8px] border overflow-hidden flex flex-col ${isDark ? 'text-white' : 'text-gray-800'}`}
                        style={{
                            background: isDark ? 'rgba(20, 20, 24, 0.90)' : 'rgba(251, 251, 250, 0.95)',
                            backdropFilter: 'blur(30px) saturate(180%)', WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <div className={`location-input-area p-1 border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-[#F3F3F3] border-black/5'}`}>
                            <input
                                ref={inputRef} type="text" value={search} onChange={(event) => setSearch(event.target.value)}
                                placeholder="Busque um local, endereço ou cole um link"
                                className={`w-full bg-transparent border-none outline-none py-3 px-4 text-[0.95rem] ${isDark ? 'text-white placeholder:text-white/35' : 'text-gray-800 placeholder:text-gray-400'}`}
                                onKeyDown={(event) => {
                                    if (event.key !== 'Enter' || !search.trim()) return;
                                    if (/^https?:\/\//i.test(search.trim())) handleSelectVirtual(search.trim());
                                    else if (results[0]) handleSelectAddress(results[0].display_name, results[0]);
                                    else handleSelectAddress(search.trim());
                                }}
                            />
                        </div>

                        <div className="max-h-[320px] overflow-y-auto pb-2">
                            {!search ? (
                                <>
                                    <div className={`px-6 pt-4 pb-1 text-[0.82rem] leading-relaxed ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
                                        Busque pelo nome do local ou pelo endereço completo.
                                    </div>
                                    <div className={`px-4 pt-5 pb-2 text-[0.8rem] font-medium ${isDark ? 'text-white/50' : 'text-gray-400'}`}>Opções Virtuais</div>
                                    <div className="flex flex-col">
                                        {(['Zoom', 'Google Meet'] as const).map((provider) => (
                                            <button key={provider} type="button" onClick={() => { setIsOpen(false); setProviderModal(provider); }}
                                                className={`location-btn-virtual flex items-center gap-3 px-6 py-3 transition-colors w-full text-left ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-gray-900'}`}>
                                                <Video size={16} className="text-gray-400" fill="currentColor" />
                                                <span className="text-[0.95rem]">Criar {provider === 'Zoom' ? 'reunião no Zoom' : 'Google Meet'}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-start gap-2 px-6 pt-2 pb-3">
                                        <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className={`text-[0.8rem] leading-tight ${isDark ? 'text-white/45' : 'text-gray-400'}`}>Para um evento virtual, cole o link no campo acima.</span>
                                    </div>
                                </>
                            ) : (
                                <div className="py-2">
                                    {isSearching && <div className={`flex items-center gap-2 px-4 py-3 text-[0.85rem] ${isDark ? 'text-white/55' : 'text-gray-500'}`}><Loader2 size={15} className="animate-spin" /> Buscando locais…</div>}
                                    {results.map((result) => {
                                        const title = resultTitle(result);
                                        const subtitle = result.display_name.split(',').slice(1).join(',').trim();
                                        return (
                                            <button key={result.place_id} type="button" onClick={() => handleSelectAddress(result.display_name, result)}
                                                className={`location-result-row flex items-start gap-3 px-4 py-3 transition-colors w-full text-left ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                                                <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                <span>
                                                    <span className={`block text-[0.9rem] ${isDark ? 'text-white/90' : 'text-gray-900'}`}>{title}</span>
                                                    {subtitle && <span className={`block text-[0.8rem] mt-0.5 ${isDark ? 'text-white/55' : 'text-gray-400'}`}>{subtitle}</span>}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {!isSearching && search.trim().length >= 3 && results.length === 0 && <div className={`px-4 py-3 text-[0.82rem] ${isDark ? 'text-white/45' : 'text-gray-500'}`}>Nenhum local encontrado.</div>}
                                    <button type="button" onClick={() => /^https?:\/\//i.test(search.trim()) ? handleSelectVirtual(search.trim()) : handleSelectAddress(search.trim())}
                                        className={`location-result-custom flex items-center gap-3 px-4 py-3 transition-colors border-t mt-1 w-full text-left ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-black/5 border-black/5'}`}>
                                        <MapPin size={16} className="text-gray-400" />
                                        <span className={`text-[0.9rem] ${isDark ? 'text-white/90' : 'text-gray-900'}`}>Usar “{search}”</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ProviderConnectModal isOpen={!!providerModal} onClose={() => setProviderModal(null)} provider={providerModal} />
        </div>
    );
};
