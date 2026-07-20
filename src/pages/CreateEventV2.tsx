"use client";

import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronDown,
    Calendar as CalendarIcon,
    MapPin,
    CheckIcon,
    Loader2,
    Plus,
    X,
    Image as ImageIcon,
    Clock,
    Globe,
    Info,
    ChevronRight,
    Search,
    Shuffle,
    Sparkles,
    Star,
    Heart,
    Circle
} from "lucide-react";
import HeaderV2 from "@/components/v2/HeaderV2";
import ImagePickerModalV2, { PRESET_IMAGES } from "@/components/v2/ImagePickerModalV2";
import MinimalThemeImg from "@/assets/minimal.jpg";
import DescriptionModalV2 from "@/components/v2/DescriptionModalV2";
import AISuggestionModal from "@/components/v2/AISuggestionModal";
import { LuxLocationPicker } from "@/components/v2/LuxLocationPicker";
import { LuxDatePicker } from '../components/v2/LuxDatePicker';
import { LuxTimePicker } from '../components/v2/LuxTimePicker';
import TicketPriceModal from "@/components/v2/TicketPriceModal";
import EventCapacityModal from "@/components/v2/EventCapacityModal";
import { FauvesSwitch } from "@/components/v2/FauvesSwitch";
import { fetchApi, resolveImageUrl } from '../lib/apiBase';
import { toast } from '@/components/ui/sonner';
import RequireOrganization from '@/components/RequireOrganization';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useTheme } from '@/context/ThemeContext';



const QUANTUM_PRESETS: Record<string, { name: string, colors: string[] }> = {
    sonhador: { name: 'Sonhador', colors: ['#b4b6f9', '#d5b2f2', '#9ce4eb'] },
    verao: { name: 'Verão', colors: ['#a5c6f9', '#9edef6', '#fce19b'] },
    melao: { name: 'Melão', colors: ['#fca5a5', '#fde293', '#9fedbc'] },
    barbie: { name: 'Barbie', colors: ['#f9a8d4', '#f5a3c7', '#fecca2'] },
    por_do_sol: { name: 'Pôr do Sol', colors: ['#fde185', '#fdb682', '#fca1a1'] },
    oceano: { name: 'Oceano', colors: ['#a3ecf4', '#9dd6fc', '#a7cbfa'] },
    floresta: { name: 'Floresta', colors: ['#adebd0', '#b0f0c9', '#a0ecdd'] },
    lavanda: { name: 'Lavanda', colors: ['#dfbef7', '#caa3f7', '#f5b6dc'] },
};

const stripHtml = (html: string) => {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
};

