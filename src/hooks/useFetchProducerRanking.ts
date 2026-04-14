import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';

export type RankingEntry = {
    rank: number;
    level: string;
    ticketsSold: number;
    isYou: boolean;
};

export function useFetchProducerRanking(currentOrgId?: string, timeframe: string = 'all-time') {
    const [data, setData] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams();
                if (currentOrgId) params.set('currentOrgId', currentOrgId);
                if (timeframe) params.set('timeframe', timeframe);

                const res = await fetchApi(`/api/organization/rankings/producers?${params.toString()}`);

                if (!cancelled) {
                    if (res.ok) {
                        const json = await res.json();
                        setData(json || []);
                    } else {
                        setError('Erro ao carregar ranking');
                    }
                }
                if (!cancelled) {
                    setError('Erro ao carregar ranking');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [currentOrgId, timeframe]);

    return { data, loading, error };
}
