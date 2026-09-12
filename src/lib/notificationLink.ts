import { fetchApi } from '@/lib/apiBase';

export type NotificationLinkSource = {
  link?: string | null;
  type?: string | null;
};

export type NotificationDestination = {
  href: string;
  external: boolean;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CURRENT_STATIC_ROUTES: Record<string, string> = {
  '/meus-ingressos': '/events',
  '/organizer-dashboard': '/organizer-events',
  '/organizador/eventos': '/organizer-events',
  '/organizador/vendas': '/organizer-orders',
  '/organizador/financeiro': '/organizer-finances',
  '/organizador/configuracoes': '/organizations',
};

const panelTab = (legacyTab?: string) => {
  const tabs: Record<string, string> = {
    ingressos: 'registration',
    tickets: 'registration',
    convidados: 'guests',
    guests: 'guests',
    emails: 'blasts',
    blasts: 'blasts',
    analytics: 'insights',
    insights: 'insights',
    mais: 'more',
    more: 'more',
  };
  return tabs[String(legacyTab || '').toLowerCase()] || 'overview';
};

const safelyDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const eventIdFromSlug = async (identifier: string) => {
  if (UUID_PATTERN.test(identifier)) return identifier;

  try {
    const response = await fetchApi(`/api/event/slug/${encodeURIComponent(identifier)}`);
    if (!response.ok) return null;
    const event = await response.json();
    return typeof event?.id === 'string' && event.id ? event.id : null;
  } catch {
    return null;
  }
};

export async function resolveNotificationDestination(
  notification: NotificationLinkSource,
): Promise<NotificationDestination | null> {
  const rawLink = String(notification.link || '').trim();
  if (!rawLink) return null;

  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://fauves.com.br';
  let url: URL;
  try {
    url = new URL(rawLink, browserOrigin);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const isFauvesHost = /^(?:www\.)?fauves\.com\.br$/i.test(url.hostname);
  if (url.origin !== browserOrigin && !isFauvesHost) {
    return { href: url.toString(), external: true };
  }

  let pathname = url.pathname.replace(/\/{2,}/g, '/');

  const legacyPanel = pathname.match(/^\/(?:painel|painel-evento|event\/manage)\/([^/]+)(?:\/([^/]+))?\/?$/i);
  if (legacyPanel) {
    const identifier = safelyDecode(legacyPanel[1]);
    const eventId = await eventIdFromSlug(identifier);
    if (eventId) {
      return {
        href: `/event/manage/${encodeURIComponent(eventId)}/${panelTab(legacyPanel[2])}${url.search}${url.hash}`,
        external: false,
      };
    }

    return {
      href: `/event/${encodeURIComponent(identifier)}${url.search}${url.hash}`,
      external: false,
    };
  }

  pathname = pathname.replace(/^\/evento(?=\/|$)/i, '/event');
  pathname = pathname.replace(/^\/tickets\/(?=[^/]+)/i, '/ajuda/tickets/');
  pathname = pathname.replace(/^\/venues\/[^/]+\/dashboard\/banking\/?$/i, '/organizer-finances');
  pathname = CURRENT_STATIC_ROUTES[pathname.replace(/\/$/, '')] || pathname;

  return { href: `${pathname}${url.search}${url.hash}`, external: false };
}
