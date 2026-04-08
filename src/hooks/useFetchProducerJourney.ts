import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';

type Level = {
    id: string;
    title: string;
    threshold: number;
};

type ProducerJourneyData = {
    currentLevel: Level;
    sold: number;
    progressPercent: number;
    nextLevel: Level | null;
    achievedAt?: Date | null;
};

export function useFetchProducerJourney(organizationId?: string) {
    const [data, setData] = useState<ProducerJourneyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!organizationId) {
            setLoading(false);
            setData(null);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetchApi(`/api/organization/${organizationId}/producer-journey`);

                if (!cancelled) {
                    if (res.ok) {
                        const json = await res.json();

                        // Se retornou objeto vazio, significa que não há dados
                        if (json && Object.keys(json).length > 0) {
                            setData(json);
                        } else {
                            setData(null);
                        }
                    } else {
                        setError('Failed to load producer journey data');
                    }
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message || 'Unknown error');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [organizationId]);

    return { data, loading, error };
}
