import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LoginModal from '@/components/LoginModal';
import FollowersModal from '@/components/FollowersModal';
import { useToast } from '@/hooks/use-toast';

const OrganizationPublicProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = React.useState<any | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
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
        const res = await fetch(`/api/organization/slug/${encodeURIComponent(slug)}`);
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
        // follow status
        if (user?.id && token) {
          try {
            const fRes = await fetch(`/api/organization/${data.id}/follow`, { headers: { Authorization: `Bearer ${token}` } });
            if (fRes.ok) {
              const f = await fRes.json();
              if (mounted) setFollowing(!!f.following);
            }
          } catch (e) {}
        }
        try {
          const cRes = await fetch(`/api/organization/${data.id}/followers/count`);
          if (cRes.ok) {
            const c = await cRes.json();
            if (mounted) setFollowersCount(Number(c.count || 0));
          }
        } catch (e) {
          console.warn('followers count fetch failed', e);
        }
        try {
          const evRes = await fetch(`/api/organization/${data.id}/events`);
          if (evRes.ok) {
            const ev = await evRes.json();
            if (mounted) setEvents(ev || []);
          }
        } catch (e) {
          console.warn('events fetch failed', e);
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
  }, [slug]);

  const handleFetchFollowers = async (orgId: string) => {
    try {
      const r = await fetch(`/api/organization/${encodeURIComponent(orgId)}/followers`);
      if (r.ok) {
        const j = await r.json();
        setFollowersList(j || []);
      } else setFollowersList([]);
    } catch (e) { setFollowersList([]); }
    setShowFollowersModal(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0b] text-indigo-950 dark:text-white">
      <Header />
      <main className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="h-36 md:h-44 rounded-lg overflow-hidden bg-gradient-to-r from-indigo-600 to-pink-500 relative">
            {/* dark overlay to dim the banner in dark mode */}
            <div className="hidden dark:block absolute inset-0 z-0 rounded-lg" style={{ background: 'linear-gradient(to right, rgba(11,11,11,0.6), rgba(11,11,11,0.8))' }} />
            <div className="absolute left-6 bottom-4 flex items-center gap-4">
              <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                <AvatarImage src={org?.logoUrl || ''} alt={org?.name || 'Organização'} />
                <AvatarFallback>{(org?.name || 'O')[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-white">{loading ? 'Carregando...' : org?.name || 'Organização'}</h1>
                <p className="text-sm text-white/80">{org ? `${events.length} eventos` : ''}</p>
              </div>
            </div>
            <div className="absolute right-6 bottom-4">
              <Button
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-sm hover:bg-white/20"
                onClick={async () => {
                  if (!org?.id) return;
                  if (!user?.id || !token) {
                    setShowLoginModal(true);
                    return;
                  }
                  if (followLoading) return;
                  setFollowLoading(true);
                  try {
                    if (following) {
                      const r = await fetch(`/api/organization/${org.id}/follow`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                      if (r.ok) {
                        setFollowing(false);
                        setFollowersCount((c) => Math.max(0, (c || 0) - 1));
                        toast({ title: 'Deixou de seguir', description: 'Você deixou de seguir a organização.' });
                      } else {
                        const txt = await r.text();
                        toast({ title: 'Erro', description: txt || 'Falha ao deixar de seguir', variant: 'destructive' as any });
                      }
                    } else {
                      const r = await fetch(`/api/organization/${org.id}/follow`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
                      if (r.ok) {
                        setFollowing(true);
                        setFollowersCount((c) => (c || 0) + 1);
                        toast({ title: 'Seguindo', description: 'Agora você segue esta organização.' });
                      } else {
                        const txt = await r.text();
                        toast({ title: 'Erro', description: txt || 'Falha ao seguir', variant: 'destructive' as any });
                      }
                    }
                  } catch (e:any) {
                    console.warn('follow toggle failed', e);
                    toast({ title: 'Erro', description: e?.message || 'Erro ao processar ação', variant: 'destructive' as any });
                  } finally {
                    setFollowLoading(false);
                  }
                }}
                disabled={followLoading}
              >
                {followLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                ) : (following ? 'Seguindo' : 'Seguir')}
              </Button>
            </div>

            <div className="absolute right-40 bottom-6 text-white/90 cursor-pointer" onClick={() => org?.id && handleFetchFollowers(org.id)}>
              {followersCount != null ? `${followersCount} seguidores` : '— seguidores'}
            </div>

            {showLoginModal && (
              <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => { toast({ title: 'Bem-vindo', description: 'Login efetuado' }); }} />
            )}
            <FollowersModal open={showFollowersModal} onClose={() => setShowFollowersModal(false)} followers={followersList} />
          </div>
        </div>

        {error ? (
          <div className="mt-12 text-center text-red-600">{error}</div>
        ) : null}

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-[#091747] dark:text-white mb-3">Coleções</h2>
          <div className="space-y-3">
            <Card className="p-4 bg-white/40 dark:bg-[#242424]/80 backdrop-blur-md border border-white/30 dark:border-[#1F1F1F]">
              <div className="flex items-center gap-4">
                <div className="w-20 h-12 bg-gradient-to-r from-indigo-600 to-pink-400 rounded-md dark:from-indigo-800 dark:to-pink-900" />
                <div>
                  <div className="text-sm font-semibold text-[#EF4118]">Coleção pública</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">—</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#091747] dark:text-white mb-4">Próximos eventos</h2>
          <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
            {loading ? (
              <div className="col-span-4">Carregando eventos...</div>
            ) : events.length === 0 ? (
              <div className="col-span-4">Nenhum evento encontrado.</div>
            ) : (
              events.map((ev) => (
                <Card key={ev.id} className="p-0 overflow-hidden bg-white/40 dark:bg-[#242424]/80 border border-white/30 dark:border-[#1F1F1F]">
                  <div className="h-32 bg-zinc-100 dark:bg-[#1b1b1b]" />
                  <div className="p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{ev.startDate || ev.startDate}</div>
                    <h3 className="font-semibold text-base text-[#EF4118]">{ev.name || ev.title}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">{ev.locationCity || ev.location}</div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OrganizationPublicProfile;
