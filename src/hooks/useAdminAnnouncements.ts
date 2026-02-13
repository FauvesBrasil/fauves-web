import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiBase';

export interface AnnouncementAdmin {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    category: 'feature' | 'update' | 'news' | 'tip';
    target: string;
    link?: string;
    linkText?: string;
    active: boolean;
    startDate?: string;
    endDate?: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface AnnouncementFilters {
    category?: string;
    target?: string;
    active?: boolean;
}

export const useAdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<AnnouncementAdmin[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnnouncements = async (filters?: AnnouncementFilters) => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filters?.category) params.append('category', filters.category);
            if (filters?.target) params.append('target', filters.target);
            if (filters?.active !== undefined) params.append('active', String(filters.active));

            const response = await fetchApi(`/api/admin/announcements?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
            } else {
                if (response.status === 403) {
                    throw new Error('Acesso negado. Você precisa ser admin para acessar esta página.');
                } else if (response.status === 401) {
                    throw new Error('Não autenticado. Faça login como administrador.');
                }
                throw new Error(`Erro ao carregar anúncios: ${response.status}`);
            }
        } catch (err: any) {
            console.error('Error fetching announcements:', err);
            setError(err.message || 'Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const createAnnouncement = async (data: Partial<AnnouncementAdmin>) => {
        try {
            setError(null);
            const response = await fetchApi('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const created = await response.json();
                setAnnouncements(prev => [...prev, created]);
                return created;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create announcement');
            }
        } catch (err: any) {
            console.error('Error creating announcement:', err);
            setError(err.message || 'Failed to create announcement');
            throw err;
        }
    };

    const updateAnnouncement = async (id: string, data: Partial<AnnouncementAdmin>) => {
        try {
            setError(null);
            const response = await fetchApi(`/api/admin/announcements/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updated = await response.json();
                setAnnouncements(prev => prev.map(a => a.id === id ? updated : a));
                return updated;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update announcement');
            }
        } catch (err: any) {
            console.error('Error updating announcement:', err);
            setError(err.message || 'Failed to update announcement');
            throw err;
        }
    };

    const deleteAnnouncement = async (id: string) => {
        try {
            setError(null);
            const response = await fetchApi(`/api/admin/announcements/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAnnouncements(prev => prev.filter(a => a.id !== id));
                return true;
            } else {
                throw new Error('Failed to delete announcement');
            }
        } catch (err: any) {
            console.error('Error deleting announcement:', err);
            setError(err.message || 'Failed to delete announcement');
            throw err;
        }
    };

    const toggleActive = async (id: string) => {
        try {
            setError(null);
            const response = await fetchApi(`/api/admin/announcements/${id}/toggle`, {
                method: 'PATCH',
            });

            if (response.ok) {
                const updated = await response.json();
                setAnnouncements(prev => prev.map(a => a.id === id ? updated : a));
                return updated;
            } else {
                throw new Error('Failed to toggle announcement');
            }
        } catch (err: any) {
            console.error('Error toggling announcement:', err);
            setError(err.message || 'Failed to toggle announcement');
            throw err;
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    return {
        announcements,
        loading,
        error,
        fetchAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        toggleActive,
    };
};
