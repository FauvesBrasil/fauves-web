import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex w-full h-[60px] justify-between items-center bg-white px-[19px] py-[17px] border-b-[#F1F1F1] border-b border-solid max-md:px-5 max-md:py-[17px] max-sm:p-[15px]">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/8027dde13fc1702a4d4d0138a911ddb104eac504?width=160"
        alt="LOGO"
        className="w-20 h-[38px] shrink-0 max-sm:w-[60px] max-sm:h-auto"
      />
      <nav className="flex items-center gap-6 max-md:gap-4 max-sm:hidden">
        <button className="text-[#091747] text-sm font-bold max-md:text-xs hover:text-[#2A2AD7] transition-colors">
          Explorar
        </button>
        <button className="text-[#091747] text-sm font-bold max-md:text-xs hover:text-[#2A2AD7] transition-colors">
          Criar evento
        </button>
        <button className="w-[68px] h-[33px] flex items-center justify-center bg-[#0205D3] rounded-[95px] hover:bg-[#2A2AD7] transition-colors">
          <span className="text-white text-center text-[15px] font-bold">
            Entrar
          </span>
        </button>
      </nav>
    </header>
  );
};

export default Header;
