import React from 'react';
import { TileLayer } from 'react-leaflet';
import { fetchApi } from '@/lib/apiBase';
import { buildCartoBasemapUrl } from '@/lib/cartoBasemap';

const buildTimeApiKey = String(import.meta.env.VITE_CARTO_API_KEY || '').trim();
let runtimeApiKey: string | null | undefined;
let runtimeApiKeyRequest: Promise<string | null> | null = null;

const loadRuntimeApiKey = async () => {
  if (runtimeApiKey !== undefined) return runtimeApiKey;
  if (runtimeApiKeyRequest) return runtimeApiKeyRequest;

  runtimeApiKeyRequest = fetchApi('/api/public-config/map')
    .then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json();
      const key = String(data?.cartoApiKey || '').trim();
      return key || null;
    })
    .catch(() => null)
    .then((key) => {
      runtimeApiKey = key;
      return key;
    });

  return runtimeApiKeyRequest;
};

interface CartoTileLayerProps {
  isDark: boolean;
}

const CartoTileLayer: React.FC<CartoTileLayerProps> = ({ isDark }) => {
  const [apiKey, setApiKey] = React.useState<string | null | undefined>(buildTimeApiKey || runtimeApiKey);

  React.useEffect(() => {
    if (buildTimeApiKey || apiKey !== undefined) return;
    let active = true;
    void loadRuntimeApiKey().then((key) => {
      if (active) setApiKey(key);
    });
    return () => { active = false; };
  }, [apiKey]);

  // Waiting for runtime configuration prevents CARTO from caching unkeyed,
  // watermarked tiles before the backend-provided public key is available.
  if (apiKey === undefined) return null;
  if (!apiKey) return <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />;

  return <TileLayer url={buildCartoBasemapUrl(isDark ? 'dark' : 'light', apiKey)} />;
};

export default CartoTileLayer;
