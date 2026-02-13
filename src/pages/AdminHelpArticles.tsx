import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search } from 'lucide-react';

interface Article {
    id: string;
    categoryId: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    popular: boolean;
    published: boolean;
    order: number;
    views: number;
    helpful: number;
    notHelpful: number;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function AdminHelpArticles() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

    useEffect(() => {
        loadData();
    }, [filterCategory, filterPublished]);

    const loadData = async () => {
        try {
            const [articlesRes, categoriesRes] = await Promise.all([
                fetch(buildArticlesUrl()),
                fetch('http://localhost:4000/api/admin/help/categories'),
            ]);

            const articlesData = await articlesRes.json();
            const categoriesData = await categoriesRes.json();

            setArticles(articlesData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildArticlesUrl = () => {
        const params = new URLSearchParams();
        if (filterCategory) params.append('categoryId', filterCategory);
        if (filterPublished !== 'all') {
            params.append('published', filterPublished === 'published' ? 'true' : 'false');
        }
        if (searchTerm) params.append('search', searchTerm);

        const queryString = params.toString();
        return `http://localhost:4000/api/admin/help/articles${queryString ? `?${queryString}` : ''}`;
    };

    const handleSearch = async () => {
        setLoading(true);
        await loadData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar este artigo?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/admin/help/articles/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadData();
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao deletar artigo');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Erro ao deletar artigo');
        }
    };

    const togglePublished = async (article: Article) => {
        try {
            const response = await fetch(`http://localhost:4000/api/admin/help/articles/${article.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: !article.published }),
            });

            if (response.ok) {
                await loadData();
            }
        } catch (error) {
            console.error('Error toggling published:', error);
        }
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
                        Artigos da Central de Ajuda
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Gerencie os artigos de ajuda
                    </p>
                </div>

                <button
                    onClick={() => navigate('/admin/ajuda/artigos/novo')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Novo Artigo
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Buscar artigos..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Todas as categorias</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Published Filter */}
                    <div>
                        <select
                            value={filterPublished}
                            onChange={(e) => setFilterPublished(e.target.value as any)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">Todos</option>
                            <option value="published">Publicados</option>
                            <option value="draft">Rascunhos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article) => (
                    <div
                        key={article.id}
                        className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        <div className="p-5">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-slate-900 mb-1">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-indigo-600">
                                        {article.category.name}
                                    </p>
                                </div>

                                <div className="flex gap-1">
                                    {article.popular && (
                                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                            Popular
                                        </span>
                                    )}
                                    {!article.published && (
                                        <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                                            Rascunho
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                {article.summary}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                <span>{article.views} views</span>
                                <span>👍 {article.helpful}</span>
                                <span>👎 {article.notHelpful}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => navigate(`/admin/ajuda/artigos/${article.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Editar
                                </button>

                                <button
                                    onClick={() => togglePublished(article)}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title={article.published ? 'Despublicar' : 'Publicar'}
                                >
                                    {article.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>

                                <button
                                    onClick={() => handleDelete(article.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Deletar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {articles.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    Nenhum artigo encontrado
                </div>
            )}
        </div>
    );
}
