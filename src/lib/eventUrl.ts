import { apiUrl } from './apiBase';

export type EventDestinationInput = {
  id: string;
  slug?: string | null;
  isExternal?: boolean | null;
  externalUrl?: string | null;
  externalLink?: string | null;
};

export function getEventPath(ev: { id: string; slug?: string | null }) {
  const identifier = ev?.slug || ev?.id;
  return `/${identifier}`;
}

/**
 * Only absolute HTTP(S) destinations are accepted for directory events.
 * This keeps malformed or unsafe imported URLs from becoming clickable.
 */
export function getExternalEventUrl(ev: Partial<EventDestinationInput>): string | null {
  const raw = String(ev.externalUrl || ev.externalLink || '').trim();
  if (!raw || !(ev.isExternal || ev.externalUrl || ev.externalLink)) return null;

  try {
    const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getEventDestination(ev: EventDestinationInput) {
  const externalUrl = getExternalEventUrl(ev);
  return externalUrl
    ? { href: externalUrl, external: true as const }
    : { href: getEventPath(ev), external: false as const };
}

export function trackExternalEventClick(eventId: string, source = 'unknown') {
  if (!eventId) return;
  // Aggregate-only telemetry: no auth token, cookie, session id or full target URL.
  void fetch(apiUrl(`/api/event-metrics/outbound/${encodeURIComponent(eventId)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: source.slice(0, 120) }),
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
}

export function openExternalEventIfNeeded(
  ev: EventDestinationInput,
  source = 'unknown',
): boolean {
  const externalUrl = getExternalEventUrl(ev);
  if (!externalUrl) return false;

  trackExternalEventClick(ev.id, source);
  window.open(externalUrl, '_blank', 'noopener,noreferrer');
  return true;
}

export function openEventDestination(
  ev: EventDestinationInput,
  navigate: (path: string) => void,
  source = 'unknown',
) {
  if (openExternalEventIfNeeded(ev, source)) return;
  navigate(getEventPath(ev));
}

export function getOrganizationPath(org: { id: string; slug?: string | null }) {
  if (org?.slug) return `/${org.slug}`;
  return `/${org.id}`;
}
