import * as React from "react";

type Step = 1 | 2 | 3;

interface StepFlowOverlayProps {
  visible: boolean;
  activeStep: Step; // 1: Criando evento, 2: Criar ingressos, 3: Publicar
  subtitle?: string;
}

const Dot: React.FC<{ state: 'inactive' | 'active' | 'completed' }> = ({ state }) => {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
        state === 'completed' ? 'border-[#2A2AD7] bg-[#2A2AD7]/10' : state === 'active' ? 'border-[#2A2AD7] bg-white shadow-[0_0_0_6px_rgba(42,42,215,0.08)]' : 'border-[#2A2AD7] bg-white'
      }`}
    >
      {state === 'completed' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path className="step-check" d="M20 6L9 17l-5-5" stroke="#2A2AD7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : state === 'active' ? (
        <span className="w-2.5 h-2.5 rounded-full bg-[#2A2AD7] animate-[pulseDot_1.2s_ease-in-out_infinite]" />
      ) : null}
    </span>
  );
};

const StepFlowOverlay: React.FC<StepFlowOverlayProps> = ({ visible, activeStep, subtitle }) => {
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white transition-opacity duration-200 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <style>{`
        @keyframes dashMove { from { background-position: 0 0; } to { background-position: 20px 0; } }
        @keyframes pulseDot { 0%,100%{ transform: scale(1);} 50%{ transform: scale(1.3);} }
        .animate-connector { background-image: repeating-linear-gradient(90deg, #2A2AD7 0 6px, transparent 6px 16px); background-size: 20px 2px; animation: dashMove 0.8s linear infinite; }
        .step-check { stroke-dasharray: 40; stroke-dashoffset: 40; animation: drawCheck 600ms ease forwards; }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
      `}</style>
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <Dot state={activeStep > 1 ? 'completed' : 'active'} />
            <span className={`mt-2 text-sm font-bold ${activeStep >= 1 ? "text-[#091747]" : "text-[#091747]/60"}`}>Criando evento</span>
          </div>
          <div className="w-40 h-[2px] animate-connector rounded-full" />
          <div className="flex flex-col items-center">
            <Dot state={activeStep > 2 ? 'completed' : (activeStep === 2 ? 'active' : 'inactive')} />
            <span className={`mt-2 text-sm font-bold ${activeStep >= 2 ? "text-[#091747]" : "text-[#091747]/60"}`}>Criar ingressos</span>
          </div>
          <div className="w-40 h-[2px] animate-connector rounded-full" />
          <div className="flex flex-col items-center">
            <Dot state={activeStep === 3 ? 'active' : 'inactive'} />
            <span className={`mt-2 text-sm font-bold ${activeStep >= 3 ? "text-[#091747]" : "text-[#091747]/60"}`}>Publicar</span>
          </div>
        </div>
        {subtitle && (
          <div className="mt-6 text-[#091747]/80 font-medium">{subtitle}</div>
        )}
      </div>
    </div>
  );
};

export default StepFlowOverlay;
