import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import HelpHeader from '@/components/HelpHeader';
import HelpCategoryCard from '@/components/HelpCategoryCard';
import HelpSearchBar from '@/components/HelpSearchBar';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    articleCount: number;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: {
        name: string;
    };
}

const HelpOrganizer = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [popularArticles, setPopularArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [categoriesRes, articlesRes] = await Promise.all([
                fetch('http://localhost:4000/api/help/categories?audience=organizer'), // Filter organizer only
                fetch('http://localhost:4000/api/help/popular?limit=6&audience=organizer'), // Filter organizer only
            ]);

            const categoriesData = await categoriesRes.json();
            const articlesData = await articlesRes.json();

            setCategories(categoriesData);
            setPopularArticles(articlesData);
        } catch (error) {
            // no-op
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 dark:from-[#0b0b0b] dark:via-purple-950/10 dark:to-indigo-950/10">
                <HelpHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="text-zinc-600 dark:text-zinc-400">Carregando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 dark:from-[#0b0b0b] dark:via-purple-950/10 dark:to-indigo-950/10">
            <HelpHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 sm:pb-16">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    {/* Organizer Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium mb-4">
                        <Users className="w-4 h-4" />
                        Central para Organizadores
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        Gerenciando seu evento?
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
                        Tutoriais, guias e recursos para criar e gerenciar eventos incríveis na Fauves
                    </p>

                    {/* Search Bar */}
                    <HelpSearchBar />

                    {/* Quick links */}
                    <div className="mt-6 flex justify-center gap-4 flex-wrap">
                        <button
                            onClick={() => navigate('/ajuda')}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                        >
                            Central do Cliente
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="text-zinc-400">•</span>
                        <button
                            onClick={() => navigate('/organizer-events')}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium inline-flex items-center gap-1"
                        >
                            Painel do Organizador
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                        Categorias
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categories.map((category) => (
                            <HelpCategoryCard
                                key={category.id}
                                id={category.id}
                                name={category.name}
                                description={category.description}
                                icon={category.icon}
                                slug={category.slug}
                                articleCount={category.articleCount}
                            />
                        ))}
                    </div>
                    {categories.length === 0 && (
                        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                            Nenhuma categoria disponível para organizadores
                        </div>
                    )}
                </div>

                {/* Popular Articles */}
                {popularArticles.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                            Artigos Populares
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {popularArticles.map((article) => (
                                <div
                                    key={article.id}
                                    onClick={() => navigate(`/ajuda/organizador/artigo/${article.slug}`)}
                                    className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                        <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {article.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                        {article.summary}
                                    </p>
                                    <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
                                        {article.category.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpOrganizer;
