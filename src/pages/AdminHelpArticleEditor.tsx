import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Eye } from 'lucide-react';
import { sanitizeRichHtml } from '@/lib/sanitizeHtml';


interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function AdminHelpArticleEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [formData, setFormData] = useState({
        categoryId: '',
        title: '',
        slug: '',
        summary: '',
        content: '',
        popular: false,
        published: true,
        order: 0,
    });

    useEffect(() => {
        loadCategories();
        if (isEditing) {
            loadArticle();
        }
    }, [id]);

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/admin/help/categories');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            // no-op
        }
    };

    const loadArticle = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/admin/help/articles/${id}`);
            const data = await response.json();

            setFormData({
                categoryId: data.categoryId,
                title: data.title,
                slug: data.slug,
                summary: data.summary,
                content: data.content,
                popular: data.popular,
                published: data.published,
                order: data.order,
            });
        } catch (error) {
            // no-op
            alert('Erro ao carregar artigo');
            navigate('/admin/ajuda/artigos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = isEditing
                ? `http://localhost:4000/api/admin/help/articles/${id}`
                : 'http://localhost:4000/api/admin/help/articles';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                navigate('/admin/ajuda/artigos');
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao salvar artigo');
            }
        } catch (error) {
            // no-op
            alert('Erro ao salvar artigo');
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleTitleChange = (title: string) => {
        setFormData({
            ...formData,
            title,
            slug: generateSlug(title),
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-500">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                        {isEditing ? 'Atualize as informações do artigo' : 'Crie um novo artigo de ajuda'}
                    </p>
                </div>

                <button
                    onClick={() => navigate('/admin/ajuda/artigos')}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                    Cancelar
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Informações Básicas
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Categoria *
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Selecione uma categoria</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Slug *
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Resumo *
                            </label>
                            <textarea
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="Breve descrição do artigo..."
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Conteúdo (Markdown)
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            {showPreview ? 'Editar' : 'Preview'}
                        </button>
                    </div>

                    {!showPreview ? (
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={20}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                            placeholder="# Título do Artigo&#10;&#10;Escreva o conteúdo em Markdown..."
                            required
                        />
                    ) : (
                        <div className="prose dark:prose-invert max-w-none p-4 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[500px]">
                            <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(formData.content.replace(/\n/g, '<br/>')) }} />
                        </div>
                    )}

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Use Markdown para formatar o texto. Exemplo: # Título, **negrito**, *itálico*, [link](url)
                    </p>
                </div>

                {/* Options */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Opções
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="published"
                                checked={formData.published}
                                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Publicar artigo
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="popular"
                                checked={formData.popular}
                                onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="popular" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Marcar como popular
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
                                className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Salvando...' : isEditing ? 'Atualizar Artigo' : 'Criar Artigo'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/admin/ajuda/artigos')}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
