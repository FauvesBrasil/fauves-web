import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface ChatwootSDKInstance {
    toggle: (action?: 'open' | 'close') => void;
    toggleBubbleVisibility: (action: 'show' | 'hide') => void;
    setUser: (identifier: string, user: Record<string, any>) => void;
    setCustomAttributes: (attributes: Record<string, any>) => void;
    deleteUser: () => void;
    setLocale: (locale: string) => void;
    reset: () => void;
    isOpen?: boolean;
    hideMessageBubble?: boolean;
  }

  interface Window {
    $chatwoot?: ChatwootSDKInstance;
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      position?: 'left' | 'right';
      type?: 'standard' | 'expanded_bubble';
      darkMode?: 'light' | 'auto';
      [key: string]: any;
    };
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
  }
}

export const isHelpCenterRoute = (pathname: string): boolean => {
  return pathname === '/ajuda' || pathname.startsWith('/ajuda/');
};

export const updateChatwootVisibility = (isHelpPage: boolean) => {
  if (typeof window === 'undefined') return;

  if (window.$chatwoot) {
    if (isHelpPage) {
      window.$chatwoot.toggleBubbleVisibility('show');
    } else {
      window.$chatwoot.toggleBubbleVisibility('hide');
      window.$chatwoot.toggle('close');
    }
  }
};

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
