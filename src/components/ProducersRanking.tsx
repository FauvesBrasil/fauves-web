import React, { useState } from 'react';
import { useFetchProducerRanking } from '@/hooks/useFetchProducerRanking';
import { ProducerLevelBadge } from './ProducerLevelBadge';
import { Trophy, TrendingUp } from 'lucide-react';

type Props = {
    currentOrgId?: string;
};

export const ProducersRanking: React.FC<Props> = ({ currentOrgId }) => {
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all-time'>('all-time');
    const { data: rankings, loading, error } = useFetchProducerRanking(currentOrgId, timeframe);

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-[#2A2A2A]">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#121212] rounded-lg animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                            </div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-8 text-gray-500">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const topPosition = rankings.find(r => r.isYou)?.rank;

    return (
        <div className="bg-white dark:bg-[#1F1F1F] rounded-xl border border-gray-200 dark:border-[#2A2A2A] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Ranking de Produtores</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {topPosition && `Você está em #${topPosition}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 dark:bg-[#121212] rounded-lg p-1">
                <button
                    onClick={() => setTimeframe('week')}
                    className={`
            flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors
            ${timeframe === 'week' ? 'bg-white dark:bg-[#1F1F1F] text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}
          `}
                >
                    Semana
                </button>
                <button
                    onClick={() => setTimeframe('month')}
                    className={`
            flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors
            ${timeframe === 'month' ? 'bg-white dark:bg-[#1F1F1F] text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}
          `}
                >
                    Mês
                </button>
                <button
                    onClick={() => setTimeframe('all-time')}
                    className={`
            flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors
            ${timeframe === 'all-time' ? 'bg-white dark:bg-[#1F1F1F] text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}
          `}
                >
                    <span className="sm:hidden">Geral</span>
                    <span className="hidden sm:inline">Todo Tempo</span>
                </button>
            </div>

            {/* Ranking List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {rankings.map((entry) => (
                    <div
                        key={entry.rank}
                        className={`
              flex items-center gap-3 sm:gap-4 p-3 rounded-lg transition-all
              ${entry.isYou
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-md'
                                : 'bg-gray-50 dark:bg-[#121212] hover:bg-gray-100 dark:hover:bg-[#191919] border border-gray-200 dark:border-[#2A2A2A]'
                            }
            `}
                    >
                        {/* Rank */}
                        <div className={`
              flex flex-shrink-0 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold
              ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white text-lg sm:text-xl' : ''}
              ${entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' : ''}
              ${entry.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' : ''}
              ${entry.rank > 3 ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm' : ''}
            `}>
                            {entry.rank === 1 && '🥇'}
                            {entry.rank === 2 && '🥈'}
                            {entry.rank === 3 && '🥉'}
                            {entry.rank > 3 && `#${entry.rank}`}
                        </div>

                        {/* Level Badge */}
                        <ProducerLevelBadge
                            levelId={entry.level}
                            levelName={getLevelName(entry.level)}
                            size="sm"
                            showName={false}
                        />

                        {/* Tickets Sold */}
                        <div className="flex-1 text-right min-w-0">
                            <div className="flex items-center justify-end gap-1">
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                <span className={`font-bold text-sm sm:text-base ${entry.isYou ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-white'}`}>
                                    {entry.ticketsSold.toLocaleString()}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">ingressos</span>
                            </div>
                        </div>

                        {/* "You" Indicator */}
                        {entry.isYou && (
                            <div className="flex-shrink-0 text-[10px] sm:text-xs font-bold text-white bg-blue-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
                                VOCÊ
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {rankings.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Trophy className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>Nenhum produtor no ranking ainda</p>
                </div>
            )}
        </div>
    );
};

// Helper to get level name
function getLevelName(levelId: string): string {
    const names: Record<string, string> = {
        'EXPLORADOR': 'Explorador',
        'INFLUENTE': 'Influente',
        'VISIONARIO': 'Visionário',
        'ICONE': 'Ícone',
        'LENDA': 'Lenda Fauves',
    };
    return names[levelId] || levelId;
}
