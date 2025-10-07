import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Edit, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '../lib/supabaseClient';
import ProfilePageSkeleton from '@/components/skeletons/ProfilePageSkeleton';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    nome?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      if (!data?.user) {
        navigate('/');
      }
      setLoading(false);
    };
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate('/');
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const userName = user?.user_metadata?.nome || user?.user_metadata?.full_name || 'Null';

  if (loading) return <ProfilePageSkeleton />;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-[1352px] mx-auto px-5 py-10 max-md:px-5 max-md:py-5 max-sm:px-4">
  <div className="flex gap-[100px] items-start mx-auto w-fit max-md:flex-col max-md:gap-8 max-md:items-center max-md:text-center max-sm:gap-2.5">
          {/* Profile Section Sticky */}
          <div className="sticky top-24 self-start flex flex-row items-center gap-5">
            <div className="relative">
              <div className="w-[100px] h-[100px] rounded-full bg-[#F7F7F7] border border-[rgba(9,23,71,0.05)] shadow-[0_4px_8px_rgba(9,23,71,0.10)] flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <Avatar className="w-[100px] h-[100px]">
                    <AvatarImage src={user.user_metadata.avatar_url} alt="Profile" />
                    <AvatarFallback className="bg-[#F7F7F7] text-[#091747] text-2xl font-semibold">
                      {userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#D9D9D9]" />
                )}
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-2 max-md:justify-center">
                <h1 className="text-2xl font-semibold text-[#091747] max-sm:text-xl">
                  {userName}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 text-[#091747] hover:bg-transparent"
                >
                  <Edit className="w-[19px] h-[19px]" />
                </Button>
              </div>
              <p className="text-sm font-medium text-[#091747] max-md:text-center">
                16 pedidos • 1 seguindo
              </p>
            </div>
          </div>
          {/* Dados Section */}
          <div className="max-w-[520px] max-md:max-w-full">
            {/* Ingressos Section */}
            <section className="mb-16">
              <h2 className="text-xl font-semibold text-[#091747] mb-5 max-sm:text-lg">
                Ingressos
              </h2>
              {/* Active Ticket */}
              <Card className="mb-2.5 p-0 border-0 bg-[rgba(9,23,71,0.05)] rounded-xl h-20 max-sm:h-[70px]">
                <div className="flex items-center h-full px-5 relative">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Date */}
                    <div className="text-center min-w-[27px]">
                      <div className="text-sm font-medium text-orange-600">JUN</div>
                      <div className="text-xl font-medium text-[#091747]">18</div>
                    </div>
                    {/* Event Image */}
                    <div className="w-[50px] h-[50px] bg-zinc-300 rounded-md max-sm:w-10 max-sm:h-10" />
                    {/* Event Info */}
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-[#091747] mb-1">
                        Nome do evento
                      </h3>
                      <p className="text-xs text-[#091747]">#0000000</p>
                    </div>
                    {/* Status Badge */}
                    <Badge className="bg-[rgba(9,23,71,0.1)] text-[#091747] text-xs font-semibold px-3 py-1 rounded-full border-0">
                      ATIVO PARA USO
                    </Badge>
                  </div>
                  <ChevronRight className="w-[6px] h-[10px] text-[#091747] ml-4" />
                </div>
              </Card>
              {/* Used Ticket */}
              <Card className="mb-5 p-0 border-0 bg-[rgba(9,23,71,0.05)] rounded-xl h-20 max-sm:h-[70px]">
                <div className="flex items-center h-full px-5 relative">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Date */}
                    <div className="text-center min-w-[27px]">
                      <div className="text-sm font-medium text-orange-600">JUN</div>
                      <div className="text-xl font-medium text-[#091747]">18</div>
                    </div>
                    {/* Event Image */}
                    <div className="w-[50px] h-[50px] bg-zinc-300 rounded-md max-sm:w-10 max-sm:h-10" />
                    {/* Event Info */}
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-[#091747] mb-1">
                        Nome do evento
                      </h3>
                      <p className="text-xs text-[#091747]">#0000000</p>
                    </div>
                    {/* Status Badge */}
                    <Badge className="bg-[rgba(234,88,12,0.3)] text-orange-600 text-xs font-semibold px-3 py-1 rounded-full border-0">
                      UTILIZADO
                    </Badge>
                  </div>
                  <ChevronRight className="w-[6px] h-[10px] text-[#091747] ml-4" />
                </div>
              </Card>
              <p className="text-sm text-[#091747] mb-16 max-sm:text-sm">
                Seus ingressos serão arquivados após o encerramento do evento
              </p>
            </section>
            {/* Pedidos Section */}
            <section className="mb-16">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-[#091747] max-sm:text-lg">
                  Pedidos
                </h2>
                {/* Status Filter */}
                <div className="relative">
                  <select className="appearance-none bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm font-semibold text-[rgba(9,23,71,0.3)] pr-8 h-[35px] w-[147px] max-sm:h-8 max-sm:w-[120px]">
                    <option>Status</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-[5px] h-[8px] text-[#091747] pointer-events-none" />
                </div>
              </div>
              {/* Order Card */}
              <Card className="mb-5 p-0 border-0 bg-[rgba(9,23,71,0.05)] rounded-xl h-[130px] max-sm:h-[120px]">
                <div className="flex items-center h-full px-5 relative">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Date */}
                    <div className="text-center min-w-[27px]">
                      <div className="text-sm font-medium text-orange-600">JUN</div>
                      <div className="text-xl font-medium text-[#091747]">18</div>
                    </div>
                    {/* Event Image */}
                    <div className="w-[200px] h-[100px] bg-zinc-300 rounded-md max-sm:w-40 max-sm:h-20" />
                    {/* Event Info */}
                    <div className="flex-1 flex flex-col justify-between h-[84px] py-2">
                      <div>
                        <p className="text-xs text-[#091747] mb-1">
                          Pedido nº 12345678
                        </p>
                        <h3 className="text-base font-semibold text-[#091747]">
                          Nome do evento
                        </h3>
                      </div>
                      <p className="text-xs text-[#091747]">
                        2 ingressos • R$100,00
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-[6px] h-[10px] text-[#091747] ml-4" />
                </div>
              </Card>
              <p className="text-sm text-[#091747] mb-16 max-sm:text-sm">
                Pedidos mais antigos poderão não aparecer mais na sua listagem.
              </p>
            </section>
            {/* Seguindo Section */}
            <section>
              <h2 className="text-xl font-semibold text-[#091747] mb-5 max-sm:text-lg">
                Seguindo
              </h2>
              <Card className="p-0 border-0 bg-[rgba(9,23,71,0.05)] rounded-xl h-20">
                <div className="flex items-center h-full px-5 relative">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Organization Avatar */}
                    <div className="w-[50px] h-[50px] bg-zinc-300 rounded-full max-sm:w-10 max-sm:h-10" />
                    {/* Organization Info */}
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-[#091747] mb-1">
                        Fauves entretenimento
                      </h3>
                      <p className="text-xs text-[#091747]">1.9k seguidores</p>
                    </div>
                  </div>
                  <ChevronRight className="w-[6px] h-[10px] text-[#091747] ml-4" />
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
