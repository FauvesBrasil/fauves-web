import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';

interface Notification {
    id: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                if (!token) {
                    setLoading(false);
                    return;
                }

                const res = await fetch('/api/notifications', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                }
            } catch (e) {
                console.error('Failed to load notifications:', e);
            } finally {
                setLoading(false);
            }
        };

        if (!user?.id) {
            setLoading(false);
            return;
        }

        loadNotifications();
    }, [user?.id, token]);

    const markAsRead = async (notifId: string) => {
        try {
            if (!token) return;

            await fetch(`/api/notifications/${notifId}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
        } catch (e) {
            console.error('Failed to mark as read:', e);
        }
    };

    const markAllAsRead = async () => {
        try {
            if (!token) return;

            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

            await Promise.all(
                unreadIds.map(id =>
                    fetch(`/api/notifications/${id}/read`, {
                        method: 'PUT',
                        headers: { Authorization: `Bearer ${token}` },
                    })
                )
            );

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {
            console.error('Failed to mark all as read:', e);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;

        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0b0b0b]">
            <Header />

            <div className="pt-20 pb-10 px-4 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2a2a]">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                                </p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                Carregando notificações...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.435L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                                    />
                                </svg>
                                <p className="mt-4 text-gray-500 dark:text-gray-400">Nenhuma notificação</p>
                                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                    Suas notificações aparecerão aqui
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-6 py-4 cursor-pointer transition-colors ${!notification.isRead
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-[#222]'
                                        }`}
                                    onClick={() => {
                                        if (!notification.isRead) markAsRead(notification.id);
                                        if (notification.link) navigate(notification.link);
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {!notification.isRead && (
                                                    <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
                                                )}
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {notification.title}
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                                {notification.message}
                                            </p>
                                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                        {notification.link && (
                                            <svg
                                                className="ml-4 h-5 w-5 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
