import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: {
        name: string;
        slug: string;
    };
}

const HelpSearchBar = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchArticles = async () => {
            if (query.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetchApi(`/api/help/search?q=${encodeURIComponent(query)}`);
                if (!response.ok) throw new Error('Falha na busca');
                const data = await response.json();
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                // no-op
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchArticles, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelectArticle = (slug: string) => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
        navigate(`/ajuda/artigo/${slug}`);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div ref={searchRef} className="help-search-root">
            <div className="help-search-field">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Busque artigos, tutoriais e muito mais..."
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="help-search-clear"
                        aria-label="Limpar busca"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <div className="help-search-results">
                    {loading ? (
                        <div className="help-search-message">
                            Buscando...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="help-search-list">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelectArticle(result.slug)}
                                    className="help-search-result"
                                >
                                    <div>
                                        <div>
                                            <div className="help-search-result-title">
                                                {result.title}
                                            </div>
                                            <div className="help-search-result-category">
                                                {result.category.name}
                                            </div>
                                            <div className="help-search-result-summary">
                                                {result.summary}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="help-search-message">
                            Nenhum resultado encontrado para "{query}"
                        </div>
                    ) : null}
                </div>
            )}

            <style>{`
                .help-search-root { position: relative; width: 100%; }
                .help-search-field { position: relative; }
                .help-search-field input {
                    width: 100%;
                    height: 51px;
                    padding: 0 44px 0 21px;
                    border: 1px solid rgba(255, 255, 255, .13);
                    border-radius: 8px;
                    outline: none;
                    background: rgba(8, 10, 11, .72);
                    color: rgba(255, 255, 255, .95);
                    font-family: inherit;
                    font-size: 15px;
                    font-weight: 500;
                    backdrop-filter: blur(14px);
                    transition: border-color .16s ease, background-color .16s ease;
                }
                .help-search-field input::placeholder { color: rgba(255, 255, 255, .38); }
                .help-search-field input:focus {
                    border-color: rgba(255, 255, 255, .28);
                    background: rgba(8, 10, 11, .84);
                }
                .help-search-clear {
                    position: absolute;
                    top: 50%;
                    right: 14px;
                    display: grid;
                    place-items: center;
                    width: 26px;
                    height: 26px;
                    padding: 0;
                    border: 0;
                    border-radius: 6px;
                    background: transparent;
                    color: rgba(255, 255, 255, .4);
                    cursor: pointer;
                    transform: translateY(-50%);
                }
                .help-search-clear:hover { color: rgba(255, 255, 255, .88); }
                .help-search-results {
                    position: absolute;
                    z-index: 50;
                    top: calc(100% + 8px);
                    right: 0;
                    left: 0;
                    max-height: 390px;
                    overflow-y: auto;
                    border: 1px solid rgba(255, 255, 255, .1);
                    border-radius: 12px;
                    background: rgba(27, 29, 31, .92);
                    box-shadow: 0 18px 50px rgba(0, 0, 0, .28);
                    backdrop-filter: blur(22px);
                }
                .help-search-list { padding: 7px; }
                .help-search-result {
                    width: 100%;
                    padding: 12px 13px;
                    border: 0;
                    border-radius: 8px;
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                    text-align: left;
                }
                .help-search-result:hover { background: rgba(255, 255, 255, .06); }
                .help-search-result-title { color: rgba(255,255,255,.94); font-size: 14px; font-weight: 650; }
                .help-search-result-category { margin-top: 3px; color: #EF4118; font-size: 11px; font-weight: 650; }
                .help-search-result-summary { margin-top: 5px; overflow: hidden; color: rgba(255,255,255,.55); font-size: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                .help-search-message { padding: 18px; color: rgba(255,255,255,.48); text-align: center; font-size: 13px; }
            `}</style>
        </div>
    );
};

export default HelpSearchBar;
