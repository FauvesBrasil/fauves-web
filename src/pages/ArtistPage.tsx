import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '@/lib/apiBase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import LoginModal from '@/components/LoginModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Calendar, MapPin, Users, Music, BadgeCheck } from 'lucide-react';

interface Artist {
    id: string;
    name: string;
    slug?: string;
    imageUrl?: string;
    genres?: string[];
    spotifyUrl?: string;
    popularity?: number;
    followerCount?: number;
    eventCount?: number;
    isVerified?: boolean;
}

interface EventSummary {
    id: string;
    name: string;
    slug?: string;
    startDate: string;
    image?: string;
    location?: string;
    locationCity?: string;
    locationUf?: string;
}

const ArtistPage: React.FC = () => {
    const { slugOrId } = useParams<{ slugOrId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, token } = useAuth();

    const [artist, setArtist] = useState<Artist | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<EventSummary[]>([]);
    const [pastEvents, setPastEvents] = useState<EventSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [following, setFollowing] = useState<boolean | null>(null);
    const [followLoading, setFollowLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        if (!slugOrId) return;

        const load = async () => {
            setLoading(true);
            setError('');

            try {
                // Fetch artist details
                const artistRes = await fetch(apiUrl(`/api/artist/${encodeURIComponent(slugOrId)}`));
                if (!artistRes.ok) throw new Error('Artista não encontrado');
                const artistData = await artistRes.json();
                setArtist(artistData);

                // Fetch events
                const eventsRes = await fetch(apiUrl(`/api/artist/${encodeURIComponent(slugOrId)}/events`));
                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    setUpcomingEvents(eventsData.upcoming || []);
                    setPastEvents(eventsData.past || []);
                }

                // Check follow status if logged in
                if (user?.id && token) {
                    const followRes = await fetch(apiUrl(`/api/artist/${encodeURIComponent(slugOrId)}/follow`), {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (followRes.ok) {
                        const followData = await followRes.json();
                        setFollowing(followData.following);
                    }
                }

                document.title = `${artistData.name} | Fauves`;
            } catch (e: any) {
                setError(e?.message || 'Erro ao carregar artista');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [slugOrId, user?.id, token]);

    const handleFollow = async () => {
        if (!artist) return;

        if (!user?.id || !token) {
            setShowLoginModal(true);
            return;
        }

        if (followLoading) return;
        setFollowLoading(true);

        try {
            const method = following ? 'DELETE' : 'POST';
            const res = await fetch(apiUrl(`/api/artist/${encodeURIComponent(artist.id)}/follow`), {
                method,
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setFollowing(!following);
                toast({
                    title: following ? 'Deixou de seguir' : 'Seguindo',
                    description: following ? 'Você deixou de seguir o artista.' : 'Agora você segue este artista.',
                });
            }
        } catch (e) {
            toast({ title: 'Erro', description: 'Falha ao processar ação', variant: 'destructive' as any });
        } finally {
            setFollowLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatLocation = (event: EventSummary) => {
        if (event.locationCity && event.locationUf) {
            return `${event.locationCity} - ${event.locationUf}`;
        }
        return event.location || '';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0b0b0b]">
                <Header />
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0b0b0b]">
                <Header />
                <div className="flex-1 flex items-center justify-center py-32">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-red-600 mb-4">{error || 'Artista não encontrado.'}</span>
                        <a href="/" className="text-indigo-600 underline">Voltar para a página inicial</a>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0b0b0b]">
            {/* Hero Section with Header */}
            <div className="relative overflow-hidden">
                {/* Background blur - extended beyond viewport to avoid edge gaps */}
                <div
                    className="absolute z-0 pointer-events-none opacity-60"
                    style={{
                        top: 0,
                        left: '-50px',
                        right: '-50px',
                        height: '350px',
                        background: artist.imageUrl
                            ? `linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(11, 11, 11, 0.8)), url(${artist.imageUrl})`
                            : 'linear-gradient(to bottom, #1a1a3e, #000000ff)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(20px)',
                    }}
                />

                {/* Header - z-50 to stay on top */}
                <div className="relative z-50">
                    <Header />
                </div>

                <div className="relative z-10 max-w-[1000px] mx-auto px-4 pt-4 pb-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                        {/* Artist Image */}
                        <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-[#242424]">
                            {artist.imageUrl ? (
                                <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Music className="w-20 h-20 text-white/80" />
                                </div>
                            )}
                        </div>

                        {/* Artist Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#F9C900' }}>Artista</div>
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{artist.name}</h1>
                                {artist.isVerified && (
                                    <BadgeCheck className="w-8 h-8 text-white fill-blue-500 mb-2" />
                                )}
                            </div>

                            {artist.genres && artist.genres.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                                    {artist.genres.slice(0, 4).map((genre) => (
                                        <span
                                            key={genre}
                                            className="px-3 py-1 bg-white/10 dark:bg-white/5 text-white text-sm rounded-full"
                                        >
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-4 justify-center md:justify-start text-white/80 text-sm mb-4">
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {artist.followerCount || 0} seguidores
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {artist.eventCount || 0} eventos
                                </span>
                            </div>

                            <div className="flex gap-3 justify-center md:justify-start">
                                <Button
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                    className={`px-6 ${following ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                >
                                    {followLoading ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : following ? (
                                        'Seguindo'
                                    ) : (
                                        'Seguir'
                                    )}
                                </Button>

                                {artist.spotifyUrl && (
                                    <a
                                        href={artist.spotifyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-md font-semibold text-sm flex items-center gap-2"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                        </svg>
                                        Spotify
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1000px] mx-auto px-4 py-8">
                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-indigo-950 dark:text-white mb-6">Próximos Eventos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    to={`/${event.slug || event.id}`}
                                    className="group bg-white dark:bg-[#1b1b1b] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                                >
                                    <div className="aspect-video bg-gray-100 dark:bg-[#242424] overflow-hidden">
                                        {event.image ? (
                                            <img
                                                src={event.image.startsWith('/uploads') ? apiUrl(event.image) : event.image}
                                                alt={event.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-indigo-950 dark:text-white mb-2 line-clamp-2">{event.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(event.startDate)}
                                        </div>
                                        {formatLocation(event) && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <MapPin className="w-4 h-4" />
                                                {formatLocation(event)}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-indigo-950 dark:text-white mb-6">Eventos Anteriores</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pastEvents.slice(0, 6).map((event) => (
                                <Link
                                    key={event.id}
                                    to={`/${event.slug || event.id}`}
                                    className="group bg-white dark:bg-[#1b1b1b] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow opacity-80 hover:opacity-100"
                                >
                                    <div className="aspect-video bg-gray-100 dark:bg-[#242424] overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                                        {event.image ? (
                                            <img
                                                src={event.image.startsWith('/uploads') ? apiUrl(event.image) : event.image}
                                                alt={event.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-indigo-950 dark:text-white mb-2 line-clamp-2">{event.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(event.startDate)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Events */}
                {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                    <div className="text-center py-12">
                        <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Nenhum evento encontrado para este artista.</p>
                    </div>
                )}
            </div>

            <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => {
                toast({ title: 'Bem-vindo', description: 'Login efetuado' });
                setShowLoginModal(false);
            }} />

            <Footer />
        </div>
    );
};

export default ArtistPage;