const getAppleEmojiUrl = (emoji: string): string => {
    try {
        const codePoints = [...emoji]
            .map(char => char.codePointAt(0)?.toString(16))
            .filter(Boolean)
            .join('-');
        return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${codePoints}.png`;
    } catch (e) {
        return '';
    }
};

export default function CreateEventV2() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { orgs, loading: loadingOrgs, addOrganization } = useOrganization();
    const { isDark: siteIsDark } = useTheme();

    // Form State
    const [eventName, setEventName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("19:00");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("22:00");
    const [locationData, setLocationData] = useState<{ type: string; address?: string; url?: string }>({ type: "" });
    const [description, setDescription] = useState("");
    const [coverImage, setCoverImage] = useState<string | null>(() => {
        const randomIndex = Math.floor(Math.random() * PRESET_IMAGES.length);
        return PRESET_IMAGES[randomIndex];
    });
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");

    // Advanced Options State
    const [isFree, setIsFree] = useState(true);
    const [price, setPrice] = useState<number | null>(null);
    const [requireApproval, setRequireApproval] = useState(false);
    const [isLimited, setIsLimited] = useState(false);
    const [capacity, setCapacity] = useState<number | null>(null);
    const [waitlist, setWaitlist] = useState(false);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeFocus, setActiveFocus] = useState<string | null>(null);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
    const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
    const [isCreateCalendarModalOpen, setIsCreateCalendarModalOpen] = useState(false);
    const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState('minimal');
    const [quantumPreset, setQuantumPreset] = useState('sonhador');
    const [customColor, setCustomColor] = useState<string | null>(null);
    const [customFont, setCustomFont] = useState<string | null>(null);
    const [customStyle, setCustomStyle] = useState<string>('Padrão');
    const [customDisplay, setCustomDisplay] = useState<string>('Automático');
    const [isPublic, setIsPublic] = useState(true);
    const [selectedEmoji, setSelectedEmoji] = useState<string>('🥳');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [selectedTimezone, setSelectedTimezone] = useState({
        name: "America/Sao_Paulo",
        city: "São Paulo",
        gmt: "GMT-03:00"
    });
    const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);
    const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");

    const TIMEZONE_OPTIONS = [
        { name: "America/Los_Angeles", city: "Los Angeles", gmt: "GMT-07:00", label: "Horário do Pacífico - Los Angeles" },
        { name: "America/Chicago", city: "Chicago", gmt: "GMT-05:00", label: "Horário Central - Chicago" },
        { name: "America/Toronto", city: "Toronto", gmt: "GMT-04:00", label: "Horário do Leste - Toronto" },
        { name: "America/New_York", city: "Nova York", gmt: "GMT-04:00", label: "Horário do Leste - Nova York" },
        { name: "America/Sao_Paulo", city: "São Paulo", gmt: "GMT-03:00", label: "Horário Padrão de Brasília - São Paulo" },
        { name: "America/Fortaleza", city: "Fortaleza", gmt: "GMT-03:00", label: "Horário Padrão de Brasília - Fortaleza" },
        { name: "Europe/London", city: "Londres", gmt: "GMT+01:00", label: "Horário Reino Unido - Londres" },
        { name: "Europe/Madrid", city: "Madrid", gmt: "GMT+02:00", label: "Horário da Europa Central - Madrid" },
        { name: "Europe/Paris", city: "Paris", gmt: "GMT+02:00", label: "Horário da Europa Central - Paris" },
        { name: "Asia/Dubai", city: "Dubai", gmt: "GMT+04:00", label: "Horário do Golfo - Dubai" },
        { name: "Asia/Kolkata", city: "Calcutá", gmt: "GMT+05:30", label: "Horário Padrão da Índia - Calcutá" },
        { name: "Asia/Singapore", city: "Singapura", gmt: "GMT+08:00", label: "Horário Padrão de Singapura - Singapura" },
        { name: "Asia/Tokyo", city: "Tóquio", gmt: "GMT+09:00", label: "Horário Padrão do Japão - Tóquio" },
        { name: "Pacific/Niue", city: "Niue", gmt: "GMT-11:00", label: "Horário de Niue - Niue" },
        { name: "Pacific/Pago_Pago", city: "Pago Pago", gmt: "GMT-11:00", label: "Horário Padrão de Samoa - Pago Pago" },
        { name: "Pacific/Honolulu", city: "Honolulu", gmt: "GMT-10:00", label: "Horário Padrão do Havaí e Ilhas Aleutas - Honolulu" },
        { name: "Pacific/Rarotonga", city: "Rarotonga", gmt: "GMT-10:00", label: "Horário Padrão das Ilhas Cook - Rarotonga" }
    ];

    // Histórico de customizações por tema para persistir as escolhas do usuário
    const themeHistory = useRef<Record<string, {
        customColor: string | null;
        customFont: string | null;
        customStyle: string;
        customDisplay: string;
        selectedEmoji: string;
        quantumPreset: string;
    }>>({
        minimal: {
            customColor: null,
            customFont: null,
            customStyle: 'Padrão',
            customDisplay: 'Automático',
            selectedEmoji: '🥳',
            quantumPreset: 'sonhador'
        },
        quantum: {
            customColor: null,
            customFont: null,
            customStyle: 'Padrão',
            customDisplay: 'Claro',
            selectedEmoji: '🥳',
            quantumPreset: 'sonhador'
        },
        warp: {
            customColor: null,
            customFont: null,
            customStyle: 'Padrão',
            customDisplay: 'Escuro',
            selectedEmoji: '🥳',
            quantumPreset: 'sonhador'
        },
        emoji: {
            customColor: null,
            customFont: null,
            customStyle: 'Flutuante',
            customDisplay: 'Escuro',
            selectedEmoji: '🥳',
            quantumPreset: 'sonhador'
        },
        confetti: {
            customColor: null,
            customFont: null,
            customStyle: 'Festa',
            customDisplay: 'Automático',
            selectedEmoji: '🥳',
            quantumPreset: 'sonhador'
        },
        pattern: {
            customColor: null,
            customFont: null,
            customStyle: 'Padrão',
            customDisplay: 'Automático',
            selectedEmoji: '🥳',
            quantumPreset: 'sonhador'
        },
        seasonal: {
            customColor: null,
            customFont: null,
            customStyle: 'Padrão',
            customDisplay: 'Automático',
            selectedEmoji: '🥳',
            quantumPreset: 'sonhador'
        }
    });

    const handleThemeChange = (newThemeId: string) => {
        // 1. Salva a configuração atual do tema ativo antes de mudar
        if (selectedThemeId) {
            themeHistory.current[selectedThemeId] = {
                customColor,
                customFont,
                customStyle,
                customDisplay,
                selectedEmoji,
                quantumPreset
            };
        }

        // 2. Altera o tema ativo
        setSelectedThemeId(newThemeId);

        // 3. Recupera o histórico do novo tema
        const saved = themeHistory.current[newThemeId];
        if (saved) {
            setCustomColor(saved.customColor);
            setCustomFont(saved.customFont);
            setCustomStyle(saved.customStyle);
            setCustomDisplay(saved.customDisplay);
            setSelectedEmoji(saved.selectedEmoji);
            setQuantumPreset(saved.quantumPreset);
        }
    };

    interface ThemeConfig {
        id: string;
        name: string;
        img: string;
        fontFamily: string;
        bgColor: string;
        baseRgb: string;
        textColor: string;
        mutedColor: string;
        accentColor: string;
    }

    const themes: ThemeConfig[] = [
        {
            id: 'minimal',
            name: 'Minimalista',
            img: 'https://images.lumacdn.com/themes/thumb/minimal.jpg',
            fontFamily: 'Inter, sans-serif',
            bgColor: '#f7f8f9',
            baseRgb: '19, 21, 23',
            textColor: '#131517',
            mutedColor: '#737577',
            accentColor: '#000000',
        },
        {
            id: 'quantum',
            name: 'Quantum',
            img: 'https://images.lumacdn.com/themes/thumb/quantum.jpg',
            fontFamily: '"Space Mono", monospace',
            bgColor: '#000000',
            baseRgb: '255, 255, 255',
            textColor: '#ffffff',
            mutedColor: 'rgba(255, 255, 255, 0.6)',
            accentColor: '#ffffff',
        },
        {
            id: 'warp',
            name: 'Warp',
            img: 'https://images.lumacdn.com/themes/thumb/warp.jpg',
            fontFamily: '"Syne", sans-serif',
            bgColor: '#1a0b2e',
            baseRgb: '255, 255, 255',
            textColor: '#ffffff',
            mutedColor: 'rgba(255, 255, 255, 0.6)',
            accentColor: '#f43f5e',
        },
        {
            id: 'emoji',
            name: 'Emoji',
            img: 'https://images.lumacdn.com/themes/thumb/emoji.jpg',
            fontFamily: '"Comic Neue", cursive, sans-serif',
            bgColor: '#fffbea',
            baseRgb: '19, 21, 23',
            textColor: '#333333',
            mutedColor: '#666666',
            accentColor: '#f59e0b',
        },
        {
            id: 'confetti',
            name: 'Confete',
            img: 'https://images.lumacdn.com/themes/thumb/confetti.jpg',
            fontFamily: '"Playfair Display", serif',
            bgColor: '#fdf4ff',
            baseRgb: '19, 21, 23',
            textColor: '#4a044e',
            mutedColor: '#86198f',
            accentColor: '#d946ef',
        },
        {
            id: 'pattern',
            name: 'Padrão',
            img: 'https://images.lumacdn.com/themes/thumb/pattern.jpg',
            fontFamily: 'Inter, sans-serif',
            bgColor: '#e0f2fe',
            baseRgb: '255, 255, 255',
            textColor: '#0c4a6e',
            mutedColor: '#0369a1',
            accentColor: '#0284c7',
        },
        /* Sazonal desativado temporariamente para a V2
        {
            id: 'seasonal',
            name: 'Sazonal',
            img: 'https://images.lumacdn.com/themes/thumb/seasonal-floral.jpg',
            fontFamily: '"Lora", serif',
            bgColor: '#ecfdf5',
            baseRgb: '19, 21, 23',
            textColor: '#064e3b',
            mutedColor: '#047857',
            accentColor: '#10b981',
        },
    
        */];
 
    const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes[0];

    const nameInputRef = useRef<HTMLTextAreaElement>(null);

    // ===========================================================
    // Sistema de Paleta de Cores ââ‚¬â€ derivado do HUE da imagem
    // ===========================================================

    /** Converte hex ââ€ â€™ { h, s, l } (0-360, 0-100, 0-100) */
    const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
        if (!hex || hex.length < 6) return null;
        try {
            const clean = hex.startsWith('#') ? hex.slice(1) : hex;
            const r = parseInt(clean.slice(0, 2), 16) / 255;
            const g = parseInt(clean.slice(2, 4), 16) / 255;
            const b = parseInt(clean.slice(4, 6), 16) / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0;
            const l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return { h: h * 360, s: s * 100, l: l * 100 };
        } catch { return null; }
    };

    /** Converte HSL para string "R, G, B" para compatibilidade com opacidades CSS */
    const hslToRgbString = (h: number, s: number, l: number): string => {
        const sFraction = s / 100;
        const lFraction = l / 100;
        const c = (1 - Math.abs(2 * lFraction - 1)) * sFraction;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = lFraction - c / 2;
        let r1 = 0, g1 = 0, b1 = 0;
        if (h < 60) { r1 = c; g1 = x; }
        else if (h < 120) { r1 = x; g1 = c; }
        else if (h < 180) { g1 = c; b1 = x; }
        else if (h < 240) { g1 = x; b1 = c; }
        else if (h < 300) { r1 = x; b1 = c; }
        else { r1 = c; b1 = x; }
        return `${Math.round((r1 + m) * 255)}, ${Math.round((g1 + m) * 255)}, ${Math.round((b1 + m) * 255)}`;
    };

    /**
     * Deriva paleta completa a partir da cor média extraída da imagem.
     * O HUE é preservado; saturação e luminosidade são controladas para
     * garantir contraste semelhante ao Luma.
     */
    const deriveColorPalette = (hex: string) => {
        const hsl = hexToHsl(hex);
        if (!hsl) return null;

        const { h } = hsl;
        // Saturação base: usa a saturação real, mas com floor de 40% e cap de 80%
        const rawS = hsl.s;
        const sBase = Math.max(rawS, 40); // sempre pelo menos 40% de saturação

        const sText = Math.min(sBase * 0.7, 55);

        return {
            // Fundo: muito claro, saturação baixa (~30%), hue preservado
            bg: `hsl(${h}, ${Math.min(sBase * 0.5, 35)}%, 94%)`,
            // Linha de formulário: levemente mais saturado que o fundo
            rowBg: `hsl(${h}, ${Math.min(sBase * 0.6, 40)}%, 89%)`,
            // Texto principal: escuro e com cor, não preto neutro
            text: `hsl(${h}, ${sText}%, 22%)`,
            // Texto secundário / muted
            muted: `hsl(${h}, ${Math.min(sBase * 0.5, 45)}%, 42%)`,
            // Accent / botão: vibrante ââ‚¬â€ mesma lógica do Luma
            accent: `hsl(${h}, ${Math.min(sBase * 1.2, 75)}%, 48%)`,
            // Accent hover
            accentHover: `hsl(${h}, ${Math.min(sBase * 1.3, 80)}%, 40%)`,
            // RGB string para opacidades: usamos o RGB da cor escura do texto (22% luminosidade)
            // para que todas as variáveis baseadas em opacidade (borders, placeholders, text-muted)
            // tenham uma belíssima tonalidade derivada da imagem.
            baseRgb: hslToRgbString(h, sText, 22),
        };
    };

    // Paleta derivada (atualizada sempre que customColor muda)
    const rawDerivedPalette = React.useMemo(
        () => (customColor ? deriveColorPalette(customColor) : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [customColor]
    );

    const derivedPalette = rawDerivedPalette;
    const activeCustomColor = customColor;

    // --- Helpers legados (usados pelo Quantum) ---
    const getPastelColor = (hex: string) => {
        const hsl = hexToHsl(hex);
        if (!hsl) return hex;
        return `hsl(${hsl.h}, ${Math.min(hsl.s * 0.5, 35)}%, 94%)`;
    };

    const getDeepColor = (hex: string) => {
        const hsl = hexToHsl(hex);
        if (!hsl) return '#000000';
        return `hsl(${hsl.h}, ${Math.min(hsl.s, 80)}%, 6%)`;
    };

    const getThemeTextColor = (_hex: string, isDark: boolean) => {
        if (isDark) return '#ffffff';
        if (derivedPalette) return derivedPalette.text;
        const hsl = hexToHsl(_hex);
        if (!hsl) return '#000000';
        return `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)`;
    };

    // Extrai a cor predominante da imagem no frontend em tempo real usando Canvas
    const coverImageRef = useRef<HTMLImageElement>(null);
    const warpCanvasRef = useRef<HTMLCanvasElement>(null);
    const quantumCanvasRef = useRef<HTMLCanvasElement>(null);
    const emojiCanvasRef = useRef<HTMLCanvasElement>(null);
    const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

    // Extrai a cor predominante diretamente da imagem decodificada e renderizada no DOM
    const handleCoverImageLoad = () => {
        const img = coverImageRef.current;
        if (!img || !img.complete || img.naturalWidth === 0) return;

        // Pequeno delay para garantir que a imagem está totalmente pintada
        requestAnimationFrame(() => {
            try {
                const SAMPLE = 20; // grade 20x20 para amostragem melhor
                const canvas = document.createElement('canvas');
                canvas.width = SAMPLE;
                canvas.height = SAMPLE;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;
                
                ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
                const imgData = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
                
                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                for (let i = 0; i < imgData.length; i += 4) {
                    const r = imgData[i];
                    const g = imgData[i + 1];
                    const b = imgData[i + 2];
                    const a = imgData[i + 3];
                    if (a > 100) { // Ignora pixels semi-transparentes
                        rSum += r;
                        gSum += g;
                        bSum += b;
                        count++;
                    }
                }

                if (count === 0) return;

                const rAvg = Math.round(rSum / count);
                const gAvg = Math.round(gSum / count);
                const bAvg = Math.round(bSum / count);

                const toHex = (c: number) => {
                    const hex = c.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };
                const hexColor = `#${toHex(rAvg)}${toHex(gAvg)}${toHex(bAvg)}`;
                
                // Só atualiza se a cor for visualmente distinta de branco/cinza puro
                const isTooNeutral = rAvg > 230 && gAvg > 230 && bAvg > 230;
                if (hexColor && !isTooNeutral) {
                    setCustomColor(hexColor);
                } else if (hexColor && hexColor !== '#000000') {
                    setCustomColor(hexColor);
                }
            } catch (e) {
                // Fallback silencioso ââ‚¬â€ pode ocorrer com imagens sem CORS em modo dev
                console.warn('Extração de cor bloqueada por CORS (normal em dev com imagens externas):', e);
            }
        });
    };

    // Converte a cor hexadecimal para string "R, G, B" para opacidades CSS translúcidas
    const hexToRgbString = (hex: string): string => {
        if (!hex || hex.length < 6) return '19, 21, 23';
        try {
            const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
            const r = parseInt(cleanHex.slice(0, 2), 16);
            const g = parseInt(cleanHex.slice(2, 4), 16);
            const b = parseInt(cleanHex.slice(4, 6), 16);
            return `${r}, ${g}, ${b}`;
        } catch (e) {
            return '19, 21, 23';
        }
    };

    // Determine if the current background is dark
    const isBackgroundDark = useMemo(() => {
        const bg = derivedPalette ? derivedPalette.bg : (activeCustomColor ? getPastelColor(activeCustomColor) : selectedTheme.bgColor);
        if (bg.startsWith('hsl')) {
            const parts = bg.split(',');
            const l = parseInt(parts[parts.length - 1]);
            return l < 50;
        }
        const hex = bg.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    }, [derivedPalette, activeCustomColor, selectedTheme]);

    const effectiveIsDark = useMemo(() => {
        // Sazonal sempre claro
        if (selectedThemeId === 'seasonal') return false;
        // Warp sempre escuro (canvas preto é necessário para screen blend)
        if (selectedThemeId === 'warp') return true;
        if (customDisplay === 'Escuro') return true;
        if (customDisplay === 'Claro') return false;
        
        // "Automático" respeita a preferência global da conta. No modo
        // "Sistema", o próprio ThemeContext acompanha o sistema operacional.
        return siteIsDark;
    }, [selectedThemeId, customDisplay, siteIsDark]);

    const effectiveBaseRgb = useMemo(() => {
        if (effectiveIsDark) return '255, 255, 255'; // No tema escuro, a base de contraste deve ser sempre branca!
        if (selectedThemeId === 'warp') return '255, 255, 255';
        if (derivedPalette) return derivedPalette.baseRgb;
        if (activeCustomColor) return hexToRgbString(activeCustomColor);
        if (selectedThemeId === 'quantum') {
            return '19, 21, 23';
        }
        return selectedTheme.baseRgb;
    }, [derivedPalette, activeCustomColor, selectedThemeId, effectiveIsDark, selectedTheme.baseRgb]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Selecione a data";
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
        } catch (e) {
            return dateStr;
        }
    };

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    }, []);

    // Auto-expand textarea
    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.style.height = 'auto';
            nameInputRef.current.style.height = `${nameInputRef.current.scrollHeight}px`;
        }
    }, [eventName]);

    useEffect(() => {
        if (orgs && orgs.length > 0 && !selectedOrgId) {
            setSelectedOrgId(orgs[0].id);
        }
    }, [orgs, selectedOrgId]);

    // Sincroniza a largura máxima do header com o conteúdo abaixo
    useEffect(() => {
        document.documentElement.style.setProperty('--page-max-width', '960px');
        return () => {
            document.documentElement.style.removeProperty('--page-max-width');
        };
    }, []);

    // Re-extrai a cor toda vez que coverImage muda (mesmo quando em cache ââ‚¬â€ onLoad pode não disparar)
    useEffect(() => {
        if (!coverImage) return;

        // Tenta usar o img do DOM se já estiver carregado
        const tryExtractFromDom = () => {
            const img = coverImageRef.current;
            if (img && img.complete && img.naturalWidth > 0 && img.src && img.src !== '') {
                handleCoverImageLoad();
                return true;
            }
            return false;
        };

        // Se o elemento ainda não está no DOM ou não carregou, cria um Image temporário
        if (!tryExtractFromDom()) {
            const tempImg = new Image();
            if (coverImage.startsWith('http')) {
                tempImg.crossOrigin = 'anonymous';
            }
            tempImg.onload = () => {
                try {
                    const SAMPLE = 20;
                    const canvas = document.createElement('canvas');
                    canvas.width = SAMPLE;
                    canvas.height = SAMPLE;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) return;
                    ctx.drawImage(tempImg, 0, 0, SAMPLE, SAMPLE);
                    const imgData = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
                    let rSum = 0, gSum = 0, bSum = 0, count = 0;
                    for (let i = 0; i < imgData.length; i += 4) {
                        const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2], a = imgData[i + 3];
                        if (a > 100) { rSum += r; gSum += g; bSum += b; count++; }
                    }
                    if (count === 0) return;
                    const rAvg = Math.round(rSum / count);
                    const gAvg = Math.round(gSum / count);
                    const bAvg = Math.round(bSum / count);
                    const toHex = (c: number) => c.toString(16).padStart(2, '0');
                    const hexColor = `#${toHex(rAvg)}${toHex(gAvg)}${toHex(bAvg)}`;
                    if (hexColor && hexColor !== '#000000') setCustomColor(hexColor);
                } catch (e) {
                    console.warn('Extração de cor (temp img) bloqueada:', e);
                }
            };
            tempImg.src = coverImage;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coverImage]);

    // Efeito de Túnel Espacial 3D Rotativo (Warp) — Arco-íris por ângulo
    useEffect(() => {
        if (selectedThemeId !== 'warp') return;

        const canvas = warpCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Determina o hue base a partir da cor selecionada pelo usuário
        const getBaseHue = (): number => {
            if (derivedPalette) {
                const m = derivedPalette.accent.match(/hsl\((\d+)/);
                if (m) return parseInt(m[1]);
            }
            if (customColor) {
                const hex = customColor.startsWith('#') ? customColor.slice(1) : customColor;
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                if (max === min) return 0;
                const d = max - min;
                let h = 0;
                if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
                else if (max === g) h = (b - r) / d + 2;
                else h = (r - g) / d + 4;
                return Math.round(h * 60);
            }
            return 300; // Rosa/roxo clássico do Warp
        };

        const baseHue = getBaseHue();

        const numStars = 140; // Reduzido de 320 para 140 para um visual elegante, menos poluído e de alta performance

        interface Star {
            x: number;
            y: number;
            z: number;
            speed: number;
            hueOffset: number;
            history: { x: number, y: number, z: number }[];
        }

        // Quando há cor personalizada, as estrelas ficam em tons dessa cor (spread ±80°)
        // Quando não há cor, arco-íris completo (spread 360°)
        const hasCustomColor = !!(customColor || derivedPalette);
        const hueSpread = hasCustomColor ? 160 : 360; // largura em graus do espectro

        const stars: Star[] = [];
        for (let i = 0; i < numStars; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 450;
            const hueOffset = hasCustomColor
                ? ((angle / (Math.PI * 2)) * hueSpread) - hueSpread / 2
                : (angle / (Math.PI * 2)) * 360;
            stars.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                z: Math.random() * 1000,
                speed: 0.8 + Math.random() * 1.8,
                hueOffset,
                history: [],
            });
        }

        let globalRotation = 0; // acumula a rotação para calcular hue dinâmico

        const animate = () => {
            // Limpa o canvas inteiramente com a cor de fundo do Warp sólida
            // Isso impossibilita qualquer acúmulo ou rastro cinza na tela por definição!
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            const time = Date.now();
            // Oscilação de velocidade: ciclo completo de aceleração e desaceleração a cada ~10.5 segundos (Math.sin periódico)
            const wave = Math.sin(time * 0.0006);
            // Fator de velocidade varia suavemente entre 0.3 (lento, calmo e majestoso) e 4.5 (hiper-velocidade de dobra espacial)
            const speedFactor = 2.4 + wave * 2.1;

            // Velocidade angular de rotação acompanha perfeitamente a intensidade centrífuga da aceleração!
            const angularSpeed = 0.00015 * speedFactor;
            globalRotation += angularSpeed;

            const cosA = Math.cos(angularSpeed);
            const sinA = Math.sin(angularSpeed);

            for (let i = 0; i < numStars; i++) {
                const star = stars[i];

                // Salva a posição 3D atual no histórico antes do deslocamento e rotação
                star.history.push({ x: star.x, y: star.y, z: star.z });
                if (star.history.length > 6) {
                    star.history.shift();
                }

                // Velocidade de aproximação individual multiplicada pelo fator de oscilação global
                star.z -= star.speed * speedFactor;

                // Rotação espiral centrífuga
                const rx = star.x * cosA - star.y * sinA;
                const ry = star.x * sinA + star.y * cosA;
                star.x = rx;
                star.y = ry;

                if (star.z <= 0) {
                    star.z = 1000;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 50 + Math.random() * 450;
                    star.x = Math.cos(angle) * dist;
                    star.y = Math.sin(angle) * dist;
                    star.hueOffset = hasCustomColor
                        ? ((angle / (Math.PI * 2)) * hueSpread) - hueSpread / 2
                        : (angle / (Math.PI * 2)) * 360;
                    star.history = [];
                }

                // Desenha a estrela e sua cauda tridimensional
                const points = [...star.history, { x: star.x, y: star.y, z: star.z }];
                
                for (let j = 0; j < points.length - 1; j++) {
                    const p1 = points[j];
                    const p2 = points[j + 1];

                    // Projeção perspectiva 3D
                    const k1 = 140 / p1.z;
                    const k2 = 140 / p2.z;

                    const sx1 = cx + p1.x * k1;
                    const sy1 = cy + p1.y * k1;
                    const sx2 = cx + p2.x * k2;
                    const sy2 = cy + p2.y * k2;

                    // Desenha o segmento de linha se estiver dentro dos limites do canvas
                    if (
                        sx1 >= 0 && sx1 <= width &&
                        sy1 >= 0 && sy1 <= height &&
                        sx2 >= 0 && sx2 <= width &&
                        sy2 >= 0 && sy2 <= height
                    ) {
                        const hue = (baseHue + star.hueOffset + globalRotation * 12) % 360;
                        const saturation = 85;
                        const lightness = 65;

                        // A cauda decai gradativamente em opacidade e espessura
                        const ratio = (j + 1) / points.length; // 0.0 a 1.0 (cabeça)
                        const alpha = Math.min(k2 * 2.8, 0.95) * ratio;

                        ctx.beginPath();
                        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                        ctx.lineWidth = Math.max(Math.min(2.5 * k2, 3.5) * ratio, 0.5);
                        ctx.lineCap = 'round';
                        ctx.moveTo(sx1, sy1);
                        ctx.lineTo(sx2, sy2);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [selectedThemeId, customColor, derivedPalette, effectiveIsDark]);

    // Efeito de Gradientes Fluidos Orgânicos (GradFlow) do Tema Quantum
    useEffect(() => {
        if (selectedThemeId !== 'quantum') return;

        const canvas = quantumCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        // Usamos uma resolução menor de canvas (dividida por 4)
        // para obter altíssimo desempenho, pois o filtro blur(60px) do CSS
        // suaviza e mistura perfeitamente os pixels para criar a fusão fluida.
        let width = (canvas.width = window.innerWidth / 4);
        let height = (canvas.height = window.innerHeight / 4);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth / 4;
            height = canvas.height = window.innerHeight / 4;
        };

        window.addEventListener('resize', handleResize);

        // Bolhas de gradiente que se fundem (blobs do GradFlow)
        const blobs = [
            { x: 0, y: 0, r: 90, color: '#6366f1' },
            { x: width, y: height, r: 110, color: '#ec4899' },
            { x: width / 2, y: 0, r: 95, color: '#a855f7' },
            { x: 0, y: height / 2, r: 85, color: '#2563eb' }
        ];

        // Sincroniza as cores dos blobs com o preset selecionado
        const updateColors = () => {
            const presetColors = QUANTUM_PRESETS[quantumPreset]?.colors || ['#6366f1', '#ec4899', '#a855f7'];
            blobs[0].color = presetColors[0];
            blobs[1].color = presetColors[1] || presetColors[0];
            blobs[2].color = presetColors[2] || presetColors[0];
            blobs[3].color = presetColors[0] + '80';
        };

        const animate = () => {
            const time = Date.now();
            updateColors();

            const isDark = effectiveIsDark;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = isDark ? '#000000' : '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Se for escuro, usamos composição "screen" para mesclar com brilho
            ctx.globalCompositeOperation = isDark ? 'screen' : 'source-over';

            blobs.forEach((blob, i) => {
                // Oscilação suave senoidal e cossenoide tridimensional baseada no tempo
                const speed = 0.0006;
                const offset = i * 15;
                blob.x = (width / 2) + Math.sin(time * speed + offset) * (width * 0.45);
                blob.y = (height / 2) + Math.cos(time * speed * 1.15 + offset) * (height * 0.45);

                const grad = ctx.createRadialGradient(
                    blob.x, blob.y, 0,
                    blob.x, blob.y, blob.r
                );
                grad.addColorStop(0, blob.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [selectedThemeId, customColor, derivedPalette, effectiveIsDark, quantumPreset, selectedTheme.bgColor]);

    // Efeito de Animação de Emojis Flutuantes do Tema Emoji
    useEffect(() => {
        if (selectedThemeId !== 'emoji') return;

        const canvas = emojiCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Se o emoji selecionado estiver corrompido, usa o padrão 🔥
        const emojiToDraw = (selectedEmoji && !selectedEmoji.includes('í') && !selectedEmoji.includes('Â')) 
            ? selectedEmoji 
            : '🔥';

        // Pré-renderiza a imagem de emoji da Apple de alta resolução em um canvas temporário (offscreen).
        // Isso permite utilizar emojis com o belo design 3D da Apple em todas as plataformas (inclusive Windows).
        const emojiCacheCanvas = document.createElement('canvas');
        const cacheSize = 64; // tamanho nativo de pixel da imagem na CDN (64x64px) para compatibilidade total
        emojiCacheCanvas.width = cacheSize;
        emojiCacheCanvas.height = cacheSize;
        const cacheCtx = emojiCacheCanvas.getContext('2d');

        // Carrega a imagem oficial da Apple
        const appleEmojiImg = new Image();
        appleEmojiImg.crossOrigin = 'anonymous'; // CORS para desenhar no canvas com segurança
        let isImageLoaded = false;

        appleEmojiImg.onload = () => {
            if (cacheCtx) {
                cacheCtx.clearRect(0, 0, cacheSize, cacheSize);
                // Desenha a imagem ocupando todos os 64px pixels nativos sem corte
                cacheCtx.drawImage(appleEmojiImg, 0, 0, cacheSize, cacheSize);
                isImageLoaded = true;
            }
        };

        appleEmojiImg.src = getAppleEmojiUrl(emojiToDraw);

        const numParticles = 16;
        interface EmojiParticle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            scale: number;
            rotation: number;
            rotationSpeed: number;
            opacity: number;
            angle: number; 
            angleSpeed: number;
        }

        const particles: EmojiParticle[] = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push(createParticle(true));
        }

        function createParticle(init = false): EmojiParticle {
            const scale = 70 + Math.random() * 60; // tamanho gigante e premium (de 70px a 130px)
            const opacity = 1.0; // sem opacidade (100% sólido)
            const rotation = Math.random() * Math.PI * 2;
            const rotationSpeed = (Math.random() - 0.5) * 0.007; // rotação elegante no espaço
            const angle = Math.random() * Math.PI * 2;
            const angleSpeed = 0.003 + Math.random() * 0.006; // oscilação dinâmica

            let x = Math.random() * width;
            let y = Math.random() * height;
            let vx = (Math.random() - 0.5) * 0.38;
            let vy = (Math.random() - 0.5) * 0.38;

            // Se for chuva ou carnaval, ajusta velocidade inicial de forma mais lenta e suave
            if (customStyle === 'Chuva') {
                y = init ? Math.random() * height : -50;
                vy = 0.3 + Math.random() * 0.4; 
                vx = (Math.random() - 0.5) * 0.1;
            } else if (customStyle === 'Festa' || customStyle === 'Carnaval') {
                y = init ? Math.random() * height : height + 50;
                vy = -0.2 - Math.random() * 0.4; 
                vx = (Math.random() - 0.5) * 0.3;
            } else if (customStyle === 'Espiral') {
                x = width / 2;
                y = height / 2;
                const angleRad = Math.random() * Math.PI * 2;
                const speed = 0.15 + Math.random() * 0.25;
                vx = Math.cos(angleRad) * speed;
                vy = Math.sin(angleRad) * speed;
            } else {
                // Flutuante padrão: direções suaves em 2D (estilo gravidade zero no espaço, mas perceptivelmente ativo)
                // Começa em qualquer ponto da tela
                y = Math.random() * height;
                vx = (Math.random() - 0.5) * 0.38; // velocidade calma ativa no eixo X
                vy = (Math.random() - 0.5) * 0.38; // velocidade calma ativa no eixo Y
            }

            return { x, y, vx, vy, scale, rotation, rotationSpeed, opacity, angle, angleSpeed };
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // 1. Resolve Colisões Físicas de Círculos 2D entre todas as partículas (Elastic Collision)
            for (let i = 0; i < numParticles; i++) {
                for (let j = i + 1; j < numParticles; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    const r1 = p1.scale / 2;
                    const r2 = p2.scale / 2;
                    const minDist = r1 + r2;

                    if (dist < minDist && dist > 0) {
                        // Resolução de penetração (empurra as duas para fora)
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;

                        p1.x -= nx * overlap * 0.5;
                        p1.y -= ny * overlap * 0.5;
                        p2.x += nx * overlap * 0.5;
                        p2.y += ny * overlap * 0.5;

                        // Conservação do Momento Linear (Elastic Collision Response)
                        const rvx = p2.vx - p1.vx;
                        const rvy = p2.vy - p1.vy;
                        const velAlongNormal = rvx * nx + rvy * ny;

                        // Só colide se as partículas estiverem se movendo uma em direção à outra
                        if (velAlongNormal < 0) {
                            const restitution = 0.85; // ricochete elástico suave e natural
                            const m1 = p1.scale; // massa proporcional ao tamanho
                            const m2 = p2.scale;

                            let impulse = -(1 + restitution) * velAlongNormal;
                            impulse /= (1 / m1 + 1 / m2);

                            p1.vx -= (impulse / m1) * nx;
                            p1.vy -= (impulse / m1) * ny;
                            p2.vx += (impulse / m2) * nx;
                            p2.vy += (impulse / m2) * ny;

                            // Inverte ligeiramente e transmite energia de rotação ao bater
                            const tempRotSpeed = p1.rotationSpeed;
                            p1.rotationSpeed = p2.rotationSpeed * 0.95;
                            p2.rotationSpeed = tempRotSpeed * 0.95;
                        }
                    }
                }
            }

            for (let i = 0; i < numParticles; i++) {
                const p = particles[i];
                p.rotation += p.rotationSpeed;
                p.angle += p.angleSpeed;

                // Aplica física e movimento baseado no estilo de animação
                if (customStyle === 'Chuva') {
                    p.y += p.vy;
                    p.x += p.vx + Math.sin(p.angle) * 0.15;
                    if (p.y > height + 50) {
                        particles[i] = createParticle(false);
                        continue;
                    }
                } else if (customStyle === 'Espiral') {
                    p.x += p.vx;
                    p.y += p.vy;
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    const currentAngle = Math.atan2(p.vy, p.vx);
                    const newAngle = currentAngle + 0.005; 
                    p.vx = Math.cos(newAngle) * (speed * 1.002); 
                    p.vy = Math.sin(newAngle) * (speed * 1.002);

                    if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
                        particles[i] = createParticle(false);
                        continue;
                    }
                } else if (customStyle === 'Festa' || customStyle === 'Carnaval') {
                    p.y += p.vy;
                    p.x += p.vx + Math.sin(p.angle) * 0.4;
                    if (p.y < -50) {
                        particles[i] = createParticle(false);
                        continue;
                    }
                } else {
                    // Flutuante padrão: flutuação suave espacial em todas as direções 2D (perceptivelmente ativa)
                    p.x += p.vx + Math.sin(p.angle) * 0.08;
                    p.y += p.vy + Math.cos(p.angle) * 0.08;
                }

                // 2. Colisão Elástica com as Bordas do Canvas (Mantém os emojis dentro da tela flutuando indefinidamente!)
                const r = p.scale / 2;
                
                // Colisão com as paredes laterais (esquerda / direita)
                if (p.x - r < 0) {
                    p.x = r;
                    p.vx = -p.vx * 0.85;
                } else if (p.x + r > width) {
                    p.x = width - r;
                    p.vx = -p.vx * 0.85;
                }

                // No estilo flutuante padrão, os emojis também colidem e quicam no topo e na base!
                if (customStyle !== 'Chuva' && customStyle !== 'Festa' && customStyle !== 'Carnaval' && customStyle !== 'Espiral') {
                    if (p.y - r < 0) {
                        p.y = r;
                        p.vy = -p.vy * 0.85;
                    } else if (p.y + r > height) {
                        p.y = height - r;
                        p.vy = -p.vy * 0.85;
                    }
                }

                // Desenha o emoji pré-renderizado da Apple via GPU (drawImage) apenas após a imagem carregar
                if (isImageLoaded) {
                    ctx.save();
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high'; // Aplica o algoritmo de bicubic/lanczos de alta qualidade para nitidez incrível!
                    ctx.globalAlpha = p.opacity;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.drawImage(
                        emojiCacheCanvas,
                        -p.scale / 2,
                        -p.scale / 2,
                        p.scale,
                        p.scale
                    );
                    ctx.restore();
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [selectedThemeId, selectedEmoji, customStyle]);

    // Efeito de Animação de Confete do Tema Confete (Explodindo dos cantos em parábola)
    useEffect(() => {
        if (selectedThemeId !== 'confetti') return;

        const canvas = confettiCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Deriva uma linda paleta de cores a partir da cor atual selecionada pelo usuário
        const colors = (() => {
            const hex = activeCustomColor || selectedTheme.accentColor;
            const hsl = hexToHsl(hex);
            if (!hsl) return [hex, '#ec4899', '#f472b6', '#db2777', '#fbcfe8'];
            const { h, s, l } = hsl;
            return [
                `hsl(${h}, ${s}%, ${l}%)`,
                `hsl(${h}, ${Math.max(s - 15, 30)}%, ${Math.min(l + 12, 75)}%)`,
                `hsl(${h}, ${Math.min(s + 15, 95)}%, ${Math.max(l - 12, 35)}%)`,
                `hsl(${(h + 20) % 360}, ${Math.min(s + 10, 90)}%, ${Math.min(l + 5, 65)}%)`,
                `hsl(${(h - 20 + 360) % 360}, ${Math.min(s + 10, 90)}%, ${Math.min(l + 5, 65)}%)`,
            ];
        })();

        interface ConfettiParticle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            color: string;
            size: number;
            rotation: number;
            rotationSpeed: number;
            twist: number;
            twistSpeed: number;
            opacity: number;
            gravity: number;
            shape: string;
        }

        const particles: ConfettiParticle[] = [];

        function createParticle(side: 'left' | 'right'): ConfettiParticle {
            const isLeft = side === 'left';
            // Tamanhos superlativos e volumosos (de 32px a 64px) para máxima imponência estética
            const size = 32 + Math.random() * 32; 
            const shape = customStyle === 'Estrela' ? 'Estrela' :
                          customStyle === 'Coração' ? 'Coração' :
                          customStyle === 'Círculo' ? 'Círculo' : 'Festa';

            // Ponto de partida nas laterais inferiores com espalhamento vertical tridimensional (nuvens de lançamento assimétricas)
            const x = isLeft 
                ? (40 + Math.random() * 120) 
                : (width - 160 - Math.random() * 120);

            // Espalha a altura inicial das partículas inteiramente abaixo da borda física da tela (100% ocultas no frame 0)
            const y = height + 40 + Math.random() * 140; 

            // Explosão lenta e suave, de baixo para cima (totalmente vertical)
            const vx = (Math.random() - 0.5) * 1.2; // dispersão lateral mínima de subida reta
            const vy = -(5.0 + Math.random() * 4.2); // velocidade vertical lenta de subida suave (de -5.0 a -9.2)

            return {
                x,
                y,
                vx,
                vy,
                color: colors[Math.floor(Math.random() * colors.length)],
                size,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.025, // rotação super lenta e fluida
                twist: Math.random() * Math.PI * 2,
                twistSpeed: 0.015 + Math.random() * 0.02,
                opacity: 1,
                gravity: 0.045 + Math.random() * 0.035, // gravidade leve (estilo pluma)
                shape
            };
        }

        // Função para disparar rajadas físicas de confete de um lado específico
        function triggerBurst(side: 'left' | 'right', count: number) {
            if (document.hidden) return; // Não gera partículas em segundo plano
            if (particles.length > 300) return; // Limite defensivo para evitar travamento
            for (let k = 0; k < count; k++) {
                particles.push(createParticle(side));
            }
        }

        // Loop Dinâmico de Explosões Alternadas em Sequência (Luma-like):
        // Explode Esquerda -> 1.5s depois Explode Direita -> Pausa -> Repete aos 7.5s
        const runBurstCycle = () => {
            if (document.hidden) return; // Não inicia se a página estiver oculta
            // Rajada Esquerda - massiva, volumosa e festiva nos cantos (de 80 a 110 confetes)
            triggerBurst('left', 80 + Math.floor(Math.random() * 30));
            
            // Rajada Direita sequencial após 1.5s (de 80 a 110 confetes)
            const timeoutId = setTimeout(() => {
                if (document.hidden) return;
                triggerBurst('right', 80 + Math.floor(Math.random() * 30));
            }, 1500);

            return timeoutId;
        };

        // Inicia o primeiro ciclo imediatamente
        let rightTimeoutId = runBurstCycle();

        // Agenda o ciclo recorrente a cada 7.5 segundos (tempo perfeito para flutuarem e a tela limpar)
        const intervalId = setInterval(() => {
            rightTimeoutId = runBurstCycle();
        }, 7500);

        // Ouvinte de visibilidade para limpar partículas em segundo plano imediatamente
        const handleVisibilityChange = () => {
            if (document.hidden) {
                particles.length = 0; // Limpa o array de partículas liberando memória
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.vy += p.gravity; // gravidade leve aplicada
                p.vx += Math.sin(p.twist) * 0.03; // oscilação de vento sutil
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                p.twist += p.twistSpeed;

                // Atenuação de opacidade linear extremamente duradoura e fluida para flutuarem até o extremo topo
                p.opacity -= 0.0013;

                // Remove partículas que saíram do topo ou ficaram invisíveis
                if (p.y < -50 || p.opacity <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;

                if (p.shape === 'Círculo') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.shape === 'Estrela') {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    drawStar(ctx, 0, 0, 5, p.size / 2, p.size / 4);
                } else if (p.shape === 'Coração') {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
                } else {
                    drawStreamer(ctx, p.x, p.y, p.size * 0.4, p.size * 0.9, p.rotation, p.twist);
                }

                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        // Funções auxiliares para desenhar formatos customizados
        function drawStar(c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            c.beginPath();
            c.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                c.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                c.lineTo(x, y);
                rot += step;
            }
            c.lineTo(cx, cy - outerRadius);
            c.closePath();
            c.fill();
        }

        function drawHeart(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
            c.beginPath();
            const d = size;
            c.moveTo(x + d / 2, y + d / 4);
            c.bezierCurveTo(x + d / 2, y, x, y, x, y + d / 2);
            c.bezierCurveTo(x, y + d * 0.75, x + d / 2, y + d, x + d / 2, y + d);
            c.bezierCurveTo(x + d / 2, y + d, x + d, y + d * 0.75, x + d, y + d / 2);
            c.bezierCurveTo(x + d, y, x + d / 2, y, x + d / 2, y + d / 4);
            c.closePath();
            c.fill();
        }

        function drawStreamer(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rot: number, tw: number) {
            c.save();
            c.translate(x, y);
            c.rotate(rot);
            c.scale(Math.sin(tw), 1); // Simula o giro 3D (achatando no eixo X)
            c.beginPath();
            c.moveTo(-w / 2, -h / 2);
            c.quadraticCurveTo(w / 2, -h / 4, -w / 2, 0);
            c.quadraticCurveTo(w / 2, h / 4, -w / 2, h / 2);
            c.lineTo(w / 2, h / 2);
            c.quadraticCurveTo(-w / 2, h / 4, w / 2, 0);
            c.quadraticCurveTo(-w / 2, -h / 4, w / 2, -h / 2);
            c.closePath();
            c.fill();
            c.restore();
        }

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
            clearInterval(intervalId);
            clearTimeout(rightTimeoutId);
        };
    }, [selectedThemeId, activeCustomColor, selectedTheme.accentColor, customStyle]);

    

    // Nota: O efeito legado de canvas 2D para o Tema Quantum foi substituído pelo componente de alta performance <GradFlow /> (WebGL) renderizado em tempo real na GPU.



    const selectedOrg = React.useMemo(() => orgs?.find(o => o.id === selectedOrgId), [orgs, selectedOrgId]);


    const { loading: authLoading } = useAuth();

    if (authLoading || (user && loadingOrgs)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f7f8f9] dark:bg-[#131517]">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f8f9] dark:bg-[#131517] p-4 text-center">
                <p className="text-gray-600 dark:text-white/60 mb-4">Você precisa estar logado para criar eventos.</p>
                <button
                    onClick={() => navigate('/signin')}
                    className="px-4 py-2 bg-black text-white rounded-lg font-medium"
                >
                    Entrar
                </button>
            </div>
        );
    }

    if (!orgs || orgs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f8f9] dark:bg-[#131517] p-4 text-center">
                <p className="text-gray-600 dark:text-white/60 mb-4">Você precisa criar um calendário antes de criar eventos.</p>
                <button
                    onClick={() => navigate('/organizations/create-calendar')}
                    className="px-4 py-2 bg-black text-white rounded-lg font-medium"
                >
                    Criar Calendário
                </button>
            </div>
        );
    }

    // Helpers for safe date-time state updates with proactive validation/adjustment
    const updateEventStartDate = (newStartDate: string) => {
        setStartDate(newStartDate);
        
        // If end date is empty, default it to newStartDate + 1 hour
        const startISO = `${newStartDate}T${startTime}:00`;
        const endISO = `${endDate || newStartDate}T${endTime}:00`;
        
        const startTimestamp = new Date(startISO).getTime();
        let endTimestamp = new Date(endISO).getTime();
        
        if (isNaN(endTimestamp) || endTimestamp < startTimestamp + (30 * 60 * 1000)) {
            // Auto-adjust end date to start date and end time to 1 hour after start time
            setEndDate(newStartDate);
            
            const [sh, sm] = startTime.split(':').map(Number);
            let eh = sh + 1;
            let em = sm;
            if (eh >= 24) {
                eh = 23;
                em = 59;
            }
            setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
        }
    };

    const updateEventStartTime = (newStartTime: string) => {
        setStartTime(newStartTime);
        
        const startISO = `${startDate}T${newStartTime}:00`;
        const endISO = `${endDate || startDate}T${endTime}:00`;
        
        const startTimestamp = new Date(startISO).getTime();
        let endTimestamp = new Date(endISO).getTime();
        
        if (isNaN(endTimestamp) || endTimestamp < startTimestamp + (30 * 60 * 1000)) {
            const [sh, sm] = newStartTime.split(':').map(Number);
            let eh = sh + 1;
            let em = sm;
            if (eh >= 24) {
                eh = 23;
                em = 59;
            }
            setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
        }
    };

    const updateEventEndDate = (newEndDate: string) => {
        const startISO = `${startDate}T${startTime}:00`;
        const endISO = `${newEndDate}T${endTime}:00`;
        
        const startTimestamp = new Date(startISO).getTime();
        let endTimestamp = new Date(endISO).getTime();
        
        if (!isNaN(startTimestamp) && !isNaN(endTimestamp) && endTimestamp < startTimestamp) {
            // Prohibit setting end date before start date
            setEndDate(startDate);
            
            // Adjust time to prevent invalid range
            const [sh, sm] = startTime.split(':').map(Number);
            let eh = sh + 1;
            let em = sm;
            if (eh >= 24) {
                eh = 23;
                em = 59;
            }
            setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
            toast.error("A data de término não pode ser anterior à data de início.");
        } else {
            setEndDate(newEndDate);
        }
    };

    const updateEventEndTime = (newEndTime: string) => {
        const startISO = `${startDate}T${startTime}:00`;
        const endISO = `${endDate || startDate}T${newEndTime}:00`;
        
        const startTimestamp = new Date(startISO).getTime();
        let endTimestamp = new Date(endISO).getTime();
        
        if (!isNaN(startTimestamp) && !isNaN(endTimestamp) && endTimestamp < startTimestamp + (30 * 60 * 1000)) {
            // Adjust time back to minimum 30 minutes after start time
            const [sh, sm] = startTime.split(':').map(Number);
            let eh = sh;
            let em = sm + 30;
            if (em >= 60) {
                eh += 1;
                em -= 60;
            }
            if (eh >= 24) {
                eh = 23;
                em = 59;
            }
            setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
            toast.error("O horário de término deve ser no mínimo 30 minutos depois do horário de início.");
        } else {
            setEndTime(newEndTime);
        }
    };

    const handleCreateEvent = async () => {
        if (!eventName || !startDate || !selectedOrgId) {
            toast.error("Por favor, preencha os campos obrigatórios.");
            return;
        }

        // Validate date order and 30-minute interval minimum
        const startISO = `${startDate}T${startTime}:00`;
        const endISO = `${endDate}T${endTime}:00`;
        
        const startTimestamp = new Date(startISO).getTime();
        const endTimestamp = new Date(endISO).getTime();

        if (isNaN(startTimestamp)) {
            toast.error("Data ou hora de início inválida.");
            return;
        }

        if (isNaN(endTimestamp)) {
            toast.error("Data ou hora de término inválida.");
            return;
        }

        if (endTimestamp < startTimestamp) {
            toast.error("A data de término não pode ser anterior à data de início.");
            return;
        }

        const minutesDiff = (endTimestamp - startTimestamp) / (1000 * 60);
        if (minutesDiff < 30) {
            toast.error("O horário de término deve ser no mínimo 30 minutos depois do horário de início.");
            return;
        }

        setIsSubmitting(true);
        try {
            const startISO = `${startDate}T${startTime}:00`;
            const endISO = `${endDate}T${endTime}:00`;
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let shortId = '';
            for (let i = 0; i < 8; i++) {
                shortId += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            let finalCustomStyle = customStyle;
            if (selectedThemeId === 'quantum') {
                finalCustomStyle = quantumPreset;
            } else if (selectedThemeId === 'emoji') {
                finalCustomStyle = selectedEmoji;
            }

            const payload = {
                title: eventName,
                name: eventName,
                slug: shortId,
                description: description,
                startDate: startISO,
                endDate: endISO,
                timezone: selectedTimezone.name,
                organizationId: selectedOrgId,
                image: coverImage,
                location: locationData.type === 'Virtual' ? locationData.url : locationData.address,
                isFree: isFree,
                requireApproval: requireApproval,
                capacity: capacity,
                status: "Rascunho",
                themeId: selectedThemeId,
                customColor: customColor,
                customFont: customFont,
                customStyle: finalCustomStyle,
                customDisplay: customDisplay
            };

            const response = await fetchApi('/api/event/json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("Evento criado com sucesso!");
                navigate(`/event/manage/${data.id}`);
            } else {
                const errorText = await response.text();
                console.error('Create event failed', response.status, errorText);
                toast.error(`Erro ao criar evento (${response.status})`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleShuffleTheme = () => {
        const otherThemes = themes.filter(t => t.id !== selectedThemeId);
        if (otherThemes.length > 0) {
            const randomTheme = otherThemes[Math.floor(Math.random() * otherThemes.length)];
            handleThemeChange(randomTheme.id);
            toast.info(`Tema alterado para: ${randomTheme.name}`);
        }
    };

    return (
        <div 
            className="theme-root light" 
            data-theme-dark={effectiveIsDark ? "true" : "false"}
            data-theme-warp={selectedThemeId === 'warp' ? "true" : "false"}
            style={{
            '--theme-bg': selectedThemeId === 'quantum'
                ? (effectiveIsDark ? getDeepColor(QUANTUM_PRESETS[quantumPreset].colors[0]) : '#ffffff')
                : (selectedThemeId === 'seasonal'
                    ? (customStyle === 'Floral' ? getPastelColor(activeCustomColor || selectedTheme.accentColor) : '#ffffff')
                    : (selectedThemeId === 'warp' ? '#0a0a0f' : (derivedPalette ? (effectiveIsDark ? getDeepColor(activeCustomColor || '#ffffff') : derivedPalette.bg) : (activeCustomColor ? (effectiveIsDark ? getDeepColor(activeCustomColor) : getPastelColor(activeCustomColor)) : (effectiveIsDark ? '#09090b' : selectedTheme.bgColor))))),
            '--theme-font': customFont || selectedTheme.fontFamily,
            '--theme-base-rgb': effectiveBaseRgb,
            '--theme-text': selectedThemeId === 'quantum'
                ? (effectiveIsDark ? '#ffffff' : (() => {
                    const hsl = hexToHsl(QUANTUM_PRESETS[quantumPreset].colors[0]);
                    return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000';
                  })())
                : (selectedThemeId === 'seasonal'
                    ? (() => {
                        const color = activeCustomColor || selectedTheme.accentColor;
                        const hsl = hexToHsl(color);
                        return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000';
                      })()
                    : (effectiveIsDark ? '#ffffff' : (derivedPalette ? derivedPalette.text : (activeCustomColor ? getThemeTextColor(activeCustomColor, false) : selectedTheme.textColor)))),
            '--theme-muted': selectedThemeId === 'quantum'
                ? (effectiveIsDark ? 'rgba(255, 255, 255, 0.6)' : (() => {
                    const hsl = hexToHsl(QUANTUM_PRESETS[quantumPreset].colors[0]);
                    return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.5, 35)}%, 45%)` : '#666666';
                  })())
                : (derivedPalette ? derivedPalette.muted : (activeCustomColor ? getThemeTextColor(activeCustomColor, false) + 'A0' : selectedTheme.mutedColor)),
            '--theme-accent': selectedThemeId === 'quantum'
                ? QUANTUM_PRESETS[quantumPreset].colors[0]
                : (derivedPalette ? derivedPalette.accent : (activeCustomColor || selectedTheme.accentColor)),
            background: selectedThemeId === 'warp' ? '#0a0a0f' : 'var(--theme-bg)',
            backgroundColor: selectedThemeId === 'quantum'
                ? (effectiveIsDark ? getDeepColor(QUANTUM_PRESETS[quantumPreset].colors[0]) : '#ffffff')
                : (selectedThemeId === 'warp' ? '#0a0a0f' : (derivedPalette ? (effectiveIsDark ? getDeepColor(activeCustomColor || '#ffffff') : derivedPalette.bg) : (activeCustomColor ? (effectiveIsDark ? getDeepColor(activeCustomColor) : getPastelColor(activeCustomColor)) : (effectiveIsDark ? '#09090b' : selectedTheme.bgColor)))),
            color: selectedThemeId === 'quantum'
                ? (effectiveIsDark ? '#ffffff' : (() => {
                    const hsl = hexToHsl(QUANTUM_PRESETS[quantumPreset].colors[0]);
                    return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000';
                  })())
                : (effectiveIsDark ? '#ffffff' : (derivedPalette ? derivedPalette.text : (activeCustomColor ? getThemeTextColor(activeCustomColor, false) : selectedTheme.textColor))),
            minHeight: '100vh',
            transition: 'background-color 0.5s ease, color 0.4s ease'
        } as React.CSSProperties}>
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --max-width: 820px;
                    --gray-10: #f7f8f9;
                    --gray-20: #ebeced;
                    --gray-30: #dee0e2;
                    --gray-40: #d2d4d7;
                    --gray-50: #b3b5b7;
                    --gray-60: #939597;
                    --gray-70: #737577;
                    --gray-80: #535557;
                    --gray-90: #333537;
                    --gray-100: #212325;
                    --white: #fff;
                    
                    --squircle-border-radius: 1rem;
                    --card-border-radius: .75rem;
                    --input-border-color: var(--gray-20);
                    --backdrop-blur: blur(16px);
                    --transition: all 0.3s cubic-bezier(.4,0,.2,1);
                    --shadow-sm: 0 1px 3px rgba(0, 0, 0, .02), 0 2px 7px rgba(0, 0, 0, .03), 0 3px 14px rgba(0, 0, 0, .04), 0 7px 29px rgba(0, 0, 0, .05), 0 20px 80px rgba(0, 0, 0, .06);
                }

                .theme-root {
                    font-family: var(--theme-font, 'Inter', sans-serif) !important;
                    
                    --black-base-rgb: var(--theme-base-rgb, 19, 21, 23);
                    --black: var(--theme-text, rgb(var(--black-base-rgb)));
                    
                    --black-opacity-2: rgba(var(--black-base-rgb), .02);
                    --black-opacity-4: rgba(var(--black-base-rgb), .04);
                    --black-opacity-8: rgba(var(--black-base-rgb), .08);
                    --black-opacity-16: rgba(var(--black-base-rgb), .16);
                    --black-opacity-32: rgba(var(--black-base-rgb), .32);
                    --black-opacity-36: rgba(var(--black-base-rgb), .36);
                    --black-opacity-48: rgba(var(--black-base-rgb), .48);
                    --black-opacity-64: rgba(var(--black-base-rgb), .64);
                    
                    --brand-color: var(--theme-accent, #a93fa1);
                    --brand-active-color: var(--theme-accent, #94378d);
                    --brand-pale-bg-color: rgba(var(--theme-base-rgb), 0.133);
                    --input-focus-border-color: var(--theme-accent, var(--black));
                }
                .theme-root input,
                .theme-root textarea,
                .theme-root button,
                .theme-root select,
                .theme-root span,
                .theme-root div,
                .theme-root p,
                .theme-root h1,
                .theme-root h2,
                .theme-root h3,
                .theme-root h4 {
                    font-family: inherit;
                }

                .page-wrapper {
                    min-height: 100vh;
                    background-color: var(--theme-bg, var(--gray-10));
                    color: var(--theme-text, inherit);
                    padding-bottom: 4rem;
                    transition: background-color 0.4s ease, color 0.4s ease;
                    position: relative;
                    overflow-x: hidden;
                }

                /* Quantum Animation - GradFlow Canvas */
                .quantum-canvas {
                    position: fixed;
                    inset: -10px;
                    width: calc(100vw + 20px);
                    height: calc(100vh + 20px);
                    z-index: 0;
                    overflow: hidden;
                    pointer-events: none;
                    transform: scale(1.05); /* Margem de segurança */
                }

                .quantum-glow {
                    position: absolute;
                    border-radius: 50%;
                    mix-blend-mode: var(--q-blend, screen);
                    opacity: var(--q-opacity, 0.6);
                    animation: quantum-organic 20s infinite alternate ease-in-out;
                    will-change: transform, border-radius, opacity;
                    transition: opacity 0.8s ease, mix-blend-mode 0.8s ease;
                }

                .glow-1 {
                    width: 80vw;
                    height: 80vw;
                    background: radial-gradient(circle, var(--q-color-1) 0%, transparent 80%);
                    top: -10%;
                    left: -10%;
                    animation-duration: 20s;
                }

                .glow-2 {
                    width: 70vw;
                    height: 70vw;
                    background: radial-gradient(circle, var(--q-color-2) 0%, transparent 80%);
                    bottom: -10%;
                    right: -10%;
                    animation-duration: 25s;
                    animation-delay: -5s;
                }

                .glow-3 {
                    width: 60vw;
                    height: 60vw;
                    background: radial-gradient(circle, var(--q-color-3) 0%, transparent 80%);
                    top: 20%;
                    right: 10%;
                    animation-duration: 30s;
                    animation-delay: -10s;
                }

                .glow-4 {
                    width: 50vw;
                    height: 50vw;
                    background: radial-gradient(circle, var(--q-color-1) 0%, transparent 80%);
                    bottom: 10%;
                    left: 20%;
                    opacity: 0.4;
                    animation-duration: 35s;
                    animation-delay: -15s;
                }

                @keyframes quantum-organic {
                    0% { 
                        transform: translate(0, 0) scale(1) rotate(0deg); 
                        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
                    }
                    33% { 
                        transform: translate(40vw, 20vh) scale(1.2) rotate(120deg); 
                        border-radius: 60% 40% 30% 70% / 50% 60% 40% 60%;
                    }
                    66% { 
                        transform: translate(-20vw, 40vh) scale(0.8) rotate(240deg); 
                        border-radius: 30% 70% 60% 40% / 60% 40% 70% 30%;
                    }
                    100% { 
                        transform: translate(0, 0) scale(1) rotate(360deg); 
                        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
                    }
                }

                /* Enhanced Contrast for Dark Themes - Full Force */
                [data-theme-dark="true"] .lux-naked-input,
                [data-theme-dark="true"] .lux-naked-textarea,
                [data-theme-dark="true"] input,
                [data-theme-dark="true"] textarea,
                [data-theme-dark="true"] .text-gray-900,
                [data-theme-dark="true"] .text-gray-800,
                [data-theme-dark="true"] .text-gray-700,
                [data-theme-dark="true"] .text-gray-600,
                [data-theme-dark="true"] .text-gray-500,
                [data-theme-dark="true"] .text-black,
                [data-theme-dark="true"] .text-slate-900,
                [data-theme-dark="true"] .text-slate-800,
                [data-theme-dark="true"] .text-\[\#141414\],
                [data-theme-dark="true"] h1,
                [data-theme-dark="true"] h2,
                [data-theme-dark="true"] h3,
                [data-theme-dark="true"] h4,
                [data-theme-dark="true"] label,
                [data-theme-dark="true"] .label,
                [data-theme-dark="true"] .value,
                [data-theme-dark="true"] .placeholder,
                [data-theme-dark="true"] .photo-placeholder span,
                [data-theme-dark="true"] .photo-placeholder .font-medium,
                [data-theme-dark="true"] aside span,
                [data-theme-dark="true"] aside div {
                    color: #ffffff !important;
                }

                /* Override specific arbitrary Tailwind text colors in dark mode */
                [data-theme-dark="true"] .text-\[rgba\(20\,20\,20\,0\.64\)\] {
                    color: rgba(255, 255, 255, 0.64) !important;
                }
                [data-theme-dark="true"] .text-\[rgba\(20\,20\,20\,0\.36\)\] {
                    color: rgba(255, 255, 255, 0.36) !important;
                }
                [data-theme-dark="true"] .text-\[\#131517\]\/36 {
                    color: rgba(255, 255, 255, 0.36) !important;
                }
                [data-theme-dark="true"] .text-neutral-400 {
                    color: rgba(255, 255, 255, 0.4) !important;
                }
                [data-theme-dark="true"] .text-neutral-500 {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
                [data-theme-dark="true"] .text-neutral-700 {
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                [data-theme-dark="true"] .text-neutral-900 {
                    color: #ffffff !important;
                }
                [data-theme-dark="true"] .text-gray-400 {
                    color: rgba(255, 255, 255, 0.4) !important;
                }
                [data-theme-dark="true"] .text-gray-600 {
                    color: rgba(255, 255, 255, 0.6) !important;
                }

                /* Small labels should stay slightly translucent for hierarchy */
                [data-theme-dark="true"] .text-[12px].text-gray-400,
                [data-theme-dark="true"] .text-gray-400,
                [data-theme-dark="true"] .opacity-40,
                [data-theme-dark="true"] .text-sm.text-gray-400 {
                    color: rgba(255, 255, 255, 0.5) !important;
                }

                /* Uniform borderless glassmorphism for cards & triggers in dark mode */
                [data-theme-dark="true"] .section-card,
                [data-theme-dark="true"] .options-card,
                [data-theme-dark="true"] .option-item,
                [data-theme-dark="true"] .lux-location-picker,
                [data-theme-dark="true"] .dropdown-trigger,
                [data-theme-dark="true"] .bg-black\/5,
                [data-theme-dark="true"] .bg-gray-50,
                [data-theme-dark="true"] .bg-gray-100,
                [data-theme-dark="true"] .datetime-container-bg,
                [data-theme-dark="true"] .datetime-picker-btn,
                [data-theme-dark="true"] .privacy-toggle-btn,
                [data-theme-dark="true"] .calendar-toggle-btn,
                [data-theme-dark="true"] .theme-selector-btn,
                [data-theme-dark="true"] .theme-shuffle-btn,
                [data-theme-dark="true"] .meta-row {
                    background: rgba(255, 255, 255, 0.07) !important;
                    border: none !important;
                    backdrop-filter: blur(8px) !important;
                    -webkit-backdrop-filter: blur(8px) !important;
                }

                /* Hovers in dark mode */
                [data-theme-dark="true"] .datetime-picker-btn:hover,
                [data-theme-dark="true"] .privacy-toggle-btn:hover,
                [data-theme-dark="true"] .calendar-toggle-btn:hover,
                [data-theme-dark="true"] .theme-selector-btn:hover,
                [data-theme-dark="true"] .theme-shuffle-btn:hover,
                [data-theme-dark="true"] .meta-row:hover {
                    background: rgba(255, 255, 255, 0.12) !important;
                }

                /* Background overrides for timeline/interactive elements in Dark Theme */
                [data-theme-dark="true"] .bg-\[rgba\(20\,20\,20\,0\.16\)\] {
                    background-color: rgba(255, 255, 255, 0.16) !important;
                }
                [data-theme-dark="true"] .bg-\[rgba\(20\,20\,20\,0\.2\)\] {
                    background-color: rgba(255, 255, 255, 0.3) !important;
                }
                [data-theme-dark="true"] .border-\[rgba\(20\,20\,20\,0\.2\)\] {
                    border-color: rgba(255, 255, 255, 0.2) !important;
                }
                [data-theme-dark="true"] .timeline-line {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                }
                [data-theme-dark="true"] .bg-black\/\[0\.04\] {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                }
                [data-theme-dark="true"] .picker-divider {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                }

                /* Option rows and Meta rows overrides */
                [data-theme-dark="true"] .option-row {
                    border-color: rgba(255, 255, 255, 0.1) !important;
                }
                [data-theme-dark="true"] .option-row .label {
                    color: rgba(255, 255, 255, 0.9) !important;
                }
                [data-theme-dark="true"] .meta-row .title {
                    color: #fff !important;
                }
                [data-theme-dark="true"] .meta-row .label,
                [data-theme-dark="true"] .meta-row .subtitle {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                [data-theme-dark="true"] .lux-input-label {
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                [data-theme-dark="true"] .time-picker .time-wrapper {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: none !important;
                }
                [data-theme-dark="true"] .dt-input {
                    color: #fff !important;
                }
                [data-theme-dark="true"] .time-picker .label {
                    color: rgba(255, 255, 255, 0.6) !important;
                }

                /* SVG icons and Lucide icons in dark mode */
                [data-theme-dark="true"] .lucide,
                [data-theme-dark="true"] svg:not(.theme-button svg) {
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                [data-theme-dark="true"] .option-row svg,
                [data-theme-dark="true"] .meta-row svg {
                    color: rgba(255, 255, 255, 0.7) !important;
                }

                /* Popovers suspension styles for Date & Time Pickers in Dark Theme */
                [data-theme-dark="true"] .absolute.left-0.top-\[calc\(100\%2B12px\)\] {
                    background: rgba(20, 20, 24, 0.92) !important;
                    backdrop-filter: blur(25px) !important;
                    -webkit-backdrop-filter: blur(25px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
                }
                [data-theme-dark="true"] .absolute.right-0.top-\[calc\(100\%2B12px\)\] {
                    background: rgba(20, 20, 24, 0.92) !important;
                    backdrop-filter: blur(25px) !important;
                    -webkit-backdrop-filter: blur(25px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
                }
                [data-theme-dark="true"] .absolute.left-0.top-\[calc\(100\%2B12px\)\] *,
                [data-theme-dark="true"] .absolute.right-0.top-\[calc\(100\%2B12px\)\] * {
                    color: rgba(255, 255, 255, 0.9) !important;
                }
                [data-theme-dark="true"] .absolute.left-0.top-\[calc\(100\%2B12px\)\] .text-gray-300 {
                    color: rgba(255, 255, 255, 0.25) !important;
                }
                [data-theme-dark="true"] .absolute.left-0.top-\[calc\(100\%2B12px\)\] .hover\:bg-black\/5:hover,
                [data-theme-dark="true"] .absolute.right-0.top-\[calc\(100\%2B12px\)\] .hover\:bg-black\/5:hover {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                }


                .create-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                    display: flex;
                    gap: 2.5rem;
                    align-items: flex-start;
                }

                @media (max-width: 820px) {
                    .create-container {
                        flex-direction: column;
                        gap: 1.5rem;
                        padding: 1rem;
                    }
                }

                /* Left Column: Image Picker */
                .event-page-left {
                    width: 340px;
                    flex-shrink: 0;
                    position: sticky;
                    top: 6rem;
                    margin-top: -116px;
                }

                @media (max-width: 820px) {
                    .event-page-left {
                        width: 100%;
                        position: static;
                        margin-top: 0;
                    }
                }

                .photo-container {
                    aspect-ratio: 1;
                    background-color: var(--black-opacity-4);
                    border-radius: 0.5rem;
                    overflow: hidden;
                    position: relative;
                    cursor: pointer;
                    border: none;
                    transition: var(--transition);
                }

                .photo-container:hover {
                    background-color: var(--black-opacity-8);
                }

                .photo-placeholder {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    color: var(--gray-60);
                }

                .photo-placeholder svg {
                    width: 32px;
                    height: 32px;
                }

                /* Right Column: Form */
                .event-page-right {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .name-input-wrapper {
                    width: 100%;
                }

                .lux-naked-input {
                    font-family: var(--theme-font, 'Inter', sans-serif) !important;
                    width: 100%;
                    font-size: 2.5rem; /* 40px como no Figma */
                    font-weight: 600;
                    background-color: transparent;
                    border: none;
                    outline: none;
                    padding: 0;
                    margin: 0;
                    line-height: 1.15;
                    color: var(--theme-text) !important;
                    transition: height 0s;
                    overflow: hidden;
                    resize: none;
                }

                .lux-naked-input::placeholder {
                    color: var(--theme-text) !important;
                    opacity: 0.35 !important;
                }

                @media (max-width: 650px) {
                    .lux-naked-input {
                        font-size: 2rem; /* 32px em mobile */
                    }
                }

                /* Form Sections */
                .meta-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .meta-row {
                    background: var(--black-opacity-4) !important;
                    backdrop-filter: blur(8px) !important;
                    -webkit-backdrop-filter: blur(8px) !important;
                    border: none !important;
                    border-radius: 8px;
                    padding: 11px 13px;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: background 0.2s ease, transform 0.1s ease;
                    position: relative;
                    color: var(--black-opacity-64);
                }

                .meta-row:hover {
                    background: var(--black-opacity-8) !important;
                }

                .theme-selector-btn,
                .theme-shuffle-btn {
                    background: var(--black-opacity-4) !important;
                    backdrop-filter: blur(8px) !important;
                    -webkit-backdrop-filter: blur(8px) !important;
                    border: none !important;
                    transition: background 0.2s ease, transform 0.1s ease !important;
                }

                .theme-selector-btn:hover,
                .theme-shuffle-btn:hover {
                    background: var(--black-opacity-8) !important;
                }



                .meta-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: inherit;
                    flex-shrink: 0;
                }

                .meta-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .meta-title {
                    font-family: inherit;
                    font-weight: 400;
                    color: inherit;
                    font-size: 1rem;
                    line-height: 24px;
                }

                .meta-subtitle {
                    color: inherit;
                    font-size: 0.875rem;
                    line-height: 21px;
                    margin-top: 0px;
                }

                /* Advanced Options Container e Rows - Figma */
                .options-card {
                    background: var(--black-opacity-4);
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    backdrop-filter: blur(8px);
                }

                .option-row {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    min-height: 40px;
                    gap: 8px;
                    background: transparent;
                    transition: background 0.2s ease, transform 0.1s ease;
                    cursor: pointer;
                    border-bottom: 1px solid var(--black-opacity-2);
                }

                .option-row:last-child {
                    border-bottom: none;
                }

                .option-row:hover {
                    background: var(--black-opacity-4);
                }



                /* Date Time Picker Section */
                .time-wrapper {
                    background: var(--black-opacity-4);
                    border-radius: 0.75rem;
                    padding: 0.3rem;
                    position: relative;
                }
                .tz-input {
                    background: var(--black-opacity-4);
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .time-row-new {
                    display: flex;
                    align-items: center;
                    padding: 0.1rem 0rem 0.1rem 0.6rem;
                    position: relative;
                    gap: 0.75rem;
                }
                .timeline-new {
                    position: absolute;
                    left: calc(0.3rem + 0.6rem + 4px);
                    top: 1.5rem;
                    bottom: 1.5rem;
                    width: 1px;
                    border-left: 1px dashed var(--gray-30);
                }
                .dot-new {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--gray-30);
                    flex-shrink: 0;
                    z-index: 1;
                }
                .label-new {
                    flex: 1;
                    font-size: 1rem;
                    color: var(--gray-60);
                    font-weight: 400;
                }
                .lux-datetime-input {
                    display: flex;
                    align-items: center;
                    background: var(--black-opacity-4);
                    border-radius: 0.5rem;
                    height: 36px;
                    transition: background 0.2s ease;
                }
                .lux-datetime-input:hover {
                    background: var(--black-opacity-8);
                }
                .lux-date-input, .lux-time-input {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 0 12px;
                    font-size: 1rem;
                    color: var(--black);
                    border: none;
                    background: transparent;
                    outline: none;
                    font-family: inherit;
                    cursor: pointer;
                }
                .lux-time-input {
                    font-family: 'Space Mono', monospace;
                    font-size: 1rem;
                }
                .lux-divider {
                    width: 1px;
                    height: 20px;
                    background: var(--black-opacity-8);
                }

                /* Advanced Options label */
                .section-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--black-opacity-64);
                    margin-bottom: 0.5rem;
                    padding-left: 0.25rem;
                }

                /* Organization Dropdown */
                .lux-menu {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    width: 240px;
                    background: var(--white);
                    border-radius: 8px;
                    box-shadow: var(--shadow-sm);
                    z-index: 100;
                    overflow: hidden;
                    padding: 0.25rem;
                    border: 1px solid var(--black-opacity-8);
                }

                .menu-content {
                    display: flex;
                    flex-direction: column;
                }

                .menu-header {
                    padding: 0.625rem 0.75rem 0.375rem;
                    font-size: 0.6875rem;
                    font-weight: 500;
                    color: var(--gray-40);
                }

                .calendar-selector-row {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem 0.75rem;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: var(--transition);
                    border-radius: 0.375rem;
                    color: var(--black);
                }

                .calendar-selector-row:hover {
                    background: var(--black-opacity-4);
                }

                .calendar-selector-row.selected {
                    background: var(--black-opacity-4);
                }

                .calendar-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    background-size: cover;
                    background-position: center;
                    background-color: var(--gray-10);
                }

                .calendar-avatar.round {
                    border-radius: 50%;
                }

                .calendar-name {
                    flex: 1;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .check-icon {
                    color: var(--black);
                }

                .create-calendar-row {
                    color: var(--gray-60);
                    margin-top: 0.25rem;
                    border-top: 1px solid var(--black-opacity-4);
                    border-radius: 0;
                }

                .calendar-selector-row.privacy-row {
                    align-items: flex-start;
                    padding: 0.75rem;
                }

                .privacy-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.125rem;
                }

                .privacy-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--black);
                }

                .privacy-desc {
                    font-size: 0.813rem;
                    color: var(--gray-40);
                    line-height: 1.4;
                }

                .menu-footer {
                    padding: 0.625rem 0.75rem;
                    font-size: 0.6875rem;
                    color: var(--gray-40);
                    display: flex;
                    gap: 0.5rem;
                    line-height: 1.3;
                }

                /* Theme Modal Sheet Styles */
                .lux-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    background: transparent;
                    pointer-events: auto;
                }

                .lux-modal.sheet {
                    width: 100%;
                    max-width: none;
                    background: rgba(255, 255, 255, 0.65);
                    backdrop-filter: blur(40px) saturate(200%);
                    border-top: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 2rem 2rem 0 0;
                    box-shadow: 0 -10px 50px rgba(0,0,0,0.08);
                    display: flex;
                    flex-direction: column;
                    padding-bottom: 2rem;
                    pointer-events: auto;
                }

                .sheet-header {
                    height: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    cursor: pointer;
                }

                .dragbar {
                    width: 32px;
                    height: 4px;
                    background: var(--gray-20);
                    border-radius: 2px;
                }

                .zm-container {
                    max-width: 1000px;
                    width: 100%;
                    margin: 0 auto;
                    padding: 0 1.25rem;
                    user-select: none;
                }

                .top-level {
                    display: flex;
                    align-items: center;
                    overflow-x: auto;
                    margin: 0 calc(-1 * 1.25rem);
                    padding: 0.5rem 1.25rem;
                }

                .wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin: auto;
                }

                .theme-button {
                    all: unset;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    padding: 0 4px;
                    transition: var(--transition);
                }

                .theme-button .icon {
                    width: 88px;
                    height: 58px;
                    border-radius: 8px;
                    overflow: hidden;
                    background: var(--gray-10);
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    transition: all 0.2s ease;
                    margin-bottom: 0.25rem;
                }

                .theme-button.selected .icon {
                    outline-color: var(--brand-color);
                }

                .theme-button .icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .theme-button .label {
                    font-size: 0.6875rem;
                    font-weight: 500;
                    color: rgba(var(--black-base-rgb), 0.48);
                    margin-top: 0.5rem;
                    transition: color 0.2s ease;
                    text-align: center;
                }

                .theme-button.selected .label {
                    color: var(--brand-color);
                    font-weight: 600;
                }

                .theme-controls {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 0 0.25rem 0;
                    width: 100%;
                }

                .theme-controls > .relative {
                    position: relative;
                    flex: 1;
                    min-width: 0;
                }

                .theme-option {
                    background: var(--black-opacity-4) !important;
                    border-radius: 0.625rem;
                    padding: 0.5rem 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    width: 100%;
                    min-width: 0;
                    border: 1px solid transparent;
                }

                .theme-option:hover {
                    background: var(--black-opacity-8) !important;
                }

                .theme-option .dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .theme-option .content {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 0;
                    padding: 0 0.5rem;
                }

                .theme-option .label {
                    font-size: 16px;
                    font-weight: 500;
                    color: rgba(var(--black-base-rgb), 0.54);
                    white-space: nowrap;
                }

                .theme-option .value {
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(var(--black-base-rgb), 0.84);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: right;
                }

                .theme-option .accessory {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(var(--black-base-rgb), 0.32);
                    transition: transform 0.2s ease;
                }

                /* Popover custom styling with pointing arrows */
                .color-popover {
                    width: 340px;
                    left: calc(50% - 170px);
                }
                .color-popover::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: calc(50% - 5px);
                    transform: rotate(45deg);
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-right: 1px solid rgba(0, 0, 0, 0.05);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                }
                @media (max-width: 768px) {
                    .theme-controls > .relative {
                        position: static;
                    }
                    .color-popover {
                        left: 0;
                        transform: none;
                        width: 320px;
                    }
                    .color-popover::after {
                        left: 48px;
                        transform: rotate(45deg);
                    }
                }

                .font-popover {
                    width: 340px;
                    left: calc(50% - 170px);
                }
                .font-popover::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: calc(50% - 5px);
                    transform: rotate(45deg);
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-right: 1px solid rgba(0, 0, 0, 0.05);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                }
                @media (max-width: 768px) {
                    .font-popover {
                        right: 0;
                        left: auto;
                        transform: none;
                        width: 320px;
                    }
                    .font-popover::after {
                        left: auto;
                        right: 120px;
                        transform: rotate(45deg);
                    }
                }

                .style-popover {
                    width: 160px;
                    left: calc(50% - 80px);
                }
                .style-popover::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: calc(50% - 5px);
                    transform: rotate(45deg);
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-right: 1px solid rgba(0, 0, 0, 0.05);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                }

                .emoji-popover {
                    width: 220px;
                    left: calc(50% - 110px);
                }
                .emoji-popover::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: 50%;
                    transform: translateX(-50%) rotate(45deg);
                    width: 10px;
                    height: 10px;
                    background: #1c1c1e;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .display-popover {
                    width: 160px;
                    right: 0;
                }
                .display-popover::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    right: 48px;
                    transform: rotate(45deg);
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-right: 1px solid rgba(0, 0, 0, 0.05);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                }

                .create-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                }

                .create-button:active {
                    transform: translateY(0);
                }

                /* Modals (Basic) */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }

                .modal-content {
                    background: var(--white);
                    border-radius: 2rem;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }

                .datetime-container-bg {
                    background: var(--black-opacity-4) !important;
                }

                .datetime-picker-btn {
                    background: var(--black-opacity-4) !important;
                    transition: background 0.2s ease, border-color 0.2s ease !important;
                }
                .datetime-picker-btn:hover {
                    background: var(--black-opacity-8) !important;
                }

                .privacy-toggle-btn, .calendar-toggle-btn {
                    background: var(--black-opacity-4) !important;
                    transition: all 0.2s ease !important;
                    color: rgba(var(--black-base-rgb), 0.64) !important;
                }
                .privacy-toggle-btn:hover, .calendar-toggle-btn:hover {
                    background: var(--theme-accent, #a93fa1) !important;
                    color: #ffffff !important;
                }
                .privacy-toggle-btn .privacy-btn-icon,
                .privacy-toggle-btn .privacy-btn-arrow,
                .calendar-toggle-btn .calendar-btn-icon,
                .calendar-toggle-btn .calendar-btn-arrow {
                    color: rgba(var(--black-base-rgb), 0.64) !important;
                    transition: color 0.2s ease !important;
                }
                .privacy-toggle-btn:hover .privacy-btn-icon,
                .privacy-toggle-btn:hover .privacy-btn-arrow,
                .calendar-toggle-btn:hover .calendar-btn-icon,
                .calendar-toggle-btn:hover .calendar-btn-arrow {
                    color: #ffffff !important;
                }

                /* =====================================================
                   WARP THEME — Glassmorphism + Texto branco
                ===================================================== */
                [data-theme-warp="true"] .meta-row,
                [data-theme-warp="true"] .options-card,
                [data-theme-warp="true"] .time-wrapper,
                [data-theme-warp="true"] .tz-input,
                [data-theme-warp="true"] .lux-datetime-input,
                [data-theme-warp="true"] .photo-container,
                [data-theme-warp="true"] .datetime-picker-btn,
                [data-theme-warp="true"] .privacy-toggle-btn,
                [data-theme-warp="true"] .calendar-toggle-btn,
                [data-theme-warp="true"] .theme-selector-btn,
                [data-theme-warp="true"] .theme-shuffle-btn,
                [data-theme-warp="true"] .datetime-container-bg {
                    background: rgba(255, 255, 255, 0.07) !important;
                    backdrop-filter: blur(20px) saturate(160%) !important;
                    -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
                    border: none !important;
                    transition: background 0.2s ease, border-color 0.2s ease !important;
                }

                [data-theme-warp="true"] .meta-row:hover,
                [data-theme-warp="true"] .lux-datetime-input:hover,
                [data-theme-warp="true"] .datetime-picker-btn:hover,
                [data-theme-warp="true"] .theme-selector-btn:hover,
                [data-theme-warp="true"] .theme-shuffle-btn:hover {
                    background: rgba(255, 255, 255, 0.12) !important;
                }

                [data-theme-warp="true"] .photo-container:hover {
                    background: rgba(255, 255, 255, 0.12) !important;
                }

                [data-theme-warp="true"] .option-row {
                    border-bottom: none !important;
                }

                [data-theme-warp="true"] .option-row:hover {
                    background: rgba(255, 255, 255, 0.06) !important;
                }

                /* Adaptação de cores internas do Datetime Container no Warp */
                [data-theme-warp="true"] .datetime-container-bg * {
                    color: rgba(255, 255, 255, 0.8) !important;
                    border-color: rgba(255, 255, 255, 0.15) !important;
                }
                [data-theme-warp="true"] .datetime-container-bg .timeline-dot {
                    background-color: rgba(255, 255, 255, 0.3) !important;
                }
                [data-theme-warp="true"] .datetime-container-bg .timeline-dot-outline {
                    border-color: rgba(255, 255, 255, 0.2) !important;
                }
                [data-theme-warp="true"] .datetime-container-bg .timeline-line {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                }
                [data-theme-warp="true"] .datetime-container-bg .picker-divider {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                }

                /* Dropdowns flutuantes e Menus no Warp & Dark Theme */
                [data-theme-warp="true"] .lux-menu,
                [data-theme-warp="true"] .location-dropdown,
                [data-theme-dark="true"] .lux-menu,
                [data-theme-dark="true"] .location-dropdown {
                    background: rgba(22, 22, 26, 0.90) !important;
                    backdrop-filter: blur(25px) saturate(180%) !important;
                    -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
                }
                [data-theme-warp="true"] .lux-menu *,
                [data-theme-warp="true"] .location-dropdown *,
                [data-theme-dark="true"] .lux-menu *,
                [data-theme-dark="true"] .location-dropdown * {
                    color: rgba(255, 255, 255, 0.9) !important;
                }
                [data-theme-warp="true"] .calendar-selector-row:hover,
                [data-theme-warp="true"] .location-item-recent:hover,
                [data-theme-warp="true"] .location-btn-virtual:hover,
                [data-theme-warp="true"] .location-result-row:hover,
                [data-theme-warp="true"] .location-result-custom:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                }
                [data-theme-warp="true"] .calendar-selector-row.selected {
                    background: rgba(255, 255, 255, 0.15) !important;
                }
                [data-theme-warp="true"] .calendar-selector-row.selected .w-4.h-4.bg-black {
                    background-color: rgba(255, 255, 255, 0.9) !important;
                }
                [data-theme-warp="true"] .calendar-selector-row.selected .w-4.h-4.bg-black .text-white {
                    color: #000000 !important;
                }
                [data-theme-warp="true"] .location-item-recent {
                    background: rgba(255, 255, 255, 0.04) !important;
                }
                [data-theme-warp="true"] .location-input-area {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                }
                [data-theme-warp="true"] .location-input-area input {
                    color: #ffffff !important;
                }
                [data-theme-warp="true"] .location-input-area input::placeholder {
                    color: rgba(255, 255, 255, 0.4) !important;
                }
                [data-theme-warp="true"] .location-dropdown .location-subtitle,
                [data-theme-warp="true"] .location-dropdown .location-section-title,
                [data-theme-warp="true"] .location-dropdown .location-info-text {
                    color: rgba(255, 255, 255, 0.4) !important;
                }

                /* Botão Criar Evento no Warp */
                [data-theme-warp="true"] .submit-btn {
                    background: rgba(255, 255, 255, 0.92) !important;
                    color: #000 !important;
                    backdrop-filter: blur(10px) !important;
                    border: none !important;
                }
                [data-theme-warp="true"] .submit-btn:hover {
                    background: rgba(255, 255, 255, 1) !important;
                }

                /* Texto branco em todos os elementos do tema escuro Warp */
                [data-theme-warp="true"] *,
                [data-theme-warp="true"] input,
                [data-theme-warp="true"] textarea,
                [data-theme-warp="true"] .meta-title,
                [data-theme-warp="true"] .meta-subtitle,
                [data-theme-warp="true"] .label-new,
                [data-theme-warp="true"] .label,
                [data-theme-warp="true"] .value,
                [data-theme-warp="true"] h1,
                [data-theme-warp="true"] h2,
                [data-theme-warp="true"] h3,
                [data-theme-warp="true"] span,
                [data-theme-warp="true"] p,
                [data-theme-warp="true"] .meta-row,
                [data-theme-warp="true"] .meta-row *,
                [data-theme-warp="true"] .option-row *,
                [data-theme-warp="true"] .lux-date-input,
                [data-theme-warp="true"] .lux-time-input,
                [data-theme-warp="true"] .lux-datetime-input * {
                    color: rgba(255, 255, 255, 0.90) !important;
                }

                /* Placeholder levemente opaco */
                [data-theme-warp="true"] input::placeholder,
                [data-theme-warp="true"] textarea::placeholder {
                    color: rgba(255, 255, 255, 0.35) !important;
                }

                /* Ícones lucide brancos */
                [data-theme-warp="true"] .lucide,
                [data-theme-warp="true"] svg {
                    color: rgba(255, 255, 255, 0.70) !important;
                    stroke: rgba(255, 255, 255, 0.70) !important;
                }

                /* Manter botão submit preto */
                [data-theme-warp="true"] .submit-btn,
                [data-theme-warp="true"] .submit-btn * {
                    color: #000 !important;
                }


            `}} />

            {/* Header padrão V2 */}
            <HeaderV2 transparent={true} fixed={true} theme={effectiveIsDark ? 'dark' : 'light'} />

            


            <main 
                className="w-full flex justify-center pt-20 pb-16 px-4 min-h-screen relative z-10"
                data-theme-dark={effectiveIsDark ? "true" : "false"}
                data-theme-warp={selectedThemeId === 'warp' ? "true" : "false"}
                style={{
                    ['--theme-bg' as any]: selectedThemeId === 'quantum'
                        ? (effectiveIsDark ? getDeepColor(QUANTUM_PRESETS[quantumPreset].colors[0]) : '#ffffff')
                        : (selectedThemeId === 'seasonal'
                            ? (customStyle === 'Floral' ? getPastelColor(activeCustomColor || selectedTheme.accentColor) : '#ffffff')
                            : (derivedPalette ? (effectiveIsDark ? getDeepColor(activeCustomColor || '#ffffff') : derivedPalette.bg) : (activeCustomColor ? (effectiveIsDark ? getDeepColor(activeCustomColor) : getPastelColor(activeCustomColor)) : (effectiveIsDark ? '#09090b' : selectedTheme.bgColor)))),
                    ['--theme-text' as any]: selectedThemeId === 'quantum'
                        ? (effectiveIsDark ? '#ffffff' : (() => {
                            const hsl = hexToHsl(QUANTUM_PRESETS[quantumPreset].colors[0]);
                            return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000';
                          })())
                        : (selectedThemeId === 'seasonal'
                            ? (() => {
                                const color = activeCustomColor || selectedTheme.accentColor;
                                const hsl = hexToHsl(color);
                                return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000';
                              })()
                            : (effectiveIsDark ? '#ffffff' : (derivedPalette ? derivedPalette.text : (activeCustomColor ? getThemeTextColor(activeCustomColor, false) : selectedTheme.textColor)))),
                    ['--theme-muted' as any]: selectedThemeId === 'quantum'
                        ? (effectiveIsDark ? 'rgba(255, 255, 255, 0.6)' : (() => {
                            const hsl = hexToHsl(QUANTUM_PRESETS[quantumPreset].colors[0]);
                            return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.5, 35)}%, 45%)` : '#666666';
                          })())
                        : (derivedPalette ? derivedPalette.muted : (activeCustomColor ? getThemeTextColor(activeCustomColor, false) + 'A0' : selectedTheme.mutedColor)),
                    ['--theme-accent' as any]: selectedThemeId === 'quantum'
                        ? QUANTUM_PRESETS[quantumPreset].colors[0]
                        : (derivedPalette ? derivedPalette.accent : (activeCustomColor || selectedTheme.accentColor)),
                    ['--theme-font' as any]: customFont || selectedTheme.fontFamily,
                    ['--theme-base-rgb' as any]: effectiveBaseRgb,
                    // Temas claros: usa cor base escura (contrastante) com baixa opacidade para os cards ficarem visíveis
                    // Temas escuros: usa cor base clara (branco/tema) com baixa opacidade
                    ['--black-opacity-2' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.04)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.02)`,
                    ['--black-opacity-4' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.08)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.04)`,
                    ['--black-opacity-8' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.13)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.08)`,
                    ['--black-opacity-16' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.22)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.16)`,
                    ['--black-opacity-32' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.40)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.32)`,
                    ['--black-opacity-36' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.46)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.36)`,
                    ['--black-opacity-48' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.60)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.48)`,
                    ['--black-opacity-64' as any]: !effectiveIsDark ? `rgba(${effectiveBaseRgb}, 0.80)` : `rgba(var(--theme-base-rgb, 255,255,255), 0.64)`,
                    ['--q-color-1' as any]: QUANTUM_PRESETS[quantumPreset].colors[0],
                    ['--q-color-2' as any]: QUANTUM_PRESETS[quantumPreset].colors[1],
                    ['--q-color-3' as any]: QUANTUM_PRESETS[quantumPreset].colors[2],
                    ['--q-bg-base' as any]: effectiveIsDark ? getDeepColor(QUANTUM_PRESETS[quantumPreset].colors[0]) : getPastelColor(QUANTUM_PRESETS[quantumPreset].colors[0]),
                    ['--q-opacity' as any]: effectiveIsDark ? '0.6' : '0.55',
                    ['--q-blend' as any]: effectiveIsDark ? 'screen' : 'overlay',
                    // Aplica o background diretamente via style para sobrepor qualquer classe Tailwind
                    backgroundColor: (selectedThemeId === 'warp' || selectedThemeId === 'emoji')
                        ? 'transparent'
                        : (selectedThemeId === 'quantum'
                            ? (effectiveIsDark ? getDeepColor(QUANTUM_PRESETS[quantumPreset].colors[0]) : '#ffffff')
                            : (derivedPalette
                                ? (effectiveIsDark ? getDeepColor(activeCustomColor || '#ffffff') : derivedPalette.bg)
                                : (activeCustomColor
                                    ? (effectiveIsDark ? getDeepColor(activeCustomColor) : getPastelColor(activeCustomColor))
                                    : (effectiveIsDark ? '#09090b' : selectedTheme.bgColor)))),
                    transition: 'background-color 0.5s ease, color 0.4s ease',
                    color: selectedThemeId === 'quantum'
                        ? (effectiveIsDark ? '#ffffff' : (() => {
                            const hsl = hexToHsl(QUANTUM_PRESETS[quantumPreset].colors[0]);
                            return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000';
                          })())
                        : (effectiveIsDark ? '#ffffff' : (derivedPalette ? derivedPalette.text : (customColor ? getThemeTextColor(customColor, false) : selectedTheme.textColor))),
                }}
            >
                {/* Padrão Geométrico do Tema Padrão */}
                {selectedThemeId === 'pattern' && (
                    <div className={`theme-pattern-bg pattern-${
                        customStyle === 'Cruz' ? 'cross' :
                        customStyle === 'Hipnótico' ? 'hypnotic' :
                        customStyle === 'Plus' || customStyle === 'Padrão' ? 'plus' :
                        customStyle === 'Poá' ? 'polkadot' :
                        customStyle === 'Onda' ? 'wave' :
                        customStyle === 'Zigzag' ? 'zigzag' :
                        customStyle === 'Grade' ? 'grid' :
                        customStyle === 'Diamante' ? 'diamond' : 'plus'
                    }`} />
                )}
                {/* Efeito de Warp de Estrelas do Tema Warp */}
                {selectedThemeId === 'warp' && (
                    <canvas 
                        ref={warpCanvasRef} 
                        className="fixed inset-0 w-full h-full pointer-events-none" 
                        style={{ 
                            zIndex: 0,
                            opacity: 1,
                        }}
                    />
                )}

                {/* Efeito de Emojis Flutuantes do Tema Emoji */}
                <canvas 
                    ref={emojiCanvasRef} 
                    className="fixed inset-0 w-full h-full pointer-events-none" 
                    style={{ 
                        zIndex: 0,
                        opacity: 1,
                        display: selectedThemeId === 'emoji' ? 'block' : 'none'
                    }}
                />

                {/* Efeito de Confete do Tema Confetti */}
                <canvas 
                    ref={confettiCanvasRef} 
                    className="fixed inset-0 w-full h-full pointer-events-none" 
                    style={{ 
                        zIndex: 0,
                        opacity: 1,
                        display: selectedThemeId === 'confetti' ? 'block' : 'none'
                    }}
                />

                {selectedThemeId === 'quantum' && (
                    <canvas 
                        ref={quantumCanvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none quantum-canvas"
                        style={{
                            zIndex: 0,
                            filter: 'blur(60px)',
                            opacity: effectiveIsDark ? 0.6 : 0.55
                        }}
                    />
                )}
                <div className="w-full max-w-[820px] mx-auto flex flex-col md:flex-row justify-center items-start gap-8 z-20">
                    {/* Coluna Esquerda */}
                    <aside className="w-full md:w-[330px] flex-shrink-0 flex flex-col gap-6 sticky top-24">
                        <div className="relative flex justify-center items-center w-[330px] h-[330px]">
                            {/* Flores por trás do Cover (Estilo Floral do Tema Sazonal) */}
                            {selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') && (
                                <div className="absolute w-[460px] h-[460px] pointer-events-none z-0" style={{ transform: 'scale(1.05)' }}>
                                    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full text-neutral-400 select-none pointer-events-none">
                                        {/* Grupo de Ramos e Folhas no Canto Inferior Esquerdo */}
                                        <g transform="translate(60, 240) rotate(-15)">
                                            <path d="M0 100 Q -30 40 -80 -10" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.25" />
                                            <path d="M -30 70 C -45 60 -50 40 -35 35 C -20 30 -15 50 -30 70 Z" fill="#8fbc8f" opacity="0.75" />
                                            <path d="M -50 45 C -65 35 -70 15 -55 10 C -40 5 -35 25 -50 45 Z" fill="#9bc49b" opacity="0.65" />
                                            <path d="M -15 85 C -25 75 -20 55 -5 55 C 10 55 10 75 -15 85 Z" fill="#a2caa2" opacity="0.6" />
                                            <circle cx="-35" cy="50" r="14" fill="var(--theme-accent, #a93fa1)" opacity="0.25" />
                                            <circle cx="-35" cy="50" r="10" fill="var(--theme-accent, #a93fa1)" />
                                            <circle cx="-35" cy="50" r="3" fill="#ffffff" />
                                            <circle cx="-60" cy="20" r="18" fill="var(--theme-accent, #a93fa1)" opacity="0.15" />
                                            <circle cx="-60" cy="20" r="13" fill="var(--theme-accent, #a93fa1)" opacity="0.8" />
                                            <circle cx="-60" cy="20" r="4" fill="#fef08a" />
                                        </g>
                                        
                                        {/* Grupo de Flores e Ramos no Canto Superior Esquerdo */}
                                        <g transform="translate(85, 90) rotate(20)">
                                            <path d="M0 50 Q -40 -10 -90 -40" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.25" />
                                            <path d="M -30 20 C -45 10 -40 -10 -25 -10 C -10 -10 -15 10 -30 20 Z" fill="#8fbc8f" opacity="0.7" />
                                            <path d="M -50 -5 C -65 -15 -60 -35 -45 -35 C -30 -35 -35 -15 -50 -5 Z" fill="#a2caa2" opacity="0.6" />
                                            <g transform="translate(-15, 10)">
                                                <circle cx="0" cy="0" r="28" fill="var(--theme-accent, #a93fa1)" opacity="0.15" />
                                                <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(0)" />
                                                <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(30)" />
                                                <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(60)" />
                                                <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(90)" />
                                                <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(120)" />
                                                <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(150)" />
                                                <circle cx="0" cy="0" r="7" fill="#fef08a" />
                                                <circle cx="0" cy="0" r="4" fill="#ca8a04" />
                                            </g>
                                        </g>

                                        {/* Ramo Superior saindo por trás do Topo */}
                                        <g transform="translate(230, 40) rotate(-10)">
                                            <path d="M 0 30 Q -20 -10 -60 -20" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.25" />
                                            <path d="M -25 -5 C -35 -15 -30 -30 -15 -25 C 0 -20 -10 5 -25 -5 Z" fill="#8fbc8f" opacity="0.7" />
                                            <circle cx="-15" cy="-10" r="10" fill="var(--theme-accent, #a93fa1)" opacity="0.35" />
                                            <circle cx="-15" cy="-10" r="7" fill="var(--theme-accent, #a93fa1)" />
                                            <circle cx="-15" cy="-10" r="2" fill="#ffffff" />
                                        </g>
                                    </svg>
                                </div>
                            )}

                            <motion.div
                                className="w-[330px] h-[330px] transition-all overflow-hidden relative cursor-pointer group photo-container"
                            style={{
                                transform: selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') ? 'rotate(-3deg)' : 'none',
                                background: selectedThemeId === 'warp' 
                                    ? 'rgba(255, 255, 255, 0.07)' 
                                    : (selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') ? '#ffffff' : 'var(--black-opacity-4)'),
                                padding: selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') ? '12px 12px 36px 12px' : '0px',
                                borderRadius: selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') ? '4px' : '12px',
                                width: selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') ? '280px' : '330px',
                                height: selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') ? '300px' : '330px',
                                boxShadow: selectedThemeId === 'seasonal' && (customStyle === 'Floral' || customStyle === 'Padrão') ? '0 12px 32px rgba(0,0,0,0.12)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = selectedThemeId === 'warp' ? 'rgba(255, 255, 255, 0.12)' : 'var(--black-opacity-8)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = selectedThemeId === 'warp' ? 'rgba(255, 255, 255, 0.07)' : 'var(--black-opacity-4)';
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 1 }}
                            onClick={() => setIsImagePickerOpen(true)}
                        >
                            {coverImage ? (
                                <img 
                                    ref={coverImageRef}
                                    src={coverImage || ""} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover" 
                                    crossOrigin={coverImage?.startsWith('http') ? "anonymous" : undefined}
                                    onLoad={handleCoverImageLoad}
                                    onError={() => console.warn('Erro ao carregar imagem de capa')}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
                                    <ImageIcon strokeWidth={1.5} size={32} />
                                    <span className="font-medium text-base">Adicionar Capa</span>
                                </div>
                            )}
                            
                            {/* Botão de câmera redondo absoluto no canto do card, exatamente como o Component 2 variante 11 do Figma */}
                            <div 
                                onClick={(e) => { e.stopPropagation(); setIsImagePickerOpen(true); }}
                                className="w-[36px] h-[36px] absolute bottom-[8px] right-[8px] bg-[#141414] hover:bg-neutral-900 border-2 border-white rounded-[36px] flex items-center justify-center cursor-pointer shadow-md transition-all z-10"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_7427_40)">
                                <path fillRule="evenodd" clipRule="evenodd" d="M8 0.25H7.958C6.589 0.25 5.504 0.25 4.638 0.338C3.75 0.428 3.009 0.618 2.361 1.051C1.84341 1.39846 1.39846 1.84341 1.051 2.361C0.617 3.009 0.428 3.751 0.338 4.638C0.25 5.504 0.25 6.589 0.25 7.958V8.042C0.25 9.411 0.25 10.496 0.338 11.362C0.428 12.25 0.618 12.991 1.051 13.639C1.397 14.158 1.842 14.603 2.361 14.949C3.009 15.383 3.751 15.572 4.638 15.662C5.504 15.75 6.589 15.75 7.958 15.75H8.042C9.411 15.75 10.496 15.75 11.362 15.662C12.25 15.572 12.991 15.382 13.639 14.95C14.1567 14.6023 14.6016 14.157 13.639 1.051C12.991 0.617 12.249 0.428 11.362 0.338C10.496 0.25 9.411 0.25 8.042 0.25H8ZM10.32 8.785C10.476 8.575 11.055 7.917 11.806 8.385C12.284 8.68 12.686 9.079 13.116 9.505C13.28 9.669 13.396 9.855 13.475 10.054C13.709 10.654 13.587 11.377 13.337 11.972C13.1956 12.3182 12.9808 12.6297 12.7076 12.885C12.4343 13.1403 12.109 13.3334 11.754 13.451C11.4358 13.5517 11.1038 13.602 10.77 13.6H4.87C4.283 13.6 3.764 13.46 3.338 13.197C3.071 13.032 3.024 12.652 3.222 12.406C3.55133 11.9947 3.88 11.5807 4.208 11.164C4.836 10.367 5.259 10.135 5.73 10.338C5.92 10.422 6.112 10.548 6.309 10.681C6.834 11.038 7.564 11.528 8.525 10.996C9.183 10.627 9.565 9.996 9.897 9.445L9.903 9.435L9.973 9.32C10.0805 9.13649 10.1963 8.95797 10.32 8.785ZM3.8 5.55C3.8 4.585 4.584 3.8 5.55 3.8C6.01413 3.8 6.45925 3.98437 6.78744 4.31256C7.11563 4.64075 7.3 5.08587 7.3 5.55C7.3 6.01413 7.11563 6.45925 6.78744 6.78744C6.45925 7.11563 6.01413 7.3 5.55 7.3C4.584 7.3 3.8 6.515 3.8 5.55Z" fill="white"/>
                                </g>
                                <defs>
                                <clipPath id="clip0_7427_40">
                                <rect width="16" height="16" fill="white"/>
                                </clipPath>
                                </defs>
                                </svg>
                            </div>
                        </motion.div>
                        </div>
 
                        {/* Botão de seleção de tema + Shuffle */}
                        <div className="w-[330px] flex justify-start items-center gap-[8px]">
                            <div
                                onClick={() => setIsThemeModalOpen(true)}
                                className="flex-1 h-[55px] pl-[13px] pr-[11px] py-[9px] transition-all rounded-[8px] cursor-pointer flex justify-start items-center gap-[6px] theme-selector-btn"
                            >
                                <img src={selectedTheme.img} className="w-[48px] h-[33px] rounded-[8px] object-cover shrink-0" />
                                <div className="flex-1 pl-[6px] flex flex-col justify-center items-start gap-0 min-w-0">
                                    <div className="text-[12px] font-normal leading-[15.6px] font-sans" style={{ color: 'var(--black-opacity-36)' }}>Tema</div>
                                    <div className="text-[16px] font-medium leading-[20.8px] font-sans truncate w-full" style={{ color: 'var(--black-opacity-64)' }}>{selectedTheme.name}</div>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--black-opacity-36)', flexShrink: 0 }}>
                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.99712 9.42011C3.84733 9.29725 3.65581 9.23712 3.46267 9.25231C3.26954 9.2675 3.08978 9.35684 2.96104 9.5016C2.8323 9.64637 2.76457 9.83534 2.77204 10.0289C2.77951 10.2225 2.8616 10.4057 3.00112 10.5401L7.50112 14.5401C7.63837 14.662 7.81556 14.7293 7.99912 14.7293C8.18268 14.7293 8.35986 14.662 8.49712 14.5401L12.9971 10.5401C13.1366 10.4057 13.2187 10.2225 13.2262 10.0289C13.2337 9.83534 13.1659 9.64637 13.0372 9.5016C12.9085 9.35684 12.7287 9.2675 12.5356 9.25231C12.3424 9.23712 12.1509 9.29725 12.0011 9.42011L7.99912 12.9761L3.99712 9.42011Z" fill="currentColor"/>
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12.0011 6.5592C12.1509 6.68206 12.3424 6.74219 12.5356 6.727C12.7287 6.71181 12.9085 6.62247 13.0372 6.47771C13.1659 6.33294 13.2337 6.14397 13.2262 5.95039C13.2187 5.7568 13.1366 5.57361 12.9971 5.4392L8.49712 1.4392C8.35986 1.31732 8.18268 1.25 7.99912 1.25C7.81556 1.25 7.63837 1.31732 7.50112 1.4392L3.00112 5.4392C2.8616 5.57361 2.77951 5.7568 2.77204 5.95039C2.76457 6.14397 2.8323 6.33294 2.96104 6.47771C3.08978 6.62247 3.26954 6.71181 3.46267 6.727C3.65581 6.74219 3.84733 6.68206 3.99712 6.5592L7.99912 3.0012L12.0011 6.5572V6.5592Z" fill="currentColor"/>
                                </svg>
                            </div>
 
                            <div
                                onClick={handleShuffleTheme}
                                className="w-[54px] h-[54px] shrink-0 transition-all rounded-[8px] flex justify-center items-center cursor-pointer theme-shuffle-btn"
                                title="Tema aleatório"
                            >
                                <Shuffle size={18} className="shrink-0" style={{ color: 'var(--black-opacity-36)' }} />
                            </div>
                        </div>
                    </aside>

                    {/* Coluna Direita (Formulário) */}
                    <div className="w-full md:w-[566px] flex-shrink-0 flex flex-col gap-6">
                        <div className="flex flex-row items-center justify-between gap-4 w-full">
                            {/* Dropdown de Calendário/Organização */}
                            <div className="relative">
                                <button
                                    className="h-[30px] rounded-[8px] calendar-toggle-btn flex items-center gap-[5px] pl-[10px] pr-[9px] text-[14px] font-sans font-medium cursor-pointer select-none"
                                    onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                                >
                                    {selectedOrg?.logoUrl ? (
                                        <img src={resolveImageUrl(selectedOrg.logoUrl)} className="w-[16px] h-[16px] rounded-[4px] object-cover shrink-0 border border-[#141414]/8" />
                                    ) : (
                                        <div className="w-[16px] h-[16px] rounded-[4px] bg-indigo-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0 border border-[#141414]/8">
                                            {selectedOrg?.name?.charAt(0) || 'P'}
                                        </div>
                                    )}
                                    <span className="truncate max-w-[120px] sm:max-w-none">{selectedOrg?.name || "Calendário Pessoal"}</span>
                                    <ChevronDown size={14} className="calendar-btn-arrow shrink-0" />
                                </button>
 
                                <AnimatePresence>
                                    {isOrgDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[90]" onClick={() => setIsOrgDropdownOpen(false)} />
                                            <motion.div
                                                className="lux-menu"
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                            >
                                                <div className="menu-content">
                                                    <div className="menu-header">Escolha o calendário:</div>
 
                                                    {/* Personal Calendar */}
                                                    <div
                                                        className={`calendar-selector-row ${!selectedOrgId ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setSelectedOrgId("");
                                                            setIsOrgDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="calendar-avatar round bg-indigo-500 flex items-center justify-center text-white text-[10px]">P</div>
                                                        <div className="calendar-name">Calendário Pessoal</div>
                                                        {!selectedOrgId && (
                                                            <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                                                                <CheckIcon size={10} className="text-white" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </div>
 
                                                    {/* Orgs */}
                                                    {orgs?.map(org => (
                                                        <div
                                                            key={org.id}
                                                            className={`calendar-selector-row ${selectedOrgId === org.id ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setSelectedOrgId(org.id);
                                                                setIsOrgDropdownOpen(false);
                                                            }}
                                                        >
                                                            {org.logoUrl ? (
                                                                <div className="calendar-avatar" style={{ backgroundImage: `url(${resolveImageUrl(org.logoUrl)})` }} />
                                                            ) : (
                                                                <div className="calendar-avatar flex items-center justify-center bg-gray-200 text-gray-500 text-[10px]">{org.name.charAt(0)}</div>
                                                            )}
                                                            <div className="calendar-name">{org.name}</div>
                                                            {selectedOrgId === org.id && (
                                                                <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                                                                    <CheckIcon size={10} className="text-white" strokeWidth={4} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
 
                                                    <div className="calendar-selector-row create-calendar-row" onClick={() => { setIsCreateCalendarModalOpen(true); setIsOrgDropdownOpen(false); }}>
                                                        <Plus size={16} />
                                                        <div className="calendar-name">Criar Calendário</div>
                                                    </div>
 
                                                    <div className="menu-footer">
                                                        <Info size={14} className="mt-0.5 shrink-0" />
                                                        <div>Criar o evento em um calendário concede aos seus administradores acesso de gerenciamento.</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                             </div>
 
                             {/* Dropdown de Privacidade */}
                             <div className="relative">
                                 <button
                                      className="h-[30px] rounded-[8px] privacy-toggle-btn flex items-center gap-[6px] px-[11px] text-[14px] font-sans font-medium cursor-pointer select-none"
                                      onClick={() => setIsPrivacyDropdownOpen(!isPrivacyDropdownOpen)}
                                  >
                                      {isPublic ? (
                                          <Globe size={14} className="privacy-btn-icon shrink-0" />
                                      ) : (
                                          <Sparkles size={14} className="privacy-btn-icon shrink-0" />
                                      )}
                                      <span className="select-none">{isPublic ? "Público" : "Privado"}</span>
                                      <ChevronDown size={14} className="privacy-btn-arrow shrink-0" />
                                  </button>
 
                                 <AnimatePresence>
                                     {isPrivacyDropdownOpen && (
                                         <>
                                             <div className="fixed inset-0 z-[90]" onClick={() => setIsPrivacyDropdownOpen(false)} />
                                             <motion.div
                                                 className="lux-menu right-0 left-auto"
                                                 initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                                 exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                 transition={{ duration: 0.15, ease: "easeOut" }}
                                                 style={{ width: '280px' }}
                                             >
                                                 <div className="menu-content">
                                                     {/* Public Option */}
                                                     <div
                                                         className={`calendar-selector-row privacy-row ${isPublic ? 'selected' : ''}`}
                                                         onClick={() => {
                                                             setIsPublic(true);
                                                             setIsPrivacyDropdownOpen(false);
                                                         }}
                                                     >
                                                        <Globe size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                                        <div className="privacy-content">
                                                            <div className="privacy-title">Público</div>
                                                            <div className="privacy-desc">Exibido no seu calendário e elegível para ser destacado.</div>
                                                        </div>
                                                        {isPublic && <CheckIcon size={14} className="shrink-0 mt-1 ml-auto" />}
                                                    </div>

                                                    {/* Private Option */}
                                                    <div
                                                        className={`calendar-selector-row privacy-row ${!isPublic ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setIsPublic(false);
                                                            setIsPrivacyDropdownOpen(false);
                                                        }}
                                                    >
                                                        <Sparkles size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                                        <div className="privacy-content">
                                                            <div className="privacy-title">Privado</div>
                                                            <div className="privacy-desc">Não listado. Apenas pessoas com o link podem se registrar.</div>
                                                        </div>
                                                        {!isPublic && <CheckIcon size={14} className="shrink-0 mt-1 ml-auto" />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Nome do Evento */}
                        <div className="w-full">
                            <textarea
                                ref={nameInputRef}
                                className="lux-naked-input w-full leading-[1.15] tracking-tight bg-transparent border-none outline-none resize-none overflow-hidden focus:outline-none focus:ring-0 focus:border-none"
                                placeholder="Nome do Evento"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                rows={1}
                                autoFocus
                                spellCheck={false}
                                onFocus={() => setActiveFocus('name')}
                                onBlur={() => setActiveFocus(null)}
                                style={{
                                    borderBottom: 'none',
                                    minHeight: '3rem'
                                }}
                            />
                        </div>

                        {/* Bloco de Data e Hora com Linha do Tempo Vertical - Figma Side-by-Side */}
                        <div className="w-full h-[80px] flex items-stretch gap-[12px] relative z-20">
                            {/* Bloco Esquerdo (Pickers Início e Fim) */}
                            <div className="w-[414px] h-[80px] datetime-container-bg backdrop-blur-[8px] rounded-[8px] relative px-[12px] py-[4px] flex flex-col justify-center gap-1 shrink-0">
                                {/* Linha vertical pontilhada central */}
                                <div className="absolute border-l border-dashed left-[21px] top-[26px] bottom-[26px] z-0 timeline-line" style={{ borderColor: 'var(--black-opacity-16)' }} />
                                
                                {/* Início */}
                                <div className="flex items-center gap-[8px] relative z-20 w-full h-[34px]">
                                    <div className="w-[10px] h-[10px] rounded-full ml-[6px] shrink-0 z-10 timeline-dot" style={{ backgroundColor: 'var(--black-opacity-32)' }} />
                                    <span className="text-[16px] leading-[24px] font-sans font-normal ml-2 shrink-0 w-[64px] select-none" style={{ color: 'var(--black-opacity-64)' }}>Início</span>
                                    <div className="flex-1 max-w-[216px] flex items-center datetime-picker-btn transition-all rounded-[8px] h-[34px] ml-auto shrink-0">
                                        <LuxDatePicker
                                            value={startDate}
                                            onChange={updateEventStartDate}
                                            className="bg-transparent border-none text-[16px] font-sans font-normal text-center cursor-pointer flex-1 w-full outline-none"
                                            style={{ color: 'var(--black)' }}
                                        />
                                        <div className="w-px h-[34px] shrink-0 picker-divider" style={{ backgroundColor: 'var(--black-opacity-8)' }} />
                                        <LuxTimePicker
                                            value={startTime}
                                            onChange={updateEventStartTime}
                                            className="bg-transparent border-none text-[16px] font-sans font-normal text-center cursor-pointer w-[65px] shrink-0 outline-none"
                                            style={{ color: 'var(--black)' }}
                                        />
                                    </div>
                                </div>

                                {/* Fim */}
                                <div className="flex items-center gap-[8px] relative z-10 w-full h-[34px]">
                                    <div className="w-[10px] h-[10px] rounded-full border bg-transparent ml-[6px] shrink-0 z-10 timeline-dot-outline" style={{ borderColor: 'var(--black-opacity-32)' }} />
                                    <span className="text-[16px] leading-[24px] font-sans font-normal ml-2 shrink-0 w-[64px] select-none" style={{ color: 'var(--black-opacity-64)' }}>Fim</span>
                                    <div className="flex-1 max-w-[216px] flex items-center datetime-picker-btn transition-all rounded-[8px] h-[34px] ml-auto shrink-0">
                                        <LuxDatePicker
                                            value={endDate}
                                            onChange={updateEventEndDate}
                                            minDate={startDate}
                                            className="bg-transparent border-none text-[16px] font-sans font-normal text-center cursor-pointer flex-1 w-full outline-none"
                                            style={{ color: 'var(--black)' }}
                                        />
                                        <div className="w-px h-[34px] shrink-0 picker-divider" style={{ backgroundColor: 'var(--black-opacity-8)' }} />
                                        <LuxTimePicker
                                            value={endTime}
                                            onChange={updateEventEndTime}
                                            minTime={(() => {
                                                if (startDate && endDate && startDate === endDate) {
                                                    const [sh, sm] = startTime.split(':').map(Number);
                                                    let eh = sh;
                                                    let em = sm + 30;
                                                    if (em >= 60) {
                                                        eh += 1;
                                                        em -= 60;
                                                    }
                                                    if (eh >= 24) return "23:59";
                                                    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                                                }
                                                return undefined;
                                            })()}
                                            className="bg-transparent border-none text-[16px] font-sans font-normal text-center cursor-pointer w-[65px] shrink-0 outline-none"
                                            style={{ color: 'var(--black)' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bloco Direito (Fuso Horário Interativo) */}
                            <div className="relative shrink-0">
                                <div 
                                    onClick={() => setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen)}
                                    className="w-[140px] h-[80px] datetime-container-bg backdrop-blur-[8px] rounded-[8px] p-2.5 flex flex-col justify-center items-start cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all select-none"
                                >
                                    <Globe size={16} className="shrink-0" style={{ color: 'var(--black-opacity-64)' }} />
                                    <div className="text-[14px] font-sans font-medium leading-[18.2px] mt-1 shrink-0" style={{ color: 'var(--black-opacity-64)' }}>{selectedTimezone.gmt}</div>
                                    <div className="text-[13px] font-sans font-normal leading-[19.5px] shrink-0 truncate w-full" style={{ color: 'var(--black-opacity-64)' }}>{selectedTimezone.city}</div>
                                </div>

                                <AnimatePresence>
                                    {isTimezoneDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[1900]" onClick={() => setIsTimezoneDropdownOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                                className="absolute right-0 top-[calc(100%+12px)] z-[2000] rounded-lg shadow-[0_3px_3px_rgba(0,0,0,0.03),0_8px_7px_rgba(0,0,0,0.04),0_17px_14px_rgba(0,0,0,0.05),0_35px_29px_rgba(0,0,0,0.06),0_96px_80px_rgba(0,0,0,0.07)] border border-white/10"
                                                style={{ 
                                                    transformOrigin: 'top right',
                                                    width: '340px',
                                                    maxHeight: '360px',
                                                    height: '360px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    background: 'rgba(34, 34, 34, 0.733)',
                                                    backdropFilter: 'blur(16px)',
                                                    WebkitBackdropFilter: 'blur(16px)',
                                                    colorScheme: 'dark',
                                                    color: '#ffffff',
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", Inter, Roboto, "Segoe UI", sans-serif',
                                                    boxSizing: 'border-box',
                                                    padding: '0px'
                                                }}
                                            >
                                                {/* Search query input - Margem Zero */}
                                                <div className="flex items-center w-full border-b border-white/10 shrink-0 h-[48px]" style={{ padding: '0px 16px' }}>
                                                    <input 
                                                        type="text"
                                                        placeholder="Buscar um fuso horário"
                                                        value={timezoneSearchQuery}
                                                        onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                                                        className="bg-transparent border-none text-[16px] font-sans font-normal outline-none w-full text-white placeholder:text-white/32"
                                                        style={{ padding: '0px', height: '100%' }}
                                                    />
                                                    {timezoneSearchQuery && (
                                                        <button type="button" onClick={() => setTimezoneSearchQuery("")} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                            <X size={16} className="text-white/42 hover:text-white/80" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div 
                                                    className="overflow-y-auto pr-1 flex-1 flex flex-col gap-0.5"
                                                    style={{
                                                        scrollbarColor: 'rgba(255, 255, 255, 0.32) rgba(0, 0, 0, 0)',
                                                        padding: '8px 12px 12px 12px'
                                                    }}
                                                >
                                                    {/* Render Popular section only if query is empty */}
                                                    {!timezoneSearchQuery && (
                                                        <div className="text-[12px] font-bold text-white/50 px-2 py-1.5 uppercase tracking-wider select-none">
                                                            Fusos Horários Populares
                                                        </div>
                                                    )}

                                                    {TIMEZONE_OPTIONS.slice(0, 13).filter(tz => 
                                                        tz.label.toLowerCase().includes(timezoneSearchQuery.toLowerCase()) || 
                                                        tz.city.toLowerCase().includes(timezoneSearchQuery.toLowerCase()) || 
                                                        tz.gmt.toLowerCase().includes(timezoneSearchQuery.toLowerCase())
                                                    ).map((tz) => {
                                                        const isSelected = tz.name === selectedTimezone.name;
                                                        return (
                                                            <button
                                                                key={tz.name}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedTimezone({ name: tz.name, city: tz.city, gmt: tz.gmt });
                                                                    setIsTimezoneDropdownOpen(false);
                                                                    setTimezoneSearchQuery("");
                                                                }}
                                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-all flex items-center justify-between
                                                                    ${isSelected 
                                                                        ? 'bg-white/10 text-white font-medium' 
                                                                        : 'text-white/90 hover:bg-white/5 hover:text-white'}
                                                                `}
                                                            >
                                                                <span className="truncate pr-2">{tz.label.split(' - ')[0]}</span>
                                                                <span className="text-[14px] font-mono shrink-0 text-white/48">{tz.gmt}</span>
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Remaining options as "Todos" section if query is empty */}
                                                    {!timezoneSearchQuery && (
                                                        <div className="text-[12px] font-bold text-white/50 px-2 py-1.5 mt-2 uppercase tracking-wider select-none">
                                                            Todos os fusos horários
                                                        </div>
                                                    )}

                                                    {TIMEZONE_OPTIONS.slice(13).filter(tz => 
                                                        tz.label.toLowerCase().includes(timezoneSearchQuery.toLowerCase()) || 
                                                        tz.city.toLowerCase().includes(timezoneSearchQuery.toLowerCase()) || 
                                                        tz.gmt.toLowerCase().includes(timezoneSearchQuery.toLowerCase())
                                                    ).map((tz) => {
                                                        const isSelected = tz.name === selectedTimezone.name;
                                                        return (
                                                            <button
                                                                key={tz.name}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedTimezone({ name: tz.name, city: tz.city, gmt: tz.gmt });
                                                                    setIsTimezoneDropdownOpen(false);
                                                                    setTimezoneSearchQuery("");
                                                                }}
                                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-all flex items-center justify-between
                                                                    ${isSelected 
                                                                        ? 'bg-white/10 text-white font-medium' 
                                                                        : 'text-white/90 hover:bg-white/5 hover:text-white'}
                                                                `}
                                                            >
                                                                <span className="truncate pr-2">{tz.label.split(' - ')[0]}</span>
                                                                <span className="text-[14px] font-mono shrink-0 text-white/48">{tz.gmt}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Localização e Descrição */}
                        <div className="flex flex-col gap-3">
                            <LuxLocationPicker
                                value={locationData}
                                onChange={setLocationData}
                            />

                            <div
                                className="meta-row min-h-[38px] flex items-center gap-[8px]"
                                onClick={() => setIsDescriptionOpen(true)}
                            >
                                <div className="meta-icon shrink-0">
                                    <Info size={16} className="mt-0.5" strokeWidth={2} />
                                </div>
                                <div className="meta-content flex flex-col min-w-0">
                                    <div className="meta-title">
                                        {description ? "Editar Descrição" : "Adicionar Descrição"}
                                    </div>
                                    {description && (
                                        <div className="meta-subtitle truncate max-w-[400px]">
                                            {stripHtml(description)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Opções Avançadas */}
                        <div className="advanced-options mt-1">
                            <div className="text-[14px] font-sans font-medium mb-2 px-1" style={{ color: 'var(--black-opacity-64)' }}>Opções de Evento</div>
                            <div className="options-card">
                                {/* Preço do Ingresso */}
                                <div 
                                    className="option-row"
                                    onClick={() => setIsTicketModalOpen(true)}
                                >
                                    <div className="meta-icon shrink-0 pl-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 shrink-0" style={{ color: 'var(--black-opacity-64)' }}><path fill="currentColor" fillRule="evenodd" d="M3.204 1.25C1.44 1.25.251 2.938.251 4.692v1.454c-.001.068-.001.163.007.247a.96.96 0 0 0 .162.466c.142.205.348.298.411.327l.005.002c.083.038.185.076.277.11l.016.007c.177.066.394.309.394.696s-.217.63-.394.696l-.017.007c-.091.034-.193.072-.276.11l-.005.002c-.063.029-.269.122-.411.327a.96.96 0 0 0-.162.465c-.008.084-.008.18-.008.247v1.453c0 1.755 1.188 3.443 2.954 3.443h9.592c1.766 0 2.954-1.688 2.954-3.443V9.854c0-.068 0-.163-.008-.247a.96.96 0 0 0-.162-.465c-.142-.205-.348-.298-.411-.327l-.005-.003a5 5 0 0 0-.276-.11l-.017-.006c-.177-.066-.394-.309-.394-.696s.217-.63.394-.696l.017-.007c.091-.034.193-.072.276-.11l.005-.002a1 1 0 0 0 .411-.327.96.96 0 0 0 .162-.466c.008-.084.008-.179.008-.247V4.693c0-1.755-1.19-3.443-2.954-3.443zM1.751 4.693c0-1.221.784-1.943 1.453-1.943H9.25v3.008a.75.75 0 0 0 1.5 0V2.75h2.046c.669 0 1.453.722 1.453 1.943v1.244c-.788.344-1.272 1.178-1.272 2.063s.484 1.72 1.273 2.063v1.244c0 1.221-.784 1.943-1.454 1.943H10.75v-2.492a.75.75 0 0 0-1.5 0v2.492H3.204c-.67 0-1.454-.722-1.454-1.943v-1.244C2.54 9.719 3.023 8.885 3.023 8S2.539 6.28 1.75 5.937z"></path></svg>
                                    </div>
                                    <span className="text-[16px] font-sans font-normal flex-1" style={{ color: 'var(--black-opacity-64)' }}>Preço do Ingresso</span>
                                    <div className="flex items-center gap-[4px] mr-1">
                                        <span className="text-[16px] font-sans font-medium" style={{ color: 'var(--black-opacity-36)' }}>
                                            {isFree ? "Gratuito" : `R$ ${price?.toFixed(2).replace('.', ',')}`}
                                        </span>
                                        <div className="w-[22px] h-[24px] flex items-center justify-center shrink-0">
                                            <ChevronRight size={14} className="shrink-0" style={{ color: 'var(--black-opacity-36)' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Requer Aprovação */}
                                <div className="option-row select-none">
                                    <div className="meta-icon shrink-0 pl-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 shrink-0" style={{ color: 'var(--black-opacity-64)' }}><path fill="currentColor" fillRule="evenodd" d="M7.75.25C5.336.25 3.5 2.086 3.5 4.5c0 1.225.474 2.007.9 2.575.09.12.165.216.23.298.102.13.18.228.255.345.101.158.115.233.115.282 0 .34-.126.536-.392.728-.3.217-.708.375-1.25.585l-.13.05c-.55.215-1.233.49-1.767.954C.88 10.821.5 11.524.5 12.5c0 .752.341 1.354.85 1.799.488.427 1.133.717 1.81.92 1.354.406 3.065.531 4.59.531a.75.75 0 0 0 0-1.5c-1.475 0-3.014-.125-4.16-.468-.573-.173-.99-.383-1.252-.612-.242-.211-.338-.422-.338-.67 0-.524.18-.821.446-1.052.309-.269.751-.463 1.326-.687l.159-.061c.493-.19 1.087-.418 1.555-.756C6.064 9.527 6.5 8.91 6.5 8c0-.451-.174-.813-.353-1.093a8 8 0 0 0-.397-.537l-.15-.195c-.324-.432-.6-.9-.6-1.675 0-1.586 1.164-2.75 2.75-2.75S10.5 2.914 10.5 4.5c0 .672-.208 1.11-.463 1.484a.75.75 0 1 0 1.24.843A3.96 3.96 0 0 0 12 4.5C12 2.086 10.164.25 7.75.25m7.561 9.247a.75.75 0 0 0-1.122-.994l-2.962 3.34-.896-1.096a.75.75 0 0 0-1.161.95l1.454 1.778a.75.75 0 0 0 1.142.023z"></path></svg>
                                    </div>
                                    <span className="text-[16px] font-sans font-normal flex-1" style={{ color: 'var(--black-opacity-64)' }}>Requer Aprovação</span>
                                    <div className="flex items-center justify-center h-[24px] w-[38px] shrink-0 mr-1 cursor-pointer">
                                        <FauvesSwitch checked={requireApproval} onCheckedChange={setRequireApproval} label="Requer aprovação" />
                                    </div>
                                </div>

                                {/* Capacidade */}
                                <div 
                                    className="option-row"
                                    onClick={() => setIsCapacityModalOpen(true)}
                                >
                                    <div className="meta-icon shrink-0 pl-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 shrink-0" style={{ color: 'var(--black-opacity-64)' }}><path fill="currentColor" fillRule="evenodd" d="M8 15.5a.75.75 0 0 0 .75-.75V10.5h.041c.872 0 1.609 0 2.159-.08s1.195-.277 1.5-.928c.305-.65.043-1.273-.248-1.746-.29-.474-.762-1.04-1.32-1.71l-.04-.047-.422-.507-.033-.04c-.399-.478-.748-.897-1.072-1.19-.348-.314-.769-.578-1.315-.578s-.966.264-1.315.578c-.324.293-.673.712-1.071 1.19l-.034.04-.422.507-.04.047c-.557.67-1.03 1.236-1.32 1.71-.29.473-.552 1.096-.248 1.746.305.651.95.848 1.5.928s1.288.08 2.16.08h.04v4.25c0 .414.336.75.75.75M4.921 8.85c.046.022.145.057.345.086C5.695 8.998 6.321 9 7.27 9h1.46c.95 0 1.576-.002 2.004-.064.2-.03.3-.064.345-.086a1.3 1.3 0 0 0-.155-.32c-.227-.369-.626-.851-1.234-1.58l-.422-.507-.033-.04c-.399-.478-.748-.897-1.072-1.19-.348-.314-.769-.578-1.315-.578s-.966.264-1.315.578c-.324.293-.673.712-1.071 1.19l-.034.04-.422.507-.04.047c-.557.67-1.03 1.236-1.32 1.71-.29.473-.552 1.096-.248 1.746.305.651.95.848 1.5.928s1.288.08 2.16.08h.04v4.25c0 .414.336.75.75.75M14 2a.75.75 0 0 0 0-1.5H2A.75.75 0 1 0 2 2z"></path></svg>
                                    </div>
                                    <span className="text-[16px] font-sans font-normal flex-1" style={{ color: 'var(--black-opacity-64)' }}>Capacidade</span>
                                    <div className="flex items-center gap-[4px] mr-1">
                                        <span className="text-[16px] font-sans font-medium" style={{ color: 'var(--black-opacity-36)' }}>
                                            {isLimited ? capacity : "Ilimitado"}
                                        </span>
                                        <div className="w-[22px] h-[24px] flex items-center justify-center shrink-0">
                                            <ChevronRight size={14} className="shrink-0" style={{ color: 'var(--black-opacity-36)' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botão de Criação de Evento */}
                        <button
                            className={`w-full h-[44px] rounded-[8px] font-sans font-medium text-[18px] transition-all duration-300 shadow-sm flex items-center justify-center shrink-0 border border-transparent select-none cursor-pointer mt-4 hover:brightness-110 active:scale-[0.98] ${
                                !eventName 
                                    ? "bg-[#5d5d5d] text-white/50 cursor-not-allowed opacity-50" 
                                    : "text-white"
                            }`}
                            style={eventName ? {
                                backgroundColor: 'var(--theme-accent)',
                            } : undefined}
                            disabled={!eventName || isSubmitting}
                            onClick={handleCreateEvent}
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                "Criar Evento"
                            )}
                        </button>
                    </div>
                </div>
            </main>

            <ImagePickerModalV2
                isOpen={isImagePickerOpen}
                onClose={() => setIsImagePickerOpen(false)}
                onSelect={(url) => {
                    setCoverImage(url);
                    setIsImagePickerOpen(false);
                }}
            />

            <DescriptionModalV2
                isOpen={isDescriptionOpen}
                onClose={() => setIsDescriptionOpen(false)}
                value={description}
                onChange={setDescription}
                onOpenAI={() => {
                    setIsDescriptionOpen(false); // Fecha descrição
                    setIsAIModalOpen(true);      // Abre IA
                }}
            />

            <AISuggestionModal
                isOpen={isAIModalOpen}
                onClose={() => {
                    setIsAIModalOpen(false);
                    setIsDescriptionOpen(true); // Reabre descrição ao cancelar
                }}
                onGenerate={(data) => {
                    setDescription(`Descrição gerada com humor ${data.mood} e instruções: ${data.instructions}`);
                    setIsAIModalOpen(false);
                    setIsDescriptionOpen(true); // Reabre descrição ao gerar
                }}
            />

            <TicketPriceModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                isFree={isFree}
                price={price}
                onChange={(free, p) => {
                    setIsFree(free);
                    setPrice(p);
                }}
            />

            <EventCapacityModal
                isOpen={isCapacityModalOpen}
                onClose={() => setIsCapacityModalOpen(false)}
                initialData={{ isLimited, capacity, waitlist }}
                onConfirm={(data) => {
                    setIsLimited(data.isLimited);
                    setCapacity(data.capacity);
                    setWaitlist(data.waitlist);
                }}
            />


            <ThemePickerModalV2
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                selectedThemeId={selectedThemeId}
                onSelect={(id) => {
                    handleThemeChange(id);
                }}
                themes={themes}
                customColor={customColor}
                onCustomColorSelect={setCustomColor}
                customFont={customFont}
                onCustomFontSelect={setCustomFont}
                customStyle={customStyle}
                onCustomStyleSelect={setCustomStyle}
                customDisplay={customDisplay}
                onCustomDisplaySelect={setCustomDisplay}
                quantumPreset={quantumPreset}
                setQuantumPreset={setQuantumPreset}
                selectedEmoji={selectedEmoji}
                onEmojiSelect={setSelectedEmoji}
                effectiveIsDark={effectiveIsDark}
            />

            <AnimatePresence>
                {isCreateCalendarModalOpen && (
                    <CreateCalendarModal
                        onCreated={async (org) => {
                            try {
                                if (org?.id && org?.name) {
                                    addOrganization(org);
                                    setSelectedOrgId(org.id);
                                }
                                setIsCreateCalendarModalOpen(false);
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                        onClose={() => setIsCreateCalendarModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Create Calendar Modal ---
const CREATE_CALENDAR_COLORS = [
    { name: 'gray',      value: '#939597' },
    { name: 'pink',      value: '#f31a7c' },
    { name: 'purple',    value: '#a855f7' },
    { name: 'violet',    value: '#7c3aed' },
    { name: 'blue',      value: '#3b82f6' },
    { name: 'green',     value: '#10b981' },
    { name: 'yellow',    value: '#fbbf24' },
    { name: 'orange',    value: '#f97316' },
    { name: 'red',       value: '#ef4444' },
];

const CreateCalendarModal = ({ onCreated, onClose }: { onCreated: (org: any) => Promise<void>; onClose: () => void }) => {
    const { user } = useAuth();
    const { fetchApi: _fetchApi, apiUrl: _apiUrl } = (() => {
        // Re-use the module-level fetchApi/apiUrl already imported
        return { fetchApi, apiUrl: (path: string) => path };
    })();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [themeColor, setThemeColor] = useState('#939597');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const placeholderIndex = React.useMemo(() => Math.floor(Math.random() * 12) + 1, []);

    const handleLogoUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'avatars');
        try {
            const res = await fetchApi('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) setLogoUrl(data.url);
        } catch (e) {
            console.error('Upload error', e);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) { setError('O nome é obrigatório.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetchApi('/api/organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    bio: description.trim(),
                    logoUrl: logoUrl || `https://cdn.lu.ma/avatars-default/community_avatar_${placeholderIndex}.png`,
                    themeColor,
                }),
            });
            const data = await res.json();
            if (res.ok && data.data) {
                await onCreated(data.data);
            } else {
                setError(data.message || 'Erro ao criar calendário.');
            }
        } catch (e) {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
                className="relative z-10 rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(28, 28, 32, 0.96)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    width: 380,
                    padding: '24px',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
                }}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Logo uploader */}
                <div className="mb-5">
                    <div
                        className="relative cursor-pointer"
                        style={{ width: 72, height: 72 }}
                        onClick={() => logoInputRef.current?.click()}
                    >
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: 16,
                                background: logoUrl
                                    ? `url(${resolveImageUrl(logoUrl)}) center/cover`
                                    : `url(https://cdn.lu.ma/avatars-default/community_avatar_${placeholderIndex}.png) center/cover`,
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: -6,
                                right: -6,
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#131517" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                        />
                    </div>
                </div>

                {/* Name input */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 2, paddingBottom: 6 }}>
                    <input
                        type="text"
                        placeholder="Nome do Calendário"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '1.375rem',
                            fontWeight: 600,
                            color: name ? '#ffffff' : 'rgba(255,255,255,0.35)',
                            fontFamily: 'Inter, sans-serif',
                            letterSpacing: '-0.02em',
                        }}
                        autoFocus
                    />
                </div>

                {/* Description input */}
                <div style={{ marginBottom: 20, paddingTop: 4 }}>
                    <textarea
                        placeholder="Adicione uma descrição curta."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={1}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontSize: '0.9375rem',
                            color: description ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: 1.5,
                        }}
                    />
                </div>

                {/* Color picker */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>
                        Cor de destaque
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {CREATE_CALENDAR_COLORS.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setThemeColor(c.value)}
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    background: c.value,
                                    border: themeColor === c.value
                                        ? '2px solid #fff'
                                        : '2px solid transparent',
                                    cursor: 'pointer',
                                    outline: themeColor === c.value ? `2px solid ${c.value}` : 'none',
                                    outlineOffset: 1,
                                    transition: 'transform 0.15s ease, outline 0.15s ease',
                                    transform: themeColor === c.value ? 'scale(1.15)' : 'scale(1)',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ marginBottom: 12, color: '#f87171', fontSize: '0.8125rem' }}>{error}</div>
                )}

                {/* Submit button */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !name.trim()}
                    style={{
                        width: '100%',
                        height: 52,
                        borderRadius: 14,
                        background: loading || !name.trim() ? 'rgba(255,255,255,0.15)' : '#ffffff',
                        color: loading || !name.trim() ? 'rgba(255,255,255,0.4)' : '#131517',
                        border: 'none',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                        cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s ease, color 0.2s ease',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {loading ? 'Criando...' : 'Criar Calendário'}
                </button>
            </motion.div>
        </motion.div>
    );
};

