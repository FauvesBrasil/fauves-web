import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/apiBase';
import { LogOut, Repeat2, User as UserIcon, Ticket, LayoutDashboard, Heart } from "lucide-react";

interface UserDropdownProps {
  userName: string;
  userEmail: string;
  ticketsCount?: number;
  isOrganizerContext?: boolean;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ 
  userName, 
  userEmail, 
  ticketsCount = 0,
  isOrganizerContext = false 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fullImageUrl = useCallback((u: string) => {
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/uploads/')) return apiUrl(u);
    if (u.startsWith('uploads/')) return apiUrl('/' + u);
    return u;
  }, []);

  const photoUrl = user?.photoUrl || '';

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="flex items-center gap-2 bg-[#F6F7F9] dark:bg-[#121212] rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-[#e9eaf0] dark:hover:bg-[#1A1A1A]"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800">
          {photoUrl ? (
            <img
              src={fullImageUrl(photoUrl)}
              alt="avatar"
              className="w-8 h-8 object-cover"
              onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                {(userName || '?').substring(0, 1).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <span className="text-[#091747] dark:text-white font-bold text-[15px] max-sm:hidden">{userName}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={`ml-1 text-[#091747] dark:text-white transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#242424] rounded-xl shadow-lg border border-blue-200 dark:border-[#1F1F1F] z-[9999] flex flex-col text-[#091747] dark:text-white text-[15px] font-bold overflow-hidden shadow-xl">
          
          {isOrganizerContext ? (
            <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 dark:hover:bg-white/5 text-[#091747] dark:text-white transition-colors" onClick={() => { setOpen(false); navigate("/"); }}> 
              <Repeat2 className="w-5 h-5 text-indigo-500" />
              Mudar para participante
            </button>
          ) : (
            <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 dark:hover:bg-white/5 text-[#091747] dark:text-white transition-colors" onClick={() => { setOpen(false); navigate("/organizer-dashboard"); }}> 
              <LayoutDashboard className="w-5 h-5 text-indigo-500" />
              Gerenciar meus eventos
            </button>
          )}

          {!isOrganizerContext && (
            <>
              <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 dark:hover:bg-white/5 border-t border-blue-50 dark:border-[#333] text-[#091747] dark:text-white transition-colors" onClick={() => { setOpen(false); navigate("/profile"); }}>
                <Ticket className="w-5 h-5 text-indigo-500" />
                Ingressos {ticketsCount > 0 && <span className="ml-auto bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs">{ticketsCount}</span>}
              </button>
              <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 dark:hover:bg-white/5 border-t border-blue-50 dark:border-[#333] text-[#091747] dark:text-white transition-colors" onClick={() => { setOpen(false); navigate("/profile"); }}>
                <Heart className="w-5 h-5 text-indigo-500" />
                Seguindo
              </button>
            </>
          )}

          <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 dark:hover:bg-white/5 border-t border-blue-50 dark:border-[#333] text-[#091747] dark:text-white transition-colors" onClick={() => { setOpen(false); navigate("/account-settings"); }}>
            <UserIcon className="w-5 h-5 text-indigo-500" />
            Configurações da conta
          </button>
          
          <button className="flex flex-col items-start gap-1 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 border-t border-blue-50 dark:border-[#333] text-[#EF4118] transition-colors" onClick={handleLogout}>
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Sair
            </span>
            <span className="text-[10px] text-slate-400 font-normal ml-8 truncate max-w-[200px]">{userEmail}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
