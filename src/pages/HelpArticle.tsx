import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ThumbsUp, ThumbsDown, ArrowLeft, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import HelpHeader from '@/components/HelpHeader';
import { fetchApi } from '@/lib/apiBase';
import { getArticleBySlug, helpCategories } from '@/data/helpArticles';

interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    popular: boolean;
    views: number;
    helpful: number;
    notHelpful: number;
    category: {
        id: string;
        name: string;
        slug: string;
    };
}

const HelpArticle = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);

    useEffect(() => {
        if (slug) {
            loadArticle();
        }
    }, [slug]);

    const loadArticle = async () => {
        try {
            const response = await fetchApi(`/api/help/articles/${encodeURIComponent(slug || '')}`);

            if (!response.ok) {
                throw new Error('Artigo não encontrado na API');
            }

            const data = await response.json();
            setArticle(data);
        } catch {
            const localArticle = slug ? getArticleBySlug(slug) : undefined;
            const localCategory = localArticle
                ? helpCategories.find((category) => category.id === localArticle.categoryId)
                : undefined;

            if (localArticle && localCategory) {
                setArticle({
                    ...localArticle,
                    popular: Boolean(localArticle.popular),
                    views: 0,
                    helpful: 0,
                    notHelpful: 0,
                    category: {
                        id: localCategory.id,
                        name: localCategory.name,
                        slug: localCategory.slug,
                    },
                });
                setError(false);
            } else {
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
        if (!article) return;

        setFeedback(type);

        try {
            await fetchApi(`/api/help/articles/${article.id}/vote/${type}`, {
                method: 'GET',
            });
        } catch (error) {
            // no-op
        }
    };

    if (loading) {
        return (
            <div className="dark min-h-screen bg-[#111315]">
                <HelpHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="text-zinc-600 dark:text-zinc-400">Carregando...</div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="dark min-h-screen bg-[#111315]">
                <HelpHeader />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
                            Artigo não encontrado
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
        <div className="dark min-h-screen overflow-x-hidden bg-[#111315]">
            <HelpHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-8">
                {/* Breadcrumb */}
                <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-sm mb-6 sm:mb-8" aria-label="Navegação estrutural">
                    <button
                        onClick={() => navigate('/ajuda')}
                        className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        Central de Ajuda
                    </button>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                    <button
                        onClick={() => navigate(`/ajuda/${article.category.slug}`)}
                        className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        {article.category.name}
                    </button>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                    <span className="hidden min-w-0 truncate text-zinc-900 dark:text-white font-medium sm:inline">
                        {article.title}
                    </span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Back button */}
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </button>

                        {/* Article Header */}
                        <div className="mb-8">
                            <div className="mb-3">
                                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                                    {article.category.name}
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                                {article.title}
                            </h1>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400">
                                {article.summary}
                            </p>
                            <div className="mt-3 text-sm text-zinc-500">
                                {article.views} visualizações
                            </div>
                        </div>

                        {/* Article Content */}
                        <div className="help-article-content prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:mt-6 prose-h3:mb-3 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-relaxed prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-strong:text-zinc-900 dark:prose-strong:text-white prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']">
                            <ReactMarkdown>{article.content}</ReactMarkdown>
                        </div>

                        {/* Feedback Section */}
                        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                                Este artigo foi útil?
                            </h3>

                            {feedback === null ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => handleFeedback('helpful')}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-700 text-zinc-700 dark:text-zinc-300 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                        Sim, ajudou ({article.helpful})
                                    </button>
                                    <button
                                        onClick={() => handleFeedback('not-helpful')}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700 text-zinc-700 dark:text-zinc-300 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                        Não ajudou ({article.notHelpful})
                                    </button>
                                </div>
                            ) : (
                                <div className={`p-4 rounded-lg ${feedback === 'helpful'
                                    ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                                    : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900'
                                    }`}>
                                    <p className={`text-sm ${feedback === 'helpful'
                                        ? 'text-green-800 dark:text-green-300'
                                        : 'text-amber-800 dark:text-amber-300'
                                        }`}>
                                        {feedback === 'helpful'
                                            ? '✓ Obrigado pelo feedback! Ficamos felizes em ajudar.'
                                            : 'Obrigado pelo feedback. Entre em contato com o suporte para mais ajuda.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            {/* Contact Support */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900">
                                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                                    Precisa de mais ajuda?
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                    Nossa equipe está pronta para ajudar você
                                </p>
                                <button
                                    onClick={() => window.location.href = 'mailto:suporte@fauves.com.br'}
                                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Entrar em contato
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .help-article-content { overflow-wrap: anywhere; }
                .help-article-content :where(img, video, iframe) { max-width: 100%; height: auto; }
                .help-article-content pre { max-width: calc(100vw - 32px); overflow-x: auto; }
                .help-article-content table { display: block; max-width: 100%; overflow-x: auto; }
                @media (max-width: 640px) {
                    .help-article-content h2 { font-size: 1.35rem; }
                    .help-article-content h3 { font-size: 1.15rem; }
                }
            `}</style>
        </div>
    );
};

export default HelpArticle;
