import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useEvents() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [brazilEvents, setBrazilEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('startDate', { ascending: true });

      if (error) {
        console.error("Erro ao buscar eventos:", error.message);
      } else if (data) {
        console.log("Eventos recebidos:", data);
        // Enviar tudo para ambos, só para teste
        setUpcomingEvents(data);
        setBrazilEvents(data);
      }

      setLoading(false);
    }

    fetchEvents();
  }, []);

  return { upcomingEvents, brazilEvents, loading };
}