import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Music, Check, User, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchSpotifyArtists, SpotifyArtist } from '@/lib/api/spotify';
import { fetchApi } from '@/lib/apiBase';
import { toast } from 'sonner';

interface SpotifyArtistSearchProps {
    selectedArtists: SpotifyArtist[];
    onArtistsChange: (artists: SpotifyArtist[]) => void;
    className?: string;
}

// Simple internal hook if not globally available
function useDebounceInternal<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function SpotifyArtistSearch({ selectedArtists, onArtistsChange, className }: SpotifyArtistSearchProps) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounceInternal(query, 500);
    const [results, setResults] = useState<SpotifyArtist[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Manual creation state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // If we are creating, don't search
        if (isCreating) return;

        if (!debouncedQuery || debouncedQuery.trim().length < 2) {
            setResults([]);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                // Parallel search: Spotify + Local
                const [spotifyResults, localResponse] = await Promise.allSettled([
                    searchSpotifyArtists(debouncedQuery),
                    fetchApi(`/api/artist/search?q=${encodeURIComponent(debouncedQuery)}`)
                ]);

                let combined: SpotifyArtist[] = [];

                // Process Local Results
                if (localResponse.status === 'fulfilled' && localResponse.value.ok) {
                    try {
                        const localArtists: any[] = await localResponse.value.json();
                        // Map local artist to SpotifyArtist shape
                        const mappedLocal = localArtists.map(a => ({
                            id: a.id,
                            name: a.name,
                            genres: a.genres || [],
                            imageUrl: a.imageUrl || null,
                            popularity: a.popularity || 0,
                            spotifyUrl: null
                        }));
                        combined = [...mappedLocal];
                    } catch (e) {
                        console.error('Error parsing local artists', e);
                    }
                }

                // Process Spotify Results
                if (spotifyResults.status === 'fulfilled') {
                    // Filter out spotify duplicates if same ID exists in local (unlikely but good safety) or same name?
                    // For now just append spotify results that are NOT in local by ID
                    const spotifyItems = spotifyResults.value;
                    const existingIds = new Set(combined.map(a => a.id));

                    spotifyItems.forEach(s => {
                        if (!existingIds.has(s.id)) {
                            combined.push(s);
                        }
                    });
                }

                setResults(combined);
                setIsOpen(true);
            } catch (error) {
                console.error('Failed to search artists', error);
                toast.error('Erro ao buscar artistas');
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery, isCreating]);

    const addArtist = (artist: SpotifyArtist) => {
        if (selectedArtists.find(a => a.id === artist.id)) return;
        onArtistsChange([...selectedArtists, artist]);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const removeArtist = (artistId: string) => {
        onArtistsChange(selectedArtists.filter(a => a.id !== artistId));
    };

    const handleCreateManually = async () => {
        if (!newName || newName.trim().length < 2) {
            toast.error('Nome do artista é obrigatório');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetchApi('/api/artist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), genres: ['Local Artist'] })
            });

            if (!res.ok) throw new Error('Falha ao criar artista');

            const artist = await res.json();

            // Map to SpotifyArtist shape
            const newArtist: SpotifyArtist = {
                id: artist.id,
                name: artist.name,
                genres: artist.genres || [],
                imageUrl: artist.imageUrl || null,
                popularity: 0,
                spotifyUrl: null
            };

            addArtist(newArtist);
            setIsCreating(false);
            setNewName('');
            toast.success('Artista criado com sucesso!');
        } catch (error) {
            console.error('Failed to create artist', error);
            toast.error('Erro ao criar artista. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`w-full space-y-4 ${className}`}>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                    value={isCreating ? newName : query}
                    onChange={(e) => isCreating ? setNewName(e.target.value) : setQuery(e.target.value)}
                    placeholder={isCreating ? "Nome do Artista" : "Buscar artista..."}
                    className="pl-9 bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-gray-800"
                    autoFocus={isCreating}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (isCreating) handleCreateManually();
                        }
                        if (e.key === 'Escape') {
                            setIsCreating(false);
                            setNewName('');
                            setQuery('');
                        }
                    }}
                />

                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                    </div>
                )}

                {/* Cancel creation button */}
                {isCreating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setIsCreating(false); setNewName(''); }}
                            className="h-6 px-2 text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleCreateManually}
                            disabled={isSaving}
                            className="h-6 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                )}
                {/* Dropdown inside relative container */}
                {isOpen && !isCreating && query.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-white dark:bg-[#1F1F1F] rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {results.length > 0 ? (
                            <>
                                {results.map(artist => {
                                    const isSelected = selectedArtists.some(a => a.id === artist.id);
                                    return (
                                        <div
                                            key={artist.id}
                                            onClick={() => !isSelected && addArtist(artist)}
                                            className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] cursor-pointer transition-colors ${isSelected ? 'opacity-50 cursor-default' : ''}`}
                                        >
                                            <Avatar className="h-10 w-10 flex-shrink-0">
                                                <AvatarImage src={artist.imageUrl || ''} />
                                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{artist.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{artist.genres.slice(0, 2).join(', ')}</p>
                                            </div>
                                            {isSelected ? (
                                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                        onClick={() => {
                                            setNewName(query); // Pre-fill with current query
                                            setIsCreating(true);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Não encontrou? Cadastre "{query}" manualmente
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 text-center">
                                <p className="text-sm text-gray-500 mb-2 font-medium">Nenhum artista encontrado.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setNewName(query);
                                        setIsCreating(true);
                                        setIsOpen(false);
                                    }}
                                >
                                    Cadastrar manualmente
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Selected Artists (Lineup) */}
            {selectedArtists.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Line-up</p>
                    <div className="grid grid-cols-1 gap-2">
                        {selectedArtists.map((artist, index) => (
                            <div key={artist.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#1F1F1F] border border-gray-100 dark:border-[#2A2A2A] rounded-lg group">
                                <span className="text-xs font-mono text-gray-400 w-4">{index + 1}</span>
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={artist.imageUrl || ''} />
                                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{artist.name}</p>
                                    {artist.genres.length > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{artist.genres.join(', ')}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => removeArtist(artist.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
