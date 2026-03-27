import { ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchApi } from '@/lib/apiBase';

interface ArticleViewerProps {
    article: {
        id: string;
        title: string;
        content: string;
        summary: string;
        category: { name: string; slug: string };
        relatedArticles: Array<{ id: string; title: string; slug: string; summary: string }>;
    } | null;
    loading?: boolean;
    onClose: () => void;
    onArticleClick: (slug: string) => void;
    onCreateTicket: () => void;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({
    article,
    loading = false,
    onClose,
    onArticleClick,
    onCreateTicket
}) => {
    const handleVote = async (type: 'helpful' | 'not-helpful') => {
        if (!article) return;
        try {
            await fetchApi(`/api/help/articles/${article.id}/vote/${type}`);
            // Optionally show success message
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    return (
        <div className="absolute inset-0 bg-white dark:bg-zinc-900 z-10 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Voltar</span>
                </button>
                {article && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                        {article.category.name}
                    </span>
                )}
            </div>

            {/* Article Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading || !article ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Carregando artigo...</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
                            {article.title}
                        </h1>

                        {article.summary && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                                {article.summary}
                            </p>
                        )}

                        <div className="text-zinc-600 dark:text-zinc-100 prose prose-sm dark:prose-invert max-w-none [&_p]:text-zinc-600 dark:[&_p]:text-zinc-100 [&_ul]:text-zinc-600 dark:[&_ul]:text-zinc-100 [&_ol]:text-zinc-600 dark:[&_ol]:text-zinc-100 [&_li]:text-zinc-600 dark:[&_li]:text-zinc-100 [&_h1]:text-zinc-900 dark:[&_h1]:text-white [&_h2]:text-zinc-900 dark:[&_h2]:text-white [&_h3]:text-zinc-900 dark:[&_h3]:text-white [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_strong]:text-zinc-900 dark:[&_strong]:text-white">
                            <ReactMarkdown>{article.content}</ReactMarkdown>
                        </div>

                        {/* Helpful Section */}
                        <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
                                Este artigo foi útil?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleVote('helpful')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    Sim
                                </button>
                                <button
                                    onClick={() => handleVote('not-helpful')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    Não
                                </button>
                            </div>
                        </div>

                        {/* Related Articles */}
                        {article.relatedArticles && article.relatedArticles.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                                    Artigos Relacionados
                                </h3>
                                <div className="space-y-2">
                                    {article.relatedArticles.map((related) => (
                                        <button
                                            key={related.id}
                                            onClick={() => onArticleClick(related.slug)}
                                            className="w-full text-left p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors group"
                                        >
                                            <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {related.title}
                                            </div>
                                            {related.summary && (
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                    {related.summary}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Bottom Action */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
                <button
                    onClick={onCreateTicket}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Ainda precisa de ajuda? Criar Ticket
                </button>
            </div>
        </div>
    );
};

export default ArticleViewer;
