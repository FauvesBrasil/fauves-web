import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'event' | 'profile';
  keywords?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any>;
  locale?: string;
}

const BASE_SITE_NAME = 'Fauves';
const BASE_URL = 'https://fauves.com.br';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'Descubra os melhores eventos de música, cultura e entretenimento do Brasil. Compre ingressos e acompanhe suas bandas favoritas na Fauves.';
const DEFAULT_KEYWORDS = 'eventos, ingressos, shows, música, festas, baladas, Brasil, Fauves';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data: Record<string, any>) {
  const existing = document.querySelector('script[data-seo="json-ld"]');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo', 'json-ld');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  keywords = DEFAULT_KEYWORDS,
  noIndex = false,
  jsonLd,
  locale = 'pt_BR',
}: SEOProps = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} — ${BASE_SITE_NAME}` : `${BASE_SITE_NAME} · Descubra Eventos`;
    const pageUrl = url ? `${BASE_URL}${url}` : window.location.href;
    const pageImage = image || DEFAULT_IMAGE;
    const pageDescription = description || DEFAULT_DESCRIPTION;

    // Document Title
    document.title = pageTitle;

    // Basic Meta
    setMeta('description', pageDescription);
    setMeta('keywords', keywords);
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('author', 'Fauves');
    setMeta('language', 'Portuguese');

    // Open Graph
    setMeta('og:title', pageTitle, 'property');
    setMeta('og:description', pageDescription, 'property');
    setMeta('og:image', pageImage, 'property');
    setMeta('og:url', pageUrl, 'property');
    setMeta('og:type', type, 'property');
    setMeta('og:site_name', BASE_SITE_NAME, 'property');
    setMeta('og:locale', locale, 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', pageTitle);
    setMeta('twitter:description', pageDescription);
    setMeta('twitter:image', pageImage);
    setMeta('twitter:site', '@fauvesbrasil');

    // Canonical URL
    setLink('canonical', pageUrl);

    // JSON-LD
    if (jsonLd) {
      setJsonLd(jsonLd);
    }

    return () => {
      // Cleanup JSON-LD on unmount to avoid stale data on navigation
      if (jsonLd) {
        const el = document.querySelector('script[data-seo="json-ld"]');
        if (el) el.remove();
      }
    };
  }, [title, description, image, url, type, keywords, noIndex, jsonLd, locale]);
}

// Helper to build Event JSON-LD schema
export function buildEventJsonLd(event: {
  name: string;
  description?: string;
  image?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  locationCity?: string;
  locationUf?: string;
  slug?: string;
  id: string;
  priceFrom?: number;
  organization?: { name: string; slug?: string };
  artists?: Array<{ id?: string; name: string; imageUrl?: string; }>;
  createdAt?: string;
}) {
  const eventUrl = `${BASE_URL}/event/${event.slug || event.id}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || `${event.name} na Fauves. Garanta seu ingresso!`,
    image: event.image,
    startDate: event.startDate,
    endDate: event.endDate || event.startDate,
    url: eventUrl,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: event.location ? {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.locationCity || '',
        addressRegion: event.locationUf || '',
        addressCountry: 'BR',
      },
    } : {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.locationCity || '',
        addressRegion: event.locationUf || '',
        addressCountry: 'BR',
      },
    },
    organizer: event.organization ? {
      '@type': 'Organization',
      name: event.organization.name,
      url: event.organization.slug ? `${BASE_URL}/org/${event.organization.slug}` : undefined,
    } : undefined,
    performer: (event.artists && event.artists.length > 0) ? event.artists.map(a => ({
      '@type': 'Person',
      name: a.name,
      image: a.imageUrl,
    })) : undefined,
    offers: (event.priceFrom !== undefined && event.priceFrom !== null) ? {
      '@type': 'Offer',
      price: Number(event.priceFrom) || 0,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: eventUrl,
      validFrom: event.createdAt || new Date().toISOString(),
    } : undefined,
  };
}

// Helper to build Organization JSON-LD schema
export function buildOrganizationJsonLd(org: {
  name: string;
  description?: string;
  logoUrl?: string;
  site?: string;
  slug?: string;
  id: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    description: org.description,
    logo: org.logoUrl,
    url: org.site || `${BASE_URL}/org/${org.slug || org.id}`,
    sameAs: org.site ? [org.site] : [],
  };
}

// Home / WebSite JSON-LD
export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Fauves',
  url: BASE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};
