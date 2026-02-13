import React from 'react';
import { Flame, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getEventPath } from '@/lib/eventUrl';

interface TrendingEvent {
    id: string;
    slug?: string;
    title: string;
    date: string;
    dateShort: string;
    location: string;
    image: string;
    percentSold?: number;
    badge?: 'hot' | 'selling-fast' | 'last-tickets';
}

interface TrendingEventsProps {
    events: any[];
    selectedUf: string;
    useMockData?: boolean;
}

// Dados mockados para visualização
const MOCK_TRENDING_EVENTS: TrendingEvent[] = [
    {
        id: 'mock-1',
        title: 'Festival de Verão 2025',
        date: '15 de janeiro de 2025',
        dateShort: '15 JAN',
        location: 'São Paulo - SP',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        percentSold: 95,
        badge: 'last-tickets',
    },
    {
        id: 'mock-2',
        title: 'Rock in Rio Experience',
        date: '20 de janeiro de 2025',
        dateShort: '20 JAN',
        location: 'Rio de Janeiro - RJ',
        image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
        percentSold: 75,
        badge: 'hot',
    },
    {
        id: 'mock-3',
        title: 'Sertanejo Universitário',
        date: '25 de janeiro de 2025',
        dateShort: '25 JAN',
        location: 'Belo Horizonte - MG',
        image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
        percentSold: 60,
        badge: 'selling-fast',
    },
    {
        id: 'mock-4',
        title: 'Eletrônica Night',
        date: '28 de janeiro de 2025',
        dateShort: '28 JAN',
        location: 'São Paulo - SP',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        percentSold: 92,
        badge: 'last-tickets',
    },
];

const TrendingEvents: React.FC<TrendingEventsProps> = ({ events, selectedUf, useMockData = true }) => {
    // Mapeia eventos reais para formato TrendingEvent
    const mapEvent = (ev: any): TrendingEvent => {
        const startDate = typeof ev.startDate === 'string' ? new Date(ev.startDate) : null;

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
            percentSold: ev.percentSold || 0,
        };
    };

    // Filtra eventos do estado selecionado
    const stateEvents = selectedUf
        ? events.filter(ev => {
            const eventUf = (ev.locationUf || '').toUpperCase();
            return eventUf === selectedUf.toUpperCase();
        })
        : events;

    // Ordena eventos próximos
    const trendingEvents = stateEvents
        .map(mapEvent)
        .filter(ev => {
            try {
                const eventDate = new Date(ev.date);
                return eventDate > new Date();
            } catch {
                return true;
            }
        })
        .sort((a, b) => {
            try {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
            } catch {
                return 0;
            }
        })
        .slice(0, 4);

    const displayEvents = useMockData && trendingEvents.length === 0
        ? MOCK_TRENDING_EVENTS
        : trendingEvents;

    if (displayEvents.length === 0) {
        return null;
    }

    return (
        <section className="px-[156px] py-5 max-md:px-5 max-md:py-4 max-sm:px-4 max-sm:py-4">
            <div className="flex items-center gap-2 mb-5 max-md:mb-4 max-sm:mb-3">
                <Flame className="w-5 h-5 text-[#EF4118]" />
                <h2 className="text-[#091747] dark:text-white text-lg font-bold max-sm:text-base">
                    Eventos em Alta {selectedUf && `em ${selectedUf}`}
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
                            <div className="relative w-full aspect-square rounded-[14px] overflow-hidden bg-gray-100">
                                {/* Imagem */}
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Badge no canto superior - DENTRO do card */}
                                {event.badge && (
                                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg z-20 ${event.badge === 'last-tickets' ? 'bg-red-500' :
                                            event.badge === 'hot' ? 'bg-orange-500' :
                                                'bg-yellow-500'
                                        }`}>
                                        {event.badge === 'last-tickets' ? (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Últimos
                                            </span>
                                        ) :
                                            event.badge === 'hot' ? (
                                                <span className="flex items-center gap-1">
                                                    <Flame className="w-3 h-3" />
                                                    Bombando
                                                </span>
                                            ) : '📈 Em alta'}
                                    </div>
                                )}

                                {/* Overlay com info - aparece no hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                                    <time className="text-[#EF4118] text-sm font-semibold mb-1">
                                        {event.dateShort}
                                    </time>
                                    <h3 className="text-white text-lg font-bold leading-tight mb-2 line-clamp-2">
                                        {event.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <svg width="10" height="13" viewBox="0 0 10 13" fill="none" className="text-[#EF4118] flex-shrink-0">
                                            <path d="M4.875 13C4.875 13 9.75 9.1 9.75 4.875C9.75 2.1827 7.5673 0 4.875 0C2.1827 0 0 2.1827 0 4.875C0 9.1 4.875 13 4.875 13Z" stroke="currentColor" strokeLinejoin="round" />
                                            <path d="M4.875 6.8258C5.1311 6.8258 5.3847 6.7753 5.6213 6.6773C5.8579 6.5793 6.0728 6.4357 6.2539 6.2546C6.435 6.0736 6.5786 5.8586 6.6766 5.622C6.7746 5.3854 6.825 5.1319 6.825 4.8758C6.825 4.6197 6.7746 4.3661 6.6766 4.1295C6.5786 3.893 6.435 3.678 6.2539 3.4969C6.0728 3.3158 5.8579 3.1722 5.6213 3.0742C5.3847 2.9762 5.1311 2.9258 4.875 2.9258C4.3579 2.9258 3.8619 3.1312 3.4962 3.4969C3.1305 3.8626 2.925 4.3586 2.925 4.8758C2.925 5.393 3.1305 5.8889 3.4962 6.2546C3.8619 6.6203 4.3579 6.8258 4.875 6.8258Z" stroke="currentColor" strokeLinejoin="round" />
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

export default TrendingEvents;
