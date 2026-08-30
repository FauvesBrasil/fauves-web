import { fetchApi } from './apiBase';

const GENERIC_LOCATION_VALUES = new Set([
  'local',
  'evento online',
  'local será anunciado',
  'local será anunciado em breve',
]);

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export const resolveEventAddress = (event: any): string => {
  const structuredAddress = clean(event?.locationAddress || event?.locationDetails?.address);
  if (structuredAddress) return structuredAddress;

  const legacyLocation = clean(event?.location);
  if (legacyLocation && !GENERIC_LOCATION_VALUES.has(legacyLocation.toLowerCase())) return legacyLocation;

  const venue = clean(event?.locationName || event?.venue);
  const city = clean(event?.locationCity || event?.locationDetails?.city || event?.city);
  const uf = clean(event?.locationUf || event?.locationDetails?.uf || event?.uf);
  return [venue, city, uf].filter(Boolean).join(', ');
};

export const resolveEventLocationLabel = (event: any): string => {
  const venue = clean(event?.locationName || event?.venue);
  const city = clean(event?.locationCity || event?.locationDetails?.city || event?.city);
  const uf = clean(event?.locationUf || event?.locationDetails?.uf || event?.uf);
  if (venue && city) return `${venue}, ${city}${uf ? ` - ${uf}` : ''}`;
  return resolveEventAddress(event) || [city, uf].filter(Boolean).join(' - ') || 'Local a definir';
};

export const resolveEventCoordinates = (event: any) => {
  const latitude = Number(event?.locationLatitude ?? event?.latitude ?? event?.lat ?? event?.locationDetails?.latitude ?? event?.locationDetails?.lat);
  const longitude = Number(event?.locationLongitude ?? event?.longitude ?? event?.lng ?? event?.locationDetails?.longitude ?? event?.locationDetails?.lng);
  return {
    lat: Number.isFinite(latitude) && latitude !== 0 ? latitude : null,
    lng: Number.isFinite(longitude) && longitude !== 0 ? longitude : null,
  };
};

export const geocodeEventAddress = async (event: any): Promise<{ lat: number; lng: number } | null> => {
  const address = resolveEventAddress(event);
  if (!address) return null;
  const city = clean(event?.locationCity || event?.locationDetails?.city || event?.city);
  const uf = clean(event?.locationUf || event?.locationDetails?.uf || event?.uf);
  const query = Array.from(new Set([address, city, uf, 'Brasil'].filter(Boolean))).join(', ');
  const response = await fetchApi(`/api/geocode/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return null;
  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  const lat = Number(first?.lat);
  const lng = Number(first?.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};
