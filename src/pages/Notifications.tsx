import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import HeaderV2 from '@/components/v2/HeaderV2';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';

interface Notification {
    id: string;
    title: string;
    message: string;
    link?: string;
    imageUrl?: string;
    type?: string;
    isRead: boolean;
    createdAt: string;
}

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { user, token, loading: authLoading } = useAuth();
    const { isDark } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetchApi('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Não foi possível carregar suas notificações.');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch {
            setError('Não foi possível carregar suas notificações.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authLoading) return;
        if (!user?.id || !token) {
            navigate('/signin?redirect=%2Fnotifications', { replace: true });
            return;
        }
        void loadNotifications();
    }, [authLoading, user?.id, token, navigate, loadNotifications]);

    const markAsRead = async (notifId: string) => {
        try {
            if (!token) return;

            await fetchApi(`/api/notifications/${notifId}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
        } catch (e) {
            // no-op
        }
    };

    const markAllAsRead = async () => {
        try {
            if (!token) return;

            await fetchApi('/api/notifications/read-all', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {
            // no-op
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins} min.`;
        if (diffHours < 24) return `${diffHours} h`;
        if (diffDays < 7) return `${diffDays} d`;

        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className={`notifications-page ${isDark ? 'is-dark' : 'is-light'}`}>
            <HeaderV2 transparent scrollTransition={false} theme={isDark ? 'dark' : 'light'} />

            <main className="notifications-main" data-header-align>
                <div className="notifications-title-row">
                    <div>
                        <h1>Notificações</h1>
                        {unreadCount > 0 && <p>{unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}</p>}
                    </div>
                    {unreadCount > 0 && <button type="button" onClick={markAllAsRead}>Marcar todas como lidas</button>}
                </div>

                <section className="notifications-card" aria-live="polite">
                        {authLoading || loading ? (
                            <div className="notifications-state">
                                Carregando notificações...
                            </div>
                        ) : error ? (
                            <div className="notifications-state">
                                <p className="notifications-error" role="alert">{error}</p>
                                <button type="button" onClick={() => void loadNotifications()}>Tentar novamente</button>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notifications-state notifications-empty">
                                <svg
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
                                <strong>Está silencioso aqui</strong>
                                <span>Suas notificações aparecerão aqui.</span>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    type="button"
                                    key={notification.id}
                                    className={`notification-row ${!notification.isRead ? 'is-unread' : ''}`}
                                    onClick={() => {
                                        if (!notification.isRead) markAsRead(notification.id);
                                        if (notification.link) navigate(notification.link);
                                    }}
                                >
                                    <span className="notification-avatar" aria-hidden="true">
                                        {user?.photoUrl ? <img src={resolveImageUrl(user.photoUrl)} alt="" /> : (user?.name?.[0] || 'F')}
                                        {!notification.isRead && <i />}
                                    </span>
                                    <span className="notification-copy">
                                        <span className="notification-headline">
                                            <strong>{notification.title}</strong>
                                            <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                                        </span>
                                        {notification.message && <span className="notification-message">{notification.message}</span>}
                                    </span>
                                    {notification.imageUrl ? (
                                        <img className="notification-image" src={resolveImageUrl(notification.imageUrl)} alt="" />
                                    ) : notification.link ? (
                                        <svg className="notification-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    ) : null}
                                </button>
                            ))
                        )}
                </section>
            </main>

            <style>{`
                .notifications-page {
                    min-height: 100dvh;
                    width: 100%;
                    overflow-x: hidden;
                    color: #131517;
                    background: #f7f8f9;
                }
                .notifications-page.is-dark {
                    color: #fff;
                    background: #131517;
                }
                .notifications-main {
                    width: min(100% - 32px, 760px);
                    margin: 0 auto;
                    padding: 92px 0 56px;
                }
                .notifications-title-row {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 28px;
                }
                .notifications-title-row h1 {
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: -.03em;
                }
                .notifications-title-row p {
                    margin: 5px 0 0;
                    color: rgba(19,21,23,.46);
                    font-size: 13px;
                }
                .notifications-page.is-dark .notifications-title-row p { color: rgba(255,255,255,.45); }
                .notifications-title-row button,
                .notifications-state button {
                    min-height: 38px;
                    padding: 0 12px;
                    border: 0;
                    border-radius: 9px;
                    background: rgba(128,128,128,.12);
                    color: inherit;
                    font: inherit;
                    font-size: 13px;
                    font-weight: 650;
                    cursor: pointer;
                }
                .notifications-card {
                    display: block;
                    overflow: hidden;
                    border: 1px solid rgba(19,21,23,.10);
                    border-radius: 15px;
                    background: rgba(255,255,255,.72);
                }
                .notifications-page.is-dark .notifications-card {
                    border-color: rgba(255,255,255,.10);
                    background: rgba(255,255,255,.045);
                }
                .notification-row {
                    display: grid;
                    width: 100%;
                    grid-template-columns: 44px minmax(0,1fr) auto;
                    align-items: start;
                    gap: 14px;
                    min-height: 88px;
                    padding: 18px 20px;
                    border: 0;
                    border-bottom: 1px solid rgba(19,21,23,.09);
                    background: transparent;
                    color: inherit;
                    font: inherit;
                    text-align: left;
                    cursor: pointer;
                    transition: background .16s ease;
                }
                .notification-row:last-child { border-bottom: 0; }
                .notifications-page.is-dark .notification-row { border-bottom-color: rgba(255,255,255,.08); }
                .notification-row:hover,
                .notification-row.is-unread { background: rgba(123,73,255,.055); }
                .notification-avatar {
                    position: relative;
                    display: grid;
                    width: 44px;
                    height: 44px;
                    overflow: visible;
                    place-items: center;
                    border-radius: 50%;
                    background: linear-gradient(145deg,#ff9aae,#ed4167);
                    color: #fff;
                    font-size: 16px;
                    font-weight: 700;
                }
                .notification-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
                .notification-avatar i {
                    position: absolute;
                    right: -2px;
                    bottom: -1px;
                    width: 12px;
                    height: 12px;
                    border: 2px solid #fff;
                    border-radius: 50%;
                    background: #34c759;
                }
                .notifications-page.is-dark .notification-avatar i { border-color: #202123; }
                .notification-copy { display: flex; min-width: 0; flex-direction: column; }
                .notification-headline { font-size: 16px; line-height: 1.42; }
                .notification-headline strong { font-weight: 570; }
                .notification-headline time { margin-left: 5px; color: rgba(19,21,23,.42); white-space: nowrap; }
                .notifications-page.is-dark .notification-headline time { color: rgba(255,255,255,.42); }
                .notification-message {
                    display: -webkit-box;
                    margin-top: 5px;
                    overflow: hidden;
                    color: rgba(19,21,23,.64);
                    font-size: 14px;
                    line-height: 1.45;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 3;
                }
                .notifications-page.is-dark .notification-message { color: rgba(255,255,255,.66); }
                .notification-image {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                }
                .notification-chevron { width: 18px; height: 18px; margin-top: 13px; opacity: .32; }
                .notifications-state {
                    display: flex;
                    min-height: 280px;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    padding: 40px 24px;
                    color: rgba(19,21,23,.48);
                    text-align: center;
                }
                .notifications-page.is-dark .notifications-state { color: rgba(255,255,255,.48); }
                .notifications-empty svg { width: 44px; height: 44px; margin-bottom: 14px; }
                .notifications-empty strong { color: inherit; font-size: 17px; }
                .notifications-empty span { margin-top: 5px; font-size: 14px; }
                .notifications-error { color: #e5484d; }
                .notifications-state button { margin-top: 14px; }

                @media (max-width: 820px) {
                    .notifications-page {
                        background-image: radial-gradient(540px 230px at 48% 0, rgba(106,48,117,.20), transparent 70%);
                    }
                    .notifications-main {
                        width: 100%;
                        padding: var(--page-top-spacing-mobile) 16px 48px;
                    }
                    .notifications-title-row {
                        align-items: center;
                        margin-bottom: 28px;
                    }
                    .notifications-title-row h1 { font-size: 29px; }
                    .notifications-title-row button {
                        max-width: 98px;
                        padding: 0 8px;
                        font-size: 11px;
                        line-height: 1.15;
                    }
                    .notifications-card { border-radius: 13px; }
                    .notification-row {
                        grid-template-columns: 42px minmax(0,1fr) auto;
                        gap: 12px;
                        min-height: 84px;
                        padding: 16px 14px;
                    }
                    .notification-avatar { width: 42px; height: 42px; }
                    .notification-headline { font-size: 15px; line-height: 1.42; }
                    .notification-message { font-size: 13px; -webkit-line-clamp: 4; }
                    .notification-image { width: 44px; height: 44px; }
                }
            `}</style>
        </div>
    );
};

export default Notifications;
