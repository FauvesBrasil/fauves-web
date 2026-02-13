import { fetchApi } from '../apiBase';

export interface SpotifyArtist {
    id: string;
    name: string;
    genres: string[];
    imageUrl: string | null;
    popularity: number;
    spotifyUrl: string | null;
}

export async function searchSpotifyArtists(query: string, limit: number = 10): Promise<SpotifyArtist[]> {
    if (!query || query.trim().length < 2) return [];

    try {
        const response = await fetchApi(`/api/spotify/search/artists?q=${encodeURIComponent(query)}&limit=${limit}`);
        if (!response.ok) return [];

        const data = await response.json();
        return data.artists || [];
    } catch (error) {
        console.error('searchSpotifyArtists error:', error);
        return [];
    }
}

export async function getSpotifyArtist(id: string): Promise<SpotifyArtist | null> {
    try {
        const response = await fetchApi(`/api/spotify/artists/${id}`);
        if (!response.ok) return null;

        const data = await response.json();
        return data.artist || null;
    } catch (error) {
        console.error('getSpotifyArtist error:', error);
        return null;
    }
}

export async function getSpotifyArtists(ids: string[]): Promise<SpotifyArtist[]> {
    if (!ids.length) return [];

    try {
        const response = await fetchApi(`/api/spotify/artists?ids=${ids.join(',')}`);
        if (!response.ok) return [];

        const data = await response.json();
        return data.artists || [];
    } catch (error) {
        console.error('getSpotifyArtists error:', error);
        return [];
    }
}
