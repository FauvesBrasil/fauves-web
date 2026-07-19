"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain } from "lucide-react";

interface AISuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: { mood: string, length: string, instructions: string }) => void;
}

export default function AISuggestionModal({ isOpen, onClose, onGenerate }: AISuggestionModalProps) {
    const [mood, setMood] = React.useState("party");
    const [length, setLength] = React.useState("M");
    const [instructions, setInstructions] = React.useState("");
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        const isDarkTheme = document.documentElement.classList.contains("dark") || document.querySelector("[data-theme-dark=\"true\"]") !== null;
        setIsDark(isDarkTheme);
    }, [isOpen]);

    const moods = [
        { id: "party", emoji: "🎉" },
        { id: "work", emoji: "💼" },
        { id: "funny", emoji: "🤪" },
    ];

    const lengths = [
        { id: "S", label: "C" },
        { id: "M", label: "M" },
        { id: "L", label: "L" },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        className={`relative w-full max-w-[380px] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 flex flex-col z-[10000] border ${isDark ? "text-white border-white/8" : "bg-white border-neutral-100"}`}
                        style={{
                            background: isDark ? "rgba(20, 20, 24, 0.85)" : "rgba(255, 255, 255, 0.80)",
                            backdropFilter: "blur(40px) saturate(200%)",
                            WebkitBackdropFilter: "blur(40px) saturate(200%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        <button 
                            onClick={onClose}
                            className={`absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}
                        >
                            <X size={14} />
                        </button>

                        <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                            <Brain size={22} className={isDark ? "text-white/90" : "text-gray-500"} />
                        </div>

                        <h2 className={`text-[1.3rem] font-bold mb-1 ${isDark ? "text-white/95" : "text-gray-900"}`}>Sugerir Descrição</h2>
                        <p className={`text-[0.85rem] mb-6 font-medium ${isDark ? "text-white/60" : "text-gray-400"}`}>Gere uma descrição para seu evento com IA.</p>

                        <div className="flex gap-4 mb-5">
                            <div className="flex-1">
                                <label className={`text-[0.8rem] font-bold mb-2 block ${isDark ? "text-white/50" : "text-gray-400"}`}>Humor</label>
                                <div className={`p-1 rounded-xl flex gap-1 ${isDark ? "bg-white/5" : "bg-[#F3F3F3]"}`}>
                                    {moods.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMood(m.id)}
                                            className={`flex-1 h-9 flex items-center justify-center rounded-lg text-lg transition-all ${mood === m.id ? (isDark ? 'bg-white text-black shadow-sm' : 'bg-white shadow-sm text-gray-900') : (isDark ? 'text-white/45 hover:bg-white/5' : 'hover:bg-gray-200/50')}`}
                                        >
                                            {m.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className={`text-[0.8rem] font-bold mb-2 block ${isDark ? "text-white/50" : "text-gray-400"}`}>Comprimento</label>
                                <div className={`p-1 rounded-xl flex gap-1 ${isDark ? "bg-white/5" : "bg-[#F3F3F3]"}`}>
                                    {lengths.map((l) => (
                                        <button
                                            key={l.id}
                                            onClick={() => setLength(l.id)}
                                            className={`flex-1 h-9 flex items-center justify-center rounded-lg text-[0.8rem] font-bold transition-all ${length === l.id ? (isDark ? 'bg-white text-black shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (isDark ? 'text-white/45 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-200/50')}`}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className={`text-[0.8rem] font-bold mb-2 block ${isDark ? "text-white/50" : "text-gray-400"}`}>Instruções Adicionais</label>
                            <textarea 
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Por exemplo, você poderia instruir a IA a escrever apenas em pentâmetro iâmbico."
                                className={`w-full h-24 rounded-xl p-3 text-[0.85rem] outline-none resize-none shadow-sm transition-colors border ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20" : "bg-white border-gray-100 text-gray-800 placeholder:text-gray-300 focus:border-gray-200"}`}
                            />
                        </div>

                        <button 
                            onClick={() => onGenerate({ mood, length, instructions })}
                            className={`w-full py-3.5 rounded-xl font-bold text-[0.95rem] transition-colors ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#333] hover:bg-black text-white"}`}
                        >
                            Gerar
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
