import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LuxTimePickerProps {
    value: string; // HH:mm
    onChange: (time: string) => void;
    className?: string;
    minTime?: string;
}

export const LuxTimePicker: React.FC<LuxTimePickerProps> = ({ value, onChange, className, minTime }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    
    // Generate times 00:00 to 23:30
    const times = React.useMemo(() => {
        const arr = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hh = String(h).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                arr.push(`${hh}:${mm}`);
            }
        }
        return arr;
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to selected time when opened
    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedElement = listRef.current.querySelector('[data-selected="true"]');
            if (selectedElement) {
                // Center the element in the scrolling list
                selectedElement.scrollIntoView({ block: 'center', behavior: 'auto' });
            }
        }
    }, [isOpen]);

    const handleTimeClick = (t: string) => {
        onChange(t);
        setIsOpen(false);
    };

    return (
        <div className="relative h-full flex items-center justify-center" ref={containerRef}>
            <div 
                className={className} 
                onClick={() => setIsOpen(!isOpen)}
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}
            >
                {value || '00:00'}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fauves-floating-surface absolute right-0 top-[calc(100%+12px)] z-50 rounded-xl p-2 w-[120px] border"
                        style={{ transformOrigin: 'top right' }}
                    >
                        <div 
                            ref={listRef}
                            className="max-h-[260px] overflow-y-auto no-scrollbar flex flex-col gap-1 pr-1"
                        >
                            {times.map((t) => {
                                const isSelected = t === value;
                                
                                let isDisabled = false;
                                if (minTime) {
                                    const [mh, mm] = minTime.split(':').map(Number);
                                    const [th, tm] = t.split(':').map(Number);
                                    if (th < mh || (th === mh && tm < mm)) {
                                        isDisabled = true;
                                    }
                                }

                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        disabled={isDisabled}
                                        data-selected={isSelected}
                                        onClick={(e) => { e.stopPropagation(); handleTimeClick(t); }}
                                        style={isSelected ? { backgroundColor: 'var(--theme-accent, #7F5F34)' } : undefined}
                                        className={`
                                            w-full py-2.5 rounded-lg text-center text-[0.95rem] transition-all font-mono
                                            ${isSelected 
                                                ? 'text-white font-medium shadow-sm' 
                                                : isDisabled
                                                    ? 'text-gray-300 dark:text-zinc-700 opacity-30 cursor-not-allowed pointer-events-none'
                                                    : 'text-gray-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'}
                                        `}
                                    >
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
