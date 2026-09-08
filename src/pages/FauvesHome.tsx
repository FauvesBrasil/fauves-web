import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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
  const heroRef = useRef<HTMLElement>(null);
  const [heroEffectActive, setHeroEffectActive] = useState(false);
  const [heroEffect, setHeroEffect] = useState(0);

  useSEO({
    title: 'Fauves · Eventos que deixam marca',
    description: 'Crie eventos, venda ingressos e transforme encontros em experiências inesquecíveis com a Fauves.',
  });

  useEffect(() => {
    if (!authLoading && user) navigate('/events', { replace: true });
  }, [authLoading, user, navigate]);

  const startCreating = () => navigate('/create');

  const moveHeroEffect = (event: ReactPointerEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--hero-effect-x', `${event.clientX - rect.left}px`);
    hero.style.setProperty('--hero-effect-y', `${event.clientY - rect.top}px`);
  };

  const showHeroEffect = (event: ReactPointerEvent<HTMLButtonElement>) => {
    moveHeroEffect(event);
    setHeroEffect((current) => (current + 1) % 3);
    setHeroEffectActive(true);
  };

  if (authLoading || user) {
    return <div className="min-h-[100svh] bg-[#111416]" />;
  }

  return (
    <div className="fauves-home flex min-h-[100svh] flex-col overflow-x-hidden bg-[#111416] text-white selection:bg-[#2A2AD7] selection:text-white">
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
          position: relative;
          isolation: isolate;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(42,42,215,.18), 0 4px 16px rgba(239,65,24,.08);
        }
        .fauves-home-primary::before {
          position: absolute;
          inset: 0;
          z-index: -1;
          content: '';
          background: linear-gradient(105deg, rgba(92,115,255,.16), transparent 42%, rgba(239,65,24,.13));
          opacity: 0;
          transition: opacity .25s ease;
        }
        .fauves-home-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 42px rgba(42,42,215,.25), 0 6px 20px rgba(239,65,24,.12);
        }
        .fauves-home-primary:hover::before { opacity: 1; }
        .fauves-home-main {
          --hero-effect-x: 35%;
          --hero-effect-y: 54%;
          position: relative;
          isolation: isolate;
        }
        .fauves-home-theme-orb {
          position: absolute;
          z-index: 0;
          left: var(--hero-effect-x);
          top: var(--hero-effect-y);
          width: min(82vw, 830px);
          aspect-ratio: 1;
          overflow: hidden;
          pointer-events: none;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%) scale(.72);
          transition: left .12s linear, top .12s linear, opacity .35s ease, transform .6s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 30px 100px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.2);
        }
        .fauves-home-main[data-effect-active="true"] .fauves-home-theme-orb {
          opacity: .96;
          transform: translate(-50%, -50%) scale(1);
        }
        .fauves-home-theme-orb::before,
        .fauves-home-theme-orb::after {
          position: absolute;
          inset: -16%;
          content: '';
        }
        .fauves-home-theme-orb[data-effect="0"] {
          background:
            radial-gradient(circle at 72% 34%, rgba(255,227,70,.95), transparent 24%),
            radial-gradient(circle at 28% 30%, rgba(198,38,244,.95), transparent 38%),
            linear-gradient(135deg, #3f42e7, #f248a5 48%, #f47b20 72%, #ffd52f);
        }
        .fauves-home-theme-orb[data-effect="0"]::before {
          background: conic-gradient(from 30deg at 50% 50%, transparent, rgba(255,255,255,.2), transparent 34%, rgba(42,42,215,.2), transparent 70%);
          filter: blur(28px);
          animation: fauves-orb-turn 9s linear infinite;
        }
        .fauves-home-theme-orb[data-effect="1"] {
          background: #09090d;
        }
        .fauves-home-theme-orb[data-effect="1"]::before {
          inset: -32%;
          background: repeating-conic-gradient(from 0deg, transparent 0 2.8deg, rgba(92,115,255,.8) 3.2deg, rgba(239,65,24,.65) 3.7deg, transparent 4.3deg 8deg);
          filter: blur(1px);
          animation: fauves-warp 5s ease-in-out infinite alternate;
        }
        .fauves-home-theme-orb[data-effect="1"]::after {
          inset: 25%;
          border-radius: 50%;
          background: #08090c;
          box-shadow: 0 0 80px 60px #08090c;
        }
        .fauves-home-theme-orb[data-effect="2"] {
          background:
            radial-gradient(circle at 22% 28%, rgba(255,255,255,.2) 0 2px, transparent 3px),
            radial-gradient(circle at 68% 22%, rgba(255,224,87,.72) 0 3px, transparent 4px),
            radial-gradient(circle at 74% 70%, rgba(255,255,255,.2) 0 2px, transparent 3px),
            radial-gradient(circle at 35% 75%, rgba(92,115,255,.5) 0 4px, transparent 5px),
            linear-gradient(145deg, #ff466d, #eb2c58 46%, #ef4118);
          background-size: 82px 82px, 126px 126px, 105px 105px, 140px 140px, auto;
        }
        .fauves-home-theme-orb[data-effect="2"]::before {
          inset: 8%;
          border-radius: 44% 56% 52% 48%;
          background: radial-gradient(circle at 42% 38%, rgba(255,255,255,.28), transparent 26%), rgba(120,0,62,.17);
          filter: blur(20px);
          animation: fauves-orb-float 6s ease-in-out infinite alternate;
        }
        .fauves-home-theme-orb[data-effect="2"]::after {
          inset: 22% 12%;
          border: 2px solid rgba(255,255,255,.22);
          border-radius: 50%;
          transform: rotate(-18deg);
        }
        @keyframes fauves-orb-turn { to { transform: rotate(360deg); } }
        @keyframes fauves-warp {
          from { transform: rotate(-3deg) scale(.72); opacity: .45; }
          to { transform: rotate(4deg) scale(1.05); opacity: .9; }
        }
        @keyframes fauves-orb-float {
          from { transform: translate3d(-3%, -2%, 0) rotate(-8deg); }
          to { transform: translate3d(4%, 3%, 0) rotate(7deg); }
        }
        .fauves-home > footer {
          margin-top: 0 !important;
        }
        @media (max-width: 767px) {
          .fauves-home-shell {
            padding-top: calc(64px + env(safe-area-inset-top));
          }
          .fauves-home-main {
            grid-template-columns: minmax(0, 1fr);
            gap: 16px;
            padding-top: 28px;
          }
          .fauves-home-main > * { min-width: 0; }
          .fauves-home-copy {
            min-width: 0;
            max-width: 520px;
          }
          .fauves-home-video {
            width: min(112vw, 560px);
            max-width: 560px;
            -webkit-mask-image: radial-gradient(ellipse 74% 74% at 50% 50%, #000 52%, transparent 100%);
            mask-image: radial-gradient(ellipse 74% 74% at 50% 50%, #000 52%, transparent 100%);
          }
          .fauves-home-theme-orb { width: min(118vw, 680px); }
        }
        @media (max-width: 420px) {
          .fauves-home-copy h1 br { display: none; }
          .fauves-home-primary {
            width: 100%;
            min-height: 48px;
            justify-content: center;
          }
          .fauves-home-visual { min-height: 300px !important; }
        }
        @media (hover: none), (pointer: coarse) {
          .fauves-home-theme-orb { display: none; }
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

      <div className="fauves-home-shell mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-5 pt-[70px] sm:px-8 lg:px-10">
        <main
          ref={heroRef}
          className="fauves-home-main grid flex-1 items-center gap-6 pb-10 pt-8 md:grid-cols-[minmax(360px,.88fr)_minmax(420px,1.12fr)] md:gap-2 md:pb-6 md:pt-0 lg:min-h-[650px]"
          data-effect-active={heroEffectActive}
        >
          <div className="fauves-home-theme-orb" data-effect={heroEffect} aria-hidden="true" />
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fauves-home-copy relative z-10 mx-auto w-full max-w-[470px] md:mx-0 md:pl-5 lg:pl-14"
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
              onPointerEnter={showHeroEffect}
              onPointerMove={moveHeroEffect}
              onPointerLeave={() => setHeroEffectActive(false)}
              onFocus={() => setHeroEffectActive(true)}
              onBlur={() => setHeroEffectActive(false)}
              className="fauves-home-primary mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-bold text-[#151719] transition duration-200"
            >
              Crie seu primeiro evento <ArrowUpRight size={16} />
            </button>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="fauves-home-visual relative -mx-5 flex min-h-[340px] items-center justify-center sm:mx-0 md:min-h-[560px] lg:min-h-[650px]"
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
