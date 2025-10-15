
import React, { useState, useRef, useEffect } from 'react';
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
      <div className="w-8 h-8 flex items-center justify-center rounded bg-[#F6F7F9]">
        <svg width="22" height="22" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#C3C3C3" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 14L11.1 11.1" stroke="#C3C3C3" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 rounded object-cover bg-[#F6F7F9]"
      onError={() => setError(true)}
    />
  );
}

// Função utilitária para buscar resultados reais
async function fetchSearchResults(term: string) {
  if (!term || term.length < 2) return { events: [], collections: [], organizations: [] };
  try {
    const r = await fetch(`/api/search?term=${encodeURIComponent(term)}`);
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

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<{ events: any[]; collections: any[]; organizations: any[] }>({ events: [], collections: [], organizations: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (searchTerm.length < 2) {
      setResults({ events: [], collections: [], organizations: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSearchResults(searchTerm).then(res => {
      if (active) {
        setResults(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // lógica de busca
  };

  const showDropdown = focused || searchTerm.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Pesquisar eventos"
          className={
            `transition-all duration-300 w-[200px] focus:w-[300px] hover:w-[300px] text-[#091747] text-[16px] font-normal bg-white border border-[#E0E0E0] rounded-full pr-12 pl-4 py-2 outline-none placeholder:text-[#C3C3C3] shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)]`
          }
          style={{ width: focused ? 300 : 200 }}
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2A2AD7]">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {showDropdown && (
          <div className="absolute left-0 top-[110%] w-[340px] bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_4px_12.9px_0_rgba(0,0,0,0.08)] z-50 p-4">
            <div className="mb-2">
              <span className="text-[#091747] text-sm font-bold">Melhores resultados</span>
              {loading ? (
                <div className="text-xs text-[#C3C3C3] py-2">Buscando...</div>
              ) : (
                <>
                  {results.events.length === 0 && results.collections.length === 0 && results.organizations.length === 0 ? (
                    <div className="text-xs text-[#C3C3C3] py-2">Nenhum resultado encontrado</div>
                  ) : (
                    <>
                      {results.events.length > 0 && (
                        <div>
                          <span className="text-[#2A2AD7] text-xs font-bold">Eventos</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {results.events.slice(0,4).map((ev, idx) => (
                              <button
                                key={ev.id || idx}
                                type="button"
                                className="flex items-center gap-2 hover:bg-[#F6F7F9] rounded px-1 py-1 w-full text-left"
                                onMouseDown={() => navigate(`/event/${ev.slug || ev.id}`)}
                              >
                                <EventImageWithFallback src={ev.image} alt={ev.name} />
                                <span className="text-[#091747] text-xs font-semibold truncate max-w-[110px]">{ev.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {results.collections.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[#2A2AD7] text-xs font-bold">Coleções</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {results.collections.slice(0,4).map((col, idx) => (
                              <button
                                key={col.id || idx}
                                type="button"
                                className="flex items-center gap-2 hover:bg-[#F6F7F9] rounded px-1 py-1 w-full text-left"
                                onMouseDown={() => navigate(`/colecao/${col.slug || col.id}`)}
                              >
                                <EventImageWithFallback src={col.bannerImage} alt={col.title} />
                                <span className="text-[#091747] text-xs font-semibold truncate max-w-[110px]">{col.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {results.organizations.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[#2A2AD7] text-xs font-bold">Organizações</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {results.organizations.slice(0,4).map((org, idx) => (
                              <button
                                key={org.id || idx}
                                type="button"
                                className="flex items-center gap-2 hover:bg-[#F6F7F9] rounded px-1 py-1 w-full text-left"
                                onMouseDown={() => navigate(`/organizacao/${org.slug || org.id}`)}
                              >
                                <EventImageWithFallback src={org.image} alt={org.name} />
                                <span className="text-[#091747] text-xs font-semibold truncate max-w-[110px]">{org.name}</span>
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
            <hr className="my-2 border-[#E0E0E0]" />
            <div>
              <span className="text-[#091747] text-sm font-bold">Sugestões</span>
              <div className="flex flex-col gap-2 mt-2">
                {mockSuggestions.map((s, idx) => (
                  <button key={idx} type="button" className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[#F6F7F9] hover:bg-[#E9EAF0] text-[#2A2AD7] font-semibold">
                    {s.icon === 'clock' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#2A2AD7" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round"/></svg>
                    )}
                    {s.icon === 'calendar' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" stroke="#2A2AD7" strokeWidth="2"/><path d="M16 3v4M8 3v4" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round"/></svg>
                    )}
                    {s.icon === 'search' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="#2A2AD7" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round"/></svg>
                    )}
                    <span className="text-xs text-[#091747]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
