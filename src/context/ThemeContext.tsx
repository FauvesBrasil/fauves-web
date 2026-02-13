import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void; // toggles between light <-> dark (system stays explicit)
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme-mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    } catch (e) {
      void e; // ignore localStorage errors (e.g., SSR or blocked storage)
    }
    return 'system';
  });

  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDark = mode === 'system' ? prefersDark : mode === 'dark';

  const applyClass = useCallback((dark: boolean) => {
    try {
      const root = document.documentElement;
      if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    } catch (e) { void e; }
  }, []);

  // apply on mount and when mode changes
  useEffect(() => {
    const update = () => {
      const prefers = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = mode === 'system' ? prefers : mode === 'dark';
      applyClass(dark);
    };
    update();

    // if system mode, listen for changes
    let mq: MediaQueryList | null = null;
    if (mode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => update();
      if (mq.addEventListener) mq.addEventListener('change', handler); else mq.addListener(handler);
      return () => {
        if (mq) {
          if (mq.removeEventListener) mq.removeEventListener('change', handler);
          else mq.removeListener(handler);
        }
      };
    }
    return () => {
      // noop
    };
  }, [mode, applyClass]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch (e) { void e; }
  }, []);

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { void e; }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

export default ThemeProvider;
