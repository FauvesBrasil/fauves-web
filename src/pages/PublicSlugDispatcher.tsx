import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiUrl } from '@/lib/apiBase';
import EventPageV2 from './EventPageV2';
import OrganizationPublicProfile from './OrganizationPublicProfile';
import WhatToDoCity from './WhatToDoCity';
import NotFound from './NotFound';
import HeaderV2 from '@/components/v2/HeaderV2';
import { useTheme } from '@/context/ThemeContext';

const toSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const PublicSlugDispatcher: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [loading, setLoading] = useState(true);
  const [resolvedType, setResolvedType] = useState<'event' | 'org' | 'city' | 'notfound'>('notfound');

  useEffect(() => {
    if (!slugOrId) {
      setResolvedType('notfound');
      setLoading(false);
      return;
    }

    const checkSlug = async () => {
      setLoading(true);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

      const eventEndpoint = isUUID
        ? apiUrl(`/api/event/${slugOrId}`)
        : apiUrl(`/api/event/slug/${slugOrId}`);

      const orgEndpoint = isUUID
        ? apiUrl(`/api/organization/${slugOrId}`)
        : apiUrl(`/api/organization/slug/${slugOrId}`);

      try {
        // Try fetching the event
        const eventRes = await fetch(eventEndpoint);
        if (eventRes.ok) {
          setResolvedType('event');
          setLoading(false);
          return;
        }

        // Fallback for event ID lookup if slug failed and not UUID
        if (!isUUID) {
          const eventIdRes = await fetch(apiUrl(`/api/event/${slugOrId}`));
          if (eventIdRes.ok) {
            setResolvedType('event');
            setLoading(false);
            return;
          }
        }

        // Try fetching the organization
        const orgRes = await fetch(orgEndpoint);
        if (orgRes.ok) {
          setResolvedType('org');
          setLoading(false);
          return;
        }

        // Fallback for org ID lookup if slug failed and not UUID
        if (!isUUID) {
          const orgIdRes = await fetch(apiUrl(`/api/organization/${slugOrId}`));
          if (orgIdRes.ok) {
            setResolvedType('org');
            setLoading(false);
            return;
          }
        }

        // Cidades usam a URL curta /{cidade}. Só reconhecemos cidades que
        // realmente aparecem nos eventos para não transformar qualquer slug
        // desconhecido em uma página de localização vazia.
        if (!isUUID) {
          const eventsRes = await fetch(apiUrl('/api/events?limit=200'));
          if (eventsRes.ok) {
            const data = await eventsRes.json();
            const events = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : [];
            const isCity = events.some((event: { locationCity?: string | null }) =>
              event.locationCity && toSlug(event.locationCity) === slugOrId.toLowerCase()
            );

            if (isCity) {
              setResolvedType('city');
              setLoading(false);
              return;
            }
          }
        }

        setResolvedType('notfound');
      } catch (err) {
        console.error('Error resolving slug:', err);
        setResolvedType('notfound');
      } finally {
        setLoading(false);
      }
    };

    checkSlug();
  }, [slugOrId]);

  const { isDark } = useTheme();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDark ? '#121416' : '#f7f8f9',
        color: isDark ? '#f5f5f5' : '#1c1e21',
        fontFamily: 'Inter, sans-serif'
      }}>
        <HeaderV2 transparent={true} theme={isDark ? 'dark' : 'light'} />
        <div style={{ height: '70px' }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer { 0%, 100% { opacity: .45 } 50% { opacity: .85 } }
          .skeleton-pulse { animation: shimmer 1.5s infinite ease-in-out; background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}; border-radius: 8px; }
        ` }} />
        <div style={{ maxWidth: '928px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cover skeleton */}
          <div className="skeleton-pulse" style={{ width: '100%', height: '240px', borderRadius: '16px' }} />
          {/* Title skeleton */}
          <div className="skeleton-pulse" style={{ height: '32px', width: '60%' }} />
          {/* Subtitle skeleton */}
          <div className="skeleton-pulse" style={{ height: '18px', width: '35%', marginBottom: '1rem' }} />
          {/* Content lines */}
          <div className="skeleton-pulse" style={{ height: '14px', width: '100%' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '90%' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '95%' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '70%' }} />
        </div>
      </div>
    );
  }

  if (resolvedType === 'event') {
    return <EventPageV2 />;
  }

  if (resolvedType === 'org') {
    return <OrganizationPublicProfile />;
  }

  if (resolvedType === 'city') {
    return <WhatToDoCity />;
  }

  return <NotFound />;
};

export default PublicSlugDispatcher;
