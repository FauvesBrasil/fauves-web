import React from 'react';
import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getEventPath } from '@/lib/eventUrl';
import { getSortedTrendingEvents } from '@/lib/hype';
import EventCard from './EventCard';

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

const TrendingEvents: React.FC<TrendingEventsProps> = ({ events, selectedUf, useMockData = false }) => {
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

    // Ordena por Score de Tendência
    const trendingEvents = getSortedTrendingEvents(stateEvents)
        .filter(ev => {
            try {
                const eventDate = new Date(ev.startDate || ev.date);
                return eventDate > new Date(); // Apenas eventos futuros
            } catch {
                return true;
            }
        })
        .slice(0, 8)
        .map(mapEvent);

    const displayEvents = trendingEvents;

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

            <div className="grid grid-cols-4 gap-5 max-md:grid-cols-2 max-md:gap-4 max-sm:grid-cols-2 max-sm:gap-3">
                {displayEvents.map((event, idx) => {
                    return (
                        <div key={event.id} className="">
                            <EventCard
                                id={event.id}
                                slug={event.slug}
                                title={event.title}
                                date={event.date}
                                dateShort={event.dateShort}
                                location={event.location}
                                image={event.image}
                                isTrending={true}
                                badge={`#${idx + 1}`}
                                showButton={false}
                            />
                        </div>
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
