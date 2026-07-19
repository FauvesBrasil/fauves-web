import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video } from 'lucide-react';

interface ProviderConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: 'Zoom' | 'Google Meet' | null;
}

export const ProviderConnectModal: React.FC<ProviderConnectModalProps> = ({ isOpen, onClose, provider }) => {
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        const isDarkTheme = document.documentElement.classList.contains("dark") || document.querySelector("[data-theme-dark='true']") !== null;
        setIsDark(isDarkTheme);
    }, [isOpen]);

    if (!provider) return null;

    const title = provider === 'Zoom' ? 'Conectar Conta do Zoom' : 'Conectar Google Meet';
    const desc = provider === 'Zoom' 
        ? 'Para permitir que o Luma crie o Zoom automaticamente ou para usar um Zoom existente, conecte sua conta do Zoom.'
        : 'Para permitir que o Luma crie o Google Meet automaticamente, conecte sua conta do Google com autorização do Google Meet.';
    
    const btnText = provider === 'Zoom' ? 'Conectar Conta do Zoom' : 'Conectar Conta Google';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={`relative w-full max-w-[320px] rounded-[1.5rem] p-6 shadow-2xl flex flex-col border ${isDark ? "text-white border-white/8" : "bg-[#FBFBFA] border-neutral-100"}`}
                        style={{
                            background: isDark ? "rgba(20, 20, 24, 0.85)" : "rgba(255, 255, 255, 0.80)",
                            backdropFilter: "blur(40px) saturate(200%)",
                            WebkitBackdropFilter: "blur(40px) saturate(200%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-white/10 text-white/90" : "bg-gray-100 text-gray-600"}`}>
                            <Video size={28} fill="currentColor" className="opacity-80" />
                        </div>
                        
                        <h2 className={`text-xl font-semibold mb-2 ${isDark ? "text-white/95" : "text-gray-900"}`}>
                            {title}
                        </h2>
                        
                        <p className={`text-[0.95rem] mb-6 leading-relaxed ${isDark ? "text-white/60" : "text-gray-500"}`}>
                            {desc}
                        </p>
                        
                        <button 
                            onClick={onClose} // In a real app, this would redirect to OAuth
                            className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-xl transition-colors text-[0.95rem]"
                        >
                            {btnText}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
