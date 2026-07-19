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
  const { selectedOrg, loading: orgLoading, refresh } = useOrganization();
  const params = useParams<{ id?: string; eventId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check for eventId in URL params or query string
  const eventId = params.id || params.eventId || searchParams.get('eventId');

  useEffect(() => {
    // Only check if we're not loading and don't have the required data
    if (authLoading || orgLoading) return;

    // Check 1: User must be logged in
    if (!user) {
      return;
    }

    // Check 3: If route requires eventId, it must be present
    if (requireEventId && !eventId) {
      navigate('/organizer-events', { replace: true });
      return;
    }
  }, [user, authLoading, orgLoading, requireEventId, eventId, navigate]);

  // Show loading only on the FIRST load when we don't have user data yet
  // If we already have user/org, render immediately to avoid flash
  const isFirstLoad = (authLoading && !user) || (orgLoading && user);
  
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

