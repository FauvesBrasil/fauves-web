// import React from 'react'; // Não é necessário para JSX automático
import EventCard from './EventCard';

interface Event {
  id: string;
  image: string;
  date: string;
  title: string;
  location: string;
}

interface EventsGridProps {
  title: string;
  events: Event[];
  size?: 'large' | 'small';
}

const EventsGrid: React.FC<EventsGridProps> = ({ title, events, size = 'large' }) => {
  const isLarge = size === 'large';
  
  return (
    <section className="px-[156px] py-5 max-md:p-5 max-sm:p-[15px]">
      <h2 className="text-[#091747] dark:text-white text-lg font-bold mb-5 max-sm:text-base">
        {title}
      </h2>
      <div className={`grid gap-5 ${
        isLarge 
          ? 'grid-cols-[repeat(4,1fr)] max-md:grid-cols-[repeat(2,1fr)] max-md:gap-[15px] max-sm:grid-cols-[1fr] max-sm:gap-[15px]'
          : 'grid-cols-[repeat(6,1fr)] max-md:grid-cols-[repeat(3,1fr)] max-md:gap-[15px] max-sm:grid-cols-[repeat(2,1fr)] max-sm:gap-2.5'
      }`}>
        {events.map((event, idx) => (
          <EventCard
            key={event.id}
            id={event.id}
            image={event.image}
            date={event.date}
            title={event.title}
            location={event.location}
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
