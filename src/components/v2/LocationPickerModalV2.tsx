"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Video, Globe, ChevronRight } from "lucide-react";

interface LocationPickerModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: { type: string; address?: string; url?: string }) => void;
}

export default function LocationPickerModalV2({ isOpen, onClose, onSelect }: LocationPickerModalV2Props) {
    const [view, setView] = React.useState<"options" | "address" | "virtual">("options");
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        const isDarkTheme = document.documentElement.classList.contains("dark") || document.querySelector("[data-theme-dark='true']") !== null;
        setIsDark(isDarkTheme);
    }, [isOpen]);
    const [address, setAddress] = React.useState("");
    const [url, setUrl] = React.useState("");

    const handleSave = () => {
        if (view === "address") {
            onSelect({ type: "Local", address });
        } else if (view === "virtual") {
            onSelect({ type: "Virtual", url });
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border ${isDark ? "text-white border-white/8" : "bg-white border-neutral-100"}`}
                        style={{
                            background: isDark ? "rgba(20, 20, 24, 0.85)" : "rgba(255, 255, 255, 0.80)",
                            backdropFilter: "blur(40px) saturate(200%)",
                            WebkitBackdropFilter: "blur(40px) saturate(200%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-white/5" : "border-gray-100"}`}>
                            <h2 className={`text-xl font-semibold ${isDark ? "text-white/95" : "text-gray-900"}`}>
                                {view === "options" ? "Local do Evento" : view === "address" ? "Localização Física" : "Link Virtual"}
                            </h2>
                            <button 
                                onClick={onClose}
                                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white/80 hover:text-white" : "hover:bg-gray-100 text-gray-500"}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {view === "options" && (
                                <div className="space-y-4">
                                    <div 
                                        onClick={() => setView("address")}
                                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isDark ? "bg-white/10 text-white" : "bg-white text-gray-700"}`}>
                                            <MapPin size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-semibold ${isDark ? "text-white/90" : "text-gray-900"}`}>Localização Física</div>
                                            <div className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>Endereço, local ou estabelecimento</div>
                                        </div>
                                        <ChevronRight size={18} className={isDark ? "text-white/30" : "text-gray-300"} />
                                    </div>

                                    <div 
                                        onClick={() => setView("virtual")}
                                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isDark ? "bg-white/10 text-white" : "bg-white text-gray-700"}`}>
                                            <Video size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-semibold ${isDark ? "text-white/90" : "text-gray-900"}`}>Virtual</div>
                                            <div className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>Zoom, Google Meet ou Youtube</div>
                                        </div>
                                        <ChevronRight size={18} className={isDark ? "text-white/30" : "text-gray-300"} />
                                    </div>
                                </div>
                            )}

                            {view === "address" && (
                                <div className="space-y-4">
                                    <input 
                                        className={`w-full p-4 rounded-2xl border transition-colors text-lg focus:outline-none ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20" : "bg-gray-50 border-transparent focus:ring-1 focus:ring-black/10 text-gray-900"}`}
                                        placeholder="Digite o endereço..."
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        autoFocus
                                    />
                                    <p className={`text-sm px-2 italic ${isDark ? "text-white/40" : "text-gray-500"}`}>Ex: Av. Paulista, 1000 - São Paulo, SP</p>
                                </div>
                            )}

                            {view === "virtual" && (
                                <div className="space-y-4">
                                    <input 
                                        className={`w-full p-4 rounded-2xl border transition-colors text-lg focus:outline-none ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20" : "bg-gray-50 border-transparent focus:ring-1 focus:ring-black/10 text-gray-900"}`}
                                        placeholder="https://zoom.us/j/..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        autoFocus
                                    />
                                    <p className={`text-sm px-2 italic ${isDark ? "text-white/40" : "text-gray-500"}`}>Cole o link da sua reunião virtual</p>
                                </div>
                            )}
                        </div>

                        {view !== "options" && (
                            <div className={`p-6 border-t flex justify-between gap-3 ${isDark ? "border-white/5 bg-white/5" : "border-gray-100 bg-gray-50/50"}`}>
                                <button 
                                    onClick={() => setView("options")}
                                    className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors ${isDark ? "text-white/60 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
                                >
                                    Voltar
                                </button>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={onClose}
                                        className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors ${isDark ? "text-white/70 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors ${isDark ? "bg-white text-black hover:bg-white/90" : "text-white bg-black hover:bg-gray-900"}`}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
