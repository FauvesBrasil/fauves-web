import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import fauvesLogo from '@/assets/logo-fauves.svg';
import heroVideo from '@/assets/0719.mp4';

const FauvesHome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useSEO({
    title: 'Fauves · Eventos que deixam marca',
    description: 'Crie eventos, venda ingressos e transforme encontros em experiências inesquecíveis com a Fauves.',
  });

  useEffect(() => {
    if (!authLoading && user) navigate('/events', { replace: true });
  }, [authLoading, user, navigate]);

  const startCreating = () => navigate('/create');

  if (authLoading || user) {
    return <div className="min-h-[100svh] bg-[#111416]" />;
  }

  return (
    <div className="fauves-home flex min-h-[100svh] flex-col overflow-hidden bg-[#111416] text-white selection:bg-[#2A2AD7] selection:text-white">
      <style>{`
        .fauves-home {
          --brand-blue: #2A2AD7;
          --brand-orange: #EF4118;
          --footer-text-color: rgba(255,255,255,.45);
          --footer-hover-color: #fff;
          --footer-border-color: rgba(255,255,255,.08);
          --footer-social-color: rgba(255,255,255,.35);
          --footer-social-hover: #fff;
          --footer-logo-color: #fff;
          --cta-gradient-start: #5c73ff;
          --cta-gradient-end: #ff6a3d;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at 12% 24%, rgba(42,42,215,.13), transparent 28rem),
            radial-gradient(circle at 78% 53%, rgba(239,65,24,.055), transparent 28rem),
            #111416;
        }
        .fauves-home-video {
          mix-blend-mode: screen;
          filter: contrast(1.08) saturate(1.12);
          -webkit-mask-image: radial-gradient(ellipse 72% 74% at 52% 51%, #000 60%, transparent 100%);
          mask-image: radial-gradient(ellipse 72% 74% at 52% 51%, #000 60%, transparent 100%);
        }
        .fauves-home-wordmark {
          filter: brightness(0) invert(1);
          opacity: .72;
        }
        .fauves-home-gradient-text {
          background: linear-gradient(100deg, #5d72ff 0%, #2A2AD7 25%, #d5489d 63%, #EF4118 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .fauves-home-primary {
          box-shadow: 0 12px 36px rgba(42,42,215,.18), 0 4px 16px rgba(239,65,24,.08);
        }
        .fauves-home-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 42px rgba(42,42,215,.25), 0 6px 20px rgba(239,65,24,.12);
        }
        .fauves-home > footer {
          margin-top: 0 !important;
        }
        @media (max-width: 767px) {
          .fauves-home-video {
            -webkit-mask-image: radial-gradient(ellipse 74% 74% at 50% 50%, #000 52%, transparent 100%);
            mask-image: radial-gradient(ellipse 74% 74% at 50% 50%, #000 52%, transparent 100%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fauves-home *, .fauves-home *::before, .fauves-home *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>

      <HeaderV2
        transparent
        theme="dark"
        scrollTransition={false}
        blueGlow={false}
        contentMaxWidth="1240px"
        explorarText="Descobrir eventos"
      />

      <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-5 pt-[70px] sm:px-8 lg:px-10">
        <main className="grid flex-1 items-center gap-6 pb-10 pt-8 md:grid-cols-[minmax(360px,.88fr)_minmax(420px,1.12fr)] md:gap-2 md:pb-6 md:pt-0 lg:min-h-[650px]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto w-full max-w-[470px] md:mx-0 md:pl-5 lg:pl-14"
          >
            <img src={fauvesLogo} alt="Fauves" className="fauves-home-wordmark mb-6 h-auto w-[92px] object-contain" />
            <h1 className="text-[clamp(2.1rem,3.3vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em]">
              Eventos que deixam<br />
              marca <span className="fauves-home-gradient-text font-semibold">começam aqui.</span>
            </h1>
            <p className="mt-7 max-w-[390px] text-[17px] font-medium leading-[1.55] text-white/58">
              Crie experiências, venda ingressos e acompanhe cada detalhe em um só lugar. Da primeira ideia ao último aplauso.
            </p>
            <button
              type="button"
              onClick={startCreating}
              className="fauves-home-primary mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-bold text-[#151719] transition duration-200"
            >
              Crie seu primeiro evento <ArrowUpRight size={16} />
            </button>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative -mx-10 flex min-h-[360px] items-center justify-center sm:mx-0 md:min-h-[560px] lg:min-h-[650px]"
            aria-label="Demonstração da experiência Fauves"
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(42,42,215,.2),rgba(239,65,24,.08)_48%,transparent_72%)] blur-2xl" />
            <video
              className="fauves-home-video relative z-[1] h-auto max-h-[690px] w-full max-w-[760px] object-contain"
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          </motion.div>
        </main>
      </div>

      <FooterV2 maxWidth="1160px" variant="home" />
    </div>
  );
};

export default FauvesHome;
