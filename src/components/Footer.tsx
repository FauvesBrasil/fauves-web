import LogoFauves from '@/components/LogoFauves';
import TextLink from '@/components/TextLink';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { ChevronDown, Instagram, Linkedin } from 'lucide-react';
import logoSquare from '@/assets/logo-square-fauves-blue.svg';

const Footer: React.FC = () => {
  const { isDark } = useTheme();
  const [termsExpanded, setTermsExpanded] = useState(false);

  const handleContactSupport = () => {
    console.log('Contacting support...');
  };
  return (
    <footer className="w-full bg-[#F6F6F6] dark:bg-[#121212] py-10 max-md:py-8">
      <div className="max-w-[1080px] mx-auto px-5 max-md:px-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-row justify-between items-start mb-8">
          <div className="flex flex-col items-start max-w-[220px] w-full">
            <h2 className="text-foreground/80 text-[38px] font-extrabold leading-tight w-[182px] h-[98px] mb-5">
              Precisa de ajuda?
            </h2>
            <button
              onClick={handleContactSupport}
              className="w-44 h-[45px] flex items-center justify-center bg-[hsl(var(--brand-primary))] rounded-[31px] hover:brightness-90 transition-colors"
            >
              <span className="text-white text-center text-[15px] font-bold">
                Fale com a Fauves
              </span>
            </button>
          </div>
          <div className="flex flex-row gap-[80px] flex-wrap justify-end w-full">
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

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* CTA Button - Destaque */}
          <div className="text-center mb-6">
            <button
              onClick={handleContactSupport}
              className="w-full h-12 flex items-center justify-center bg-[hsl(var(--brand-primary))] rounded-full hover:brightness-90 transition-all shadow-lg mx-auto"
            >
              <span className="text-white text-center text-base font-bold">
                💬 Fale com a Fauves
              </span>
            </button>
          </div>

          {/* Links Principais Inline - Institucional */}
          <div className="mb-6">
            <h3 className="text-foreground text-sm font-extrabold mb-3">Institucional</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <button className="text-foreground/70 text-sm font-medium hover:text-foreground transition-colors">Conhecer</button>
              <span className="text-foreground/30">•</span>
              <button className="text-foreground/70 text-sm font-medium hover:text-foreground transition-colors">Marca</button>
              <span className="text-foreground/30">•</span>
              <button className="text-foreground/70 text-sm font-medium hover:text-foreground transition-colors">Backstage</button>
            </div>
          </div>

          {/* Accordion - Termos */}
          <div className="mb-6">
            <button
              onClick={() => setTermsExpanded(!termsExpanded)}
              className="w-full flex items-center justify-between py-3 border-y border-border dark:border-[#1F1F1F] hover:bg-foreground/5 transition-colors"
            >
              <h3 className="text-foreground text-sm font-extrabold">Termos e Políticas</h3>
              <ChevronDown
                className={`w-5 h-5 text-foreground/50 transition-transform duration-300 ${termsExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${termsExpanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}
            >
              <div className="flex flex-col gap-2.5 pl-1">
                <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors text-left">
                  Lei da Meia-Entrada
                </button>
                <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors text-left">
                  Termos de Serviço
                </button>
                <button className="text-foreground/70 text-sm font-normal hover:text-foreground transition-colors text-left">
                  Termos de Privacidade
                </button>
              </div>
            </div>
          </div>

          {/* Redes Sociais - Ícones Clean */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-extrabold">Segue a gente</h3>
              <div className="flex gap-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-foreground/70" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-foreground/70" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Desktop */}
        <div className="hidden md:flex justify-between items-center pt-6 border-t border-border dark:border-[#1F1F1F]">
          <div className="w-20 h-[38px]">
            <LogoFauves width={160} className={isDark ? 'logo-fauves-white' : 'logo-fauves-mono'} />
          </div>
          <p className="text-foreground/70 text-right text-sm font-normal">
            © 2025 Fauves LTDA. 00.000.000/0000-00 Fortaleza/CE
          </p>
        </div>

        {/* Bottom Section - Mobile (lado a lado) */}
        <div className="md:hidden flex items-center justify-between pt-6 border-t border-border dark:border-[#1F1F1F] gap-4">
          <div className="flex items-center w-12 flex-shrink-0">
            <img src={logoSquare} alt="Fauves" className="w-50 h-50" />
          </div>
          <p className="text-foreground/50 text-right text-[10px] leading-tight font-normal flex-1">
            © 2025 Fauves LTDA.<br />
            00.000.000/0000-00<br />
            Fortaleza/CE
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
