import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import {
  getApiConnectionState,
  retryApiConnection,
  subscribeApiConnection,
  type ApiConnectionState,
} from '@/lib/apiBase';

const ONLINE_HEALTH_CHECK_INTERVAL_MS = 60_000;
const OFFLINE_RETRY_INTERVAL_MS = 5_000;

const ConnectionStatusToast: React.FC = () => {
  const [connection, setConnection] = React.useState<ApiConnectionState>(getApiConnectionState);
  const [retrying, setRetrying] = React.useState(false);

  React.useEffect(() => subscribeApiConnection(setConnection), []);

  React.useEffect(() => {
    const markBrowserOffline = () => setConnection({
      status: 'offline',
      reason: 'browser-offline',
      checkedAt: Date.now(),
    });
    const checkConnection = () => {
      if (document.visibilityState === 'visible') void retryApiConnection({ showChecking: false });
    };

    window.addEventListener('offline', markBrowserOffline);
    window.addEventListener('online', checkConnection);
    void retryApiConnection({ showChecking: false });

    return () => {
      window.removeEventListener('offline', markBrowserOffline);
      window.removeEventListener('online', checkConnection);
    };
  }, []);

  React.useEffect(() => {
    const intervalMs = connection.status === 'offline'
      ? OFFLINE_RETRY_INTERVAL_MS
      : ONLINE_HEALTH_CHECK_INTERVAL_MS;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void retryApiConnection({ showChecking: false });
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [connection.status]);

  const reconnect = async () => {
    setRetrying(true);
    const connected = await retryApiConnection();
    setRetrying(false);
    if (connected) window.location.reload();
  };

  if (connection.status !== 'offline') return null;

  const browserOffline = connection.reason === 'browser-offline';
  const title = browserOffline ? 'Você está desconectado' : 'Sem conexão com a Fauves';
  const description = browserOffline
    ? 'Verifique sua conexão com a internet e tente novamente.'
    : connection.reason === 'timeout'
      ? 'A conexão demorou demais. Tente reconectar.'
      : 'Não conseguimos acessar nossos servidores agora.';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[10000] flex w-[calc(100%_-_2rem)] max-w-[430px] -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-popover px-3.5 py-3 text-popover-foreground shadow-[0_14px_40px_rgba(0,0,0,0.24)]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#EF4118]/12 text-[#EF4118]">
        <WifiOff size={19} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold leading-5">{title}</strong>
        <span className="block text-xs leading-[1.35rem] text-muted-foreground">{description}</span>
      </span>
      <button
        type="button"
        onClick={reconnect}
        disabled={retrying}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
        aria-label="Tentar reconectar aos servidores"
      >
        <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">Reconectar</span>
      </button>
    </div>
  );
};

export default ConnectionStatusToast;
