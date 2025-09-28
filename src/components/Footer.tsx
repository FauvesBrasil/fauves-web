import React from 'react';

const Footer: React.FC = () => {
  const handleContactSupport = () => {
    console.log('Contacting support...');
  };

  return (
    <footer className="w-full h-80 relative bg-[rgba(9,23,71,0.05)] px-[156px] py-5 max-md:h-auto max-md:p-5 max-sm:p-[15px]">
      <div className="mb-5">
        <h2 className="text-[rgba(9,23,71,0.50)] text-[38px] font-extrabold w-[182px] h-[98px] mb-5 max-sm:text-[28px] max-sm:w-full max-sm:h-auto max-sm:mb-[15px]">
          Precisa de ajuda?
        </h2>
        <button 
          onClick={handleContactSupport}
          className="w-44 h-[45px] flex items-center justify-center bg-[#2A2AD7] mb-10 rounded-[31px] max-sm:w-full max-sm:max-w-[200px] max-sm:mb-[30px] hover:bg-[#0205D3] transition-colors"
        >
          <span className="text-white text-center text-[15px] font-bold">
            Fale com a Fauves
          </span>
        </button>
      </div>

      <nav className="flex gap-[29px] absolute w-[424px] h-[104px] right-[156px] top-5 max-md:static max-md:w-full max-md:justify-between max-md:mt-5 max-sm:flex-col max-sm:gap-5 max-sm:h-auto">
        <div className="flex flex-col items-start gap-1.5 max-sm:w-full">
          <h3 className="h-8 text-[#091747] text-base font-extrabold">
            Institucional
          </h3>
          <button className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors">
            Conhecer
          </button>
          <button className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors">
            Marca
          </button>
          <button className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors">
            Backstage
          </button>
        </div>
        
        <div className="flex flex-col items-start gap-1.5 max-sm:w-full">
          <h3 className="h-8 text-[#091747] text-base font-extrabold">
            Termos
          </h3>
          <button className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors">
            Lei da Meia-Entrada
          </button>
          <button className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors">
            Termos de Serviço
          </button>
          <button className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors">
            Termos de Privacidade
          </button>
        </div>
        
        <div className="flex flex-col items-start gap-1.5 max-sm:w-full">
          <h3 className="h-8 text-[#091747] text-base font-extrabold">
            Segue a gente
          </h3>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors"
          >
            Instagram
          </a>
          <a 
            href="https://linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[rgba(9,23,71,0.50)] text-sm font-normal hover:text-[#091747] transition-colors"
          >
            Linkedin
          </a>
        </div>
      </nav>

      <div className="absolute flex justify-between items-center pt-5 border-t-[#D5D5D5] border-t border-solid bottom-5 inset-x-[156px] max-md:static max-md:flex-col max-md:gap-[15px] max-md:text-center max-md:mt-5 max-sm:gap-2.5">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/c4c55f53d6583e6f046213e7141d64e0a960b5ef?width=160"
          alt="LOGO"
          className="w-20 h-[38px]"
        />
        <p className="text-[rgba(9,23,71,0.50)] text-right text-sm font-normal max-sm:text-center max-sm:text-xs">
          © 2023 Fauves Ltda. 00.000.000/0000-00Fortaleza/CE
        </p>
      </div>
    </footer>
  );
};

export default Footer;
