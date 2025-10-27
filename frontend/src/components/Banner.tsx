import LogoFauves from '@/components/LogoFauves';

const Banner: React.FC = () => {
  const handlePrimary = () => { window.location.href = '/publish'; };
  const handleSecondary = () => { window.location.href = '/how-it-works'; };

  return (
    <section className="max-w-[1100px] mx-auto px-6 py-8">

  <div className="mt-8 rounded-2xl bg-[#EEF4FF] p-12 pt-12 shadow-sm flex items-center gap-8 max-md:flex-col max-md:items-start relative">
      {/* Floating badge anchored to hero: sits half above the hero */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="inline-block bg-[#0f1724] text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
          <span className="inline-block leading-none">
            <LogoFauves variant="white" width={36} className="block" />
          </span>
          <span className="ml-1">para produtores</span>
        </div>
      </div>
      <div className="flex-1">
          <h2 className="text-[#2A2AD7] text-4xl font-bold leading-tight mb-6">Crie eventos, divulgue e venda ingressos com facilidade</h2>

          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
                {/* icon: chat */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H8l-5 5V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#2A2AD7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-[#091747]">Da publicação à venda</div>
                <div className="text-sm text-[#334155]">suporte em todas as etapas.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
                {/* icon: coin */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1v22" stroke="#2A2AD7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="7" stroke="#2A2AD7" strokeWidth="1.5"/></svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-[#091747]">Publicação grátis</div>
                <div className="text-sm text-[#334155]">sem taxa de adesão ou mensalidade.</div>
              </div>
            </div>
          </div>
    </div>
      
  <div className="w-[420px] flex-shrink-0 max-md:w-full">
          {/* right side image (optional) - keeps previous image if available */}
          <img src="/hero-producers.png" alt="hero" className="w-full h-[220px] object-cover rounded-lg shadow-md max-md:h-44" />

          <div className="mt-4 flex gap-4">
            <button onClick={handlePrimary} className="bg-[#2A2AD7] text-white px-5 py-2 rounded-md shadow">Crie seu evento</button>
            <button onClick={handleSecondary} className="border border-[#2A2AD7] text-[#2A2AD7] px-4 py-2 rounded-md">Veja como funciona</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
