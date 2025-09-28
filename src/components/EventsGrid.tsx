import React from 'react';
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
      <h2 className="text-[#091747] text-lg font-bold mb-5 max-sm:text-base">
        {title}
      </h2>
      <div className={`grid gap-5 ${
        isLarge 
          ? 'grid-cols-[repeat(4,1fr)] grid-rows-[repeat(2,1fr)] w-[1040px] h-[520px] max-md:grid-cols-[repeat(2,1fr)] max-md:grid-rows-[repeat(4,1fr)] max-md:w-full max-md:h-auto max-md:gap-[15px] max-sm:grid-cols-[1fr] max-sm:grid-rows-[repeat(8,1fr)] max-sm:gap-[15px]'
          : 'grid-cols-[repeat(6,1fr)] w-[1038px] h-[250px] max-md:grid-cols-[repeat(3,1fr)] max-md:w-full max-md:h-auto max-md:gap-[15px] max-sm:grid-cols-[repeat(2,1fr)] max-sm:gap-2.5'
      }`}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            image={event.image}
            date={event.date}
            title={event.title}
            location={event.location}
            size={size}
          />
        ))}
      </div>
    </section>
  );
};

export default EventsGrid;
