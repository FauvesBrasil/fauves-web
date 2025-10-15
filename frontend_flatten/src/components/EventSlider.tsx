import React, { useState, useEffect, useRef } from 'react';

export type EventSliderSlide = {
  category: string;
  image: string;
  id?: string;
  slug?: string;
};

interface EventSliderProps {
  slides: EventSliderSlide[];
}

const EventSlider: React.FC<EventSliderProps> = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = (idx: number) => {
    if (idx < 0) idx = 0;
    if (idx >= total) idx = total - 1;
    setCurrent(idx);
  };

  useEffect(() => {
    if (paused || total === 0) return;
    timerRef.current = setTimeout(() => {
      setCurrent(c => (c + 1) % total);
    }, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, total]);

  if (total === 0) return null;

  return (
    <div className="w-full flex flex-col items-center py-6" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <div className="flex w-full justify-center gap-8">
        {slides.map((slide, idx) => (
          <a
            key={idx}
            href={slide.slug ? `/event/${slide.slug}` : (slide.id ? `/event/${slide.id}` : '#')}
            className="block"
            style={{ textDecoration: 'none' }}
          >
            <div
              className={`group transition-all duration-500 ease-in-out ${idx === current ? 'scale-100 opacity-100 z-10' : 'scale-95 opacity-40 z-0'} ${idx === current ? 'shadow-xl' : ''}`}
              style={{
                width: idx === current ? 700 : 320,
                height: 400,
                borderRadius: 28,
                overflow: 'hidden',
                position: 'relative',
                display: idx < current - 1 || idx > current + 1 ? 'none' : 'block',
                cursor: 'pointer',
              }}
            >
              <div
                className="w-full h-full transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_8px_32px_rgba(0,128,255,0.25)] group-hover:border-4 group-hover:border-blue-400 rounded-[28px]"
                style={{
                  width: '100%',
                  height: '100%',
                  background: `url(${slide.image}) center/cover`,
                  borderRadius: 28,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                  border: '4px solid transparent',
                  transition: 'all 0.5s',
                }}
              />
              <div style={{position:'absolute',top:20,left:20,zIndex:2}}>
                <span className="bg-black/70 text-white text-xs px-3 py-1 rounded font-mono tracking-wide border border-blue-400 transition-all duration-300">{slide.category}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-6">
        <button
          className="bg-[#23272F] text-white rounded-full px-4 py-2 text-lg font-bold"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
        >
          &#60;
        </button>
        <span className="text-[#23272F] text-lg font-bold px-2">
          {current + 1} / {total}
        </span>
        <button
          className="bg-[#23272F] text-white rounded-full px-4 py-2 text-lg font-bold"
          onClick={() => goTo(current + 1)}
          disabled={current === total - 1}
        >
          &#62;
        </button>
      </div>
    </div>
  );
};

export default EventSlider;
