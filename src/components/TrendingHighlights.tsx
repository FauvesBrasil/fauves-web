import React from 'react';
import { Link } from 'react-router-dom';
import { getEventPath } from '../lib/eventUrl';
import InterestButton from './InterestButton';

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  bannerUrl?: string | null;
  banner?: string | null;
  image?: string | null;
  slug?: string | null;
  locationCity?: string;
  locationUf?: string;
}

interface TrendingHighlightsProps {
  events: Event[];
}

const TrendingHighlights: React.FC<TrendingHighlightsProps> = ({ events }) => {
  // Lógica: ordenar por data (mais próxima) e limitar a 6
  // Se não houver data, mantém a ordem original ou aleatória
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  }).slice(0, 6);

  const formatLocation = (ev: any) => {
    if (ev.locationCity && ev.locationUf) return `${ev.locationCity} - ${ev.locationUf}`;
    if (ev.location && typeof ev.location === 'string') return ev.location;
    return 'Local não informado';
  };

  const mapEvent = (ev: any) => ({
    id: ev.id || '',
    title: ev.name || 'Evento sem nome',
    slug: ev.slug,
    date: ev.startDate ? new Date(ev.startDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }) : 'Data não informada',
    location: formatLocation(ev),
    image: ev.bannerUrl || ev.banner || (ev.image && typeof ev.image === 'string' && ev.image.length > 5
      ? ev.image
      : '/no-image.svg'),
  });

  return (
    <section className="px-[156px] py-10 max-md:px-5 max-md:py-8 max-sm:px-4">
      <div className="max-w-[1352px] mx-auto">
        <div className="mb-8">
          <h2 className="text-[#091747] text-2xl font-bold mb-2 flex items-center gap-2">
            🔥 Eventos em alta
          </h2>
          <p className="text-[#4b5563] text-base font-medium">
            Os mais procurados do momento
          </p>
        </div>

        {sortedEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {sortedEvents.map((ev) => {
              const displayEvent = mapEvent(ev);
              const to = getEventPath({ id: displayEvent.id, slug: displayEvent.slug });

              return (
                <div 
                  key={displayEvent.id}
                  className="bg-white rounded-2xl border border-[rgba(9,23,71,0.10)] overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={displayEvent.image} 
                      alt={displayEvent.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                      <span className="bg-orange-600 text-white text-[10px] uppercase font-black px-3 py-1 rounded-md shadow-lg tracking-wider">
                        Em alta
                      </span>
                      <InterestButton eventId={displayEvent.id} variant="card" />
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
                        <time className="text-orange-600 text-sm font-bold">
                        {displayEvent.date}
                        </time>
                    </div>
                    <h3 className="text-[#091747] text-xl font-bold mb-4 line-clamp-2 leading-tight h-14">
                      {displayEvent.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[#6b7280] mb-6">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 13C7 13 12 9.4 12 5.5C12 2.73858 9.76142 0.5 7 0.5C4.23858 0.5 2 2.73858 2 5.5C2 9.4 7 13 7 13Z" stroke="currentColor" strokeLinejoin="round"/>
                        <circle cx="7" cy="5.5" r="1.5" stroke="currentColor"/>
                      </svg>
                      <span className="text-xs font-medium truncate">{displayEvent.location}</span>
                    </div>
                    
                    <Link 
                      to={to}
                      className="mt-auto w-full bg-[#091747] hover:bg-[#0d1f5c] text-white font-bold py-4 px-4 rounded-xl text-center transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-[#FF3F00]"
                    >
                      Ver evento
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:translate-x-1">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#f8f9fc] border border-dashed border-[#cbd5e1] rounded-2xl py-16 px-8 text-center flex flex-col items-center">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-[#64748b] text-xl font-bold">
              Nenhum evento em destaque no momento
            </p>
            <p className="text-[#94a3b8] text-sm mt-2">
              Fique ligado, novidades estão chegando!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingHighlights;
