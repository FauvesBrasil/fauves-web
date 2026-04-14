import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';

export type Mission = {
    id: string;
    key: string;
    type: 'achievement' | 'daily' | 'weekly' | 'seasonal';
    title: string;
    description: string;
    requirement: number;
    rewardType: 'badge' | 'boost' | 'unlock';
    rewardValue?: string;
    progress: number;
    completed: boolean;
    completedAt?: string;
    claimedReward: boolean;
};

export function useFetchActiveMissions(organizationId?: string) {
    const [data, setData] = useState<Mission[]>([]);
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

                const res = await fetchApi(`/api/missions/${organizationId}/active`);

                if (!cancelled) {
                    if (res.ok) {
                        const json = await res.json();
                        setData(json || []);
                    } else {
                        setError('Erro ao carregar missões');
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    // no-op
                    setError('Erro ao carregar missões');
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

    const claimReward = async (missionId: string) => {
        if (!organizationId) return;

        try {
            const res = await fetchApi(`/api/missions/${organizationId}/claim/${missionId}`, {
                method: 'POST',
            });

            if (res.ok) {
                // Refresh missions after claiming
                const refreshRes = await fetchApi(`/api/missions/${organizationId}/active`);
                if (refreshRes.ok) {
                    const json = await refreshRes.json();
                    setData(json || []);
                }
                return true;
            }
            return false;
        } catch (e) {
            // no-op
            return false;
        }
    };

    return { data, loading, error, claimReward };
}
