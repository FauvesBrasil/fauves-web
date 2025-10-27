import React from 'react';

type LocationContextValue = {
  selectedUf: string;
  setSelectedUf: (uf: string) => void;
};

const LocationContext = React.createContext<LocationContextValue | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedUf, setSelectedUfState] = React.useState<string>(() => {
    try {
      const v = localStorage.getItem('fauves:selectedUf');
      return (v && v.toUpperCase()) || 'CE';
    } catch (e) {
      return 'CE';
    }
  });

  const setSelectedUf = (uf: string) => {
    const u = (uf || '').toUpperCase();
    setSelectedUfState(u);
    try { localStorage.setItem('fauves:selectedUf', u); } catch (e) {}
    // also dispatch a window event for legacy listeners
    try { window.dispatchEvent(new CustomEvent('fauves:uf-changed', { detail: { uf: u } })); } catch (e) {}
  };

  return (
    <LocationContext.Provider value={{ selectedUf, setSelectedUf }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = React.useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};

export default LocationContext;
