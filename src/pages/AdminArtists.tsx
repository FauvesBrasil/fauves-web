import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Mic2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminArtists() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [artists, setArtists] = useState<any[]>([]);
    const [q, setQ] = useState('');
    const [verifiedFilter, setVerifiedFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const loadArtists = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                perPage: '20',
                q,
                verified: verifiedFilter
            });

            const res = await fetch(`/api/admin/artists?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Erro ${res.status}`);
            }

            const data = await res.json();
            if (data.ok) {
                setArtists(data.artists);
                setTotal(data.total);
            } else {
                throw new Error(data.error || 'Falha ao carregar artistas');
            }
        } catch (err: any) {
            setError(err?.message || 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArtists();
    }, [token, page, verifiedFilter]); // Reload on page/filter change

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            loadArtists();
        }, 500);
        return () => clearTimeout(timer);
    }, [q]);

    const toggleVerify = async (artistId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/artist/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    artistId,
                    isVerified: !currentStatus
                })
            });

            const data = await res.json();
            if (data.ok) {
                setArtists(prev => prev.map(a =>
                    a.id === artistId ? { ...a, isVerified: !currentStatus } : a
                ));
                toast({
                    title: currentStatus ? 'Verificação removida' : 'Artista verificado',
                    description: `Status de ${data.artist.name} atualizado com sucesso.`
                });
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar o status.',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 mb-0.5">Gerenciar Artistas</h1>
                    <p className="text-slate-600 text-sm">Verifique e gerencie artistas cadastrados automaticamente</p>
                </div>
                <div className="text-sm text-slate-500">
                    Total: {total} artistas
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        />
                    </div>
                    <select
                        value={verifiedFilter}
                        onChange={e => { setVerifiedFilter(e.target.value); setPage(1); }}
                        className="px-3 h-9 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
                    >
                        <option value="">Todos</option>
                        <option value="true">Verificados</option>
                        <option value="false">Não Verificados</option>
                    </select>
                    <button
                        onClick={loadArtists}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 h-9 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading && artists.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                    <p className="text-slate-600">Carregando artistas...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-red-900 mb-0.5 text-sm">Erro ao carregar</h3>
                            <p className="text-red-700 text-xs">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && artists.length === 0 && (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-10 text-center">
                    <Mic2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-slate-900 mb-1.5">Nenhum artista encontrado</h3>
                    <p className="text-slate-600">Tente ajustar os filtros de busca.</p>
                </div>
            )}

            {!loading && !error && artists.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-16">Foto</th>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Eventos</th>
                                <th className="px-4 py-3">Spotify</th>
                                <th className="px-4 py-3 text-center">Verificado</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {artists.map(artist => (
                                <tr key={artist.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                            {artist.imageUrl ? (
                                                <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Mic2 className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{artist.name}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                                            {artist.eventCount || 0} eventos
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {artist.spotifyUrl ? (
                                            <a
                                                href={artist.spotifyUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Link
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {artist.isVerified ? (
                                            <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <CheckCircle2 className="w-3 h-3" /> Verificado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium">
                                                Não verificado
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleVerify(artist.id, artist.isVerified)}
                                            className={`h-8 text-xs ${artist.isVerified ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}
                                        >
                                            {artist.isVerified ? 'Remover Verificação' : 'Verificar Artista'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Simple Pagination */}
                    <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <div>
                            Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, total)} de {total}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={page * 20 >= total}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
