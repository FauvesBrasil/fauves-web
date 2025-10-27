import { useEffect, useRef, useState, useMemo } from 'react';

export interface LocationSelectorProps {
  autoDetect?: boolean; // enable automatic selection based on user location
}

import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';

const LocationSelector: React.FC<LocationSelectorProps> = ({ autoDetect = true }) => {
  const { selectedUf, setSelectedUf } = useLocation();
  const { isDark } = useTheme();
  const [selectedLocation, setSelectedLocationState] = useState(selectedUf || 'CE');
  const [isOpen, setIsOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [pendingTo, setPendingTo] = useState<{ sigla: string; name: string } | null>(null);
  // ref to the main selector button (origin badge)
  const selectorButtonRef = useRef<HTMLButtonElement | null>(null);
  // start/end coordinates in page space passed into the overlay
  const [flightCoords, setFlightCoords] = useState<{ start: { x:number; y:number }; end: { x:number; y:number } } | null>(null);

  // Lista de estados com nome e sigla (memoized to avoid changing reference)
  const locations = useMemo(() => ([
    { name: 'Acre', sigla: 'AC' },
    { name: 'Alagoas', sigla: 'AL' },
    { name: 'Amapá', sigla: 'AP' },
    { name: 'Amazonas', sigla: 'AM' },
    { name: 'Bahia', sigla: 'BA' },
    { name: 'Ceará', sigla: 'CE' },
    { name: 'Distrito Federal', sigla: 'DF' },
    { name: 'Espírito Santo', sigla: 'ES' },
    { name: 'Goiás', sigla: 'GO' },
    { name: 'Maranhão', sigla: 'MA' },
    { name: 'Mato Grosso', sigla: 'MT' },
    { name: 'Mato Grosso do Sul', sigla: 'MS' },
    { name: 'Minas Gerais', sigla: 'MG' },
    { name: 'Pará', sigla: 'PA' },
    { name: 'Paraíba', sigla: 'PB' },
    { name: 'Paraná', sigla: 'PR' },
    { name: 'Pernambuco', sigla: 'PE' },
    { name: 'Piauí', sigla: 'PI' },
    { name: 'Rio de Janeiro', sigla: 'RJ' },
    { name: 'Rio Grande do Norte', sigla: 'RN' },
    { name: 'Rio Grande do Sul', sigla: 'RS' },
    { name: 'Rondônia', sigla: 'RO' },
    { name: 'Roraima', sigla: 'RR' },
    { name: 'Santa Catarina', sigla: 'SC' },
    { name: 'São Paulo', sigla: 'SP' },
    { name: 'Sergipe', sigla: 'SE' },
    { name: 'Tocantins', sigla: 'TO' },
  ]), []);

  // helper map of common Brazilian state names -> UF (memoized)
  const STATE_NAME_TO_UF = useMemo<Record<string, string>>(() => ({
    'acre': 'AC','alagoas':'AL','amapá':'AP','amazonas':'AM','bahia':'BA','ceará':'CE','distrito federal':'DF',
    'espírito santo':'ES','goiás':'GO','maranhão':'MA','mato grosso':'MT','mato grosso do sul':'MS','minas gerais':'MG',
    'pará':'PA','paraíba':'PB','paraná':'PR','pernambuco':'PE','piauí':'PI','rio de janeiro':'RJ','rio grande do norte':'RN',
    'rio grande do sul':'RS','rondônia':'RO','roraima':'RR','santa catarina':'SC','são paulo':'SP','sergipe':'SE','tocantins':'TO'
  }), []);

  // try to auto-detect user state (UF). Strategy:
  // 1) try navigator.geolocation => reverse geocode via a lightweight public API (ipapi.co) by coordinates
  // 2) fallback to IP-based lookup (ipapi.co/json)
  // We keep timeouts and quiet failures so UI remains usable.
  useEffect(() => {
    if (!autoDetect) return;

    let mounted = true;
    // If running on local dev host, skip automatic geolocation/reverse-geocoding
    try {
      const host = window.location && window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        // don't auto-detect on local dev — avoid browser 'user gesture' warnings and CORS errors
        setDetecting(false);
        return;
      }
  } catch (e) { void e; }
    setDetecting(true);

    const trySetUf = (uf?: string) => {
        if (!mounted || !uf) return;
        uf = uf.toUpperCase();
        // only set if exists in our list
        if (locations.some(l => l.sigla === uf)) {
          // only auto-set if user hasn't manually chosen a different UF
          if (!localStorage.getItem('fauves:selectedUf')) {
            setSelectedLocationState(uf);
            setSelectedUf(uf);
          }
        }
      };

    // Try browser geolocation first (to get coordinates)
    const geoTimeout = setTimeout(() => {
      // if geolocation takes too long, fallback to IP lookup
      fetchIpAndSet();
    }, 2000);

    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(geoTimeout);
          const { latitude, longitude } = pos.coords;
          // Use ipapi reverse geocode endpoint which accepts lat/long: https://ipapi.co/{lat},{lon}/json/
          // If it fails, fallback to IP lookup.
          fetch(`https://ipapi.co/${latitude},${longitude}/json/`, { cache: 'no-store' }).then(r => r.json()).then((data) => {
            if (!mounted) return;
            const regionCode = data.region_code || data.region || data.region_name;
            if (regionCode) {
              // region_code is often the UF (e.g., 'SP') or a name
              if (typeof regionCode === 'string' && regionCode.length <= 3) trySetUf(regionCode);
              else {
                const key = String(regionCode).toLowerCase();
                trySetUf(STATE_NAME_TO_UF[key]);
              }
            } else {
              fetchIpAndSet();
            }
          }).catch(() => { fetchIpAndSet(); });
        },
        () => {
          clearTimeout(geoTimeout);
          fetchIpAndSet();
        },
        { timeout: 2500 }
      );
    } else {
      // no geolocation, fallback
      fetchIpAndSet();
    }

    function fetchIpAndSet() {
      // If we're running on a local dev host, skip external ipapi calls to avoid CORS/429 noise
      try {
        const host = window.location && window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
          if (mounted) setDetecting(false);
          return;
        }
  } catch (e) { void e; }
      // fallback: IP-based lookup with caching/backoff
      try {
        const CACHE_KEY = 'fauves:ipapi_lookup_v1';
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            const age = Date.now() - (parsed.ts || 0);
            // respect short TTL (5 minutes) to avoid repeated external calls
            if (age < (1000 * 60 * 5) && parsed.region) {
              trySetUf(parsed.region);
              if (mounted) setDetecting(false);
              return;
            }
          } catch (e) { void e; }
        }
  } catch (e) { void e; }

      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), 3000);
      fetch('https://ipapi.co/json/', { signal: controller.signal, cache: 'no-store' })
        .then(r => r.json())
        .then((data) => {
          if (!mounted) return;
          const regionCode = data.region_code || data.region || data.region_name || data.state;
          if (regionCode) {
            if (typeof regionCode === 'string' && regionCode.length <= 3) trySetUf(regionCode);
            else {
              const key = String(regionCode).toLowerCase();
              trySetUf(STATE_NAME_TO_UF[key]);
            }
            try {
              localStorage.setItem('fauves:ipapi_lookup_v1', JSON.stringify({ ts: Date.now(), region: regionCode }));
            } catch (e) { void e; }
          }
        })
        .catch(() => {
          // on error (CORS/429) store a short backoff to avoid retries
          try { localStorage.setItem('fauves:ipapi_lookup_v1', JSON.stringify({ ts: Date.now(), region: null })); } catch (e) { void e; }
        })
        .finally(() => {
          clearTimeout(to);
          if (mounted) setDetecting(false);
        });
    }

    // ensure we stop detecting after a while even if nothing returns
    const globalTimeout = setTimeout(() => { if (mounted) setDetecting(false); }, 6000);

    return () => { mounted = false; clearTimeout(globalTimeout); };
  }, [autoDetect, locations, STATE_NAME_TO_UF, setSelectedUf]);

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

  return (
    <div className="relative">
      <button
        ref={selectorButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[120px] h-[40px] border shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] flex items-center justify-center bg-card px-4 py-0 rounded-full border-solid transition-colors ${isDark ? 'border-[#161616]' : (isOpen ? 'border-[#EF4118] ring-2 ring-[#EF4118]/30' : 'border-border hover:border-[#EF4118]')}`}
        aria-live={detecting ? 'polite' : undefined}
      >
        {(detecting || pendingTo) ? (
          // show inline spinner while detecting or while a selection is pending
          <svg className="mr-3 animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#D1D5DB" strokeWidth="3" opacity="0.6" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="#d63b2e" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="12" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3 text-[#091747] dark:text-white"><path d="M4.875 13C4.875 13 9.75 9.1 9.75 4.875C9.75 2.1827 7.5673 0 4.875 0C2.1827 0 0 2.1827 0 4.875C0 9.1 4.875 13 4.875 13Z" stroke="currentColor" strokeLinejoin="round"/><path d="M4.875 6.8258C5.1311 6.8258 5.3847 6.7753 5.6213 6.6773C5.8579 6.5793 6.0728 6.4357 6.2539 6.2546C6.435 6.0736 6.5786 5.8586 6.6766 5.622C6.7746 5.3854 6.825 5.1319 6.825 4.8758C6.825 4.6197 6.7746 4.3661 6.6766 4.1295C6.5786 3.893 6.435 3.678 6.2539 3.4969C6.0728 3.3158 5.8579 3.1722 5.6213 3.0742C5.3847 2.9762 5.1311 2.9258 4.875 2.9258C4.3579 2.9258 3.8619 3.1312 3.4962 3.4969C3.1305 3.8626 2.925 4.3586 2.925 4.8758C2.925 5.393 3.1305 5.8889 3.4962 6.2546C3.8619 6.6203 4.3579 6.8258 4.875 6.8258Z" stroke="currentColor" strokeLinejoin="round"/></svg>
        )}
  <span className="text-foreground text-[18px] font-bold flex-1 text-left">{pendingTo?.sigla ?? selectedLocation}</span>
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-[#091747] dark:text-white`}>
          <path fillRule="evenodd" clipRule="evenodd" d="M3.111 4.841L0 1.7681L0.778 1L3.5 3.6888L6.222 1L7 1.7681L3.889 4.841C3.786 4.9428 3.646 5 3.5 5C3.354 5 3.214 4.9428 3.111 4.841Z" fill="currentColor"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border dark:border-[#161616] rounded-[16.5px] shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] z-10">
          <div className="max-h-48 overflow-auto">
            {locations.map((location, idx) => (
              <button
                key={location.sigla}
                onClick={(ev) => {
                  // If the user selected the same location, just close
                  if (location.sigla === selectedLocation) { setIsOpen(false); return; }
                  // compute page coordinates for start (selectorButton) and end (this menu item)
                  const btnRect = selectorButtonRef.current?.getBoundingClientRect();
                  const itemRect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                  if (btnRect && itemRect) {
                    const start = { x: btnRect.left + btnRect.width/2 + window.scrollX, y: btnRect.top + btnRect.height/2 + window.scrollY };
                    const end = { x: itemRect.left + itemRect.width/2 + window.scrollX, y: itemRect.top + itemRect.height/2 + window.scrollY };
                    setFlightCoords({ start, end });
                  } else {
                    setFlightCoords(null);
                  }

                  // Start the flight animation from current -> chosen
                  setPendingTo({ sigla: location.sigla, name: location.name });
                  setIsOpen(false);
                }}
                className={`w-full px-4 h-10 leading-10 text-left text-foreground text-sm font-bold hover:bg-card/90 hover:text-[#EF4118] ${idx === 0 ? 'first:rounded-t-[16.5px]' : ''} ${idx === locations.length - 1 ? 'last:rounded-b-[16.5px]' : ''} transition-colors`}
              >
                {location.sigla}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* pendingTo is handled inline in the header button (spinner next to sigla). */}
    </div>
  );
};

export default LocationSelector;
