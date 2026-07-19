import React from 'react';
import LottieReact from './LottieReact';

const LoadingOverlay: React.FC<{ title?: string; subtitle?: string; animName?: string }> = ({ title = 'Carregando seus dados', subtitle, animName = 'wired-outline-56-document-in-unfold.json' }) => {
  const animUrl = new URL(`../assets/${animName}`, import.meta.url).href;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0b0b0b]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <LottieReact path={animUrl} loop autoplay style={{ width: 160, height: 160 }} />
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
          {subtitle && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .animate-spin-slow { animation: spin-slow 2.5s linear infinite; }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
