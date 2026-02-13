import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Mic2, Radio, Guitar, Sparkles, PartyPopper } from 'lucide-react';
import { apiUrl } from '@/lib/apiBase';

interface Category {
    id: string;
    name: string;
    slug?: string;
    imageUrl?: string;
    isActive: boolean;
}

interface StyleDiscoveryProps {
    events: any[];
    selectedUf: string;
    categories: Category[];
    useMockData?: boolean; // Flag para usar dados mockados
}

// Categorias mockadas para visualização
const MOCK_CATEGORIES: Category[] = [
    { id: 'mock-1', name: 'Shows e Festas', slug: 'shows-festas', imageUrl: null, isActive: true },
    { id: 'mock-2', name: 'Rock', slug: 'rock', imageUrl: null, isActive: true },
    { id: 'mock-3', name: 'Eletrônica', slug: 'eletronica', imageUrl: null, isActive: true },
    { id: 'mock-4', name: 'Sertanejo', slug: 'sertanejo', imageUrl: null, isActive: true },
    { id: 'mock-5', name: 'MPB', slug: 'mpb', imageUrl: null, isActive: true },
    { id: 'mock-6', name: 'Hip Hop', slug: 'hip-hop', imageUrl: null, isActive: true },
];

const StyleDiscovery: React.FC<StyleDiscoveryProps> = ({ events, selectedUf, categories, useMockData = true }) => {
    const navigate = useNavigate();

    // Mapeamento de ícones por nome de categoria (fallback quando não tem imagem)
    const getIconForCategory = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('rock')) return <Guitar className="w-8 h-8" />;
        if (lowerName.includes('eletrônica') || lowerName.includes('eletronica')) return <Radio className="w-8 h-8" />;
        if (lowerName.includes('festa') || lowerName.includes('show')) return <PartyPopper className="w-8 h-8" />;
        if (lowerName.includes('sertanejo') || lowerName.includes('mpb') || lowerName.includes('hip')) return <Mic2 className="w-8 h-8" />;
        if (lowerName.includes('jazz') || lowerName.includes('clássica')) return <Music className="w-8 h-8" />;
        return <Sparkles className="w-8 h-8" />; // default
    };

    // Mapeamento de cores por categoria (fallback quando não tem imagem)
    const getGradientForCategory = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('rock')) return {
            color: 'from-red-500 to-orange-500',
            bg: 'bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-900/20 dark:to-orange-900/20'
        };
        if (lowerName.includes('eletrônica') || lowerName.includes('eletronica')) return {
            color: 'from-cyan-500 to-blue-500',
            bg: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-900/20 dark:to-blue-900/20'
        };
        if (lowerName.includes('festa') || lowerName.includes('show')) return {
            color: 'from-purple-500 to-pink-500',
            bg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-900/20 dark:to-pink-900/20'
        };
        if (lowerName.includes('sertanejo')) return {
            color: 'from-amber-500 to-yellow-500',
            bg: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-900/20 dark:to-yellow-900/20'
        };
        if (lowerName.includes('mpb')) return {
            color: 'from-emerald-500 to-green-500',
            bg: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-900/20 dark:to-green-900/20'
        };
        // Default gradient
        return {
            color: 'from-violet-500 to-purple-500',
            bg: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-900/20 dark:to-purple-900/20'
        };
    };

    // Calcula quantos eventos existem naquele estado E naquela categoria
    const getEventCount = (categoryName: string) => {
        return events.filter(event => {
            const eventCategory = event.category || '';
            const eventUf = (event.locationUf || '').toUpperCase();

            // Match categoria (pode ser parcial/flexível)
            const categoryMatch = eventCategory.toLowerCase().includes(categoryName.toLowerCase()) ||
                categoryName.toLowerCase().includes(eventCategory.toLowerCase());

            // Match UF
            const ufMatch = selectedUf ? eventUf === selectedUf.toUpperCase() : true;

            return categoryMatch && ufMatch;
        }).length;
    };

    const handleCategoryClick = (categoryName: string, slug?: string) => {
        const query = new URLSearchParams({
            category: slug || categoryName,
            ...(selectedUf && { uf: selectedUf })
        }).toString();

        navigate(`/search?${query}`);
    };

    // Se useMockData e não tiver categorias reais, usa mockadas com contadores aleatórios
    const displayCategories = useMockData && categories.length === 0
        ? MOCK_CATEGORIES.map(cat => ({
            ...cat,
            count: Math.floor(Math.random() * 20) + 5 // Entre 5 e 25 eventos
        }))
        : categories
            .filter(cat => cat.isActive)
            .map(cat => ({ ...cat, count: getEventCount(cat.name) }))
            .filter(cat => cat.count > 0);

    if (displayCategories.length === 0) {
        return null;
    }

    return (
        <section className="px-[156px] py-5 max-md:px-5 max-md:py-4 max-sm:px-4 max-sm:py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-md:gap-3">
                {displayCategories.map((category) => {
                    const gradient = getGradientForCategory(category.name);
                    const icon = getIconForCategory(category.name);
                    const imageUrl = category.imageUrl ? apiUrl(category.imageUrl) : null;

                    return (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.name, category.slug)}
                            className={`
                relative overflow-hidden
                rounded-2xl p-6 max-md:p-4
                ${!imageUrl ? gradient.bg : 'bg-gray-100 dark:bg-gray-800'}
                border border-gray-200 dark:border-gray-800
                hover:scale-105 hover:shadow-xl
                transition-all duration-300 ease-out
                group cursor-pointer
                flex flex-col items-center justify-center gap-3
                min-h-[140px] max-md:min-h-[120px]
              `}
                        >
                            {/* Imagem de fundo se existir */}
                            {imageUrl && (
                                <>
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-300"
                                        style={{ backgroundImage: `url(${imageUrl})` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </>
                            )}

                            {/* Ícone com gradiente (só aparece se não tiver imagem) */}
                            {!imageUrl && (
                                <div className={`
                  bg-gradient-to-br ${gradient.color}
                  text-white p-3 rounded-full
                  group-hover:scale-110 transition-transform duration-300
                  relative z-10
                `}>
                                    {icon}
                                </div>
                            )}

                            {/* Nome da categoria */}
                            <div className="text-center relative z-10">
                                <div className={`font-bold text-sm max-md:text-xs ${imageUrl
                                    ? 'text-white drop-shadow-lg'
                                    : 'text-indigo-950 dark:text-white'
                                    }`}>
                                    {category.name}
                                </div>
                            </div>

                            {/* Efeito de hover sutil */}
                            {!imageUrl && (
                                <div className={`
                  absolute inset-0 bg-gradient-to-br ${gradient.color}
                  opacity-0 group-hover:opacity-10
                  transition-opacity duration-300
                `} />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default StyleDiscovery;
