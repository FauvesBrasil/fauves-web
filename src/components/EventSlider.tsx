import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type EventSliderSlide = {
  category: string;
  image: string;
  id?: string;
  slug?: string;
  date?: string;
  linkUrl?: string;
  linkType?: string;
  showTitle?: boolean;
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
    return () => { };
  }, []);

  // breakpoints: mobile (<640), tablet (<1024), desktop (>=1024)
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  let ACTIVE_WIDTH = 380; // desktop default (original larger size)
  let SIDE_WIDTH = 390;
  let GAP_BETWEEN = -240; // tighter cascade

  if (isTablet) {
    ACTIVE_WIDTH = 320; SIDE_WIDTH = 300; GAP_BETWEEN = -120;
  }
  if (isMobile) {
    ACTIVE_WIDTH = 260; SIDE_WIDTH = 220; GAP_BETWEEN = -60;
  }

  // force square slides: height == width
  const ACTIVE_HEIGHT = ACTIVE_WIDTH;
  const SIDE_HEIGHT = SIDE_WIDTH; // make sides square as well

  // how many slides each side should be visible (0 = only adjacent)
  const VISIBLE_RANGE = 3;

  // compute wrapper width to fit active + visible side slides
  const WRAPPER_WIDTH = ACTIVE_WIDTH + 2 * VISIBLE_RANGE * (SIDE_WIDTH + GAP_BETWEEN);

  const ARROW_GAP = 16; // gap between arrow and active card
  const ARROW_BUTTON_SIZE = 48; // approximate clickable size (px)
  const ARROW_OUTWARD_OFFSET = 20; // how much to push arrows further outside the card

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

  const getSlideHref = (slide: EventSliderSlide) => {
    if (slide.linkType === 'external' && slide.linkUrl) return slide.linkUrl;
    if (slide.slug) return `/${slide.slug}`;
    if (slide.id) return `/event/${slide.id}`;
    return '#';
  };

  return (
    <div
      className="w-full max-w-[1352px] mx-auto flex flex-col items-center py-6 overflow-x-hidden"
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
        {/* Prev/Next buttons - positioned at edges of active slide */}
        <button
          aria-label="Anterior"
          onClick={prev}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-[100] w-12 h-12 items-center justify-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 hover:scale-110 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ left: `calc(50% - ${ACTIVE_WIDTH / 2 + 24}px)` }}
        >
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-white" />
        </button>
        <button
          aria-label="Próximo"
          onClick={next}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-[100] w-12 h-12 items-center justify-center bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 hover:scale-110 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ left: `calc(50% + ${ACTIVE_WIDTH / 2 - 24}px)` }}
        >
          <ArrowRight className="w-5 h-5 text-slate-700 dark:text-white" />
        </button>

        <div className="w-full flex justify-center">
          {/* relative wrapper to contain absolutely-positioned slides for smooth animation */}
          <div
            ref={wrapperRef}
            style={{
              position: 'relative',
              width: WRAPPER_WIDTH,
              height: ACTIVE_HEIGHT + 40,
              overflow: 'visible',
              maxWidth: '100%',
              // Reserve space to prevent layout shift
              minHeight: isMobile ? '300px' : isTablet ? '360px' : '420px',
            }}
          >
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
              const overlayAlpha = isActive ? 0 : (isVisible ? Math.min(0.6, 0.15 + distance * 0.15) : 0.8);

              const commonStyle: React.CSSProperties = {
                // apply cascading sizing for side slides so each next is smaller
                width: isActive ? ACTIVE_WIDTH : Math.round(SIDE_WIDTH * scale),
                height: isActive ? ACTIVE_HEIGHT : Math.round(SIDE_HEIGHT * scale),
                borderRadius: 24,
                overflow: 'hidden',
                position: 'absolute',
                left: '50%',
                top: '50%',
                // center first, then translate horizontally and scale — keeps centers aligned regardless of scale
                transform: `translate(-50%, -50%) translateX(${offset}px) scale(${scale})`,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                // TRANSITION VARIATIONS - Escolha uma das 3 opções abaixo:

                // ✅ VARIAÇÃO 1 - Smooth & Slow (Suave e Elegante) - ATIVA
                // Transição mais lenta e fluida, movimento premium e sofisticado
                transition: 'all 850ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',

                // VARIAÇÃO 2 - Bouncy (Com Ricochete Sutil) - DESATIVADA
                // Cards "saltam" levemente ao chegar na posição final, mais dinâmico
                // transition: 'all 700ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',

                // VARIAÇÃO 3 - Elastic (Elástico e Orgânico) - DESATIVADA
                // Movimento elástico, como se os cards tivessem peso e elasticidade
                // transition: 'all 900ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                willChange: 'transform, opacity',
                // zIndex should reflect proximity so active is on top; closer slides above further ones
                zIndex: isActive ? 80 : (isVisible ? 40 - distance : 0),
                // keep slides fully opaque; we darken non-active slides with an overlay instead of transparency
                opacity: isVisible ? 1 : 0,
                // remove brightness filter; overlay handles darkening
                filter: 'none',
                pointerEvents: isVisible ? 'auto' : 'none',
                boxShadow: isActive ? '0 25px 50px -12px rgba(0,0,0,0.25)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
              };

              const inner = (
                <div
                  className="group"
                  style={commonStyle}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(prev => (prev === idx ? null : prev))}
                >
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    {/* Image with zoom effect on hover */}
                    <img
                      src={slide.image}
                      alt={slide.category || 'imagem do evento'}
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isActive && hovered === idx ? 'scale-110' : 'scale-100'}`}
                      style={{ display: 'block' }}
                      loading={isActive ? 'eager' : 'lazy'}
                      fetchPriority={isActive ? 'high' : 'low'}
                      width={isActive ? ACTIVE_WIDTH : SIDE_WIDTH}
                      height={isActive ? ACTIVE_HEIGHT : SIDE_HEIGHT}
                      decoding="async"
                    />

                    {/* Gradient overlay for active slide - only if showing title */}
                    {isActive && slide.showTitle !== false && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)',
                        }}
                      />
                    )}

                    {/* Dark overlay for non-active slides */}
                    {overlayAlpha > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                        style={{ background: `rgba(0,0,0,${overlayAlpha})` }}
                      />
                    )}
                  </div>

                  {/* Redesigned badge - only show on active AND if showTitle is true */}
                  {isActive && slide.showTitle !== false && (
                    <div className="absolute left-0 right-0 bottom-0 p-5">
                      <div
                        className={`rounded-2xl p-4 backdrop-blur-xl transition-all duration-500 ${hovered === idx ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-95'}`}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        }}
                      >
                        <h3 className="text-white font-bold text-base md:text-lg truncate">
                          {slide.category}
                        </h3>
                        {slide.date && (
                          <p className="text-white/70 text-xs md:text-sm mt-1 font-medium">
                            {slide.date}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );

              // Active slide should navigate to event page when clicked.
              if (isActive) {
                const href = getSlideHref(slide);
                const isExternal = slide.linkType === 'external';
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
                  <a
                    key={idx}
                    href={href}
                    className="block"
                    style={{ textDecoration: 'none' }}
                    onClick={handleActiveClick}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                  >
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
