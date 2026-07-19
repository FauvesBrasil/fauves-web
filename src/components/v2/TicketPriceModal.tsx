import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface TicketPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    isFree: boolean;
    price: number | null;
    onChange: (isFree: boolean, price: number | null) => void;
}

export default function TicketPriceModal({ isOpen, onClose, isFree, price, onChange }: TicketPriceModalProps) {
    const [localIsFree, setLocalIsFree] = React.useState(isFree);
    const [localPrice, setLocalPrice] = React.useState<number>(price || 50);
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        const isDarkTheme = document.documentElement.classList.contains("dark") || document.querySelector("[data-theme-dark=\"true\"]") !== null;
        setIsDark(isDarkTheme);
    }, [isOpen]);

    React.useEffect(() => {
        if (isOpen) {
            setLocalIsFree(isFree);
            setLocalPrice(price || 50);
        }
    }, [isOpen, isFree, price]);


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
                        layout
                        layoutDependency={localIsFree}
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
                        <motion.div layout className="flex items-start justify-between mb-6 pt-1">
                            <motion.div layout className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? "bg-white/10 text-white/90" : "bg-gray-100 text-gray-500"}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-8 h-8">
                                    <g fill="currentColor" fillRule="evenodd">
                                        <path fillOpacity="0.133" fillRule="nonzero" d="M2 9a5 5 0 0 1 5-5h12a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H7a5 5 0 0 1-5-5v-2.25a3 3 0 0 1 .888-2.13l.493-.49a3 3 0 0 0 0-4.26l-.493-.49A3 3 0 0 1 2 11.25z"></path>
                                        <path d="M1.001 9.385C1.001 6.055 3.245 3 6.41 3h19.18c3.165 0 5.408 3.054 5.41 6.385v2.902c.001.14.001.308-.012.451a1.4 1.4 0 0 1-.237.692c-.206.297-.51.436-.628.49h-.002c-.148.068-.337.138-.527.209l-.027.01c-.576.215-1.111.909-1.111 1.86 0 .954.535 1.647 1.111 1.862l.028.01c.19.07.378.141.526.209h.002c.117.054.422.193.628.49.183.262.222.536.237.691.013.144.013.31.013.451v2.902C31 25.945 28.758 29 25.593 29H6.407C3.242 29 1 25.945 1 22.614v-2.902c0-.14 0-.307.013-.45.015-.156.054-.43.237-.693.206-.296.51-.435.628-.488l.002-.001c.148-.068.337-.138.526-.209l.028-.01c.576-.215 1.111-.909 1.111-1.861 0-.953-.535-1.646-1.111-1.861l-.027-.01c-.19-.071-.38-.141-.527-.21h-.002c-.117-.053-.422-.192-.628-.489a1.4 1.4 0 0 1-.237-.692C1 12.595 1 12.428 1 12.288v-.029zM23 24v2.8c0 .11.09.2.2.2h2.393C27.297 27 29 25.235 29 22.614v-2.69a.2.2 0 0 0-.13-.188l-.003-.001c-1.469-.548-2.412-2.072-2.412-3.735s.943-3.187 2.412-3.735h.003a.2.2 0 0 0 .13-.188l-.001-2.691C28.999 6.766 27.295 5 25.59 5H23.2a.2.2 0 0 0-.2.2V8a1 1 0 1 1-2 0V5.2a.2.2 0 0 0-.2-.2H6.409C4.705 5 3 6.766 3 9.386v2.69a.2.2 0 0 0 .13.188l.002.001c1.469.548 2.412 2.072 2.412 3.735s-.943 3.187-2.412 3.735H3.13a.2.2 0 0 0-.13.188v2.691C3 25.234 4.703 27 6.407 27H20.8a.2.2 0 0 0 .2-.2V24a1 1 0 1 1 2 0m-2-5a1 1 0 1 0 2 0v-6a1 1 0 1 0-2 0zm-10.25-5a.75.75 0 0 1 1.5 0v.68c0 .1.073.183.171.201.511.094.97.27 1.348.537.615.435.981 1.088.981 1.858a.75.75 0 0 1-1.5 0c0-.25-.103-.46-.347-.632a1.6 1.6 0 0 0-.413-.202c-.121-.04-.24.056-.24.183v1.509c0 .09.06.169.147.194.415.12.838.27 1.201.483.631.37 1.152.974 1.152 1.913 0 .48-.2 1.11-.731 1.62-.386.37-.914.644-1.599.773a.21.21 0 0 0-.17.202V24a.75.75 0 0 1-1.5 0v-.68a.205.205 0 0 0-.171-.2c-.908-.169-1.506-.587-1.874-1.094a2.44 2.44 0 0 1-.446-1.15 2 2 0 0 1-.009-.13v-.02c0-.001 0-.002.75-.002h-.55c-.11 0-.203-.091-.174-.198a.75.75 0 0 1 1.474.183v.012a.94.94 0 0 0 .169.425c.086.118.252.289.59.409.121.043.241-.053.241-.181v-1.758a.2.2 0 0 0-.15-.194c-.4-.105-.806-.231-1.151-.402a2.35 2.35 0 0 1-.824-.638 1.76 1.76 0 0 1-.375-1.106c0-.77.366-1.423.981-1.857.378-.268.837-.444 1.348-.538a.206.206 0 0 0 .171-.201zm-.254 3.83a.194.194 0 0 0 .254-.188v-1.017c0-.127-.119-.223-.24-.183q-.255.087-.413.202c-.244.172-.347.381-.347.632 0 .092.023.14.055.18.044.056.133.133.309.22q.17.083.382.154m2.343 2.275a2.5 2.5 0 0 0-.329-.159.19.19 0 0 0-.26.182v1.241c0 .129.12.225.242.18.233-.084.388-.192.49-.289.218-.21.268-.441.268-.536 0-.268-.104-.44-.41-.619z"></path>
                                    </g>
                                </svg>
                            </motion.div>
                            <motion.button
                                onClick={onClose}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}
                            >
                                <X size={16} />
                            </motion.button>
                        </motion.div>

                        <motion.h2 layout className={`text-[1.25rem] font-semibold mb-1 ${isDark ? "text-white/95" : "text-gray-900"}`}>Preço do Ingresso</motion.h2>
                        <motion.p layout className={`text-[0.875rem] mb-8 font-regular leading-relaxed ${isDark ? "text-white/60" : "text-gray-400"}`}>
                            Você pode adicionar tipos de ingressos adicionais após criar o evento.
                        </motion.p>

                        <motion.div layout className={`p-1.5 rounded-xl flex gap-1 mb-6 ${isDark ? "bg-white/5" : "bg-[#F3F3F3]"}`}>
                            <button
                                onClick={() => setLocalIsFree(true)}
                                className={`flex-1 h-9 flex items-center justify-center rounded-lg font-medium text-[1rem] transition-all ${localIsFree ? (isDark ? 'bg-white text-black shadow-sm' : 'bg-white shadow-sm text-gray-900') : (isDark ? 'text-white/45 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-200/20')}`}
                            >
                                Grátis
                            </button>
                            <button
                                onClick={() => setLocalIsFree(false)}
                                className={`flex-1 h-9 flex items-center justify-center rounded-lg font-medium text-[1rem] transition-all ${!localIsFree ? (isDark ? 'bg-white text-black shadow-sm' : 'bg-white shadow-sm text-gray-900') : (isDark ? 'text-white/45 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-200/20')}`}
                            >
                                Pago
                            </button>
                        </motion.div>

                        <AnimatePresence initial={false} mode="popLayout">
                            {!localIsFree && (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                                    className="mb-8 pt-2"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <label className={`text-[0.875rem] font-medium whitespace-nowrap ${isDark ? "text-white/90" : "text-gray-900"}`}>Preço do Ingresso</label>
                                        <div className={`flex items-center rounded-xl px-4 h-11 shadow-sm flex-1 max-w-[140px] border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                                            <div className={`mr-3 pr-3 border-r font-medium text-[0.8rem] ${isDark ? "border-white/10 text-white/40" : "border-gray-100 text-gray-400"}`}>
                                                R$
                                            </div>
                                            <input
                                                type="number"
                                                value={localPrice}
                                                onChange={(e) => setLocalPrice(Number(e.target.value))}
                                                className={`w-full text-left outline-none text-[1rem] font-mono font-medium bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? "text-white" : "text-gray-900"}`}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            layout
                            onClick={() => {
                                onChange(localIsFree, localIsFree ? null : localPrice);
                                onClose();
                            }}
                            className={`w-full py-2.5 rounded-xl font-medium text-[1rem] transition-colors mt-2 ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#242424] hover:bg-black text-white"}`}
                        >
                            Confirmar
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
