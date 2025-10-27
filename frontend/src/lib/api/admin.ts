export async function fetchWithToken(path: string, token?: string, opts: RequestInit = {}){
  const headers: Record<string,string> = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers: { ...(opts.headers||{}), ...headers } });
  if (!res.ok) return null;
  try { return await res.json(); } catch(e){ return null; }
}

export async function getAdminMetrics(token?: string){
  // endpoint may not exist in all environments; fallback to mock
  const data = await fetchWithToken('/api/admin/metrics', token);
  if (data) return data;
  return {
    salesToday: 'R$ 12.340',
    checkins: 742,
    eventsActive: 18,
    openTickets: 24,
  };
}

export async function getNextEvents(token?: string){
  const data = await fetchWithToken('/api/admin/events?perPage=6', token);
  if (data && Array.isArray(data.events)) return data.events.slice(0,6);
  // fallback mock
  return [
    { id: '1', title: 'Rock Night', org: 'Studio A', status: 'healthy', revenue: 'R$ 4.200', date: '2025-10-18' },
    { id: '2', title: 'Startup Meetup', org: 'Tech Hub', status: 'attention', revenue: 'R$ 1.120', date: '2025-10-20' },
    { id: '3', title: 'Yoga Morning', org: 'Zen Club', status: 'critical', revenue: 'R$ 320', date: '2025-10-25' },
  ];
}

export async function getOrganizerRanking(token?: string){
  const data = await fetchWithToken('/api/admin/organizers/ranking', token);
  if (data && Array.isArray(data.rows)) return data.rows;
  return [
    { id:1, name:'Studio A', value:'R$ 42.200', delta: 12 },
    { id:2, name:'Tech Hub', value:'R$ 12.100', delta: -3 },
    { id:3, name:'Zen Club', value:'R$ 8.340', delta: 5 },
  ];
}
