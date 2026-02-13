import { ReactNode, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';

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
  const { selectedOrg, loading: orgLoading } = useOrganization();
  const params = useParams<{ id?: string; eventId?: string }>();
  const [searchParams] = useSearchParams();
  
  // Check for eventId in URL params or query string
  const eventId = params.id || params.eventId || searchParams.get('eventId');

  useEffect(() => {
    // Only check if we're not loading and don't have the required data
    if (authLoading || orgLoading) return;

    // Check 1: User must be logged in
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    // Check 2: User must have an organization
    if (!selectedOrg) {
      navigate('/organizer-dashboard', { replace: true });
      return;
    }

    // Check 3: If route requires eventId, it must be present
    if (requireEventId && !eventId) {
      navigate('/organizer-dashboard', { replace: true });
      return;
    }
  }, [user, selectedOrg, authLoading, orgLoading, requireEventId, eventId, navigate]);

  // Show loading only on the FIRST load when we don't have user data yet
  // If we already have user/org, render immediately to avoid flash
  const isFirstLoad = authLoading && !user;
  
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
  if (!user || !selectedOrg || (requireEventId && !eventId)) {
    return null;
  }

  return <>{children}</>;
}
