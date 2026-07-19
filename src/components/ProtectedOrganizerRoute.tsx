import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import SignInModalV2 from '@/components/v2/SignInModalV2';

interface ProtectedOrganizerRouteProps {
  children: ReactNode;
  requireEventId?: boolean; // Se true, a página precisa de um eventId válido
}

export function ProtectedOrganizerRoute({ 
  children, 
  requireEventId = false 
}: ProtectedOrganizerRouteProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { selectedOrg, loading: orgLoading, refresh, error, hasAttemptedRefresh } = useOrganization();
  const params = useParams<{ id?: string; eventId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check for eventId in URL params or query string
  const eventId = params.id || params.eventId || searchParams.get('eventId');

  useEffect(() => {
    // Only check if we're not loading and don't have the required data
    if (authLoading || orgLoading || !hasAttemptedRefresh) return;

    // Check 1: User must be logged in
    if (!user) {
      return;
    }

    // Check 3: If route requires eventId, it must be present
    if (requireEventId && !eventId) {
      navigate('/organizer-events', { replace: true });
      return;
    }
  }, [user, authLoading, orgLoading, hasAttemptedRefresh, requireEventId, eventId, navigate]);

  // Show loading only on the FIRST load when we don't have user data yet
  // If we already have user/org, render immediately to avoid flash
  const isFirstLoad = (authLoading && !user) || (orgLoading && user) || (user && !hasAttemptedRefresh);
  
  if (isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render until all checks pass
  if (!user) {
    return (
      <div className="relative min-h-[100svh] overflow-hidden bg-[#111416]">
        <div aria-hidden="true" className="pointer-events-none select-none opacity-45">
          {children}
        </div>

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[7px]">
          <SignInModalV2
            open
            pageMode
            redirectPath={location.pathname}
            onClose={() => {}}
            preventClose
            onSuccess={async () => {
              if (refresh) await refresh();
            }}
          />
        </div>
      </div>
    );
  }

  // Se houver erro ao conectar com o banco/servidor, mostramos uma tela amigável ao invés de forçar criação de calendário
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-foreground text-center">
        <div className="max-w-md space-y-4">
          <div className="inline-flex p-3 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Falha ao conectar com o servidor</h2>
          <p className="text-sm text-muted-foreground">{error}. Por favor, tente recarregar.</p>
          <button 
            onClick={() => refresh && refresh()} 
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Se o usuário não possui organização/calendário, redireciona para a página V2 de criação
  if (!selectedOrg) {
    return (
      <Navigate to="/organizations/create-calendar" replace state={{ from: location.pathname }} />
    );
  }

  if (requireEventId && !eventId) {
    return null;
  }

  return <>{children}</>;
}
