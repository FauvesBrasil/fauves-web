import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import { useTheme } from '@/context/ThemeContext';

/* ─── TOKENS & CONSTANTS ─────────────────────────────────────────────────── */
const luma = {
  white: '#fff',
  gray10: '#f7f8f9',
  gray20: '#ebeced',
  gray30: '#dee0e2',
  gray60: '#939597',
  black: '#131517',
  cranberry: '#EF4118',
  maxWidth: '960px',
  opacity2: 'rgba(19, 21, 23, .02)',
  opacity32: 'rgba(19, 21, 23, .32)',
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: 'currentColor' }}>
    <path fill="currentColor" fillRule="evenodd" d="M7.467.017a8.03 8.03 0 0 0-5.859 3.176C.799 4.26.296 5.477.073 6.906c-.082.523-.082 1.665 0 2.188.342 2.194 1.403 3.995 3.122 5.299 1.062.806 2.286 1.312 3.711 1.534.523.082 1.665.082 2.188 0 1.944-.303 3.596-1.179 4.836-2.565 1.1-1.229 1.735-2.587 1.997-4.268.082-.523.082-1.665 0-2.188-.222-1.425-.728-2.649-1.534-3.711A8 8 0 0 0 9 .066 13 13 0 0 0 7.467.017m3.96 4.774a1 1 0 0 0-.197.107c-.048.037-1.022 1.175-2.165 2.528-1.142 1.353-2.09 2.46-2.105 2.459s-.194-.175-.396-.387c-1.94-2.033-1.915-2.01-2.274-2.01a.78.78 0 0 0-.728.476c-.06.13-.07.18-.058.359a.66.66 0 0 0 .082.32c.037.063.713.788 1.503 1.61 1.597 1.664 1.551 1.625 1.914 1.628.12.007.24-.02.346-.08.156-.076.28-.215 2.594-2.952 1.353-1.601 2.456-2.929 2.49-3 .188-.39-.037-.912-.456-1.06a.96.96 0 0 0-.55.002" />
  </svg>
);

