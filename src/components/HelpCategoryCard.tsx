import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

interface HelpCategoryCardProps {
    id: string;
    name: string;
    description: string;
    icon: string;
    slug: string;
    articleCount: number;
}

const HelpCategoryCard: React.FC<HelpCategoryCardProps> = ({
    name,
    description,
    icon,
    slug,
    articleCount
}) => {
    const navigate = useNavigate();

    // Dynamically get the icon component
    const IconComponent = (Icons as any)[icon] || Icons.HelpCircle;

    return (
        <div
            onClick={() => navigate(`/ajuda/${slug}`)}
            className="group bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
            <div className="flex flex-col items-center text-center gap-3">
                {/* Icon circle */}
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                    <IconComponent className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    {name}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {description}
                </p>

                {/* Article count */}
                <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {articleCount} {articleCount === 1 ? 'artigo' : 'artigos'}
                </span>
            </div>
        </div>
    );
};

export default HelpCategoryCard;
