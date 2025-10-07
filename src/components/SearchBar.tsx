import { useState } from 'react';

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="w-[100%] h-[48px] border shadow-[0_4px_12.9px_0_rgba(0,0,0,0.05)] flex items-center bg-white px-6 py-0 rounded-[95px] border-solid border-[#E0E0E0] max-md:w-full max-sm:h-10 max-sm:px-5 max-sm:py-0">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Pesquisar shows, eventos, espetáculos, cursos..."
        className="flex-1 text-[#C3C3C3] text-[18px] font-normal max-sm:text-xs bg-transparent border-none outline-none placeholder:text-[#C3C3C3]"
      />
      <button type="submit" className="ml-2 text-[#C3C3C3] hover:text-[#091747] transition-colors">
        <svg width="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </form>
  );
};

export default SearchBar;
