const CARTO_API_KEY = String(import.meta.env.VITE_CARTO_API_KEY || '').trim();

export type CartoBasemapTheme = 'dark' | 'light' | 'voyager';

export const buildCartoBasemapUrl = (
  theme: CartoBasemapTheme,
  apiKey = CARTO_API_KEY,
) => {
  const style = theme === 'dark' ? 'dark_all' : theme === 'light' ? 'light_all' : 'voyager';
  const baseUrl = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
  const normalizedKey = apiKey.trim();

  return normalizedKey ? `${baseUrl}?key=${encodeURIComponent(normalizedKey)}` : baseUrl;
};

export const cartoBasemapUrl = (isDark: boolean) => buildCartoBasemapUrl(isDark ? 'dark' : 'light');

