import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import HelpHeader from '@/components/HelpHeader';
import { fetchApi } from '@/lib/apiBase';
import { getArticlesByCategory, getCategoryBySlug } from '@/data/helpArticles';

interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
    popular: boolean;
    views: number;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    articles: Article[];
}

const HelpCategory = () => {
    const { categorySlug, slug } = useParams();
    const resolvedCategorySlug = categorySlug || slug;
    const navigate = useNavigate();
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (resolvedCategorySlug) {
            loadCategory();
        }
    }, [resolvedCategorySlug]);

    const loadCategory = async () => {
        try {
            const response = await fetchApi(`/api/help/categories/${encodeURIComponent(resolvedCategorySlug || '')}`);

            if (!response.ok) {
                throw new Error('Categoria não encontrada na API');
            }

            const data = await response.json();
            setCategory(data);
        } catch {
            const localCategory = resolvedCategorySlug ? getCategoryBySlug(resolvedCategorySlug) : undefined;
            if (localCategory) {
                setCategory({
                    ...localCategory,
                    articles: getArticlesByCategory(localCategory.id).map((article) => ({
                        id: article.id,
                        title: article.title,
                        slug: article.slug,
                        summary: article.summary,
                        popular: Boolean(article.popular),
                        views: 0,
                    })),
                });
                setError(false);
            } else {
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
                <HelpHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="text-zinc-600 dark:text-zinc-400">Carregando...</div>
                </div>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
                <HelpHeader />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
                            Categoria não encontrada
                        </h1>
                        <button
                            onClick={() => navigate('/ajuda')}
                            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para Central de Ajuda
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
            <HelpHeader />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                {/* Back button */}
                <button
                    onClick={() => navigate('/ajuda')}
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Central de Ajuda
                </button>

                {/* Category Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
                        {category.name}
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        {category.description}
                    </p>
                </div>

                {/* Articles List */}
                <div className="space-y-3">
                    {category.articles.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <BookOpen className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Nenhum artigo disponível nesta categoria ainda.
                            </p>
                        </div>
                    ) : (
                        category.articles.map((article) => (
                            <div
                                key={article.id}
                                onClick={() => navigate(`/ajuda/artigo/${article.slug}`)}
                                className="group bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {article.title}
                                            </h3>
                                            {article.popular && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full">
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {article.summary}
                                        </p>
                                    </div>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-500">
                                        {article.views} views
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpCategory;
