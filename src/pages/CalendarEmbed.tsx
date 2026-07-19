import React from 'react';
import { Loader2 } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchApi } from '@/lib/apiBase';
import { getEventPath } from '@/lib/eventUrl';
import {
  CalendarEmbedLayout,
  CalendarEmbedPreview,
  CalendarEmbedTag,
  CalendarEmbedTheme,
} from '@/components/v2/CalendarEmbedPreview';

export default function CalendarEmbed() {
  const { calendarId = '' } = useParams<{ calendarId: string }>();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = React.useState<any[]>([]);
  const [tags, setTags] = React.useState<CalendarEmbedTag[]>([]);
  const [organization, setOrganization] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const cleanCalendarId = calendarId.replace(/^cal-/, '');
  const requestedTheme = searchParams.get('theme');
  const requestedLayout = searchParams.get('layout');
  const theme: CalendarEmbedTheme = requestedTheme === 'light' || requestedTheme === 'dark' ? requestedTheme : 'system';
  const layout: CalendarEmbedLayout = requestedLayout === 'list' ? 'list' : 'cards';
  const selectedTagId = searchParams.get('tag') || 'all';

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchApi(`/api/organization/${cleanCalendarId}`),
      fetchApi(`/api/events/public/by-organization?orgId=${encodeURIComponent(cleanCalendarId)}`),
      fetchApi(`/api/organization/${cleanCalendarId}/tags/public`),
    ])
      .then(async ([organizationResponse, eventsResponse, tagsResponse]) => {
        const [organizationData, eventsData, tagsData] = await Promise.all([
          organizationResponse.ok ? organizationResponse.json() : null,
          eventsResponse.ok ? eventsResponse.json() : [],
          tagsResponse.ok ? tagsResponse.json() : [],
        ]);
        if (!active) return;
        setOrganization(organizationData);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [cleanCalendarId]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#202224] text-zinc-400"><Loader2 className="animate-spin" size={28} /></div>;
  }

  return (
    <main className="min-h-screen bg-transparent p-0">
      <CalendarEmbedPreview
        events={events}
        tags={tags}
        selectedTagId={selectedTagId}
        theme={theme}
        layout={layout}
        organizationName={organization?.name || 'Organizador'}
        organizationLogoUrl={organization?.logoUrl || organization?.image || organization?.avatarUrl}
        minHeight={450}
        onEventAction={(event) => window.open(getEventPath(event), '_blank', 'noopener,noreferrer')}
      />
    </main>
  );
}

