import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LuxDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    className?: string;
    minDate?: string;
}

export const LuxDatePicker: React.FC<LuxDatePickerProps> = ({ value, onChange, className, minDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Parse input date string (YYYY-MM-DD) to local noon to avoid timezone shift
    const parseDateStr = (dateStr: string) => {
        if (!dateStr) return new Date();
        try {
            const cleanStr = dateStr.split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length !== 3) return new Date();
            const [year, month, day] = parts.map(Number);
            if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
            return new Date(year, month - 1, day, 12, 0, 0);
        } catch {
            return new Date();
        }
    };

    const selectedDate = parseDateStr(value);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

    useEffect(() => {
        if (isOpen) {
            setCurrentMonth(startOfMonth(parseDateStr(value)));
        }
    }, [isOpen, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    const handleDateClick = (day: Date) => {
        // Create local date string YYYY-MM-DD safely
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const d = String(day.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${d}`);
        setIsOpen(false);
    };

    // Format display like "sáb., 2 de mai." (but user wants same as screenshot which is "dom., 3 de mai.")
    // Luma format: EEE., d 'de' MMM.
    let displayValue = '';
    if (value) {
        const parsed = parseDateStr(value);
        const dayOfWeekShort = format(parsed, "eee", { locale: ptBR })
            .replace('segunda-feira', 'seg')
            .replace('terça-feira', 'ter')
            .replace('quarta-feira', 'qua')
            .replace('quinta-feira', 'qui')
            .replace('sexta-feira', 'sex')
            .replace('sábado', 'sáb')
            .replace('domingo', 'dom')
            .replace('.', '')
            .toLowerCase();
        const dayOfMonth = format(parsed, "d");
        const monthShort = format(parsed, "MMM", { locale: ptBR }).replace('.', '').toLowerCase();
        
        displayValue = `${dayOfWeekShort}, ${dayOfMonth} de ${monthShort}`;
    }

    return (
        <div className="relative h-full flex items-center justify-center flex-1" ref={containerRef}>
            <div 
                className={className} 
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {displayValue || 'Selecione...'}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fauves-floating-surface absolute left-0 top-[calc(100%+12px)] z-50 rounded-[8px] p-3 w-[240px] border"
                        style={{ transformOrigin: 'top left' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-[1rem] font-bold text-gray-900 dark:text-zinc-100 capitalize">
                                {format(currentMonth, 'MMMM', { locale: ptBR })}
                            </h3>
                            <div className="flex items-center gap-1">
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); prevMonth(); }}
                                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                </button>
                                <div className="w-[4px] h-[4px] rounded-full bg-gray-400 dark:bg-zinc-600 mx-0.5 opacity-50"></div>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); nextMonth(); }}
                                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <ChevronRight size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Week days */}
                        <div className="grid grid-cols-7 mb-1">
                            {weekDays.map((day, i) => (
                                <div key={i} className="text-center text-[0.7rem] font-bold text-gray-400 dark:text-zinc-500 h-6 flex items-center justify-center">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-y-1">
                            {calendarDays.map((day, i) => {
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isToday = isSameDay(day, new Date());

                                // Check if this day is before minDate
                                let isDisabled = false;
                                if (minDate) {
                                    const parsedMin = parseDateStr(minDate);
                                    // Strip time parts for calendar day comparison
                                    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
                                    const minStart = new Date(parsedMin.getFullYear(), parsedMin.getMonth(), parsedMin.getDate()).getTime();
                                    if (dayStart < minStart) {
                                        isDisabled = true;
                                    }
                                }

                                let textColor = 'text-gray-700 dark:text-zinc-300';
                                if (isDisabled) {
                                    textColor = 'text-gray-300 dark:text-zinc-700 opacity-25 cursor-not-allowed pointer-events-none';
                                } else {
                                    if (!isCurrentMonth) textColor = 'text-gray-400 dark:text-zinc-600';
                                    if (isSelected) textColor = 'text-white';
                                }

                                return (
                                    <div key={i} className="flex items-center justify-center h-8">
                                        <button
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={(e) => { e.stopPropagation(); handleDateClick(day); }}
                                            style={isSelected ? { backgroundColor: 'var(--theme-accent, #7F5F34)' } : undefined}
                                            className={`
                                                w-7 h-7 flex items-center justify-center rounded-[8px] text-[0.875rem] transition-all
                                                ${isSelected ? 'font-medium shadow-sm' : isDisabled ? '' : 'hover:bg-black/5 dark:hover:bg-zinc-800'}
                                                ${textColor}
                                                ${isToday && !isSelected && !isDisabled ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}
                                            `}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
