import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getEventPath } from '@/lib/eventUrl';
import { useAuth } from '@/context/AuthContext';

interface FollowedArtistEvent {
    id: string;
    slug?: string;
    title: string;
    date: string;
    dateShort: string;
    location: string;
    image: string;
    artistName: string;
    artistPhoto: string; // Foto do artista
    isNearby: boolean; // Se está no estado do usuário
}

interface FollowedArtistsProps {
    events: any[];
    selectedUf: string;
    useMockData?: boolean;
}

// Dados mockados para visualização
const MOCK_FOLLOWED_EVENTS: FollowedArtistEvent[] = [
    {
        id: 'mock-1',
        title: 'Jorge & Mateus - Turnê 2025',
        date: '10 de fevereiro de 2025',
        dateShort: '10 FEV',
        location: 'São Paulo - SP',
        image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
        artistName: 'Jorge & Mateus',
        artistPhoto: 'https://i.pravatar.cc/150?img=12',
        isNearby: true,
    },
    {
        id: 'mock-2',
        title: 'Anitta - Girl From Rio Tour',
        date: '15 de fevereiro de 2025',
        dateShort: '15 FEV',
        location: 'Rio de Janeiro - RJ',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        artistName: 'Anitta',
        artistPhoto: 'https://i.pravatar.cc/150?img=5',
        isNearby: false,
    },
    {
        id: 'mock-3',
        title: 'Alok ao Vivo',
        date: '20 de fevereiro de 2025',
        dateShort: '20 FEV',
        location: 'São Paulo - SP',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        artistName: 'Alok',
        artistPhoto: 'https://i.pravatar.cc/150?img=33',
        isNearby: true,
    },
    {
        id: 'mock-4',
        title: 'Ludmilla - Numanice Tour',
        date: '25 de fevereiro de 2025',
        dateShort: '25 FEV',
        location: 'Belo Horizonte - MG',
        image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
        artistName: 'Ludmilla',
        artistPhoto: 'https://i.pravatar.cc/150?img=9',
        isNearby: false,
    },
];

