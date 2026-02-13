import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';

type LevelHistory = {
    level: {
        id: string;
        name: string;
    };
    achievedAt: string;
    tickets: number;
};

export function useFetchProducerHistory(organizationId?: string) {
    const [data, setData] = useState<LevelHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetchApi(`/api/organization/${organizationId}/producer-journey/history`);

                if (!cancelled) {
                    if (res.ok) {
                        const json = await res.json();
                        setData(json || []);
                    } else {
                        setError('Erro ao carregar histórico');
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    console.error('Failed to load producer history:', e);
                    setError('Erro ao carregar histórico');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [organizationId]);

    return { data, loading, error };
}
