import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Video, Info } from 'lucide-react';
import { ProviderConnectModal } from './ProviderConnectModal';

interface LocationData {
    type: string;
    address?: string;
    url?: string;
}

interface LuxLocationPickerProps {
    value: LocationData;
    onChange: (data: LocationData) => void;
}

export const LuxLocationPicker: React.FC<LuxLocationPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [providerModal, setProviderModal] = useState<'Zoom' | 'Google Meet' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const isDarkTheme = document.documentElement.classList.contains("dark") || document.querySelector("[data-theme-dark='true']") !== null;
        setIsDark(isDarkTheme);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            // small delay to ensure animation doesn't block focus
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setSearch(""); // reset search when closed
        }
    }, [isOpen]);

    const mockResults = search.length > 0 ? [
        { title: "Arena Castelão", subtitle: "Boa Vista-Castelão, Fortaleza - CE" },
        { title: "Estacionamento da Arena Castelão (Área Externa)", subtitle: "Rua R - Mata Galinha, Fortaleza - CE" },
        { title: "Pousada Arena Castelão", subtitle: "Rua Humberto Holanda Cassunde - Bela Vista, Fortaleza - CE" },
        { title: "CFO Arena", subtitle: "Avenida Alberto Craveiro - Dias Macedo, Fortaleza - CE" },
        { title: "Passarela Arena Bar", subtitle: "Avenida Alberto Craveiro - Castelão, Fortaleza - CE" },
    ] : [];

    const handleSelectAddress = (address: string) => {
        onChange({ type: 'Local', address });
        setIsOpen(false);
    };

    const handleSelectVirtual = (url: string) => {
        onChange({ type: 'Virtual', url });
        setIsOpen(false);
    };

    const displayTitle = value.type ? (value.type === 'Virtual' ? value.url : value.address) : "Adicionar Local do Evento";
    const displaySubtitle = value.type === 'Local' ? value.address : value.type === 'Virtual' ? value.url : null;

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* The trigger row */}
            <div
                className="meta-row"
                onClick={() => setIsOpen(true)}
            >
                <div className="meta-icon">
                    <MapPin size={18} strokeWidth={2} />
                </div>
                <div className="meta-content">
                    <div className="meta-title">
                        {displayTitle}
                    </div>
                    {displaySubtitle && (
                        <div className="meta-subtitle">
                            {displaySubtitle}
                        </div>
                    )}
                </div>
            </div>

            {/* The dropdown popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className={`fauves-floating-surface location-dropdown absolute top-0 left-0 w-full z-50 rounded-[8px] border overflow-hidden flex flex-col ${isDark ? "text-white" : "text-gray-800"}`}
                        style={{
                            background: isDark ? "rgba(20, 20, 24, 0.90)" : "rgba(251, 251, 250, 0.95)",
                            backdropFilter: "blur(30px) saturate(180%)",
                            WebkitBackdropFilter: "blur(30px) saturate(180%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        {/* Input Area */}
                        <div className={`location-input-area p-1 border-b ${isDark ? "bg-white/5 border-white/5" : "bg-[#F3F3F3] border-black/5"}`}>
                            <input 
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Insira o local ou link virtual"
                                className={`w-full bg-transparent border-none outline-none py-3 px-4 text-[0.95rem] ${isDark ? "text-white placeholder:text-white/35" : "text-gray-800 placeholder:text-gray-400"}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && search) {
                                        if (search.includes('http')) {
                                            handleSelectVirtual(search);
                                        } else {
                                            handleSelectAddress(search);
                                        }
                                    }
                                }}
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto pb-2">
                            {search.length === 0 ? (
                                /* Initial State (Recent + Virtual) */
                                <>
                                    <div className={`px-4 pt-4 pb-2 text-[0.8rem] font-medium location-section-title ${isDark ? "text-white/50" : "text-gray-400"}`}>
                                        Locais Recentes
                                    </div>
                                    <div className="px-2">
                                        <div 
                                            onClick={() => handleSelectAddress("Marina Park Hotel, Av. Pres. Castelo Branco, 400 - Moura Brasil, Fortaleza")}
                                            className={`location-item-recent flex items-start gap-3 p-3 cursor-pointer rounded-[8px] transition-colors mx-2 ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
                                        >
                                            <MapPin size={16} className="text-gray-400 mt-0.5 location-icon" />
                                            <div>
                                                <div className={`text-[0.9rem] font-medium location-title ${isDark ? "text-white/90" : "text-gray-900"}`}>Marina Park Hotel</div>
                                                <div className={`text-[0.8rem] mt-0.5 location-subtitle ${isDark ? "text-white/55" : "text-gray-400"}`}>Av. Pres. Castelo Branco, 400 - Moura Brasil, Fortaleza - CE, 60312-060, Brasil</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`px-4 pt-5 pb-2 text-[0.8rem] font-medium location-section-title ${isDark ? "text-white/50" : "text-gray-400"}`}>
                                        Opções Virtuais
                                    </div>
                                    <div className="flex flex-col">
                                        <button 
                                            onClick={() => { setIsOpen(false); setProviderModal('Zoom'); }}
                                            className={`location-btn-virtual flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors w-full text-left ${isDark ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-gray-900"}`}
                                        >
                                            <Video size={16} className="text-gray-400 location-icon" fill="currentColor" />
                                            <span className={`text-[0.95rem] location-btn-text ${isDark ? "text-white/90" : "text-gray-900"}`}>Criar reunião no Zoom</span>
                                        </button>
                                        <button 
                                            onClick={() => { setIsOpen(false); setProviderModal('Google Meet'); }}
                                            className={`location-btn-virtual flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors w-full text-left ${isDark ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-gray-900"}`}
                                        >
                                            <Video size={16} className="text-gray-400 location-icon" fill="currentColor" />
                                            <span className={`text-[0.95rem] location-btn-text ${isDark ? "text-white/90" : "text-gray-900"}`}>Criar Google Meet</span>
                                        </button>
                                    </div>

                                    <div className="flex items-start gap-2 px-6 pt-2 pb-3 location-info-row">
                                        <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0 location-info-icon" />
                                        <span className={`text-[0.8rem] leading-tight location-info-text ${isDark ? "text-white/45" : "text-gray-400"}`}>
                                            Se você tiver um link de evento virtual, você pode digitá-lo ou colá-lo acima.
                                        </span>
                                    </div>
                                </>
                            ) : (
                                /* Search Results State */
                                <div className="py-2">
                                    {mockResults.map((res, i) => (
                                        <div 
                                            key={i}
                                            onClick={() => handleSelectAddress(`${res.title}, ${res.subtitle}`)}
                                            className={`location-result-row flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                                        >
                                            <MapPin size={16} className="text-gray-400 mt-0.5 location-icon" />
                                            <div>
                                                <div className={`text-[0.9rem] location-title ${isDark ? "text-white/90" : "text-gray-900"}`}>{res.title}</div>
                                                <div className={`text-[0.8rem] mt-0.5 location-subtitle ${isDark ? "text-white/55" : "text-gray-400"}`}>{res.subtitle}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div 
                                        onClick={() => handleSelectAddress(search)}
                                        className={`location-result-custom flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-t mt-1 ${isDark ? "hover:bg-white/5 border-white/5" : "hover:bg-black/5 border-black/5"}`}
                                    >
                                        <MapPin size={16} className="text-gray-400 location-icon" />
                                        <div className={`text-[0.9rem] location-title ${isDark ? "text-white/90" : "text-gray-900"}`}>Use "{search}"</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ProviderConnectModal 
                isOpen={!!providerModal} 
                onClose={() => setProviderModal(null)} 
                provider={providerModal} 
            />
        </div>
    );
};
