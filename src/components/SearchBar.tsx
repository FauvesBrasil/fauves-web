
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

// Fallback image component for event images
type EventImageWithFallbackProps = {
  src?: string;
  alt: string;
};

function EventImageWithFallback(props: EventImageWithFallbackProps) {
  const { src, alt } = props;
  const [error, setError] = React.useState(false);
  if (!src || error) {
    return (
      <div className="w-8 h-8 max-sm:w-12 max-sm:h-12 flex items-center justify-center rounded bg-card">
        <svg width="22" height="22" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-sm:w-7 max-sm:h-7">
          <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#C3C3C3" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 14L11.1 11.1" stroke="#C3C3C3" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 max-sm:w-12 max-sm:h-12 rounded object-cover bg-card"
      onError={() => setError(true)}
    />
  );
}

// Função utilitária para buscar resultados reais
async function fetchSearchResults(term: string) {
  if (!term || term.length < 2) return { events: [], collections: [], organizations: [] };
  try {
    const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const term_norm = normalize(term);
    const r = await fetch(`/api/search?term=${encodeURIComponent(term)}&term_norm=${encodeURIComponent(term_norm)}`);
    if (!r.ok) return { events: [], collections: [], organizations: [] };
    return await r.json();
  } catch {
    return { events: [], collections: [], organizations: [] };
  }
}
const mockSuggestions = [
  { icon: 'clock', label: 'Acontecendo hoje' },
  { icon: 'calendar', label: 'Nesse final de semana' },
  { icon: 'search', label: 'Faça sua busca' },
];

interface SearchBarProps {
  mobile?: boolean;
  onMobileFocus?: () => void;
  onMobileBlur?: () => void;
  fullWidth?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ mobile = false, onMobileFocus, onMobileBlur, fullWidth = false }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [focused, setFocused] = useState(false);
  type SearchResults = { id?: string; name?: string; title?: string; image?: string; bannerImage?: string; slug?: string };
  const [results, setResults] = useState<{ events: SearchResults[]; collections: SearchResults[]; organizations: SearchResults[] }>({ events: [], collections: [], organizations: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const mobileBlurTimeout = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    if (searchTerm.length < 2) {
      setResults({ events: [], collections: [], organizations: [] });
      setLoading(false);
      return;
    }

    // Debounce: wait 300ms after user stops typing
    const timeoutId = setTimeout(() => {
      setLoading(true);
      fetchSearchResults(searchTerm).then(res => {
        if (active) {
          setResults(res);
          setLoading(false);
        }
      });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const showDropdown = focused || searchTerm.length > 0;

  // Mobile fullscreen mode detection
  const isMobileFullscreen = mobile && showDropdown;

  useEffect(() => {
    if (!showDropdown || mobile) {
      setDropdownPos(null);
      return;
    }
    const el = inputRef.current;
    if (!el) return;
    function compute() {
      const r = el.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const desiredWidth = Math.min(Math.max(r.width, 340), window.innerWidth - 16);
      // start from element left, but clamp so dropdown never exceeds viewport
      const rawLeft = r.left + scrollX;
      const minLeft = 8 + scrollX;
      const maxLeft = Math.max(scrollX + 8, scrollX + window.innerWidth - desiredWidth - 8);
      const left = Math.min(Math.max(rawLeft, minLeft), maxLeft);
      const top = r.bottom + scrollY + 8; // small gap
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
  }, [showDropdown]);

  useEffect(() => {
    return () => {
      if (mobileBlurTimeout.current) {
        clearTimeout(mobileBlurTimeout.current);
        mobileBlurTimeout.current = null;
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm || searchTerm.length < 2) return;
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (mobile && mobileBlurTimeout.current) { clearTimeout(mobileBlurTimeout.current); mobileBlurTimeout.current = null; }
            if (mobile && onMobileFocus) onMobileFocus();
          }}
          onBlur={() => {
            setFocused(false);
            if (mobile) {
              // delay hiding selector so clicks on dropdown items register without flicker
              mobileBlurTimeout.current = window.setTimeout(() => { if (onMobileBlur) onMobileBlur(); mobileBlurTimeout.current = null; }, 160);
            } else {
              if (mobile && onMobileBlur) onMobileBlur();
            }
          }}
          placeholder="Pesquisar eventos"
          className={
            mobile
              ? `transition-all duration-200 w-full text-foreground text-[16px] font-normal bg-card border border-border dark:border-[#161616] rounded-full pr-12 pl-4 py-2 outline-none placeholder:text-muted-foreground shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] focus:border-[#EF4118] focus:ring-2 focus:ring-[#EF4118]/30`
              : fullWidth
                ? `transition-all duration-300 w-full text-foreground text-[16px] font-normal bg-card border border-border dark:border-[#161616] rounded-full pr-12 pl-4 py-3 outline-none placeholder:text-muted-foreground shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] focus:border-[#EF4118] focus:ring-2 focus:ring-[#EF4118]/30`
                : `transition-all duration-300 w-[200px] focus:w-[300px] hover:w-[300px] text-foreground text-[16px] font-normal bg-card border border-border dark:border-[#161616] rounded-full pr-12 pl-4 py-2 outline-none placeholder:text-muted-foreground shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] focus:border-[#EF4118] focus:ring-2 focus:ring-[#EF4118]/30`
          }
          style={mobile || fullWidth ? undefined : { width: focused ? 300 : 200 }}
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EF4118] focus:outline-none focus:ring-2 focus:ring-[#EF4118]/30 rounded-md">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Desktop dropdown via portal */}
        {!mobile && showDropdown && dropdownPos && createPortal(
          <div style={{ position: 'absolute', left: dropdownPos.left, top: dropdownPos.top, width: dropdownPos.width, zIndex: 9999 }}>
            <div className="bg-card border border-border dark:border-[#161616] rounded-2xl shadow-[0_4px_12.9px_0_rgba(0,0,0,0.08)] p-4">
              <div className="mb-2">
                <span className="text-foreground dark:text-white text-sm font-bold">Melhores resultados</span>
                {loading ? (
                  <div className="text-xs text-muted-foreground py-2">Buscando...</div>
                ) : (
                  <>
                    {results.events.length === 0 && results.collections.length === 0 && results.organizations.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2">Nenhum resultado encontrado</div>
                    ) : (
                      <>
                        {results.events.length > 0 && (
                          <div>
                            <span className="text-[#2A2AD7] dark:text-white text-xs font-bold">Eventos</span>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {results.events.slice(0, 4).map((ev, idx) => (
                                <button
                                  key={ev.id || idx}
                                  type="button"
                                  className="flex items-center gap-2 hover:bg-card/90 rounded px-1 py-1 w-full text-left"
                                  onMouseDown={() => navigate(`/event/${ev.slug || ev.id}`)}
                                >
                                  <EventImageWithFallback src={ev.image} alt={ev.name} />
                                  <span className="text-[#091747] dark:text-white text-xs font-semibold truncate max-w-[110px]">{ev.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.collections.length > 0 && (
                          <div className="mt-2">
                            <span className="text-[#2A2AD7] dark:text-white text-xs font-bold">Coleções</span>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {results.collections.slice(0, 4).map((col, idx) => (
                                <button
                                  key={col.id || idx}
                                  type="button"
                                  className="flex items-center gap-2 hover:bg-card/90 rounded px-1 py-1 w-full text-left"
                                  onMouseDown={() => navigate(`/colecao/${col.slug || col.id}`)}
                                >
                                  <EventImageWithFallback src={col.bannerImage} alt={col.title} />
                                  <span className="text-[#091747] dark:text-white text-xs font-semibold truncate max-w-[110px]">{col.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.organizations.length > 0 && (
                          <div className="mt-2">
                            <span className="text-[#2A2AD7] dark:text-white text-xs font-bold">Organizações</span>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {results.organizations.slice(0, 4).map((org, idx) => (
                                <button
                                  key={org.id || idx}
                                  type="button"
                                  className="flex items-center gap-2 hover:bg-card/90 rounded px-1 py-1 w-full text-left"
                                  onMouseDown={() => navigate(`/organizacao/${org.slug || org.id}`)}
                                >
                                  <EventImageWithFallback src={org.image} alt={org.name} />
                                  <span className="text-[#091747] dark:text-white text-xs font-semibold truncate max-w-[110px]">{org.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
              <hr className="my-2 border-[#E0E0E0] dark:border-[#161616]" />
              <div>
                <span className="text-[#091747] dark:text-white text-sm font-bold">Sugestões</span>
                <div className="flex flex-col gap-2 mt-2">
                  {mockSuggestions.map((s, idx) => (
                    <button key={idx} type="button" className="flex items-center gap-2 px-2 py-2 rounded-lg bg-card hover:bg-card/80 text-brand-primary font-semibold" onMouseDown={() => {
                      // suggestion click navigates to search with filter or preset query
                      if (s.label === 'Acontecendo hoje') navigate(`/search?q=&filter=day`);
                      else if (s.label === 'Nesse final de semana') navigate(`/search?q=&filter=weekend`);
                      else navigate(`/search?q=${encodeURIComponent(searchTerm || '')}`);
                    }}>
                      {s.icon === 'clock' && (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#2A2AD7] dark:text-[#EF4118]"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      )}
                      {s.icon === 'calendar' && (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#2A2AD7] dark:text-[#EF4118]"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      )}
                      {s.icon === 'search' && (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-[#2A2AD7] dark:text-[#EF4118]"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      )}
                      <span className="text-xs text-[#091747] dark:text-white">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>, document.body)}

        {/* Mobile fullscreen dropdown */}
        {mobile && isMobileFullscreen && createPortal(
          <div className="fixed inset-0 bg-white dark:bg-[#0b0b0b] z-[9998] overflow-y-auto" style={{ top: 'calc(56px + 60px)' }}>
            <div className="px-4 py-4 max-h-screen overflow-y-auto pb-20">
              <div className="mb-4">
                <span className="text-foreground dark:text-white text-base font-bold">Melhores resultados</span>
                {loading ? (
                  <div className="text-sm text-muted-foreground py-4">Buscando...</div>
                ) : (
                  <>
                    {results.events.length === 0 && results.collections.length === 0 && results.organizations.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4">Nenhum resultado encontrado</div>
                    ) : (
                      <>
                        {results.events.length > 0 && (
                          <div className="mt-4">
                            <span className="text-[#2A2AD7] dark:text-indigo-400 text-sm font-bold">Eventos</span>
                            <div className="flex flex-col gap-2 mt-3">
                              {results.events.slice(0, 6).map((ev, idx) => (
                                <button
                                  key={ev.id || idx}
                                  type="button"
                                  className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl p-3 w-full text-left transition-colors"
                                  onMouseDown={() => {
                                    const path = ev.slug ? `/${ev.slug}` : `/event/${ev.id}`;
                                    navigate(path);
                                  }}
                                >
                                  <div className="w-12 h-12 flex-shrink-0">
                                    <EventImageWithFallback src={ev.image} alt={ev.name} />
                                  </div>
                                  <span className="text-[#091747] dark:text-white text-sm font-semibold flex-1">{ev.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.collections.length > 0 && (
                          <div className="mt-6">
                            <span className="text-[#2A2AD7] dark:text-indigo-400 text-sm font-bold">Coleções</span>
                            <div className="flex flex-col gap-2 mt-3">
                              {results.collections.slice(0, 6).map((col, idx) => (
                                <button
                                  key={col.id || idx}
                                  type="button"
                                  className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl p-3 w-full text-left transition-colors"
                                  onMouseDown={() => navigate(`/colecao/${col.slug || col.id}`)}
                                >
                                  <div className="w-12 h-12 flex-shrink-0">
                                    <EventImageWithFallback src={col.bannerImage} alt={col.title} />
                                  </div>
                                  <span className="text-[#091747] dark:text-white text-sm font-semibold flex-1">{col.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.organizations.length > 0 && (
                          <div className="mt-6">
                            <span className="text-[#2A2AD7] dark:text-indigo-400 text-sm font-bold">Organizações</span>
                            <div className="flex flex-col gap-2 mt-3">
                              {results.organizations.slice(0, 6).map((org, idx) => (
                                <button
                                  key={org.id || idx}
                                  type="button"
                                  className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl p-3 w-full text-left transition-colors"
                                  onMouseDown={() => navigate(`/organizacao/${org.slug || org.id}`)}
                                >
                                  <div className="w-12 h-12 flex-shrink-0">
                                    <EventImageWithFallback src={org.image} alt={org.name} />
                                  </div>
                                  <span className="text-[#091747] dark:text-white text-sm font-semibold flex-1">{org.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              <hr className="my-6 border-gray-200 dark:border-[#1F1F1F]" />

              <div>
                <span className="text-[#091747] dark:text-white text-base font-bold">Sugestões</span>
                <div className="flex flex-col gap-2 mt-3">
                  {mockSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors"
                      onMouseDown={() => {
                        if (s.label === 'Acontecendo hoje') navigate(`/search?q=&filter=day`);
                        else if (s.label === 'Nesse final de semana') navigate(`/search?q=&filter=weekend`);
                        else navigate(`/search?q=${encodeURIComponent(searchTerm || '')}`);
                      }}
                    >
                      {s.icon === 'clock' && (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-[#2A2AD7] dark:text-[#EF4118]"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      )}
                      {s.icon === 'calendar' && (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-[#2A2AD7] dark:text-[#EF4118]"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      )}
                      {s.icon === 'search' && (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-[#2A2AD7] dark:text-[#EF4118]"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      )}
                      <span className="text-sm text-[#091747] dark:text-white font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>, document.body)}
      </div>
    </form>
  );
};

export default SearchBar;
