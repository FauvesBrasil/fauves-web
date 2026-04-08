import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';

export interface Announcement {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    category: 'feature' | 'update' | 'news' | 'tip';
    target: string;
    link?: string;
    linkText?: string;
}

export const useAnnouncements = (target: 'organizer' | 'customer' = 'organizer') => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnnouncements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await fetchApi(`/api/announcements?target=${target}&active=true`);
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
                setError(null);
            } else {
                throw new Error('Failed to fetch announcements');
            }
        } catch (err) {
            setError('Failed to load announcements');
            // Fallback to empty array on error
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    return { announcements, loading, error };
};
