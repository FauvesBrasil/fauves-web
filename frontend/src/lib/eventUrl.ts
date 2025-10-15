export function getEventPath(ev: { id: string; slug?: string | null }) {
  if (ev?.slug) return `/event/${ev.slug}`;
  return `/event/${ev.id}`;
}
