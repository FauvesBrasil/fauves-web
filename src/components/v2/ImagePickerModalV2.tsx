"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Search, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { coverAssetUrls } from "@/lib/coverAssets";

interface ImagePickerModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    variant?: "event" | "calendar";
}

// Carrega as capas dinamicamente usando o mesmo mapa utilizado nas listagens.
const coverModules = coverAssetUrls;

const fallbackPresets = [
    "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75/event-covers/q6/f2c92e76-32d8-4f5a-9d6e-1d5d5d5d5d5d.jpg",
    "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75/event-covers/v3/4e6e6e6e-6e6e-4e6e-be6e-6e6e6e6e6e6e.jpg",
    "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75/event-covers/w9/2e2e2e2e-2e2e-4e2e-be2e-2e2e2e2e2e2e.jpg",
    "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75/event-covers/m5/5e5e5e5e-5e5e-4e5e-be5e-5e5e5e5e5e5e.jpg",
    "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75/event-covers/k8/8e8e8e8e-8e8e-4e8e-be8e-8e8e8e8e8e8e.jpg",
    "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75/event-covers/p2/2e2e2e2e-2e2e-4e2e-be2e-2e2e2e2e2e2e.jpg",
];

const globPresets = Object.values(coverModules) as string[];

export const PRESET_IMAGES = globPresets.length > 0 ? globPresets : fallbackPresets;

const imagesFromFolders = (...folders: string[]) => Object.entries(coverModules)
    .filter(([path]) => folders.some((folder) => path.includes(`/covers/${folder}/`)))
    .map(([, url]) => url as string);

export const CALENDAR_COVER_LIBRARY: Record<string, string[]> = {
    Social: [...imagesFromFolders('mulheres').slice(2, 8), ...imagesFromFolders('convites').slice(34, 40)],
    Tecnologia: imagesFromFolders('tecnologia').slice(4, 16),
    'Ao ar livre': [...imagesFromFolders('clima').slice(4, 10), ...imagesFromFolders('primavera').slice(2, 8)],
    Abstrato: [...imagesFromFolders('tecnologia').slice(16, 22), ...imagesFromFolders('clima').slice(12, 18)],
};

export const CALENDAR_COVER_IMAGES = Object.values(CALENDAR_COVER_LIBRARY).flat();

// Agrupa as imagens por categoria física
export const CATEGORIZED_IMAGES: Record<string, string[]> = {};

Object.entries(coverModules).forEach(([path, url]) => {
    const parts = path.split('/');
    const coversIdx = parts.indexOf('covers');
    if (coversIdx !== -1 && parts[coversIdx + 1]) {
        const category = parts[coversIdx + 1].toLowerCase();
        if (!CATEGORIZED_IMAGES[category]) {
            CATEGORIZED_IMAGES[category] = [];
        }
        CATEGORIZED_IMAGES[category].push(url as string);
    }
});

// Lista completa de categorias exibidas no menu esquerdo (Fiel ao print do usuário)
const ALL_MENU_CATEGORIES = [
    "Destaque",
    "Eventos Anteriores",
    "Primavera",
    "Clima",
    "Escola",
    "Convites",
    "Mulheres",
    "Tecnologia",
    "Negócios",
    "Festa",
    "Crypto",
    "Abstrato",
    "Artesanato",
    "Comida",
    "Bebidas",
    "Amor"
];

// Pastas a serem exibidas na grade de Destaque
const DISPLAY_FOLDERS = [
    "Eventos Anteriores",
    "Clima",
    "Escola",
    "Convites",
    "Mulheres",
    "Tecnologia"
];

