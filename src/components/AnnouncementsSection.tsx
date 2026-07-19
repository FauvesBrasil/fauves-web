import React from 'react';
import { ArrowRight, Sparkles, TrendingUp, Bell, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnnouncements } from '@/hooks/useAnnouncements';

type AnnouncementCategory = 'feature' | 'update' | 'news' | 'tip';

interface AnnouncementProps {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    category: AnnouncementCategory;
    link?: string;
    linkText?: string;
}

const CATEGORY_CONFIG: Record<AnnouncementCategory, {
    label: string;
    icon: React.ReactNode;
    gradient: string;
    badgeBg: string;
    badgeText: string;
    cardBg: string;
}> = {
    feature: {
        label: 'Novidade',
        icon: <Sparkles className="w-4 h-4" />,
        gradient: 'from-purple-500 to-indigo-600',
        badgeBg: 'bg-purple-100 dark:bg-purple-900/20',
        badgeText: 'text-purple-700 dark:text-purple-300',
        cardBg: 'bg-purple-50/50 dark:bg-purple-950/10',
    },
    update: {
        label: 'Atualização',
        icon: <TrendingUp className="w-4 h-4" />,
        gradient: 'from-emerald-500 to-teal-600',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/20',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
    },
    news: {
        label: 'Comunicado',
        icon: <Bell className="w-4 h-4" />,
        gradient: 'from-orange-500 to-rose-600',
        badgeBg: 'bg-orange-100 dark:bg-orange-900/20',
        badgeText: 'text-orange-700 dark:text-orange-300',
        cardBg: 'bg-orange-50/50 dark:bg-orange-950/10',
    },
    tip: {
        label: 'Dica',
        icon: <Lightbulb className="w-4 h-4" />,
        gradient: 'from-yellow-500 to-amber-600',
        badgeBg: 'bg-yellow-100 dark:bg-yellow-900/20',
        badgeText: 'text-yellow-700 dark:text-yellow-300',
        cardBg: 'bg-yellow-50/50 dark:bg-yellow-950/10',
    },
};

export const AnnouncementCard: React.FC<AnnouncementProps> = ({
    title,
    description,
    imageUrl,
    category,
    link,
    linkText = 'Saiba mais',
}) => {
    const navigate = useNavigate();
    const config = CATEGORY_CONFIG[category];

    const handleClick = () => {
        if (link) {
            if (link.startsWith('http')) {
                window.open(link, '_blank');
            } else {
                navigate(link);
            }
        }
    };

    return (
        <div className={`group ${config.cardBg} rounded-xl border border-gray-200 dark:border-[#1F1F1F] overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
            <div className={`flex ${imageUrl ? 'flex-row' : 'flex-col'} h-full`}>
                {/* Content - Left Side */}
                <div className="flex-1 p-5">
                    {/* Category Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText} text-xs font-semibold mb-3`}>
                        {config.icon}
                        <span>{config.label}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {description}
                    </p>

                    {/* Action Button */}
                    {link && (
                        <button
                            onClick={handleClick}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                        >
                            <span>{linkText}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>

                {/* Image - Right Side with rounded corners */}
                {imageUrl && (
                    <div className="relative w-80 max-md:w-64 max-sm:hidden flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Seção completa com múltiplos anúncios
interface AnnouncementsSectionProps {
    announcements?: AnnouncementProps[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = () => {
    const { announcements, loading } = useAnnouncements('organizer');

    // Don't render if no announcements
    if (!loading && announcements.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl max-sm:text-xl font-bold text-gray-900 dark:text-white">
                        Novidades para você
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Fique por dentro das últimas atualizações e dicas
                    </p>
                </div>
            </div>

            {/* Cards or Loading State */}
            {loading ? (
                <div className="flex flex-col gap-4 w-full">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl h-[160px] w-full" />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-4 w-full">
                    {announcements.map((announcement) => (
                        <AnnouncementCard key={announcement.id} {...announcement} />
                    ))}
                </div>
            )}
        </div>);
};

export default AnnouncementsSection;
