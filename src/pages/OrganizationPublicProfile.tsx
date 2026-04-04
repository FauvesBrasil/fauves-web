import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Facebook, Twitter, Phone, ArrowLeft, ChevronRight
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
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
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

        // Follow status
        if (user?.id && token) {
          try {
            const fRes = await fetch(apiUrl(`/api/organization/${data.id}/follow`), { headers: { Authorization: `Bearer ${token}` } });
            if (fRes.ok) {
              const f = await fRes.json();
              if (mounted) setFollowing(!!f.following);
            }
          } catch (e) { }
        }

        // Followers count
        try {
          const cRes = await fetch(apiUrl(`/api/organization/${data.id}/followers/count`));
          if (cRes.ok) {
            const c = await cRes.json();
            if (mounted) setFollowersCount(Number(c.count || 0));
          }
        } catch (e) {
          console.warn('followers count fetch failed', e);
        }

        // Events
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0b0b] text-gray-900 dark:text-white pb-32">
      <Header />

      {/* Hero Section Master */}
      <div className="relative w-full overflow-hidden">
        {/* Banner com Parallax Suave */}
        <div className="relative h-[350px] md:h-[450px] w-full group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-orange-950 animate-gradient-x" />
          {org.coverUrl && (
            <img 
              src={org.coverUrl} 
              alt={org.name} 
              className="w-full h-full object-cover mix-blend-overlay opacity-50 transition-transform duration-[5s] group-hover:scale-105" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0b0b0b] via-transparent to-black/20" />
          
          {/* Botão de Voltar Discreto */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-8 left-8 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/20 transition-all text-white z-20 group/back"
          >
            <ArrowLeft className="w-6 h-6 transform group-hover/back:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Informações da Marca (Centralizadas) */}
        <div className="max-w-[1100px] mx-auto px-6 -mt-32 md:-mt-44 relative z-10 flex flex-col items-center text-center">
          {/* Logo Interativa Premium */}
          <div className="relative group cursor-pointer" onClick={handleFollow}>
            <div className="absolute inset-0 bg-orange-600 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
            <Avatar className="w-36 h-36 md:w-48 md:h-48 border-[10px] border-white dark:border-gray-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] rounded-[2.5rem] relative z-10 transform transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3">
              <AvatarImage src={org.logoUrl || ''} alt={org.name} className="object-cover" />
              <AvatarFallback className="text-5xl md:text-6xl font-black bg-gradient-to-br from-orange-400 to-pink-600 text-white">
                {(org.name || 'O')[0]}
              </AvatarFallback>
            </Avatar>
            
            {/* Coração Funcional c/ Feedback */}
            <div 
              className={`absolute -bottom-3 -right-3 p-3.5 rounded-[1.2rem] shadow-2xl border-[3px] border-white dark:border-gray-900 z-20 transition-all duration-500 hover:scale-125 ${
                following 
                  ? 'bg-orange-600 text-white scale-110' 
                  : 'bg-white dark:bg-gray-800 text-gray-400 opacity-80'
              }`}
            >
              <Heart className={`w-7 h-7 ${following ? 'fill-current animate-pulse' : ''}`} />
            </div>
          </div>

          <div className="mt-10 mb-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 pb-2">
              {org.name}
            </h1>
            {org.bio && (
              <p className="text-gray-600 dark:text-gray-400 mt-5 max-w-2xl text-xl md:text-2xl font-medium leading-relaxed italic opacity-80">
                "{org.bio}"
              </p>
            )}
          </div>

          {/* Stats Revisitados */}
          <div className="flex items-center gap-10 md:gap-16 mt-4">
            <div className="flex flex-col items-center group/stat">
              <span className="text-3xl font-black text-gray-900 dark:text-white transition-colors group-hover/stat:text-orange-600">{events.length}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">Eventos</span>
            </div>
            <div className="flex flex-col items-center group/stat cursor-pointer" onClick={() => handleFetchFollowers(org.id)}>
              <span className="text-3xl font-black text-gray-900 dark:text-white transition-colors group-hover/stat:text-orange-600">{followersCount || 0}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">Seguidores</span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex items-center gap-5 mt-12 w-full max-w-lg">
            <Button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 h-16 text-lg font-black rounded-[1.5rem] shadow-2xl transition-all duration-500 active:scale-95 ${
                following 
                  ? 'bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-800' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/30 hover:shadow-orange-600/50'
              }`}
            >
              {followLoading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : following ? (
                'Seguindo'
              ) : (
                'Seguir Marca'
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleShare}
              className="h-16 w-16 rounded-[1.5rem] border-2 hover:bg-white dark:hover:bg-zinc-900 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Share2 className="w-7 h-7" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bio Hub (Links Sociais Premium) */}
      <div className="max-w-[1100px] mx-auto px-6 mt-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-5">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 hover:border-orange-500 shadow-sm hover:shadow-2xl rounded-[2.5rem] transition-all duration-500 hover:-translate-y-3 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 group-hover:bg-orange-600/10 mb-4 transition-colors ${link.color}`}>
                <link.icon className="w-7 h-7 transform group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="text-[11px] font-black tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">{link.label}</span>
              <ExternalLink className="w-4 h-4 absolute top-5 right-5 opacity-0 group-hover:opacity-40 transition-opacity" />
            </a>
          ))}
          {org.site && !socialLinks.find(l => l.label === 'Website') && (
            <a
              href={org.site}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 hover:border-orange-500 shadow-sm hover:shadow-2xl rounded-[2.5rem] transition-all duration-300 hover:-translate-y-3"
            >
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 group-hover:bg-orange-600/10 mb-4 text-blue-500">
                <Globe className="w-7 h-7 transform group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] font-black tracking-widest uppercase opacity-60">Website</span>
              <ExternalLink className="w-4 h-4 absolute top-5 right-5 opacity-0 group-hover:opacity-40" />
            </a>
          )}
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-6 mt-32">
        {/* Featured Card Ultra-Premium */}
        {featuredEvent && (
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-10 pl-2">
              <div className="h-10 w-1.5 bg-orange-600 rounded-full" />
              <h2 className="text-4xl font-black tracking-tighter">O Próximo Grande Momento</h2>
            </div>
            <Link to={`/events/${featuredEvent.slug || featuredEvent.id}`}>
              <div className="relative group overflow-hidden rounded-[3.5rem] shadow-[0_48px_100px_-12px_rgba(0,0,0,0.5)] bg-black h-[500px] md:h-[650px] transition-all duration-700 hover:shadow-orange-600/20">
                {featuredEvent.image && (
                  <img 
                    src={featuredEvent.image} 
                    alt={featuredEvent.name} 
                    className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110 opacity-70" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16">
                  <div className="flex flex-wrap items-center gap-4 mb-8">
                    <Badge className="bg-orange-600 text-white text-[11px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full border-2 border-white/20 shadow-xl">EXPERIÊNCIA EM DESTAQUE</Badge>
                    <div className="flex items-center gap-2.5 px-6 py-2 bg-white/5 backdrop-blur-2xl rounded-full text-white text-[11px] font-black border border-white/10 uppercase tracking-widest">
                      <Clock className="w-4 h-4 text-orange-500" />
                      Reserve agora
                    </div>
                  </div>
                  
                  <h2 className="text-6xl md:text-8xl font-black text-white mb-8 drop-shadow-2xl leading-[0.95] tracking-tighter max-w-4xl group-hover:text-orange-400 transition-all duration-500">
                    {featuredEvent.name}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-10 text-white/80">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-orange-600/20 backdrop-blur-md rounded-2xl border border-orange-600/30">
                        <Calendar className="w-6 h-6 text-orange-500" />
                       </div>
                       <div>
                         <p className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Data</p>
                         <p className="text-xl font-bold">{new Date(featuredEvent.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>
                    {featuredEvent.locationCity && (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/20 backdrop-blur-md rounded-2xl border border-indigo-600/30">
                          <MapPin className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Local</p>
                          <p className="text-xl font-bold">{featuredEvent.locationCity}, {featuredEvent.locationUf}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Price Button */}
                <div className="absolute top-12 right-12 hidden lg:flex transform group-hover:-translate-y-4 transition-transform duration-700">
                  <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 text-center border-t-[6px] border-orange-600 w-72">
                    <div className="space-y-1">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Lote Atual</p>
                      <p className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">R$ --,--</p>
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700 h-16 w-full rounded-[1.5rem] font-black text-base px-8 shadow-[0_20px_40px_-10px_rgba(234,88,12,0.4)] transition-all">
                      PEGAR INGRESSO
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Novo Sistema de Tabs (Pill Style) */}
        <Tabs defaultValue="events" className="mt-16">
          <div className="flex items-center justify-center mb-16">
            <TabsList className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-2 rounded-[2rem] border border-gray-100 dark:border-white/5 h-16 inline-flex shadow-xl">
              <TabsTrigger 
                value="events" 
                className="rounded-full px-10 h-full gap-3 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-black uppercase text-[11px] tracking-widest"
              >
                <CalendarDays className="w-5 h-5" />
                Eventos
              </TabsTrigger>
              <TabsTrigger 
                value="about" 
                className="rounded-full px-10 h-full gap-3 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-black uppercase text-[11px] tracking-widest"
              >
                <Globe className="w-5 h-5" />
                A Marca
              </TabsTrigger>
              {org.artistsMode && (
                <TabsTrigger 
                  value="artists" 
                  className="rounded-full px-10 h-full gap-3 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-black uppercase text-[11px] tracking-widest"
                >
                  <Music className="w-5 h-5" />
                  Lineup
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="events" className="mt-0 outline-none">
            {futureEvents.length === 0 && pastEvents.length === 0 ? (
              <Card className="p-24 text-center rounded-[4rem] border-2 border-dashed border-gray-200 dark:border-zinc-800 bg-transparent">
                <div className="text-8xl mb-8 opacity-20">📅</div>
                <h3 className="text-3xl font-black mb-4">Silêncio antes do show...</h3>
                <p className="text-gray-500 mb-10 max-w-md mx-auto text-lg leading-relaxed">
                  Esta organização está preparando novidades incríveis. 🤫
                </p>
                {!following && (
                  <Button onClick={handleFollow} className="h-16 px-10 rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 shadow-2xl">
                    ME AVISE QUANDO SAIR
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-32">
                {futureEvents.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="flex items-center gap-4 mb-12 pl-2">
                      <div className="h-8 w-1 bg-orange-600 rounded-full" />
                      <h2 className="text-3xl font-black tracking-tight">Próximos Encontros</h2>
                    </div>
                    <div className="flex flex-wrap gap-8 md:gap-12 justify-center lg:justify-start">
                      {futureEvents.map((ev) => (
                        <div key={ev.id} className="transform hover:-translate-y-2 transition-transform duration-500">
                          <EventCard
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                    <div className="flex items-center gap-4 mb-12 pl-2 opacity-50">
                      <div className="h-8 w-1 bg-gray-400 rounded-full" />
                      <h2 className="text-3xl font-black tracking-tight uppercase text-gray-500">O que já rolou</h2>
                    </div>
                    <div className="flex flex-wrap gap-6 md:gap-10 justify-center lg:justify-start opacity-70 grayscale-[0.4] hover:grayscale-0 transition-all duration-700">
                      {pastEvents.slice(0, 12).map((ev) => (
                        <div key={ev.id} className="transform hover:-translate-y-2 transition-transform duration-500">
                          <EventCard
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="animate-in fade-in zoom-in-95 duration-500 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-12">
                <Card className="p-10 md:p-20 rounded-[4rem] border-none shadow-2xl bg-white dark:bg-zinc-900/50 backdrop-blur-xl">
                  <div className="max-w-4xl">
                    <h3 className="text-5xl font-black tracking-tighter mb-12">História de {org.name}</h3>

                    {/* Tags Estilizadas */}
                    {tags.length > 0 && (
                      <div className="mb-12">
                        <div className="flex flex-wrap gap-3">
                          {tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="prose prose-xl dark:prose-invert prose-orange-600 max-w-none">
                      {org.description ? (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-2xl font-medium opacity-90 whitespace-pre-line">
                          {org.description}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic text-2xl">
                          Nenhuma descrição disponível ainda. Fique atento! ✨
                        </p>
                      )}
                    </div>

                    {/* Info de Contato Ultra-Clean */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20 p-10 bg-black/5 dark:bg-white/5 rounded-[3rem] border border-black/5 dark:border-white/5">
                      {org.site && (
                        <a href={org.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group/link">
                          <div className="p-4 bg-white dark:bg-zinc-800 rounded-3xl shadow-xl group-hover/link:scale-110 transition-transform">
                            <Globe className="w-8 h-8 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Website</p>
                            <p className="font-bold text-xl group-hover/link:text-orange-500 transition-colors">Visitar Site oficial</p>
                          </div>
                        </a>
                      )}
                      {org.contactEmail && org.showContactEmail && (
                        <a href={`mailto:${org.contactEmail}`} className="flex items-center gap-6 group/link">
                          <div className="p-4 bg-white dark:bg-zinc-800 rounded-3xl shadow-xl group-hover/link:scale-110 transition-transform">
                            <Mail className="w-8 h-8 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                            <p className="font-bold text-xl truncate group-hover/link:text-orange-500 transition-colors">{org.contactEmail}</p>
                          </div>
                        </a>
                      )}
                      {org.locationText && (
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-white dark:bg-zinc-800 rounded-3xl shadow-xl">
                            <MapPin className="w-8 h-8 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Base</p>
                            <p className="font-bold text-xl">{org.locationText}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {org.artistsMode && (
            <TabsContent value="artists" className="animate-in fade-in zoom-in-95 duration-500 outline-none">
              <Card className="p-32 text-center rounded-[4rem] border-none bg-gradient-to-br from-zinc-900 to-black text-white shadow-2xl">
                <div className="text-9xl mb-12 animate-bounce">🎸</div>
                <h3 className="text-5xl font-black tracking-tighter mb-6">Lineup em Construção</h3>
                <p className="text-gray-400 text-2xl max-w-2xl mx-auto font-medium">
                  Os artistas que farão história com a gente serão revelados em breve. Prepare o coração! 🤘✨
                </p>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main >

      <Footer />

      {showLoginModal && (
        <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => toast({ title: 'Bem-vindo!' })} />
      )}
      <FollowersModal open={showFollowersModal} onClose={() => setShowFollowersModal(false)} followers={followersList} />
    </div >
  );
};

export default OrganizationPublicProfile;
