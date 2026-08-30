import React from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchApi } from '@/lib/apiBase';

export interface MapPreviewLocation {
  id?: string;
  lat: number;
  lng: number;
}

interface LocationMapPreviewProps {
  locations?: MapPreviewLocation[];
  query?: string;
  isDark?: boolean;
  accent?: string;
  className?: string;
}

const FitLocations: React.FC<{ locations: MapPreviewLocation[] }> = ({ locations }) => {
  const map = useMap();
  React.useEffect(() => {
    if (!locations.length) return;
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 13, { animate: false });
      return;
    }
    map.fitBounds(L.latLngBounds(locations.map(({ lat, lng }) => [lat, lng])), { padding: [24, 24], maxZoom: 13, animate: false });
  }, [locations, map]);
  return null;
};

const LocationMapPreview: React.FC<LocationMapPreviewProps> = ({ locations = [], query, isDark = false, accent = '#f31a7c', className }) => {
  const [queryLocation, setQueryLocation] = React.useState<MapPreviewLocation | null>(null);

  React.useEffect(() => {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery || locations.length) {
      setQueryLocation(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchApi(`/api/geocode/search?q=${encodeURIComponent(`${normalizedQuery}, Brasil`)}`);
        const data = response.ok ? await response.json() : [];
        const lat = Number(data?.[0]?.lat);
        const lng = Number(data?.[0]?.lon);
        if (!cancelled) setQueryLocation(Number.isFinite(lat) && Number.isFinite(lng) ? { id: normalizedQuery, lat, lng } : null);
      } catch {
        if (!cancelled) setQueryLocation(null);
      }
    }, 450);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [locations.length, query]);

  const validLocations = [...locations, ...(queryLocation ? [queryLocation] : [])].filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng));
  const center: [number, number] = validLocations.length ? [validLocations[0].lat, validLocations[0].lng] : [-14.235, -51.9253];

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={validLocations.length ? 13 : 4}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        style={{ width: '100%', height: '100%', background: isDark ? '#171717' : '#e9ecef' }}
      >
        <TileLayer url={isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'} />
        <FitLocations locations={validLocations} />
        {validLocations.map((location, index) => (
          <CircleMarker
            key={location.id || `${location.lat}-${location.lng}-${index}`}
            center={[location.lat, location.lng]}
            radius={6}
            pathOptions={{ color: '#fff', weight: 2, fillColor: accent, fillOpacity: 1 }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default LocationMapPreview;
