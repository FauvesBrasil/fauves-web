import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Home, Ticket, User as UserIcon } from "lucide-react";
import { fetchApi, apiUrl } from '@/lib/apiBase';
import { useAuth } from '@/context/AuthContext';

interface HelpUserDropdownProps {
    userName: string;
    userEmail: string;
}

const HelpUserDropdown: React.FC<HelpUserDropdownProps> = ({ userName, userEmail }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Limpa o token do localStorage
            localStorage.removeItem('AUTH_TOKEN_V1');

            // Chama o logout do contexto se existir
            if (logout) {
                await logout();
            }

            // Navega para home
            navigate("/");
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Mesmo com erro, limpa o token e redireciona
            localStorage.removeItem('AUTH_TOKEN_V1');
            navigate("/");
        }
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
        } catch { }
    }, [user?.id]);

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
                className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-zinc-200 dark:hover:bg-zinc-700"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {photoUrl ? (
                        <img
                            src={fullImageUrl(photoUrl)}
                            alt="avatar"
                            className="w-8 h-8 object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                    ) : (
                        <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gray-300">
                                <div className="w-full h-full rounded-full bg-gray-300"></div>
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
                <span className="text-zinc-900 dark:text-white font-semibold text-sm max-sm:hidden">{userName}</span>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="ml-1 text-zinc-900 dark:text-white">
                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <div ref={dropdownRef} className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 flex flex-col text-zinc-900 dark:text-white text-sm font-medium">
                    <button
                        className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-t-xl transition-colors"
                        onClick={() => { setOpen(false); navigate("/"); }}
                    >
                        <Home className="w-5 h-5" />
                        Voltar para a Fauves
                    </button>
                    <button
                        className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-t border-zinc-200 dark:border-zinc-700 transition-colors"
                        onClick={() => { setOpen(false); navigate("/ajuda/tickets"); }}
                    >
                        <Ticket className="w-5 h-5" />
                        Meus Tickets
                    </button>
                    <button
                        className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-t border-zinc-200 dark:border-zinc-700 transition-colors"
                        onClick={() => { setOpen(false); navigate("/account-settings"); }}
                    >
                        <UserIcon className="w-5 h-5" />
                        Configurações da Conta
                    </button>
                    <button
                        className="flex flex-col items-start gap-1 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-zinc-200 dark:border-zinc-700 rounded-b-xl text-red-600 dark:text-red-400 transition-colors"
                        onClick={handleLogout}
                    >
                        <span className="flex items-center gap-3 font-semibold">
                            <LogOut className="w-5 h-5" />
                            Sair
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-normal mt-1">{userEmail}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default HelpUserDropdown;
