import React from 'react';

type Level = {
  id: string;
  title: string;
  threshold: number;
  benefits?: string[];
};

type Props = {
  currentLevel?: Level;
  sold?: number;
  progressPercent?: number; // 0-100
  nextLevel?: Level | null;
};

export const ProducerJourneyCard: React.FC<Props> = ({
  currentLevel = { id: 'EXPLORADOR', title: 'Explorador', threshold: 0 },
  sold = 0,
  progressPercent = 10,
  nextLevel = { id: 'INFLUENTE', title: 'Influente', threshold: 25000 },
}) => {
  return (
  <div className="max-w-sm bg-[#0b0080] rounded-2xl p-4 text-white producer-journey">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gradient-to-br from-yellow-300 to-green-400 p-1">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">🏅</div>
        </div>
        <div className="text-lg font-semibold">Jornada do produtor</div>
      </div>

      <div className="mt-4 bg-[#ff4a3d] rounded-lg p-3">
        <div className="text-sm text-white/90 font-bold">{currentLevel.title}</div>
        <div className="text-xs text-white/80">Nível atual</div>
      </div>

      <div className="mt-4 bg-[#06005a] rounded-lg p-3">
        <div className="text-white/90 font-bold text-xl">{sold}</div>
        <div className="text-sm text-white/70">Ingressos vendidos</div>
        <div className="mt-3 h-3 bg-black rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      <div className="mt-4 text-white/90 text-sm flex items-center justify-between">
        <div>Próximo nível</div>
        <div className="text-white/60">↑</div>
      </div>

      {nextLevel && (
        <div className="mt-2 bg-[#042060] rounded-lg p-3">
          <div className="font-semibold text-white">{nextLevel.title}</div>
          <div className="text-xs text-white/80">Acumule {nextLevel.threshold.toLocaleString()} ingressos vendidos</div>
          {nextLevel.benefits && (
            <div className="mt-2 text-xs text-white/70">Benefícios: {nextLevel.benefits.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProducerJourneyCard;
