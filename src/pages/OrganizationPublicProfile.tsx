import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/apiBase';
import Header from '@/components/Header';
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
  Calendar, MapPin, Share2, ExternalLink,
  Mail, Globe, Clock, Heart, Loader2, CalendarDays,
  Instagram, Youtube, Music, Send,
  Facebook, Twitter, Phone, ArrowLeft
} from 'lucide-react';

const OrganizationPublicProfile: React.FC = () => {
  const { slugOrId, slug: legacySlug } = useParams<{ slugOrId?: string; slug?: string }>();
  const slug = slugOrId || legacySlug;
  const navigate = useNavigate();
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

  const handleFollow = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
        <main className="max-w-[1100px] mx-auto px-6 py-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
        </main>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0b0b]">
        <Header />
        <main className="max-w-[1100px] mx-auto px-6 py-12">
          <Card className="p-12 text-center rounded-[3rem] border-2">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-3xl font-black mb-4">Página de Perfil indisponível</h2>
            <Link to="/">
              <Button className="h-14 px-8 rounded-2xl bg-orange-600">Voltar ao Início</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  const futureEvents = events.filter(ev => new Date(ev.startDate) >= new Date());
  const pastEvents = events.filter(ev => new Date(ev.startDate) < new Date());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0b0b] text-gray-900 dark:text-white pb-10">
      <Header />

      {/* Hero Section Compacto */}
      <div className="relative w-full overflow-hidden">
        <div className="relative h-[180px] md:h-[240px] w-full group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-orange-950 animate-gradient-x" />
          {org.coverUrl && (
            <img 
              src={org.coverUrl} 
              alt={org.name} 
              className="w-full h-full object-cover mix-blend-overlay opacity-30 transition-transform duration-[5s] group-hover:scale-105" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0b0b0b] via-transparent to-black/10" />
          
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-4 left-6 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 transition-all text-white z-20 group/back"
          >
            <ArrowLeft className="w-5 h-5 transform group-hover/back:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Informações da Marca */}
        <div className="max-w-[1100px] mx-auto px-6 -mt-16 md:-mt-22 relative z-10 flex flex-col items-center text-center">
          <div className="relative group cursor-pointer" onClick={handleFollow}>
            <div className="absolute inset-0 bg-orange-600 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
            <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-white dark:border-gray-900 shadow-2xl rounded-full relative z-10 transform transition-all duration-700 group-hover:scale-110">
              <AvatarImage src={org.logoUrl || ''} alt={org.name} className="object-cover rounded-full" />
              <AvatarFallback className="text-4xl md:text-5xl font-black bg-gradient-to-br from-orange-400 to-pink-600 text-white rounded-full">
                {(org.name || 'O')[0]}
              </AvatarFallback>
            </Avatar>
            
            <div 
              className={`absolute bottom-0 right-0 p-2 rounded-full shadow-xl border-2 border-white dark:border-gray-900 z-20 transition-all duration-500 hover:scale-125 ${
                following 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${following ? 'fill-current animate-pulse' : ''}`} />
            </div>
          </div>

          <div className="mt-6 mb-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              {org.name}
            </h1>
            {org.bio && (
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg text-base font-medium leading-relaxed opacity-90">
                {org.bio}
              </p>
            )}
          </div>

          {/* Stats Sutilizados */}
          <div className="flex items-center gap-6 md:gap-10 mt-2">
            <div className="flex flex-col items-center group/stat">
              <span className="text-lg font-black text-gray-900 dark:text-white transition-colors group-hover/stat:text-orange-600">{events.length}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-gray-400">Eventos</span>
            </div>
            <div className="flex flex-col items-center group/stat cursor-pointer" onClick={() => handleFetchFollowers(org.id)}>
              <span className="text-lg font-black text-gray-900 dark:text-white transition-colors group-hover/stat:text-orange-600">{followersCount || 0}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-gray-400">Seguidores</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8 w-full max-w-sm">
            <Button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 h-12 text-sm font-black rounded-xl shadow-lg transition-all duration-500 active:scale-95 ${
                following 
                  ? 'bg-gray-200 dark:bg-zinc-900 text-gray-900 dark:text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {following ? 'Seguindo' : 'Seguir Organização'}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleShare}
              className="h-12 w-12 rounded-xl border hover:bg-white dark:hover:bg-zinc-900 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center p-5 bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 hover:border-orange-500 shadow-sm rounded-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800 mb-2 ${link.color}`}>
                <link.icon className="w-4 h-4" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{link.label}</span>
            </a>
          ))}
          {org.site && !socialLinks.find(l => l.label === 'Website') && (
            <a
              href={org.site}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center p-5 bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 hover:border-orange-500 shadow-sm rounded-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800 mb-2 text-blue-500">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Website</span>
            </a>
          )}
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-6 mt-20">
        {featuredEvent && (
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6 pl-1">
              <div className="h-5 w-1 bg-orange-600 rounded-full" />
              <h2 className="text-lg font-bold tracking-tight uppercase opacity-60">Destaque</h2>
            </div>
            <Link to={`/event/${featuredEvent.slug || featuredEvent.id}`}>
              <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl bg-black h-[350px] md:h-[420px] transition-all duration-700">
                {featuredEvent.image && (
                  <img 
                    src={featuredEvent.image} 
                    alt={featuredEvent.name} 
                    className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-105 opacity-60" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className="bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border border-white/20">PRÓXIMO SHOW</Badge>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight max-w-2xl group-hover:text-orange-400 transition-colors">
                    {featuredEvent.name}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-6 text-white/80">
                    <div className="flex items-center gap-3 text-sm">
                       <Calendar className="w-4 h-4 text-orange-500" />
                       <p className="font-bold">{new Date(featuredEvent.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    {featuredEvent.locationCity && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <p className="font-bold">{featuredEvent.locationCity}, {featuredEvent.locationUf}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Tabs Estilizadas (Segmented Pill) */}
        <Tabs defaultValue="events" className="mt-12">
          <div className="flex items-center justify-center mb-12">
            <TabsList className="bg-white/40 dark:bg-zinc-900 p-1 rounded-full border border-gray-100 dark:border-white/5 h-12 md:h-14 inline-flex shadow-md">
              <TabsTrigger 
                value="events" 
                className="rounded-full px-7 md:px-10 h-full gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black uppercase text-[9px] md:text-[11px] tracking-widest transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Eventos
              </TabsTrigger>
              
              {/* Ocultar "Sobre" se vazio */}
              {org.description && (
                <TabsTrigger 
                  value="about" 
                  className="rounded-full px-7 md:px-10 h-full gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black uppercase text-[9px] md:text-[11px] tracking-widest transition-all"
                >
                  <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Sobre
                </TabsTrigger>
              )}

              {/* Ocultar "Lineup" se vazio/off */}
              {org.artistsMode && (
                <TabsTrigger 
                  value="artists" 
                  className="rounded-full px-7 md:px-10 h-full gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black uppercase text-[9px] md:text-[11px] tracking-widest transition-all"
                >
                  <Music className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Lineup
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="events" className="outline-none">
            {futureEvents.length === 0 && pastEvents.length === 0 ? (
              <Card className="p-16 text-center rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-zinc-800 bg-transparent">
                <div className="text-5xl mb-4 opacity-10">📅</div>
                <h3 className="text-xl font-black mb-2 opacity-60">Sem eventos no radar</h3>
              </Card>
            ) : (
              <div className="space-y-16">
                {futureEvents.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold mb-8 pl-1 uppercase tracking-widest opacity-40">Próximos Show</h2>
                    <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
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
                    <h2 className="text-lg font-bold mb-8 pl-1 uppercase tracking-widest opacity-20">Passados</h2>
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start opacity-60 grayscale-[0.5]">
                      {pastEvents.slice(0, 8).map((ev) => (
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

          <TabsContent value="about" className="outline-none">
            <Card className="p-10 md:p-12 rounded-[2rem] border-none shadow-lg bg-white dark:bg-zinc-900/50 backdrop-blur-xl">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-black mb-6 opacity-80">Sobre</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base font-medium opacity-90 whitespace-pre-line">
                  {org.description || "Nenhuma descrição disponível ainda."}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-6 border-t border-gray-100 dark:border-white/5">
                  {org.site && (
                    <a href={org.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group/link">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <span className="font-bold text-sm opacity-70 group-hover/link:opacity-100 transition-opacity">Website oficial</span>
                    </a>
                  )}
                  {org.locationText && (
                    <div className="flex items-center gap-3 opacity-50">
                      <MapPin className="w-5 h-5 text-indigo-500" />
                      <span className="font-bold text-sm">{org.locationText}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main >

      {/* Footer Minimalista Fauves */}
      <footer className="mt-40 pb-12 flex flex-col items-center justify-center border-t border-gray-100 dark:border-white/5 pt-12">
         <span className="text-2xl font-black tracking-tighter text-gray-300 dark:text-zinc-700 select-none">
           Fauves
         </span>
         <p className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 dark:text-zinc-600 mt-2">
           Discover the vibe
         </p>
      </footer>

      {showLoginModal && (
        <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => toast({ title: 'Bem-vindo!' })} />
      )}
      <FollowersModal open={showFollowersModal} onClose={() => setShowFollowersModal(false)} followers={followersList} />
    </div >
  );
};

export default OrganizationPublicProfile;
