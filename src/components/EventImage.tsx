import * as React from 'react';
import { resolveEventImageCandidates, resolveImageUrl } from '@/lib/apiBase';

type EventImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  event: any;
  fallbackSrc?: string | null;
};

/**
 * Imagem de evento com normalização e fallback entre os campos legados.
 * Se uma URL existir no payload, mas responder com erro, tenta a próxima antes
 * de exibir a imagem neutra da plataforma.
 */
export default function EventImage({
  event,
  fallbackSrc = '/fallback-event-banner.svg',
  onError,
  ...imageProps
}: EventImageProps) {
  const sources = resolveEventImageCandidates(event);
  const resolvedFallback = resolveImageUrl(fallbackSrc);
  if (resolvedFallback && !sources.includes(resolvedFallback)) sources.push(resolvedFallback);

  const signature = sources.join('|');
  const [sourceIndex, setSourceIndex] = React.useState(0);

  React.useEffect(() => {
    setSourceIndex(0);
  }, [signature]);

  const source = sources[Math.min(sourceIndex, Math.max(0, sources.length - 1))] || undefined;

  return (
    <img
      {...imageProps}
      src={source}
      onError={(event) => {
        onError?.(event);
        setSourceIndex(current => current < sources.length - 1 ? current + 1 : current);
      }}
    />
  );
}
