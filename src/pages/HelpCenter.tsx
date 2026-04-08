import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
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

const HelpCenter = () => {
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
                fetch('http://localhost:4000/api/help/categories?audience=customer'), // Filter customer only
                fetch('http://localhost:4000/api/help/popular?limit=6&audience=customer'), // Filter customer only
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
            <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
                <HelpHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="text-zinc-600 dark:text-zinc-400">Carregando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
            <HelpHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 sm:pb-16">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        Como podemos ajudar?
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
                        Encontre respostas, tutoriais e guias para aproveitar ao máximo a plataforma
                    </p>

                    {/* Search Bar */}
                    <HelpSearchBar />

                    {/* Quick link */}
                    <button
                        onClick={() => navigate('/ajuda')}
                        className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                        Ir para Central de Ajuda
                        <ArrowRight className="w-4 h-4" />
                    </button>
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
                                {...category}
                            />
                        ))}
                    </div>
                </div>

                {/* Popular Articles */}
                {popularArticles.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                Artigos populares
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {popularArticles.map((article) => (
                                <div
                                    key={article.id}
                                    onClick={() => navigate(`/ajuda/artigo/${article.slug}`)}
                                    className="group bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                    {/* Category badge */}
                                    <div className="mb-3">
                                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                                            {article.category.name}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {article.title}
                                    </h3>

                                    {/* Summary */}
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                        {article.summary}
                                    </p>

                                    {/* Read more */}
                                    <div className="mt-3 flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ler artigo
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact Support CTA */}
                <div className="mt-16 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-8 text-center border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Não encontrou o que procurava?
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        Nossa equipe de suporte está pronta para ajudar você
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('/ajuda/tickets/novo')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Criar Ticket de Suporte
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate('/ajuda/tickets')}
                            className="inline-flex items-center gap-2 px-6 py-3 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-medium rounded-lg transition-colors"
                        >
                            Ver Meus Tickets
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
