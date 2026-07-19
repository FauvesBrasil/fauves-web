import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiUrl } from '@/lib/apiBase';
import EventPageV2 from './EventPageV2';
import OrganizationPublicProfile from './OrganizationPublicProfile';
import WhatToDoCity from './WhatToDoCity';
import NotFound from './NotFound';

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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#030c1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#ffffff',
          animation: 'spin 1s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        ` }} />
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
