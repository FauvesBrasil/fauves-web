export async function fetchWithToken(path: string, token?: string, opts: RequestInit = {}){
  const headers: Record<string,string> = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers: { ...(opts.headers||{}), ...headers } });
  if (!res.ok) return null;
  try { return await res.json(); } catch(e){ return null; }
}

export async function getAdminMetrics(token?: string){
  const data = await fetchWithToken('/api/admin/metrics', token);
  if (data?.ok && data?.metrics) {
    const m = data.metrics;
    return {
      salesToday: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.salesToday || 0),
      checkins: m.checkins || 0,
      eventsActive: m.eventsActive || 0,
      openTickets: m.openTickets || 0,
    };
  }
  // fallback
  return {
    salesToday: 'R$ 0,00',
    checkins: 0,
    eventsActive: 0,
    openTickets: 0,
  };
}

export async function getNextEvents(token?: string){
  const data = await fetchWithToken('/api/admin/events?perPage=6', token);
  if (data?.ok && Array.isArray(data.events)) {
    return data.events.slice(0, 6).map((ev: any) => ({
      id: ev.id,
      title: ev.name || 'Sem nome',
      status: ev.status || 'unknown',
      date: ev.startDate ? new Date(ev.startDate).toLocaleDateString('pt-BR') : '—',
      image: ev.image || null,
    }));
  }
  return [];
}

export async function getOrganizerRanking(token?: string){
  const data = await fetchWithToken('/api/admin/organizers/ranking', token);
  if (data?.ok && Array.isArray(data.rows)) {
    return data.rows.map((r: any) => ({
      id: r.id,
      name: r.name || 'Sem nome',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.value || 0),
      delta: r.change !== null ? r.change : 0,
    }));
  }
  return [];
}