// Mapeador inteligente para preencher categorias com imagens físicas ou fallbacks
export const getImagesForCategory = (category: string): string[] => {
    const key = category.toLowerCase();
    if (CATEGORIZED_IMAGES[key] && CATEGORIZED_IMAGES[key].length > 0) {
        return CATEGORIZED_IMAGES[key];
    }
    if (key === "destaque" || key === "todas") {
        return PRESET_IMAGES;
    }
    if (key === "eventos anteriores") {
        return fallbackPresets;
    }
    
    // Distribuição determinística de imagens para categorias sem pastas físicas
    const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const count = 8;
    const startIndex = hash % Math.max(1, PRESET_IMAGES.length - count);
    return PRESET_IMAGES.slice(startIndex, startIndex + count);
};

/* ─── HIGHLIGHT CARD COMPONENT (3D STACKED HOVER EFFECT) ─── */
interface HighlightCardProps {
    title: string;
    images: string[];
    onClick: () => void;
    isDark?: boolean;
}

function HighlightCard({ title, images, onClick, isDark = false }: HighlightCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isHovered || images.length <= 1) {
            setCurrentIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 1300);

        return () => clearInterval(interval);
    }, [isHovered, images]);

    const activeImages = useMemo(() => {
        if (images.length === 0) return [];
        const imgs = [];
        for (let i = 0; i < Math.min(3, images.length); i++) {
            imgs.push(images[(currentIndex + i) % images.length]);
        }
        return imgs;
    }, [images, currentIndex]);

    return (
        <div 
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full h-[200px] bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#818cf8] rounded-[16px] p-8 flex justify-between items-center relative overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 group shrink-0"
        >
            <div className="flex flex-col justify-between h-full z-10 text-white select-none">
                <div>
                    <h2 className="text-2xl font-bold font-sans tracking-wide leading-tight">{title}</h2>
                    <span className="text-white/80 text-sm font-sans font-medium mt-1.5 block">{images.length} Imagens</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 text-xs font-semibold w-fit hover:bg-white/30 transition-all select-none">
                    Explorar Primavera
                </div>
            </div>

            {/* Imagens empilhadas 3D no lado direito que rotacionam e dão zoom no hover */}
            <div className="relative w-[240px] h-full flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                    {activeImages.map((img, index) => {
                        const rotateVal = index === 0 ? 6 : index === 1 ? -10 : 20;
                        const xOffset = index === 0 ? 30 : index === 1 ? -30 : 90;
                        const yOffset = index === 0 ? 0 : index === 1 ? 4 : -8;
                        const scaleVal = index === 0 ? 1 : index === 1 ? 0.9 : 0.8;
                        const opacityVal = index === 0 ? 1 : index === 1 ? 0.75 : 0.4;

                        return (
                            <motion.img
                                key={`${img}-${index}`}
                                src={img}
                                alt="Stacked Item"
                                className="absolute w-[110px] h-[110px] object-cover rounded-[12px] shadow-lg border-2 border-white/80 origin-bottom"
                                style={{
                                    zIndex: 30 - index,
                                }}
                                initial={{ scale: scaleVal * 0.8, opacity: 0, rotate: rotateVal - 8 }}
                                animate={{
                                    scale: scaleVal,
                                    opacity: opacityVal,
                                    rotate: isHovered ? rotateVal * 1.3 : rotateVal,
                                    x: isHovered ? xOffset * 1.15 : xOffset,
                                    y: yOffset,
                                }}
                                exit={{
                                    scale: 1.4,
                                    opacity: 0,
                                    y: -25,
                                    rotate: rotateVal + 15,
                                    zIndex: 40
                                }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ─── FOLDER CARD COMPONENT (3D DYNAMIC FOLDERS HOVER CAROUSEL) ─── */
interface FolderCardProps {
    title: string;
    images: string[];
    onClick: () => void;
    isDark?: boolean;
}

function FolderCard({ title, images, onClick, isDark = false }: FolderCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isHovered || images.length <= 1) {
            setCurrentIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 1300);

        return () => clearInterval(interval);
    }, [isHovered, images]);

    const currentImg = images[currentIndex];
    const nextImg = images[(currentIndex + 1) % images.length];

    return (
        <div 
            className="flex flex-col items-center cursor-pointer group w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Design físico da pasta com a aba em cima */}
            <div className={`relative w-full aspect-square rounded-[16px] overflow-visible flex items-center justify-center ${isDark ? "bg-white/5" : "bg-neutral-100/30"}`}>
                
                {/* Orelha da pasta estilo arquivo */}
                <div 
                    className={`absolute -top-[5px] left-[12px] w-[54px] h-[10px] transition-all rounded-t-[4px] z-0 ${isDark ? "bg-white/10 group-hover:bg-white/20" : "bg-neutral-200/90 group-hover:bg-neutral-300"}`} 
                    style={{ clipPath: 'polygon(0 100%, 12% 0, 88% 0, 100% 100%)' }} 
                />
                
                {/* Corpo da pasta */}
                <div className={`absolute inset-0 rounded-[16px] border overflow-hidden z-10 flex items-center justify-center p-[2px] ${isDark ? "bg-[#252528] border-white/5" : "bg-[#e5e5e5] border-neutral-300/40"}`}>
                    <div className={`w-full h-full rounded-[14px] overflow-hidden relative shadow-inner ${isDark ? "bg-[#18181b]" : "bg-neutral-100"}`}>
                        {images.length > 0 ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <AnimatePresence mode="popLayout">
                                    <motion.img
                                        key={`img-${currentIndex}`}
                                        src={currentImg}
                                        alt={title}
                                        className="absolute inset-0 w-full h-full object-cover rounded-[14px]"
                                        initial={{ scale: 0.85, opacity: 0.2, zIndex: 10 }}
                                        animate={{ scale: 1, opacity: 1, zIndex: 20 }}
                                        exit={{ scale: 1.35, opacity: 0, zIndex: 30, y: -6 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                    {isHovered && images.length > 1 && (
                                        <motion.img
                                            key={`next-${currentIndex}`}
                                            src={nextImg}
                                            alt="Next"
                                            className="absolute inset-0 w-full h-full object-cover rounded-[14px]"
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 0.85, opacity: 0.35, zIndex: 10 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <span className="text-xs text-neutral-400">Vazio</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Badge de vidro translúcido com o título */}
            <div className={`mt-3 w-full backdrop-blur-md border rounded-[12px] py-2.5 flex items-center justify-center shadow-sm transition-all ${isDark ? "bg-[#252528]/80 border-white/5 group-hover:bg-[#2e2e32] group-hover:border-white/10" : "bg-[#f3f4f6]/70 border-neutral-200/40 group-hover:bg-white group-hover:border-neutral-300"}`}>
                <span className={`text-sm font-semibold font-sans tracking-wide ${isDark ? "text-white/90" : "text-neutral-700"}`}>{title}</span>
            </div>
        </div>
    );
}

const CALENDAR_CATEGORIES = ['Destaque', 'Social', 'Tecnologia', 'Ao ar livre', 'Abstrato'];

function CalendarCoverPicker({ isOpen, onClose, onSelect }: Omit<ImagePickerModalV2Props, 'variant'>) {
    const [category, setCategory] = useState('Destaque');
    const [search, setSearch] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setCategory('Destaque');
        setSearch('');
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const selectFile = (file?: File) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            onSelect(String(reader.result || ''));
            onClose();
        };
        reader.readAsDataURL(file);
    };

    const visibleSections = useMemo(() => {
        const entries = Object.entries(CALENDAR_COVER_LIBRARY);
        const scoped = category === 'Destaque' ? entries : entries.filter(([name]) => name === category);
        if (!search.trim()) return scoped;
        const normalized = search.toLocaleLowerCase('pt-BR');
        return entries.filter(([name]) => name.toLocaleLowerCase('pt-BR').includes(normalized));
    }, [category, search]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100050] flex items-center justify-center bg-black/70 p-2.5 backdrop-blur-[2px]">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} className="absolute inset-0" />
                    <motion.div
                        initial={{ opacity: 0, scale: .97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 9 }}
                        transition={{ type: 'spring', stiffness: 330, damping: 28 }} onMouseDown={(event) => event.stopPropagation()}
                        role="dialog" aria-modal="true" aria-labelledby="calendar-cover-picker-title"
                        className="relative z-10 flex h-[min(792px,calc(100vh-20px))] w-full max-w-[802px] flex-col overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#1b1c1e] text-white shadow-[0_28px_90px_rgba(0,0,0,.65)]"
                    >
                        <header className="relative flex h-[49px] shrink-0 items-center justify-center border-b border-white/[0.08] px-5">
                            <h2 id="calendar-cover-picker-title" className="text-[16px] font-bold">Escolher Imagem</h2>
                            <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-5 grid h-7 w-7 place-items-center rounded-full border-0 bg-white/10 p-0 text-zinc-400 transition-colors hover:bg-white/15 hover:text-white"><X size={16} /></button>
                        </header>

                        <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                            <div
                                onClick={() => fileRef.current?.click()}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}
                                className="flex h-[98px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.035] text-center transition-colors hover:border-white/20 hover:bg-white/[0.055]"
                            >
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
                                <strong className="text-[16px] text-zinc-200">Arraste e solte ou clique aqui para enviar.</strong>
                                <span className="mt-2 text-[14px] font-medium text-zinc-500">Ou escolha uma imagem abaixo. A proporção ideal é 3,5:1.</span>
                            </div>

                            <div className="relative shrink-0">
                                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar mais fotos" className="h-[38px] w-full rounded-lg border border-white/10 bg-[#121315] pl-9 pr-3 text-[16px] text-white outline-none placeholder:text-zinc-600 focus:border-white/40" />
                            </div>

                            <div className="flex min-h-0 flex-1 gap-4">
                                <nav className="w-[176px] shrink-0 space-y-1 overflow-y-auto pr-1">
                                    {CALENDAR_CATEGORIES.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setSearch(''); }} className={`flex h-9 w-full items-center rounded-md border-0 px-3 text-left text-[14px] font-semibold transition-colors ${category === item ? 'bg-white/10 text-white' : 'bg-transparent text-zinc-300 hover:bg-white/[0.06] hover:text-white'}`}>{item}</button>)}
                                </nav>

                                <div className="image-picker-scroll min-w-0 flex-1 overflow-y-auto pr-1">
                                    {visibleSections.length ? <div className="space-y-4">{visibleSections.map(([name, images]) => <section key={name}><h3 className="mb-2 text-[14px] font-semibold text-zinc-300">{name}</h3><div className="grid grid-cols-2 gap-1">{images.slice(0, 4).map((url, index) => <button key={url} type="button" onClick={() => { onSelect(url); onClose(); }} className="group relative aspect-[3.5/1] overflow-hidden rounded-[3px] border-0 bg-white/5 p-0"><img src={url} alt={`Capa de calendário — ${name}`} className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.025] group-hover:brightness-110" loading="lazy" />{index === 3 && images.length > 4 && <span className="absolute inset-0 grid place-items-center bg-black/45 text-[29px] font-semibold text-white">+{images.length - 4}</span>}</button>)}</div></section>)}</div> : <div className="grid h-full place-items-center text-sm text-zinc-500">Nenhuma imagem encontrada.</div>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/* ─── MAIN IMAGE PICKER MODAL COMPONENT ─── */
function EventImagePicker({ isOpen, onClose, onSelect }: Omit<ImagePickerModalV2Props, 'variant'>) {
    const [selectedCategory, setSelectedCategory] = useState("Destaque");
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        if (!isOpen) return;
        const isDarkTheme = document.documentElement.classList.contains("dark") || document.querySelector("[data-theme-dark=\"true\"]") !== null;
        setIsDark(isDarkTheme);
    }, [isOpen]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSubFolder, setActiveSubFolder] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reseta a subpasta ao mudar de categoria na barra lateral
    const handleCategoryClick = (cat: string) => {
        setSelectedCategory(cat);
        setSearchQuery("");
        if (cat === "Destaque") {
            setActiveSubFolder(null);
        } else {
            setActiveSubFolder(cat);
        }
    };

    // Upload local de imagem funcional
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onSelect(url);
            onClose();
        }
    };

    // Imagens mostradas na subpasta ativa ou na categoria ativa
    const activeImagesList = useMemo(() => {
        if (activeSubFolder) {
            return getImagesForCategory(activeSubFolder);
        }
        return getImagesForCategory(selectedCategory);
    }, [selectedCategory, activeSubFolder]);

    // Filtragem por busca
    const filteredImages = useMemo(() => {
        if (!searchQuery.trim()) return activeImagesList;
        // Se houver busca, filtra de PRESET_IMAGES (todas)
        return PRESET_IMAGES.filter(url => 
            url.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeImagesList, searchQuery]);

    const showSearchResults = searchQuery.trim().length > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                    <style dangerouslySetInnerHTML={{ __html: `
                        .image-picker-scroll::-webkit-scrollbar {
                            width: 6px;
                            height: 6px;
                        }
                        .image-picker-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .image-picker-scroll::-webkit-scrollbar-thumb {
                            background: ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"};
                            border-radius: 99px;
                        }
                        .image-picker-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(0,0,0,0.25);
                        }
                    `}} />

                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"
                    />
                    
                    {/* Modal Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 15 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className={`w-full max-w-[920px] h-[85vh] display flex flex-col overflow-hidden relative shadow-2xl z-10 rounded-[24px] border ${isDark ? "text-white border-white/8" : "text-neutral-800 border-neutral-100"}`}
                        style={{
                            background: isDark ? "rgba(20, 20, 24, 0.85)" : "rgba(255, 255, 255, 0.80)",
                            backdropFilter: "blur(40px) saturate(200%)",
                            WebkitBackdropFilter: "blur(40px) saturate(200%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-8 py-5 border-b flex-shrink-0 ${isDark ? "border-white/5" : "border-neutral-100"}`}>
                            <div className="w-8" /> {/* Espaçador para centralizar o título */}
                            <div className={`font-semibold text-[17px] font-sans tracking-wide ${isDark ? "text-white/95" : "text-neutral-800"}`}>Escolher Imagem</div>
                            <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDark ? "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800"}`}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Corpo Interno com rolagem controlada */}
                        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
                            
                            {/* 1. Área de Upload Singelo no Topo */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full h-[95px] border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200 flex-shrink-0 group ${isDark ? "border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10" : "border-neutral-200 hover:border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50"}`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                <Upload size={18} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                                <div className="text-center">
                                    <span className={`font-semibold text-xs font-sans tracking-wide ${isDark ? "text-white/90" : "text-neutral-700"}`}>Arraste e solte ou clique aqui para enviar.</span>
                                    <span className={`text-[11px] font-sans ml-1 ${isDark ? "text-white/60" : "text-neutral-400"}`}>Ou escolha uma imagem abaixo. A proporção ideal é 1:1.</span>
                                </div>
                            </div>

                            {/* 2. Buscador */}
                            <div className="relative w-full flex-shrink-0">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value.trim()) {
                                            setActiveSubFolder(null);
                                        }
                                    }}
                                    placeholder="Buscar mais fotos" 
                                    className={`w-full pl-11 pr-4 py-3 border rounded-[12px] text-sm placeholder-neutral-400 focus:outline-none focus:ring-0 transition-all font-sans ${isDark ? "bg-white/5 border-white/10 text-white focus:border-white/30" : "bg-white border-neutral-200 text-neutral-700 focus:border-neutral-400"}`}
                                />
                            </div>

                            {/* 3. Galeria (Dividida em Lado Esquerdo e Lado Direito) */}
                            <div className="flex-1 flex overflow-hidden gap-6">
                                
                                {/* Menu Lateral de Categorias */}
                                <div className="w-[180px] overflow-y-auto pr-2 flex flex-col gap-1.5 image-picker-scroll flex-shrink-0">
                                    {ALL_MENU_CATEGORIES.map((cat) => {
                                        const isSelected = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => handleCategoryClick(cat)}
                                                className={`w-full text-left px-3.5 py-2.5 rounded-[12px] text-sm font-medium transition-all ${isSelected ? (isDark ? "bg-white/15 text-white font-semibold" : "bg-neutral-100 text-neutral-900 font-semibold") : (isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50")}`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Conteúdo Direito com Abas e Imagens */}
                                <div className="flex-1 overflow-y-auto image-picker-scroll pr-1 flex flex-col gap-6">
                                    
                                    {/* Exibição em caso de resultados de busca */}
                                    {showSearchResults ? (
                                        <div className="flex flex-col gap-4">
                                            <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-white/40" : "text-neutral-400"}`}>Resultados da Busca</div>
                                            {filteredImages.length > 0 ? (
                                                <div className="grid grid-cols-4 gap-4">
                                                    {filteredImages.map((url, i) => (
                                                        <motion.div 
                                                            key={url}
                                                            onClick={() => { onSelect(url); onClose(); }}
                                                            className={`aspect-square rounded-[12px] overflow-hidden border cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-neutral-100 border-neutral-200/30"}`}
                                                            whileHover={{ scale: 1.02 }}
                                                        >
                                                            <img src={url} alt={`Search Result ${i}`} className="w-full h-full object-cover" loading="lazy" />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                                                    <ImageIcon strokeWidth={1.5} size={28} />
                                                    <span className="text-sm font-sans">Nenhuma imagem encontrada.</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : activeSubFolder ? (
                                        /* Visualização Individual de Imagens dentro da pasta/categoria */
                                        <div className="flex flex-col gap-5">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setActiveSubFolder(null);
                                                        setSelectedCategory("Destaque");
                                                    }} 
                                                    className={`text-xs font-semibold transition-colors flex items-center gap-1 font-sans ${isDark ? "text-white/60 hover:text-white" : "text-neutral-400 hover:text-neutral-700"}`}
                                                >
                                                    <ArrowLeft size={12} />
                                                    Sugestões Fauves
                                                </button>
                                                <span className={`text-xs ${isDark ? "text-white/30" : "text-neutral-300"}`}>/</span>
                                                <span className={`text-xs font-bold font-sans capitalize ${isDark ? "text-white" : "text-neutral-800"}`}>{activeSubFolder}</span>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4">
                                                {filteredImages.map((url, i) => (
                                                    <motion.div 
                                                        key={url}
                                                        onClick={() => { onSelect(url); onClose(); }}
                                                        className={`aspect-square rounded-[12px] overflow-hidden border cursor-pointer transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-neutral-100 border-neutral-200/30"}`}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" loading="lazy" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Visualização Padrão: Destaque Primavera + Grade de Pastas */
                                        <div className="flex flex-col gap-6">
                                            
                                            {/* Card de Destaque no Topo (Primavera) */}
                                            <HighlightCard 
                                                title="Primavera" 
                                                images={getImagesForCategory("primavera")} 
                                                isDark={isDark} 
                                                onClick={() => {
                                                    setActiveSubFolder("Primavera");
                                                    setSelectedCategory("Primavera");
                                                }}
                                            />

                                            {/* Grade de Pastas */}
                                            <div className="grid grid-cols-3 gap-6">
                                                {DISPLAY_FOLDERS.map((folderName) => (
                                                    <FolderCard
                                                        key={folderName}
                                                        title={folderName}
                                                        images={getImagesForCategory(folderName)}
                                                        onClick={() => {
                                                            setActiveSubFolder(folderName);
                                                            setSelectedCategory(folderName);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default function ImagePickerModalV2({ variant = 'event', ...props }: ImagePickerModalV2Props) {
    return variant === 'calendar' ? <CalendarCoverPicker {...props} /> : <EventImagePicker {...props} />;
}
