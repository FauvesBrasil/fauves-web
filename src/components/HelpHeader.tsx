import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';

const HelpHeader: React.FC = () => {
    const navigate = useNavigate();

    return (
        <header className="help-site-header">
            <button
                type="button"
                className="help-site-brand"
                onClick={() => navigate('/ajuda')}
                aria-label="Página inicial da Central de Ajuda"
            >
                <LogoFauves variant="white" width={57} />
                <span className="help-site-divider" aria-hidden="true" />
                <strong>Central de Ajuda</strong>
            </button>

            <button
                type="button"
                className="help-site-return"
                onClick={() => navigate('/')}
            >
                Fauves <ArrowUpRight size={13} strokeWidth={2.2} />
            </button>

            <style>{`
                .help-site-header {
                    position: absolute;
                    z-index: 10;
                    inset: 0 0 auto;
                    height: 58px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 17px;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .help-site-brand,
                .help-site-return {
                    border: 0;
                    color: rgba(255, 255, 255, .92);
                    cursor: pointer;
                    font: inherit;
                }

                .help-site-brand {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 0;
                    background: transparent;
                }

                .help-site-divider {
                    width: 1px;
                    height: 25px;
                    background: rgba(255, 255, 255, .19);
                }

                .help-site-brand strong {
                    color: rgba(255, 255, 255, .5);
                    font-size: 13px;
                    font-weight: 700;
                    line-height: 1;
                    letter-spacing: .035em;
                    text-transform: uppercase;
                }

                .help-site-brand .logo-fauves-white {
                    display: flex;
                    align-items: center;
                    opacity: .94;
                }

                .help-site-return {
                    height: 34px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 0 13px;
                    border: 1px solid rgba(255, 255, 255, .035);
                    border-radius: 9px;
                    background: rgba(255, 255, 255, .075);
                    font-size: 12px;
                    font-weight: 650;
                    backdrop-filter: blur(12px);
                    transition: background-color .16s ease, color .16s ease;
                }

                .help-site-return:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, .12);
                }

                @media (max-width: 520px) {
                    .help-site-header { padding: 0 14px; }
                    .help-site-brand strong { font-size: 11px; }
                }
            `}</style>
        </header>
    );
};

export default HelpHeader;
