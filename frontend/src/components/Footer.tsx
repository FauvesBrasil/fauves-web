import LogoFauves from '@/components/LogoFauves';
import { useTheme } from '@/context/ThemeContext';

const Footer: React.FC = () => {
  const { isDark } = useTheme();
  const handleContactSupport = () => {
    console.log('Contacting support...');
  };
  return (
  <footer className="w-full bg-[#F6F6F6] dark:bg-[#121212] py-10 max-md:py-5 max-sm:py-[15px]">
      <div className="max-w-[1080px] mx-auto px-5">
        <div className="flex flex-row justify-between items-start mb-8 max-md:flex-col max-md:gap-5">
          <div className="flex flex-col items-start max-w-[220px] w-full max-md:mb-8">
            <h2 className="text-foreground/80 text-[38px] font-extrabold leading-tight w-[182px] h-[98px] mb-5 max-sm:text-[28px] max-sm:w-full max-sm:h-auto max-sm:mb-[15px]">
              Precisa de ajuda?
            </h2>
            <button 
              onClick={handleContactSupport}
              className="w-44 h-[45px] flex items-center justify-center bg-[hsl(var(--brand-primary))] rounded-[31px] max-sm:w-full max-sm:max-w-[200px] hover:brightness-90 transition-colors"
            >
              <span className="text-white text-center text-[15px] font-bold">
                Fale com a Fauves
              </span>
            </button>
          </div>
          <div className="flex flex-row gap-[80px] flex-wrap justify-end w-full max-md:justify-start max-md:gap-10">
            <div className="flex flex-col items-start gap-1.5 min-w-[150px]">
              <h3 className="h-8 text-foreground text-base font-extrabold">Institucional</h3>
              <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Conhecer</button>
              <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Marca</button>
              <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Backstage</button>
            </div>
            <div className="flex flex-col items-start gap-1.5 min-w-[150px]">
              <h3 className="h-8 text-foreground text-base font-extrabold">Termos</h3>
              <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Lei da Meia-Entrada</button>
              <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Termos de Serviço</button>
              <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Termos de Privacidade</button>
            </div>
            <div className="flex flex-col items-start gap-1.5 min-w-[150px]">
              <h3 className="h-8 text-foreground text-base font-extrabold">Segue a gente</h3>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Instagram</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors">Linkedin</a>
            </div>
          </div>
        </div>

  <div className="flex justify-between items-center pt-5 border-t border-border dark:border-[#1F1F1F] max-md:flex-col max-md:gap-[15px] max-md:text-center max-md:mt-5 max-sm:gap-2.5">
          <div className="w-20 h-[38px]">
            <LogoFauves width={160} className={isDark ? 'logo-fauves-white' : 'logo-fauves-mono'} />
          </div>
          <p className="text-foreground/70 text-right text-sm font-normal max-sm:text-center max-sm:text-xs">
            © 2025 Fauves LTDA. 00.000.000/0000-00Fortaleza/CE
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
