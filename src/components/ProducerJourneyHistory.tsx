import React from 'react';
import { useFetchProducerHistory } from '@/hooks/useFetchProducerHistory';
import { TrendingUp, Calendar, Users } from 'lucide-react';

type Props = {
    organizationId: string;
};

// Map level IDs to emojis and colors
const LEVEL_STYLES: Record<string, { emoji: string; color: string }> = {
    'EXPLORADOR': { emoji: '🌱', color: 'from-emerald-500 to-teal-500' },
    'INFLUENTE': { emoji: '⚡', color: 'from-purple-500 to-indigo-500' },
    'VISIONARIO': { emoji: '🌟', color: 'from-blue-500 to-cyan-500' },
    'ICONE': { emoji: '👑', color: 'from-rose-500 to-pink-500' },
    'LENDA': { emoji: '🏆', color: 'from-yellow-400 via-orange-400 to-rose-400' },
};

export const ProducerJourneyHistory: React.FC<Props> = ({ organizationId }) => {
    const { data: history, loading, error } = useFetchProducerHistory(organizationId);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 items-center animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>{error}</p>
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma conquista ainda</p>
                <p className="text-xs mt-1">Continue vendendo para alcançar novos níveis!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-bold text-gray-800 dark:text-white">Histórico de Conquistas</h3>
            </div>

            <div className="space-y-3">
                {history.map((achievement, idx) => {
                    const style = LEVEL_STYLES[achievement.level.id] || LEVEL_STYLES['EXPLORADOR'];
                    const date = new Date(achievement.achievedAt);

                    return (
                        <div
                            key={idx}
                            className="flex gap-3 sm:gap-4 items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
                        >
                            {/* Level badge */}
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${style.color} flex items-center justify-center text-xl sm:text-2xl shadow-md flex-shrink-0`}>
                                {style.emoji}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">{achievement.level.name}</div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {date.toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {achievement.tickets.toLocaleString()} ingressos
                                    </span>
                                </div>
                            </div>

                            {/* Achievement indicator */}
                            {idx === 0 && (
                                <div className="flex-shrink-0 text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 sm:py-1 rounded-full">
                                    Atual
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
