import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type EventSliderSlide = {
  category: string;
  image: string;
  id?: string;
  slug?: string;
  date?: string;
};

interface EventSliderProps {
  slides: EventSliderSlide[];
}

const EventSlider: React.FC<EventSliderProps> = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const total = slides.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // layout constants (kept here so arrows and slides share same values)
  // Use responsive sizes: desktop keeps the larger original sizes, tablet uses medium,
  // and mobile reduces sizes so the active slide fits the viewport.
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    function onResize() { setWindowWidth(window.innerWidth); }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    return () => {};
  }, []);

  // breakpoints: mobile (<640), tablet (<1024), desktop (>=1024)
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  let ACTIVE_WIDTH = 380; // desktop default (original larger size)
  let SIDE_WIDTH = 390;
  let GAP_BETWEEN = -200;

  if (isTablet) {
    ACTIVE_WIDTH = 320; SIDE_WIDTH = 300; GAP_BETWEEN = -80;
  }
  if (isMobile) {
    ACTIVE_WIDTH = 260; SIDE_WIDTH = 220; GAP_BETWEEN = -40;
  }

  // force square slides: height == width
  const ACTIVE_HEIGHT = ACTIVE_WIDTH;
  const SIDE_HEIGHT = SIDE_WIDTH; // make sides square as well

  // how many slides each side should be visible (0 = only adjacent)
  const VISIBLE_RANGE = 3;

  // compute wrapper width to fit active + visible side slides
  const WRAPPER_WIDTH = ACTIVE_WIDTH + 2 * VISIBLE_RANGE * (SIDE_WIDTH + GAP_BETWEEN);

  const ARROW_GAP = 0; // gap between arrow and active card (kept configurable)
  const ARROW_BUTTON_SIZE = 0; // approximate clickable size (px)
  const ARROW_OUTWARD_OFFSET = 0; // how much to push arrows further outside the card

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDelta = useRef<number>(0);
  const isTouching = useRef<boolean>(false);

  const goTo = useCallback((idx: number) => {
    // wrap index so the carousel behaves infinitely
    if (total === 0) return;
    const wrapped = ((idx % total) + total) % total;
    setCurrent(wrapped);
  }, [total]);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      // toggle pause on space
      e.preventDefault();
      setPaused(p => !p);
    }
  }, [prev, next]);

  useEffect(() => {
    if (paused || total === 0) return;
    timerRef.current = setTimeout(() => {
      setCurrent(c => (c + 1) % total);
    }, 3800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, total]);

  if (total === 0) return null;

  // Touch handlers: enable swipe on mobile. We implement a lightweight drag
  // detection and allow swipe left/right to change slides. We also apply a
  // temporary transform on the wrapper so the slides follow the finger.
  const onTouchStart = (e: React.TouchEvent) => {
    if (!wrapperRef.current) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchDelta.current = 0;
    isTouching.current = true;
    setPaused(true);
    // disable transition while dragging
    wrapperRef.current.style.transition = 'none';
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isTouching.current || touchStartX.current === null) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = touchStartY.current ? Math.abs(t.clientY - touchStartY.current) : 0;
    touchDelta.current = dx;
    // if horizontal move dominates, prevent vertical scroll so swipe feels native
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
      e.preventDefault();
    }
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateX(${dx}px)`;
    }
  };

  const onTouchEnd = () => {
    if (!isTouching.current) return;
    isTouching.current = false;
    const dx = touchDelta.current;
    const threshold = 60; // px required to trigger slide change
    if (Math.abs(dx) > threshold) {
      if (dx > 0) {
        prev();
      } else {
        next();
      }
    }
    // snap back animation
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'transform 220ms ease';
      wrapperRef.current.style.transform = 'translateX(0)';
    }
    // resume autoplay shortly after snap
    setTimeout(() => setPaused(false), 300);
  };

  return (
    <div
      className="w-full flex flex-col items-center py-6 overflow-x-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={handleKey}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Destaques de eventos"
    >
  <div className="relative w-full flex justify-center group">
        {/* Prev/Next buttons (visible on hover) */}
        <button
          aria-label="Anterior"
          onClick={prev}
          // position arrows closer to the active slide: activeWidth/2 = 380, offset small gap 12
          // temporarily always visible for debugging
          className="opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 z-60 p-4 bg-card/95 hover:bg-card rounded-full shadow-2xl pointer-events-auto"
          // position using calc relative to center and ACTIVE_WIDTH
          style={{ left: `calc(50% - ${ACTIVE_WIDTH / 2 + ARROW_OUTWARD_OFFSET + ARROW_BUTTON_SIZE / 2}px)` }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          aria-label="Próximo"
          onClick={next}
          // temporarily always visible for debugging
          className="opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 z-60 p-4 bg-card/95 hover:bg-card rounded-full shadow-2xl pointer-events-auto"
          style={{ left: `calc(50% + ${ACTIVE_WIDTH / 2 + ARROW_OUTWARD_OFFSET + ARROW_GAP - ARROW_BUTTON_SIZE / 2}px)` }}
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="w-full flex justify-center">
          {/* relative wrapper to contain absolutely-positioned slides for smooth animation */}
          <div ref={wrapperRef} style={{ position: 'relative', width: WRAPPER_WIDTH, height: ACTIVE_HEIGHT + 40, overflow: 'visible', maxWidth: '100%' }}>
            {slides.map((slide, idx) => {
              const step = SIDE_WIDTH + GAP_BETWEEN; // spacing between slides

              // compute the shortest wrapped offset so slides appear infinite
              // distance in indices from current to idx, wrapped into [-floor(total/2), +...]
              const rawDiff = idx - current;
              const half = Math.floor(total / 2);
              let diff = rawDiff;
              if (rawDiff > half) diff = rawDiff - total;
              if (rawDiff < -half) diff = rawDiff + total;

              const isActive = diff === 0;
              const distance = Math.abs(diff);
              const isAdjacent = distance === 1;
              const isVisible = distance <= VISIBLE_RANGE;

              // cascading scale: closer slides are larger, further slides shrink progressively
              const maxShrinkPerStep = 0.08; // how much to shrink per distance step
              const scaleFromDistance = Math.max(0.6, 1 - distance * maxShrinkPerStep);
              // small hover bump
              const hoverBump = hovered === idx ? 0.03 : 0;
              const scale = (isActive ? 1.03 : scaleFromDistance) + hoverBump;

              // center slides vertically: keep translateY at 0 so all slide centers align
              const translateY = 0;

              // horizontal offset relative to center using wrapped diff
              const offset = diff * step;

              // compute darkness overlay alpha per distance (0 = no dark, larger = darker)
              const overlayAlpha = isActive ? 0 : (isVisible ? Math.min(0.7, 0.12 + distance * 0.18) : 0.85);

              const commonStyle: React.CSSProperties = {
                // apply cascading sizing for side slides so each next is smaller
                width: isActive ? ACTIVE_WIDTH : Math.round(SIDE_WIDTH * scale),
                height: isActive ? ACTIVE_HEIGHT : Math.round(SIDE_HEIGHT * scale),
                borderRadius: 28,
                overflow: 'hidden',
                position: 'absolute',
                left: '50%',
                top: '50%',
                // center first, then translate horizontally and scale — keeps centers aligned regardless of scale
                transform: `translate(-50%, -50%) translateX(${offset}px) scale(${scale})`,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                transition: 'transform 520ms cubic-bezier(.22,.9,.33,1), box-shadow 320ms ease, opacity 320ms ease',
                willChange: 'transform, opacity',
                // zIndex should reflect proximity so active is on top
                // zIndex should reflect proximity so active is on top; closer slides above further ones
                zIndex: isActive ? 80 : (isVisible ? 40 - distance : 0),
                // keep slides fully opaque; we darken non-active slides with an overlay instead of transparency
                opacity: isVisible ? 1 : 0,
                // remove brightness filter; overlay handles darkening
                filter: 'none',
                pointerEvents: isVisible ? 'auto' : 'none',
                boxShadow: isActive ? '0 18px 40px rgba(2,6,23,0.12)' : 'none',
              };

              const inner = (
                <div
                  className={`transition-all ease-in-out ${isActive ? 'opacity-100' : 'opacity-80'}`}
                  style={commonStyle}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(prev => (prev === idx ? null : prev))}
                >
                  <div className="w-full h-full rounded-[28px] overflow-hidden relative">
                      <img
                        src={slide.image}
                        alt={slide.category || 'imagem do evento'}
                        className="w-full h-full object-cover transition-transform duration-500"
                        style={{ display: 'block' }}
                        loading={isActive ? 'eager' : 'lazy'}
                      />
                      {/* dark overlay for non-active slides */}
                      {overlayAlpha > 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayAlpha})`, pointerEvents: 'none' }} />
                      )}
                    </div>
                  {/* bottom-centered glass badge with rounded borders */}
                  <div style={{position:'absolute',left:'50%',bottom:18,transform:'translateX(-50%)',zIndex:2,width:'88%'}}>
                    <div className="mx-auto rounded-xl px-4 py-2 text-sm text-white flex items-center justify-between backdrop-blur-sm bg-card/10" style={{boxShadow:'0 6px 24px rgba(2,6,23,0.12)'}}>
                      <div className="truncate font-medium">{slide.category}</div>
                      <div className="text-[12px] font-mono opacity-90 ml-3 whitespace-nowrap">{slide.date || ''}</div>
                    </div>
                  </div>
                </div>
              );

              // Active slide should navigate to event page when clicked.
              if (isActive) {
                const href = slide.slug ? `/event/${slide.slug}` : (slide.id ? `/event/${slide.id}` : '#');
                const handleActiveClick = (e: React.MouseEvent) => {
                  // determine click x position relative to element
                  const target = e.currentTarget as HTMLElement;
                  const rect = target.getBoundingClientRect();
                  const x = e.clientX - rect.left; // x within element
                  const third = rect.width / 3;
                  if (x < third) {
                    // left third -> previous
                    e.preventDefault();
                    goTo(current - 1);
                    return;
                  }
                  if (x > rect.width - third) {
                    // right third -> next
                    e.preventDefault();
                    goTo(current + 1);
                    return;
                  }
                  // center third -> allow navigation (default anchor behavior)
                };

                return (
                  <a key={idx} href={href} className="block" style={{ textDecoration: 'none' }} onClick={handleActiveClick}>
                    {inner}
                  </a>
                );
              }

              // Non-active slides: clicking focuses that slide instead of navigating.
              return (
                <button key={idx} type="button" onClick={() => goTo(idx)} className="block p-0" style={{ background: 'none', border: 'none' }}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* indicators */}
      <div className="mt-4 flex items-center gap-2" aria-hidden={false}>
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para slide ${i + 1}`}
            aria-current={i === current}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-primary' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </div>

      {/* screen-reader announcement */}
      <div className="sr-only" aria-live="polite">Slide {current + 1} de {total}</div>
      {/* click regions: clicking left/center/right on active slide will navigate prev/visit/next */}
    </div>
  );
};

export default EventSlider;
