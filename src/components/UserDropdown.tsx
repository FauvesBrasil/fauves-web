import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Repeat2, User as UserIcon } from "lucide-react";
import { fetchApi, apiUrl } from '@/lib/apiBase';
import { useAuth } from '@/context/AuthContext';

interface UserDropdownProps {
  userName: string; // já recebe user.name ou fallback
  userEmail: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ userName, userEmail }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    // Adapte para seu auth provider
    navigate("/");
  };
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const fullImageUrl = useCallback((u: string) => {
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/uploads/')) return apiUrl(u);
    return u;
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const uid = user?.id;
      if (!uid) { setPhotoUrl(''); return; }
      const res = await fetchApi('/account-settings', { headers: { 'x-user-id': uid } });
      if (!res.ok) return;
      const j = await res.json();
      if (j?.photoUrl) setPhotoUrl(j.photoUrl); else setPhotoUrl('');
    } catch {}
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => {
    const handler = () => loadProfile();
    window.addEventListener('profile-updated', handler as any);
    return () => window.removeEventListener('profile-updated', handler as any);
  }, [loadProfile]);

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
        className="flex items-center gap-2 bg-[#F6F7F9] rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-[#e9eaf0]"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {photoUrl ? (
            <img
              src={fullImageUrl(photoUrl)}
              alt="avatar"
              className="w-8 h-8 object-cover"
              onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }}
            />
          ) : (
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-300">
                <div className="w-full h-full rounded-full bg-gray-300"></div>
              </AvatarFallback>
            </Avatar>
          )}
        </div>
  <span className="text-[#091747] font-bold text-[15px]">{userName}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="ml-1 text-[#091747]">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-blue-200 z-50 flex flex-col text-[#091747] text-[15px] font-bold">
          <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 rounded-t-xl text-[#091747]" onClick={() => navigate("/")}> 
            <Repeat2 className="w-5 h-5" />
            Mudar para participante
          </button>
          <button className="flex items-center gap-3 px-5 py-4 hover:bg-blue-50 border-t border-blue-100 text-[#091747]" onClick={() => navigate("/account-settings")}>
            <UserIcon className="w-5 h-5" />
            Configurações da conta
          </button>
          <button className="flex flex-col items-start gap-1 px-5 py-4 hover:bg-blue-50 border-t border-blue-100 rounded-b-xl text-[#EF4118]" onClick={handleLogout}>
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Sair
            </span>
            <span className="text-xs text-[#091747] font-normal mt-1">{userEmail}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
