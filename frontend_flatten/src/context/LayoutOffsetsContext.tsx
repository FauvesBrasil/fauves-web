import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface SidebarRegistration {
  id: 'main' | 'detail';
  el: HTMLElement;
}

interface LayoutOffsetsContextValue {
  mainWidth: number;
  detailWidth: number;
  totalLeft: number; // main + detail
  register: (id: 'main' | 'detail', el: HTMLElement) => void;
  unregister: (id: 'main' | 'detail') => void;
}

const LayoutOffsetsContext = createContext<LayoutOffsetsContextValue | undefined>(undefined);

export const LayoutOffsetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widths, setWidths] = useState<{ main?: number; detail?: number }>({});
  const observersRef = useRef<Record<string, ResizeObserver>>({});
  const elementsRef = useRef<Record<string, HTMLElement>>({});

  const updateWidth = useCallback((id: 'main' | 'detail') => {
    const el = elementsRef.current[id];
    if (!el) return;
    const w = el.offsetWidth || 0;
    setWidths(prev => (prev[id] === w ? prev : { ...prev, [id]: w }));
  }, []);

  const register = useCallback((id: 'main' | 'detail', el: HTMLElement) => {
    elementsRef.current[id] = el;
    updateWidth(id);
    if (observersRef.current[id]) observersRef.current[id].disconnect();
    const ro = new ResizeObserver(() => updateWidth(id));
    ro.observe(el);
    observersRef.current[id] = ro;
  }, [updateWidth]);

  const unregister = useCallback((id: 'main' | 'detail') => {
    if (observersRef.current[id]) {
      observersRef.current[id].disconnect();
      delete observersRef.current[id];
    }
    delete elementsRef.current[id];
    setWidths(prev => ({ ...prev, [id]: 0 }));
  }, []);

  const value: LayoutOffsetsContextValue = useMemo(() => {
    const mainWidth = widths.main || 0;
    const detailWidth = widths.detail || 0;
    const totalLeft = mainWidth + detailWidth;
    // Atualiza CSS variable global (opcional para uso em tailwind custom)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--left-offset', totalLeft + 'px');
    }
    return { mainWidth, detailWidth, totalLeft, register, unregister };
  }, [widths, register, unregister]);

  return (
    <LayoutOffsetsContext.Provider value={value}>{children}</LayoutOffsetsContext.Provider>
  );
};

export const useLayoutOffsets = () => {
  const ctx = useContext(LayoutOffsetsContext);
  if (!ctx) throw new Error('useLayoutOffsets must be used within LayoutOffsetsProvider');
  return ctx;
};

// Hook utilitário para registrar automaticamente
export const useRegisterSidebar = (id: 'main' | 'detail', ref: React.RefObject<HTMLElement | null>, active: boolean = true) => {
  const { register, unregister } = useLayoutOffsets();
  React.useEffect(() => {
    if (!active) {
      unregister(id);
      return;
    }
    const el = ref.current;
    if (el) register(id, el);
    return () => unregister(id);
  }, [id, ref, register, unregister, active]);
};
