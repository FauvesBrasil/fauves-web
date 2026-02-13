import * as React from 'react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDark, toggle } = useTheme();
  const headerIconClass = isDark ? 'text-white' : 'text-[#091747]';
  return (
    <button aria-label="Alternar tema" title={isDark ? 'Mudar para claro' : 'Mudar para escuro'} onClick={() => toggle()} className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-[#EF4118]/20">
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={headerIconClass}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={headerIconClass}><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )}
    </button>
  );
};

export default ThemeToggle;
