import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowLeft } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';
import { AnnouncementCard } from '@/components/AnnouncementsSection';
import { useAdminAnnouncements } from '@/hooks/useAdminAnnouncements';

export default function AdminAnnouncementEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { createAnnouncement, updateAnnouncement } = useAdminAnnouncements();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        category: 'feature' as 'feature' | 'update' | 'news' | 'tip',
        target: 'organizer',
        link: '',
        linkText: 'Saiba mais',
        active: true,
        startDate: '',
        endDate: '',
        order: 0,
    });

    useEffect(() => {
        if (id) {
            loadAnnouncement(id);
        }
    }, [id]);

    const loadAnnouncement = async (announcementId: string) => {
        try {
            setLoading(true);
            const response = await fetchApi(`/api/admin/announcements/${announcementId}`);
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    imageUrl: data.imageUrl || '',
                    category: data.category || 'feature',
                    target: data.target || 'organizer',
                    link: data.link || '',
                    linkText: data.linkText || 'Saiba mais',
                    active: data.active !== undefined ? data.active : true,
                    startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
                    endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
                    order: data.order || 0,
                });
            }
        } catch (error) {
            // no-op
            alert('Erro ao carregar anúncio');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.category) {
            alert('Título, descrição e categoria são obrigatórios');
            return;
        }

        try {
            setLoading(true);

            const data = {
                ...formData,
                imageUrl: formData.imageUrl || null,
                link: formData.link || null,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
            };

            if (id) {
                await updateAnnouncement(id, data);
            } else {
                await createAnnouncement(data);
            }

            navigate('/admin/announcements');
        } catch (error: any) {
            // no-op
            alert(error.message || 'Erro ao salvar anúncio');
        } finally {
            setLoading(false);
        }
    };

    if (loading && id) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/announcements')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {id ? 'Editar Anúncio' : 'Novo Anúncio'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        Preencha os dados do anúncio
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                required
                                placeholder="Ex: Sistema de Embaixadores disponível!"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descrição *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                required
                                placeholder="Descreva brevemente o anúncio..."
                            />
                        </div>

                        {/* Image URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                URL da Imagem
                            </label>
                            <input
                                type="url"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://images.unsplash.com/..."
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Opcional. Use Unsplash ou outra URL de imagem.
                            </p>
                        </div>

                        {/* Category and Target */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Categoria *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="feature">✨ Novidade</option>
                                    <option value="update">📊 Atualização</option>
                                    <option value="news">📢 Comunicado</option>
                                    <option value="tip">💡 Dica</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Público *
                                </label>
                                <select
                                    value={formData.target}
                                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="organizer">🎫 Organizadores</option>
                                    <option value="customer">👤 Clientes</option>
                                    <option value="all">🌐 Todos</option>
                                </select>
                            </div>
                        </div>

                        {/* Link and Link Text */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Link
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="/marketing/embaixadores"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Texto do Link
                                </label>
                                <input
                                    type="text"
                                    value={formData.linkText}
                                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Saiba mais"
                                />
                            </div>
                        </div>

                        {/* Active, Order */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Ativo
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Ordem
                                </label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Data início
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Data fim
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Criar')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/announcements')}
                                className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Preview
                    </h2>
                    <div className="space-y-4">
                        <AnnouncementCard
                            id="preview"
                            title={formData.title || 'Título do anúncio'}
                            description={formData.description || 'Descrição do anúncio aparecerá aqui...'}
                            imageUrl={formData.imageUrl || undefined}
                            category={formData.category}
                            link={formData.link || undefined}
                            linkText={formData.linkText}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
