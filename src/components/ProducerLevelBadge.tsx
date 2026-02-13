import React from 'react';

type Props = {
    levelId: string;
    levelName: string;
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
};

// Map level IDs to visual styles
const LEVEL_STYLES: Record<string, {
    emoji: string;
    gradient: string;
    glow: string;
}> = {
    'EXPLORADOR': {
        emoji: '🌱',
        gradient: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-500/30',
    },
    'INFLUENTE': {
        emoji: '⚡',
        gradient: 'from-purple-500 to-indigo-500',
        glow: 'shadow-purple-500/30',
    },
    'VISIONARIO': {
        emoji: '🌟',
        gradient: 'from-blue-500 to-cyan-500',
        glow: 'shadow-blue-500/30',
    },
    'ICONE': {
        emoji: '👑',
        gradient: 'from-rose-500 to-pink-500',
        glow: 'shadow-rose-500/30',
    },
    'LENDA': {
        emoji: '🏆',
        gradient: 'from-yellow-400 via-orange-400 to-rose-400',
        glow: 'shadow-amber-500/40',
    },
};

const SIZE_CLASSES = {
    sm: {
        container: 'px-2 py-1 gap-1.5',
        emoji: 'text-base',
        text: 'text-xs',
    },
    md: {
        container: 'px-3 py-1.5 gap-2',
        emoji: 'text-lg',
        text: 'text-sm',
    },
    lg: {
        container: 'px-4 py-2 gap-2.5',
        emoji: 'text-xl',
        text: 'text-base',
    },
};

export const ProducerLevelBadge: React.FC<Props> = ({
    levelId,
    levelName,
    size = 'md',
    showName = true
}) => {
    const style = LEVEL_STYLES[levelId] || LEVEL_STYLES['EXPLORADOR'];
    const sizeClass = SIZE_CLASSES[size];

    return (
        <div
            className={`
        inline-flex items-center rounded-full 
        bg-gradient-to-r ${style.gradient} 
        shadow-lg ${style.glow}
        ${sizeClass.container}
        transition-transform hover:scale-105
      `}
            title={`Nível: ${levelName}`}
        >
            <span className={`${sizeClass.emoji} leading-none`}>
                {style.emoji}
            </span>
            {showName && (
                <span className={`font-bold text-white ${sizeClass.text} leading-none`}>
                    {levelName}
                </span>
            )}
        </div>
    );
};
