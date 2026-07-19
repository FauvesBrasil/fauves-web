import React, { useState, useEffect } from 'react';
import { Flame, Check, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';

const generateSId = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface InterestButtonProps {
    eventId: string;
    variant?: 'card' | 'detail';
    showText?: boolean;
}

const InterestButton: React.FC<InterestButtonProps> = ({ eventId, variant = 'card', showText = true }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [count, setCount] = useState<number | null>(null);
    const [isInterested, setIsInterested] = useState(false);
    const [loading, setLoading] = useState(false);

    // Get or create session ID for non-logged users
    const getSessionId = () => {
        let sid = localStorage.getItem('fauves_session_id');
        if (!sid) {
            sid = generateSId();
            localStorage.setItem('fauves_session_id', sid);
        }
        return sid;
    };

    const fetchData = async () => {
        try {
            const sid = getSessionId();
            const query = user?.id ? `userId=${user.id}` : `sessionId=${sid}`;
            
            const [countRes, statusRes] = await Promise.all([
                fetch(apiUrl(`/api/event-interest/count/${eventId}`)),
                fetch(apiUrl(`/api/event-interest/status/${eventId}?${query}`))
            ]);

            if (countRes.ok) {
                const data = await countRes.json();
                setCount(data.count);
            }

            if (statusRes.ok) {
                const data = await statusRes.json();
                setIsInterested(data.interested);
            }
        } catch (error) {
            // no-op
        }
    };

    useEffect(() => {
        fetchData();
    }, [eventId, user?.id]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Optimistic update
        const previousInterested = isInterested;
        const previousCount = count;
        
        const nextInterested = !previousInterested;
        setIsInterested(nextInterested);
        setCount(prev => (prev !== null ? (nextInterested ? prev + 1 : Math.max(0, prev - 1)) : null));

        try {
            const sid = getSessionId();
            const query = user?.id ? `userId=${user.id}` : `sessionId=${sid}`;
            
            const res = await fetch(apiUrl(`/api/event-interest/toggle/${eventId}?${query}`), {
                method: 'POST'
            });

            if (!res.ok) {
                // Revert on error
                setIsInterested(previousInterested);
                setCount(previousCount);
                
                toast({
                    title: 'Erro',
                    description: 'Não foi possível processar sua solicitação.',
                    variant: 'destructive'
                });
            } else {
                // Validar se o estado do servidor bate (opcional, mas bom pra consistência)
                const data = await res.json();
                if (data.interested !== nextInterested) {
                    setIsInterested(data.interested);
                    // O count já foi ajustado, se quisermos ser hyper-precisos podemos buscar o count de novo
                    // mas o ajuste local +1/-1 geralmente é suficiente para o feedback imediato.
                }

                toast({
                    title: nextInterested ? 'Interesse registrado!' : 'Interesse removido',
                    description: nextInterested ? 'Você demonstrou interesse neste evento.' : 'Seu interesse foi removido.',
                });
            }
        } catch (error) {
            // Revert on network error
            setIsInterested(previousInterested);
            setCount(previousCount);
            
            toast({
                title: 'Erro',
                description: 'Verifique sua conexão e tente novamente.',
                variant: 'destructive'
            });
        }
    };

    if (variant === 'detail') {
        return (
            <div className="flex items-center gap-3">
                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all duration-300 ${
                        isInterested 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100'
                    }`}
                >
                    {isInterested ? (
                        <>
                            <Check size={18} strokeWidth={3} />
                            Interessado
                        </>
                    ) : (
                        <>
                            <Flame size={18} fill={loading ? 'none' : 'currentColor'} className={loading ? 'animate-pulse' : ''} />
                            Tenho interesse
                        </>
                    )}
                </button>
                
                <div className="flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-500">
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="flex items-center gap-1.5">
                        <Users size={16} className="text-orange-400" />
                        {count === null ? '...' : count === 0 ? 'Seja o primeiro!' : `${count} interessados`}
                    </span>
                </div>
            </div>
        );
    }

    // Default variant: 'card' (compact)
    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 shadow-sm ${
                isInterested 
                ? 'bg-green-500 text-white' 
                : 'bg-white/90 backdrop-blur-sm text-orange-600 hover:bg-white'
            }`}
            title={isInterested ? 'Interessado' : 'Tenho interesse'}
        >
            {isInterested ? (
                <Check size={14} strokeWidth={3} />
            ) : (
                <Flame size={14} fill={isInterested ? 'currentColor' : 'none'} className={loading ? 'animate-pulse' : ''} />
            )}
            <span className={variant === 'card' ? 'max-sm:hidden' : ''}>
                {isInterested ? 'Interessado' : count && count > 0 ? count : 'Tenho interesse'}
            </span>
        </button>
    );
};

export default InterestButton;
