import React from 'react';
import { Link } from 'react-router-dom';
import { getEventPath } from '../lib/eventUrl';
import InterestButton from './InterestButton';
import EventCard from './EventCard';

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 max-sm:flex max-sm:overflow-x-auto max-sm:snap-x max-sm:pb-6 max-sm:px-1 max-sm:-mx-1 scrollbar-hide">
            {sortedEvents.map((ev: any) => {
              const to = getEventPath({ id: ev.id, slug: ev.slug });
              const startDate = ev.startDate ? new Date(ev.startDate) : null;
              const dateMarkup = startDate ? startDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              }) : 'Data não informada';

              return (
                <div key={ev.id} className="max-sm:min-w-[85vw] max-sm:snap-center">
                  <EventCard
                    id={ev.id}
                    slug={ev.slug}
                    title={ev.name}
                    date={dateMarkup}
                    location={formatLocation(ev)}
                    image={ev.bannerUrl || ev.banner || ev.image || '/no-image.svg'}
                    showButton={true}
                    isTrending={true}
                    views={Number(ev.views || 0)}
                    interests={Number(ev.interests || 0)}
                  />
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
