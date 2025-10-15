import * as React from 'react';
import { Link } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import LocationSelector from '@/components/LocationSelector';
import SearchBar from '@/components/SearchBar';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import RequireOrganization from './RequireOrganization';
import { useOrganization } from '@/context/OrganizationContext';
import { fetchApi, apiUrl } from '@/lib/apiBase';

const Header: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState<any>(null); // dados vindos do backend (account-settings)
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { refresh, addOrganization } = useOrganization();
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
    setTimeout(() => {
      logout(); // limpa token JWT e estado do usuário
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

  // Remove dependência do Supabase para exibição do usuário logado

  // Carrega/recarega perfil quando user muda
  React.useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Ouve evento global de atualização de perfil
  React.useEffect(() => {
    function handler() { fetchProfile(); }
    window.addEventListener('profile-updated', handler as any);
    return () => window.removeEventListener('profile-updated', handler as any);
  }, [fetchProfile]);

  return (
    <header className="w-full flex items-center bg-white px-4 py-2 border-b border-[#F1F1F1] justify-between" style={{boxSizing: 'border-box'}}>
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center" aria-label="Ir para início">
          <LogoFauves width={80} className="cursor-pointer" />
        </Link>
        <div className="flex items-center gap-4 ml-10">
          <LocationSelector />
          <SearchBar />
        </div>
      </div>
      <nav className="flex items-center gap-6 max-md:gap-4">
        <Link to="/" className="max-sm:hidden">
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
                ) : (
                  <span className="text-xs font-semibold text-[#091747]">
                    {(user.name ? user.name : (user.email || '?')).substring(0,1).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[#091747] font-bold text-[15px] max-sm:hidden">{user.name ? user.name.split(' ')[0] : (user.email ? user.email.split('@')[0] : '')}</span>
              <span className="relative w-5 h-5 flex items-center justify-center">
                <svg
                  width="20" height="20" fill="none" viewBox="0 0 24 24"
                  className={`absolute transition-all duration-300 ease-in-out text-[#091747] ${showDropdown ? 'opacity-0 rotate-45 scale-75' : 'opacity-100 rotate-0 scale-100'}`}
                  style={{ left: 0, top: 0 }}
                >
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg
                  width="20" height="20" fill="none" viewBox="0 0 24 24"
                  className={`absolute transition-all duration-300 ease-in-out text-[#091747] ${showDropdown ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-75'}`}
                  style={{ left: 0, top: 0 }}
                >
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              ref={dropdownRef}
              className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 flex flex-col text-[#091747] text-[15px] font-bold
                transition-all duration-300 ease-in-out
                ${showDropdown ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}
                max-sm:fixed max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:rounded-none max-sm:mt-0 max-sm:h-screen max-sm:z-[9999] max-sm:top-[56px]`}
              style={{ top: undefined }}
            >
              <Link to="/profile" className="text-left px-5 py-3 hover:bg-gray-50 rounded-t-xl" onClick={() => setShowDropdown(false)}>Ver perfil</Link>
              <Link to="/organizer-dashboard" className="text-left px-5 py-3 hover:bg-gray-50 border-t border-gray-100" onClick={() => setShowDropdown(false)}>
                Gerenciar meus eventos
              </Link>
              {/* '+ Criar organização' button removed as requested */}
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
          </div>
        ) : (
          <button className="w-[68px] h-[33px] flex items-center justify-center bg-[#0205D3] rounded-[95px] hover:bg-[#2A2AD7] transition-colors max-sm:w-auto max-sm:px-4 max-sm:h-9" onClick={() => setShowLogin(true)}>
            <span className="text-white text-center text-[15px] font-bold">
              Entrar
            </span>
          </button>
        )}
      </nav>
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      {showCreateOrg && (
        <RequireOrganization
          onCreated={(org) => {
            try {
              const createdObj = org?.organization || org || null;
              const createdId = createdObj?.id || createdObj?.organizationId || org?.id || org?.organizationId || null;
              const createdName = createdObj?.name || org?.name || '';
              const createdLogo = createdObj?.logoUrl || createdObj?.logo || org?.logoUrl || org?.logo || '';
              if (createdId) {
                try { addOrganization({ id: createdId, name: createdName, logoUrl: createdLogo }); } catch(_) {}
              }
            } catch (e) { /* ignore */ }
            try { return refresh(); } catch (e) { return Promise.resolve(); }
          }}
          onClose={() => setShowCreateOrg(false)}
        />
      )}
    </header>
  );
};

export default Header;
