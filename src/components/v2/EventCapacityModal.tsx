import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FauvesSwitch } from './FauvesSwitch';

interface EventCapacityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { isLimited: boolean; capacity: number | null; waitlist: boolean }) => void;
    initialData: {
        isLimited: boolean;
        capacity: number | null;
        waitlist: boolean;
    };
}

const EventCapacityModal: React.FC<EventCapacityModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialData
}) => {
    const [isLimited, setIsLimited] = useState(initialData.isLimited);
    const [capacity, setCapacity] = useState<number>(initialData.capacity || 50);
    const [waitlist, setWaitlist] = useState(initialData.waitlist);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const isDarkTheme = document.documentElement.classList.contains("dark") || document.querySelector("[data-theme-dark=\"true\"]") !== null;
        setIsDark(isDarkTheme);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setIsLimited(initialData.isLimited);
            setCapacity(initialData.capacity || 50);
            setWaitlist(initialData.waitlist);
        }
    }, [isOpen, initialData]);

    const handleConfirm = () => {
        onConfirm({
            isLimited,
            capacity: isLimited ? Number(capacity) : null,
            waitlist: isLimited ? waitlist : false
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"
                    />

                    {/* Modal Card */}
                    <motion.div
                        layout
                        layoutDependency={isLimited}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ 
                            layout: { type: "spring", stiffness: 200, damping: 25 },
                            opacity: { duration: 0.2 } 
                        }}
                        className={`relative w-full max-w-[340px] rounded-[1rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 flex flex-col z-[10000] overflow-hidden border ${isDark ? "text-white border-white/8" : "bg-white border-neutral-100"}`}
                        style={{
                            background: isDark ? "rgba(20, 20, 24, 0.85)" : "rgba(255, 255, 255, 0.80)",
                            backdropFilter: "blur(40px) saturate(200%)",
                            WebkitBackdropFilter: "blur(40px) saturate(200%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        {/* Header Row */}
                        <motion.div layout className="flex items-start justify-between mb-6 pt-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? "bg-white/10 text-white/90" : "bg-gray-100 text-gray-500"}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-8 h-8"><path fill="currentColor" fillRule="evenodd" d="M8 15.5a.75.75 0 0 0 .75-.75V10.5h.041c.872 0 1.609 0 2.159-.08s1.195-.277 1.5-.928c.305-.65.043-1.273-.248-1.746-.29-.474-.762-1.04-1.32-1.71l-.04-.047-.422-.507-.033-.04c-.399-.478-.748-.897-1.072-1.19-.348-.314-.769-.578-1.315-.578s-.966.264-1.315.578c-.324.293-.673.712-1.071 1.19l-.034.04-.422.507-.04.047c-.557.67-1.03 1.236-1.32 1.71-.29.473-.552 1.096-.248 1.746.305.651.95.848 1.5.928s1.288.08 2.16.08h.04v4.25c0 .414.336.75.75.75M4.921 8.85c.046.022.145.057.345.086C5.695 8.998 6.321 9 7.27 9h1.46c.95 0 1.576-.002 2.004-.064.2-.03.3-.064.345-.086a1.3 1.3 0 0 0-.155-.32c-.227-.369-.626-.851-1.234-1.58l-.422-.507c-.442-.53-.723-.865-.958-1.077-.213-.193-.29-.192-.308-.192h-.003c-.02 0-.096 0-.308.192-.235.212-.516.546-.958 1.077l-.423.507c-.608.729-1.007 1.211-1.234 1.58a1.2 1.2 0 0 0-.155.32M14 2a.75.75 0 0 0 0-1.5H2A.75.75 0 1 0 2 2z"></path></svg>
                            </div>
                            <button
                                onClick={onClose}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}
                            >
                                <X size={16} />
                            </button>
                        </motion.div>

                        <motion.h2 layout className={`text-[1.25rem] font-semibold mb-1 ${isDark ? "text-white/95" : "text-gray-900"}`}>Capacidade Máxima</motion.h2>
                        <motion.p layout className={`text-[0.875rem] mb-8 font-regular leading-relaxed ${isDark ? "text-white/60" : "text-gray-400"}`}>
                            Fechar as inscrições ao atingir a capacidade. Apenas convidados aprovados contam para esse limite.
                        </motion.p>

                        {/* Options List */}
                        <motion.div layout className="space-y-2 mb-8">
                            {/* Limit Toggle */}
                            <div className="flex items-center justify-between py-2">
                                <span className={`text-[1rem] font-medium ${isDark ? "text-white/90" : "text-gray-900"}`}>Limitar Capacidade</span>
                                <FauvesSwitch checked={isLimited} onCheckedChange={setIsLimited} label="Limitar capacidade" />
                            </div>

                            <AnimatePresence initial={false} mode="popLayout">
                                {isLimited && (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                                        className="space-y-4 pt-2"
                                    >
                                        {/* Capacity Input */}
                                        <div className="flex items-center justify-between gap-4">
                                            <span className={`text-[0.875rem] font-medium whitespace-nowrap ${isDark ? "text-white/90" : "text-gray-900"}`}>Capacidade Máxima</span>
                                            <div className={`flex items-center rounded-xl px-4 h-11 shadow-sm flex-1 max-w-[100px] border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                                                <input
                                                    type="number"
                                                    value={capacity}
                                                    onChange={(e) => setCapacity(Number(e.target.value))}
                                                    className={`w-full text-right outline-none text-[1rem] font-mono font-medium bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? "text-white" : "text-gray-900"}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Waitlist Toggle */}
                                        <div className={`flex items-center justify-between py-2 border-t pt-4 ${isDark ? "border-white/5" : "border-gray-100"}`}>
                                            <div className="flex flex-col">
                                                <span className={`text-[0.875rem] font-medium ${isDark ? "text-white/90" : "text-gray-900"}`}>Lista de Espera</span>
                                                <span className={`text-xs ${isDark ? "text-white/50" : "text-gray-400"}`}>Por capacidade excedida</span>
                                            </div>
                                            <FauvesSwitch checked={waitlist} onCheckedChange={setWaitlist} label="Lista de espera" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <motion.button
                            layout
                            onClick={handleConfirm}
                            className={`w-full py-2.5 rounded-xl font-medium text-[1rem] transition-colors mt-auto ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#242424] hover:bg-black text-white"}`}
                        >
                            Confirmar
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EventCapacityModal;
