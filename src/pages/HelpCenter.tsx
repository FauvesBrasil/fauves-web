import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelpHeader from '@/components/HelpHeader';
import HelpSearchBar from '@/components/HelpSearchBar';
import { fetchApi } from '@/lib/apiBase';
import {
    helpArticles as fallbackArticles,
    helpCategories as fallbackCategories,
} from '@/data/helpArticles';

interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
}

interface CategorySection {
    id: string;
    name: string;
    slug: string;
    articles: Article[];
}

const localSections = (): CategorySection[] => fallbackCategories
    .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        articles: fallbackArticles
            .filter((article) => article.categoryId === category.id)
            .map(({ id, title, slug, summary }) => ({ id, title, slug, summary })),
    }))
    .filter((category) => category.articles.length > 0);

const HelpCenter = () => {
    const navigate = useNavigate();
    const [sections, setSections] = useState<CategorySection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            try {
                const categoriesResponse = await fetchApi('/api/help/categories?audience=customer');
                if (!categoriesResponse.ok) throw new Error('Não foi possível carregar as categorias');

                const categories = await categoriesResponse.json();
                if (!Array.isArray(categories) || categories.length === 0) {
                    throw new Error('Nenhuma categoria disponível');
                }

                const loadedSections = await Promise.all(categories.map(async (category: any) => {
                    try {
                        const response = await fetchApi(`/api/help/categories/${encodeURIComponent(category.slug)}`);
                        if (!response.ok) return null;
                        const detail = await response.json();
                        return {
                            id: category.id,
                            name: category.name,
                            slug: category.slug,
                            articles: Array.isArray(detail.articles) ? detail.articles : [],
                        } as CategorySection;
                    } catch {
                        return null;
                    }
                }));

                const populatedSections = loadedSections
                    .filter((section): section is CategorySection => Boolean(section?.articles.length));

                if (active) setSections(populatedSections.length ? populatedSections : localSections());
            } catch {
                if (active) setSections(localSections());
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadData();
        return () => { active = false; };
    }, []);

    return (
        <div className="help-center-page">
            <div className="help-center-glow" aria-hidden="true" />
            <HelpHeader />

            <main className="help-center-content">
                <section className="help-center-hero" aria-labelledby="help-center-title">
                    <h1 id="help-center-title">
                        <span>Boas-vindas!</span>
                        Como podemos ajudar?
                    </h1>
                    <HelpSearchBar />
                </section>

                <div className="help-center-sections" aria-live="polite">
                    {loading ? (
                        <HelpCenterSkeleton />
                    ) : sections.length ? (
                        sections.map((section) => (
                            <section className="help-center-section" key={section.id}>
                                <h2>{section.name}</h2>
                                <div className="help-article-grid">
                                    {section.articles.map((article) => (
                                        <button
                                            type="button"
                                            className="help-article-card"
                                            key={article.id}
                                            onClick={() => navigate(`/ajuda/artigo/${article.slug}`)}
                                        >
                                            <strong>{article.title}</strong>
                                            <span>{article.summary}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className="help-center-empty">
                            Nenhum artigo de ajuda está disponível no momento.
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                .help-center-page {
                    min-height: 100vh;
                    overflow-x: hidden;
                    position: relative;
                    color: rgba(255, 255, 255, .96);
                    background: #111315;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .help-center-glow {
                    position: absolute;
                    z-index: 0;
                    inset: 0 0 auto;
                    height: 330px;
                    pointer-events: none;
                    opacity: .66;
                    background:
                        radial-gradient(620px 280px at 21% -30px, rgba(137, 46, 82, .52), transparent 72%),
                        radial-gradient(610px 270px at 53% -55px, rgba(134, 99, 48, .54), transparent 72%),
                        radial-gradient(700px 300px at 83% -55px, rgba(30, 91, 43, .48), transparent 73%);
                    filter: blur(3px);
                }

                .help-center-content {
                    position: relative;
                    z-index: 1;
                    width: min(100% - 40px, 790px);
                    margin: 0 auto;
                    padding: 94px 0 80px;
                }

                .help-center-hero h1 {
                    margin: 0;
                    color: rgba(255, 255, 255, .97);
                    font-size: 36px;
                    font-weight: 700;
                    line-height: 1.08;
                    letter-spacing: -.035em;
                }

                .help-center-hero h1 span {
                    display: block;
                    color: rgba(255, 255, 255, .48);
                }

                .help-center-hero .help-search-root {
                    margin-top: 28px;
                }

                .help-center-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 44px;
                    margin-top: 48px;
                }

                .help-center-section h2 {
                    margin: 0 0 21px;
                    color: rgba(255, 255, 255, .96);
                    font-size: 21px;
                    font-weight: 700;
                    line-height: 1.2;
                    letter-spacing: -.025em;
                }

                .help-article-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                }

                .help-article-card {
                    width: 100%;
                    min-height: 120px;
                    padding: 20px 23px;
                    border: 1px solid rgba(255, 255, 255, .065);
                    border-radius: 14px;
                    background: rgba(255, 255, 255, .045);
                    color: inherit;
                    cursor: pointer;
                    text-align: left;
                    transition: background-color .16s ease, border-color .16s ease, transform .16s ease;
                }

                .help-article-card:hover {
                    background: rgba(255, 255, 255, .072);
                    border-color: rgba(255, 255, 255, .12);
                    transform: translateY(-1px);
                }

                .help-article-card:focus-visible {
                    outline: 2px solid #EF4118;
                    outline-offset: 2px;
                }

                .help-article-card strong,
                .help-article-card span {
                    display: block;
                }

                .help-article-card strong {
                    color: rgba(255, 255, 255, .96);
                    font-size: 17px;
                    font-weight: 700;
                    line-height: 1.18;
                    letter-spacing: -.018em;
                }

                .help-article-card span {
                    margin-top: 10px;
                    color: rgba(255, 255, 255, .68);
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.46;
                }

                .help-center-empty {
                    padding: 32px;
                    border: 1px solid rgba(255, 255, 255, .07);
                    border-radius: 14px;
                    color: rgba(255, 255, 255, .52);
                    background: rgba(255, 255, 255, .035);
                    text-align: center;
                    font-size: 14px;
                }

                .help-skeleton-title,
                .help-skeleton-card {
                    background: rgba(255, 255, 255, .055);
                    animation: help-skeleton-pulse 1.3s ease-in-out infinite alternate;
                }

                .help-skeleton-title {
                    width: 110px;
                    height: 21px;
                    margin-bottom: 21px;
                    border-radius: 6px;
                }

                .help-skeleton-card {
                    min-height: 120px;
                    border-radius: 14px;
                }

                @keyframes help-skeleton-pulse {
                    to { opacity: .45; }
                }

                @media (max-width: 640px) {
                    .help-center-content {
                        width: min(100% - 32px, 790px);
                        padding-top: 88px;
                    }

                    .help-center-hero h1 { font-size: 31px; }
                    .help-center-sections { margin-top: 38px; gap: 38px; }
                    .help-article-grid { grid-template-columns: 1fr; }
                    .help-article-card { min-height: 0; padding: 18px; }
                }
            `}</style>
        </div>
    );
};

const HelpCenterSkeleton = () => (
    <section aria-label="Carregando artigos">
        <div className="help-skeleton-title" />
        <div className="help-article-grid">
            {Array.from({ length: 6 }).map((_, index) => (
                <div className="help-skeleton-card" key={index} />
            ))}
        </div>
    </section>
);

export default HelpCenter;
