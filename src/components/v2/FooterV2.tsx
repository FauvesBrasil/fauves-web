import React from 'react';
import { Link } from 'react-router-dom';

const FauvesLogoColor = () => (
  <svg width="28" height="25" viewBox="0 0 54 25" className="footer-logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M49.3034 0L23.8588 4.80573L1.0173 2.59641L0 19.1231L8.20807 23.6367L33.9498 18.3538L50.9785 18.1225L53.2895 13.5894L49.3034 0Z" fill="currentColor" />
  </svg>
);

interface FooterV2Props {
  maxWidth?: string;
  variant?: 'default' | 'home';
}

const FooterV2: React.FC<FooterV2Props> = ({ maxWidth = '1100px', variant = 'default' }) => {
  const isHome = variant === 'home';

  return (
    <footer style={{ maxWidth: maxWidth, margin: '5rem auto 0', padding: '0 1rem 3rem', width: '100%', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        :root {
          --footer-text-color: rgba(19, 21, 23, 0.45);
          --footer-hover-color: #131517;
          --footer-border-color: rgba(19, 21, 23, 0.1);
          --footer-social-color: rgba(19, 21, 23, 0.35);
          --footer-social-hover: #131517;
          --footer-cta-color: #2A2AD7;
          --footer-logo-color: #2A2AD7;
          --cta-gradient-start: #0205D3;
          --cta-gradient-end: #FF3F00;
        }
        
        /* Quando a classe .dark estiver presente no html */
        html.dark :root, html.dark {
          --footer-text-color: rgba(255, 255, 255, 0.45);
          --footer-hover-color: #ffffff;
          --footer-border-color: rgba(255, 255, 255, 0.08);
          --footer-social-color: rgba(255, 255, 255, 0.35);
          --footer-social-hover: #ffffff;
          --footer-cta-color: #7b49ff;
          --footer-logo-color: #ffffff;
          --cta-gradient-start: #5c73ff;
          --cta-gradient-end: #ff6a3d;
        }

        .footer-nav-link {
          font-size: 0.875rem;
          color: var(--footer-text-color);
          text-decoration: none;
          transition: color 0.15s, opacity 0.15s;
          font-weight: 500;
        }
        .footer-nav-link:hover {
          color: var(--footer-hover-color);
        }

        .footer-social-link {
          color: var(--footer-social-color) !important;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .footer-social-link:hover {
          color: var(--footer-social-hover) !important;
        }

        .footer-logo-svg {
          color: var(--footer-logo-color);
          transition: color 0.25s ease;
        }

        .footer-home-legal {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-top: 1.1rem;
        }

        @media (max-width: 640px) {
          .footer-home-main {
            align-items: flex-start !important;
            gap: 1.5rem;
          }
          .footer-home-navigation,
          .footer-home-legal {
            flex-wrap: wrap;
            row-gap: .75rem;
          }
        }

        .footer-cta-gradient-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          background: linear-gradient(90deg, var(--cta-gradient-start), var(--cta-gradient-end));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: opacity 0.15s;
        }
        .footer-cta-gradient-link:hover {
          opacity: 0.8;
        }
      `}</style>
      
      <div className={isHome ? 'footer-home-main' : undefined} style={{ borderTop: `1px solid var(--footer-border-color)`, paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <FauvesLogoColor />
          <nav className={isHome ? 'footer-home-navigation' : undefined} style={{ display: 'flex', gap: isHome ? '1.5rem' : '1rem' }}>
            <Link to="/discover" className="footer-nav-link">Descobrir</Link>
            {!isHome && <Link to="/organizations" className="footer-nav-link">Calendários</Link>}
            <Link to="/pricing" className="footer-nav-link">Preços</Link>
            {isHome && <a href="#app" className="footer-nav-link">App</a>}
            <Link to="/ajuda" className="footer-nav-link">Ajuda</Link>
          </nav>
        </div>
        
        {/* Right: social icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Email */}
          <a href="mailto:contato@fauves.com.br" className="footer-social-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
            </svg>
          </a>
          {/* App/Phone */}
          <a href="#" className="footer-social-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" /><line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </a>
          {/* X / Twitter */}
          <a href="#" className="footer-social-link">
            <svg width="14" height="14" viewBox="0 0 1200 1227" fill="currentColor">
              <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.828Z" />
            </svg>
          </a>
          {/* Instagram */}
          <a href="#" className="footer-social-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
        </div>
      </div>

      {isHome ? (
        <nav className="footer-home-legal">
          <Link to="/termos-de-uso" className="footer-nav-link">Termos</Link>
          <Link to="/politica-de-privacidade" className="footer-nav-link">Privacidade</Link>
          <Link to="/seguranca" className="footer-nav-link">Segurança</Link>
          <Link to="/dmca" className="footer-nav-link">DMCA</Link>
        </nav>
      ) : (
        /* CTA row */
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
          <a href="#" className="footer-cta-gradient-link">
            Hospede seu evento com a Fauves
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <g clipPath="url(#faux-arrow)">
                <path d="M7 0H9.667C9.755 0 9.84.035 9.902.098 9.965.16 10 .245 10 .333V3c0 .066-.02.131-.056.186-.037.054-.089.097-.15.122-.062.025-.129.031-.194.019-.065-.013-.124-.045-.17-.092L8.333 2.138.569 9.903l-.472-.472L7.862 1.667 6.764.569A.333.333 0 0 1 6.673.4C6.66.334 6.666.267 6.691.206 6.717.145 6.76.093 6.815.056 6.869.019 6.934 0 7 0z" fill="url(#cta-gradient-svg)" />
              </g>
              <defs>
                <linearGradient id="cta-gradient-svg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--cta-gradient-start)" />
                  <stop offset="100%" stopColor="var(--cta-gradient-end)" />
                </linearGradient>
                <clipPath id="faux-arrow"><rect width="10" height="10" fill="white" transform="matrix(-1 0 0 1 10 0)" /></clipPath>
              </defs>
            </svg>
          </a>
        </div>
      )}
    </footer>
  );
};

export default FooterV2;
