import LogoFauves from '@/components/LogoFauves';
import { useNavigate } from 'react-router-dom';

// Asset MacBook mockup
import macbookImg from '@/assets/macbook-pro-16-mockup-v4-isometric.png';

const Banner: React.FC = () => {
  const navigate = useNavigate();
  const handlePrimary = () => { navigate('/create'); };
  const handleSecondary = () => { navigate('/how-it-works'); };

  return (
    <section className="max-w-[1100px] mx-auto px-6 py-8 max-md:px-5 max-sm:px-4">
      {/* Badge outside the card */}
      <div className="flex justify-center mb-[-20px] relative z-20">
        <div className="inline-block bg-[#0f1724] dark:bg-white dark:text-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 max-sm:px-3 max-sm:py-1.5 max-sm:text-xs">
          <span className="inline-block leading-none">
            <LogoFauves variant="white" width={36} className="block max-sm:w-7 dark:hidden" />
            <LogoFauves variant="brand" width={36} className="hidden dark:block max-sm:w-7" />
          </span>
          <span className="ml-1">para produtores</span>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-[#EEF4FF] dark:bg-gray-800 shadow-sm flex items-center max-md:flex-col">
        {/* Left content - with padding */}
        <div className="flex-1 p-12 pt-10 max-md:p-6 max-md:pt-8 max-sm:p-5 max-sm:pt-7 max-sm:order-1">
          <h2 className="text-[#091747] dark:text-white text-4xl font-bold leading-tight mb-6 max-md:text-3xl max-md:mb-5 max-sm:text-[1.625rem] max-sm:mb-4 max-sm:leading-snug">
            Crie eventos, divulgue e venda ingressos com facilidade
          </h2>

          <div className="grid grid-cols-2 gap-6 max-md:gap-4 max-sm:grid-cols-1 max-sm:gap-3.5 mb-8 max-md:mb-6 max-sm:mb-0">
            <div className="flex items-start gap-3 max-sm:gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-700 flex items-center justify-center shadow-sm max-sm:w-9 max-sm:h-9 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-sm:w-[18px] max-sm:h-[18px]">
                  <path d="M1 4v6h6M23 20v-6h-6" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#2A2AD7] dark:stroke-white" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#2A2AD7] dark:stroke-white" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-[#091747] dark:text-white max-sm:text-[1.0625rem] max-sm:leading-tight">Da publicação à venda</div>
                <div className="text-sm text-[#334155] dark:text-gray-300 max-sm:text-[0.8125rem] max-sm:mt-0.5">suporte em todas as etapas.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 max-sm:gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-700 flex items-center justify-center shadow-sm max-sm:w-9 max-sm:h-9 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-sm:w-[18px] max-sm:h-[18px]">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#2A2AD7] dark:stroke-white" />
                  <line x1="7" y1="7" x2="7.01" y2="7" stroke="#2A2AD7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#2A2AD7] dark:stroke-white" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-[#091747] dark:text-white max-sm:text-[1.0625rem] max-sm:leading-tight">Publicação grátis</div>
                <div className="text-sm text-[#334155] dark:text-gray-300 max-sm:text-[0.8125rem] max-sm:mt-0.5">sem taxa de adesão ou mensalidade.</div>
              </div>
            </div>
          </div>

          {/* Buttons - hidden on mobile, shown on desktop */}
          <div className="flex gap-4 max-sm:hidden">
            <button
              onClick={handlePrimary}
              className="bg-[#2A2AD7] hover:bg-[#1e1eb0] text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              Crie seu evento
            </button>
            <button
              onClick={handleSecondary}
              className="border-2 border-[#2A2AD7] dark:border-white text-[#2A2AD7] dark:text-white hover:bg-[#2A2AD7]/5 dark:hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Veja como funciona
            </button>
          </div>
        </div>

        {/* Right side - MacBook mockup - proporcional */}
        <div className="w-[380px] flex-shrink-0 pr-0 max-md:w-full max-md:px-6 max-md:pb-6 max-sm:px-0 max-sm:pb-0 max-sm:order-2">
          <img
            src={macbookImg}
            alt="Plataforma Fauves"
            className="w-full h-auto max-sm:max-w-[340px] max-sm:ml-auto max-sm:px-2"
          />
        </div>

        {/* Buttons - shown only on mobile, below image */}
        <div className="hidden max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:w-full max-sm:px-5 max-sm:pb-5 max-sm:pt-5 max-sm:order-3">
          <button
            onClick={handlePrimary}
            className="bg-[#2A2AD7] hover:bg-[#1e1eb0] text-white w-full px-4 py-3 text-[0.9375rem] rounded-lg font-semibold shadow-lg transition-colors"
          >
            Crie seu evento
          </button>
          <button
            onClick={handleSecondary}
            className="border-2 border-[#2A2AD7] dark:border-white text-[#2A2AD7] dark:text-white hover:bg-[#2A2AD7]/5 dark:hover:bg-white/10 w-full px-4 py-3 text-[0.9375rem] rounded-lg font-semibold transition-colors"
          >
            Veja como funciona
          </button>
        </div>
      </div>
    </section>
  );
};

export default Banner;
