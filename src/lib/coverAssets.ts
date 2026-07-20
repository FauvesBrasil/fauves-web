// Single source of truth for bundled preset covers. The database stores the
// original /src path, while Vite emits a hashed public URL for production.
export const coverAssetUrls = import.meta.glob('/src/assets/covers/**/*.avif', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export function resolveBundledCoverUrl(sourcePath: string): string | null {
  return coverAssetUrls[sourcePath] || null;
}