const FollowedArtists: React.FC<FollowedArtistsProps> = ({ events, selectedUf, useMockData = true }) => {
    const { user } = useAuth();

    // Só mostra para usuário logado
    if (!user) {
        return null;
    }

    // TODO: Quando implementar o sistema real, buscar:
    // 1. Artistas que o usuário segue (/api/user/followed-artists)
    // 2. Eventos desses artistas (filtrado por artistId)

    const mapEvent = (ev: any): FollowedArtistEvent => {
        const startDate = typeof ev.startDate === 'string' ? new Date(ev.startDate) : null;
        const eventUf = (ev.locationUf || '').toUpperCase();

        return {
            id: ev.id || '',
            slug: ev.slug,
            title: ev.name || 'Evento sem nome',
            date: startDate ? startDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }) : 'Data não informada',
            dateShort: startDate ? `${startDate.getDate().toString().padStart(2, '0')} ${startDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}` : '',
            location: (() => {
                const city = ev.locationCity;
                const uf = ev.locationUf;
                if (city && uf) return `${city} - ${uf}`;
                if (typeof ev.location === 'string') return ev.location;
                return 'Local não informado';
            })(),
            image: (() => {
                const maybeBanner = ev.bannerUrl ?? ev.banner ?? ev.image;
                if (!maybeBanner) return '/no-image.svg';
                if (typeof maybeBanner === 'string' && maybeBanner.startsWith('/uploads/')) {
                    return `${import.meta.env.VITE_API_BASE || ''}${maybeBanner}`;
                }
                return maybeBanner;
            })(),
            artistName: ev.artistName || 'Artista',
            artistPhoto: ev.artistPhoto || 'https://i.pravatar.cc/150?img=1', // Foto placeholder
            isNearby: selectedUf ? eventUf === selectedUf.toUpperCase() : false,
        };
    };

    // Filtra eventos de artistas seguidos
    // Por enquanto retorna array vazio pois ainda não temos a lista de artistas seguidos
    const followedEvents: FollowedArtistEvent[] = [];

    const displayEvents = useMockData && followedEvents.length === 0
        ? MOCK_FOLLOWED_EVENTS
        : followedEvents;

    if (displayEvents.length === 0) {
        return null;
    }

    return (
        <section className="px-[156px] py-5 max-md:px-5 max-md:py-4 max-sm:px-4 max-sm:py-4">
            <div className="flex items-center gap-2 mb-5 max-md:mb-4 max-sm:mb-3">
                <Heart className="w-5 h-5 text-[#EF4118] fill-[#EF4118]" />
                <h2 className="text-[#091747] dark:text-white text-lg font-bold max-sm:text-base">
                    Artistas que Você Segue
                </h2>
            </div>

            <div className="grid grid-cols-4 gap-5 max-md:grid-cols-2 max-md:gap-4 max-sm:grid-cols-1 max-sm:gap-3">
                {displayEvents.map((event, idx) => {
                    const to = getEventPath({ id: event.id, slug: event.slug });

                    return (
                        <Link
                            key={event.id}
                            to={to}
                            className="group relative block w-[245px] max-md:w-full max-md:max-w-[245px] max-md:justify-self-center max-sm:w-full max-sm:max-w-none"
                            style={{
                                opacity: 0,
                                animation: `fadeIn 0.5s ease forwards`,
                                animationDelay: `${idx * 80}ms`,
                            }}
                        >
                            {/* Container com aspect ratio fixo */}
                            <div className="relative w-full aspect-square rounded-[14px] overflow-hidden bg-gray-100 border-2 border-[#EF4118]/20">
                                {/* Imagem do evento */}
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Foto do artista - canto superior esquerdo com badge de "seguindo" */}
                                <div className="absolute top-3 left-3 z-20">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-3 border-white shadow-lg overflow-hidden bg-gray-200">
                                            <img
                                                src={event.artistPhoto}
                                                alt={event.artistName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Badge de "seguindo" no canto da foto */}
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#EF4118] rounded-full flex items-center justify-center shadow-md">
                                            <Heart className="w-3 h-3 text-white fill-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Badge de localização - canto superior direito */}
                                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg z-20 ${event.isNearby ? 'bg-green-500' : 'bg-blue-500'
                                    }`}>
                                    {event.isNearby ? '📍 Perto' : '🗺️ Outro estado'}
                                </div>

                                {/* Overlay com info - aparece no hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                                    {/* Nome do artista com destaque */}
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                                            <img
                                                src={event.artistPhoto}
                                                alt={event.artistName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-white/60 uppercase tracking-wide">Artista</div>
                                            <div className="text-white text-sm font-bold leading-tight">
                                                {event.artistName}
                                            </div>
                                        </div>
                                    </div>

                                    <time className="text-[#EF4118] text-sm font-bold mb-1">
                                        {event.dateShort}
                                    </time>
                                    <h3 className="text-white text-lg font-bold leading-tight mb-2 line-clamp-2">
                                        {event.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <svg width="10" height="13" viewBox="0 0 10 13" fill="none" className="text-white/80 flex-shrink-0">
                                            <path d="M4.875 13C4.875 13 9.75 9.1 9.75 4.875C9.75 2.1827 7.5673 0 4.875 0C2.1827 0 0 2.1827 0 4.875C0 9.1 4.875 13 4.875 13Z" stroke="currentColor" strokeLinejoin="round" />
                                            <path d="M4.875 6.8258C5.1311 6.8258 5.3847 6.7753 6.2746 5.622C6.7746 5.3854 6.825 5.1319 6.825 4.8758C6.825 4.6197 6.7746 4.3661 6.6766 4.1295C6.5786 3.893 6.435 3.678 6.2539 3.4969C6.0728 3.3158 5.8579 3.1722 5.6213 3.0742C5.3847 2.9762 5.1311 2.9258 4.875 2.9258C4.3579 2.9258 3.8619 3.1312 3.4962 3.4969C3.1305 3.8626 2.925 4.3586 2.925 4.8758C2.925 5.393 3.1305 5.8889 3.4962 6.2546C3.8619 6.6203 4.3579 6.8258 4.875 6.8258Z" stroke="currentColor" strokeLinejoin="round" />
                                        </svg>
                                        <span className="text-white/90 text-xs">
                                            {event.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </section>
    );
};

export default FollowedArtists;
