declare global {
  interface ChatwootSDKInstance {
    toggle: (action?: 'open' | 'close') => void;
    toggleBubbleVisibility: (action: 'show' | 'hide') => void;
    setUser: (identifier: string, user: Record<string, unknown>) => void;
    setCustomAttributes: (attributes: Record<string, unknown>) => void;
    deleteUser: () => void;
    setLocale: (locale: string) => void;
    reset: () => void;
    hasLoaded?: boolean;
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
      [key: string]: unknown;
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

  const chatwoot = window.$chatwoot;

  // O SDK define window.$chatwoot antes de terminar de criar os elementos do
  // widget. Chamar toggleBubbleVisibility durante esse intervalo faz o próprio
  // SDK acessar classList em um elemento ainda inexistente.
  if (!chatwoot?.hasLoaded) return;

  if (isHelpPage) {
    chatwoot.toggleBubbleVisibility('show');
  } else {
    chatwoot.toggleBubbleVisibility('hide');
    chatwoot.toggle('close');
  }
};