const PricingPage: React.FC = () => {
  const { isDark } = useTheme();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className={`theme-root ${isDark ? 'dark dark-mode' : 'light'} pricing-page`} style={{ backgroundColor: isDark ? '#121417' : luma.gray10, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .pricing-page, .pricing-page * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }

        .pricing-page {
          --opacity-2: ${luma.opacity2};
          --opacity-32: ${luma.opacity32};
          background: linear-gradient(-90deg, var(--opacity-2) 1px, transparent 1px), 
                      linear-gradient(var(--opacity-2) 1px, transparent 1px), 
                      linear-gradient(-90deg, var(--opacity-2) 1px, transparent 1px), 
                      linear-gradient(var(--opacity-2) 1px, transparent 1px);
          background-size: 6px 6px, 6px 6px, 120px 120px, 120px 120px;
          color: ${luma.black};
        }

        .zm-container {
          max-width: ${luma.maxWidth};
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Toggle Switcher */
        .lux-button-switcher {
          background-color: ${luma.gray20};
          padding: 2px;
          border-radius: 100px;
          display: inline-flex;
          position: relative;
          cursor: pointer;
          margin-top: 2rem;
          user-select: none;
        }
        .switcher-segment {
          flex: 1;
          padding: 8px 0;
          font-size: 16px;
          font-weight: 500;
          color: ${luma.gray60};
          z-index: 2;
          transition: color 0.2s;
          text-align: center;
          min-width: 100px;
        }
        .switcher-segment.active {
          color: ${luma.black};
        }
        .switcher-slider {
          position: absolute;
          top: 2px;
          bottom: 2px;
          background: #fff;
          border-radius: 100px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }

        /* Cards */
        .content-card {
          background: #fff;
          border-radius: 0.75rem;
          box-shadow: 0 .7px 2.7px rgba(0, 0, 0, .01), 0 1.7px 6.9px rgba(0, 0, 0, .016), 0 3.5px 14.2px rgba(0, 0, 0, .02), 0 7.3px 29.2px rgba(0, 0, 0, .024);
          padding: 1.125rem 1.25rem;
        }
        .plans {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 3rem;
        }

        .plan-header .title { font-size: 18px; font-weight: 600; margin-bottom: 0.25rem; }
        .plan-header .price { font-size: 40px; font-weight: 400; line-height: 1.1; }
        .plan-header .price-info { font-size: 16px; color: ${luma.gray60}; margin-top: 0.25rem; }
        .plan-details-header { font-size: 16px; color: ${luma.gray60}; font-weight: 400; margin: 1.5rem 0 0.75rem; }

        .feature-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 16px;
          padding: 0.35rem 0;
          line-height: 1.4;
        }
        .feature-row .icon { color: ${luma.black}; opacity: 0.8; margin-top: 2px; }

        hr { border: none; border-top: 1px solid ${luma.gray20}; margin: 1rem 0; }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          font-size: 16px;
          padding: 10px;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.1s;
          width: 100%;
        }
        .btn.primary { background: ${luma.black}; color: #fff; }
        .btn.brand { background: ${luma.cranberry}; color: #fff; }
        .btn:active { transform: scale(0.98); }

        .pill.variant-color-cranberry {
          background: rgba(243, 26, 124, 0.08);
          color: ${luma.cranberry};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .empresarial-section {
          background: #fff;
          border-radius: 0.75rem;
          padding: 1.25rem 2rem;
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        /* Complementos Refined (Luma Style) */
        .complementos-card {
          margin-top: 4rem;
          background: #fff;
          border-radius: 1rem;
          display: flex;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid ${luma.gray20};
        }
        .complementos-card .left-panel {
          flex: 1;
          padding: 1.125rem 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .complementos-card .left-top { display: flex; gap: 1rem; }
        .complementos-card .icon { color: ${luma.gray60}; width: 24px; height: 24px; flex-shrink: 0; margin-top: 16px; }
        .complementos-card .icon svg { width: 24px; height: 24px; }
        .complementos-card .title { font-size: 20px; font-weight: 500; color: ${luma.black}; margin-bottom: 0.25rem; }
        .complementos-card .desc { font-size: 16; color: ${luma.gray60}; line-height: 1.5; maxWidth: 360px; }
        .complementos-card .footnote { font-size: 12px; color: ${luma.gray60}; margin-top: 2rem; opacity: 0.8; }
        
        .complementos-card .right-panel { 
          width: 360px; 
          background: #f7f8f9; 
          padding: 1.125rem 1.25rem;
          border-left: 1px solid ${luma.gray20};
        }
        .complementos-card .table-header { 
          display: flex; justify-content: space-between; 
          font-size: 13px; font-weight: 400; color: ${luma.gray60};
          padding-bottom: 1rem;
        }
        .complementos-card .table-row {
          display: flex; justify-content: space-between; align-items: baseline;
          padding: 0.75rem 0;
          font-size: 15px;
          border-top: 1px solid rgba(0,0,0,0.04);
        }
        .complementos-card .table-row:first-of-type { border-top: none; }
        .complementos-card .table-row .price { font-weight: 400; }
        .complementos-card .table-row .unit { color: ${luma.gray60}; font-size: 13px; margin-left: 1px; }
        .complementos-card .annually-note { font-size: 11px; color: ${luma.gray60}; text-align: right; padding-top: 1rem; opacity: 0.8; }

        /* Empresarial Refined */
        .enterprise-card {
          margin-top: 1.5rem;
          background: #fff;
          border-radius: 1rem;
          padding: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid ${luma.gray20};
          position: relative;
          overflow: hidden;
        }
        .enterprise-header-container {
          padding: 1.5rem 1.25rem;
        }
        .enterprise-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .enterprise-info { display: flex; gap: 1rem; align-items: flex-start; }
        .enterprise-info .icon { color: ${luma.gray60}; width: 21px; height: 18.75px; flex-shrink: 0; margin-top: 6px; }
        .enterprise-info .icon svg { width: 21px; height: 18.75px; }
        .enterprise-info .title { font-size: 18px; font-weight: 500; color: ${luma.black}; margin-bottom: 0.25rem; }
        .enterprise-info .desc { font-size: 14px; color: ${luma.gray60}; }
        
        .enterprise-features {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
          background: #f7f8f9;
          padding: 0.75rem 0;
          border-top: 1px solid ${luma.gray20};
        }
        .enterprise-features .inner {
          display: flex;
          animation: marquee 40s linear infinite;
        }
        .enterprise-features span {
          font-family: 'Inter', monospace;
          font-size: 13px;
          color: ${luma.gray60};
          letter-spacing: 0.05em;
          padding-right: 2rem;
          opacity: 0.7;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 1000px) {
          .enterprise-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .enterprise-header .btn { width: 100%; }
          .enterprise-card { padding: 2rem; }
        }

        @media (max-width: 1000px) {
          .plans { grid-template-columns: 1fr; gap: 1.5rem; }
          .complementos-card { flex-direction: column; }
          .complementos-card .right-panel { width: 100%; border-left: none; border-top: 1px solid ${luma.gray20}; }
          .complementos-card .footnote { margin-top: 2rem; }
        }

        /* Dark Theme Overrides */
        .theme-root.dark {
          background-color: #121417 !important;
          color: #ffffff !important;
        }

        .theme-root.dark .pricing-page {
          --opacity-2: rgba(255, 255, 255, 0.025);
          --opacity-32: rgba(255, 255, 255, 0.08);
          background-color: #121417 !important;
          color: #ffffff !important;
        }

        .theme-root.dark h1,
        .theme-root.dark h2,
        .theme-root.dark h3,
        .theme-root.dark h4,
        .theme-root.dark .title {
          color: #ffffff !important;
        }

        .theme-root.dark p,
        .theme-root.dark .price-info,
        .theme-root.dark .plan-details-header,
        .theme-root.dark .footnote,
        .theme-root.dark .desc,
        .theme-root.dark .unit,
        .theme-root.dark .annually-note,
        .theme-root.dark .table-header,
        .theme-root.dark .enterprise-features span {
          color: rgba(255, 255, 255, 0.5) !important;
        }

        /* Switcher */
        .theme-root.dark .lux-button-switcher {
          background-color: rgba(255, 255, 255, 0.06) !important;
        }
        .theme-root.dark .switcher-slider {
          background-color: rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
        }
        .theme-root.dark .switcher-segment {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .theme-root.dark .switcher-segment.active {
          color: #ffffff !important;
        }

        /* Cards */
        .theme-root.dark .content-card,
        .theme-root.dark .enterprise-card,
        .theme-root.dark .complementos-card {
          background: #1c1c20 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }

        .theme-root.dark .complementos-card .right-panel {
          background: #141416 !important;
          border-left-color: rgba(255, 255, 255, 0.08) !important;
        }

        .theme-root.dark .enterprise-features {
          background: #141416 !important;
          border-top-color: rgba(255, 255, 255, 0.08) !important;
        }

        .theme-root.dark hr {
          border-top-color: rgba(255, 255, 255, 0.08) !important;
        }

        .theme-root.dark .table-row {
          border-top-color: rgba(255, 255, 255, 0.04) !important;
          border-bottom-color: rgba(255, 255, 255, 0.04) !important;
        }

        /* Buttons */
        .theme-root.dark .btn.primary {
          background: #ffffff !important;
          color: #121417 !important;
        }
        .theme-root.dark .btn.primary:hover {
          background: #e4e4e7 !important;
        }

        .theme-root.dark .btn.brand {
          background: #EF4118 !important;
          color: #ffffff !important;
        }
        .theme-root.dark .btn.brand:hover {
          background: #d83510 !important;
        }

        /* Footer */
        .theme-root.dark footer {
          background-color: #121417 !important;
          border-top-color: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>

      <HeaderV2 transparent />

      <main style={{ paddingTop: 'var(--page-top-spacing)', paddingBottom: '100px' }}>
        <div className="zm-container">
          <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '3.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>Preços</h1>
            <p style={{ fontSize: '1.25rem', fontWeight: 300, color: isDark ? 'rgba(255,255,255,0.6)' : luma.gray60, maxWidth: '600px', margin: '0 auto' }}>
              Use a Fauves gratuitamente com eventos e convidados ilimitados. Faça um upgrade para mais convites, 0% de taxa de plataforma e mais.
            </p>

            <div className="lux-button-switcher" onClick={() => setIsAnnual(!isAnnual)}>
              <div
                className="switcher-slider"
                style={{
                  left: '2px',
                  width: 'calc(50% - 2px)',
                  transform: isAnnual ? 'translateX(100%)' : 'translateX(0)'
                }}
              />
              <div className={`switcher-segment ${!isAnnual ? 'active' : ''}`}>Mensal</div>
              <div className={`switcher-segment ${isAnnual ? 'active' : ''}`}>Anual</div>
            </div>
          </header>

          <div className="plans">
            {/* PLANO GRÁTIS */}
            <div className="content-card">
              <div className="plan-header">
                <div className="title">Fauves</div>
                <div className="price">Grátis</div>
                <div className="price-info">Grátis, para sempre</div>
                <div className="cta" style={{ marginTop: '1.5rem' }}>
                  <Link to="/signin" className="btn primary">Começar</Link>
                </div>
              </div>
              <div className="plan-details-header">Use a Fauves gratuitamente com:</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Número ilimitado de eventos</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Número ilimitado de convidados por evento</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Disparos e lembretes automáticos via email, SMS, notificação push e WhatsApp</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Envie até 500 convites ou boletins por semana através da Fauves</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Faça o check-in dos convidados para seus eventos através da Fauves</div>
              <hr />
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Aceite todos os cartões de crédito, Apple Pay e Google Pay</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Aceite métodos de pagamento regionais como iDEAL, Konbini e PayNow</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Configure tipos de ingressos, compras em grupo e cupons</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Taxa de 5% da plataforma para eventos pagos</div>
              <hr />
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Cohosts e gerentes de eventos ilimitados</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Até 3 administradores para o seu calendário</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Exigir aprovação ou token para registro</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Importar e exportar dados via CSV</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Integração do Zoom com rastreamento de presença</div>
            </div>

            {/* PLANO PLUS */}
            <div className="content-card">
              <div className="plan-header">
                <div className="title" style={{ color: luma.cranberry }}>Fauves Plus</div>
                <div className="price">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span className="mono-number" style={{ fontFamily: 'monospace' }}>R$ {isAnnual ? '299' : '349'}</span>
                    {isAnnual && <div className="pill variant-color-cranberry">Economize 14%</div>}
                  </div>
                </div>
                <div className="price-info">{isAnnual ? 'Por mês, cobrado anualmente' : 'Por mês'}</div>
                <div className="cta" style={{ marginTop: '1.5rem' }}>
                  <Link to="/checkout/plus" className="btn brand">Obtenha o Fauves Plus</Link>
                </div>
              </div>
              <div className="plan-details-header">Tudo no plano gratuito, mais:</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>0% de taxa de plataforma para eventos pagos</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Envie até 5.000 convites e boletins por semana através do Fauves</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Capacidade de coletar impostos sobre a venda de ingressos</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Função de gerente de check-in para seus eventos</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>URL personalizada para páginas de eventos</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Coletar nome e sobrenome separados dos convidados</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>5 administradores de calendário incluídos, com mais vagas disponíveis para compra</div>
              <hr />
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Automatize fluxos de trabalho com o Zapier</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Acesso à API</div>
              <hr />
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Suporte prioritário</div>
              <div className="feature-row"><div className="icon"><CheckIcon /></div>Acesso antecipado a recursos selecionados</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : luma.gray60, lineHeight: 1.6 }}>
            EfíBank, nosso processador de pagamentos, cobra uma taxa de cartão de crédito (normalmente 2,9% + 30 centavos). A taxa da plataforma é adicional à taxa do EfíBank.
          </div>

          {/* COMPLEMENTOS */}
          <div className="complementos-card mb-5">
            <div className="left-panel">
              <div className="left-top">
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                    <g fill="none" fillRule="evenodd">
                      <path fill="currentColor" fillOpacity="0.133" d="M15.304 16.696 29.285 2.715c1.327 2.49-3.807 20.318-6.793 25.491-3.539 6.13-7.188-11.51-7.188-11.51m0 0L29.285 2.715z" />
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.304 16.696s-17.64-3.65-11.51-7.188c5.173-2.986 23-8.12 25.491-6.793m-13.98 13.98s3.648 17.641 7.187 11.511c2.986-5.173 8.12-23 6.793-25.491m-13.98 13.98 13.98-13.98M4 22.667l2.943-2.944m2.566 3.091 2.976-2.976m-2.503 8.16 2.603-2.605" />
                    </g>
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="title">Complementos</div>
                  <div className="desc">O Fauves Plus vem com 5.000 envios de convites e newsletters por semana. Precisa de ainda mais? Nós temos a solução para você.</div>
                </div>
              </div>
              <div className="footnote">Você sempre pode enviar blasts ilimitados para os convidados do evento.</div>
            </div>

            <div className="right-panel">
              <div className="table-header">
                <div>Envios Semanais</div>
                <div>Preço</div>
              </div>
              {[
                { c: '5.000', p: 'Incluído' },
                { c: '10.000', p: 'US$ 50', u: '/mês' },
                { c: '25.000', p: 'US$ 200', u: '/mês' },
                { c: '50.000', p: 'US$ 400', u: '/mês' },
                { c: '75.000', p: 'US$ 600', u: '/mês' },
                { c: '100.000', p: 'US$ 800', u: '/mês' },
              ].map((row, i) => (
                <div key={i} className="table-row">
                  <div className="mono-number">{row.c}</div>
                  <div className="price">
                    {row.p}
                    {row.u && <span className="unit">{row.u}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EMPRESARIAL */}
          <div className="enterprise-card mb-5">
            <div className="enterprise-header-container">
              <div className="enterprise-header">
                <div className="enterprise-info">
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                      <g fill="none" fillRule="evenodd">
                        <path fill="currentColor" fillOpacity="0.133" fillRule="nonzero" d="m19.11 3.5 2.126 8.015c.309 1.16.266 2.712-.103 3.75L16.715 27.69c-.383 1.08-1.047 1.08-1.43 0l-4.418-12.424c-.37-1.04-.412-2.592-.101-3.751L12.898 3.5" />
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.013 13.216h27.973M19.11 3.5l2.127 8.015c.309 1.16.266 2.712-.103 3.75L16.715 27.69c-.383 1.08-1.047 1.08-1.43 0l-4.418-12.424c-.37-1.04-.412-2.592-.101-3.751L12.898 3.5M2.794 15.266 14.16 27.69a2.496 2.496 0 0 0 3.68 0l11.367-12.425a3.02 3.02 0 0 0 .265-3.75l-4.577-6.69a3.06 3.06 0 0 0-2.52-1.325H9.64c-1.008 0-1.951.495-2.519 1.324l-4.59 6.69a3.02 3.02 0 0 0 .263 3.752" />
                      </g>
                    </svg>
                  </div>
                  <div>
                    <div className="title">Empresarial</div>
                    <div className="desc">Precisa de algo mais? Entre em contato para solicitar um plano empresarial.</div>
                  </div>
                </div>
                <Link to="/enterprise" className="btn primary" style={{ width: 'auto', padding: '12px 28px' }}>Contate-Nos</Link>
              </div>
            </div>

            <div className="enterprise-features">
              <div className="inner">
                {[
                  'Conta Organizacional', 'Restrições de Segurança', 'Eventos Comunitários',
                  'Login Único', 'Integrações Avançadas', 'APIs Adicionais', 'Recursos Personalizados'
                ].map((feat, i) => (
                  <span key={i}>{feat} · </span>
                ))}
                {/* Repetir para o efeito de loop infinito */}
                {[
                  'Conta Organizacional', 'Restrições de Segurança', 'Eventos Comunitários',
                  'Login Único', 'Integrações Avançadas', 'APIs Adicionais', 'Recursos Personalizados'
                ].map((feat, i) => (
                  <span key={`dup-${i}`}>{feat} · </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterV2 />
    </div>
  );
};

export default PricingPage;
