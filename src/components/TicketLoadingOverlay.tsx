import React, { useEffect, useState } from 'react';

const LORDICON_SCRIPT = 'https://cdn.lordicon.com/ritcuqlt.js';

interface Props {
  title?: string;
  subtitle?: string;
  src?: string; // lordicon json URL
}

const TicketLoadingOverlay: React.FC<Props> = ({ title = 'Carregando ingressos', subtitle = 'Aguarde enquanto buscamos as melhores opções', src = 'https://cdn.lordicon.com/ivhjpjsw.json' }) => {
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    // If script already loaded, mark ready
    if ((window as any).lottiePlayer || document.querySelector(`script[src="${LORDICON_SCRIPT}"]`)) {
      setReady(true);
      return;
    }

    const s = document.createElement('script');
    s.src = LORDICON_SCRIPT;
    s.async = true;
    s.onload = () => setReady(true);
    s.onerror = () => setReady(false);
    document.body.appendChild(s);

    return () => {
      // don't remove script to allow reuse in SPA
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-40 h-40 flex items-center justify-center">
          {ready ? (
            // Using lord-icon web component
            <lord-icon
              src={src}
              trigger="loop"
              colors="primary:#4C1D95,secondary:#EF4118"
              style={{ width: 160, height: 160 }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="text-sm text-slate-500">...</div>
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
          {subtitle && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
};

export default TicketLoadingOverlay;
