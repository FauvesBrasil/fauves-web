import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface LocationSelectorProps {
  // Component for manual location selection - auto-detection removed to avoid geolocation privacy violations
  mobile?: boolean;
}

import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';

const LocationSelector: React.FC<LocationSelectorProps> = ({ mobile = false }) => {
  const { selectedUf, setSelectedUf } = useLocation();
  const { isDark } = useTheme();
  const [selectedLocation, setSelectedLocationState] = useState(selectedUf || 'CE');
  const [isOpen, setIsOpen] = useState(false);
  const [pendingTo, setPendingTo] = useState<{ sigla: string; name: string } | null>(null);
  // ref to the main selector button (origin badge)
  const selectorButtonRef = useRef<HTMLButtonElement | null>(null);
  // start/end coordinates in page space passed into the overlay
  const [flightCoords, setFlightCoords] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number } | null>(null);

  // Lista de estados com nome e sigla (memoized to avoid changing reference)
  const locations = useMemo(() => ([
    { name: 'Acre', sigla: 'AC', icon: '🌳' },
    { name: 'Alagoas', sigla: 'AL', icon: '🥥' },
    { name: 'Amapá', sigla: 'AP', icon: '🌊' },
    { name: 'Amazonas', sigla: 'AM', icon: '🦜' },
    { name: 'Bahia', sigla: 'BA', icon: '🏖️' },
    { name: 'Ceará', sigla: 'CE', icon: '☀️' },
    { name: 'Distrito Federal', sigla: 'DF', icon: '🏛️' },
    { name: 'Espírito Santo', sigla: 'ES', icon: '⛰️' },
    { name: 'Goiás', sigla: 'GO', icon: '🌾' },
    { name: 'Maranhão', sigla: 'MA', icon: '🦅' },
    { name: 'Mato Grosso', sigla: 'MT', icon: '🐆' },
    { name: 'Mato Grosso do Sul', sigla: 'MS', icon: '🐊' },
    { name: 'Minas Gerais', sigla: 'MG', icon: '⛏️' },
    { name: 'Pará', sigla: 'PA', icon: '🌴' },
    { name: 'Paraíba', sigla: 'PB', icon: '🌵' },
    { name: 'Paraná', sigla: 'PR', icon: '🌲' },
    { name: 'Pernambuco', sigla: 'PE', icon: '🎭' },
    { name: 'Piauí', sigla: 'PI', icon: '🏜️' },
    { name: 'Rio de Janeiro', sigla: 'RJ', icon: '🏔️' },
    { name: 'Rio Grande do Norte', sigla: 'RN', icon: '🦐' },
    { name: 'Rio Grande do Sul', sigla: 'RS', icon: '🧉' },
    { name: 'Rondônia', sigla: 'RO', icon: '🌿' },
    { name: 'Roraima', sigla: 'RR', icon: '🏞️' },
    { name: 'Santa Catarina', sigla: 'SC', icon: '🎣' },
    { name: 'São Paulo', sigla: 'SP', icon: '🏙️' },
    { name: 'Sergipe', sigla: 'SE', icon: '🦀' },
    { name: 'Tocantins', sigla: 'TO', icon: '🌅' },
  ]), []);

  // Auto-detect location via IP on first visit, or load saved preference
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const savedUf = localStorage.getItem('fauves:selectedUf');

        // Check if user wants to force detection via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const forceDetect = urlParams.get('detectLocation') === 'true';

        // If user already has a saved preference and not forcing detection, use it
        if (savedUf && locations.some(l => l.sigla === savedUf) && !forceDetect) {
          setSelectedLocationState(savedUf);
          setSelectedUf(savedUf);
          return;
        }

        // Auto-detect via IP for first-time visitors or when forced
        console.log('[LocationSelector] Auto-detecting location via IP...');
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
          throw new Error('Geolocation API failed');
        }

        const data = await response.json();
        console.log('[LocationSelector] IP geolocation data:', data);

        // Check if we got a valid Brazilian state
        const detectedUf = data.region_code; // e.g., "SP", "RJ", "CE"

        if (detectedUf && locations.some(l => l.sigla === detectedUf)) {
          console.log(`[LocationSelector] Detected UF: ${detectedUf}`);
          setSelectedLocationState(detectedUf);
          setSelectedUf(detectedUf);
          localStorage.setItem('fauves:selectedUf', detectedUf);
        } else {
          // Fallback to CE if detection failed or returned invalid state
          console.log('[LocationSelector] Could not detect valid UF, using default CE');
          setSelectedLocationState('CE');
          setSelectedUf('CE');
          localStorage.setItem('fauves:selectedUf', 'CE');
        }

        // Remove the parameter from URL after detection
        if (forceDetect) {
          urlParams.delete('detectLocation');
          const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
          window.history.replaceState({}, '', newUrl);
        }
      } catch (e) {
        // If auto-detection fails, fallback to default 'CE'
        console.warn('[LocationSelector] Auto-detection failed, using default CE:', e);
        setSelectedLocationState('CE');
        setSelectedUf('CE');
        localStorage.setItem('fauves:selectedUf', 'CE');
      }
    };

    detectLocation();
  }, [locations, setSelectedUf]);

  // If a pending selection (pendingTo) exists, commit it after a short delay
  // to show a brief loading state but avoid leaving the overlay forever.
  useEffect(() => {
    if (!pendingTo) return;
    const to = pendingTo;
    const id = window.setTimeout(() => {
      setSelectedLocationState(to.sigla);
      setSelectedUf(to.sigla);
      localStorage.setItem('fauves:selectedUf', to.sigla);
      setPendingTo(null);
      setFlightCoords(null);
    }, 600); // show spinner briefly

    return () => window.clearTimeout(id);
  }, [pendingTo, setSelectedUf]);

  useEffect(() => {
    if (!isOpen || mobile) { setDropdownPos(null); return; }
    const btn = selectorButtonRef.current;
    if (!btn) return;
    function compute() {
      const r = btn.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const desiredWidth = Math.min(Math.max(r.width, 200), window.innerWidth - 16);
      const rawLeft = r.left + scrollX;
      const minLeft = 8 + scrollX;
      const maxLeft = Math.max(scrollX + 8, scrollX + window.innerWidth - desiredWidth - 8);
      const left = Math.min(Math.max(rawLeft, minLeft), maxLeft);
      const top = r.bottom + scrollY + 6;
      const width = desiredWidth;
      setDropdownPos({ left, top, width });
    }
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [isOpen, mobile]);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (!isOpen || mobile) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      // Check if click is outside the selector button and the dropdown
      if (
        selectorButtonRef.current &&
        !selectorButtonRef.current.contains(target) &&
        !target.closest('#location-cards-container') &&
        !target.closest('[aria-label="Anterior"]') &&
        !target.closest('[aria-label="Próximo"]')
      ) {
        setIsOpen(false);
      }
    }

    // Add listener after a small delay to avoid closing immediately
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, mobile]);

  return (
    <div className="relative">
      <button
        ref={selectorButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[120px] h-[40px] border shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] flex items-center justify-center bg-card px-4 py-0 rounded-full border-solid transition-colors ${isDark ? 'border-[#161616]' : (isOpen ? 'border-[#EF4118] ring-2 ring-[#EF4118]/30' : 'border-border hover:border-[#EF4118]')}`}
      >
        {pendingTo ? (
          // show inline spinner while a selection is pending
          <svg className="mr-3 animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#D1D5DB" strokeWidth="3" opacity="0.6" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="#d63b2e" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="12" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3 text-[#091747] dark:text-white"><path d="M4.875 13C4.875 13 9.75 9.1 9.75 4.875C9.75 2.1827 7.5673 0 4.875 0C2.1827 0 0 2.1827 0 4.875C0 9.1 4.875 13 4.875 13Z" stroke="currentColor" strokeLinejoin="round" /><path d="M4.875 6.8258C5.1311 6.8258 5.3847 6.7753 5.6213 6.6773C5.8579 6.5793 6.0728 6.4357 6.2539 6.2546C6.435 6.0736 6.5786 5.8586 6.6766 5.622C6.7746 5.3854 6.825 5.1319 6.825 4.8758C6.825 4.6197 6.7746 4.3661 6.6766 4.1295C6.5786 3.893 6.435 3.678 6.2539 3.4969C6.0728 3.3158 5.8579 3.1722 5.6213 3.0742C5.3847 2.9762 5.1311 2.9258 4.875 2.9258C4.3579 2.9258 3.8619 3.1312 3.4962 3.4969C3.1305 3.8626 2.925 4.3586 2.925 4.8758C2.925 5.393 3.1305 5.8889 3.4962 6.2546C3.8619 6.6203 4.3579 6.8258 4.875 6.8258Z" stroke="currentColor" strokeLinejoin="round" /></svg>
        )}
        <span className="text-foreground text-[18px] font-bold flex-1 text-left">{pendingTo?.sigla ?? selectedLocation}</span>
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-[#091747] dark:text-white`}>
          <path fillRule="evenodd" clipRule="evenodd" d="M3.111 4.841L0 1.7681L0.778 1L3.5 3.6888L6.222 1L7 1.7681L3.889 4.841C3.786 4.9428 3.646 5 3.5 5C3.354 5 3.214 4.9428 3.111 4.841Z" fill="currentColor" />
        </svg>
      </button>


      {/* Desktop horizontal top bar with visual cards */}
      {!mobile && isOpen && createPortal(
        <div
          className="fixed left-0 right-0 bg-white/95 dark:bg-[#0b0b0b]/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-lg z-[999] animate-slideDown"
          style={{ top: '60px' }}
        >
          <div className="py-6 px-8">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#091747] dark:text-white mb-1">Selecione sua localização</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Escolha o estado para ver eventos da sua região</p>
            </div>

            {/* Horizontal scrollable container with arrows */}
            <div className="relative overflow-visible">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('location-cards-container');
                  if (container) {
                    container.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border border-gray-200 dark:border-gray-700"
                aria-label="Anterior"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700 dark:text-white">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('location-cards-container');
                  if (container) {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border border-gray-200 dark:border-gray-700"
                aria-label="Próximo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700 dark:text-white">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div
                id="location-cards-container"
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-12 py-4"
                style={{ overflowY: 'visible' }}
              >
                {locations.map((location) => (
                  <button
                    key={location.sigla}
                    onClick={(ev) => {
                      if (location.sigla === selectedLocation) { setIsOpen(false); return; }
                      const btnRect = selectorButtonRef.current?.getBoundingClientRect();
                      const itemRect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                      if (btnRect && itemRect) {
                        const start = { x: btnRect.left + btnRect.width / 2 + window.scrollX, y: btnRect.top + btnRect.height / 2 + window.scrollY };
                        const end = { x: itemRect.left + itemRect.width / 2 + window.scrollX, y: itemRect.top + itemRect.height / 2 + window.scrollY };
                        setFlightCoords({ start, end });
                      } else {
                        setFlightCoords(null);
                      }
                      setPendingTo({ sigla: location.sigla, name: location.name });
                      setIsOpen(false);
                    }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 px-5 py-3 rounded-xl transition-all duration-300 min-w-[100px] ${location.sigla === selectedLocation
                      ? 'bg-[#EF4118] text-white shadow-lg shadow-red-500/30 scale-105 ring-2 ring-[#EF4118]/50'
                      : 'bg-gray-50 dark:bg-[#1a1a1a] text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#242424] hover:scale-105 hover:shadow-md'
                      }`}
                  >
                    <div className="text-3xl">{location.icon}</div>
                    <div className="font-black text-base">{location.sigla}</div>
                    <div className="text-[9px] font-medium opacity-70 truncate max-w-[90px]">{location.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>, document.body)}


      {/* Mobile fullscreen dropdown */}
      {mobile && isOpen && createPortal(
        <div className="fixed inset-0 bg-white dark:bg-[#0b0b0b] z-[9998] overflow-y-auto" style={{ top: 'calc(56px + 60px)' }}>
          <div className="px-4 py-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#091747] dark:text-white mb-1">Selecione sua localização</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Escolha o estado para ver eventos da sua região</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {locations.map((location) => (
                <button
                  key={location.sigla}
                  onClick={(ev) => {
                    if (location.sigla === selectedLocation) { setIsOpen(false); return; }
                    const btnRect = selectorButtonRef.current?.getBoundingClientRect();
                    const itemRect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                    if (btnRect && itemRect) {
                      const start = { x: btnRect.left + btnRect.width / 2 + window.scrollX, y: btnRect.top + btnRect.height / 2 + window.scrollY };
                      const end = { x: itemRect.left + itemRect.width / 2 + window.scrollX, y: itemRect.top + itemRect.height / 2 + window.scrollY };
                      setFlightCoords({ start, end });
                    } else {
                      setFlightCoords(null);
                    }
                    setPendingTo({ sigla: location.sigla, name: location.name });
                    setIsOpen(false);
                  }}
                  className={`px-3 py-4 rounded-xl text-center font-bold transition-all ${location.sigla === selectedLocation
                    ? 'bg-[#EF4118] text-white shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-gray-50 dark:bg-[#1a1a1a] text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#242424] hover:scale-105'
                    }`}
                >
                  <div className="text-4xl mb-1">{location.icon}</div>
                  <div className="text-base font-black">{location.sigla}</div>
                  <div className="text-[8px] font-medium mt-0.5 opacity-70 truncate">{location.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>, document.body)}
      {/* pendingTo is handled inline in the header button (spinner next to sigla). */}
    </div>
  );
};

export default LocationSelector;
