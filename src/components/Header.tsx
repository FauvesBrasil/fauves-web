import * as React from 'react';
import { Link } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import { useState, useCallback } from 'react';
import LoginModal from './LoginModal';
import { supabase } from '../lib/supabaseClient';
import { fetchApi, apiUrl } from '@/lib/apiBase';

const Header: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState<any>(null); // dados vindos do backend (account-settings)
  const userButtonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  React.useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  // Example logout handler
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(async () => {
      await supabase.auth.signOut();
      setIsLoggingOut(false);
      setShowDropdown(false);
    }, 700);
  };
  // Função para montar URL absoluta de imagem
  const fullImageUrl = useCallback((u: string) => {
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/uploads/')) return apiUrl(u);
    return u;
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      if (!user) return;
      const userId = user.id;
      if (!userId) return;
      const res = await fetchApi('/account-settings', { headers: { 'x-user-id': userId } });
      if (!res.ok) return; // silencioso
      const data = await res.json();
      setProfile(data);
    } catch {
      // ignora falha de perfil
    }
  }, [user]);

  React.useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setProfile(null);
      }
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Carrega/recarega perfil quando user muda
  React.useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Ouve evento global de atualização de perfil
  React.useEffect(() => {
    function handler() { fetchProfile(); }
    window.addEventListener('profile-updated', handler as any);
    return () => window.removeEventListener('profile-updated', handler as any);
  }, [fetchProfile]);

  return (
    <header className="w-full flex justify-between items-center bg-white px-4 py-2 border-b border-[#F1F1F1]" style={{boxSizing: 'border-box'}}>
      <Link to="/" className="flex items-center" aria-label="Ir para início">
  <LogoFauves width={80} className="cursor-pointer" />
      </Link>
      <nav className="flex items-center gap-6 max-md:gap-4 max-sm:hidden">
        <Link to="/">
          <button className="text-[#091747] text-sm font-bold max-md:text-xs hover:text-[#2A2AD7] transition-colors">
            Explorar
          </button>
        </Link>
        <Link to="/create-event">
          <button className="text-[#091747] text-sm font-bold max-md:text-xs hover:text-[#2A2AD7] transition-colors">
            Criar evento
          </button>
        </Link>
        {user ? (
          <div className="relative">
            <button
              ref={userButtonRef}
              className="flex items-center gap-2 bg-[#F6F7F9] rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-[#e9eaf0]"
              onClick={() => setShowDropdown((v: boolean) => !v)}
              aria-haspopup="true"
              aria-expanded={showDropdown ? 'true' : 'false'}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile?.photoUrl ? (
                  <img
                    src={fullImageUrl(profile.photoUrl)}
                    alt="avatar"
                    className="w-8 h-8 object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="avatar" className="w-8 h-8 object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-[#091747]">
                    {(user.user_metadata?.nome || user.user_metadata?.full_name || user.email || '?')
                      .substring(0,1)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[#091747] font-bold text-[15px]">{user.user_metadata?.nome || user.user_metadata?.full_name || user.email}</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="ml-1 text-[#091747]"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showDropdown && (
              <div ref={dropdownRef} className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 flex flex-col text-[#091747] text-[15px] font-bold">
                <Link to="/profile" className="text-left px-5 py-3 hover:bg-gray-50 rounded-t-xl" onClick={() => setShowDropdown(false)}>Ver perfil</Link>
                <Link to="/organizer-dashboard" className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100" onClick={() => setShowDropdown(false)}>
                  Gerenciar meus eventos
                </Link>
                <button className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100">Ingressos (4)</button>
                <button className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100">Seguindo (2)</button>
                <Link to="/account-settings" className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100 block" onClick={() => setShowDropdown(false)}>Configurações de conta</Link>
                <button className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100 rounded-b-xl text-[#EF4118]" onClick={handleLogout}>
                  {isLoggingOut ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-[#EF4118]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span className="ml-2">Saindo...</span>
                    </span>
                  ) : (
                    'Sair'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="w-[68px] h-[33px] flex items-center justify-center bg-[#0205D3] rounded-[95px] hover:bg-[#2A2AD7] transition-colors" onClick={() => setShowLogin(true)}>
            <span className="text-white text-center text-[15px] font-bold">
              Entrar
            </span>
          </button>
        )}
      </nav>
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </header>
  );
};

export default Header;
