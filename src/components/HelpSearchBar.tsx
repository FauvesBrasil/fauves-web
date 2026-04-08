import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

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
                const response = await fetch(`http://localhost:4000/api/help/search?q=${encodeURIComponent(query)}`);
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
        <div ref={searchRef} className="relative max-w-2xl mx-auto">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar artigos de ajuda..."
                    className="w-full pl-12 pr-12 py-4 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent shadow-sm"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
                    {loading ? (
                        <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                            Buscando...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelectArticle(result.slug)}
                                    className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <Search className="w-4 h-4 text-zinc-400 mt-1 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-zinc-900 dark:text-white mb-1">
                                                {result.title}
                                            </div>
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                                                {result.category.name}
                                            </div>
                                            <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                                {result.summary}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                            Nenhum resultado encontrado para "{query}"
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default HelpSearchBar;
