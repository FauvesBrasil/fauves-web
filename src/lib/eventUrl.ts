export function getEventPath(ev: { id: string; slug?: string | null }) {
  // Event slugs now go directly to root for clean URLs
  if (ev?.slug) return `/${ev.slug}`;
  // Fallback to /event/ prefix for IDs to avoid conflicts
  return `/event/${ev.id}`;
}

export function getOrganizationPath(org: { id: string; slug?: string | null }) {
  if (org?.slug) return `/org/${org.slug}`;
  return `/org/${org.id}`;
}
