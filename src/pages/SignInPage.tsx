import React from 'react';
import HeaderV2 from '@/components/v2/HeaderV2';
import SignInModalV2 from '@/components/v2/SignInModalV2';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const requestedRedirect = sp.get('redirect') || (location.state as any)?.from?.pathname || '/events';
  const redirect = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/events';

  const handleSuccess = () => {
    navigate(redirect, { replace: true });
  };

  return (
    <div className="signin-theme-root signin-page-shell">
      <HeaderV2 
        transparent
        fixed
        theme="dark"
        scrollTransition={false}
        actionButtonText="Entrar"
        actionButtonLink="/login"
        explorarLink="/discover"
        explorarText="Descobrir eventos"
      />

      <main className="signin-page-content">
        <SignInModalV2 
          open={true} 
          onClose={() => navigate('/v2')} 
          preventClose={true} 
          pageMode
          redirectPath={redirect}
          onSuccess={handleSuccess}
        />
      </main>

      <style>{`
        .signin-page-shell {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(62% 74% at 50% 48%, rgba(57, 38, 42, 0.58) 0%, rgba(31, 27, 30, 0.32) 52%, rgba(18, 20, 22, 0) 100%),
            linear-gradient(118deg, #1a1d1c 0%, #18171a 47%, #171b1c 100%);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .signin-page-shell::before {
          content: "";
          position: absolute;
          inset: -20%;
          z-index: -2;
          pointer-events: none;
          background:
            radial-gradient(38% 42% at 20% 24%, rgba(107, 87, 61, 0.11), transparent 72%),
            radial-gradient(34% 40% at 80% 25%, rgba(80, 65, 91, 0.1), transparent 72%),
            radial-gradient(50% 44% at 50% 82%, rgba(70, 44, 49, 0.13), transparent 76%);
          filter: blur(30px);
        }

        .signin-page-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(circle at center, transparent 26%, rgba(4, 7, 8, 0.28) 100%);
        }

        .signin-page-content {
          position: relative;
          z-index: 1;
          width: 100%;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 96px 20px 48px;
        }

        @media (max-width: 640px) {
          .signin-page-content {
            align-items: flex-start;
            padding: 112px 16px 36px;
          }

          .signin-page-shell .luma-nav-v2 {
            gap: 12px;
          }

          .signin-page-shell .luma-nav-v2 > div:last-child {
            gap: 10px !important;
          }

          .signin-page-shell .luma-nav-link {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
