import React from 'react';
import { HelpCircle, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

type Level = {
  id: string;
  title: string;
  threshold: number;
};

type Props = {
  currentLevel?: Level;
  sold?: number;
  progressPercent?: number;
  nextLevel?: Level | null;
};

const LEVEL_CONFIG: Record<string, {
  colors: { bg: string; badge: string; accent: string; glow: string };
  icon: string;
  iconBg: string;
}> = {
  'EXPLORADOR': {
    colors: {
      bg: 'from-emerald-600 to-teal-700',
      badge: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      accent: 'bg-emerald-400',
      glow: 'shadow-emerald-500/20',
    },
    icon: '🌱',
    iconBg: 'from-emerald-300 to-teal-400',
  },
  'INFLUENTE': {
    colors: {
      bg: 'from-purple-600 to-indigo-700',
      badge: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      accent: 'bg-purple-400',
      glow: 'shadow-purple-500/20',
    },
    icon: '⚡',
    iconBg: 'from-purple-300 to-indigo-400',
  },
  'VISIONARIO': {
    colors: {
      bg: 'from-blue-600 to-cyan-700',
      badge: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      accent: 'bg-blue-400',
      glow: 'shadow-blue-500/20',
    },
    icon: '🌟',
    iconBg: 'from-blue-300 to-cyan-400',
  },
  'ICONE': {
    colors: {
      bg: 'from-rose-600 to-pink-700',
      badge: 'bg-gradient-to-r from-rose-500 to-pink-500',
      accent: 'bg-rose-400',
      glow: 'shadow-rose-500/20',
    },
    icon: '👑',
    iconBg: 'from-rose-300 to-pink-400',
  },
  'LENDA': {
    colors: {
      bg: 'from-amber-500 via-orange-500 to-rose-500',
      badge: 'bg-gradient-to-r from-yellow-400 via-orange-400 to-rose-400',
      accent: 'bg-gradient-to-r from-yellow-300 to-rose-300',
      glow: 'shadow-amber-500/30',
    },
    icon: '🏆',
    iconBg: 'from-yellow-300 via-orange-300 to-rose-300',
  },
};

export const ProducerJourneyCard: React.FC<Props> = ({
  currentLevel = { id: 'EXPLORADOR', title: 'Explorador', threshold: 0 },
  sold = 0,
  progressPercent = 10,
  nextLevel = { id: 'INFLUENTE', title: 'Influente', threshold: 25000 },
}) => {
  const config = LEVEL_CONFIG[currentLevel.id] || LEVEL_CONFIG['EXPLORADOR'];
  const remaining = nextLevel ? nextLevel.threshold - sold : 0;
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Classe base mobile
  const baseClasses = "max-w-sm rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2A2A2A]";

  // Classes desktop por nível
  const desktopClasses = {
    'EXPLORADOR': 'sm:bg-gradient-to-br sm:from-emerald-600 sm:to-teal-700 sm:text-white sm:shadow-xl sm:shadow-emerald-500/20 sm:border-0',
    'INFLUENTE': 'sm:bg-gradient-to-br sm:from-purple-600 sm:to-indigo-700 sm:text-white sm:shadow-xl sm:shadow-purple-500/20 sm:border-0',
    'VISIONARIO': 'sm:bg-gradient-to-br sm:from-blue-600 sm:to-cyan-700 sm:text-white sm:shadow-xl sm:shadow-blue-500/20 sm:border-0',
    'ICONE': 'sm:bg-gradient-to-br sm:from-rose-600 sm:to-pink-700 sm:text-white sm:shadow-xl sm:shadow-rose-500/20 sm:border-0',
    'LENDA': 'sm:bg-gradient-to-br sm:from-amber-500 sm:via-orange-500 sm:to-rose-500 sm:text-white sm:shadow-xl sm:shadow-amber-500/30 sm:border-0',
  };

  return (
    <div className={`${baseClasses} ${desktopClasses[currentLevel.id] || desktopClasses['EXPLORADOR']}`}>
      {/* MOBILE VERSION - Compact */}
      <div className="sm:hidden">
        {/* Header compacto mobile */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 dark:text-white">{currentLevel.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sold.toLocaleString()} ingressos</p>
          </div>
        </div>

        {/* Progress mobile */}
        {nextLevel && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Próximo: {nextLevel.title}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.colors.accent} transition-all duration-500`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Faltam {remaining.toLocaleString()}</p>
          </div>
        )}

        {!nextLevel && (
          <div className="mb-3 text-center py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Nível Máximo! 🏆</p>
          </div>
        )}

        <Link to="/jornada-produtor" className="flex items-center justify-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline group">
          Ver jornada completa
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* DESKTOP VERSION - Full Colorful */}
      <div className="hidden sm:block">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-full bg-gradient-to-br ${config.iconBg} p-1 shadow-lg`}>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg animate-pulse">
                {config.icon}
              </div>
            </div>
            <div className="text-lg font-bold">Sua Jornada</div>
          </div>

          {/* Tooltip */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-white/70 hover:text-white" />
            </button>

            {showTooltip && (
              <div className="absolute right-0 top-8 z-50 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700">
                <div className="font-bold mb-1">Sistema de Níveis</div>
                <div className="text-gray-300">
                  Venda ingressos para subir de nível e desbloquear benefícios exclusivos! Seu progresso é vitalício.
                </div>
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>

        {/* Current Level Badge */}
        <div className={`mt-4 ${config.colors.badge} rounded-xl p-4 shadow-lg relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base text-white/90 font-bold flex items-center gap-2">
                  {config.icon} {currentLevel.title}
                </div>
                <div className="text-xs text-white/70 mt-0.5">Nível atual</div>
              </div>
              {currentLevel.id !== 'LENDA' && (
                <TrendingUp className="w-5 h-5 text-white/60" />
              )}
              {currentLevel.id === 'LENDA' && (
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-white/90 font-bold text-2xl">
                {sold.toLocaleString()}
              </div>
              <div className="text-sm text-white/70">Ingressos vendidos</div>
            </div>
            {nextLevel && remaining > 0 && (
              <div className="text-right">
                <div className="text-white/90 font-semibold text-sm">
                  {remaining.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">faltam</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {nextLevel && (
            <>
              <div className="mt-3 h-3 bg-black/30 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full ${config.colors.accent} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="mt-2 text-xs text-white/60 text-right">
                {progressPercent.toFixed(0)}% até o próximo nível
              </div>
            </>
          )}
        </div>

        {/* Next Level */}
        {nextLevel && (
          <>
            <div className="mt-4 text-white/80 text-sm font-semibold flex items-center gap-2">
              <span>Próximo nível</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            <div className="mt-2 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/30 transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className="text-2xl">{LEVEL_CONFIG[nextLevel.id]?.icon || '⭐'}</div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{nextLevel.title}</div>
                  <div className="text-xs text-white/70">
                    {nextLevel.threshold.toLocaleString()} ingressos
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Max Level */}
        {!nextLevel && (
          <div className="mt-4 bg-gradient-to-r from-yellow-400/20 to-rose-400/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-400/30">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              <div>
                <div className="font-bold text-yellow-100 text-sm">Nível Máximo!</div>
                <div className="text-xs text-yellow-200/70">Você é uma Lenda Fauves 🏆</div>
              </div>
            </div>
          </div>
        )}

        {/* Link to Full Page */}
        <Link
          to="/jornada-produtor"
          className="mt-4 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:border-white/40 transition-all duration-200 group"
        >
          <span className="text-white font-semibold text-sm">Ver Jornada Completa</span>
          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Animation CSS */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ProducerJourneyCard;
