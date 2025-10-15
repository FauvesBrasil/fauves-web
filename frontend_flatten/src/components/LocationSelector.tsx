import { useState } from 'react';

const LocationSelector: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState('CE');
  const [isOpen, setIsOpen] = useState(false);

  // Lista de estados com nome e sigla
  const locations = [
    { name: 'Ceará', sigla: 'CE' },
    { name: 'São Paulo', sigla: 'SP' },
    { name: 'Rio de Janeiro', sigla: 'RJ' },
    { name: 'Bahia', sigla: 'BA' },
    { name: 'Minas Gerais', sigla: 'MG' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[120px] h-[40px] border shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] flex items-center justify-center bg-white px-4 py-0 rounded-full border-solid border-[#E0E0E0] hover:border-[#2A2AD7] transition-colors"
      >
        <svg width="12" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
          <path d="M4.875 13C4.875 13 9.75 9.1 9.75 4.875C9.75 2.1827 7.5673 0 4.875 0C2.1827 0 0 2.1827 0 4.875C0 9.1 4.875 13 4.875 13Z" fill="#091747" stroke="white" strokeLinejoin="round"/>
          <path d="M4.875 6.8258C5.1311 6.8258 5.3847 6.7753 5.6213 6.6773C5.8579 6.5793 6.0728 6.4357 6.2539 6.2546C6.435 6.0736 6.5786 5.8586 6.6766 5.622C6.7746 5.3854 6.825 5.1319 6.825 4.8758C6.825 4.6197 6.7746 4.3661 6.6766 4.1295C6.5786 3.893 6.435 3.678 6.2539 3.4969C6.0728 3.3158 5.8579 3.1722 5.6213 3.0742C5.3847 2.9762 5.1311 2.9258 4.875 2.9258C4.3579 2.9258 3.8619 3.1312 3.4962 3.4969C3.1305 3.8626 2.925 4.3586 2.925 4.8758C2.925 5.393 3.1305 5.8889 3.4962 6.2546C3.8619 6.6203 4.3579 6.8258 4.875 6.8258Z" fill="#091747" stroke="white" strokeLinejoin="round"/>
        </svg>
  <span className="text-[#091747] text-[18px] font-bold flex-1 text-left">{selectedLocation}</span>
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path fillRule="evenodd" clipRule="evenodd" d="M3.111 4.841L0 1.7681L0.778 1L3.5 3.6888L6.222 1L7 1.7681L3.889 4.841C3.786 4.9428 3.646 5 3.5 5C3.354 5 3.214 4.9428 3.111 4.841Z" fill="#091747"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E0E0E0] rounded-[16.5px] shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] z-10">
          {locations.map((location) => (
            <button
              key={location.sigla}
              onClick={() => {
                setSelectedLocation(location.sigla);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-[#091747] text-sm font-bold hover:bg-[#F1F1F1] first:rounded-t-[16.5px] last:rounded-b-[16.5px] transition-colors"
            >
              {location.sigla}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
