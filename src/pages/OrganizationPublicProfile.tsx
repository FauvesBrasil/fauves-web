import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/apiBase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginModal from '@/components/LoginModal';
import FollowersModal from '../components/FollowersModal';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, MapPin, Users, Share2, ExternalLink,
  Mail, Globe, Clock, Heart, Loader2, CalendarDays,
  Instagram, Youtube, Music, MessageCircle, Send,
  Facebook, Twitter, Phone
} from 'lucide-react';

const OrganizationPublicProfile: React.FC = () => {
  const { slugOrId, slug: legacySlug } = useParams<{ slugOrId?: string; slug?: string }>();
  const slug = slugOrId || legacySlug;
  const [org, setOrg] = React.useState<any | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [featuredEvent, setFeaturedEvent] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user, token } = useAuth();
  const [following, setFollowing] = React.useState<boolean | null>(null);
  const [followersCount, setFollowersCount] = React.useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [followersList, setFollowersList] = React.useState<any[]>([]);
  const [showFollowersModal, setShowFollowersModal] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!slug) return;
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        const endpoint = !isUUID
          ? apiUrl(`/api/organization/slug/${encodeURIComponent(slug)}`)
          : apiUrl(`/api/organization/${encodeURIComponent(slug)}`);

        let res = await fetch(endpoint);

        if (!res.ok && !isUUID && res.status === 404) {
          res = await fetch(apiUrl(`/api/organization/${encodeURIComponent(slug)}`));
        }

        if (!mounted) return;
        if (!res.ok) {
          setError(`Erro HTTP ${res.status}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!data || !data.id) {
          setError('Organização não encontrada');
          setOrg(null);
          setLoading(false);
          return;
        }
        setOrg(data);

        if (user?.id && token) {
          try {
            const fRes = await fetch(apiUrl(`/api/organization/${data.id}/follow`), { headers: { Authorization: `Bearer ${token}` } });
            if (fRes.ok) {
              const f = await fRes.json();
              if (mounted) setFollowing(!!f.following);
            }
          } catch (e) { }
        }

        try {
          const cRes = await fetch(apiUrl(`/api/organization/${data.id}/followers/count`));
          if (cRes.ok) {
            const c = await cRes.json();
            if (mounted) setFollowersCount(Number(c.count || 0));
          }
        } catch (e) {
          console.warn('followers count fetch failed', e);
        }

        try {
          const evRes = await fetch(apiUrl(`/api/organization/${data.id}/events`));
          if (evRes.ok) {
            const ev = await evRes.json();
            if (mounted) setEvents(ev || []);
          }
        } catch (e) {
          console.warn('events fetch failed', e);
        }

        // Featured event
        try {
          const featRes = await fetch(apiUrl(`/api/organization/${data.id}/events/next`));
          if (featRes.ok) {
            const feat = await featRes.json();
            if (mounted && feat?.id) setFeaturedEvent(feat);
          }
        } catch (e) {
          console.warn('featured event fetch failed', e);
        }

        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        console.error('fetch org error', e);
        setError(e?.message || 'Erro desconhecido');
        setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [slug, user, token]);

  const handleFetchFollowers = async (orgId: string) => {
    try {
      const r = await fetch(apiUrl(`/api/organization/${encodeURIComponent(orgId)}/followers`));
      if (r.ok) {
        const j = await r.json();
        setFollowersList(j || []);
      } else setFollowersList([]);
    } catch (e) { setFollowersList([]); }
    setShowFollowersModal(true);
  };

  const handleFollow = async () => {
    if (!org?.id) return;
    if (!user?.id || !token) {
      setShowLoginModal(true);
      return;
    }
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        const r = await fetch(apiUrl(`/api/organization/${org.id}/follow`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          setFollowing(false);
          setFollowersCount((c) => Math.max(0, (c || 0) - 1));
          toast({ title: 'Deixou de seguir' });
        } else {
          toast({ title: 'Erro', description: 'Falha ao deixar de seguir', variant: 'destructive' });
        }
      } else {
        const r = await fetch(apiUrl(`/api/organization/${org.id}/follow`), { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        if (r.ok) {
          setFollowing(true);
          setFollowersCount((c) => (c || 0) + 1);
          toast({ title: 'Seguindo!' });
        } else {
          toast({ title: 'Erro', description: 'Falha ao seguir', variant: 'destructive' });
        }
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Erro ao processar ação', variant: 'destructive' });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: org?.name || 'Organização',
        text: `Confira ${org?.name} na Fauves!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copiado!' });
    }
  };

  // Parse tags
  const tags = React.useMemo(() => {
    try {
      if (!org?.tags) return [];
      return typeof org.tags === 'string' ? JSON.parse(org.tags) : org.tags;
    } catch {
      return [];
    }
  }, [org?.tags]);

  // Social links helper
  const socialLinks = React.useMemo(() => {
    if (!org) return [];
    const links = [];
    if (org.instagram) links.push({ icon: Instagram, label: 'Instagram', url: `https://instagram.com/${org.instagram.replace('@', '')}`, color: 'text-pink-600' });
    if (org.youtube) links.push({ icon: Youtube, label: 'YouTube', url: org.youtube, color: 'text-red-600' });
    if (org.tiktok) links.push({ icon: Music, label: 'TikTok', url: `https://tiktok.com/@${org.tiktok.replace('@', '')}`, color: 'text-black dark:text-white' });
    if (org.facebook) links.push({ icon: Facebook, label: 'Facebook', url: org.facebook, color: 'text-blue-600' });
    if (org.x || org.twitter) links.push({ icon: Twitter, label: 'X/Twitter', url: org.x || org.twitter, color: 'text-gray-900 dark:text-white' });
    if (org.whatsapp) links.push({ icon: Phone, label: 'WhatsApp', url: `https://wa.me/${org.whatsapp}`, color: 'text-green-600' });
    if (org.telegram) links.push({ icon: Send, label: 'Telegram', url: org.telegram, color: 'text-blue-500' });
    if (org.spotify) links.push({ icon: Music, label: 'Spotify', url: org.spotify, color: 'text-green-500' });
    return links;
  }, [org]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0b0b]">
        <Header />
        <main className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0b0b]">
        <Header />
        <main className="max-w-[1100px] mx-auto px-6 py-12">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Organização não encontrada
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              A organização que você está procurando não existe ou foi removida.
            </p>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const futureEvents = events.filter(ev => new Date(ev.startDate) >= new Date());
  const pastEvents = events.filter(ev => new Date(ev.startDate) < new Date());

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0b] text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="h-48 md:h-56 rounded-xl overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 relative">
            {org.coverUrl && (
              <img src={org.coverUrl} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Logo flutuante */}
          <div className="relative px-6 -mt-12">
            <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-lg rounded-xl">
              <AvatarImage src={org.logoUrl || ''} alt={org.name} />
              <AvatarFallback className="text-2xl font-bold bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                {(org.name || 'O')[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Conteúdo abaixo do banner */}
          <div className="px-6 mt-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {org.name}
                </h1>
                {org.bio && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">{org.bio}</p>
                )}

                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <button
                    onClick={() => { }}
                    className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{events.length}</span> eventos
                  </button>
                  <button
                    onClick={() => org.id && handleFetchFollowers(org.id)}
                    className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{followersCount || 0}</span> seguidores
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={following ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600' : 'bg-orange-600 hover:bg-orange-700'}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : following ? (
                    <>
                      <Heart className="w-4 h-4 mr-2 fill-current" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Seguir
                    </>
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Event Banner */}
        {featuredEvent && (
          <Link to={`/events/${featuredEvent.slug || featuredEvent.id}`}>
            <Card className="mb-8 overflow-hidden group cursor-pointer hover:shadow-xl transition-all rounded-xl">
              <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 to-pink-600">
                {featuredEvent.image && (
                  <img src={featuredEvent.image} alt={featuredEvent.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <Badge className="bg-orange-600 text-white mb-2">Evento em Destaque</Badge>
                  <h2 className="text-2xl font-bold text-white">{featuredEvent.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-white/90 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(featuredEvent.startDate).toLocaleDateString('pt-BR')}
                    </span>
                    {(featuredEvent.locationCity || featuredEvent.locationUf) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {featuredEvent.locationCity}, {featuredEvent.locationUf}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        <Tabs defaultValue="events" className="mt-8">
          <TabsList className="w-full justify-start border-b">
            <TabsTrigger value="events" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Globe className="w-4 h-4" />
              Sobre
            </TabsTrigger>
            {org.artistsMode && (
              <TabsTrigger value="artists" className="gap-2">
                <Music className="w-4 h-4" />
                Artistas
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="events" className="mt-6">
            {futureEvents.length === 0 && pastEvents.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Sem eventos agendados
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Esta organização ainda não publicou nenhum evento
                </p>
                {!following && (
                  <Button onClick={handleFollow} className="bg-orange-600 hover:bg-orange-700">
                    <Heart className="w-4 h-4 mr-2" />
                    Seguir para ser notificado
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-8">
                {futureEvents.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Próximos Eventos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {futureEvents.map((ev) => (
                        <Link key={ev.id} to={`/events/${ev.slug || ev.id}`}>
                          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer rounded-xl">
                            <div className="relative h-48 bg-gradient-to-br from-orange-400 to-pink-600 overflow-hidden">
                              {ev.image && (
                                <img src={ev.image} alt={ev.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-orange-600 text-white">
                                  {new Date(ev.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                <Clock className="w-3 h-3" />
                                {new Date(ev.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                {ev.name}
                              </h3>
                              {(ev.locationCity || ev.locationUf) && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                  <MapPin className="w-4 h-4" />
                                  {ev.locationCity}, {ev.locationUf}
                                </div>
                              )}
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-600 dark:text-gray-400">Eventos Passados</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                      {pastEvents.slice(0, 6).map((ev) => (
                        <Link key={ev.id} to={`/events/${ev.slug || ev.id}`}>
                          <Card className="overflow-hidden group cursor-pointer rounded-xl">
                            <div className="relative h-32 bg-gray-200 dark:bg-gray-800">
                              {ev.image && (
                                <img src={ev.image} alt={ev.name} className="w-full h-full object-cover grayscale" />
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                                {ev.name}
                              </h3>
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {new Date(ev.startDate).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="space-y-6">
              <Card className="p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Sobre {org.name}</h3>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {org.description ? (
                  <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">
                    {org.description}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic mb-6">
                    Nenhuma descrição disponível.
                  </p>
                )}

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {org.site && (
                    <a href={org.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-orange-600 hover:underline">
                      <Globe className="w-4 h-4" />
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {org.contactEmail && org.showContactEmail && (
                    <a href={`mailto:${org.contactEmail}`} className="flex items-center gap-2 text-orange-600 hover:underline">
                      <Mail className="w-4 h-4" />
                      {org.contactEmail}
                    </a>
                  )}
                  {org.locationText && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MapPin className="w-4 h-4" />
                      {org.locationText}
                    </div>
                  )}
                </div>

                {/* Social Links Grid */}
                {socialLinks.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Redes Sociais</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {socialLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <link.icon className={`w-5 h-5 ${link.color}`} />
                          <span className="text-sm font-medium">{link.label}</span>
                          <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {org.artistsMode && (
            <TabsContent value="artists" className="mt-6">
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🎸</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Artistas em Breve
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Esta seção estará disponível em breve com os artistas que se apresentarão nos eventos.
                </p>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main >

      <Footer />

      {
        showLoginModal && (
          <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => toast({ title: 'Bem-vindo!' })} />
        )
      }
      <FollowersModal open={showFollowersModal} onClose={() => setShowFollowersModal(false)} followers={followersList} />
    </div >
  );
};

export default OrganizationPublicProfile;
