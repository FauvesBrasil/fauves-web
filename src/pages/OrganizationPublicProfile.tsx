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
import EventCard from '@/components/EventCard';
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

  const tags = React.useMemo(() => {
    try {
      if (!org?.tags) return [];
      return typeof org.tags === 'string' ? JSON.parse(org.tags) : org.tags;
    } catch {
      return [];
    }
  }, [org?.tags]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0b0b] text-gray-900 dark:text-white pb-20">
      <Header />

      {/* Hero Section Imersiva */}
      <div className="relative w-full overflow-hidden">
        {/* Banner de Capa Premium */}
        <div className="relative h-[300px] md:h-[400px] w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 animate-gradient-x" />
          {org.coverUrl ? (
            <img 
              src={org.coverUrl} 
              alt={org.name} 
              className="w-full h-full object-cover mix-blend-overlay opacity-40" 
            />
          ) : (
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,100,0,0.3),transparent)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0b0b0b] via-transparent to-black/30" />
        </div>

        {/* Informações Centrais (Glassmorphism) */}
        <div className="max-w-[1100px] mx-auto px-6 -mt-32 md:-mt-40 relative z-10 flex flex-col items-center text-center">
          {/* Logo Premium */}
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-8 border-white dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2.5rem] relative z-10 transform transition-transform duration-500 group-hover:scale-105">
              <AvatarImage src={org.logoUrl || ''} alt={org.name} className="object-cover" />
              <AvatarFallback className="text-4xl md:text-5xl font-black bg-gradient-to-br from-orange-400 to-pink-600 text-white">
                {(org.name || 'O')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-gray-800 z-20">
              <Heart className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="mt-8 mb-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white drop-shadow-sm">
              {org.name}
            </h1>
            {org.bio && (
              <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl text-lg md:text-xl font-medium leading-relaxed">
                {org.bio}
              </p>
            )}
          </div>

          {/* Stats Rápidos */}
          <div className="flex items-center gap-8 md:gap-12 mt-2">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{events.length}</span>
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Eventos</span>
            </div>
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800" />
            <div className="flex flex-col items-center cursor-pointer" onClick={() => handleFetchFollowers(org.id)}>
              <span className="text-2xl font-black text-orange-600">{followersCount || 0}</span>
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Seguidores</span>
            </div>
          </div>

          {/* Botões de Ação Principais */}
          <div className="flex items-center gap-4 mt-10 w-full max-w-md">
            <Button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 h-14 text-lg font-black rounded-2xl shadow-xl transition-all duration-300 ${
                following 
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105 active:scale-95'
              }`}
            >
              {followLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : following ? (
                'Seguindo'
              ) : (
                'Seguir Organização'
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleShare}
              className="h-14 w-14 rounded-2xl border-2 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md"
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bio Hub (Links Sociais Estilizados) */}
      <div className="max-w-[1100px] mx-auto px-6 mt-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-[#1a1b1e] border-2 border-transparent hover:border-orange-500 overflow-hidden shadow-sm hover:shadow-2xl rounded-3xl transition-all duration-300 hover:-translate-y-2 relative"
            >
              <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 mb-3 group-hover:scale-110 transition-transform duration-300 ${link.color.replace('text-', 'text-opacity-80 text-')}`}>
                <link.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-black tracking-tight">{link.label}</span>
              <ExternalLink className="w-3 h-3 absolute top-4 right-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
            </a>
          ))}
          {org.site && !socialLinks.find(l => l.label === 'Website') && (
            <a
              href={org.site}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-[#1a1b1e] border-2 border-transparent hover:border-orange-500 shadow-sm hover:shadow-2xl rounded-3xl transition-all duration-300 hover:-translate-y-2 relative"
            >
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 mb-3 group-hover:scale-110 transition-transform duration-300 text-blue-500">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-sm font-black tracking-tight">Website</span>
              <ExternalLink className="w-3 h-3 absolute top-4 right-4 text-gray-300" />
            </a>
          )}
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-6 mt-20">
        {/* Featured Event Banner (Full Width Hero) */}
        {featuredEvent && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <span className="bg-orange-600 w-2 h-8 rounded-full" />
                Destaque da Semana
              </h2>
            </div>
            <Link to={`/events/${featuredEvent.slug || featuredEvent.id}`}>
              <div className="relative group overflow-hidden rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] bg-black h-[400px] md:h-[500px]">
                {featuredEvent.image && (
                  <img 
                    src={featuredEvent.image} 
                    alt={featuredEvent.name} 
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-80" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge className="bg-orange-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-white/20">EVENTO EM DESTAQUE</Badge>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-black">
                      <Clock className="w-4 h-4 text-orange-500" />
                      COMO CHEGAR
                    </div>
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-xl leading-tight max-w-3xl group-hover:text-orange-400 transition-colors">
                    {featuredEvent.name}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-6 text-white/90">
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-orange-600 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Data do Evento</p>
                         <p className="font-bold">{new Date(featuredEvent.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>
                    {featuredEvent.locationCity && (
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Localização</p>
                          <p className="font-bold">{featuredEvent.locationCity}, {featuredEvent.locationUf}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Countdown / Ticket Button Floating */}
                <div className="absolute top-8 right-8 hidden lg:block transform group-hover:-translate-y-2 transition-transform">
                  <div className="bg-white dark:bg-[#1a1b1e] p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center border-t-4 border-orange-600">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ingressos a partir de</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">R$ --,--</p>
                    <Button className="bg-orange-600 hover:bg-orange-700 h-12 w-full rounded-2xl font-black text-sm px-8 shadow-lg shadow-orange-600/20">
                      GARANTIR VAGA
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
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
                    <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start">
                      {futureEvents.map((ev) => (
                        <EventCard
                          key={ev.id}
                          id={ev.id}
                          slug={ev.slug}
                          image={ev.image}
                          date={new Date(ev.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                          title={ev.name}
                          location={`${ev.locationCity || ''}${ev.locationCity && ev.locationUf ? ', ' : ''}${ev.locationUf || ''}`}
                          views={ev.metrics?.views || 0}
                          interests={ev.metrics?.interests || 0}
                          categories={ev.categories || []}
                          size="large"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-600 dark:text-gray-400">Eventos Passados</h2>
                    <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start opacity-70 grayscale-[0.5]">
                      {pastEvents.slice(0, 12).map((ev) => (
                        <EventCard
                          key={ev.id}
                          id={ev.id}
                          slug={ev.slug}
                          image={ev.image}
                          date={new Date(ev.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                          title={ev.name}
                          location={`${ev.locationCity || ''}${ev.locationCity && ev.locationUf ? ', ' : ''}${ev.locationUf || ''}`}
                          views={ev.metrics?.views || 0}
                          interests={ev.metrics?.interests || 0}
                          categories={ev.categories || []}
                          size="small"
                        />
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
