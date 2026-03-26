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

interface WeekendHighlightsProps {
  events: Event[];
}

const WeekendHighlights: React.FC<WeekendHighlightsProps> = ({ events }) => {
  // Lógica de filtragem: entre agora e o final do próximo domingo
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay(); // 0 é domingo
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const endOfSunday = new Date(today);
  endOfSunday.setDate(today.getDate() + daysUntilSunday);
  endOfSunday.setHours(23, 59, 59, 999);

  const weekendEvents = events.filter(ev => {
    if (!ev.startDate) return false;
    const eventDate = new Date(ev.startDate);
    return eventDate >= now && eventDate <= endOfSunday;
  });

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
    <section className="px-[156px] py-10 max-md:px-5 max-md:py-4 max-sm:px-4 max-sm:py-4">
      <div className="mb-8">
        <h2 className="text-[#091747] text-2xl font-bold mb-2 flex items-center gap-2">
          🔥 O que fazer esse fim de semana
        </h2>
        <p className="text-[#4b5563] text-base font-medium">
          Descubra os melhores eventos próximos de você
        </p>
      </div>

      {weekendEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {weekendEvents.map((ev) => {
            const displayEvent = mapEvent(ev);
            const to = getEventPath({ id: displayEvent.id, slug: displayEvent.slug });

            return (
              <div 
                key={displayEvent.id}
                className="bg-white rounded-2xl border border-[rgba(9,23,71,0.10)] overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={displayEvent.image} 
                    alt={displayEvent.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#2A2AD7] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      ESSE FIM DE SEMANA
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-20">
                    <InterestButton eventId={displayEvent.id} variant="card" />
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <time className="text-[#2A2AD7] text-sm font-semibold mb-2">
                    {displayEvent.date}
                  </time>
                  <h3 className="text-[#091747] text-lg font-bold mb-3 line-clamp-2 leading-tight h-12">
                    {displayEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[#6b7280] mb-5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 13C7 13 12 9.4 12 5.5C12 2.73858 9.76142 0.5 7 0.5C4.23858 0.5 2 2.73858 2 5.5C2 9.4 7 13 7 13Z" stroke="currentColor" strokeLinejoin="round"/>
                      <circle cx="7" cy="5.5" r="1.5" stroke="currentColor"/>
                    </svg>
                    <span className="text-xs truncate">{displayEvent.location}</span>
                  </div>
                  
                  <Link 
                    to={to}
                    className="mt-auto w-full bg-[#FF3F00] hover:bg-[#E63900] text-white font-bold py-3 px-4 rounded-xl text-center transition-colors shadow-[0_4px_14px_rgba(255,63,0,0.25)]"
                  >
                    Ver evento
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#cbd5e1] rounded-2xl py-12 px-6 text-center">
          <div className="bg-[#f1f5f9] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-[#64748b] text-lg font-medium">
            Nenhum evento cadastrado ainda para este fim de semana
          </p>
        </div>
      )}
    </section>
  );
};

export default WeekendHighlights;
