import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isHelpCenterRoute, updateChatwootVisibility } from '@/lib/chatwoot';

const ChatwootController = () => {
  const location = useLocation();
  const isHelpPage = isHelpCenterRoute(location.pathname);

  useEffect(() => {
    // Sincroniza a visibilidade caso o SDK já esteja disponível
    updateChatwootVisibility(isHelpPage);

    // Registra listener para quando o SDK terminar de carregar assincronamente
    const handleChatwootReady = () => {
      updateChatwootVisibility(isHelpCenterRoute(window.location.pathname));
    };

    window.addEventListener('chatwoot:ready', handleChatwootReady);

    return () => {
      window.removeEventListener('chatwoot:ready', handleChatwootReady);
    };
  }, [isHelpPage]);

  return null;
};

export default ChatwootController;
