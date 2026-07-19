export function getEventPath(ev: { id: string; slug?: string | null }) {
  const identifier = ev?.slug || ev?.id;
  return `/${identifier}`;
}

export function getOrganizationPath(org: { id: string; slug?: string | null }) {
  if (org?.slug) return `/${org.slug}`;
  return `/${org.id}`;
}
