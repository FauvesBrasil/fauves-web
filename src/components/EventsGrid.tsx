// import React from 'react'; // Não é necessário para JSX automático
import EventCard from './EventCard';

interface Event {
  id: string;
  image: string;
  date: string;
  dateShort?: string;
  title: string;
  location: string;
  categories?: Array<{ name: string; slug: string }>;
  views?: number;
  interests?: number;
}

interface EventsGridProps {
  title: string;
  events: Event[];
  size?: 'large' | 'small';
}

const EventsGrid: React.FC<EventsGridProps> = ({ title, events, size = 'large' }) => {
  const isLarge = size === 'large';
  
  return (
  <section className="px-[156px] py-5 max-md:px-5 max-md:py-4 max-sm:px-4 max-sm:py-4">
      <h2 className="text-[#091747] dark:text-white text-lg font-bold mb-5 max-md:mb-4 max-sm:text-base max-sm:mb-3">
        {title}
      </h2>
      <div className={`grid gap-5 ${
        isLarge 
          ? 'grid-cols-4 max-md:grid-cols-2 max-md:gap-4 max-sm:grid-cols-1 max-sm:gap-3'
          : 'grid-cols-6 max-md:grid-cols-3 max-md:gap-4 max-sm:grid-cols-2 max-sm:gap-3'
      }`}>
        {events.map((event, idx) => (
          <EventCard
            key={event.id}
            id={event.id}
            image={event.image}
            date={event.date}
            dateShort={event.dateShort}
            title={event.title}
            location={event.location}
            categories={event.categories}
            views={event.views}
            interests={event.interests}
            size={size === 'large' ? 'large' : 'small'}
            style={{
              opacity: 0,
              animation: `fadeIn 0.5s ease forwards`,
              animationDelay: `${idx * 80}ms`,
            }}
          />
        ))}
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

export default EventsGrid;
