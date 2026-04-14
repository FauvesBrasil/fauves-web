import React from 'react';
import { useFetchActiveMissions, type Mission } from '@/hooks/useFetchActiveMissions';
import { Trophy, Gift, CheckCircle, Lock } from 'lucide-react';

type Props = {
    organizationId: string;
    compact?: boolean;
};

const MISSION_ICONS: Record<string, string> = {
    'first_sale': '🎉',
    'sell_10': '🎯',
    'sell_100': '💯',
    'sell_1000': '⚡',
    'sell_10000': '🚀',
    'first_event': '🎪',
    'events_10': '📅',
    'diversity_champion': '🌈',
    'fast_seller': '⚡',
    'early_bird': '🌅',
    'night_owl': '🦉',
    'sold_out_first': '🔥',
    'full_house_5': '🏠',
    'weekend_warrior': '⚔️',
};

export const ActiveMissions: React.FC<Props> = ({ organizationId, compact = false }) => {
    const { data: missions, loading, error, claimReward } = useFetchActiveMissions(organizationId);

    const handleClaim = async (missionId: string) => {
        const success = await claimReward(missionId);
        if (success) {
            // Show success message (could use toast notification)
            // no-op
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-100 dark:bg-[#121212] rounded-lg p-4 animate-pulse border border-transparent dark:border-[#2A2A2A]">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
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

    // Separate missions by status
    const inProgress = missions.filter(m => !m.completed && m.progress > 0);
    const available = missions.filter(m => !m.completed && m.progress === 0);
    const completed = missions.filter(m => m.completed);

    const renderMission = (mission: Mission) => {
        const progressPercent = Math.min(100, Math.round((mission.progress / mission.requirement) * 100));
        const emoji = MISSION_ICONS[mission.key] || '🎯';
        const isCompleted = mission.completed;
        const canClaim = isCompleted && !mission.claimedReward;

        return (
            <div
                key={mission.id}
                className={`
          bg-white dark:bg-[#1F1F1F] rounded-lg p-4 border-2 transition-all
          ${isCompleted ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-[#2A2A2A] hover:border-blue-300 dark:hover:border-blue-700'}
          ${compact ? 'p-3' : ''}
        `}
            >
                <div className="flex items-start gap-3">
                    {/* Mission Icon */}
                    <div className={`
            text-3xl ${compact ? 'text-2xl' : ''}
            ${isCompleted ? 'grayscale' : ''}
          `}>
                        {emoji}
                    </div>

                    {/* Mission Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-bold text-gray-800 dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
                                {mission.title}
                            </h4>
                            {isCompleted && (
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
                            )}
                        </div>
                        <p className={`text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'} mb-2`}>
                            {mission.description}
                        </p>

                        {/* Progress Bar */}
                        {!isCompleted && (
                            <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    <span>{mission.progress} / {mission.requirement}</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reward Info */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Gift className="w-3 h-3" />
                                <span>
                                    {mission.rewardType === 'badge' && 'Badge'}
                                    {mission.rewardType === 'boost' && 'Boost'}
                                    {mission.rewardType === 'unlock' && 'Desbloqueio'}
                                </span>
                            </div>

                            {/* Claim Button */}
                            {canClaim && (
                                <button
                                    onClick={() => handleClaim(mission.id)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-full transition-colors"
                                >
                                    Resgatar 🎁
                                </button>
                            )}

                            {isCompleted && mission.claimedReward && (
                                <span className="text-xs text-green-600 dark:text-green-500 font-semibold">
                                    ✓ Resgatado
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Missões</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {completed.length} de {missions.length} completadas
                    </p>
                </div>
            </div>

            {/* In Progress */}
            {inProgress.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
                        Em Progresso ({inProgress.length})
                    </h3>
                    <div className="space-y-3">
                        {inProgress.map(renderMission)}
                    </div>
                </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-green-600 dark:text-green-500 uppercase mb-3">
                        Completadas ({completed.length})
                    </h3>
                    <div className="space-y-3">
                        {completed.slice(0, compact ? 3 : undefined).map(renderMission)}
                    </div>
                </div>
            )}

            {/* Available (Locked) */}
            {!compact && available.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Disponíveis ({available.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {available.map(mission => (
                            <div
                                key={mission.id}
                                className="bg-gray-50 dark:bg-[#121212] rounded-lg p-3 border border-gray-200 dark:border-[#2A2A2A] opacity-70"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{MISSION_ICONS[mission.key] || '🎯'}</span>
                                    <h5 className="text-xs font-semibold text-gray-700 dark:text-white">
                                        {mission.title}
                                    </h5>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{mission.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {missions.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                    <Trophy className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma missão disponível no momento</p>
                </div>
            )}
        </div>
    );
};