// --- Theme Modal ---
const ThemePickerModalV2 = ({
    isOpen,
    onClose,
    selectedThemeId,
    onSelect,
    themes,
    customColor,
    onCustomColorSelect,
    customFont,
    onCustomFontSelect,
    customStyle,
    onCustomStyleSelect,
    customDisplay,
    onCustomDisplaySelect,
    quantumPreset,
    setQuantumPreset,
    selectedEmoji,
    onEmojiSelect,
    effectiveIsDark,
}: {
    isOpen: boolean,
    onClose: () => void,
    selectedThemeId: string,
    onSelect: (id: string) => void,
    themes: any[],
    customColor: string | null,
    onCustomColorSelect: (color: string | null) => void,
    customFont: string | null,
    onCustomFontSelect: (font: string | null) => void,
    customStyle: string,
    onCustomStyleSelect: (style: string) => void,
    customDisplay: string,
    onCustomDisplaySelect: (display: string) => void,
    quantumPreset: string,
    setQuantumPreset: (preset: string) => void,
    selectedEmoji: string,
    onEmojiSelect: (emoji: string) => void,
    effectiveIsDark: boolean,
}) => {
    const [activePopover, setActivePopover] = useState<'color' | 'font' | 'style' | 'display' | 'emoji' | null>(null);

    // Regras de capacidade por tema
    const THEME_CAPS: Record<string, { cor: boolean; estilo: boolean; fonte: boolean; exibicao: boolean; emoji: boolean }> = {
        minimal:   { cor: true,  estilo: false, fonte: true, exibicao: true,  emoji: false },
        quantum:   { cor: true,  estilo: false, fonte: true, exibicao: true,  emoji: false },
        warp:      { cor: true,  estilo: false, fonte: true, exibicao: false, emoji: false },
        emoji:     { cor: true,  estilo: false, fonte: true, exibicao: true,  emoji: true  },
        confetti:  { cor: true,  estilo: true,  fonte: true, exibicao: true,  emoji: false },
        pattern:   { cor: true,  estilo: true,  fonte: true, exibicao: true,  emoji: false },
        seasonal:  { cor: true,  estilo: true,  fonte: true, exibicao: false, emoji: false },
    };
    const caps = THEME_CAPS[selectedThemeId] ?? { cor: true, estilo: true, fonte: true, exibicao: true, emoji: false };

    const EMOJI_LIST = ['🥳', '🔥', '😳', '😈', '🍭', '😭', '❤️', '🫠', '🌍', '🍀', '😂', '👻', '🐉', '🍸', '🏀', '🍕', '🥡', '🀄', '🎲', '😎', '🎃', '👽', '💀', '🇺🇸'];
    const EMOJI_STYLES = ['Festa', 'Carnaval', 'Flutuante', 'Espiral', 'Chuva'];

    const EMOJI_NAMES: Record<string, string> = {
        '🥳': 'Festa',
        '🔥': 'Fogo',
        '😳': 'Surpreso',
        '😈': 'Diabinho',
        '🍭': 'Doce',
        '😭': 'Choro',
        '❤️': 'Coração',
        '🫠': 'Derretendo',
        '🌍': 'Terra',
        '🍀': 'Trevo',
        '😂': 'Rindo',
        '👻': 'Fantasma',
        '🐉': 'Dragão',
        '🍸': 'Drink',
        '🏀': 'Basquete',
        '🍕': 'Pizza',
        '🥡': 'Comida Chinesa',
        '🀄': 'Mahjong',
        '🎲': 'Dado',
        '😎': 'Óculos',
        '🎃': 'Abóbora',
        '👽': 'Alien',
        '💀': 'Caveira',
        '🇺🇸': 'EUA'
    };

    const COLOR_OPTIONS = [
        '#9ca3af', '#ec4899', '#a855f7', '#6366f1',
        '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444'
    ];

    const FONT_OPTIONS = [
        { name: 'Padrão', value: 'Inter, sans-serif' },
        { name: 'Museo', value: '"museo-slab", serif' },
        { name: 'Factoria', value: 'system-ui' },
        { name: 'Ivy Presto', value: '"Playfair Display", serif' },
        { name: 'Ivy Mode', value: '"Lora", serif' },
        { name: 'Google', value: 'sans-serif' },
        { name: 'Roc', value: '"Syne", sans-serif' },
        { name: 'Nunito', value: 'Arial, sans-serif' },
        { name: 'Degular', value: 'Helvetica, sans-serif' },
        { name: 'Pearl', value: '"Playfair Display", "Times New Roman", serif' },
        { name: 'Geist Mono', value: '"Space Mono", monospace' },
        { name: 'New Spirit', value: '"Lora", "Times New Roman", serif' },
        { name: 'Departure', value: '"Syne", Arial, sans-serif' },
        { name: 'Garamond', value: '"Playfair Display", Georgia, serif' },
        { name: 'Futura', value: 'Verdana, sans-serif' },
        { name: 'Alternate', value: '"Lora", Georgia, serif' },
    ];

    const CONFETTI_STYLE_OPTIONS = [
        { name: 'Estrela', value: 'Estrela' },
        { name: 'Coração', value: 'Coração' },
        { name: 'Festa', value: 'Festa' },
        { name: 'Círculo', value: 'Círculo' }
    ];

    const STYLE_OPTIONS = ['Padrão', 'Sólido', 'Linhas', 'Minimalista'];
    const PATTERN_STYLE_OPTIONS = [
        { value: 'Cruz', id: 'cross', name: 'Cruz' },
        { value: 'Hipnótico', id: 'hypnotic', name: 'Hipnótico' },
        { value: 'Plus', id: 'plus', name: 'Plus' },
        { value: 'Poá', id: 'polkadot', name: 'Poá' },
        { value: 'Onda', id: 'wave', name: 'Onda' },
        { value: 'Zigzag', id: 'zigzag', name: 'Zigzag' },
        { value: 'Grade', id: 'grid', name: 'Grade' },
        { value: 'Diamante', id: 'diamond', name: 'Diamante' }
    ];

    const SEASONAL_STYLE_OPTIONS = [
        { value: 'Floral', id: 'floral', name: 'Floral', isNew: false },
        { value: 'Tamagotchi', id: 'tamagotchi', name: 'Tamagotchi', isNew: true },
        { value: 'Champagne', id: 'champagne', name: 'Champagne', isNew: false },
        { value: 'Bokeh', id: 'bokeh', name: 'Bokeh', isNew: false },
        { value: 'Fogos', id: 'fireworks', name: 'Fogos de artifício', isNew: false },
        { value: 'Matrix', id: 'matrix', name: 'Matrix', isNew: false },
        { value: 'Space War', id: 'spacewar', name: 'Space War', isNew: true },
        { value: 'Vida', id: 'life', name: 'Vida', isNew: true },
        { value: 'Cobra', id: 'snake', name: 'Cobra', isNew: true },
        { value: 'Polaroid', id: 'polaroid', name: 'Polaroid', isNew: false },
        { value: 'Piscina', id: 'pool', name: 'Piscina', isNew: false },
        { value: 'Grão', id: 'grain', name: 'Grão', isNew: true }
    ];
    const DISPLAY_OPTIONS = ['Automático', 'Claro', 'Escuro'];

    const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes[0];
    const displayColor = customColor || selectedTheme.accentColor;
    const displayFontObj = FONT_OPTIONS.find(f => f.value === (customFont || selectedTheme.fontFamily));
    const displayFontName = customFont ? (displayFontObj ? displayFontObj.name : 'Personalizada') : 'Padrão';

    // Pill desativado ââ‚¬â€ aparência cinza, sem hover, cursor não permitido
    const disabledPillStyle = { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' as const };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="lux-overlay" onClick={onClose}>
                    <motion.div
                        className="lux-modal sheet relative"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e) => { e.stopPropagation(); setActivePopover(null); }}
                        style={{
                            background: effectiveIsDark ? 'rgba(20, 20, 24, 0.85)' : 'rgba(255, 255, 255, 0.70)',
                            backdropFilter: 'blur(40px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                            borderTop: effectiveIsDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                            color: effectiveIsDark ? '#ffffff' : 'inherit',
                        }}
                    >
                        <div className="sheet-header" onClick={onClose}>
                            <div className="dragbar" style={{
                                background: effectiveIsDark ? 'rgba(255, 255, 255, 0.2)' : 'var(--gray-20)'
                            }}></div>
                        </div>
                        <div className="lux-modal-body px-4 pb-4">
                            <div className="zm-container pt-1 pb-2">
                                {/* Thumbnails de temas */}
                                <div className="top-level flex-center overflow-auto no-scrollbar">
                                    <div className="flex-center wrapper">
                                        {themes.map((theme) => (
                                            <button
                                                key={theme.id}
                                                type="button"
                                                className={`button-reset theme-button flex-column flex-center ${theme.id === selectedThemeId ? 'selected' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(theme.id);
                                                }}
                                            >
                                                <div className="relative">
                                                    <div className="icon animated">
                                                        <img src={theme.img} alt={`Preview for ${theme.name}`} />
                                                    </div>
                                                </div>
                                                <div className="fs-xxs text-tertiary-alpha text-center mt-2 animated label">
                                                    {theme.name}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="options pt-3">
                                    <div className="theme-controls relative">

                                        {/* Cor Pill */}
                                        <div className="relative">
                                            <div
                                                className="theme-option"
                                                style={!caps.cor ? disabledPillStyle : {}}
                                                onClick={(e) => { if (!caps.cor) return; e.stopPropagation(); setActivePopover(activePopover === 'color' ? null : 'color'); }}
                                            >
                                                <div className="flex items-center gap-1 w-full">
                                                    <div className="mr-1">
                                                        {selectedThemeId === 'quantum' ? (
                                                            <div className="dot border border-white/20" style={{ background: `linear-gradient(135deg, ${QUANTUM_PRESETS[quantumPreset].colors[0]}, ${QUANTUM_PRESETS[quantumPreset].colors[1]})` }} />
                                                        ) : (
                                                            <div className="dot" style={{ background: displayColor }} />
                                                        )}
                                                    </div>
                                                    <div className="content">
                                                        <div className="label">Cor</div>
                                                        <div className="value">
                                                            {selectedThemeId === 'quantum' ? QUANTUM_PRESETS[quantumPreset].name : (customColor ? 'Personalizado' : 'Padrão')}
                                                        </div>
                                                    </div>
                                                    <div className="accessory">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path fill="currentColor" fill-rule="evenodd" d="M4.164 10.253a1 1 0 1 0-1.328 1.494l4.5 4a1 1 0 0 0 1.328 0l4.5-4a1 1 0 0 0-1.328-1.494L8 13.662zm7.672-4.506a1 1 0 0 0 1.328-1.494l-4.5-4a1 1 0 0 0-1.328 0l-4.5 4a1 1 0 1 0 1.328 1.494L8 2.338z"></path></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Popover Cor (Centered/Aligned above Cor pill) */}
                                            <AnimatePresence>
                                                {activePopover === 'color' && caps.cor && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                                        className="absolute bottom-full mb-3 p-4 bg-white rounded-2xl shadow-2xl border border-black/5 z-50 flex items-center justify-center color-popover"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {selectedThemeId === 'quantum' ? (
                                                            <div className="grid grid-cols-4 gap-2.5 w-full">
                                                                {Object.entries(QUANTUM_PRESETS).map(([id, preset]) => (
                                                                    <button
                                                                        key={id}
                                                                        type="button"
                                                                        onClick={() => { setQuantumPreset(id); setActivePopover(null); }}
                                                                        className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all duration-200 border w-full h-[82px] ${quantumPreset === id ? 'border-[#5c5be5] bg-gray-50/30 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                                                                    >
                                                                        <div className="w-8 h-8 rounded-full flex overflow-hidden border border-black/5 shadow-inner">
                                                                            {preset.colors.map((c, i) => (
                                                                                <div key={i} className="flex-1 h-full" style={{ background: c }} />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-[11px] font-semibold text-gray-700 truncate w-full text-center">{preset.name}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                                {COLOR_OPTIONS.map(c => (
                                                                    <button
                                                                        key={c}
                                                                        type="button"
                                                                        className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                                                                        style={{ background: c, outline: displayColor === c ? '2px solid black' : 'none', outlineOffset: '2px' }}
                                                                        onClick={() => { onCustomColorSelect(c); setActivePopover(null); }}
                                                                    />
                                                                ))}
                                                                <label className="w-6 h-6 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform cursor-pointer relative overflow-hidden flex items-center justify-center">
                                                                    <div className="absolute inset-1 rounded-full border border-gray-400" />
                                                                    <input type="color" className="opacity-0 absolute inset-0 cursor-pointer" onChange={(e) => onCustomColorSelect(e.target.value)} />
                                                                </label>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Estilo Pill */}
                                        <div className="relative">
                                            <div
                                                className="theme-option"
                                                style={(!caps.estilo && !caps.emoji) ? disabledPillStyle : {}}
                                                onClick={(e) => {
                                                    if (!caps.estilo && !caps.emoji) return;
                                                    e.stopPropagation();
                                                    if (caps.emoji) setActivePopover(activePopover === 'emoji' ? null : 'emoji');
                                                    else setActivePopover(activePopover === 'style' ? null : 'style');
                                                }}
                                            >
                                                <div className="flex items-center gap-1 w-full">
                                                    <div className="mr-1">
                                                        {caps.emoji ? (
                                                            <img 
                                                                src={getAppleEmojiUrl(selectedEmoji)} 
                                                                alt={selectedEmoji} 
                                                                className="w-[14px] h-[14px] object-contain shrink-0" 
                                                            />
                                                        ) : selectedThemeId === 'confetti' ? (
                                                            <div className="flex items-center justify-center shrink-0 text-gray-500 w-[14px] h-[14px]">
                                                                {customStyle === 'Estrela' && <Star size={12} className="fill-current text-gray-500" />}
                                                                {customStyle === 'Coração' && <Heart size={12} className="fill-current text-gray-500" />}
                                                                {customStyle === 'Círculo' && <Circle size={12} className="fill-current text-gray-500" />}
                                                                {customStyle === 'Festa' && (
                                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[12px] h-[12px] text-gray-500">
                                                                        <path d="M6 19.5c3-1.5 6-3 8-6s3.5-6 4.5-8c-2.5 1-5 3.5-7.5 6.5s-4 6-5 7.5z" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="dot border border-black/10 shrink-0" style={{ background: '#e5e7eb' }} />
                                                        )}
                                                    </div>
                                                    <div className="content">
                                                        <div className="label">{caps.emoji ? 'Emoji' : 'Estilo'}</div>
                                                        <div className="value">{caps.emoji ? (EMOJI_NAMES[selectedEmoji] || selectedEmoji) : customStyle}</div>
                                                    </div>
                                                    <div className="accessory">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path fill="currentColor" fill-rule="evenodd" d="M4.164 10.253a1 1 0 1 0-1.328 1.494l4.5 4a1 1 0 0 0 1.328 0l4.5-4a1 1 0 0 0-1.328-1.494L8 13.662zm7.672-4.506a1 1 0 0 0 1.328-1.494l-4.5-4a1 1 0 0 0-1.328 0l-4.5 4a1 1 0 1 0 1.328 1.494L8 2.338z"></path></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Popover Emoji (Centered relative to Style pill) */}
                                            <AnimatePresence>
                                                {activePopover === 'emoji' && caps.emoji && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 shadow-2xl z-50 overflow-hidden emoji-popover"
                                                        style={{
                                                            width: '248px',
                                                            background: 'rgba(30, 30, 34, 0.85)',
                                                            backdropFilter: 'blur(20px)',
                                                            WebkitBackdropFilter: 'blur(20px)',
                                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                                            borderRadius: '24px',
                                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="grid grid-cols-4 gap-3 p-4">
                                                            {EMOJI_LIST.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    type="button"
                                                                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                                                                    style={{
                                                                        background: emoji === selectedEmoji ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                                        border: emoji === selectedEmoji ? '2px solid #ffffff' : '2px solid transparent',
                                                                        boxShadow: emoji === selectedEmoji ? '0 0 10px rgba(255, 255, 255, 0.2)' : 'none',
                                                                    }}
                                                                    onClick={() => { onEmojiSelect(emoji); }}
                                                                >
                                                                    <img 
                                                                        src={getAppleEmojiUrl(emoji)} 
                                                                        alt={emoji} 
                                                                        className="w-[26px] h-[26px] object-contain" 
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Popover Estilo normal (Centered relative to Style pill) */}
                                            <AnimatePresence>
                                                {activePopover === 'style' && caps.estilo && (
                                                    selectedThemeId === 'confetti' ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-5 z-50 flex flex-col items-center justify-center gap-3 style-popover"
                                                            style={{
                                                                width: '320px',
                                                                background: 'rgba(23, 23, 27, 0.95)',
                                                                backdropFilter: 'blur(20px)',
                                                                WebkitBackdropFilter: 'blur(20px)',
                                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                                borderRadius: '24px',
                                                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="flex items-center justify-between w-full gap-4 px-1">
                                                                {CONFETTI_STYLE_OPTIONS.map(opt => {
                                                                    const isSelected = customStyle === opt.value;
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            className="flex flex-col items-center gap-2 group cursor-pointer"
                                                                            onClick={() => {
                                                                                onCustomStyleSelect(opt.value);
                                                                                setActivePopover(null);
                                                                            }}
                                                                        >
                                                                            <div 
                                                                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                                                                                    isSelected 
                                                                                        ? 'ring-2 ring-white scale-105 bg-white/20' 
                                                                                        : 'bg-white/10 hover:bg-white/15'
                                                                                }`}
                                                                            >
                                                                                {opt.value === 'Estrela' && <Star size={22} className="text-white fill-white" />}
                                                                                {opt.value === 'Coração' && <Heart size={22} className="text-white fill-white" />}
                                                                                {opt.value === 'Círculo' && <Circle size={22} className="text-white fill-white" />}
                                                                                {opt.value === 'Festa' && (
                                                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px] text-white shrink-0">
                                                                                        <path d="M6 19.5c3-1.5 6-3 8-6s3.5-6 4.5-8c-2.5 1-5 3.5-7.5 6.5s-4 6-5 7.5z" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`text-[11px] font-medium tracking-wide transition-colors ${
                                                                                isSelected ? 'text-white font-semibold' : 'text-white/60 group-hover:text-white/80'
                                                                            }`}>
                                                                                {opt.name}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>

                                                        ) : selectedThemeId === 'pattern' ? (

                                                            <motion.div

                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}

                                                                animate={{ opacity: 1, y: 0, scale: 1 }}

                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}

                                                                transition={{ type: "spring", stiffness: 300, damping: 28 }}

                                                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3 bg-white rounded-3xl shadow-2xl border border-black/5 z-50 style-popover pattern-picker-popover"

                                                                style={{
                                                                    width: '300px',
                                                                }}

                                                                onClick={(e) => e.stopPropagation()}

                                                            >

                                                                <div className="grid grid-cols-4 gap-x-2 gap-y-4 p-2 pattern-picker w-full justify-items-center">

                                                                    {PATTERN_STYLE_OPTIONS.map(opt => {
                                                                        const isSelected = customStyle === opt.value || (opt.value === 'Plus' && customStyle === 'Padrão');
                                                                        const currentAccentColor = displayColor || '#a93fa1';

                                                                        return (
                                                                            <button
                                                                                key={opt.value}
                                                                                type="button"
                                                                                className={`flex flex-col items-center gap-1 group cursor-pointer button-reset pattern-picker-button ${isSelected ? 'selected' : ''}`}
                                                                                onClick={() => {
                                                                                    onCustomStyleSelect(opt.value);
                                                                                    setActivePopover(null);
                                                                                }}
                                                                            >
                                                                                <div 
                                                                                    className="w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden pattern-wrapper animated"
                                                                                    style={{
                                                                                        backgroundColor: isSelected 
                                                                                            ? (currentAccentColor.startsWith('#') ? currentAccentColor + '25' : 'rgba(169, 63, 161, 0.15)') 
                                                                                            : (currentAccentColor.startsWith('#') ? currentAccentColor + '0A' : 'rgba(169, 63, 161, 0.04)'),
                                                                                        border: isSelected 
                                                                                            ? `2px solid ${currentAccentColor}` 
                                                                                            : '1px solid rgba(0, 0, 0, 0.05)',
                                                                                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                                                                        boxShadow: isSelected ? `0 0 0 2px ${currentAccentColor + '30'}` : 'none'
                                                                                    }}
                                                                                >
                                                                                    <div 
                                                                                        className={`absolute inset-0 pattern pattern-${opt.id}`} 
                                                                                        style={{
                                                                                            '--theme-accent': currentAccentColor,
                                                                                            opacity: isSelected ? 0.95 : 0.8
                                                                                        } as React.CSSProperties}
                                                                                    />
                                                                                </div>
                                                                                <span 
                                                                                    className="text-[10px] font-medium tracking-wide transition-colors mt-1 text-center animated text-ellipses"
                                                                                    style={{
                                                                                        color: isSelected ? currentAccentColor : '#9ca3af',
                                                                                        fontWeight: isSelected ? '600' : '500'
                                                                                    }}
                                                                                >
                                                                                    {opt.name}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}

                                                                </div>

                                                            </motion.div>

                                                        ) : (

                                                            <motion.div

                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}

                                                                animate={{ opacity: 1, y: 0, scale: 1 }}

                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}

                                                                transition={{ type: "spring", stiffness: 300, damping: 28 }}

                                                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-2 bg-white rounded-xl shadow-xl border border-black/5 z-50 min-w-[160px] style-popover"

                                                                onClick={(e) => e.stopPropagation()}

                                                            >

                                                                {STYLE_OPTIONS.map(s => (

                                                                    <button

                                                                        key={s}

                                                                        type="button"

                                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"

                                                                        onClick={() => { onCustomStyleSelect(s); setActivePopover(null); }}

                                                                    >

                                                                        {s}

                                                                        {customStyle === s && <CheckIcon size={14} className="text-black" />}

                                                                    </button>

                                                                ))}

                                                            </motion.div>

                                                        )

                                                    )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Fonte Pill */}
                                        <div className="relative">
                                            <div
                                                className="theme-option"
                                                onClick={(e) => { e.stopPropagation(); setActivePopover(activePopover === 'font' ? null : 'font'); }}
                                            >
                                                <div className="flex items-center gap-1 w-full">
                                                    <div className="mr-1">
                                                        <div className="flex items-center justify-center font-serif font-bold text-[10px] w-3.5 h-3.5 bg-black/5 rounded-sm shrink-0" style={{ fontFamily: customFont || selectedTheme.fontFamily }}>Ag</div>
                                                    </div>
                                                    <div className="content">
                                                        <div className="label">Fonte</div>
                                                        <div className="value">{displayFontName}</div>
                                                    </div>
                                                    <div className="accessory">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path fill="currentColor" fill-rule="evenodd" d="M4.164 10.253a1 1 0 1 0-1.328 1.494l4.5 4a1 1 0 0 0 1.328 0l4.5-4a1 1 0 0 0-1.328-1.494L8 13.662zm7.672-4.506a1 1 0 0 0 1.328-1.494l-4.5-4a1 1 0 0 0-1.328 0l-4.5 4a1 1 0 1 0 1.328 1.494L8 2.338z"></path></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Popover Fonte (Centered/Aligned above Fonte pill) */}
                                            <AnimatePresence>
                                                {activePopover === 'font' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                                        className="absolute bottom-full mb-3 p-4 bg-white rounded-xl shadow-xl border border-black/5 z-50 font-popover"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                                            {FONT_OPTIONS.map(f => {
                                                                const isSelected = (customFont || selectedTheme.fontFamily) === f.value;
                                                                return (
                                                                    <button
                                                                        key={f.name}
                                                                        type="button"
                                                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${isSelected ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}
                                                                        onClick={() => { onCustomFontSelect(f.value); setActivePopover(null); }}
                                                                    >
                                                                        <div className={`flex items-center justify-center h-12 w-full rounded-lg bg-gray-50 text-2xl ${isSelected ? 'text-black' : 'text-gray-500'}`} style={{ fontFamily: f.value }}>Ag</div>
                                                                        <div className={`text-[10px] ${isSelected ? 'text-black font-semibold' : 'text-gray-500'}`}>{f.name}</div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Exibição Pill */}
                                        <div className="relative">
                                            <div
                                                className="theme-option"
                                                style={!caps.exibicao ? disabledPillStyle : {}}
                                                onClick={(e) => {
                                                    if (!caps.exibicao) return;
                                                    e.stopPropagation();
                                                    const currentVal = selectedThemeId === 'warp' ? 'Escuro' : (effectiveIsDark ? 'Escuro' : 'Claro');
                                                    const nextVal = currentVal === 'Claro' ? 'Escuro' : 'Claro';
                                                    onCustomDisplaySelect(nextVal);
                                                }}
                                            >
                                                <div className="flex items-center gap-1 w-full">
                                                    <div className="mr-1">
                                                        <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                                            {effectiveIsDark ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#60a5fa]">
                                                                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#d97706]">
                                                                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                                                                    <path d="M12 2v2" />
                                                                    <path d="M12 20v2" />
                                                                    <path d="M4.93 4.93l1.41 1.41" />
                                                                    <path d="M17.66 17.66l1.41 1.41" />
                                                                    <path d="M2 12h2" />
                                                                    <path d="M20 12h2" />
                                                                    <path d="M6.34 17.66l-1.41 1.41" />
                                                                    <path d="M19.07 4.93l-1.41 1.41" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="content">
                                                        <div className="label">Exibição</div>
                                                        <div className="value">
                                                            {selectedThemeId === 'warp' ? 'Escuro' : (effectiveIsDark ? 'Escuro' : 'Claro')}
                                                        </div>
                                                    </div>
                                                    <div className="accessory">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path fill="currentColor" fillRule="evenodd" d="M4.164 10.253a1 1 0 1 0-1.328 1.494l4.5 4a1 1 0 0 0 1.328 0l4.5-4a1 1 0 0 0-1.328-1.494L8 13.662zm7.672-4.506a1 1 0 0 0 1.328-1.494l-4.5-4a1 1 0 0 0-1.328 0l-4.5 4a1 1 0 1 0 1.328 1.494L8 2.338z"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

