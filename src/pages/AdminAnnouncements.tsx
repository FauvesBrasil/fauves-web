import { useState } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminAnnouncements } from '@/hooks/useAdminAnnouncements';

const CATEGORY_LABELS = {
    feature: { label: 'Novidade', color: 'purple' },
    update: { label: 'Atualização', color: 'emerald' },
    news: { label: 'Comunicado', color: 'orange' },
    tip: { label: 'Dica', color: 'yellow' },
};

const TARGET_LABELS = {
    organizer: '🎫 Organizadores',
    customer: '👤 Clientes',
    all: '🌐 Todos',
};

export default function AdminAnnouncements() {
    const navigate = useNavigate();
    const {
        announcements,
        loading,
        error,
        deleteAnnouncement,
        toggleActive,
        fetchAnnouncements,
    } = useAdminAnnouncements();

    const [filterCategory, setFilterCategory] = useState('');
    const [filterTarget, setFilterTarget] = useState('');
    const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar este anúncio?')) return;

        try {
            await deleteAnnouncement(id);
        } catch (err) {
            alert('Erro ao deletar anúncio');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await toggleActive(id);
        } catch (err) {
            alert('Erro ao alterar status do anúncio');
        }
    };

    const applyFilters = () => {
        fetchAnnouncements({
            category: filterCategory || undefined,
            target: filterTarget || undefined,
            active: filterActive,
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                        Anúncios da Plataforma
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        Gerencie os anúncios exibidos no dashboard
                    </p>
                </div>

                <button
                    onClick={() => navigate('/admin/announcements/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Novo Anúncio
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Categoria
                        </label>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todas</option>
                            <option value="feature">Novidade</option>
                            <option value="update">Atualização</option>
                            <option value="news">Comunicado</option>
                            <option value="tip">Dica</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Público
                        </label>
                        <select
                            value={filterTarget}
                            onChange={(e) => setFilterTarget(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todos</option>
                            <option value="organizer">Organizadores</option>
                            <option value="customer">Clientes</option>
                            <option value="all">Todos os públicos</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={filterActive === undefined ? '' : String(filterActive)}
                            onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todos</option>
                            <option value="true">Ativos</option>
                            <option value="false">Inativos</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={applyFilters}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Título
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Categoria
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Público
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Ordem
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {announcements.map((announcement) => {
                                const catInfo = CATEGORY_LABELS[announcement.category as keyof typeof CATEGORY_LABELS];
                                return (
                                    <tr key={announcement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {announcement.title}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                                {announcement.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${catInfo.color}-100 text-${catInfo.color}-800 dark:bg-${catInfo.color}-900 dark:text-${catInfo.color}-200`}>
                                                {catInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {TARGET_LABELS[announcement.target as keyof typeof TARGET_LABELS]}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${announcement.active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {announcement.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                                            {announcement.order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/announcements/${announcement.id}/edit`)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggle(announcement.id)}
                                                    className={`p-2 ${announcement.active ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'} rounded-lg transition-colors`}
                                                    title={announcement.active ? 'Desativar' : 'Ativar'}
                                                >
                                                    {announcement.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(announcement.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Deletar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {announcements.length === 0 && !error && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        Nenhum anúncio cadastrado
                    </div>
                )}

                {error && (
                    <div className="text-center py-12 text-red-500">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
